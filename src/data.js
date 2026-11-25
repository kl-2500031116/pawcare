import { FunctionsHttpError } from "@supabase/supabase-js";
import { getSupabase } from "./supabase.js";

const allowedTypes = new Set(["Dog", "Cat", "Rabbit", "Other"]);
const allowedGenders = new Set(["Male", "Female"]);
const allowedPetStatuses = new Set(["Available", "Pending", "Adopted"]);
const allowedCareServiceTypes = new Set(["Boarding", "In-home sitting", "Drop-in visits"]);
const petPhotoBucket = "pet-photos";
const petPhotoExtensions = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maxPetPhotoSize = 5 * 1024 * 1024;

function throwIfError(error) {
  if (error) throw new Error(error.message);
}

export async function sendEmailNotification(event, recordId) {
  try {
    const { error } = await getSupabase().functions.invoke("send-notification-email", {
      body: {
        event,
        recordId,
        requestId: event === "profile_updated" ? crypto.randomUUID() : undefined,
      },
    });
    if (error) throw error;
    return "";
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (error instanceof FunctionsHttpError && error.context instanceof Response) {
      try {
        const responseBody = await error.context.clone().json();
        if (typeof responseBody?.error === "string") {
          return `Saved successfully, but email notifications could not be delivered. ${responseBody.error}`;
        }
      } catch {
        return `Saved successfully, but email notifications could not be delivered. ${detail}`;
      }
    }
    return `Saved successfully, but email notifications could not be delivered. ${detail}`;
  }
}

export async function getPets() {
  const { data, error } = await getSupabase()
    .from("pets")
    .select("id, name, type, breed, age, gender, location, status, image_url, description, vaccination, health, personality, created_at")
    .eq("submission_status", "Approved")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data;
}

export async function getPublicImpactStats() {
  const client = getSupabase();
  const [listed, available, adopted] = await Promise.all([
    client.from("pets").select("id", { count: "exact", head: true }).eq("submission_status", "Approved"),
    client.from("pets").select("id", { count: "exact", head: true }).eq("submission_status", "Approved").eq("status", "Available"),
    client.from("pets").select("id", { count: "exact", head: true }).eq("submission_status", "Approved").eq("status", "Adopted"),
  ]);
  throwIfError(listed.error);
  throwIfError(available.error);
  throwIfError(adopted.error);
  if ([listed, available, adopted].some((result) => result.count === null)) {
    throw new Error("PawCare could not read the public pet totals.");
  }
  return {
    listed: listed.count,
    available: available.count,
    adopted: adopted.count,
  };
}

export async function getPet(id) {
  const { data, error } = await getSupabase()
    .from("pets")
    .select("id, name, type, breed, age, gender, location, status, image_url, description, vaccination, health, personality, created_at")
    .eq("id", id)
    .eq("submission_status", "Approved")
    .maybeSingle();
  throwIfError(error);
  if (!data) throw new Error("This pet could not be found.");
  return data;
}

export async function createApplication(application) {
  const age = Number(application.age);
  if (!Number.isInteger(age) || age < 18 || age > 120) {
    throw new Error("Applicants must be at least 18 years old.");
  }
  if (application.house_check_consent !== true) {
    throw new Error("Please confirm consent for a mutually arranged house check.");
  }
  if (application.care_commitments !== true) {
    throw new Error("Please confirm the adoption care commitment.");
  }
  const fullName = typeof application.full_name === "string" ? application.full_name.trim() : "";
  const signatureName = typeof application.signature_name === "string" ? application.signature_name.trim() : "";
  if (!fullName || !signatureName || signatureName.toLowerCase() !== fullName.toLowerCase()) {
    throw new Error("Type your full name in the acknowledgement field.");
  }
  if (application.visit_preference != null && typeof application.visit_preference !== "string") {
    throw new Error("Enter house-check availability as text.");
  }
  const visitPreference = application.visit_preference?.trim() || "";
  if (visitPreference.length > 200) {
    throw new Error("Keep the house-check availability note under 200 characters.");
  }

  const client = getSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  throwIfError(authError);
  if (!user) throw new Error("Please sign in before applying.");

  const { data, error } = await client.from("applications").insert({
    applicant_id: user.id,
    pet_id: application.pet_id,
    full_name: application.full_name,
    email: user.email,
    phone: application.phone,
    age,
    occupation: application.occupation,
    address: application.address,
    residence: application.residence,
    experience: application.experience,
    current_pets: application.current_pets,
    reason: application.reason,
    house_check_consent: application.house_check_consent,
    care_commitments: application.care_commitments,
    signature_name: signatureName,
    visit_preference: visitPreference,
  }).select("id").single();
  throwIfError(error);
  return { ...data, notificationWarning: await sendEmailNotification("adoption_application_submitted", data.id) };
}

