import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { handleRouteError, jsonError, requireWriter } from "@/lib/api";
import { getConfigNumber } from "@/lib/config";
import { hasActiveSubscription } from "@/lib/subscription";
import { notify } from "@/lib/notify";
import { inr } from "@/lib/utils";

/** A note writer makes an offer on an OPEN request. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireWriter();
    if ("response" in auth) return auth.response;
    const { user } = auth;

    // Subscription gate: an active trial or paid month is required to offer.
    if (!(await hasActiveSubscription(user)))
      return jsonError(
        402,
        "Your free trial has ended. Please subscribe to continue.",
        { needsSubscription: true }
      );

    const request = await db.noteRequest.findUnique({ where: { id: params.id } });
    if (!request) return jsonError(404, "Request not found");
    if (request.studentId === user.id)
      return jsonError(403, "You can't make an offer on your own request");
    if (request.status !== "OPEN")
      return jsonError(409, "This request is no longer accepting offers");

    // Offer price limits are platform-configurable — never hardcoded.
    const min = await getConfigNumber("minOfferRupees");
    const max = await getConfigNumber("maxOfferRupees");

    const schema = z.object({
      priceType: z.enum(["TOTAL", "PER_PAGE"]).default("TOTAL"),
      totalPrice: z.coerce
        .number()
        .int("Price must be a whole number of rupees")
        .min(min, `Minimum offer is ${inr(min)}`)
        .max(max, `Maximum offer is ${inr(max)}`)
        .optional(),
      pricePerPage: z.coerce
        .number()
        .int("Price per page must be a whole number of rupees")
        .min(1, "Price per page must be at least ₹1")
        .optional(),
      estimatedDays: z.coerce
        .number()
        .int("Delivery estimate must be a whole number of days")
        .min(1, "Delivery estimate must be at least 1 day")
        .max(90, "Delivery estimate looks too long"),
      message: z.string().max(2000, "Message is too long").default(""),
    });
    const body = schema.parse(await req.json());

    // Resolve the total price. PER_PAGE offers need a page estimate; when the
    // student marked pages as TBD, only a total price makes sense.
    let pricePerPage: number | null = null;
    let totalPrice: number;
    if (body.priceType === "PER_PAGE") {
      if (!body.pricePerPage) return jsonError(422, "Enter your price per page");
      if (!request.estPages)
        return jsonError(
          422,
          "The student hasn't specified a page count — please quote a total price"
        );
      pricePerPage = body.pricePerPage;
      totalPrice = pricePerPage * request.estPages;
      if (totalPrice < min || totalPrice > max)
        return jsonError(
          422,
          `Your estimated total (${inr(totalPrice)}) must be between ${inr(min)} and ${inr(max)}`
        );
    } else {
      if (!body.totalPrice) return jsonError(422, "Enter your total price");
      totalPrice = body.totalPrice;
    }

    // @@unique(requestId, writerId): a withdrawn/declined offer is revived
    // instead of creating a second row; a pending one is a friendly conflict.
    const existing = await db.offer.findUnique({
      where: { requestId_writerId: { requestId: request.id, writerId: user.id } },
    });
    if (existing?.status === "PENDING")
      return jsonError(409, "You have already made an offer on this request");

    let offer;
    if (existing) {
      offer = await db.offer.update({
        where: { id: existing.id },
        data: {
          priceType: body.priceType,
          totalPrice,
          pricePerPage,
          estimatedDays: body.estimatedDays,
          message: body.message.trim(),
          status: "PENDING",
          createdAt: new Date(),
        },
      });
    } else {
      try {
        offer = await db.offer.create({
          data: {
            requestId: request.id,
            writerId: user.id,
            priceType: body.priceType,
            totalPrice,
            pricePerPage,
            estimatedDays: body.estimatedDays,
            message: body.message.trim(),
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
          return jsonError(409, "You have already made an offer on this request");
        throw e;
      }
    }

    // Offers are tracked via offerCount; the request stays OPEN for more offers.
    await db.noteRequest.update({
      where: { id: request.id },
      data: { offerCount: { increment: 1 } },
    });

    await notify(
      request.studentId,
      `New offer from ${user.name}`,
      `${inr(totalPrice)} · delivery in ${body.estimatedDays} day${
        body.estimatedDays === 1 ? "" : "s"
      } — for "${request.title}".`,
      `/requests/${request.id}`
    );

    return NextResponse.json({ offer }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
