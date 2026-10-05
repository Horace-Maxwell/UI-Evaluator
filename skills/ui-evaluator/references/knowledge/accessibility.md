# Accessibility

This file covers WCAG 2.2 Level AA for web UIs: the build-time floor, the G2 criteria A11Y-01 to A11Y-21 and A11Y-27 (thresholds repeated exactly from QUALITY-BAR), advisory rules A11Y-22 to A11Y-26, how UI-Evaluator verifies each of the 55 success criteria, keyboard models for custom widgets, and what a person checks for L3. Read §3.1 before building any UI, §2 and §6 before an audit, and §4 before fixing an accessibility finding. Neighbours: colour roles and the advisory contrast readings (COL-13, COL-14) in [color.md](color.md); focus styling, forms and dialogs as components in [components-states.md](components-states.md); reduced motion in [motion.md](motion.md); reflow technique in [layout.md](layout.md); text size and zoom in [typography.md](typography.md); CJK input and typesetting in [cjk.md](cjk.md); error and label wording in [content-copy.md](content-copy.md); platform conventions in [platforms.md](platforms.md).

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules): [normative target](#21-normative-target) · [gate rules A11Y-01 to A11Y-21](#22-gate-rules-g2) · [advisory rules A11Y-22 to A11Y-26](#23-advisory-rules)
3. [Decisions to make (for direct/build)](#3-decisions-to-make-for-directbuild)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
6. [Coverage of the 55 success criteria](#6-coverage-of-the-55-success-criteria)
7. [Contrast in detail](#7-contrast-in-detail)
8. [Target size and its exceptions](#8-target-size-and-its-exceptions)
9. [Keyboard models for composite widgets](#9-keyboard-models-for-composite-widgets)
10. [Forced colours, increased contrast and CVD evidence](#10-forced-colours-increased-contrast-and-cvd-evidence)
11. [Screen-reader semantics from ARIA snapshots](#11-screen-reader-semantics-from-aria-snapshots)
12. [Cognitive accessibility](#12-cognitive-accessibility)
13. [The L3 needs-human checklist](#13-the-l3-needs-human-checklist)
- [Sources](#sources)

## 1. Principles

1. **A floor, not a feature.** WCAG 2.2 AA is the minimum. It overrides taste and the brief, and a G2 failure cannot be waived, only deferred, in which case the level that needs G2 is not reached [TOOL-01; FRAMEWORK P11].
2. **Constraints, not caution.** The floor fixes measurable limits and leaves the aesthetic open: contrast, focus and target size can be met in any palette and any style. Meet the numbers and keep the direction bold. A popular design skill kept accessibility out of build guidance to avoid timid output and then lost reduced motion for five releases [IMP C9].
3. **Native first.** HTML controls bring keyboard behaviour, semantics and forced-colours support with them. ARIA adds neither behaviour nor styling, and a role without its keyboard model misleads assistive technology [TOOL-09].
4. **Every state, theme and width.** Engines skip hidden content, and a pass in one state, theme or width says nothing about the others. Open each state and run the checks there [TOOL-03, TOOL-04].
5. **Coverage honesty.** Automation decides a minority of the 55 criteria: axe's default rules touch 19, most only in part, and in one government test 29% of seeded barriers were found by no tool. Label every criterion with how it was decided and never claim compliance from automation [TOOL-37].
6. **Measure, then judge, then ask a person.** Scripts settle what they can at E1, the accessibility auditor judges the rest with attached evidence, and a human closes what only people can perceive (L3).

## 2. Rules

### 2.1 Normative target

- **Standard.** WCAG 2.2 Level AA, W3C Recommendation (edition of 2024-12-12), approved as ISO/IEC 40500:2025. AA conformance covers 55 success criteria, 31 at Level A and 24 at AA. SC 4.1.1 Parsing is obsolete and removed; never report it [TOOL-01].
- **New in 2.2 at A and AA:** 2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7 and 3.3.8. No engine has a rule for 3.2.6, 3.3.7, 3.3.8 or 4.1.3, and axe has none for 2.4.7 or 2.4.11, so scripted and judged checks carry them [08 §A3].
- **AAA as a guide only.** 2.3.3 (animation from interactions) underlies MOT-04, 2.4.13 (focus appearance) underlies CMP-02's metric, and 2.5.5 (44 px targets) underlies CMP-06. None of them is part of the target.
- **Not gates.** WCAG 3 is a Working Draft (2026-09-10) with no contrast algorithm. Neither WCAG 3 nor APCA ever decides pass or fail; APCA-style Lc is reported as COL-14 in [color.md](color.md) [TOOL-15].
- **Luminance.** Relative-luminance code uses the corrected 0.04045 threshold.
- **Regional standards.** China's GB/T 37668-2019 and Japan's JIS X 8341-3:2016 reference WCAG 2.0 and 2.1; meeting 2.2 AA in scope covers their WCAG content [08 §A1].
- **Judged failures count.** A verified agent-judged failure of any A or AA criterion is a G2 failure, so at least P1 (QUALITY-BAR §6), and is recorded against its SC in the coverage matrix.
- **Tools.** `uie audit --checks` names are canonical and `uie audit --help` lists them; the ones used here are `axe`, `keyboard` (Tab walk, focus visibility, focus obscuring, context change), `dialogs`, `layout` (reflow, text spacing, 200% text), `targets`, `contrast`, `forms`, `live-regions`, `lang`, `cross-page`, `cvd` (colour-vision and forced-colour captures), `census`, `states`, `motion` and `copy`. ARIA snapshots come from `uie capture`, interactions from `uie probe`, and static source rules from `uie lint`.

### 2.2 Gate rules (G2)

#### A11Y-01 · Engine scan
`gate G2` · `modes: all` · `status: active` · `verify: D (uie audit --checks axe)` · `wcag: many`
- **Rule.** axe-core with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` over all in-scope states × {320, 1280} × shipped themes. Threshold: **0 violations of any impact** (ADR-009).
- **Why.** Each violation is a located, confirmed barrier, and engine rules are the cheapest evidence there is. Minor-impact violations still block someone.
- **Check.** `@axe-core/playwright` on a page from a fresh browser context, re-run after each state recipe opens a menu, dialog, tab or error state. The `wcag22aa` tag is what enables the `target-size` rule, which is off by default. Record the engine version (4.13 as of 2026-10).
- **Fix.** Fix the token or shared component that produced the node, not the single instance, then re-run `uie audit --checks axe` on the same states.
- **Sources.** TOOL-02, TOOL-03, TOOL-04, TOOL-40.

#### A11Y-02 · Engine "needs review" items resolved
`gate G2` · `modes: all` · `status: active` · `verify: D/A (uie audit --checks contrast; accessibility auditor)`
- **Rule.** Every axe `incomplete` result is resolved by a scripted check or the accessibility auditor. Threshold: 0 unresolved.
- **Why.** `incomplete` marks where the engine gave up: text over images and gradients, overlapping layers, unusual widgets. Left alone, these gaps read as passes.
- **Check.** Contrast items are pixel-sampled by the contrast check. Other items go to the auditor, who records a verdict with a crop, the ARIA snapshot entry and the reason.
- **Fix.** Remove the ambiguity where you can (a solid backing behind text over a photo) rather than only annotating it.
- **Sources.** TOOL-02; METHODS §4.5.

#### A11Y-03 · Keyboard operability
`gate G2` · `modes: all` · `status: active` · `verify: I (uie audit --checks keyboard)` · `wcag: 2.1.1, 2.1.2, 2.4.3, 3.2.1`
- **Rule.** Keyboard: every interactive element is reachable; no trap; focus order follows visual order; no context change on focus. Threshold: 0 offenders.
- **Why.** People using a keyboard, a switch or a screen reader reach only what Tab reaches, and a trap ends their session.
- **Check.** Tab and Shift+Tab walks per state at 320 and 1280 px. The reachable set is compared with the clickable set (`onclick`, pointer cursor, interactive roles), each stop is activated with Enter or Space, and backward visual jumps and focus-triggered navigation, windows or modals are flagged.
- **Fix.** Replace clickable `div` and `span` elements with `<button>` or `<a href>` in the shared component, remove positive `tabindex`, and fix order in the DOM rather than with CSS `order` or absolute positioning.
- **Sources.** TOOL-05, TOOL-09, PLAT-043. Listeners attached by delegation can hide clickable elements from discovery [08 open question 2].

#### A11Y-04 · Focus visible
`gate G2` · `modes: all` · `status: active` · `verify: I/P (uie audit --checks keyboard)` · `wcag: 2.4.7`
- **Rule.** Focus visible: every tab stop produces a visible change (focused vs blurred crop diff). Threshold: 0 stops with 0 px change.
- **Why.** Without a visible indicator a keyboard user cannot tell where they are. No axe rule covers this.
- **Check.** Pixel diff of the focused crop against the blurred crop (bounding box plus 4 px) for every stop. Indicator quality above this floor is CMP-02, advisory until calibrated.
- **Fix.** One `:focus-visible` style built from the focus tokens (CMP-08 in [components-states.md](components-states.md)); never remove `outline` without a replacement, which `uie lint` flags.
- **Sources.** TOOL-06, IMP-020, PLAT-051.

#### A11Y-05 · Focus not obscured
`gate G2` · `modes: all` · `status: active` · `verify: I (uie audit --checks keyboard)` · `wcag: 2.4.11`
- **Rule.** Focus not obscured: the focused element is not entirely hidden by author content (Tab and Shift+Tab). Threshold: 0 offenders.
- **Why.** Sticky headers and footers, cookie bars and chat launchers cover the focused element, so the user tabs blind.
- **Check.** For every stop, in both directions, sample nine points of the focused box with `elementFromPoint`; fail when none lands on the focused element or its descendants.
- **Fix.** `scroll-padding-top` or `scroll-padding-bottom` on the scroll container equal to the sticky bar's height (technique C43); keep floating launchers out of the focus path.
- **Exceptions.** Content the user opened and can dismiss without moving focus; user-movable content is tested in its initial position.
- **Sources.** TOOL-07; failure F110; Understanding 2.4.11.

#### A11Y-06 · Modal dialog contract
`gate G2` · `modes: all` · `status: active` · `verify: I (uie audit --checks dialogs; uie probe)` · `wcag: 2.1.2, 2.4.3, 4.1.2`
- **Rule.** Modal dialogs: focus moves in, Tab wraps inside, Esc closes, focus returns to the invoker; correct dialog semantics. Threshold: 100% of dialogs.
- **Why.** A dialog that leaks focus to the page behind it, or drops focus on close, strands keyboard and screen-reader users.
- **Check.** Per dialog: open it from its state recipe, record the focused element, Tab and Shift+Tab past both ends, press Esc, record focus again; read the semantics from the ARIA snapshot (`role=dialog` with `aria-modal=true` and a name, or native `<dialog>` opened with `showModal()`).
- **Fix.** Use native `<dialog>` with `showModal()`, which makes the rest of the page inert; place initial focus as in §9; return focus to the invoker, or to the next logical place if the invoker is gone. Dialog design is CMP-20.
- **Sources.** TOOL-08; APG dialog (modal) pattern.

#### A11Y-07 · Reflow
`gate G2` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout)` · `wcag: 1.4.10`
- **Rule.** Reflow at 320 CSS px without two-dimensional scrolling (except 2-D content). Threshold: 0 offenders.
- **Why.** 320 CSS px is a 1280 px window at 400% zoom. People who zoom must not scroll both ways to read a line.
- **Check.** At 320 px, `documentElement.scrollWidth ≤ clientWidth + 1`, with the offending elements listed by box.
- **Fix.** Find the fixed-width element: `max-width: 100%`, `min-width: 0` on flex and grid children, `overflow-wrap: anywhere` for long strings, and a scroll region of their own for data tables ([layout.md](layout.md)).
- **Exceptions.** Content that needs two dimensions: data tables, maps, diagrams, code, games. For vertical writing the limit is a 256 CSS px height.
- **Sources.** TOOL-10, PLAT-019; FUN-05.

#### A11Y-08 · Text spacing
`gate G2` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout)` · `wcag: 1.4.12`
- **Rule.** Text-spacing override (line-height 1.5, paragraph spacing 2em, letter 0.12em, word 0.16em) causes no clipping or overlap. Threshold: 0 offenders.
- **Why.** People with dyslexia or low vision override spacing with user styles, and fixed-height boxes then cut their text off.
- **Check.** Inject the four overrides with `!important`; fail any `overflow: hidden` or `clip` element whose scroll size exceeds its client size, and any intersecting text boxes.
- **Fix.** Replace fixed heights on text containers with `min-height` or padding, and let truncated text wrap.
- **Exceptions.** A writing system that does not use a property is exempt from it (word spacing in Chinese and Japanese); line height and paragraph spacing still apply.
- **Sources.** TOOL-11; Understanding 1.4.12.

#### A11Y-09 · Text resize
`gate G2` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout)` · `wcag: 1.4.4`
- **Rule.** 200% text resize: no clipping or overlap; controls operable. Threshold: 0 offenders.
- **Why.** Many people enlarge only the text, not the whole page.
- **Check.** Root font size at 200%, then the clipping and overlap detection of A11Y-08; axe and `uie lint` catch `user-scalable=no` and `maximum-scale` below 2.
- **Fix.** Size text and text containers in `rem` or `em` rather than fixed `px` heights, and never disable zoom (TYP-19).
- **Sources.** TOOL-12, PLAT-019.

#### A11Y-10 · Target size
`gate G2` · `modes: all` · `status: active` · `verify: D (uie audit --checks targets)` · `wcag: 2.5.8`
- **Rule.** Targets ≥ 24 × 24 CSS px unless an SC 2.5.8 exception applies (spacing circle, equivalent, inline, user-agent, essential). Threshold: 0 failures after exceptions.
- **Why.** Small, crowded targets cause mis-taps for people with tremor or limited dexterity, and for anyone on a moving bus.
- **Check.** axe `target-size` plus our own geometry with the 24 px circle test at every viewport (§8).
- **Fix.** Grow the hit area with padding or a pseudo-element while keeping the glyph, or add spacing; never trade target size for density.
- **Sources.** TOOL-13; EVAL C9. Touch-primary controls are also gated by CMP-06 (≥ 44 × 44, ≥ 8 px apart).

#### A11Y-11 · Text contrast
`gate G2` · `modes: all` · `status: active` · `verify: D/P/A (uie audit --checks contrast; accessibility auditor for the CJK band)` · `wcag: 1.4.3`
- **Rule.** Text contrast ≥ 4.5:1; large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1; computed on the composited background in every state and theme; text over images or gradients pixel-sampled. CJK text from 18 to 24 px that is not already large text by the bold rule, with contrast between 3:1 and 4.5:1, goes to the accessibility auditor instead of being auto-passed or auto-failed, and 1.4.3 is recorded as agent-judged whenever such text is in scope (ADR-032). Threshold: 0 failures.
- **Why.** Low contrast is the most widespread barrier: it hurts low vision, ageing eyes, glare and cheap screens alike.
- **Check.** Computed colours composited through every ancestor background, alpha and opacity layer; pixel sampling where the background is an image or gradient; rest, hover, focus, active, selected, visited, error and placeholder text; every shipped theme (§7). CJK text in the 18–24 px, 3:1–4.5:1 band is listed for the auditor, never passed or failed by the script (§5).
- **Fix.** Change the colour role token, not the instance ([color.md](color.md)); for text over media add a solid or scrim backing.
- **Exceptions.** Text in inactive components, pure decoration, invisible text, incidental text in pictures, and logotypes.
- **Sources.** TOOL-14, IMP-015, PLAT-061; ADR-032.

#### A11Y-12 · Non-text contrast
`gate G2` · `modes: all` · `status: active` · `verify: D/P (uie audit --checks contrast)` · `wcag: 1.4.11`
- **Rule.** Non-text contrast ≥ 3:1 for component boundaries needed to identify controls, icons conveying meaning, graphical objects needed to understand content (chart marks, data points), focus indicators and state indicators. Threshold: 0 failures.
- **Why.** A field whose border fades into the page, a checkbox with a faint tick, or a chart line lost against its grid cannot be found or read.
- **Check.** Computed border, outline and fill colours against the adjacent colours, and pixel sampling for icons, rings and chart marks, in every state and theme.
- **Fix.** Use a border role meant for interactive boundaries (decorative outline roles are for separators) and the contrast-checked focus token.
- **Exceptions.** Inactive components; browser-default appearance the author did not change; boundaries not needed to identify the control, such as a filled button already identified by its readable label.
- **Sources.** TOOL-14, PLAT-051, PLAT-065.

#### A11Y-13 · Forms
`gate G2` · `modes: all` · `status: active` · `verify: I (uie audit --checks forms)` · `wcag: 1.3.1, 1.3.5, 3.3.1, 3.3.2`
- **Rule.** Forms: visible persistent label for every input (no placeholder-only labels); errors in text with `aria-invalid` and programmatic association; focus moves to the first error or an error summary; `autocomplete` on personal-data fields. Threshold: 0 failures.
- **Why.** Placeholders vanish while typing; unannounced errors leave screen-reader users guessing; without `autocomplete`, people who rely on autofill must type everything.
- **Check.** The forms probe submits empty and invalid values, asserts error text, `aria-invalid=true`, association through `aria-describedby` or `aria-errormessage`, and focus placement, and lists personal-data fields without a valid token. axe passes placeholder-only inputs, so the probe decides.
- **Fix.** A visible `<label for>` in the shared field component (CMP-17), an error summary that links to each field (CMP-18), and tokens such as `name`, `email`, `tel` and `street-address`. Error wording is CPY-04 and CPY-09 in [content-copy.md](content-copy.md).
- **Sources.** TOOL-21, PLAT-094, PLAT-100.

#### A11Y-14 · Accessible authentication
`gate G2` · `modes: all` · `status: active` · `verify: I/S (uie audit --checks forms; uie lint)` · `wcag: 3.3.8`
- **Rule.** Authentication: paste allowed in password and OTP fields; correct `autocomplete` tokens; no cognitive function test without an alternative or assistance mechanism (SC 3.3.8 exceptions for object-recognition and personal-content tests apply). Threshold: 0 failures.
- **Why.** Blocking paste and password managers forces people to remember and transcribe, which is exactly the burden 3.3.8 removes.
- **Check.** The forms probe pastes into each credential field and reads the tokens (`current-password`, `new-password`, `one-time-code`); puzzle and CAPTCHA steps go to the auditor.
- **Fix.** Remove paste blocking, add the tokens, and offer an alternative to any puzzle, such as an emailed link or a passkey.
- **Exceptions.** As in SC 3.3.8: object-recognition tests and tests that identify non-text content the user provided to the site. Prefer offering an alternative anyway; these tests still burden many people.
- **Sources.** TOOL-22; Understanding 3.3.8.

#### A11Y-15 · Status messages
`gate G2` · `modes: all` · `status: active` · `verify: I (uie audit --checks live-regions; uie probe)` · `wcag: 4.1.3`
- **Rule.** Status messages from async actions are exposed through `role=status`, `alert` or a live region without moving focus. Threshold: 0 failures in exercised actions.
- **Why.** Sighted users see the confirmation appear; screen-reader users hear nothing unless it lands in a live region.
- **Check.** Trigger save, add, search, filter and upload in each journey; assert that the outcome text appears in a live region and that focus stays where it was.
- **Fix.** One persistent, initially empty `role="status"` region (`role="alert"` for errors) in the layout before the update, with the text written into it; `aria-busy` while a region reloads.
- **Sources.** TOOL-23; PLAT-090.

#### A11Y-16 · Language
`gate G2` · `modes: all` · `status: active` · `verify: D (uie audit --checks lang)` · `wcag: 3.1.1, 3.1.2`
- **Rule.** `lang` present and matching the dominant script of the content; mixed-language runs tagged; Chinese tagged with a region or script subtag (`zh-CN`, `zh-TW`, `zh-HK`, `zh-Hans`, `zh-Hant`), never bare `zh` when both scripts ship. Threshold: 0 failures.
- **Why.** `lang` selects the screen-reader voice and, for Han characters, the regional glyph forms. axe accepts any valid tag, even `lang="en"` on a Chinese page.
- **Check.** Han, Kana, Hangul and Latin character ratios per element compared with the computed language.
- **Fix.** Set `<html lang>` from the active locale in the shared layout, and add `lang` to quotations, names and strings in another language.
- **Sources.** TOOL-19, PLAT-130; [cjk.md](cjk.md).

#### A11Y-17 · Pointer and keyboard static checks
`gate G2` · `modes: all` · `status: active` · `verify: S (uie lint)` · `wcag: 2.5.2, 2.1.4, 2.5.7, 2.5.4`
- **Rule.** Pointer and keyboard static checks: no down-event-only activation, no unmodified single-character shortcuts without a remap or off switch, dragging has a single-pointer alternative, motion actuation has an alternative. Threshold: 0 failures.
- **Why.** Down-event actions cannot be cancelled by sliding away; single-key shortcuts fire during speech input; drag-only and shake-only actions exclude people who cannot perform them.
- **Check.** `uie lint` finds `mousedown`, `pointerdown` and `touchstart` actions, `keydown` handlers on bare printable keys, drag handlers without a click or key path, and `devicemotion` or `deviceorientation` handlers; the auditor confirms alternatives with `uie probe`.
- **Fix.** Activate on `click`; scope shortcuts to focus, or add a modifier and a setting to turn them off; add move buttons or click-to-place beside drag; add a button for any motion gesture.
- **Sources.** TOOL-42.

#### A11Y-18 · Cross-page consistency
`gate G2` · `modes: all` · `status: active` · `verify: D (uie audit --checks cross-page)` · `wcag: 3.2.3, 3.2.4, 3.2.6`
- **Rule.** Cross-page consistency: navigation order, names of identical functions, help placement. Threshold: 0 inconsistencies.
- **Why.** People with cognitive or visual impairments learn where things are, and moving them between pages breaks that learning.
- **Check.** Across in-scope routes: link order in the navigation landmark, accessible names for the same destination or action, and the relative order of help mechanisms (contact details, contact form or chat, self-help, chatbot).
- **Fix.** Render navigation and help from one shared layout component.
- **Exceptions.** Changes the user initiated. WCAG requires consistency where help exists, not that help exists.
- **Sources.** TOOL-41; Understanding 3.2.6.

#### A11Y-19 · Colour is not the only cue
`gate G2` · `modes: all` · `status: active` · `verify: P/A (uie audit --checks cvd; accessibility auditor)` · `wcag: 1.4.1`
- **Rule.** Colour is not the only visual means of conveying information: status, series, links and required markers stay distinguishable under deuteranopia, protanopia, tritanopia and achromatopsia emulation. Threshold: 0 failures.
- **Why.** Colour-vision deficiency, monochrome screens and forced-colour modes all erase hue.
- **Check.** CVD captures from `uie audit --checks cvd`; the auditor compares each colour-coded element across the four simulations (§10).
- **Fix.** Add a second cue (text, icon, shape, pattern or position), underline links in running text, and separate paired colours in lightness (COL-15).
- **Sources.** TOOL-16, HCI-068, PLAT-062.

#### A11Y-20 · Coverage matrix
`gate G2` · `modes: all` · `status: active` · `verify: S (uie gates; uie report)` · `wcag: all`
- **Rule.** Coverage matrix: each of the 55 criteria labelled with how it was covered (auto, scripted, agent-judged, needs-human, not-tested) and its state; no "compliant" claim. Threshold: present; needs-human items listed.
- **Why.** A clean scan proves only that the cheap rules passed. The matrix shows what this run actually decided, and how.
- **Check.** `uie gates` requires the matrix; `uie report` lints claims such as "compliant" or "fully accessible" (EVD-06).
- **Fix.** Record for each criterion the last method needed to decide it (§6) and its state; a fail at any step makes the state fail, whatever the method.
- **Sources.** TOOL-37.

#### A11Y-21 · Human completion at L3
`gate G2` · `modes: all` · `status: active` · `verify: H (owner or named expert)` · `wcag: various`
- **Rule.** (L3) Needs-human criteria completed by a human: screen-reader pass of critical journeys, meaningful sequence, captions, sensory characteristics and similar. Threshold: 100% of applicable items.
- **Why.** Some barriers show only when a person listens, reads or watches. A simulated screen-reader transcript helps the auditor but is not this pass.
- **Check.** The completed §13 checklist, with tester, assistive technology, browser, versions, date and result per item.
- **Fix.** Each failed item becomes a finding at E2 and enters the normal queue.
- **Sources.** TOOL-37, TOOL-44.

#### A11Y-27 · No verified judged WCAG failure
`gate G2` · `modes: all` · `status: active` · `verify: A (accessibility auditor, heuristic evaluators, verifier)` · `wcag: various`
- **Rule.** No verified judged WCAG failure: success criteria without a dedicated G2 row (e.g. 1.3.4, 1.4.5, 1.4.13, 2.4.5, 2.4.6, 2.5.1, 2.5.3, 3.2.2, 3.3.3, 3.3.7) still fail G2 when a confirmed finding cites them. Threshold: 0 open confirmed findings citing a WCAG 2.2 A/AA criterion.
- **Why.** Many success criteria have no engine rule and no script. Without this criterion, a verified failure of one of them could not block L1, although it is a conformance failure like any other.
- **Check.** `uie gates` lists confirmed findings whose criteria include a WCAG success criterion and whose status is still active.
- **Fix.** As for the cited criterion (§6 table). Candidates for future scripted checks: 2.5.3 (label in name), 3.2.2 (change on input), 1.4.13 (hover or focus content) and 1.3.4 (orientation).
- **Sources.** TOOL-37; §6.

### 2.3 Advisory rules

Advisory rules are reported and never gate. QUALITY-BAR's G2 advisory items map to A11Y-22 (forced colours), A11Y-23 (touch targets) and COL-14 in [color.md](color.md) (APCA-style Lc); the 7:1 aim for long-form body text is COL-13 there.

#### A11Y-22 · Forced-colours visibility
`level: advisory` · `modes: all` · `status: active` · `verify: P/A (uie audit --checks cvd; accessibility auditor)`
- **Rule.** Under `forced-colors: active`, focus indicators, control borders, meaningful icons and selected states stay visible, and colour-coded chips keep a text or icon cue.
- **Why.** Forced colours replace author colours and drop `box-shadow`, so rings, borders and states drawn with shadows or backgrounds vanish for people using contrast themes.
- **Check.** Forced-colours captures compared with default captures by the auditor (§10).
- **Fix.** Draw focus with `outline`, use system colours inside `@media (forced-colors: active)`, and reserve `forced-color-adjust: none` for content that manages its own contrast.
- **Sources.** TOOL-17, PLAT-069; CSS Color Adjustment 1 §3.

#### A11Y-23 · Comfortable touch targets
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks targets)`
- **Rule.** On touch viewports, every control meets the profile's comfort size: 44 × 44 (Apple default) or 48 × 48 (Material), as set in [platforms.md](platforms.md).
- **Why.** 24 px is the WCAG floor, not a comfortable thumb target.
- **Check.** Target geometry on the touch viewports that CMP-06 uses: matrix entries captured with touch emulation, by default every width below 1024 CSS px (ADR-032).
- **Fix.** Prefer the larger control size on touch layouts; extend the hit area beyond the glyph when the visual must stay small.
- **Exceptions.** Primary controls are gated by CMP-06 (G3); this advisory covers the rest.
- **Sources.** TOOL-13, PLAT-040.

#### A11Y-24 · Increased-contrast preference
`level: advisory` · `modes: all` · `status: active` · `verify: P/A (uie capture, increased contrast; accessibility auditor)`
- **Rule.** Under `prefers-contrast: more`, borders and focus indicators stay visible and nothing is lost; a shipped high-contrast theme passes every A11Y-11 and A11Y-12 pair.
- **Why.** People who ask their system for more contrast expect pages to follow; translucent layers and faint borders are the usual casualties.
- **Check.** Captures under increased-contrast emulation, reviewed by the auditor, plus the contrast check inside any high-contrast theme.
- **Fix.** A `@media (prefers-contrast: more)` block that switches to stronger border and text roles and makes translucent surfaces solid.
- **Sources.** PLAT-069; QUALITY-BAR §2.4.

#### A11Y-25 · Composite widgets follow their keyboard model
`level: advisory` · `modes: all` · `status: active` · `verify: I/A (uie probe; accessibility auditor)`
- **Rule.** Each custom composite widget (tabs, menu, listbox, combobox, grid, tree, radio group, toolbar) is one tab stop with the arrow-key model of its APG pattern (§9), and its ARIA states change when it changes.
- **Why.** Assistive technology announces the role, and users then press the keys that role implies; a role without its model is worse than no role.
- **Check.** `uie probe` key sequences from §9, with ARIA snapshots before and after to confirm that `aria-selected`, `aria-expanded`, `aria-checked` or `aria-activedescendant` change.
- **Fix.** Use the native element; otherwise implement roving `tabindex` or `aria-activedescendant` in the shared component.
- **Exceptions.** Failures that leave content unreachable or unnamed are gated by A11Y-01, A11Y-03 or A11Y-06 instead.
- **Sources.** TOOL-09, TOOL-24; APG patterns.

#### A11Y-26 · Heading outline and landmarks
`level: advisory` · `modes: all` · `status: active` · `verify: D/A (uie capture ARIA snapshots; accessibility auditor)`
- **Rule.** One `h1` per page, no skipped heading levels, no bold paragraphs posing as headings; `banner`, `navigation`, `main` and `contentinfo` landmarks present, with repeated landmarks named.
- **Why.** Screen-reader users move by headings and landmarks, and a broken outline hides the structure sighted users see (1.3.1, 2.4.1, 2.4.6).
- **Check.** Heading and landmark outline from the ARIA snapshot, compared with the visual hierarchy in the screenshot.
- **Fix.** Correct the element, not its styling: the heading level follows document position and the size follows the type role ([typography.md](typography.md)).
- **Sources.** PLAT-020; 08 §A3.

## 3. Decisions to make (for direct/build)

### 3.1 The build-time floor

These are constraints. Meet them inside the chosen direction: none of them asks for a quieter design.

| Constraint | Limit | Criterion |
|---|---|---|
| Text contrast | 4.5:1, or 3:1 at ≥ 24 px or ≥ 18.66 px bold, in every state and theme you ship | A11Y-11 |
| Non-text contrast | 3:1 for control boundaries, meaningful icons, chart marks, focus indicators and state indicators | A11Y-12 |
| Focus visible | a `:focus-visible` indicator on every focusable element; `outline` never removed without a replacement | A11Y-04, CMP-02 |
| Keyboard | everything a pointer can do works with Tab, Enter, Space and arrows; order follows reading order; Esc closes overlays | A11Y-03, A11Y-06 |
| Native controls | `button`, `a href`, `input`, `select`, `dialog`, `details` first; ARIA only for widgets HTML lacks, with its whole keyboard model | A11Y-25 |
| Labels | a visible, persistent label on every input; errors in text and tied to the field | A11Y-13 |
| Targets | ≥ 24 × 24 CSS px everywhere; ≥ 44 × 44 for touch-primary controls | A11Y-10, CMP-06 |
| Reduced motion | every animation has a `prefers-reduced-motion` path ([motion.md](motion.md)) | MOT-04 |
| Language | `lang` matches the content, with regional tags for Chinese | A11Y-16 |

`uie lint`, and the per-edit hook where installed, flags outline removal, `user-scalable=no`, positive `tabindex`, down-event activation, single-key shortcuts and missing IME guards while you build, when they cost least to fix.

### 3.2 Record in DESIGN.md

- The focus indicator tokens (colour, width, offset) and their contrast against every surface they can sit on.
- Contrast pairs for each text and border role in each shipped theme, including a high-contrast theme if there is one.
- Which composite widgets are custom rather than native, and the APG pattern each follows.
- The touch target size for the platform profile (44 or 48) and the control heights.
- The reduced-motion substitute for each motion token (MOT-19).
- How `prefers-contrast` and `forced-colors` are handled.

## 4. How to fix common failures

Fix at the narrowest correct layer: the token when the value is wrong everywhere, the shared component when the structure is wrong, the instance only when one place differs [IMP-045]. Then re-run the originating check, diff the ARIA snapshot and re-run axe on the touched states (FRAMEWORK §10). Each rule's **Fix** line gives the specific remedy; this table indexes the common cases.

| Failure | Narrowest correct fix | Verify with |
|---|---|---|
| Text role under 4.5:1 | the role token, per theme | `uie audit --checks contrast` in every theme and state |
| Text over a photo or gradient | a solid or scrim backing in the component | `uie audit --checks contrast` (pixel-sampled) |
| `outline: none` without a replacement | one shared `:focus-visible` style | `uie lint`; `uie audit --checks keyboard` |
| Focus hidden by a sticky bar | `scroll-padding` on the scroll container | `uie audit --checks keyboard` (both directions) |
| Clickable `div` | a real `button` or `a href` in the component | `uie audit --checks keyboard,axe`; `uie diff <base> <run> --aria` |
| Placeholder used as the label | a visible `label` in the field component | `uie audit --checks forms` |
| Errors not announced or not linked | `aria-invalid`, `aria-describedby`, a summary that takes focus | `uie audit --checks forms` |
| Target under 24 px | padding or a pseudo-element hit area, or more spacing | `uie audit --checks targets` |
| Sideways scroll at 320 px | remove fixed widths; `min-width: 0`; a scroll region for tables | `uie audit --checks layout` |
| Clipping under text spacing | `min-height` instead of `height` | `uie audit --checks layout` |
| Custom dialog leaks focus | native `dialog` with `showModal()`; restore focus on close | `uie audit --checks dialogs`; `uie probe` |
| Async result not announced | a persistent `role="status"` region | `uie probe` the action; `uie audit --checks live-regions` |
| Wrong or missing `lang` | set it from the locale in the layout | `uie audit --checks lang` |
| Status shown by colour alone | add an icon or text | `uie audit --checks cvd` |
| Paste blocked on credentials | remove the handler; add the tokens | `uie audit --checks forms` |
| Drag-only reordering | move buttons or click-to-place | `uie probe` |

## 5. CJK and localisation notes

- **Language tags.** `lang` drives the voice and the regional glyph forms, and axe misses valid but wrong tags (A11Y-16). Regional tags and mixed-script runs are I18N-13 in [cjk.md](cjk.md).
- **Large text in CJK.** WCAG allows an equivalent size for CJK "large scale" text but gives no number. UI-Evaluator keeps the Latin cut-off and sends CJK text from 18 to 24 px that is not already large text by the bold rule, with contrast between 3:1 and 4.5:1, to the auditor instead of auto-passing or auto-failing it, so 1.4.3 is recorded as agent-judged whenever such text is in scope (A11Y-11; ADR-032). Adopting a national number is an open question [08 §A9, open question 4].
- **Text spacing.** Word spacing has no effect on scripts without inter-word spaces, but the line-height and paragraph-spacing overrides still apply to CJK (A11Y-08).
- **IME composition.** Enter-to-submit handlers must ignore keys during composition (`event.isComposing`, or key code 229); `uie lint` flags missing guards; the rule is I18N-14 in [cjk.md](cjk.md) [TOOL-20].
- **Vertical writing.** Reflow uses a 256 CSS px height, and the inline target exception measures line height across the text flow.
- **Expansion and direction.** Translated text grows 30–40% and RTL layouts mirror; reflow and text-spacing checks catch most of the resulting clipping, and the hardening fixtures (CMP-22, I18N-15) cover the rest [IMP-048].

## 6. Coverage of the 55 success criteria

How to read a row: **auto** is an engine rule (axe 4.13 with the tags of A11Y-01); **scripted** is a `uie audit` check, `uie probe`, a `uie capture` ARIA snapshot or `uie lint`; **judged** is the accessibility auditor with attached evidence; **human** needs a person at L3. The last method in a row is the coverage method the matrix records (A11Y-20); the state is recorded beside it, and a fail at any step makes it fail. "—" means no dedicated G2 criterion: the matrix still records the SC, and a verified failure still counts as a G2 failure (§2.1). Criterion names are paraphrased.

| SC | Lvl | Criterion | How UI-Evaluator verifies | Gate criteria |
|---|---|---|---|---|
| 1.1.1 | A | Non-text content | auto (image-alt, svg-img-alt, role-img-alt, input-image-alt) + judged (alt is equivalent, or the image is correctly decorative) | A11Y-01 |
| 1.2.1 | A | Audio-only and video-only, prerecorded | human (transcript or alternative present and accurate) | A11Y-21 |
| 1.2.2 | A | Captions, prerecorded | auto (video-caption: a captions track exists) + human (accurate and in sync) | A11Y-01, A11Y-21 |
| 1.2.3 | A | Audio description or media alternative | human | A11Y-21 |
| 1.2.4 | AA | Captions, live | human | A11Y-21 |
| 1.2.5 | AA | Audio description, prerecorded | human | A11Y-21 |
| 1.3.1 | A | Info and relationships | auto (list, listitem, th-has-data-cells, aria-required-children) + scripted (`forms`; ARIA snapshot outline) + judged (visual structure vs ARIA outline) | A11Y-01, A11Y-13 |
| 1.3.2 | A | Meaningful sequence | scripted signal (ARIA snapshot order vs visual boxes; CSS `order`, grid placement) + human | A11Y-21 |
| 1.3.3 | A | Sensory characteristics | judged (copy scanned for shape, position, colour or sound-only instructions) + human | A11Y-21 |
| 1.3.4 | AA | Orientation | judged (`uie probe` at portrait and landscape viewports; no orientation lock) | — |
| 1.3.5 | AA | Identify input purpose | auto (autocomplete-valid, for tokens present) + scripted (`forms`: personal-data fields missing tokens) | A11Y-01, A11Y-13 |
| 1.4.1 | A | Use of colour | auto (link-in-text-block) + scripted (`cvd` captures) + judged | A11Y-01, A11Y-19 |
| 1.4.2 | A | Audio control | auto (no-autoplay-audio) | A11Y-01 |
| 1.4.3 | AA | Contrast, minimum | auto (color-contrast) + scripted (`contrast`: composited, pixel-sampled, all states and themes) + judged (CJK text of 18–24 px at 3:1–4.5:1, whenever such text is in scope, §5) | A11Y-01, A11Y-02, A11Y-11 |
| 1.4.4 | AA | Resize text | auto (meta-viewport) + scripted (`layout`: text at 200%) | A11Y-01, A11Y-09 |
| 1.4.5 | AA | Images of text | judged (raster or canvas text in captures) | — |
| 1.4.10 | AA | Reflow | scripted (`layout` at 320 px) | A11Y-07 |
| 1.4.11 | AA | Non-text contrast | scripted (`contrast`: boundaries, icons, chart marks, focus and state indicators) | A11Y-12 |
| 1.4.12 | AA | Text spacing | scripted (`layout`: spacing overrides injected) | A11Y-08 |
| 1.4.13 | AA | Content on hover or focus | scripted (`uie probe`: Esc dismisses without moving the pointer, the pointer can move onto it, it persists) + judged; see CMP-21 | — |
| 2.1.1 | A | Keyboard | auto (scrollable-region-focusable, frame-focusable-content) + scripted (`keyboard`) | A11Y-01, A11Y-03 |
| 2.1.2 | A | No keyboard trap | scripted (`keyboard`: the walk wraps; Esc leaves modal widgets) | A11Y-03, A11Y-06 |
| 2.1.4 | A | Character key shortcuts | scripted (`uie lint`) + judged (remap, off switch or focus-only) | A11Y-17 |
| 2.2.1 | A | Timing adjustable | auto (meta-refresh) + judged (session timeouts, auto-advancing steps) | A11Y-01 |
| 2.2.2 | A | Pause, stop, hide | auto (blink, marquee) + scripted (`motion`: infinite animations) + judged (auto-advance over 5 s without a pause control) | A11Y-01 |
| 2.3.1 | A | Three flashes or below threshold | scripted signal (`motion`: short-period infinite animations) + human (flashes faster than 3 per second, video) | A11Y-21 |
| 2.4.1 | A | Bypass blocks | auto (bypass) + scripted (`keyboard`: the first stop is a working skip link) | A11Y-01 |
| 2.4.2 | A | Page titled | auto (document-title) + judged (descriptive and unique per route) | A11Y-01 |
| 2.4.3 | A | Focus order | scripted (`keyboard`: order vs visual order; `dialogs`: focus in and back) | A11Y-03, A11Y-06 |
| 2.4.4 | A | Link purpose in context | auto (link-name) + scripted (`copy`: generic link text) + judged | A11Y-01, CPY-02 (G3, not waivable) |
| 2.4.5 | AA | Multiple ways | judged (navigation plus search or a sitemap, site-wide) | — |
| 2.4.6 | AA | Headings and labels | judged (they describe topic or purpose) | — (A11Y-26 advisory) |
| 2.4.7 | AA | Focus visible | scripted (`keyboard`: focused vs blurred crop diff) | A11Y-04 |
| 2.4.11 | AA | Focus not obscured, minimum | scripted (`keyboard`: point sampling in both directions) | A11Y-05 |
| 2.5.1 | A | Pointer gestures | judged (multipoint and path gestures have single-pointer controls) | — |
| 2.5.2 | A | Pointer cancellation | scripted (`uie lint`: down-event actions) | A11Y-17 |
| 2.5.3 | A | Label in name | scripted signal (ARIA snapshot: visible label text inside the accessible name) + judged | — |
| 2.5.4 | A | Motion actuation | scripted (`uie lint`: device-motion handlers) + judged | A11Y-17 |
| 2.5.7 | AA | Dragging movements | scripted (`uie lint`: drag-only handlers) + judged (`uie probe` alternative) | A11Y-17 |
| 2.5.8 | AA | Target size, minimum | auto (target-size, enabled by `wcag22aa`) + scripted (`targets`: circle test) | A11Y-01, A11Y-10 |
| 3.1.1 | A | Language of page | auto (html-has-lang, html-lang-valid) + scripted (`lang`: script vs tag) | A11Y-01, A11Y-16 |
| 3.1.2 | AA | Language of parts | auto (valid-lang) + scripted (`lang`: untagged runs in another script) | A11Y-01, A11Y-16 |
| 3.2.1 | A | On focus | scripted (`keyboard`: no navigation, window or modal on focus alone) | A11Y-03 |
| 3.2.2 | A | On input | scripted signal (`uie probe`: change selects and radios, watch for unannounced context changes) + judged | — |
| 3.2.3 | AA | Consistent navigation | scripted (`cross-page`: navigation order) | A11Y-18 |
| 3.2.4 | AA | Consistent identification | scripted (`cross-page`: same function, same name) | A11Y-18 |
| 3.2.6 | A | Consistent help | scripted (`cross-page`: help mechanisms in the same relative order) | A11Y-18 |
| 3.3.1 | A | Error identification | scripted (`forms`: text error, `aria-invalid`, association) | A11Y-13 |
| 3.3.2 | A | Labels or instructions | auto (label, form-field-multiple-labels) + scripted (`forms`: no placeholder-only label) + judged (format hints) | A11Y-01, A11Y-13 |
| 3.3.3 | AA | Error suggestion | judged (the message says how to fix it; CPY-04) | — |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | judged (review, confirm or undo; CMP-15) + human | A11Y-21 |
| 3.3.7 | A | Redundant entry | judged (journey replay: earlier answers offered again within the process) | — |
| 3.3.8 | AA | Accessible authentication, minimum | scripted (`forms`: paste, tokens) + judged (puzzles and alternatives) | A11Y-14 |
| 4.1.2 | A | Name, role, value | auto (about 29 rules: button-name, label, select-name, nested-interactive, aria-*) + scripted (`uie probe` toggles with an ARIA snapshot diff) + judged | A11Y-01, A11Y-06 |
| 4.1.3 | AA | Status messages | scripted (`live-regions`: outcome lands in a live region after async actions) | A11Y-15 |

## 7. Contrast in detail

- **Large text** is WCAG's "large scale": at least 18 pt, or 14 pt bold, which is ≥ 24 px, or ≥ 18.66 px bold. Implement it exactly. Apple's Inspector table (any bold text), Fluent (18.5 px bold), Carbon and Atlassian (24 px only) and Semi (18 px) are simplifications that checkers never adopt [05 C6]. UI-Evaluator counts a computed weight of 700 or more as bold [calibrating].
- **Composited background.** Walk up from the text node, compositing background colours, alpha channels and `opacity` until an opaque layer; alpha text tokens, common in enterprise systems, are composited too. Detectors get this wrong: one reported 17.6:1 text as 1.2:1 by compositing a gradient over black. When rendered pixels contradict the computed value, the pixels decide and the detector hit is recorded as a false positive [IMP-015; METHODS §3].
- **Images, video and gradients.** axe returns `incomplete`. Sample pixels around the glyph boxes and use the worst sample. A scrim must hold the ratio over the brightest part of the image; moving the text off the busy area is often the better fix.
- **States.** Rest, hover, focus, active, selected and visited text, and placeholder text, are all text under 1.4.3. Disabled text is exempt but must stay recognisable as disabled; CMP-03 keeps its own floor of 2:1 for a disabled control's label text or outline **[calibrating]** (CMP-09).
- **Themes.** Each shipped theme is a separate pass. Dark themes are composed, not inverted (COL-04); a high-contrast theme is another pass (A11Y-24).
- **Non-text.** The boundary that counts is the one that identifies the control: an input drawn only with a bottom border needs that border at 3:1, while a filled button with a readable label needs none. A focus indicator is measured against every colour next to it on every surface it appears on. Chart marks needed to read the data are graphical objects.
- **Shortcuts are not evidence.** Tone or grade arithmetic (Material tone difference 40 ≈ 3:1 and 50 ≈ 4.5:1, Carbon grade steps, Radix step jobs) helps at design time (COL-07); the measured ratio decides [PLAT-065].

## 8. Target size and its exceptions

A target passes A11Y-10 when a 24 × 24 CSS px square fits inside its hit area, or when one of the five exceptions applies.

| Exception | Applies when | How it is tested |
|---|---|---|
| Spacing | a 24 px circle centred on the undersized target's bounding box intersects no other target and no other undersized target's circle | box geometry; axe `target-size` and `target-offset` |
| Equivalent | the same function is on the same page through a control that meets 24 px | judged: the auditor names the equivalent control |
| Inline | the target sits in a sentence, or its size is set by the line height of surrounding text; stacked lists of links do not qualify | DOM: a link inside a block of text |
| User agent | the browser sets the size and the author did not change it | a native control with no author sizing |
| Essential | the size or position is the information (map pins at true positions, dense data marks), or it is legally required | judged, with the reason recorded |

- Overlapping areas do not count toward a target's size unless the overlapping targets do the same thing.
- For A11Y-10, measure the element that receives the pointer event, including padding and pseudo-element extensions, not the visible glyph. CMP-06 measures a narrower hit area: the border box, plus an input's label box (ADR-032).
- How axe treats transforms and overlapping targets is not documented [unverified]; our geometry is compared with axe on fixtures [08 open question 9].
- Above the floor, CMP-06 gates touch-primary controls at 44 × 44 with 8 px gaps, A11Y-23 recommends the profile's comfort size for the rest, and density never pushes a target below 24 px (LAY-11) [PLAT-038, PLAT-040].

## 9. Keyboard models for composite widgets

Build a pattern only when the native element in the second column cannot do the job, and then build all of it. A composite widget is one tab stop, and arrow keys move inside it, either by roving `tabindex` (`0` on the active item, `-1` on the rest, then `.focus()`) or by `aria-activedescendant` (focus stays on the container). Items users must discover while disabled, such as menu items, tabs and toolbar buttons, stay focusable with `aria-disabled="true"`. Avoid shortcuts that collide with system, browser or screen-reader keys [TOOL-09; APG keyboard interface].

| Pattern | Native first | Keyboard essentials | Semantics |
|---|---|---|---|
| Dialog (modal) | `<dialog>` with `showModal()` | Tab and Shift+Tab cycle inside; Esc closes; initial focus on the first control, on a static element at the top of long content, or on the least destructive button before an irreversible action; on close, focus returns to the invoker or the next logical place | `role=dialog`, `aria-modal=true`, a name; the rest of the page inert |
| Menu, menubar, menu button | `<select>` for a choice; links for navigation | the menubar is one tab stop; Left and Right move along the bar, Up and Down within a menu; Enter activates or opens a submenu; Esc closes and returns focus to the opener; Tab leaves and closes; Home, End and type-ahead optional | `menu`, `menubar`, `menuitem` and its checkbox and radio forms; `aria-haspopup` and `aria-expanded` on openers |
| Disclosure | `<details>` and `<summary>` | Enter and Space toggle | a `button` with `aria-expanded`; `aria-controls` optional |
| Tabs | none | Tab enters at the active tab, then moves to the panel; Left and Right (Up and Down when vertical) move and wrap; Home and End optional; select on focus when panels show without delay, otherwise on Enter or Space | `tablist`, `tab`, `tabpanel`; `aria-selected`, `aria-controls`; each panel labelled by its tab |
| Combobox | `<select>`; `<input>` with `<datalist>` | DOM focus stays in the input; Down opens and moves into the options; Enter accepts; Esc closes and may clear; Alt+Down opens without moving; normal text editing | `role=combobox`, `aria-expanded`, `aria-controls`, `aria-autocomplete`, `aria-activedescendant` |
| Listbox | `<select>`, with `multiple` for several | Up and Down move; Home and End; type-ahead; single-select may select on focus; multi-select: Space toggles, Shift with arrows extends; options never hold interactive elements (use a grid) | `listbox`, `option`; `aria-selected` or `aria-checked`, not both; `aria-multiselectable`; a label |
| Grid | `<table>` for static data | one tab stop; arrows move by cell; Home and End within the row; Ctrl+Home and Ctrl+End to the corners; Enter or F2 enters a cell's controls, Esc returns to cell navigation | `grid`, `row`, `gridcell`, header roles; `aria-selected`; `aria-rowcount` and `aria-colcount` when rows are virtualised |

For site navigation, UI-Evaluator's default is a list of links in a `nav` landmark with disclosure buttons for sub-lists: links keep their semantics and Tab order, while menu roles switch people into an application-style arrow-key model they may not expect. APG lists disclosure navigation among its examples.

## 10. Forced colours, increased contrast and CVD evidence

`uie audit --checks cvd` takes the colour-vision and forced-colour captures, `uie capture` the other preference emulations, and the accessibility auditor reads them [TOOL-16, TOOL-17].

- **Forced colours** (Windows contrast themes; emulated as `forced-colors: active`). Chromium's emulation also applies forced-colour rendering: author colours become system colours, `box-shadow` and `text-shadow` compute to none, and background images without a `url()` disappear. Look for focus rings drawn with `box-shadow`, states shown only by background colour, chips that differ only in colour, and icons drawn as CSS backgrounds. Real Windows palettes and other engines were not tested [unverified]; Chromium is the reference.
- **Fixes that survive.** `outline` for focus rings; borders on controls; SVG icons with `fill: currentColor`; system colours such as `Canvas`, `CanvasText`, `Highlight`, `ButtonText`, `LinkText` and `GrayText` inside `@media (forced-colors: active)`; `forced-color-adjust: none` only where you manage contrast yourself, such as colour swatches [CSS Color Adjustment 1]. A transparent outline under a shadow-drawn ring is a common fallback, because forced colours repaint it in a system colour [unverified across engines].
- **Increased contrast** (`prefers-contrast: more`). Captured with the browser's contrast emulation; the auditor checks borders, focus indicators and translucent layers (A11Y-24).
- **Colour-vision deficiency.** Captures under deuteranopia, protanopia, tritanopia and achromatopsia at one width, through Chromium's built-in emulation (Machado, Oliveira and Fernandes matrices). Name the simulator in the report; colour-library filters based on the same paper give different numbers, so never mix simulators within one report. The auditor checks that status, chart series, links in text, required markers and selected states keep a non-colour cue (A11Y-19).
- **Reduced motion.** Captured in the same matrix; its rules are MOT-04 and MOT-19 in [motion.md](motion.md).

## 11. Screen-reader semantics from ARIA snapshots

ARIA snapshots record what assistive technology receives (role, accessible name, states and, optionally, boxes), so the auditor can check semantics without running a screen reader [TOOL-24]. Check:
- **Outline.** Landmarks and headings match the visual structure (A11Y-26); lists are lists; data tables have header cells.
- **Names.** Every control has a name, and the visible label text appears inside it (2.5.3). Repeated controls, such as several "Edit" buttons, are told apart by name or description. Icon buttons are named, decorative images are hidden, and nothing focusable sits inside `aria-hidden`.
- **Roles.** Actions are buttons and navigation is links; no role appears without its keyboard model (A11Y-25).
- **States.** Toggling a widget changes `aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed` or `aria-current` in the snapshot.
- **Announcements.** Live regions exist before text is written into them (A11Y-15), and fields reference their errors (A11Y-13).
- **Regressions.** Every fix diffs the snapshot with `uie diff <base> <run> --aria`; a lost name, role, landmark or heading is a regression unless intended (FRAMEWORK §10).

A simulated screen-reader transcript is optional support for the auditor; the real screen-reader pass stays on the L3 list [TOOL-44].

## 12. Cognitive accessibility

WCAG 2.2 AA covers part of cognitive accessibility directly: no re-entry within a process (3.3.7), no memory or puzzle test without help (3.3.8), help in a stable place (3.2.6), adjustable time limits (2.2.1), and help with errors and their prevention (3.3.3, 3.3.4). For the rest, the accessibility auditor walks each critical journey with:
- the cognitive-load checklist in [heuristics.md](heuristics.md) §2.7 (single focus, chunking, grouping, hierarchy, one decision at a time, few options per decision, no memory bridges, progressive disclosure), with its caveat that the counts are prompts, not limits [IMP-043];
- plain words and one term per concept (CPY-07, CPY-12 in [content-copy.md](content-copy.md));
- forgiving input: accepted formats stated, input kept after an error, undo for routine actions (CMP-15, CMP-18);
- no time pressure without a way to extend, and visible progress in multi-step flows.

A finding names what the person must remember or decide and what that costs the task. A menu is never a finding just for exceeding "7 ± 2" items, and C or D-grade "laws" never justify one alone [HCI-072, HCI-074]. Simulated personas generate hypotheses only (E1 at most).

## 13. The L3 needs-human checklist

A human (the owner, a designer or an accessibility specialist) completes these items for L3. Record tester, assistive technology, browser, versions, date and result for each; failures become E2 findings [TOOL-37].

1. A screen-reader pass of every critical journey with at least one real screen reader and browser pair, for example VoiceOver with Safari or NVDA with Firefox: names, roles, states, announcements and reading order.
2. Meaningful sequence (1.3.2) wherever the script flagged DOM order differing from visual order.
3. Captions, transcripts and audio description for every media item (1.2.1 to 1.2.5): present, accurate and in sync.
4. Sensory characteristics (1.3.3): no instruction relies only on shape, size, position, colour or sound.
5. Flashing (2.3.1) in video and fast animation.
6. Error prevention (3.3.4) on legal, financial and data-changing submissions: review, confirmation or undo works.
7. Judged items the auditor marked low-confidence: alt-text equivalence, heading and label quality, link purpose, redundant entry, multiple ways.
8. Real zoom on one desktop browser (page zoom to 400%, text-only zoom to 200%) as a check on the emulation.
9. Where users depend on them: speech control (visible labels can be spoken to activate controls), a real Windows contrast theme, and keyboard-only or switch use of the longest journey.

## Sources

- Research adopt items: TOOL-01 to TOOL-44 (note 08); PLAT-019, PLAT-020, PLAT-038, PLAT-040, PLAT-043, PLAT-051, PLAT-061, PLAT-062, PLAT-065, PLAT-069, PLAT-090, PLAT-094, PLAT-100, PLAT-130 and conflict C6 (note 05); IMP-015, IMP-020, IMP-043, IMP-045, IMP-047, IMP-048 and conflict C9 (note 01); HCI-068, HCI-072, HCI-074 (note 06).
- W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*, Recommendation, 2024-12-12. https://www.w3.org/TR/WCAG22/
- W3C WAI, *Understanding WCAG 2.2*: 1.4.12, 2.4.11, 2.5.8, 3.2.6, 3.3.7, 3.3.8. https://www.w3.org/WAI/WCAG22/Understanding/
- W3C WAI, WCAG 2.2 approved as ISO/IEC 40500:2025, 2025-10-21. https://www.w3.org/WAI/news/2025-10-21/wcag22-iso
- W3C, *WCAG 3.0* Working Draft, 2026-09-10. https://www.w3.org/TR/wcag-3.0/
- W3C WAI, *ARIA Authoring Practices Guide*: Read Me First, Developing a Keyboard Interface, and the dialog (modal), menu and menubar, disclosure, tabs, combobox, listbox and grid patterns (read 2026-10). https://www.w3.org/WAI/ARIA/apg/
- W3C WAI, *Forms tutorial: user notifications*. https://www.w3.org/WAI/tutorials/forms/notifications/
- W3C, *CSS Color Adjustment Module Level 1*, §3. https://www.w3.org/TR/css-color-adjust-1/
- W3C Internationalization, *Choosing a language tag*. https://www.w3.org/International/questions/qa-choosing-language-tags
- Deque, axe-core rule descriptions and API, 4.13 (2026). https://github.com/dequelabs/axe-core
- GDS accessibility blog, tool audit, 2017. https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/
- Chrome for Developers, vision-deficiency emulation. https://developer.chrome.com/blog/cvd
- Machado, Oliveira and Fernandes, "A Physiologically-based Model for Simulation of Color Vision Deficiency", IEEE TVCG 15(6), 2009.
- MDN, `keydown` event and IME composition. https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event
