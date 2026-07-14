import { prisma } from "@/lib/prisma";
import { computeScheduleDueDate } from "@/lib/utils";

// Records one payment and advances the student's schedule using ONLY their
// joining date + cumulative months paid + institute holiday offset — never
// the payment date, never anything else.
//
// Months covered is calculated automatically from amountPaid ÷ monthlyFee,
// rounded to the nearest whole month (minimum 1) unless overridden (bulk
// payments pass an explicit month count). Any gap between what was actually
// paid and what that rounded month count is worth does NOT disappear — it's
// added to (or subtracted from) the student's persistent balanceAdjustment,
// so a real shortfall or credit is never silently lost, even though the
// schedule itself only moves in whole months.
export async function recordPayment(
  studentId: number,
  amountPaid: number,
  paymentDate: Date,
  monthsCoveredOverride?: number
) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error(`Student ${studentId} not found`);

  const monthsCovered =
    monthsCoveredOverride ?? Math.max(1, Math.round(amountPaid / student.monthlyFee));
  const leftoverAmount = amountPaid - monthsCovered * student.monthlyFee;

  const payment = await prisma.payment.create({
    data: { studentId, amountPaid, paymentDate, monthsCovered },
  });

  const totalMonthsPaid = student.totalMonthsPaid + monthsCovered;
  const nextDueDate = computeScheduleDueDate(
    student.joiningDate,
    totalMonthsPaid,
    student.holidayOffsetDays
  );

  // leftoverAmount negative (shortfall) → balance goes UP (still owed).
  // leftoverAmount positive (overpaid) → balance goes DOWN (credit).
  const balanceAdjustment = student.balanceAdjustment - leftoverAmount;

  await prisma.student.update({
    where: { id: studentId },
    data: { totalMonthsPaid, nextDueDate, balanceAdjustment },
  });

  return { payment, monthsCovered, nextDueDate, leftoverAmount, balanceAdjustment };
}
