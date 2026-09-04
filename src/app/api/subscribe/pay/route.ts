import { NextResponse } from "next/server";
import { requireUser, handleRouteError } from "@/lib/api";
import { getConfigNumber } from "@/lib/config";
import { createPaymentSession } from "@/lib/payments";

/**
 * Starts a subscription payment for the signed-in user. Creates a payment
 * session (MOCK when Razorpay keys are absent) and returns it — nothing is
 * persisted until /api/subscribe/verify succeeds. The monthly price is a
 * PlatformConfig value, editable by the admin — never hardcoded.
 */
export async function POST() {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const session = await createPaymentSession({
      orderId: `sub_${auth.user.id}_${Date.now()}`,
      amountRupees: await getConfigNumber("subscriptionPriceInr"),
    });

    return NextResponse.json({ ok: true, ...session });
  } catch (e) {
    return handleRouteError(e);
  }
}
