import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, dueBadge, getReminderInfo, outstandingAmount, monthsOverdueEstimate } from "@/lib/utils";
import { resolveExpiredPauses } from "@/lib/pause";
import AddPaymentForm from "@/components/AddPaymentForm";
import StudentActions from "@/components/StudentActions";
import { PauseButton, ResumeNowButton, CancelPauseButton } from "@/components/PauseControls";
import StudentCalendar from "@/components/StudentCalendar";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditStudentButton from "@/components/EditStudentButton";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  await resolveExpiredPauses(); // V3: auto-resume anyone whose pause window has passed

  const id = Number(params.id);
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      payments: { orderBy: { paymentDate: "desc" } },
      pauses: { orderBy: { startDate: "desc" } },
    },
  });

  if (!student) notFound();

  const activePause = student.pauses.find((p) => !p.resumed);

  const badge = dueBadge(student.nextDueDate);
  const totalPaid = student.payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const owedMonths = monthsOverdueEstimate(student.nextDueDate);
  const owedAmount = outstandingAmount(student.nextDueDate, student.monthlyFee);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{student.name}</h1>
            <p className="text-sm text-gray-500">{student.contact}</p>
            {student.email && <p className="text-sm text-gray-500">{student.email}</p>}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {owedAmount > 0 && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-sm text-red-700">
              <span className="font-bold text-lg">{formatCurrency(owedAmount)}</span> pending
              (~{owedMonths} month{owedMonths > 1 ? "s" : ""} overdue at {formatCurrency(student.monthlyFee)}/mo)
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <p className="text-gray-500">Monthly Fee</p>
            <p className="font-medium">{formatCurrency(student.monthlyFee)}</p>
          </div>
          <div>
            <p className="text-gray-500">Joining Date</p>
            <p className="font-medium">{formatDate(student.joiningDate)}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium">{student.status}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Paid</p>
            <p className="font-medium">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-gray-500">Payments Made</p>
            <p className="font-medium">{student.payments.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Next Due Date</p>
            <p className="font-medium">{formatDate(student.nextDueDate)}</p>
          </div>
        </div>

        {student.notes && (
          <div className="mt-4 text-sm">
            <p className="text-gray-500">Notes</p>
            <p>{student.notes}</p>
          </div>
        )}

        {activePause && (
          <div className="mt-4 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
            ⏸️ Paused from {formatDate(activePause.startDate)} to {formatDate(activePause.endDate)}.
            Reminders are off until then. Click the grey blocks on the calendar below to edit these
            dates.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <EditStudentButton
            student={{
              id: student.id,
              name: student.name,
              contact: student.contact,
              email: student.email,
              joiningDate: student.joiningDate.toISOString(),
              monthlyFee: student.monthlyFee,
              notes: student.notes,
              nextDueDate: student.nextDueDate ? student.nextDueDate.toISOString() : null,
            }}
          />
          <StudentActions studentId={student.id} currentStatus={student.status} />
          {student.status === "Paused" ? (
            <>
              <ResumeNowButton studentId={student.id} />
              <CancelPauseButton studentId={student.id} />
            </>
          ) : (
            <PauseButton studentId={student.id} />
          )}
        </div>

        <div className="mt-3">
          <WhatsAppButton
            student={{
              name: student.name,
              contact: student.contact,
              monthlyFee: student.monthlyFee,
              nextDueDate: student.nextDueDate ? student.nextDueDate.toISOString() : null,
            }}
            type={getReminderInfo(student)?.level ?? "upcoming"}
          />
        </div>
      </div>

      <StudentCalendar
        payments={student.payments.map((p) => ({
          date: p.paymentDate.toISOString(),
          monthsCovered: p.monthsCovered,
        }))}
        pauses={student.pauses.map((p) => ({
          id: p.id,
          start: p.startDate.toISOString(),
          end: p.endDate.toISOString(),
          resumed: p.resumed,
        }))}
        nextDueDate={student.nextDueDate ? student.nextDueDate.toISOString() : null}
      />

      <AddPaymentForm
        studentId={student.id}
        studentName={student.name}
        studentContact={student.contact}
        nextDueDate={student.nextDueDate ? student.nextDueDate.toISOString() : null}
        monthlyFee={student.monthlyFee}
      />

      <div className="card">
        <h2 className="font-medium mb-3">Payment History</h2>
        {student.payments.length === 0 ? (
          <p className="text-sm text-gray-400">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-left border-b border-gray-100">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Months Covered</th>
              </tr>
            </thead>
            <tbody>
              {student.payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-2">{formatDate(p.paymentDate)}</td>
                  <td className="py-2">{formatCurrency(p.amountPaid)}</td>
                  <td className="py-2">{p.monthsCovered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {student.pauses.length > 0 && (
        <div className="card">
          <h2 className="font-medium mb-3">Pause History</h2>
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-left border-b border-gray-100">
              <tr>
                <th className="py-2">Start</th>
                <th className="py-2">End</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {student.pauses.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-2">{formatDate(p.startDate)}</td>
                  <td className="py-2">{formatDate(p.endDate)}</td>
                  <td className="py-2">{p.resumed ? "Resumed" : "Active"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
