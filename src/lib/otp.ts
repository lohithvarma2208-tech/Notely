import crypto from "crypto";
import { db } from "./db";

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function hashCode(phone: string, code: string): string {
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET ?? "dev-secret")
    .update(`${phone}:${code}`)
    .digest("hex");
}

/** Stores a fresh OTP for the phone (replaces any previous one). */
export async function createOtp(phone: string, code: string) {
  await db.otpCode.deleteMany({ where: { phone } });
  await db.otpCode.create({
    data: {
      phone,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });
}

/** Constant-time-ish verify with attempt + expiry checks. Consumes on success. */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const rec = await db.otpCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (!rec) return { ok: false, reason: "No OTP was requested for this number" };
  if (rec.expiresAt.getTime() < Date.now()) {
    await db.otpCode.delete({ where: { id: rec.id } });
    return { ok: false, reason: "OTP expired — request a new one" };
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    await db.otpCode.delete({ where: { id: rec.id } });
    return { ok: false, reason: "Too many wrong attempts — request a new OTP" };
  }
  if (rec.codeHash !== hashCode(phone, code)) {
    await db.otpCode.update({
      where: { id: rec.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "Incorrect OTP" };
  }
  await db.otpCode.delete({ where: { id: rec.id } });
  return { ok: true };
}

/** Basic Indian/international phone normalization for the MVP. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  return `+${digits}`;
}
