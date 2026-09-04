import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { assertTransition } from "@/lib/order-machine";
import { notify } from "@/lib/notify";

const revisionSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Tell the writer what needs to change")
    .max(2000, "Message is too long"),
});

/**
 * Student asks for changes on a submitted order:
 * READY_FOR_REVIEW → REVISION_REQUESTED. The message is recorded in the
 * order chat so the writer knows exactly what to fix.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const data = revisionSchema.parse(await req.json());

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { request: { select: { title: true } } },
    });
    if (!order) return jsonError(404, "Order not found");
    if (order.studentId !== auth.user.id)
      return jsonError(403, "Only the student who placed this order can request a revision");

    assertTransition(order.status, "REVISION_REQUESTED");

    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: { status: "REVISION_REQUESTED" },
      }),
      db.message.create({
        data: { orderId: order.id, senderId: auth.user.id, body: data.message },
      }),
    ]);

    await notify(
      order.writerId,
      "Revision requested",
      `${auth.user.name} asked for changes on “${order.request.title}”: ${data.message}`,
      `/orders/${order.id}`
    );

    return NextResponse.json({ ok: true, orderId: order.id, status: "REVISION_REQUESTED" });
  } catch (e) {
    return handleRouteError(e);
  }
}
