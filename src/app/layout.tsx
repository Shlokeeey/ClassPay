import type { Metadata } from "next";
import "./globals.css";
import HeaderMenu from "@/components/HeaderMenu";

export const metadata: Metadata = {
  title: "ClassPay — Tuition Fee Tracker",
  description: "Track student tuition fees, payments, and dues.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
            <div className="mx-auto max-w-5xl px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
              <a href="/" className="text-base sm:text-lg font-bold text-brand shrink-0">
                📘 ClassPay
              </a>
              <div className="flex items-center gap-1.5 sm:gap-3">
                <a href="/calendar" className="btn-secondary px-2.5 sm:px-4" aria-label="Calendar">
                  🗓️<span className="hidden sm:inline ml-1">Calendar</span>
                </a>
                <a href="/holidays" className="btn-secondary px-2.5 sm:px-4" aria-label="Holidays">
                  🏖️<span className="hidden sm:inline ml-1">Holidays</span>
                </a>
                <a href="/students/new" className="btn-primary px-2.5 sm:px-4" aria-label="Add Student">
                  <span className="sm:hidden">+</span>
                  <span className="hidden sm:inline">+ Add Student</span>
                </a>
                <HeaderMenu />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
