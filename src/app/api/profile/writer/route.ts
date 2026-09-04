import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, handleRouteError, jsonError } from "@/lib/api";
import { LANGUAGES, HANDWRITING_STYLES } from "@/lib/constants";

const LANGUAGE_SET = new Set<string>(LANGUAGES);
const HW_STYLE_SET = new Set<string>(HANDWRITING_STYLES);

const writerSchema = z
  .object({
    title: z.string().trim().min(3, "Give your profile a short headline").max(80),
    bio: z.string().trim().max(1500, "Keep the bio under 1500 characters").default(""),
    location: z.string().trim().max(80).default(""),
    languages: z
      .array(z.string())
      .max(LANGUAGES.length)
      .refine((arr) => arr.every((v) => LANGUAGE_SET.has(v)), "Unknown language"),
    subjects: z
      .array(z.string().trim().min(1).max(60))
      .min(1, "Pick at least one subject")
      .max(20, "Keep it to your strongest 20 subjects"),
    handwritingStyles: z
      .array(z.string())
      .max(HANDWRITING_STYLES.length)
      .refine((arr) => arr.every((v) => HW_STYLE_SET.has(v)), "Unknown handwriting style"),
    pricePerPage: z.coerce.number().int().min(1, "Price must be at least ₹1").max(500, "Price looks too high"),
    digitalPricePerPage: z.coerce.number().int().min(1, "Price must be at least ₹1").max(500, "Price looks too high"),
    minOrderValue: z.coerce.number().int().min(0).max(100000),
    availability: z.enum(["AVAILABLE", "BUSY", "AWAY"]),
    turnaroundDays: z.coerce.number().int().min(1, "At least 1 day").max(30, "Be realistic — under 30 days"),
    acceptsDigital: z.boolean(),
    acceptsHandwritten: z.boolean(),
  })
  .refine((d) => d.acceptsDigital || d.acceptsHandwritten, {
    message: "Accept at least one kind of work — digital or handwritten",
    path: ["acceptsDigital"],
  });

function toColumns(d: z.infer<typeof writerSchema>) {
  return {
    title: d.title,
    bio: d.bio,
    location: d.location,
    languages: d.languages.join(","),
    subjects: d.subjects.map((s) => s.trim()).filter(Boolean).join(","),
    handwritingStyles: d.handwritingStyles.join(","),
    pricePerPage: d.pricePerPage,
    digitalPricePerPage: d.digitalPricePerPage,
    minOrderValue: d.minOrderValue,
    availability: d.availability,
    turnaroundDays: d.turnaroundDays,
    acceptsDigital: d.acceptsDigital,
    acceptsHandwritten: d.acceptsHandwritten,
  };
}

/** Create the caller's writer profile ("Become a Note Writer"). */
export async function POST(req: Request) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const existing = await db.writerProfile.findUnique({
      where: { userId: auth.user.id },
    });
    if (existing) return jsonError(409, "You already have a note-writer profile");

    const data = writerSchema.parse(await req.json());
    const profile = await db.writerProfile.create({
      data: { userId: auth.user.id, ...toColumns(data) },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}

/** Update the caller's writer profile. */
export async function PATCH(req: Request) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const existing = await db.writerProfile.findUnique({
      where: { userId: auth.user.id },
    });
    if (!existing) return jsonError(404, "No note-writer profile yet — create one first");

    const data = writerSchema.parse(await req.json());
    const profile = await db.writerProfile.update({
      where: { id: existing.id },
      data: toColumns(data),
    });

    return NextResponse.json({ profile });
  } catch (e) {
    return handleRouteError(e);
  }
}
