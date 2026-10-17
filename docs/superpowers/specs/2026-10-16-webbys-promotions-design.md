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

### User refinements

The user requested: “2 cosas primero el calendario no esta con el estilo que estamos utilizando, y otra cosa, quiero que los productos y servicios sea un buscador y cando seleccione 1 quede abajo y se pueda deseleccionar, ademas que sea de 2 maneras, pack de servicios o productos o descuentos general de los productos por que aqui juntas todos los que se selecciones y se suman para despues poner el descuento, pero no quiero que sea a fuerza así, pero si es una opcion”

- Reuse the existing monthly calendar style for choosing the promotion date range.
- Search targets; show selected products/services below the results with a remove action for each.
- Bundle mode sums the selected product/service prices and discounts the combined amount.
- Individual-discount mode applies the percentage independently to each selected product or service; the preview shows each item's original and discounted price instead of requiring a bundle.
- Both modes keep products and services in the client-style searchable dropdown; selected entries appear below it and can be removed individually.
- Promotion dates use the same collapsed, trigger-opened calendar popover as “Nueva cita”; the month grid stays hidden until the user opens a start/end date control and closes after a date is selected.

## Design

Add an optional `promotions` collection to the existing Agenda local-storage state so earlier saved state remains readable. A promotion stores stable target IDs, a target-name snapshot, original bundle price, discount mode/value, date range, a manually controlled draft/disabled state, and optional local image path, conditions, and unit limit. The displayed status derives from the current date: draft/disabled remain explicit; otherwise the promotion is scheduled before its start, active through its end date, and finished afterward.

For bundle promotions, percentage discounts must be greater than zero and at most 100; calculate them from the combined original bundle price. A direct promotional price must be from zero through the original bundle price. Individual discounts use a percentage from greater than zero through 100 for each selected product or service independently. A promotion must have at least one compatible target and a valid inclusive date range. The stored original price and target-name snapshots remain stable if catalog prices or names later change. A unit limit is informational in this phase because sales and stock decrements belong to the Sales module.

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
