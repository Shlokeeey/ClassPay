"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StudentEditable {
  id: number;
  name: string;
  contact: string;
  email: string | null;
  joiningDate: string; // ISO
  monthlyFee: number;
  notes: string | null;
  totalMonthsPaid: number;
  balanceAdjustment: number;
}

export default function EditStudentButton({ student }: { student: StudentEditable }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      contact: form.get("contact"),
      email: form.get("email") || null,
      joiningDate: form.get("joiningDate"),
      monthlyFee: Number(form.get("monthlyFee")),
      notes: form.get("notes") || null,
      totalMonthsPaid: Number(form.get("totalMonthsPaid")),
      balanceAdjustment: Number(form.get("balanceAdjustment")),
    };

    const res = await fetch(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError("Something went wrong. Please check the fields.");
    }
  }

  if (!open) {
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        Edit Details
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
        <p className="font-medium">Edit Student</p>

        <div>
          <label className="label">Name</label>
          <input className="input" name="name" defaultValue={student.name} required />
        </div>
        <div>
          <label className="label">Contact</label>
          <input className="input" name="contact" defaultValue={student.contact} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" name="email" type="email" defaultValue={student.email ?? ""} />
        </div>
        <div>
          <label className="label">Joining Date</label>
          <input
            className="input"
            name="joiningDate"
            type="date"
            defaultValue={student.joiningDate.slice(0, 10)}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            This is the ONLY anchor for the billing cycle — the due date always lands on this same
            day each month, regardless of anything else.
          </p>
        </div>
        <div>
          <label className="label">Monthly Fee (₹)</label>
          <input
            className="input"
            name="monthlyFee"
            type="number"
            min="0"
            defaultValue={student.monthlyFee}
            required
          />
        </div>
        <div>
          <label className="label">Total Months Paid</label>
          <input
            className="input"
            name="totalMonthsPaid"
            type="number"
            min="0"
            defaultValue={student.totalMonthsPaid}
          />
          <p className="text-xs text-gray-400 mt-1">
            Only correct this manually if the schedule looks wrong (e.g. an older record from
            before a fix). The due date recalculates automatically from joining date + this number
            of months whenever you save.
          </p>
        </div>
        <div>
          <label className="label">Balance Adjustment (₹)</label>
          <input
            className="input"
            name="balanceAdjustment"
            type="number"
            defaultValue={student.balanceAdjustment}
          />
          <p className="text-xs text-gray-400 mt-1">
            Positive = still owed beyond the schedule (e.g. an unrecorded shortfall). Negative =
            credit from an overpayment. This is added on top of the schedule-based pending amount
            everywhere it's shown — only edit this directly to correct a mistake.
          </p>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" name="notes" rows={2} defaultValue={student.notes ?? ""} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
