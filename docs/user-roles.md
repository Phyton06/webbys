# Control de Usuarios y Actividades — Webby's Barbershop App

## Roles del Sistema

| Rol                 | Cantidad  | Acceso                                   |
| ------------------- | --------- | ---------------------------------------- |
| Administrador/Dueño | 1         | Total al sistema                         |
| Asistente           | 1-2       | Gestión de citas y clientes              |
| Barbero             | 2-5       | Sus citas, horario y reportes personales |
| Cliente             | Ilimitado | Agendar y ver sus citas                  |

---

## 1. Administrador / Dueño

### Permisos

- ✅ Gestión completa de usuarios (crear, editar, desactivar)
- ✅ Configuración de la barbería (nombre, dirección, horarios, precios)
- ✅ Gestión de servicios y precios
- ✅ Reportes y estadísticas (ingresos, citas por barbero, clientes frecuentes)
- ✅ Reportes de campañas publicitarias y notificaciones
- ✅ Enviar notificaciones personalizadas y promociones
- ✅ Ver todas las citas de todos los barberos
- ✅ Cancelar cualquier cita
- ✅ Gestión de pagos y abonos
- ✅ Configurar horarios de cada barbero
- ✅ Acceso al panel de administración completo

### Funciones

| Módulo | Acciones |
|--------|----------|
| **Dashboard** | Ver resumen del día, semana, mes |
| **Barberos** | Alta, baja, editar, asignar horario, ver rendimiento |
| **Clientes** | Ver listado, historial, editar, desactivar |
| **Citas** | Ver todas, cancelar, reasignar, cambiar estado |
| **Servicios** | Crear, editar, eliminar, asignar precios |
| **Horarios** | Configurar horarios por barbero por día |
| **Pagos** | Registrar pagos, ver historial, generar reportes |
| **Notificaciones** | Enviar promociones, mensajes personalizados |
| **Reportes** | Ingresos, citas atendidas, clientes frecuentes |
| **Reportes publicitarios** | Campañas enviadas, aperturas, clics, conversiones |
| **Estadísticas notificaciones** | Enviadas, entregadas, leídas, con respuesta |
| **Configuración** | Datos de la barbería, logo, contacto |

### Reportes y Estadísticas Detallados

| Reporte | Métricas |
|---------|----------|
| **Ingresos** | Diario, semanal, mensual, anual, por barbero, por servicio |
| **Citas** | Total, completadas, canceladas, no-show, por barbero |
| **Clientes** | Nuevos, recurrentes, frecuentes,流失 (sin citas >30 días) |
| **Campañas publicitarias** | Enviadas, aperturas, clics, conversiones, ROI |
| **Notificaciones** | Enviadas, entregadas, leídas, tasa de apertura, respuestas |
| **Barberos** | Rendimiento, citas atendidas, calificación promedio, ingresos generados |

### Pantallas

```
/admin
├── /dashboard              # Resumen general
├── /barberos               # Gestión de barberos
│   ├── /nuevo              # Crear barbero
│   └── /[id]               # Editar barbero + rendimiento
├── /clientes               # Listado de clientes
│   └── /[id]               # Editar cliente
├── /citas                  # Todas las citas
├── /servicios              # CRUD servicios
├── /horarios               # Configurar horarios
├── /pagos                  # Historial de pagos
├── /notificaciones         # Enviar notificaciones
├── /campanas               # Campañas publicitarias
│   ├── /nueva              # Crear campaña
│   └── /[id]               # Estadísticas de campaña
├── /reportes
│   ├── /ingresos           # Reporte de ingresos
│   ├── /citas              # Reporte de citas
│   ├── /clientes           # Reporte de clientes
│   ├── /barberos           # Rendimiento de barberos
│   └── /notificaciones     # Estadísticas de notificaciones
└── /configuracion          # Datos de la barbería
```

---

## 2. Asistente

### Permisos

