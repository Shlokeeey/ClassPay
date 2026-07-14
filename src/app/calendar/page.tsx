import { prisma } from "@/lib/prisma";
import GlobalCalendar from "@/components/GlobalCalendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const students = await prisma.student.findMany();
  const holidays = await prisma.holiday.findMany();

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

  const holidayRanges = holidays.map((h) => ({
    start: h.startDate.toISOString(),
    end: h.endDate.toISOString(),
    note: h.note,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Calendar — All Students</h1>
      <GlobalCalendar dueEntries={dueEntries} holidays={holidayRanges} />
    </div>
  );
}
