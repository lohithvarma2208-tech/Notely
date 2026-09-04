import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { handleRouteError, jsonError, requireUser } from "@/lib/api";
import { notify } from "@/lib/notify";

const patchSchema = z.object({
  status: z.literal("CANCELLED").optional(),
  budgetMin: z.coerce.number().int().min(1, "Budget must be at least ₹1").optional(),
  budgetMax: z.coerce.number().int().min(1, "Budget must be at least ₹1").optional(),
  deadline: z.string().min(1).optional(),
  instructions: z.string().max(5000, "Instructions are too long").optional(),
});

/** Owner-only: cancel an OPEN request, or edit budget/deadline/instructions. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const request = await db.noteRequest.findUnique({
      where: { id: params.id },
      include: { offers: { where: { status: "PENDING" } } },
    });
    if (!request) return jsonError(404, "Request not found");
    if (request.studentId !== auth.user.id)
      return jsonError(403, "Only the student who posted this request can change it");

    const body = patchSchema.parse(await req.json());

    // ---------- Cancel ----------
    if (body.status === "CANCELLED") {
      if (request.status !== "OPEN")
        return jsonError(409, "Only open requests can be cancelled");
      const [updated] = await db.$transaction([
        db.noteRequest.update({
          where: { id: request.id },
          data: { status: "CANCELLED" },
        }),
        db.offer.updateMany({
          where: { requestId: request.id, status: "PENDING" },
          data: { status: "DECLINED" },
        }),
      ]);
      await Promise.all(
        request.offers.map((o) =>
          notify(
            o.writerId,
            "Request cancelled",
            `"${request.title}" was cancelled by the student, so your offer was declined.`,
            "/find-work"
          )
        )
      );
      return NextResponse.json({ request: updated });
    }

    // ---------- Edit ----------
    if (request.status !== "OPEN")
      return jsonError(409, "Only open requests can be edited");

    const budgetMin = body.budgetMin ?? request.budgetMin;
    const budgetMax = body.budgetMax ?? request.budgetMax;
    if (budgetMax < budgetMin)
      return jsonError(422, "Maximum budget must be at least the minimum budget");

    const data: Prisma.NoteRequestUpdateInput = {};
    if (body.budgetMin !== undefined) data.budgetMin = body.budgetMin;
    if (body.budgetMax !== undefined) data.budgetMax = body.budgetMax;
    if (body.deadline !== undefined) {
      const d = new Date(body.deadline);
      if (Number.isNaN(d.getTime())) return jsonError(422, "Invalid deadline");
      if (d.getTime() <= Date.now())
        return jsonError(422, "Deadline must be in the future");
      data.deadline = d;
    }
    if (body.instructions !== undefined) data.instructions = body.instructions.trim();
    if (Object.keys(data).length === 0) return jsonError(422, "Nothing to update");

    const updated = await db.noteRequest.update({ where: { id: request.id }, data });
    return NextResponse.json({ request: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}
