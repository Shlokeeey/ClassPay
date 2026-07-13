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
  nextDueDate: string | null; // ISO
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
      nextDueDate: form.get("nextDueDate") || null,
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
          <label className="label">Next Due Date</label>
          <input
            className="input"
            name="nextDueDate"
            type="date"
            defaultValue={student.nextDueDate ? student.nextDueDate.slice(0, 10) : ""}
          />
          <p className="text-xs text-gray-400 mt-1">
            Only correct this manually if the schedule looks wrong (e.g. an older record from
            before the due-date fix). Normally this updates automatically from payments.
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
