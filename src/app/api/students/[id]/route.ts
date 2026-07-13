import { prisma } from "@/lib/prisma";
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
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.contact !== undefined) data.contact = body.contact;
  if (body.email !== undefined) data.email = body.email;
  if (body.monthlyFee !== undefined) data.monthlyFee = Number(body.monthlyFee);
  if (body.status !== undefined) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.joiningDate !== undefined) data.joiningDate = new Date(body.joiningDate);
  if (body.nextDueDate !== undefined) data.nextDueDate = new Date(body.nextDueDate);

  const student = await prisma.student.update({
    where: { id: Number(params.id) },
    data,
  });

  return NextResponse.json(student);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.payment.deleteMany({ where: { studentId: Number(params.id) } });
  await prisma.student.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
