# Supabase, email OTP, and InfinityFree setup

PawCare is a static React frontend connected directly to Supabase. Supabase handles authentication and PostgreSQL; InfinityFree only serves the built files. SMTP credentials and the Supabase service-role key must never be included in the frontend.

## 1. Create and configure Supabase

When filling out the **Create a new project** form, use these settings:

- **Organization:** `max.aiFree`.
- **Project name:** `pawcare` (or `pawcare-prod` if you want to distinguish production).
- **Database password:** generate a unique, strong password and save it in a password manager. It is for direct database administration—not the website—and must not go in frontend code or `.env`.
- **Region:** choose the region nearest to the people who will use the site. If most users are in India, choose Mumbai if available; otherwise use **Auto** or the nearest Asia-Pacific region.
- **Enable Data API:** on. PawCare's frontend uses Supabase's generated API.
- **Grant API access to new tables automatically:** off. The schema below explicitly grants the required access; keeping this off avoids exposing future tables by default.
- **Enable RLS on new tables automatically:** on. The supplied schema also enables RLS and defines policies for its tables.
- **Postgres type:** **Postgres** (the default), not the OrioleDB beta.
- **GitHub:** optional; skip it for now unless you specifically want Supabase linked to a repository.

Create the project and wait until its database is ready. Then:

1. In **SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql). This creates the tables, row-level security policies, profile trigger, review RPC, sample pet records, and public pet-photo bucket with authenticated uploads.
2. If the project already had the original PawCare schema, also run [`supabase/adoption_documents_migration.sql`](./supabase/adoption_documents_migration.sql). It adds the acknowledgement and review-date fields needed by the document workflow. It is safe to run after the updated schema as well.
3. If the project already has PawCare's schema, run [`supabase/pet_listings_migration.sql`](./supabase/pet_listings_migration.sql). It adds moderated community pet listings and restricts applications to approved listings. It is safe to run after the updated schema as well.
4. For an existing PawCare project, run [`supabase/pet_photo_storage_migration.sql`](./supabase/pet_photo_storage_migration.sql) before enabling photo uploads. It creates the public `pet-photos` bucket (5 MB maximum; JPG, PNG, and WebP) and restricts uploads to each signed-in user's folder. Uploaded photos are public, so submit only images you have permission to share.
5. For an existing PawCare project, run [`supabase/pet_care_migration.sql`](./supabase/pet_care_migration.sql) before deploying the pet-care page. It adds public caretaker listings, private booking requests, row-level security, and secure accept/decline/cancel functions. Caretakers must explicitly agree before their phone number is shown on a public listing.
6. For an existing PawCare project, run [`supabase/email_notifications_migration.sql`](./supabase/email_notifications_migration.sql) before deploying the email notification function. It creates the service-role-only delivery log used to prevent duplicate emails and retry failed deliveries.
7. For an existing PawCare project, run [`supabase/pet_demo_data_migration.sql`](./supabase/pet_demo_data_migration.sql), then run [`supabase/pet_demo_seed.sql`](./supabase/pet_demo_seed.sql) to load 36 varied hackathon catalog entries. They appear as regular available listings; vaccination and health notes ask adopters to confirm details with the caretaker.
8. To update an existing 44-pet catalog to the bundled photos, run [`supabase/pet_images_migration.sql`](./supabase/pet_images_migration.sql) after the schema and seed scripts. The matching photo files are in `public/pets/`; include them in the InfinityFree upload.
9. Copy the project URL and its public anon/publishable key from **Project Settings → API**.
10. Copy `.env.example` to `.env`, then set:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
   ```

   These two values are public client configuration. Database row-level security is what protects data. Never use a `service_role` key in a `VITE_` variable.

11. In **Authentication → URL Configuration**, set the Site URL to the deployed HTTPS site, and add the deployed URL plus `http://localhost:5173/**` to the allowed redirect URLs.
12. In **Authentication → Sign In / Providers → Email**, keep email confirmation enabled.
13. In **Authentication → Email Templates**, make both the signup confirmation and password recovery templates deliver the numeric token. For example:

   ```html
   <h2>Verify your PawCare account</h2>
   <p>Your six-digit verification code is <strong>{{ .Token }}</strong>.</p>
   <p>If you did not request this code, you can ignore this message.</p>
   ```

   Use the same `{{ .Token }}` approach for the **Reset Password** template. PawCare asks users to enter these codes in the site; the default confirmation-link template will not match that flow. Keep the token expiration at a short duration in the Auth provider settings.

## 2. Configure Gmail SMTP in Supabase

Supabase's default email sender is for testing: it only sends to project team addresses and has a low hourly limit. Configure a custom SMTP provider before testing with other email addresses.

