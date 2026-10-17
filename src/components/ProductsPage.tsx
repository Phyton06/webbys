import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { AgendaState, ProductRecord } from '../types/agenda';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { Dropdown } from './Dropdown';
import '../styles/products.css';

interface ProductsPageProps {
  now?: Date;
}

const PRODUCT_STATUS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

function loadInitialState(now: Date): AgendaState {
  try {
    return loadAgendaState(window.localStorage, now).state;
  } catch {
    return createAgendaSeed(now);
  }
}

function localImagePath(value: string): string | undefined {
  const path = value.trim();
  return path.startsWith('/') && !path.startsWith('//') ? path : undefined;
}

function ProductForm({
  product,
  onSave,
  onCancel,
}: {
  product?: ProductRecord;
  onSave: (product: ProductRecord) => boolean;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [salePrice, setSalePrice] = useState(product ? String(product.salePrice) : '');
  const [costPrice, setCostPrice] = useState(product?.costPrice === undefined ? '' : String(product.costPrice));
  const [stock, setStock] = useState(product ? String(product.stock) : '0');
  const [category, setCategory] = useState(product?.category ?? '');
  const [imagePath, setImagePath] = useState(product?.imagePath ?? '');
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
    const normalizedCategory = category.trim();
    const normalizedSalePrice = Number(salePrice);
    const normalizedCostPrice = costPrice.trim() === '' ? undefined : Number(costPrice);
    const normalizedStock = Number(stock);
    const normalizedImage = localImagePath(imagePath);
    if (!normalizedName || !normalizedCategory || !Number.isFinite(normalizedSalePrice) || normalizedSalePrice < 0
      || (normalizedCostPrice !== undefined && (!Number.isFinite(normalizedCostPrice) || normalizedCostPrice < 0))
      || !Number.isInteger(normalizedStock) || normalizedStock < 0
      || (imagePath.trim() !== '' && !normalizedImage)) {
      setError('Revisa el nombre, precio, existencias y categoría. Las existencias no pueden ser negativas.');
      return;
    }

    const next: ProductRecord = {
      id: product?.id ?? `product-${crypto.randomUUID()}`,
      name: normalizedName,
      description: description.trim(),
      salePrice: normalizedSalePrice,
      ...(normalizedCostPrice === undefined ? {} : { costPrice: normalizedCostPrice }),
      stock: normalizedStock,
      category: normalizedCategory,
      ...(normalizedImage ? { imagePath: normalizedImage } : {}),
      active: product?.active ?? true,
    };
    if (!onSave(next)) setError('No se pudo guardar el producto. Revisa el almacenamiento e inténtalo de nuevo.');
  }

  return (
    <dialog
      class="appointment-modal product-modal"
      ref={dialogRef}
      aria-labelledby="product-form-title"
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
    >
      <form class="appointment-form product-form" onSubmit={submit}>
        <header class="appointment-form-heading">
          <div>
            <h2 id="product-form-title">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
            <p>Administra el catálogo y las existencias actuales.</p>
          </div>
          <button class="appointment-form-close" type="button" aria-label="Cerrar formulario de producto" onClick={onCancel}>Cerrar</button>
        </header>
        <label class="appointment-form-control">
          <span>Nombre del producto</span>
          <input autoFocus required value={name} onInput={(event) => setName(event.currentTarget.value)} />
        </label>
        <label class="appointment-form-control">
          <span>Descripción</span>
          <textarea value={description} onInput={(event) => setDescription(event.currentTarget.value)} />
        </label>
        <div class="product-form-grid">
          <label class="appointment-form-control">
            <span>Precio de venta</span>
            <input type="number" min="0" step="0.01" required value={salePrice} onInput={(event) => setSalePrice(event.currentTarget.value)} />
          </label>
          <label class="appointment-form-control">
            <span>Costo de adquisición (opcional)</span>
            <input type="number" min="0" step="0.01" value={costPrice} onInput={(event) => setCostPrice(event.currentTarget.value)} />
          </label>
          <label class="appointment-form-control">
            <span>Existencias</span>
            <input type="number" min="0" step="1" required value={stock} onInput={(event) => setStock(event.currentTarget.value)} />
          </label>
          <label class="appointment-form-control">
            <span>Categoría</span>
            <input required value={category} onInput={(event) => setCategory(event.currentTarget.value)} />
          </label>
        </div>
        <label class="appointment-form-control">
          <span>Imagen (ruta local)</span>
          <input type="text" placeholder="/products/imagen.png" value={imagePath} onInput={(event) => setImagePath(event.currentTarget.value)} />
        </label>
        {error && <p class="availability-error" role="alert">{error}</p>}
        <div class="appointment-form-actions product-form-actions">
          <button class="availability-save-button" type="submit">Guardar producto</button>
          <button class="appointment-form-cancel" type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </dialog>
  );
}

