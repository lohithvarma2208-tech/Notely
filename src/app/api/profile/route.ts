import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, handleRouteError } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  phone: z.string().trim().max(20, "Phone looks too long").optional().or(z.literal("")),
  college: z.string().trim().max(120, "College name looks too long").optional().or(z.literal("")),
});

export async function PATCH(req: Request) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const data = patchSchema.parse(await req.json());

    const user = await db.user.update({
      where: { id: auth.user.id },
      data: {
        name: data.name,
        phone: data.phone?.trim() ? data.phone.trim() : null,
        college: data.college?.trim() ? data.college.trim() : null,
      },
      select: { id: true, name: true, email: true, phone: true, college: true },
    });

    return NextResponse.json({ user });
  } catch (e) {
    return handleRouteError(e);
  }
}
