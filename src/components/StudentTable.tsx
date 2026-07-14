"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { dueBadge, formatCurrency, getReminderInfo, netPendingAmount } from "@/lib/utils";
import WhatsAppButton from "@/components/WhatsAppButton";

interface StudentRow {
  id: number;
  name: string;
  contact: string;
  monthlyFee: number;
  status: string;
  nextDueDate: string | null;
  balanceAdjustment: number;
}

function pendingDisplay(s: StudentRow) {
  const owed = netPendingAmount(s.nextDueDate, s.monthlyFee, s.balanceAdjustment);
  if (owed > 0) return <span className="font-medium text-red-600">{formatCurrency(owed)}</span>;
  if (owed < 0) return <span className="text-green-600">+{formatCurrency(Math.abs(owed))} credit</span>;
  return <span className="text-gray-300">—</span>;
}

export default function StudentTable({ students }: { students: StudentRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(false);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBulkSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/payments/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentIds: Array.from(selected),
        monthsCovered: Number(form.get("monthsCovered")) || 1,
        paymentDate: form.get("paymentDate"),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setBulkOpen(false);
      setSelected(new Set());
      router.refresh();
    }
  }

  const selectedStudents = students.filter((s) => selected.has(s.id));
  const bulkTotal = selectedStudents.reduce((sum, s) => sum + s.monthlyFee * months, 0);

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm font-medium">{selected.size} student(s) selected</p>
          <div className="flex gap-2">
            <button className="btn-primary flex-1 sm:flex-none" onClick={() => setBulkOpen(true)}>
              Record Bulk Payment
            </button>
            <button className="btn-secondary flex-1 sm:flex-none" onClick={() => setSelected(new Set())}>
              Clear
            </button>
          </div>
        </div>
      )}

      {bulkOpen && (
        <form onSubmit={handleBulkSubmit} className="card space-y-3">
          <p className="font-medium text-sm">
            Record payment for {selectedStudents.map((s) => s.name).join(", ")}
          </p>
          <p className="text-xs text-gray-500">
            Each student is charged their own monthly fee × months covered — not a shared flat amount.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Months Covered</label>
              <input
                className="input"
                name="monthsCovered"
                type="number"
                min="1"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value) || 1)}
                required
              />
            </div>
            <div>
              <label className="label">Payment Date</label>
              <input
                className="input"
                name="paymentDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Total across selected students: <strong>{formatCurrency(bulkTotal)}</strong>
          </p>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1 sm:flex-none">
              {loading ? "Saving..." : "Confirm Bulk Payment"}
            </button>
            <button type="button" className="btn-secondary flex-1 sm:flex-none" onClick={() => setBulkOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {students.length === 0 && (
        <div className="card text-center text-gray-400 py-8">
          No students yet. Tap "+" above to get started.
        </div>
      )}

      {/* Mobile: stacked cards */}
      <div className="sm:hidden space-y-2">
        {students.map((s) => {
          const badge = dueBadge(s.nextDueDate);
          const reminderInfo = getReminderInfo(s);
          return (
            <div key={s.id} className="card">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/students/${s.id}`} className="font-medium text-brand truncate">
                      {s.name}
                    </Link>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium shrink-0">
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-sm">
                    <span className="text-gray-500">{formatCurrency(s.monthlyFee)}/mo</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm">{pendingDisplay(s)}</div>
                    {reminderInfo && (
                      <WhatsAppButton
                        student={{
                          name: s.name,
                          contact: s.contact,
                          monthlyFee: s.monthlyFee,
                          nextDueDate: s.nextDueDate,
                          balanceAdjustment: s.balanceAdjustment,
                        }}
                        type={reminderInfo.level}
                        small
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      {students.length > 0 && (
        <div className="hidden sm:block card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Monthly Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next Due</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const badge = dueBadge(s.nextDueDate);
                const reminderInfo = getReminderInfo(s);
                return (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggle(s.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/students/${s.id}`} className="font-medium text-brand hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(s.monthlyFee)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{pendingDisplay(s)}</td>
                    <td className="px-4 py-3">
                      {reminderInfo && (
                        <WhatsAppButton
                          student={{
                            name: s.name,
                            contact: s.contact,
                            monthlyFee: s.monthlyFee,
                            nextDueDate: s.nextDueDate,
                            balanceAdjustment: s.balanceAdjustment,
                          }}
                          type={reminderInfo.level}
                          small
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
