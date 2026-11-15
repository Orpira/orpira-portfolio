create function public.delete_crm_prospect(p_contact_id uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  contact_stage text;
begin
  select c.status into contact_stage
  from public.contacts c
  where c.id = p_contact_id
  for update;

  if not found then
    return 'missing';
  end if;
  if contact_stage = 'won' then
    return 'won';
  end if;

  -- A mail worker must reserve a reply before sending. Lock replies until deletion commits.
  perform r.id from public.commercial_replies r
  where r.contact_id = p_contact_id
  order by r.id
  for update;

  if exists (
    select 1 from public.commercial_replies r
    where r.contact_id = p_contact_id and r.status = 'sending'
  ) then
    return 'sending';
  end if;

  delete from public.contacts where id = p_contact_id;
  return 'deleted';
end;
$$;

revoke all on function public.delete_crm_prospect(uuid) from public, anon, authenticated;
grant execute on function public.delete_crm_prospect(uuid) to service_role;
