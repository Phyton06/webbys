import { useState } from 'preact/hooks';
import {
  SCHEDULE_FAILURE,
  type BarberRecord,
  type BarberSchedule,
  type ScheduleFailure,
  type ScheduledDay,
  type TimeInterval,
} from '../types/agenda';
import { validateScheduleIntervals } from '../services/availability';
import { Dropdown } from './Dropdown';

const WEEKDAY = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

const WORKDAYS = [
  { weekday: WEEKDAY.MONDAY, label: 'lunes' },
  { weekday: WEEKDAY.TUESDAY, label: 'martes' },
  { weekday: WEEKDAY.WEDNESDAY, label: 'miércoles' },
  { weekday: WEEKDAY.THURSDAY, label: 'jueves' },
  { weekday: WEEKDAY.FRIDAY, label: 'viernes' },
  { weekday: WEEKDAY.SATURDAY, label: 'sábado' },
  { weekday: WEEKDAY.SUNDAY, label: 'domingo' },
] as const;

const INTERVAL_KIND = {
  WORKING: 'working',
  BREAKS: 'breaks',
} as const;

const scheduleFailureCopy: Record<ScheduleFailure, string> = {
  [SCHEDULE_FAILURE.INVALID_INTERVAL]: 'Revisa que cada hora de inicio sea anterior a la hora final.',
  [SCHEDULE_FAILURE.OVERLAPPING_WORKING_INTERVALS]: 'Los horarios de trabajo no pueden superponerse.',
  [SCHEDULE_FAILURE.BREAK_OUTSIDE_WORKING_HOURS]: 'El descanso debe quedar dentro de un horario laboral.',
  [SCHEDULE_FAILURE.OVERLAPPING_BREAKS]: 'Los descansos no pueden superponerse.',
};

type IntervalKind = (typeof INTERVAL_KIND)[keyof typeof INTERVAL_KIND];

interface BarberAvailabilityPanelProps {
  barbers: BarberRecord[];
  schedules: BarberSchedule[];
  onSave: (schedules: BarberSchedule[]) => boolean;
}

function defaultWorkday(weekday: number): ScheduledDay {
  return {
    weekday,
    working: [{ start: '09:00', end: '18:00' }],
    breaks: [{ start: '13:00', end: '14:00' }],
  };
}

function validationError(schedules: BarberSchedule[]): string | undefined {
  for (const schedule of schedules) {
    for (const day of schedule.days) {
      if (day.working.length === 0) return 'Agrega al menos un horario laboral para cada día activo.';
      const result = validateScheduleIntervals(day.working, day.breaks);
      if (!result.valid) return scheduleFailureCopy[result.reason];
    }
  }
  return undefined;
}

