import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { notify } from "@/lib/notify";

const reviewSchema = z.object({
  overall: z.number().int().min(1).max(5),
  handwriting: z.number().int().min(1).max(5),
  accuracy: z.number().int().min(1).max(5),
  neatness: z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5),
  onTime: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional().default(""),
});

/**
 * Creates the student's review for a completed order (one per order) and
 * recomputes the writer's denormalized ratingAvg/ratingCount from every
 * review they have received.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { review: true, request: { select: { title: true } } },
    });
    // Non-participants get a 404, same as the order room itself.
    if (!order || order.studentId !== auth.user.id) {
      return jsonError(404, "Order not found");
    }
    if (order.status !== "COMPLETED") {
      return jsonError(409, "Reviews can only be left on completed orders");
    }
    if (order.review) {
      return jsonError(409, "This order already has a review");
    }

    const data = reviewSchema.parse(await req.json());

    await db.review.create({
      data: {
        orderId: order.id,
        studentId: auth.user.id,
        writerId: order.writerId,
        overall: data.overall,
        handwriting: data.handwriting,
        accuracy: data.accuracy,
        neatness: data.neatness,
        communication: data.communication,
        onTime: data.onTime,
        text: data.text.trim(),
      },
    });

    // Recompute the writer's public rating from all of their reviews.
    const agg = await db.review.aggregate({
      where: { writerId: order.writerId },
      _avg: { overall: true },
      _count: { _all: true },
    });
    await db.writerProfile.updateMany({
      where: { userId: order.writerId },
      data: {
        ratingAvg: Math.round((agg._avg.overall ?? 0) * 100) / 100,
        ratingCount: agg._count._all,
      },
    });

    await notify(
      order.writerId,
      `New ${data.overall}★ review`,
      `${auth.user.name} reviewed "${order.request.title}".`,
      `/orders/${order.id}`
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
