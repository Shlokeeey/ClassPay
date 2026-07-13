# ClassPay — V1

Student + single-month payment management. See chat for the full roadmap (V1–V5).

## Setup

1. `npm install`
2. `cp .env.example .env`
3. `npx prisma migrate dev --name init`
4. `npm run dev` → open http://localhost:3000

## What's in V1
- Add / edit status / delete students
- Record single-month payments per student
- Auto-calculated next due date (no pause logic yet — that's V3)
- Dashboard with totals + overdue count

## Not yet built (coming in later versions)
- Pause/holiday logic
- Calendar view
- Bulk payments
- WhatsApp reminder links
- Reports/CSV export
