# Webbys Notifications Implementation Plan

> **For agentic workers:** Execute task-by-task in order with test-first RED → GREEN. Keep behavior, tests, and relevant documentation together in work-unit commits.

**Goal:** Build a history-first Notifications module with locally persisted drafts/schedules, simulated recipient sends, and an explicit device-only system-notification test.

**Architecture:** Keep notification records in an independent versioned localStorage envelope, separate from Agenda. Resolve audiences against current client/employee state and store only recipient ID/name snapshots. A user-triggered test requests permission and sends a message to a minimal service worker that shows a local notification; recipient sends and schedules never dispatch automatically.

**Tech Stack:** Astro, Preact, strict TypeScript, Vitest, localStorage, existing `AdminGate`, `AdminShell`, `Dropdown`, `ClientCombobox` styling, and `MobileMonthCalendar`.

**Delivery:** `stacked-to-main` (user-selected); forecast ~600 authored changed lines; no push/PR without separate authorization.

## Global Constraints

- No server, API, database, subscriptions, VAPID, push-service calls, recipient-device delivery, or automatic scheduler.
- An immediate or scheduled recipient send is only a locally recorded simulation; never label it delivered.
- The local device test is separate from send status/history and displays only on the current device after a user click and permission.
- The notification test requires a secure context; do not deploy, tunnel, or expose the server without separate authorization.
- Do not change Agenda, client/employee contacts, sales, or product stock.
- History opens first; use existing searchable comboboxes, custom Dropdown controls, and the collapsed calendar pattern.

---

## File Structure

- `src/types/notifications.ts` — notification category, status, audience, and record types.
- `src/services/notifications-store.ts` / `.test.ts` — validation and persistence for `webbys:notifications:v1`.
- `src/services/local-notification-test.ts` / `.test.ts` — injectable support/permission/test flow for the current device.
- `src/components/NotificationRecipientPicker.tsx` / `.test.tsx` — searchable multi-select recipient picker using the existing client-combobox style.
- `src/components/NotificationsPage.tsx` / `.test.tsx` — history-first page, composer, audience, preview, schedule, simulated states, and local-test action.
- `src/pages/notificaciones.astro` — protected route entry.
- `src/components/AdminShell.tsx` / `.test.tsx` — desktop and mobile More navigation link.
- `src/styles/notifications.css` — responsive layout and states.
- `public/notification-test-sw.js` — narrow worker for a user-triggered local notification only.
- `.impeccable/surfaces/src-pages-notificaciones-astro.md` — code-led Operate direction contract for this route; create through the surface-brief command before the first UI source change.
- `docs/superpowers/specs/2026-10-17-webbys-notifications-design.md` and `odd/tasks/notifications-management.md` — accepted design and progress record.

## Interfaces

```ts
export type NotificationCategory = 'product' | 'service' | 'promotion' | 'general' | 'change';
export type NotificationStatus = 'draft' | 'scheduled' | 'simulated';
export type NotificationRecipientKind = 'clients' | 'employees';
export type NotificationAudienceSegment = 'all-active' | 'selected' | 'barbers' | 'assistants' | 'administrators';

export interface NotificationAudience {
  recipientKind: NotificationRecipientKind;
  segment: NotificationAudienceSegment;
  recipientIds: string[];
  recipientNames: string[];
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  audience: NotificationAudience;
  createdAt: string;
  status: NotificationStatus;
  scheduledFor?: string;
  simulatedAt?: string;
}

export interface NotificationEnvelope { schemaVersion: 1; notifications: NotificationRecord[]; }

export interface LocalNotificationRuntime {
  secureContext: boolean;
  supported: boolean;
  requestPermission(): Promise<NotificationPermission>;
  showOnDevice(title: string, body: string): Promise<void>;
}

export type LocalNotificationTestResult =
  | 'shown' | 'permission-denied' | 'permission-pending'
  | 'unsupported' | 'insecure-context' | 'failed';

export function validateNotification(value: unknown): value is NotificationRecord;
export function loadNotifications(storage: Storage): NotificationRecord[];
export function saveNotifications(storage: Storage, notifications: NotificationRecord[]): void;
export function resolveNotificationAudience(audience: NotificationAudience, clients: ClientRecord[], employees: EmployeeRecord[]): Array<{ id: string; name: string }>;
export async function showLocalNotificationTest(title: string, body: string, runtime: LocalNotificationRuntime): Promise<LocalNotificationTestResult>;
```

## Tasks

### Task 1: Notification records, audience rules, and isolated storage

**Files:** `src/types/notifications.ts`, `src/services/notifications-store.ts`, `src/services/notifications-store.test.ts`.