export async function getMyApplications(userId) {
  if (!userId) throw new Error("Please sign in to view your applications.");
  const { data, error } = await getSupabase()
    .from("applications")
    .select("*, pets(id, name, type, breed, age, gender, location, image_url)")
    .eq("applicant_id", userId)
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data;
}

export async function getMyPetListings(userId) {
  if (!userId) throw new Error("Please sign in to view your pet listings.");
  const { data, error } = await getSupabase()
    .from("pets")
    .select("id, name, type, breed, age, gender, location, submission_status, created_at")
    .eq("submitted_by", userId)
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data;
}

export async function getApplicationDocument(id) {
  const { data, error } = await getSupabase()
    .from("applications")
    .select("*, pets(id, name, type, breed, age, gender, location, image_url)")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  if (!data) throw new Error("This application could not be found.");
  return data;
}

export async function getAdminData() {
  const client = getSupabase();
  const [petsResult, applicationsResult, usersResult] = await Promise.all([
    client.from("pets").select("*").order("created_at", { ascending: false }),
    client.from("applications").select("*, pets(id, name, type, breed, image_url)").order("created_at", { ascending: false }),
    client.from("profiles").select("id, full_name, email, phone, role, created_at").order("created_at", { ascending: false }),
  ]);
  throwIfError(petsResult.error);
  throwIfError(applicationsResult.error);
  throwIfError(usersResult.error);
  return { pets: petsResult.data, applications: applicationsResult.data, users: usersResult.data };
}

export async function updatePet(id, updates) {
  if (!allowedPetStatuses.has(updates.status)) throw new Error("Choose a valid pet status.");
  const { data, error } = await getSupabase()
    .from("pets")
    .update({ status: updates.status })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  throwIfError(error);
  if (!data) throw new Error("Pet not found.");
}

export async function addPet(pet) {
  const normalizedPet = normalizePet(pet);
  const { error } = await getSupabase().from("pets").insert(normalizedPet);
  throwIfError(error);
}

export async function submitPetListing(pet, photoFile = null) {
  const normalizedPet = normalizePet(pet, { allowMissingImage: Boolean(photoFile) });
  const photoExtension = photoFile ? validatePetPhotoFile(photoFile) : null;
  if (pet.owner_confirmed !== true) {
    throw new Error("Please confirm that you are authorized to rehome this pet.");
  }
  const client = getSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  throwIfError(authError);
  if (!user) throw new Error("Please sign in before listing a pet.");

  let uploadedPath = null;
  let imageUrl = normalizedPet.image_url;
  if (photoFile) {
    uploadedPath = `${user.id}/${crypto.randomUUID()}.${photoExtension}`;
    const { error: uploadError } = await client.storage
      .from(petPhotoBucket)
      .upload(uploadedPath, photoFile, {
        cacheControl: "3600",
        contentType: photoFile.type,
        upsert: false,
      });
    throwIfError(uploadError);
    imageUrl = client.storage.from(petPhotoBucket).getPublicUrl(uploadedPath).data.publicUrl;
  }

  try {
    const { data, error } = await client.from("pets").insert({
      ...normalizedPet,
      image_url: imageUrl,
      status: "Available",
      submission_status: "Pending",
      submitted_by: user.id,
      owner_confirmed: true,
    }).select("id").single();
    throwIfError(error);
    return {
      ...data,
      notificationWarning: await sendEmailNotification("pet_listing_submitted", data.id),
    };
  } catch (error) {
    if (uploadedPath) {
      const { error: cleanupError } = await client.storage.from(petPhotoBucket).remove([uploadedPath]);
      if (cleanupError) {
        throw new Error(`${error.message} The uploaded photo could not be cleaned up: ${cleanupError.message}`);
      }
    }
    throw error;
  }
}

export function validatePetPhotoFile(file) {
  if (!file || !petPhotoExtensions.has(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP pet photo.");
  }
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > maxPetPhotoSize) {
    throw new Error("Pet photos must be smaller than 5 MB.");
  }
  return petPhotoExtensions.get(file.type);
}

