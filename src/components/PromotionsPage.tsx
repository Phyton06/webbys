import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  PROMOTION_DISCOUNT_TYPE,
  PROMOTION_MANUAL_STATUS,
  PROMOTION_TARGET_KIND,
  type AgendaState,
  type ProductRecord,
  type PromotionDiscountType,
  type PromotionManualStatus,
  type PromotionRecord,
  type PromotionTarget,
  type ServiceRecord,
} from '../types/agenda';
import { createAgendaSeed } from '../data/agenda-demo';
import { getPromotionPrice, getPromotionStatus, type PromotionStatus, validatePromotion } from '../services/promotions';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { Dropdown } from './Dropdown';
import '../styles/promotions.css';

interface PromotionsPageProps {
  now?: Date;
}

const PROMOTION_FILTER = {
  ALL: 'all',
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  FINISHED: 'finished',
  DISABLED: 'disabled',
} as const;

type PromotionFilter = (typeof PROMOTION_FILTER)[keyof typeof PROMOTION_FILTER];

const discountTypeOptions = [
  { value: PROMOTION_DISCOUNT_TYPE.PERCENTAGE, label: 'Descuento porcentual' },
  { value: PROMOTION_DISCOUNT_TYPE.FIXED_PRICE, label: 'Precio promocional' },
];

const manualStatusOptions = [
  { value: PROMOTION_MANUAL_STATUS.DRAFT, label: 'Borrador' },
  { value: PROMOTION_MANUAL_STATUS.PUBLISHED, label: 'Publicar según fechas' },
  { value: PROMOTION_MANUAL_STATUS.DISABLED, label: 'Desactivada' },
];

const promotionStatusOptions = [
  { value: PROMOTION_FILTER.ALL, label: 'Todos' },
  { value: PROMOTION_FILTER.DRAFT, label: 'Borrador' },
  { value: PROMOTION_FILTER.SCHEDULED, label: 'Programada' },
  { value: PROMOTION_FILTER.ACTIVE, label: 'Activa' },
  { value: PROMOTION_FILTER.FINISHED, label: 'Finalizada' },
  { value: PROMOTION_FILTER.DISABLED, label: 'Desactivada' },
];

const promotionStatusLabels: Record<PromotionStatus, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  active: 'Activa',
  finished: 'Finalizada',
  disabled: 'Desactivada',
};

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateAfter(date: Date, days: number): string {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return dateKey(next);
}

function localImagePath(value: string): string | undefined {
  const path = value.trim();
  return path.startsWith('/') && !path.startsWith('//') ? path : undefined;
}

function loadInitialState(now: Date): AgendaState {
  try {
    return loadAgendaState(window.localStorage, now).state;
  } catch {
    return createAgendaSeed(now);
  }
}

function getPromotionTargets(
  keys: string[],
  products: ProductRecord[],
  services: ServiceRecord[],
): PromotionTarget[] {
  return keys.flatMap<PromotionTarget>((key) => {
    const separator = key.indexOf(':');
    const kind = key.slice(0, separator);
    const id = key.slice(separator + 1);
    if (kind === PROMOTION_TARGET_KIND.PRODUCT) {
      const product = products.find((entry) => entry.id === id);
      return product ? [{ kind: PROMOTION_TARGET_KIND.PRODUCT, id, name: product.name, price: product.salePrice }] : [];
    }
    const service = services.find((entry) => entry.id === id);
    return service ? [{ kind: PROMOTION_TARGET_KIND.SERVICE, id, name: service.name, price: service.price }] : [];
  });
}

