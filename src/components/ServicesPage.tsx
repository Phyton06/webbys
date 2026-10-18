import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { AgendaState, ServiceRecord } from '../types/agenda';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AdminGate } from './AdminGate';
import { RoleShell } from './RoleShell';
import { BackLink } from './BackLink';
import { Dropdown } from './Dropdown';
import { pageRecords, RecordPagination, RECORD_PAGE_SIZE } from './RecordPagination';
import { formatCurrency, getCurrentBusinessCurrency } from '../services/currency';
import '../styles/services.css';

interface ServicesPageProps {
  now?: Date;
}

const SERVICE_FILTER = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

type ServiceFilter = (typeof SERVICE_FILTER)[keyof typeof SERVICE_FILTER];

const serviceStatusOptions = [
  { value: SERVICE_FILTER.ALL, label: 'Todos' },
  { value: SERVICE_FILTER.ACTIVE, label: 'Activos' },
  { value: SERVICE_FILTER.INACTIVE, label: 'Inactivos' },
];

function loadInitialState(now: Date): AgendaState {
  try {
    return loadAgendaState(window.localStorage, now).state;
  } catch {
    return createAgendaSeed(now);
  }
}

function ServiceForm({
  service,
  onSave,
  onCancel,
}: {
  service?: ServiceRecord;
  onSave: (service: ServiceRecord) => boolean;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(service?.name ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [price, setPrice] = useState(service ? String(service.price) : '');
  const [duration, setDuration] = useState(service ? String(service.durationMinutes) : '');
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    return () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
    };
  }, []);

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedDescription = description.trim();
    const normalizedPrice = Number(price);
    const normalizedDuration = Number(duration);
    if (!normalizedName || !Number.isFinite(normalizedPrice) || normalizedPrice < 0
      || !Number.isInteger(normalizedDuration) || normalizedDuration <= 0) {
      setError('Revisa el nombre, el precio y la duración del servicio.');
      return;
    }
    const next: ServiceRecord = {
      id: service?.id ?? `service-${crypto.randomUUID()}`,
      name: normalizedName,
      description: normalizedDescription,
      price: normalizedPrice,
      durationMinutes: normalizedDuration,
      active: service?.active ?? true,
    };
    if (!onSave(next)) {
      setError('No se pudo guardar el servicio. Revisa el almacenamiento e inténtalo de nuevo.');
    }
  }

  return (
    <dialog
      class="appointment-modal service-modal"
      ref={dialogRef}
      aria-labelledby="service-form-title"
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
    >
      <form class="appointment-form service-form" onSubmit={submit}>
        <header class="appointment-form-heading">
          <div class="view-title-row">
            <BackLink ariaLabel="Cerrar formulario de servicio" onClick={onCancel} />
            <div>
              <h2 id="service-form-title">{service ? 'Editar servicio' : 'Nuevo servicio'}</h2>
              <p>Define los datos que se usarán para calcular las citas.</p>
            </div>
          </div>
        </header>
        <label>
          <span>Nombre del servicio</span>
          <input autoFocus required value={name} onInput={(event) => setName(event.currentTarget.value)} />
        </label>
        <label>
          <span>Descripción</span>
          <textarea value={description} onInput={(event) => setDescription(event.currentTarget.value)} />
        </label>
        <div class="service-form-numbers">
          <label>
            <span>Precio</span>
            <input type="number" min="0" step="0.01" required value={price} onInput={(event) => setPrice(event.currentTarget.value)} />
          </label>
          <label>
            <span>Duración en minutos</span>
            <input type="number" min="1" step="1" required value={duration} onInput={(event) => setDuration(event.currentTarget.value)} />
          </label>
        </div>
        {error && <p class="availability-error" role="alert">{error}</p>}
        <div class="appointment-form-actions service-form-actions">
          <button class="availability-save-button" type="submit">Guardar servicio</button>
          <button class="appointment-form-cancel" type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </dialog>
  );
}

