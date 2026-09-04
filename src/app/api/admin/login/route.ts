import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession, verifyAdminCredentials } from "@/lib/admin";
import { handleRouteError, jsonError } from "@/lib/api";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .transform((v) => v.trim().toLowerCase()),
  passcode: z.string().min(1, "Passcode is required"),
});

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());

    if (!verifyAdminCredentials(body.email, body.passcode)) {
      return jsonError(401, "Invalid credentials");
    }

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
