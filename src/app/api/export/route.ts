import { prisma } from "@/lib/prisma";
import { formatDate, outstandingAmount } from "@/lib/utils";
import { NextResponse } from "next/server";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const students = await prisma.student.findMany({
    include: { payments: true },
    orderBy: { name: "asc" },
  });

  const header = [
    "Name",
    "Contact",
    "Status",
    "Monthly Fee",
    "Joining Date",
    "Next Due Date",
    "Pending Amount",
    "Total Paid",
    "Payments Made",
  ];

  const rows = students.map((s) => {
    const totalPaid = s.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const pending = outstandingAmount(s.nextDueDate, s.monthlyFee);
    return [
      s.name,
      s.contact,
      s.status,
      s.monthlyFee,
      formatDate(s.joiningDate),
      formatDate(s.nextDueDate),
      pending,
      totalPaid,
      s.payments.length,
    ].map(csvEscape);
  });

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="classpay-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
