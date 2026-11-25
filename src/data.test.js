import { test } from "node:test";
import assert from "node:assert/strict";
import { addPet, createApplication, normalizeCareBooking, normalizeCareListing, reviewApplication, submitPetListing, updatePet, validatePetPhotoFile } from "./data.js";
import { getSupabase } from "./supabase.js";

test("Supabase configuration is required instead of silently falling back to browser storage", () => {
  assert.throws(getSupabase, /Supabase is not configured/i);
});

test("pet and application writes reject invalid values before contacting Supabase", async () => {
  await assert.rejects(addPet({ name: "Poppy" }), /Complete all required pet details/i);
  await assert.rejects(addPet({
    name: "Poppy",
    type: "Bird",
    breed: "Indie",
    age: "1 year",
    gender: "Female",
    location: "Vijayawada",
    image_url: "https://example.com/poppy.jpg",
    description: "A happy rescue looking for a family.",
  }), /valid animal type/i);
  await assert.rejects(submitPetListing({ name: "Poppy" }), /required pet details/i);
  await assert.rejects(submitPetListing({
    name: "Poppy",
    type: "Dog",
    breed: "Indie",
    age: "1 year",
    gender: "Female",
    location: "Vijayawada",
    image_url: "https://example.com/poppy.jpg",
    description: "A happy rescue looking for a family.",
    owner_confirmed: false,
  }), /authorized to rehome/i);
  await assert.rejects(updatePet("pet-id", { status: "Lost" }), /valid pet status/i);
  await assert.rejects(reviewApplication("application-id", "Pending"), /Approved or Rejected/i);

  const application = {
    age: 30,
    full_name: "Taylor Reed",
    signature_name: "Taylor Reed",
    house_check_consent: true,
    care_commitments: true,
  };
  await assert.rejects(createApplication({ ...application, house_check_consent: false }), /house check/i);
  await assert.rejects(createApplication({ ...application, care_commitments: false }), /care commitment/i);
  await assert.rejects(createApplication({ ...application, signature_name: "Different Name" }), /full name/i);
});

test("pet photo uploads accept supported images within the size limit", async () => {
  assert.equal(validatePetPhotoFile({ type: "image/jpeg", size: 1024 }), "jpg");
  assert.equal(validatePetPhotoFile({ type: "image/webp", size: 1024 }), "webp");
  assert.throws(() => validatePetPhotoFile({ type: "image/gif", size: 1024 }), /JPG, PNG, or WebP/i);
  assert.throws(() => validatePetPhotoFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 }), /5 MB/i);

  const listing = {
    name: "Poppy",
    type: "Dog",
    breed: "Indie",
    age: "1 year",
    gender: "Female",
    location: "Vijayawada",
    image_url: "",
    description: "A happy rescue looking for a family.",
    owner_confirmed: true,
  };
  await assert.rejects(submitPetListing(listing, { type: "image/gif", size: 1024 }), /JPG, PNG, or WebP/i);
});

test("care listings require explicit public contact consent and a valid daily rate", () => {
  const listing = {
    provider_name: "Taylor Reed",
    contact_phone: "555-0101",
    contact_phone_public: true,
    service_type: "Boarding",
    location: "Vijayawada",
    rate_per_day: "0",
    pet_types: ["Dog"],
    description: "A calm, pet-safe home.",
    availability: "Weekends",
  };
  assert.equal(normalizeCareListing(listing).rate_per_day, 0);
  assert.throws(() => normalizeCareListing({ ...listing, rate_per_day: "" }), /daily rate/i);
  assert.throws(() => normalizeCareListing({ ...listing, contact_phone_public: false }), /shown publicly/i);
  assert.throws(() => normalizeCareListing({ ...listing, pet_types: [] }), /at least one/i);
});

test("care bookings validate service ids and date ranges, with optional notes", () => {
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const booking = {
    listing_id: "00000000-0000-4000-8000-000000000001",
    pet_name: "Milo",
    pet_type: "Dog",
    start_date: today,
    end_date: today,
    owner_phone: "555-0102",
  };
  assert.equal(normalizeCareBooking(booking).notes, "");
  assert.throws(() => normalizeCareBooking({ ...booking, listing_id: "not-a-uuid" }), /valid care service/i);
  assert.throws(() => normalizeCareBooking({ ...booking, start_date: "invalid" }), /valid start date/i);
  assert.throws(() => normalizeCareBooking({ ...booking, start_date: "2099-01-02", end_date: "2099-01-01" }), /end date/i);
});
