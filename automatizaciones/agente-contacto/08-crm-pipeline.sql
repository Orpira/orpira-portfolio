create table public.crm_contact_stage_changes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  from_stage text,
  to_stage text not null check (to_stage in ('new', 'qualified', 'proposal', 'won', 'lost')),
  changed_at timestamptz not null default now()
);

create index crm_contact_stage_changes_contact_idx
  on public.crm_contact_stage_changes (contact_id, changed_at desc);
alter table public.crm_contact_stage_changes enable row level security;
revoke all on public.crm_contact_stage_changes from public, anon, authenticated, service_role;
grant select on public.crm_contact_stage_changes to service_role;

create function public.move_crm_contact_stage(p_contact_id uuid, p_from text, p_to text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_to is null or p_to not in ('new', 'qualified', 'proposal', 'won', 'lost') then
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
