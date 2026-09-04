import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { handleRouteError } from "@/lib/api";
import { setConfig } from "@/lib/config";

const intStr = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number`);

const configSchema = z
  .object({
    platformFeePercent: z
      .string()
      .trim()
      .regex(/^\d+(\.\d+)?$/, "Platform fee must be a number")
      .refine(
        (v) => Number(v) >= 0 && Number(v) <= 100,
        "Platform fee must be between 0 and 100"
      ),
    subscriptionPriceInr: intStr("Monthly subscription price"),
    subscriptionTrialDays: intStr("Free trial length").refine(
      (v) => Number(v) >= 1,
      "Free trial length must be at least 1 day"
    ),
    minOfferRupees: intStr("Minimum offer"),
    maxOfferRupees: intStr("Maximum offer"),
  })
  .refine((d) => Number(d.minOfferRupees) <= Number(d.maxOfferRupees), {
    message: "Minimum offer cannot be higher than the maximum offer",
    path: ["minOfferRupees"],
  });

export async function POST(req: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const body = configSchema.parse(await req.json());
    await Promise.all(
      Object.entries(body).map(([key, value]) => setConfig(key, value))
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
