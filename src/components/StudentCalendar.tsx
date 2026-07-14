"use client";

import { useState } from "react";

interface PaymentDot {
  date: string; // ISO date
  monthsCovered: number;
}
interface HolidayRange {
  start: string;
  end: string;
  note: string | null;
}

export default function StudentCalendar({
  payments,
  holidays,
  nextDueDate,
}: {
  payments: PaymentDot[];
  holidays: HolidayRange[];
  nextDueDate: string | null;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function dayStatus(day: number) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);

    const paidHere = payments.find((p) => sameDay(new Date(p.date), cellDate));
    if (paidHere) return { color: "bg-green-500 text-white", label: `Paid (+${paidHere.monthsCovered}m)` };

    const holidayHere = holidays.find((h) => {
      const s = new Date(h.start);
      const e = new Date(h.end);
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      return cellDate >= s && cellDate <= e;
    });
    if (holidayHere)
      return { color: "bg-gray-300 text-gray-700", label: holidayHere.note || "Institute Holiday" };

    if (nextDueDate && sameDay(new Date(nextDueDate), cellDate)) {
      const isOverdue = cellDate < today;
      return isOverdue
        ? { color: "bg-red-500 text-white", label: "Overdue" }
        : { color: "bg-amber-400 text-white", label: "Due" };
    }

    return null;
  }

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <button className="btn-secondary px-2 py-1" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          ←
        </button>
        <p className="font-medium text-sm">
          {firstDay.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>
        <button className="btn-secondary px-2 py-1" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const status = dayStatus(day);
          return (
            <div
              key={i}
              title={status?.label}
              className={`aspect-square rounded-md flex items-center justify-center text-xs ${
                status ? status.color : "bg-gray-50 text-gray-500"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
        <span>🟢 Paid</span>
        <span>🔴 Overdue</span>
        <span>🟡 Due soon</span>
        <span>⚪ Institute Holiday</span>
      </div>
    </div>
  );
}
