import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin";
import { handleRouteError } from "@/lib/api";

export async function POST() {
  try {
    clearAdminSession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
