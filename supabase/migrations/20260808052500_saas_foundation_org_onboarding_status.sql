alter table public.organizations drop constraint if exists organizations_status_check;
alter table public.organizations add constraint organizations_status_check check (status in ('prospect','onboarding','research_beta','controlled_beta','active','inactive'));
