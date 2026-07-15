import { prisma } from "@/lib/prisma";
import { computeScheduleDueDate } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const students = await prisma.student.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(students);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.name || !body.contact || !body.joiningDate || body.monthlyFee == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const student = await prisma.student.create({
    data: {
      name: body.name,
      contact: body.contact,
      email: body.email || null,
      joiningDate: new Date(body.joiningDate),
      monthlyFee: Number(body.monthlyFee),
      notes: body.notes || null,
      status: "Active",
      totalMonthsPaid: 0,
      holidayOffsetDays: 0,
      // Pay-upfront model: the very first payment is due ON the joining date
      // itself — the month is taught only after it's paid for, not before.
      nextDueDate: computeScheduleDueDate(new Date(body.joiningDate), 0, 0),
    },
  });

  return NextResponse.json(student, { status: 201 });
}
