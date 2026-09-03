# Planificación por Fases — Webby's Barbershop App

## Visión General (2 meses / 8 semanas)

| Fase | Objetivo | Duración | Entrega |
|------|----------|----------|---------|
| Fase 1 | MVP funcional | 3 semanas | Sistema base usable |
| Fase 2 | Pulido + Features clave | 3 semanas | Versión completa |
| Fase 3 | Optimización + Features extra | 2 semanas | Producción madura |
| **Total** | | **8 semanas** | |

---

## Fase 1: MVP Funcional (Semanas 1-3)

### Objetivo
Sistema funcional donde la barbería pueda agendar citas y los clientes registarse.

### Semana 1: Backend Completo
| Tarea | Detalle |
|-------|---------|
| Setup proyecto | Frontend (React + Vite) y Backend (Fastify + Prisma) |
| PostgreSQL + Schema | Supabase, todas las tablas, migraciones |
| Auth completo | JWT, registro, login, roles, refresh token |
| CRUD usuarios | Admin, barberos, clientes |
| CRUD servicios | Crear, editar, eliminar con precios |
| CRUD citas | Crear, cancelar, confirmar, completar |
| Horarios base | Configurar horarios por barbero |
| Disponibilidad | Verificar slots al agendar |
| **Entregable** | API completa funcional |

### Semana 2: Frontend - Auth y Citas
| Tarea | Detalle |
|-------|---------|
| Setup PWA | Tailwind, routing, estructura |
| Auth screens | Login, registro |
| Layouts | Admin, barbero, cliente |
| Agendar cita | Formulario completo |
| Ver citas | Lista por día/semana |
| Detalle cita | Info + cambiar estado |
| **Entregable** | Flujo de citas funcional |

### Semana 3: Frontend - Paneles + Deploy
| Tarea | Detalle |
|-------|---------|
| Panel admin | Dashboard, gestión barberos/clientes |
| Panel barbero | Ver mis citas, mi perfil |
| Panel cliente | Agendar, ver mis citas |
| Asistente | Registrar cliente (nombre + teléfono) |
| Firebase FCM | Push notifications (recordatorios) |
| Deploy | Vercel (front) + Railway (back) |
| **Entregable** | MVP desplegado |

### Entregable Fase 1
- PWA instalable con auth
- Agendamiento de citas funcional
- Notificaciones de recordatorio (1 día, 1 hora)
- Roles: admin, barbero, asistente, cliente
- Desplegado en producción

---

## Fase 2: Pulido + Features Clave (Semanas 4-6)

### Objetivo
Estabilizar, pulir UI, agregar funcionalidades importantes.

### Semana 4: Bug Fixes + UI
| Tarea | Detalle |
|-------|---------|
| Testing completo | Probar todos los flujos |
| Bug fixes | Corregir problemas críticos |
| Responsive | Asegurar móvil y desktop |
| Loading/empty states | Skeletons, mensajes |
| Error handling | Mensajes claros |
| **Entregable** | Versión estable |

### Semana 5: Horarios del Barbero + Registro
| Tarea | Detalle |
|-------|---------|
| Horario barbero | Agregar horarios personales |
| Desactivar días | Marcar días no disponibles |
| Detección de conflictos | Alertar si hay citas |
| Notificación a clientes | Aviso por cambio de barbero |
| URL de registro | Asistente genera enlace |
| Flujo completo | Cliente completa sus datos |
| **Entregable** | Features de horarios y registro |

### Semana 6: Reportes Básicos
| Tarea | Detalle |
|-------|---------|
| Reportes admin | Ingresos, citas, clientes |
| Reportes barbero | Mis ingresos, mis estadísticas |
| Exportar | CSV básico |
| **Entregable** | Reportes funcionales |

### Entregable Fase 2
- Versión estable sin bugs críticos
- Barbero gestiona su horario
- Asistente registra clientes con URL
- Reportes básicos para admin y barbero

---

## Fase 3: Optimización + Features Extra (Semanas 7-8)

### Objetivo
Features premium, optimización, preparar para escalar.

### Semana 7: Campañas + Notificaciones Avanzadas
| Tarea | Detalle |
|-------|---------|
| Campañas publicitarias | Crear y enviar |
| Notificaciones personalizadas | Mensajes libres |
| Estadísticas de campaña | Aperturas, clics |
| Historial de notificaciones | Log completo |
| **Entregable** | Sistema de campañas |

### Semana 8: Optimización Final
| Tarea | Detalle |
|-------|---------|
| Performance | Optimizar queries, caché |
| Seguridad | Auditoría, rate limiting |
| Monitoreo | Sentry |
| Documentación | API docs |
| **Entregable** | Sistema listo para crecer |

### Entregable Fase 3
- Campañas publicitarias con estadísticas
- Notificaciones personalizadas
- Sistema optimizado y seguro
- Documentación completa

---

## Resumen de Entregables

| Fase | Semanas | Entregable Principal |
|------|---------|---------------------|
| 1 | 1-3 | MVP funcional (citas + auth + notificaciones) |
| 2 | 4-6 | Versión completa (horarios + registro + reportes) |
| 3 | 7-8 | Producción madura (campañas + optimización) |

---

## Features por Prioridad

### Prioridad Alta (Fase 1) - Obligatorias
- Auth (login, registro, roles)
- CRUD usuarios (admin, barberos, clientes)
- CRUD servicios
- CRUD citas (crear, cancelar, confirmar, completar)
- Horarios base por barbero
- Disponibilidad de horarios
- Push notifications (recordatorios)
- Dashboard admin básico
- Panel barbero (ver citas)
- Panel cliente (agendar, ver citas)

### Prioridad Media (Fase 2) - Importantes
- Barbero gestiona su horario
- Desactivar días con detección de conflictos
- Notificación a clientes por cambio de barbero
- URL de registro para clientes (asistente)
- Reportes básicos (admin y barbero)
- Responsive completo
- UI pulida

### Prioridad Baja (Fase 3) - Premium
- Campañas publicitarias
- Estadísticas de campañas
- Notificaciones personalizadas
- Reportes avanzados
- Exportar CSV/PDF
- Monitoreo con Sentry

---

## Riesgos y Mitigación

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| No alcanzar las 8 semanas | Alto | Priorizar Fase 1,Features de Fase 3 pueden postergarse |
| Bugs críticos | Medio | Testing continuo, tiempo buffer en Fase 2 |
| Hosting issues | Bajo | Free tier funciona, backup manual |

---

## Notas

- El MVP se usa desde la Fase 1
- Features de Fase 3 son "nice to have" - se pueden agregar después
- Si falta tiempo, cortar por: Fase 3 primero, luego reportes de Fase 2
- Las notificaciones de recordatorio son prioridad absoluta
- El registro por URL es feature diferenciador
