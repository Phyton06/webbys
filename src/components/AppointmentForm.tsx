import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { AppointmentRecord, AppointmentStatus } from '../types/domain';
import type { AgendaState, BookingFailure, BookingValidation, ClientRecord } from '../types/agenda';
import { BOOKING_FAILURE } from '../types/agenda';
import { getAvailableSlots, validateBooking } from '../services/availability';
import { AppointmentRegistrationLink } from './AppointmentRegistrationLink';
import { ClientCombobox } from './ClientCombobox';
import { Dropdown } from './Dropdown';

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, AppointmentStatus>;

const APPOINTMENT_FORM_VIEW = {
  BOOKING: 'booking',
  ADD_CLIENT: 'add-client',
  SUCCESS: 'success',
} as const;

type AppointmentFormView = (typeof APPOINTMENT_FORM_VIEW)[keyof typeof APPOINTMENT_FORM_VIEW];

const bookingFailureCopy: Record<BookingFailure, string> = {
  [BOOKING_FAILURE.INVALID_DATE]: 'La fecha u hora seleccionada no es válida.',
  [BOOKING_FAILURE.INVALID_DURATION]: 'Selecciona servicios con una duración válida.',
  [BOOKING_FAILURE.INVALID_TIME_INCREMENT]: 'Selecciona un horario disponible en intervalos de 15 minutos.',
  [BOOKING_FAILURE.PAST]: 'No puedes reservar un horario que ya pasó.',
  [BOOKING_FAILURE.BARBER_OFF]: 'Este barbero no trabaja en la fecha seleccionada.',
  [BOOKING_FAILURE.INVALID_SCHEDULE]: 'El horario laboral configurado tiene datos inválidos.',
  [BOOKING_FAILURE.OUTSIDE_WORKING_HOURS]: 'El servicio completo no cabe en el horario laboral seleccionado.',
  [BOOKING_FAILURE.BREAK_CONFLICT]: 'El servicio completo coincide con un descanso.',
  [BOOKING_FAILURE.APPOINTMENT_CONFLICT]: 'Ese horario ya no está disponible para el barbero seleccionado.',
};

