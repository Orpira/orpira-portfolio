alter table public.commercial_replies add column manual_requested_at timestamptz;

create function public.queue_crm_reply(
  p_contact_id uuid, p_reply_id uuid, p_subject text, p_body text, p_recipient text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare saved_id uuid := p_reply_id;
begin
  if not exists (
    select 1 from public.contacts c where c.id = p_contact_id and c.email = p_recipient
      and c.email !~* '@([[:alnum:]-]+\.)*(example\.(com|net|org)|[^@]+\.(test|invalid|localhost))$'
      and c.email ~ '^[[:alnum:]_.+%-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}$'
  ) then
    return null;
  end if;

  if saved_id is null then
    saved_id := public.save_crm_reply(p_contact_id, null, p_subject, p_body, null);
    if saved_id is null then return null; end if;
  end if;

  saved_id := public.save_crm_reply(p_contact_id, saved_id, p_subject, p_body, p_recipient);
  update public.commercial_replies set manual_requested_at = coalesce(manual_requested_at, now())
  where id = saved_id;
  return saved_id;
end;
$$;

revoke all on function public.queue_crm_reply(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.queue_crm_reply(uuid,uuid,text,text,text) to service_role;

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

create table public.crm_contact_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index crm_contact_notes_contact_created_idx
  on public.crm_contact_notes (contact_id, created_at desc);

alter table public.crm_contact_notes enable row level security;
revoke all on public.crm_contact_notes from public, anon, authenticated, service_role;
grant select, insert on public.crm_contact_notes to service_role;
