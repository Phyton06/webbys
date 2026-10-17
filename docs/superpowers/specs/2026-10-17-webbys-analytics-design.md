# Webbys Analíticas — Diseño

## Objetivo

Agregar el módulo de Analíticas, de solo lectura: una página protegida `/analiticas/` que convierte los registros de ventas generados existentes en analíticas de negocio — evolución de ventas, comparación entre periodos, rankings de productos, servicios y empleados, y una sección profunda de analíticas de promociones que separa las ventas atribuidas a una promoción de las que solo ocurrieron durante su rango de fechas.

## Decisiones del usuario

- Instrucción de siguiente fase: “bien haz commit y pushea a main por cli, despues continuemos con la siguiente fase”.
- Fuente de requisitos: `task.md` §13, “Analíticas generales” y “Analíticas de promociones”; el registro de `/ventas/` ya cubre el listado de ventas, los filtros y el detalle sobre los que se construye este módulo.
- La barra lateral de escritorio y el menú móvil “Más” ya listan “Analíticas” como marcador de posición (“Próx.”, “aún no está disponible”); esta fase lo convierte en la ruta real.

## Alcance

- Agregar una ruta protegida `/analiticas/` (AdminGate + AdminShell, `activeSection` “Analíticas”) enlazada desde la barra lateral de escritorio y el menú móvil “Más” con el estado activo; eliminar el comportamiento de marcador de posición para esta sección en `AdminShell.tsx`.
- El control de periodo reutiliza el patrón de Ventas: dos disparadores de fecha que abren el popover colapsable del calendario mensual, y el rango inclusivo seleccionado se aplica a todas las secciones. Supuesto: el rango predeterminado son los últimos 30 días locales — a diferencia de Ventas, que usa el día actual — porque una vista de analíticas de un solo día quedaría vacía; ambos límites siguen siendo editables.
- Periodo de comparación: el rango inmediatamente anterior de igual longitud inclusiva (el día anterior al límite de inicio, retrocediendo la misma cantidad de días). Los deltas mostrados son cambios absolutos y porcentuales con signo.
- Secciones, mobile-first y en este orden:
  1. Resumen comparativo — ingresos netos, número de ventas y ticket promedio del rango seleccionado, cada uno con el valor del periodo anterior y su delta. Brutos, descuentos y netos se mantienen distintos.
  2. Evolución de ventas — gráfica diaria de ventas netas del rango seleccionado, reutilizando el patrón SVG de tendencia de Ventas y su lista accesible de valores.
  3. Rankings — productos más vendidos y servicios más vendidos (unidades e ingresos netos) y rendimiento por empleado (ventas, ingresos netos, ticket promedio), cada uno rankeado con desempate determinista por nombre.
  4. Analíticas de promociones (la sección prioritaria) — por promoción: ventas atribuidas (cantidad, ingresos netos, descuentos concedidos y unidades atribuidas); cifras de ocurridas-durante-la-ventana (cantidad, neto, unidades) claramente etiquetadas como contextuales (“la coincidencia de fechas no demuestra atribución”); comparación de la ventana de la promoción contra la ventana de igual longitud inmediatamente anterior bajo la misma regla de atribución; una referencia contra ventas sin atribución de promoción para el rango seleccionado; ranking de mejores y peores con la clave de orden indicada en la interfaz; y una serie diaria de neto atribuido por promoción.
- Solo métricas honestas: nada de lift, conversión, ROI ni afirmaciones de causalidad; toda comparación indica su fórmula en el texto de la interfaz; una promoción sin ventana de fechas almacenada muestra sus cifras con una nota explícita “sin ventana de fechas comparable” en lugar de una comparación inventada. Los datos de demostración siguen etiquetados como demostración.

## Fuera de alcance y restricciones

- Solo lectura: sin creación, edición, cancelación ni reembolsos de ventas, ni ninguna mutación; nunca tocar el stock de productos.
- Sin dependencias nuevas ni librerías de gráficas, sin backend, sin almacenamiento propio de analíticas; los cálculos salen únicamente de los registros de demostración y los almacenes locales existentes.
- Reutilizar el sistema de diseño y las convenciones: AdminGate, AdminShell, los controles existentes, el popover del calendario, el formato de moneda de la configuración del negocio y los estilos de listas y tarjetas de Ventas/dashboard. El CSS nuevo sigue las convenciones de `src/styles/sales.css`.
- Reutilizar las funciones puras de ventas donde encajen (`filterSales`, `summarizeSales`, `getSalesBreakdown`, `getSalesTrend`, `getPromotionSalesInsights`); agregar nuevas funciones puras de analíticas en `src/services/analytics.ts` con pruebas enfocadas.

## Datos y comportamiento

- Las ventas siguen siendo los registros de demostración deterministas. Extender solo el generador de `src/data/demo.ts` para que la ventana predeterminada de 30 días y su ventana de comparación previa tengan volumen diario plausible (varios días con varias ventas en aproximadamente los últimos 90–120 días), manteniendo los registros deterministas, los IDs y campos existentes intactos, y las instantáneas de atribución de promociones sin cambios. Actualizar solo las expectativas de pruebas existentes que codifican valores demo anteriores; nunca debilitar otras aserciones.
- Las promociones provienen de los registros locales de promociones existentes (la misma fuente que lee la página de Ventas); no se crean datos de promociones exclusivos de analíticas.
- Nueva `AnalyticsPage.tsx` (+ pruebas) renderizada por `src/pages/analiticas.astro`; cableado de navegación en `AdminShell.tsx` (agregar el `href` y el miembro `'Analíticas'` a la unión del prop de sección activa). El menú móvil “Más” hereda la entrada de la lista de secciones de escritorio.
- Los rangos vacíos y las promociones sin actividad tienen estados vacíos explícitos.

## Verificación

- Probar unitariamente las funciones puras de analíticas: aritmética de ventanas actual-vs-anterior (longitudes inclusivas iguales, límites, ventanas vacías), orden de rankings y desempates, valores de rendimiento por empleado y comparaciones de promociones — incluyendo que la coincidencia de fechas nunca cuenta como atribución y que una promoción sin ventana de fechas no produce una comparación inventada.
- Pruebas de página: protección de AdminGate, comportamiento del popover de periodo, cada sección con datos y con estados vacíos, y la ausencia de controles de mutación de ventas o inventario.
- Correr pruebas enfocadas, la suite completa de Vitest, `npm run check` y `npm run build`; inspeccionar visualmente la ruta nueva a 390px y 1440px con Playwright (solo diseño) y correr el detector de Impeccable sobre ella.

Riesgo: ninguno para el módulo en sí (agregación de solo lectura sobre registros de demostración; sin cambios de formato persistido, claves de almacenamiento ni contratos compartidos; el cambio de navegación es aditivo). La extensión de datos demo cambia valores visibles en superficies compartidas (dashboard, Ventas); sus suites existentes deben permanecer en verde y cubrir el nuevo volumen.
