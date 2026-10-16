---
version: 1
slug: "src-pages-empleados-astro"
primary_target: "src/pages/empleados.astro"
related_targets:
  - src/components/EmployeesPage.tsx
  - src/components/EmployeeForm.tsx
---

## Surface

Employee administration inside the Webbys admin panel. Mode: Operate. This is an extension of the established Clients surface, not a new visual identity.

## Audience and job

The barber-shop administrator registers and manages employees, their assigned roles, activation, generic invitation status, and barber availability. The main action is finding the right employee quickly on a phone and making a safe, history-preserving update.

## Constraints

Keep the established charcoal/red design system, protected AdminShell, mobile navigation, and shared agenda-store boundary. Creation asks only for name, phone, and role. Reuse the fixed generic `/registro` link; no token, backend, account credentials, or registration route. Preserve barber IDs/history, make deactivation reversible, and prevent deactivation of the last active Administrator.

## Direction contract

THESIS: Make staff identity, role, and operational status immediately scannable while keeping the administrator's next safe action obvious; refuse desktop-only tables and irreversible removal.

OWN-WORLD: Inherit the Clients surface's charcoal layers, neutral typography, compact row treatment, accessible control borders, and purposeful red primary action. No new palette, font, or decorative motif.

STORY: The administrator searches or filters staff, opens a profile for contact details and appointment history, then adds, edits, activates, deactivates, or changes role. A barber profile shows its availability. The invitation status is explicit and local; its shared link never implies a real account was created.

FIRST VIEWPORT: Show the Employees title and primary “Nuevo empleado” action, full-width name/phone search, compact role/active filters, and the first readable staff rows. On narrow phones, each row stacks name, role, and status with actions remaining touch-sized; the primary action appears before the first row.

FORM: Inherit the Clients page's list/profile composition and custom Preact create/edit dialog, adding only employee-specific role, active, and invitation states. Seed key `c83c4ad5` is inherited from the approved Clients surface; the user-approved composition means no separate concept tournament or new visual world is appropriate for this focused extension.

FINISH: “unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance”.
