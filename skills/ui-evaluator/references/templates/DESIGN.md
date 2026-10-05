---
# DESIGN.md template for UI-Evaluator: Google DESIGN.md format (version alpha) plus a `ui-evaluator:` extension.
# Checked 2026-10-01 against google-labs-code/design.md at commit 9bf8eae (CLI 0.4.0, Apache-2.0):
#   https://github.com/google-labs-code/design.md/blob/9bf8eae/docs/spec.md
#   https://github.com/google-labs-code/design.md/blob/9bf8eae/PHILOSOPHY.md
#   https://github.com/google-labs-code/design.md/tree/9bf8eae/packages/cli/src/linter (parser, model, 11 rules)
# 1. Front matter starts on line 1. Standard keys: version, name, description, omitted, colors, typography, rounded,
#    spacing, components. Invalid colours, type sizes or radii are lint errors, so `<...>` placeholders cannot go
#    there: those keys hold grey stand-ins. Font families may be any text.
# 2. `##` sections, when present, come in this order: Overview (or Brand & Style), Colors, Typography, Layout (or
#    Layout & Spacing), Elevation & Depth (or Elevation), Shapes, Components, Do's and Don'ts. Other `##` sections are
#    kept and not order-checked; ours follow Do's and Don'ts. A repeated heading makes the file invalid.
# 3. Extra top-level keys are allowed; the linter warns when one is a near-typo of a standard key or holds hex colours
#    or unit strings (120ms, 16px). So our data sits under `ui-evaluator:` as numbers, oklch() strings, words, lists.
# 4. Components take only backgroundColor, textColor, typography, rounded, padding, size, height, width. A colour no
#    component uses is reported as orphaned unless it has a Material role name (primary, surface, outline, error).
# 5. No ```yaml fences in the body: they are merged into the tokens, and a YAML error or repeated key drops every
#    token with one warning. "Lints clean" (DEC-02) means 0 errors and 0 warnings: npx @google/design.md lint DESIGN.md
version: alpha
name: "<Product name> interface"
description: "<One sentence: the product and the surfaces this file governs>"
# Every value below is a stand-in. Replace all of them in `direct` (or extract them from the build); never ship them.
colors:
  # Light-theme roles (COL-05). Greys carry no hue, so none is suggested. Each role maps to a ramp step in
  # ui-evaluator.role_steps; keep both in step. Non-Material names are used by a component below, so pairs get checked.
  surface: "oklch(0.985 0 0)"               # canvas
  surface-container: "oklch(0.96 0 0)"      # raised level 1: panels
  surface-container-high: "oklch(0.93 0 0)" # raised level 2: menus, dialogs
  on-surface: "oklch(0.25 0 0)"             # ink: body text
  on-surface-variant: "oklch(0.45 0 0)"     # secondary text; >= 4.5:1 on every surface it sits on (A11Y-11)
  outline: "oklch(0.56 0 0)"                # strong border: control edges, >= 3:1 against neighbours (A11Y-12)
  outline-variant: "oklch(0.88 0 0)"        # subtle border: dividers that carry no meaning
  primary: "oklch(0.40 0 0)"                # action: primary buttons, links
  primary-hover: "oklch(0.33 0 0)"          # action hover and pressed (CMP-01)
  on-primary: "oklch(0.99 0 0)"             # text and icons on action fills
  focus: "oklch(0.40 0 0)"                  # focus indicator, >= 3:1 against what it touches (A11Y-12)
  selection: "oklch(0.90 0 0)"              # selected rows and items
  error: "oklch(0.42 0 0)"                  # status roles: never the only cue (A11Y-19)
  on-error: "oklch(0.99 0 0)"
  success: "oklch(0.42 0 0)"
  on-success: "oklch(0.99 0 0)"
  warning: "oklch(0.42 0 0)"
  on-warning: "oklch(0.99 0 0)"
  info: "oklch(0.42 0 0)"
  on-info: "oklch(0.99 0 0)"
typography:
  # Type roles. Families are text placeholders. Sizes are stand-ins on a 1.25 ratio from a 1rem body, only so the
  # file lints; derive real sizes from ui-evaluator.type and each surface's mode (TYP-02, TYP-06).
  display: {fontFamily: "<display family, or the text family>", fontSize: 2.441rem, fontWeight: 600, lineHeight: 1.1}
  headline: {fontFamily: "<text family>", fontSize: 1.563rem, fontWeight: 600, lineHeight: 1.2}
  title: {fontFamily: "<text family>", fontSize: 1.25rem, fontWeight: 600, lineHeight: 1.3}
  body: {fontFamily: "<text family>", fontSize: 1rem, fontWeight: 400, lineHeight: 1.5}
  label: {fontFamily: "<text family>", fontSize: 0.875rem, fontWeight: 500, lineHeight: 1.25}
