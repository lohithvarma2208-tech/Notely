import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";
import { db } from "./db";
import type { User } from "@prisma/client";
import { ZodError } from "zod";
import { TransitionError } from "./order-machine";

export function jsonError(status: number, message: string, extra?: object) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Returns the authed user or a 401 response. */
export async function requireUser(): Promise<
  { user: User } | { response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { response: jsonError(401, "You must be signed in") };
  return { user };
}

/** Returns the authed user WITH a writer profile or a 403. */
export async function requireWriter(): Promise<
  | { user: User; writerProfile: NonNullable<Awaited<ReturnType<typeof getProfile>>> }
  | { response: NextResponse }
> {
  const auth = await requireUser();
  if ("response" in auth) return auth;
  const profile = await getProfile(auth.user.id);
  if (!profile)
    return {
      response: jsonError(403, "A note-writer profile is required for this action"),
    };
  return { user: auth.user, writerProfile: profile };
}

const getProfile = (userId: string) =>
  db.writerProfile.findUnique({ where: { userId } });

/** Uniform error wrapper for route handlers. */
export function handleRouteError(e: unknown) {
  if (e instanceof ZodError) {
    return jsonError(422, e.issues[0]?.message ?? "Invalid input", {
      issues: e.issues,
    });
  }
  if (e instanceof TransitionError) {
    return jsonError(409, e.message);
  }
  console.error(e);
  return jsonError(500, "Something went wrong");
}
