import { useState } from 'preact/hooks';
import {
  SCHEDULE_FAILURE,
  type AvailabilityException,
  type BarberRecord,
  type ScheduleFailure,
  type TimeInterval,
} from '../types/agenda';
import { validateScheduleIntervals } from '../services/availability';
import { TIME_OPTIONS } from '../services/time-options';
import { Dropdown } from './Dropdown';
import { MobileMonthCalendar } from './MobileMonthCalendar';

const scheduleFailureCopy: Record<ScheduleFailure, string> = {
  [SCHEDULE_FAILURE.INVALID_INTERVAL]: 'Revisa que cada hora de inicio sea anterior a la hora final.',
  [SCHEDULE_FAILURE.OVERLAPPING_WORKING_INTERVALS]: 'Los horarios de trabajo no pueden superponerse.',
  [SCHEDULE_FAILURE.BREAK_OUTSIDE_WORKING_HOURS]: 'El descanso debe quedar dentro de un horario laboral.',
  [SCHEDULE_FAILURE.OVERLAPPING_BREAKS]: 'Los descansos no pueden superponerse.',
};

function formatExceptionDate(value: string): string {
  return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

interface AvailabilityExceptionEditorProps {
  barbers: BarberRecord[];
  exceptions: AvailabilityException[];
  onSave: (exceptions: AvailabilityException[]) => boolean;
}

function tomorrowLocalDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function selectedException(
  exceptions: AvailabilityException[],
  barberId: string,
  date: string,
): AvailabilityException | undefined {
  return exceptions.find((entry) => entry.barberId === barberId && entry.date === date);
}

export function AvailabilityExceptionEditor({ barbers, exceptions, onSave }: AvailabilityExceptionEditorProps) {
  const initialBarberId = barbers[0]?.id ?? '';
  const [selectedBarberId, setSelectedBarberId] = useState(initialBarberId);
  const [selectedDate, setSelectedDate] = useState(tomorrowLocalDate);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(selectedDate);
  const [draftExceptions, setDraftExceptions] = useState(exceptions);
  const [unavailable, setUnavailable] = useState(false);
  const [working, setWorking] = useState<TimeInterval[]>([{ start: '09:00', end: '18:00' }]);
  const [breaks, setBreaks] = useState<TimeInterval[]>([{ start: '13:00', end: '14:00' }]);
  const [pendingRemoval, setPendingRemoval] = useState(false);
  const [error, setError] = useState('');
  const [invalidDraft, setInvalidDraft] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const barberOptions = barbers.map(({ id, name }) => ({ value: id, label: name }));
  const currentException = selectedException(draftExceptions, selectedBarberId, selectedDate);
  const specialHoursSummary = `${working.map(({ start, end }) => `${start}–${end}`).join(', ')} · ${breaks.length ? `${breaks.length} ${breaks.length === 1 ? 'descanso' : 'descansos'}` : 'Sin descansos'}`;

  function loadDateException(barberId: string, date: string) {
    const existing = selectedException(draftExceptions, barberId, date);
    setUnavailable(existing?.unavailable ?? false);
    setWorking(existing?.working ?? [{ start: '09:00', end: '18:00' }]);
    setBreaks(existing?.breaks ?? [{ start: '13:00', end: '14:00' }]);
    setPendingRemoval(false);
    setError('');
    setInvalidDraft(false);
    setAnnouncement('');
  }

  function updateIntervals(
    setter: (update: (previous: TimeInterval[]) => TimeInterval[]) => void,
    intervals: TimeInterval[],
    index: number,
    value: Partial<TimeInterval>,
  ) {
    setter(() => intervals.map((interval, position) => position === index ? { ...interval, ...value } : interval));
    setPendingRemoval(false);
    setError('');
    setInvalidDraft(false);
    setAnnouncement('');
  }

  function toggleUnavailable(checked: boolean) {
    if (unavailable && !checked) {
      setWorking(currentException?.working ?? [{ start: '09:00', end: '18:00' }]);
      setBreaks(currentException?.breaks ?? [{ start: '13:00', end: '14:00' }]);
    }
    setUnavailable(checked);
    setPendingRemoval(false);
    setInvalidDraft(false);
    setError('');
    setAnnouncement('');
  }

  function addInterval(setter: (update: (previous: TimeInterval[]) => TimeInterval[]) => void, seed: TimeInterval) {
    setter((previous) => [...previous, { ...seed }]);
    setPendingRemoval(false);
    setError('');
    setInvalidDraft(false);
    setAnnouncement('');
  }

  function removeInterval(setter: (update: (previous: TimeInterval[]) => TimeInterval[]) => void, intervals: TimeInterval[], index: number) {
    setter(() => intervals.filter((_, position) => position !== index));
    setPendingRemoval(false);
    setError('');
    setInvalidDraft(false);
    setAnnouncement('');
  }

  function handleSave(event: SubmitEvent) {
    event.preventDefault();
    if (pendingRemoval) {
      if (onSave(draftExceptions)) {
        setPendingRemoval(false);
        setError('');
        setAnnouncement('Cambios de excepciones guardados.');
      } else {
        setError('No se pudieron guardar los cambios. Revisa el almacenamiento e inténtalo de nuevo.');
        setAnnouncement('');
      }
      return;
    }
    if (!selectedBarberId || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      setError('Selecciona un barbero y una fecha válida.');
      setInvalidDraft(false);
      setAnnouncement('');
      return;
    }

    if (!unavailable) {
      if (working.length === 0) {
        setError('Agrega al menos un horario laboral para la fecha especial.');
        setInvalidDraft(true);
        setAnnouncement('');
        return;
      }
      const validation = validateScheduleIntervals(working, breaks);
      if (!validation.valid) {
        setError(scheduleFailureCopy[validation.reason]);
        setInvalidDraft(true);
        setAnnouncement('');
        return;
      }
    }

    const entry: AvailabilityException = unavailable
      ? { barberId: selectedBarberId, date: selectedDate, unavailable: true }
      : { barberId: selectedBarberId, date: selectedDate, unavailable: false, working, breaks };
    const next = [...draftExceptions.filter((item) => item.barberId !== selectedBarberId || item.date !== selectedDate), entry]
      .sort((first, second) => first.date.localeCompare(second.date) || first.barberId.localeCompare(second.barberId));

    if (onSave(next)) {
      setDraftExceptions(next);
      if (unavailable) {
        setUnavailable(false);
        setWorking([{ start: '09:00', end: '18:00' }]);
        setBreaks([{ start: '13:00', end: '14:00' }]);
      }
      setPendingRemoval(false);
      setError('');
      setInvalidDraft(false);
      setAnnouncement('Excepción de disponibilidad guardada.');
    } else {
      setError('No se pudo guardar la excepción. Revisa el almacenamiento e inténtalo de nuevo.');
      setInvalidDraft(false);
      setAnnouncement('');
    }
  }

  function handleRemove(date: string) {
    const next = draftExceptions.filter((item) => item.barberId !== selectedBarberId || item.date !== date);
    setDraftExceptions(next);
    setPendingRemoval(true);
    if (date === selectedDate) {
      setUnavailable(false);
      setWorking([{ start: '09:00', end: '18:00' }]);
      setBreaks([{ start: '13:00', end: '14:00' }]);
    }
    setError('');
    setInvalidDraft(false);
    setAnnouncement('La excepción se quitará al guardar los cambios.');
  }

  return (
    <section class="availability-exception-editor" aria-labelledby="availability-exceptions-title">
      <header class="barber-availability-heading">
        <div>
          <h2 id="availability-exceptions-title">Excepciones por fecha</h2>
          <p>{barbers.length === 1 ? 'Marca un día libre o define un horario especial para una fecha.' : 'Una excepción reemplaza el horario semanal del barbero para esa fecha.'}</p>
        </div>
      </header>

      {barbers.length > 0 ? (
        <>
          <form class="availability-exception-form" onSubmit={handleSave}>
            <div class={`availability-exception-controls${barbers.length === 1 ? ' is-single-barber' : ''}`}>
              {barbers.length > 1 && <label class="availability-control">
                <span>Barbero</span>
                <Dropdown
                  label="Barbero de excepción"
                  value={selectedBarberId}
                  options={barberOptions}
                  onChange={(value) => {
                    setSelectedBarberId(value);
                    loadDateException(value, selectedDate);
                  }}
                />
              </label>}
              <div class="availability-control appointment-date-picker-control">
                <span>Fecha</span>
                <button
                  class="appointment-date-picker-trigger"
                  type="button"
                  aria-label={`Fecha de la excepción: ${formatExceptionDate(selectedDate)}`}
                  aria-expanded={datePickerOpen}
                  onClick={() => setDatePickerOpen((open) => !open)}
                >
                  <span>{formatExceptionDate(selectedDate)}</span>
                  <span aria-hidden="true">Calendario</span>
                </button>
                {datePickerOpen && (
                  <div class="appointment-date-picker-popover" onClick={(event) => event.stopPropagation()}>
                    <MobileMonthCalendar
                      selectedDate={selectedDate}
                      displayedMonth={calendarDate}
                      appointments={[]}
                      onNavigateMonth={setCalendarDate}
                      onSelectDate={(value) => {
                        setSelectedDate(value);
                        setCalendarDate(value);
                        loadDateException(selectedBarberId, value);
                        setDatePickerOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <label class="availability-day-toggle">
              <input type="checkbox" checked={unavailable} aria-label="Día libre" onChange={(event) => toggleUnavailable((event.currentTarget as HTMLInputElement).checked)} />
              <span>Día libre para este barbero</span>
            </label>

            {!unavailable && (
              <details class="availability-special-hours">
                <summary class="availability-special-hours-summary" aria-label={`Horario especial: ${specialHoursSummary}`}>
                  <strong>Horario especial</strong>
                  <span>{specialHoursSummary}</span>
                </summary>
                <div class="availability-special-hours-content">
                <h3>Jornada</h3>
                <div class="availability-interval-list">
                  {working.map((interval, index) => (
                    <div class="availability-interval" key={`special-work-${index}`}>
                      <div class="availability-control">
                        <span>Inicio</span>
                        <Dropdown
                          label={working.length === 1 ? 'Inicio de horario especial' : `Inicio de horario especial ${index + 1}`}
                          value={interval.start}
                          options={TIME_OPTIONS}
                          ariaInvalid={invalidDraft}
                          ariaDescribedBy={invalidDraft ? 'exception-schedule-error' : undefined}
                          onChange={(value) => updateIntervals(setWorking, working, index, { start: value })}
                        />
                      </div>
                      <div class="availability-control">
                        <span>Fin</span>
                        <Dropdown
                          label={working.length === 1 ? 'Fin de horario especial' : `Fin de horario especial ${index + 1}`}
                          value={interval.end}
                          options={TIME_OPTIONS}
                          ariaInvalid={invalidDraft}
                          ariaDescribedBy={invalidDraft ? 'exception-schedule-error' : undefined}
                          onChange={(value) => updateIntervals(setWorking, working, index, { end: value })}
                        />
                      </div>
                      <button type="button" aria-label={`Eliminar horario especial ${index + 1}`} onClick={() => removeInterval(setWorking, working, index)}>Eliminar</button>
                    </div>
                  ))}
                </div>
                <button class="availability-add-button" type="button" onClick={() => addInterval(setWorking, { start: '09:00', end: '18:00' })}>Agregar horario especial</button>

                <h3>Descansos</h3>
                <div class="availability-interval-list">
                  {breaks.map((interval, index) => (
                    <div class="availability-interval" key={`special-break-${index}`}>
                      <div class="availability-control">
                        <span>Inicio</span>
                        <Dropdown
                          label={breaks.length === 1 ? 'Inicio de descanso especial' : `Inicio de descanso especial ${index + 1}`}
                          value={interval.start}
                          options={TIME_OPTIONS}
                          ariaInvalid={invalidDraft}
                          ariaDescribedBy={invalidDraft ? 'exception-schedule-error' : undefined}
                          onChange={(value) => updateIntervals(setBreaks, breaks, index, { start: value })}
                        />
                      </div>
                      <div class="availability-control">
                        <span>Fin</span>
                        <Dropdown
                          label={breaks.length === 1 ? 'Fin de descanso especial' : `Fin de descanso especial ${index + 1}`}
                          value={interval.end}
                          options={TIME_OPTIONS}
                          ariaInvalid={invalidDraft}
                          ariaDescribedBy={invalidDraft ? 'exception-schedule-error' : undefined}
                          onChange={(value) => updateIntervals(setBreaks, breaks, index, { end: value })}
                        />
                      </div>
                      <button type="button" aria-label={`Eliminar descanso especial ${index + 1}`} onClick={() => removeInterval(setBreaks, breaks, index)}>Eliminar</button>
                    </div>
                  ))}
                </div>
                <button class="availability-add-button" type="button" onClick={() => addInterval(setBreaks, { start: '13:00', end: '14:00' })}>Agregar descanso especial</button>
                </div>
              </details>
            )}

            {error && <p class="availability-error" id="exception-schedule-error" role="alert">{error}</p>}
            <p class="availability-announcement" role="status" aria-live="polite">{announcement}</p>
            <button class="availability-save-button" type="submit">
              {pendingRemoval ? 'Guardar cambios de excepciones' : currentException ? 'Actualizar excepción' : 'Guardar excepción'}
            </button>
          </form>

          <section class="availability-existing-exceptions" aria-labelledby="existing-exceptions-title">
            <h3 id="existing-exceptions-title">Fechas configuradas</h3>
            {draftExceptions.filter(({ barberId }) => barberId === selectedBarberId).length > 0 ? (
              <ul>
                {draftExceptions.filter(({ barberId }) => barberId === selectedBarberId).map((exception) => (
                  <li key={`${exception.barberId}-${exception.date}`}>
                    <span>{exception.date}</span>
                    <span>{exception.unavailable ? 'Día libre' : 'Horario especial'}</span>
                    <button type="button" aria-label={`Eliminar excepción ${exception.date}`} onClick={() => handleRemove(exception.date)}>Eliminar</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay excepciones para este barbero.</p>
            )}
          </section>
        </>
      ) : (
        <p class="agenda-empty">No hay barberos para configurar.</p>
      )}
    </section>
  );
}
