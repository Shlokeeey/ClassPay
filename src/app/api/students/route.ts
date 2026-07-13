import { prisma } from "@/lib/prisma";
import { computeNextDueDate } from "@/lib/utils";
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
      // First payment is due one month AFTER joining (a full month of tuition
      // must complete before the first bill), not on the joining day itself.
      nextDueDate: computeNextDueDate(new Date(body.joiningDate), 1),
    },
  });

  return NextResponse.json(student, { status: 201 });
}