- ✅ Crear citas para clientes (presencial o por teléfono)
- ✅ Ver horarios disponibles de todos los barberos
- ✅ Ver listado de clientes
- ✅ Registrar nuevos clientes (solo nombre y teléfono)
- ✅ Generar URL de registro para clientes
- ✅ Cancelar citas (solo las que él/ella creó)
- ✅ Confirmar citas
- ❌ Editar horarios de barberos
- ❌ Ver reportes de ingresos
- ❌ Enviar notificaciones masivas
- ❌ Configurar la barbería
- ❌ Eliminar usuarios

### Funciones

| Módulo | Acciones |
|--------|----------|
| **Nueva cita** | Seleccionar cliente, barbero, servicio, fecha/hora |
| **Citas del día** | Ver citas de hoy, confirmar, cancelar |
| **Clientes** | Buscar cliente existente, crear nuevo (mínimo: nombre + teléfono) |
| **URL registro** | Generar enlace para que el cliente complete su registro |
| **Horarios** | Ver disponibilidad de barberos |
| **Pagos** | Registrar pago de una cita |

### Flujo: Registrar cliente nuevo

```
1. Asistente ingresa: nombre + teléfono
2. Sistema genera URL única: https://webbysbarbershop.com/registro?token=xyz
3. Asistente envía URL al cliente (WhatsApp, SMS, etc.)
4. Cliente abre URL y completa:
   - Corrige nombre si es necesario
   - Corrige teléfono si es necesario
   - Ingresa correo electrónico
   - Crea contraseña
5. Cliente queda registrado y puede agendar citas
```

### Flujo: Crear cita

```
1. Seleccionar cliente (buscar o crear nuevo)
2. Seleccionar barbero (ver disponibilidad)
3. Seleccionar servicio
4. Seleccionar fecha y hora disponible
5. Confirmar cita
6. Notificación automática al cliente y barbero
```

### Pantallas

```
/asistente
├── /nueva-cita              # Formulario de nueva cita
├── /citas-hoy               # Citas del día
├── /clientes                # Listado y búsqueda
│   ├── /nuevo               # Registrar cliente (nombre + teléfono)
│   └── /[id]                # Ver cliente + URL de registro
│       └── /generar-url     # Generar enlace de registro
└── /pagos                   # Registrar pagos
```

---

## 3. Barbero

### Permisos

- ✅ Ver sus citas (hoy, semana, mes)
- ✅ Crear citas para sí mismo
- ✅ Confirmar o cancelar sus citas
- ✅ Marcar cita como completada
- ✅ Ver historial de citas
- ✅ Ver información del cliente (solo para la cita)
- ✅ Editar su perfil (foto, especialidad)
- ✅ Ver reportes de ingresos personales
- ✅ Ver estadísticas personales
- ✅ Gestionar su horario (agregar horarios, desactivar días)
- ❌ Ver citas de otros barberos
- ❌ Ver reportes de otros barberos
- ❌ Enviar notificaciones

### Funciones

| Módulo | Acciones |
|--------|----------|
| **Mis citas** | Ver citas del día, semana |
| **Crear cita** | Agendar cita para mí (solo mis horarios disponibles) |
| **Detalle cita** | Ver info del cliente, servicio, hora |
| **Estado** | Confirmar, cancelar, completar |
| **Mi perfil** | Editar foto, especialidad, bio |
| **Mi horario** | Agregar horarios, desactivar días |
| **Mis ingresos** | Ver mis ganancias diarias, semanales, mensuales |
| **Mis estadísticas** | Citas atendidas, calificación, clientes recurrentes |

### Gestionar Horario

| Acción | Descripción |
|--------|-------------|
| Agregar horario | Seleccionar día + hora inicio/fin |
| Desactivar día | Marcar día como "no disponible" |
| Verificar conflictos | Si hay citas el día desactivado, mostrar alerta |

### Flujo: Desactivar día con citas

