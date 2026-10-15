# Builder CRM — GENXA

Real estate lead-to-possession CRM (21 modules), built from the Figma Make design
"Builder CRM" and backed by Supabase.

## Stack
- React 18 + Vite 6 + Tailwind CSS 4
- Supabase (Postgres, Auth, Realtime) — project `genxa-buildercrm` (ap-south-1, Mumbai)
- Hosted on Vercel (project `genxa.buildercrm`)

## Environment variables
| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://tvrveybyoiqtikbycgzl.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable key from Supabase → Project Settings → API Keys |

Copy `.env.example` to `.env.local` for local development.

## Run locally
```bash
npm install
npm run dev
```

## Data layer
`src/app/lib/dataStore.ts` loads all CRM tables into memory after sign-in, writes every
change through to Supabase, and listens to Supabase Realtime so multiple users stay in sync.

Database tables (all protected by RLS — signed-in staff only):
`projects`, `team_members`, `lead_sources`, `leads`, `site_visits`, `bookings`,
`channel_partners`, `blocked_units`.

Modules saved to the database: Master Setup (projects, users, sources), Lead Capture,
Lead Pool, Telecaller dashboard, Site Visits, Bookings (incl. unit blocking/availability),
Channel Partners. The remaining modules (Agreements, Loans, Payments, Inventory,
Documentation, Possession, Cancellations, Support, Notifications, Reports, Finance,
Management/CRM dashboards) still show the sample data from the Figma design.

## Users
Staff sign in with email + password (Supabase Auth). Add users in the Supabase dashboard →
Authentication → Users → "Add user".
