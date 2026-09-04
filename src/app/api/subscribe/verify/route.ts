import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { razorpayConfigured, verifyPaymentSignature } from "@/lib/payments";
import { notify } from "@/lib/notify";
import { formatDate } from "@/lib/utils";

const verifySchema = z.object({
  paymentId: z.string().trim().min(1, "A payment id is required"),
  razorpayOrderId: z.string().trim().optional(),
  signature: z.string().trim().optional(),
});

/** One subscription payment buys one month of access. */
const MONTH_MS = 30 * 86400000;

/**
 * Confirms a subscription payment after the client completes checkout.
 * RAZORPAY mode: signature is verified against the Razorpay secret.
 * MOCK mode: any non-empty paymentId is accepted.
 * On success the paid period extends by one month on top of whatever paid
 * time is left (paying early never shortens the current period).
 */
export async function POST(req: Request) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const { user } = auth;

    const data = verifySchema.parse(await req.json());

    if (razorpayConfigured()) {
      if (!data.razorpayOrderId || !data.signature)
        return jsonError(400, "razorpayOrderId and signature are required");
      const valid = verifyPaymentSignature({
        razorpayOrderId: data.razorpayOrderId,
        paymentId: data.paymentId,
        signature: data.signature,
      });
      if (!valid) return jsonError(400, "Payment signature verification failed");
    }

    const base = Math.max(Date.now(), user.subscriptionPaidUntil?.getTime() ?? 0);
    const paidUntil = new Date(base + MONTH_MS);

    await db.user.update({
      where: { id: user.id },
      data: { subscriptionPaidUntil: paidUntil },
    });

    await notify(
      user.id,
      `Subscription active until ${formatDate(paidUntil)}`,
      "You can keep posting note requests and making offers without interruption.",
      "/subscribe"
    );

    return NextResponse.json({ ok: true, paidUntil });
  } catch (e) {
    return handleRouteError(e);
  }
}