function PromotionForm({
  promotion,
  products,
  services,
  now,
  onSave,
  onCancel,
}: {
  promotion?: PromotionRecord;
  products: ProductRecord[];
  services: ServiceRecord[];
  now: Date;
  onSave: (promotion: PromotionRecord) => boolean;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(promotion?.name ?? '');
  const [description, setDescription] = useState(promotion?.description ?? '');
  const [targetKeys, setTargetKeys] = useState<string[]>(promotion?.targets.map(({ kind, id }) => `${kind}:${id}`) ?? []);
  const [discountType, setDiscountType] = useState<PromotionDiscountType>(promotion?.discountType ?? PROMOTION_DISCOUNT_TYPE.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState(promotion ? String(promotion.discountValue) : '20');
  const [startsOn, setStartsOn] = useState(promotion?.startsOn ?? dateKey(now));
  const [endsOn, setEndsOn] = useState(promotion?.endsOn ?? dateAfter(now, 7));
  const [manualStatus, setManualStatus] = useState<PromotionManualStatus>(promotion?.manualStatus ?? PROMOTION_MANUAL_STATUS.DRAFT);
  const [imagePath, setImagePath] = useState(promotion?.imagePath ?? '');
  const [conditions, setConditions] = useState(promotion?.conditions ?? '');
  const [unitLimit, setUnitLimit] = useState(promotion?.unitLimit === undefined ? '' : String(promotion.unitLimit));
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

  const previousKeys = promotion?.targets.map(({ kind, id }) => `${kind}:${id}`).sort() ?? [];
  const currentKeys = [...targetKeys].sort();
  const targetsUnchanged = previousKeys.length === currentKeys.length
    && previousKeys.every((key, index) => key === currentKeys[index]);
  const selectedTargets = promotion && targetsUnchanged
    ? promotion.targets
    : getPromotionTargets(targetKeys, products, services);
  const originalPrice = selectedTargets.reduce((total, target) => total + target.price, 0);
  const parsedDiscount = Number(discountValue);
  const normalizedOriginalPrice = Math.round(originalPrice * 100) / 100;
  const canPreview = selectedTargets.length > 0 && Number.isFinite(parsedDiscount);
  const previewRecord: PromotionRecord = {
    id: promotion?.id ?? 'promotion-preview',
    name: name.trim() || 'Promoción',
    description: description.trim(),
    targets: selectedTargets,
    discountType,
    originalPrice: normalizedOriginalPrice,
    discountValue: parsedDiscount,
    startsOn,
    endsOn,
    manualStatus,
    ...(imagePath.trim() ? { imagePath: imagePath.trim() } : {}),
    ...(conditions.trim() ? { conditions: conditions.trim() } : {}),
    ...(unitLimit.trim() ? { unitLimit: Number(unitLimit) } : {}),
  };

  function toggleTarget(key: string) {
    setTargetKeys((current) => current.includes(key)
      ? current.filter((entry) => entry !== key)
      : [...current, key]);
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError('Escribe el nombre de la promoción.');
      return;
    }
    if (selectedTargets.length === 0) {
      setError('Selecciona al menos un producto o servicio.');
      return;
    }

    const targets = promotion && targetsUnchanged
      ? promotion.targets
      : selectedTargets;
    const snapshotTotal = Math.round(targets.reduce((total, target) => total + target.price, 0) * 100) / 100;
    const normalizedUnitLimit = unitLimit.trim() ? Number(unitLimit) : undefined;
    const next: PromotionRecord = {
      ...previewRecord,
      id: promotion?.id ?? `promotion-${crypto.randomUUID()}`,
      name: normalizedName,
      targets,
      originalPrice: promotion && targetsUnchanged ? promotion.originalPrice : snapshotTotal,
      ...(normalizedUnitLimit === undefined ? {} : { unitLimit: normalizedUnitLimit }),
    };
    const validation = validatePromotion(next);
    if (!validation.valid) {
      setError('Revisa las fechas, el descuento y los precios de la promoción.');
      return;
    }
    if (!onSave(next)) setError('No se pudo guardar la promoción. Revisa el almacenamiento e inténtalo de nuevo.');
  }

  return (
    <dialog
      class="appointment-modal promotion-modal"
      ref={dialogRef}
      aria-labelledby="promotion-form-title"
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
    >
      <form class="appointment-form promotion-form" onSubmit={submit}>
        <header class="appointment-form-heading">
          <div>
            <h2 id="promotion-form-title">{promotion ? 'Editar promoción' : 'Nueva promoción'}</h2>
            <p>Combina productos y servicios con un precio especial.</p>
          </div>
          <button class="appointment-form-close" type="button" aria-label="Cerrar formulario de promoción" onClick={onCancel}>Cerrar</button>
        </header>
        <label class="appointment-form-control">
          <span>Nombre de la promoción</span>
          <input autoFocus required value={name} onInput={(event) => setName(event.currentTarget.value)} />
        </label>
        <label class="appointment-form-control">
          <span>Descripción</span>
          <textarea value={description} onInput={(event) => setDescription(event.currentTarget.value)} />
        </label>
        <fieldset class="promotion-targets">
          <legend>Productos y servicios</legend>
          {services.map((service) => (
            <label key={`service:${service.id}`}>
              <input
                type="checkbox"
                aria-label={`Servicio: ${service.name}`}
                checked={targetKeys.includes(`service:${service.id}`)}
                disabled={service.active === false && !targetKeys.includes(`service:${service.id}`)}
                onChange={() => toggleTarget(`service:${service.id}`)}
              />
              <span>{service.name}</span>
              <strong>${service.price.toLocaleString('es')}</strong>
            </label>
          ))}
          {products.map((product) => (
            <label key={`product:${product.id}`}>
              <input
                type="checkbox"
                aria-label={`Producto: ${product.name}`}
                checked={targetKeys.includes(`product:${product.id}`)}
                disabled={!product.active && !targetKeys.includes(`product:${product.id}`)}
                onChange={() => toggleTarget(`product:${product.id}`)}
              />
              <span>{product.name}</span>
              <strong>${product.salePrice.toLocaleString('es')}</strong>
            </label>
          ))}
        </fieldset>
        <div class="promotion-form-grid">
          <label class="appointment-form-control">
            <span>Tipo de descuento</span>
            <Dropdown label="Tipo de descuento" value={discountType} options={discountTypeOptions} onChange={setDiscountType} />
          </label>
          <label class="appointment-form-control">
            <span>{discountType === PROMOTION_DISCOUNT_TYPE.PERCENTAGE ? 'Descuento (%)' : 'Precio promocional'}</span>
            <input
              type="number"
              min="0"
              max={discountType === PROMOTION_DISCOUNT_TYPE.PERCENTAGE ? 100 : normalizedOriginalPrice}
              step="0.01"
              required
              value={discountValue}
              onInput={(event) => setDiscountValue(event.currentTarget.value)}
            />
          </label>
          <label class="appointment-form-control">
            <span>Fecha de inicio</span>
            <input type="date" required value={startsOn} onInput={(event) => setStartsOn(event.currentTarget.value)} />
          </label>
          <label class="appointment-form-control">
            <span>Fecha de finalización</span>
            <input type="date" required value={endsOn} onInput={(event) => setEndsOn(event.currentTarget.value)} />
          </label>
          <label class="appointment-form-control">
            <span>Estado de publicación</span>
            <Dropdown label="Estado de publicación" value={manualStatus} options={manualStatusOptions} onChange={setManualStatus} />
          </label>
          <label class="appointment-form-control">
            <span>Límite de unidades (opcional)</span>
            <input type="number" min="1" step="1" value={unitLimit} onInput={(event) => setUnitLimit(event.currentTarget.value)} />
          </label>
        </div>
        <label class="appointment-form-control">
          <span>Condiciones (opcional)</span>
          <textarea value={conditions} onInput={(event) => setConditions(event.currentTarget.value)} />
        </label>
        <label class="appointment-form-control">
          <span>Imagen (ruta local, opcional)</span>
          <input type="text" placeholder="/promotions/oferta.png" value={imagePath} onInput={(event) => setImagePath(event.currentTarget.value)} />
        </label>
        {canPreview && (
          <section class="promotion-form-preview" aria-label="Vista previa de promoción">
            <span>Vista previa</span>
            <strong>{name.trim() || 'Nombre de la promoción'}</strong>
            <span>{selectedTargets.map(({ name: targetName }) => targetName).join(' + ')}</span>
            <p>Precio original: ${normalizedOriginalPrice.toLocaleString('es')}</p>
            <p>Precio promocional: ${getPromotionPrice(previewRecord).toLocaleString('es')}</p>
          </section>
        )}
        {error && <p class="availability-error" role="alert">{error}</p>}
        <div class="appointment-form-actions promotion-form-actions">
          <button class="availability-save-button" type="submit">Guardar promoción</button>
          <button class="appointment-form-cancel" type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </dialog>
  );
}

export function PromotionsPage({ now = new Date() }: PromotionsPageProps) {
  const [state, setState] = useState(() => loadInitialState(now));
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PromotionFilter>(PROMOTION_FILTER.ALL);
  const [selectedId, setSelectedId] = useState<string>();
  const [editingPromotion, setEditingPromotion] = useState<PromotionRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const promotions = state.promotions ?? [];
  const today = dateKey(now);
  const selectedPromotion = promotions.find(({ id }) => id === selectedId);
  const visiblePromotions = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('es');
    return promotions
      .filter((promotion) => statusFilter === PROMOTION_FILTER.ALL
        || getPromotionStatus(promotion, today) === statusFilter)
      .filter(({ name, description, targets }) => !search
        || name.toLocaleLowerCase('es').includes(search)
        || description.toLocaleLowerCase('es').includes(search)
        || targets.some(({ name: targetName }) => targetName.toLocaleLowerCase('es').includes(search)))
      .sort((first, second) => first.startsOn.localeCompare(second.startsOn)
        || first.name.localeCompare(second.name, 'es', { sensitivity: 'base' }));
  }, [promotions, query, statusFilter, today]);

  function persist(nextPromotions: PromotionRecord[]): boolean {
    try {
      const nextState: AgendaState = { ...state, promotions: nextPromotions };
      saveAgendaState(window.localStorage, nextState);
      setState(nextState);
      setError('');
      return true;
    } catch {
      setError('No se pudieron guardar los cambios. Revisa el almacenamiento e inténtalo de nuevo.');
      return false;
    }
  }

  function savePromotion(promotion: PromotionRecord): boolean {
    const exists = promotions.some(({ id }) => id === promotion.id);
    const next = exists
      ? promotions.map((current) => current.id === promotion.id ? promotion : current)
      : [...promotions, promotion];
    if (!persist(next)) return false;
    setFormOpen(false);
    setEditingPromotion(undefined);
    setSelectedId(promotion.id);
    return true;
  }

  function setManualStatus(promotion: PromotionRecord, manualStatus: PromotionManualStatus) {
    persist(promotions.map((current) => current.id === promotion.id ? { ...current, manualStatus } : current));
  }

  function closeForm() {
    setFormOpen(false);
    setEditingPromotion(undefined);
  }

  const statusLabel = (promotion: PromotionRecord) => promotionStatusLabels[getPromotionStatus(promotion, today)];

  return (
    <AdminGate>
      <AdminShell activeSection="Promociones">
        <section class="promotions-page" aria-labelledby="promotions-title">
          <header class="agenda-heading promotions-heading">
            <div>
              <h1 id="promotions-title">Promociones</h1>
              <p>Administra descuentos y precios especiales para productos y servicios.</p>
            </div>
            <button class="availability-save-button" type="button" onClick={() => { setEditingPromotion(undefined); setFormOpen(true); }}>Nueva promoción</button>
          </header>
          {error && <p class="availability-error" role="alert">{error}</p>}

          {selectedPromotion ? (
            <section class="promotion-detail" aria-labelledby="promotion-detail-title">
              <button class="appointment-form-cancel" type="button" onClick={() => setSelectedId(undefined)}>Volver a promociones</button>
              <header>
                <div>
                  <h2 id="promotion-detail-title">{selectedPromotion.name}</h2>
                  <span class={`promotion-status status-${getPromotionStatus(selectedPromotion, today)}`}>{statusLabel(selectedPromotion)}</span>
                </div>
                <div class="promotion-actions">
                  <button class="appointment-form-cancel" type="button" onClick={() => { setEditingPromotion(selectedPromotion); setFormOpen(true); }}>Editar</button>
                  {selectedPromotion.manualStatus === PROMOTION_MANUAL_STATUS.DISABLED
                    ? <button class="appointment-form-cancel" type="button" aria-label={`Publicar promoción ${selectedPromotion.name}`} onClick={() => setManualStatus(selectedPromotion, PROMOTION_MANUAL_STATUS.PUBLISHED)}>Publicar</button>
                    : selectedPromotion.manualStatus === PROMOTION_MANUAL_STATUS.PUBLISHED
                      ? <button class="appointment-form-cancel" type="button" aria-label={`Desactivar promoción ${selectedPromotion.name}`} onClick={() => setManualStatus(selectedPromotion, PROMOTION_MANUAL_STATUS.DISABLED)}>Desactivar</button>
                      : <button class="appointment-form-cancel" type="button" aria-label={`Publicar promoción ${selectedPromotion.name}`} onClick={() => setManualStatus(selectedPromotion, PROMOTION_MANUAL_STATUS.PUBLISHED)}>Publicar</button>}
                </div>
              </header>
              <p>{selectedPromotion.description || 'Sin descripción.'}</p>
              <dl>
                <div><dt>Productos y servicios</dt><dd>{selectedPromotion.targets.map(({ name }) => name).join(' · ')}</dd></div>
                <div><dt>Precio original</dt><dd>${selectedPromotion.originalPrice.toLocaleString('es')}</dd></div>
                <div><dt>Precio promocional</dt><dd>${getPromotionPrice(selectedPromotion).toLocaleString('es')}</dd></div>
                <div><dt>Vigencia</dt><dd>{selectedPromotion.startsOn} – {selectedPromotion.endsOn}</dd></div>
                {selectedPromotion.unitLimit !== undefined && <div><dt>Límite informativo</dt><dd>{selectedPromotion.unitLimit} unidades</dd></div>}
              </dl>
              <article class="promotion-preview" aria-label="Vista previa para cliente">
                {localImagePath(selectedPromotion.imagePath ?? '') && <img src={localImagePath(selectedPromotion.imagePath ?? '')} alt="" />}
                <span class="promotion-preview-label">Promoción</span>
                <h3>{selectedPromotion.name}</h3>
                <p>{selectedPromotion.description || selectedPromotion.targets.map(({ name }) => name).join(' + ')}</p>
                <div><del>${selectedPromotion.originalPrice.toLocaleString('es')}</del><strong>${getPromotionPrice(selectedPromotion).toLocaleString('es')}</strong></div>
                {selectedPromotion.conditions && <small>{selectedPromotion.conditions}</small>}
              </article>
            </section>
          ) : (
            <>
              <div class="promotions-toolbar">
                <label>
                  <span>Buscar</span>
                  <input type="search" aria-label="Buscar promociones" placeholder="Nombre, descripción o producto" value={query} onInput={(event) => setQuery(event.currentTarget.value)} />
                </label>
                <div class="promotions-filter-control">
                  <span>Estado</span>
                  <Dropdown label="Estado de promociones" value={statusFilter} options={promotionStatusOptions} onChange={setStatusFilter} />
                </div>
              </div>
              {visiblePromotions.length > 0 ? (
                <ul class="promotion-list" aria-label="Lista de promociones">
                  {visiblePromotions.map((promotion) => (
                    <li key={promotion.id}>
                      <article class="promotion-row" aria-label={`Promoción ${promotion.name}`}>
                        <button class="promotion-row-open" type="button" onClick={() => setSelectedId(promotion.id)}>
                          <strong>{promotion.name}</strong>
                          <span>{promotion.targets.map(({ name }) => name).join(' + ')}</span>
                        </button>
                        <span class={`promotion-status status-${getPromotionStatus(promotion, today)}`}>{statusLabel(promotion)}</span>
                        <span>{promotion.startsOn} – {promotion.endsOn}</span>
                        <strong>${getPromotionPrice(promotion).toLocaleString('es')}</strong>
                        <div class="promotion-actions">
                          <button class="appointment-form-cancel" type="button" aria-label={`Ver promoción ${promotion.name}`} onClick={() => setSelectedId(promotion.id)}>Ver</button>
                          <button class="appointment-form-cancel" type="button" aria-label={`Editar promoción ${promotion.name}`} onClick={() => { setEditingPromotion(promotion); setFormOpen(true); }}>Editar</button>
                          {promotion.manualStatus === PROMOTION_MANUAL_STATUS.DISABLED
                            ? <button class="appointment-form-cancel" type="button" aria-label={`Publicar promoción ${promotion.name}`} onClick={() => setManualStatus(promotion, PROMOTION_MANUAL_STATUS.PUBLISHED)}>Publicar</button>
                            : promotion.manualStatus === PROMOTION_MANUAL_STATUS.PUBLISHED
                              ? <button class="appointment-form-cancel" type="button" aria-label={`Desactivar promoción ${promotion.name}`} onClick={() => setManualStatus(promotion, PROMOTION_MANUAL_STATUS.DISABLED)}>Desactivar</button>
                              : <button class="appointment-form-cancel" type="button" aria-label={`Publicar promoción ${promotion.name}`} onClick={() => setManualStatus(promotion, PROMOTION_MANUAL_STATUS.PUBLISHED)}>Publicar</button>}
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="agenda-empty">No hay promociones que coincidan con estos filtros.</p>
              )}
            </>
          )}
          {formOpen && (
            <PromotionForm
              promotion={editingPromotion}
              products={state.products ?? []}
              services={state.services}
              now={now}
              onSave={savePromotion}
              onCancel={closeForm}
            />
          )}
        </section>
      </AdminShell>
    </AdminGate>
  );
}
