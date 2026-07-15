# ClassPay

A tuition fee tracker built for a single-admin coaching business — one teacher (or one admin) manages students, payments, and WhatsApp reminders from a phone, installed as a PWA.

This document explains **how the app actually works**: the scheduling logic, the data model, the user flow, and where to make common changes. If you're picking this project back up after a break, start here.

---

## 1. The core idea: pay-upfront, joining-date-anchored scheduling

This is the single most important rule in the whole app, and it drives almost everything else:

> **A student's due date is always derived from their joining date + how many months they've paid for. Nothing else can move it** — not payment date, not how late they paid, not individual circumstances. The only thing allowed to shift it is a declared institute-wide holiday.

### Why "pay-upfront"

The fee for a given month is due **before** that month is taught, not after it's completed. If a student joins March 6th, their first payment is due **March 6th** — pay first, then get taught. Once that's paid, the next payment is due April 6th, and so on. This was a deliberate policy change (the app originally worked the other way — bill after teaching a month — which was causing chronic overdue problems).

### The formula

Every due date in the app is computed by one function: `computeScheduleDueDate()` in `src/lib/utils.ts`:

```
nextDueDate = joiningDate + totalMonthsPaid calendar months + holidayOffsetDays
```

- **`joiningDate`** — fixed at student creation, never changes (unless manually corrected).
- **`totalMonthsPaid`** — a running counter on the student record. Every payment adds however many months it covered. This is *not* a date, just a count — which is what makes the formula immune to drift.
- **`holidayOffsetDays`** — see section 3.

Calendar months are added properly (via `addMonthsClamped`), not as a flat "+30 days" — so a student joining Jan 31st correctly cycles through Feb 28, Mar 31, Apr 30, etc., without slowly drifting off their actual joining date the way naive day-counting would.

**This formula is recalculated fresh every time**, never incrementally shifted off a previous value. That's intentional — it means the schedule can never accumulate rounding error, and if you ever need to fix the formula itself (like the pay-upfront change), the **"🔄 Recalculate All Due Dates"** button at the bottom of the dashboard re-runs it for every student in one click, using their existing `joiningDate` + `totalMonthsPaid` — no data loss, no manual per-student fixing.

---

## 2. Recording a payment: how months and money are reconciled

When you tap **+ Add Payment** on a student's profile, you only enter **Amount Paid** and **Payment Date** — nothing else. The app works out the rest in `src/lib/payments.ts` (`recordPayment`):

1. **Months covered** = `amountPaid ÷ monthlyFee`, rounded to the nearest whole month (minimum 1). This is deliberately approximate — the schedule only moves in whole-month steps.
2. **`totalMonthsPaid`** increases by that many months, and the due date is recalculated from the formula above.
3. **The leftover** — the gap between what was actually paid and what that rounded number of months is "worth" — is **not thrown away**. It's added to (or subtracted from) `balanceAdjustment`, a running number on the student record:
   - Paid *less* than the rounded months are worth → `balanceAdjustment` goes **up** (still owed).
   - Paid *more* → `balanceAdjustment` goes **down** (credit toward the future).

This is why the app can handle uneven, real-world payments correctly. Example: a student on ₹1,500/month pays ₹5,500 when 4 months (₹6,000) were actually owed. The app rounds 5500÷1500 ≈ 3.67 → **4 months**, advances the schedule as if fully caught up, but records **+₹500** in `balanceAdjustment` so the shortfall doesn't just vanish. That ₹500 shows up everywhere pending amounts are displayed (profile, dashboard, CSV export) and gets mentioned in the WhatsApp confirmation message sent to the parent.

**The "real" pending amount** shown anywhere in the app is always `netPendingAmount()`:
```
netPendingAmount = (months overdue by schedule × monthly fee) + balanceAdjustment
```

---

## 3. Institute-wide holidays (not per-student pauses)

Earlier versions had a per-student "pause" feature (put one kid on hold). That was **deliberately removed** — the business rule is that individual student circumstances never affect billing. The only thing that can legitimately shift due dates is the whole institute being closed (e.g. Diwali break).

The **🏖️ Holidays** page lets you declare a date range once. On submit (`src/lib/holidays.ts`):
- A `Holiday` record is saved (for history/audit).
- Every currently **Active** student gets `holidayOffsetDays` increased by the holiday's length, and their `nextDueDate` is recalculated immediately.

This is a one-time, one-click action — there's no ongoing "pause" state to manage per student.

---

## 4. Reminders and WhatsApp messages

### How a student gets flagged

`getReminderInfo()` in `src/lib/utils.ts` classifies every **Active** student (Inactive students are never flagged) based on `nextDueDate`:

| Days from due date | Level | Shown as |
|---|---|---|
| More than 7 days overdue | `escalate` | Red "Escalate" badge |
| 1–7 days overdue | `overdue` | Red "Overdue" badge |
| Due within the next 7 days | `upcoming` | Amber "Due soon" badge |
| Everything else | *(not flagged)* | — |

Flagged students appear in the **⚠️ Needs Attention** box on the dashboard, sorted worst-first.

### Sending a message

Every "💬 Remind" / "Send WhatsApp Reminder" button opens a **wa.me link** — no WhatsApp Business API, no cost, no approval process. It just opens WhatsApp (app or web) with a message pre-typed; you still tap Send yourself. This was a deliberate choice to avoid API costs and approval delays.