```
1. Barbero selecciona día para desactivar
2. Sistema verifica si hay citas ese día
3. Si HAY citas:
   - Mostrar listado de citas afectadas
   - Preguntar: "¿Qué deseas hacer?"
     Opción A: "Mantener el día activo" → Cancela la desactivación
     Opción B: "Cambiar citas a otro día" → Reasignar horario
     Opción C: "Desactivar de todas formas" → Notificar a clientes afectados
4. Si NO hay citas:
   - Desactivar día directamente
```

### Flujo: Notificación al cliente por cambio de barbero

```
1. Barbero desactiva día con citas
2. Sistema identifica clientes afectados
3. Por cada cliente:
   - Buscar barberos disponibles ese mismo día
   - Enviar notificación:
     "Tu barbero [Nombre] no estará disponible el [Fecha].
      ¿Qué prefieres?
      1. Cambiar a otro barbero el mismo día (mostrar opciones)
      2. Cambiar tu cita a otro día con tu barbero"
4. Cliente elige opción
5. Si elige otro barbero: reasignar cita
6. Si elige otro día: mostrar disponibilidad del barbero original
```

### Estadísticas Personales

| Métrica | Descripción |
|---------|-------------|
| Citas esta semana | Total de citas completadas |
| Ingresos del mes | Total de ganancias |
| Calificación promedio | Estrellas de clientes |
| Clientes recurrentes | Cuántos clientes regresan |
| Tasa de cancelación | % de citas canceladas |
| Horas trabajadas | Total de horas en el mes |

### Pantallas

```
/barbero
├── /citas                   # Mis citas (vista calendario)
│   ├── /nueva               # Crear cita para mí
│   └── /[id]                # Detalle de cita
├── /mi-perfil               # Editar mi información
├── /mi-horario              # Gestionar mi horario
│   ├── /agregar             # Agregar horario
│   └── /desactivar-dia      # Desactivar día
├── /mis-ingresos            # Mis ganancias
│   ├── /semanal             # Esta semana
│   └── /mensual             # Este mes
└── /mis-estadísticas        # Mi rendimiento
```

---

## 4. Cliente

### Permisos

- ✅ Agendar cita (seleccionar barbero, servicio, fecha/hora)
- ✅ Ver sus citas (próximas e historial)
- ✅ Cancelar cita (con anticipación mínima)
- ✅ Ver perfil del barbero (foto, especialidad)
- ✅ Recibir notificaciones
- ✅ Calificar barbero después de la cita
- ❌ Ver citas de otros clientes
- ❌ Crear citas para otros
- ❌ Ver horarios de otros barberos

### Funciones

| Módulo | Acciones |
|--------|----------|
| **Nueva cita** | Seleccionar barbero, servicio, fecha/hora |
| **Mis citas** | Ver próximas, historial |
| **Detalle cita** | Ver info, cancelar si es permitido |
| **Barberos** | Ver listado, perfil, especialidades |
| **Mi perfil** | Editar nombre, teléfono, email |
| **Notificaciones** | Ver notificaciones recibidas |

### Flujo: Agendar cita

```
1. Ver listado de barberos
2. Seleccionar barbero → ver disponibilidad
3. Seleccionar servicio
4. Elegir fecha y hora disponible
5. Confirmar cita
6. Recibir notificación de confirmación
```

### Flujo: Notificación por cambio de barbero

```
1. Recibir notificación: "Tu barbero no estará disponible el [Fecha]"
2. Ver opciones:
   - Ver barberos disponibles ese mismo día
   - Cambiar a otro día con mi barbero original
3. Seleccionar opción
4. Confirmar cambio
5. Recibir confirmación de la nueva cita
```

### Restricciones de cancelación

- **Más de 24h antes:** Cancelación gratuita
- **Entre 12-24h antes:** Cancelación con penalización
- **Menos de 12h:** No se puede cancelar

### Pantallas

```
/cliente
├── /nueva-cita              # Agendar cita
├── /mis-citas               # Citas próximas
├── /historial               # Citas pasadas
│   └── /[id]                # Detalle + calificar
├── /barberos                # Ver barberos disponibles
│   └── /[id]                # Perfil del barbero
├── /mi-perfil               # Editar mis datos
└── /notificaciones          # Ver notificaciones
```

