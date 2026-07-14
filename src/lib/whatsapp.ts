import { formatCurrency, formatDate, netPendingAmount } from "@/lib/utils";

export type ReminderTemplateType = "upcoming" | "overdue" | "escalate" | "confirmation";

interface StudentLike {
  name: string;
  contact: string;
  monthlyFee: number;
  nextDueDate: Date | string | null;
  balanceAdjustment?: number;
}

// Turns a contact string into a wa.me-ready number. Assumes India (+91) if a
// bare 10-digit number is given — adjust here if you're outside India.
export function normalizePhone(contact: string): string {
  const digits = contact.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function monthName(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "long" });
}

// e.g. "July" if the backlog is within one month, or "July to September" if it spans several
function owedPeriodLabel(nextDueDate: Date | string | null | undefined): string {
  const from = monthName(nextDueDate);
  const to = monthName(new Date());
  if (!from) return to;
  return from === to ? from : `${from} to ${to}`;
}

// Reminder messages — Hinglish, matching the phrasing you asked for.
export function buildReminderMessage(student: StudentLike, type: ReminderTemplateType): string {
  const owed = netPendingAmount(student.nextDueDate, student.monthlyFee, student.balanceAdjustment ?? 0);
  const owedAmount = formatCurrency(owed > 0 ? owed : student.monthlyFee);
  const period = owedPeriodLabel(student.nextDueDate);

  switch (type) {
    case "upcoming":
      return `Namaste bhabhi, vo ${student.name} ki ${formatCurrency(student.monthlyFee)} fees ${monthName(student.nextDueDate)} mahine mein due hai. Aap please time se payment karwa dijiyega. Dhanyavaad!`;
    case "overdue":
    case "escalate":
      return `Namaste bhabhi, vo ${student.name} ki ${owedAmount} fees bachi hui hai from ${period}. Aap please iska payment jaldi karwa sakte hai?`;
    case "confirmation":
      return `Namaste bhabhi, ${student.name} ki fees mil gayi hai, dhanyavaad!`;
  }
}

// Sent right after a payment is recorded — confirms what was paid and when the next one is due.
export function buildConfirmationMessage(params: {
  name: string;
  amountPaid: number;
  monthsCovered: number;
  nextDueDate: Date | string | null;
  leftoverAmount?: number;
}): string {
  const amt = formatCurrency(params.amountPaid);
  const due = formatDate(params.nextDueDate);
  const monthsLabel =
    params.monthsCovered > 1 ? `${params.monthsCovered} months ki` : `1 month ki`;

  let leftoverNote = "";
  if (params.leftoverAmount && params.leftoverAmount < 0) {
    leftoverNote = ` Isme se ${formatCurrency(Math.abs(params.leftoverAmount))} abhi bhi baaki hai, agli baar saath mein jod dijiyega.`;
  } else if (params.leftoverAmount && params.leftoverAmount > 0) {
    leftoverNote = ` Aapne ${formatCurrency(params.leftoverAmount)} zyada diye hain, ye agli fees mein adjust ho jayenge.`;
  }

  return `Namaste bhabhi, vo ${params.name} ki ${amt} fees mil gayi hai, dhanyavaad! Ye payment ${monthsLabel} fees cover karti hai.${leftoverNote} Agli fees ka due date ${due} hai.`;
}

export function buildWaLink(contact: string, message: string): string {
  const phone = normalizePhone(contact);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
