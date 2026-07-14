"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeaderMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        className="btn-secondary px-3"
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
      >
        ⋮
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
            <button
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 text-red-600"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
