create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  phone text not null default '',
  role text not null default 'adopter' check (role in ('adopter', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('Dog', 'Cat', 'Rabbit', 'Other')),
  breed text not null,
  age text not null,
  gender text not null check (gender in ('Male', 'Female')),
  location text not null default 'Vijayawada',
  status text not null default 'Available' check (status in ('Available', 'Pending', 'Adopted')),
  image_url text not null,
  description text not null,
  vaccination text not null default '',
  health text not null default '',
  personality text not null default '',
  submission_status text not null default 'Approved'
    check (submission_status in ('Pending', 'Approved', 'Rejected')),
  submitted_by uuid references auth.users (id) on delete set null,
  owner_confirmed boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists pets_submission_review
  on public.pets (submission_status, created_at desc)
  where submitted_by is not null;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text not null,
  age integer not null check (age between 18 and 120),
  occupation text not null,
  address text not null,
  residence text not null,
  experience text not null,
  current_pets text not null,
  reason text not null,
  house_check_consent boolean not null default false,
  care_commitments boolean not null default false,
  signature_name text not null default '',
  visit_preference text not null default '',
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists applications_applicant_created
  on public.applications (applicant_id, created_at desc);
create index if not exists applications_pet_status
  on public.applications (pet_id, status);

create table if not exists public.care_listings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles (id) on delete cascade,
  provider_name text not null check (length(btrim(provider_name)) between 1 and 100),
  contact_phone text,
  contact_phone_public boolean not null default false,
  constraint care_listings_contact_opt_in check (
    (contact_phone_public and contact_phone is not null and length(btrim(contact_phone)) between 1 and 40)
    or (not contact_phone_public and contact_phone is null)
  ),
  service_type text not null check (service_type in ('Boarding', 'In-home sitting', 'Drop-in visits')),
  location text not null check (length(btrim(location)) between 1 and 100),
  rate_per_day numeric(10, 2) not null check (rate_per_day between 0 and 100000),
  pet_types text[] not null check (
    cardinality(pet_types) > 0
    and pet_types <@ array['Dog', 'Cat', 'Rabbit', 'Other']::text[]
  ),
  description text not null check (length(btrim(description)) between 1 and 1200),
  availability text not null check (length(btrim(availability)) between 1 and 300),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists care_listings_active_created
  on public.care_listings (active, created_at desc);
create index if not exists care_listings_provider_created
  on public.care_listings (provider_id, created_at desc);

create table if not exists public.care_bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.care_listings (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  owner_name text not null check (length(btrim(owner_name)) between 1 and 100),
  owner_phone text not null check (length(btrim(owner_phone)) between 1 and 40),
  pet_name text not null check (length(btrim(pet_name)) between 1 and 100),
  pet_type text not null check (pet_type in ('Dog', 'Cat', 'Rabbit', 'Other')),
  start_date date not null,
  end_date date not null,
  notes text not null default '' check (length(notes) <= 1000),
  status text not null default 'Pending'
    check (status in ('Pending', 'Accepted', 'Declined', 'Cancelled')),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists care_bookings_owner_created
  on public.care_bookings (owner_id, created_at desc);
create index if not exists care_bookings_listing_created
  on public.care_bookings (listing_id, created_at desc);

create table if not exists public.email_notification_log (
  event_key text primary key,
  event_type text not null,
  record_id uuid not null,
  status text not null check (status in ('sending', 'sent', 'failed')),
  attempts integer not null default 1 check (attempts > 0),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload pet photos to their own folder" on storage.objects;
create policy "Users upload pet photos to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      phone = excluded.phone;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_auth_user_email();

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

drop trigger if exists applications_prepare_insert on public.applications;
create trigger applications_prepare_insert
  before insert on public.applications
  for each row execute function public.prepare_adoption_application();

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
    and (select auth.uid()) is not null
    and not public.is_admin() then
    raise exception 'Only an administrator can change account roles.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

create or replace function public.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin' then
    if tg_op = 'DELETE' then
      perform pg_advisory_xact_lock(91372041);
      if not exists (
        select 1
        from public.profiles
        where role = 'admin'
          and id <> old.id
      ) then
        raise exception 'The last administrator account cannot be removed or demoted.';
      end if;
    elsif new.role is distinct from old.role then
      perform pg_advisory_xact_lock(91372041);
      if not exists (
        select 1
        from public.profiles
        where role = 'admin'
          and id <> old.id
      ) then
        raise exception 'The last administrator account cannot be removed or demoted.';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_last_admin on public.profiles;
create trigger profiles_protect_last_admin
  before update of role or delete on public.profiles
  for each row execute function public.protect_last_admin();

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

create or replace function public.prepare_care_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing public.care_listings%rowtype;
  profile_name text;
begin
  if new.owner_id is distinct from (select auth.uid()) then
    raise exception 'Care requests can only be made by the signed-in account.';
  end if;

  select * into listing
    from public.care_listings
    where id = new.listing_id
    for update;
  if not found then
    raise exception 'That care service could not be found.';
  end if;
  if listing.provider_id = new.owner_id then
    raise exception 'You cannot request your own care service.';
  end if;
  if not listing.active then
    raise exception 'This care service is currently paused.';
  end if;
  if not (new.pet_type = any(listing.pet_types)) then
    raise exception 'This caretaker does not accept that animal type.';
  end if;
  if new.start_date < current_date then
    raise exception 'Care requests must start today or later.';
  end if;
  if new.end_date < new.start_date then
    raise exception 'The end date must be on or after the start date.';
  end if;

  select full_name into profile_name
    from public.profiles
    where id = new.owner_id;
  if not found then
    raise exception 'Requester account not found.';
  end if;
  new.owner_name := profile_name;
  new.status := 'Pending';
  return new;
end;
$$;

drop trigger if exists care_bookings_prepare_insert on public.care_bookings;
create trigger care_bookings_prepare_insert
  before insert on public.care_bookings
  for each row execute function public.prepare_care_booking();

create or replace function public.respond_to_care_booking(p_booking_id uuid, p_new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  listing_provider_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Please sign in to respond to care requests.';
  end if;
  if p_new_status is null or p_new_status not in ('Accepted', 'Declined') then
    raise exception 'Choose Accepted or Declined.';
  end if;

  select booking.status, listing.provider_id
    into current_status, listing_provider_id
    from public.care_bookings as booking
    join public.care_listings as listing on listing.id = booking.listing_id
    where booking.id = p_booking_id
    for update of booking;
  if not found then
    raise exception 'Care request not found.';
  end if;
  if listing_provider_id <> (select auth.uid()) then
    raise exception 'Only the caretaker can respond to this request.';
  end if;
  if current_status <> 'Pending' then
    raise exception 'This care request has already been updated.';
  end if;

  update public.care_bookings
    set status = p_new_status
    where id = p_booking_id;
end;
$$;

create or replace function public.cancel_care_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  requester_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Please sign in to cancel care requests.';
  end if;

  select status, owner_id
    into current_status, requester_id
    from public.care_bookings
    where id = p_booking_id
    for update;
  if not found then
    raise exception 'Care request not found.';
  end if;
  if requester_id <> (select auth.uid()) then
    raise exception 'Only the requester can cancel this care request.';
  end if;
  if current_status <> 'Pending' then
    raise exception 'Only pending care requests can be cancelled.';
  end if;

  update public.care_bookings
    set status = 'Cancelled'
    where id = p_booking_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.applications enable row level security;
alter table public.care_listings enable row level security;
alter table public.care_bookings enable row level security;
alter table public.email_notification_log enable row level security;

grant select on public.pets to anon, authenticated;
grant insert, update, delete on public.pets to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select on public.care_listings to anon, authenticated;
grant insert, update on public.care_listings to authenticated;
grant select, insert on public.care_bookings to authenticated;
revoke all on public.email_notification_log from anon, authenticated;
grant select, insert, update on public.email_notification_log to service_role;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.review_application(uuid, text) to authenticated;
grant execute on function public.respond_to_care_booking(uuid, text) to authenticated;
grant execute on function public.cancel_care_booking(uuid) to authenticated;
revoke all on function public.is_admin() from public;
revoke all on function public.review_application(uuid, text) from public;
revoke all on function public.review_application(uuid, text) from anon;
revoke all on function public.prepare_care_booking() from public;
revoke all on function public.respond_to_care_booking(uuid, text) from public, anon;
revoke all on function public.cancel_care_booking(uuid) from public, anon;

drop policy if exists "Anyone can view pets" on public.pets;
drop policy if exists "View approved, own, and admin pet listings" on public.pets;
create policy "View approved, own, and admin pet listings"
  on public.pets for select
  using (
    submission_status = 'Approved'
    or submitted_by = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists "Admins can add pets" on public.pets;
create policy "Admins can add pets"
  on public.pets for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Users can submit pets for review" on public.pets;
create policy "Users can submit pets for review"
  on public.pets for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and submission_status = 'Pending'
    and status = 'Available'
    and owner_confirmed
  );

drop policy if exists "Admins can update pets" on public.pets;
create policy "Admins can update pets"
  on public.pets for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete pets" on public.pets;
create policy "Admins can delete pets"
  on public.pets for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can view their profile and admins can view all" on public.profiles;
create policy "Users can view their profile and admins can view all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can update their profile and admins can update all" on public.profiles;
create policy "Users can update their profile and admins can update all"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Applicants and admins can view applications" on public.applications;
create policy "Applicants and admins can view applications"
  on public.applications for select to authenticated
  using (applicant_id = (select auth.uid()) or (select public.is_admin()));

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

drop policy if exists "Admins can update applications" on public.applications;
create policy "Admins can update applications"
  on public.applications for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "View active, own, and admin care listings" on public.care_listings;
create policy "View active, own, and admin care listings"
  on public.care_listings for select
  using (
    active
    or provider_id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists "Providers can create care listings" on public.care_listings;
create policy "Providers can create care listings"
  on public.care_listings for insert to authenticated
  with check (
    provider_id = (select auth.uid())
    and contact_phone_public
  );

drop policy if exists "Providers can update their care listings" on public.care_listings;
create policy "Providers can update their care listings"
  on public.care_listings for update to authenticated
  using (provider_id = (select auth.uid()) or (select public.is_admin()))
  with check (
    (provider_id = (select auth.uid()) or (select public.is_admin()))
    and (
      contact_phone_public
      or ((select public.is_admin()) and contact_phone is null)
    )
  );

drop policy if exists "Owners, providers, and admins can view care bookings" on public.care_bookings;
create policy "Owners, providers, and admins can view care bookings"
  on public.care_bookings for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1
      from public.care_listings
      where id = listing_id
        and provider_id = (select auth.uid())
    )
  );

drop policy if exists "Signed-in owners can request care" on public.care_bookings;
create policy "Signed-in owners can request care"
  on public.care_bookings for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and status = 'Pending'
  );

insert into public.pets
  (id, name, type, breed, age, gender, location, image_url, description, vaccination, health, personality, is_demo)
values
  ('00000000-0000-4000-8000-000000000001', 'Bruno', 'Dog', 'Labrador', '2 years', 'Male', 'Vijayawada',
   '/pets/bruno-labrador.jpg',
   'Bruno is a sweet yellow lab who loves fetch, swimming, and cuddles.', 'Full (Rabies, DHPP)', 'Healthy & neutered', 'Playful, loving', false),
  ('00000000-0000-4000-8000-000000000002', 'Luna', 'Cat', 'Persian', '1 year', 'Female', 'Guntur',
   '/pets/luna-persian.jpg',
   'Luna adores sunny windowsills and gentle brushings.', 'Vaccinated & dewormed', 'Spayed, clean coat', 'Calm, regal', false),
  ('00000000-0000-4000-8000-000000000003', 'Max', 'Dog', 'Golden Retriever', '3 years', 'Male', 'Vijayawada',
   '/pets/max-golden-retriever.jpg',
   'Max is wonderfully trained and friendly with all animals.', 'Up to date', 'Neutered, athletic', 'Obedient, social', false),
  ('00000000-0000-4000-8000-000000000004', 'Bella', 'Dog', 'Beagle', '2 years', 'Female', 'Vijayawada',
   '/pets/bella-beagle.jpg',
   'Bella loves outdoor scent walks and cozy blankets.', 'Up to date', 'Spayed, healthy', 'Curious, alert', false),
  ('00000000-0000-4000-8000-000000000005', 'Milo', 'Cat', 'Domestic Shorthair', '1 year', 'Male', 'Vijayawada',
   '/pets/milo-domestic-shorthair.jpg',
   'Milo is a vibrant ginger tabby who loves feather toys.', 'Vaccinated', 'Indoor healthy', 'Acrobatic, inquisitive', false),
  ('00000000-0000-4000-8000-000000000006', 'Coco', 'Rabbit', 'Netherland Dwarf', '1 year', 'Female', 'Vijayawada',
   '/pets/coco-netherland-dwarf.jpg',
   'Coco enjoys fresh timothy hay and gentle handling.', 'RHDV2 complete', 'Healthy teeth', 'Docile, quiet', false),
  ('00000000-0000-4000-8000-000000000007', 'Rocky', 'Dog', 'German Shepherd', '4 years', 'Male', 'Vijayawada',
   '/pets/rocky-german-shepherd.jpg',
   'Rocky is a noble shepherd looking for an active handler.', 'Fully immunized', 'Neutered, high stamina', 'Protective, smart', false),
  ('00000000-0000-4000-8000-000000000008', 'Daisy', 'Dog', 'Indie Dog', '2 years', 'Female', 'Vijayawada',
   '/pets/daisy-indie.jpg',
   'Daisy is a loyal rescued Indian hound ready for a loving home.', 'ABC & rabies done', 'High immunity, spayed', 'Gentle, extremely smart', false)
on conflict (id) do nothing;
