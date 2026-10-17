# Webbys Analytics Design

## Goal

Add the missing read-only Analíticas module: a protected `/analiticas/` page that turns the existing generated sales records into business analytics — sales evolution, period-over-period comparison, product/service/employee rankings, and a deep promotion analytics section that separates sales attributed to a promotion from sales that merely occurred during its date range.

## User decisions

- The user's next-phase instruction: “bien haz commit y pushea a main por cli, despues continuemos con la siguiente fase”.
- Requirements source: `task.md` §13, “Analíticas generales” and “Analíticas de promociones”; the `/ventas/` register already covers the sales listing, filters, and detail views this module builds on.
- The desktop sidebar and the mobile “Más” menu already list “Analíticas” as a placeholder (“Próx.”, “aún no está disponible”); this phase turns it into the real route.

## Scope

- Add a protected `/analiticas/` route (AdminGate + AdminShell, `activeSection` “Analíticas”) linked from the existing desktop sidebar and mobile “Más” menu with the current active state; remove the placeholder behavior for this section in `AdminShell.tsx`.
- Period control reuses the Sales pattern: two date triggers opening the collapsible month-calendar popover, and the selected inclusive range applies to every section. Assumption: the default range is the last 30 local days — unlike Sales, which defaults to the current day — because a single-day analytics view would be empty; both boundaries remain editable.
- Comparison window: the immediately preceding range of equal inclusive length (the day before the start boundary, going back the same number of days). Shown deltas are signed absolute and percentage changes.
- Sections, mobile-first and in this order:
  1. Comparative summary — net revenue, sale count, and average ticket for the selected range, each with the previous-window value and delta. Gross, discounts, and net stay distinct.
  2. Sales evolution — daily net-sales chart for the selected range, reusing the Sales SVG trend pattern and its accessible value list.
  3. Rankings — most-sold products and most-sold services (units and net revenue) and employee performance (sale count, net revenue, average ticket), each ranked with deterministic tie-breaks by name.
  4. Promotion analytics (the priority section) — per promotion: attributed sales count, net revenue, discounts granted, and attributed units; occurred-during-window count/net/units kept clearly labeled as contextual (“la coincidencia de fechas no demuestra atribución”); comparison of the promotion window against the equal-length window immediately before it under the same attribution rule; a benchmark against sales without promotion attribution for the selected range; best/worst ranking with the ranking key stated in the UI; and a daily attributed net series for the promotion.
- Honest metrics only: no lift, conversion, ROI, or causality claims; any comparison states its formula in the UI copy; a promotion without a stored date window shows its figures with an explicit “sin ventana de fechas comparable” note instead of an invented comparison. Demonstration data stays labeled as demonstration.

## Non-goals and constraints

- Read-only: no sale creation, editing, cancellation, refunds, or any mutation; never touch product stock.
- No new dependencies or chart libraries, no backend, no analytics-specific storage; calculations come only from existing demonstration records and local stores.
- Reuse the design system and conventions: AdminGate, AdminShell, existing controls, the calendar popover, currency formatting from business settings, and the Sales/dashboard list and card styles. New CSS follows `src/styles/sales.css` conventions.
- Reuse the existing pure sales functions where they fit (`filterSales`, `summarizeSales`, `getSalesBreakdown`, `getSalesTrend`, `getPromotionSalesInsights`); add new pure analytics functions in `src/services/analytics.ts` with focused tests.

## Data and behavior

- Sales stay the deterministic demonstration records. Extend only the generator in `src/data/demo.ts` so the default 30-day window and its preceding comparison window both carry plausible daily volume (multiple days with several sales across roughly the last 90–120 days), keeping records deterministic, IDs and existing fields intact, and promotion attribution snapshots unchanged. Update only the existing test expectations that encode previous demo values; never weaken other assertions.
- Promotions come from the existing local promotion records (the same source the Sales page reads); no analytics-only promotion data is created.
- New `AnalyticsPage.tsx` (+ tests) rendered by `src/pages/analiticas.astro`; navigation wiring in `AdminShell.tsx` (add the `href` and the `'Analíticas'` member to the active-section prop union). The mobile “Más” menu inherits the entry from the desktop section list.
- Empty ranges and promotions without activity get explicit empty states.

## Verification

- Unit-test the pure analytics functions: current-vs-previous window math (equal inclusive lengths, boundaries, empty windows), ranking order and tie-breaks, employee performance values, and promotion comparisons — including that date overlap never counts as attribution and that a missing promotion date window produces no invented comparison.
- Page tests: AdminGate protection, period popover behavior, every section with data and with empty states, and the absence of sale or inventory mutation controls.
- Run focused tests, the full Vitest suite, `npm run check`, and `npm run build`; visually inspect the new route at 390px and 1440px with Playwright (design only) and run the Impeccable detector on it.

Risk: none for the module itself (read-only aggregation over demonstration records; no persisted format, storage key, or shared contract changes; the navigation change is additive). The demo-data extension changes values visible on shared surfaces (dashboard, Sales); their existing suites must stay green and cover the new volume.
