# Notely — Your notes. Done neatly.

A premium marketplace for **student note-writing and note-preparation services**.
Students who missed classes post note requests (subject, source material, pages,
handwriting style, deadline, budget); Note Writers submit offers; the student
picks a writer by handwriting samples, ratings and on-time record; payment is
held until the student approves the delivered notes.

> Notely is for note writing, copying, preparation, organization and
> digitization of study material. It is **not** a service for completing
> graded examinations or assessments on a student's behalf.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (zero-config database, `prisma/dev.db`)
- Cookie-session auth (jose JWT + bcryptjs)
- Razorpay-ready payments — runs in a labelled **mock mode** until real keys
  are added to `.env`

## Run it

```bash
npm install
npm run setup     # prisma generate + db push + seed
npm run dev       # http://localhost:3000
```

`npm run setup` creates a **clean database** — it wipes all data and seeds
only the `PlatformConfig` defaults (platform fee, offer limits, subscription
price/trial). There are no demo accounts: register your own student/writer
accounts at `/register`.

The admin panel lives at `/admin/login`. It uses separate env credentials —
set `ADMIN_EMAIL` and `ADMIN_PASSCODE` in `.env` (see `.env.example`).

## Key flows

1. Student posts a request via the 6-step wizard at `/requests/new`.
2. Writers see it on `/find-work` and submit offers (total or ₹/page).
3. Student compares offers (ratings, handwriting samples, stats) and accepts.
4. Student pays (Razorpay, or mock mode in dev) → order is `FUNDED`.
5. Writer starts, posts page-by-page progress updates with photos.
6. Writer submits the completed notes → student reviews → approves.
7. Writer's earning becomes eligible; platform fee (configurable in the
   `PlatformConfig` table, default 10%) is deducted.

Order status transitions are enforced server-side by a state machine
(`src/lib/order-machine.ts`) — the frontend calls intent endpoints only.

## Configuration

Platform fees and offer limits live in the `PlatformConfig` table
(never hardcoded). To enable real Razorpay payments, set
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
in `.env` (see `.env.example`).
