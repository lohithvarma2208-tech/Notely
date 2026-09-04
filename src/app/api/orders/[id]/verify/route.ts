import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { assertTransition } from "@/lib/order-machine";
import { razorpayConfigured, verifyPaymentSignature } from "@/lib/payments";
import { notify } from "@/lib/notify";

const verifySchema = z.object({
  paymentId: z.string().trim().min(1, "A payment id is required"),
  razorpayOrderId: z.string().trim().optional(),
  signature: z.string().trim().optional(),
});

/**
 * Confirms payment after the client completes the checkout session.
 * RAZORPAY mode: signature is verified against the Razorpay secret.
 * MOCK mode: any non-empty paymentId is accepted.
 * On success the order moves AWAITING_PAYMENT → FUNDED and the writer's
 * earning transaction is recorded as PENDING.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const data = verifySchema.parse(await req.json());

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { request: { select: { title: true } } },
    });
    if (!order) return jsonError(404, "Order not found");
    if (order.studentId !== auth.user.id)
      return jsonError(403, "Only the student who placed this order can pay for it");

    assertTransition(order.status, "FUNDED");

    const mode = razorpayConfigured() ? ("RAZORPAY" as const) : ("MOCK" as const);
    if (mode === "RAZORPAY") {
      if (!data.razorpayOrderId || !data.signature)
        return jsonError(400, "razorpayOrderId and signature are required");
      const valid = verifyPaymentSignature({
        razorpayOrderId: data.razorpayOrderId,
        paymentId: data.paymentId,
        signature: data.signature,
      });
      if (!valid) return jsonError(400, "Payment signature verification failed");
    }

    const pricePerPage =
      order.pricePerPage ??
      (order.totalPages > 0 ? Math.round(order.agreedPrice / order.totalPages) : order.agreedPrice);
    const note = `${order.request.title} — ${order.totalPages} pages × ₹${pricePerPage}`;

    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: { status: "FUNDED", paymentId: data.paymentId, paymentMode: mode, paidAt: new Date() },
      }),
      db.transaction.create({
        data: {
          writerId: order.writerId,
          orderId: order.id,
          type: "EARNING",
          status: "PENDING",
          amount: order.writerEarning,
          note,
        },
      }),
    ]);

    await notify(
      order.writerId,
      "Payment received — you can start",
      `Payment for “${order.request.title}” is in escrow. You can start writing the notes now.`,
      `/orders/${order.id}`
    );

    return NextResponse.json({ ok: true, mode, orderId: order.id, status: "FUNDED" });
  } catch (e) {
    return handleRouteError(e);
  }
}
