import { prisma } from "@/lib/prisma";
import { resolveExpiredPauses } from "@/lib/pause";
import GlobalCalendar from "@/components/GlobalCalendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await resolveExpiredPauses();

  const students = await prisma.student.findMany({
    include: { pauses: { where: { resumed: false } } },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueEntries = students
    .filter((s) => s.status === "Active" && s.nextDueDate)
    .map((s) => ({
      studentId: s.id,
      name: s.name,
      date: s.nextDueDate!.toISOString(),
      overdue: new Date(s.nextDueDate!) < today,
    }));

  const pauseEntries = students.flatMap((s) =>
    s.pauses.map((p) => ({
      studentId: s.id,
      name: s.name,
      start: p.startDate.toISOString(),
      end: p.endDate.toISOString(),
    }))
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Calendar — All Students</h1>
      <GlobalCalendar dueEntries={dueEntries} pauseEntries={pauseEntries} />
    </div>
  );
}
