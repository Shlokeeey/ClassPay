import { prisma } from "@/lib/prisma";
import { computeScheduleDueDate } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: Number(params.id) },
    include: { payments: true },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const studentId = Number(params.id);

  const current = await prisma.student.findUnique({ where: { id: studentId } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.contact !== undefined) data.contact = body.contact;
  if (body.email !== undefined) data.email = body.email;
  if (body.monthlyFee !== undefined) data.monthlyFee = Number(body.monthlyFee);
  if (body.status !== undefined) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.joiningDate !== undefined) data.joiningDate = new Date(body.joiningDate);
  if (body.totalMonthsPaid !== undefined) data.totalMonthsPaid = Number(body.totalMonthsPaid);
  if (body.balanceAdjustment !== undefined) data.balanceAdjustment = Number(body.balanceAdjustment);

  // nextDueDate is never set directly — it's ALWAYS derived from joining date +
  // months paid + holiday offset, so it recomputes whenever any of those change.
  const joiningDate = data.joiningDate ?? current.joiningDate;
  const totalMonthsPaid =
    data.totalMonthsPaid !== undefined ? (data.totalMonthsPaid as number) : current.totalMonthsPaid;
  if (data.joiningDate !== undefined || data.totalMonthsPaid !== undefined) {
    data.nextDueDate = computeScheduleDueDate(
      joiningDate as Date,
      totalMonthsPaid,
      current.holidayOffsetDays
    );
  }

  const student = await prisma.student.update({
    where: { id: studentId },
    data,
  });

  return NextResponse.json(student);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.payment.deleteMany({ where: { studentId: Number(params.id) } });
  await prisma.student.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
