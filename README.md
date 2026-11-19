# Ameen · أمين

Facility management for residential compounds in Saudi Arabia: daily cleaning,
periodic inspection, regular maintenance, repairs on request, and monthly
payment collection with WhatsApp reminders.

One web app, four portals, one database:

| Portal | Path | Who |
| --- | --- | --- |
| Tenant | `/tenant` | Report an issue with photos, follow it, rate it, see and pay monthly bills |
| Field worker | `/worker` | Today's jobs, start, checklist, before and after photos, finish, flag a problem |
| Owner (client) | `/client` | Approve or send back finished work, open and overdue jobs, monthly report, collections |
| Ameen team | `/admin` | Assign jobs, recurring schedules, bills and reminders, setup, website leads |

Also: the public landing page with free-inspection booking (`/`, built to `docs/landing-page/`), privacy and terms pages (`/privacy`, `/terms`), phone sign-in
with a one-time code (`/login`), and the tenant payment page (`/pay/<token>`).

## Run it locally

```bash
npm install
cp .env.example .env
npm run db:push     # create the SQLite database
npm run db:seed     # sample data: Yasmin Compound, Rawdah Residence
npm run dev         # http://localhost:3000
```

Sign in with these sample numbers. In test mode the one-time code is shown on screen.

| Number | Role |
| --- | --- |
| 0500000001 | Ameen team (admin) |
| 0500000002 | Owner, Yasmin Real Estate |
| 0500000003 | Tenant, Sara, Apt 12 (Arabic) |
| 0500000005 | Tenant, Mohammed, Apt 7 (English) |
| 0500000004 | Worker, Imran, cleaning (English) |
| 0500000006 | Worker, Ahmed, maintenance |

All money amounts in the sample data are placeholders.

## How the main flows work

**Jobs.** A job comes from a tenant or owner request, an admin, or a recurring
schedule. Admin assigns a worker and a time. The worker starts, completes the
checklist, adds before and after photos (at least one after photo is required)
and finishes. The owner approves, or sends it back with a reason, which reopens
it. A failed item on an inspection creates a repair job automatically. Requests
not started within 4 hours show as overdue to admin and owner.

**Payments.** Each unit has a monthly rent, service charge and Ameen fee. One
bill per unit per month keeps owner money (rent, service charge) and Ameen money
(fee, paid repairs) on separate lines, while the tenant gets one link for the
total. Reminders go on WhatsApp 3 days before the due date, on the due date,
3 days after, then weekly until paid. A confirmed payment marks the bill paid
and stops the reminders.

**Daily job.** `GET /api/cron/daily` (with `Authorization: Bearer $CRON_SECRET`)
creates today's scheduled jobs, creates the month's bills, and sends due
reminders. Run it once a day, for example 8:00 Riyadh time.

## Languages

Arabic (default, right to left) and English (left to right) on every screen.
All text lives in `src/i18n/ar.json` and `src/i18n/en.json`. To add Urdu or
Bengali: add `ur.json` or `bn.json` with the same keys, add one line to
`src/i18n/config.ts`, and run `npm run i18n:check`. Layouts use logical CSS
(`ms-`, `pe-`, `start`, `end`) so they flip with the language.

## Going live checklist

- [ ] PostgreSQL in a Saudi cloud region (PDPL); switch `provider` in `prisma/schema.prisma`
- [ ] Photo storage: replace `saveFile` in `src/lib/storage.ts` with a Saudi-region object store
- [ ] SMS provider for sign-in codes (`sendOtp` in `src/lib/messaging.ts`)
- [ ] Meta WhatsApp Business verification and an approved `payment_reminder` template
- [ ] Payment gateway merchant account (Moyasar is wired in; set `PAYMENT_GATEWAY=moyasar`)
- [ ] Decide where collected owner money settles (check with an accountant)
- [ ] Schedule the daily job and set `CRON_SECRET`
- [ ] Set `MESSAGING_MODE=live` so codes are no longer shown on screen

## Stack

Next.js 15 (app router, server actions), TypeScript, Tailwind CSS 4, Prisma,
SQLite for development and PostgreSQL for production, installable as a PWA.

## Host a demo (Railway)

The repo includes a `Dockerfile` and `railway.json`. Data (the SQLite database
and uploaded photos) lives on a volume at `/data`, and demo data is added on
the first start only.

1. On railway.com, sign in with GitHub, then **New Project → Deploy from GitHub repo → engalimj/Ameen**.
2. Right-click the service → **Attach volume**, mount path `/data`.
3. In **Variables**, add:
   - `SEED_DEMO=true`
   - `MESSAGING_MODE=console` (shows sign-in codes on screen, for demos only)
   - `ALLOW_MOCK_PAYMENTS=true` (test checkout, no real money)
   - `CRON_SECRET=<any long random text>`
   - `APP_URL=https://<your domain>` (fill in after step 4)
4. **Settings → Networking → Generate domain**, then set `APP_URL` to it.

Because sign-in codes show on screen in demo mode, don't put real tenant data
on the demo. For the live version, move to PostgreSQL in a Saudi region and
turn off `MESSAGING_MODE=console` and `ALLOW_MOCK_PAYMENTS`.
