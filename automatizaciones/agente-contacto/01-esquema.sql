-- Agente de primera toma de contacto (n8n + Claude).
-- Ejecutar una vez en el editor SQL de Supabase (mismo proyecto que `contacts`).
--
-- Todo el acceso pasa por funciones que solo puede ejecutar `service_role`
-- (la clave que usa n8n). Las tablas tienen RLS activado y sin políticas:
-- la clave pública (anon) no puede leerlas ni escribirlas.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.leads (
	id uuid primary key default gen_random_uuid(),
	-- Etiqueta corta que va en el asunto: [OrPiRa #a1b2c3]
	tag text not null unique,
	name text not null,
	email text not null,
	-- new → awaiting_approval → waiting_reply → … → qualified | discarded | closed
	status text not null default 'new'
		check (status in ('new', 'awaiting_approval', 'waiting_reply', 'qualified', 'discarded', 'closed')),
	-- Respuestas del agente ya enviadas al contacto.
	agent_turns integer not null default 0,
	-- Resumen final para Orlando (lo rellena el agente al cerrar).
	brief jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.lead_messages (
	id uuid primary key default gen_random_uuid(),
	lead_id uuid not null references public.leads (id) on delete cascade,
	direction text not null check (direction in ('in', 'out')),
	subject text,
	body text not null,
	-- in: received · out: draft → approved → sent | discarded
	status text not null
		check (status in ('received', 'draft', 'approved', 'sent', 'discarded')),
	-- Solo en borradores: enlace de un solo uso para revisarlo.
	approval_token text unique,
	-- El borrador cierra la conversación (último mensaje del agente).
	is_final boolean not null default false,
	created_at timestamptz not null default now(),
	decided_at timestamptz
);

create index if not exists lead_messages_lead_idx on public.lead_messages (lead_id, created_at);
create index if not exists leads_email_idx on public.leads (lower(email));

alter table public.leads enable row level security;
alter table public.lead_messages enable row level security;

-- ---------------------------------------------------------------------------
-- Funciones (llamadas desde n8n por /rest/v1/rpc/<nombre>)
-- ---------------------------------------------------------------------------

-- 1. Nuevo contacto desde el formulario.
create or replace function public.lead_crear(p_name text, p_email text, p_message text)
returns json
language plpgsql
as $$
declare
	v_lead public.leads;
begin
	insert into public.leads (tag, name, email)
	values (substr(encode(gen_random_bytes(4), 'hex'), 1, 6), trim(p_name), lower(trim(p_email)))
	returning * into v_lead;

	insert into public.lead_messages (lead_id, direction, subject, body, status)
	values (v_lead.id, 'in', 'Formulario de orpira.es', p_message, 'received');

	return json_build_object('lead_id', v_lead.id, 'tag', v_lead.tag, 'name', v_lead.name, 'email', v_lead.email);
end;
$$;

-- 2. Respuesta del contacto por email. Solo se acepta si la etiqueta y el
--    remitente coinciden con un lead que está esperando su respuesta.
create or replace function public.lead_registrar_respuesta(p_tag text, p_email text, p_subject text, p_body text)
returns json
language plpgsql
as $$
declare
	v_lead public.leads;
begin
	select * into v_lead
	from public.leads
	where tag = lower(p_tag)
		and lower(email) = lower(trim(p_email))
		and status = 'waiting_reply'
	for update;

	if not found then
		return json_build_object('found', false);
	end if;

	insert into public.lead_messages (lead_id, direction, subject, body, status)
	values (v_lead.id, 'in', p_subject, p_body, 'received');

	update public.leads set status = 'new', updated_at = now() where id = v_lead.id;

	return json_build_object('found', true, 'lead_id', v_lead.id, 'tag', v_lead.tag, 'name', v_lead.name, 'email', v_lead.email);
end;
$$;

-- 3. Conversación completa para que el agente redacte.
create or replace function public.lead_historial(p_lead_id uuid)
returns json
language sql
stable
as $$
	select json_build_object(
		'lead_id', l.id,
		'tag', l.tag,
		'name', l.name,
		'email', l.email,
		'agent_turns', l.agent_turns,
		'messages', coalesce((
			select json_agg(json_build_object('direction', m.direction, 'body', m.body, 'at', m.created_at) order by m.created_at)
			from public.lead_messages m
			where m.lead_id = l.id and m.status in ('received', 'sent')
		), '[]'::json)
	)
	from public.leads l
	where l.id = p_lead_id;
$$;

-- 4. Guardar el borrador del agente y devolver el token de revisión.
--    p_accion: 'preguntar' | 'cerrar' | 'descartar'
create or replace function public.lead_guardar_borrador(
	p_lead_id uuid,
	p_accion text,
	p_subject text,
	p_body text,
	p_brief jsonb
)
returns json
language plpgsql
as $$
declare
	v_token text := encode(gen_random_bytes(24), 'hex');
begin
	-- Un borrador pendiente anterior queda sustituido por el nuevo.
	update public.lead_messages
	set status = 'discarded', decided_at = now(), approval_token = null
	where lead_id = p_lead_id and status = 'draft';

	if p_accion = 'descartar' then
		update public.leads set status = 'discarded', brief = p_brief, updated_at = now() where id = p_lead_id;
		return json_build_object('token', null);
	end if;

	insert into public.lead_messages (lead_id, direction, subject, body, status, approval_token, is_final)
	values (p_lead_id, 'out', p_subject, p_body, 'draft', v_token, p_accion = 'cerrar');

	update public.leads
	set status = 'awaiting_approval',
		brief = coalesce(p_brief, brief),
		updated_at = now()
	where id = p_lead_id;

	return json_build_object('token', v_token);
end;
$$;

-- 5. Ver un borrador pendiente (página de revisión).
create or replace function public.lead_ver_borrador(p_token text)
returns json
language sql
stable
as $$
	select json_build_object(
		'found', true,
		'name', l.name,
		'email', l.email,
		'tag', l.tag,
		'subject', m.subject,
		'body', m.body,
		'is_final', m.is_final,
		'brief', l.brief,
		'history', coalesce((
			select json_agg(json_build_object('direction', h.direction, 'body', h.body) order by h.created_at)
			from public.lead_messages h
			where h.lead_id = l.id and h.status in ('received', 'sent')
		), '[]'::json)
	)
	from public.lead_messages m
	join public.leads l on l.id = m.lead_id
	where m.approval_token = p_token and m.status = 'draft';
$$;

-- 6. Decidir sobre un borrador. Consume el token (un solo uso).
--    p_accion: 'enviar' | 'descartar'. p_body: texto final (puede venir editado).
create or replace function public.lead_decidir(p_token text, p_accion text, p_body text)
returns json
language plpgsql
as $$
declare
	v_msg public.lead_messages;
	v_lead public.leads;
begin
	select * into v_msg
	from public.lead_messages
	where approval_token = p_token and status = 'draft'
	for update;

	if not found then
		return json_build_object('found', false);
	end if;

	select * into v_lead from public.leads where id = v_msg.lead_id;

	if p_accion = 'enviar' then
		update public.lead_messages
		set status = 'approved',
			body = coalesce(nullif(trim(p_body), ''), body),
			decided_at = now(),
			approval_token = null
		where id = v_msg.id
		returning * into v_msg;
	else
		update public.lead_messages
		set status = 'discarded', decided_at = now(), approval_token = null
		where id = v_msg.id;
		update public.leads set status = 'closed', updated_at = now() where id = v_lead.id;
	end if;

	return json_build_object(
		'found', true,
		'accion', p_accion,
		'message_id', v_msg.id,
		'name', v_lead.name,
		'email', v_lead.email,
		'tag', v_lead.tag,
		'subject', v_msg.subject,
		'body', v_msg.body,
		'is_final', v_msg.is_final,
		'brief', v_lead.brief
	);
end;
$$;

-- 7. Confirmar que el email salió.
create or replace function public.lead_confirmar_envio(p_message_id uuid)
returns json
language plpgsql
as $$
declare
	v_msg public.lead_messages;
begin
	update public.lead_messages
	set status = 'sent'
	where id = p_message_id and status = 'approved'
	returning * into v_msg;

	if not found then
		return json_build_object('found', false);
	end if;

	update public.leads
	set status = case when v_msg.is_final then 'qualified' else 'waiting_reply' end,
		agent_turns = agent_turns + 1,
		updated_at = now()
	where id = v_msg.lead_id;

	return json_build_object('found', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Permisos: solo service_role (n8n). Nunca anon ni authenticated.
-- ---------------------------------------------------------------------------

revoke all on table public.leads, public.lead_messages from anon, authenticated;

do $$
declare
	f text;
begin
	foreach f in array array[
		'lead_crear(text, text, text)',
		'lead_registrar_respuesta(text, text, text, text)',
		'lead_historial(uuid)',
		'lead_guardar_borrador(uuid, text, text, text, jsonb)',
		'lead_ver_borrador(text)',
		'lead_decidir(text, text, text)',
		'lead_confirmar_envio(uuid)'
	] loop
		execute format('revoke execute on function public.%s from public, anon, authenticated', f);
		execute format('grant execute on function public.%s to service_role', f);
	end loop;
end;
$$;
