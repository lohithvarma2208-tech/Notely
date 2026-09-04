import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import type { User } from "@prisma/client";

const COOKIE = "notely_session";
const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return db.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

/** Like getSessionUser but includes the writer profile. */
export async function getSessionUserWithProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  const writerProfile = await db.writerProfile.findUnique({
    where: { userId: user.id },
  });
  return { ...user, writerProfile };
}
