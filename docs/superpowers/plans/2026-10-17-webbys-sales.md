# Webbys Sales Implementation Plan

> **For agentic workers:** Execute task-by-task in order with test-first RED → GREEN. Keep behavior, tests, and relevant documentation together in work-unit commits.

**Goal:** Build a read-only `/ventas/` register and reporting view using coherent generated sales records.

**Architecture:** Extend the existing `SaleItem`/`SaleRecord` shapes and deterministic demo generator with catalog, employee, payment, operation-status, and optional explicit-promotion snapshots. Add pure filter/summary/breakdown functions, then a protected Preact page that consumes generated records and current promotions without writing sales or inventory.

**Tech Stack:** Astro, Preact, TypeScript, Vitest, existing `AdminGate`, `AdminShell`, `Dropdown`, generated `DemoData`, and promotion records from Agenda local storage.

**Delivery:** `feature-branch-chain` (user-selected); no Sales push or PR was authorized.

## Global Constraints

- Sales are read-only; do not add sale creation, editing, cancellation, refunds, or writable sales storage.
- Do not mutate product stock.
- Keep generated demonstration data clearly labeled; do not claim actual business results, causality, profit, or ROI.
- Promotion attribution requires an explicit promotion identity on a sale. Date overlap alone is contextual reporting only.
- Preserve dashboard behavior and use existing navigation, detail/list, and control patterns.

---

## File Structure

- `src/types/domain.ts` — stable sale and line-item snapshots.
- `src/data/demo.ts` — deterministic synthetic sales fixtures with metadata needed by search and filters.
- `src/services/sales.ts` / `src/services/sales.test.ts` — pure filter, total, breakdown, and promotion-overlap calculations.
- `src/components/SalesPage.tsx` / `src/components/SalesPage.test.tsx` — protected read-only register, filters, detail, summaries, and promotion insights.
- `src/pages/ventas.astro` — authenticated module route.
- `src/components/AdminShell.tsx` / `src/components/AdminShell.test.tsx` — activate Sales links in desktop and mobile More navigation.
- `src/styles/sales.css` — responsive sales list, filters, detail, and summary layout.
- `docs/superpowers/specs/2026-10-17-webbys-sales-design.md` and `odd/tasks/sales-management.md` — approved scope and progress evidence.

## Interfaces

```ts
export type SaleItemKind = 'product' | 'service';
export type SalePaymentMethod = 'cash' | 'card' | 'transfer';
export type SaleStatus = 'completed';

export interface SaleItem {
  kind?: SaleItemKind;
  catalogItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleRecord {
  id: string;
  occurredAt: string;
  items: SaleItem[];
  employeeId?: string;
  employeeName?: string;
  paymentMethod?: SalePaymentMethod;
  status?: SaleStatus;
  promotionId?: string;
  promotionName?: string;
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
}

export interface SalesFilters {
  query: string;
  startDate: string;
  endDate: string;
  employeeId: string;
  productId: string;
  serviceId: string;
  promotionId: string;
}

export function filterSales(sales: SaleRecord[], filters: SalesFilters): SaleRecord[];
export function summarizeSales(sales: SaleRecord[]): { saleCount: number; grossTotal: number; discountTotal: number; netTotal: number };
export function getSalesBreakdown(sales: SaleRecord[]): {
  products: Array<{ id: string; name: string; units: number; grossTotal: number }>;
  services: Array<{ id: string; name: string; units: number; grossTotal: number }>;
  employees: Array<{ id: string; name: string; saleCount: number; netTotal: number }>;
};
export function getSalesTrend(sales: SaleRecord[]): Array<{ date: string; saleCount: number; netTotal: number }>;
export function getPromotionSalesInsights(sales: SaleRecord[], promotions: PromotionRecord[]): Array<{
  id: string; name: string; attributedSalesCount: number; attributedNetTotal: number;
  occurredDuringSalesCount: number; occurredDuringNetTotal: number;
}>;
```

## Tasks

### Task 1: Sale snapshots and generated fixtures

**Files:** `src/types/domain.ts`, `src/data/demo.ts`, `src/services/dashboard.test.ts`.

