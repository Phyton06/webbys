# Webbys Employee Management Design

## Objective

Add an Employees administration module that manages staff roles, contact details, activation, invitation state, and barber scheduling identity without breaking existing appointments or availability records.

## Approved product decisions

- Employees are created with only a name, phone number, and assigned role: Administrator, Barber, or Assistant.
- Employee invitations reuse the same fixed `{application-origin}/registro` link for everyone. The link has no employee identifier or token and does not complete registration.
- Invitation completion is a local, explicitly simulated status; it is never inferred from opening or copying the generic link.
- Existing barber IDs remain the scheduling and appointment identity. Existing appointments, schedules, and date exceptions remain intact when an employee is deactivated or changes role.
- Inactive staff and staff whose role is not Barber are excluded from new appointment bookings. Existing appointment references remain available for history and editing.
- Deactivation is reversible. Do not hard-delete staff records or their linked scheduling history.
- Do not allow deactivation of the last active Administrator.

## Architecture and data flow

The Employees route uses the existing AdminShell and the Clients directory/profile interaction patterns. The shared agenda store remains the local persistence boundary. Add employee records as an additive, optional field so existing stored Agenda v1 records remain loadable; legacy barbers are normalized into active Barber employees with their exact current IDs and a completed registration status. Normalization must not overwrite stored bytes merely because a legacy record was read.

The employee collection is the source for role, name, phone, activation, and invitation status. `AgendaState.barbers` remains the compatibility projection for staff IDs that have held the Barber role, retaining records when a barber is deactivated or changes role so old appointments, schedules, and exceptions continue to resolve. Employee mutations update the projection and employee collection together before one save. New-booking selectors use only active Barber employees; editing an existing appointment keeps its currently assigned barber selectable.

New barbers keep the employee ID as `barberId` and have no availability until the administrator configures a schedule. Appointment history and schedules are not erased on role or activation changes. Employee profiles show contact/role/status, linked appointments, and schedule/availability when the employee is a Barber. Purchases are not part of this module because sales do not have employee associations in the current model.

The generic registration link is shared with the existing link component. The employee confirmation shows that it is a generic link and that registration completion must be changed explicitly in the local interface; no backend, token, account authentication, or remote delivery is introduced.

## Safety and error handling

- Validate unique employee IDs, role values, invitation status, required name/phone, and referential integrity when loading persisted data.
- Legacy Agenda v1 data without employee records remains readable and is normalized in memory; invalid data remains untouched until a successful deliberate save.
- Save failures leave the prior in-memory employee and agenda state unchanged and show actionable form feedback.
- Keep at least one active Administrator. Disable the last-admin deactivation action and explain why.
- Keep deactivation reversible and retain barber IDs, appointments, schedules, and exceptions.

## Verification

Use test-first service/store and component tests through the public storage/UI interfaces. Verify legacy normalization and byte preservation, role and activation transitions, last-admin protection, generic-link equality, appointment/schedule referential integrity, and new-booking barber filtering. Run focused Vitest tests, the full test suite, `npm run check`, and `npm run build`. This changes a persisted data contract, so obtain independent verification of migration compatibility and history preservation before considering the feature complete.
