# Stack Tecnológico — Webby's Barbershop App

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (PWA)                          │
│  React + Vite + TypeScript + Tailwind CSS                   │
│  ├── Agendamiento de citas                                  │
│  ├── Gestión de horarios                                    │
│  ├── Notificaciones push                                    │
│  └── Acceso directo (instalable como app)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST API
┌──────────────────────────▼──────────────────────────────────┐
│                     API (Backend)                            │
│  Node.js + Fastify + TypeScript                             │
│  ├── Autenticación JWT                                      │
│  ├── Gestión de usuarios (barberos, clientes, asistente)    │
│  ├── Lógica de agendamiento                                 │
│  ├── Notificaciones programadas                             │
│  └── Endpoints REST                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────────┐
│                   BASE DE DATOS                              │
│  PostgreSQL (Supabase)                                      │
│  ├── Usuarios (barberos, clientes, asistentes)              │
│  ├── Citas y horarios                                       │
│  ├── Notificaciones                                         │
│  └── Configuración de la barbería                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend: PWA con React

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18+ | Framework UI |
| Vite | 5+ | Bundler, HMR rápido |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Estilos utility-first |
| React Router | 6+ | Navegación SPA |
| Axios | 1+ | HTTP client |

### Por qué React + Vite

- **React:** Ecosistema más grande, fácil de encontrar desarrolladores, excellent PWA support
- **Vite:** Build más rápido que Webpack, mejor DX
- **TypeScript:** Menos bugs en runtime, mejor mantenibilidad
- **Tailwind:** UI consistente sin escribir CSS custom

### PWA Configuration

```json
// vite.config.ts
{
  "plugins": [
    "react",
    "vite-plugin-pwa"  // Genera service worker y manifest
  ]
}
```

### Características PWA

- **Manifest:** Permite "instalar" como app en home screen
- **Service Worker:** Cache de assets para funcionar offline
- **Push Notifications:** Via Firebase Cloud Messaging (FCM)
- **Responsive:** Se adapta a cualquier tamaño de pantalla

---

## Backend: API con Node.js

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 20+ LTS | Runtime |
| Fastify | 4+ | Framework web (más rápido que Express) |
| TypeScript | 5+ | Type safety |
| Prisma | 5+ | ORM para PostgreSQL |
| JWT | - | Autenticación stateless |
| Zod | 3+ | Validación de inputs |

### Por qué Fastify sobre Express

- **Rendimiento:** 2-3x más rápido que Express
- **TypeScript:** Soporte nativo, no necesita @types
- **Validación:** Schema-based validation integrada
- **Plugins:** Arquitectura modular limpia

### Estructura del Backend

```
backend/
├── src/
│   ├── routes/          # Endpoints REST
│   │   ├── auth.ts      # Login, registro, refresh token
│   │   ├── barbers.ts   # CRUD barberos
│   │   ├── clients.ts   # CRUD clientes
│   │   ├── appointments.ts  # Agendamiento
│   │   └── notifications.ts # Notificaciones
│   ├── services/        # Lógica de negocio
│   │   ├── auth.service.ts
│   │   ├── appointment.service.ts
│   │   └── notification.service.ts
│   ├── middleware/       # Auth, validación, errores
│   │   ├── auth.middleware.ts
│   │   └── validation.middleware.ts
│   ├── prisma/          # Schema y migraciones
│   │   └── schema.prisma
│   └── utils/           # Helpers, constantes
├── package.json
└── tsconfig.json
```

---

## Base de Datos: PostgreSQL

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| PostgreSQL | 15+ | Base de datos principal |
| Supabase | - | Hosting de PostgreSQL |
| Prisma | 5+ | ORM y migraciones |

### Por qué PostgreSQL

- **Confiable:** Usado por empresas como Apple, Instagram, Spotify
- **Gratis:** Supabase ofrece 500MB gratis
- **Escalable:** Si crece, migrar a Supabase Pro o AWS RDS
- **JSON support:** Para campos flexibles como configuración

### Schema (Prisma)

```prisma
// schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  phone     String?
  role      Role     // BARBER, CLIENT, ASSISTANT
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  barberProfile BarberProfile?
  clientProfile ClientProfile?
}

model BarberProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  specialty String?
  schedule  Json     // { lunes: [{start: "09:00", end: "18:00"}] }

  // Relaciones
  appointments Appointment[]
}

model Appointment {
  id          String   @id @default(uuid())
  clientId    String
  barberId    String
  date        DateTime
  startTime   String   // "10:00"
  endTime     String   // "11:00"
  status      Status   // PENDING, CONFIRMED, COMPLETED, CANCELLED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  client  ClientProfile @relation(fields: [clientId], references: [id])
  barber  BarberProfile @relation(fields: [barberId], references: [id])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  body      String
  type      NotifType // APPOINTMENT_REMINDER, PROMOTION, CUSTOM
  sentAt    DateTime?
  readAt    DateTime?
  createdAt DateTime @default(now())
}

enum Role {
  BARBER
  CLIENT
  ASSISTANT
}

enum Status {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

enum NotifType {
  APPOINTMENT_REMINDER_1DAY
  APPOINTMENT_REMINDER_1HOUR
  PROMOTION
  CUSTOM
}
```

