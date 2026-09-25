import webPush from "web-push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  deletePushSubscriptionByEndpoint,
  listTenantPushSubscriptions,
  markPushSubscriptionFailure,
  type PushSubscriptionRecord,
} from "@/lib/notifications/push-subscription-repository";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

function getVapidPrivateKey() {
  return process.env.VAPID_PRIVATE_KEY ?? "";
}

function getVapidSubject() {
  return process.env.VAPID_SUBJECT ?? "mailto:soporte@sabore.cl";
}

export function getPushConfigStatus() {
  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();

  return {
    enabled: Boolean(publicKey && privateKey),
    publicKey,
  };
}

function configureWebPush() {
  const { publicKey, enabled } = getPushConfigStatus();
  const privateKey = getVapidPrivateKey();

  if (!enabled) {
    throw new Error("Push no está configurado. Define NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.");
  }

  webPush.setVapidDetails(getVapidSubject(), publicKey, privateKey);
}

function toWebPushSubscription(subscription: PushSubscriptionRecord) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };
}

function isGoneError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    ((error as { statusCode?: number }).statusCode === 404 || (error as { statusCode?: number }).statusCode === 410)
  );
}

export async function sendTenantPushNotification(tenantId: string, payload: PushPayload) {
  configureWebPush();

  const adminSupabase = createSupabaseAdminClient();
  const subscriptions = await listTenantPushSubscriptions(adminSupabase, tenantId);
  const serializedPayload = JSON.stringify({
    icon: "/brand/logo_camel_fondo_blanco.png",
    badge: "/brand/logo_camel_fondo_blanco.png",
    url: "/",
    ...payload,
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(toWebPushSubscription(subscription), serializedPayload);
        return { ok: true };
      } catch (error) {
        if (isGoneError(error)) {
          await deletePushSubscriptionByEndpoint(adminSupabase, subscription.endpoint);
          return { ok: false, deleted: true };
        }

        await markPushSubscriptionFailure(adminSupabase, subscription);
        throw error;
      }
    }),
  );

  return {
    attempted: subscriptions.length,
    sent: results.filter((result) => result.status === "fulfilled" && result.value.ok).length,
    failed: results.filter((result) => result.status === "rejected").length,
    removed: results.filter((result) => result.status === "fulfilled" && !result.value.ok).length,
  };
}
