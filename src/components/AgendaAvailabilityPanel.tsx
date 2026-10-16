import { useState } from 'preact/hooks';
import type { AgendaState } from '../types/agenda';
import { getAvailableSlots } from '../services/availability';
import { getBookableBarbers } from '../services/employees';
import { Dropdown } from './Dropdown';

export const ALL_BARBERS = 'all';

interface AgendaAvailabilityPanelProps {
  state: AgendaState;
  date: string;
  barberId: string;
  now: Date;
}

export function AgendaAvailabilityPanel({ state, date, barberId, now }: AgendaAvailabilityPanelProps) {
  const [selectedServiceId, setSelectedServiceId] = useState(() => state.services[0]?.id ?? '');
  const selectedService = state.services.find(({ id }) => id === selectedServiceId) ?? state.services[0];
  const bookableBarbers = getBookableBarbers(state.employees, state.barbers);
  const visibleBarbers = barberId === ALL_BARBERS
    ? bookableBarbers
    : bookableBarbers.filter(({ id }) => id === barberId);
  const serviceOptions = state.services.map((service) => ({
    value: service.id,
    label: `${service.name} · ${service.durationMinutes} min`,
  }));

  return (
    <section class="agenda-availability" aria-label="Horarios disponibles">
      <div class="agenda-availability-heading">
        <div>
          <h2>Horarios disponibles</h2>
          <p>{selectedService ? `${selectedService.name} · ${selectedService.durationMinutes} min` : 'Selecciona un servicio'}</p>
        </div>
        {selectedService && (
          <div class="agenda-availability-service-control">
            <span>Servicio</span>
            <Dropdown
              label="Servicio"
              value={selectedService.id}
              options={serviceOptions}
              onChange={setSelectedServiceId}
            />
          </div>
        )}
      </div>
      {selectedService ? (
        visibleBarbers.length > 0 ? (
          <div class="agenda-availability-groups">
            {visibleBarbers.map((barber) => {
              const slots = getAvailableSlots(
                date,
                barber.id,
                selectedService.durationMinutes,
                state.schedules,
                state.exceptions,
                state.appointments,
                now,
              );

              return (
                <section class="agenda-availability-group" role="group" aria-label={`Horarios de ${barber.name}`} key={barber.id}>
                  <details open={barberId !== ALL_BARBERS}>
                    <summary aria-label={`Horarios de ${barber.name}, ${slots.length} disponibles`}>
                      <strong>{barber.name}</strong>
                      <span>{slots.length} {slots.length === 1 ? 'espacio' : 'espacios'}</span>
                    </summary>
                    {slots.length > 0 ? (
                      <ul class="agenda-available-times">
                        {slots.map((slot) => <li key={slot}><time>{slot}</time></li>)}
                      </ul>
                    ) : (
                      <p class="agenda-week-empty">Sin espacios disponibles</p>
                    )}
                  </details>
                </section>
              );
            })}
          </div>
        ) : (
          <p class="agenda-empty">No hay barberos activos disponibles para nuevas citas.</p>
        )
      ) : (
        <p class="agenda-empty">No hay servicios disponibles.</p>
      )}
    </section>
  );
}
