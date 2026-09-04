# Webby's Barbershop — PWA

[![CI](https://github.com/Phyton06/webbys/actions/workflows/ci.yml/badge.svg)](https://github.com/Phyton06/webbys/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-27%20passed-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-8%25-yellow)

Aplicación web progresiva para la gestión de citas y operaciones de barberías pequeñas en México rural.

## Descripción

Sistema de agendamiento que reemplaza cuadernos de papel y cadenas de WhatsApp. El dueño obtiene un sistema profesional de reservas que sus clientes pueden usar desde su teléfono, con recordatorios automatizados que reducen inasistencias.

### Roles

| Rol | Descripción |
|-----|-------------|
| **Admin** | Gestiona barberos, servicios, precios, reportes |
| **Asistente** | Reserva citas para clientes walk-in/telefono |
| **Barbero** | Ve sus citas, horario, perfil |
| **Cliente** | Reserva citas, ve historial, califica barbero |

## Stack

- **Frontend:** React 18 + Vite 5 + TypeScript + Tailwind CSS
- **PWA:** Service Worker manual + manifest
- **Datos:** Mock localStorage (sin backend)
- **Diseño:** Mobile-first, modo oscuro

## Instalación

```bash
# Clonar
git clone https://github.com/Phyton06/webbys.git
cd webbys/frontend

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build
```

## Estructura

```
frontend/
├── public/
│   ├── manifest.webmanifest    # PWA manifest
│   ├── sw.js                   # Service Worker
│   ├── logo.jpeg               # Logo barbershop
│   └── icon-*.png              # Iconos PWA
├── src/
│   ├── api/                    # Cliente mock API
│   ├── components/             # Componentes compartidos
│   │   ├── Layout.tsx          # Shell con bottom nav
│   │   ├── ErrorBoundary.tsx   # Manejo de errores
│   │   └── InstallPrompt.tsx   # Prompt instalación PWA
│   ├── contexts/               # Auth context
│   ├── data/                   # Datos mock
│   ├── hooks/                  # Custom hooks
│   └── pages/
│       ├── admin/              # Dashboard, barberos, clientes, servicios
│       ├── barber/             # Citas, perfil, horario
│       ├── client/             # Reservar, mis citas, barberos
│       └── assistant/          # Nueva cita, citas hoy, clientes
└── vite.config.ts
```

## Funcionalidades

- 🗓️ Reserva de citas en tiempo real
- 👥 Gestión de barberos y clientes
- 💇 Catálogo de servicios con precios
- 📊 Dashboard administrativo
- 📱 Instalable como PWA
- ♿ Accesibilidad (WCAG 2.1 AA)
- 🎨 Modo oscuro con marca rojo/cyan/negro

## Roles de prueba

Para probar, entra a `/login` y selecciona un rol:

- **Admin** — Control total del sistema
- **Asistente** — Reserva citas
- **Barbero** — Ve sus citas
- **Cliente** — Reserva y gestiona sus citas

## Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar con coverage
npx vitest run --coverage
```

### Cobertura actual

| Suite | Tests | Estado |
|-------|-------|--------|
| Auth flow | 10 | ✅ ProtectedRoute, RoleRoute, AuthContext |
| Componentes | 16 | ✅ AppointmentCard, Login, Layout, ErrorBoundary |
| Smoke | 1 | ✅ App renders |
| **Total** | **27** | **Todos pasando** |

## Licencia

Privado — © 2026 Webby's Barbershop
