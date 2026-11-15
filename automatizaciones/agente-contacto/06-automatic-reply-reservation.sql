create function public.reserve_next_automatic_reply(p_enabled_since timestamptz)
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
      and r.approved_recipient is null
      and c.created_at >= greatest(p_enabled_since, now() - interval '24 hours')
      and c.source = 'portfolio'
      and c.processing_status = 'completed'
      and c.email ~* '^[[:alnum:]_.+%-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}$'
      and c.email !~* '@([[:alnum:]-]+\.)*(example\.(com|net|org)|[^@]+\.(test|invalid|localhost))$'
      and not exists (
        select 1 from public.commercial_replies earlier
        where lower(earlier.approved_recipient) = lower(c.email)
          and earlier.send_started_at > now() - interval '24 hours'
      )
      and char_length(btrim(r.body)) between 1 and 10000
      and char_length(btrim(r.subject)) between 1 and 200
      and r.subject !~ '[[:cntrl:]]'
    order by r.created_at, r.id
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
