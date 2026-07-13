import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// V3: lets the admin manually end a pause early (brief calls this "admin can override").
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const studentId = Number(params.id);

  const activePause = await prisma.pause.findFirst({
    where: { studentId, resumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!activePause) {
    await prisma.student.update({ where: { id: studentId }, data: { status: "Active" } });
    return NextResponse.json({ ok: true, note: "No active pause found — status set to Active." });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pauseDays = Math.round(
    (today.getTime() - new Date(activePause.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  let newDueDate: Date | null = student?.nextDueDate ? new Date(student.nextDueDate) : null;
  if (newDueDate && pauseDays > 0) {
    newDueDate.setDate(newDueDate.getDate() + pauseDays);
  }

  await prisma.$transaction([
    prisma.pause.update({
      where: { id: activePause.id },
      data: { resumed: true, endDate: today },
    }),
    prisma.student.update({
      where: { id: studentId },
      data: { status: "Active", ...(newDueDate ? { nextDueDate: newDueDate } : {}) },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
