alter table public.contacts
  add column contact_category text check (contact_category in ('client', 'recruiter', 'collaboration', 'networking', 'other')),
  add column company text check (char_length(company) <= 120),
  add column social_profile text check (char_length(social_profile) <= 250),
  add column source_page text check (char_length(source_page) <= 200),
  add column last_contacted_at timestamptz,
  add column next_follow_up_on date;

create index contacts_follow_up_idx on public.contacts (next_follow_up_on)
  where next_follow_up_on is not null;
