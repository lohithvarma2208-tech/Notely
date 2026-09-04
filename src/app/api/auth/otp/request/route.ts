import { NextResponse } from "next/server";
import { z } from "zod";
import { createOtp, generateOtp, normalizePhone } from "@/lib/otp";
import { sendSms, smsConfigured } from "@/lib/sms";
import { handleRouteError } from "@/lib/api";

const schema = z.object({
  phone: z.string().min(8, "Enter a valid phone number").max(20),
});

export async function POST(req: Request) {
  try {
    const { phone: raw } = schema.parse(await req.json());
    const phone = normalizePhone(raw);

    const code = generateOtp();
    await createOtp(phone, code);
    const { mode } = await sendSms(phone, `Your Notely login OTP is ${code}. It expires in 5 minutes.`);

    return NextResponse.json({
      ok: true,
      mode,
      phone,
      // Only ever present in DEV mode (no SMS provider configured)
      ...(smsConfigured() ? {} : { devOtp: code }),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
