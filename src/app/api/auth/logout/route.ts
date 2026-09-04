import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/api";

export async function POST() {
  try {
    clearSession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
