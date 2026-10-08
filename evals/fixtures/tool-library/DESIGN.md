---
version: 1.0
name: "Fernhill Tool Library reservations"
description: "Find, tool, basket, confirm and done pages of a community tool library's online reservation."
colors:
  surface: "#f3f5f2"
  surface-container: "#ffffff"
  surface-container-high: "#eaf0ec"
  on-surface: "#1b2420"
  on-surface-variant: "#4c5a53"
  outline: "#5f6f67"
  outline-variant: "#c5cfc9"
  primary: "#1f5a3a"
  primary-hover: "#184730"
  on-primary: "#ffffff"
  focus: "#1b2420"
  selection: "#e4efe8"
  error: "#9c2a1f"
  on-error: "#ffffff"
  success: "#1f5a3a"
  on-success: "#ffffff"
  warning: "#7a5200"
  on-warning: "#ffffff"
  info: "#1f4a6e"
  on-info: "#ffffff"
typography:
  display: {fontFamily: "Avenir Next", fontSize: 2rem, fontWeight: 700, lineHeight: 1.2}
  headline: {fontFamily: "Avenir Next", fontSize: 1.375rem, fontWeight: 700, lineHeight: 1.3}
  title: {fontFamily: "Avenir Next", fontSize: 1.0625rem, fontWeight: 700, lineHeight: 1.3}
  body: {fontFamily: "Avenir Next", fontSize: 1.0625rem, fontWeight: 400, lineHeight: 1.5}
  label: {fontFamily: "Avenir Next", fontSize: 1rem, fontWeight: 700, lineHeight: 1.3}
rounded: {none: 0px, sm: 4px, md: 4px, full: 9999px}
spacing: {xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px, 3xl: 48px, page-edge: 16px}
components:
  page: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.body}"}
  card: {backgroundColor: "{colors.surface-container}", textColor: "{colors.on-surface}", rounded: "{rounded.sm}", padding: "{spacing.lg}"}
  meta-text: {backgroundColor: "{colors.surface-container}", textColor: "{colors.on-surface-variant}", typography: "{typography.label}"}
  badge-available: {backgroundColor: "{colors.selection}", textColor: "{colors.success}", typography: "{typography.label}", rounded: "{rounded.sm}"}
  button-primary: {backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.label}", rounded: "{rounded.sm}", padding: "{spacing.sm}", height: 2.75rem}
  button-primary-hover: {backgroundColor: "{colors.primary-hover}", textColor: "{colors.on-primary}"}
  input: {backgroundColor: "{colors.surface-container}", textColor: "{colors.on-surface}", typography: "{typography.body}", rounded: "{rounded.sm}", height: 2.75rem}
  day-selected: {backgroundColor: "{colors.selection}", textColor: "{colors.on-surface}", rounded: "{rounded.sm}"}
  focus-ring: {backgroundColor: "{colors.focus}"}
  notice-error: {backgroundColor: "{colors.error}", textColor: "{colors.on-error}"}
  notice-success: {backgroundColor: "{colors.success}", textColor: "{colors.on-success}"}
  notice-warning: {backgroundColor: "{colors.warning}", textColor: "{colors.on-warning}"}
  notice-info: {backgroundColor: "{colors.info}", textColor: "{colors.on-info}"}
  action-bar: {backgroundColor: "{colors.surface-container}", textColor: "{colors.on-surface}", padding: "{spacing.md} {spacing.lg}"}
