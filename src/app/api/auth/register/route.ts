import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { grantTrial } from "@/lib/subscription";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  college: z.string().trim().max(120).optional(),
  intent: z.enum(["student", "writer"]).default("student"),
});

export async function POST(req: Request) {
  try {
    const body = registerSchema.parse(await req.json());

    const existing = await db.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    });
    if (existing) {
      return jsonError(409, "An account with this email already exists", {
        field: "email",
      });
    }

    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: await hashPassword(body.password),
        college: body.college || null,
        // Every new account starts on the free trial; its length comes from
        // PlatformConfig via grantTrial — never hardcoded. (The helper's id
        // arg is unused today, so a placeholder is fine before the id exists.)
        ...(await grantTrial("new-signup")),
        // Writer intent gets an empty profile so requireWriter passes and
        // they can complete it from their dashboard.
        writerProfile:
          body.intent === "writer" ? { create: { title: "Note Writer" } } : undefined,
      },
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
