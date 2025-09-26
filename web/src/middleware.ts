import { type NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Pass-through by default; we only ensure Supabase can set cookies on SSR.
  // You can add route protection later, e.g., redirect unauthenticated users.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|api/db-status).*)",
  ],
};


