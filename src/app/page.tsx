import { prisma } from "@/lib/prisma";
import { getReminderInfo, reminderSort, netPendingAmount, formatCurrency } from "@/lib/utils";
import StudentTable from "@/components/StudentTable";
import NeedsAttentionBox from "@/components/NeedsAttentionBox";
import RecalculateButton from "@/components/RecalculateButton";

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

      <NeedsAttentionBox
        entries={reminderQueue.map(({ student, info }) => ({
          studentId: student.id,
          name: student.name,
          contact: student.contact,
          monthlyFee: student.monthlyFee,
          nextDueDate: student.nextDueDate ? student.nextDueDate.toISOString() : null,
          balanceAdjustment: student.balanceAdjustment,
          label: info!.label,
          color: info!.color,
          level: info!.level,
        }))}
      />

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
