---
name: Webbys
description: Mobile-first design system for the Webbys barber-shop administration demo.
colors:
  accent: "#e43d37"
  accent-action: "#c52520"
  accent-hover: "#b9231e"
  accent-ink: "#ffffff"
  canvas: "#101113"
  shell: "#151619"
  surface: "#191a1d"
  surface-raised: "#222428"
  surface-muted: "#2a2c30"
  ink: "#f4f2ef"
  ink-muted: "#b6b4b0"
  ink-subtle: "#8c8b89"
  divider: "#34363a"
  control-border: "#74767a"
  success: "#69c28c"
  warning: "#efb85b"
  danger: "#f0716b"
  provider-google: "#7daaf8"
  provider-facebook: "#86aafa"
  error-ink: "#ff9a94"
  demo-surface: "#282219"
  demo-border: "#594524"
  demo-ink: "#f1c77d"
typography:
  display:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "clamp(2.25rem, 8vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.045em"
  body:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  data:
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  pill: "999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
  "12": "3rem"
components:
  button-primary:
    backgroundColor: "{colors.accent-action}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.sm}"
    height: "3.25rem"
    padding: "0 1rem"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "2.75rem"
    padding: "0 0.75rem"
  input-default:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "2.75rem"
    padding: "0.5rem 0.75rem"
  demo-pill:
    backgroundColor: "{colors.demo-surface}"
    textColor: "{colors.demo-ink}"
    rounded: "{rounded.pill}"
    height: "1.9rem"
    padding: "0 0.75rem"
  mobile-navigation:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.ink-muted}"
    height: "4.5rem"
    padding: "0.5rem 0"
  sales-overview:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "clamp(1rem, 3vw, 1.75rem)"
  back-link:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    height: "2.75rem"
    width: "2.75rem"
  dropdown-trigger:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "2.75rem"
    padding: "0 0.75rem"
  month-calendar:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0.75rem"
  status-pill:
    textColor: "{colors.success}"
    rounded: "{rounded.pill}"
    height: "1.5rem"
    padding: "0.25rem 0.6rem"
  appointment-modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    width: "min(48rem, calc(100% - 2rem))"
---

# Design System: Webbys

## Overview

**Creative North Star: “The Shop's Daily Rhythm”**

The system treats the barber shop's working day as the product's organizing rhythm. The administrator should be able to find the next appointment, understand the selected sales period, and move between business areas without learning a new interaction language. This north-star phrase describes the approved timeline-led interface; it is not a commercial slogan or a claim about a real business.

The interface is an Operate surface: familiar navigation and controls come first, with the barber-shop identity carried by a restrained charcoal field, deliberate red actions, compact numeric typography, and a readable appointment timeline. The visual mark, app icons, names, sales, and appointments in this build are demonstration assets and synthetic content; no official logo or real business data was supplied.

**Key Characteristics:**
- Deep charcoal surfaces with neutral, high-contrast text.
- Red is reserved for primary actions, active navigation, and meaningful emphasis.
- Numeric and time values use tabular data typography.
- Mobile uses a persistent four-destination bottom navigation; desktop uses a side rail. Services and Products are nested under the expandable «Catálogo» group without changing their routes or pages.
- Demonstration status and simulated behavior remain explicit.

## Colors

The palette separates the page canvas, raised working surfaces, legible text, action red, and semantic status colors; the frontmatter is the normative token source.

### Primary
- **Accent red** (`{colors.accent}`): selected navigation, the active timeline marker, and large emphasis that needs to read on the dark canvas.
- **Action red** (`{colors.accent-action}`): primary buttons and other actions with white foreground text.
- **Action hover red** (`{colors.accent-hover}`): the primary-action hover state; it remains darker so its foreground contrast stays clear.

### Neutral
- **Canvas** (`{colors.canvas}`) and **shell** (`{colors.shell}`): the page field and navigation surfaces.
- **Working surfaces** (`{colors.surface}`, `{colors.surface-raised}`, `{colors.surface-muted}`): grouped work areas, secondary actions, and pressed/hovered controls.
- **Primary, secondary, and subtle ink** (`{colors.ink}`, `{colors.ink-muted}`, `{colors.ink-subtle}`): headings/body copy, supporting text, and low-priority metadata.
- **Control border** (`{colors.control-border}`): visible input and select boundaries; the quieter divider token is used for structure, not to define interactive controls.

### States
- **Success, warning, and danger** (`{colors.success}`, `{colors.warning}`, `{colors.danger}`): appointment and validation states. Labels accompany status color so meaning never depends on color alone.
- **Demo state** (`{colors.demo-surface}`, `{colors.demo-border}`, `{colors.demo-ink}`): clearly marks simulated access and synthetic content without confusing it with a live business alert.
- **Error text** (`{colors.error-ink}`): validation copy on dark surfaces.
- **Provider marks** (`{colors.provider-google}`, `{colors.provider-facebook}`): confined to their corresponding simulated sign-in buttons; never reused as product accent colors.

