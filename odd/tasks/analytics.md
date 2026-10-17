# Fase Analíticas — seguimiento

Objetivo: página de solo lectura `/analiticas/` con comparación de periodos, evolución, rankings y analíticas de promociones.
Rama: `feat/analytics` · Delivery: commits por unidad de trabajo; sin push/PR sin autorización · Runner: Vitest (`npm test`).

## Specs

- S1: Ruta protegida `/analiticas/` enlazada en la navegación de escritorio y en el menú móvil "Más" con estado activo; se elimina el placeholder "Próx." de Analíticas. Criterio: `AdminShell.test` con enlace `/analiticas/` + `aria-current`; `AdminGate` protege la página.
- S2: Control de periodo idéntico al patrón de Ventas (dos botones + popover de calendario); el rango inclusivo se aplica a todas las secciones; por defecto últimos 30 días locales; comparación contra el periodo anterior de igual longitud. Criterio: tests de página con `now` fijo (15 sep – 14 oct 2026).
- S3: Resumen comparativo con ingresos netos, número de ventas y ticket promedio, cada uno con el valor del periodo anterior y delta (absoluto y %); brutos, descuentos y netos distinguidos. Criterio: `getPeriodComparison` testeado + render.
- S4: Evolución diaria de ventas netas en el SVG compartido `SalesTrend` con su lista accesible. Criterio: `getSalesTrend` reutilizado; img "Ventas netas por día".
- S5: Rankings de productos y servicios (unidades + ingresos netos con reparto proporcional del descuento) y rendimiento por empleado (ventas, neto, ticket promedio); desempates deterministas por nombre. Criterio: `getItemRanking`/`getEmployeePerformance` testeados + render.
- S6: Analíticas de promociones: atribuidas vs coincidentes nunca mezcladas; descuentos y unidades atribuidas; comparación con la ventana anterior de igual longitud solo bajo ventana de fechas guardada; benchmark sin promoción del rango; orden explícito (neto atribuido desc, posiciones visibles); serie diaria atribuida. Sin lift/ROI/causalidad. Criterio: `getPromotionAnalytics` testeado + nota "La coincidencia de fechas no demuestra atribución" en el render.
- S7: Solo lectura, sin mutaciones ni stock, sin dependencias nuevas; formato de moneda de la configuración; reutiliza design system. Criterio: tests de ausencia de controles; build sin dependencias nuevas.
- S8: Generador demo extendido a 90 días (1–3 ventas/día, 180 ventas) para dar volumen a las ventanas comparadas; suites existentes verdes actualizando solo expectativas de valores demo. Criterio: `dashboard.test` con el nuevo conteo; suite completa.

Supuesto: rango por defecto de 30 días y ventana de comparación = periodo anterior de igual longitud (aprobado por el usuario al continuar la fase).

## Tasks

- T1 · S2,S3,S5 · inline · Comparación de periodos y rankings puros (`src/services/analytics.ts`) — completado · commit `20933ac` (RED import inexistente → GREEN 11/11).
- T2 · S6 · inline · Reporte de promociones puro — completado · commit `2f34942` (RED 7 fallos → GREEN 18/18).
- T3 · S8 · inline · Historial demo extendido + tests actualizados — completado · commit `2d7ad3d` (suite 316/316; `astro check` 0 diagnósticos).
- T4 · S1,S4,S5,S6,S7 · inline · Página `/analiticas/`, ruta, navegación, estilos — completado · commit `0a727c9` (RED navegación + 6 de página → GREEN focalizados 29/29; suite 323/323).
- T5 · todas · inline · Verificación y cierre (suite, check, build, Playwright, Impeccable) — completado · build 13 rutas con `/analiticas/`; `git diff --check` limpio; Impeccable sin hallazgos nuevos; Playwright 1440/390 sin errores de consola.

Riesgo: item 3 (contrato compartido: la navegación de `AdminShell`, el generador demo y el nuevo `SalesTrend` los consumen módulos existentes; cubierto por suite completa 323/323, check 0/0/0, build y verificación visual 1440/390).

## Log

- L1: “continuemos con la siguiente fase” — el usuario aprueba arrancar la fase Analíticas (spec escrita y en español tras la indicación “en espa;ol”). Analíticas es el único módulo de `task.md` sin implementar; la navegación lo mostraba como placeholder "Próx.".
- L2: Plan de implementación y rama `feat/analytics` creados; estrategia de entrega local por unidad de trabajo.
- L3: T1 por TDD: `analytics.test.ts` (RED: import inexistente) → `analytics.ts` con `getPeriodComparison`, `getItemRanking`, `getEmployeePerformance` (reparto proporcional de descuento en rankings) → GREEN 11/11; commit `20933ac`.
- L4: T2 por TDD: 7 tests de `getPromotionAnalytics` (RED) → implementación: atribuidas por `promotionId` explícito vs coincidentes solo por fechas (nunca mezcladas), comparación de ventana anterior de igual longitud solo con definición guardada, benchmark del rango sin promoción, serie diaria atribuida acotada al rango, desempate por nombre → GREEN 18/18; commit `2f34942`.
- L5: T3: generador demo a 90 días (−89..0) con 1–3 ventas/día = 180 ventas, 90 días distintos y 60 días multi-venta; expectativas actualizadas solo donde cambia el valor demo (`dashboard.test`: 180 + forma de 90 días; `SalesPage.test`: 3 ventas hoy, 11 en 1–5 oct); suite 316/316; commit `2d7ad3d`.
- L6: T4: `SalesTrend` extraído a componente compartido que importa `sales.css` (suite de Ventas verde tras la extracción). Tests RED de navegación (`AdminShell`: enlace `/analiticas/` + `aria-current` en escritorio y menú "Más") y de página (6). Implementación: enlace sin placeholder "Próx.", `AnalyticsPage.tsx`, `analiticas.astro`, `analytics.css`. Correcciones del ciclo: aserción de estado vacío ajustada (la ventana previa del 20–25 oct alcanza el 14 oct, que sí tiene ventas; se usa el día 25 oct cuya ventana previa está vacía para cubrir "sin periodo anterior comparable"); etiqueta de rango de un día sin prefijo "Día ·"; import `SaleRecord` sin uso eliminado (hint de `astro check` a 0/0/0). GREEN focalizados 29/29; suite 323/323; commit `0a727c9`.
- L7: T5 cierre: build 13 rutas incluyendo `/analiticas/`; `git diff --check` limpio; detector Impeccable sin hallazgos en archivos nuevos/cambiados (los advisory de font-size son preexistentes de otros CSS); Playwright contra preview: 1440 y 390 sin errores de consola, comparativa neta $24,250 vs $24,200 (+0,2%), promociones con atribución/benchmark/notas honestas y menú móvil "Más" con Ventas y Analíticas accesibles (geometría: menú termina en 768, barra inferior 771–844). Nota de entorno: el dev server en 4321 arrastraba caché stale de Vite de ediciones intermedias (hidratación "Invalid time value"); se reinició y `/analiticas/` quedó limpio (0 errores). Espejo Engram pendiente: `mem_save` no resuelve sesión de runtime; los docs locales son la fuente.