export function ProductsPage({ now = new Date() }: ProductsPageProps) {
  const [state, setState] = useState(() => loadInitialState(now));
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<ProductStatus>(PRODUCT_STATUS.ALL);
  const [selectedId, setSelectedId] = useState<string>();
  const [editingProduct, setEditingProduct] = useState<ProductRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const products = state.products ?? [];
  const selectedProduct = products.find(({ id }) => id === selectedId);
  const categories = [...new Set(products.map(({ category }) => category))].sort((a, b) => a.localeCompare(b, 'es'));
  const categoryOptions = [
    { value: 'all', label: 'Todas' },
    ...categories.map((value) => ({ value, label: value })),
  ];
  const statusOptions = [
    { value: PRODUCT_STATUS.ALL, label: 'Todos' },
    { value: PRODUCT_STATUS.ACTIVE, label: 'Activos' },
    { value: PRODUCT_STATUS.INACTIVE, label: 'Inactivos' },
  ];

  const visibleProducts = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('es');
    return products
      .filter((product) => category === 'all' || product.category === category)
      .filter((product) => status === PRODUCT_STATUS.ALL
        || (status === PRODUCT_STATUS.ACTIVE ? product.active : !product.active))
      .filter(({ name, description, category: productCategory }) => (
        !search || name.toLocaleLowerCase('es').includes(search)
        || description.toLocaleLowerCase('es').includes(search)
        || productCategory.toLocaleLowerCase('es').includes(search)
      ))
      .sort((first, second) => first.name.localeCompare(second.name, 'es', { sensitivity: 'base' }));
  }, [category, products, query, status]);

  function persist(nextProducts: ProductRecord[]): boolean {
    const nextState: AgendaState = { ...state, products: nextProducts };
    try {
      saveAgendaState(window.localStorage, nextState);
      setState(nextState);
      setError('');
      return true;
    } catch {
      setError('No se pudieron guardar los cambios. Revisa el almacenamiento e inténtalo de nuevo.');
      return false;
    }
  }

  function saveProduct(product: ProductRecord): boolean {
    const exists = products.some(({ id }) => id === product.id);
    const nextProducts = exists
      ? products.map((current) => current.id === product.id ? product : current)
      : [...products, product];
    if (!persist(nextProducts)) return false;
    setFormOpen(false);
    setEditingProduct(undefined);
    setSelectedId(product.id);
    return true;
  }

  function setActive(product: ProductRecord, active: boolean) {
    persist(products.map((current) => current.id === product.id ? { ...current, active } : current));
  }

  function closeForm() {
    setFormOpen(false);
    setEditingProduct(undefined);
  }

  return (
    <AdminGate>
      <AdminShell activeSection="Productos">
        <section class="products-page" aria-labelledby="products-title">
          <header class="agenda-heading products-heading">
            <div>
              <h1 id="products-title">Productos</h1>
              <p>Consulta precios y existencias del catálogo.</p>
            </div>
            <button class="availability-save-button" type="button" onClick={() => { setEditingProduct(undefined); setFormOpen(true); }}>Nuevo producto</button>
          </header>
          {error && <p role="alert" class="availability-error">{error}</p>}

          {selectedProduct ? (
            <section class="product-detail" aria-labelledby="product-detail-title">
              <button class="appointment-form-cancel" type="button" onClick={() => setSelectedId(undefined)}>Volver a productos</button>
              <header>
                <div class="product-detail-identity">
                  {localImagePath(selectedProduct.imagePath ?? '') && (
                    <img src={localImagePath(selectedProduct.imagePath ?? '')} alt={selectedProduct.name} />
                  )}
                  <div>
                    <h2 id="product-detail-title">{selectedProduct.name}</h2>
                    <span class={`product-status${selectedProduct.active ? '' : ' is-inactive'}`}>{selectedProduct.active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
                <div class="product-actions">
                  <button class="appointment-form-cancel" type="button" onClick={() => { setEditingProduct(selectedProduct); setFormOpen(true); }}>Editar</button>
                  {selectedProduct.active
                    ? <button class="appointment-form-cancel" type="button" onClick={() => setActive(selectedProduct, false)}>Desactivar</button>
                    : <button class="appointment-form-cancel" type="button" onClick={() => setActive(selectedProduct, true)}>Activar</button>}
                </div>
              </header>
              <p>{selectedProduct.description || 'Sin descripción.'}</p>
              <dl>
                <div><dt>Precio de venta</dt><dd>${selectedProduct.salePrice.toLocaleString('es')}</dd></div>
                <div><dt>Costo de adquisición</dt><dd>{selectedProduct.costPrice === undefined ? 'No registrado' : `$${selectedProduct.costPrice.toLocaleString('es')}`}</dd></div>
                <div><dt>Existencias</dt><dd>{selectedProduct.stock}</dd></div>
                <div><dt>Categoría</dt><dd>{selectedProduct.category}</dd></div>
              </dl>
            </section>
          ) : (
            <>
              <div class="products-toolbar">
                <label>
                  <span>Buscar</span>
                  <input type="search" aria-label="Buscar productos" placeholder="Nombre, descripción o categoría" value={query} onInput={(event) => setQuery(event.currentTarget.value)} />
                </label>
                <div class="products-filter-control">
                  <span>Categoría</span>
                  <Dropdown label="Filtrar por categoría" value={category} options={categoryOptions} onChange={setCategory} />
                </div>
                <div class="products-filter-control">
                  <span>Estado</span>
                  <Dropdown label="Estado de productos" value={status} options={statusOptions} onChange={setStatus} />
                </div>
              </div>
              {visibleProducts.length ? (
                <ul class="product-list" aria-label="Lista de productos">
                  {visibleProducts.map((product) => (
                    <li key={product.id}>
                      <article class="product-row" aria-label={`Producto ${product.name}`}>
                        <button class="product-row-open" type="button" onClick={() => setSelectedId(product.id)}>
                          <strong>{product.name}</strong>
                          <span>{product.description || 'Sin descripción.'}</span>
                        </button>
                        <span class="product-price">${product.salePrice.toLocaleString('es')}</span>
                        <span class="product-stock">Existencias: {product.stock}</span>
                        <span class={`product-status${product.active ? '' : ' is-inactive'}`}>{product.active ? 'Activo' : 'Inactivo'}</span>
                        <div class="product-actions">
                          <button class="appointment-form-cancel" type="button" aria-label={`Editar producto ${product.name}`} onClick={() => { setEditingProduct(product); setFormOpen(true); }}>Editar</button>
                          {product.active
                            ? <button class="appointment-form-cancel" type="button" aria-label={`Desactivar producto ${product.name}`} onClick={() => setActive(product, false)}>Desactivar</button>
                            : <button class="appointment-form-cancel" type="button" aria-label={`Activar producto ${product.name}`} onClick={() => setActive(product, true)}>Activar</button>}
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="agenda-empty">No hay productos que coincidan con estos filtros.</p>
              )}
            </>
          )}
          {formOpen && <ProductForm product={editingProduct} onSave={saveProduct} onCancel={closeForm} />}
        </section>
      </AdminShell>
    </AdminGate>
  );
}