---

## Matriz de Permisos

| Acción | Admin | Asistente | Barbero | Cliente |
|--------|:-----:|:---------:|:-------:|:-------:|
| Ver dashboard | ✅ | ❌ | ❌ | ❌ |
| CRUD barberos | ✅ | ❌ | ❌ | ❌ |
| Ver barberos | ✅ | ✅ | ✅* | ✅ |
| CRUD clientes | ✅ | ✅** | ❌ | ❌ |
| Ver clientes | ✅ | ✅ | ✅*** | ❌ |
| Crear citas | ✅ | ✅ | ✅**** | ✅ |
| Ver todas las citas | ✅ | ✅ | ❌ | ❌ |
| Ver mis citas | ✅ | ❌ | ✅ | ✅ |
| Cancelar cualquier cita | ✅ | ❌ | ❌ | ❌ |
| Cancelar mis citas | ✅ | ✅***** | ✅ | ✅ |
| Confirmar citas | ✅ | ✅ | ✅ | ❌ |
| Completar citas | ✅ | ❌ | ✅ | ❌ |
| CRUD servicios | ✅ | ❌ | ❌ | ❌ |
| Configurar horarios (admin) | ✅ | ❌ | ❌ | ❌ |
| Gestionar mi horario | ❌ | ❌ | ✅ | ❌ |
| Desactivar días | ❌ | ❌ | ✅ | ❌ |
| Ver horarios | ✅ | ✅ | ✅ | ✅ |
| Ver pagos | ✅ | ✅ | ❌ | ❌ |
| Registrar pagos | ✅ | ✅ | ❌ | ❌ |
| Ver reportes generales | ✅ | ❌ | ❌ | ❌ |
| Ver mis reportes | ❌ | ❌ | ✅ | ❌ |
| Enviar notificaciones | ✅ | ❌ | ❌ | ❌ |
| Recibir notificaciones | ✅ | ✅ | ✅ | ✅ |
| Editar mi perfil | ✅ | ✅ | ✅ | ✅ |
| Calificar barbero | ❌ | ❌ | ❌ | ✅ |
| Generar URL registro | ❌ | ✅ | ❌ | ❌ |

\* Solo ver perfil de barberos (no horarios detallados)
\** Solo crear/editar clientes, no eliminar
\*** Solo ver información del cliente para la cita actual
\**** Solo crear citas para sí mismo
\***** Solo cancelar citas que él/ella creó

---

## Notas de Implementación

### Registro de clientes (flujo asistente)

- La asistente solo ingresa nombre + teléfono
- Se genera una URL con token único y expiración (24h)
- El cliente completa: nombre, teléfono, correo, contraseña
- El token se invalida después del registro completo
- Si el token expira, la asistente puede generar uno nuevo

### Gestión de horarios del barbero

- El admin configura el horario base de cada barbero
- El barbero puede agregar horarios adicionales (ej: horas extra)
- El barbero puede desactivar días específicos (vacaciones, enfermedad)
- Si desactiva un día con citas: sistema muestra alerta con opciones
- Las notificaciones de cambio se envían automáticamente

### Notificaciones por cambio de barbero

- Se envían cuando un barbero desactiva un día con citas
- El cliente recibe opciones claras: otro barbero el mismo día u otro día
- Si elige otro barbero: se reasigna automáticamente
- Si elige otro día: se muestra disponibilidad del barbero original
- Todo queda registrado en el historial de la cita

### Autenticación

- Un usuario puede tener múltiples roles (ej: admin también puede ser asistente)
- El token JWT incluye el rol activo
- Login único con cambio de rol si aplica

### Multi-tenant (futuro)

- Cada barbería es un tenant separado
- El admin solo ve su barbería
- Los barberos/clientes están vinculados a una barbería

### Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Tokens expiran en 15 min (access) / 7 días (refresh)
- Rate limiting en endpoints sensibles
- Validación de inputs con Zod
- Tokens de registro expiran en 24 horas
