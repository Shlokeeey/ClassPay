import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const studentId = Number(params.id);

  if (!body.startDate || !body.endDate) {
    return NextResponse.json({ error: "Start and end date are required" }, { status: 400 });
  }

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);

  if (endDate <= startDate) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  await prisma.pause.create({
    data: { studentId, startDate, endDate },
  });

  const student = await prisma.student.update({
    where: { id: studentId },
    data: { status: "Paused" },
  });

  return NextResponse.json(student);
}

// Fully undoes the most recent, still-active pause — deletes it outright and
// reverts status to Active. Since due-date math only happens when a pause
// RESOLVES (auto-expiry or Resume Now), an unresolved pause is safe to delete
// with zero side effects — nothing to reverse.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const studentId = Number(params.id);

  const activePause = await prisma.pause.findFirst({
    where: { studentId, resumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!activePause) {
    return NextResponse.json({ error: "No active pause to cancel" }, { status: 404 });
  }

  await prisma.pause.delete({ where: { id: activePause.id } });
  await prisma.student.update({ where: { id: studentId }, data: { status: "Active" } });

  return NextResponse.json({ ok: true });
}
