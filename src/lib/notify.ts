import { db } from "./db";

export async function notify(
  userId: string,
  title: string,
  body = "",
  link?: string
) {
  await db.notification.create({
    data: { userId, title, body, link },
  });
}
