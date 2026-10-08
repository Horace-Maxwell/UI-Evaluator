# UI evaluation report: Fernhill Tool Library reservations · run 20261008-005630-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:069d41ef9f (uncommitted changes present) · run opened 2026-10-08T04:56:30.487Z |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Surfaces and modes | find (operate), tool (operate), basket (operate), confirm (operate), done (read) |
| Routes × states | 5 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-08T04:55:47.646Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | b6012f8e b6012f8e b6012f8e |
| walkthrough-evaluator | 1 | subagent | claude-opus-5-5 | 6a3d0378 |
| design-critic | 3 | subagent | claude-opus-5-5 | b43d32bf b43d32bf b43d32bf |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 433a087d |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 09a98abb 84abd642 |
| finding-verifier | 1 | subagent | claude-opus-5-5 | 8c047975 |
| severity-rater | 3 | subagent | claude-opus-5-5 | 06c063f6 7ad9a0b6 6483faac |

Coverage: 540 valid capture(s); 100% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (1 finding(s)); FUN-06 (5 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (6 finding(s)); A11Y-05 (4 finding(s)); A11Y-07 (2 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-06 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-05, A11Y-07, A11Y-08, A11Y-09, A11Y-11, A11Y-13, A11Y-15, A11Y-27 |
| G3 Craft floor | fail | COL-01, LAY-03, LAY-04, LAY-05, CMP-04, CMP-05, CMP-06, CPY-04 |
| G4 Deliberateness and anti-slop | pass | — |
| G5 Analytical usability | fail | USE-05, USE-06 |
| G6 Design quality | fail | DES-02, DES-03, DES-04, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- Error summaries on the basket and confirm pages take focus, link to each field, give specific messages and keep typed values (all three evaluators).
- The done page says what to bring, where to go and what to do if plans change.
- The confirm page says nothing is paid online. Deposits are stated up front.
- Calendar days carry "Open" as text and in their accessible names, so session days are not marked by colour alone.
- The search result count is announced in a status region. The empty basket explains itself.
- Dark mode exists, and error and selection states stay distinguishable in it. The badge token is the one break.

- Error summaries on the basket and confirm pages are alerts with links to each field, and inline errors repeat the message with an example of the format (like FT-01234, like 07700 900123)
- Remove buttons show "Remove" but are named with the tool ("Remove Cordless drill 18 V, combi, two batteries")
- State is exposed programmatically: day buttons [pressed], loan button [expanded], option [selected], and "Added to your basket" in a status region
- Selected day and error states keep non-colour cues under deuteranopia (bold date and heavier border; error text)
- Single global :focus-visible ring (3 px, token colour, 2 px offset) with no outline removal anywhere
- Hover and pressed states exist for every button, link, nav item, day, listbox option and input; pressed is distinct from hover
- Motion limited to a 120 ms colour/opacity transition with a prefers-reduced-motion path; no transition: all, no layout-property animation
- Error-summary pattern on basket and confirm: role=alert, focus moved to the summary, links to fields, aria-invalid and aria-describedby tied to field errors

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.32 (mean Jaccard over 3 passes); an estimated 3.1 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0024 · Focus order jumps back: "Electric wet tile saw, 180 mm" → "Search tools"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0024 | Focus order jumps back: "Electric wet tile saw, 180 mm" → "Search tools" | 4 · catastrophe (rule) | 1 · one value or token | A11Y-03 | Keyboard |

**Problem.** After "Electric wet tile saw, 180 mm", Tab moves to "Search tools", which sits 654 px above it in the same column; the focus order does not follow the visual reading order (clear-inversion heuristic).

**Evidence.** Where: /?items=ladder-3m `#q` at 1280 px; /?items=ladder-3m [filters-open] `#q` at 1280 px; /?items=ladder-3m [no-results] `#q` at 1280 px. E1, reproduced or measured · evidence/crops/keyboard/21774f91d1.png, evidence/crops/keyboard/8c55f79d69.png, evidence/crops/keyboard/6b7d343985.png. Ratings: rule: 4.

**Recommendation.** Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.4.3 Focus order

#### F-0026 · Not reachable by keyboard: "Fernhill Tool Library"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0026 | Not reachable by keyboard: "Fernhill Tool Library" | 4 · catastrophe (rule) | 2 · one component or file | A11Y-03 | Keyboard |

**Problem.** The a "Fernhill Tool Library" is tabbable in the DOM, but a complete Tab walk never reached it. People who use a keyboard or switch cannot operate it.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `div > a.library-name` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `li:nth-of-type(1) > a` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#basket-link` at 320 px and 6 more. E1, reproduced or measured · evidence/crops/keyboard/838d70f50d.png, evidence/crops/keyboard/68977968e8.png, evidence/crops/keyboard/7a8cae446c.png, evidence/crops/keyboard/062afdd805.png. Ratings: rule: 4.

**Recommendation.** Put the control back in the Tab order (remove tabindex="-1") or give its function a reachable equivalent. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.1.1 Keyboard; A11Y-25 —; H2-3 User control and freedom

#### F-0043 · After the basket hold expires, Continue always fails with 'Something went wrong. Try again.'

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0043 | After the basket hold expires, Continue always fails with 'Something went wrong. Try agai… | 4 · catastrophe | 2 · one component or file | H2-9 | Help users recognize, diagnose and recover from errors |

**Problem.** An error should state the cause and a way out that works. When holdExpired() is true the basket submit shows only 'Something went wrong. Try again.' The hold start time in sessionStorage is never reset by this path, so every retry fails the same way; the only reset is the 'Reserve another tool' link on done.html, which the member cannot reach. A member who paused for more than ten minutes may be stuck in a retry loop with no explanation and abandon the reservation.

**Evidence.** Where: /basket.html [hold-expired] `#error-summary`. E1, reproduced or measured · app.js:90-100, 360-364, 452-455, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/94/screenshots/expired1.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/94/screenshots/expired2.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/94/probe.json · found by 1 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Say the hold ran out, re-check availability and restart the hold, or offer a clear action that does so. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: CMP-18 —

#### F-0061 · After 'Reserve this tool' nothing persistent says the reservation is unfinished or where to go next

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0061 | After 'Reserve this tool' nothing persistent says the reservation is unfinished or where … | 4 · catastrophe | 2 · one component or file | CW-Q1 | Does the effect of the action match the user’s goal? |

**Problem.** After a member presses a button labelled 'Reserve', they should see whether the reservation is made and, if not, what remains. Pressing 'Reserve this tool' only adds the tool to the basket. The only feedback is a small toast, 'Added to your basket', which has gone by the 4.4 s capture and is absent from the ARIA snapshot. The button label stays the same. The header link 'Basket (1)', the only way on, is scrolled out of view at 375 px, and nothing near the button points to the basket, to the session choice or to the confirmation still needed. First-time members, who don't know how the basket works, are likely to believe the drill is reserved and leave. No reservation reaches the desk, and the member may turn up on Saturday to find no tool set aside.

**Evidence.** Where: /tool.html?id=drill-18v-two [after reserve] `role=button[name="Reserve this tool"]` at 375 px; /tool.html?id=drill-18v-two [after reserve] `role=link[name="Basket (1)"]` at 375 px; /tool.html?id=drill-18v-two [added] `status 'Added to your basket'` at 375 px. E1, reproduced or measured · probes/1/step-10.png, probes/20/screenshots/reserved-4400.png, probes/20/aria.yml, context.md · found by 2 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** After adding, show a persistent message such as 'Held in your basket - choose a session to finish' with a link to the basket, and/or label the button for what it does. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: CW-Q4 Will the user understand the feedback?; CW-Q2 Is the action visible?; H2-1 Visibility of system status; H2-2 Match between system and the real world; H2-6 Recognition rather than recall

#### F-0071 · Pick-up dates before the tool is available are accepted

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0071 | Pick-up dates before the tool is available are accepted | 3.67 · catastrophe | 3 · several components or one flow | H2-5 | Error prevention |

**Problem.** The pressure washer is 'Available from Saturday 17 October', yet Saturday 10 October can be chosen and reserved on its tool page, and the basket then offers every session, including Saturday 10 and Wednesday 14 October, under 'You can collect at any of these sessions'. A member needs to be stopped from booking a collection before the tool is back. Returning members asking 'is it back yet' and first-time members alike may book a session when the tool cannot be lent, and make a wasted trip.

**Evidence.** Where: /tool.html?id=pressure-washer [day-chosen] `.day[data-day="2026-10-10"]` at 375 px; /basket.html `group "Pick-up session"` at 375 px; /basket.html?items=pressure-washer&day=2026-10-17 `div.session:nth-of-type(1) > label` at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261008-005630-audit-standard/probes/17/, .ui-evaluator/runs/20261008-005630-audit-standard/probes/21/, .ui-evaluator/runs/20261008-005630-audit-standard/probes/35/, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/89/aria.yml · found by 2 of 10 evaluator(s). Ratings: 3.67 (spread 1; 3, 4, 4).

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P0 · Status open · Also: H2-1 Visibility of system status

#### F-0072 · Pick-up day and pick-up session are chosen separately and can contradict each other

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0072 | Pick-up day and pick-up session are chosen separately and can contradict each other | 3.67 · catastrophe | 3 · several components or one flow | H2-4 | Consistency and standards |

**Problem.** The flow asks for the collection date twice: a pick-up day on the tool page and a pick-up session in the basket. The basket does not preselect the session that matches the chosen day, and any session can be picked. After choosing Wednesday 21 October as session, the confirm page shows 'Tools … pick up Saturday 17 October' and 'Pick-up session Wednesday 21 October' side by side; with pick-up day 10 October, session 28 October is also accepted. A member needs one collection date and a summary that agrees with itself. First-time members (who do not know how the basket works) may not know which date counts, turn up on the wrong one, or redo the reservation; the change-session journey ends with a confirm page that contradicts itself.

**Evidence.** Where: /tool.html [day-chosen] `region "Pick-up day"` at 375 px; /basket.html `group "Pick-up session"` at 375 px; /confirm.html `dd:nth-of-type(1)` at 375 px and 3 more. E1, reproduced or measured · .ui-evaluator/runs/20261008-005630-audit-standard/probes/44/, .ui-evaluator/runs/20261008-005630-audit-standard/probes/26/, .ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/375-light.png, .ui-evaluator/runs/20261008-005630-audit-standard/probes/43/aria.yml · found by 2 of 10 evaluator(s). Ratings: 3.67 (spread 1; 4, 3, 4).

**Recommendation.** none given by the evaluators.

Problem type: overall structure · Priority P0 · Status open · Also: H2-2 Match between system and the real world; H2-6 Recognition rather than recall; H2-5 Error prevention

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
| F-0011 | Overlapping text: #reserve | 3 · major (rule) | 2 · one component or file | FUN-06 | No clipped or overlapping text at rest at any matrix width |

**Problem.** At 1280 px, text of #reserve ("Reserve this tool") overlaps text of button.day:nth-of-type(9) > span.day__num ("17") by 16×14 px.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m `#reserve` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#reserve` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#calendar > div:nth-of-type(7)` at 1280 px and 3 more. E1, reproduced or measured · evidence/crops/layout/c6536f3b1a.png, evidence/crops/layout/91f35b0a6e.png, evidence/crops/layout/e0f62069ec.png, evidence/crops/layout/926388d864.png. Ratings: rule: 3.

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open

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

**Evidence.** Where: /?items=ladder-3m `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 320 px; /?items=ladder-3m [filters-open] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 320 px; /?items=ladder-3m [no-results] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 320 px. E1, reproduced or measured · evidence/crops/layout/4b4ac660ea.png, evidence/crops/layout/5985fa3bb2.png, evidence/crops/layout/e7d97fe9bb.png. Ratings: rule: 3.

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open

#### F-0016 · Text overlaps at 200 % text size: #reserve

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0016 | Text overlaps at 200 % text size: #reserve | 3 · major (rule) | 2 · one component or file | A11Y-09 | 200% text resize |

**Problem.** At 320 px with the root font size at 200 %, #reserve ("Reserve this tool") overlaps #tool-blurb ("A brushless combi drill with hammer action, two 4 Ah batteri").

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m `#reserve` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#reserve` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#reserve` at 320 px and 9 more. E1, reproduced or measured · evidence/crops/layout/ea51214253.png, evidence/crops/layout/596b3dc35a.png, evidence/crops/layout/6d5d096eab.png, evidence/crops/layout/5c01cac8d6.png. Ratings: rule: 3.

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.4 Resize text

#### F-0025 · Focused element hidden behind body > div.actionbar: "One week"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0025 | Focused element hidden behind body > div.actionbar: "One week" | 3 · major (rule) | 2 · one component or file | A11Y-05 | Focus not obscured |

**Problem.** When "One week" receives focus (Tab), none of nine sample points on its box reaches it: body > div.actionbar (fixed) paints over it, so the focused element is not visible.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m `#loan-button` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m `#calendar > button.day:nth-of-type(3)` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#loan-button` at 320 px and 3 more. E1, reproduced or measured · evidence/crops/keyboard/acf770e60f.png, evidence/crops/keyboard/ecab508c28.png, evidence/crops/keyboard/698751df87.png, evidence/crops/keyboard/85e4ed9e92.png. Ratings: rule: 3.

**Recommendation.** Add scroll-padding-top / scroll-padding-bottom equal to the sticky bar height (technique C43), or keep floating layers out of the focus path. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.11 Focus not obscured, minimum

#### F-0027 · Visual order of content differs from reading and focus order on the basket sessions and the find page

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0027 | Visual order of content differs from reading and focus order on the basket sessions and t… | 3 · major | 2 · one component or file | WCAG 1.3.2 | Meaningful sequence |

**Problem.** Content should be read and navigated in the order it is shown (1.3.2, 2.4.3). On the basket page the DOM and the accessibility tree list the six pick-up sessions in date order (Sat 10, Wed 14, Sat 17, Wed 21, Sat 24, Wed 28). The screen shows them in reverse (Wed 28 first, Sat 10 last) at both 320 and 1280 px. Arrow keys in the radio group therefore move visually upwards, and a screen reader reads the list in the opposite order to the screen. On the find page the Search region is shown above the tool list but comes after all ten tool cards in the accessibility tree, so screen-reader users reach search only after every card. The scripted walk already reported the focus jump on the find page; the reading-order effect and the basket reversal are new. Keyboard and screen-reader members choosing a session may hear dates in the opposite order to what a sighted helper sees, and may pick the wrong session when moving with arrow keys. On the find page they may not discover search until after the whole list.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 320 px; /basket.html?items=drill-18v-two&day=2026-10-17 [errors] `role=group[name="Pick-up session"]` at 1280 px; /?items=ladder-3m `role=region[name="Search"]` at 1280 px and 3 more. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/default/320-light.yml, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/320-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/errors/1280-light-cvd-deuteranopia.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/aria/items-ladder-3m/no-results/1280-light.yml · found by 4 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Put the sessions in the DOM in the order they should be read (soonest first, matching what is shown, or reverse the DOM if latest-first is intended) instead of reordering them with CSS. Move the search form before the results in the DOM. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.3 Focus order; A11Y-21 ; H2-4 Consistency and standards; H2-2 Match between system and the real world

#### F-0035 · Pick-up day calendar accepts days when the library is closed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0035 | Pick-up day calendar accepts days when the library is closed | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A form should prevent choices that cannot work (H5). A reservation works only at a session, yet the calendar lets members choose non-session days. In the day-chosen state, Monday 12 October is selected and the page confirms "Pick-up day: Monday 12 October" without comment. The basket then asks for a session separately. First-time members, who do not know which days are sessions, may choose a closed day and then meet a second, different choice in the basket. Older members using large text may find the two choices harder to reconcile.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-12"]` at 320 px; /tool.html?id=drill-18v-two [day-chosen] `.day[data-day="2026-10-12"]` at 375 px; /tool.html?id=pressure-washer [added] `.day[data-day="2026-10-10"]` at 375 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/day-chosen/320-light.png, .ui-evaluator/runs/20261008-005630-audit-standard/probes/15/, .ui-evaluator/runs/20261008-005630-audit-standard/probes/19/, .ui-evaluator/runs/20261008-005630-audit-standard/probes/22/ · found by 4 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Offer only session days (disable or omit the others), or choose the session on the tool page and carry it into the basket. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; ISO 9241-110 #6 —; H2-2 Match between system and the real world

#### F-0038 · Tool names on cards are cut to one line, hiding the words that tell similar tools apart

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0038 | Tool names on cards are cut to one line, hiding the words that tell similar tools apart | 3 · major | 1 · one value or token | H2-6 | Recognition rather than recall |

**Problem.** Names that differ only at the end should stay distinguishable. .card__name a sets white-space: nowrap with text-overflow: ellipsis. Several catalogue names share a long prefix and differ only in the tail ('Cordless drill 18 V, combi, two batteries' vs '... one battery'; 'Manual tile cutter, 600 mm' vs 'Electric wet tile saw, 180 mm' less so). With a 96 px thumbnail beside the name, the text column is roughly 180-280 px, so the differing tail is likely to be replaced by an ellipsis. Members comparing the two drills may be unable to tell them apart on the list and may open or reserve the wrong one.

**Evidence.** Where: /index.html `.card__name a`; / [search results 'drill'] `role=link[name="Cordless drill 18 V, combi, two batteries"]` at 375 px; / [search results 'drill'] `role=link[name="Cordless drill 18 V, combi, one battery"]` at 375 px and 1 more. E1, reproduced or measured · styles.css:372-381; app.js:10-11, probes/6/screenshots/search-full.png, probes/6/screenshots/home-full.png, probes/6/aria.yml · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Allow names to wrap (two or three lines with line-clamp at most), keeping the 44 px target via min-height rather than nowrap. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-22 —; CW-Q3 Will the user recognize the action as the correct one?; H2-8 Aesthetic and minimalist design

#### F-0042 · Confirm reservation can be submitted again during the wait, allocating extra reservation numbers

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0042 | Confirm reservation can be submitted again during the wait, allocating extra reservation … | 3 · major | 2 · one component or file | CMP-16 | — |

**Problem.** A commit action should be idempotent while it is in flight. Each submit of #confirm-form pushes a new reference (FT-4471 + refs.length) into sessionStorage before the 1.5 s timeout; the button is not disabled and the handler has no in-flight guard. Two submits create two references for the same slot, and done.html then shows 'Reservation numbers: FT-4471 and FT-4472' for one booking. A member who taps twice may be shown two reservation numbers for one booking and be unsure which to quote at the desk; in a real backend this would double-book the tool.

**Evidence.** Where: /confirm.html [busy] `#confirm`. E1, reproduced or measured · app.js:413-420, 442-445, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/91/screenshots/done.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/91/probe.json · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Return early when the button is already busy (or disable it) and allocate the reference once per submission. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-5 Error prevention

#### F-0044 · Basket hold has a 10-minute limit that is never shown, warned about or extendable

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0044 | Basket hold has a 10-minute limit that is never shown, warned about or extendable | 3 · major | 3 · several components or one flow | WCAG 2.2.1 | Timing adjustable |

**Problem.** A time limit should be disclosed and adjustable or extendable. HOLD_MINUTES = 10 starts on the first reserve; the basket page says only 'Items are held for you while you finish' and there is no countdown, warning before expiry or extend action. Members who browse other tools or step away may lose the hold without knowing a limit existed.

**Evidence.** Where: /basket.html `.intro`; /basket.html?items=drill-18v-two&day=2026-10-17 `main > p` at 375 px. E1, reproduced or measured · app.js:7, 94-100; basket.html:33, .ui-evaluator/runs/20261008-005630-audit-standard/probes/3/aria.yml, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/94/screenshots/basket0.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/94/screenshots/basketlater.png · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** State the hold length, warn before expiry with an option to extend, or drop the client-side limit. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-10 Help and documentation

#### F-0045 · Closed days can be chosen as the pick-up day and are rejected only after Confirm reservation

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0045 | Closed days can be chosen as the pick-up day and are rejected only after Confirm reservat… | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Errors should be prevented where the choice is made. The calendar renders all 21 days as enabled buttons; only open days carry the 'Open' mark. Reserve accepts any day. The closed-day check runs only in the confirm submit timeout (after 1.5 s), and its error items have no link back to the tool page where the day is set. Members may complete three steps with an impossible day and then have to find their way back to each tool page to fix it.

**Evidence.** Where: /tool.html `#calendar .day`; /confirm.html [error-closed-day] `#error-list`. E1, reproduced or measured · app.js:195-208, 256-268, 420-431, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/84/screenshots/mon12.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/90/aria.yml, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/90/screenshots/closed.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Validate the day on Reserve (or only offer session days), and link each confirm-page error to the tool page with the day pre-filled. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-18 —

#### F-0049 · CSS reordering makes the visual order differ from the focus order on the finder and the session list

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0049 | CSS reordering makes the visual order differ from the focus order on the finder and the s… | 3 · major | 2 · one component or file | WCAG 2.4.3 | Focus order |

**Problem.** Reading and focus order should match the visual order. The finder's DOM puts results before the search form, but above 480 px CSS order puts the form first visually, so Tab goes through all result links before reaching the search box shown at the top. The session list uses flex-direction: row-reverse with flex-wrap: wrap-reverse, so sessions in chronological DOM order are laid out right-to-left and bottom-to-top, and arrow keys move opposite to what is seen. Keyboard users may tab through every tool card before reaching the search above them, and members scanning sessions may see the latest date first and pick the wrong one.

**Evidence.** Where: /index.html `.finder__form` at 1280 px; /basket.html `#sessions.sessions`. E1, reproduced or measured · styles.css:247-269, 816-822; index.html:36-81; app.js:330-332, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/77/screenshots/tab5.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/84/aria.yml, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/84/screenshots/basket.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Put the DOM in the intended order and drop order/row-reverse/wrap-reverse; use a plain wrapping row for sessions. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.3.2 Meaningful sequence; A11Y-03 Keyboard

#### F-0062 · Basket asks for a pick-up session again after the day was already chosen

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0062 | Basket asks for a pick-up session again after the day was already chosen | 3 · major | 3 · several components or one flow | CW-Q1 | Does the effect of the action match the user’s goal? |

**Problem.** Information the member has already given should carry forward. On the tool page the member chose Saturday 17 October, and the basket card repeats 'Pick up Saturday 17 October'. The 'Pick-up session' list below has nothing preselected and must be answered again. Pressing Continue without it shows 'Choose a pick-up session'. Members may think the session is already set, press Continue and hit an error. Or they may choose a session that differs from the day they picked.

**Evidence.** Where: /basket.html `role=radio[name="Saturday 17 October, 10:00 to 13:00"]` at 375 px; /tool.html?id=drill-18v-two [day-chosen] `#calendar`; /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 375 px and 3 more. E1, reproduced or measured · probes/25/screenshots/basket-full.png, probes/30/screenshots/continue-no-session.png, .ui-evaluator/runs/20261008-005630-audit-standard/probes/3/, .ui-evaluator/runs/20261008-005630-audit-standard/probes/50/ · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Preselect the session matching the chosen pick-up day, or ask for the day only once. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-7 Flexibility and efficiency of use; H2-4 Consistency and standards; H2-5 Error prevention; H2-6 Recognition rather than recall

#### F-0063 · Pick-up sessions are listed latest first, so the first Saturday shown is not this Saturday

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0063 | Pick-up sessions are listed latest first, so the first Saturday shown is not this Saturday | 3 · major | 1 · one value or token | CW-Q3 | Will the user recognize the action as the correct one? |

**Problem.** Date choices are expected in date order, soonest first. The basket's session list runs Wed 28 Oct, Sat 24 Oct, Wed 21 Oct, Sat 17 Oct, Wed 14 Oct, Sat 10 Oct. A member looking for 'Saturday morning' meets Saturday 24 October first; this Saturday (17 October) is fourth. Members may pick the wrong Saturday, and the tool is then set aside a week late.

**Evidence.** Where: /basket.html `role=radio[name="Wednesday 28 October, 18:00 to 20:00"]` at 375 px. E1, reproduced or measured · probes/25/screenshots/basket-full.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/84/screenshots/basket.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** List sessions in date order, soonest first. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-4 Consistency and standards

#### F-0080 · Reserved tool stays in the basket after the reservation is confirmed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0080 | Reserved tool stays in the basket after the reservation is confirmed | 3 · major | 1 · one value or token | H2-1 | Visibility of system status |

**Problem.** On the done page the header still reads 'Basket (1)', and opening the basket from there shows the just-reserved drill with its pick-up details and a Continue button, as if it were not yet reserved. After confirming, the member needs the basket to reflect that the tool is reserved. A member may doubt the reservation went through, or reserve the same tool again; desk volunteers may then see duplicate reservations.

**Evidence.** Where: /done.html `#basket-link` at 375 px; /basket.html [after confirm] `role=region[name="Tools"]` at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261008-005630-audit-standard/probes/48/, .ui-evaluator/runs/20261008-005630-audit-standard/probes/56/, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/91/screenshots/done.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/91/screenshots/basketAfter.png · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open · Also: H2-5 Error prevention

#### F-0097 · Keyboard focus on calendar days is hidden behind the sticky 'Reserve this tool' bar

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0097 | Keyboard focus on calendar days is hidden behind the sticky 'Reserve this tool' bar | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** A keyboard user needs to see which day has focus before pressing it. On tool.html at 375x667, tabbing from Loan length into the calendar moves focus to Friday 16 October and later Saturday 24 October, but the page scrolls only enough to put the focused button at the bottom edge, where the fixed 'Reserve this tool' bar covers it completely. The focused day is not visible at all; only after pressing Enter does the 'Pick-up day' text reveal what was chosen. Keyboard-only members (declared in context) cannot see which day they are about to choose on the critical reserve task, at the phone widths they mostly use.

**Evidence.** Where: /tool.html?id=drill-18v-two `#calendar > button.day (rows 3-5) under #reserve sticky bar` at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261008-005630-audit-standard/probes/28/probe.json, .ui-evaluator/runs/20261008-005630-audit-standard/probes/28/step-07.png, .ui-evaluator/runs/20261008-005630-audit-standard/probes/24/step-05.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/83/screenshots/tab8.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Add scroll padding equal to the sticky bar height so focused elements stop above it. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 2.4.11 Focus not obscured, minimum

#### F-0144 · Sticky Reserve bar hides the open loan-length options at 375 px

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0144 | Sticky Reserve bar hides the open loan-length options at 375 px | 3 · major | 2 · one component or file | DES-execution | — |

**Problem.** At 375 px, with the loan-length list opened, the fixed Reserve bar covers every option except 'One week'. Members choosing a pick-up day or loan length may not see the options they need, on the one page where they make both decisions.

**Evidence.** Where: /tool.html [day-chosen] `div.actionbar` at 1280 px; /tool.html [loan-open] `div.actionbar over loan listbox` at 375 px; /tool.html [added] `#toast` at 1280 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/loan-open/375-dark.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/day-chosen/1280-light.png, .ui-evaluator/runs/20261008-005630-audit-standard/probes/101/screenshots/open375.png, .ui-evaluator/runs/20261008-005630-audit-standard/probes/101/screenshots/open375-down.png · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Decide how the bar and the content share the viewport (reserved space at the page end, scroll padding, listbox layering) so no choice sits under it. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: FUN-06 No clipped or overlapping text at rest at any matrix width; A11Y-05 Focus not obscured

#### F-0113 · Tool names truncated with an ellipsis on phone widths

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0113 | Tool names truncated with an ellipsis on phone widths | 3 · major | 1 · one value or token | DES-execution | — |

**Problem.** At 375 the card titles cut off ('Cordless drill 18 V, co...', 'Extension ladder 3 m ...'), so the two cordless drills, which differ only by 'two batteries' / 'one battery', look identical. On the primary device the distinguishing words a member is looking for may be hidden, so they could open the wrong tool.

**Evidence.** Where: /?items=ladder-3m `h2.card__title` at 375 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/items-ladder-3m/default/375-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/74/screenshots/find375.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Let titles wrap at narrow widths; decide whether the thumbnail earns its width on phones. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: FUN-06 No clipped or overlapping text at rest at any matrix width

#### F-0125 · Tool titles truncate on phones so the two drills read identically

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0125 | Tool titles truncate on phones so the two drills read identically | 3 · major | 1 · one value or token | TYP-15 | — |

**Problem.** At 375 every card title is cut with an ellipsis; "Cordless drill 18 V, combi, two batteries" and "...one battery" both show "Cordless drill 18 V, co...". On phones, the main device, members may open the wrong variant; the distinguishing words ("two batteries") are exactly what returning members look for.

**Evidence.** Where: items-ladder-3m at 375 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/items-ladder-3m/default/375-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/74/screenshots/find375.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Decide that tool names wrap rather than clip on narrow widths. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: DES-execution —

#### F-0031 · Session-day dot disappears in forced colours at small widths

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0031 | Session-day dot disappears in forced colours at small widths | 2.67 · major | 1 · one value or token | A11Y-22 | — |

**Problem.** Under forced colours, meaningful indicators should stay visible (A11Y-22). At 320 px the word "Open" is replaced by a small green dot under the date. In the forced-colours capture the dots are gone, and session days (10, 14, 17, 21, 24, 28) differ from closed days only in that the date sits slightly higher in the cell. The instruction above the calendar still tells people to look for a green dot. Members using a contrast theme on a phone may not be able to tell which days are library sessions, and may pick a day when the desk is closed.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#calendar > button.day[data-day="2026-10-10"]` at 320 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/day-chosen/320-light-forced-colors.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/day-chosen/320-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/93/screenshots/fc320.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Keep the visible word "Open" at all widths (abbreviate the weekday header instead), or draw the dot as text or an SVG with fill: CanvasText inside @media (forced-colors: active). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0036 · Search with no matching tools leaves the previous results on screen and announces nothing

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0036 | Search with no matching tools leaves the previous results on screen and announces nothing | 2.67 · major | 2 · one component or file | CMP-05 | Data states exist |

**Problem.** A data view should show an empty state when a query matches nothing. search() only renders and updates the role=status text when list.length is non-zero; with zero matches it returns silently, so the grid keeps the previous (unfiltered or earlier) results and the status region keeps its old text. The same applies to the date and category filters, which call search() on change. A member searching for a tool the library does not stock may read the stale list as matches and open the wrong tool, or conclude the search did not run.

**Evidence.** Where: /index.html [search-no-results] `#results`; /?items=ladder-3m [no-results] `#results` at 375 px. E1, reproduced or measured · app.js:158-164, .ui-evaluator/runs/20261008-005630-audit-standard/probes/12/, .ui-evaluator/runs/20261008-005630-audit-standard/probes/16/, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/95/aria.yml · found by 2 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** Always render the list (empty included) and update the status; show an empty message naming the query with a way to clear filters. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-14 —; H2-1 Visibility of system status; A11Y-15 Status messages from async actions are exposed through `role=status…; H2-9 Help users recognize, diagnose and recover from errors

#### F-0037 · Results grid track minimum of 330 px is wider than the 320 px viewport's content box

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0037 | Results grid track minimum of 330 px is wider than the 320 px viewport's content box | 2.67 · major | 1 · one value or token | A11Y-07 | Reflow at 320 CSS px without two-dimensional scrolling |

**Problem.** Content must reflow at 320 CSS px without horizontal scrolling. .results uses repeat(auto-fill, minmax(330px, 1fr)); at 320 px the page content box is 288 px (16 px padding each side), so the single column is still 330 px and overflows by about 42 px. Members on small phones may need to scroll sideways to read each tool card, and card edges may be cut off.

**Evidence.** Where: /index.html `#results.results` at 320 px. E1, reproduced or measured · styles.css:329-333, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/79/screenshots/w320.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Use minmax(min(330px, 100%), 1fr) so the track can shrink below its minimum. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 1.4.10 Reflow

#### F-0041 · Continue and Confirm reservation show no visible change during their 1.2 s and 1.5 s waits

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0041 | Continue and Confirm reservation show no visible change during their 1.2 s and 1.5 s waits | 2.67 · major | 2 · one component or file | CMP-04 | Response feedback |

**Problem.** An action should be acknowledged within 0.1 s and show progress when it takes over 1 s. On submit, both handlers only set aria-busy="true" on the button and wait (setTimeout 1200 ms on basket, 1500 ms on confirm). styles.css has no [aria-busy] rule, the label does not change, and the button is not disabled, so nothing visible changes until navigation. Members may think the tap did not register and tap again (see code-07), or leave the page during the wait.

**Evidence.** Where: /basket.html [busy] `#continue`; /confirm.html [busy] `#confirm`; /basket.html `#continue` at 375 px and 1 more. E1, reproduced or measured · app.js:356-367, 418-433, styles.css, .ui-evaluator/runs/20261008-005630-audit-standard/probes/37/, .ui-evaluator/runs/20261008-005630-audit-standard/probes/52/ · found by 2 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** In the shared .button, style [aria-busy=true] (inline spinner or label change such as 'Confirming...') and ignore further activation while busy. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-10 —; H2-1 Visibility of system status; H2-5 Error prevention

#### F-0048 · Mobile and membership number checks reject common valid ways of typing them

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0048 | Mobile and membership number checks reject common valid ways of typing them | 2.67 · major | 1 · one value or token | CMP-18 | — |

**Problem.** Validation should accept the formats people and autofill produce. The phone pattern /^0\d{4}\s?\d{6}$/ rejects +44 7700 900123 (the form autofill often supplies with autocomplete=tel), 07700-900123 and 07700 900 123. The membership pattern /^FT-\d{5}$/ is case-sensitive, so 'ft-01234' fails. Members whose browser autofills an international number may get an error they cannot see the reason for and have to retype it.

**Evidence.** Where: /confirm.html [error] `#phone`; /confirm.html [error] `#member`; /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 [errors] `#phone` at 375 px. E1, reproduced or measured · app.js:387-389, .ui-evaluator/runs/20261008-005630-audit-standard/probes/54/, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/87/screenshots/fmt.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/87/screenshots/plus44.png · found by 2 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Normalise before checking: strip spaces and hyphens, map +44 to 0, uppercase the membership prefix. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-5 Error prevention; ISO 9241-110 #6 —

#### F-0064 · Continue and Confirm reservation give no acknowledgement while the next page loads

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0064 | Continue and Confirm reservation give no acknowledgement while the next page loads | 2.67 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** A tap should be acknowledged at once. After 'Continue' in the basket, the screen is unchanged at 200 ms and 800 ms, with no pressed or busy state, and /confirm.html arrives at about 1.2 s. After 'Confirm reservation', the screen is unchanged at 300 ms and 'Reservation confirmed' appears at about 1.0 s. Members on a phone may think the tap missed and tap again. On the commit button this may cause confusion about whether the reservation was made twice.

**Evidence.** Where: /basket.html [session chosen] `role=button[name="Continue"]` at 375 px; /confirm.html [filled] `role=button[name="Confirm reservation"]` at 375 px. E1, reproduced or measured · probes/25/screenshots/continue-200ms.png, probes/25/screenshots/continue-800ms.png, probes/1/probe.json, probes/30/screenshots/confirm-300ms.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Show a pressed or busy state on tap and ignore repeat taps until the next page loads. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0069 · 'Available from' filter wording does not match what it filters

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0069 | 'Available from' filter wording does not match what it filters | 2.67 · major | 1 · one value or token | H2-2 | Match between system and the real world |

**Problem.** The filter field is labelled 'Available from' with the hint 'Show tools you could pick up on or after this day.' Entering 12 October left only the six tools available from Saturday 10 October and removed tools available from 14, 17, 21 and 24 October, which could be picked up after 12 October. The cards use the same phrase 'Available from' for the tool's first available date. The member needs the label to say what the list will show. A member checking what they can collect on a given day may misread the filtered list, or conclude a tool is not lendable when it is available a few days later.

**Evidence.** Where: / [filters-open] `#from` at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261008-005630-audit-standard/probes/11/, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/77/screenshots/filter12.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** none given by the evaluators.

Problem type: single location · Priority P1 · Status open · Also: H2-4 Consistency and standards

#### F-0079 · Basket does not say how long tools are held

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0079 | Basket does not say how long tools are held | 2.67 · major | 1 · one value or token | H2-1 | Visibility of system status |

**Problem.** The basket says 'Items are held for you while you finish.' It does not say for how long, or what happens if the member leaves and comes back. The journey persona does not know how long the basket holds a tool, and with one of each tool the hold matters. Members who plan in short bursts while doing something else may leave expecting the hold to last, then lose the tool, or hurry unnecessarily.

**Evidence.** Where: /basket.html `main > p:first-of-type` at 375 px; /basket.html?items=drill-18v-two&day=2026-10-17 `main > p (intro paragraph)` at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/375-light.png, .ui-evaluator/runs/20261008-005630-audit-standard/evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/375-light.yml, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/84/screenshots/basket.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/85/screenshots/removed.png · found by 2 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open · Also: H2-10 Help and documentation

#### F-0132 · Done page still shows "Basket (1)" after the reservation is confirmed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0132 | Done page still shows "Basket (1)" after the reservation is confirmed | 2.67 · major | 1 · one value or token | H2-1 | Visibility of system status |

**Problem.** The masthead on "Reservation confirmed" reads "Basket (1)". Members may wonder whether the tool is still waiting in the basket and whether the reservation really went through.

**Evidence.** Where: done-html-items-drill-18v-two-day-2026-10-17-slot-sat-2026-1 at 1280 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/evidence/screens/done-html-items-drill-18v-two-day-2026-10-17-slot-sat-2026-1/default/1280-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-3/workspace/.ui-evaluator/runs/20261008-005630-audit-standard/probes/91/screenshots/done.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Decide what the basket shows once its contents become a reservation. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: DES-execution —

#### F-0009 · Text clips under the text-spacing override in li:nth-of-type(1) > article.card > div.card__body > h2.card_

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0009 | Text clips under the text-spacing override in li:nth-of-type(1) > article.card > div.card… | 2 · minor (rule) | 1 · one value or token | A11Y-08 | Text-spacing override |

**Problem.** With line-height 1.5, paragraph spacing 2em, letter spacing 0.12em and word spacing 0.16em, text ("Cordless drill 18 V, combi, two batteries") is cut off at 1280 px (scroll 427×50 vs client 390×50).

**Evidence.** Where: /?items=ladder-3m `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px; /?items=ladder-3m [filters-open] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px; /?items=ladder-3m [no-results] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px and 6 more. E1, reproduced or measured · evidence/crops/layout/590558f06b.png, evidence/crops/layout/bf44b73749.png, evidence/crops/layout/dcc3a9ef99.png, evidence/crops/layout/b9bfa8cd0f.png. Ratings: rule: 2.

**Recommendation.** Replace fixed heights on text containers with min-height or padding, and let text wrap. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.12 Text spacing

#### F-0015 · Text overlaps under the text-spacing override: #reserve

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0015 | Text overlaps under the text-spacing override: #reserve | 2 · minor (rule) | 2 · one component or file | A11Y-08 | Text-spacing override |

**Problem.** At 320 px with the WCAG 1.4.12 spacing override, #reserve ("Reserve this tool") overlaps #tool-from ("Saturday 10 October").

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m `#reserve` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#reserve` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#reserve` at 320 px and 9 more. E1, reproduced or measured · evidence/crops/layout/c7ebe89a3f.png, evidence/crops/layout/c4df524728.png, evidence/crops/layout/e3ff34306c.png, evidence/crops/layout/0bf9185bb9.png. Ratings: rule: 2.

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.12 Text spacing

### P2

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0141 | Loan-length listbox traps Tab while open | 2.33 · minor | 2 · one component or file | A11Y-25 | — | E1 | open |
| F-0050 | Dark-theme success token differs from DESIGN.md and its tint equals the card surface | 2.33 · minor | 1 · one value or token | COL-01 | Token conformance | E1 | open |
| F-0051 | 'Added to your basket' toast disappears after about 1.35 seconds | 2.33 · minor | 1 · one value or token | CMP-13 | — | E1 | open |
| F-0066 | A search with no matches shows the full tool list and no message | 2.33 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0115 | Dark theme drops the available badge's pill, inverting emphasis | 2.33 · minor | 1 · one value or token | DES-coherence | — | E1 | open |
| F-0117 | Basket session list runs latest-first in an uneven one-plus-five layout at desktop widths | 2.33 · minor | 1 · one value or token | DES-execution | — | E1 | open |
| F-0130 | Pick-up sessions in reverse date order with one stranded full-width card | 2.33 · minor | 1 · one value or token | DES-execution | — | E1 | open |
| F-0133 | Available badges lose their tint in dark mode | 2.33 · minor | 1 · one value or token | COL-14 | — | E1 | open |
| F-0134 | No-results search still shows the full catalogue on phones | 2.33 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0139 | No-results state shows the full list with no empty-state message | 2.33 · minor | 2 · one component or file | DES-execution | — | E1 | open |
| F-0008 | Touch-primary controls closer than 8 px: "Saturday 17 October, open" and "Reserve this to… | 2 · minor (rule) | 2 · one component or file | CMP-06 | Touch-primary targets | E1 | open |
| F-0019 | Body text closer than 16 px to the viewport edge: "Cleaning · deposit £30" | 2 · minor (rule) | 1 · one value or token | LAY-05 | Edge margin | E1 | open |
| F-0029 | Loan-length button is named only by its value, not by the Loan length label | 2 · minor | 1 · one value or token | WCAG 1.3.1 | Info and relationships | E1 | open |
| F-0030 | Day buttons' accessible names do not contain their visible text "10 Open" | 2 · minor | 1 · one value or token | WCAG 2.5.3 | Label in name | E1 | open |
| F-0032 | Item headings share the level of their section heading on the find and basket pages | 2 · minor | 2 · one component or file | A11Y-26 | — | E1 | open |
| F-0033 | Reserve this tool button and the added-to-basket status sit outside every landmark | 2 · minor | 2 · one component or file | A11Y-26 | — | E1 | open |
| F-0034 | Confirmation page exposes the reserved tool's name twice to assistive technology | 2 · minor | 1 · one value or token | H2-8 | Aesthetic and minimalist design | E1 | open |
| F-0142 | Loan-length listbox does not close on outside click or blur | 2 · minor | 2 · one component or file | A11Y-25 | — | E1 | open |
| F-0046 | The 'Change' link for the pick-up session drops the session already chosen | 2 · minor | 1 · one value or token | CMP-19 | — | E1 | open |
| F-0047 | The stated three-tool limit is not enforced when adding to the basket | 2 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0055 | Fixed action bar on the tool page covers the end of the page; no space is reserved for it | 2 · minor | 2 · one component or file | A11Y-05 | Focus not obscured | E1 | open |
| F-0057 | Search field sits below the whole tool list on a phone | 2 · minor | 1 · one value or token | CW-Q2 | Is the action visible? | E1 | open |
| F-0058 | Search results change above the viewport, leaving only the last result next to the search… | 2 · minor | 2 · one component or file | CW-Q4 | Will the user understand the feedback? | E1 | open |
| F-0060 | Pick-up day grid is below the fold and its heading is covered by the sticky Reserve bar | 2 · minor | 2 · one component or file | CW-Q2 | Is the action visible? | E1 | open |
| F-0068 | Filters toggle shows only an icon | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0075 | Details typed on the confirm page are lost after changing the session | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0077 | Remove takes a tool out of the basket at once with no undo | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0081 | Format errors on confirm read as if the field were empty | 2 · minor | 2 · one component or file | H2-9 | Help users recognize, diagnose and recover from errors | E1 | open |
| F-0082 | Loan-length list does not close with Escape | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0091 | Change opens the basket with no session selected, not the one currently chosen | 2 · minor | 1 · one value or token | H2-6 | Recognition rather than recall | E1 | open |
| F-0106 | Each calendar day is a separate tab stop, so reaching Reserve takes over 20 key presses | 2 · minor | 2 · one component or file | H2-7 | Flexibility and efficiency of use | E1 | open |
| F-0119 | Search drops below the whole tool list on phones | 2 · minor | 1 · one value or token | DES-hierarchy | — | E1 | open |
| F-0126 | Search block drops below all ten cards on phones | 2 · minor | 1 · one value or token | DES-hierarchy | — | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0146 | Reservation number, session and deposit have no emphasis on the done page | 1.33 · cosmetic | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0003 | Weak by APCA, passes WCAG: "Members can reserve up to three tools at" | 1 · cosmetic (rule) | 1 · one value or token | COL-14 | — | E1 | open |
| F-0004 | Weak by APCA, passes WCAG: "Category" | 1 · cosmetic (rule) | 1 · one value or token | COL-14 | — | E1 | open |
| F-0005 | Weak by APCA, passes WCAG: "Items are held for you while you finish." | 1 · cosmetic (rule) | 1 · one value or token | COL-14 | — | E1 | open |
| F-0006 | Weak by APCA, passes WCAG: "Tools" | 1 · cosmetic (rule) | 1 · one value or token | COL-14 | — | E1 | open |
| F-0007 | Weak by APCA, passes WCAG: "Reservation number" | 1 · cosmetic (rule) | 1 · one value or token | COL-14 | — | E1 | open |
| F-0017 | One word on the last line: "You can collect at any of these sessions" | 1 · cosmetic (rule) | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0018 | One word on the last line: "Nothing is paid online. Bring the deposi" | 1 · cosmetic (rule) | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0020 | One word on the last line: "Cordless drill 18 V, combi, two batterie" | 1 · cosmetic (rule) | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0021 | One word on the last line: "Reservation confirmed" | 1 · cosmetic (rule) | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0022 | Cramped padding: "Pressure washer, 130 bar Cleaning · depo" | 1 · cosmetic (rule) | 1 · one value or token | LAY-04 | No cramped padding | E1 | open |
| F-0023 | One word on the last line: "Drills and drivers · deposit £20" | 1 · cosmetic (rule) | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0143 | Loan-length trigger does not open with ArrowDown or ArrowUp | 1 · cosmetic | 2 · one component or file | A11Y-25 | — | E1 | open |
| F-0078 | Error summary stays after the basket is emptied | 1 · cosmetic | 1 · one value or token | H2-1 | Visibility of system status | E1 | open |
| F-0089 | Search and filter choices are not kept in the address, so a filtered list cannot be revis… | 1 · cosmetic | 2 · one component or file | H2-7 | Flexibility and efficiency of use | E1 | open |
| F-0110 | Every tool card shows the same placeholder wrench thumbnail | 1 · cosmetic | 2 · one component or file | DES-appeal | — | E1 | open |
| F-0111 | No identity beyond the name: stock glyph plus bold body text in the masthead, no product-… | 1 · cosmetic | 3 · several components or one flow | DES-specificity | — | E1 | open |
| F-0145 | Added-to-basket toast is drawn over calendar cells | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0114 | Filter panel uses unstyled native date and select controls, misaligned | 1 · cosmetic | 2 · one component or file | DES-coherence | — | E1 | open |
| F-0118 | Tool details split into two lists with misaligned value columns | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0121 | No visual identity beyond the name set in bold body type | 1 · cosmetic | 3 · several components or one flow | DES-specificity | — | E1 | open |
| F-0122 | Reservation number uses the same FT- prefix as membership numbers | 1 · cosmetic | 1 · one value or token | H2-4 | Consistency and standards | E1 | open |
| F-0123 | Every tool card shows the same wrench glyph as a placeholder thumbnail | 1 · cosmetic | 2 · one component or file | DES-appeal | — | E1 | open |
| F-0124 | No identity or focal point on any surface | 1 · cosmetic | 3 · several components or one flow | DES-specificity | — | E1 | open |
| F-0127 | Filter panel uses unthemed browser-default date and select controls | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0129 | Tool details split into two misaligned definition lists | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0148 | Content column leaves the right half empty at wide widths | 1 · cosmetic | 3 · several components or one flow | DES-appeal | — | E1 | open |
| F-0149 | Footer stops short, leaving a grey band below it | 1 · cosmetic | 2 · one component or file | DES-appeal | — | E1 | open |
| F-0150 | Availability badges wrap 'Oct' alone onto a second line at 375 px | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0151 | Main navigation links wrap to two lines at 375 px | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0152 | Done and confirm content fill only half the width at 1280 px | 1 · cosmetic | 3 · several components or one flow | DES-appeal | — | E1 | open |
| F-0153 | Reservation number is plain body text on the done page | 1 · cosmetic | 2 · one component or file | DES-appeal | — | E1 | open |

## 5. Divergent and disputed findings: questions for user research

The raters flagged no finding as divergent (0 of 79). These questions remain open because evaluators disagreed or a human is needed:

- Does a screen reader announce the "Added to your basket" toast (F-0052)? This needs a VoiceOver or TalkBack pass.
- Do members on a phone notice that "Reserve this tool" did not finish the reservation? A five-person moderated test of the critical journey would settle how severe F-0061 really is.
- Evaluators disagreed on the loan-length listbox. One said it works fully by keyboard; the verifier reproduced the Tab cycling. A keyboard user's verdict would resolve it.

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | pass | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0029, F-0034 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0027, F-0049 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | pass | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | pass | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001, F-0002, F-0050 |
| 1.4.4 | AA | Resize text | scripted | fail | F-0010, F-0016 |
| 1.4.5 | AA | Images of text | agent-judged | pass | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0013, F-0037 |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | fail | F-0009, F-0015 |
| 1.4.13 | AA | Content on hover or focus | agent-judged | pass | — |
| 2.1.1 | A | Keyboard | scripted | fail | F-0026, F-0082 |
| 2.1.2 | A | No keyboard trap | scripted | fail | F-0039, F-0141, F-0142, F-0143 |
| 2.1.4 | A | Character key shortcuts | needs-human | not_run | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0044 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | pass | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | needs-human | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0024, F-0027, F-0049 |
| 2.4.4 | A | Link purpose in context | agent-judged | pass | — |
| 2.4.5 | AA | Multiple ways | agent-judged | pass | — |
| 2.4.6 | AA | Headings and labels | agent-judged | pass | — |
| 2.4.7 | AA | Focus visible | scripted | pass | — |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | fail | F-0025, F-0097 |
| 2.5.1 | A | Pointer gestures | agent-judged | not_applicable | — |
| 2.5.2 | A | Pointer cancellation | scripted | pass | — |
| 2.5.3 | A | Label in name | agent-judged | fail | F-0030 |
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
| 3.3.1 | A | Error identification | scripted | pass | — |
| 3.3.2 | A | Labels or instructions | agent-judged | pass | — |
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0081 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | pass | — |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_applicable | — |
| 4.1.2 | A | Name, role, value | agent-judged | fail | F-0029 |
| 4.1.3 | AA | Status messages | scripted | pass | — |

Totals by coverage: auto 1 · scripted 22 · agent-judged 21 · needs-human 10; by state: pass 27 · fail 14 · not_run 10. This matrix is not a conformance claim (QUALITY-BAR §8).

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
- Whether search filters results and announces the outcome: the no-results capture shows an empty status region and the unfiltered list; needs a probe. (a11y)
- Orientation on a real device rotated to landscape (judged only from responsive captures). (a11y)
- uie lint re-run: Bash tool denied in this session; packet lint.json was empty. (code)
- Rendered contrast of dark-theme badge (code-15) is computed from token values, not measured in the capture. (code)
- Whether screen readers announce the toast (code-17) needs an assistive-technology probe. (code)
- Behaviour on real mobile Safari/Chrome (probes ran in Chromium at 375x812) (cw-1)
- Whether the toast is announced to screen readers (it was absent from the ARIA snapshot at the captured moments) (cw-1)
- Whether double-clicking Confirm reservation creates two reservations: probe 52 shows the button stays enabled and accepts a second click, but the back-end effect is not observable from the UI. (he-1)
- How long the basket actually holds a tool (no time limit is visible; I could not wait out a hold in a probe). (he-1)
- Whether the three-tools-per-member limit stated on the find page is enforced when a fourth tool is reserved (not probed). (he-1)
- Screen-reader announcement of the 'Added to your basket' toast beyond its presence as role=status (probe 15) was not tested with an actual screen reader. (he-1)
- Whether a held basket item actually expires or is released to other members after some time: no way to wait out a hold or observe another member's session. (he-2)
- Whether the done page reservation persists for the desk volunteers' Saturday list: no volunteer view in the packet. (he-2)
- Behaviour on slow or failed network for Reserve/Confirm: the app made no network requests in any probe, so loading/failure states could not be triggered. (he-2)
- Calendar behaviour beyond 29 October (no next-period control was found); whether later sessions are needed is a content question I cannot judge. (he-2)
- Whether the inline 'Choose a pick-up day first.' message on tool.html is announced by a screen reader: probe 58 showed it visually, but the ARIA snapshot does not show it inside a live region and I could not test with VoiceOver/TalkBack. (he-3)
- Where keyboard focus lands after Remove empties the basket (probe 49): the probe recorded no active-element information. (he-3)
- Whether 'Basket (1)' on done.html means the basket is not cleared after a real confirmation: the capture was loaded from a seeded URL and I did not submit a valid reservation. (he-3)
- Whether the 'Pick-up day: ...' text on tool.html is announced when a day is pressed (it is a plain paragraph in the ARIA tree; the day button does expose [pressed]). (he-3)
- toast and button motion (critic-3)
- focus rings and hover (critic-3)
- action bar behaviour while scrolling (critic-3)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0002, F-0009, F-0010, F-0011, F-0012 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (1 finding(s)); FUN-06 (5 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (6 finding(s)); A11Y-05 (4 finding(s)) ….
3. For L2: USE-05 (6 open P0 finding(s)); USE-06 (34 P1 finding(s) without a recorded decision); DES-02 (0/3 critics judged it specific); DES-03 (3 agreed severe design finding(s) open); DES-04 (0/3 critics: attributes reflected) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (40 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

