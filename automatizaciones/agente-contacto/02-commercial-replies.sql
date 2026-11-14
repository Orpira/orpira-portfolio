-- OrPiRa commercial agent: durable drafts, no email delivery.
-- Apply manually in Supabase after verifying the existing contacts schema.
create table if not exists public.commercial_replies (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  subject text not null,
  body text not null,
  status text not null default 'draft'
    check (status in ('draft','sending','sent','failed','unknown')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  smtp_message_id text,
  error_message text,
  constraint commercial_replies_one_initial_per_contact unique(contact_id)
);
alter table public.commercial_replies enable row level security;
revoke all on public.commercial_replies from anon, authenticated;

create or replace function public.create_commercial_reply_draft(
  p_contact_id uuid, p_subject text, p_body text
) returns public.commercial_replies
language plpgsql security definer set search_path = public
as $$
declare r public.commercial_replies;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Not authorized';
  end if;
  if not exists (
    select 1 from public.contacts
    where id = p_contact_id and processing_status = 'completed'
  ) then
    raise exception 'Contact not classified';
  end if;
  if nullif(btrim(p_body), '') is null or nullif(btrim(p_subject), '') is null then
    raise exception 'Empty reply';
  end if;
  insert into public.commercial_replies(contact_id,subject,body)
  values(p_contact_id,p_subject,p_body)
  on conflict(contact_id) do nothing;
  select * into r from public.commercial_replies where contact_id=p_contact_id;
  return r;
end $$;
revoke all on function public.create_commercial_reply_draft(uuid,text,text) from public, anon, authenticated;
grant execute on function public.create_commercial_reply_draft(uuid,text,text) to service_role;
