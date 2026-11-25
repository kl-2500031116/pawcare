# PawCare

PawCare is a React pet-adoption and pet-care marketplace built for a hackathon. Visitors can browse and filter pets by location, animal type, and gender; verified users can submit adoption applications, post pets for adoption, and request or offer pet-care services. Administrators review community listings and adoption applications.

The app uses Supabase for authentication, PostgreSQL, storage, and server-side email notifications. Resend is used by a Supabase Edge Function for form and care-request notifications. The static frontend can be deployed to InfinityFree; no Node.js backend is required there.

## Features

- Responsive pet catalog with location, type, and gender filters.
- Email-verified sign-up, account profiles, and role-protected admin tools.
- Adoption applications and moderated community pet listings with photo uploads.
- Pet-care service listings, location/type filters, and care requests with accept, decline, and cancellation flows.
- Email notifications for form submissions and status changes.
- Supabase SQL schema, existing-project migrations, and starter pet/care datasets.

## Start the project manually on Windows

Requirements: Node.js 22.13 or newer and npm.

1. Open PowerShell in the project root (the folder containing `package.json`).
2. Install dependencies and create `.env` if it does not already exist:

   ```powershell
   npm install
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

3. Open `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These are public frontend settings; never put the Supabase service-role key, Resend API key, or SMTP password in `.env` or frontend code.
4. Start the development server:

   ```powershell
   npm run dev
   ```

5. Open the local URL printed by Vite (usually `http://localhost:5173`) in your browser. Keep the terminal open while using the site; press `Ctrl+C` there to stop it.

Without the Supabase URL and public anon/publishable key, the app reports a configuration error instead of storing accounts in browser storage.

## Configure and deploy

Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to create the database, apply migrations, configure Auth and Resend email, load the care catalog, promote the first administrator, and deploy the Edge Functions. The live Supabase project must be configured separately; no credentials are included in this repository.

Build the static site after setting its Supabase URL and public anon/publishable key:

```sh
npm run build
```

Upload the contents of `dist/` to InfinityFree's `htdocs` directory. The included `.htaccess` supports React Router deep links. Do not upload `.env` or expose server-side secrets.

## Routes

- `/` - home page
- `/pets` and `/pets/:id` - searchable catalog and pet details
- `/care` - caretaker listings and care requests
- `/login` and `/register` - sign-in and email-verified registration
- `/apply?pet=<id>` - adoption application (requires sign-in)
- `/list-pet` - community adoption listing form
- `/account` - profile and application history
- `/admin` - pet, application, and account management

Run `npm test` for local validation and `npm run build` to create the static deployment bundle. Presentation files are included as `PawCare-Project-Review.pptx` and `PawCare-Project-Review-6-slides.pptx`.
