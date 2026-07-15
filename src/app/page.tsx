import { prisma } from "@/lib/prisma";
import { getReminderInfo, reminderSort, netPendingAmount, formatCurrency } from "@/lib/utils";
import StudentTable from "@/components/StudentTable";
import WhatsAppButton from "@/components/WhatsAppButton";
import RecalculateButton from "@/components/RecalculateButton";
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
  const totalPending = students.reduce(
    (sum, s) => sum + Math.max(0, netPendingAmount(s.nextDueDate, s.monthlyFee, s.balanceAdjustment)),
    0
  );

  // V2: reminder queue — Active students only, due within 7 days or overdue
  const reminderQueue = students
    .map((s) => ({ student: s, info: getReminderInfo(s) }))
    .filter((r) => r.info !== null)
    .sort((a, b) => reminderSort(a.info!, b.info!));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-500">Total Students</p>
          <p className="text-xl sm:text-2xl font-bold">{totalStudents}</p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-500">Active</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-500">Overdue</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{overdueCount}</p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-500">Total Pending</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {reminderQueue.length > 0 && (
        <div className="card">
          <h2 className="font-medium mb-3">⚠️ Needs Attention</h2>
          <div className="space-y-2">
            {reminderQueue.map(({ student, info }) => (
              <div
                key={student.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
              >
                <Link href={`/students/${student.id}`} className="font-medium text-sm">
                  {student.name}
                </Link>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${info!.color}`}>
                    {info!.label}
                  </span>
                  <WhatsAppButton
                    student={{
                      name: student.name,
                      contact: student.contact,
                      monthlyFee: student.monthlyFee,
                      nextDueDate: student.nextDueDate ? student.nextDueDate.toISOString() : null,
                      balanceAdjustment: student.balanceAdjustment,
                    }}
                    type={info!.level}
                    small
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StudentTable
        students={students.map((s) => ({
          id: s.id,
          name: s.name,
          contact: s.contact,
          monthlyFee: s.monthlyFee,
          status: s.status,
          nextDueDate: s.nextDueDate ? s.nextDueDate.toISOString() : null,
          balanceAdjustment: s.balanceAdjustment,
        }))}
      />

      <div className="flex flex-col items-center gap-2">
        <a href="/api/export" className="text-sm text-gray-400 hover:text-gray-600 underline">
          ⬇️ Export CSV
        </a>
        <RecalculateButton />
      </div>
    </div>
  );
}
