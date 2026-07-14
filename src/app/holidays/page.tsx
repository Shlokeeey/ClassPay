import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import HolidayForm from "@/components/HolidayForm";

export const dynamic = "force-dynamic";

export default async function HolidaysPage() {
  const holidays = await prisma.holiday.findMany({ orderBy: { startDate: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">Institute Holidays</h1>
      <HolidayForm />

      <div className="card">
        <h2 className="font-medium mb-3">History</h2>
        {holidays.length === 0 ? (
          <p className="text-sm text-gray-400">No holidays declared yet.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-left border-b border-gray-100">
              <tr>
                <th className="py-2">Start</th>
                <th className="py-2">End</th>
                <th className="py-2">Days</th>
                <th className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h) => (
                <tr key={h.id} className="border-b border-gray-50">
                  <td className="py-2">{formatDate(h.startDate)}</td>
                  <td className="py-2">{formatDate(h.endDate)}</td>
                  <td className="py-2">{h.daysCount}</td>
                  <td className="py-2">{h.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
