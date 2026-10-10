# UI evaluation report: Fernhill Tool Library reservations · run 20261009-223245-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:669e749ec4 (uncommitted changes present) · run opened 2026-10-10T02:32:45.050Z |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Surfaces and modes | find (operate), tool (operate), basket (operate), confirm (operate), done (read) |
| Routes × states | 5 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-10T02:32:00.783Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | 1c331b1f 1c331b1f 1c331b1f |
| walkthrough-evaluator | 1 | subagent | claude-opus-5-5 | 9ade5d9d |
| design-critic | 3 | subagent | claude-opus-5-5 | e83edd06 e83edd06 e83edd06 |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 6609ebfd |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 09a98abb 446ab7ab |
| finding-verifier | 4 | subagent | claude-opus-5-5 | d24cf4c2 1519ce58 0bad1166 e4c0188a |
| severity-rater | 3 | subagent | claude-opus-5-5 | c97214fb b1dabd70 157272cf |

Coverage: 540 valid capture(s); 100% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (1 finding(s)); FUN-06 (2 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (5 finding(s)); A11Y-05 (1 finding(s)); A11Y-07 (1 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-06 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-05, A11Y-07, A11Y-08, A11Y-09, A11Y-11, A11Y-17, A11Y-27 |
| G3 Craft floor | fail | TYP-05, COL-01, LAY-01, LAY-04, LAY-05, CMP-04, CMP-05, CMP-06 |
| G4 Deliberateness and anti-slop | pass | — |
| G5 Analytical usability | fail | USE-05, USE-06 |
| G6 Design quality | fail | DES-02, DES-04, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

Each seen at 375 px, the width members mostly use:

- Error summaries on basket and confirm take focus, link to each field, give an example format and keep what was typed, in dark mode too (`evidence/screens/confirm-html-items-drill-18v-two-day-2026-10-17-slot-sat-202/errors/375-dark.png`).
- The confirm page says "Nothing is paid online" and states the deposit before committing (same capture).
- The done page says where to go, what to bring and what to do if the session is missed (`evidence/screens/done-html-items-drill-18v-two-day-2026-10-17-slot-sat-2026-1/default/375-light.png`).
- Calendar day buttons announce full dates and "open" for session days and echo the chosen day in words (tool/day-chosen ARIA snapshot).
- A single visible focus ring with light and dark values; reduced motion removes the only two transitions.

- Error summaries on basket and confirm are role=alert, receive focus, link to each field, and each field shows its own error text with an example format
- Calendar day buttons expose full dates and 'open' in their names and use aria-pressed for the chosen day
- Focus ring remains visible under forced colours on inputs and buttons
- A single global :focus-visible ring (3px, --color-focus, 2px offset) that differs from every hover style, with a light and a dark value
- Reduced motion removes the only two transitions (button colour, toast fade), matching design.md Motion
- Error summaries take focus and link to fields; field errors are tied to inputs with aria-describedby and aria-invalid
- Removing a basket item moves focus to the page heading, so keyboard focus is not lost when the row disappears
- Confirm page errors are summarised at the top, linked to fields, worded with an example, and keep what was typed

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.59 (mean Jaccard over 3 passes); an estimated 0.6 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0024 · Focus order jumps back: "Electric wet tile saw, 180 mm" → "Search tools"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0024 | Focus order jumps back: "Electric wet tile saw, 180 mm" → "Search tools" | 4 · catastrophe (rule) | 2 · one component or file | A11Y-03 | Keyboard |

**Problem.** After "Electric wet tile saw, 180 mm", Tab moves to "Search tools", which sits 654 px above it in the same column; the focus order does not follow the visual reading order (clear-inversion heuristic).

**Evidence.** Where: /?items=ladder-3m `#q` at 1280 px; /?items=ladder-3m [filters-open] `#q` at 1280 px; /?items=ladder-3m [no-results] `#q` at 1280 px and 6 more. E1, reproduced or measured · evidence/crops/keyboard/21774f91d1.png, evidence/crops/keyboard/8c55f79d69.png, evidence/crops/keyboard/6b7d343985.png, .ui-evaluator/runs/20261009-223245-audit-standard/evidence/aria/items-ladder-3m/no-results/375-light.yml. Ratings: rule: 4.

**Recommendation.** Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.4.3 Focus order; H2-7 Flexibility and efficiency of use; WCAG 1.3.2 Meaningful sequence; CW-Q2 Is the action visible?; H2-6 Recognition rather than recall; H2-4 Consistency and standards

#### F-0026 · Not reachable by keyboard: "Fernhill Tool Library"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0026 | Not reachable by keyboard: "Fernhill Tool Library" | 4 · catastrophe (rule) | 2 · one component or file | A11Y-03 | Keyboard |

**Problem.** The a "Fernhill Tool Library" is tabbable in the DOM, but a complete Tab walk never reached it. People who use a keyboard or switch cannot operate it.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `div > a.library-name` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `li:nth-of-type(1) > a` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#basket-link` at 320 px and 5 more. E1, reproduced or measured · evidence/crops/keyboard/838d70f50d.png, evidence/crops/keyboard/68977968e8.png, evidence/crops/keyboard/7a8cae446c.png, evidence/crops/keyboard/062afdd805.png. Ratings: rule: 4.

**Recommendation.** Put the control back in the Tab order (remove tabindex="-1") or give its function a reachable equivalent. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.1.1 Keyboard

#### F-0039 · Once the hold has expired, Continue fails on every retry

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0039 | Once the hold has expired, Continue fails on every retry | 4 · catastrophe | 2 · one component or file | H2-9 | Help users recognize, diagnose and recover from errors |

**Problem.** A recoverable error should be recoverable from the page that shows it. hold_started is set once and only cleared by the 'Reserve another tool' link on the done page; startHoldIfNeeded() never restarts an expired hold, removing items or re-adding tools does not reset it, and holdExpired() stays true. Every later Continue in the same tab shows the same error, although the message says 'Try again.' A member whose hold expired may be unable to finish a reservation in that tab at all and may give up or call the desk.

**Evidence.** Where: /basket.html [errors] `#continue`. E1, reproduced or measured · app.js:90-100, 269, 288, 452-455, .ui-evaluator/runs/20261009-223245-audit-standard/probes/vp1-hold/step-20.png, .ui-evaluator/runs/20261009-223245-audit-standard/probes/vp1-hold/step-25.png, .ui-evaluator/runs/20261009-223245-audit-standard/probes/vp1-hold/probe.json · found by 1 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Restart the hold when the basket changes or when the member retries after expiry; clear it when the basket becomes empty. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: H2-3 User control and freedom

#### F-0054 · 'Reserve this tool' only adds to a basket; nothing tells a first-time member the reservation is unfinished

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0054 | 'Reserve this tool' only adds to a basket; nothing tells a first-time member the reservat… | 3.67 · catastrophe | 2 · one component or file | CW-Q1 | Does the effect of the action match the user’s goal? |

**Problem.** Journey reserve-tool-for-saturday, steps 6-7. The persona taps 'Reserve this tool' expecting the drill to be reserved. The only response is a toast 'Added to your basket' that overlays the calendar and is gone within 5 s, plus the header count changing to 'Basket (1)'. The button label is unchanged and the toast has no link onward. The persona has every reason to believe the job is done and close the page (CW-Q1 fails at step 7: the basket checkout is a hidden prerequisite). The feedback also names a different effect from the one the button promised (CW-Q4 fails at step 6). Missing knowledge: that 'Reserve' means 'hold in basket' and two more screens remain. Missing feedback: a lasting message that the reservation is not complete and a direct way to continue. Step verdicts: step 6 would_with_effort, step 7 would_not.

**Evidence.** Where: /tool.html?id=drill-18v-two [added] `role=button[name="Reserve this tool"]` at 375 px; /tool.html?id=drill-18v-two [added (after toast timeout)] `#basket-link` at 375 px; /tool.html?id=drill-18v-two [added] `#reserve` at 375 px and 2 more. E1, reproduced or measured · probes/5/final.png, probes/10/final.png, probes/5/aria.yml, probes/109 · found by 3 of 10 evaluator(s). Ratings: 3.67 (spread 1; 3, 4, 4).

**Recommendation.** Either make the button do what it says, or rename it to match the effect and keep a persistent 'Held in your basket - finish your reservation' message with a link to the basket. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: CW-Q4 Will the user understand the feedback?; H2-1 Visibility of system status; H2-2 Match between system and the real world; H2-6 Recognition rather than recall

### P1

#### F-0001 · axe color-contrast: Elements must meet minimum color contrast ratio thresholds

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0001 | axe color-contrast: Elements must meet minimum color contrast ratio thresholds | 3 · major (rule) | 1 · one value or token | A11Y-01 | axe-core with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wca… |

**Problem.** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds (serious impact). Fix any of the following: Element has insufficient color contrast of 3.07 (foreground color: #2f7d4a, background color: #1d2622, font size: 12.0pt (16px), font weight: bold). Expected contrast ratio of 4.5:1

**Evidence.** Where: /?items=ladder-3m `li:nth-child(1) > article > .card__body > .badge--ok` at 320 px; /?items=ladder-3m [filters-open] `li:nth-child(1) > article > .card__body > .badge--ok` at 320 px; /?items=ladder-3m [no-results] `li:nth-child(1) > article > .card__body > .badge--ok` at 320 px. E1, reproduced or measured · evidence/crops/axe/18411bfd96.png, evidence/crops/axe/3bef716856.png, evidence/crops/axe/dc97380445.png, evidence/axe/items-ladder-3m/default/320-dark.json. Ratings: rule: 3.

**Recommendation.** Elements must meet minimum color contrast ratio thresholds (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.3 Contrast, minimum

#### F-0002 · Text contrast below 4.5:1: "Available from Sat 10 Oct"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0002 | Text contrast below 4.5:1: "Available from Sat 10 Oct" | 3 · major (rule) | 1 · one value or token | A11Y-11 | Text contrast ≥ 4.5 |

**Problem.** Text "Available from Sat 10 Oct" (16 px, weight 700) has 3.07:1 against its computed background in the dark theme at 320 px; it needs 4.5:1.

**Evidence.** Where: /?items=ladder-3m `li:nth-of-type(1) > article.card > div.card__body > span.ba…` at 320 px; /?items=ladder-3m [filters-open] `li:nth-of-type(1) > article.card > div.card__body > span.ba…` at 320 px; /?items=ladder-3m [no-results] `li:nth-of-type(1) > article.card > div.card__body > span.ba…` at 320 px. E1, reproduced or measured · evidence/crops/contrast/8ca4c82fa9.png, evidence/crops/contrast/db3b172e92.png, evidence/crops/contrast/b65bd45047.png. Ratings: rule: 3.

**Recommendation.** Change the colour role token for this text (or add a solid backing behind text over media). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.3 Contrast, minimum

#### F-0010 · Text clips at 200 % text size in li:nth-of-type(1) > article.card > div.card__body > h2.card_

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0010 | Text clips at 200 % text size in li:nth-of-type(1) > article.card > div.card__body > h2.c… | 3 · major (rule) | 1 · one value or token | A11Y-09 | 200% text resize |

**Problem.** With the root font size at 200 %, text ("Cordless drill 18 V, combi, two batteries") is cut off at 1280 px.

**Evidence.** Where: /?items=ladder-3m `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px; /?items=ladder-3m [filters-open] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px; /?items=ladder-3m [no-results] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px and 3 more. E1, reproduced or measured · evidence/crops/layout/0c5ce2f8b8.png, evidence/crops/layout/705f8bef22.png, evidence/crops/layout/975ffaf27c.png. Ratings: rule: 3.

**Recommendation.** Size text and its containers in rem or em and avoid fixed heights. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.4 Resize text

#### F-0011 · Overlapping text: #reserve

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0011 | Overlapping text: #reserve | 3 · major (rule) | 1 · one value or token | FUN-06 | No clipped or overlapping text at rest at any matrix width |

**Problem.** At 1280 px, text of #reserve ("Reserve this tool") overlaps text of button.day:nth-of-type(9) > span.day__num ("17") by 16×14 px.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m `#reserve` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#reserve` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#calendar > div:nth-of-type(7)` at 1280 px and 23 more. E1, reproduced or measured · evidence/crops/layout/c6536f3b1a.png, evidence/crops/layout/91f35b0a6e.png, evidence/crops/layout/e0f62069ec.png, evidence/crops/layout/926388d864.png. Ratings: rule: 3.

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open · Also: A11Y-08 Text-spacing override; WCAG 1.4.12 Text spacing; A11Y-09 200% text resize; WCAG 1.4.4 Resize text

#### F-0012 · Horizontal page overflow on /?items=ladder-3m

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0012 | Horizontal page overflow on /?items=ladder-3m | 3 · major (rule) | 1 · one value or token | FUN-05 | No horizontal page overflow at any matrix width |

**Problem.** scrollWidth 346 px > clientWidth 320 px at 320 px. Widest offender: #results > li:nth-of-type(1) extends 26 px past the viewport; 9 more.

**Evidence.** Where: /?items=ladder-3m `#results > li:nth-of-type(1)` at 320 px; /?items=ladder-3m [filters-open] `#results > li:nth-of-type(1)` at 320 px; /?items=ladder-3m [no-results] `#results > li:nth-of-type(1)` at 320 px. E1, reproduced or measured · evidence/crops/layout/c79960eab1.png, evidence/crops/layout/1a983fa7d6.png, evidence/crops/layout/02afb767b5.png. Ratings: rule: 3.

**Recommendation.** Constrain the element (max-width: 100%, min-width: 0 on flex and grid children, overflow-wrap: anywhere) or give genuinely 2-D content its own scroll region and declare it in two_d_regions. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open

#### F-0013 · Content does not reflow at 320 px on /?items=ladder-3m

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0013 | Content does not reflow at 320 px on /?items=ladder-3m | 3 · major (rule) | 1 · one value or token | A11Y-07 | Reflow at 320 CSS px without two-dimensional scrolling |

**Problem.** scrollWidth 346 px > clientWidth 320 px at 320 px. Widest offender: #results > li:nth-of-type(1) extends 26 px past the viewport; 9 more.

**Evidence.** Where: /?items=ladder-3m `#results > li:nth-of-type(1)` at 320 px; /?items=ladder-3m [filters-open] `#results > li:nth-of-type(1)` at 320 px; /?items=ladder-3m [no-results] `#results > li:nth-of-type(1)` at 320 px. E1, reproduced or measured · evidence/crops/layout/b2299124de.png, evidence/crops/layout/767b3d53a7.png, evidence/crops/layout/163b4d1a54.png. Ratings: rule: 3.

**Recommendation.** Constrain the element (max-width: 100%, min-width: 0 on flex and grid children, overflow-wrap: anywhere) or give genuinely 2-D content its own scroll region and declare it in two_d_regions. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.10 Reflow

#### F-0014 · Clipped text in li:nth-of-type(1) > article.card > div.card__body > h2.card_

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0014 | Clipped text in li:nth-of-type(1) > article.card > div.card__body > h2.card_ | 3 · major (rule) | 1 · one value or token | FUN-06 | No clipped or overlapping text at rest at any matrix width |

**Problem.** Text ("Cordless drill 18 V, combi, two batteries") overflows a box with overflow hidden at 320 px (scroll 327×46 vs client 184×46, axis x).

**Evidence.** Where: /?items=ladder-3m `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 320 px; /?items=ladder-3m [filters-open] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 320 px; /?items=ladder-3m [no-results] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 320 px and 2 more. E1, reproduced or measured · evidence/crops/layout/4b4ac660ea.png, evidence/crops/layout/5985fa3bb2.png, evidence/crops/layout/e7d97fe9bb.png, evidence/screens/items-ladder-3m/default/375-light.png. Ratings: rule: 3.

**Recommendation.** Let titles wrap to two lines on narrow screens. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; H2-2 Match between system and the real world; H2-8 Aesthetic and minimalist design

#### F-0027 · Basket pick-up sessions are shown in reverse order to their reading and focus order

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0027 | Basket pick-up sessions are shown in reverse order to their reading and focus order | 3 · major | 1 · one value or token | WCAG 1.3.2 | Meaningful sequence |

**Problem.** Sessions should be presented, read and focused in the same order, ideally by date. In the DOM and ARIA snapshot the six radios run Saturday 10 October to Wednesday 28 October. On screen they are reversed: at 320 px Wednesday 28 October is at the top and Saturday 10 October at the bottom; at 1280 px Wednesday 28 October fills a full-width first row and the rest run right to left, Saturday 24 to Saturday 10. Probe 72: Tab into the group lands on Saturday 10 October, which is at the bottom right, and ArrowDown moves to and selects Wednesday 14 October, the card to its left. Keyboard and screen-magnifier users may see focus jump backwards across the cards, and an arrow press selects a session they did not look at. Screen-reader users hear the dates in an order that differs from what a sighted helper sees, so the earliest session may be picked by mistake.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 1280 px; /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 320 px; /basket.html?items=drill-18v-two&day=2026-10-17 [errors] `role=group[name="Pick-up session"]` at 1280 px and 6 more. E1, reproduced or measured · .ui-evaluator/runs/20261009-223245-audit-standard/probes/72/, .ui-evaluator/runs/20261009-223245-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, .ui-evaluator/runs/20261009-223245-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/320-light.png, .ui-evaluator/runs/20261009-223245-audit-standard/evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.yml · found by 6 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Lay the radios out in DOM order (remove the reversing flex or grid placement) so visual, reading and focus order all run earliest to latest. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.3 Focus order; A11Y-03 Keyboard; H2-2 Match between system and the real world; H2-4 Consistency and standards; CW-Q2 Is the action visible?

#### F-0145 · Tab and Shift+Tab cannot leave the open loan-length listbox

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0145 | Tab and Shift+Tab cannot leave the open loan-length listbox | 3 · major | 1 · one value or token | WCAG 2.1.2 | No keyboard trap |

**Problem.** Focus cycles among the options until one is chosen; this duplicates F-0034. Keyboard-only members who open the loan list to check the options may be unable to leave it without changing their loan length, and may give up before choosing a pick-up day.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#loan-list` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#loan-button` at 1280 px. E1, reproduced or measured · .ui-evaluator/runs/20261009-223245-audit-standard/probes/69/, .ui-evaluator/runs/20261009-223245-audit-standard/probes/70/, .ui-evaluator/runs/20261009-223245-audit-standard/probes/71/, .ui-evaluator/runs/20261009-223245-audit-standard/probes/111/ · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Use a native <select> or two radios for a two-option choice. If the custom listbox stays, Esc closes it without changing the value and returns focus to the button, and Tab closes it and moves on. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: A11Y-25 —; A11Y-03 Keyboard

#### F-0031 · Basket asks for a pick-up session without preselecting the day already chosen on the tool page

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0031 | Basket asks for a pick-up session without preselecting the day already chosen on the tool… | 3 · major | 2 · one component or file | H2-6 | Recognition rather than recall |

**Problem.** Members should not have to remember and re-make a choice the flow already has. On the tool page the member chose Saturday 17 October; the basket line repeats 'Pick up Saturday 17 October', but none of the six session radios is selected, the Saturday 17 October option sits in the middle of a reversed list, and Continue without a choice shows an error. Older or distracted members may pick a different session from the day they chose, or meet an error they did not expect, adding a step to the critical reservation journey.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 1280 px; /tool.html?id=drill-18v-two [day-chosen] `#calendar` at 375 px; /basket.html `role=group[name="Pick-up session"]` at 375 px and 3 more. E1, reproduced or measured · .ui-evaluator/runs/20261009-223245-audit-standard/evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.yml, .ui-evaluator/runs/20261009-223245-audit-standard/evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/1280-light.yml, probes/8/, evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/default/375-light.yml · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Preselect the session on the chosen pick-up day, or merge the day and session choice into one step. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-7 Flexibility and efficiency of use; H2-4 Consistency and standards; H2-2 Match between system and the real world; H2-5 Error prevention

#### F-0034 · Tab key is captured inside the loan-length list, so keyboard focus cannot leave it

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0034 | Tab key is captured inside the loan-length list, so keyboard focus cannot leave it | 3 · major | 1 · one value or token | WCAG 2.1.2 | No keyboard trap |

**Problem.** Keyboard users must be able to move focus away from any component (WCAG 2.1.2). The listbox keydown handler treats Tab like ArrowDown and calls preventDefault, cycling focus among the options; Shift+Tab is caught too because the check is e.key === 'Tab'. Focus only leaves when an option is activated with Enter or Space. A keyboard or switch user who opens the list to look at the options may be stuck until they guess that choosing an option is the only way out.

**Evidence.** Where: /tool.html [loan-open] `#loan-list`. E1, reproduced or measured · app.js:238-251, app.js:224-251, probes/76, probes/77 · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Let Tab close the list and move on; or replace the custom listbox with a native select, which the two options do not need to avoid. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: A11Y-17 Pointer and keyboard static checks; H2-3 User control and freedom

#### F-0036 · Each press of Confirm reservation creates another reservation while the request is pending

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0036 | Each press of Confirm reservation creates another reservation while the request is pending | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A submit that creates a record should be guarded against repeat activation. The confirm submit handler allocates a reference (FT-4471 + count) and pushes it into sessionStorage 'reservations' before its 1.5 s wait, and the button is neither disabled nor guarded; a second press during the wait allocates a second reference. The done page then lists both ('FT-4471 and FT-4472', label 'Reservation numbers'). A member who taps again because nothing seems to happen may end up with two reservations for the same tools and be unsure which number to quote at the desk.

**Evidence.** Where: /confirm.html `#confirm`. E1, reproduced or measured · app.js:392-434, .ui-evaluator/runs/20261009-223245-audit-standard/probes/vp1-pending/step-20.png, .ui-evaluator/runs/20261009-223245-audit-standard/probes/vp1-pending/aria.yml · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Ignore submits while one is pending (flag or aria-disabled plus early return), and allocate the reference only once. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: CMP-04 Response feedback

#### F-0037 · Continue and Confirm reservation show no visible pending state during their 1.2 s and 1.5 s waits

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0037 | Continue and Confirm reservation show no visible pending state during their 1.2 s and 1.5… | 3 · major | 2 · one component or file | CMP-04 | Response feedback |

**Problem.** An action that takes longer than about 1 s should show it is in progress (CMP-04). Both handlers only set aria-busy='true' on the button; styles.css has no [aria-busy] rule, the label does not change and nothing else on the page changes until navigation or the error. Members may think the tap did not register and tap again (see the duplicate-reservation finding) or leave the page.

**Evidence.** Where: /basket.html `#continue`; /confirm.html `#confirm`; /basket.html `#continue` at 375 px and 5 more. E1, reproduced or measured · app.js:357-367, 419-433; styles.css (no aria-busy selector), probes/23/, probes/57/, .ui-evaluator/runs/20261009-223245-audit-standard/probes/vp1-pending/step-05.png · found by 4 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Add a .button[aria-busy='true'] style with a changed label (e.g. 'Confirming...') and ignore clicks while busy. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; CW-Q4 Will the user understand the feedback?

#### F-0038 · Expired basket hold is reported only as 'Something went wrong. Try again.'

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0038 | Expired basket hold is reported only as 'Something went wrong. Try again.' | 3 · major | 1 · one value or token | H2-9 | Help users recognize, diagnose and recover from errors |

**Problem.** An error message should state what happened and what to do (H9). When the 10-minute hold has passed, Continue shows the generic 'Something went wrong. Try again.' in the error summary. The page never mentions a time limit beyond 'Items are held for you while you finish', and there is no visible countdown. A member who paused to check their diary may not understand why Continue fails or what to do next.

**Evidence.** Where: /basket.html [errors] `#error-summary`. E1, reproduced or measured · app.js:7, 97-100, 360-364, .ui-evaluator/runs/20261009-223245-audit-standard/probes/vp1-hold/step-17.png, .ui-evaluator/runs/20261009-223245-audit-standard/probes/vp1-hold/aria.yml · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Say the hold ran out and what happens now (e.g. the tools are still in the basket; press Continue to hold them again), and state the time limit on the basket page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 3.3.3 Error suggestion; WCAG 2.2.1 Timing adjustable

#### F-0141 · Calendar lets closed days and days before the tool's availability date be chosen and added without warning

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0141 | Calendar lets closed days and days before the tool's availability date be chosen and adde… | 3 · major | 3 · several components or one flow | H2-5 | Error prevention |

**Problem.** Every day button can be chosen and Reserve adds it; this overlaps F-0062. A member may pick a day the library is shut, go through basket and details, and only then learn it is not possible, with no direct way to change it; a member may also reserve a tool for a day before it is back.

**Evidence.** Where: /tool.html [day-chosen] `#calendar .day`; /tool.html [added] `#reserve`; /confirm.html [errors] `#error-list`. E1, reproduced or measured · app.js:195-208, 256-268, 420-431, .ui-evaluator/runs/20261009-223245-audit-standard/probes/113/, .ui-evaluator/runs/20261009-223245-audit-standard/probes/112/ · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Make only open days on or after the tool's available date selectable (aria-disabled with a visible cue), validate on Reserve, and link the confirm error to the tool page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 3.3.4 Error prevention for legal, financial and data submissions; H2-9 Help users recognize, diagnose and recover from errors

#### F-0142 · Confirm accepts a pick-up day before the tool's 'Available from' date

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0142 | Confirm accepts a pick-up day before the tool's 'Available from' date | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A pressure washer picked for Sat 10 Oct (available from 17 Oct) reaches 'Reservation confirmed' with no error. A member may pick a day the library is shut, go through basket and details, and only then learn it is not possible, with no direct way to change it; a member may also reserve a tool for a day before it is back.

**Evidence.** Where: /tool.html [day-chosen] `#calendar .day`; /tool.html [added] `#reserve`; /confirm.html [errors] `#error-list`. E1, reproduced or measured · app.js:195-208, 256-268, 420-431, .ui-evaluator/runs/20261009-223245-audit-standard/probes/114/, .ui-evaluator/runs/20261009-223245-audit-standard/probes/116/ · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Make only open days on or after the tool's available date selectable (aria-disabled with a visible cue), validate on Reserve, and link the confirm error to the tool page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 3.3.4 Error prevention for legal, financial and data submissions; H2-9 Help users recognize, diagnose and recover from errors

#### F-0143 · Closed-day error on confirm comes late and has no link to change the day

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0143 | Closed-day error on confirm comes late and has no link to change the day | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** The day is rejected only after Confirm, and the error item offers no route back to the calendar. A member may pick a day the library is shut, go through basket and details, and only then learn it is not possible, with no direct way to change it; a member may also reserve a tool for a day before it is back.

**Evidence.** Where: /tool.html [day-chosen] `#calendar .day`; /tool.html [added] `#reserve`; /confirm.html [errors] `#error-list`. E1, reproduced or measured · app.js:195-208, 256-268, 420-431, .ui-evaluator/runs/20261009-223245-audit-standard/probes/115/, .ui-evaluator/runs/20261009-223245-audit-standard/probes/117/ · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Make only open days on or after the tool's available date selectable (aria-disabled with a visible cue), validate on Reserve, and link the confirm error to the tool page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 3.3.4 Error prevention for legal, financial and data submissions; H2-9 Help users recognize, diagnose and recover from errors

#### F-0041 · Per-tool pick-up day and the basket's pick-up session are separate choices that are never reconciled

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0041 | Per-tool pick-up day and the basket's pick-up session are separate choices that are never… | 3 · major | 3 · several components or one flow | H2-4 | Consistency and standards |

**Problem.** One flow should collect one pick-up time. The tool page stores a pick-up day per item; the basket then asks for a pick-up session for the whole basket from all six sessions. Nothing checks that the session matches the items' days, so the confirm summary can show 'pick up Saturday 17 October' for a tool and 'Saturday 10 October' as the session, and the reservation goes through. Members may turn up on the wrong day, or be unsure which date the library holds them to.

**Evidence.** Where: /tool.html [day-chosen] `#calendar`; /basket.html `#sessions`; /confirm.html `.summary`. E1, reproduced or measured · app.js:267, 330-332, 376-381, 421, probes/84, probes/90 · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Collect the pick-up session once (either on the tool page or in the basket) and derive the other from it. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: overall structure · Priority P1 · Status open · Also: H2-5 Error prevention

#### F-0062 · Pick-up calendar accepts days on which the tool cannot be collected

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0062 | Pick-up calendar accepts days on which the tool cannot be collected | 3 · major | 3 · several components or one flow | H2-5 | Error prevention |

**Problem.** Only session days (marked Open / green dot) are library sessions, and each tool has an 'Available from' date. The calendar nevertheless lets any day be chosen and added: Monday 12 October (no session) was accepted for the drill and the basket then reads 'Pick up Monday 12 October'; for the pressure washer, available from Saturday 17 October, Saturday 10 October was accepted with 'Added to your basket'. No warning is shown at either point. First-time members do not know which days are sessions (journey persona) and may hold a tool for a day the desk is closed or before the tool is back, then arrive to nothing.

**Evidence.** Where: /tool.html?id=drill-18v-two [day-chosen] `role=button[name="Monday 12 October"]` at 375 px; /tool.html?id=pressure-washer `role=button[name="Saturday 10 October, open"]` at 375 px; /tool.html?id=drill-18v-two [day-chosen] `.day[data-day="2026-10-12"]` at 375 px and 2 more. E1, reproduced or measured · probes/32/, probes/51/, .ui-evaluator/runs/20261009-223245-audit-standard/probes/12, .ui-evaluator/runs/20261009-223245-audit-standard/probes/7/ · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Disable or clearly reject non-session days and days before the tool's available date. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-2 Match between system and the real world; H2-1 Visibility of system status

#### F-0064 · Confirm summary shows two different collection dates after the session is changed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0064 | Confirm summary shows two different collection dates after the session is changed | 3 · major | 3 · several components or one flow | H2-1 | Visibility of system status |

**Problem.** After Change -> Wednesday 21 October -> Continue, the 'Your reservation' box reads Tools: '... one week, pick up Saturday 17 October' and Pick-up session: 'Wednesday 21 October, 18:00 to 20:00'. A summary should state one collection date. The member checking the reservation before committing may not know whether to come on Saturday or Wednesday, which is the one thing the reservation depends on.

**Evidence.** Where: /confirm.html?slot=wed-2026-10-21 `role=region[name="Your reservation"]` at 375 px; /confirm.html `role=region[name="Your reservation"]` at 375 px; /basket.html?items=drill-18v-two&day=2026-10-17 `div.session` at 375 px. E1, reproduced or measured · probes/27/, .ui-evaluator/runs/20261009-223245-audit-standard/probes/37/aria.yml, .ui-evaluator/runs/20261009-223245-audit-standard/probes/34/final.png, probes/84 · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open · Also: H2-4 Consistency and standards; H2-5 Error prevention

#### F-0032 · Results grid column minimum of 330 px is wider than a 320 px viewport

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0032 | Results grid column minimum of 330 px is wider than a 320 px viewport | 2.67 · major | 1 · one value or token | WCAG 1.4.10 | Reflow |

**Problem.** Content should reflow to a single column without horizontal scrolling at 320 CSS px (WCAG 1.4.10). .results uses grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); at 320 px the page has 288 px of content width after its 16 px side padding, so the single column is forced to 330 px and the cards overflow the viewport by about 42 px. Members on small phones, the declared main context, may have to scroll sideways to read each tool card, and the right edge of every card, including the availability badge, may be cut off.

**Evidence.** Where: /index.html `#results` at 320 px. E1, reproduced or measured · styles.css:329-333, probes/104/screenshots/results320.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Use minmax(min(100%, 330px), 1fr) so the column can shrink to the container. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: LAY-01 Spacing scale conformance

#### F-0033 · Search with no matches leaves the previous results and status unchanged

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0033 | Search with no matches leaves the previous results and status unchanged | 2.67 · major | 2 · one component or file | CMP-05 | Data states exist |

**Problem.** A search that matches nothing should replace the list with an empty state and announce it (CMP-05). search() only renders and updates #results-status when list.length is non-zero; with zero matches it does nothing, so the old cards stay on screen and the live region keeps its old count. The page has no empty-state markup at all. A member searching for a tool the library does not have may be shown unrelated tools as if they were matches and may not learn that nothing matched; screen-reader users hear nothing.

**Evidence.** Where: /index.html [no-results] `#results`; /?items=ladder-3m [no-results] `role=region[name="Tools"] >> role=status` at 375 px; /?items=ladder-3m [no-results] `#results` at 375 px and 1 more. E1, reproduced or measured · app.js:158-164, probes/105/screenshots/noresults.png, probes/105/aria.yml, probes/38/ · found by 4 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Always render; when the list is empty show a message such as 'No tools match' with a way to clear filters, and set the status text to the same. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; WCAG 4.1.3 Status messages; H2-9 Help users recognize, diagnose and recover from errors

#### F-0042 · Dark-theme success colour drifts from the declared token and the available badge background matches the card

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0042 | Dark-theme success colour drifts from the declared token and the available badge backgrou… | 2.67 · major | 1 · one value or token | COL-01 | Token conformance |

**Problem.** Dark mode should use design.md's success #8fd1a8 on selection #24352c. styles.css sets --color-ok: #2f7d4a and --color-ok-tint: #1d2622, which equals the dark --color-surface. 'Available from' text in .badge--ok (16 px bold, not large text) computes to about 3.1:1 on #1d2622, below 4.5:1, and the badge has no visible fill on the card. Members browsing in dark mode in the evening, the declared main scene, may find the availability line hard to read, and it loses its badge shape.

**Evidence.** Where: /index.html `.badge--ok`. E1, reproduced or measured · styles.css:60-61, probes/106/screenshots/dark1280.png, probes/105/screenshots/top1280.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Set dark --color-ok to #8fd1a8 and --color-ok-tint to #24352c as declared. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 1.4.3 Contrast, minimum

#### F-0046 · 'Choose a pick-up day first.' is not announced when Reserve is pressed without a day

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0046 | 'Choose a pick-up day first.' is not announced when Reserve is pressed without a day | 2.67 · major | 1 · one value or token | WCAG 3.3.1 | Error identification |

**Problem.** An error should be programmatically tied to the control and announced (WCAG 3.3.1, 4.1.3). #day-error is a plain paragraph that is unhidden with no live region and no aria-describedby from the calendar group or day buttons; focus moves to the first day button, so a screen reader announces that day ('Friday 9 October') and not the error. Screen-reader users may hear a calendar day after pressing Reserve and not know why nothing was added.

**Evidence.** Where: /tool.html `#day-error`; /tool.html?id=drill-18v-two `#reserve` at 375 px. E1, reproduced or measured · tool.html:62-63; app.js:257-262, .ui-evaluator/runs/20261009-223245-audit-standard/probes/56/aria.yml, .ui-evaluator/runs/20261009-223245-audit-standard/evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/375-light.yml, probes/98 · found by 2 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Add aria-describedby='day-error' to the calendar group (and day buttons) or make #day-error role=alert. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 4.1.3 Status messages; H2-9 Help users recognize, diagnose and recover from errors; H2-4 Consistency and standards

#### F-0050 · Confirmation page shows reservation number FT-4471 when no reservation exists

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0050 | Confirmation page shows reservation number FT-4471 when no reservation exists | 2.67 · major | 1 · one value or token | H2-1 | Visibility of system status |

**Problem.** A confirmation should only show a reference that was issued. initDone falls back to the literal 'FT-4471' when no stored reservation matches, so opening done.html directly, after the session ends, or with a mismatched slot shows 'Reservation confirmed' with a number that was never allocated. A member reopening the page later may quote a number the desk has no record of.

**Evidence.** Where: /done.html `#c-ref`. E1, reproduced or measured · app.js:443, .ui-evaluator/runs/20261009-223245-audit-standard/probes/102/aria.yml, .ui-evaluator/runs/20261009-223245-audit-standard/probes/101/aria.yml · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Show a 'no reservation found' state with the desk number instead of a fallback reference. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: CMP-05 Data states exist

#### F-0055 · Basket asks for a pick-up session again and does not carry over the pick-up day just chosen

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0055 | Basket asks for a pick-up session again and does not carry over the pick-up day just chos… | 2.67 · major | 2 · one component or file | CW-Q1 | Does the effect of the action match the user’s goal? |

**Problem.** Journey reserve-tool-for-saturday, step 8. The persona chose Saturday 17 October on the tool page, and the basket card repeats 'Pick up Saturday 17 October'. Below it, 'Pick-up session' lists six sessions with none selected. To the persona this is the same question again; the likely action is to press Continue straight away and hit an error. Missing knowledge: that the day and the session are separate choices and the session is not set from the day. Step verdict would_with_effort.

**Evidence.** Where: /basket.html `group 'Pick-up session'` at 375 px. E1, reproduced or measured · probes/11/final.png, probes/11/aria.yml, .ui-evaluator/runs/20261009-223245-audit-standard/probes/vp1-arrow/step-02.png, .ui-evaluator/runs/20261009-223245-audit-standard/evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/375-light.yml · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Preselect the session matching the chosen pick-up day, or ask only once. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-5 Error prevention

#### F-0061 · Header still shows 'Basket (1)' on the 'Reservation confirmed' page

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0061 | Header still shows 'Basket (1)' on the 'Reservation confirmed' page | 2.67 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** Journey reserve-tool-for-saturday, step 13. The confirmation page is otherwise clear (reference FT-4471, the drill, Saturday 17 October 10:00 to 13:00, £20 to bring, what happens next), but the header still reads 'Basket (1)'. A first-time member, already unsure what the basket means after step 6, may read this as the drill still sitting unreserved in the basket. Missing feedback: a basket state consistent with the completed reservation. Step verdict would_with_effort.

**Evidence.** Where: /done.html `#basket-link` at 375 px; /done.html `#basket-link` at 375 px; /done.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17&ref=FT-4471 `#basket-link` at 375 px and 1 more. E1, reproduced or measured · probes/19/final.png, probes/19/aria.yml, probes/57/, .ui-evaluator/runs/20261009-223245-audit-standard/probes/50/final.png · found by 5 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Empty the basket once the reservation is confirmed. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-5 Error prevention; DES-execution —

#### F-0074 · Basket says items are held but not for how long

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0074 | Basket says items are held but not for how long | 2.67 · major | 1 · one value or token | H2-10 | Help and documentation |

**Problem.** The basket states 'Items are held for you while you finish.' No hold time is given there, on the tool page after adding, or on the confirm page. The persona does not know how long the basket holds a tool and often reserves in short bursts while doing something else; they may lose the tool by pausing, or rush.

**Evidence.** Where: /basket.html `main > p` at 375 px; /basket.html?items=drill-18v-two&day=2026-10-17 `main > p` at 375 px; /basket.html?items=drill-18v-two&day=2026-10-17 `main > p` at 375 px. E1, reproduced or measured · evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/375-light.yml, .ui-evaluator/runs/20261009-223245-audit-standard/probes/21/aria.yml, .ui-evaluator/runs/20261009-223245-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/375-light.png, .ui-evaluator/runs/20261009-223245-audit-standard/evidence/aria/ · found by 3 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P1 · Status open · Also: H2-1 Visibility of system status; WCAG 2.2.1 Timing adjustable

#### F-0135 · Pick-up sessions listed newest-first

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0135 | Pick-up sessions listed newest-first | 2.67 · major | 1 · one value or token | DES-execution | — |

**Problem.** Sessions run from 28 October back to 10 October; this part duplicates F-0044/F-0056/F-0075. Members thinking 'Saturday morning' may pick the wrong week; the uneven row reads as unplanned.

**Evidence.** Where: /basket.html at 1280 px. E1, reproduced or measured · .ui-evaluator/runs/20261009-223245-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, .ui-evaluator/runs/20261009-223245-audit-standard/probes/114/step-06.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Decide a chronological order and one layout for the session options that does not wrap dates over three lines. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0125 · Masthead still shows 'Basket (1)' after the reservation is confirmed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0125 | Masthead still shows 'Basket (1)' after the reservation is confirmed | 2.67 · major | 2 · one component or file | DES-execution | — |

**Problem.** On done, the nav reads 'Basket (1)', implying the confirmed tool is still held. May lead members to think the reservation did not go through, or to reserve twice.

**Evidence.** Where: /done.html at 1280 px. E1, reproduced or measured · .ui-evaluator/runs/20261009-223245-audit-standard/evidence/screens/done-html-items-drill-18v-two-day-2026-10-17-slot-sat-2026-1/default/1280-light.png, .ui-evaluator/runs/20261009-223245-audit-standard/probes/97/aria.yml · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Decide what the basket shows after confirmation (could be a fixture artefact; verify in the live journey). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0009 · Text clips under the text-spacing override in li:nth-of-type(1) > article.card > div.card__body > h2.card_

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0009 | Text clips under the text-spacing override in li:nth-of-type(1) > article.card > div.card… | 2 · minor (rule) | 1 · one value or token | A11Y-08 | Text-spacing override |

**Problem.** With line-height 1.5, paragraph spacing 2em, letter spacing 0.12em and word spacing 0.16em, text ("Cordless drill 18 V, combi, two batteries") is cut off at 1280 px (scroll 427×50 vs client 390×50).

**Evidence.** Where: /?items=ladder-3m `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px; /?items=ladder-3m [filters-open] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px; /?items=ladder-3m [no-results] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px and 6 more. E1, reproduced or measured · evidence/crops/layout/590558f06b.png, evidence/crops/layout/bf44b73749.png, evidence/crops/layout/dcc3a9ef99.png, evidence/crops/layout/b9bfa8cd0f.png. Ratings: rule: 2.

**Recommendation.** Replace fixed heights on text containers with min-height or padding, and let text wrap. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.12 Text spacing

### P2

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0029 | Session-day dots disappear under forced colours at 320 px, leaving open days unmarked | 2.33 · minor | 1 · one value or token | A11Y-22 | — | E1 | open |
| F-0045 | Fixed action bar on the tool page covers the end of the page | 2.33 · minor | 1 · one value or token | WCAG 2.4.11 | Focus not obscured, minimum | E1 | open |
| F-0049 | Membership and mobile number checks reject common formats without normalising them | 2.33 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0130 | No-results state shows the full tool list | 2.33 · minor | 2 · one component or file | DES-execution | — | E1 | open |
| F-0008 | Touch-primary controls closer than 8 px: "Saturday 17 October, open" and "Reserve this to… | 2 · minor (rule) | 1 · one value or token | CMP-06 | Touch-primary targets | E1 | open |
| F-0019 | Body text closer than 16 px to the viewport edge: "Cleaning · deposit £30" | 2 · minor (rule) | 1 · one value or token | LAY-05 | Edge margin | E1 | open |
| F-0144 | Esc does not close the loan-length listbox | 2 · minor | 2 · one component or file | WCAG 2.1.2 | No keyboard trap | E1 | open |
| F-0030 | Tool card and basket item headings share the level of the section heading that contains t… | 2 · minor | 1 · one value or token | A11Y-26 | — | E1 | open |
| F-0043 | Find page shows the search form above the results but its DOM and tab order put results f… | 2 · minor | 2 · one component or file | WCAG 2.4.3 | Focus order | E1 | open |
| F-0047 | Tool names are cut to one line, so near-identical names become indistinguishable | 2 · minor | 1 · one value or token | TYP-05 | Type families | E1 | open |
| F-0048 | Tool names in result cards and basket rows are h2 elements nested under an h2 'Tools' hea… | 2 · minor | 1 · one value or token | WCAG 1.3.1 | Info and relationships | E1 | open |
| F-0051 | The three-tools limit stated on the find page is not enforced when adding to the basket | 2 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0052 | Unknown tool id silently shows the first tool's page | 2 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0053 | Done page repeats the first tool's name in a hidden span after the tools list | 2 · minor | 1 · one value or token | WCAG 1.3.1 | Info and relationships | E1 | open |
| F-0057 | The two cordless drills are truncated to identical names in the tool list on phones | 2 · minor | 1 · one value or token | CW-Q3 | Will the user recognize the action as the correct one? | E1 | open |
| F-0065 | Change link opens the basket without the current session selected | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0066 | Membership number typed on the confirm page is lost when leaving and returning | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0070 | Filters button is an unlabelled icon | 2 · minor | 1 · one value or token | H2-6 | Recognition rather than recall | E1 | open |
| F-0080 | Reservation number uses the same FT- prefix as membership numbers | 2 · minor | 1 · one value or token | H2-4 | Consistency and standards | E1 | open |
| F-0091 | Removing a tool from the basket is immediate and cannot be undone | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0095 | Green and grey availability badges differ only by colour, with no stated meaning | 2 · minor | 2 · one component or file | H2-2 | Match between system and the real world | E1 | open |
| F-0103 | Format errors on confirm are worded as if the field were empty | 2 · minor | 1 · one value or token | H2-9 | Help users recognize, diagnose and recover from errors | E1 | open |
| F-0107 | Every tool card shows the same wrench glyph in place of a thumbnail | 2 · minor | 3 · several components or one flow | SLP-58 | — | E1 | open |
| F-0114 | No way for returning members to repeat a previous reservation | 2 · minor | 3 · several components or one flow | H2-7 | Flexibility and efficiency of use | E1 | open |
| F-0115 | Tool names truncate to identical strings on phones | 2 · minor | 1 · one value or token | DES-execution | — | E1 | open |
| F-0117 | Every tool card shows the same wrench placeholder instead of the tool | 2 · minor | 3 · several components or one flow | DES-appeal | — | E1 | open |
| F-0139 | Drill names truncate to identical strings at 375 | 2 · minor | 1 · one value or token | DES-hierarchy | — | E1 | open |
| F-0140 | Search and filters sit below the full tool list at 375 | 2 · minor | 1 · one value or token | DES-hierarchy | — | E1 | open |
| F-0148 | On phones the search field sits below all ten tools | 2 · minor | 1 · one value or token | DES-hierarchy | — | E1 | open |
| F-0149 | Tool names truncate to identical strings on phones | 2 · minor | 1 · one value or token | DES-hierarchy | — | E1 | open |
| F-0132 | Dark theme drops the chip background only on 'available' badges | 1.67 · minor | 1 · one value or token | DES-coherence | — | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0110 | Basket session cards break into one full-width row and five cramped cards at 1280 | 1.33 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0111 | Filter panel uses unthemed browser-default date and select controls | 1.33 · cosmetic | 2 · one component or file | DES-coherence | — | E1 | open |
| F-0136 | Session cards form an uneven row at 1280 | 1.33 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0123 | Browser-default date and select controls in the filter panel | 1.33 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0022 | Cramped padding: "Pressure washer, 130 bar Cleaning · depo" | 1 · cosmetic (rule) | 1 · one value or token | LAY-04 | No cramped padding | E1 | open |
| F-0146 | Brand identity is a stock wrench glyph and the name in body type | 1 · cosmetic | 3 · several components or one flow | SLP-64 | — | E1 | open |
| F-0147 | Confirmation page has no focal point marking the completed reservation | 1 · cosmetic | 2 · one component or file | SLP-64 | — | E1 | open |
| F-0113 | Details list splits into two misaligned columns | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0116 | Basket and done pages end with an empty grey band under the footer | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0118 | No identity floor: the product's only mark is the name in body text | 1 · cosmetic | 3 · several components or one flow | DES-specificity | — | E1 | open |
| F-0122 | Tool details split into two misaligned label columns | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0137 | Empty grey band below the footer on short pages | 1 · cosmetic | 1 · one value or token | DES-appeal | — | E1 | open |
| F-0138 | Confirm form and done next-steps card use only the left half of the content width | 1 · cosmetic | 1 · one value or token | DES-appeal | — | E1 | open |
| F-0150 | Main nav items wrap to two lines on phones | 1 · cosmetic | 1 · one value or token | DES-hierarchy | — | E1 | open |

### Advisory observations (not counted)

Measured by the deterministic checks against advisory rules, which gate nothing. They are listed for information and are not findings; one becomes a finding only when an inspector reports the same problem (ADR-038).

| ID | Observation | Rule | Instances | Routes |
|---|---|---|---|---|
| F-0003 | Weak by APCA, passes WCAG: "Members can reserve up to three tools at" | COL-14 | 4 | /?items=ladder-3m |
| F-0004 | Weak by APCA, passes WCAG: "Category" | COL-14 | 3 | /tool.html?id=drill-18v-two&items=ladder-3m |
| F-0005 | Weak by APCA, passes WCAG: "Items are held for you while you finish." | COL-14 | 3 | /basket.html?items=drill-18v-two&day=2026-10-17 |
| F-0006 | Weak by APCA, passes WCAG: "Tools" | COL-14 | 6 | /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 |
| F-0007 | Weak by APCA, passes WCAG: "Reservation number" | COL-14 | 2 | /done.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17&ref=FT-4471 |
| F-0017 | One word on the last line: "You can collect at any of these sessions" | TYP-15 | 2 | /basket.html?items=drill-18v-two&day=2026-10-17 |
| F-0018 | One word on the last line: "Nothing is paid online. Bring the deposi" | TYP-15 | 12 | /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 |
| F-0020 | One word on the last line: "Cordless drill 18 V, combi, two batterie" | TYP-15 | 13 | /tool.html?id=drill-18v-two&items=ladder-3m |
| F-0021 | One word on the last line: "Reservation confirmed" | TYP-15 | 2 | /done.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17&ref=FT-4471 |
| F-0023 | One word on the last line: "Drills and drivers · deposit £20" | TYP-15 | 3 | /?items=ladder-3m |

## 5. Divergent and disputed findings: questions for user research

None. The three raters did not diverge on any finding (spread below 2 everywhere). Questions to settle with members, not by vote: whether first-time members read "Added to your basket" as a finished reservation, and how long members actually leave the flow open in the evening (which decides how much the hold expiry bites).

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | pass | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0030, F-0048, F-0053 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0024, F-0027, F-0043 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | pass | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | fail | F-0095 |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001, F-0002, F-0042 |
| 1.4.4 | AA | Resize text | scripted | fail | F-0010, F-0011 |
| 1.4.5 | AA | Images of text | agent-judged | pass | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0013, F-0032 |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | fail | F-0009, F-0011 |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_applicable | — |
| 2.1.1 | A | Keyboard | scripted | fail | F-0026 |
| 2.1.2 | A | No keyboard trap | scripted | fail | F-0028, F-0144, F-0145, F-0034 |
| 2.1.4 | A | Character key shortcuts | needs-human | not_run | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0038, F-0074 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | pass | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | needs-human | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0024, F-0027, F-0043 |
| 2.4.4 | A | Link purpose in context | agent-judged | pass | — |
| 2.4.5 | AA | Multiple ways | agent-judged | pass | — |
| 2.4.6 | AA | Headings and labels | agent-judged | pass | — |
| 2.4.7 | AA | Focus visible | scripted | pass | — |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | fail | F-0008, F-0045 |
| 2.5.1 | A | Pointer gestures | agent-judged | not_applicable | — |
| 2.5.2 | A | Pointer cancellation | scripted | pass | — |
| 2.5.3 | A | Label in name | agent-judged | pass | — |
| 2.5.4 | A | Motion actuation | agent-judged | not_applicable | — |
| 2.5.7 | AA | Dragging movements | agent-judged | not_applicable | — |
| 2.5.8 | AA | Target size, minimum | scripted | pass | — |
| 3.1.1 | A | Language of page | scripted | pass | — |
| 3.1.2 | AA | Language of parts | scripted | pass | — |
| 3.2.1 | A | On focus | scripted | pass | — |
| 3.2.2 | A | On input | agent-judged | pass | — |
| 3.2.3 | AA | Consistent navigation | scripted | pass | — |
| 3.2.4 | AA | Consistent identification | scripted | pass | — |
| 3.2.6 | A | Consistent help | scripted | pass | — |
| 3.3.1 | A | Error identification | scripted | fail | F-0046 |
| 3.3.2 | A | Labels or instructions | agent-judged | fail | F-0049 |
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0038 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | human | fail | F-0040, F-0141, F-0142, F-0143 |
| 3.3.7 | A | Redundant entry | agent-judged | fail | F-0066 |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_applicable | — |
| 4.1.2 | A | Name, role, value | agent-judged | pass | — |
| 4.1.3 | AA | Status messages | scripted | fail | F-0033, F-0046 |

Totals by coverage: auto 1 · scripted 22 · agent-judged 21 · needs-human 9; by state: pass 23 · fail 18 · not_run 9. This matrix is not a conformance claim (QUALITY-BAR §8).

## 7. Not assessed

- A11Y-06 Modal dialogs: focus moves in, Tab wraps inside, Esc closes, focus returns to the invoker; correct dialog semantics: not_applicable — no modal dialog in scope (dialogs check found none to exercise)
- I18N-01 Explicit CJK font stack: not_applicable — no CJK locale or CJK text in scope
- I18N-02 Regional families: not_applicable — no CJK locale or CJK text in scope
- DEC-03 Direction record for new work or redesigns: not_applicable — no new direction in scope (project.work = existing)
- DEC-04 Ledger variety for new work: not_applicable — no new direction in scope
- USE-11 AI features audited (when the UI contains AI features): not_applicable — no AI features declared (project.ai_features)
- DES-05 Not worse than baseline (redesigns): not_applicable — no baseline to compare (not a redesign)
- EMP-01 Study plan: not_run — no study plan
- EMP-02 Formative round: not_run — no study results
- EMP-03 Observed problems integrated: not_run — no study results
- EMP-04 Critical tasks succeed: not_run — no study results
- EMP-05 Fixes re-tested: not_run — no study results
- EMP-06 Honest metrics: not_run — no study results
- EMP-07 (optional) Desirability: not_applicable — no desirability study planned
- EMP-08 (optional) Experiment validity: not_applicable — no experiment planned
- Document titles per route (not captured in the packet). (a11y)
- Hold expiry on basket items (no timer visible; needs the owner or a long-running probe). (a11y)
- Whether the toast's role=status announcement is missed when text is set while the region is hidden: depends on the screen reader; needs a runtime check (tool.html #toast, app.js reserve handler). (code)
- Rendered contrast in forced-colours mode: not captured. (code)
- Double submission of Confirm reservation (could create two reservations): not probed beyond a single click; the button shows no pending state (see H1 finding) but whether a second click submits again is unverified. (he-1)
- How long the basket actually holds a tool and what happens on expiry: cannot be waited out in a probe. (he-1)
- Whether Back from the done page followed by a second Confirm creates a duplicate reservation: probes/53 shows Back returns an editable confirm form; resubmission was not attempted. (he-1)
- Screen-reader announcement of the 'Added to your basket' status and of the confirm error summary focus: ARIA shows role=status and role=alert, but spoken output was not tested. (he-1)
- Whether the reservation is actually recorded for the desk volunteers ('the Saturday list'): there is no volunteer-facing route in the packet. (he-2)
- Whether a tool shown as available is really free on the chosen day (another member's hold): the fixture has a single member and no conflicting data. (he-2)
- How long the basket hold lasts and what happens when it expires: no expiry was observed in the probe sessions (a few minutes each). (he-2)
- Actual VoiceOver/TalkBack announcements: only the accessibility tree was inspected, not a real screen reader. (he-3)
- 200% browser zoom: only the 320 px captures were viewed as a proxy; true zoom reflow was not probed. (he-3)
- Where focus lands after 'Reserve this tool' is pressed with no day chosen: the probe screenshot (probes/56/step-03.png) shows no visible focus ring on a day, but the focused element was not recorded. (he-3)
- How long basket items are actually held and what happens when the hold lapses: no expiry state could be produced. (he-3)
- The 'up to three tools at a time' limit: not probed with a fourth tool. (he-3)
- Motion (120 ms fades), focus rings, toast and listbox behaviour cannot be judged from stills. (critic-2)
- Find 'no-results' capture does not show a no-results state (full list visible with 'sewing machine' typed). (critic-2)
- Motion (toast fade, button colour transitions), focus rings and hover states cannot be judged from stills. (critic-3)
- Whether the sticky bar overlap exists in a live viewport or only in full-page capture. (critic-3)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0002, F-0009, F-0010, F-0011, F-0012 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (1 finding(s)); FUN-06 (2 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (5 finding(s)); A11Y-05 (1 finding(s)) ….
3. For L2: USE-05 (4 open P0 finding(s)); USE-06 (31 P1 finding(s) without a recorded decision); DES-02 (0/3 critics judged it specific); DES-04 (0/3 critics: attributes reflected); DES-07 (0/3 critics judged it appealing).
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (35 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