ui-evaluator:
  status: locked
  surface_choices:
    - {id: find, color_strategy: restrained, motion: calm}
    - {id: tool, color_strategy: restrained, motion: calm}
    - {id: basket, color_strategy: restrained, motion: calm}
    - {id: confirm, color_strategy: restrained, motion: calm}
    - {id: done, color_strategy: restrained, motion: calm}
  brand_attributes:
    - {is: "practical", not: "corporate"}
    - {is: "neighbourly", not: "folksy"}
    - {is: "careful", not: "fussy"}
  themes:
    shipped: [light, dark]
    use_scene: "Members at home in the evening, mostly on a phone, often in dark mode; some desktop use in a lunch break."
    dark:
      colors:
        surface: "#141a17"
        surface-container: "#1d2622"
        surface-container-high: "#243029"
        on-surface: "#e6ebe8"
        on-surface-variant: "#a9b5ae"
        outline: "#8a9890"
        outline-variant: "#3a4740"
        primary: "#8fd1a8"
        primary-hover: "#a6dcb9"
        on-primary: "#141a17"
        focus: "#e6ebe8"
        selection: "#24352c"
        error: "#f0a098"
        on-error: "#141a17"
        success: "#8fd1a8"
        on-success: "#141a17"
  ramps:
    neutral: ["#ffffff", "#f3f5f2", "#eaf0ec", "#dde4df", "#c5cfc9", "#aab6af", "#8a9890", "#6e7e76", "#5f6f67", "#4c5a53", "#33403a", "#1b2420"]
    accent: ["#f1f8f3", "#e4efe8", "#cde3d5", "#b1d4bf", "#8fd1a8", "#5fa97d", "#3f8a5e", "#2e7049", "#1f5a3a", "#184730", "#113524", "#0b2418"]
  role_steps: {surface: neutral.2, surface-container: neutral.1, surface-container-high: neutral.3,
    outline-variant: neutral.5, outline: neutral.9, on-surface-variant: neutral.10, on-surface: neutral.12,
    primary: accent.9, primary-hover: accent.10, focus: neutral.12, selection: accent.2}
  type:
    scale_ratio: 1.25
    measure_chars: {latin_min: 45, latin_max: 75, cjk_max: 40}
    families: "Avenir Next for all text, falling back to Segoe UI and Helvetica Neue; no monospace"
    cjk_families: "none; en-GB only"
  layout: {breakpoints_px: "480, 768, 1024", density: comfortable, layers: "page, masthead, sticky action bar, listbox, toast"}
  elevation: {approach: borders, shadows: {listbox: "0 2px 8px rgb(0 0 0 / 0.12)"}}
  motion:
    duration_ms: {feedback: 120, state: 120, overlay_enter: none, overlay_exit: none, scrim: none, focal: none, stagger: 0}
    easing: {enter: "ease-out", exit: "ease-out", move: "ease-out"}
    frequency_budget: {keyboard_or_100_a_day: none, tens_a_day: "opacity, 120", occasional: "state motion", rare: none}
    experience_sequences_per_screen: 0
  copy:
    case: {buttons: sentence, headings: sentence, navigation: sentence, labels: sentence}
  direction: {roll_seed: none, chosen: existing, ledger_entry: none}
  declared_exceptions: []
---
# Fernhill Tool Library: design

## Overview

The green of the library's membership card, white cards on a pale ground, one typeface, no decoration that does not do a job. Every tool card looks the same so the eye can compare; the action that matters on each page is the one filled button.

## Colors

One green family for actions and availability, a warm red for errors, neutral greens for grounds and rules. The page ground is the pale neutral; cards and inputs are white. Dark mode keeps the same roles with lighter greens on dark surfaces, and cards lighter than the ground.

## Typography

Avenir Next throughout, falling back to the system sans. Body at 17 px for members who read on phones; headings at a 1.25 ratio; labels bold at 16 px.

## Layout

A single column on phones, cards in a grid from 768 px up, and a content width of 1120 px. Spacing steps of 4, 8, 12, 16, 24, 32 and 48 px. The reserve action sits in a bar at the bottom of the tool page so it is within reach of a thumb.

## Elevation & Depth

Borders, not shadows, separate cards from the ground. The only shadow is under the loan-length list when it is open.

## Shapes

A 4 px radius on every box; pills only for badges. Icons are 1.5 px strokes.

## Components

Cards (a thumbnail, a name, a line of meta, a badge), the filled primary button, the quiet text button for Remove, inputs at 44 px, the day button with an Open tag, the session card with a radio, the error summary, the notice.

## Do's and Don'ts

Do name tools the way a volunteer would. Do show the deposit on every tool. Don't add a second filled button to a page. Don't use red for anything but errors.

## Motion

A 120 ms fade on the toast and on button colour; nothing else moves. Reduced motion removes both.

## Voice and tone

The desk volunteer handing over a tool: brief, concrete, friendly without jokes. Sentence case everywhere; "you" for the member; no exclamation marks.

## Decisions log

- 2026-10-07: one filled button per page; the reserve action lives in a bottom bar on the tool page so it is within reach of a thumb. (fixture brief)
- 2026-10-07: dark mode ships; dark greens are lightened for text on dark surfaces. (fixture brief)
