import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { notify } from "@/lib/notify";

const deliverySchema = z.object({
  deliveryStatus: z.enum(["PENDING", "HANDED_OFF", "IN_TRANSIT", "DELIVERED"]),
  trackingRef: z.string().trim().max(120, "Tracking reference is too long").optional(),
});

/**
 * Either participant records physical-delivery progress (hand-off,
 * courier tracking, delivered). This updates delivery fields only — the
 * order status machine is untouched.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const data = deliverySchema.parse(await req.json());

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { request: { select: { title: true } } },
    });
    if (!order) return jsonError(404, "Order not found");
    const isStudent = order.studentId === auth.user.id;
    const isWriter = order.writerId === auth.user.id;
    if (!isStudent && !isWriter)
      return jsonError(403, "Only the student or note writer on this order can update delivery");
    if (order.deliveryMethod !== "PHYSICAL")
      return jsonError(400, "Delivery tracking only applies to physical orders");

    await db.order.update({
      where: { id: order.id },
      data: {
        deliveryStatus: data.deliveryStatus,
        ...(data.trackingRef !== undefined
          ? { trackingRef: data.trackingRef || null }
          : {}),
      },
    });

    const counterpartId = isStudent ? order.writerId : order.studentId;
    await notify(
      counterpartId,
      "Delivery update",
      `${auth.user.name} marked “${order.request.title}” as ${data.deliveryStatus
        .toLowerCase()
        .replace("_", " ")}${data.trackingRef ? ` (tracking: ${data.trackingRef})` : ""}.`,
      `/orders/${order.id}`
    );

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      status: order.status,
      deliveryStatus: data.deliveryStatus,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
