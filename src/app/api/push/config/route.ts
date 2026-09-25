import { NextResponse } from "next/server";
import { getOptionalAuthContext } from "@/lib/services/auth-service";
import { getPushConfigStatus } from "@/lib/notifications/web-push";

export const runtime = "nodejs";

export async function GET() {
  const context = await getOptionalAuthContext();

  if (!context) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { enabled, publicKey } = getPushConfigStatus();

  return NextResponse.json({
    enabled,
    vapidPublicKey: publicKey,
  });
}
