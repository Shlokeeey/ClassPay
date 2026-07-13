import { prisma } from "@/lib/prisma";
import { computeNextDueDate } from "@/lib/utils";

// Records one payment for one student and advances their schedule correctly
// (anchored from their current next_due_date / joining_date, never from
// paymentDate — see the arrears fix). Shared by /api/payments and /api/payments/bulk.
//
// If monthsCoveredOverride isn't given (the normal single-payment case), months
// covered is calculated automatically from amountPaid ÷ monthlyFee, rounded to
// the nearest whole month (minimum 1) — the admin just enters what was paid.
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

  const payment = await prisma.payment.create({
    data: { studentId, amountPaid, paymentDate, monthsCovered },
  });

  const anchor = student.nextDueDate ?? student.joiningDate;
  const nextDueDate = computeNextDueDate(anchor, monthsCovered);

  await prisma.student.update({
    where: { id: studentId },
    data: { nextDueDate },
  });

  return { payment, monthsCovered, nextDueDate };
}
