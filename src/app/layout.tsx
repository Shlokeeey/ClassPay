import type { Metadata, Viewport } from "next";
import "./globals.css";
import HeaderMenu from "@/components/HeaderMenu";
import AppLoader from "@/components/AppLoader";

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "ClassPay",
  description: "Track student tuition fees, payments, and dues.",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      { url: "/favicon.ico" },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: "/apple-touch-icon.png",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClassPay",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppLoader>
          <div className="min-h-screen">
            <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
              <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
                <a
                  href="/"
                  className="flex shrink-0 items-center gap-2 text-base font-bold text-brand sm:text-lg"
                >
                  <img
                    src="/android-chrome-192x192.png"
                    alt="ClassPay"
                    width={34}
                    height={34}
                  />
                  <span className="text-xl font-bold">ClassPay</span>
                </a>

                <div className="flex items-center gap-1.5 sm:gap-3">
                  <a
                    href="/calendar"
                    className="btn-secondary px-2.5 sm:px-4"
                    aria-label="Calendar"
                  >
                    🗓️
                    <span className="ml-1 hidden sm:inline">
                      Calendar
                    </span>
                  </a>

                  <a
                    href="/holidays"
                    className="btn-secondary px-2.5 sm:px-4"
                    aria-label="Holidays"
                  >
                    🏖️
                    <span className="ml-1 hidden sm:inline">
                      Holidays
                    </span>
                  </a>

                  <a
                    href="/students/new"
                    className="btn-primary px-2.5 sm:px-4"
                    aria-label="Add Student"
                  >
                    <span className="sm:hidden">+</span>
                    <span className="hidden sm:inline">
                      + Add Student
                    </span>
                  </a>

                  <HeaderMenu />
                </div>
              </div>
            </header>

            <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
              {children}
            </main>
          </div>
        </AppLoader>
      </body>
    </html>
  );
}