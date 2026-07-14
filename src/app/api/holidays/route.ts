import { prisma } from "@/lib/prisma";
import { applyHolidayToAllActiveStudents } from "@/lib/holidays";
import { NextResponse } from "next/server";

export async function GET() {
  const holidays = await prisma.holiday.findMany({ orderBy: { startDate: "desc" } });
  return NextResponse.json(holidays);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.startDate || !body.endDate) {
    return NextResponse.json({ error: "Start and end date are required" }, { status: 400 });
  }

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  if (endDate < startDate) {
    return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
  }

  const result = await applyHolidayToAllActiveStudents(startDate, endDate, body.note || null);
  return NextResponse.json(result, { status: 201 });
}
