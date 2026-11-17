# Aflax Electrical College — Website, E-learning & Admin

Next.js 14 (App Router) · TypeScript · Tailwind · **PostgreSQL** · own session auth (bcrypt) · uploads on disk.

Public site (Home, About, Courses, Documentation), student accounts, and a separate admin dashboard for
courses + videos, PDF books, daily lessons, categories and students. Everything is backed by a real database.

---------------------------------------------------------------------------------------------------

## 1. What was wrong with the original ZIP (and what changed)

I reviewed the original Next.js + Supabase project by reading the code. I did **not** have access to your Supabase
project, so I could not reproduce the exact error you saw; these are the problems the code itself had:

| Problem in the original | Fix |
|---|---|
| No tables for course videos, thumbnails, PDF books or daily lessons | New schema: `courses`, `course_videos`, `documents`, `daily_lessons`, `lesson_attachments`, `files`, `categories` |
| Admin actions were server actions that **ignored database errors**, so a failed insert looked like "the button does nothing" (e.g. a `content_manager` was blocked by row-level-security on `courses`) | Every action is an API endpoint that validates input and reports real errors |
| Course videos impossible: 50 MB server-action limit, whole file buffered in memory, Supabase free storage cap 50 MB | Streaming upload straight to disk (tested with 200 MB at flat memory), limit configurable (default 500 MB) |
| The only way to become admin was running a hand-edited SQL line | `npm run admin:create` seeds the first admin; public registration can only ever create students |
| Registration depended on Supabase e-mail confirmation + a trigger on `auth.users`; `profiles` could silently be missing | One `users` table; registration writes it directly in the same request |
| Security lived only in RLS policies; no server-side upload type check | Role checks on every API route and admin page, magic-byte file validation, private file delivery |

The framework (Next.js/TypeScript/Tailwind), the colour scheme, the course categories, enrolments and the
student dashboard from the original are kept. Supabase Auth/Storage/RLS were replaced by plain PostgreSQL + the
code in this repo. **You can still host the database on Supabase** — just use its Postgres connection string as
`DATABASE_URL` (see below) — but you no longer need Supabase Auth or Storage.
The original SQL is kept in `legacy/supabase-schema.sql` for reference.

## 2. Requirements

* Node.js **20.12+**
* PostgreSQL **13+** (local, or hosted: Supabase, Neon, Railway, Render, your own VPS…)
* A disk that survives restarts for uploaded files (`UPLOAD_DIR`)

## 3. Install & run locally

```bash
npm install
cp .env.example .env.local          # then edit DATABASE_URL etc.
npm run db:migrate                  # creates all tables (safe to re-run)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='Strong#Pass1' ADMIN_NAME='Your Name' npm run admin:create
npm run dev                         # http://localhost:3000
```

Local Postgres example (Linux/macOS):
```bash
createuser --pwprompt aflax && createdb -O aflax aflax
# DATABASE_URL=postgres://aflax:YOUR_PASSWORD@localhost:5432/aflax
```
Hosted Postgres: copy its connection string into `DATABASE_URL` and set `DATABASE_SSL=true`.
(On Supabase use *Project Settings → Database → Connection string*, the **direct** or **session pooler** one.)

### First administrator
`npm run admin:create` reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` (8+ chars, upper+lower+number) and `ADMIN_NAME` from the
environment. Run it again with a different e-mail to add more admins, or with an existing student's e-mail to
promote them. Remove the `ADMIN_*` values from your env files afterwards. There is **no** admin signup page.
Then log in at `/login` — admins land on `/admin`.

## 4. Environment variables (`.env.example`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (**required**) |
| `DATABASE_SSL` | `true` for hosted databases that require SSL |
| `APP_URL` | Public URL. If it starts with `https://`, cookies get the `Secure` flag |
| `UPLOAD_DIR` | Where uploaded files are stored (default `./storage`) — must be persistent and **backed up** |
| `MAX_VIDEO_MB` / `MAX_PDF_MB` / `MAX_IMAGE_MB` / `MAX_ATTACHMENT_MB` | Upload limits (500 / 50 / 5 / 25) |
| `NEXT_PUBLIC_CONTACT_EMAIL`, `_PHONE`, `_ADDRESS` | Optional; shown in the footer only when set |

