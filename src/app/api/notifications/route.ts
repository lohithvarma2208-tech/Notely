import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, handleRouteError } from "@/lib/api";

/** Latest 20 notifications for the signed-in user. */
export async function GET() {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const notifications = await db.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ notifications });
  } catch (e) {
    return handleRouteError(e);
  }
}

/** Mark every notification of the signed-in user as read. */
export async function POST() {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    await db.notification.updateMany({
      where: { userId: auth.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
