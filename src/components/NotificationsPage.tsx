import { useMemo, useState } from 'preact/hooks';
import { CalendarDays } from 'lucide-preact';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState } from '../services/agenda-store';
import { showLocalNotificationTest, type LocalNotificationTestResult } from '../services/local-notification-test';
import { loadNotifications, resolveNotificationAudience, saveNotifications } from '../services/notifications-store';
import type { AgendaState } from '../types/agenda';
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_RECIPIENT_KIND,
  NOTIFICATION_SEGMENT,
  NOTIFICATION_STATUS,
  type NotificationAudience,
  type NotificationAudienceSegment,
  type NotificationCategory,
  type NotificationRecord,
  type NotificationRecipientKind,
} from '../types/notifications';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { BackLink } from './BackLink';
import { Dropdown } from './Dropdown';
import { MobileMonthCalendar } from './MobileMonthCalendar';
import { NotificationRecipientPicker } from './NotificationRecipientPicker';
import '../styles/notifications.css';

interface NotificationsPageProps {
  now?: Date;
}

type NotificationsView = 'history' | 'composer';
type NotificationFilter = '' | NotificationRecord['status'];

const categoryOptions = [
  { value: NOTIFICATION_CATEGORY.PRODUCT, label: 'Nuevo producto' },
  { value: NOTIFICATION_CATEGORY.SERVICE, label: 'Nuevo servicio' },
  { value: NOTIFICATION_CATEGORY.PROMOTION, label: 'Promoción' },
  { value: NOTIFICATION_CATEGORY.GENERAL, label: 'Aviso general' },
  { value: NOTIFICATION_CATEGORY.CHANGE, label: 'Cambio importante' },
];

const notificationStatusOptions = [
  { value: '', label: 'Todas' },
  { value: NOTIFICATION_STATUS.DRAFT, label: 'Borradores' },
  { value: NOTIFICATION_STATUS.SCHEDULED, label: 'Programadas' },
  { value: NOTIFICATION_STATUS.SIMULATED, label: 'Envíos simulados' },
];

const clientSegmentOptions = [
  { value: NOTIFICATION_SEGMENT.ALL_ACTIVE, label: 'Clientes activos' },
  { value: NOTIFICATION_SEGMENT.SELECTED, label: 'Elegir clientes' },
];

const employeeSegmentOptions = [
  { value: NOTIFICATION_SEGMENT.ALL_ACTIVE, label: 'Todos los empleados activos' },
  { value: NOTIFICATION_SEGMENT.BARBERS, label: 'Barberos activos' },
  { value: NOTIFICATION_SEGMENT.ASSISTANTS, label: 'Asistentes activos' },
  { value: NOTIFICATION_SEGMENT.ADMINISTRATORS, label: 'Administradores activos' },
  { value: NOTIFICATION_SEGMENT.SELECTED, label: 'Elegir empleados' },
];

const permissionLabels: Record<NotificationPermission | 'unsupported', string> = {
  default: 'Pendiente de permiso',
  granted: 'Permiso concedido en este dispositivo',
  denied: 'Permiso denegado en este dispositivo',
  unsupported: 'Prueba local no compatible con este navegador',
};

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateAfter(date: Date, days: number): string {
  return dateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function formatSchedule(value: string): string {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatCategory(category: NotificationCategory): string {
  return categoryOptions.find(({ value }) => value === category)?.label ?? 'Aviso';
}

function getInitialAgenda(now: Date): AgendaState {
  try {
    return loadAgendaState(window.localStorage, now).state;
  } catch {
    return createAgendaSeed(now);
  }
}

function getInitialNotifications(): NotificationRecord[] {
  try {
    return loadNotifications(window.localStorage);
  } catch {
    return [];
  }
}

function localDeviceTestMessage(result: LocalNotificationTestResult): string {
  if (result === 'shown') return 'Notificación local mostrada solo en este dispositivo; no se envió a destinatarios.';
  if (result === 'permission-denied') return 'El permiso está denegado. Habilítalo en los ajustes del navegador para probarla.';
  if (result === 'permission-pending') return 'No se concedió permiso. Puedes volver a intentarlo desde este botón.';
  if (result === 'insecure-context') return 'La prueba del dispositivo requiere HTTPS o localhost en este mismo dispositivo.';
  if (result === 'unsupported') return 'Este navegador no permite mostrar una notificación local desde la PWA.';
  return 'No se pudo mostrar la notificación local. Revisa el permiso y vuelve a intentarlo.';
}

async function showOnDevice(title: string, body: string): Promise<void> {
  const registration = await navigator.serviceWorker.register('/notification-test-sw.js');
  const readyRegistration = await navigator.serviceWorker.ready;
  const worker = registration.active ?? readyRegistration.active;
  if (!worker) throw new Error('The local notification service worker is not active.');

  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      channel.port1.close();
      reject(new Error('The local notification test timed out.'));
    }, 10000);
    channel.port1.onmessage = (event: MessageEvent<{ ok?: boolean }>) => {
      window.clearTimeout(timeout);
      channel.port1.close();
      if (event.data?.ok) resolve();
      else reject(new Error('The service worker could not display the local notification.'));
    };
    worker.postMessage({ type: 'WEBBYS_LOCAL_NOTIFICATION_TEST', title, body }, [channel.port2]);
  });
}

