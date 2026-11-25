import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

type Row = Record<string, unknown>;

type Notice = {
  recipient: string;
  subject: string;
  text: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(status: number, body: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asRow(value: unknown): Row | null {
  if (Array.isArray(value)) return asRow(value[0]);
  return value !== null && typeof value === "object" ? value as Row : null;
}

function value(row: Row, key: string): string {
  const field = row[key];
  return typeof field === "string" ? field : "";
}

async function loadProfile(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", id)
    .maybeSingle();
  if (error) return { profile: null, error };
  return { profile: data as Profile | null, error: null };
}

async function loadAdminEmails(client: SupabaseClient) {
  const { data, error } = await client
    .from("profiles")
    .select("email")
    .eq("role", "admin");
  if (error) return { emails: [], error };
  return {
    emails: (data || [])
      .map((profile) => profile.email)
      .filter((email): email is string => typeof email === "string" && email.length > 0),
    error: null,
  };
}

function addNotice(notices: Notice[], recipient: string, subject: string, text: string) {
  if (!recipient || notices.some((notice) => notice.recipient.toLowerCase() === recipient.toLowerCase())) return;
  notices.push({ recipient, subject, text });
}

async function claimNotification(
  client: SupabaseClient,
  eventKey: string,
  event: string,
  recordId: string,
) {
  const { error: insertError } = await client.from("email_notification_log").insert({
    event_key: eventKey,
    event_type: event,
    record_id: recordId,
    status: "sending",
  });
  if (!insertError) return { claimed: true, alreadySent: false, inProgress: false, error: null };
  if (insertError.code !== "23505") {
    return { claimed: false, alreadySent: false, inProgress: false, error: insertError };
  }

  const { data: existing, error: lookupError } = await client
    .from("email_notification_log")
    .select("status, attempts, created_at")
    .eq("event_key", eventKey)
    .maybeSingle();
  if (lookupError || !existing) {
    return { claimed: false, alreadySent: false, inProgress: false, error: lookupError || new Error("Could not check notification status.") };
  }
  if (existing.status === "sent") {
    return { claimed: false, alreadySent: true, inProgress: false, error: null };
  }

  const staleBefore = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const isStale = existing.status === "sending" && existing.created_at < staleBefore;
  if (existing.status === "sending" && !isStale) {
    return { claimed: false, alreadySent: false, inProgress: true, error: null };
  }

  let update = client.from("email_notification_log").update({
    status: "sending",
    attempts: existing.attempts + 1,
    last_error: null,
    created_at: new Date().toISOString(),
    sent_at: null,
  }).eq("event_key", eventKey).eq("status", existing.status);
  if (isStale) update = update.lt("created_at", staleBefore);
  const { data, error: updateError } = await update.select("event_key").maybeSingle();
  if (updateError) {
    return { claimed: false, alreadySent: false, inProgress: false, error: updateError };
  }
  return {
    claimed: Boolean(data),
    alreadySent: false,
    inProgress: !data,
    error: null,
  };
}

async function finishNotification(
  client: SupabaseClient,
  eventKey: string,
  status: "sent" | "failed",
  message = "",
) {
  const { error } = await client
    .from("email_notification_log")
    .update({
      status,
      last_error: message.slice(0, 2000) || null,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("event_key", eventKey);
  return error;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond(405, { error: "Method not allowed." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const sender = Deno.env.get("RESEND_FROM_EMAIL");
  const siteUrlValue = Deno.env.get("SITE_URL");
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return respond(500, { error: "The notification function is not configured for Supabase." });
  }
  if (!resendApiKey || !sender || !siteUrlValue) {
    return respond(500, { error: "Email delivery is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and SITE_URL." });
  }
  if (!authorization) return respond(401, { error: "Please sign in to continue." });

  let siteUrl: string;
  try {
    const parsedUrl = new URL(siteUrlValue);
    if (!["https:", "http:"].includes(parsedUrl.protocol)) throw new Error("Invalid protocol.");
    siteUrl = parsedUrl.toString().replace(/\/+$/, "");
  } catch {
    return respond(500, { error: "SITE_URL must be a valid HTTP or HTTPS URL." });
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authError } = await callerClient.auth.getUser();
  if (authError || !user) return respond(401, { error: "Your session is invalid or expired." });

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { profile: callerProfile, error: callerProfileError } = await loadProfile(serviceClient, user.id);
  if (callerProfileError || !callerProfile) return respond(403, { error: "Could not verify your PawCare profile." });

  let payload: { event?: unknown; recordId?: unknown; requestId?: unknown } | null;
  try {
    payload = await request.json();
  } catch {
    return respond(400, { error: "A valid notification event and record ID are required." });
  }
  if (!payload || typeof payload.event !== "string" || typeof payload.recordId !== "string"
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.recordId)) {
    return respond(400, { error: "A supported notification event and valid record ID are required." });
  }

  const event = payload.event;
  const recordId = payload.recordId;
  if (event === "profile_updated"
    && (typeof payload.requestId !== "string"
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.requestId))) {
    return respond(400, { error: "A unique profile update request ID is required." });
  }
  const notices: Notice[] = [];
  let eventKey = event === "profile_updated"
    ? `${event}:${recordId}:${payload.requestId}`
    : `${event}:${recordId}`;
  const accountUrl = `${siteUrl}/account`;
  const adminUrl = `${siteUrl}/admin`;
  const careUrl = `${siteUrl}/care`;

  if (event === "adoption_application_submitted") {
    const { data, error } = await serviceClient.from("applications")
      .select("id, applicant_id, full_name, pets(name)")
      .eq("id", recordId)
      .maybeSingle();
    const application = asRow(data);
    if (error) return respond(500, { error: "Could not load the adoption application." });
    if (!application) return respond(404, { error: "Adoption application not found." });
    if (application.applicant_id !== user.id) return respond(403, { error: "You cannot send notifications for this application." });
    const pet = asRow(application.pets);
    const { emails, error: adminsError } = await loadAdminEmails(serviceClient);
    if (adminsError) return respond(500, { error: "Could not load administrator email addresses." });
    if (!emails.length) return respond(409, { error: "No administrator email address is configured." });
    addNotice(notices, callerProfile.email, "PawCare received your adoption application", `We received your application to adopt ${value(pet || {}, "name") || "a pet"}. You can track its status here:\n${accountUrl}`);
    for (const email of emails) addNotice(notices, email, "New PawCare adoption application", `A new adoption application was submitted for ${value(pet || {}, "name") || "a pet"}.\nReview it in the admin dashboard:\n${adminUrl}`);
  } else if (event === "pet_listing_submitted") {
    const { data, error } = await serviceClient.from("pets")
      .select("id, name, submitted_by")
      .eq("id", recordId)
      .maybeSingle();
    const pet = asRow(data);
    if (error) return respond(500, { error: "Could not load the pet listing." });
    if (!pet) return respond(404, { error: "Pet listing not found." });
    if (pet.submitted_by !== user.id) return respond(403, { error: "You cannot send notifications for this pet listing." });
    const { emails, error: adminsError } = await loadAdminEmails(serviceClient);
    if (adminsError) return respond(500, { error: "Could not load administrator email addresses." });
    if (!emails.length) return respond(409, { error: "No administrator email address is configured." });
    addNotice(notices, callerProfile.email, "PawCare received your pet listing", `Your listing for ${value(pet, "name")} was received and is waiting for review.\nTrack updates in your account:\n${accountUrl}`);
    for (const email of emails) addNotice(notices, email, "New PawCare pet listing to review", `A community pet listing for ${value(pet, "name")} is waiting for review.\nOpen the admin dashboard:\n${adminUrl}`);
  } else if (event === "care_listing_submitted") {
    const { data, error } = await serviceClient.from("care_listings")
      .select("id, provider_id, provider_name, service_type, location")
      .eq("id", recordId)
      .maybeSingle();
    const listing = asRow(data);
    if (error) return respond(500, { error: "Could not load the care service." });
    if (!listing) return respond(404, { error: "Care service not found." });
    if (listing.provider_id !== user.id) return respond(403, { error: "You cannot send notifications for this care service." });
    const { emails, error: adminsError } = await loadAdminEmails(serviceClient);
    if (adminsError) return respond(500, { error: "Could not load administrator email addresses." });
    if (!emails.length) return respond(409, { error: "No administrator email address is configured." });
    addNotice(notices, callerProfile.email, "Your PawCare service is listed", `Your ${value(listing, "service_type")} service in ${value(listing, "location")} is now listed.\nManage requests here:\n${careUrl}`);
    for (const email of emails) addNotice(notices, email, "New PawCare care service", `${value(listing, "provider_name")} submitted a ${value(listing, "service_type")} service in ${value(listing, "location")}.\nView care services:\n${careUrl}`);
  } else if (event === "care_listing_status_changed") {
    const { data, error } = await serviceClient.from("care_listings")
      .select("id, provider_id, active")
      .eq("id", recordId)
      .maybeSingle();
    const listing = asRow(data);
    if (error) return respond(500, { error: "Could not load the care service status." });
    if (!listing) return respond(404, { error: "Care service not found." });
    if (listing.provider_id !== user.id) return respond(403, { error: "You cannot send notifications for this care service." });
    const status = listing.active === true ? "active" : "paused";
    eventKey = `${event}:${recordId}:${status}`;
    addNotice(notices, callerProfile.email, `Your PawCare care service is ${status}`, `Your care service is now ${status}.\nManage your services here:\n${careUrl}`);
  } else if (event === "profile_updated") {
    addNotice(notices, callerProfile.email, "Your PawCare profile was updated", `Your PawCare profile details were updated.\nReview your account here:\n${accountUrl}`);
  } else if (event === "care_booking_submitted") {
    const { data, error } = await serviceClient.from("care_bookings")
      .select("id, owner_id, owner_name, pet_name, pet_type, start_date, end_date, status, care_listings(provider_id, provider_name, service_type, location)")
      .eq("id", recordId)
      .maybeSingle();
    const booking = asRow(data);
    if (error) return respond(500, { error: "Could not load the care request." });
    if (!booking) return respond(404, { error: "Care request not found." });
    if (booking.owner_id !== user.id || booking.status !== "Pending") return respond(403, { error: "You cannot send notifications for this care request." });
    const listing = asRow(booking.care_listings);
    if (!listing) return respond(404, { error: "The requested care service could not be found." });
    const { profile: provider, error: providerError } = await loadProfile(serviceClient, value(listing, "provider_id"));
    if (providerError || !provider) return respond(500, { error: "Could not load the caretaker's email address." });
    const range = `${value(booking, "start_date")} to ${value(booking, "end_date")}`;
    addNotice(notices, callerProfile.email, "Your PawCare care request was sent", `Your request for ${value(booking, "pet_name")} was sent to ${value(listing, "provider_name")} for ${range}.\nTrack the request here:\n${careUrl}`);
    addNotice(notices, provider.email, "New PawCare care request", `${value(booking, "owner_name")} requested ${value(listing, "service_type")} for ${value(booking, "pet_name")} (${value(booking, "pet_type")}), ${range}.\nSign in to review the request:\n${careUrl}`);
  } else if (event === "adoption_application_reviewed") {
    if (callerProfile.role !== "admin") return respond(403, { error: "Administrator access is required." });
    const { data, error } = await serviceClient.from("applications")
      .select("id, applicant_id, status, pets(name, submitted_by)")
      .eq("id", recordId)
      .maybeSingle();
    const application = asRow(data);
    if (error) return respond(500, { error: "Could not load the adoption application." });
    if (!application) return respond(404, { error: "Adoption application not found." });
    if (!["Approved", "Rejected"].includes(value(application, "status"))) return respond(409, { error: "This application has not been reviewed." });
    const { profile: applicant, error: applicantError } = await loadProfile(serviceClient, value(application, "applicant_id"));
    if (applicantError || !applicant) return respond(500, { error: "Could not load the applicant's email address." });
    const pet = asRow(application.pets);
    const status = value(application, "status");
    eventKey = `${event}:${recordId}:${status}`;
    addNotice(notices, applicant.email, `PawCare adoption application ${status.toLowerCase()}`, `Your application for ${value(pet || {}, "name") || "a pet"} was ${status.toLowerCase()}.\nView your account for details:\n${accountUrl}`);
    const petOwnerId = value(pet || {}, "submitted_by");
    if (petOwnerId && petOwnerId !== applicant.id) {
      const { profile: petOwner, error: ownerError } = await loadProfile(serviceClient, petOwnerId);
      if (ownerError || !petOwner) return respond(500, { error: "Could not load the pet caretaker's email address." });
      addNotice(notices, petOwner.email, `PawCare adoption update for ${value(pet || {}, "name") || "your pet"}`, `An adoption application for your pet was ${status.toLowerCase()}.`);
    }
  } else if (event === "pet_listing_reviewed") {
    if (callerProfile.role !== "admin") return respond(403, { error: "Administrator access is required." });
    const { data, error } = await serviceClient.from("pets")
      .select("id, name, submitted_by, submission_status")
      .eq("id", recordId)
      .maybeSingle();
    const pet = asRow(data);
    if (error) return respond(500, { error: "Could not load the pet listing." });
    if (!pet) return respond(404, { error: "Pet listing not found." });
    if (typeof pet.submitted_by !== "string") return respond(400, { error: "This pet listing was not submitted by a community user." });
    const status = value(pet, "submission_status");
    if (!["Approved", "Rejected"].includes(status)) return respond(409, { error: "This pet listing has not been reviewed." });
    const { profile: submitter, error: submitterError } = await loadProfile(serviceClient, value(pet, "submitted_by"));
    if (submitterError || !submitter) return respond(500, { error: "Could not load the submitter's email address." });
    eventKey = `${event}:${recordId}:${status}`;
    addNotice(notices, submitter.email, `PawCare pet listing ${status.toLowerCase()}`, `Your listing for ${value(pet, "name")} was ${status.toLowerCase()}.\nView your account for details:\n${accountUrl}`);
  } else if (event === "care_booking_responded" || event === "care_booking_cancelled") {
    const { data, error } = await serviceClient.from("care_bookings")
      .select("id, owner_id, owner_name, pet_name, pet_type, start_date, end_date, status, care_listings(provider_id, provider_name, service_type, location)")
      .eq("id", recordId)
      .maybeSingle();
    const booking = asRow(data);
    if (error) return respond(500, { error: "Could not load the care request." });
    if (!booking) return respond(404, { error: "Care request not found." });
    const listing = asRow(booking.care_listings);
    if (!listing) return respond(404, { error: "The related care service could not be found." });

    if (event === "care_booking_responded") {
      if (listing.provider_id !== user.id || !["Accepted", "Declined"].includes(value(booking, "status"))) {
        return respond(403, { error: "Only the caretaker can send a response notification." });
      }
      const { profile: owner, error: ownerError } = await loadProfile(serviceClient, value(booking, "owner_id"));
      if (ownerError || !owner) return respond(500, { error: "Could not load the requester's email address." });
      const status = value(booking, "status");
      eventKey = `${event}:${recordId}:${status}`;
      addNotice(notices, owner.email, `PawCare care request ${status.toLowerCase()}`, `Your request for ${value(booking, "pet_name")} was ${status.toLowerCase()} by ${value(listing, "provider_name")}.\nView the request:\n${careUrl}`);
    } else {
      if (booking.owner_id !== user.id || booking.status !== "Cancelled") {
        return respond(403, { error: "Only the requester can send a cancellation notification." });
      }
      const { profile: provider, error: providerError } = await loadProfile(serviceClient, value(listing, "provider_id"));
      if (providerError || !provider) return respond(500, { error: "Could not load the caretaker's email address." });
      addNotice(notices, provider.email, "PawCare care request cancelled", `${value(booking, "owner_name")} cancelled the request for ${value(booking, "pet_name")} (${value(booking, "pet_type")}).\nView care requests:\n${careUrl}`);
    }
  } else {
    return respond(400, { error: "Unsupported notification event." });
  }

  let deliveryFailed = false;
  let logFailed = false;
  let notificationInProgress = false;
  for (const notice of notices) {
    const recipientKey = `${eventKey}:${notice.recipient.toLowerCase()}`;
    const claim = await claimNotification(serviceClient, recipientKey, event, recordId);
    if (claim.error) {
      logFailed = true;
      continue;
    }
    if (claim.alreadySent) continue;
    if (claim.inProgress) {
      notificationInProgress = true;
      continue;
    }

    let deliveryError = "";
    try {
      const delivery = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [notice.recipient],
          subject: notice.subject,
          text: notice.text,
        }),
      });
      if (!delivery.ok) {
        deliveryError = `The email provider returned status ${delivery.status}.`;
      }
    } catch {
      deliveryError = "Could not connect to the email provider.";
    }

    if (deliveryError) {
      deliveryFailed = true;
      const finishError = await finishNotification(serviceClient, recipientKey, "failed", deliveryError);
      if (finishError) logFailed = true;
      continue;
    }

    const finishError = await finishNotification(serviceClient, recipientKey, "sent");
    if (finishError) logFailed = true;
  }

  if (logFailed) return respond(500, { error: "Some notification delivery statuses could not be recorded." });
  if (deliveryFailed) return respond(502, { error: "Some email notifications could not be delivered. Please try again." });
  if (notificationInProgress) return respond(409, { error: "Some notifications are already being delivered." });
  return respond(200, { success: "Email notifications sent." });
});
