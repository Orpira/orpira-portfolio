revoke all on public.commercial_replies from public;
grant select on public.commercial_replies to service_role;

create function public.complete_contact_ai_with_draft(
  p_contact_id uuid, p_processing_token uuid, p_lead_type text,
  p_priority text, p_lead_score integer, p_body text
) returns setof public.contacts
language plpgsql security invoker set search_path = ''
as $$
declare contact public.contacts;
begin
  select * into contact from public.complete_contact_ai(
    p_contact_id, p_processing_token, p_lead_type, p_priority, p_lead_score
  );
  if not found then
    return;
  end if;
  perform public.create_commercial_reply_draft(contact.id, 'Re: Consulta a OrPiRa', p_body);
  return next contact;
end;
$$;
revoke all on function public.complete_contact_ai_with_draft(uuid,uuid,text,text,integer,text) from public, anon, authenticated;
grant execute on function public.complete_contact_ai_with_draft(uuid,uuid,text,text,integer,text) to service_role;
