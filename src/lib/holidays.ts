import { prisma } from "@/lib/prisma";
import { computeScheduleDueDate } from "@/lib/utils";

// The ONLY thing allowed to shift a student's due date off their pure
// joining-date cycle. Applies to every currently Active student at once —
// there's no per-student version of this anymore.
export async function applyHolidayToAllActiveStudents(
  startDate: Date,
  endDate: Date,
  note: string | null
) {
  const daysCount =
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1; // inclusive

  const holiday = await prisma.holiday.create({
    data: { startDate, endDate, daysCount, note },
  });

  const activeStudents = await prisma.student.findMany({ where: { status: "Active" } });

  for (const student of activeStudents) {
    const newOffset = student.holidayOffsetDays + daysCount;
    const nextDueDate = computeScheduleDueDate(
      student.joiningDate,
      student.totalMonthsPaid,
      newOffset
    );
    await prisma.student.update({
      where: { id: student.id },
      data: { holidayOffsetDays: newOffset, nextDueDate },
    });
  }

  return { holiday, studentsAffected: activeStudents.length };
}