function normalizePet(pet, { allowMissingImage = false } = {}) {
  const required = ["name", "type", "breed", "age", "gender", "location", "description"];
  if (!allowMissingImage) required.push("image_url");
  if (required.some((key) => typeof pet[key] !== "string" || !pet[key].trim())) {
    throw new Error("Complete all required pet details.");
  }
  if (!allowedTypes.has(pet.type)) throw new Error("Choose a valid animal type.");
  if (!allowedGenders.has(pet.gender)) throw new Error("Choose a valid gender.");
  const imageUrl = typeof pet.image_url === "string" ? pet.image_url.trim() : "";
  let normalizedImageUrl = "";
  if (imageUrl) {
    let image;
    try {
      image = new URL(imageUrl);
    } catch {
      throw new Error("Enter a valid pet image URL.");
    }
    if (!["http:", "https:"].includes(image.protocol)) throw new Error("Pet images must use HTTP or HTTPS.");
    normalizedImageUrl = image.href;
  } else if (!allowMissingImage) {
    throw new Error("Complete all required pet details.");
  }
  const optionalText = (value) => {
    if (value == null) return "";
    if (typeof value !== "string") throw new Error("Optional pet details must be text.");
    return value.trim();
  };
  return {
    name: pet.name.trim(),
    type: pet.type,
    breed: pet.breed.trim(),
    age: pet.age.trim(),
    gender: pet.gender,
    location: pet.location.trim(),
    image_url: normalizedImageUrl,
    description: pet.description.trim(),
    vaccination: optionalText(pet.vaccination),
    health: optionalText(pet.health),
    personality: optionalText(pet.personality),
  };
}

export async function deletePet(id) {
  const { data, error } = await getSupabase()
    .from("pets")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error?.code === "23503") throw new Error("Pets with adoption applications cannot be deleted.");
  throwIfError(error);
  if (!data) throw new Error("Pet not found.");
}

export async function reviewApplication(id, status) {
  if (!["Approved", "Rejected"].includes(status)) throw new Error("Choose Approved or Rejected.");
  const { error } = await getSupabase().rpc("review_application", {
    p_application_id: id,
    p_new_status: status,
  });
  throwIfError(error);
  return { notificationWarning: await sendEmailNotification("adoption_application_reviewed", id) };
}

export async function reviewPetListing(id, status) {
  if (!["Approved", "Rejected"].includes(status)) throw new Error("Choose Approved or Rejected.");
  const { data, error } = await getSupabase()
    .from("pets")
    .update({ submission_status: status })
    .eq("id", id)
    .eq("submission_status", "Pending")
    .not("submitted_by", "is", null)
    .select("id")
    .maybeSingle();
  throwIfError(error);
  if (!data) throw new Error("This pet listing is no longer awaiting review.");
  return { notificationWarning: await sendEmailNotification("pet_listing_reviewed", id) };
}