- [x] Add failing tests for required title/body, valid category/status/audience combinations, selected recipient snapshots, required future schedule dates, and simulated timestamps.
- [x] Add failing storage tests for an empty key, a valid version-1 envelope, corrupt JSON/schema, failed writes, and exact byte preservation after invalid saves.
- [x] Implement `validateNotification`, `loadNotifications`, `saveNotifications`, and `resolveNotificationAudience`; store only IDs and names and never modify Agenda storage.
- [x] Run `npm test -- src/services/notifications-store.test.ts` (7 passed) and `npm run check` (0 diagnostics).
- [x] Commit: `5a85b4d feat(notifications): add local notification history store`.

### Task 2: Permission-gated local device notification test

**Files:** `src/services/local-notification-test.ts`, `src/services/local-notification-test.test.ts`, `public/notification-test-sw.js`.

- [ ] Add failing service tests for insecure origin, unsupported Notification/service-worker APIs, permission `default`→granted, denied permission, display success, and display failure; inject `LocalNotificationRuntime` so tests never request browser permission.
- [ ] Implement `showLocalNotificationTest` to return a result without prompting unless called by the page's explicit test button.
- [ ] Add a minimal service-worker message handler for one explicit local-test message. On the explicit page action, register it, await `navigator.serviceWorker.ready`, send the current title/body with `MessageChannel`, and have the worker call `self.registration.showNotification(title, { body })` and reply with success/failure. Add no fetch/push event listener.
- [ ] Run `npm test -- src/services/local-notification-test.test.ts`.
- [ ] This task changes service-worker/runtime behavior (risk item 5); after its own focused checks, use an independent read-only verifier before task closure.
- [ ] Commit: `feat(notifications): add local device notification test`.

### Task 3: History-first Notifications page and recipient controls

**Files:** `src/components/NotificationRecipientPicker.tsx`, `src/components/NotificationRecipientPicker.test.tsx`, `src/components/NotificationsPage.tsx`, `src/components/NotificationsPage.test.tsx`, `src/pages/notificaciones.astro`, `src/components/AdminShell.tsx`, `src/components/AdminShell.test.tsx`, `src/styles/notifications.css`, `.impeccable/surfaces/src-pages-notificaciones-astro.md`.

- [ ] Before the first UI source edit, resolve/create the `/notificaciones/` surface brief in Operate mode. Preserve the accepted history-first entry, open composer with preview, existing charcoal/red system, and the custom client/Dropdown/calendar control patterns.
- [ ] Add failing UI tests proving History is the entry view, “Nueva notificación” opens the composer, and the preview matches title/body.
- [ ] Add failing tests for client/employee group selection, employee role segments, searching/selecting/removing individuals, Draft/Programar/Simular actions, local persistence across remount, and no recipient delivery.
- [ ] Add failing tests for local device test statuses: it does not request permission on render, an explicit button does, a granted permission shows the preview locally, and the notification record/audience/Agenda bytes stay unchanged.
- [ ] Add the permission state panel; label real push as not configured. For insecure/unsupported/denied/failed tests, show a clear in-app status and do not claim the OS notification appeared.
- [ ] Implement the protected `/notificaciones/` route, `AdminShell` links, history-first list, composer/audience picker, preview, scheduled status, and simulated-send history.
- [ ] Run `npm test -- src/components/NotificationRecipientPicker.test.tsx src/components/NotificationsPage.test.tsx src/components/AdminShell.test.tsx`.
- [ ] Commit: `feat(notifications): add history-first notification center`.

### Task 4: Verify and close the feature

**Files:** `odd/tasks/notifications-management.md`, `docs/superpowers/plans/2026-10-17-webbys-notifications.md`, the approved design spec, and the Notifications surface brief.

- [ ] Run `npm test`, `npm run check`, `npm run build`, and `git diff --check`; record exact outcomes.
- [ ] Obtain independent verification for risk item 5; inspect the worker to ensure it has no fetch/push handlers and confirm no page action writes recipient, Agenda, Sales, or inventory data.
- [ ] Run the Impeccable detector once on changed web targets, fix mechanical findings, and record any residual advisory.
- [ ] Mark observed ODD tasks complete and commit final verification/documentation evidence. Do not push or create PRs without separate authorization.

## Known Decisions

- Notification persistence is isolated under `webbys:notifications:v1`; it never changes Agenda data.
- History is the default page; composer preview is shown after “Nueva notificación”.
- Scheduled messages remain scheduled until a user explicitly simulates them; no background send is implied.
- A local device notification is a system notification on the administrator's device, not Web Push and not a send to the chosen audience.
- Permission is requested only by the device-test button. Real push subscription and delivery stay future work.
- The feature uses `stacked-to-main`; no remote push or PR is authorized by that choice.

## Verification and Delivery

- Focused storage: `npm test -- src/services/notifications-store.test.ts`.
- Focused device test: `npm test -- src/services/local-notification-test.test.ts`.
- Focused UI: `npm test -- src/components/NotificationRecipientPicker.test.tsx src/components/NotificationsPage.test.tsx src/components/AdminShell.test.tsx`.
- Full closure: `npm test && npm run check && npm run build && git diff --check`.
- Physical-device confirmation requires the user to open the page from an authorized secure origin; otherwise report the device test as environment-limited.
