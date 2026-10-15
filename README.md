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

## Access (demo mode)
There is no login. A "Viewing as" switcher in the header lets you view the CRM as Admin or as any
team member (telecallers, sales executives, team leader, CRM, finance, MIS, sourcing). Telecallers
and sales executives see only their own leads and visits; Admin, MIS Head and Team Leader see the team.

**Security note:** the database accepts reads/writes from anyone with the site URL (anon RLS policies
`demo_anon_*`). Use sample data only. Before real customer data goes in, restore sign-in and drop the
`demo_anon_*` policies.

## Demo scenarios in the seed data
- Rajesh Kumar — high performer, heavy load, today's visits fixed
- Sneha Reddy — balanced pipeline, some dead leads after 6 attempts
- Pooja Nair — new joiner, untouched leads breaching the 15-minute SLA
- Arjun Mehta — multiple overdue follow-ups (incl. hot leads)
- Kavita Joshi — inactive (on leave) with orphaned leads needing reassignment
- Priya Sharma — top closer (3 bookings incl. fully paid)
- Vikram Singh — visits today, a no-show, booking in documentation
- Rohit Desai — cancellations and a "not interested" visit, zero bookings
- Neha Kapoor — blocked unit expiring today, agreement pending
- Unassigned leads, CP bulk-upload leads and a duplicate-mobile lead in the Lead Pool