### Named Rules
**The Red Has a Job Rule.** Use red for action, selection, or meaningful emphasis; do not spread it across passive decoration.

**The Demo Is Visible Rule.** Any synthetic record, amount, or simulated action remains labeled as demonstration content.

## Typography

**Display Font:** the local Avenir/Segoe UI system stack (`{typography.display.fontFamily}`)
**Body Font:** the same system stack (`{typography.body.fontFamily}`)
**Label/Mono Font:** SFMono-Regular, Consolas, or Liberation Mono for measured data and time values (`{typography.data.fontFamily}`)

**Character:** headings use a direct, workhorse sans-serif rather than an imported display face; time and money figures use tabular-looking numerals for quick scanning. No web font is fetched.

### Hierarchy
- **Display** (700, `{typography.display.fontSize}`, 1.02): entry-page headline.
- **Headline** (700, clamp 1.8–2.5rem, 1.05): dashboard and login page titles.
- **Title** (680, 1.25rem, 1.5): dashboard section headings.
- **Body** (400, 1rem, 1.5): explanatory and form copy; supporting paragraphs stay short on phones.
- **Label** (650–700, 0.75–0.875rem): control names, navigation, and status text.
- **Data** (500–650, 0.75–0.875rem, tabular numerals): sales totals, chart axes, and appointment times.
- **Page heading:** admin h1s use a responsive 1.8–2.5rem scale, 700 weight, 1.08 line height, and tight tracking; section headings use shared text-size tokens.
- **Token scale:** `--text-xs` 0.75rem, `--text-sm` 0.875rem, `--text-md` 1rem, `--text-lg` 1.25rem, `--text-xl` 1.625rem, and `--text-display` `clamp(2.25rem, 8vw, 3.25rem)` from `src/styles/tokens.css`.

### Named Rules
**The Numbers Line Up Rule.** Money and time values use tabular numerals and stay attached to explicit labels and units.

## Layout

The admin shell occupies the device viewport: the work area scrolls independently while mobile navigation remains in its own bottom row. The login and entry routes use normal document scrolling. At the mobile breakpoint, the admin rail becomes a four-item bottom navigation with additional destinations in “Más”; at desktop widths, a persistent side rail keeps module navigation visible. Services and Products appear under an expandable “Catálogo” group in both navigation surfaces.

The main content is capped at 90rem. The login frame caps at 74rem and changes to a two-column story/form layout at 58rem. Dashboard sales and activity areas gain a two-column layout at 48rem; the 420px and 360px adjustments protect narrow phone layouts. The base spacing rhythm uses quarter-rem steps, with larger gaps between work areas than within a form or timeline item.

## Elevation & Depth

Depth is primarily tonal: the canvas, shell, surface, and raised surface are close dark values rather than a stack of floating cards. Soft offset shadows distinguish transient menus, status feedback, and native dialogs. Focus uses the visible light ring; reduced-motion settings shorten transitions and disable decorative motion.

### Shadow Vocabulary
- **Raised transient surface** (`0 14px 32px rgb(0 0 0 / 22%)`): soft offset beneath menus and status announcements only.
- **Modal surface** (`0 24px 80px rgb(0 0 0 / 45%)`): separation for a task dialog over its dark backdrop.
- **Accent marker** (`0 0 0 4px rgb(228 61 55 / 16%)`): a small red state halo around the active demo agenda marker.

## Shapes

Control and small-action corners use the compact radius; larger work surfaces use a one-rem radius, while demo pills use a full capsule. Borders on inputs and selects use the stronger control-border token; dividers remain quieter and never substitute for a control outline.

## Components

### Buttons
- **Primary:** action red, white text, 3.25rem minimum height, compact rounded corners.
- **Secondary:** raised charcoal surface, neutral text, visible control-border outline, compact rounded corners, and 2.75rem minimum height.
- **Provider actions:** familiar neutral buttons; the Google and Facebook marks retain their provider-specific colors, and the click response states that the flow is simulated.
- **Hover/focus:** short color/position transition; focus is a visible light ring and remains keyboard-accessible.

### Inputs / Fields
- **Style:** raised dark surface, visible control border, compact rounded corners, 2.75rem minimum height, and full-width touch targets. Shared labels use `.appointment-form-control`.
- **Focus:** high-contrast ring; invalid fields receive a semantic border and an associated, announced error.
- **Password:** visibility toggle is a real labeled button, not a decorative icon.

### BackLink
- **Placement:** icon-only chevron in `.view-title-row`, beside the current h1 and aligned to its first line. AdminGate has no adjacent title and retains its visible «Acceso» label.
- **Target:** 2.75rem square; muted ink at rest, ink on hover, and a visible focus ring.
- **Accessibility:** `aria-label` names the destination («Volver a …»); keep native link semantics for routes and button semantics for local view changes.
- **Source:** `src/components/BackLink.tsx`, `src/styles/back-link.css`.

