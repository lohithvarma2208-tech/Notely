import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleRouteError, jsonError, requireWriter } from "@/lib/api";
import { notify } from "@/lib/notify";

const patchSchema = z.object({
  status: z.literal("WITHDRAWN"),
});

/** The offering writer withdraws their own PENDING offer. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireWriter();
    if ("response" in auth) return auth.response;
    const { user } = auth;

    const offer = await db.offer.findUnique({
      where: { id: params.id },
      include: { request: true },
    });
    if (!offer) return jsonError(404, "Offer not found");
    if (offer.writerId !== user.id)
      return jsonError(403, "You can only withdraw your own offers");

    patchSchema.parse(await req.json());

    if (offer.status !== "PENDING")
      return jsonError(409, "Only pending offers can be withdrawn");

    const [updated] = await db.$transaction([
      db.offer.update({ where: { id: offer.id }, data: { status: "WITHDRAWN" } }),
      ...(offer.request.offerCount > 0
        ? [
            db.noteRequest.update({
              where: { id: offer.requestId },
              data: { offerCount: { decrement: 1 } },
            }),
          ]
        : []),
    ]);

    await notify(
      offer.request.studentId,
      "Offer withdrawn",
      `${user.name} withdrew their offer on "${offer.request.title}".`,
      `/requests/${offer.requestId}`
    );

    return NextResponse.json({ offer: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}
