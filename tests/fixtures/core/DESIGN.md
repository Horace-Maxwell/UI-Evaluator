---
version: alpha
name: "Bulky waste collections interface"
description: "Booking, item look-up and start pages of the council's bulky-waste service."
colors:
  surface: "oklch(0.985 0.006 250)"
  surface-container: "oklch(0.965 0.006 250)"
  surface-container-high: "oklch(0.935 0.006 250)"
  on-surface: "oklch(0.25 0.006 250)"
  on-surface-variant: "oklch(0.47 0.006 250)"
  outline: "oklch(0.56 0.006 250)"
  outline-variant: "oklch(0.86 0.006 250)"
  primary: "oklch(0.48 0.115 155)"
  primary-hover: "oklch(0.42 0.1 155)"
  on-primary: "oklch(0.985 0.006 250)"
  focus: "oklch(0.56 0.125 155)"
  selection: "oklch(0.9 0.06 155)"
  error: "oklch(0.5 0.17 25)"
  on-error: "oklch(0.985 0.006 250)"
  success: "oklch(0.48 0.11 150)"
  on-success: "oklch(0.985 0.006 250)"
  warning: "oklch(0.5 0.11 70)"
  on-warning: "oklch(0.985 0.006 250)"
  info: "oklch(0.48 0.1 240)"
  on-info: "oklch(0.985 0.006 250)"
typography:
  display: {fontFamily: "Atkinson Hyperlegible Next", fontSize: 2.441rem, fontWeight: 600, lineHeight: 1.1}
  headline: {fontFamily: "Atkinson Hyperlegible Next", fontSize: 1.953rem, fontWeight: 600, lineHeight: 1.2}
  title: {fontFamily: "Atkinson Hyperlegible Next", fontSize: 1.563rem, fontWeight: 600, lineHeight: 1.3}
  body: {fontFamily: "Atkinson Hyperlegible Next", fontSize: 1rem, fontWeight: 400, lineHeight: 1.5}
  label: {fontFamily: "Atkinson Hyperlegible Next", fontSize: 0.875rem, fontWeight: 500, lineHeight: 1.25}
rounded: {none: 0px, sm: 2px, md: 4px, full: 9999px}
spacing: {xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, page-edge: 16px}
components:
  page: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.body}"}
  panel: {backgroundColor: "{colors.surface-container}", textColor: "{colors.on-surface}", rounded: "{rounded.md}", padding: "{spacing.md}"}
  menu: {backgroundColor: "{colors.surface-container-high}", textColor: "{colors.on-surface}", rounded: "{rounded.md}"}
  meta-text: {backgroundColor: "{colors.surface-container-high}", textColor: "{colors.on-surface-variant}", typography: "{typography.label}"}
  button-primary: {backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.label}", rounded: "{rounded.sm}", padding: "{spacing.sm}", height: 2.75rem}
  button-primary-hover: {backgroundColor: "{colors.primary-hover}", textColor: "{colors.on-primary}"}
  input: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.body}", rounded: "{rounded.sm}", height: 2.75rem}
  row-selected: {backgroundColor: "{colors.selection}", textColor: "{colors.on-surface}"}
  focus-ring: {backgroundColor: "{colors.focus}"}
  notice-error: {backgroundColor: "{colors.error}", textColor: "{colors.on-error}"}
  notice-success: {backgroundColor: "{colors.success}", textColor: "{colors.on-success}"}
  notice-warning: {backgroundColor: "{colors.warning}", textColor: "{colors.on-warning}"}
  notice-info: {backgroundColor: "{colors.info}", textColor: "{colors.on-info}"}
