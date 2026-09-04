import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { assertTransition } from "@/lib/order-machine";
import { notify } from "@/lib/notify";

/** Writer begins work: FUNDED → IN_PROGRESS. */
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
    if (order.writerId !== auth.user.id)
      return jsonError(403, "Only the note writer assigned to this order can start it");

    assertTransition(order.status, "IN_PROGRESS");

    await db.order.update({
      where: { id: order.id },
      data: { status: "IN_PROGRESS" },
    });

    await notify(
      order.studentId,
      "Work started on your notes",
      `${auth.user.name} has started writing “${order.request.title}”.`,
      `/orders/${order.id}`
    );

    return NextResponse.json({ ok: true, orderId: order.id, status: "IN_PROGRESS" });
  } catch (e) {
    return handleRouteError(e);
  }
}
