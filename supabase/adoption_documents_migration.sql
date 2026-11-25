begin;

alter table public.applications
  add column if not exists house_check_consent boolean not null default false,
  add column if not exists care_commitments boolean not null default false,
  add column if not exists signature_name text not null default '',
  add column if not exists visit_preference text not null default '',
  add column if not exists reviewed_at timestamptz;

drop policy if exists "Applicants can submit applications" on public.applications;
create policy "Applicants can submit applications"
  on public.applications for insert to authenticated
  with check (
    applicant_id = (select auth.uid())
    and status = 'Pending'
    and house_check_consent
    and care_commitments
    and lower(btrim(signature_name)) = lower(btrim(full_name))
  );

create or replace function public.review_application(p_application_id uuid, p_new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_pet_id uuid;
  current_status text;
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;
  if p_new_status not in ('Approved', 'Rejected') then
    raise exception 'Choose Approved or Rejected.';
  end if;

  select pet_id, status
    into application_pet_id, current_status
    from public.applications
    where id = p_application_id
    for update;

  if not found then
    raise exception 'Application not found.';
  end if;
  if current_status <> 'Pending' then
    raise exception 'This application has already been reviewed.';
  end if;

  update public.applications
    set status = p_new_status,
        reviewed_at = now()
    where id = p_application_id;

  if p_new_status = 'Approved' then
    update public.pets set status = 'Adopted' where id = application_pet_id;
  elsif not exists (
    select 1
    from public.applications
    where pet_id = application_pet_id
      and status = 'Pending'
  ) then
    update public.pets
      set status = 'Available'
      where id = application_pet_id and status = 'Pending';
  end if;
end;
$$;

commit;
