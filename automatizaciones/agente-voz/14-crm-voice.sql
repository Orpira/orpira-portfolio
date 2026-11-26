-- Agente de voz saliente (Vapi + Claude) para el CRM de orpira.es.
-- Ejecutar una vez en el editor SQL de Supabase, después de 01-13.
--
-- Flujo: el formulario guarda el teléfono y el consentimiento para llamar,
-- /api/contact encola la llamada, n8n la reserva en horario permitido y la
-- lanza en Vapi, y /api/webhooks/voice registra el resultado.
--
-- Un solo canal por lead: un contacto con llamada encolada queda fuera de la
-- respuesta automática por email (ver reserve_next_automatic_reply al final).
-- Orlando puede seguir enviando correos manuales desde el CRM.

-- ---------------------------------------------------------------------------
-- Contactos: teléfono, consentimiento para llamar y "no me llames"
-- ---------------------------------------------------------------------------

alter table public.contacts
  add column if not exists phone text
    check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  add column if not exists call_consent_at timestamptz,
  add column if not exists call_consent_policy_version text
    check (call_consent_policy_version is null or char_length(call_consent_policy_version) <= 40),
  add column if not exists do_not_call_at timestamptz;

-- ---------------------------------------------------------------------------
-- Llamadas
-- ---------------------------------------------------------------------------

create table public.voice_calls (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  -- outbound hoy; web/inbound quedan preparados para las opciones A y B.
  channel text not null default 'outbound' check (channel in ('web', 'inbound', 'outbound')),
  status text not null default 'queued'
    check (status in ('queued', 'calling', 'completed', 'no_answer', 'failed', 'cancelled')),
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 5),
  next_attempt_at timestamptz not null default now(),
  provider text,
  provider_call_id text unique check (provider_call_id is null or char_length(provider_call_id) <= 128),
  last_error text check (last_error is null or char_length(last_error) <= 500),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  ended_reason text check (ended_reason is null or char_length(ended_reason) <= 120),
  summary text check (summary is null or char_length(summary) <= 4000),
  transcript text check (transcript is null or char_length(transcript) <= 60000),
  brief jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index voice_calls_contact_idx on public.voice_calls (contact_id, created_at desc);
create index voice_calls_queue_idx on public.voice_calls (next_attempt_at) where status = 'queued';
-- Como mucho una llamada pendiente o en curso por contacto.
create unique index voice_calls_one_active_per_contact
  on public.voice_calls (contact_id) where status in ('queued', 'calling');

alter table public.voice_calls enable row level security;
revoke all on public.voice_calls from public, anon, authenticated, service_role;
grant select on public.voice_calls to service_role;

-- ---------------------------------------------------------------------------
-- 1. Encolar (desde /api/contact). Solo con teléfono, consentimiento y sin
--    "no me llames". Devuelve el id de la llamada o null si no procede.
-- ---------------------------------------------------------------------------

