export function computeNextDueDate(paymentDate: Date, monthsCovered: number): Date {
  const due = new Date(paymentDate);
  due.setDate(due.getDate() + monthsCovered * 30);
  return due;
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
// Paused / Inactive students are always excluded — reminders only apply to Active students.
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
  if (student.status !== "Active") return null; // respects Paused/Inactive
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