export function ServicesPage({ now = new Date() }: ServicesPageProps) {
  const [state, setState] = useState(() => loadInitialState(now));
  const [currency] = useState(getCurrentBusinessCurrency);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceFilter>(SERVICE_FILTER.ALL);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [editingService, setEditingService] = useState<ServiceRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const selectedService = state.services.find(({ id }) => id === selectedId);

  const visibleServices = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('es');
    return state.services
      .filter((service) => statusFilter === SERVICE_FILTER.ALL
        || (statusFilter === SERVICE_FILTER.ACTIVE ? service.active !== false : service.active === false))
      .filter(({ name, description }) => !search
        || name.toLocaleLowerCase('es').includes(search)
        || (description ?? '').toLocaleLowerCase('es').includes(search))
      .sort((first, second) => first.name.localeCompare(second.name, 'es', { sensitivity: 'base' }));
  }, [query, state.services, statusFilter]);
  const pageCount = Math.ceil(visibleServices.length / RECORD_PAGE_SIZE);
  const pageServices = pageRecords(visibleServices, Math.min(page, Math.max(0, pageCount - 1)));

  function persist(services: ServiceRecord[]): boolean {
    const next: AgendaState = { ...state, services };
    try {
      saveAgendaState(window.localStorage, next);
      setState(next);
      setError('');
      return true;
    } catch {
      setError('No se pudieron guardar los cambios. Revisa el almacenamiento e inténtalo de nuevo.');
      return false;
    }
  }

  function saveService(service: ServiceRecord): boolean {
    const exists = state.services.some(({ id }) => id === service.id);
    const services = exists
      ? state.services.map((current) => current.id === service.id ? service : current)
      : [...state.services, service];
    if (!persist(services)) return false;
    setFormOpen(false);
    setEditingService(undefined);
    setSelectedId(service.id);
    return true;
  }

  function setActive(service: ServiceRecord, active: boolean) {
    persist(state.services.map((current) => current.id === service.id ? { ...current, active } : current));
  }

  function closeForm() {
    setFormOpen(false);
    setEditingService(undefined);
  }

  return (
    <AdminGate role="any">
      <RoleShell activeSection="Servicios">
        <section class="services-page" aria-labelledby="services-title">
          <header class="agenda-heading services-heading">
            <div>
              <div class="view-title-row">
                {selectedService && <BackLink ariaLabel="Volver a Servicios" onClick={() => setSelectedId(undefined)} />}
                <h1 id="services-title">Servicios</h1>
              </div>
              <p>Administra precios y duraciones para calcular las citas.</p>
            </div>
            <button class="availability-save-button" type="button" onClick={() => { setEditingService(undefined); setFormOpen(true); }}>Nuevo servicio</button>
          </header>

          {error && <p class="availability-error" role="alert">{error}</p>}

          {selectedService ? (
            <section class="service-detail" aria-labelledby="service-detail-title">
              <header>
                <div>
                  <h2 id="service-detail-title">{selectedService.name}</h2>
                  <span class={`service-status${selectedService.active === false ? ' is-inactive' : ''}`}>{selectedService.active === false ? 'Inactivo' : 'Activo'}</span>
                </div>
                <div class="service-actions">
                  <button class="service-secondary-button" type="button" onClick={() => { setEditingService(selectedService); setFormOpen(true); }}>Editar</button>
                  {selectedService.active === false
                    ? <button class="service-secondary-button" type="button" onClick={() => setActive(selectedService, true)}>Activar</button>
                    : <button class="service-secondary-button" type="button" onClick={() => setActive(selectedService, false)}>Desactivar</button>}
                </div>
              </header>
              <p>{selectedService.description || 'Sin descripción.'}</p>
              <dl>
                <div><dt>Precio</dt><dd>{formatCurrency(selectedService.price, currency)}</dd></div>
                <div><dt>Duración estimada</dt><dd>{selectedService.durationMinutes} min</dd></div>
              </dl>
            </section>
          ) : (
            <>
              <div class="services-toolbar">
                <label>
                  <span>Buscar</span>
                  <input type="search" aria-label="Buscar servicios" placeholder="Nombre o descripción" value={query} onInput={(event) => { setQuery(event.currentTarget.value); setPage(0); }} />
                </label>
                <div class="services-filter-control">
                  <span>Estado</span>
                  <Dropdown label="Estado" value={statusFilter} options={serviceStatusOptions} onChange={(value) => { setStatusFilter(value); setPage(0); }} />
                </div>
              </div>
              <ul class="service-list" aria-label="Lista de servicios">
                {pageServices.map((service) => (
                  <li key={service.id}>
                    <article class="service-row" aria-label={`Servicio ${service.name}`}>
                      <button class="service-row-open" type="button" onClick={() => setSelectedId(service.id)}>
                        <strong>{service.name}</strong>
                        <span>{service.description || 'Sin descripción.'}</span>
                      </button>
                      <span class="service-row-price">{formatCurrency(service.price, currency)}</span>
                      <span>{service.durationMinutes} min</span>
                      <span class={`service-status${service.active === false ? ' is-inactive' : ''}`}>{service.active === false ? 'Inactivo' : 'Activo'}</span>
                      <div class="service-actions">
                        <button class="service-secondary-button" type="button" aria-label={`Editar servicio ${service.name}`} onClick={() => { setEditingService(service); setFormOpen(true); }}>Editar</button>
                        {service.active === false
                          ? <button class="service-secondary-button" type="button" aria-label={`Activar servicio ${service.name}`} onClick={() => setActive(service, true)}>Activar</button>
                          : <button class="service-secondary-button" type="button" aria-label={`Desactivar servicio ${service.name}`} onClick={() => setActive(service, false)}>Desactivar</button>}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
              <RecordPagination page={Math.min(page, Math.max(0, pageCount - 1))} pageCount={pageCount} label="Paginación de servicios" onPageChange={setPage} />
              {visibleServices.length === 0 && <p class="agenda-empty">No hay servicios que coincidan con la búsqueda.</p>}
            </>
          )}
          {formOpen && <ServiceForm service={editingService} onSave={saveService} onCancel={closeForm} />}
        </section>
      </RoleShell>
    </AdminGate>
  );
}
