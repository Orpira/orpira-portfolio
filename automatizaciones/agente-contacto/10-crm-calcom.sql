create table public.crm_booking_settings (
  singleton boolean primary key default true check (singleton),
  booking_url text check (booking_url ~ '^https://(app[.])?cal[.]com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$')
);
alter table public.crm_booking_settings enable row level security;
revoke all on public.crm_booking_settings from public, anon, authenticated;

create function public.crm_url_component(value text)
returns text
language sql immutable strict set search_path = ''
as $$
  select coalesce(string_agg(
    case when b between 48 and 57 or b between 65 and 90 or b between 97 and 122
      or b in (45, 46, 95, 126) then chr(b)
      else '%' || upper(lpad(to_hex(b), 2, '0')) end, '' order by pos), '')
  from generate_series(0, octet_length(convert_to(value, 'UTF8')) - 1) pos
  cross join lateral get_byte(convert_to(value, 'UTF8'), pos) b;
$$;
revoke all on function public.crm_url_component(text) from public, anon, authenticated;

create function public.format_crm_automatic_reply()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  message text;
  booking text;
  contact_name text;
begin
  if old.status <> 'draft' or new.status <> 'sending' or old.approved_recipient is not null then
    return new;
  end if;

  message := btrim(regexp_replace(new.body, E'\r\n?', E'\n', 'g'), E' \n\t');
  message := regexp_replace(message, '(?i)[[:space:]]*(saludos cordiales|cordialmente|atentamente|un saludo|saludos)[,.!]*([[:space:]]+orlando pineda raad[[:space:]]*[·|–-]?[[:space:]]*orpira)?[[:space:]]*$', '');
  if strpos(message, E'\n\n') = 0 then
    message := regexp_replace(message, '(?i)^(hola(?:,[[:blank:]]*[^.!?\n,]{1,40})?[,.!])[[:blank:]]+', E'\\1\n\n');
    message := regexp_replace(message, '([.!?])[[:blank:]]+([A-ZÁÉÍÓÚÜÑ¿¡])', E'\\1\n\n\\2', 'g');
  end if;

  select s.booking_url into booking from public.crm_booking_settings s where s.singleton;
  if booking is not null then
    select c.name into contact_name from public.contacts c where c.id = new.contact_id;
    message := message || E'\n\nSi prefieres elegir un horario, puedes reservar una reunión aquí:\n'
      || booking || '?name=' || public.crm_url_component(coalesce(contact_name, ''))
      || '&email=' || public.crm_url_component(new.approved_recipient);
  end if;

  new.body := btrim(message, E' \n\t') || E'\n\nUn saludo,\nOrlando Pineda Raad\nOrPiRa';
  return new;
end;
$$;
revoke all on function public.format_crm_automatic_reply() from public, anon, authenticated;
create trigger crm_format_automatic_reply before update of status on public.commercial_replies
for each row execute function public.format_crm_automatic_reply();

alter table public.crm_contact_stage_changes drop constraint crm_contact_stage_changes_to_stage_check;
alter table public.crm_contact_stage_changes add constraint crm_contact_stage_changes_to_stage_check
  check (to_stage in ('new','qualified','meeting_scheduled','proposal','won','lost'));

create table public.crm_bookings (
  uid text primary key,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  start_at timestamptz not null,
  meeting_url text,
  created_at timestamptz not null default now()
);
create index crm_bookings_contact_start_idx on public.crm_bookings(contact_id, start_at);
alter table public.crm_bookings enable row level security;
revoke all on public.crm_bookings from public, anon, authenticated, service_role;
grant select on public.crm_bookings to service_role;

create function public.record_crm_booking(p_uid text, p_email text, p_start_at timestamptz, p_meeting_url text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare lead public.contacts; inserted text;
begin
  if exists(select 1 from public.crm_bookings where uid=p_uid) then return 'duplicate'; end if;
  select c.* into lead from public.contacts c where lower(c.email)=lower(p_email)
  order by case when c.status in ('won','lost') then 1 else 0 end,
    c.created_at desc, c.id limit 1 for update;
  if not found then return 'unmatched'; end if;
  insert into public.crm_bookings(uid,contact_id,start_at,meeting_url)
  values(p_uid,lead.id,p_start_at,p_meeting_url) on conflict(uid) do nothing returning uid into inserted;
  if inserted is null then return 'duplicate'; end if;
  if lead.status in ('new','qualified') then
    update public.contacts set status='meeting_scheduled' where id=lead.id;
    insert into public.crm_contact_stage_changes(contact_id,from_stage,to_stage)
    values(lead.id,lead.status,'meeting_scheduled');
  end if;
  return 'recorded';
end;
$$;
revoke all on function public.record_crm_booking(text,text,timestamptz,text) from public, anon, authenticated;
grant execute on function public.record_crm_booking(text,text,timestamptz,text) to service_role;
create or replace function public.move_crm_contact_stage(p_contact_id uuid, p_from text, p_to text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_to is null or p_to not in ('new', 'qualified', 'meeting_scheduled', 'proposal', 'won', 'lost') then
    return false;
  end if;

  if p_from is not distinct from p_to then
    return exists (select 1 from public.contacts c where c.id = p_contact_id and c.status = p_to);
  end if;

  update public.contacts c set status = p_to
  where c.id = p_contact_id and c.status is not distinct from p_from;
  if not found then return false; end if;

  insert into public.crm_contact_stage_changes(contact_id, from_stage, to_stage)
  values (p_contact_id, p_from, p_to);
  return true;
end;
$$;

revoke all on function public.move_crm_contact_stage(uuid,text,text) from public, anon, authenticated;
grant execute on function public.move_crm_contact_stage(uuid,text,text) to service_role;

alter table public.contacts add column next_follow_up_action text
  check (char_length(btrim(next_follow_up_action)) between 1 and 160);

create table public.crm_follow_up_completions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  action text not null,
  due_on date not null,
  completed_at timestamptz not null default now()
);
create index crm_follow_up_completions_contact_idx
  on public.crm_follow_up_completions(contact_id, completed_at desc);
alter table public.crm_follow_up_completions enable row level security;
revoke all on public.crm_follow_up_completions from public, anon, authenticated, service_role;
grant select on public.crm_follow_up_completions to service_role;

create function public.complete_crm_follow_up(p_id uuid, p_due_on date, p_action text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update public.contacts set next_follow_up_on=null,next_follow_up_action=null
  where id=p_id and next_follow_up_on=p_due_on and next_follow_up_action is not distinct from p_action;
  if not found then return false; end if;
  insert into public.crm_follow_up_completions(contact_id,action,due_on)
  values(p_id,coalesce(p_action,'Seguimiento'),p_due_on);
  return true;
end;
$$;
revoke all on function public.complete_crm_follow_up(uuid,date,text) from public, anon, authenticated;
grant execute on function public.complete_crm_follow_up(uuid,date,text) to service_role;
