import { prisma } from "@/lib/prisma";

// V3: Called at the top of pages that display student data.
// Finds any student whose pause window has ended but hasn't been "resumed" yet,
// flips them back to Active, and pushes their next_due_date forward by the
// length of the pause (matches the brief's due-date pseudocode).
export async function resolveExpiredPauses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredPauses = await prisma.pause.findMany({
    where: { resumed: false, endDate: { lt: today } },
    include: { student: true },
  });

  for (const pause of expiredPauses) {
    const pauseDays = Math.round(
      (new Date(pause.endDate).getTime() - new Date(pause.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let newDueDate: Date | null = pause.student.nextDueDate
      ? new Date(pause.student.nextDueDate)
      : null;
    if (newDueDate) {
      newDueDate.setDate(newDueDate.getDate() + pauseDays);
    }

    await prisma.$transaction([
      prisma.pause.update({ where: { id: pause.id }, data: { resumed: true } }),
      prisma.student.update({
        where: { id: pause.studentId },
        data: {
          status: "Active",
          ...(newDueDate ? { nextDueDate: newDueDate } : {}),
        },
      }),
    ]);
  }
}