### Dropdowns
- Use the shared Preact `Dropdown` instead of native `<select>` popups where app-controlled option styling is needed.
- The trigger uses a raised surface and visible border; the listbox uses a raised surface, visible focus/active state, and red selected option.
- Arrow keys move the active option; Enter/Space opens or selects; Escape and outside click close the listbox.
- **Source:** `src/components/Dropdown.tsx`, `src/styles/admin.css` (`.dropdown-trigger`, `.dropdown-menu`, `.dropdown-option`).

### Month calendar and date pickers
- `MobileMonthCalendar` is Monday-first with Spanish weekday labels, a red selected day, muted outside-month dates, and appointment markers.
- Agenda embeds the compact month grid for mobile; appointment and reporting date pickers place it in `.appointment-date-picker-popover`, which keeps the grid visible at desktop widths.
- **Source:** `src/components/MobileMonthCalendar.tsx`, `src/styles/agenda.css` (`.mobile-month-calendar`, `.appointment-date-picker-popover`).

### Comboboxes, forms, and dialogs
- `ClientCombobox` provides keyboard-operable client search and selection in appointment forms; keep its empty-result message and active-option feedback.
- Label fields with `.appointment-form-control`; keep help and error copy adjacent and connect errors with ARIA descriptions.
- Create/edit forms use native `<dialog class="appointment-modal">`, `showModal()` where available, a dark backdrop, and visible close/cancel actions. Do not add a third-party modal dependency.
- **Source:** `src/components/ClientCombobox.tsx`, `src/components/AppointmentForm.tsx`, `src/components/ClientForm.tsx`, `src/styles/agenda.css`.

### Chips
- **Demo status:** warm amber foreground on a dark amber surface; always accompanied by explicit “Modo demo” or “Datos de demostración” text.
- **Appointment status:** pending, confirmed, completed, and cancelled states use readable text as well as color.
- **Entity status:** `.client-status`, `.employee-status`, `.product-status`, and `.promotion-status` use semantic success/warning/muted colors and pill radii. They are page-specific styles, not a shared StatusChip component.
- **Appointment lifecycle:** expanded pending appointments can be confirmed or cancelled; expanded confirmed appointments can be completed or cancelled. Completed and cancelled appointments remain visible as history but expose no further status actions.
- **Availability effect:** pending and confirmed appointments block their full service interval; cancelling immediately releases it, while completion preserves the historical record.
- **Status feedback:** successful changes are announced as status; storage failures use an alert and leave the previous appointment state intact.

### Navigation
- **Mobile:** persistent four-destination bottom bar; remaining destinations are in the raised “Más” menu. Services and Products are nested under the expandable «Catálogo» group.
- **Desktop:** fixed-width side rail with a readable current-page state. The «Catálogo» group expands to the existing Services and Products routes; the active child retains `aria-current="page"`.
- **Source:** `src/components/AdminShell.tsx`, `src/styles/admin.css` (`.desktop-sidebar`, `.desktop-nav-group`, `.desktop-nav-submenu`, `.mobile-navigation`, `.mobile-more-menu`, `.mobile-more-group`, `.mobile-more-submenu`).

### Data Surface
- **Sales summary:** a single raised surface pairs the selected period, net total, a responsive bar chart, and gross/discount breakdown.
- **Appointment timeline:** time, client, service/barber, and a text status form a chronological list; the dashboard surfaces the next appointment in its first viewport.

### Empty states
- Keep empty-state copy tied to the page task and active filters. Agenda and some profile histories reuse `.agenda-empty`; Sales uses `.sales-empty-state` / `.sales-empty-chart`; other modules keep local messages.
- Do not build a generic empty-state card component without a demonstrated shared need.

### Page patterns and future modules
- Mount admin pages inside `AdminShell`; use `.agenda-heading` for page h1/subtitle, then place filters before a list or detail region.
- Reuse the shared field, dialog, dropdown, calendar, combobox, BackLink, and status patterns before introducing page-specific controls.
- Import `src/styles/tokens.css`; use its CSS custom properties for color, typography, spacing, radius, focus, and elevation. Keep module-specific composition in `src/styles/<module>.css`.
- Preserve the current mobile-first shell, route-specific active state, and visible text alongside status colors. Verify new modules at 390px and 1440px, test keyboard operation, and check for horizontal overflow.

## Do's and Don'ts

### Do:
- **Do** label every synthetic metric and simulated action; the localStorage flag is navigation state, not a security boundary.
- **Do** keep a text label for each appointment status and show gross, discounts, and net as separate values.
- **Do** keep the mobile bottom navigation outside the scrollable work area so it does not obscure content.
- **Do** keep chart labels and appointment details readable at phone widths.
- **Do** use the supplied `public/logo.jpeg` asset for visible brand marks.
- **Do** reuse the shared controls and token variables before adding a page-specific variant.

### Don't:
- **Don't** imply that login, OAuth, data persistence, notifications, or sales are real server operations.
- **Don't** expose implementation details such as browser storage in user-facing copy.
- **Don't** represent the illustrative `$` symbol as a confirmed currency.
- **Don't** use red as passive decoration or rely on it as the only state indicator.
- **Don't** add decorative gradients, glass effects, icon-only navigation, or a grid of identical dashboard cards.
