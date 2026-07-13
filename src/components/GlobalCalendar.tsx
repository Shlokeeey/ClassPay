"use client";

import { useState } from "react";
import Link from "next/link";

interface DueEntry {
  studentId: number;
  name: string;
  date: string;
  overdue: boolean;
}
interface PauseEntry {
  studentId: number;
  name: string;
  start: string;
  end: string;
}

export default function GlobalCalendar({
  dueEntries,
  pauseEntries,
}: {
  dueEntries: DueEntry[];
  pauseEntries: PauseEntry[];
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

  function entriesForDay(day: number) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);

    const dues = dueEntries.filter((d) => sameDay(new Date(d.date), cellDate));
    const pauses = pauseEntries.filter((p) => {
      const s = new Date(p.start);
      const e = new Date(p.end);
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      return cellDate >= s && cellDate <= e;
    });
    return { dues, pauses };
  }

  function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
        <p className="font-medium">
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
          if (day === null) return <div key={i} className="min-h-[70px]" />;
          const { dues, pauses } = entriesForDay(day);
          return (
            <div key={i} className="min-h-[70px] rounded-md border border-gray-100 p-1 text-xs">
              <div className="text-gray-400">{day}</div>
              <div className="space-y-0.5 mt-1">
                {dues.slice(0, 2).map((d) => (
                  <Link
                    key={d.studentId}
                    href={`/students/${d.studentId}`}
                    className={`block truncate rounded px-1 ${
                      d.overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {d.name}
                  </Link>
                ))}
                {pauses.slice(0, 1).map((p) => (
                  <Link
                    key={p.studentId}
                    href={`/students/${p.studentId}`}
                    className="block truncate rounded bg-gray-200 px-1 text-gray-600"
                  >
                    ⏸ {p.name}
                  </Link>
                ))}
                {dues.length + pauses.length > 3 && (
                  <p className="text-gray-400">+{dues.length + pauses.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
        <span>🟡 Due soon</span>
        <span>🔴 Overdue</span>
        <span>⚪ Paused</span>
      </div>
    </div>
  );
}
