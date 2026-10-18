---
version: 1
slug: "src-pages-cobrar-astro"
primary_target: "src/pages/cobrar.astro"
related_targets: []
---

# Assistant checkout surface

## Scope
Operate surface for the assistant's appointment-first checkout and secondary product-only sale. The surface extends the established Webbys PWA; it does not establish a new visual identity.

## Audience and task
The assistant uses a phone at the shop counter to select an eligible appointment, confirm the booked services, add products or services actually consumed, apply a valid promotion, take a simulated payment, and issue a receipt. A standalone retail purchase remains a secondary path.

## Direction contract

### THESIS
Checkout begins with the appointments already recorded, not an empty cart. The category-default product picker is subordinate to the appointment queue; a quick product sale remains an explicit secondary action.

### OWN-WORLD
Use Webbys charcoal surfaces, white and muted-gray text, and restrained red for the primary charge action and selected states. Keep the existing system typography, borders, controls, and status labels; avoid decorative gradients and visual chrome.

### STORY
The assistant sees which eligible customer is ready to pay, opens that appointment with its booked services and expected total already present, resolves any additions or promotion, then confirms one simulated sale and its receipt.

### FIRST VIEWPORT
On mobile, show a clear "Cobrar" heading, appointment search/filter controls, and a compact list of today's unpaid appointments with client, time, barber, services, and estimated amount. Keep a visible secondary "Venta rápida" action. Selecting an appointment opens its checkout summary, with the final payment action prominent and reachable without horizontal scrolling.

### FORM
Extend the existing assistant shell and mobile navigation. This is a task-specified appointment-first flow inside the established Operate system, so no concept-seed round is needed; the chosen form is the appointment queue followed by one shared checkout view. No seed key was generated.

### FINISH
unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Constraints
- Frontend-only demonstration with local shared storage; no real payment integration or cross-device synchronization.
- Appointment service status and payment status remain independent.
- Preserve admin data and existing calendar, promotion, and catalog services.
- Prevent duplicate appointment payment and insufficient-stock checkout.
