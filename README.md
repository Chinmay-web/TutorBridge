# TutorBridge

TutorBridge — a lightweight nonprofit tutoring coordination platform that connects K–12 students with volunteer tutors.

## Problem
Many schools and community groups lack a simple, low-friction system for collecting student tutoring requests and coordinating volunteer tutors. TutorBridge provides a minimal, privacy-respecting workflow to collect requests and applications, let program coordinators review volunteers, and match students to approved tutors.

## Key features
- Public student request form (anonymous insert)
- Public volunteer tutor application form (anonymous insert)
- Authentication for coordinators via Supabase Auth
- Coordinator dashboard to review tutors, approve/reject volunteers, and match students
- Matching recommendations based on subject compatibility and overlapping availability (same timezone)
- Persistent assignments stored in Supabase (`assignments`) with coordinator attribution
- Row-Level Security (RLS) enforced in the database for least-privilege access

## Student tutoring-request workflow
- A student (or guardian/teacher) fills out the public request form with contact info, subject, grade level, availability, and optional notes.
- The form submits anonymously to the `student_requests` table using the publishable Supabase client.
- Requests are visible to authenticated coordinators in the dashboard after review and assignment.

## Volunteer tutor application workflow
- Volunteers fill out a public application form including subjects, bio, and availability.
- Applications are inserted anonymously into the `tutors` table.
- Coordinators review applications in the dashboard and can `Approve` or `Reject` each tutor.
- Approved tutors have `status = 'accepted'` and are considered eligible for matching.

## Authenticated coordinator dashboard
- Coordinators sign in via Supabase Auth.
- The dashboard enforces coordinator-only access and checks the `coordinators` table for `is_active` status before loading private data.
- Coordinators can review requests, view recommended tutors, approve/reject tutors, and create assignments.

## Tutor approval / rejection
- Coordinators can mark tutor applications as `accepted` or `rejected` from the dashboard.
- Approve/Reject updates are persisted to the `tutors` table using the authenticated Supabase client.

## Matching (recommendations)
- For each pending student request, the app recommends tutors that satisfy:
  - `tutor.status === 'accepted'`
  - `request.subject` is included in the tutor's `subjects`
  - At least one overlapping availability slot where `day`, `startTime`, `endTime`, and `timezone` match and time ranges overlap
- Recommendations are ranked by subject match and number of overlapping slots.
- The `Assign` action creates an `assignments` row and updates the `student_requests.status` to `assigned` (persisted to Supabase).
# TutorBridge

TutorBridge — a lightweight tutoring coordination platform prototype that connects K–12 students with volunteer tutors.

## Live Demo

[View the live TutorBridge application](https://tutor-bridge-six.vercel.app/)

One-line: A small full‑stack app for collecting tutoring requests and coordinating volunteer tutors via a Supabase backend.

How it works

Student Request → Tutor Application → Coordinator Review → Matching → Assignment

The problem

Many small community programs need an easy way to collect tutoring requests and coordinate volunteer tutors without heavy admin overhead. TutorBridge demonstrates a minimal, privacy‑minded workflow to collect requests/applications and let coordinators approve tutors and assign matches.

Key features

- Public student request and tutor application forms (anonymous inserts)
- Coordinator authentication and dashboard for reviewing applications
- Approve / Reject workflow for tutors
- Matching recommendations based on subject compatibility and overlapping availability (same timezone)
- Persistent assignments recorded in Supabase with coordinator attribution

Tech stack

- Frontend: React + TypeScript (Vite)
- Styling: Tailwind CSS
- Backend / Data: Supabase (Postgres, Auth, RLS)
- Deployment: Vercel (frontend)
- Supabase client: `@supabase/supabase-js`

Architecture (high level)

- Frontend (Vite) runs in the browser and uses the publishable Supabase key for public form inserts to `student_requests` and `tutors`.
- Coordinators sign in with Supabase Auth; authenticated requests use the user's session to read protected data and perform coordinator actions.
- Row-Level Security (RLS) policies restrict which authenticated roles can read, update, or delete coordinator-only data; public users may only INSERT into the submission tables and cannot read/update/delete those records.
- Assignments are written by authenticated coordinators and include `assigned_by` (the coordinator's user id).

Database overview (tables)

- `student_requests` — incoming tutoring requests (contact, subject, grade, availability JSONB, notes, status, created_at)
- `tutors` — volunteer applications (contact, subjects array, availability JSONB, bio, status, created_at)
- `coordinators` — coordinator records (`user_id`, `email`, `is_active`) used to gate dashboard access
- `assignments` — records pairing of `request_id` and `tutor_id`, who created it (`assigned_by`), and timestamps

Security

- Public forms submit anonymously using the publishable Supabase key; those anonymous clients only perform INSERT operations into the submission tables. They cannot read, update, or delete those records.
- Coordinator features require authentication; the frontend verifies the signed‑in user and `coordinators.is_active` before loading private data.
- Assignment inserts include the coordinator's user id so `assigned_by` is recorded on creation.

Local development

1. Install dependencies

```bash
pnpm install
```

2. Create `.env.local` with these variables (never commit keys):

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-publishable-key>
```

3. Run the dev server

```bash
pnpm dev
```

Required environment variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Screenshots (placeholders)

1. Landing page — add screenshot
2. Coordinator dashboard — add screenshot
3. Tutor matching panel — add screenshot

Future improvements

1. Move matching and assignment logic into server-side Postgres functions or edge server endpoints for atomicity and simplified client code.
2. Add email/notification workflow for tutors and students upon assignment.
3. Improve availability handling with timezone normalization and expanded cross-timezone matching.
4. Coordinator productivity features: pagination, bulk review, and audit logs.

License

This repository is provided as a student project example. No production support or real-world adoption is claimed.
