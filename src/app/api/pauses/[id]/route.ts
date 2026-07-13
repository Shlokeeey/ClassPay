import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Edits a pause's dates. Works whether the pause is still active OR has
// already resolved (auto-expired / Resume Now already ran and shifted the
// due date). If it already resolved, we back out the OLD shift and apply the
// NEW one, so correcting a mistake after the fact still lands on the right
// due date instead of being silently blocked.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const pauseId = Number(params.id);
  const body = await req.json();

  const pause = await prisma.pause.findUnique({ where: { id: pauseId } });
  if (!pause) return NextResponse.json({ error: "Pause not found" }, { status: 404 });

  const newStart = body.startDate ? new Date(body.startDate) : pause.startDate;
  const newEnd = body.endDate ? new Date(body.endDate) : pause.endDate;

  if (newEnd <= newStart) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  if (pause.resumed) {
    // Already applied to the schedule — adjust by the difference in length.
    const oldDays = Math.round(
      (pause.endDate.getTime() - pause.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const newDays = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24));
    const delta = newDays - oldDays;

    if (delta !== 0) {
      const student = await prisma.student.findUnique({ where: { id: pause.studentId } });
      if (student?.nextDueDate) {
        const adjusted = new Date(student.nextDueDate);
        adjusted.setDate(adjusted.getDate() + delta);
        await prisma.student.update({
          where: { id: pause.studentId },
          data: { nextDueDate: adjusted },
        });
      }
    }
  }

  const updated = await prisma.pause.update({
    where: { id: pauseId },
    data: { startDate: newStart, endDate: newEnd },
  });

  return NextResponse.json(updated);
}
