import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body || {};

  if (!email || !password) {
    return NextResponse.json(
      { message: "email and password are required" },
      { status: 400 }
    );
  }

  // Mocked success response
  return NextResponse.json({ id: "mock-user-1", email });
}



