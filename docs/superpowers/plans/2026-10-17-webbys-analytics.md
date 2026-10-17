# Plan de implementación — Webbys Analíticas

> **Para ejecutores:** Ejecutar tarea por tarea en orden con test-first RED → GREEN. Mantener comportamiento, tests y documentación relevante juntos en commits de unidad de trabajo.

**Goal:** Construir la página de solo lectura `/analiticas/` con comparación de periodos, evolución, rankings y analíticas de promociones sobre los registros demo existentes.

**Architecture:** Nuevas funciones puras en `src/services/analytics.ts` (comparación de periodos, rankings por ítem y por empleado, reporte de promociones) reutilizando `filterSales`/`summarizeSales`/`getPromotionSalesInsights`; se extiende el generador demo para dar volumen a las ventanas comparadas; una página Preact protegida con el patrón de control de periodo de Ventas y el SVG de tendencia extraído a componente compartido.

**Tech Stack:** Astro, Preact, TypeScript, Vitest, `AdminGate`, `AdminShell`, `Dropdown`, `MobileMonthCalendar`, stores locales existentes.

**Delivery:** Commits por unidad de trabajo en `feat/analytics`; sin push ni PR sin autorización explícita del usuario.

## Restricciones globales

- Solo lectura: sin creación/edición/cancelación de ventas, sin mutar stock, sin almacenamiento propio de analíticas.
- Sin dependencias nuevas ni librerías de gráficas.
- Atribución = `promotionId` explícito; la coincidencia de fechas es contexto y nunca atribución.
- Nada de lift/ROI/causalidad; datos demo etiquetados como demostración.
- Reutilizar el sistema de diseño y el formato de moneda de la configuración del negocio.

---

## File Structure

- `src/services/analytics.ts` / `src/services/analytics.test.ts` — funciones puras de comparación, rankings y promociones.
- `src/data/demo.ts` — historial demo extendido (90 días, 1–3 ventas/día, 180 ventas).
- `src/components/SalesTrend.tsx` — SVG de tendencia extraído de `SalesPage` para reutilizarlo.
- `src/components/AnalyticsPage.tsx` / `src/components/AnalyticsPage.test.tsx` — página completa.
- `src/pages/analiticas.astro` — ruta protegida.
- `src/components/AdminShell.tsx` / `src/components/AdminShell.test.tsx` — enlace real y sección activa.
- `src/styles/analytics.css` — estilos.
- Tests a actualizar por valores demo: `src/services/dashboard.test.ts`, `src/components/SalesPage.test.tsx`.

## Interfaces

```ts
export interface PeriodSummary { saleCount: number; grossTotal: number; discountTotal: number; netTotal: number; averageTicket: number; }
export interface PeriodDelta { absolute: number; percent: number | null; }
export interface PeriodComparison {
  range: { startDate: string; endDate: string };
  previousRange: { startDate: string; endDate: string };
  current: PeriodSummary;
  previous: PeriodSummary;
  deltas: { netTotal: PeriodDelta; saleCount: PeriodDelta; averageTicket: PeriodDelta };
}
export function getPeriodComparison(sales: SaleRecord[], startDate: string, endDate: string): PeriodComparison;

export function getItemRanking(sales: SaleRecord[], kind: 'product' | 'service'): Array<{ id: string; name: string; units: number; netTotal: number }>;

export function getEmployeePerformance(sales: SaleRecord[]): Array<{ id: string; name: string; saleCount: number; netTotal: number; averageTicket: number }>;

export interface PromotionAnalytics {
  id: string; name: string;
  attributedSalesCount: number; attributedNetTotal: number; attributedDiscountTotal: number; attributedUnits: number;
  occurredDuringSalesCount: number; occurredDuringNetTotal: number; occurredDuringUnits: number;
  hasDateWindow: boolean;
  windowComparison: { currentNetTotal: number; previousNetTotal: number; delta: PeriodDelta } | null;
  dailyAttributed: Array<{ date: string; netTotal: number }>;
}
export interface PromotionAnalyticsReport { promotions: PromotionAnalytics[]; withoutPromotion: { saleCount: number; netTotal: number }; }
export function getPromotionAnalytics(sales: SaleRecord[], promotions: PromotionRecord[], startDate: string, endDate: string): PromotionAnalyticsReport;
```

---

## Tasks

### Tarea 1: Comparación de periodos y rankings puros

**Files:** `src/services/analytics.ts`, `src/services/analytics.test.ts`.

- [ ] Tests RED de `getPeriodComparison`: ventana anterior de igual longitud inclusiva (30 días → los 30 previos, sin solaparse); límites inclusivos; periodos vacíos → resúmenes en cero y `percent: null`; `percent: null` cuando el valor anterior es 0; fechas inválidas → resúmenes vacíos sin lanzar.
- [ ] Tests RED de `getItemRanking`: unidades + neto con reparto proporcional del descuento (`gross - discountTotal * gross/saleGross`); orden unidades desc → neto desc → nombre; ignora ítems sin `catalogItemId` del tipo pedido.
- [ ] Tests RED de `getEmployeePerformance`: agrupa por empleado (cantidad, neto, ticket promedio); orden neto desc → nombre; ignora ventas sin empleado.
- [ ] Implementar; `npm test -- src/services/analytics.test.ts` GREEN; commit `feat(analytics): add period comparison and ranking queries`.

### Tarea 2: Reporte de analíticas de promociones

