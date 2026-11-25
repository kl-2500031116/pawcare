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

alter table public.care_listings
  alter column contact_phone drop not null,
  alter column contact_phone_public set default false;
alter table public.care_listings
  drop constraint if exists care_listings_contact_phone_public_check,
  drop constraint if exists care_listings_contact_opt_in;
alter table public.care_listings
  add constraint care_listings_contact_opt_in check (
    (contact_phone_public and contact_phone is not null and length(btrim(contact_phone)) between 1 and 40)
    or (not contact_phone_public and contact_phone is null)
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

alter table public.care_listings enable row level security;
alter table public.care_bookings enable row level security;

grant select on public.care_listings to anon, authenticated;
grant insert, update on public.care_listings to authenticated;
grant select, insert on public.care_bookings to authenticated;
grant execute on function public.respond_to_care_booking(uuid, text) to authenticated;
grant execute on function public.cancel_care_booking(uuid) to authenticated;
revoke all on function public.prepare_care_booking() from public;
revoke all on function public.respond_to_care_booking(uuid, text) from public, anon;
revoke all on function public.cancel_care_booking(uuid) from public, anon;

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

notify pgrst, 'reload schema';
