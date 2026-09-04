import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { googleAuthUrl, googleConfigured } from "@/lib/google";

const STATE_COOKIE = "notely_google_state";

/** Kicks off the Google OAuth flow: stores CSRF state, redirects to Google. */
export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "Google sign-in is not configured on this server" },
      { status: 501 }
    );
  }
  const state = crypto.randomBytes(16).toString("hex");
  cookies().set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(googleAuthUrl(state));
}
