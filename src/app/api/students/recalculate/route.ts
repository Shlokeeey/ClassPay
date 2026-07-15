import { prisma } from "@/lib/prisma";
import { computeScheduleDueDate } from "@/lib/utils";
import { NextResponse } from "next/server";

// Recomputes nextDueDate for EVERY student using the current formula.
// Safe to run any time — it doesn't touch payments, totalMonthsPaid, or
// balanceAdjustment, only the derived due date. Mainly useful right after
// the scheduling formula itself changes (like pay-after → pay-upfront).
export async function POST() {
  const students = await prisma.student.findMany();

  for (const s of students) {
    const nextDueDate = computeScheduleDueDate(s.joiningDate, s.totalMonthsPaid, s.holidayOffsetDays);
    await prisma.student.update({ where: { id: s.id }, data: { nextDueDate } });
  }

  return NextResponse.json({ ok: true, count: students.length });
}
