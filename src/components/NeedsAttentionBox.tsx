"use client";

import { useState } from "react";
import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { ReminderTemplateType } from "@/lib/whatsapp";

interface QueueEntry {
  studentId: number;
  name: string;
  contact: string;
  monthlyFee: number;
  nextDueDate: string | null;
  balanceAdjustment: number;
  label: string;
  color: string;
  level: ReminderTemplateType;
}

export default function NeedsAttentionBox({ entries }: { entries: QueueEntry[] }) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="card">
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setExpanded((v) => !v)}
      >
        <h2 className="font-medium">
          ⚠️ Needs Attention <span className="text-gray-400 font-normal">({entries.length})</span>
        </h2>
        <span className="text-gray-400 text-sm">{expanded ? "▲ Hide" : "▼ Show"}</span>
      </button>

      {expanded && (
        <div className="space-y-2 mt-3">
          {entries.map((e) => (
            <div
              key={e.studentId}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
            >
              <Link href={`/students/${e.studentId}`} className="font-medium text-sm">
                {e.name}
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${e.color}`}>
                  {e.label}
                </span>
                <WhatsAppButton
                  student={{
                    name: e.name,
                    contact: e.contact,
                    monthlyFee: e.monthlyFee,
                    nextDueDate: e.nextDueDate,
                    balanceAdjustment: e.balanceAdjustment,
                  }}
                  type={e.level}
                  small
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
