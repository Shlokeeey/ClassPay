import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClassPay — Tuition Fee Tracker",
  description: "Track student tuition fees, payments, and dues.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
              <a href="/" className="text-lg font-bold text-brand">
                📘 ClassPay
              </a>
              <div className="flex items-center gap-3">
                <a href="/calendar" className="btn-secondary">
                  🗓️ Calendar
                </a>
                <a href="/api/export" className="btn-secondary">
                  ⬇️ Export CSV
                </a>
                <a href="/students/new" className="btn-primary">
                  + Add Student
                </a>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
