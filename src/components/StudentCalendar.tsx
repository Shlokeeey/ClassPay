"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PaymentDot {
  date: string; // ISO date
  monthsCovered: number;
}
interface PauseRange {
  id: number;
  start: string;
  end: string;
  resumed: boolean;
}

export default function StudentCalendar({
  payments,
  pauses,
  nextDueDate,
}: {
  payments: PaymentDot[];
  pauses: PauseRange[];
  nextDueDate: string | null;
}) {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [editingPause, setEditingPause] = useState<PauseRange | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  function pauseForDay(cellDate: Date): PauseRange | undefined {
    return pauses.find((p) => {
      const s = new Date(p.start);
      const e = new Date(p.end);
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      return cellDate >= s && cellDate <= e;
    });
  }

  function dayStatus(day: number) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);

    const paidHere = payments.find((p) => sameDay(new Date(p.date), cellDate));
    if (paidHere) return { color: "bg-green-500 text-white", label: `Paid (+${paidHere.monthsCovered}m)`, pause: null as PauseRange | null };

    const pausedHere = pauseForDay(cellDate);
    if (pausedHere)
      return {
        color: "bg-gray-300 text-gray-700 cursor-pointer",
        label: "Paused — click to edit",
        pause: pausedHere,
      };

    if (nextDueDate && sameDay(new Date(nextDueDate), cellDate)) {
      const isOverdue = cellDate < today;
      return isOverdue
        ? { color: "bg-red-500 text-white", label: "Overdue", pause: null }
        : { color: "bg-amber-400 text-white", label: "Due", pause: null };
    }

    return null;
  }

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingPause) return;
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/pauses/${editingPause.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setEditingPause(null);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
    }
  }

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
              onClick={() => {
                if (status?.pause) setEditingPause(status.pause);
              }}
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
        <span>⚪ Paused (click to edit)</span>
      </div>

      {editingPause && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveEdit} className="card w-full max-w-sm space-y-3">
            <p className="font-medium text-sm">Edit Pause Dates</p>
            {editingPause.resumed && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                This pause already ended and its length was applied to the due date. Changing the
                dates here will adjust the due date by the difference automatically.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start Date</label>
                <input
                  className="input"
                  name="startDate"
                  type="date"
                  defaultValue={editingPause.start.slice(0, 10)}
                  required
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  className="input"
                  name="endDate"
                  type="date"
                  defaultValue={editingPause.end.slice(0, 10)}
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditingPause(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