export function BarberAvailabilityPanel({ barbers, schedules, onSave }: BarberAvailabilityPanelProps) {
  const [selectedBarberId, setSelectedBarberId] = useState(() => barbers[0]?.id ?? '');
  const [draftSchedules, setDraftSchedules] = useState(schedules);
  const [error, setError] = useState('');
  const [invalidDraft, setInvalidDraft] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const selectedSchedule = draftSchedules.find(({ barberId }) => barberId === selectedBarberId);
  const barberOptions = barbers.map(({ id, name }) => ({ value: id, label: name }));

  function updateDay(weekday: number, transform: (day: ScheduledDay | undefined) => ScheduledDay | undefined) {
    setDraftSchedules((current) => {
      const existingSchedule = current.find(({ barberId }) => barberId === selectedBarberId);
      const schedule = existingSchedule ?? { barberId: selectedBarberId, days: [] };
      const previousDay = schedule.days.find((day) => day.weekday === weekday);
      const nextDay = transform(previousDay);
      const days = nextDay
        ? [...schedule.days.filter((day) => day.weekday !== weekday), nextDay].sort((first, second) => first.weekday - second.weekday)
        : schedule.days.filter((day) => day.weekday !== weekday);
      const nextSchedule = { ...schedule, days };
      return existingSchedule
        ? current.map((entry) => entry.barberId === selectedBarberId ? nextSchedule : entry)
        : [...current, nextSchedule];
    });
    setError('');
    setInvalidDraft(false);
    setAnnouncement('');
  }

  function setDayEnabled(weekday: number, enabled: boolean) {
    updateDay(weekday, (day) => enabled ? (day ?? defaultWorkday(weekday)) : undefined);
  }

  function editInterval(weekday: number, kind: IntervalKind, index: number, value: Partial<TimeInterval>) {
    updateDay(weekday, (day) => {
      if (!day) return day;
      const intervals = [...day[kind]];
      const interval = intervals[index];
      if (!interval) return day;
      intervals[index] = { ...interval, ...value };
      return { ...day, [kind]: intervals };
    });
  }

  function addInterval(weekday: number, kind: IntervalKind) {
    updateDay(weekday, (day) => day ? { ...day, [kind]: [...day[kind], { start: '', end: '' }] } : day);
  }

  function removeInterval(weekday: number, kind: IntervalKind, index: number) {
    updateDay(weekday, (day) => day ? { ...day, [kind]: day[kind].filter((_, position) => position !== index) } : day);
  }

  function handleSave(event: SubmitEvent) {
    event.preventDefault();
    const nextError = validationError(draftSchedules);
    if (nextError) {
      setError(nextError);
      setInvalidDraft(true);
      setAnnouncement('');
      return;
    }

    if (onSave(draftSchedules)) {
      setError('');
      setInvalidDraft(false);
      setAnnouncement('Horarios actualizados.');
    } else {
      setError('No se pudieron guardar los horarios. Revisa el almacenamiento e inténtalo de nuevo.');
      setInvalidDraft(false);
      setAnnouncement('');
    }
  }

  return (
    <section class="barber-availability-panel" aria-labelledby="barber-availability-title">
      <header class="barber-availability-heading">
        <div>
          <h2 id="barber-availability-title">Horarios de trabajo</h2>
          <p>Define las jornadas y descansos de cada barbero.</p>
        </div>
      </header>

      {barbers.length > 0 ? (
        <>
          <div class="availability-barber-control">
            <span>Barbero</span>
            <Dropdown label="Barbero de horarios" value={selectedBarberId} options={barberOptions} onChange={setSelectedBarberId} />
          </div>
          <form class="availability-schedule-form" onSubmit={handleSave}>
            <div class="availability-workdays">
              {WORKDAYS.map(({ weekday, label }) => {
                const day = selectedSchedule?.days.find((entry) => entry.weekday === weekday);
                return (
                  <fieldset class="availability-day" key={weekday}>
                    <legend>{label}</legend>
                    <label class="availability-day-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(day)}
                        aria-label={`Día laborable · ${label}`}
                        onChange={(event) => setDayEnabled(weekday, (event.currentTarget as HTMLInputElement).checked)}
                      />
                      <span>Día laborable</span>
                    </label>
                    {day && (
                      <div class="availability-day-settings">
                        <div class="availability-interval-list">
                          {day.working.map((interval, index) => (
                            <div class="availability-interval" key={`work-${weekday}-${index}`}>
                              <label>
                                <span>Inicio</span>
                                <input
                                  type="time"
                                  step={900}
                                  aria-label={`Inicio del horario ${label} ${index + 1}`}
                                  aria-invalid={invalidDraft || undefined}
                                  aria-describedby={invalidDraft ? 'weekly-schedule-error' : undefined}
                                  value={interval.start}
                                  onInput={(event) => editInterval(weekday, INTERVAL_KIND.WORKING, index, { start: (event.currentTarget as HTMLInputElement).value })}
                                />
                              </label>
                              <label>
                                <span>Fin</span>
                                <input
                                  type="time"
                                  step={900}
                                  aria-label={`Fin del horario ${label} ${index + 1}`}
                                  aria-invalid={invalidDraft || undefined}
                                  aria-describedby={invalidDraft ? 'weekly-schedule-error' : undefined}
                                  value={interval.end}
                                  onInput={(event) => editInterval(weekday, INTERVAL_KIND.WORKING, index, { end: (event.currentTarget as HTMLInputElement).value })}
                                />
                              </label>
                              <button type="button" aria-label={`Eliminar horario ${label} ${index + 1}`} onClick={() => removeInterval(weekday, INTERVAL_KIND.WORKING, index)}>Eliminar</button>
                            </div>
                          ))}
                        </div>
                        <button class="availability-add-button" type="button" onClick={() => addInterval(weekday, INTERVAL_KIND.WORKING)}>
                          Agregar horario {label}
                        </button>
                        <h3>Descansos</h3>
                        <div class="availability-interval-list">
                          {day.breaks.map((interval, index) => (
                            <div class="availability-interval" key={`break-${weekday}-${index}`}>
                              <label>
                                <span>Inicio</span>
                                <input
                                  type="time"
                                  step={900}
                                  aria-label={`Inicio del descanso ${label} ${index + 1}`}
                                  aria-invalid={invalidDraft || undefined}
                                  aria-describedby={invalidDraft ? 'weekly-schedule-error' : undefined}
                                  value={interval.start}
                                  onInput={(event) => editInterval(weekday, INTERVAL_KIND.BREAKS, index, { start: (event.currentTarget as HTMLInputElement).value })}
                                />
                              </label>
                              <label>
                                <span>Fin</span>
                                <input
                                  type="time"
                                  step={900}
                                  aria-label={`Fin del descanso ${label} ${index + 1}`}
                                  aria-invalid={invalidDraft || undefined}
                                  aria-describedby={invalidDraft ? 'weekly-schedule-error' : undefined}
                                  value={interval.end}
                                  onInput={(event) => editInterval(weekday, INTERVAL_KIND.BREAKS, index, { end: (event.currentTarget as HTMLInputElement).value })}
                                />
                              </label>
                              <button type="button" aria-label={`Eliminar descanso ${label} ${index + 1}`} onClick={() => removeInterval(weekday, INTERVAL_KIND.BREAKS, index)}>Eliminar</button>
                            </div>
                          ))}
                        </div>
                        <button class="availability-add-button" type="button" onClick={() => addInterval(weekday, INTERVAL_KIND.BREAKS)}>
                          Agregar descanso {label}
                        </button>
                      </div>
                    )}
                  </fieldset>
                );
              })}
            </div>
            {error && <p class="availability-error" id="weekly-schedule-error" role="alert">{error}</p>}
            <p class="availability-announcement" role="status" aria-live="polite">{announcement}</p>
            <button class="availability-save-button" type="submit">Guardar horarios</button>
          </form>
        </>
      ) : (
        <p class="agenda-empty">No hay barberos para configurar.</p>
      )}
    </section>
  );
}
