# Webbys Agenda and Availability Design

## Objective

Add the next operational module for Webbys: a mobile-first administrator agenda backed by a single, testable source of barber availability rules. The interface remains frontend-only and uses local synthetic data.

## Product requirements

The design follows the existing project brief, including these exact requirements from `task.md`:

> “Vista diaria.”

> “Vista semanal.”

> “Filtro por barbero.”

> “Vista conjunta de todos los barberos.”

> “Días de trabajo.”

> “Hora de inicio y finalización de cada jornada.”

> “Pausas y descansos.”

> “Días libres.”

> “Excepciones de disponibilidad para fechas específicas.”

> “No debe ser posible crear una cita fuera del horario laboral de un barbero, en un día en el que no trabaja, durante sus descansos ni cuando ya tenga otra cita que se solape.”

> “Antes de permitir guardar una cita, valida nuevamente que el barbero esté disponible durante toda la duración del servicio.”

> “Cuando cambie el barbero, la fecha o los servicios, actualiza los horarios disponibles.”

> “Utiliza una única fuente de verdad para los horarios laborales, los descansos, las citas existentes y las excepciones.”

The user approved offering appointment start times in 15-minute increments, with each selected service duration required to fit completely inside available working time.

## Proposed architecture

### Scheduling domain

Create a focused scheduling domain layer, independent of Preact components, that owns:

- Barber weekly schedules: working weekdays, one or more working intervals, and break intervals.
- Date-specific availability exceptions. An exception replaces the recurring schedule for that local calendar date; it can mark the barber unavailable or provide replacement working and break intervals.
- Typed appointment records with stable barber, client, and service identifiers, local appointment date/time, status, and notes.
- Synthetic clients, barbers, and services sufficient to exercise agenda flows before those management modules exist.
- Availability calculation and final booking validation through the same public functions. A candidate is valid only when its full duration fits one uninterrupted working interval, avoids every break, does not intersect another blocking appointment, and is not in the past.

Pending and confirmed appointments block time. Cancelled appointments release time. Completed appointments remain available as history and are not offered as new future availability.

Service selection is sequential: total duration and estimated price are the sums of selected services. Offer start times on 15-minute boundaries and include a slot only when the entire combined duration is valid.

### Administration interface

- Add Agenda to both desktop and mobile navigation and make it the current item on its route.
- Provide daily and weekly views, date navigation, and a barber filter that includes an all-barbers view.
- Default to a readable day timeline on mobile. The weekly view remains available without requiring a wide table; larger screens may display a multi-barber overview.
- Distinguish pending, confirmed, completed, and cancelled appointments with text as well as color. Show occupied and computed available times, with appointment details reachable from each entry.
- Provide a booking form with client, barber, one or more services, available start time, calculated duration and estimated price, and optional notes. Date, barber, or service changes recompute the available choices.
- Revalidate through the domain service when saving and when rescheduling; do not trust the list of slots previously rendered by the UI.
- Support status changes and cancellation. Cancellation must immediately free the slot. No drag-and-drop interaction is required in this stage.
- Provide a barber availability editor for weekly working intervals, breaks, days off, and date-specific exceptions.

### Data and persistence

Keep all state client-side. Seed fixtures with cases for open slots, occupied slots, breaks, non-working days, date exceptions, and overlapping booking attempts. Persist user changes in local storage behind a small storage/service boundary so a future API can replace the adapter without moving scheduling rules into the UI.

Use local calendar dates and wall-clock times as the interface's scheduling basis. Do not introduce a backend, remote requests, or claims that simulated changes have been sent to an external service.

## Interaction and visual direction

Continue the current Spanish, mobile-first charcoal interface with restrained red accents. Reuse existing design tokens and the shared custom `Dropdown` instead of native select popups. Ensure controls work by keyboard, provide visible focus, use touch-sized actions, and communicate appointment state with text in addition to color. Follow the project's production-style copy preference; do not label user-facing content as a demo or simulated experience.

## Error handling and invariants

- Empty availability is an ordinary empty state, not an error.
- Invalid or stale appointment submissions must remain unsaved and explain whether the barber is off, outside working hours, within a break, in the past, or conflicted with another appointment.
- When multiple rules apply, the shared domain validator returns a stable, typed reason that the UI can translate into concise Spanish feedback.
- Date exceptions replace recurring availability for that date, preventing recurring hours from accidentally leaking through a day-off override.
- Slot calculation and save-time validation must call the same underlying interval and conflict rules.

## Verification plan

Write focused domain tests before implementation. Cover 15-minute start boundaries, exact fit at shift end, duration extending past shift end, breaks, non-working weekdays, replacement exceptions, pending/confirmed conflicts, cancelled appointments, full-duration multi-service bookings, past slots, and final revalidation. Add component tests for date/barber/service updates, booking and rescheduling, status changes, cancellation freeing a slot, and accessible day/week navigation. Run the complete test suite, Astro type checking, and production build; visually check mobile and desktop agenda layouts.

## Scope boundaries

Included: agenda views, barber availability configuration, appointment creation/rescheduling/cancellation/status changes, coherent synthetic records, and local persistence.

Deferred: client, employee, and service CRUD modules; real authentication; backend/API/database; remote notifications; payment flows; drag-and-drop scheduling; and other commercial modules from `task.md`.

## Self-review

- The 15-minute increment rule is consistent with the approved user decision and does not replace full-duration validation.
- Date-specific exceptions explicitly replace recurring schedules, avoiding ambiguity about which schedule wins.
- The same domain rules govern both rendered slots and final booking checks.
- Scope excludes CRUD modules that are not dependencies of this stage while including only enough fixtures to exercise scheduling.
- No unresolved placeholders or contradictory requirements remain in this design.
