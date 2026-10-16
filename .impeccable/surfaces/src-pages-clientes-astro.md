---
version: 1
slug: "src-pages-clientes-astro"
primary_target: "src/pages/clientes.astro"
related_targets: []
---

## Surface

Clients administration in the existing Webbys admin panel. Mode: Operate.

## Audience and job

The barber-shop administrator manages client records, contact details, appointment history, and a generic registration placeholder. The main action is locating or updating a client quickly, especially on a phone.

## Constraints

Keep the existing charcoal-and-red Webbys visual system, authenticated admin shell, four-slot mobile navigation, frontend-only local storage, and existing agenda/client references. The user approved one fixed generic registration link for this phase; do not introduce unique tokens or a functioning registration route.

## Direction contract

THESIS: Make a client's record and shop history easy to find and maintain without disrupting the existing appointment workflow; refuse wide desktop-only tables as the sole mobile organization.

OWN-WORLD: Inherit Webbys surfaces, typography, spacing, red action color, accessible controls, and shell navigation. No new visual identity or palette.

STORY: The administrator searches or filters the client list, opens one record to review contacts and appointments, and can add, edit, deactivate, or reactivate the record. The fixed registration placeholder is clearly a frontend-only action.

FIRST VIEWPORT: Show the page title and primary “Nuevo cliente” action, a full-width search control, compact status/sort filters, and the first client rows. On desktop rows use available width; on phones they become stacked, readable rows without horizontal scrolling. Keep the primary action visible before the first list row.

FORM: User-pinned composition: a responsive searchable directory with an in-page client profile state and a custom Preact create/edit dialog. Seed key c83c4ad5 was generated, but the user-approved composition supersedes its assigned structures; retain the existing Webbys visual world.

FINISH: “unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance”.
