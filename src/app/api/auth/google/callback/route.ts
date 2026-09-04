import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { exchangeCodeForProfile } from "@/lib/google";
import { grantTrial } from "@/lib/subscription";

const STATE_COOKIE = "notely_google_state";

/** Google OAuth callback: verifies state, exchanges the code, logs in. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = url.origin;

  const error = url.searchParams.get("error");
  if (error) return NextResponse.redirect(`${base}/login?oauth=denied`);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = cookies().get(STATE_COOKIE)?.value;
  cookies().delete(STATE_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${base}/login?oauth=invalid`);
  }

  try {
    const profile = await exchangeCodeForProfile(code);

    let user = await db.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      const trial = await grantTrial();
      user = await db.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.picture ?? null,
          passwordHash: "",
          ...trial,
        },
      });
    } else if (!user.avatarUrl && profile.picture) {
      await db.user.update({
        where: { id: user.id },
        data: { avatarUrl: profile.picture },
      });
    }

    await createSession(user.id);
    return NextResponse.redirect(`${base}/dashboard`);
  } catch (e) {
    console.error("Google OAuth callback failed:", e);
    return NextResponse.redirect(`${base}/login?oauth=failed`);
  }
}
