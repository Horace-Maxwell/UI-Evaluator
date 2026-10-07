# Quality Bar — gates, thresholds and assurance levels

| | |
|---|---|
| Version | 2.0.0 (2026-10-04) |
| Status | Normative. Defines what "done" means. Gate criteria IDs defined here are the canonical IDs. Knowledge files elaborate them, and `assets/data/rules.json` implements them. |
| Parent | [FRAMEWORK](FRAMEWORK.md) |

## Contents

1. [Purpose](#1-purpose)
2. [Gate semantics](#2-gate-semantics)
3. [Assurance levels](#3-assurance-levels)
4. [The gates](#4-the-gates) — [G0](#g0--evidence-integrity) · [G1](#g1--functional-integrity) · [G2](#g2--accessibility-wcag-22-aa) · [G3](#g3--craft-floor) · [G4](#g4--deliberateness-and-anti-slop) · [G5](#g5--analytical-usability) · [G6](#g6--design-quality-panel) · [G7](#g7--empirical-validation)
5. [Mode-dependent thresholds](#5-mode-dependent-thresholds)
6. [Priority policy for gating](#6-priority-policy-for-gating)
7. [Calibration status of thresholds](#7-calibration-status-of-thresholds)
8. [What passing does not mean](#8-what-passing-does-not-mean)

---

## 1. Purpose

The user asked for UIs that are "100% beautiful and not AI-looking". This document turns that aim into criteria that can be checked. It has three layers:

1. **Floors** that are objective and measured: functional integrity, WCAG 2.2 AA and the craft floor. A UI that fails a floor is not beautiful by any reasonable reading.
2. **Deliberateness** that is measured and process-checked: decisions recorded, AI tells absent unless chosen, direction varied across work.
3. **Judgement** that is made reliable by procedure, not by trusting one opinion: isolated panels, verification, blind rating, agreement, human confirmation, then real users.

Every criterion has an ID, a threshold, a verification method and a source. Criteria marked **[calibrating]** are expert heuristics that will be tuned on labelled data ([EVALUATION-PLAN](EVALUATION-PLAN.md)). Until then they gate as written, but a failure may be overruled with a recorded reason.

## 2. Gate semantics

### 2.1 Criterion and gate states

Each criterion evaluates to one state. A gate takes the worst state of its criteria, in the order `fail` > `not_run` > `degraded` > `waived` > `pass`. Criteria that are `not_applicable` are ignored.

| State | Meaning | Counts as pass for an assurance level? |
|---|---|---|
| `pass` | The check ran, its own validity was confirmed, and the threshold was met | yes |
| `fail` | The check ran and the threshold was not met | no |
| `not_run` | The check did not run: tool missing, input situation, not attempted | **no** |
| `not_applicable` | The criterion does not apply (e.g. no forms, no dark theme). The reason is recorded | ignored |
| `degraded` | The check ran without its required independence or coverage (e.g. evaluators not isolated) | only for a level reported as "(degraded)" |
| `waived` | Failed, but the owner accepted it with a recorded reason (§2.3) | yes, and listed in the report |

Criteria whose threshold applies to exercised behaviour (CPY-04 error states, A11Y-15 async actions, A11Y-06 modal dialogs, CMP-04 responses to actions) are `not_applicable` when the scope contains nothing of that kind, and `degraded` when the check found some but could not exercise any. A check that exercised nothing never yields `pass`.

### 2.2 Evidence requirements

A `pass` requires artifacts in the run directory: tool output, screenshots, ratings, records. A gate state without artifacts is `not_run` (EVD-04). The doctor smoke test must have passed in the same session for any deterministic criterion to `pass` (EVD-02).

### 2.3 Waivers and accepted tells

- **G2 failures cannot be waived** (P11). They may be deferred with a remediation plan, but then the level that requires G2 is not reached.
- G0 and G1 failures cannot be waived.
- G3 criteria that implement a WCAG success criterion (CPY-02 for SC 2.4.4) cannot be waived either.
- G3, G4, G5 and G6 criteria may be waived by the **owner** only. The waiver records who decided, the reason and the scope (value-scoped by default; criterion-wide only with explicit owner consent) [IMP-050]. Waivers live in `.ui-evaluator/waivers.json` and appear in every report.
- A **tell explicitly requested** by the brief or `DESIGN.md` (`accepted_tells` with a reason) is not a failure. It is reported as *requested* with the citing line [CRAFT-005]. This is how "the brief wins" is implemented.
- **Threshold overrides** in `config.json` require a reason and are listed in the report. They cannot lower WCAG thresholds.

### 2.4 Scope of a run

Every criterion is evaluated over the run's declared scope: routes × states × the viewport matrix (default widths 320, 375, 768, 1024, 1280, 1440) × themes shipped (light, dark) × preference emulations (default, reduced motion; forced colours and increased contrast for G2 evidence) [TOOL-03/04; 08 §4.3 S1]. Matrix entries below 1024 CSS px are captured with touch emulation by default; they are the touch viewports of CMP-06 (ADR-032). Coverage below the declared scope makes the affected criteria `degraded`.

---

## 3. Assurance levels

| Level | Required gates | Additional conditions |
|---|---|---|
| **L1 Machine-verified** | G0, G1, G2 (automatable and scripted parts), G3, G4 all `pass` or `waived` where waivable | The G2 coverage matrix is present; needs-human criteria are listed and not claimed |
| **L2 Panel-reviewed** | L1 + G5 + G6 | Depth ≥ standard. If any panel ran without isolation, the level is reported as "L2 (degraded)" |
| **L3 Human-confirmed** | L2 + human confirmation | The owner or a named expert has confirmed or overruled every P0/P1 finding and the G6 verdict (agree/disagree sheet complete), and completed the needs-human WCAG checklist |
| **L4 User-validated** | L3 + G7 | — |

At L1, "automatable and scripted parts" means every G2 row except the three the accessibility auditor decides: A11Y-02 (axe `incomplete` results no script resolved), A11Y-19 and A11Y-27. When no auditor has run, those three are listed for judgement and not claimed. A confirmed failure in any of them still blocks L1, because a known WCAG failure is a failure at every level. L2 requires all three to pass.

A report states the **target level** (from `PRODUCT.md`), the **achieved level**, and for each unmet level the blocking criteria.

---

## 4. The gates

Column legend. **Verify:** `S` static source scan · `D` DOM/computed style in a headless browser · `P` pixel analysis of screenshots · `I` scripted interaction · `A` isolated agent judgement · `H` human · `U` real users. **Src:** research adopt IDs.

### G0 — Evidence integrity

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| EVD-01 | Run manifest is complete: tool and engine versions, URL and commit or content hash, viewport matrix, emulations, timestamps, evaluator providers and models, depth | all fields present; schema-valid | S | TOOL-40, LOOP |
| EVD-02 | Doctor smoke test passed in this session: each tool produced the expected detections on the known-bad fixture | 100% of expected detections; 0 crashes | I | 03 §3.3, IMP-049 |
| EVD-03 | Capture validity: no blank or near-uniform captures, correct dimensions, fonts loaded, animations settled, full-page captures start at the top | 0 invalid captures (invalid → recapture, never evaluate) | P | IMP-031, TOOL-25 |
| EVD-04 | Every criterion has an explicit state backed by artifacts; `not_run` is never shown as pass; the WCAG coverage matrix is present | 100% | S | TOOL-37, IMP-049 |
| EVD-05 | Every reported finding has a resolvable evidence anchor (selector resolves in the captured state, or a crop exists) | 100% of reported findings | D/S | HCI-006 |
| EVD-06 | Report language matches evidence levels: no "users …" claims below E3, no causal claims below E5, no completeness claims, no synthetic metrics | 0 lint violations | S | HCI-016/023/035/064 |
| EVD-07 | Independence is recorded per evaluator (context isolation, provider, model, inputs given); DEGRADED banner present where isolation was not achieved | 100% | S | IMP-036, LOOP |
| EVD-08 | Freshness: every finding's fingerprint matches the current UI version, or the finding is marked `stale` | 0 stale findings reported as current | S/D | 03 §3.3 |

### G1 — Functional integrity

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| FUN-01 | Every in-scope route loads (2xx) and renders its main content within the timeout | 100% of routes | I | LOOP |
| FUN-02 | No uncaught exceptions or console errors during load and journey replay; console parity vs baseline | 0 errors; 0 introduced vs baseline | I | LOOP, TOOL |
| FUN-03 | Every declared critical journey completes by scripted replay to its success condition | 100% | I | EVAL carlsz |
| FUN-04 | No broken images or media (`naturalWidth = 0`, failed requests) and no broken in-scope links | 0 | D/I | IMP-029 |
| FUN-05 | No horizontal page overflow at any matrix width (`scrollWidth ≤ clientWidth + 1`), except declared 2-D regions (data tables, maps, code) | 0 offenders | D | TOOL-10, IMP-047 |
| FUN-06 | No clipped or overlapping text at rest at any matrix width (overflow-hidden element whose scroll size exceeds client size; intersecting text boxes) | 0 offenders | D | TOOL-11 |
| FUN-07 | Lab Cumulative Layout Shift over load + scripted interactions | ≤ 0.1 | I | TOOL-33 |
| FUN-08 | Lab LCP ≤ 2.5 s and INP ≤ 200 ms | advisory: never fails the gate; reported with the noise caveat | I | TOOL-33 |

### G2 — Accessibility (WCAG 2.2 AA)

Normative target: WCAG 2.2 Level AA, 55 success criteria (W3C Recommendation 2024-12-12; ISO/IEC 40500:2025). SC 4.1.1 is obsolete. APCA and WCAG 3 are advisory only [TOOL-01, TOOL-15].

| ID | Criterion | Threshold | Verify | WCAG | Src |
|---|---|---|---|---|---|
| A11Y-01 | axe-core with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` over all in-scope states × {320, 1280} × shipped themes | **0 violations of any impact** (ADR-009) | D | many | TOOL-02/03/04 |
| A11Y-02 | Every axe `incomplete` result is resolved by a scripted check or the accessibility auditor | 0 unresolved | D/A | — | TOOL-02 |
| A11Y-03 | Keyboard: every interactive element is reachable; no trap; focus order follows visual order; no context change on focus | 0 offenders | I | 2.1.1, 2.1.2, 2.4.3, 3.2.1 | TOOL-05 |
| A11Y-04 | Focus visible: every tab stop produces a visible change (focused vs blurred crop diff) | 0 stops with 0 px change | I/P | 2.4.7 | TOOL-06 |
| A11Y-05 | Focus not obscured: the focused element is not entirely hidden by author content (Tab and Shift+Tab) | 0 offenders | I | 2.4.11 | TOOL-07 |
| A11Y-06 | Modal dialogs: focus moves in, Tab wraps inside, Esc closes, focus returns to the invoker; correct dialog semantics | 100% of dialogs | I | 2.1.2, 2.4.3, 4.1.2 | TOOL-08 |
| A11Y-07 | Reflow at 320 CSS px without two-dimensional scrolling (except 2-D content) | 0 offenders | D | 1.4.10 | TOOL-10 |
| A11Y-08 | Text-spacing override (line-height 1.5, paragraph spacing 2em, letter 0.12em, word 0.16em) causes no clipping or overlap | 0 offenders | D | 1.4.12 | TOOL-11 |
| A11Y-09 | 200% text resize: no clipping or overlap; controls operable | 0 offenders | D | 1.4.4 | TOOL-12 |
| A11Y-10 | Targets ≥ 24 × 24 CSS px unless an SC 2.5.8 exception applies (spacing circle, equivalent, inline, user-agent, essential) | 0 failures after exceptions | D | 2.5.8 | TOOL-13, EVAL C9 |
| A11Y-11 | Text contrast ≥ 4.5:1; large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1; computed on the composited background in every state and theme; text over images or gradients pixel-sampled. CJK text from 18 to 24 px that is not already large text by the bold rule, with contrast between 3:1 and 4.5:1, goes to the accessibility auditor instead of being auto-passed or auto-failed, and 1.4.3 is recorded as agent-judged whenever such text is in scope (ADR-032) | 0 failures | D/P/A | 1.4.3 | TOOL-14, IMP-015 |
| A11Y-12 | Non-text contrast ≥ 3:1 for component boundaries needed to identify controls, icons conveying meaning, graphical objects needed to understand content (chart marks, data points), focus indicators and state indicators | 0 failures | D/P | 1.4.11 | TOOL-14 |
| A11Y-13 | Forms: visible persistent label for every input (no placeholder-only labels); errors in text with `aria-invalid` and programmatic association; focus moves to the first error or an error summary; `autocomplete` on personal-data fields | 0 failures | I | 1.3.1, 1.3.5, 3.3.1, 3.3.2 | TOOL-21 |
| A11Y-14 | Authentication: paste allowed in password and OTP fields; correct `autocomplete` tokens; no cognitive function test without an alternative or assistance mechanism (SC 3.3.8 exceptions for object-recognition and personal-content tests apply) | 0 failures | I/S | 3.3.8 | TOOL-22 |
| A11Y-15 | Status messages from async actions are exposed through `role=status`, `alert` or a live region without moving focus | 0 failures in exercised actions | I | 4.1.3 | TOOL-23 |
| A11Y-16 | `lang` present and matching the dominant script of the content; mixed-language runs tagged; Chinese tagged with a region or script subtag (`zh-CN`, `zh-TW`, `zh-HK`, `zh-Hans`, `zh-Hant`), never bare `zh` when both scripts ship | 0 failures | D | 3.1.1, 3.1.2 | TOOL-19, PLAT-130 |
| A11Y-17 | Pointer and keyboard static checks: no down-event-only activation, no unmodified single-character shortcuts without a remap or off switch, dragging has a single-pointer alternative, motion actuation has an alternative | 0 failures | S | 2.5.2, 2.1.4, 2.5.7, 2.5.4 | TOOL-42 |
| A11Y-18 | Cross-page consistency: navigation order, names of identical functions, help placement | 0 inconsistencies | D | 3.2.3, 3.2.4, 3.2.6 | TOOL-41 |
| A11Y-19 | Colour is not the only visual means of conveying information: status, series, links and required markers stay distinguishable under deuteranopia, protanopia, tritanopia and achromatopsia emulation | 0 failures | P/A | 1.4.1 | TOOL-16, HCI-068 |
| A11Y-20 | Coverage matrix: each of the 55 criteria labelled with how it was covered (auto, scripted, agent-judged, needs-human, not-tested) and its state; no "compliant" claim | present; needs-human items listed | S | all | TOOL-37 |
| A11Y-21 | (L3) Needs-human criteria completed by a human: screen-reader pass of critical journeys, meaningful sequence, captions, sensory characteristics and similar | 100% of applicable items | H | various | TOOL-37, TOOL-44 |
| A11Y-27 | No verified judged WCAG failure: success criteria without a dedicated G2 row (e.g. 1.3.4, 1.4.5, 1.4.13, 2.4.5, 2.4.6, 2.5.1, 2.5.3, 3.2.2, 3.3.3, 3.3.7) still fail G2 when a confirmed finding cites them | 0 open confirmed findings citing a WCAG 2.2 A/AA criterion | A | various | TOOL-37 |

Advisory (reported, never gating): forced-colours visibility of focus, borders and selection [TOOL-17]; APCA Lc for body text (advisory targets Lc ≥ 75, preferred 90) [CRAFT-031]; Apple 44 pt and Material 48 dp touch targets on touch viewports [TOOL-13]. The touch-target recommendation becomes gating through CMP-06 (G3) for touch-primary controls.

### G3 — Craft floor

These criteria are measurable. They express the consensus floor of the design systems and craft sources reviewed (05 §3.2, §3.5; 07 §5.1). Thresholds that depend on mode are resolved through §5.

**Typography**

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| TYP-01 | Minimum rendered text size | no text < 12 px, except non-interactive legal or caption text ≥ 11 px; CJK text ≥ 12 px without exception | D | PLAT-010, CRAFT-034, IMP-016 |
| TYP-02 | Body text size by mode | reading body ≥ 16 px (Persuade, Read, Experience); productive body ≥ 14 px (Operate); text inputs ≥ 16 px at widths < 768 px | D | CRAFT-034, PLAT-010, §5 |
| TYP-03 | Line height | Latin body text of 3 or more lines ≥ 1.4 (two-line UI text ≥ 1.3); multi-line CJK body text ≥ 1.5; wrapping headings ≥ 1.1 (Latin) or ≥ 1.2 (CJK, **[calibrating]**); line-height 1.0 on wrapping text ≥ 48 px fails | D | CRAFT-033, PLAT-011, IMP-016 |
| TYP-04 | Measure (line length) | Latin prose fails when ≥ 2 rendered lines exceed 80 characters (target 45–75); CJK prose fails when ≥ 2 lines exceed 48 glyphs (target ≤ 40) | D | CRAFT-032, IMP C13, PLAT-014 |
| TYP-05 | Type families | ≤ 2 families per script (Latin and CJK counted separately; fallback families in a stack are not counted) plus an optional monospace used only for code or data, unless `DESIGN.md` declares more with a reason | D | CRAFT-035 |
| TYP-06 | Hierarchy is not flat | with ≥ 3 text roles: adjacent role steps ≥ 1.25 (Persuade, Read, Experience) or ≥ 1.125 (Operate), or roles additionally separated by weight | D | CRAFT-035, IMP-017 |
| TYP-07 | No thin weights at small sizes | no weight < 400 for text < 24 px | D | PLAT-013, CRAFT-035 |
| TYP-08 | Tracking | lowercase body letter-spacing ≤ 0.05em; display ≥ −0.04em; CJK letter-spacing ≥ 0; no uppercase run > 30 characters | D | CRAFT-036, IMP-016, PLAT-015 |
| TYP-09 | Display restraint | display text ≤ 6rem unless `DESIGN.md` declares it; a full-sentence h1 ≥ 72 px with ≥ 40 characters fails | D | IMP-016, IMP-017 |
| TYP-10 | Justification | justified Latin text requires `hyphens: auto`; pure-CJK paragraphs are exempt | D | IMP-016, PLAT-132 |

**Colour**

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| COL-01 | Token conformance | ≥ 90% of colour declarations in component code reference tokens or variables; raw palette utilities (e.g. `bg-indigo-500`) and literal values outside token files are reported as drift unless listed in `DESIGN.md` exceptions **[calibrating]** | S | PLAT-060, PLAT-140, CRAFT-006, IMP-051 |
| COL-02 | No achromatic grey text on a chromatic background | 0 offenders (text with OKLCH chroma < 0.005 on a surface with OKLCH chroma ≥ 0.05) **[calibrating]** | D | IMP-015, CRAFT-039 |
| COL-03 | Declared colour strategy is honoured | Restrained: accent-hue area ≤ 10% of any viewport; Committed: dominant hue 30–60% of the surface; measured on screenshots with photos, video and illustrations masked. Full palette and Drenched are checked by advisory COL-17 **[calibrating]** | P | CRAFT-038, IMP-010 |
| COL-04 | Dark theme, when shipped, is composed | `color-scheme` declared; elevated surfaces (cards, popovers, menus, dialogs, sheets) not darker than the base; sunken wells and inset inputs are excluded; all A11Y-11/12 checks pass in dark | D | CRAFT-040, PLAT-066 |

**Layout and spacing**

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| LAY-01 | Spacing scale conformance | ≥ 90% of margin, padding and gap values on the declared scale (by default: 0, 2 px, or a multiple of 4 px); off-scale values only as documented optical fixes **[calibrating]** | S/D | CRAFT-041, PLAT-030 |
| LAY-02 | No spacing monotony | among ≥ 10 spacing declarations (deduplicated by class or rule signature, not by rendered instance), fail when one value accounts for > 60% and ≤ 3 distinct values are used | D | CRAFT-041, IMP-018 |
| LAY-03 | Heading rhythm | space above a section heading > space below it | D | IMP-018, CRAFT-041 |
| LAY-04 | No cramped padding | inside bordered or filled block containers: vertical inset ≥ max(4 px, 0.3em); horizontal ≥ max(8 px, 0.5em). Inline runs (`code`, `kbd`, `mark`, inline badges) are excluded | D | IMP-018 |
| LAY-05 | Edge margin | body text ≥ 16 px from the viewport edges at widths < 768 px | D | IMP-018 |

**Shape and depth**

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| SHP-01 | Concentric nesting | when an inset child's padding from the parent edge is smaller than the parent radius, the child's radius ≤ parent radius − padding; otherwise the child's radius ≤ the parent radius | D | CRAFT-023, PLAT-070 |
| SHP-02 | Elevation economy | ≤ 4 distinct shadow styles in use per theme; no in-flow surface combining a ≤ 1.5 px border with a shadow blur ≥ 24 px **[calibrating]** (floating layers exempt); every non-focus shadow has at least one layer with a non-zero offset (spread-only rings count as borders) | D | PLAT-072, CRAFT-022, IMP-023 |

**Motion**

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| MOT-01 | Animated properties | no `transition: all`; no transitions or animations on layout properties (width, height, top, left, right, bottom, margin, padding) | S/D | CRAFT-051, IMP-022 |
| MOT-02 | Duration budget | state and feedback transitions ≤ 300 ms (≤ 250 ms on Operate surfaces); overlays (dialogs, drawers, popovers, menus) and page or view transitions ≤ 500 ms; background scrim dimming ≤ 700 ms; one declared focal entrance ≤ 800 ms; interactions declared frequent ≤ 150 ms. Continuous indicators (spinners, progress bars) are out of scope | S/D | CRAFT-049, IMP-021, PLAT-080 |
| MOT-03 | No overshoot on UI state changes | no `cubic-bezier` with y1 or y2 outside [−0.1, 1.1], and no bounce or elastic animations, unless `DESIGN.md` declares a playful brand or the motion is gesture-driven | S | CRAFT-050, CRAFT-028, IMP-022 |
| MOT-04 | Reduced motion | every animation has a `prefers-reduced-motion` path; under emulated `reduce`, no infinite or large-displacement animation remains, except essential progress indicators, which may continue in a subtle, non-spatial form; ≤ 150 ms opacity or colour feedback may stay. Large displacement, measured while the animation runs under `reduce`: a translation of an element by ≥ min(200 CSS px, one third of the viewport along that axis); a scale change by ≥ 1.25× or ≤ 0.8× of an element whose box covers ≥ 25% of the viewport area; a rotation by ≥ 90°; or any movement of content in response to scroll (parallax, scroll-linked transforms) **[calibrating]** (ADR-032) | S/D | CRAFT-052, TOOL-18, DSL X9, PLAT-084 |
| MOT-05 | Content visible at rest | after load and a full scroll, no text remains hidden by an unfinished reveal animation | D | IMP-022, CRAFT-051 |
| MOT-06 | No scale-from-zero entrances | no entrance starting at `scale(0)` | S | CRAFT-051 |
| MOT-07 | Mode budget | Operate and Read: no non-user-triggered choreography beyond one page fade; Persuade: ≤ 1 orchestrated sequence per screen; Experience: as declared in `DESIGN.md`, default ≤ 1 orchestrated sequence per screen | S/D | IMP-021, PLAT-083 |

**Components and states**

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| CMP-01 | State styling exists | buttons, links and inputs show a visible difference for hover (when hover is supported) and active states (forced pseudo-state diff > 0) | D | PLAT-050, CRAFT-053 |
| CMP-02 | Focus indicator quality | indicator ≥ 2 px thick (or area ≥ a 2 px perimeter), change contrast ≥ 3:1, distinct from hover — **advisory until calibrated** | I/P | PLAT-051, TOOL-06 |
| CMP-03 | Disabled states | disabled controls use ≥ 2 cues and stay perceivable: the label text or the outline of each disabled control reaches ≥ 2:1 contrast against the adjacent background **[calibrating]**, a floor of UI-Evaluator's own (WCAG exempts inactive components from 1.4.3 and 1.4.11). A primary submit button disabled at rest does not fail CMP-03; the check emits it as a candidate finding (H1, H9) for verification and rating (ADR-032) | D | PLAT-053, CRAFT-053 |
| CMP-04 | Response feedback | a visible acknowledgement within 0.1 s of a user action; operations > 1 s show progress; operations ≥ 10 s show determinate progress (or percent done) and a way to cancel or interrupt; a static "Loading…" alone fails | I | HCI-067, PLAT-090 |
| CMP-05 | Data states exist | every data view in scope has loading, empty and error states, demonstrated through state recipes or confirmed by the code reviewer | I/A | IMP-019, CRAFT-053 |
| CMP-06 | Touch-primary targets | on touch viewports, the hit area of each primary control is ≥ 44 × 44 CSS px, and the shortest edge-to-edge distance between the hit areas of neighbouring primary controls is ≥ 8 CSS px **[calibrating]**. Touch viewports: matrix entries captured with touch emulation (`hasTouch`, `pointer: coarse`), by default every width below 1024 CSS px. Primary controls: a surface's primary action (`PRODUCT.md` or `config.json`), controls used by journey steps, primary navigation items, form submit buttons and dialog action buttons; inline links in running text are excluded. Hit area: the element's border box, united with its associated `<label>` box for inputs (ADR-032) | D | PLAT-040, CRAFT-047 |

**Content mechanics**

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| CPY-01 | No placeholder text shipped | 0 occurrences of lorem ipsum, TODO, TBD, template braces and similar, outside visibly labelled placeholders | S/D | CRAFT-007 |
| CPY-02 | Descriptive link text | 0 links whose accessible name is only "click here", "here", "read more" or "learn more" without context (zh: 点击这里, 点此, 这里, 更多, 了解更多 without context). Implements WCAG 2.4.4 (Level A), so it cannot be waived | D | PLAT-126, WCAG 2.4.4 |
| CPY-03 | Case consistency | one case convention per element type (buttons, headings, navigation) across the run scope | D | PLAT-120, CRAFT-056 |
| CPY-04 | Error-message quality | 0 generic, blaming or code-only messages in exercised error states: "An error occurred", "Invalid", "Oops", "Something went wrong" without a fix, "forbidden", "illegal", "you forgot", a raw error code alone; zh equivalents as listed in `cjk.md`. ("please" and "sorry" for user errors are advisory, CPY-09) | I/S | PLAT-094, HCI-070 |

**Localisation** (I18N-01 and I18N-02 apply when a CJK locale is in scope; I18N-03 applies in every locale)

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| I18N-01 | Explicit CJK font stack | content CJK text resolves through declared CJK families (e.g. PingFang SC → Hiragino Sans GB → Microsoft YaHei → Noto Sans SC); `system-ui` and `ui-sans-serif` are not the content face | S/D | PLAT-017 (incl. Tailwind PR #20318) |
| I18N-02 | Regional families | Traditional Chinese pages use TC/HK families, never SC | D | PLAT-131 |
| I18N-03 | Restricted fonts not self-hosted (all locales) | SF Pro/New York, Segoe UI, PingFang, Microsoft YaHei and GDS Transport are referenced by local name only | S | PLAT-017 |

### G4 — Deliberateness and anti-slop

G4 implements P2, P4 and P12. A **hard tell** is detected deterministically with high source reliability. A **soft tell** depends more on context and is reviewed rather than blocked. The full versioned catalogue, with detection rules, reliability and status, is `references/knowledge/anti-slop.md` and `assets/data/tells.json`. A tell is promoted from soft to hard only when its detector reaches precision ≥ 0.9 on the labelled set [CRAFT-061].

**Decision records**

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| DEC-01 | `PRODUCT.md` complete | required fields present, including surfaces with their single job and mode; inferred facts labelled; a facts section (claims the UI may make) present | S | CRAFT-001, IMP-002/003 |
| DEC-02 | `DESIGN.md` complete and valid | lints clean (`@google/design.md lint` when available, otherwise the bundled validator); references the surfaces and modes in `PRODUCT.md`; declares brand attributes as "X, not Y", colour strategy, voice and tone positions, type roles and scale, spacing, radius, elevation and motion tokens | S | CRAFT-002, IMP-002 |
| DEC-03 | Direction record for new work or redesigns | ≥ 2 directions elaborated (3 dealt by default); category default and predictable opposite named as off-limits; convergence tests (similar-prompt, category-guess, swap) recorded with revisions; choice and rationale recorded; roll seed recorded | S | CRAFT-003/004, IMP-006/007 |
| DEC-04 | Ledger variety for new work | the newest entry of the project ledger (`.ui-evaluator/ledger.json`) differs from the 3 entries before it (all of them when there are fewer) in display face and macrostructure, unless the brand pins them; `not_applicable` when the project ledger has no earlier entry (first direction in this project). Repeats found in the opt-in cross-project ledger (`~/.ui-evaluator/ledger.json`) are listed in the criterion's detail as advisory and never change its state (ADR-034) | S | CRAFT-010 |

**Hard tells** (each must be absent, or accepted in `DESIGN.md` with a reason. SLP-12 and SLP-13 cannot be accepted, because honesty outranks the brief (P12). SLP-09 and the dark-neon variant of SLP-08 are rated weak alone by the sources, so they stay provisional until calibration: the owner may disposition them with a reason, as for a soft tell)

| ID | Tell | Detection summary | Src |
|---|---|---|---|
| SLP-01 | Gradient text | `background-clip: text` with a gradient on the same element | CRAFT-017, IMP-014 |
| SLP-02 | Default indigo-violet accent | gradient stops or filled CTA backgrounds in the indigo-violet band (OKLCH hue 260–310° with chroma ≥ 0.10 and lightness 0.25–0.85 **[calibrating]**, or HSL hue 250–310° with saturation > 0.25 and 0.15 < L < 0.85), or `from-/to-/bg-{purple,violet,indigo}-*` utilities on calls to action, when the hue is not in the documented brand palette | CRAFT-016 |
| SLP-03 | Emoji or Unicode glyphs as icons | emoji or pictographic glyphs used as icons, bullets or navigation prefixes (chat and user content exempt) | CRAFT-025, IMP-014 |
| SLP-04 | Decorative side stripe | coloured side border ≥ 3 px (≥ 2 px if rounded), or ≥ 2× the other sides, on non-semantic cards, callouts or list items | CRAFT-014, IMP-014 |
| SLP-05 | Eyebrow or kicker labels | short uppercase or tracked label (≤ 14 px, letter-spacing ≥ 0.06em, 2–34 characters) directly above an h1–h4 ≥ 20 px, used more than ceil(sections ÷ 3) times on a page or split into a different grid column; any pill or eyebrow above an h1 ≥ 48 px | CRAFT-018, IMP-014 |
| SLP-06 | Icon-tile feature template | ≥ 3 equal sibling cards, each with a 32–128 px near-square icon tile above a heading | CRAFT-019, IMP-014 |
| SLP-07 | Card kit | a card-like element nested in a card-like ancestor; or identical `box-shadow` on ≥ 4 cards together with one radius ≥ 16 px on > 80% of rounded elements | CRAFT-022/023 |
| SLP-08 | Decorative glow | zero-offset chromatic shadow (CIE LCh chroma ≥ 30, blur > 4 px); chromatic blurred shadow on a ground with luminance < 0.1; chromatic radial washes behind heroes, unless named in the direction | CRAFT-021, IMP-023 |
| SLP-09 | Uniform entrance animation | the same entrance keyframes or variants on ≥ 3 sections | CRAFT-028, IMP-021 |
| SLP-10 | Fake chrome | traffic-light title bars, mock URL pills, CSS or SVG device frames, div-built "screenshots" of dashboards or terminals | CRAFT-026 |
| SLP-11 | Simulated liveness | pulsing dots, blinking cursors outside inputs, marquees, count-up numbers not tied to live data | CRAFT-027 |
| SLP-12 | Fabricated proof | numbers, "trusted by" logo sets, testimonials, ratings, badges or customer names absent from the facts section and not labelled as placeholders | CRAFT-007, IMP-028 |
| SLP-13 | Placeholder identities | "Jane Doe", "John Smith", "Acme", `example.com` addresses and similar in shipped UI outside labelled demo data | DSL C4, CRAFT-007 |
| SLP-14 | Copy tells | buzzword or theatre-phrase hits; ≥ 3 aphoristic constructions; generic hero copy; ≥ 8 em dashes at ≥ 1 per 500 characters of Latin-script text (the Chinese 破折号 —— is standard punctuation and is not counted) | CRAFT-024, IMP-027, PLAT-121 |
| SLP-15 | Generic CTA set | the only calls to action are generic ("Get started", "Learn more" and equivalents) | CRAFT-024 |

**Soft tells** (each needs one disposition [ADR-031]: *fixed*; *accepted*, recorded in `DESIGN.md` `ui-evaluator.accepted_tells` with a reason tied to the brief or the direction; *disputed*, with evidence on the finding that the detection is wrong, until a reviewer settles it; or *deferred*, left in the shipped UI and logged in `debt.md` with an owner, which includes a `wont_fix` soft tell not listed in `accepted_tells`). The table lists the original set; every catalogue soft tell with status active or rising (SLP-20…49, in `anti-slop.md`) is covered by the same rule. Experimental tells (SLP-50+) are reported as "possible" only and never count toward G4

| ID | Tell | Src |
|---|---|---|
| SLP-20 | Saturated display or only face without a recorded reason (dated list) | CRAFT-015, IMP-013 |
| SLP-21 | Second-order house looks when unrequested: cream ground + high-contrast serif + terracotta; near-black + single acid accent; broadsheet hairlines + italic serif + tracked mono labels | CRAFT-020, IMP-012 |
| SLP-22 | SaaS hero formula: badge + oversized centred headline + two CTAs incl. gradient primary + decorative orb + generic copy | 07 A-LA1, CRAFT C13 |
| SLP-23 | Radius monotony: > 80% of non-zero radii share one value ≥ 16 px without a documented system | CRAFT-023 |
| SLP-24 | Mixed icon libraries, or default glyphs in default roles | CRAFT-025/044 |
| SLP-25 | Structure that carries no information: 01/02/03 markers on non-sequential content, monospace meta labels, unmotivated italic accent word in a headline | IMP-025, IMP C7 |
| SLP-26 | Motion clichés: image hover zoom, uniform hover-scale on unrelated elements, > 1 simultaneous hover property change | CRAFT-028 |

**Density and gate rule.** Tell density per page is the number of distinct tell IDs detected on that page, excluding requested and experimental tells, reported in Krebs' tiers: 0–1 low, 2–3 medium, 4+ high [CRAFT-013]. G4 passes when DEC-01…04 pass, there are **0 unaccepted hard tells**, **every soft tell has a disposition**, and **no page carries more than 1 deferred soft tell** (distinct tell IDs). A soft tell with no disposition fails G4. Older wording "unaddressed soft tell" means a deferred one [ADR-031].

### G5 — Analytical usability

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| USE-01 | Heuristic-evaluation protocol | standard depth: ≥ 3 isolated evaluators, 2 passes each (flow pass, then element pass), one problem per record, principle cited, context packet given | A | HCI-002/003/004/005/031 |
| USE-02 | Consolidation | deterministic-key merge done; any-two agreement and detection counts reported | S | HCI-014/015, EVAL C5 |
| USE-03 | Verification | every reported finding passed the verification chain: evidence resolves, behaviour exercised, harness artefact excluded, in scope, absence claims backed by positive evidence | A/I | HCI-006/007/026, EVAL noodisD |
| USE-04 | Blind severity | ≥ 3 independent raters per confirmed finding; validity votes, the mean of problem and trade-off values, spread and factors stored; spread ≥ 2, or a `not_a_problem` vote against a mean ≥ 2.5, marked divergent | A | HCI-009/010, EVAL C2 |
| USE-05 | No open P0 | 0 findings with mean severity ≥ 3.5 in status open, in_progress, blocked, fixed, reopened, disputed or deferred. A P0 cannot be deferred to pass this criterion, and waiting on a decision (blocked, ADR-036) does not pass it either | S | HCI-012, LOOP-058 |
| USE-06 | Every P1 has a decision | each P1 is `verified`, `deferred` (reason, owner, revisit trigger), `disputed` with a study planned, or `wont_fix` as a justified trade-off | S | HCI-012/013 |
| USE-07 | Cognitive walkthrough of critical journeys | each critical journey walked with persona, task and correct action sequence fixed first; four questions per step; no failed step left without a decision | A | HCI-019/020/022 |
| USE-08 | Task suitability | every declared top task can be completed with what the UI offers | A/I | HCI-076 |
| USE-09 | Interaction coverage | ≥ 90% of salient interactive controls in scope exercised or explicitly out of scope **[calibrating]** | I | HCI-008 |
| USE-10 | Cross-screen consistency pass | done, with findings merged | A | HCI-031 |
| USE-11 | AI features audited (when the UI contains AI features) | every AI feature checked against HAX G1–G18, with explicit prompted checks for G5, G6 and G11 and PAIR error classification; `not_applicable` when there are no AI features | A | HCI-075 |

Quick depth cannot pass G5: its state is at most `degraded`.

### G6 — Design-quality panel

G6 never gates on a score. It gates on verified, agreed findings and on the critics' categorical verdicts: specificity, brand fit and appeal [P7].

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| DES-01 | Panel protocol | standard depth: ≥ 3 isolated critics; no build transcript; specificity written before detector output is shown; screenshots from the full matrix | A | CRAFT-012, IMP-032/036 |
| DES-02 | Specificity verdict | a majority of critics judge the design specific to this product, citing evidence from the swap, category-guess and similar-prompt tests | A | CRAFT-004, IMP-035 |
| DES-03 | No agreed severe design finding | 0 open design findings with mean severity ≥ 3 that were raised by ≥ 2 critics or confirmed by the verifier against the rendered UI, unless decided (as USE-06). A single-critic finding the verifier marks `needs_human` is not agreed | A | IMP-035, P8 |
| DES-04 | Brand fit | a majority of critics judge the declared "X, not Y" attributes as reflected, citing elements | A | CRAFT-001/057 |
| DES-05 | Not worse than baseline (redesigns) | pairwise comparison with the baseline in both orders; only order-consistent preferences count, and a preference that flips with order counts as a tie; the new version is preferred or tied by the majority | A | HCI-034, CRAFT-062 |
| DES-06 | Rubric scores reported, labelled *(judged)* | present; never used for pass/fail | A | IMP-035, DSL X20 |
| DES-07 | Appeal verdict | a majority of critics judge the design `appealing` (finished, cared for, attractive to its audience, with visual interest its mode allows), written before detector output is shown and citing elements; `plain` and `unappealing` name the signs of unfinish | A | ADR-035 |

The rubric (0–4 with written anchors): Specificity, Hierarchy, Coherence, Restraint, Brand fit, Execution, Appeal. It covers Anthropic's four criteria (design quality, originality, craft, functionality), with functionality covered by G1 and G5. Appeal adds expressive aesthetics and finish to the classical ones (order, clarity, consistency) that the other criteria measure (ADR-035). Anchors and exemplars are in `references/methods/design-panel.md` and cover several aesthetics, so that no single look is taught [CRAFT-064].

### G7 — Empirical validation

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| EMP-01 | Study plan | objectives → research questions → participants → tasks with success criteria → measures → analysis plan → ethics and consent; flat incentives | H | HCI-044, lecture |
| EMP-02 | Formative round | moderated round with about 5 participants for a single primary user group (3–4 per group when two groups are tested; ≥ 3 per group for three or more); think-aloud; neutral probes; clue-free tasks from the journeys | U | HCI-041/045/046 |
| EMP-03 | Observed problems integrated | each logged with k/n; merged with analytical findings; severity re-rated with observed frequency | U/A | HCI-057, EVAL §3.5 |
| EMP-04 | Critical tasks succeed | in the latest round, each critical task completed without assistance by ≥ 80% of participants (e.g. ≥ 4 of 5); no open observed severity-4 problem | U | HCI-049, §6 |
| EMP-05 | Fixes re-tested | every observed problem of severity ≥ 3 fixed and re-tested with users; fix confidence 1 − (1 − p)^n reported | U | HCI-038/039 |
| EMP-06 | Honest metrics | task success with 95% adjusted-Wald CI; SEQ mean with CI; SUS with CI if collected; time as geometric mean; no NPS or SUS reported from a 5-user formative round as a benchmark | U | HCI-049…055 |
| EMP-07 | (optional) Desirability | share of participants choosing ≥ 1 pre-registered on-brand word from a ~25-word reaction-card list (~40% negative); 5-second test | U | CRAFT-063 |
| EMP-08 | (optional) Experiment validity | pre-registered success metric and guardrails; power analysis; SRM check passed; fixed horizon or always-valid inference | U | HCI-060/061/062 |

---

## 5. Mode-dependent thresholds

| Criterion | Persuade | Operate | Read | Experience |
|---|---|---|---|---|
| TYP-02 body size | ≥ 16 px | ≥ 14 px | ≥ 16 px | ≥ 16 px |
| TYP-06 adjacent step | ≥ 1.25 | ≥ 1.125 (target 1.125–1.2) | ≥ 1.25 | ≥ 1.25 |
| COL-03 default strategy | declared | Restrained | Restrained | declared |
| MOT-02 state transitions | ≤ 300 ms | ≤ 250 ms | ≤ 300 ms | ≤ 300 ms |
| MOT-07 choreography | ≤ 1 orchestrated sequence per screen | none beyond one page fade | none beyond one page fade | as declared in `DESIGN.md`; default ≤ 1 per screen |
| Hero moments (PLAT-002) | ≤ 1 per screen | 0 | 0 | ≤ 1 per screen |
| Density (PLAT-038) | — | constant within a page | — | — |

Product-wide: at most 2 hero moments per product across all surfaces (PLAT-002; FRAMEWORK P4). Hero moments have no detector; critics judge them under Restraint (DES rubric).

## 6. Priority policy for gating

- Priority comes from mean severity: ≥ 3.5 P0; ≥ 2.5 P1; ≥ 1.5 P2; ≥ 0.5 P3; otherwise dropped.
- G1 and G2 failures are at least P1 regardless of rated severity.
- Peripheral-journey findings are capped at P2. When the cap and the G1/G2 floor disagree, the floor wins (P11).
- Divergent findings (spread ≥ 2, or a `not_a_problem` vote against a mean ≥ 2.5; ADR-029) keep their mean for ordering but are flagged for study. They cannot be closed by a vote.
- Over-long lists are dominated by minor problems. The "fix now" queue holds P0, P1 and quick P2 wins (ease of fix 1). Other P2 and P3 items go to the debt register [HCI-077].

## 7. Calibration status of thresholds

| Class | Examples | Status |
|---|---|---|
| Normative standard | WCAG 2.2 contrast, reflow, text spacing, target size | Fixed; changes only with the standard |
| Cross-system consensus | 12 px minimum text, 16 px reading body, 4 px spacing base, line height ≥ 1.4, 45–75 character measure, motion ≤ 300 ms for state changes, exits shorter than entrances | Stable; changes need a new source |
| Source-specific detector thresholds | eyebrow geometry, glow chroma, side-stripe widths, em-dash density, purple hue range | Adopted from impeccable, Krebs, gstack and Hallmark; precision to be measured |
| UI-Evaluator proposals **[calibrating]** | COL-01 90%, COL-02 chroma 0.05, COL-03 10% accent area, LAY-01 90%, USE-09 90%, CMP-02 focus metric; MOT-04 displacement limits, CMP-03 2:1 disabled floor, CMP-06 touch-viewport, primary-control and hit-area definitions (ADR-032) | Gate as written; owner may overrule with reason until calibrated |

## 8. What passing does not mean

- **Not "beautiful to everyone".** Aesthetic response varies between people and cultures, and taste ratings are noisy (designers reached α = 0.37 on shared pairs in UIClip's data). L4 with a desirability test is the strongest evidence the framework can give.
- **Not "no usability problems".** Panels miss problems. Reports include a coverage statement and an estimate of undiscovered problems.
- **Not "WCAG conformant"** unless a human has completed the needs-human criteria (L3), and even then the claim covers the evaluated scope only.
- **Not "not AI-made".** The framework detects the *absence of decisions*. It never certifies authorship, and it never accuses anyone of using AI.
- **Not a business outcome.** Conversion and retention claims require E5 evidence from experiments.