- [x] Add one failing test in `src/services/dashboard.test.ts` proving generated sales include valid IDs/kinds, positive integer quantities, employee/payment/status snapshots, and totals consistent with item snapshots.
- [x] Add a regression assertion that the dashboard still receives 35 records and retains gross-minus-discount equals net for every record.
- [x] Observe RED, extend the types and deterministic generator, then run the focused tests to GREEN.
- [x] Run `npm test -- src/services/dashboard.test.ts` (7 tests passed) and commit the data contract with tests: `481e79d feat(sales): enrich read-only demo records`.

### Task 2: Pure read-only sales queries

**Files:** `src/services/sales.ts`, `src/services/sales.test.ts`, `src/types/domain.ts`.

- [x] Add failing tests for inclusive date boundaries, text search over sale/item/employee names, employee/product/service/promotion filters, totals, and item breakdowns. Invalid date inputs or reversed ranges return no results.
- [x] Add failing tests showing explicit `promotionId` attribution is distinct from records merely inside `startsOn`/`endsOn`; test inclusive dates and overlapping promotions without inferring attribution.
- [x] Add a failing test for chronological daily net-sales buckets and implement `getSalesTrend`; malformed date inputs or reversed filter ranges return no sales.
- [x] Implement exported pure functions matching the interfaces above. Treat optional metadata as absent for legacy sale records, and exclude explicitly attributed sales from date-overlap-only counts.
- [x] Run `npm test -- src/services/dashboard.test.ts src/services/sales.test.ts` (15 tests passed), `npm run check` (0 diagnostics), and commit query calculations: `6c3b00a`, `f703287`.

### Task 3: Protected Sales register and navigation

**Files:** `src/components/SalesPage.tsx`, `src/components/SalesPage.test.tsx`, `src/pages/ventas.astro`, `src/components/AdminShell.tsx`, `src/components/AdminShell.test.tsx`, `src/styles/sales.css`.

- [x] Add failing page tests for read-only sales list/detail, search, every required filter, summaries, attributed-vs-overlap labels, daily net-sales chart, and no sale mutation.
- [x] Add failing navigation tests for the Sales route and current-page semantics on desktop and mobile More; update prior “coming soon” assertions for Sales.
- [x] Implement `/ventas/` using `AdminGate`, `AdminShell`, `Dropdown`, `MobileMonthCalendar`, generated `DemoData.sales`, and current promotion snapshots; details have no sale/inventory mutation controls.
- [x] Run `npm test -- src/components/SalesPage.test.tsx src/components/AdminShell.test.tsx src/services/sales.test.ts` (27 tests passed), `npm run check` (0 diagnostics), and commit: `e457c83 feat(sales): add read-only sales register`.

### Task 4: Verify and close the feature

**Files:** `odd/tasks/sales-management.md`, `docs/superpowers/plans/2026-10-17-webbys-sales.md`, relevant design spec.

- [x] Confirm by test that searching, filtering, and opening details leave persisted Agenda bytes unchanged.
- [x] Run `npm test` (226 tests), `npm run check` (0 diagnostics), `npm run build` (11 routes including `/ventas/`), and `git diff --check`.
- [x] Record the selected `feature-branch-chain` delivery strategy and leave Sales local; no push or PR was requested.

## Known decisions

- Use deterministic, generated demonstration records because the user explicitly chose view-only Sales; this phase does not introduce a sale-writing source.
- A sale is attributed only when its record has an explicit promotion ID. A date-range overlap is displayed as temporal context and is never described as caused by that promotion.
- New sale snapshot metadata remains optional in `SaleItem` and `SaleRecord` so existing dashboard fixtures/callers remain valid; every newly generated demo sale includes the metadata.
- The initial generated operation status is `completed`; no state-transition controls are exposed.

## Verification and delivery notes

- Focused commands: `npm test -- src/services/sales.test.ts` and `npm test -- src/components/SalesPage.test.tsx src/components/AdminShell.test.tsx`.
- Full closure: `npm test && npm run check && npm run build && git diff --check`.
- Runtime harness: N/A; this is a local frontend-only module with no remote service or transaction boundary.
- Delivery remains local unless separately authorized; the user's earlier push authorized Promotions, not this Sales feature.