function audienceLabel(audience: NotificationAudience): string {
  if (audience.segment === NOTIFICATION_SEGMENT.ALL_ACTIVE) {
    return audience.recipientKind === NOTIFICATION_RECIPIENT_KIND.CLIENTS ? 'Clientes activos' : 'Todos los empleados activos';
  }
  if (audience.segment === NOTIFICATION_SEGMENT.BARBERS) return 'Barberos activos';
  if (audience.segment === NOTIFICATION_SEGMENT.ASSISTANTS) return 'Asistentes activos';
  if (audience.segment === NOTIFICATION_SEGMENT.ADMINISTRATORS) return 'Administradores activos';
  return `${audience.recipients.length} ${audience.recipients.length === 1 ? 'persona seleccionada' : 'personas seleccionadas'}`;
}

export function NotificationsPage({ now = new Date() }: NotificationsPageProps) {
  const [agenda] = useState(() => getInitialAgenda(now));
  const [notifications, setNotifications] = useState(getInitialNotifications);
  const [view, setView] = useState<NotificationsView>('history');
  const [historyQuery, setHistoryQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<NotificationFilter>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<NotificationCategory>(NOTIFICATION_CATEGORY.GENERAL);
  const [recipientKind, setRecipientKind] = useState<NotificationRecipientKind>(NOTIFICATION_RECIPIENT_KIND.CLIENTS);
  const [segment, setSegment] = useState<NotificationAudienceSegment>(NOTIFICATION_SEGMENT.ALL_ACTIVE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => dateAfter(now, 1));
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [calendarMonth, setCalendarMonth] = useState(() => dateAfter(now, 1));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [storeMessage, setStoreMessage] = useState('');
  const [localTestMessage, setLocalTestMessage] = useState('');
  const [devicePermission, setDevicePermission] = useState<NotificationPermission | 'unsupported'>(() => (
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  ));

  const clients = useMemo(() => agenda.clients.filter(({ active }) => active !== false).map(({ id, name }) => ({ id, name })), [agenda.clients]);
  const employees = useMemo(() => (agenda.employees ?? []).filter(({ active }) => active).map(({ id, name, role }) => ({ id, name, role })), [agenda.employees]);
  const recipientOptions = recipientKind === NOTIFICATION_RECIPIENT_KIND.CLIENTS
    ? clients
    : employees;
  const recipientSnapshots = resolveNotificationAudience(recipientKind, segment, selectedIds, agenda.clients, agenda.employees ?? []);
  const audience: NotificationAudience = { recipientKind, segment, recipients: recipientSnapshots };
  const visibleNotifications = useMemo(() => notifications
    .filter((notification) => statusFilter === '' || notification.status === statusFilter)
    .filter((notification) => {
      const query = historyQuery.trim().toLocaleLowerCase('es');
      return !query || notification.title.toLocaleLowerCase('es').includes(query)
        || notification.body.toLocaleLowerCase('es').includes(query)
        || notification.audience.recipients.some(({ name }) => name.toLocaleLowerCase('es').includes(query));
    })
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt)), [historyQuery, notifications, statusFilter]);

  function resetComposer() {
    setTitle('');
    setBody('');
    setCategory(NOTIFICATION_CATEGORY.GENERAL);
    setRecipientKind(NOTIFICATION_RECIPIENT_KIND.CLIENTS);
    setSegment(NOTIFICATION_SEGMENT.ALL_ACTIVE);
    setSelectedIds([]);
    setScheduleOpen(false);
    setScheduledDate(dateAfter(now, 1));
    setScheduledTime('09:00');
    setCalendarMonth(dateAfter(now, 1));
    setDatePickerOpen(false);
    setFormError('');
    setStoreMessage('');
    setLocalTestMessage('');
  }

  function beginComposer() {
    resetComposer();
    setView('composer');
  }

  function backToHistory() {
    setView('history');
    setDatePickerOpen(false);
    setLocalTestMessage('');
  }

  function saveRecord(status: NotificationRecord['status']) {
    const normalizedTitle = title.trim();
    const normalizedBody = body.trim();
    if (!normalizedTitle || !normalizedBody) {
      setFormError('Escribe el título y el mensaje antes de continuar.');
      return;
    }
    if (recipientSnapshots.length === 0) {
      setFormError('Selecciona al menos un destinatario activo.');
      return;
    }

    let scheduledFor: string | undefined;
    if (status === NOTIFICATION_STATUS.SCHEDULED) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      if (!Number.isFinite(scheduledDateTime.getTime()) || scheduledDateTime.getTime() <= now.getTime()) {
        setFormError('Elige una fecha y hora futuras para programar.');
        return;
      }
      scheduledFor = scheduledDateTime.toISOString();
    }
    const record: NotificationRecord = {
      id: `notification-${crypto.randomUUID()}`,
      title: normalizedTitle,
      body: normalizedBody,
      category,
      audience: { ...audience, recipients: recipientSnapshots },
      createdAt: now.toISOString(),
      status,
      ...(scheduledFor ? { scheduledFor } : {}),
      ...(status === NOTIFICATION_STATUS.SIMULATED ? { simulatedAt: now.toISOString() } : {}),
    };

    try {
      const next = [record, ...notifications];
      saveNotifications(window.localStorage, next);
      setNotifications(next);
      setFormError('');
      setStoreMessage(status === NOTIFICATION_STATUS.DRAFT
        ? 'Borrador guardado localmente.'
        : status === NOTIFICATION_STATUS.SCHEDULED
          ? 'Programación guardada localmente; no se enviará automáticamente.'
          : 'Envío simulado; no se entregó a los destinatarios.');
      backToHistory();
    } catch {
      setFormError('No se pudo guardar. Revisa el almacenamiento del navegador e inténtalo de nuevo.');
    }
  }

  function simulateScheduled(record: NotificationRecord) {
    const next = notifications.map((current) => current.id === record.id
      ? { ...current, status: NOTIFICATION_STATUS.SIMULATED, simulatedAt: now.toISOString() }
      : current);
    try {
      saveNotifications(window.localStorage, next);
      setNotifications(next);
      setStoreMessage('Envío simulado; no se entregó a los destinatarios.');
    } catch {
      setStoreMessage('No se pudo guardar la simulación. Revisa el almacenamiento del navegador.');
    }
  }

  async function testLocalNotification() {
    const result = await showLocalNotificationTest(title, body, {
      secureContext: window.isSecureContext,
      supported: typeof Notification !== 'undefined' && 'serviceWorker' in navigator && typeof MessageChannel !== 'undefined',
      requestPermission: () => Notification.requestPermission(),
      showOnDevice,
    });
    if (result === 'shown') setDevicePermission('granted');
    else if (result === 'permission-denied') setDevicePermission('denied');
    else if (result === 'unsupported') setDevicePermission('unsupported');
    setLocalTestMessage(localDeviceTestMessage(result));
  }

  function setAudienceKind(value: NotificationRecipientKind) {
    setRecipientKind(value);
    setSegment(NOTIFICATION_SEGMENT.ALL_ACTIVE);
    setSelectedIds([]);
  }

  function setAudienceSegment(value: NotificationAudienceSegment) {
    setSegment(value);
    setSelectedIds([]);
  }

  const segmentOptions = recipientKind === NOTIFICATION_RECIPIENT_KIND.CLIENTS
    ? clientSegmentOptions
    : employeeSegmentOptions;
  const startDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
  const scheduleIsFuture = Number.isFinite(startDateTime.getTime()) && startDateTime.getTime() > now.getTime();
  const permissionText = permissionLabels[devicePermission];

  return (
    <AdminGate>
      <AdminShell activeSection="Notificaciones">
        <section class="notifications-page" aria-labelledby="notifications-title">
          <header class="agenda-heading notifications-heading">
            <div>
              <div class="view-title-row">
                {view === 'composer' && <BackLink ariaLabel="Volver al historial" onClick={backToHistory} />}
                <h1 id="notifications-title">Notificaciones</h1>
              </div>
              <p>Prepara avisos y revisa su historial de simulación.</p>
            </div>
            {view === 'history' && <button class="availability-save-button" type="button" onClick={beginComposer}>Nueva notificación</button>}
          </header>

          {storeMessage && <p class="notifications-store-message" role="status">{storeMessage}</p>}

          {view === 'history' ? (
            <>
              <section class="notifications-toolbar" aria-label="Buscar y filtrar historial">
                <label class="notifications-search">
                  <span>Buscar notificaciones</span>
                  <input type="search" aria-label="Buscar notificaciones" placeholder="Título, mensaje o destinatario" value={historyQuery} onInput={(event) => setHistoryQuery(event.currentTarget.value)} />
                </label>
                <div class="notifications-filter"><span>Estado</span><Dropdown label="Estado de notificaciones" value={statusFilter} options={notificationStatusOptions} onChange={(value) => setStatusFilter(value as NotificationFilter)} /></div>
              </section>

              <section class="notifications-history" aria-labelledby="notifications-history-title">
                <header class="notifications-section-heading">
                  <div><h2 id="notifications-history-title">Historial de notificaciones</h2><p>Los envíos registrados aquí son simulaciones locales.</p></div>
                </header>
                {visibleNotifications.length ? (
                  <ul class="notifications-list" aria-label="Historial de notificaciones">
                    {visibleNotifications.map((notification) => {
                      const due = notification.status === NOTIFICATION_STATUS.SCHEDULED
                        && notification.scheduledFor !== undefined
                        && new Date(notification.scheduledFor).getTime() <= now.getTime();
                      return (
                        <li key={notification.id}>
                          <article class="notification-record" aria-label={`Notificación ${notification.title}`}>
                            <div class="notification-record-main">
                              <div class="notification-record-title"><h3>{notification.title}</h3><span class={`notification-status status-${notification.status}`}>{notification.status === NOTIFICATION_STATUS.DRAFT ? 'Borrador' : notification.status === NOTIFICATION_STATUS.SCHEDULED ? 'Programada' : 'Envío simulado'}</span></div>
                              <p>{notification.body}</p>
                              <span>{audienceLabel(notification.audience)} · {notification.audience.recipients.length} {notification.audience.recipients.length === 1 ? 'destinatario' : 'destinatarios'}</span>
                            </div>
                            <div class="notification-record-meta">
                              <span>{formatCategory(notification.category)}</span>
                              {notification.scheduledFor && <time dateTime={notification.scheduledFor}>{formatSchedule(notification.scheduledFor)}</time>}
                              {notification.simulatedAt && <time dateTime={notification.simulatedAt}>Simulada · {formatSchedule(notification.simulatedAt)}</time>}
                              {due && <button class="appointment-form-cancel" type="button" aria-label={`Simular envío de ${notification.title}`} onClick={() => simulateScheduled(notification)}>Simular envío</button>}
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                ) : <p class="notifications-empty">{notifications.length ? 'No hay notificaciones que coincidan con estos filtros.' : 'Todavía no hay notificaciones. Crea un borrador o prepara un envío simulado.'}</p>}
              </section>
              <section class="notifications-device-state" aria-label="Estado de notificaciones del dispositivo">
                <div><h2>Prueba local del dispositivo</h2><p>Permiso del navegador: {permissionText}. No hay suscripción push ni envío real configurado.</p></div>
              </section>
            </>
          ) : (
            <form class="notifications-composer" onSubmit={(event) => event.preventDefault()}>
              <header class="notifications-composer-heading">
                <div><h2>Nueva notificación</h2><p>Elige destinatarios y revisa la vista previa antes de guardar.</p></div>
              </header>
              <div class="notifications-composer-grid">
                <div class="notifications-composer-fields">
                  <div class="appointment-form-control">
                    <span>Tipo de destinatarios</span>
                    <Dropdown label="Tipo de destinatarios" value={recipientKind} options={[{ value: NOTIFICATION_RECIPIENT_KIND.CLIENTS, label: 'Clientes' }, { value: NOTIFICATION_RECIPIENT_KIND.EMPLOYEES, label: 'Empleados' }]} onChange={setAudienceKind} />
                  </div>
                  <div class="appointment-form-control">
                    <span>Segmento de {recipientKind === NOTIFICATION_RECIPIENT_KIND.CLIENTS ? 'clientes' : 'empleados'}</span>
                    <Dropdown label={`Segmento de ${recipientKind === NOTIFICATION_RECIPIENT_KIND.CLIENTS ? 'clientes' : 'empleados'}`} value={segment} options={segmentOptions} onChange={setAudienceSegment} />
                  </div>
                  {segment === NOTIFICATION_SEGMENT.SELECTED && (
                    <div class="appointment-form-control">
                      <span>Personas seleccionadas</span>
                      <NotificationRecipientPicker recipients={recipientOptions} selectedIds={selectedIds} onToggle={(id) => setSelectedIds((current) => current.includes(id) ? current.filter((currentId) => currentId !== id) : [...current, id])} />
                    </div>
                  )}
                  <p class="notifications-recipient-count">{recipientSnapshots.length} {recipientSnapshots.length === 1 ? 'destinatario' : 'destinatarios'} incluidos en esta simulación.</p>
                  <div class="appointment-form-control">
                    <span>Tipo de aviso</span>
                    <Dropdown label="Tipo de aviso" value={category} options={categoryOptions} onChange={(value) => setCategory(value)} />
                  </div>
                  <label class="appointment-form-control">
                    <span>Título</span>
                    <input required maxLength={100} aria-label="Título" value={title} onInput={(event) => setTitle(event.currentTarget.value)} />
                  </label>
                  <label class="appointment-form-control">
                    <span>Mensaje</span>
                    <textarea required maxLength={500} aria-label="Mensaje" value={body} onInput={(event) => setBody(event.currentTarget.value)} />
                  </label>
                  <button class="appointment-form-cancel" type="button" onClick={() => setScheduleOpen((open) => !open)} aria-expanded={scheduleOpen}>Programar</button>
                  {scheduleOpen && (
                    <div class="notifications-schedule-fields">
                      <label class="appointment-form-control">
                        <span>Fecha programada</span>
                        <button class="appointment-date-picker-trigger" type="button" aria-label={`Fecha programada: ${formatDate(scheduledDate)}`} aria-expanded={datePickerOpen} onClick={() => setDatePickerOpen((open) => !open)}>
                          <span>{formatDate(scheduledDate)}</span><CalendarDays size={17} aria-hidden="true" />
                        </button>
                        {datePickerOpen && (
                          <div class="appointment-date-picker-popover" onClick={(event) => event.stopPropagation()}>
                            <MobileMonthCalendar selectedDate={scheduledDate} displayedMonth={calendarMonth} appointments={[]} onNavigateMonth={setCalendarMonth} onSelectDate={(value) => { setScheduledDate(value); setCalendarMonth(value); setDatePickerOpen(false); }} />
                          </div>
                        )}
                      </label>
                      <label class="appointment-form-control">
                        <span>Hora programada</span>
                        <input type="time" aria-label="Hora programada" required value={scheduledTime} onInput={(event) => setScheduledTime(event.currentTarget.value)} />
                      </label>
                      <button class="appointment-form-cancel" type="button" disabled={!scheduleIsFuture} onClick={() => saveRecord(NOTIFICATION_STATUS.SCHEDULED)}>Confirmar programación</button>
                      {!scheduleIsFuture && <p class="notifications-form-error" role="status">Elige una fecha y hora futuras para programar.</p>}
                    </div>
                  )}
                  {formError && <p class="notifications-form-error" role="alert">{formError}</p>}
                  <div class="appointment-form-actions notifications-actions">
                    <button class="appointment-form-cancel" type="button" onClick={() => saveRecord(NOTIFICATION_STATUS.DRAFT)}>Guardar borrador</button>
                    <button class="availability-save-button" type="button" onClick={() => saveRecord(NOTIFICATION_STATUS.SIMULATED)}>Simular envío</button>
                  </div>
                </div>
                <aside class="notifications-preview-column">
                  <section class="notifications-preview" aria-label="Vista previa de notificación">
                    <span>Vista previa local</span>
                    <article><strong>Webby's Barbershop</strong><b>{title || 'Título de la notificación'}</b><p>{body || 'Aquí aparecerá el mensaje como referencia para el administrador.'}</p></article>
                    <small>{audienceLabel(audience)} · {recipientSnapshots.length} {recipientSnapshots.length === 1 ? 'destinatario' : 'destinatarios'}</small>
                  </section>
                  <section class="notifications-device-test" aria-label="Prueba de notificación en este dispositivo">
                    <h3>Probar en este dispositivo</h3>
                    <p>Solo muestra una notificación local en este teléfono o navegador; no se envía al público seleccionado.</p>
                    <span>Permiso: {permissionText}</span>
                    <button class="appointment-form-cancel" type="button" onClick={testLocalNotification}>Probar en este dispositivo</button>
                    {localTestMessage && <p role="status">{localTestMessage}</p>}
                  </section>
                </aside>
              </div>
            </form>
          )}
        </section>
      </AdminShell>
    </AdminGate>
  );
}
