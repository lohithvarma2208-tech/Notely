import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());

    const user = await db.user.findUnique({ where: { email: body.email } });
    const valid = user && (await verifyPassword(body.password, user.passwordHash));
    if (!valid) {
      return jsonError(401, "Incorrect email or password");
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