### Editing the message text

All message templates live in **`src/lib/whatsapp.ts`** as plain template strings. There are two kinds:

- **`buildReminderMessage()`** — the "upcoming due" and "overdue/escalate" reminder texts.
- **`buildConfirmationMessage()`** — sent automatically right after you record a payment, confirming what was received and mentioning any shortfall/credit.

To change the wording, just open the file and edit the sentence inside the backticks — everything in `${...}` pulls in real data (name, amount, date), so leave those parts alone, but the surrounding words are plain text you can rewrite freely. No rebuild step needed beyond the normal deploy.

---

## 5. Data model

Three tables (`prisma/schema.prisma`):

**`Student`**
| Field | Meaning |
|---|---|
| `joiningDate` | Fixed anchor for all scheduling — never changes automatically |
| `monthlyFee` | ₹ per month |
| `status` | `Active` or `Inactive` only |
| `totalMonthsPaid` | Running count of months paid for, ever |
| `holidayOffsetDays` | Cumulative days added by institute holidays |
| `balanceAdjustment` | Running ₹ balance beyond the month-rounding (positive = owed, negative = credit) |
| `nextDueDate` | **Derived**, recalculated on every payment/edit/holiday — never set directly except via the recalculate tool |

**`Payment`** — one row per payment: `amountPaid`, `paymentDate`, `monthsCovered` (auto-calculated), linked to a student.

**`Holiday`** — one row per declared institute closure: `startDate`, `endDate`, `daysCount`, optional `note`.

---

## 6. User flow (how an admin actually uses this)

1. **Add a student** (`+` in header) — name, contact, joining date, monthly fee. Due date is set to the joining date automatically.
2. **Dashboard** is the home base: stat cards, a search bar, the "Needs Attention" queue, and the full student list (cards on mobile, table on desktop). Tap any student to open their profile.
3. **Record a payment** from a student's profile — just amount + date. You'll immediately see a confirmation card with a **"Send Fee Received Message"** WhatsApp button.
4. **Remind overdue parents** — tap the "💬 Remind" button next to any flagged student, on the dashboard or their profile. It opens WhatsApp pre-filled.
5. **Bulk payment** — tick multiple students' checkboxes on the dashboard table, then "Record Bulk Payment" to charge everyone selected their own fee × months in one action.
6. **Declare a holiday** occasionally, from the 🏖️ Holidays page, when the institute closes for a break.
7. **Export CSV** (bottom of dashboard) any time you want a spreadsheet snapshot, e.g. for backup or record-keeping outside the app.
8. **Edit a student** if a detail was entered wrong, or to manually correct `totalMonthsPaid` / `balanceAdjustment` if a record ever drifts from reality.

---

## 7. Access & security

- **Passcode login** (`src/middleware.ts`) — a single shared passcode gates the entire app, set via `APP_PASSCODE` in environment variables. This is intentionally simple (no per-user accounts) since there's one admin. Log out from the "⋮" menu in the header.
- This is basic protection, not enterprise security — appropriate for a low-stakes single-admin tool, not for handling anything more sensitive.

---

## 8. Tech stack & project structure

- **Next.js 14 (App Router)** + TypeScript — frontend and backend (API routes) in one codebase.
- **Prisma + Postgres** (hosted on Neon) — see `prisma/schema.prisma`.
- **Tailwind CSS** — hand-built components (no UI library), mobile-first.
- **next-pwa** — installable as a home-screen app.
- **Vercel** — hosting, auto-deploys on push to GitHub.

```
src/
  app/                    → pages & API routes (Next.js App Router)
    page.tsx              → dashboard
    students/[id]/         → student profile
    students/new/          → add-student form
    calendar/, holidays/   → calendar & holiday pages
    login/                  → passcode entry
    api/                    → all backend endpoints
  components/             → shared UI (StudentTable, forms, calendars, buttons)
  lib/
    utils.ts              → THE scheduling formula + reminder logic + formatting
    payments.ts           → recordPayment() — the one place payments get written
    holidays.ts           → applyHolidayToAllActiveStudents()
    whatsapp.ts            → message templates
    prisma.ts              → Prisma client singleton
  middleware.ts            → passcode gate
```

---

## 9. Local setup

```bash
npm install
cp .env.example .env       # then fill in DATABASE_URL and APP_PASSCODE
npx prisma migrate dev
npm run dev                # → http://localhost:3000
```

## 10. Deployment

Already set up: GitHub → Vercel (auto-deploy on push) + Neon Postgres. Environment variables required on Vercel: `DATABASE_URL`, `APP_PASSCODE`.

---

## 11. Known simplifications (by design, not oversights)

- **Month-rounding is approximate**, not day-precise — this is intentional for simplicity, with `balanceAdjustment` as the safety net so real money is never silently lost (see section 2).
- **WhatsApp sending requires a manual tap** — no auto-send, since that would require the paid WhatsApp Business API.
- **Single shared passcode**, not per-user accounts — appropriate for a single admin.
- **India-only phone formatting** in `normalizePhone()` (assumes +91 for bare 10-digit numbers) — edit `src/lib/whatsapp.ts` if that ever needs to change.