# Stand-in radius scale; nested corners stay concentric: inner radius <= outer radius minus padding (SHP-01).
rounded: {none: 0px, sm: 2px, md: 4px, lg: 8px, full: 9999px}
# Stand-in 4 px-based scale (LAY-01 default); name extra steps by role. page-edge: side margin below 768 px (LAY-05).
spacing: {xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px, page-edge: 16px}
components:
  # States are sibling keys (button-primary-hover); the full state model is in ui-evaluator.states. The linter checks
  # every text/background pair here at 4.5:1. Height 2.75rem = 44 px, the touch-primary target (CMP-06).
  page: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.body}"}
  panel: {backgroundColor: "{colors.surface-container}", textColor: "{colors.on-surface}", rounded: "{rounded.md}", padding: "{spacing.md}"}
  menu: {backgroundColor: "{colors.surface-container-high}", textColor: "{colors.on-surface}", rounded: "{rounded.md}"}
  meta-text: {backgroundColor: "{colors.surface-container-high}", textColor: "{colors.on-surface-variant}", typography: "{typography.label}"}
  button-primary: {backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.label}", rounded: "{rounded.md}", padding: "{spacing.sm}", height: 2.75rem}
  button-primary-hover: {backgroundColor: "{colors.primary-hover}", textColor: "{colors.on-primary}"}
  input: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.body}", rounded: "{rounded.sm}", height: 2.75rem}
  row-selected: {backgroundColor: "{colors.selection}", textColor: "{colors.on-surface}"}
  focus-ring: {backgroundColor: "{colors.focus}"}  # drawn as an outline in code; the spec has no outline property
  notice-error: {backgroundColor: "{colors.error}", textColor: "{colors.on-error}"}
  notice-success: {backgroundColor: "{colors.success}", textColor: "{colors.on-success}"}
  notice-warning: {backgroundColor: "{colors.warning}", textColor: "{colors.on-warning}"}
  notice-info: {backgroundColor: "{colors.info}", textColor: "{colors.on-info}"}
