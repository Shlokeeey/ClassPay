"use client";

import { useState } from "react";
import Link from "next/link";

interface DueEntry {
  studentId: number;
  name: string;
  date: string;
  overdue: boolean;
}
interface HolidayRange {
  start: string;
  end: string;
  note: string | null;
}

export default function GlobalCalendar({
  dueEntries,
  holidays,
}: {
  dueEntries: DueEntry[];
  holidays: HolidayRange[];
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    dues: DueEntry[];
    holiday: HolidayRange | null;
  } | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function entriesForDay(day: number) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);

    const dues = dueEntries.filter((d) => sameDay(new Date(d.date), cellDate));
    const holiday = holidays.find((h) => {
      const s = new Date(h.start);
      const e = new Date(h.end);
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      return cellDate >= s && cellDate <= e;
    });
    return { cellDate, dues, holiday: holiday ?? null };
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
          if (day === null) return <div key={i} className="min-h-[56px] sm:min-h-[70px]" />;
          const { cellDate, dues, holiday } = entriesForDay(day);
          const hasOverdue = dues.some((d) => d.overdue);
          const clickable = dues.length > 0 || holiday !== null;
          return (
            <button
              key={i}
              disabled={!clickable}
              onClick={() => clickable && setSelectedDay({ date: cellDate, dues, holiday })}
              className={`min-h-[56px] sm:min-h-[70px] rounded-md border border-gray-100 p-1 text-xs flex flex-col items-center ${
                holiday ? "bg-gray-100" : ""
              } ${clickable ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}`}
            >
              <span className="text-gray-400">{day}</span>
              <div className="flex flex-col items-center gap-0.5 mt-1">
                {dues.length > 0 && (
                  <span
                    className={`rounded-full px-1.5 min-w-[18px] text-white font-medium ${
                      hasOverdue ? "bg-red-500" : "bg-amber-500"
                    }`}
                  >
                    {dues.length}
                  </span>
                )}
                {holiday && <span title={holiday.note ?? "Institute Holiday"}>⚪</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
        <span>🟡 Due soon</span>
        <span>🔴 Overdue</span>
        <span>⚪ Institute Holiday</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">Tap a date to see who's due that day.</p>

      {selectedDay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setSelectedDay(null)}>
          <div className="card w-full max-w-sm space-y-3 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {selectedDay.date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <button className="text-gray-400 hover:text-gray-600 text-lg leading-none" onClick={() => setSelectedDay(null)}>
                ✕
              </button>
            </div>

            {selectedDay.holiday && (
              <p className="text-sm rounded-lg bg-gray-100 px-3 py-2 text-gray-600">
                ⚪ Institute Holiday{selectedDay.holiday.note ? `: ${selectedDay.holiday.note}` : ""}
              </p>
            )}

            {selectedDay.dues.length === 0 ? (
              <p className="text-sm text-gray-400">No fees due this day.</p>
            ) : (
              <div className="space-y-1.5">
                {selectedDay.dues.map((d) => (
                  <Link
                    key={d.studentId}
                    href={`/students/${d.studentId}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
                  >
                    <span className="font-medium text-sm">{d.name}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        d.overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {d.overdue ? "Overdue" : "Due"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