create function public.enqueue_voice_call(p_contact_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  lead public.contacts;
  call_id uuid;
begin
  select * into lead from public.contacts c where c.id = p_contact_id for update;
  if not found or lead.phone is null or lead.call_consent_at is null or lead.do_not_call_at is not null then
    return null;
  end if;

  select v.id into call_id from public.voice_calls v
  where v.contact_id = lead.id and v.status in ('queued', 'calling');
  if found then
    return call_id;
  end if;

  insert into public.voice_calls (contact_id, channel, phone)
  values (lead.id, 'outbound', lead.phone)
  returning id into call_id;
  return call_id;
end;
$$;

revoke all on function public.enqueue_voice_call(uuid) from public, anon, authenticated;
grant execute on function public.enqueue_voice_call(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 2. Reservar la siguiente llamada (desde n8n, cada 5 minutos).
--    Solo de lunes a viernes de 9:30 a 20:00 (Europe/Madrid) y una llamada
--    a la vez. Una llamada "colgada" más de 30 min sin informe se reintenta.
-- ---------------------------------------------------------------------------

create function public.reserve_next_voice_call()
returns table(voice_call_id uuid, contact_id uuid, phone text, name text, message text, attempt integer)
language plpgsql security definer set search_path = ''
as $$
declare
  local_now timestamp := now() at time zone 'Europe/Madrid';
begin
  perform pg_advisory_xact_lock(170424, 7401);

  update public.voice_calls v
  set status = case when v.attempts >= v.max_attempts then 'failed' else 'queued' end,
      next_attempt_at = now() + interval '1 hour',
      last_error = 'Sin informe de fin de llamada',
      updated_at = now()
  where v.status = 'calling' and v.started_at < now() - interval '30 minutes';

  if extract(isodow from local_now) > 5
    or local_now::time < time '09:30' or local_now::time >= time '20:00' then
    return;
  end if;

  if exists (select 1 from public.voice_calls v where v.status = 'calling') then
    return;
  end if;

  return query
  with candidate as (
    select v.id
    from public.voice_calls v
    join public.contacts c on c.id = v.contact_id
    where v.status = 'queued'
      and v.next_attempt_at <= now()
      and v.attempts < v.max_attempts
      and c.do_not_call_at is null
      and c.call_consent_at is not null
    order by v.next_attempt_at, v.created_at, v.id
    limit 1
    for update of v skip locked
  )
  update public.voice_calls v
  set status = 'calling', attempts = v.attempts + 1, started_at = now(),
      provider_call_id = null, last_error = null, updated_at = now()
  from candidate, public.contacts c
  where v.id = candidate.id and c.id = v.contact_id
  returning v.id, v.contact_id, v.phone, c.name, left(c.message, 2000), v.attempts;
end;
$$;

revoke all on function public.reserve_next_voice_call() from public, anon, authenticated;
grant execute on function public.reserve_next_voice_call() to service_role;

-- ---------------------------------------------------------------------------
-- 3. Resultado del lanzamiento (desde n8n, tras POST /call en Vapi).
-- ---------------------------------------------------------------------------

create function public.register_voice_call_dispatch(
  p_voice_call_id uuid, p_provider text, p_provider_call_id text, p_error text
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  current_call public.voice_calls;
begin
  select * into current_call from public.voice_calls v where v.id = p_voice_call_id for update;
  if not found then return 'missing'; end if;
  if current_call.status <> 'calling' then return 'ignored'; end if;

  if p_provider_call_id is not null and p_provider_call_id ~ '^[[:alnum:]_-]{1,128}$' then
    update public.voice_calls
    set provider = left(p_provider, 40), provider_call_id = p_provider_call_id, updated_at = now()
    where id = current_call.id;
    return 'dispatched';
  end if;

  update public.voice_calls
  set status = case when current_call.attempts >= current_call.max_attempts then 'failed' else 'queued' end,
      next_attempt_at = now() + interval '30 minutes',
      last_error = left(coalesce(p_error, 'No se pudo lanzar la llamada'), 500),
      updated_at = now()
  where id = current_call.id;
  return 'requeued';
end;
$$;

revoke all on function public.register_voice_call_dispatch(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.register_voice_call_dispatch(uuid,text,text,text) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Informe de fin de llamada (desde /api/webhooks/voice). Idempotente.
--    p_answered = false (no contesta, buzón, ocupado) → reintento o no_answer.
--    p_answered = true → completed, nota en el CRM y new → qualified.
--    p_attempt (metadata de la llamada) descarta informes tardíos de un
--    intento anterior.
-- ---------------------------------------------------------------------------

create function public.record_voice_call(
  p_voice_call_id uuid,
  p_provider_call_id text,
  p_attempt integer,
  p_answered boolean,
  p_ended_reason text,
  p_duration_seconds integer,
  p_summary text,
  p_transcript text,
  p_brief jsonb
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  current_call public.voice_calls;
  lead public.contacts;
  note text;
  next_status text;
begin
  select * into current_call from public.voice_calls v
  where (p_voice_call_id is not null and v.id = p_voice_call_id)
     or (p_voice_call_id is null and v.provider_call_id = p_provider_call_id)
  for update;
  if not found then return 'missing'; end if;

  if current_call.provider_call_id is not null and p_provider_call_id is not null
     and current_call.provider_call_id <> p_provider_call_id then
    return 'mismatch';
  end if;
  if current_call.status <> 'calling' then
    return 'duplicate';
  end if;
  if p_attempt is not null and p_attempt <> current_call.attempts then
    return 'stale';
  end if;

  if not coalesce(p_answered, false) then
    next_status := case
      when exists (select 1 from public.contacts c where c.id = current_call.contact_id and c.do_not_call_at is not null) then 'cancelled'
      when current_call.attempts >= current_call.max_attempts then 'no_answer'
      else 'queued' end;
    update public.voice_calls
    set status = next_status,
        provider_call_id = case when next_status = 'queued'
          then null else coalesce(current_call.provider_call_id, p_provider_call_id) end,
        next_attempt_at = now() + interval '3 hours',
        ended_at = now(),
        ended_reason = left(p_ended_reason, 120),
        updated_at = now()
    where id = current_call.id;
    return case next_status when 'queued' then 'retry' else next_status end;
  end if;

  update public.voice_calls
  set status = 'completed',
      provider_call_id = coalesce(current_call.provider_call_id, p_provider_call_id),
      ended_at = now(),
      ended_reason = left(p_ended_reason, 120),
      duration_seconds = case when p_duration_seconds >= 0 then p_duration_seconds end,
      summary = left(p_summary, 4000),
      transcript = left(p_transcript, 60000),
      brief = p_brief,
      updated_at = now()
  where id = current_call.id;

  select * into lead from public.contacts c where c.id = current_call.contact_id for update;

  note := left('Llamada del asistente de voz' ||
    case when p_duration_seconds >= 0
      then ' (' || p_duration_seconds / 60 || ' min ' || p_duration_seconds % 60 || ' s)' else '' end ||
    E':\n' || coalesce(nullif(btrim(p_summary), ''), 'Sin resumen.'), 4000);
  insert into public.crm_contact_notes (contact_id, body) values (lead.id, note);

  update public.contacts set last_contacted_at = now() where id = lead.id;

  if lead.status = 'new' then
    update public.contacts set status = 'qualified' where id = lead.id;
    insert into public.crm_contact_stage_changes (contact_id, from_stage, to_stage)
    values (lead.id, 'new', 'qualified');
  end if;

  return 'recorded';
end;
$$;

revoke all on function public.record_voice_call(uuid,text,integer,boolean,text,integer,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.record_voice_call(uuid,text,integer,boolean,text,integer,text,text,jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 5. "No me llames" (herramienta del agente durante la llamada).
-- ---------------------------------------------------------------------------

create function public.mark_voice_do_not_call(p_voice_call_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  target uuid;
begin
  select v.contact_id into target from public.voice_calls v where v.id = p_voice_call_id;
  if not found then return false; end if;

  update public.contacts set do_not_call_at = coalesce(do_not_call_at, now()) where id = target;
  update public.voice_calls set status = 'cancelled', updated_at = now()
  where contact_id = target and status = 'queued';
  return true;
end;
$$;

revoke all on function public.mark_voice_do_not_call(uuid) from public, anon, authenticated;
grant execute on function public.mark_voice_do_not_call(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Un solo canal: la respuesta automática por email ignora los contactos
--    que tienen una llamada. Misma función que en 07-crm-manual-queue.sql
--    con una condición más en la rama automática.
-- ---------------------------------------------------------------------------

create or replace function public.reserve_next_automatic_reply(p_enabled_since timestamptz)
returns table(reply_id uuid, token uuid, recipient text, subject text, body text)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_enabled_since is null or p_enabled_since > now() then
    return;
  end if;

  -- Serialize reservations across workers so rate checks cover concurrent runs.
  perform pg_advisory_xact_lock(170424, 6311);

  return query
  with candidate as (
    select r.id, c.email
    from public.commercial_replies r
    join public.contacts c on c.id = r.contact_id
    where r.status = 'draft'
      and (
        (r.manual_requested_at is not null and r.approved_recipient = c.email)
        or (r.manual_requested_at is null and r.approved_recipient is null
          and c.created_at >= greatest(p_enabled_since, now() - interval '24 hours')
          and c.source = 'portfolio'
          and c.processing_status = 'completed'
          and not exists (select 1 from public.voice_calls v where v.contact_id = c.id)
          and not exists (
            select 1 from public.commercial_replies earlier
            where lower(earlier.approved_recipient) = lower(c.email)
              and earlier.send_started_at > now() - interval '24 hours'
          )
        )
      )
      and c.email ~* '^[[:alnum:]_.+%-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}$'
      and c.email !~* '@([[:alnum:]-]+\.)*(example\.(com|net|org)|[^@]+\.(test|invalid|localhost))$'
      and char_length(btrim(r.body)) between 1 and 10000
      and char_length(btrim(r.subject)) between 1 and 200
      and r.subject !~ '[[:cntrl:]]'
    order by r.manual_requested_at asc nulls last, r.created_at, r.id
    limit 1
    for update of r skip locked
  )
  update public.commercial_replies r
  set status = 'sending', send_started_at = now(), send_token = gen_random_uuid(),
      approved_recipient = candidate.email
  from candidate
  where r.id = candidate.id
  returning r.id, r.send_token, r.approved_recipient, r.subject, r.body;
end;
$$;

revoke all on function public.reserve_next_automatic_reply(timestamptz) from public, anon, authenticated;
grant execute on function public.reserve_next_automatic_reply(timestamptz) to service_role;
