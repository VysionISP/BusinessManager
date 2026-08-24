import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// Must match the cookie name set in src/lib/auth.ts (createSession).
const SESSION_COOKIE = "session_token";

const PUBLIC_PATHS = ["/login", "/setup"];

// Paths a FIELD-role user may access — jobs, scheduling, forms/certificates,
// assets and stock. Everything else (pricing, payroll, reports, settings,
// customers/suppliers admin) is office/admin only.
const FIELD_ALLOWED_PREFIXES = ["/", "/jobs", "/scheduling", "/forms", "/assets", "/stock"];

function isFieldAllowed(pathname: string): boolean {
  return FIELD_ALLOWED_PREFIXES.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const userCount = await prisma.user.count();
    return NextResponse.redirect(new URL(userCount === 0 ? "/setup" : "/login", request.url));
  }

  const session = await prisma.session.findUnique({ where: { id: token }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || !session.user.active) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.user.role === "FIELD" && !isFieldAllowed(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
