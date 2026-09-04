import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { assertTransition } from "@/lib/order-machine";
import { notify } from "@/lib/notify";

const progressSchema = z.object({
  pagesCompleted: z.number().int().min(0, "Pages completed cannot be negative"),
  note: z.string().trim().max(1000, "Note is too long").default(""),
  photoUrl: z.string().trim().max(500).optional(),
});

/**
 * Writer posts a progress update. Allowed while IN_PROGRESS; from
 * REVISION_REQUESTED the order first transitions back to IN_PROGRESS.
 * Pages can never move backwards or past the order total.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const data = progressSchema.parse(await req.json());

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { request: { select: { title: true } } },
    });
    if (!order) return jsonError(404, "Order not found");
    if (order.writerId !== auth.user.id)
      return jsonError(403, "Only the note writer assigned to this order can post progress");

    let status = order.status;
    if (status === "REVISION_REQUESTED") {
      assertTransition(status, "IN_PROGRESS");
      status = "IN_PROGRESS";
    } else if (status !== "IN_PROGRESS") {
      return jsonError(409, `Progress can only be posted while the order is in progress (current status: ${order.status})`);
    }

    if (data.pagesCompleted > order.totalPages)
      return jsonError(400, `Pages completed cannot exceed the order total of ${order.totalPages}`);
    if (data.pagesCompleted < order.pagesCompleted)
      return jsonError(400, "Pages completed cannot go backwards");

    await db.$transaction([
      db.progressUpdate.create({
        data: {
          orderId: order.id,
          pagesCompleted: data.pagesCompleted,
          note: data.note,
          photoUrl: data.photoUrl || null,
        },
      }),
      db.order.update({
        where: { id: order.id },
        data: { status, pagesCompleted: data.pagesCompleted },
      }),
    ]);

    await notify(
      order.studentId,
      "Progress on your notes",
      `${auth.user.name} has completed ${data.pagesCompleted}/${order.totalPages} pages of “${order.request.title}”.`,
      `/orders/${order.id}`
    );

    return NextResponse.json({ ok: true, orderId: order.id, status });
  } catch (e) {
    return handleRouteError(e);
  }
}
