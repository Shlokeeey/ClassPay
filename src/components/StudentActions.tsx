"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StudentActions({
  studentId,
  currentStatus,
}: {
  studentId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
    setLoading(true);
    await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this student and all their payment history? This can't be undone.")) return;
    await fetch(`/api/students/${studentId}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus !== "Active" && (
        <button className="btn-secondary" disabled={loading} onClick={() => updateStatus("Active")}>
          Mark Active
        </button>
      )}
      {currentStatus !== "Inactive" && (
        <button className="btn-secondary" disabled={loading} onClick={() => updateStatus("Inactive")}>
          Mark Inactive
        </button>
      )}
      <button
        className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
        onClick={handleDelete}
      >
        Delete Student
      </button>
    </div>
  );
}
