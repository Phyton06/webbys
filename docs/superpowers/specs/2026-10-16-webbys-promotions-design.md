# Webbys Promotions Design

## Goal

Add a local, administrator-facing promotions module for products, services, or bundles of both. Sales attribution and promotion analytics remain in the later Sales phase.

## User-approved scope

- Create, edit, view, search, and deactivate promotions.
- Support percentage discounts and direct promotional prices.
- Promotions may target products, services, or a combination.
- Record name, description, original price, discount, start/end dates, status, and optional image/conditions/unit cap.
- Validate dates, prices, discount values, and selected catalog targets.
- Preview the promotion in a customer-facing presentation.
- `programada`, `activa`, and `finalizada` are derived from dates. `borrador` and `desactivada` are administrator-controlled states.

## Design

Add an optional `promotions` collection to the existing Agenda local-storage state so earlier saved state remains readable. A promotion stores stable target IDs, a target-name snapshot, original bundle price, discount mode/value, date range, a manually controlled draft/disabled state, and optional local image path, conditions, and unit limit. The displayed status derives from the current date: draft/disabled remain explicit; otherwise the promotion is scheduled before its start, active through its end date, and finished afterward.

For percentage discounts, accept values greater than zero and at most 100; calculate the preview price from the original bundle price. For direct price, accept a value from zero through the original bundle price. A promotion must have at least one product or service target and a valid inclusive date range. The stored original price and target-name snapshot remain stable if catalog prices or names later change. A unit limit is informational in this phase because sales and stock decrements belong to the Sales module.

The protected `/promociones/` route follows the existing Products/Services operational UI: searchable/filterable list, details, create/edit dialog, lifecycle controls, and preview. Use the shared `Dropdown`, modal and action styles. Image material is an optional local path; do not add uploads, external fetches, backend behavior, or sales attribution.

## Data flow

`PromotionsPage` reads/saves the shared Agenda state. Selecting targets snapshots their IDs, names, and current prices. Form validation runs before save; preview shows the selected targets, original amount, discount, estimated price, dates, and current derived status. Invalid promotion data is rejected without overwriting stored bytes. Loading an older Agenda state without `promotions` does not rewrite it.

## Verification

- Test legacy state without promotions and invalid-promotion byte preservation.
- Test percentage and fixed-price calculations, date-derived statuses, date/discount/target validation, and stable snapshots after catalog edits.
- Test CRUD persistence, search/filter, deactivate/reactivate, preview, and desktop/mobile navigation.
- Run the full test suite, Astro check, and build.

## Boundaries

This phase does not record sales, decrement stock, attribute purchases to promotions, calculate ROI, send notifications, upload images, or change product/service prices. No remote operation is included.
