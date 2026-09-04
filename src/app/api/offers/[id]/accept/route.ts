import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { getPlatformFeePercent, splitFee } from "@/lib/config";
import { notify } from "@/lib/notify";

/**
 * Student accepts an offer on their request. Creates the order in
 * AWAITING_PAYMENT, accepts this offer, declines the rest and moves the
 * request to IN_ORDER — all atomically.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const offer = await db.offer.findUnique({
      where: { id: params.id },
      include: { request: true },
    });
    if (!offer) return jsonError(404, "Offer not found");
    if (offer.request.studentId !== auth.user.id)
      return jsonError(403, "Only the student who posted this request can accept an offer");
    if (offer.request.status !== "OPEN")
      return jsonError(409, "This request is no longer open for offers");
    if (offer.status !== "PENDING")
      return jsonError(409, "This offer is no longer pending");

    const feePct = await getPlatformFeePercent();
    const { platformFee, writerEarning } = splitFee(offer.totalPrice, feePct);

    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          requestId: offer.requestId,
          offerId: offer.id,
          studentId: offer.request.studentId,
          writerId: offer.writerId,
          status: "AWAITING_PAYMENT",
          totalPages: offer.request.estPages ?? 0,
          agreedPrice: offer.totalPrice,
          pricePerPage: offer.pricePerPage,
          platformFeePct: feePct,
          platformFee,
          writerEarning,
          deadline: offer.request.deadline,
          deliveryMethod: offer.request.deliveryMethod,
          deliveryStatus:
            offer.request.deliveryMethod === "PHYSICAL" ? "PENDING" : null,
        },
      });
      await tx.offer.update({
        where: { id: offer.id },
        data: { status: "ACCEPTED" },
      });
      await tx.offer.updateMany({
        where: {
          requestId: offer.requestId,
          id: { not: offer.id },
          status: "PENDING",
        },
        data: { status: "DECLINED" },
      });
      await tx.noteRequest.update({
        where: { id: offer.requestId },
        data: { status: "IN_ORDER" },
      });
      return created;
    });

    await notify(
      offer.writerId,
      "Your offer was accepted",
      `${auth.user.name} accepted your offer for “${offer.request.title}”. The order will begin once payment is completed.`,
      `/orders/${order.id}`
    );

    return NextResponse.json({ ok: true, orderId: order.id, status: order.status });
  } catch (e) {
    return handleRouteError(e);
  }
}
