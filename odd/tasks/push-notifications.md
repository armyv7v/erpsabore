# Push Notifications

## Objective
Implement real PWA Web Push infrastructure for ERP Sabore so authenticated users can subscribe from the browser and server-side code can send push notifications through saved subscriptions.

## Problem
The current app only has local navbar notifications and HR announcements. Those are not remote push notifications and do not reach users when the app is closed or in the background.

## Scope
- Add Supabase persistence for browser push subscriptions scoped by tenant and user.
- Add a public service worker that displays incoming push payloads and opens ERP Sabore on click.
- Add authenticated API endpoints for subscribe, unsubscribe, and permission/config discovery.
- Add server-side Web Push sender helpers with VAPID configuration validation.
- Add a dashboard UI control so users can enable or disable push notifications.
- Wire HR announcement publishing to fan out push notifications to tenant subscribers.

## Constraints
- Do not expose private VAPID keys to the browser.
- Store subscriptions per authenticated profile and tenant.
- Push depends on HTTPS in production and browser permission grant.
- If VAPID is not configured, the UI must fail clearly instead of pretending push is active.

## TDD Mode
- Mode: disabled/unknown for ODD. Use ordinary functional checks.
- Test runner: npm test / npm run build where practical.

## Tasks
- [x] ODD-PUSH-001 — Explore current notification, auth, and Supabase structure.
  - Evidence: inspected Navbar local notifications, HR announcements, auth-service, Supabase admin config, package.json.
- [x] ODD-PUSH-002 — Add database migration for push subscription persistence and RLS.
  - Evidence: supabase/migrations/20260920_add_push_subscriptions.sql (tenant/user scoped, RLS own-only). Aplicada en Supabase vía SQL Editor el 2026-09-25 (verificada con select count(*) = 0).
- [x] ODD-PUSH-003 — Add Web Push server utilities and VAPID config handling.
  - Evidence: src/lib/notifications/web-push.ts + push-subscription-repository.ts; getPushConfigStatus + configureWebPush con error accionable; tsc limpio 2026-09-25.
- [x] ODD-PUSH-004 — Add authenticated API endpoints for subscribe/unsubscribe/config.
  - Evidence: src/app/api/push/subscriptions/route.ts (POST/DELETE con auth 401, valida subscription, 503 sin VAPID) + src/app/api/push/config/route.ts.
- [x] ODD-PUSH-005 — Add service worker and client-side subscription manager UI.
  - Evidence: public/sw.js (push + notificationclick con focus/open), public/manifest.webmanifest, PushNotificationControl en Navbar (estados unsupported/denied/disabled/ready/subscribed/error, rollback con unsubscribe si falla el POST).
- [x] ODD-PUSH-006 — Fan out HR announcements through push notifications.
  - Evidence: createAnnouncementAction llama sendTenantPushNotification best-effort (try/catch, no bloquea el write); Gone 404/410 limpia la suscripción.
- [x] ODD-PUSH-007 — Run verification.
  - Evidence: npx tsc --noEmit limpio (2026-09-25). Sin test runner específico para push; pendiente E2E runtime.

## Acceptance Criteria
- Authenticated users can enable browser push notifications from the dashboard.
- The server stores the user subscription without leaking secrets.
- Publishing an HR announcement sends a push payload to active tenant subscriptions.
- Expired/invalid subscriptions are cleaned up on send failure where possible.
- Build/type checks pass or any remaining failure is documented with evidence.

## Progress
- 2026-09-20: Created tracking document after exploration.
- 2026-09-25: Verified all 7 tasks against code + tsc clean; doc synced to reality. Pending to close feature: VAPID keys in env (NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY), apply migration in Supabase, runtime E2E (subscribe → publish announcement → receive push).