ui-evaluator:
  status: locked
  surface_choices:
    - {id: start, color_strategy: restrained, motion: calm}
    - {id: booking, color_strategy: restrained, motion: calm}
    - {id: item-lookup, color_strategy: restrained, motion: calm}
    - {id: food-waste, color_strategy: committed, motion: balanced}
  brand_attributes:
    - {is: "plain", not: "bureaucratic"}
    - {is: "dependable", not: "dull"}
    - {is: "local", not: "folksy"}
  themes:
    shipped: [light]
    use_scene: "Residents at home or in a front garden, mostly in daylight, often on a phone with one hand busy."
    dark: {}
  ramps:
    neutral: ["oklch(0.985 0.006 250)", "oklch(0.965 0.006 250)", "oklch(0.935 0.006 250)", "oklch(0.9 0.006 250)", "oklch(0.86 0.006 250)", "oklch(0.82 0.006 250)", "oklch(0.76 0.006 250)", "oklch(0.66 0.006 250)", "oklch(0.56 0.006 250)", "oklch(0.47 0.006 250)", "oklch(0.38 0.006 250)", "oklch(0.25 0.006 250)"]
    accent: ["oklch(0.97 0.02 155)", "oklch(0.94 0.04 155)", "oklch(0.9 0.06 155)", "oklch(0.85 0.08 155)", "oklch(0.79 0.1 155)", "oklch(0.72 0.115 155)", "oklch(0.64 0.125 155)", "oklch(0.56 0.125 155)", "oklch(0.48 0.115 155)", "oklch(0.42 0.1 155)", "oklch(0.36 0.08 155)", "oklch(0.28 0.05 155)"]
  role_steps: {surface: neutral.1, surface-container: neutral.2, surface-container-high: neutral.3,
    outline-variant: neutral.5, outline: neutral.9, on-surface-variant: neutral.10, on-surface: neutral.12,
    primary: accent.9, primary-hover: accent.10, focus: accent.8, selection: accent.3}
  type:
    scale_ratio: 1.25
    measure_chars: {latin_min: 45, latin_max: 75, cjk_max: 40}
    families: "Atkinson Hyperlegible Next for all text; no monospace"
    cjk_families: "PingFang SC, Microsoft YaHei, Noto Sans SC, sans-serif for zh-CN"
  layout: {breakpoints_px: "480, 768, 1024", density: comfortable, layers: "page, sticky header, menu, dialog, toast"}
  elevation: {approach: borders, shadows: {menu: "0 2px 8px rgb(0 0 0 / 0.12)", dialog: "0 8px 24px rgb(0 0 0 / 0.16)"}}
  motion:
    duration_ms: {feedback: 120, state: 200, overlay_enter: 240, overlay_exit: 180, scrim: 240, focal: none, stagger: 0}
    easing: {enter: "cubic-bezier(0.2, 0, 0, 1)", exit: "cubic-bezier(0.4, 0, 1, 1)", move: "cubic-bezier(0.2, 0, 0, 1)"}
    frequency_budget: {keyboard_or_100_a_day: none, tens_a_day: "opacity, 120", occasional: "state motion", rare: none}
    experience_sequences_per_screen: 0
    springs: none
    reduced_motion: "No spatial motion; opacity or colour feedback up to 150 ms; progress shown as text and a static bar."
  states: {controls: [default, hover, focus-visible, active, disabled, loading, error, success],
    data_views: [loading, empty, error, partial, stale], focus_style: "two-colour ring: 2 px focus colour outside a 2 px surface gap"}
  copy:
    case: {buttons: sentence, headings: sentence, navigation: sentence, labels: sentence}
    zh_address: "您"
  direction: {roll_seed: none, chosen: existing, ledger_entry: none}
  declared_exceptions: []
  accepted_tells: []
  waivers: ".ui-evaluator/waivers.json"
---

# Bulky waste collections design system

## Overview

The referent is the printed collection calendar posted to every household: plain type, one green for the council's action colour, dates first. Residents use the start page to choose a task, the booking flow to book and pay, and the item look-up to answer one question while holding the item. Plain, not bureaucratic: short sentences and the next step always visible. Dependable, not dull: dates and fees stated once, in the same place on every step. Local, not folksy: street names and collection days, never mascots. This must never become a generic council template or its opposite, a campaign microsite.

## Colors

Restrained on every task surface: neutral surfaces with the accent reserved for the one primary action per step and for links. The food-waste page may use the accent as a committed colour field. Neutrals share one cool temperature. Status colours always come with an icon and words. Pairs that must pass in light: on-surface and on-surface-variant on every surface; on-primary on primary and primary-hover; outline and focus against surface and surface-container.

## Typography

One family, Atkinson Hyperlegible Next, chosen for character distinction at small sizes for older readers. Roles step by 1.25 from a 16 px body. Body line height 1.5; zh-CN text uses the CJK stack with line height 1.7. Prices and dates use tabular figures.

## Layout

A 4 px spacing base with an 8 px rhythm; 16 px page edges below 768 px. One column for the booking steps at every width; the look-up results become two columns from 1024 px. More space above a section heading than below it.

## Elevation & Depth

Borders separate regions. Only menus and dialogs float, with the two shadows defined in the tokens.

## Shapes

Small radii: 2 px for controls, 4 px for panels and menus. One outline icon set at 1.5 px stroke.

## Components

Buttons, text inputs, radio groups for dates, the item search field, notices and the step header. Every control has default, hover, focus-visible, active, disabled, loading, error and success states. The submit button is never disabled at rest; errors are shown after submit next to the field and summarised at the top. Required fields are unmarked and optional ones say "optional".

## Do's and Don'ts

- Do show the next free collection dates before asking for an address.
- Do state the fee once on the item step and again on the payment step, in the same words.
- Don't animate the date list when the postcode changes.
- Don't use the accent for decoration on task pages.

## Motion

Calm. State changes fade in 200 ms; menus and dialogs enter in 240 ms and leave in 180 ms. No focal moment. Under reduced motion only opacity and colour feedback up to 150 ms remain.

| Purpose | Class | Reduced-motion substitute |
|---|---|---|
| menu open | overlay | instant |
| saved notice | state | instant |

## Voice and tone

The voice is plain and direct; the tone is matter-of-fact for steps and calm for errors. Residents are addressed as "you"; zh-CN uses 您. Glossary: "bulky waste collection", never "special uplift"; "item", never "article".

## Decisions log

- 2026-09-30: palette, type and spacing locked from the existing service and its brand guidelines; no new direction.
