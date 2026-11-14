alter table public.commercial_replies
  add column approved_recipient text,
  add column send_started_at timestamptz,
  add column send_finished_at timestamptz,
  add column send_token uuid;

create function public.reserve_commercial_reply(p_reply_id uuid)
returns table(reply_id uuid, token uuid, recipient text, subject text, body text)
language sql security definer set search_path = ''
as $$
  update public.commercial_replies r
  set status = 'sending', send_started_at = now(), send_token = gen_random_uuid()
  from public.contacts c
  where r.id = p_reply_id and r.contact_id = c.id
    and r.status = 'draft'
    and r.approved_recipient = c.email
    and c.email ~ '^[[:alnum:]_.+%-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}$'
  returning r.id, r.send_token, r.approved_recipient, r.subject, r.body;
$$;

create function public.record_commercial_reply_result(
  p_reply_id uuid, p_token uuid, p_status text, p_smtp_message_id text default null
) returns boolean
language sql security definer set search_path = ''
as $$
  with updated as (
    update public.commercial_replies r
    set status = p_status, send_finished_at = now(),
        sent_at = case when p_status = 'sent' then now() end,
        smtp_message_id = case when p_status = 'sent' then left(p_smtp_message_id, 500) end
    where r.id = p_reply_id and r.send_token = p_token and r.status = 'sending'
      and p_status in ('sent', 'failed', 'unknown')
    returning 1
  )
  select exists(select 1 from updated);
$$;

revoke all on function public.reserve_commercial_reply(uuid) from public, anon, authenticated;
revoke all on function public.record_commercial_reply_result(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.reserve_commercial_reply(uuid) to service_role;
grant execute on function public.record_commercial_reply_result(uuid,uuid,text,text) to service_role;
-- Approval and state changes are limited to database administrators and these RPCs.
revoke insert, update, delete, truncate on public.commercial_replies from service_role;
