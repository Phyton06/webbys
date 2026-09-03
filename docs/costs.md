# Costos — Webby's Barbershop App

> **Tipo de cambio referencial:** 1 USD ≈ 17 MXN (verificar tasa actual)

## Tier 1: Gratis (para arrancar)

| Servicio | Plan | Costo | Límites |
|----------|------|-------|---------|
| Dominio | Cloudflare | $178 MXN/año | Renueva al mismo precio |
| Frontend (PWA) | Vercel Hobby | $0 | 100GB bandwidth/mes, 100 builds/día |
| Backend (API) | Railway | $0 | $85 MXN crédito/mes incluido |
| Base de datos | Supabase Free | $0 | 500MB, 50k usuarios activos/mes |
| Notificaciones | Firebase FCM | $0 | Sin costo |
| **Total** | | **$178 MXN/año** | |

### Límites reales (para una barbería)

- **200 clientes** = ~8MB de 500MB (1.6% de la cuota)
- **10,000 citas** = ~5MB
- **Tráfico web** = ~2GB/mes (límite es 100GB)
- Conclusión: el tier gratis alcanza para crecer 5-10 años

---

## Tier 2: Crecimiento (cuando escale)

| Servicio      | Plan         | Costo mensual          | Costo anual                |
| ------------- | ------------ | ---------------------- | -------------------------- |
| Frontend      | Vercel Pro   | $340 MXN/mes           | $4,080 MXN/año             |
| Backend       | Railway      | $85-340 MXN/mes        | $1,020-4,080 MXN/año       |
| Base de datos | Supabase Pro | $425 MXN/mes           | $5,100 MXN/año             |
| Dominio       | Cloudflare   | —                      | $178 MXN/año               |
| **Total**     |              | **$850-1,105 MXN/mes** | **$10,378-13,438 MXN/año** |

### Cuándo migrar a Tier 2

- Cuando superes 5,000 usuarios activos/mes
- Cuando necesites uptime del 99.9% (SLA)
- Cuando necesites soporte prioritario
- Cuando el tráfico supere 100GB/mes

---

## Tier 3: Producción completa

| Servicio | Plan | Costo mensual | Costo anual |
|----------|------|---------------|-------------|
| Frontend | Vercel Pro | $340 MXN/mes | $4,080 MXN/año |
| Backend | Railway Pro | $340 MXN/mes | $4,080 MXN/año |
| Base de datos | Supabase Pro | $425 MXN/mes | $5,100 MXN/año |
| Dominio | Cloudflare | — | $178 MXN/año |
| Monitoreo | Sentry | $442 MXN/mes | $5,304 MXN/año |
| Email transaccional | Resend | $340 MXN/mes | $4,080 MXN/año |
| **Total** | | **$1,887 MXN/mes** | **$22,822 MXN/año** |

---

## Pricing para la barbería

### Opción A: Costo fijo anual

| Concepto | Costo |
|----------|-------|
| Hosting + infra (Tier 1) | $178 MXN/año |
| Desarrollo inicial (estimado) | $8,500-25,500 MXN |
| Mantenimiento mensual | $850-1,700 MXN/mes |
| **Total primer año** | **$10,378-29,040 MXN** |
| **Total años siguientes** | **$10,378-20,578 MXN/año** |

### Opción B: Cobro mensual

| Concepto | Costo mensual |
|----------|---------------|
| Hosting + infra | $15 MXN/mes (redondeado) |
| Mantenimiento + soporte | $1,360-2,550 MXN/mes |
| **Total** | **$1,375-2,565 MXN/mes** |

### Opción C: Modelos alternativos

1. **Suscripción fija:** $1,700 MXN/mes (todo incluido)
2. **Por transacción:** $8.50 MXN por cada cita agendada
3. **Freemium:** App gratis + cobrar por features premium (reportes, multi-sucursal)

### Recomendación

**Opción B ($1,375-2,565 MXN/mes)** es la más justa:
- Cubre tus costos reales
- Es predecible para la barbería
- Deja margen para mejoras
- $16,500-30,780 MXN/año es razonable para un negocio que ahorra tiempo y captura más clientes

---

## Notas

- Todos los precios son en MXN
- Los costos de desarrollo inicial no incluyen hosting
- Railway free tier: $85 MXN crédito/mes, se congela después de 6 meses de inactividad
- Supabase free tier: se pausa después de 7 días de inactividad (requiere al menos 1 request/mes)
- Verificar tipo de cambio al momento de contratar servicios
