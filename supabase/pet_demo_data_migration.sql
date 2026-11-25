begin;

alter table public.pets
  add column if not exists is_demo boolean not null default false;
grant execute on function public.is_admin() to anon, authenticated;

update public.pets
set is_demo = false
where id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006',
  '00000000-0000-4000-8000-000000000007',
  '00000000-0000-4000-8000-000000000008'
);

create or replace function public.prepare_adoption_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  applicant_email text;
  pet_status text;
  pet_submission_status text;
  pet_is_demo boolean;
begin
  if new.applicant_id is distinct from (select auth.uid()) then
    raise exception 'Applications can only be submitted for the signed-in account.';
  end if;

  select email into applicant_email
    from public.profiles
    where id = new.applicant_id;
  if not found then
    raise exception 'Applicant account not found.';
  end if;
  new.email := applicant_email;

  select status, submission_status, is_demo into pet_status, pet_submission_status, pet_is_demo
    from public.pets
    where id = new.pet_id
    for update;
  if not found then
    raise exception 'That pet could not be found.';
  end if;
  if pet_submission_status <> 'Approved' then
    raise exception 'This pet is not available for applications.';
  end if;
  if pet_is_demo then
    raise exception 'This is a demo listing and cannot receive applications.';
  end if;
  if pet_status <> 'Available' then
    raise exception 'This pet is no longer available for applications.';
  end if;

  update public.pets set status = 'Pending' where id = new.pet_id;
  return new;
end;
$$;

commit;
