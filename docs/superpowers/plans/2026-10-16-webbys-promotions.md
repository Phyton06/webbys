# Promotions Implementation Plan

> **For agentic workers:** Execute in order with test-first RED → GREEN. Keep code and focused tests together in work-unit commits.

**Goal:** Implement the approved local promotions module without adding sales attribution or backend behavior.

**Architecture:** Add an optional promotion collection to AgendaState. Store product/service ID and name/price snapshots so later catalog edits do not change an existing promotion. Keep discount calculation and date-derived status in pure service functions; use them from the protected Promotions page and its preview.

**Tech Stack:** Astro, Preact, TypeScript, Vitest, localStorage, existing `AdminGate`, `AdminShell`, `Dropdown`, and appointment modal styles.

## Global Constraints

- Percentage discount: greater than 0 and at most 100.
- Direct promotional price: from 0 through the original bundle price.
- A promotion requires at least one target and valid inclusive start/end dates.
- `draft` and `disabled` are manually controlled; `scheduled`, `active`, and `finished` derive from dates.
- Unit limits are informational only; no sales, stock decrement, attribution, analytics, uploads, external fetches, or backend.
- Loading old Agenda state without promotions must not rewrite stored bytes.

## Tasks

### Task 1: Promotion model, calculation, and persistence

**Files:** `src/types/agenda.ts`, `src/services/agenda-store.ts`, `src/services/promotions.ts`, `src/services/promotions.test.ts`, `src/services/agenda-store.test.ts`.

**Interfaces:**

```ts
interface PromotionTarget {
  kind: 'product' | 'service';
  id: string;
  name: string;
  price: number;
}

interface PromotionRecord {
  id: string;
  name: string;
  description: string;
  targets: PromotionTarget[];
  discountType: 'percentage' | 'fixed_price';
  originalPrice: number;
  discountValue: number;
  startsOn: string;
  endsOn: string;
  manualStatus: 'draft' | 'disabled';
  imagePath?: string;
  conditions?: string;
  unitLimit?: number;
}

function getPromotionStatus(promotion: PromotionRecord, today: string): 'draft' | 'scheduled' | 'active' | 'finished' | 'disabled';
function getPromotionPrice(promotion: PromotionRecord): number;
```

- [x] Add tests for percent/fixed-price calculations, each date-derived state, and invalid ranges/discounts/targets.
- [x] Run `npm test -- src/services/promotions.test.ts`; observed the expected missing-module failure.
- [x] Implement pure calculation/status helpers and add `promotions?: PromotionRecord[]` to `AgendaState`.
- [x] Extend Agenda validation to accept old states without promotions and reject malformed promotion data on load and save.
- [x] Test that old-state load preserves original serialized bytes and invalid promotion loads/saves do not overwrite them; independent save-path recheck passed for invalid discounts and duplicate IDs.
- [x] Run focused service/store tests; 30 passed. Commit: `c31605c`.

### Task 2: Promotion management page, preview, and route

**Files:** `src/components/PromotionsPage.tsx`, `src/components/PromotionsPage.test.tsx`, `src/styles/promotions.css`, `src/pages/promociones.astro`, `src/components/AdminShell.tsx`, `src/components/AdminShell.test.tsx`, `DESIGN.md`.

- [x] Test promotion create/edit, search/status filtering, deactivation/reactivation, target snapshots after catalog edits, and preview totals.
- [x] Run `npm test -- src/components/PromotionsPage.test.tsx`; observed the expected missing-page failure.
- [x] Implement localStorage CRUD, customer-facing preview, date-based status labels, and validation feedback using existing modal/dropdown/navigation patterns.
- [x] Link the protected `/promociones/` route from desktop and mobile More navigation.
- [x] Update `DESIGN.md` with promotion list, preview, discount, and status behavior.
- [x] Run `npm test` (203 passed), `npm run check` (0 diagnostics), and `npm run build` (10 static routes including `/promociones/`). Commit: `41160bb`.

## Delivery

Implement inline, use focused tests before the full suite, and do not push unless the user explicitly asks.
