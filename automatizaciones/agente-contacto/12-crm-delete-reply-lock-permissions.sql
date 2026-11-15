-- Keep reply locks inside the restricted deletion function.
alter function public.delete_crm_prospect(uuid) security definer;
