"use client";

import { buildReminderMessage, buildWaLink, ReminderTemplateType } from "@/lib/whatsapp";

export default function WhatsAppButton({
  student,
  type,
  small = false,
  customMessage,
}: {
  student: { name: string; contact: string; monthlyFee: number; nextDueDate: string | null };
  type: ReminderTemplateType;
  small?: boolean;
  customMessage?: string; // overrides the template — used for the post-payment confirmation
}) {
  const message = customMessage ?? buildReminderMessage(student, type);
  const link = buildWaLink(student.contact, message);

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={
        small
          ? "inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
          : "btn-primary bg-green-600 hover:bg-green-700"
      }
    >
      💬 {small ? "Remind" : "Send WhatsApp Message"}
    </a>
  );
}
