import { useMemo, useState } from 'preact/hooks';
import type { AgendaState, PromotionRecord } from '../types/agenda';
import type { SaleItem, SalePaymentMethod, SaleRecord } from '../types/domain';
import type { CurrencyCode } from '../types/business-settings';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState } from '../services/agenda-store';
import { calculateCashierTotals, commitCashierSale, getEligibleAppointments } from '../services/cashier';
import { getPromotionStatus } from '../services/promotions';
import { formatCurrency, getCurrentBusinessCurrency } from '../services/currency';
import { AdminGate } from './AdminGate';
import { AssistantShell } from './AssistantShell';
import '../styles/cashier.css';

interface CashierPageProps {
  now?: Date;
}

type AppointmentFilter = 'all' | 'pending' | 'completed' | 'paid';

function newCheckoutKey(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadState(now: Date): { state: AgendaState; error: string } {
  const seed = createAgendaSeed(now);
  try {
    const loaded = loadAgendaState(window.localStorage, now);
    return {
      state: loaded.state,
      error: loaded.status === 'invalid' ? 'No se pudieron leer los datos compartidos. Revisa el almacenamiento antes de cobrar.' : '',
    };
  } catch {
    return { state: seed, error: 'No se pudieron leer los datos compartidos. Revisa el almacenamiento antes de cobrar.' };
  }
}

function getItemKey(item: SaleItem): string {
  return `${item.kind ?? 'unknown'}:${item.catalogItemId ?? item.name}`;
}

function appointmentServiceItems(state: AgendaState, appointmentId?: string): SaleItem[] {
  const appointment = state.appointments.find(({ id }) => id === appointmentId);
  if (!appointment) return [];
  return appointment.serviceIds.flatMap((id) => {
    const service = state.services.find((entry) => entry.id === id);
    return service ? [{ kind: 'service' as const, catalogItemId: service.id, name: service.name, quantity: 1, unitPrice: service.price }] : [];
  });
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function appointmentDateKey(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateKey(date) : '';
}

function Receipt({ sale, currency, onClose }: { sale: SaleRecord; currency: CurrencyCode; onClose: () => void }) {
  const itemsText = sale.items.map(({ name, quantity }) => `${quantity} × ${name}`).join(', ');

  async function shareReceipt() {
    if (typeof navigator.share !== 'function') return;
    try {
      await navigator.share({ title: `Comprobante ${sale.id}`, text: `${itemsText}. Total: ${formatCurrency(sale.netTotal, currency)}` });
    } catch {
      // A dismissed or unavailable share sheet does not change the saved sale.
    }
  }

  return (
    <section class="cashier-receipt" aria-labelledby="cashier-receipt-title">
      <div class="cashier-receipt-actions">
        <button class="cashier-secondary-button" type="button" onClick={onClose}>Volver a Cobrar</button>
        <button class="cashier-secondary-button" type="button" onClick={() => window.print()}>Imprimir</button>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && <button class="cashier-secondary-button" type="button" onClick={shareReceipt}>Compartir</button>}
      </div>
      <article class="cashier-ticket">
        <p class="cashier-ticket-brand">Webby's Barbershop</p>
        <h1 id="cashier-receipt-title">Comprobante de venta</h1>
        <dl>
          <div><dt>Folio</dt><dd>{sale.id}</dd></div>
          <div><dt>Fecha</dt><dd>{formatDateTime(sale.occurredAt)}</dd></div>
          {sale.clientName && <div><dt>Cliente</dt><dd>{sale.clientName}</dd></div>}
          {sale.barberName && <div><dt>Barbero</dt><dd>{sale.barberName}</dd></div>}
          <div><dt>Atendió</dt><dd>{sale.employeeName ?? 'Asistente'}</dd></div>
        </dl>
        <ul class="cashier-ticket-items">{sale.items.map((item, index) => (
          <li key={`${getItemKey(item)}-${index}`}>
            <span>{item.quantity} × {item.name} · {formatCurrency(item.unitPrice, currency)} c/u{item.barberName ? ` · ${item.barberName}` : ''}</span>
            <span>{formatCurrency(item.quantity * item.unitPrice, currency)}</span>
          </li>
        ))}</ul>
        <dl class="cashier-ticket-totals">
          <div><dt>Subtotal</dt><dd>{formatCurrency(sale.grossTotal, currency)}</dd></div>
          <div><dt>Descuento</dt><dd>−{formatCurrency(sale.discountTotal, currency)}</dd></div>
          <div class="cashier-ticket-total"><dt>Total</dt><dd>{formatCurrency(sale.netTotal, currency)}</dd></div>
          {sale.promotionName && <div><dt>Promoción</dt><dd>{sale.promotionName}</dd></div>}
          <div><dt>Método de pago</dt><dd>{sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'card' ? 'Tarjeta (simulada)' : 'Transferencia (simulada)'}</dd></div>
          {sale.cashReceived !== undefined && <div><dt>Recibido · Cambio</dt><dd>{formatCurrency(sale.cashReceived, currency)} · {formatCurrency(sale.changeDue ?? 0, currency)}</dd></div>}
        </dl>
        <p class="cashier-ticket-note">Venta registrada en modo de demostración local.</p>
      </article>
    </section>
  );
}

export function CashierPage({ now = new Date() }: CashierPageProps) {
  const [initial] = useState(() => loadState(now));
  const [state, setState] = useState(initial.state);
  const [requestedAppointmentId] = useState(() => {
    if (typeof window === 'undefined') return undefined;
    const id = new URLSearchParams(window.location.search).get('appointmentId') ?? undefined;
    return getEligibleAppointments(initial.state, now).some(({ id: eligibleId }) => eligibleId === id) ? id : undefined;
  });
  const [storageError] = useState(initial.error);
  const [search, setSearch] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [barberFilter, setBarberFilter] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(requestedAppointmentId);
  const [quickSale, setQuickSale] = useState(() => (
    !requestedAppointmentId && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('quick') === '1'
  ));
  const [quickClientId, setQuickClientId] = useState('');
  const [items, setItems] = useState<SaleItem[]>(() => appointmentServiceItems(initial.state, requestedAppointmentId));
  const [additionalServiceId, setAdditionalServiceId] = useState('');
  const [additionalBarberId, setAdditionalBarberId] = useState('');
  const [additionalServicePerformed, setAdditionalServicePerformed] = useState(true);
  const [promotionId, setPromotionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(newCheckoutKey);
  const [isSaving, setIsSaving] = useState(false);
  const [receipt, setReceipt] = useState<SaleRecord>();
  const [error, setError] = useState('');
  const currency = getCurrentBusinessCurrency();
  const todayKey = dateKey(now);

  const visibleAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');
    const appointments = appointmentFilter === 'paid'
      ? state.appointments.filter(({ paymentStatus }) => paymentStatus === 'paid')
      : getEligibleAppointments(state, now);
    return appointments
      .filter((appointment) => appointmentFilter === 'all' || appointmentFilter === 'paid'
        || (appointmentFilter === 'pending' ? appointment.status !== 'completed' : appointment.status === 'completed'))
      .filter((appointment) => !dateFilter || appointmentDateKey(appointment.startsAt) === dateFilter)
      .filter((appointment) => !barberFilter || appointment.barberId === barberFilter)
      .filter((appointment) => !normalizedSearch
        || appointment.clientName.toLocaleLowerCase('es').includes(normalizedSearch)
        || appointment.barberName.toLocaleLowerCase('es').includes(normalizedSearch))
      .sort((first, second) => Number(appointmentDateKey(second.startsAt) === todayKey) - Number(appointmentDateKey(first.startsAt) === todayKey)
        || new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());
  }, [appointmentFilter, barberFilter, dateFilter, now, search, state]);

  const selectedAppointment = state.appointments.find(({ id }) => id === selectedAppointmentId);
  const categories = [...new Set((state.products ?? []).map(({ category }) => category))].sort((a, b) => a.localeCompare(b, 'es'));
  const visibleProducts = (state.products ?? []).filter((product) => product.active && product.stock > 0)
    .filter((product) => categoryFilter === 'all' || product.category === categoryFilter)
    .filter((product) => product.name.toLocaleLowerCase('es').includes(itemSearch.trim().toLocaleLowerCase('es')));
  const baseServiceIds = new Set(selectedAppointment?.serviceIds ?? []);
  const activePromotions = (state.promotions ?? []).filter((promotion) => (
    getPromotionStatus(promotion, todayKey) === 'active'
  ));
  const applicablePromotions = activePromotions.filter((promotion) => calculateCashierTotals(
    items, promotion, todayKey,
  ).discountTotal > 0);
  const chosenPromotion = activePromotions.find(({ id }) => id === promotionId);
  const totals = calculateCashierTotals(items, chosenPromotion, todayKey);
  const amountReceived = Number(cashReceived);
  const changeDue = paymentMethod === 'cash' && Number.isFinite(amountReceived) ? Math.max(0, amountReceived - totals.netTotal) : 0;
  const selectedClient = state.clients.find(({ id }) => id === quickClientId);

  function resetCheckout() {
    setSelectedAppointmentId(undefined);
    setQuickSale(false);
    setQuickClientId('');
    setItems([]);
    setAdditionalServiceId('');
    setAdditionalBarberId('');
    setAdditionalServicePerformed(true);
    setPromotionId('');
    setPaymentMethod('cash');
    setCashReceived('');
    setError('');
    setReceipt(undefined);
    setIdempotencyKey(newCheckoutKey());
  }

  function startAppointmentCheckout(appointmentId: string) {
    const appointment = state.appointments.find(({ id }) => id === appointmentId);
    if (!appointment) return;
    setSelectedAppointmentId(appointment.id);
    setQuickSale(false);
    setItems(appointmentServiceItems(state, appointment.id));
    setAdditionalServiceId('');
    setAdditionalBarberId(appointment.barberId);
    setAdditionalServicePerformed(true);
    setPromotionId('');
    setPaymentMethod('cash');
    setCashReceived('');
    setError('');
    setReceipt(undefined);
    setIdempotencyKey(newCheckoutKey());
  }

  function startQuickSale() {
    setSelectedAppointmentId(undefined);
    setQuickSale(true);
    setQuickClientId('');
    setItems([]);
    setAdditionalServiceId('');
    setAdditionalBarberId('');
    setAdditionalServicePerformed(true);
    setPromotionId('');
    setPaymentMethod('cash');
    setCashReceived('');
    setError('');
    setReceipt(undefined);
    setIdempotencyKey(newCheckoutKey());
  }

  function addProduct(productId: string) {
    const product = state.products?.find(({ id }) => id === productId);
    if (!product || !product.active || product.stock < 1) return;
    setItems((current) => {
      const existing = current.find((item) => item.kind === 'product' && item.catalogItemId === product.id);
      if (existing) return current.map((item) => item === existing
        ? { ...item, quantity: Math.min(product.stock, item.quantity + 1) }
        : item);
      return [...current, { kind: 'product', catalogItemId: product.id, name: product.name, quantity: 1, unitPrice: product.salePrice }];
    });
    setPromotionId('');
    setError('');
  }

  function updateQuantity(item: SaleItem, delta: number) {
    if (item.kind === 'service' && baseServiceIds.has(item.catalogItemId ?? '')) return;
    setItems((current) => current.flatMap((entry) => {
      if (getItemKey(entry) !== getItemKey(item)) return [entry];
      const quantity = entry.quantity + delta;
      return quantity > 0 ? [{ ...entry, quantity }] : [];
    }));
    setPromotionId('');
  }

  function removeItem(item: SaleItem) {
    if (item.kind === 'service' && baseServiceIds.has(item.catalogItemId ?? '')) return;
    setItems((current) => current.filter((entry) => getItemKey(entry) !== getItemKey(item)));
    setPromotionId('');
  }

  function confirmSale(event: SubmitEvent) {
    event.preventDefault();
    if (isSaving || receipt || storageError) return;
    setIsSaving(true);
    setError('');
    const result = commitCashierSale(window.localStorage, {
      idempotencyKey,
      ...(selectedAppointmentId ? { appointmentId: selectedAppointmentId } : {}),
      items,
      ...(promotionId ? { promotionId } : {}),
      paymentMethod,
      ...(paymentMethod === 'cash' ? { cashReceived: amountReceived } : {}),
      ...(selectedClient ? { clientId: selectedClient.id, clientName: selectedClient.name } : quickSale ? { clientName: 'Cliente ocasional' } : {}),
    }, now);
    setIsSaving(false);
    if (!result.ok) {
      const messages: Record<string, string> = {
        'invalid-items': 'Revisa los productos, servicios y cantidades seleccionados.',
        'invalid-payment': 'Selecciona un método de pago válido.',
        'insufficient-payment': 'El monto recibido debe cubrir el total a pagar.',
        'insufficient-inventory': 'No hay existencias suficientes para completar la venta.',
        'invalid-appointment': 'No se encontró la cita seleccionada. Actualiza la pantalla e inténtalo de nuevo.',
        'appointment-cancelled': 'No se puede cobrar una cita cancelada.',
        'appointment-already-paid': 'Esta cita ya tiene un cobro registrado.',
        'missing-appointment-services': 'Incluye los servicios reservados antes de confirmar el cobro.',
        'quick-sale-products-only': 'La venta rápida solo admite productos; agenda los servicios por separado.',
        'service-unavailable': 'Ese barbero no tiene disponibilidad para realizar el servicio adicional en esta cita.',
        'invalid-promotion': 'La promoción ya no está vigente o no aplica a los conceptos seleccionados.',
        'storage-unavailable': 'No se pudo guardar la venta. No se marcaron cambios; revisa el almacenamiento e inténtalo de nuevo.',
      };
      setError(messages[result.reason] ?? 'No se pudo completar el cobro.');
      return;
    }
    setReceipt(result.sale);
    setState(loadAgendaState(window.localStorage, now).state);
  }

  const appointmentFilters: Array<{ value: AppointmentFilter; label: string }> = [
    { value: 'pending', label: 'Pendientes de cobro' },
    { value: 'completed', label: 'Completadas sin cobro' },
    { value: 'all', label: 'Todas elegibles' },
    { value: 'paid', label: 'Pagadas · consulta' },
  ];

  return (
    <AdminGate role="assistant">
      <AssistantShell activeSection="Cobrar">
        {receipt ? <Receipt sale={receipt} currency={currency} onClose={resetCheckout} /> : (
          <main class="cashier-page" aria-labelledby="cashier-title">
            <header class="cashier-heading">
              <div>
                <h1 id="cashier-title">Cobrar</h1>
                <p>Primero, selecciona una cita pendiente de pago.</p>
              </div>
              {!selectedAppointment && <button class="cashier-secondary-button" type="button" onClick={startQuickSale}>Venta rápida</button>}
            </header>
            {storageError && <p class="cashier-error" role="alert">{storageError}</p>}
            {error && <p class="cashier-error" role="alert">{error}</p>}
            {!selectedAppointment && !quickSale ? (
              <>
                <section class="cashier-filters" aria-label="Buscar citas pendientes de cobro">
                  <label><span>Buscar cliente o barbero</span><input type="search" value={search} onInput={(event) => setSearch(event.currentTarget.value)} /></label>
                  <label><span>Fecha</span><input type="date" value={dateFilter} onInput={(event) => setDateFilter(event.currentTarget.value)} /></label>
                  <label><span>Barbero</span><select value={barberFilter} onChange={(event) => setBarberFilter(event.currentTarget.value)}><option value="">Todos</option>{state.barbers.map((barber) => <option value={barber.id} key={barber.id}>{barber.name}</option>)}</select></label>
                </section>
                <div class="cashier-filter-tabs" role="group" aria-label="Filtrar citas por estado de atención">
                  {appointmentFilters.map(({ value, label }) => <button class={appointmentFilter === value ? 'is-active' : ''} type="button" aria-pressed={appointmentFilter === value} onClick={() => setAppointmentFilter(value)} key={value}>{label}</button>)}
                </div>
                <section class="cashier-appointment-list" aria-label="Citas pendientes de pago">
                  {visibleAppointments.length ? visibleAppointments.map((appointment) => {
                    const services = appointment.serviceIds.flatMap((id) => state.services.filter((service) => service.id === id));
                    const estimated = services.reduce((total, service) => total + service.price, 0);
                    const alreadyPaid = appointment.paymentStatus === 'paid';
                    const paidSale = alreadyPaid ? state.sales?.find(({ appointmentId }) => appointmentId === appointment.id) : undefined;
                    return <article class="cashier-appointment-row" key={appointment.id}>
                      <time dateTime={appointment.startsAt}>{formatTime(appointment.startsAt)}</time>
                      <div class="cashier-appointment-info"><strong>{appointment.clientName}</strong><span>{appointment.barberName} · {services.map(({ name }) => name).join(', ')}</span></div>
                      <strong class="cashier-appointment-total">{formatCurrency(estimated, currency)}</strong>
                      <span class={`cashier-attention-status status-${appointment.status}`}>{alreadyPaid ? 'Pagada · solo consulta' : appointment.status === 'completed' ? 'Completada · sin cobro' : appointment.status === 'confirmed' ? 'Confirmada · sin cobro' : 'Pendiente · sin cobro'}</span>
                      {alreadyPaid
                        ? paidSale
                          ? <button class="cashier-secondary-button" type="button" onClick={() => setReceipt(paidSale)}>Ver comprobante</button>
                          : <span class="cashier-read-only-label">Solo consulta</span>
                        : <button class="cashier-primary-button" type="button" disabled={Boolean(storageError)} onClick={() => startAppointmentCheckout(appointment.id)}>Cobrar {appointment.clientName}</button>}
                    </article>;
                  }) : <p class="cashier-empty-state">No hay citas elegibles con estos filtros.</p>}
                </section>
              </>
            ) : (
              <div class="cashier-checkout-layout">
                <section class="cashier-checkout-main">
                  <button class="cashier-back-link" type="button" onClick={resetCheckout}>Volver a las citas</button>
                  <header class="cashier-customer-heading">
                    <div><h2>{selectedAppointment?.clientName ?? selectedClient?.name ?? 'Cliente ocasional'}</h2><p>{selectedAppointment ? `${formatDateTime(selectedAppointment.startsAt)} · ${selectedAppointment.barberName}` : 'Venta de productos sin cita'}</p></div>
                    {selectedAppointment && <span class={`cashier-attention-status status-${selectedAppointment.status}`}>{selectedAppointment.status === 'completed' ? 'Atención completada' : selectedAppointment.status === 'confirmed' ? 'Atención confirmada' : 'Atención pendiente'}</span>}
                  </header>
                  {quickSale && <label class="cashier-client-select"><span>Cliente</span><select value={quickClientId} onChange={(event) => setQuickClientId(event.currentTarget.value)}><option value="">Cliente ocasional</option>{state.clients.filter(({ active }) => active !== false).map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label>}
                  {selectedAppointment && <p class="cashier-appointment-reference">Cita {selectedAppointment.id} · estado de pago: pendiente</p>}
                  <section class="cashier-cart" aria-labelledby="cashier-cart-title">
                    <h3 id="cashier-cart-title">Resumen del cobro</h3>
                    {items.length ? <ul>{items.map((item) => {
                      const locked = item.kind === 'service' && baseServiceIds.has(item.catalogItemId ?? '');
                      return <li key={getItemKey(item)}>
                        <div><strong>{item.name}</strong><span>{item.kind === 'service' ? 'Servicio' : 'Producto'} · {formatCurrency(item.unitPrice, currency)} c/u</span></div>
                        <div class="cashier-quantity-controls"><button type="button" aria-label={`Reducir ${item.name}`} disabled={locked || item.quantity <= 1} onClick={() => updateQuantity(item, -1)}>−</button><span>{item.quantity}</span><button type="button" aria-label={`Aumentar ${item.name}`} disabled={locked || item.kind === 'service'} onClick={() => updateQuantity(item, 1)}>+</button></div>
                        <strong>{formatCurrency(item.quantity * item.unitPrice, currency)}</strong>
                        <button class="cashier-remove-item" type="button" aria-label={`Eliminar ${item.name}`} disabled={locked} onClick={() => removeItem(item)}>Eliminar</button>
                      </li>;
                    })}</ul> : <p>Agrega productos para comenzar la venta.</p>}
                  </section>
                  <section class="cashier-catalog" aria-labelledby="cashier-catalog-title">
                    <div class="cashier-section-heading"><h3 id="cashier-catalog-title">Agregar productos</h3><span>Disponibles para venta</span></div>
                    <div class="cashier-catalog-filters">
                      <label><span>Buscar producto</span><input type="search" value={itemSearch} onInput={(event) => setItemSearch(event.currentTarget.value)} /></label>
                      <label><span>Categoría</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.currentTarget.value)}><option value="all">Todas</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
                    </div>
                    {visibleProducts.length ? <ul class="cashier-product-list">{visibleProducts.map((product) => <li key={product.id}>
                      <div><strong>{product.name}</strong><span>{product.category} · {product.stock} disponibles</span></div>
                      <strong>{formatCurrency(product.salePrice, currency)}</strong>
                      <button class="cashier-secondary-button" type="button" aria-label={`Agregar producto ${product.name}`} onClick={() => addProduct(product.id)}>Agregar</button>
                    </li>)}</ul> : <p class="cashier-empty-state">No hay productos disponibles con estos filtros.</p>}
                  </section>
                  {selectedAppointment && <details class="cashier-add-service">
                    <summary>Agregar servicio adicional</summary>
                    <p>Si aún no se realiza, se valida el horario del barbero antes de cobrarlo.</p>
                    <label><span>Servicio</span><select aria-label="Servicio adicional" value={additionalServiceId} onChange={(event) => setAdditionalServiceId(event.currentTarget.value)}><option value="">Selecciona un servicio</option>{state.services.filter(({ active }) => active !== false).map((service) => <option value={service.id} key={service.id}>{service.name} · {formatCurrency(service.price, currency)}</option>)}</select></label>
                    <label><span>Barbero</span><select aria-label="Barbero del servicio adicional" value={additionalBarberId || selectedAppointment.barberId} onChange={(event) => setAdditionalBarberId(event.currentTarget.value)}>{state.barbers.map((barber) => <option value={barber.id} key={barber.id}>{barber.name}</option>)}</select></label>
                    <label class="cashier-service-performed"><input type="checkbox" checked={additionalServicePerformed} onChange={(event) => setAdditionalServicePerformed(event.currentTarget.checked)} /><span>El servicio ya fue realizado</span></label>
                    <button type="button" class="cashier-secondary-button" disabled={!additionalServiceId} onClick={() => {
                      const service = state.services.find(({ id }) => id === additionalServiceId);
                      const barber = state.barbers.find(({ id }) => id === (additionalBarberId || selectedAppointment.barberId));
                      if (!service || !barber || items.some((item) => item.kind === 'service' && item.catalogItemId === service.id)) return;
                      setItems((current) => [...current, {
                        kind: 'service', catalogItemId: service.id, name: service.name, quantity: 1,
                        unitPrice: service.price, barberId: barber.id, barberName: barber.name,
                        servicePerformed: additionalServicePerformed,
                      }]);
                      setPromotionId('');
                    }}>Agregar servicio</button>
                  </details>}
                </section>
                <aside class="cashier-payment-panel" aria-label="Total y pago">
                  <h2>Total del cobro</h2>
                  <label class="cashier-promotion-select"><span>Promoción aplicable</span><select value={promotionId} onChange={(event) => setPromotionId(event.currentTarget.value)}><option value="">Sin promoción</option>{applicablePromotions.map((promotion: PromotionRecord) => <option value={promotion.id} key={promotion.id}>{promotion.name}</option>)}</select></label>
                  <dl class="cashier-totals"><div><dt>Subtotal</dt><dd>{formatCurrency(totals.grossTotal, currency)}</dd></div><div><dt>Descuento</dt><dd>−{formatCurrency(totals.discountTotal, currency)}</dd></div><div class="cashier-grand-total"><dt>Total</dt><dd>{formatCurrency(totals.netTotal, currency)}</dd></div></dl>
                  <fieldset class="cashier-payment-method"><legend>Método de pago</legend>{([{ value: 'cash', label: 'Efectivo' }, { value: 'card', label: 'Tarjeta' }, { value: 'transfer', label: 'Transferencia' }] as const).map(({ value, label }) => <label key={value}><input type="radio" name="payment-method" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} /><span>{label}{value !== 'cash' ? ' · simulado' : ''}</span></label>)}</fieldset>
                  {paymentMethod === 'cash' && <div class="cashier-cash-fields"><label><span>Monto recibido</span><input aria-label="Monto recibido" type="number" min={totals.netTotal} step="0.01" value={cashReceived} onInput={(event) => setCashReceived(event.currentTarget.value)} /></label><p>Cambio: <strong>{formatCurrency(changeDue, currency)}</strong></p></div>}
                  <form onSubmit={confirmSale}><button class="cashier-primary-button cashier-confirm-button" type="submit" disabled={isSaving || Boolean(storageError) || items.length === 0}>{isSaving ? 'Registrando…' : 'Confirmar cobro'}</button></form>
                  <p class="cashier-demo-note">Pago simulado · los cambios se guardan localmente en este dispositivo.</p>
                </aside>
              </div>
            )}
          </main>
        )}
      </AssistantShell>
    </AdminGate>
  );
}
