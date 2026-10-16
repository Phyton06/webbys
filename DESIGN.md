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
    height: "3.25rem"
    padding: "0 1rem"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "3.25rem"
    padding: "0 1rem"
  demo-badge:
    backgroundColor: "{colors.demo-surface}"
    textColor: "{colors.demo-ink}"
    rounded: "{rounded.pill}"
    height: "2rem"
    padding: "0 0.75rem"
  provider-action:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "2.9rem"
    padding: "0 0.75rem"
  mobile-navigation:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.ink-muted}"
    height: "4.5rem"
    padding: "0.5rem 0"
  appointment-timeline:
    textColor: "{colors.ink-muted}"
    padding: "0.75rem 0"
  sales-overview:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "clamp(1rem, 3vw, 1.75rem)"
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
- Mobile uses a persistent bottom navigation; desktop uses a side rail.
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

### Named Rules
**The Numbers Line Up Rule.** Money and time values use tabular numerals and stay attached to explicit labels and units.

## Layout

The admin shell occupies the device viewport: the work area scrolls independently while mobile navigation remains in its own bottom row. The login and entry routes use normal document scrolling. At the mobile breakpoint, the admin rail becomes a four-item bottom navigation with additional destinations in the “Más” menu; at desktop widths, a persistent side rail lists every module and marks unfinished modules “Próx.”

The main content is capped at 90rem. The login frame caps at 74rem and changes to a two-column story/form layout at 58rem. Dashboard sales and activity areas gain a two-column layout at 48rem; the 420px and 360px adjustments protect narrow phone layouts. The base spacing rhythm uses quarter-rem steps, with larger gaps between work areas than within a form or timeline item.

## Elevation & Depth

Depth is primarily tonal: the canvas, shell, surface, and raised surface are close dark values rather than a stack of floating cards. A soft offset shadow is limited to transient surfaces such as the mobile “Más” menu and announcement feedback. Focus uses a visible light ring; reduced-motion settings shorten transitions and disable decorative motion.

### Shadow Vocabulary
- **Raised transient surface** (`0 14px 32px rgb(0 0 0 / 22%)`): soft offset beneath menus and status announcements only.
- **Accent marker** (`0 0 0 4px rgb(228 61 55 / 16%)`): a small red state halo around the active demo agenda marker.

## Shapes

Control and small-action corners use the compact radius; larger work surfaces use a one-rem radius, while demo pills use a full capsule. Borders on inputs and selects use the stronger control-border token; dividers remain quieter and never substitute for a control outline.

## Components

### Buttons
- **Primary:** action red, white text, 3.25rem minimum height, compact rounded corners.
- **Secondary/demo entry:** raised charcoal surface with neutral text; keeps the demo route clear without competing with the primary action.
- **Provider actions:** familiar neutral buttons; the Google and Facebook marks retain their provider-specific colors, and the click response states that the flow is simulated.
- **Hover/focus:** short color/position transition; focus is a visible light ring and remains keyboard-accessible.

### Inputs / Fields
- **Style:** dark working surface, visible control border, compact rounded corners, and full-width touch targets.
- **Focus:** high-contrast ring; invalid fields receive a semantic border and an associated, announced error.
- **Password:** visibility toggle is a real labeled button, not a decorative icon.

### Chips
- **Demo status:** warm amber foreground on a dark amber surface; always accompanied by explicit “Modo demo” or “Datos de demostración” text.
- **Appointment status:** pending, confirmed, completed, and cancelled states use readable text as well as color.

### Navigation
- **Mobile:** persistent four-destination bottom bar; current page uses the accent icon, while upcoming areas show “Próx.” and explain their status when activated.
- **Desktop:** fixed-width side rail with a readable current-page state and visible “Próx.” labels.
- **More menu:** compact raised menu with the same section names and “Próximamente” status.

### Data Surface
- **Sales summary:** a single raised surface pairs the selected period, net total, a responsive bar chart, and gross/discount breakdown.
- **Appointment timeline:** time, client, service/barber, and a text status form a chronological list; the dashboard surfaces the next appointment in its first viewport.

## Do's and Don'ts

### Do:
- **Do** label every synthetic metric and simulated action; the localStorage flag is navigation state, not a security boundary.
- **Do** keep a text label for each appointment status and show gross, discounts, and net as separate values.
- **Do** keep the mobile bottom navigation outside the scrollable work area so it does not obscure content.
- **Do** keep chart labels and appointment details readable at phone widths.

### Don't:
- **Don't** imply that login, OAuth, data persistence, notifications, or sales are real server operations.
- **Don't** represent the illustrative `$` symbol as a confirmed currency.
- **Don't** use red as passive decoration or rely on it as the only state indicator.
- **Don't** add decorative gradients, glass effects, icon-only navigation, or a grid of identical dashboard cards.
# Webbys interface conventions

- Dropdown menus use the reusable `Dropdown` component, not native `<select>` popups: browsers and operating systems control those popup colors and can ignore CSS. Preserve the charcoal surface, clear selected state, keyboard interaction, and visible focus when adding dropdowns in later stages.
- User-facing copy presents the intended production experience; do not expose internal demo/synthetic-data terminology.
- Brand name: Webby's Barbershop. Use the supplied `public/logo.jpeg` asset for visible brand marks.
