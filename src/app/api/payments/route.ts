import { recordPayment } from "@/lib/payments";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.studentId || body.amountPaid == null || !body.paymentDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const result = await recordPayment(
      Number(body.studentId),
      Number(body.amountPaid),
      new Date(body.paymentDate)
      // no monthsCovered override — calculated automatically from amount ÷ fee
    );
    return NextResponse.json(
      {
        ...result.payment,
        monthsCovered: result.monthsCovered,
        nextDueDate: result.nextDueDate,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }
}
