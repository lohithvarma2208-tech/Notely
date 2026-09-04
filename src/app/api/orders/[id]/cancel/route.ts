import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { assertTransition } from "@/lib/order-machine";
import { notify } from "@/lib/notify";

/**
 * Student cancels an order while it is AWAITING_PAYMENT, FUNDED or
 * IN_PROGRESS. An unpaid order is simply CANCELLED and the request goes
 * back to OPEN. A paid order is CANCELLED and then REFUNDED (two
 * transitions), and its pending earning transaction is voided.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { request: { select: { title: true } } },
    });
    if (!order) return jsonError(404, "Order not found");
    if (order.studentId !== auth.user.id)
      return jsonError(403, "Only the student who placed this order can cancel it");

    const wasPaid = order.paidAt !== null;

    assertTransition(order.status, "CANCELLED");

    let status = "CANCELLED";
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      if (wasPaid) {
        // Escrowed payment must be returned: CANCELLED → REFUNDED, and the
        // writer's pending earning for this order is voided.
        assertTransition("CANCELLED", "REFUNDED");
        await tx.order.update({
          where: { id: order.id },
          data: { status: "REFUNDED" },
        });
        await tx.transaction.deleteMany({
          where: { orderId: order.id, type: "EARNING", status: "PENDING" },
        });
        status = "REFUNDED";
      } else {
        // Never paid — reopen the request so the student can collect new offers.
        await tx.noteRequest.update({
          where: { id: order.requestId },
          data: { status: "OPEN" },
        });
      }
    });

    await notify(
      order.writerId,
      "Order cancelled",
      wasPaid
        ? `${auth.user.name} cancelled “${order.request.title}”. The payment will be refunded to the student.`
        : `${auth.user.name} cancelled “${order.request.title}” before payment.`,
      `/orders/${order.id}`
    );

    return NextResponse.json({ ok: true, orderId: order.id, status });
  } catch (e) {
    return handleRouteError(e);
  }
}
