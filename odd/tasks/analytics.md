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

- T1 · S2,S3,S5 · inline · Comparación de periodos y rankings puros (`src/services/analytics.ts`) — pendiente.
- T2 · S6 · inline · Reporte de promociones puro — pendiente.
- T3 · S8 · inline · Historial demo extendido + tests actualizados — pendiente.
- T4 · S1,S4,S5,S6,S7 · inline · Página `/analiticas/`, ruta, navegación, estilos — pendiente.
- T5 · todas · inline · Verificación y cierre (suite, check, build, Playwright, Impeccable) — pendiente.

## Log

- L1: “continuemos con la siguiente fase” — el usuario aprueba arrancar la fase Analíticas (spec escrita y en español tras la indicación “en espa;ol”). Analíticas es el único módulo de `task.md` sin implementar; la navegación lo mostraba como placeholder "Próx.".
- L2: Plan de implementación y rama `feat/analytics` creados; estrategia de entrega local por unidad de trabajo.
