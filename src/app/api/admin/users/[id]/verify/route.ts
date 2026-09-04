import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { handleRouteError, jsonError } from "@/lib/api";
import { db } from "@/lib/db";

const verifySchema = z.object({
  field: z.enum(["identityVerified", "phoneVerified"]),
  value: z.boolean(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const body = verifySchema.parse(await req.json());

    const profile = await db.writerProfile.findUnique({
      where: { userId: params.id },
    });
    if (!profile) {
      return jsonError(404, "This user has no note-writer profile");
    }

    await db.writerProfile.update({
      where: { userId: params.id },
      data: { [body.field]: body.value },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