ui-evaluator:
  # Read by `uie` and the detectors (FRAMEWORK §4.2); other DESIGN.md tools ignore it.
  status: template      # template | as-built (extracted, not endorsed) | draft (direct running) | locked (DEC-03 recorded)
  surface_choices:      # design choices per surface; surfaces, their jobs and modes are declared only in PRODUCT.md (Surfaces)
    - {id: "<surface id from PRODUCT.md>", color_strategy: "<restrained | committed | full-palette | drenched>", motion: "<calm | balanced | bold>"}
  brand_attributes:     # 3-5 "X, not Y" pairs; critics look for each one in named elements (DES-04)
    - {is: "<attribute>", not: "<its near miss>"}
  themes:
    shipped: [light]    # add dark only when it ships; COL-04 then applies
    use_scene: "<who, where, in what light: this decides light or dark>"
    dark: {}            # dark ramps and role_steps, same shape as below
  ramps:                # >= 10 oklch() steps each, lightest first, chroma falling toward both ends (COL-05)
    neutral: "<list of oklch() steps; one temperature (COL-08)>"
    accent: "<list of oklch() steps>"
    status: "<optional: one ramp per status colour>"
  role_steps: {surface: neutral.1, surface-container: neutral.2, surface-container-high: neutral.3,
    outline-variant: neutral.6, outline: neutral.8, on-surface-variant: neutral.11, on-surface: neutral.12,
    primary: accent.9, primary-hover: accent.10, focus: accent.8, selection: accent.4}  # step jobs: COL-06
  type:
    scale_ratio: "<ratio>"                  # adjacent roles >= 1.25, or >= 1.125 on Operate surfaces (TYP-06)
    measure_chars: {latin_min: 45, latin_max: 75, cjk_max: 40}   # targets (TYP-04)
    families: "<text family; display family if different; monospace only for code or data>"   # TYP-05
    cjk_families: "<explicit CJK stack when zh, ja or ko ships (I18N-01); none otherwise>"
  layout: {breakpoints_px: "<the detected framework's set>", density: "<comfortable | compact | compact with a toggle>", layers: "<named z-index order>"}
  elevation: {approach: "<flat | borders | tonal surfaces | shadows>", shadows: {}}   # shadows: name -> box-shadow; at most 4 (SHP-02)
  motion:               # duration caps per role are in MOT-02; continuous indicators are out of its scope
    duration_ms: {feedback: "<n>", state: "<n>", overlay_enter: "<n>", overlay_exit: "<n>", scrim: "<n>", focal: "<n or none>", stagger: "<n>"}
    easing: {enter: "<cubic-bezier()>", exit: "<cubic-bezier()>", move: "<cubic-bezier()>"}
    frequency_budget: {keyboard_or_100_a_day: none, tens_a_day: "<opacity or colour, n>", occasional: "<state motion>", rare: "<focal moment or none>"}
    experience_sequences_per_screen: "<Experience surfaces only; default 1 (MOT-07)>"
    springs: none       # none | gestures | playful (playful declares overshoot as intended, MOT-03)
    reduced_motion: "<what remains: no spatial motion; opacity or colour feedback up to 150 ms; essential progress in a non-spatial form (MOT-04)>"
  states: {controls: [default, hover, focus-visible, active, disabled, loading, error, success],   # CMP-01...05
    data_views: [loading, empty, error, partial, stale], focus_style: "<ring or two-colour indicator; width, offset, colour role (CMP-08)>"}
  copy:                 # machine copy of "Voice and tone" below
    case: {buttons: sentence, headings: sentence, navigation: sentence, labels: sentence}   # CPY-03
    zh_address: "<你 | 您 | none>"   # one form per product, never mixed (PLAT-136); source and reason: PRODUCT.md
  direction: {roll_seed: "<seed from uie roll>", chosen: "<candidate id>", ledger_entry: "<id>"}
  declared_exceptions: []   # criteria QUALITY-BAR lets DESIGN.md relax (TYP-05, TYP-09, COL-01, LAY-01), each with a reason
  accepted_tells: []        # tells the brief asks for: {id: SLP-xx, scope, reason, cites: "<brief line>", decided_by, date}; never SLP-12 or SLP-13
  waivers: ".ui-evaluator/waivers.json"   # owner waivers live there, never here (QUALITY-BAR §2.3)
---

# [Product name] design system

Contents: Overview · Colors · Typography · Layout · Elevation & Depth · Shapes · Components · Do's and Don'ts · Motion · Voice and tone (with Glossary) · Direction contract · Decisions log

<!-- Prose says why; tokens hold values. New work: written in `direct` (METHODS §6). Shipped product: drafted with
`uie tokens extract` as `as-built`, never canonising a rejected pattern (IMP-051). Replace every [placeholder]. -->

## Overview

<!-- One specific referent from the audience's world instead of adjectives. In the words of the format's philosophy:
"Adjectives describe a region. A specific reference describes a point." On Operate and Read surfaces the referent is
never a costume of the tool the audience already uses. Then: who uses which surface (modes: PRODUCT.md), in what scene;
how each "X, not Y" attribute shows; what this must never become: the category default and its opposite (DEC-03). Two
contrasting attribute sets, for form only: a recycling service, "plain, not bureaucratic"; a poetry archive, "unhurried, not precious". -->

[Referent. Audience and scene. Attributes and where they show. What this is not.]

## Colors

<!-- Strategy per surface and why (COL-03); the job of each role and where the accent may appear; the neutral family
(COL-08); light, dark or both from the use scene (COL-04); status never shown by colour alone (A11Y-19). Name the
pairs that must pass A11Y-11 and A11Y-12 in every shipped theme. Rules: the skill's knowledge/color.md. -->

[Strategy, roles, accent jobs, neutrals, themes.]

## Typography

<!-- Families and the reason for each; a face on the dated saturated list needs a recorded reason (SLP-20). Roles and
their uses; scale ratio per mode (TYP-06); measure (TYP-04); line height, at least 1.5 for CJK (TYP-03); tracking only
with a reason (TYP-08); tabular figures where numbers line up. zh, ja, ko: explicit CJK families (I18N-01, I18N-03). -->

[Families and reasons, roles, scale, measure.]

## Layout

<!-- Spacing base and scale, breakpoints, grid or key lines, panes, content width, density and layers, each with a
reason (knowledge/layout.md). More space above a section heading than below it (LAY-03). Regions that scroll in two
dimensions on purpose are declared in .ui-evaluator/config.json (FUN-05). -->

[Spacing rhythm, breakpoints, grid, density.]

## Elevation & Depth

