do $$
declare
  care_team_id uuid;
begin
  select id into care_team_id
    from public.profiles
    where role = 'admin'
    order by created_at
    limit 1;

  if care_team_id is null then
    raise exception 'Create and promote a PawCare admin account before loading the care services.';
  end if;

  insert into public.care_listings (
    id,
    provider_id,
    provider_name,
    contact_phone,
    contact_phone_public,
    service_type,
    location,
    rate_per_day,
    pet_types,
    description,
    availability
  ) values
    ('c0000000-0000-4000-8000-000000000001', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Benz Circle, Vijayawada', 650, array['Dog']::text[], 'A calm home-style stay with supervised walks and regular meal updates.', 'Weekends and public holidays'),
    ('c0000000-0000-4000-8000-000000000002', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Moghalrajpuram, Vijayawada', 550, array['Cat']::text[], 'A quiet indoor setup with separate resting spaces for visiting cats.', 'Monday to Saturday'),
    ('c0000000-0000-4000-8000-000000000003', care_team_id, 'PawCare Visiting Care Team', null, false, 'In-home sitting', 'Governorpet, Vijayawada', 800, array['Dog', 'Cat']::text[], 'A caretaker can stay at your home and follow your pet''s familiar routine.', 'By advance arrangement'),
    ('c0000000-0000-4000-8000-000000000004', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Patamata, Vijayawada', 250, array['Cat']::text[], 'Short home visits for feeding, fresh water, litter care, and company.', 'Morning and evening visits'),
    ('c0000000-0000-4000-8000-000000000005', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Kanuru, Vijayawada', 700, array['Dog', 'Rabbit']::text[], 'A small-capacity stay with a secure rest area and scheduled outdoor breaks.', 'Weekdays and weekends'),
    ('c0000000-0000-4000-8000-000000000006', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Poranki, Vijayawada', 300, array['Dog', 'Cat']::text[], 'A visit for feeding, a short walk where suitable, and a wellbeing check.', 'Daily, advance booking preferred'),
    ('c0000000-0000-4000-8000-000000000007', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Bhavanipuram, Vijayawada', 600, array['Dog', 'Other']::text[], 'A home-based short stay with a planned introduction and individual attention.', 'Friday to Monday'),
    ('c0000000-0000-4000-8000-000000000008', care_team_id, 'PawCare Visiting Care Team', null, false, 'In-home sitting', 'Auto Nagar, Vijayawada', 750, array['Dog']::text[], 'In-home companionship and routine care for dogs that prefer familiar surroundings.', 'Weekdays by arrangement'),
    ('c0000000-0000-4000-8000-000000000009', care_team_id, 'PawCare Cat Care Team', null, false, 'Boarding', 'Tadepalli', 500, array['Cat']::text[], 'An indoor-only stay with quiet rest time and owner-provided food.', 'All week, subject to availability'),
    ('c0000000-0000-4000-8000-000000000010', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Mangalagiri', 275, array['Cat', 'Rabbit']::text[], 'A short visit for feeding and enclosure checks for small pets.', 'Morning visits'),
    ('c0000000-0000-4000-8000-000000000011', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Guntur, Lakshmipuram', 625, array['Dog']::text[], 'A planned home stay with daily walks and updates for the pet owner.', 'Weekends and school holidays'),
    ('c0000000-0000-4000-8000-000000000012', care_team_id, 'PawCare Visiting Care Team', null, false, 'In-home sitting', 'Guntur, Brodipet', 850, array['Dog', 'Cat']::text[], 'A sitter follows the pet''s normal feeding, play, and rest schedule at home.', 'By advance arrangement'),
    ('c0000000-0000-4000-8000-000000000013', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Guntur, Arundelpet', 250, array['Dog']::text[], 'A brief visit for a meal, fresh water, and a neighbourhood walk if requested.', 'Two daily time windows'),
    ('c0000000-0000-4000-8000-000000000014', care_team_id, 'PawCare Cat Care Team', null, false, 'Boarding', 'Tenali', 475, array['Cat']::text[], 'A quiet indoor boarding option for cats with familiar bedding from home.', 'Monday to Saturday'),
    ('c0000000-0000-4000-8000-000000000015', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Eluru', 250, array['Cat']::text[], 'A scheduled check-in for feeding, water, litter, and a little playtime.', 'Morning and evening'),
    ('c0000000-0000-4000-8000-000000000016', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Gudivada', 550, array['Dog', 'Other']::text[], 'A short stay with a calm routine and an owner-supplied care plan.', 'Weekends by request'),
    ('c0000000-0000-4000-8000-000000000017', care_team_id, 'PawCare Visiting Care Team', null, false, 'In-home sitting', 'Machilipatnam', 700, array['Dog']::text[], 'A sitter provides companionship and maintains the dog''s usual schedule at home.', 'Weekdays'),
    ('c0000000-0000-4000-8000-000000000018', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Nuzvid', 225, array['Cat', 'Other']::text[], 'A home visit for feeding and a basic wellbeing check for small pets.', 'By advance arrangement'),
    ('c0000000-0000-4000-8000-000000000019', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Vijayawada, Labbipet', 725, array['Dog', 'Cat']::text[], 'A small-group stay with separate rest areas and a meet-before-booking option.', 'All week'),
    ('c0000000-0000-4000-8000-000000000020', care_team_id, 'PawCare Cat Care Team', null, false, 'In-home sitting', 'Vijayawada, Suryaraopet', 700, array['Cat']::text[], 'At-home cat care focused on familiar spaces, feeding, and gentle company.', 'Daytime visits'),
    ('c0000000-0000-4000-8000-000000000021', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Vijayawada, Ramavarappadu', 275, array['Dog', 'Cat']::text[], 'A short visit for meals, water, and a check that your pet is comfortable.', 'Daily by arrangement'),
    ('c0000000-0000-4000-8000-000000000022', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Vijayawada, Gunadala', 525, array['Rabbit', 'Other']::text[], 'Small-pet boarding with an owner-provided enclosure and feeding instructions.', 'Weekends'),
    ('c0000000-0000-4000-8000-000000000023', care_team_id, 'PawCare Visiting Care Team', null, false, 'In-home sitting', 'Vijayawada, Ajit Singh Nagar', 775, array['Dog', 'Other']::text[], 'In-home supervision for pets that need their own space and routine.', 'By advance arrangement'),
    ('c0000000-0000-4000-8000-000000000024', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Vijayawada, Kankipadu', 225, array['Rabbit', 'Other']::text[], 'A check-in to refresh food and water and confirm a small pet is settled.', 'Morning visits'),
    ('c0000000-0000-4000-8000-000000000025', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Guntur, Nallapadu', 575, array['Dog']::text[], 'A short-term stay with owner-provided food and a consistent exercise routine.', 'Friday to Monday'),
    ('c0000000-0000-4000-8000-000000000026', care_team_id, 'PawCare Cat Care Team', null, false, 'Drop-in visits', 'Guntur, Pattabhipuram', 250, array['Cat']::text[], 'A home visit for meals, litter care, and a familiar face while you are away.', 'Twice daily by request'),
    ('c0000000-0000-4000-8000-000000000027', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Mangalagiri, Tadepalli Road', 600, array['Dog', 'Cat']::text[], 'A planned short stay with separate spaces for dogs and cats.', 'Weekdays and weekends'),
    ('c0000000-0000-4000-8000-000000000028', care_team_id, 'PawCare Visiting Care Team', null, false, 'In-home sitting', 'Penamaluru', 725, array['Dog', 'Cat']::text[], 'A sitter can keep your pet company and follow written home-care instructions.', 'By advance arrangement'),
    ('c0000000-0000-4000-8000-000000000029', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Ibrahimpatnam', 250, array['Dog']::text[], 'A short visit with feeding and a walk or play break when suitable.', 'Evening visits'),
    ('c0000000-0000-4000-8000-000000000030', care_team_id, 'PawCare Cat Care Team', null, false, 'Boarding', 'Vijayawada, Sitanagaram', 500, array['Cat']::text[], 'Indoor cat care with a quiet settling-in period and owner-provided supplies.', 'All week by request'),
    ('c0000000-0000-4000-8000-000000000031', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Vijayawada, Poranki', 650, array['Dog']::text[], 'A short stay with daily routine notes and a secure rest area.', 'Public holidays and weekends'),
    ('c0000000-0000-4000-8000-000000000032', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Vijayawada, Enikepadu', 275, array['Dog', 'Cat']::text[], 'A visit for feeding, water, and companionship in the pet''s own home.', 'Morning and evening'),
    ('c0000000-0000-4000-8000-000000000033', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Chilakaluripet', 525, array['Dog', 'Other']::text[], 'A short stay arranged around the pet''s normal meals and rest times.', 'Weekends by request'),
    ('c0000000-0000-4000-8000-000000000034', care_team_id, 'PawCare Visiting Care Team', null, false, 'In-home sitting', 'Vuyyuru', 700, array['Dog']::text[], 'At-home supervision for dogs that are more comfortable in familiar surroundings.', 'Weekdays by arrangement'),
    ('c0000000-0000-4000-8000-000000000035', care_team_id, 'PawCare Visiting Care Team', null, false, 'Drop-in visits', 'Vijayawada, Kesarapalli', 225, array['Cat', 'Rabbit']::text[], 'A home check for feeding, water, and small-pet enclosure care.', 'Daily by arrangement'),
    ('c0000000-0000-4000-8000-000000000036', care_team_id, 'PawCare Home Boarding Team', null, false, 'Boarding', 'Vijayawada, Gollapudi', 575, array['Dog', 'Cat', 'Rabbit']::text[], 'A short-term home stay with separate areas and care instructions supplied by the owner.', 'All week, advance booking preferred')
  on conflict (id) do nothing;
end;
$$;

notify pgrst, 'reload schema';
