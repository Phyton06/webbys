# Webbys — First-stage design

## Goal

Deliver the first usable, frontend-only stage of Webbys: a simulated administrator sign-in, responsive authenticated shell, and barber-shop dashboard built with Astro and strict TypeScript.

## Confirmed product context

- Barber-shop display name: Webbys.
- Primary user: barber-shop administrator.
- Platform: mobile-first web PWA.
- Framework: Astro; TypeScript is required.
- No backend, real authentication, database, or real notification delivery in this stage.
- No real business data, logo, or brand assets have been supplied. All sample metrics and records must be clearly marked as demonstration data.
- `task.md` remains the source for later modules and their requirements.

## Scope of this stage

1. Astro project foundation and global design tokens.
2. Simulated login with field validation, password visibility, loading/error feedback, a clear demo-entry action, and Google/Facebook buttons whose flows are explicitly simulated and do not perform OAuth.
3. Responsive admin navigation: bottom navigation on phones and a persistent side navigation on larger screens.
4. Dashboard with coherent demonstration metrics, a sales-period selector, a compact sales chart, upcoming appointments, and recent activity.
5. Responsive and accessibility checks, including keyboard operation, visible focus, readable contrast, touch targets, and no unjustified horizontal overflow.

Out of scope: real auth or OAuth, backend/API calls, persisted server data, push delivery, and the later CRUD, agenda, sales, analytics, and settings modules.

## Architecture

Astro owns routes and the page shell. Preact is limited to interactive islands (sign-in form and dashboard controls/chart where needed), keeping static content server-rendered and avoiding a full SPA. Demonstration entities and aggregates live in typed fixture modules; a small service interface reads those fixtures so later API integration can replace the implementation without coupling the UI to a backend.

The demo session is a client-only flag, not an authentication mechanism. It is scoped to the browser and visibly labeled as a simulation. The dashboard derives its figures from the same fixture data; period changes recompute displayed totals instead of swapping arbitrary numbers.

## User flow

1. The administrator opens the sign-in route and sees an explicit demo-mode notice.
2. The administrator may validate the email/password form or use the demo-entry action; no real credentials are checked or sent.
3. On successful simulated entry, the app navigates to the dashboard.
4. The administrator changes the reporting period and sees the chart and summary values update consistently.
5. The administrator navigates among the first-stage shell sections. Any not-yet-built destination is marked as unavailable/in progress rather than presented as a working module.
6. Sign-out clears the simulated session and returns to sign-in.

## Visual direction contract

- **THESIS:** A working barber-shop admin surface whose operational information is immediately scannable, not a generic dashboard template.
- **OWN-WORLD:** Restrained charcoal/black surfaces, clear neutral text, and a committed red accent reserved for primary actions, selection, and meaningful alerts; use consistent tokens and avoid decorative gradients.
- **STORY:** The administrator enters demo mode, sees today's shop status, and can move directly to the next appointment or inspect the selected sales period.
- **FIRST VIEWPORT:** On mobile, show a compact greeting and demo badge, the highest-priority sales and appointment figures, the beginning of a readable sales trend and upcoming-appointment timeline, with persistent bottom navigation. On desktop, place the same work areas beside a persistent side rail without merely enlarging the mobile layout.
- **FORM:** Operate-mode admin interface with familiar navigation and controls; use compact data typography and a timeline as the dashboard's signature treatment. Do not let a visual motif replace standard controls or labels.
- **FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Demonstration data and behavior

Fixtures include dated sales and appointments with explicit synthetic labeling. Sales totals, counts, and chart series are calculated from those fixtures for the selected period. Appointment statuses and times are deterministic. Empty, loading, validation, and failure states are handled locally; the UI must not claim a notification, login, or remote write occurred.

For this demo, day means the browser's local calendar day, week means Monday through Sunday in local time, and month means the local calendar month. Monetary values use `$` only as a sample display symbol from the brief; they do not identify a real currency or business price.

## Verification

- Run the project typecheck, focused component/utility tests, and production build.
- Verify the login flow, invalid form feedback, demo entry, dashboard period selection, and sign-out.
- Inspect one mobile and one desktop viewport for navigation, content hierarchy, keyboard focus, contrast, and overflow.
- Confirm every dashboard summary and chart point derives from the demonstration dataset.

## Later-stage boundaries

Agenda and availability are a separate stage and must use one tested source of truth for work schedules, breaks, exceptions, and existing appointments. CRUD and analytics modules should be implemented only in later scoped deliveries, following `task.md` without implying server-side behavior.
