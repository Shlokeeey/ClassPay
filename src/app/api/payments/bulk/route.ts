import { prisma } from "@/lib/prisma";
import { recordPayment } from "@/lib/payments";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { studentIds, monthsCovered, paymentDate } = body;

  if (!Array.isArray(studentIds) || studentIds.length === 0 || !paymentDate) {
    return NextResponse.json({ error: "studentIds and paymentDate are required" }, { status: 400 });
  }

  const months = monthsCovered ? Number(monthsCovered) : 1;
  const date = new Date(paymentDate);

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds.map(Number) } },
  });

  const results = [];
  for (const student of students) {
    // Each student pays their OWN monthly fee × months — not a shared flat amount.
    const amount = student.monthlyFee * months;
    const result = await recordPayment(student.id, amount, date, months);
    results.push({ studentId: student.id, name: student.name, paymentId: result.payment.id });
  }

  return NextResponse.json({ ok: true, count: results.length, results });
}