interface AppointmentFormProps {
  state: AgendaState;
  appointment?: AppointmentRecord;
  now: Date;
  onSave: (appointment: AppointmentRecord) => boolean;
  onClientSave?: (client: ClientRecord) => boolean;
  onCancel: () => void;
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function resolveValidationError(result: BookingValidation): string | undefined {
  return result.valid ? undefined : bookingFailureCopy[result.reason];
}

export function AppointmentForm({ state, appointment, now, onSave, onClientSave, onCancel }: AppointmentFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [clientId, setClientId] = useState(appointment?.clientId ?? state.clients[0]?.id ?? '');
  const [barberId, setBarberId] = useState(appointment?.barberId ?? state.barbers[0]?.id ?? '');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(appointment?.serviceIds ?? (state.services[0] ? [state.services[0].id] : []));
  const [date, setDate] = useState(() => localDateKey(appointment ? new Date(appointment.startsAt) : now));
  const [selectedStart, setSelectedStart] = useState(() => appointment ? new Date(appointment.startsAt).toTimeString().slice(0, 5) : '');
  const [notes, setNotes] = useState(appointment?.notes ?? '');
  const [error, setError] = useState('');
  const [view, setView] = useState<AppointmentFormView>(APPOINTMENT_FORM_VIEW.BOOKING);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    return () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
    };
  }, []);

  const selectedServices = useMemo(
    () => state.services.filter(({ id }) => selectedServiceIds.includes(id)),
    [selectedServiceIds, state.services],
  );
  const durationMinutes = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);
  const estimatedPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const slots = barberId && durationMinutes > 0
    ? getAvailableSlots(date, barberId, durationMinutes, state.schedules, state.exceptions, state.appointments, now, appointment?.id)
    : [];
  const barberOptions = state.barbers.map(({ id, name }) => ({ value: id, label: name }));
  function toggleService(serviceId: string) {
    setSelectedServiceIds((current) => current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId]);
    setSelectedStart('');
    setError('');
  }

  function handleAddClient(event: SubmitEvent) {
    event.preventDefault();
    const name = newClientName.trim();
    const phone = newClientPhone.trim();
    if (!name || !phone) {
      setError('Escribe el nombre y el teléfono del cliente para continuar.');
      return;
    }
    if (!onClientSave) {
      setError('No se pudo guardar el cliente. Inténtalo de nuevo.');
      return;
    }
    const client: ClientRecord = { id: `client-${crypto.randomUUID()}`, name, phone };
    if (!onClientSave(client)) {
      setError('No se pudo guardar el cliente. Revisa el almacenamiento e inténtalo de nuevo.');
      return;
    }
    setClientId(client.id);
    setNewClientName('');
    setNewClientPhone('');
    setError('');
    setView(APPOINTMENT_FORM_VIEW.BOOKING);
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const clientName = state.clients.find(({ id }) => id === clientId)?.name ?? '';
    if (!clientName) {
      setError('Selecciona un cliente para continuar.');
      return;
    }
    if (!barberId || selectedServiceIds.length === 0 || !selectedStart) {
      setError('Selecciona barbero, servicio y horario disponible.');
      return;
    }

    const startsAt = new Date(`${date}T${selectedStart}:00`);
    const validation = validateBooking(
      {
        ...(appointment ? { id: appointment.id } : {}),
        barberId,
        startsAt: startsAt.toISOString(),
        durationMinutes,
      },
      state.schedules,
      state.exceptions,
      state.appointments,
      now,
    );
    const validationError = resolveValidationError(validation);
    if (validationError) {
      setError(validationError);
      return;
    }

    const barber = state.barbers.find(({ id }) => id === barberId);
    if (!barber) {
      setError('No se encontró el barbero seleccionado. Elige uno de la lista.');
      return;
    }
    const record: AppointmentRecord = {
      id: appointment?.id ?? `appointment-${crypto.randomUUID()}`,
      startsAt: startsAt.toISOString(),
      clientId,
      clientName,
      barberId,
      barberName: barber.name,
      serviceIds: selectedServices.map(({ id }) => id),
      serviceName: selectedServices.map(({ name }) => name).join(' + '),
      status: appointment?.status ?? BOOKING_STATUS.PENDING,
      durationMinutes,
      notes: notes.trim(),
    };
    setError('');
    if (onSave(record)) setView(APPOINTMENT_FORM_VIEW.SUCCESS);
    else setError('No se pudo guardar la cita. Revisa el almacenamiento e inténtalo de nuevo.');
  }

  return (
    <dialog
      class="appointment-modal"
      aria-labelledby="appointment-form-title"
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
    >
      {view === APPOINTMENT_FORM_VIEW.SUCCESS ? (
        <section class="appointment-success-view">
          <header class="appointment-form-heading">
            <div>
              <h2 id="appointment-form-title">{appointment ? 'Cambios guardados.' : 'Cita guardada.'}</h2>
              <p>{appointment ? 'La cita se actualizó correctamente.' : 'La cita se guardó correctamente.'}</p>
            </div>
            <button class="appointment-form-close" type="button" aria-label="Cerrar confirmación" onClick={onCancel}>Cerrar</button>
          </header>
          {!appointment && <AppointmentRegistrationLink />}
        </section>
      ) : view === APPOINTMENT_FORM_VIEW.ADD_CLIENT ? (
        <section class="appointment-client-create">
          <header class="appointment-form-heading">
            <div>
              <h2 id="appointment-form-title">Agregar cliente</h2>
              <p>Guarda sus datos y continúa con la cita.</p>
            </div>
            <button class="appointment-form-close" type="button" aria-label="Cerrar formulario de cita" onClick={onCancel}>Cerrar</button>
          </header>
          <form class="appointment-client-form" onSubmit={handleAddClient}>
            <label class="appointment-form-control">
              <span>Nombre del cliente</span>
              <input autoComplete="name" required value={newClientName} onInput={(event) => setNewClientName((event.currentTarget as HTMLInputElement).value)} />
            </label>
            <label class="appointment-form-control">
              <span>Teléfono del cliente</span>
              <input type="tel" inputMode="tel" autoComplete="tel" required value={newClientPhone} onInput={(event) => setNewClientPhone((event.currentTarget as HTMLInputElement).value)} />
            </label>
            {error && <p class="availability-error" role="alert">{error}</p>}
            <div class="appointment-form-actions">
              <button class="availability-save-button" type="submit">Guardar cliente</button>
              <button class="appointment-form-cancel" type="button" onClick={() => { setView(APPOINTMENT_FORM_VIEW.BOOKING); setError(''); }}>Volver a la cita</button>
            </div>
          </form>
        </section>
      ) : (
        <form class="appointment-form" onSubmit={handleSubmit}>
          <header class="appointment-form-heading">
            <div>
              <h2 id="appointment-form-title">{appointment ? 'Reprogramar cita' : 'Nueva cita'}</h2>
              <p>Elige los datos de la cita y confirma el horario.</p>
            </div>
            <button class="appointment-form-close" type="button" aria-label="Cerrar formulario de cita" onClick={onCancel}>Cerrar</button>
          </header>

          <div class="appointment-form-fields">
            <div class="appointment-client-selection">
              <ClientCombobox clients={state.clients} selectedClientId={clientId} onSelect={(value) => { setClientId(value); setError(''); }} />
              {onClientSave && (
                <button class="appointment-add-client-button" type="button" onClick={() => { setView(APPOINTMENT_FORM_VIEW.ADD_CLIENT); setError(''); }}>
                  Agregar cliente
                </button>
              )}
            </div>

            <label class="appointment-form-control">
              <span>Barbero</span>
              <Dropdown label="Barbero" value={barberId} options={barberOptions} onChange={(value) => { setBarberId(value); setSelectedStart(''); setError(''); }} />
            </label>

            <label class="appointment-form-control">
              <span>Fecha</span>
              <input
                type="date"
                aria-label="Fecha de la cita"
                value={date}
                onInput={(event) => {
                  const value = (event.currentTarget as HTMLInputElement).value;
                  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) setDate(value);
                  setSelectedStart('');
                  setError('');
                }}
              />
            </label>
          </div>

          <fieldset class="appointment-service-options">
            <legend>Servicios</legend>
            {state.services.map((service) => (
              <label class="appointment-service-option" key={service.id}>
                <input aria-label={`Servicio ${service.name} · ${service.durationMinutes} min`} type="checkbox" checked={selectedServiceIds.includes(service.id)} onChange={() => toggleService(service.id)} />
                <span>{service.name} · {service.durationMinutes} min</span>
                <strong>${service.price.toLocaleString('es')}</strong>
              </label>
            ))}
          </fieldset>

          <section class="appointment-estimate" aria-label="Resumen de la cita">
            <p>Duración total: {durationMinutes} min</p>
            <p>Precio estimado: ${estimatedPrice.toLocaleString('es')}</p>
          </section>

          <fieldset class="appointment-slot-fieldset">
            <legend>Horarios disponibles</legend>
            {slots.length > 0 ? (
              <div class="appointment-slot-options" role="group" aria-label="Horarios disponibles">
                {slots.map((slot) => (
                  <button
                    type="button"
                    class={selectedStart === slot ? 'is-selected' : ''}
                    aria-pressed={selectedStart === slot}
                    aria-label={`Horario ${slot}`}
                    onClick={() => { setSelectedStart(slot); setError(''); }}
                    key={slot}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <p>No hay horarios disponibles para esta selección.</p>
            )}
          </fieldset>

          <label class="appointment-form-control">
            <span>Notas (opcional)</span>
            <textarea value={notes} onInput={(event) => setNotes((event.currentTarget as HTMLTextAreaElement).value)} />
          </label>

          {error && <p class="availability-error" role="alert">{error}</p>}
          <div class="appointment-form-actions">
            <button class="availability-save-button" type="submit">{appointment ? 'Guardar cambios' : 'Guardar cita'}</button>
            <button class="appointment-form-cancel" type="button" onClick={onCancel}>Cancelar</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
