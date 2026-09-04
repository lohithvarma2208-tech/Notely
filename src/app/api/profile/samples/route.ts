import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireWriter, handleRouteError, jsonError } from "@/lib/api";
import { SAMPLE_STYLES, type SampleStyle } from "@/lib/constants";

const STYLE_VALUES = SAMPLE_STYLES.map((s) => s.value) as [
  SampleStyle,
  ...SampleStyle[],
];

const createSchema = z.object({
  title: z.string().trim().min(2, "Give the sample a title").max(80),
  style: z.enum(STYLE_VALUES),
  fontKey: z.enum(["hand", "hand2", "hand3"]),
  sampleText: z
    .string()
    .trim()
    .min(10, "Write at least a couple of lines so students can judge your style")
    .max(2000, "Keep samples under 2000 characters"),
});

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(2).max(80).optional(),
  style: z.enum(STYLE_VALUES).optional(),
  fontKey: z.enum(["hand", "hand2", "hand3"]).optional(),
  sampleText: z.string().trim().min(10).max(2000).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const deleteSchema = z.object({ id: z.string().min(1) });

/** Add a handwriting sample to the caller's writer profile. */
export async function POST(req: Request) {
  try {
    const auth = await requireWriter();
    if ("response" in auth) return auth.response;

    const data = createSchema.parse(await req.json());
    const max = await db.handwritingSample.aggregate({
      where: { writerId: auth.writerProfile.id },
      _max: { sortOrder: true },
    });

    const sample = await db.handwritingSample.create({
      data: {
        writerId: auth.writerProfile.id,
        ...data,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({ sample }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}

/** Update one of the caller's handwriting samples. */
export async function PATCH(req: Request) {
  try {
    const auth = await requireWriter();
    if ("response" in auth) return auth.response;

    const { id, ...fields } = updateSchema.parse(await req.json());
    const sample = await db.handwritingSample.findUnique({ where: { id } });
    if (!sample || sample.writerId !== auth.writerProfile.id)
      return jsonError(404, "Sample not found");

    const updated = await db.handwritingSample.update({
      where: { id },
      data: fields,
    });

    return NextResponse.json({ sample: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}

/** Delete one of the caller's handwriting samples. */
export async function DELETE(req: Request) {
  try {
    const auth = await requireWriter();
    if ("response" in auth) return auth.response;

    const { id } = deleteSchema.parse(await req.json());
    const sample = await db.handwritingSample.findUnique({ where: { id } });
    if (!sample || sample.writerId !== auth.writerProfile.id)
      return jsonError(404, "Sample not found");

    await db.handwritingSample.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
