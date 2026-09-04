import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { jsonError } from "./api";

/**
 * Admin authentication is completely separate from user sessions:
 * its own cookie, its own 12h JWT, and credentials that live only in
 * server-side env vars (ADMIN_EMAIL / ADMIN_PASSCODE) — never in the DB.
 */
const COOKIE = "notely_admin";
const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");

export function adminConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSCODE);
}

/** Constant-time credential check. */
export function verifyAdminCredentials(email: string, passcode: string) {
  const e = process.env.ADMIN_EMAIL ?? "";
  const p = process.env.ADMIN_PASSCODE ?? "";
  if (!e || !p) return false;
  const a = Buffer.from(`${email}\n${passcode}`);
  const b = Buffer.from(`${e}\n${p}`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createAdminSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearAdminSession() {
  cookies().delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/** API-route guard: returns a 401 response or null when the caller is admin. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (!(await isAdmin())) return jsonError(401, "Admin access required");
  return null;
}
