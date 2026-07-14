"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: form.get("passcode") }),
    });

    setLoading(false);
    if (res.ok) {
      const params = new URLSearchParams(window.location.search);
      router.push(params.get("next") || "/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <div className="text-center">
          <p className="text-2xl mb-1">📘</p>
          <h1 className="text-lg font-bold">ClassPay</h1>
          <p className="text-sm text-gray-500">Enter passcode to continue</p>
        </div>

        <input
          className="input text-center text-lg tracking-widest"
          name="passcode"
          type="password"
          inputMode="numeric"
          autoFocus
          required
          placeholder="••••"
        />

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
