import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, jsonError, handleRouteError } from "@/lib/api";
import { notify } from "@/lib/notify";

const SENDER_SELECT = { select: { id: true, name: true, avatarUrl: true } } as const;

/** The order chat is private — only the order's student and writer may read/write. */
async function participantOrder(orderId: string, userId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || (order.studentId !== userId && order.writerId !== userId)) return null;
  return order;
}

const postSchema = z
  .object({
    body: z.string().max(2000).optional().default(""),
    // absolute URLs or site-relative paths (e.g. /uploads/scan.pdf)
    attachmentUrl: z
      .string()
      .max(500)
      .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), {
        message: "Invalid url",
      })
      .optional(),
    attachmentType: z.enum(["IMAGE", "DOCUMENT"]).optional(),
  })
  .refine((d) => d.body.trim().length > 0 || d.attachmentUrl, {
    message: "Write a message or attach a link",
  });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const order = await participantOrder(params.id, auth.user.id);
    if (!order) return jsonError(404, "Order not found");
    const messages = await db.message.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
      take: 300,
      include: { sender: SENDER_SELECT },
    });
    return NextResponse.json({ messages });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const order = await participantOrder(params.id, auth.user.id);
    if (!order) return jsonError(404, "Order not found");
    const data = postSchema.parse(await req.json());
    const message = await db.message.create({
      data: {
        orderId: order.id,
        senderId: auth.user.id,
        body: data.body.trim(),
        attachmentUrl: data.attachmentUrl ?? null,
        attachmentType: data.attachmentUrl ? data.attachmentType ?? "DOCUMENT" : null,
      },
      include: { sender: SENDER_SELECT },
    });
    const otherId =
      auth.user.id === order.studentId ? order.writerId : order.studentId;
    await notify(
      otherId,
      `New message from ${auth.user.name}`,
      data.body.trim().slice(0, 100) || "Sent an attachment",
      `/orders/${order.id}`
    );
    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}

/** Marks every message sent to the viewer as read. */
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const order = await participantOrder(params.id, auth.user.id);
    if (!order) return jsonError(404, "Order not found");
    await db.message.updateMany({
      where: { orderId: order.id, senderId: { not: auth.user.id }, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
