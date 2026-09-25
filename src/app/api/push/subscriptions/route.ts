import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getOptionalAuthContext } from "@/lib/services/auth-service";
import {
  deletePushSubscription,
  isValidBrowserPushSubscription,
  upsertPushSubscription,
} from "@/lib/notifications/push-subscription-repository";
import { getPushConfigStatus } from "@/lib/notifications/web-push";

export const runtime = "nodejs";

async function getAuthenticatedContextOrResponse() {
  const context = await getOptionalAuthContext();

  if (!context) {
    return {
      response: NextResponse.json({ error: "No autenticado." }, { status: 401 }),
      context: null,
    };
  }

  return { response: null, context };
}

export async function POST(request: Request) {
  const { response, context } = await getAuthenticatedContextOrResponse();

  if (response || !context) {
    return response;
  }

  const { enabled } = getPushConfigStatus();

  if (!enabled) {
    return NextResponse.json(
      { error: "Push no está configurado en el servidor." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const subscription = body?.subscription;

  if (!isValidBrowserPushSubscription(subscription)) {
    return NextResponse.json({ error: "Suscripción push inválida." }, { status: 400 });
  }

  const headerStore = await headers();

  await upsertPushSubscription(context.supabase, {
    tenantId: context.user.tenantId,
    profileId: context.user.id,
    subscription,
    userAgent: headerStore.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { response, context } = await getAuthenticatedContextOrResponse();

  if (response || !context) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : undefined;

  await deletePushSubscription(context.supabase, {
    tenantId: context.user.tenantId,
    profileId: context.user.id,
    endpoint,
  });

  return NextResponse.json({ ok: true });
}
