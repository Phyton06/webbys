# Webbys Mobile Calendar and Booking Flow Design

## Objective

Improve the mobile Agenda calendar and simplify the new-appointment workflow while preserving the frontend-only, local-persistence architecture.

## User requirements

The user requested:

> “el calendario se ve mal en movil, arregla eso con un calendario que se vea mas adecuado al dise;o y ademas, al generar nueva cita que se haga desde un sweetalert, y ademas ahi cambiar el selector de cliente por un buscador con selector, osea combinado, ademas a su lado el boton para agregar un cliente nuevo y ya que finalice el agregar al cliente continue con la generacion de la cita y al terminar de hacer la cita que se genere un link para que se lo envie al cliente donde el cliente terminaria su registro, ya que aqui el registro debe ser sencillo solo el nombre y el numero telefonico”

The user confirmed the scope remains simulated and frontend-only:

> “no, solo hay que simular esto que te acabo de contar osea hacer el flujo como si en realidad lo hiciera pero sin back frontend-only”

The registration link is intentionally generic and does not need to work:

> “solo con que genere un link generico, no nececsita funcionar, que siempre de el mismo”

The user selected the visual calendar concept:

> “la opcion b”

The user selected a custom Preact modal rather than SweetAlert:

> “usa la opcion 3 del modal propio, di solo de ejemplo sweetalert pero mejor propio”

The user approved this design:

> “si hazlo”

## Approved design

### Calendar

- On mobile, show a compact month grid with a clear selected date. Selecting a day updates the appointment list below it; dates containing appointments show a small dot, while the list below provides exact appointment details.
- Keep the current desktop day/week agenda behavior and wide weekly layout. The calendar adapts to the viewport rather than shrinking the desktop grid onto a phone.
- Continue the existing charcoal/red visual tokens, readable text status labels, visible focus, and touch-sized controls.

### New-appointment flow

- Replace the inline appointment form with a responsive, custom Preact modal. Do not add SweetAlert or another modal dependency.
- The modal begins with a combined client search and selector. Place an “Agregar cliente” action next to it.
- Adding a client opens an in-modal step with only name and phone fields. Saving adds the local client, selects it for the appointment, and returns to the booking step without clearing the barber, date, service, or time choices.
- Keep the existing service selection, duration/price calculation, 15-minute availability starts, final save-time `validateBooking` check, rescheduling identity, and local persistence behavior.
- After a valid appointment is saved, show a success state with one generic registration link, identical for every appointment, plus a copy action. The link is a placeholder using the current app origin and a fixed `/registro` path; there is no registration route, token, backend, or cross-device synchronization.

### Data and privacy boundary

- Persist newly added client records and appointments in the existing browser-local agenda store.
- Keep the current versioned local storage format unless implementation proves a schema change is required; do not add remote calls or imply a client submission was received.
- The registration URL contains no client name, phone, appointment ID, token, or other personal data.
- If a user opens the generic link, no registration workflow is implemented; its requested purpose is to be copied/shared as a placeholder only.

## Component and state flow

- `AgendaPanel` owns the selected calendar date and modal visibility/state.
- A month-grid calendar selects the date used by the mobile appointment list. Existing desktop day/week navigation continues to use the same selected date and appointment data.
- The modal holds the booking draft across the add-client substep. Saving a client updates the parent’s local `AgendaState`, selects the new client, and resumes the draft. Saving an appointment reuses the existing callback and shared availability validator.
- A successful save closes the booking form and presents the generic link in an accessible success state; failed persistence leaves the draft available and reports an error.

## Error handling and accessibility

- The modal uses dialog semantics, a programmatic title, keyboard-operable controls, focus management, Escape/cancel behavior, and an internal scroll area on small screens.
- Client search supports keyboard selection and announces an empty result state.
- Client name and phone are required for a newly added client; show associated validation messages and retain valid field values after an error.
- Availability failures continue to use the existing Spanish reason-specific messages. A stale appointment or storage failure must not be reported as a successful save or link-ready result.
- The generic URL is displayed as text and can be copied; clipboard failure must leave it selectable for manual copying. Its fixed path is `/registro`, combined with the current application origin, and no route is added for that path.

## Verification

- Add component tests for mobile month navigation/date selection and its appointment list, client search/select, adding a client and resuming the same booking draft, validation, persistence, and stable generic-link output across bookings.
- Preserve and run the existing availability, create/reschedule, cancellation, and dashboard synchronization tests.
- Check keyboard and dialog accessibility, and visually inspect the calendar and modal at 390px and 1440px.
- Run the full Vitest suite, `npm run check`, and `npm run build`; the static route list remains unchanged because no registration route is added.

## Scope boundaries

Included: mobile calendar redesign, custom appointment modal, searchable client selection, local client creation from the booking flow, existing appointment validation/persistence, and display/copy of the generic placeholder link.

Deferred: a functioning public registration page, backend/API/database, cross-device persistence, actual link delivery, tokenized links, account creation/authentication, and changes to the existing desktop weekly calendar.

## Self-review

- The month grid choice and custom Preact modal were explicitly selected by the user.
- The generic registration URL is intentionally non-functional and does not claim successful remote registration.
- The frontend-only boundary is consistent with the existing local storage architecture; no personal data is embedded in the generic URL.
- No unresolved placeholders remain in the design. The exact fixed path is `/registro`, joined to the current application origin.
