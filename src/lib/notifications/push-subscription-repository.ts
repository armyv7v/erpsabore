import type { SupabaseClient } from "@supabase/supabase-js";

export interface PushSubscriptionRecord {
  id: string;
  tenantId: string;
  profileId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failureCount: number;
}

interface PushSubscriptionRow {
  id: string;
  tenant_id: string;
  profile_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failure_count: number;
}

export interface BrowserPushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

function mapPushSubscription(row: PushSubscriptionRow): PushSubscriptionRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    profileId: row.profile_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    failureCount: row.failure_count,
  };
}

export function isValidBrowserPushSubscription(value: unknown): value is BrowserPushSubscriptionInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BrowserPushSubscriptionInput>;

  return Boolean(
    typeof candidate.endpoint === "string" &&
      candidate.endpoint.startsWith("https://") &&
      candidate.keys &&
      typeof candidate.keys.p256dh === "string" &&
      candidate.keys.p256dh.length > 0 &&
      typeof candidate.keys.auth === "string" &&
      candidate.keys.auth.length > 0,
  );
}

export async function upsertPushSubscription(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    profileId: string;
    subscription: BrowserPushSubscriptionInput;
    userAgent?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        tenant_id: input.tenantId,
        profile_id: input.profileId,
        endpoint: input.subscription.endpoint,
        p256dh: input.subscription.keys.p256dh,
        auth: input.subscription.keys.auth,
        user_agent: input.userAgent ?? null,
        disabled_at: null,
        failure_count: 0,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

  if (error) {
    throw new Error(`No se pudo guardar la suscripción push: ${error.message}`);
  }
}

export async function deletePushSubscription(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    profileId: string;
    endpoint?: string;
  },
): Promise<void> {
  let query = supabase
    .from("push_subscriptions")
    .delete()
    .eq("tenant_id", input.tenantId)
    .eq("profile_id", input.profileId);

  if (input.endpoint) {
    query = query.eq("endpoint", input.endpoint);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`No se pudo eliminar la suscripción push: ${error.message}`);
  }
}

export async function listTenantPushSubscriptions(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<PushSubscriptionRecord[]> {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, tenant_id, profile_id, endpoint, p256dh, auth, failure_count")
    .eq("tenant_id", tenantId)
    .is("disabled_at", null);

  if (error) {
    throw new Error(`No se pudieron listar las suscripciones push: ${error.message}`);
  }

  return ((data ?? []) as PushSubscriptionRow[]).map(mapPushSubscription);
}

export async function markPushSubscriptionFailure(
  supabase: SupabaseClient,
  subscription: PushSubscriptionRecord,
): Promise<void> {
  const nextFailureCount = subscription.failureCount + 1;
  const shouldDisable = nextFailureCount >= 3;

  await supabase
    .from("push_subscriptions")
    .update({
      failure_count: nextFailureCount,
      disabled_at: shouldDisable ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);
}

export async function deletePushSubscriptionByEndpoint(
  supabase: SupabaseClient,
  endpoint: string,
): Promise<void> {
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