**Files:** `src/services/analytics.ts`, `src/services/analytics.test.ts`.

- [ ] Tests RED de `getPromotionAnalytics`: atribuidas vs coincidentes nunca se mezclan (coincidencia de fechas no cuenta como atribución); descuentos y unidades atribuidas; `windowComparison` solo bajo ventana guardada, comparando la ventana de la promo contra la ventana anterior de igual longitud bajo la misma regla de atribución, y `null` sin ventana; benchmark `withoutPromotion` del rango (excluye toda venta atribuida); orden por `attributedNetTotal` desc → nombre; serie diaria `dailyAttributed` solo del rango seleccionado y ordenada por fecha; rango inválido → reporte vacío.
- [ ] Implementar; tests GREEN; commit `feat(analytics): add promotion analytics report`.

### Tarea 3: Historial demo extendido

**Files:** `src/data/demo.ts`, `src/services/dashboard.test.ts`, `src/components/SalesPage.test.tsx` y los tests que fallen por valores demo.

- [ ] Actualizar `dashboard.test.ts`: `toHaveLength(35)` → `toHaveLength(180)`; nueva aserción de volumen: últimos 30 días y los 30 anteriores con ventas en múltiples días y varios días con más de una venta.
- [ ] Generar días -89..0 con `1 + ((d + 89) % 3)` ventas por día (180 en total); horas/minutos/empleado/producto/servicio/pago según índice plano; conservar IDs `demo-sale-NN` (padStart 2), snapshots de atribución (`index % 7 === 0`) y campos existentes.
- [ ] Correr `npm test`; actualizar solo las expectativas que codifican valores demo previos (p. ej. ventas de hoy 1 → 3 en `SalesPage.test.tsx`; rango 1–5 oct 5 → valor nuevo; IDs del detalle).
- [ ] Commit `feat(analytics): extend generated sales history`.

### Tarea 4: Página `/analiticas/`, ruta y navegación

**Files:** `src/components/SalesTrend.tsx`, `src/components/SalesPage.tsx`, `src/components/AnalyticsPage.tsx`, `src/components/AnalyticsPage.test.tsx`, `src/pages/analiticas.astro`, `src/components/AdminShell.tsx`, `src/components/AdminShell.test.tsx`, `src/styles/analytics.css`.

- [ ] Extraer `SalesTrend` de `SalesPage` a componente compartido sin cambiar su salida; `npm test -- src/components/SalesPage.test.tsx` GREEN.
- [ ] Tests RED de `AdminShell`: reemplazar las 4 aserciones de "Analíticas, próximamente" por enlace `/analiticas/` en escritorio y Más + `aria-current="page"` con `activeSection="Analíticas"`.
- [ ] Tests RED de página (`now` fijo 2026-10-14): rango por defecto 15 sep – 14 oct 2026; botones Desde/Hasta + popover de calendario; resumen comparativo con deltas y valor del "Periodo anterior"; evolución (img "Ventas netas por día"); rankings (productos, servicios, empleados); promociones con la nota "La coincidencia de fechas no demuestra atribución", benchmark sin promoción y "sin ventana de fechas comparable" para la promo demo; estado vacío con un rango sin ventas; ausencia de controles de mutación.
- [ ] Implementar `AnalyticsPage.tsx` (patrón de periodo y clases de Ventas), `analiticas.astro` (título "Analíticas | Webbys"), wiring en `AdminShell` (`href` + unión de sección activa `'Analíticas'`), `analytics.css`.
- [ ] `npm test -- src/components/AnalyticsPage.test.tsx src/components/AdminShell.test.tsx` GREEN; `npm run check` 0 diagnósticos; commit `feat(analytics): add read-only analytics page`.

### Tarea 5: Verificación y cierre

**Files:** `odd/tasks/analytics.md`, plan, spec.

- [ ] Confirmar por test que abrir Analíticas y cambiar el periodo no alteran `webbys:agenda:v1` ni `webbys:business-settings:v1`.
- [ ] `npm test` (suite completa), `npm run check` (0 diagnósticos), `npm run build` (12 rutas con `/analiticas/`), `git diff --check`.
- [ ] Playwright 390px y 1440px en `/analiticas/` (solo diseño) + detector Impeccable sobre la ruta; revisar consola.
- [ ] Actualizar task doc (checkboxes, evidencia, Risk line) y commit de cierre de docs.

## Decisiones conocidas

- Reparto de neto por ítem: proporcional al bruto del ítem dentro de la venta (`discountTotal` repartido en la misma proporción); ítems sin `catalogItemId` se excluyen de rankings.
- Ranking de promociones: `attributedNetTotal` desc, desempate por nombre; la UI indica la clave de orden y numera las posiciones (mejor → peor).
- `windowComparison` solo bajo ventana de fechas guardada; la promoción demo (`demo-promotion-seasonal`, sin registro en el store) muestra sus cifras atribuidas con nota explícita "sin ventana de fechas comparable".
- Se conserva el mecanismo "Próx." de `AdminShell` para futuros módulos sin `href`, aunque ya no lo use ninguna sección.

## Notas de verificación y entrega

- Comandos enfocados: `npm test -- src/services/analytics.test.ts`, `npm test -- src/components/AnalyticsPage.test.tsx src/components/AdminShell.test.tsx`.
- Cierre: `npm test && npm run check && npm run build && git diff --check`.
- Entrega local en `feat/analytics`; push/PR solo con autorización explícita.
