"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecalculateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  async function handleClick() {
    if (!confirm("Recalculate every student's due date using the current formula? This won't change payment history or amounts, only due dates.")) return;
    setLoading(true);
    const res = await fetch("/api/students/recalculate", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setDone(data.count);
      router.refresh();
    }
  }

  return (
    <div className="text-center">
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-sm text-gray-400 hover:text-gray-600 underline"
      >
        {loading ? "Recalculating..." : "🔄 Recalculate All Due Dates"}
      </button>
      {done !== null && (
        <p className="text-xs text-green-600 mt-1">Updated {done} student(s).</p>
      )}
    </div>
  );
}
