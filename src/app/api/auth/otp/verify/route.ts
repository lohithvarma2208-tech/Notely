import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, verifyOtp } from "@/lib/otp";
import { createSession } from "@/lib/auth";
import { grantTrial } from "@/lib/subscription";
import { handleRouteError, jsonError } from "@/lib/api";

const schema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  name: z.string().trim().min(2).max(60).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const phone = normalizePhone(body.phone);

    const result = await verifyOtp(phone, body.code);
    if (!result.ok) return jsonError(401, result.reason);

    let user = await db.user.findUnique({ where: { phone } });
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      const trial = await grantTrial();
      user = await db.user.create({
        data: {
          phone,
          name: body.name ?? `User ${phone.slice(-4)}`,
          // phone-only account: unique placeholder email keeps the schema happy
          email: `${phone.replace(/\D/g, "")}@phone.notely.local`,
          passwordHash: "",
          ...trial,
        },
      });
      // Phone ownership is proven by the OTP itself
      await db.writerProfile.updateMany({
        where: { userId: user.id },
        data: { phoneVerified: true },
      });
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, isNewUser, name: user.name });
  } catch (e) {
    return handleRouteError(e);
  }
}
