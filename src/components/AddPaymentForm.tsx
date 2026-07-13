"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { monthsOverdueEstimate, formatDate, formatCurrency } from "@/lib/utils";
import { buildConfirmationMessage, buildWaLink } from "@/lib/whatsapp";

interface JustPaid {
  amountPaid: number;
  monthsCovered: number;
  nextDueDate: string;
}

export default function AddPaymentForm({
  studentId,
  studentName,
  studentContact,
  nextDueDate,
  monthlyFee,
}: {
  studentId: number;
  studentName: string;
  studentContact: string;
  nextDueDate?: string | null;
  monthlyFee?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [justPaid, setJustPaid] = useState<JustPaid | null>(null);

  const overdueMonths = monthsOverdueEstimate(nextDueDate);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const amountPaid = Number(form.get("amountPaid"));
    const payload = {
      studentId,
      amountPaid,
      paymentDate: form.get("paymentDate"),
      // no monthsCovered — the server works it out from amountPaid ÷ monthly fee
    };

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setOpen(false);
      setJustPaid({
        amountPaid,
        monthsCovered: data.monthsCovered,
        nextDueDate: data.nextDueDate,
      });
      router.refresh();
    }
  }

  if (justPaid) {
    const confirmationMessage = buildConfirmationMessage({
      name: studentName,
      amountPaid: justPaid.amountPaid,
      monthsCovered: justPaid.monthsCovered,
      nextDueDate: justPaid.nextDueDate,
    });
    const waLink = buildWaLink(studentContact, confirmationMessage);

    return (
      <div className="card bg-green-50 border border-green-200 space-y-3">
        <p className="text-sm text-green-800">
          ✅ Payment of {formatCurrency(justPaid.amountPaid)} recorded — covers{" "}
          {justPaid.monthsCovered} month{justPaid.monthsCovered > 1 ? "s" : ""}. Next due:{" "}
          {formatDate(justPaid.nextDueDate)}.
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary bg-green-600 hover:bg-green-700 inline-flex"
        >
          💬 Send Fee Received Message
        </a>
        <button className="btn-secondary ml-2" onClick={() => setJustPaid(null)}>
          Done
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Add Payment
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <p className="font-medium text-sm">Record Payment</p>

      {overdueMonths > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          This student's schedule shows ~{overdueMonths} month{overdueMonths > 1 ? "s" : ""} overdue
          (next due was {formatDate(nextDueDate)}). Just enter what they actually paid — the app
          works out how many months it covers.
        </p>
      )}

      <div>
        <label className="label">Amount Paid (₹)</label>
        <input className="input" name="amountPaid" type="number" min="0" required />
        {monthlyFee ? (
          <p className="text-xs text-gray-400 mt-1">
            Monthly fee is {formatCurrency(monthlyFee)} — months covered is calculated
            automatically from the amount you enter (rounded to the nearest month).
          </p>
        ) : null}
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

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : "Confirm Payment"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
