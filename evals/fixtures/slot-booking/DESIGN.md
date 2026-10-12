---
version: 1.0
name: "Dunmore recycling centre booking"
description: "When, vehicle, confirm and done steps of the council's drop-off slot booking."
colors:
  surface: "#f4f6f5"
  surface-container: "#ffffff"
  surface-container-high: "#edf3f0"
  on-surface: "#18251f"
  on-surface-variant: "#4e5f57"
  outline: "#63746c"
  outline-variant: "#c7d1cc"
  primary: "#27684a"
  primary-hover: "#1f513a"
  on-primary: "#ffffff"
  focus: "#18251f"
  selection: "#e3f2eb"
  error: "#a52f1d"
  on-error: "#ffffff"
  success: "#27684a"
  on-success: "#ffffff"
  warning: "#8a5a00"
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
  slot: {backgroundColor: "{colors.surface-container}", textColor: "{colors.on-surface}", rounded: "{rounded.sm}", padding: "{spacing.sm} {spacing.xs}", height: 3.5rem}
  slot-selected: {backgroundColor: "{colors.selection}", textColor: "{colors.on-surface}", rounded: "{rounded.sm}"}
  button-primary: {backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.label}", rounded: "{rounded.sm}", padding: "{spacing.sm}", height: 2.75rem}
  button-primary-hover: {backgroundColor: "{colors.primary-hover}", textColor: "{colors.on-primary}"}
  input: {backgroundColor: "{colors.surface-container}", textColor: "{colors.on-surface}", typography: "{typography.body}", rounded: "{rounded.sm}", height: 2.75rem}
  focus-ring: {backgroundColor: "{colors.focus}"}
  notice-error: {backgroundColor: "{colors.error}", textColor: "{colors.on-error}"}
  notice-success: {backgroundColor: "{colors.success}", textColor: "{colors.on-success}"}
  notice-warning: {backgroundColor: "{colors.warning}", textColor: "{colors.on-warning}"}
  notice-info: {backgroundColor: "{colors.info}", textColor: "{colors.on-info}"}
ui-evaluator:
  status: locked
  surface_choices:
    - {id: when, color_strategy: restrained, motion: calm}
    - {id: vehicle, color_strategy: restrained, motion: calm}
    - {id: confirm, color_strategy: restrained, motion: calm}
    - {id: done, color_strategy: restrained, motion: calm}
  brand_attributes:
    - {is: "civic", not: "corporate"}
    - {is: "plain", not: "bare"}
    - {is: "firm about the rules", not: "stern"}
  themes:
    shipped: [light, dark]
    use_scene: "Residents at home the evening before a visit, mostly on a phone, often in dark mode; some desktop use."
    dark:
      colors:
        surface: "#141a17"
        surface-container: "#1d2521"
        surface-container-high: "#24332c"
        on-surface: "#e3e8e6"
        on-surface-variant: "#acb9b3"
        outline: "#83958d"
        outline-variant: "#3c4943"
        primary: "#82c9a8"
        primary-hover: "#9bd4ba"
        on-primary: "#141a17"
        focus: "#e3e8e6"
        selection: "#264034"
        error: "#ea9386"
        on-error: "#141a17"
        success: "#82c9a8"
        on-success: "#141a17"
  ramps:
    neutral: ["#ffffff", "#f4f6f5", "#edf3f0", "#dfe7e3", "#c7d1cc", "#acb9b3", "#83958d", "#63746c", "#4e5f57", "#3c4943", "#18251f", "#141a17"]
    accent: ["#eef7f2", "#e3f2eb", "#c9e6d7", "#b8e0cd", "#9bd4ba", "#82c9a8", "#5aa682", "#3d8a65", "#27684a", "#1f513a", "#163b2a", "#0f291d"]
  role_steps: {surface: neutral.2, surface-container: neutral.1, surface-container-high: neutral.3,
    outline-variant: neutral.5, outline: neutral.8, on-surface-variant: neutral.9, on-surface: neutral.11,
    primary: accent.9, primary-hover: accent.10, focus: neutral.11, selection: accent.2}
  type:
    scale_ratio: 1.25
    measure_chars: {latin_min: 45, latin_max: 75, cjk_max: 40}
    families: "Avenir Next for all text, falling back to Segoe UI and Helvetica Neue; no monospace"
    cjk_families: "none; en-GB only"
  layout: {breakpoints_px: "480, 768, 1024", density: comfortable, layers: "page, masthead, info panel, toast"}
  elevation: {approach: borders, shadows: {}}
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
# Dunmore recycling centre booking: design

## Overview

The council's green on a pale ground, white cards, one typeface, and nothing that does not do a job. Each step has one filled button; the rules are stated beside the control they govern.

## Colors

One green family for actions and chosen states, a warm red for errors, a dark amber for warnings, neutral greens for grounds and rules. The page ground is the pale neutral; cards and inputs are white. Dark mode keeps the roles with lighter greens on dark surfaces and cards lighter than the ground. The build sets every colour at run time from the council's hue; the values above are what the design specifies.

## Typography

Avenir Next throughout, falling back to the system sans. Body at 17 px for residents who read on phones; headings at a 1.25 ratio; labels bold at 16 px.

## Layout

A single column on phones, slots in a grid that fills the width from 96 px columns, a content width of 1120 px. Spacing steps of 4, 8, 12, 16, 24, 32 and 48 px.

## Elevation & Depth

Borders, not shadows, separate cards from the ground. Nothing floats except the toast.

## Shapes

A 4 px radius on every box; pills only for tags. Icons are 1.5 px strokes.

## Components

Slot buttons (time, an availability tag), the filled primary button, the outlined secondary button, the quiet text button for quick days, inputs at 44 px, the segmented vehicle control, the choice row with a checkbox, the error summary, the notice.

## Motion

A 120 ms fade on the toast and on button colour; nothing else moves. Reduced motion removes both.

## Voice and tone

The gate attendant: brief, concrete, firm about the rules without being stern. Sentence case everywhere; "you" for the resident; no exclamation marks.

## Do's and Don'ts

Do state a rule where it applies. Do show a slot as free only when it is. Don't add a second filled button to a step. Don't use red for anything but errors.

## Decisions log

- 2026-10-12: one filled button per step; the rules sit beside their controls. (fixture brief)
- 2026-10-12: dark mode ships; the greens are lightened for text on dark surfaces. (fixture brief)
