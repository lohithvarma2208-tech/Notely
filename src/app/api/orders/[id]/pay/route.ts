import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { createPaymentSession } from "@/lib/payments";

/**
 * Student starts payment for an order that is AWAITING_PAYMENT.
 * Creates a payment session (MOCK when Razorpay keys are absent) and
 * returns it — nothing is persisted until /verify succeeds.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) return jsonError(404, "Order not found");
    if (order.studentId !== auth.user.id)
      return jsonError(403, "Only the student who placed this order can pay for it");
    if (order.status !== "AWAITING_PAYMENT")
      return jsonError(409, `This order is not awaiting payment (current status: ${order.status})`);

    const session = await createPaymentSession({
      orderId: order.id,
      amountRupees: order.agreedPrice,
    });

    return NextResponse.json({ ok: true, orderId: order.id, ...session });
  } catch (e) {
    return handleRouteError(e);
  }
}
