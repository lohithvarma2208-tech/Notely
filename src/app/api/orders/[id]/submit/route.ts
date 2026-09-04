import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { assertTransition } from "@/lib/order-machine";
import { notify } from "@/lib/notify";

const deliveryFileSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required").max(200),
  url: z.string().trim().min(1, "File URL is required").max(500),
  fileType: z.string().trim().min(1).max(20),
  sizeKb: z.number().int().min(0).default(0),
});

const submitSchema = z.object({
  deliveryFiles: z.array(deliveryFileSchema).max(20).default([]),
  message: z.string().trim().max(2000, "Message is too long").default(""),
  deliveryStatus: z.enum(["PENDING", "HANDED_OFF", "IN_TRANSIT", "DELIVERED"]).optional(),
});

/**
 * Writer submits the finished notes for the student's review:
 * IN_PROGRESS → READY_FOR_REVIEW. All pages must be marked complete.
 * Digital orders require at least one delivery file; physical orders may
 * set a deliveryStatus (e.g. HANDED_OFF) at hand-off time.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const data = submitSchema.parse(await req.json());

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { request: { select: { title: true } } },
    });
    if (!order) return jsonError(404, "Order not found");
    if (order.writerId !== auth.user.id)
      return jsonError(403, "Only the note writer assigned to this order can submit it");

    assertTransition(order.status, "READY_FOR_REVIEW");

    if (order.pagesCompleted !== order.totalPages)
      return jsonError(400, `Mark all ${order.totalPages} pages complete (via a progress update) before submitting`);
    if (order.deliveryMethod === "DIGITAL" && data.deliveryFiles.length === 0)
      return jsonError(400, "Attach at least one delivery file for a digital order");

    const update: {
      status: string;
      deliveryFiles: string;
      deliveryStatus?: string;
    } = {
      status: "READY_FOR_REVIEW",
      deliveryFiles: JSON.stringify(data.deliveryFiles),
    };
    if (order.deliveryMethod === "PHYSICAL" && data.deliveryStatus)
      update.deliveryStatus = data.deliveryStatus;

    await db.$transaction([
      db.order.update({ where: { id: order.id }, data: update }),
      ...(data.message
        ? [
            db.message.create({
              data: { orderId: order.id, senderId: auth.user.id, body: data.message },
            }),
          ]
        : []),
    ]);

    await notify(
      order.studentId,
      "Your notes are ready for review",
      `${auth.user.name} submitted “${order.request.title}”. Review the delivery and approve it, or request a revision.`,
      `/orders/${order.id}`
    );

    return NextResponse.json({ ok: true, orderId: order.id, status: "READY_FOR_REVIEW" });
  } catch (e) {
    return handleRouteError(e);
  }
}
