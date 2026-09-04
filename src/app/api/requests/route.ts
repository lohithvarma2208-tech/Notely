import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, handleRouteError, jsonError } from "@/lib/api";
import { hasActiveSubscription } from "@/lib/subscription";
import { NOTE_TYPES, WRITING_STYLES } from "@/lib/constants";

const noteTypeValues = NOTE_TYPES.map((t) => t.value) as [string, ...string[]];
const writingStyleValues = WRITING_STYLES.map((s) => s.value) as [
  string,
  ...string[],
];

const sourceFileSchema = z.object({
  fileName: z.string().min(1).max(200),
  fileType: z.enum(["PDF", "IMAGE", "DOCX", "PPTX", "OTHER"]),
  url: z.string().min(1).max(500),
  sizeKb: z.number().int().min(0).max(25600),
});

const createRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(6, "Give your request a short title (min 6 characters)")
      .max(120),
    subject: z.string().trim().min(2, "Pick or type a subject").max(60),
    noteType: z.enum(noteTypeValues),
    instructions: z.string().trim().max(4000).default(""),
    estPages: z.number().int().min(1).max(5000).nullable().optional(),
    pagesUnknown: z.boolean().default(false),
    writingStyle: z.enum(writingStyleValues),
    notebookSize: z.string().trim().max(40).nullable().optional(),
    ruled: z.enum(["RULED", "UNRULED"]).nullable().optional(),
    sides: z.enum(["SINGLE", "BOTH"]).nullable().optional(),
    penColor: z.string().trim().max(40).nullable().optional(),
    margins: z.boolean().default(false),
    headingStyle: z.string().trim().max(200).nullable().optional(),
    diagramReqs: z.string().trim().max(500).nullable().optional(),
    deliveryMethod: z.enum(["DIGITAL", "PHYSICAL"]),
    deliveryNotes: z.string().trim().max(1000).nullable().optional(),
    deadline: z.coerce.date(),
    budgetMin: z.number().int().min(50, "Minimum budget is ₹50").max(100000),
    budgetMax: z.number().int().min(50).max(100000),
    files: z.array(sourceFileSchema).max(20).default([]),
  })
  .refine((d) => d.budgetMin <= d.budgetMax, {
    message: "Minimum budget can't be more than the maximum budget",
    path: ["budgetMin"],
  })
  .refine((d) => d.deadline.getTime() > Date.now(), {
    message: "Deadline must be in the future",
    path: ["deadline"],
  })
  .refine((d) => d.pagesUnknown || (d.estPages != null && d.estPages >= 1), {
    message: "Estimate the pages, or let writers estimate for you",
    path: ["estPages"],
  })
  .refine(
    (d) =>
      d.deliveryMethod === "DIGITAL" ||
      (d.deliveryNotes != null && d.deliveryNotes.length >= 5),
    {
      message: "Add hand-off / delivery details for physical delivery",
      path: ["deliveryNotes"],
    }
  );

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  try {
    // Subscription gate: an active trial or paid month is required to post.
    if (!(await hasActiveSubscription(auth.user)))
      return jsonError(
        402,
        "Your free trial has ended. Please subscribe to continue.",
        { needsSubscription: true }
      );

    const body = createRequestSchema.parse(await req.json());

    const request = await db.noteRequest.create({
      data: {
        studentId: auth.user.id,
        title: body.title,
        subject: body.subject,
        noteType: body.noteType,
        instructions: body.instructions,
        estPages: body.pagesUnknown ? null : body.estPages ?? null,
        pagesUnknown: body.pagesUnknown,
        writingStyle: body.writingStyle,
        notebookSize: body.notebookSize || null,
        ruled: body.ruled || null,
        sides: body.sides || null,
        penColor: body.penColor || null,
        margins: body.margins,
        headingStyle: body.headingStyle || null,
        diagramReqs: body.diagramReqs || null,
        deliveryMethod: body.deliveryMethod,
        deliveryNotes:
          body.deliveryMethod === "PHYSICAL" ? body.deliveryNotes : null,
        deadline: body.deadline,
        budgetMin: body.budgetMin,
        budgetMax: body.budgetMax,
        status: "OPEN",
        sources: {
          create: body.files.map((f) => ({
            fileName: f.fileName,
            fileType: f.fileType,
            url: f.url,
            sizeKb: f.sizeKb,
          })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: request.id }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
