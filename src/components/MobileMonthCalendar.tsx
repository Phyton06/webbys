import { ChevronLeft, ChevronRight } from 'lucide-preact';
import type { AppointmentRecord } from '../types/domain';
import '../styles/agenda.css';

interface MobileMonthCalendarProps {
  selectedDate: string;
  appointments: AppointmentRecord[];
  onSelectDate: (date: string) => void;
}

interface CalendarDay {
  date: Date;
  key: string;
  appointmentCount: number;
  inDisplayedMonth: boolean;
}

const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseLocalDate(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase('es') + value.slice(1);
}

function monthTitle(date: Date): string {
  return capitalize(new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(date));
}

function getMonthDays(selectedDate: string, appointments: AppointmentRecord[]): CalendarDay[] {
  const selected = parseLocalDate(selectedDate);
  const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  const dayCount = new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((mondayOffset + dayCount) / 7) * 7;
  const appointmentCounts = new Map<string, number>();

  for (const appointment of appointments) {
    const key = localDateKey(new Date(appointment.startsAt));
    appointmentCounts.set(key, (appointmentCounts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(selected.getFullYear(), selected.getMonth(), index - mondayOffset + 1, 12);
    const key = localDateKey(date);
    return {
      date,
      key,
      appointmentCount: appointmentCounts.get(key) ?? 0,
      inDisplayedMonth: date.getMonth() === selected.getMonth(),
    };
  });
}

export function MobileMonthCalendar({ selectedDate, appointments, onSelectDate }: MobileMonthCalendarProps) {
  const selectedMonth = parseLocalDate(selectedDate);
  const days = getMonthDays(selectedDate, appointments);

  function moveMonth(offset: -1 | 1) {
    const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + offset, 1, 12);
    onSelectDate(localDateKey(nextMonth));
  }

  return (
    <section class="mobile-month-calendar" aria-label="Calendario mensual">
      <header class="mobile-month-calendar-heading">
        <button class="mobile-month-calendar-arrow" type="button" aria-label="Mes anterior" onClick={() => moveMonth(-1)}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h2>{monthTitle(selectedMonth)}</h2>
        <button class="mobile-month-calendar-arrow" type="button" aria-label="Mes siguiente" onClick={() => moveMonth(1)}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </header>

      <div class="mobile-month-calendar-weekdays" aria-hidden="true">
        {weekdayLabels.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}
      </div>

      <div class="mobile-month-calendar-grid" role="group" aria-label={`Días de ${monthTitle(selectedMonth)}`}>
        {days.map(({ date, key, appointmentCount, inDisplayedMonth }) => {
          const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(date);
          const month = new Intl.DateTimeFormat('es', { month: 'long' }).format(date);
          const appointmentLabel = appointmentCount > 0
            ? `, ${appointmentCount} ${appointmentCount === 1 ? 'cita' : 'citas'}`
            : '';
          const selected = key === selectedDate;

          return (
            <button
              class={`mobile-month-calendar-day${selected ? ' is-selected' : ''}${inDisplayedMonth ? '' : ' is-outside-month'}`}
              type="button"
              aria-label={`${capitalize(weekday)}, ${date.getDate()} de ${month}${appointmentLabel}`}
              aria-pressed={selected}
              onClick={() => onSelectDate(key)}
              key={key}
            >
              <span>{date.getDate()}</span>
              {appointmentCount > 0 && <span class="mobile-month-calendar-marker" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
