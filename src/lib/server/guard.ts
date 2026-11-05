import "server-only";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/**
 * Optional protection for endpoints that spend API credits or change stored data.
 * When ADMIN_TOKEN is set, requests must send it in the x-admin-token header.
 */
export function requireWriteAccess(req: Request): NextResponse | null {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return null;
  const got = req.headers.get("x-admin-token") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length === b.length && timingSafeEqual(a, b)) return null;
  return NextResponse.json({ error: "This action requires the admin token (enter it in the Evaluation Lab)." }, { status: 401 });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Stricter guard for actions that spend AI quota or write shared data on a public deployment:
 * on Vercel, ADMIN_TOKEN must be configured (otherwise the action is disabled); locally it falls
 * back to requireWriteAccess.
 */
export function requireAdmin(req: Request): NextResponse | null {
  if (process.env.VERCEL && !process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "This action is disabled on this public deployment (no ADMIN_TOKEN configured)." }, { status: 403 });
  }
  return requireWriteAccess(req);
}
