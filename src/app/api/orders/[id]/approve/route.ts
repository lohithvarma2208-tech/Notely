import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { assertTransition } from "@/lib/order-machine";
import { notify } from "@/lib/notify";

/**
 * Student approves the delivered notes: READY_FOR_REVIEW → APPROVED →
 * COMPLETED. The writer's earning becomes ELIGIBLE for payout and their
 * denormalized stats are recomputed from all completed orders.
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
      return jsonError(403, "Only the student who placed this order can approve it");

    assertTransition(order.status, "APPROVED");
    assertTransition("APPROVED", "COMPLETED");

    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      }),
      db.transaction.updateMany({
        where: { orderId: order.id, type: "EARNING", status: "PENDING" },
        data: { status: "ELIGIBLE" },
      }),
    ]);

    // Recompute the writer's denormalized stats from every completed order.
    const completed = await db.order.findMany({
      where: { writerId: order.writerId, status: "COMPLETED" },
      select: { totalPages: true, deadline: true, completedAt: true },
    });
    const jobsCompleted = completed.length;
    const totalPagesWritten = completed.reduce((sum, o) => sum + o.totalPages, 0);
    const onTime = completed.filter(
      (o) => o.completedAt && o.completedAt <= o.deadline
    ).length;
    const onTimePercent =
      jobsCompleted === 0 ? 100 : Math.round((onTime / jobsCompleted) * 100);

    await db.writerProfile.update({
      where: { userId: order.writerId },
      data: { jobsCompleted, totalPagesWritten, onTimePercent },
    });

    await notify(
      order.writerId,
      "Order completed — earning unlocked",
      `${auth.user.name} approved “${order.request.title}”. Your earning is now eligible for payout.`,
      `/orders/${order.id}`
    );

    return NextResponse.json({ ok: true, orderId: order.id, status: "COMPLETED" });
  } catch (e) {
    return handleRouteError(e);
  }
}
