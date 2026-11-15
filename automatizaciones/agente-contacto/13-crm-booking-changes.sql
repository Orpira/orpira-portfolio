alter table public.crm_bookings
  add column revision text check (revision in ('rescheduled', 'cancelled', 'superseded')),
  add column revised_at timestamptz;

create function public.revise_crm_booking(
  p_uid text, p_previous_uid text, p_event text, p_event_at timestamptz,
  p_email text, p_start_at timestamptz, p_meeting_url text
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  booking public.crm_bookings;
  previous_booking public.crm_bookings;
  lead public.contacts;
begin
  if p_event not in ('cancelled','rescheduled') or p_event_at is null then
    return 'invalid';
  end if;

  -- Serialize lifecycle updates so duplicate deliveries cannot replace each other.
  perform pg_advisory_xact_lock(170424, 6312);

  select * into booking from public.crm_bookings where uid = p_uid;
  if booking.revision = 'superseded' or booking.revised_at >= p_event_at then
    return 'duplicate';
  end if;

  if p_event = 'cancelled' then
    if booking.uid is null then return 'unmatched'; end if;
    if booking.revision = 'cancelled' then return 'duplicate'; end if;

    perform 1 from public.contacts where id = booking.contact_id for update;
    update public.crm_bookings
    set revision = 'cancelled', revised_at = p_event_at
    where uid = p_uid;

    if not exists (
      select 1 from public.crm_bookings
      where contact_id = booking.contact_id and start_at > p_event_at
        and revision is distinct from 'cancelled' and revision is distinct from 'superseded'
    ) and public.move_crm_contact_stage(booking.contact_id, 'meeting_scheduled', 'qualified') then
      return 'cancelled_stage_updated';
    end if;
    return 'cancelled';
  end if;

  if p_start_at is null then return 'invalid'; end if;
  if p_previous_uid is distinct from p_uid then
    select * into previous_booking from public.crm_bookings where uid = p_previous_uid;
    if previous_booking.revision = 'superseded' or previous_booking.revised_at >= p_event_at then
      return 'duplicate';
    end if;
  end if;

  if previous_booking.contact_id is not null or booking.contact_id is not null then
    select * into lead from public.contacts
    where id = coalesce(previous_booking.contact_id, booking.contact_id) for update;
  else
    select * into lead from public.contacts where lower(email) = lower(p_email)
    order by case when status in ('won','lost') then 1 else 0 end, created_at desc, id
    limit 1 for update;
  end if;
  if lead.id is null then return 'unmatched'; end if;
  if booking.contact_id is not null and booking.contact_id <> lead.id then return 'unmatched'; end if;

  insert into public.crm_bookings(uid, contact_id, start_at, meeting_url, revision, revised_at)
  values (p_uid, lead.id, p_start_at, coalesce(p_meeting_url, booking.meeting_url, previous_booking.meeting_url),
    'rescheduled', p_event_at)
  on conflict (uid) do update
  set start_at = excluded.start_at, meeting_url = excluded.meeting_url,
      revision = excluded.revision, revised_at = excluded.revised_at
  where crm_bookings.contact_id = excluded.contact_id
    and (crm_bookings.revised_at is null or crm_bookings.revised_at < excluded.revised_at);
  if not found then return 'duplicate'; end if;

  if previous_booking.uid is not null then
    update public.crm_bookings set revision = 'superseded', revised_at = p_event_at
    where uid = previous_booking.uid;
  end if;

  if lead.status in ('new', 'qualified') and p_start_at > p_event_at then
    perform public.move_crm_contact_stage(lead.id, lead.status, 'meeting_scheduled');
  end if;
  return 'rescheduled';
end;
$$;
revoke all on function public.revise_crm_booking(text,text,text,timestamptz,text,timestamptz,text) from public, anon, authenticated;
grant execute on function public.revise_crm_booking(text,text,text,timestamptz,text,timestamptz,text) to service_role;
