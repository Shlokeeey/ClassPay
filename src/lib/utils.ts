// --- Scheduling: joining-date-anchored, per your rule ---
// The due date is ALWAYS derived from joiningDate + totalMonthsPaid + any
// institute-wide holiday offset. Nothing else — not payment date, not
// individual circumstances — can move it. This avoids any drift too: it's
// recalculated fresh every time from the one fixed anchor (joiningDate),
// rather than incrementally shifted off itself.

// Adds calendar months to a date, clamping to the last day of the target
// month when needed (e.g. Jan 31 + 1 month = Feb 28/29, not Mar 3).
export function addMonthsClamped(date: Date | string, months: number): Date {
  const d = new Date(date);
  const totalMonthIndex = d.getMonth() + months;
  const targetYear = d.getFullYear() + Math.floor(totalMonthIndex / 12);
  const targetMonth = ((totalMonthIndex % 12) + 12) % 12;
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(d.getDate(), daysInTargetMonth);
  return new Date(targetYear, targetMonth, day);
}

export function addDaysToDate(date: Date | string, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// The one function that decides a student's due date, anywhere in the app.
// Pay-upfront model: month N's fee is due at the START of month N (before
// that month is taught), not after it completes. So totalMonthsPaid=0 means
// the very first payment is due on the joining date itself.
export function computeScheduleDueDate(
  joiningDate: Date | string,
  totalMonthsPaid: number,
  holidayOffsetDays: number
): Date {
  const base = addMonthsClamped(joiningDate, totalMonthsPaid);
  return addDaysToDate(base, holidayOffsetDays);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const target = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Rough months-behind estimate for the "Add Payment" hint, e.g. "~3 months overdue"
export function monthsOverdueEstimate(nextDueDate: Date | string | null | undefined): number {
  const days = daysUntil(nextDueDate);
  if (days === null || days >= 0) return 0;
  return Math.ceil(Math.abs(days) / 30);
}

// Outstanding balance shown on the student profile: months behind × monthly fee.
export function outstandingAmount(
  nextDueDate: Date | string | null | undefined,
  monthlyFee: number
): number {
  return monthsOverdueEstimate(nextDueDate) * monthlyFee;
}

// The REAL pending amount: the schedule-based estimate, corrected by the exact
// running balance from any shortfalls/overpayments the month-rounding
// approximation would otherwise hide. Positive = owed, negative = credit.
export function netPendingAmount(
  nextDueDate: Date | string | null | undefined,
  monthlyFee: number,
  balanceAdjustment: number
): number {
  return outstandingAmount(nextDueDate, monthlyFee) + balanceAdjustment;
}

export function dueBadge(nextDueDate: Date | string | null | undefined): {
  label: string;
  color: string;
} {
  const days = daysUntil(nextDueDate);
  if (days === null) return { label: "No payments yet", color: "bg-gray-100 text-gray-600" };
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, color: "bg-red-100 text-red-700" };
  if (days <= 7) return { label: `Due in ${days}d`, color: "bg-amber-100 text-amber-700" };
  return { label: `Due ${formatDate(nextDueDate)}`, color: "bg-green-100 text-green-700" };
}

// --- V2: Reminder Engine ---
// Classifies a student for the "needs attention" queue.
// Inactive students are always excluded — reminders only apply to Active students.
export type ReminderLevel = "escalate" | "overdue" | "upcoming";

export interface ReminderInfo {
  level: ReminderLevel;
  days: number; // positive = overdue by N days, negative = due in N days
  label: string;
  color: string;
}

export function getReminderInfo(student: {
  status: string;
  nextDueDate: Date | string | null;
}): ReminderInfo | null {
  if (student.status !== "Active") return null; // Inactive students excluded
  const daysLeft = daysUntil(student.nextDueDate);
  if (daysLeft === null) return null;

  if (daysLeft < 0) {
    const overdueBy = Math.abs(daysLeft);
    if (overdueBy > 7) {
      return {
        level: "escalate",
        days: overdueBy,
        label: `Escalate — overdue ${overdueBy}d`,
        color: "bg-red-600 text-white",
      };
    }
    return {
      level: "overdue",
      days: overdueBy,
      label: `Overdue by ${overdueBy}d`,
      color: "bg-red-100 text-red-700",
    };
  }

  if (daysLeft <= 7) {
    return {
      level: "upcoming",
      days: daysLeft,
      label: daysLeft === 0 ? "Due today" : `Due in ${daysLeft}d`,
      color: "bg-amber-100 text-amber-700",
    };
  }

  return null; // not within the reminder window
}

// Sort order for the reminder queue: escalate first, then overdue, then upcoming
const levelPriority: Record<ReminderLevel, number> = { escalate: 0, overdue: 1, upcoming: 2 };
export function reminderSort(a: ReminderInfo, b: ReminderInfo): number {
  if (levelPriority[a.level] !== levelPriority[b.level]) {
    return levelPriority[a.level] - levelPriority[b.level];
  }
  return b.days - a.days;
}
