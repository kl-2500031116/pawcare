begin;

alter table public.pets
  add column if not exists submission_status text not null default 'Approved',
  add column if not exists submitted_by uuid references auth.users (id) on delete set null,
  add column if not exists owner_confirmed boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.pets'::regclass
      and conname = 'pets_submission_status_check'
  ) then
    alter table public.pets
      add constraint pets_submission_status_check
      check (submission_status in ('Pending', 'Approved', 'Rejected'));
  end if;
end;
$$;

create index if not exists pets_submission_review
  on public.pets (submission_status, created_at desc)
  where submitted_by is not null;

grant insert, select on public.pets to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Anyone can view pets" on public.pets;
drop policy if exists "View approved, own, and admin pet listings" on public.pets;
create policy "View approved, own, and admin pet listings"
  on public.pets for select
  using (
    submission_status = 'Approved'
    or submitted_by = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists "Users can submit pets for review" on public.pets;
create policy "Users can submit pets for review"
  on public.pets for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and submission_status = 'Pending'
    and status = 'Available'
    and owner_confirmed
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

  select status, submission_status into pet_status, pet_submission_status
    from public.pets
    where id = new.pet_id
    for update;
  if not found then
    raise exception 'That pet could not be found.';
  end if;
  if pet_submission_status <> 'Approved' then
    raise exception 'This pet is not available for applications.';
  end if;
  if pet_status <> 'Available' then
    raise exception 'This pet is no longer available for applications.';
  end if;

  update public.pets set status = 'Pending' where id = new.pet_id;
  return new;
end;
$$;

commit;