1. Enable 2-Step Verification on the Gmail account that will send PawCare mail, then create a Google **App Password** for mail. Use the generated app password, not the normal Gmail password. If Google Workspace policy blocks app passwords, use a transactional SMTP provider instead. See Google's [App Password requirements](https://support.google.com/accounts/answer/185833?hl=en).
2. In **Supabase → Authentication → SMTP Settings**, enable custom SMTP and enter:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: the full Gmail address
   - Password: the Google App Password
   - Sender email: the same Gmail address
   - Sender name: `PawCare`
   - Encryption: STARTTLS (port 587; not implicit SSL on port 465)
3. Save these values only in Supabase's dashboard. Do not send them in chat, add them to `.env`, or place them in frontend code. Supabase sends the emails from its hosted Auth service; InfinityFree does not need the Gmail password.

Supabase currently applies an initial limit of 30 messages per hour to projects using custom SMTP; Gmail also has sending limits. Test signup and reset emails before sharing the site, and consider a transactional email service if delivery volume or deliverability becomes important.

InfinityFree permits external SMTP connections on port 587 with STARTTLS, but this deployment does not send SMTP from InfinityFree: Supabase's hosted Auth service sends the messages.

## 3. Configure PawCare form and care notifications

Signup verification and password-recovery messages continue to use Supabase Auth's SMTP settings above. Notifications for adoption applications, community pet listings, caretaker services, care requests, decisions, cancellations, and profile updates are sent by a Supabase Edge Function through Resend.

1. Create a Resend account, verify a domain you control, and choose a sender address on that verified domain. Do not use a sender address you do not control.
2. Set the function secrets from a terminal linked to the Supabase project:

   ```sh
   supabase secrets set RESEND_API_KEY=re_your_key RESEND_FROM_EMAIL="PawCare <notifications@yourdomain.com>" SITE_URL=https://paw-care.ct.ws
   ```

   Replace the example key, sender, and site URL with your own values. These are server-side secrets; never add them to `.env`, frontend code, or the InfinityFree upload.
3. Deploy the function:

   ```sh
   supabase functions deploy send-notification-email
   ```

The function verifies the signed-in user and checks that the user or administrator is authorized for each record before sending. New adoption applications, pet listings, and care services notify the submitter and administrators; care requests notify both requester and caretaker; accept/decline, cancellation, and review decisions notify the affected person. The database delivery log tracks each recipient separately so retries do not resend emails that were already delivered.

## 4. Create the first administrator

1. Register through PawCare and verify the email code.
2. In the Supabase SQL Editor, promote that verified account:

   ```sql
   update public.profiles
   set role = 'admin'
   where lower(email) = lower('YOUR_ACCOUNT_EMAIL');
   ```

3. Sign out and sign back in so the app reloads the updated profile. New registrations are always adopters; role changes are limited to administrators, and the database protects the last administrator.
4. To load the starter care catalog, run [`supabase/pet_care_seed.sql`](./supabase/pet_care_seed.sql) in SQL Editor after the care migration and admin setup. It adds 36 curated local services across locations, care types, and animal types. The PawCare admin account manages these requests; no personal phone numbers are invented or published.

## Adoption document prototype

Applicants can print or save their application and house-check forms as PDFs. Administrators can print an adoption record after approval. This flow records a typed acknowledgement and does not collect ID scans or handwritten signatures. Coordinate any additional paperwork required by the responsible animal-welfare organization separately.

## 5. Deploy the protected account-deletion function

Account deletion uses a Supabase Edge Function because deleting Auth users requires a server-side service-role key.

1. Install the Supabase CLI and link this folder to your project:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_ID
   ```

2. Deploy the function:

   ```sh
   supabase functions deploy admin-delete-user
   ```

   Supabase supplies the function's service-role environment value. If your project setup requires manually configuring function secrets, add it through Supabase's CLI/dashboard secrets manager only—never in this repository or frontend.

## 6. Build and upload to InfinityFree

Build after setting `.env`, because Vite embeds the public Supabase URL/key in the static bundle:

```sh
npm install
npm run build
```

Upload the **contents** of `dist/` (including `.htaccess`) into InfinityFree's `htdocs` directory. The rewrite rule supports direct visits to React routes such as `/pets` and `/login`. Keep `.env` out of the upload.

InfinityFree's free hosting advertises PHP and MySQL, not a Node.js process runtime, so the existing Express API is not the deployed backend. With this setup it is Supabase—not InfinityFree—that stores account and adoption data and sends verification/recovery emails.

## Local checks

```sh
npm run dev
npm test
npm run build
```

Real email delivery and database operations can only be end-to-end tested after the Supabase project, SMTP settings, and frontend environment values are configured.

## References

- [InfinityFree hosting features](https://www.infinityfree.com/)
- [InfinityFree: outbound connections and allowed SMTP port](https://forum.infinityfree.com/t/can-i-connect-to-other-servers-from-my-website-sockets-curl-and-apis/49348)
- [Google: create and use App Passwords](https://support.google.com/accounts/answer/185833?hl=en)
- [Supabase: custom SMTP setup and limits](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase: email OTP configuration](https://supabase.com/docs/guides/auth/auth-email-passwordless)
