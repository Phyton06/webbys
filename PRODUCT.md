# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript + Tailwind CSS (PWA frontend), Node.js + Fastify + TypeScript + Prisma (backend), PostgreSQL via Supabase, Firebase Cloud Messaging for push notifications. Deploy: Vercel (frontend) + Railway (backend). Domain: Cloudflare.

## Users

- **Barbershop owner/admin:** runs daily operations, manages barbers, services, schedules, pricing, reports. Needs full control and visibility.
- **Assistant (1-2 per shop):** books appointments for walk-in/phone clients, registers new clients, handles payments. Works from the shop's device.
- **Barber (2-5 per shop):** manages own schedule, views own appointments, marks completion, sees own earnings. Mobile-first.
- **Client (unlimited):** books appointments, views upcoming/past appointments, cancels with policy, rates barber. Uses phone browser (PWA install).

Primary situation: small rural barbershop in Mexico (8,000-12,000 MXN/month revenue), low tech literacy, prefers "buy once" over subscriptions.

## Product Purpose

A scheduling and management PWA that replaces paper notebooks and WhatsApp message chains for barbershops. The shop owner gets a professional booking system their clients can use from their phone, with automated reminders that reduce no-shows. The product exists to make a small barbershop look modern and run efficiently without ongoing software costs that eat into tight margins.

Success: the shop owner sells the system to their barbers and clients actually use it to book. No-shows drop. The owner sees revenue and performance data they never had before.

## Positioning

A one-time-purchase barbershop app for rural Mexico — not a SaaS subscription. The barber "owns" the app, pays a small annual hosting fee (~$125 MXN/month), and gets support in Spanish via WhatsApp. Competing products charge monthly and assume urban, tech-savvy users. Webby's is built for the opposite: low bandwidth, shared devices, walk-in culture mixed with phone booking.

## Operating Context

- **Booking flows:** client books via phone (PWA), assistant books for walk-ins/phone calls, barber books for themselves
- **Notification chain:** automated reminders at 24h and 1h before appointment via push notification
- **Schedule management:** admin sets base schedules, barbers can add extra hours or deactivate days (with conflict detection)
- **Client registration:** assistant creates minimal record (name + phone), generates a URL for client to complete registration
- **Payment tracking:** assistant registers payments per appointment
- **WhatsApp:** primary communication channel for support and client outreach
- **Devices:** shared tablet/phone at shop (assistant), personal phones (barbers, clients)
- **Connectivity:** intermittent — PWA must work offline for cached data

## Capabilities and Constraints

- PWA installable on home screen, works offline for cached views
- Three distinct UI panels (admin, barber, client) with role-based routing
- Spanish language throughout (MX locale)
- Budget-conscious infrastructure: free tiers for Vercel, Railway, Supabase, Firebase
- Max 2-5 barbers per shop, unlimited clients
- Future: multi-tenant (one day), but single-tenant for v1

## Brand Commitments

- Product name: "Webby's Barbershop"
- Language: Spanish (Mexico)
- Voice: friendly, direct, no corporate jargon — speaks like a local business, not a tech product
- No existing visual assets, logo, or brand guidelines (to be established)

## Evidence on Hand

- Detailed business model with pricing tiers (`docs/business-model.md`)
- Full tech stack spec with architecture diagram (`docs/tech-stack.md`)
- Complete user roles and permissions matrix (`docs/user-roles.md`)
- 3-phase development plan, 8 weeks (`docs/phases.md`)
- Cost projections across 3 tiers (`docs/costs.md`)
- No code exists yet — greenfield
- No design assets, screenshots, or brand materials

## Product Principles

1. **Buy once, own it.** The barber purchases the app; hosting is minimal and predictable. No surprise bills, no feature gating.
2. **Works on the phone they already have.** PWA, no app store, no downloads beyond "add to home screen." Offline where it matters.
3. **Spanish first, simple always.** Every screen, error, and notification in natural Mexican Spanish. No tech jargon. If a walk-in assistant can't figure it out in 5 minutes, it's too complex.
4. **Reminders kill no-shows.** Push notifications at 24h and 1h are the killer feature. Everything else is table stakes.
5. **Grow with the shop.** Start with one barber, scale to five. Add reports and campaigns when the shop is ready, not before.

## Accessibility & Inclusion

- No specific accessibility standard required by client
- Target users have low to moderate tech literacy
- Touch-friendly targets (minimum 44px tap areas)
- High contrast text for outdoor/bright环境 readability
- Large font sizes for older users