No secrets are in front-end code. `.env*` and `storage/` are git-ignored.

## 5. Using the admin dashboard (`/admin`)

* **Overview** – student / course / published / document / lesson counts.
* **Courses** – create/edit/delete, thumbnail upload, any number of videos (upload MP4/M4V/WebM/OGV, or paste a
  YouTube / Vimeo / direct-video link), draft ⇄ published toggle.
* **Books & Documents** – upload PDFs, title, description, category, "allow download", publish/unpublish.
* **Daily Lessons** – write lessons (simple formatting: `# heading`, `- list`, `**bold**`, links), category,
  publication date, optional attachments, draft/published. Future-dated lessons stay hidden until their date.
* **Students** – search, details, activate/deactivate (deactivation logs them out immediately), delete.
* **Categories** – manage course / document / lesson categories.
* **My Profile** – change name and password.

Students can browse courses, documents and lesson lists without an account, but **watching videos, reading
PDFs/lessons and downloading** require login. (Change this in `app/media/[id]/route.ts` if you prefer otherwise.)

## 6. Database

`db/migrations/*.sql` are applied in order by `npm run db:migrate` and recorded in `schema_migrations`.
Tables: `users` (role `student|admin`), `sessions`, `categories`, `files`, `courses`, `course_videos`,
`documents`, `daily_lessons`, `lesson_attachments`, `enrollments` — with primary/foreign keys, unique
constraints, CHECK constraints, timestamps and indexes. Only reference data (category names) is seeded; there are
no fake courses. To change the schema later, add `002_….sql`; never edit an applied migration.

**Existing data:** the original project was a starter blueprint; its tables lived in a Supabase project this repo
cannot see. Nothing is migrated automatically. If you had real data there, export it from Supabase and tell me —
the old password hashes are bcrypt and could be imported into `users.password_hash`.

## 7. Security summary

bcrypt (cost 12) password hashes · random 256-bit session tokens, only a SHA-256 stored in DB · `HttpOnly`,
`SameSite=Lax` (+`Secure` on https) cookies · 7-day student / 8-hour admin sessions · role checks on every
admin API route **and** admin page · Origin check on state-changing requests · login throttling · parameterised
SQL only · zod validation on every input · uploads: extension allow-list, magic-byte check, size limits, random
stored names, files kept outside `public/` and served only after a per-request permission check · lesson text is
escaped (no raw HTML) · security headers.

## 8. Deploying

Because uploads are stored on disk, use a host with a **persistent disk** (a VPS, Railway/Render with a volume,
Fly.io volume). Serverless hosts such as Vercel are *not* suitable for the upload storage as-is.

VPS example:
```bash
npm ci && npm run build
npm run db:migrate && npm run admin:create      # once
npm i -g pm2 && pm2 start "npm start" --name aflax && pm2 save
```
Put nginx/Caddy in front for HTTPS and **raise the body limit** (nginx: `client_max_body_size 520m;` and
`proxy_request_buffering off;`). Set `APP_URL=https://your-domain`. Back up both the database (`pg_dump`) and
`UPLOAD_DIR` regularly — they belong together.

## 9. Tests

`tests/e2e.mjs` drives the running app over HTTP against a real PostgreSQL (registration, auth, role
protection, every admin CRUD + upload, publishing rules, file access control, Range streaming, cleanup of files).
```bash
./tests/reset.sh            # WIPES the test DB named in .env.local — never point at real data
npm run build && npm start -- -p 3100 &
BASE=http://localhost:3100 node tests/e2e.mjs      # then restart the server and run: node tests/persist.mjs
```

## 10. Known limitations

* No e-mail verification or "forgot password" yet (needs an e-mail provider; an admin can't reset a student's password either — planned next).
* Login throttling is in-memory (per server process).
* "Disable download" hides the button and blocks the download URL, but a student can still save what they can read on screen.
* The About page text is general; add official details (founding year, accreditation, address) in `app/about/page.tsx` and the contact env vars.
* The original blueprint's later phases (quizzes, assignments, certificates, Somali translation, notifications) are not built.
