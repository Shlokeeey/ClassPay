import { formatCurrency, formatDate, netPendingAmount } from "@/lib/utils";

export type ReminderTemplateType =
  | "upcoming"
  | "overdue"
  | "escalate"
  | "confirmation";

interface StudentLike {
  name: string;
  contact: string;
  monthlyFee: number;
  nextDueDate: Date | string | null;
  balanceAdjustment?: number;
}

// Turns a contact string into a wa.me-ready number.
// Assumes India (+91) if a bare 10-digit number is given.
export function normalizePhone(contact: string): string {
  const digits = contact.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function monthName(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "long" });
}

// Returns "July" if only one month is pending,
// or "July to September" if multiple months are pending.
function owedPeriodLabel(nextDueDate: Date | string | null | undefined): string {
  const from = monthName(nextDueDate);
  const to = monthName(new Date());

  if (!from) return to;
  return from === to ? from : `${from} to ${to}`;
}

// --------------------
// Reminder Messages
// --------------------
export function buildReminderMessage(
  student: StudentLike,
  type: ReminderTemplateType
): string {
  const owed = netPendingAmount(
    student.nextDueDate,
    student.monthlyFee,
    student.balanceAdjustment ?? 0
  );

  const owedAmount = formatCurrency(
    owed > 0 ? owed : student.monthlyFee
  );

  const period = owedPeriodLabel(student.nextDueDate);

  switch (type) {
    case "upcoming":
      return `Hello Bhabhi, just a reminder that ${student.name}'s ${monthName(
        student.nextDueDate
      )} fee of ${formatCurrency(
        student.monthlyFee
      )} is due soon. Kindly make the payment before the beginning of the month. Thank you!`;

    case "overdue":
    case "escalate":
      return `Hello Bhabhi, this is a gentle reminder that ${student.name}'s pending fee of ${owedAmount} (${period}) has not yet been received. Kindly make the payment at your earliest convenience. Thank you!`;

    case "confirmation":
      return `Hello Bhabhi, I have received ${student.name}'s fee. Thank you!`;
  }
}

// --------------------
// Payment Confirmation
// --------------------
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
    params.monthsCovered > 1
      ? `${params.monthsCovered} months'`
      : "1 month's";

  let leftoverNote = "";

  if (params.leftoverAmount && params.leftoverAmount < 0) {
    leftoverNote = ` There is still an outstanding balance of ${formatCurrency(
      Math.abs(params.leftoverAmount)
    )}, which can be added to your next payment.`;
  } else if (params.leftoverAmount && params.leftoverAmount > 0) {
    leftoverNote = ` An extra payment of ${formatCurrency(
      params.leftoverAmount
    )} has been received and will be adjusted towards the next month's fee.`;
  }

  return `Hello Bhabhi, I have received ${params.name}'s payment of ${amt}. Thank you! This payment covers ${monthsLabel} fee.${leftoverNote} The next fee is due on ${due}.`;
}

// --------------------
// WhatsApp Link Builder
// --------------------
export function buildWaLink(contact: string, message: string): string {
  const phone = normalizePhone(contact);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}