import { prisma } from "@/lib/prisma";
import { dueBadge, formatCurrency, getReminderInfo, reminderSort } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const students = await prisma.student.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalStudents = students.length;
  const activeCount = students.filter((s) => s.status === "Active").length;
  const overdueCount = students.filter((s) => {
    if (!s.nextDueDate) return false;
    return new Date(s.nextDueDate) < new Date();
  }).length;

  // V2: reminder queue — Active students only, due within 7 days or overdue
  const reminderQueue = students
    .map((s) => ({ student: s, info: getReminderInfo(s) }))
    .filter((r) => r.info !== null)
    .sort((a, b) => reminderSort(a.info!, b.info!));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold">{totalStudents}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
        </div>
      </div>

      {reminderQueue.length > 0 && (
        <div className="card">
          <h2 className="font-medium mb-3">⚠️ Needs Attention</h2>
          <div className="space-y-2">
            {reminderQueue.map(({ student, info }) => (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
              >
                <span className="font-medium text-sm">{student.name}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${info!.color}`}>
                  {info!.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Monthly Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Next Due</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No students yet. Click "+ Add Student" to get started.
                </td>
              </tr>
            )}
            {students.map((s) => {
              const badge = dueBadge(s.nextDueDate);
              return (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/students/${s.id}`} className="font-medium text-brand hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(s.monthlyFee)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