export async function getCareListings() {
  const { data, error } = await getSupabase()
    .from("care_listings")
    .select("id, provider_id, provider_name, contact_phone, contact_phone_public, service_type, location, rate_per_day, pet_types, description, availability, active, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data;
}

export async function getMyCareListings(userId) {
  if (!userId) throw new Error("Please sign in to view your care services.");
  const { data, error } = await getSupabase()
    .from("care_listings")
    .select("id, provider_id, provider_name, contact_phone, contact_phone_public, service_type, location, rate_per_day, pet_types, description, availability, active, created_at")
    .eq("provider_id", userId)
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data;
}

export async function getMyCareBookings(userId) {
  if (!userId) throw new Error("Please sign in to view care requests.");
  const { data, error } = await getSupabase()
    .from("care_bookings")
    .select("id, owner_id, listing_id, owner_name, owner_phone, pet_name, pet_type, start_date, end_date, notes, status, created_at, care_listings(id, provider_id, provider_name, contact_phone, service_type, location, rate_per_day)")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data;
}

export async function createCareListing(listing) {
  const normalizedListing = normalizeCareListing(listing);
  const client = getSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  throwIfError(authError);
  if (!user) throw new Error("Please sign in before offering pet care.");

  const { data, error } = await client.from("care_listings").insert({
    ...normalizedListing,
    provider_id: user.id,
    active: true,
  }).select("id").single();
  throwIfError(error);
  return { notificationWarning: await sendEmailNotification("care_listing_submitted", data.id) };
}

export async function setCareListingActive(id, active) {
  if (typeof active !== "boolean") throw new Error("Choose whether this care service is active.");
  const { data, error } = await getSupabase()
    .from("care_listings")
    .update({ active })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  throwIfError(error);
  if (!data) throw new Error("Care service not found.");
  return { notificationWarning: await sendEmailNotification("care_listing_status_changed", id) };
}

export async function createCareBooking(booking) {
  const normalizedBooking = normalizeCareBooking(booking);
  const client = getSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  throwIfError(authError);
  if (!user) throw new Error("Please sign in before requesting pet care.");

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  throwIfError(profileError);

  const { data, error } = await client.from("care_bookings").insert({
    ...normalizedBooking,
    owner_id: user.id,
    owner_name: profile.full_name,
    status: "Pending",
  }).select("id").single();
  throwIfError(error);
  return { ...data, notificationWarning: await sendEmailNotification("care_booking_submitted", data.id) };
}

export async function respondToCareBooking(id, status) {
  if (!["Accepted", "Declined"].includes(status)) throw new Error("Choose Accepted or Declined.");
  const { error } = await getSupabase().rpc("respond_to_care_booking", {
    p_booking_id: id,
    p_new_status: status,
  });
  throwIfError(error);
  return { notificationWarning: await sendEmailNotification("care_booking_responded", id) };
}

export async function cancelCareBooking(id) {
  const { error } = await getSupabase().rpc("cancel_care_booking", {
    p_booking_id: id,
  });
  throwIfError(error);
  return { notificationWarning: await sendEmailNotification("care_booking_cancelled", id) };
}

export function normalizeCareListing(listing) {
  const requiredText = (value, label, maxLength) => {
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
      throw new Error(`${label} is required and must be under ${maxLength} characters.`);
    }
    return value.trim();
  };
  const serviceType = requiredText(listing.service_type, "Care type", 40);
  if (!allowedCareServiceTypes.has(serviceType)) throw new Error("Choose a valid care type.");

  const petTypes = Array.isArray(listing.pet_types) ? [...new Set(listing.pet_types)] : [];
  if (petTypes.length === 0 || petTypes.some((type) => !allowedTypes.has(type))) {
    throw new Error("Choose at least one valid animal type you can care for.");
  }
  if (listing.rate_per_day === "" || listing.rate_per_day === null || listing.rate_per_day === undefined) {
    throw new Error("Enter a daily rate between 0 and 100000.");
  }
  const rate = Number(listing.rate_per_day);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100000) {
    throw new Error("Enter a daily rate between 0 and 100000.");
  }
  if (listing.contact_phone_public !== true) {
    throw new Error("Confirm that your contact phone can be shown publicly.");
  }

  return {
    provider_name: requiredText(listing.provider_name, "Your name", 100),
    contact_phone: requiredText(listing.contact_phone, "Contact phone", 40),
    contact_phone_public: true,
    service_type: serviceType,
    location: requiredText(listing.location, "City or location", 100),
    rate_per_day: rate,
    pet_types: petTypes,
    description: requiredText(listing.description, "Service description", 1200),
    availability: requiredText(listing.availability, "Availability", 300),
  };
}

export function normalizeCareBooking(booking) {
  const requiredText = (value, label, maxLength) => {
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
      throw new Error(`${label} is required and must be under ${maxLength} characters.`);
    }
    return value.trim();
  };
  const parseDate = (value, label) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`Choose a valid ${label.toLowerCase()}.`);
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new Error(`Choose a valid ${label.toLowerCase()}.`);
    }
    return value;
  };
  const listingId = requiredText(booking.listing_id, "Care service", 36);
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(listingId)) {
    throw new Error("Choose a valid care service.");
  }
  const startDate = parseDate(booking.start_date, "start date");
  const endDate = parseDate(booking.end_date, "end date");
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  if (startDate < today) throw new Error("Care requests must start today or later.");
  if (endDate < startDate) throw new Error("The end date must be on or after the start date.");
  if (!allowedTypes.has(booking.pet_type)) throw new Error("Choose a valid animal type.");
  const notes = booking.notes ?? "";
  if (typeof notes !== "string" || notes.trim().length > 1000) {
    throw new Error("Keep care instructions under 1000 characters.");
  }

  return {
    listing_id: listingId,
    pet_name: requiredText(booking.pet_name, "Pet name", 100),
    pet_type: booking.pet_type,
    start_date: startDate,
    end_date: endDate,
    owner_phone: requiredText(booking.owner_phone, "Contact phone", 40),
    notes: notes.trim(),
  };
}
