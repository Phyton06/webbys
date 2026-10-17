# Webbys — Etapa 5: integración, consistencia visual y navegación

Objective: Cerrar la Etapa 5 del `task.md` (§18) integrando las indicaciones del usuario: botones de regreso minimalistas y consistentes en todas las pantallas, auditoría de estilos de los controles (desplegables, calendarios y demás), revisión de navegación por si procede fusionar pestañas, y un registro de estilos de referencia para módulos futuros.
Branch: `feat/etapa-5-integracion` (desde `main` = `8bfad1c`). Delivery: `ask-on-risk` con preferencia previa del usuario `feature-branch-chain`; forecast ~500 líneas autoradas (código + docs).
Test runner: `npm test` (Vitest); cierre con `npm run check`, `npm run build` y `git diff --check`.

## Specs

### S1 — Botones de regreso minimalistas en todas las pantallas
Requisito del usuario (verbatim): «acomoda los botones de regreso [Image 1] como esto de regresar a configuracion pero de todas las pantallas, quiero algo mas minimalista algo como solo el boton de flechita y al lado el texto de configuracion osea el titulo»
Alcance: reemplazar la presentación de los botones de regreso de las vistas de detalle por un enlace fantasma compartido (`‹` + nombre del destino), sin caja ni borde, en 9 ubicaciones: Configuración (drill-down de categorías), Clientes (perfil), Empleados (perfil), Servicios (detalle), Productos (detalle), Promociones (detalle), Ventas (detalle), Notificaciones (redactor → historial) y AdminGate (acceso denegado). Las filas de acciones de formularios (p. ej. «Volver a la cita» junto a «Guardar cliente») no son navegación de vista y conservan su botón.
Criterios de aceptación: misma posición y comportamiento actuales; etiqueta visible = nombre del destino; `aria-label` «Volver a …»; área táctil ≥ 2.75rem de alto; foco visible; sin cambios de rutas ni de lógica.
Chequeos: pruebas de las páginas afectadas en verde; capturas 390/1440 sin regresiones.

### S2 — Auditoría de estilos de controles (desplegables, calendarios y demás)
Requisito (verbatim): «y sobre todo revisa que todo tenga estilo correcto tanto de desplegables como calendarios y demas»
Alcance: inventario de controles compartidos (Dropdown, MobileMonthCalendar, comboboxes, diálogos, campos, chips/estados, empty states) y verificación de que cada uso siga el patrón compartido en todas las páginas; corregir las inconsistencias encontradas.
Caso conocido: el calendario de Ventas queda oculto en escritorio (`.sales-calendar-popover`); corregir con el patrón compartido `.appointment-date-picker-popover` (mismo arreglo aplicado en Analíticas, commit `44f5893`).
Chequeos: calendario visible (`display: grid`) en escritorio y móvil en cada uso; capturas 390/1440; suite en verde.

### S3 — Revisión de navegación: ¿fusionar pestañas?
Requisito (verbatim): «tambien quiero que revises todas las pesta;as y veamos si algunas se pudieran juntar de alguna manera para mejorar la navegacion»
Alcance: analizar las 11 secciones y entregar una propuesta concreta con tradeoffs; la fusión es decisión de producto: solo se implementa lo que el usuario apruebe y la decisión queda en el log.
Chequeos: propuesta entregada; si se aprueba, navegación (rail de escritorio + menú «Más» móvil) y rutas actualizadas con pruebas.

### S4 — Registro de estilos para módulos futuros
Requisito (verbatim): «al finalizar dejas un registro de todo el estilo de la app para que en el futuro que se agregue mas modulos tenga los estilos a seguir»
Alcance: dejar como referencia un documento de estilos actualizado (`DESIGN.md`): tokens, componentes compartidos (botones, BackLink, Dropdown, MobileMonthCalendar, comboboxes, diálogos, chips, empty states), patrones de página (encabezados, detalles, formularios, filtros) y reglas para módulos futuros con clases y rutas exactas.
Chequeos: documento revisado contra el código real; utilizable por un módulo nuevo sin leer todo el CSS.

### S5 — Cierre de Etapa 5 (task.md §18)
Alcance: navegación completa, formularios/acciones, conflictos de agenda, diseños 390/1440, suite + check + build + diff check; evidencia y Risk line en el log. Los criterios §19 se usan como checklist.

## Tasks
- [x] T1 — BackLink compartido + reemplazo en las 9 ubicaciones (S1) — inline — commit: `1ae7ec4`
- [ ] T2 — Auditoría de estilos y correcciones, incluido el calendario de Ventas (S2) — inline — pendiente
- [ ] T3 — Análisis de navegación + propuesta + implementación de lo aprobado (S3) — pendiente
- [ ] T4 — Registro de estilos (`DESIGN.md`) (S4) — pendiente
- [ ] T5 — Cierre/validación con evidencia (S5) — pendiente

## Log
- L1 (usuario, verbatim): «perfecto, en esta fase acomoda los botones de regreso [Image 1] como esto de regresar a configuracion pero de todas las pantallas, quiero algo mas minimalista algo como solo el boton de flechita y al lado el texto de configuracion osea el titulo, ademas tambien quiero que revises todas las pesta;as y veamos si algunas se pudieran juntar de alguna manera para mejorar la navegacion y sobre todo revisa que todo tenga estilo correcto tanto de desplegables como calendarios y demas, al finalizar dejas un registro de todo el estilo de la app para que en el futuro que se agregue mas modulos tenga los estilos a seguir». La captura mostraba el botón con caja «← Configuración» bajo el encabezado de Configuración.
- L2: Recon: 9 botones de regreso con 4 estilos distintos (caja con borde en Configuración; `client-text-action`; `employee-text-action`; `appointment-form-cancel`; `service-secondary-button`). Decisión de patrón: componente compartido `BackLink` (`‹` + nombre del destino, fantasma sin caja, misma posición y comportamiento). «Volver a la cita» (paso interno del formulario de cita) queda fuera por ser fila de acciones de formulario. Mirror en Engram pendiente (el servicio sigue sin resolver sesión de runtime).
- L3: T1 completo y verificado. `BackLink` aplicado en Configuración, Clientes, Empleados, Servicios, Productos, Promociones, Ventas, Notificaciones y AdminGate; CSS viejo depurado (`.settings-back-button`, `.client-profile-back`, `.employee-profile-back`). Evidencia: suite 323/323 en verde, `astro check` 0/0/0, clic de regreso verificado en las 9 pantallas, capturas 1440/390 en `.impeccable/review/backlink-*.png` sin desbordes.
