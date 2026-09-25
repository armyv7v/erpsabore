-- =============================================================================
-- Migration: Add Web Push notification subscriptions
-- 2026-09-20
-- =============================================================================

create table if not exists public.push_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  endpoint        text not null,
  p256dh          text not null,
  auth            text not null,
  user_agent      text,
  failure_count   integer not null default 0,
  disabled_at     timestamptz,
  last_seen_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint push_subscriptions_endpoint_key unique (endpoint),
  constraint push_subscriptions_profile_endpoint_key unique (profile_id, endpoint)
);

create index if not exists push_subscriptions_tenant_active_idx
  on public.push_subscriptions (tenant_id, disabled_at)
  where disabled_at is null;

create index if not exists push_subscriptions_profile_idx
  on public.push_subscriptions (profile_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
on public.push_subscriptions for select
to authenticated
using (
  profile_id = auth.uid()
  and tenant_id = (select public.current_tenant_id())
);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
on public.push_subscriptions for insert
to authenticated
with check (
  profile_id = auth.uid()
  and tenant_id = (select public.current_tenant_id())
);

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
on public.push_subscriptions for update
to authenticated
using (
  profile_id = auth.uid()
  and tenant_id = (select public.current_tenant_id())
)
with check (
  profile_id = auth.uid()
  and tenant_id = (select public.current_tenant_id())
);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
on public.push_subscriptions for delete
to authenticated
using (
  profile_id = auth.uid()
  and tenant_id = (select public.current_tenant_id())
);

notify pgrst, 'reload schema';