<!-- One depth approach and where each level is used; at most four shadow styles (SHP-02); in dark themes raised
surfaces get lighter, not darker (COL-04). -->

[Depth approach and levels.]

## Shapes

<!-- The radius scale and which components use each step; concentric nesting (SHP-01); one large radius everywhere
needs a documented reason (SLP-23); one icon library and one stroke weight (SLP-24). -->

[Radius scale and icon style.]

## Components

<!-- Components in use and their tokens. Record the decisions in knowledge/components-states.md §3: state model, focus
style, disabled policy, validation timing, saving model, required/optional marking, button hierarchy, message
severity, loading, empty states, undo or confirm, tooltip delays. Touch-primary controls ≥ 44 × 44 CSS px (CMP-06). -->

[Components and their states.]

## Do's and Don'ts

<!-- Short and specific; each line traces to a decision above, and the category default and its predictable opposite
appear as Don'ts. Form only, from two different products:
- Do keep the accent for the one action that moves a shipment to its next stage. (logistics dashboard)
- Don't animate table rows when filters change; dispatchers filter many times an hour. (logistics dashboard)
- Do keep each poem's own line breaks; never reflow verse to fit a card. (poetry archive) -->

- Do [...]
- Don't [...]

## Motion

<!-- Motion character and frequency budget in words; the focal moment or "none" (MOT-07); a motion table: purpose,
class (state, overlay, focal, frequent), reduced-motion substitute (MOT-04). No layout properties animate (MOT-01). -->

[Motion character, focal moment, motion table.]

## Voice and tone

<!-- One voice everywhere; the tone moves with the situation. Place the voice on NN/g's four tone dimensions with a
reason each; then case, person and Chinese form of address. Rules and two examples: knowledge/content-copy.md §3. -->

| Dimension | Position | Reason |
|---|---|---|
| Formal ↔ casual | [position] | [reason] |
| Serious ↔ funny | [position] | [reason] |
| Respectful ↔ irreverent | [position] | [reason] |
| Matter-of-fact ↔ enthusiastic | [position] | [reason] |

- Case per element type: [sentence case for buttons, headings, navigation and labels, or the exception and its reason] (CPY-03; also in ui-evaluator.copy.case)
- Person: [the user is "you"; whether the product says "we" outside error messages; "my" or "your" for the user's things, not both]
- Chinese form of address: [你 or 您, or "no zh locale"], never mixed (PLAT-136). The choice and its reason are recorded in PRODUCT.md, Platforms and locales; keep the two identical.

### Glossary

<!-- One term per concept (CPY-05, CPY-07). Object nouns come from the users' own words in PRODUCT.md (Users and groups).
One verb per action, with its meaning. A navigation entry's label equals the title of the page it opens. -->

| Kind | Term in the UI | Meaning | Not |
|---|---|---|---|
| object | [the users' noun] | [what it is] | [synonyms to avoid] |
| action | [one verb] | [what happens, e.g. removes from the list or deletes for good] | [other verbs for it] |
| destination | [navigation label, identical to the page title] | [the page it opens] | [variants] |

## Direction contract

<!-- Written in `direct` (METHODS §6, DEC-03), about 150 words. Never copy it into shipped code, comments, data
attributes or markup (IMP-009). The seed and the chosen candidate are also in ui-evaluator.direction. -->

- Thesis: [the one idea, and the category-default arrangement it refuses]
- Own world: [palette and component language that stay recognisable with the content removed]
- Story: [what a visitor understands first, second and third]
- First viewport: [exact composition, and where the primary action sits]
- Form: [the structural form the surfaces take]
- Roll: [seed, the three dealt candidates, the one chosen and why]
- References: [three or more from outside the category, one or two inside; principles taken, never assets]
- Off-limits: [the category default]; [its predictable opposite]
- Convergence tests: [similar-prompt, category-guess and swap results, and what changed after each]

## Decisions log

<!-- One row per visible decision, newest last (P2). Known trade-offs too, so evaluators mark them `trade_off`. -->

| Date | Decision | Reason | Decided by |
|---|---|---|---|
| [YYYY-MM-DD] | [decision] | [reason tied to PRODUCT.md, a mode, a test or a finding] | [owner or role] |

Accepted tells: `ui-evaluator.accepted_tells` in the front matter, each with scope, reason, the brief line it cites, who decided and the date; fabricated proof (SLP-12) and placeholder identities (SLP-13) can never be accepted. Waived criteria: `.ui-evaluator/waivers.json`.