---

## Autenticación: JWT

| Componente | Implementación |
|------------|----------------|
| Access Token | JWT (15 min expiración) |
| Refresh Token | JWT (7 días expiración) |
| Password Hash | bcrypt (12 rounds) |
| Roles | BARBER, CLIENT, ASSISTANT |

### Flujo de Auth

```
1. Login → POST /auth/login
   Body: { email, password }
   Response: { accessToken, refreshToken }

2. Request autenticado → GET /appointments
   Header: Authorization: Bearer <accessToken>

3. Token expirado → POST /auth/refresh
   Body: { refreshToken }
   Response: { accessToken, refreshToken }

4. Refresh expirado → Login again
```

### Permisos por Rol

| Rol | Permisos |
|-----|----------|
| ASSISTANT | Crear citas por clientes, ver todos los horarios |
| BARBER | Ver sus citas, actualizar estado, gestionar horario |
| CLIENT | Agendar citas, ver sus citas, cancelar |

---

## Notificaciones: Firebase Cloud Messaging

| Componente | Implementación |
|------------|----------------|
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Programadas | Node.js cron job |
| Templates | JSON en base de datos |

### Tipos de Notificación

| Tipo | Timing | Ejemplo |
|------|--------|---------|
| Recordatorio 1 día | 24h antes | "Mañana tienes cita a las 10:00 con Juan" |
| Recordatorio 1 hora | 1h antes | "En 1 hora tu cita con Juan" |
| Promoción | Cuando se envíe | "¡2x1 en cortes este viernes!" |
| Personalizada | Cuando se envíe | Mensaje libre de la barbería |

### Implementación

```typescript
// notification.service.ts
import { initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Enviar notificación push
async function sendPushNotification(
  token: string,
  title: string,
  body: string
) {
  await getMessaging().send({
    token,
    notification: { title, body },
    webpush: {
      fcmOptions: { link: 'https://webbysbarbershop.com' }
    }
  });
}

// Programar recordatorios (cron job)
async function sendReminders() {
  // Buscar citas en las próximas 24h
  const tomorrowAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: tomorrowStart, lte: tomorrowEnd },
      status: 'CONFIRMED'
    },
    include: { client: true, barber: true }
  });

  for (const apt of tomorrowAppointments) {
    await sendPushNotification(
      apt.client.fcmToken,
      'Recordatorio de cita',
      `Mañana tienes cita a las ${apt.startTime} con ${apt.barber.name}`
    );
  }
}
```

---

## Hosting y Deploy

| Servicio | Plan | Para qué |
|----------|------|----------|
| Vercel | Hobby (gratis) | Frontend PWA |
| Railway | Free ($85 crédito/mes) | Backend API |
| Supabase | Free (500MB) | Base de datos PostgreSQL |
| Firebase | Free | Notificaciones push (FCM) |
| Cloudflare | $178 MXN/año | Dominio + DNS |

### Variables de Entorno

```env
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/barbershop
JWT_SECRET=tu-secreto-super-seguro
JWT_REFRESH_SECRET=tu-otro-secreto-super-seguro
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY=tu-private-key

# Frontend (.env)
VITE_API_URL=https://api.webbysbarbershop.com
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
```

---

## Herramientas de Desarrollo

| Herramienta | Propósito |
|-------------|-----------|
| VS Code | Editor de código |
| Docker | Contenedor local (opcional) |
| Postman/Insomnia | Testing de API |
| Git + GitHub | Control de versiones |
| ESLint + Prettier | Linting y formateo |
| Husky | Git hooks (pre-commit) |

### Comandos Útiles

```bash
# Frontend
cd frontend
npm run dev          # Iniciar desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build

# Backend
cd backend
npm run dev          # Iniciar desarrollo (con hot reload)
npm run build        # Build para producción
npx prisma migrate   # Ejecutar migraciones
npx prisma studio    # Abrir Prisma Studio (GUI de DB)
```

---

## Stack Resumido

| Capa | Tecnología | Costo |
|------|-----------|-------|
| Frontend | React + Vite + TypeScript + Tailwind | $0 |
| Backend | Node.js + Fastify + TypeScript | $0 |
| ORM | Prisma | $0 |
| Database | PostgreSQL (Supabase) | $0 |
| Auth | JWT + bcrypt | $0 |
| Notificaciones | Firebase FCM | $0 |
| Hosting | Vercel + Railway | $0 |
| Dominio | Cloudflare | $178 MXN/año |
| **Total** | | **$178 MXN/año** |

---

## Notas

- Todos los paquetes son open source y gratuitos
- El stack está optimizado para costos mínimos al iniciar
- Si escala, cada componente se puede migrar por separado
- TypeScript en frontend y backend permite compartit tipado
