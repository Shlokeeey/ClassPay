import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const expected = process.env.APP_PASSCODE;

  if (!expected) {
    return NextResponse.json(
      { error: "Server isn't configured with a passcode yet (APP_PASSCODE missing in .env)." },
      { status: 500 }
    );
  }

  if (body.passcode !== expected) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("classpay_auth", expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
  return res;
}
