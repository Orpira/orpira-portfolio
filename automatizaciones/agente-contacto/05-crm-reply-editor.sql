begin;

create function public.save_crm_reply(
  p_contact_id uuid, p_reply_id uuid, p_subject text, p_body text,
  p_approved_recipient text default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare saved_id uuid;
begin
  if p_subject is null or char_length(btrim(p_subject)) not between 1 and 200
     or p_subject ~ '[[:cntrl:]]'
     or p_body is null or char_length(btrim(p_body)) not between 1 and 10000 then
    return null;
  end if;

  if p_reply_id is null and p_approved_recipient is null then
    insert into public.commercial_replies(contact_id, subject, body)
    select c.id, btrim(p_subject), p_body
    from public.contacts c where c.id = p_contact_id
    on conflict (contact_id) do nothing
    returning id into saved_id;
  else
    update public.commercial_replies r
    set subject = btrim(p_subject), body = p_body,
        approved_recipient = p_approved_recipient
    from public.contacts c
    where r.id = p_reply_id and r.contact_id = p_contact_id
      and c.id = r.contact_id and r.status = 'draft'
      and (
        (r.approved_recipient is null and p_approved_recipient is null)
        or (
          p_approved_recipient = c.email
          and c.email ~ '^[[:alnum:]_.+%-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}$'
          and (r.approved_recipient is null or (
            r.approved_recipient = c.email
            and r.subject = btrim(p_subject) and r.body = p_body
          ))
        )
      )
    returning r.id into saved_id;
  end if;
  return saved_id;
end;
$$;

revoke all on function public.save_crm_reply(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.save_crm_reply(uuid,uuid,text,text,text) to service_role;

commit;
