# UI evaluation report: Fernhill Tool Library reservations · run 20261009-223234-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:e3a8558629 (uncommitted changes present) · run opened 2026-10-10T02:32:34.698Z |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Surfaces and modes | find (operate), tool (operate), basket (operate), confirm (operate), done (read) |
| Routes × states | 5 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-10T02:32:00.783Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | 3874035c 3874035c 3874035c |
| walkthrough-evaluator | 1 | subagent | claude-opus-5-5 | 182a4fcd |
| design-critic | 3 | subagent | claude-opus-5-5 | a6e25cd6 a6e25cd6 a6e25cd6 |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 00dc91cc |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 09a98abb 1b9adc0d |
| finding-verifier | 4 | subagent | claude-opus-5-5 | a12c25d4 539d401b b12d172d e8c3737c |
| severity-rater | 3 | subagent | claude-opus-5-5 | 3e8f27ab 88748a96 bf2d5b3b |

Coverage: 540 valid capture(s); 100% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (1 finding(s)); FUN-06 (2 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (5 finding(s)); A11Y-05 (2 finding(s)); A11Y-07 (3 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-06 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-05, A11Y-07, A11Y-08, A11Y-09, A11Y-11, A11Y-27 |
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

Each was seen at a phone width or in a state the audit ran:

- Error summaries on basket and confirm take focus, are announced as alerts, link to each field and keep what was typed (basket/errors and confirm/errors states, 375 px light; probes 26, 40, 41).
- The done page says plainly what to bring, where to go and what to do if the session is missed (done/default/375-light.png).
- Deposit and "nothing is paid online" are shown where decisions are made (find cards and confirm page, 375 px).
- Reserving without a day gives a specific message next to the calendar, and a double press on Reserve does not add the tool twice (probes 3 and 17).
- Calendar days have full spoken names with session status and a pressed state (tool/day-chosen ARIA snapshot).
- Copy is in the members' own words and matches the library's facts (all three critics; brand attribute "practical, not corporate" met).

- Global :focus-visible ring (3 px, token colour, 2 px offset) separate from hover, with no outline:none anywhere
- Motion is limited to two 120 ms colour/opacity transitions, both removed under prefers-reduced-motion; no transition: all
- Error summary pattern: role=alert, focused on error, links to fields; fields carry aria-invalid and aria-describedby
- Remove buttons carry the tool name in hidden text and focus returns to the basket heading after removal
- Tokens are consumed consistently: uie lint COL-01 share 0.991, LAY-01 share 1.0, one font family
- Confirm page errors are summarised, linked to fields and keep what was typed
- Done page says exactly what to do next
- Reserving without a day gives an immediate, specific message

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.49 (mean Jaccard over 3 passes); an estimated 1.2 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0024 · Focus order jumps back: "Electric wet tile saw, 180 mm" → "Search tools"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0024 | Focus order jumps back: "Electric wet tile saw, 180 mm" → "Search tools" | 4 · catastrophe (rule) | 2 · one component or file | A11Y-03 | Keyboard |

**Problem.** After "Electric wet tile saw, 180 mm", Tab moves to "Search tools", which sits 654 px above it in the same column; the focus order does not follow the visual reading order (clear-inversion heuristic).

**Evidence.** Where: /?items=ladder-3m `#q` at 1280 px; /?items=ladder-3m [filters-open] `#q` at 1280 px; /?items=ladder-3m [no-results] `#q` at 1280 px and 2 more. E1, reproduced or measured · evidence/crops/keyboard/21774f91d1.png, evidence/crops/keyboard/8c55f79d69.png, evidence/crops/keyboard/6b7d343985.png, styles.css:247-269; index.html:35-82. Ratings: rule: 4.

**Recommendation.** Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.4.3 Focus order; WCAG 1.3.2 Meaningful sequence

#### F-0026 · Not reachable by keyboard: "Fernhill Tool Library"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0026 | Not reachable by keyboard: "Fernhill Tool Library" | 4 · catastrophe (rule) | 2 · one component or file | A11Y-03 | Keyboard |

**Problem.** The a "Fernhill Tool Library" is tabbable in the DOM, but a complete Tab walk never reached it. People who use a keyboard or switch cannot operate it.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `div > a.library-name` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `li:nth-of-type(1) > a` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#basket-link` at 320 px and 5 more. E1, reproduced or measured · evidence/crops/keyboard/838d70f50d.png, evidence/crops/keyboard/68977968e8.png, evidence/crops/keyboard/7a8cae446c.png, evidence/crops/keyboard/062afdd805.png. Ratings: rule: 4.

**Recommendation.** Put the control back in the Tab order (remove tabindex="-1") or give its function a reachable equivalent. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.1.1 Keyboard

#### F-0041 · Expired-hold error reads 'Something went wrong. Try again.' and retrying fails the same way

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0041 | Expired-hold error reads 'Something went wrong. Try again.' and retrying fails the same w… | 4 · catastrophe | 2 · one component or file | CPY-04 | Error-message quality |

**Problem.** An error should name the cause and a way forward. When the hold has expired the basket shows 'Something went wrong. Try again.'; the hold start time is not reset by the error path, so every retry hits the same branch and shows the same message. Only done.html's 'Reserve another tool' clears hold_started. Members following the message's advice may loop on the same error with no way to finish the reservation.

**Evidence.** Where: /basket.html [hold-expired] `#error-list`. E1, reproduced or measured · app.js:360-364, 94-100, 452-455, probes/86/screenshots/expired-1.png, probes/86/screenshots/expired-retry.png · found by 1 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Say the hold ran out and offer to renew it (re-check availability and restart the hold) from the error itself. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: H2-9 Help users recognize, diagnose and recover from errors; CMP-18 —

#### F-0040 · Ten-minute basket hold is never shown and cannot be extended

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0040 | Ten-minute basket hold is never shown and cannot be extended | 3.67 · catastrophe | 3 · several components or one flow | WCAG 2.2.1 | Timing adjustable |

**Problem.** A time limit on a task should be stated and adjustable or extendable. The hold starts when the first tool is reserved (HOLD_MINUTES = 10) and is checked only when Continue is pressed; no page shows the limit or the time left, and nothing warns before it expires or offers more time. The basket copy says only 'Items are held for you while you finish'. Members who browse several tools, or need longer to read and type, may hit the limit with no warning and lose the reservation attempt.

**Evidence.** Where: /basket.html `.intro`; /basket.html [hold-expired] `#continue`; /basket.html?items=drill-18v-two&day=2026-10-17 `main > p` at 375 px and 1 more. E1, reproduced or measured · app.js:7, 90-100, 360, probes/5/, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/375-light.png, aria basket default · found by 4 of 10 evaluator(s). Ratings: 3.67 (spread 1; 3, 4, 4).

**Recommendation.** State the hold length and time left on the basket, warn before expiry and offer at least one extension. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: H2-1 Visibility of system status; H2-10 Help and documentation

### P1

#### F-0053 · After 'Reserve this tool' nothing says the reservation is unfinished or what to do next

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0053 | After 'Reserve this tool' nothing says the reservation is unfinished or what to do next | 3.33 · major | 2 · one component or file | CW-Q1 | Does the effect of the action match the user’s goal? |

**Problem.** A first-time member who presses a button labelled 'Reserve this tool' needs to be told that the tool is only held and that a session and a confirmation are still needed, with a way to get there. Today the only feedback is a small toast 'Added to your basket'. It has no link and is gone within 5 s. The button label does not change. The header count changes to 'Basket (1)', but at that moment the header is scrolled off screen. The tool page offers no next-step prompt, so the only way forward is the small header link. A member may believe the drill is reserved and stop. If so, no reservation is made and the tool may not be waiting at Saturday's session.

**Evidence.** Where: /tool.html?id=drill-18v-two [added] `role=status` at 375 px; /tool.html?id=drill-18v-two [added] `#basket-link` at 375 px. E1, reproduced or measured · probes/10/, probes/13/, .ui-evaluator/runs/20261009-223234-audit-standard/probes/71/screenshots/after-reserve.png, .ui-evaluator/runs/20261009-223234-audit-standard/probes/71/screenshots/after-5s.png · found by 1 of 10 evaluator(s). Ratings: 3.33 (spread 1; 3, 3, 4).

**Recommendation.** After adding, show a persistent message stating the tool is held but not yet reserved, with a 'Choose a session' link to the basket. Or change the button label to match what it does. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CW-Q4 Will the user understand the feedback?; CW-Q2 Is the action visible?; H2-1 Visibility of system status

#### F-0138 · A tool can be reserved and confirmed for a day before it is available

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0138 | A tool can be reserved and confirmed for a day before it is available | 3.33 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Choosing a pick-up day earlier than the tool's 'Available from' date is accepted all the way through: the pressure washer (available from Saturday 17 October) was reserved for Saturday 10 October and reached 'Reservation confirmed'; the sander ('Available from Wednesday 21 October') was accepted into the basket for Saturday 10 October. First-time members may hold a tool for a day the desk is closed or before the tool is back, and only discover it at the session or not at all.

**Evidence.** Where: /tool.html?id=drill-18v-two [day-chosen] `#calendar > button.day` at 375 px; /tool.html?id=sander [added] `role=button[name="Saturday 10 October, open"]` at 375 px; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-12"]` at 375 px and 2 more. E1, reproduced or measured · probes/3/, probes/5/, probes/14/, probes/15/screenshots/after-reserve-monday.png · found by 3 of 10 evaluator(s). Ratings: 3.33 (spread 1; 3, 3, 4).

**Recommendation.** Make only session days on or after the tool's available date selectable, or warn when another day is chosen. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status

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

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m `#loan-button` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m `#calendar > button.day:nth-of-type(3)` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#loan-button` at 320 px and 6 more. E1, reproduced or measured · evidence/crops/keyboard/acf770e60f.png, evidence/crops/keyboard/ecab508c28.png, evidence/crops/keyboard/698751df87.png, evidence/crops/keyboard/85e4ed9e92.png. Ratings: rule: 3.

**Recommendation.** Add scroll-padding-top / scroll-padding-bottom equal to the sticky bar height (technique C43), or keep floating layers out of the focus path. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.11 Focus not obscured, minimum; H2-6 Recognition rather than recall; H2-1 Visibility of system status

#### F-0131 · Escape does not close the open loan-length list

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0131 | Escape does not close the open loan-length list | 3 · major | 2 · one component or file | A11Y-25 | — |

**Problem.** Expected (APG select-only combobox / listbox popup): Esc closes the open list and returns focus to the Loan length button. Current: after #loan-button opens #loan-list with Enter and ArrowDown moves to 'Two weeks', Esc leaves the list open with focus still on the option (probes/60 after-esc.png). A keyboard-only member who opens the loan-length list cannot back out with Esc or Tab past it. To reach the calendar and 'Reserve this tool' they have to commit an option, which they may not discover.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#loan-button` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#loan-list` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#loan-list` at 375 px. E1, reproduced or measured · probes/60/probe.json, probes/61/probe.json, evidence/aria/tool-html-id-drill-18v-two-items-ladder-3m/loan-open/1280-light.yml, probes/45/ · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Replace the custom listbox with a native <select> labelled 'Loan length'. If the custom widget stays, close it on Esc and Tab and return focus to the button, and name the button with aria-labelledby pointing to the heading and the value. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.1.1 Keyboard; A11Y-03 Keyboard; H2-3 User control and freedom; H2-4 Consistency and standards

#### F-0028 · Pick-up session radios are shown in reverse date order, but focus and arrow keys follow the DOM order

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0028 | Pick-up session radios are shown in reverse date order, but focus and arrow keys follow t… | 3 · major | 1 · one value or token | WCAG 2.4.3 | Focus order |

**Problem.** Expected: focus order and reading order match the visual order (2.4.3, 1.3.2). Current: on /basket.html the six session radios appear newest first (Wednesday 28 October at the top or full width, then 24, 21, 17, 14, 10) at both 1280 px and 320 px. The DOM and accessibility tree list them oldest first (Saturday 10 October first). Tab from 'Remove' lands on Saturday 10 October, the last item on screen (bottom right at 1280 px, bottom at 320 px). ArrowDown then moves to Wednesday 14 October, which sits to its left or above it, so arrow navigation runs against the visual layout. Keyboard and screen-magnifier users see focus start at the end of the list and move backwards. Screen-reader users hear a different order from the one sighted helpers see. This is the step where members pick their session, the critical task.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 1280 px; /basket.html?items=drill-18v-two&day=2026-10-17 [errors] `role=group[name="Pick-up session"]` at 320 px; /basket.html `#sessions.sessions` and 3 more. E1, reproduced or measured · probes/64/probe.json, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/errors/320-light.png, evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/1280-light.yml, styles.css:816-822; app.js:330-332 · found by 5 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Remove the reversing CSS (for example flex-direction: *-reverse or wrap-reverse) so the visual order matches the chronological DOM order, or reorder the DOM if newest-first is intended. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.3.2 Meaningful sequence; A11Y-03 Keyboard; H2-4 Consistency and standards; CW-Q3 Will the user recognize the action as the correct one?; H2-2 Match between system and the real world

#### F-0031 · Under forced colours at 320 px the dots that mark session days disappear from the calendar

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0031 | Under forced colours at 320 px the dots that mark session days disappear from the calendar | 3 · major | 1 · one value or token | A11Y-22 | — |

**Problem.** Expected (A11Y-22): meaningful indicators stay visible in forced-colours mode. Current: at 320 px the calendar marks session days only with a small green dot (the 'Open' text is hidden at this width). With forced-colors: active the dots are not drawn, so session days look the same as every other day. The selected day keeps a visible border and bold number. Phone users with a contrast theme cannot tell which days are library sessions, so they may choose a day when the desk is closed. Accessible names still say 'open'.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#calendar` at 320 px. E1, reproduced or measured · probes/65/probe.json, .ui-evaluator/runs/20261009-223234-audit-standard/probes/79/screenshots/normal-320-calendar.png, .ui-evaluator/runs/20261009-223234-audit-standard/probes/79/screenshots/fc-320-calendar.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Keep a short visible text cue ('Open') at every width, or draw the dot as an SVG with fill: currentColor or as a forced-colours-safe border, so it survives forced colours. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0034 · Pick-up day chosen on the tool page must be matched again with a session in the basket

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0034 | Pick-up day chosen on the tool page must be matched again with a session in the basket | 3 · major | 3 · several components or one flow | H2-6 | Recognition rather than recall |

**Problem.** Expected (recognition rather than recall; no re-entry within a process): a choice already made carries forward. Current: the member chooses 'Pick-up day: Saturday 17 October' on /tool.html, and the basket shows 'Pick up Saturday 17 October'. The 'Pick-up session' radio group still starts with nothing selected and fails with 'Choose a pick-up session' if Continue is pressed. The matching session (Saturday 17 October, 10:00 to 13:00) is one of six options, listed in reverse order (see a11y-02). Members, many of them older, make the same decision twice and must remember and match the day they picked one screen earlier. The error state is the likely result. 3.3.7 is judged met because the value is offered for selection.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 1280 px; /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 375 px; /basket.html `role=group[name="Pick-up session"]` at 375 px and 4 more. E1, reproduced or measured · evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/errors/1280-light.png, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/375-light.png, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/errors/375-light.png, probes/16/final.png · found by 5 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Preselect the session that matches the chosen pick-up day, leaving the others available to change. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-7 Flexibility and efficiency of use; CW-Q1 Does the effect of the action match the user’s goal?; H2-2 Match between system and the real world; H2-4 Consistency and standards

#### F-0036 · Loan-length listbox has no Escape or outside-click close

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0036 | Loan-length listbox has no Escape or outside-click close | 3 · major | 2 · one component or file | A11Y-25 | — |

**Problem.** A popup listbox should close on Escape and return focus to its button, and close when focus or a click moves elsewhere. The handlers on #loan-button and #loan-list handle only click, Arrow, Tab, Enter and Space; there is no Escape branch and no document-level click or focusout handler, so the list stays open until an option is chosen or the button is clicked again. Members who open the list only to look may have no expected way to dismiss it, and the open list pushes the calendar down on phones.

**Evidence.** Where: /tool.html [loan-list-open] `#loan-list[role=listbox]`; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#loan-button` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#loan-list` at 320 px and 1 more. E1, reproduced or measured · app.js:224-251, .ui-evaluator/runs/20261009-223234-audit-standard/probes/66/screenshots/escape.png, .ui-evaluator/runs/20261009-223234-audit-standard/probes/66/screenshots/outside.png, probes/60/probe.json · found by 4 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Add Escape (close, focus the button, keep the value) and close on focusout outside the listbox; or replace with a native select. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-3 User control and freedom; WCAG 2.1.1 Keyboard; A11Y-03 Keyboard; H2-4 Consistency and standards; WCAG 2.1.2 No keyboard trap

#### F-0038 · Continue and Confirm show no visible pending state during their delay

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0038 | Continue and Confirm show no visible pending state during their delay | 3 · major | 2 · one component or file | CMP-04 | Response feedback |

**Problem.** Actions taking over a second should acknowledge the press at once. On submit, #continue (1.2 s) and #confirm (1.5 s) only receive aria-busy="true"; styles.css has no [aria-busy] or loading rule, the label does not change and the buttons stay enabled, so nothing on screen changes until navigation or an error. Members on a phone may think the tap did not register and tap again or leave the page.

**Evidence.** Where: /basket.html [submitting] `#continue`; /confirm.html [submitting] `#confirm`; /basket.html [submitting] `.button`. E1, reproduced or measured · app.js:356-367, 418-433; styles.css (no aria-busy selector), probes/75/screenshots/checked.png, probes/75/screenshots/pending-300ms.png, probes/75/screenshots/after-2300ms.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Style .button[aria-busy=true] (label change such as 'Checking…' plus a spinner) and ignore repeat activation while busy. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-10 —; H2-1 Visibility of system status

#### F-0042 · Closed library days are selectable as pick-up days

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0042 | Closed library days are selectable as pick-up days | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Inputs should prevent choices that will be rejected. The tool-page calendar renders all 21 days as enabled buttons; closed days differ only by lacking the 'Open' tag or dot. Reserve accepts any day, and the closed day is rejected only after the member has filled in their details and pressed Confirm on the last step. Members may pick a closed day and only discover it at the end of the flow, after entering their details.

**Evidence.** Where: /tool.html `#calendar .day`; /confirm.html [closed-day-error] `#error-list`. E1, reproduced or measured · app.js:195-208, 256-268, 420-431, .ui-evaluator/runs/20261009-223234-audit-standard/probes/71/screenshots/after-reserve.png, .ui-evaluator/runs/20261009-223234-audit-standard/probes/80/screenshots/result.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Disable or reject closed days at selection, with an inline message on the tool page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: CMP-18 —

#### F-0043 · Closed-day error on confirm gives no way to change the day

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0043 | Closed-day error on confirm gives no way to change the day | 3 · major | 2 · one component or file | CMP-18 | — |

**Problem.** Each error in a summary should lead to the place where it can be fixed. The closed-day errors are plain <li> text without links, and the basket page offers only Remove per tool, not a day change; the per-tool day can only be changed by going back to the tool page and reserving again. Members told to 'choose another day' may not find where to do it and abandon the reservation.

**Evidence.** Where: /confirm.html [closed-day-error] `#error-list li`; /basket.html `#basket-list li`. E1, reproduced or measured · app.js:425-427, 311-316, .ui-evaluator/runs/20261009-223234-audit-standard/probes/92/screenshots/closed-day.png, .ui-evaluator/runs/20261009-223234-audit-standard/probes/85/aria.yml · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Link each closed-day error to the tool page with the tool preselected, or let the day be changed from the basket. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-9 Help users recognize, diagnose and recover from errors; H2-3 User control and freedom

#### F-0044 · Card names are cut to one line, hiding the words that tell similar tools apart

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0044 | Card names are cut to one line, hiding the words that tell similar tools apart | 3 · major | — | H2-6 | Recognition rather than recall |

**Problem.** Names that distinguish items should stay readable. .card__name a forces white-space: nowrap with text-overflow: ellipsis. Below 768 px a card's text column is about 190-200 px, and 'Cordless drill 18 V, combi, two batteries' and '... one battery' differ only at the end; their meta line and badge are also identical, so the two cards may render the same. No title or second line exposes the rest. Members on phones, the main audience, may be unable to tell variants apart from the list and open the wrong tool.

**Evidence.** Where: /index.html `.card__name a` at 375 px; / `role=link[name="Cordless drill 18 V, combi, two batteries"]` at 375 px; / [search-results (drill)] `role=link[name="Cordless drill 18 V, combi, one battery"]` at 375 px. E1, reproduced or measured · styles.css:373-381, 331, 343; app.js:10-11, probes/2/final.png, probes/2/aria.yml, .ui-evaluator/runs/20261009-223234-audit-standard/probes/83/screenshots/drill.png · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Allow the name to wrap (two or three lines, line-clamp at most), keeping the 44 px target via padding. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-2 Match between system and the real world; CW-Q3 Will the user recognize the action as the correct one?

#### F-0049 · Dark-mode success colours differ from the declared tokens and leave the badge low in contrast

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0049 | Dark-mode success colours differ from the declared tokens and leave the badge low in cont… | 3 · major | 1 · one value or token | COL-01 | Token conformance |

**Problem.** Theme values should follow DESIGN.md. In dark mode DESIGN.md sets success #8fd1a8 and selection #24352c; styles.css sets --color-ok #2f7d4a and --color-ok-tint #1d2622 (the card surface). The 'Available from' badge text #2f7d4a on #1d2622 computes to about 3.1:1 for 16 px bold text, and the badge background matches the card so it has no visible fill. Members browsing in dark mode, the declared common case, may struggle to read which tools are available soon.

**Evidence.** Where: /index.html `.badge--ok`. E1, reproduced or measured · styles.css:60-61, 405-408; design.md colors/themes.dark, .ui-evaluator/runs/20261009-223234-audit-standard/probes/87/screenshots/dark.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Set dark --color-ok to #8fd1a8 and --color-ok-tint to #24352c as declared. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 1.4.3 Contrast, minimum; A11Y-11 Text contrast ≥ 4.5

#### F-0059 · Header still shows 'Basket (1)' after the reservation is confirmed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0059 | Header still shows 'Basket (1)' after the reservation is confirmed | 3 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** After a successful confirmation, the page should not suggest that anything is still pending. The 'Reservation confirmed' page shows the reservation clearly, but the header link still reads 'Basket (1)'. A member may wonder whether the drill is still waiting to be reserved and open the basket again, possibly reserving it twice.

**Evidence.** Where: /done.html `role=link[name="Basket (1)"]` at 375 px; /done.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17&ref=FT-4471 `#basket-link` at 375 px; /done.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17&ref=FT-4471 `#basket-link` at 375 px and 3 more. E1, reproduced or measured · probes/23/, probes/30/, probes/51/, probes/43/ · found by 4 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Empty the basket on confirmation. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-5 Error prevention

#### F-0137 · Pick-up calendar accepts days that are not opening sessions

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0137 | Pick-up calendar accepts days that are not opening sessions | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Every day in the calendar is selectable: choosing Monday 12 October (not a session) and pressing Reserve adds the drill to the basket with 'Pick up Monday 12 October'. The closed day is only rejected later, on the confirm page. First-time members may hold a tool for a day the desk is closed or before the tool is back, and only discover it at the session or not at all.

**Evidence.** Where: /tool.html?id=drill-18v-two [day-chosen] `#calendar > button.day` at 375 px; /tool.html?id=sander [added] `role=button[name="Saturday 10 October, open"]` at 375 px; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-12"]` at 375 px and 2 more. E1, reproduced or measured · probes/3/, probes/5/, probes/14/, probes/15/screenshots/after-reserve-monday.png · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Make only session days on or after the tool's available date selectable, or warn when another day is chosen. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0061 · Basket and confirm accept a pick-up session that contradicts the chosen pick-up day

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0061 | Basket and confirm accept a pick-up session that contradicts the chosen pick-up day | 3 · major | 3 · several components or one flow | H2-5 | Error prevention |

**Problem.** The reservation summary should describe one collection time. After choosing Saturday 17 October on the tool page, choosing the Wednesday 28 October session in the basket proceeds without comment, and the confirm page then shows both 'pick up Saturday 17 October' under Tools and 'Wednesday 28 October, 18:00 to 20:00' under Pick-up session. The same contradiction appears after using Change to move to Wednesday 21 October. A member confirming may not know which date the desk will use, and may turn up on the wrong day; the change-session journey always produces this contradiction.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=radio[name="Wednesday 28 October, 18:00 to 20:00"]` at 375 px; /confirm.html?slot=wed-2026-10-28 `region "Your reservation"` at 375 px; /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 `dd:nth-of-type(2)` at 375 px and 2 more. E1, reproduced or measured · probes/12/, probes/21/, probes/35/, probes/37/screenshots/t1200.png · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Keep one collection date, or flag and reconcile a mismatch before Continue. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-4 Consistency and standards

#### F-0063 · 'Reserve this tool' only adds the tool to a basket

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0063 | 'Reserve this tool' only adds the tool to a basket | 3 · major | 1 · one value or token | H2-2 | Match between system and the real world |

**Problem.** A button labelled 'Reserve this tool' should reserve it. Pressing it shows 'Added to your basket'; the reservation is made only after the basket and confirm steps. The label suggests the task is finished at this point. A first-time member may close the page believing the drill is reserved, and find nothing held at the session.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [added] `#reserve` at 375 px. E1, reproduced or measured · probes/3/, .ui-evaluator/runs/20261009-223234-audit-standard/probes/74/screenshots/after-reserve.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Label the action by what it does (adding to the basket) or move the member on to the basket. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-4 Consistency and standards

#### F-0064 · Continue and Confirm reservation show no response for about a second after pressing

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0064 | Continue and Confirm reservation show no response for about a second after pressing | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** A press should be acknowledged within 0.1 s and work over 1 s should show progress. After 'Continue' in the basket the page is unchanged at 0.3 s and 0.7 s and moves to confirm between 0.7 s and 1.2 s; after 'Confirm reservation' nothing changes at 0.1 s and the done page appears within about 2 s. Neither button shows a pressed or busy state. Members on a phone may press again or think the step failed; on Confirm a repeat press could matter.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `#continue` at 375 px; /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 `#confirm` at 375 px; /basket.html?items=drill-18v-two&day=2026-10-17 `#continue` at 375 px and 1 more. E1, reproduced or measured · probes/18/, probes/30/, probes/35/, probes/43/ · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open

#### F-0087 · Keyboard focus on a calendar day can sit hidden under the sticky Reserve bar

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0087 | Keyboard focus on a calendar day can sit hidden under the sticky Reserve bar | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** The focused control should stay visible. At 1280 x 900, focusing Saturday 17 October and pressing Enter leaves the whole 11-17 October row, including the focused and selected day, behind the sticky 'Reserve this tool' bar. Keyboard users, declared in the context, cannot see which day they selected.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-17"]` at 1280 px. E1, reproduced or measured · probes/47/final.png, .ui-evaluator/runs/20261009-223234-audit-standard/probes/74/screenshots/after-enter.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: single location · Priority P1 · Status open · Also: WCAG 2.4.11 Focus not obscured, minimum

#### F-0102 · Tool names truncated at 375 so the two drills look identical

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0102 | Tool names truncated at 375 so the two drills look identical | 3 · major | 1 · one value or token | DES-execution | — |

**Problem.** At 375 tool names are cut with an ellipsis: both drills read 'Cordless drill 18 V, co…', and 'Extension ladder 3 m …', 'Pressure washer, 130 …' lose the spec that distinguishes them. Phones are the main device; members may open the wrong drill or need to open each to tell them apart. The distinguishing detail is exactly what the brief says members use ('two batteries').

**Evidence.** Where: / at 375 px. E1, reproduced or measured · evidence/screens/items-ladder-3m/default/375-light.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Let names wrap on narrow widths, or reallocate the thumbnail's width to the name. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open

#### F-0124 · Tool names truncate with ellipsis at 375, making the two drills identical

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0124 | Tool names truncate with ellipsis at 375, making the two drills identical | 3 · major | 1 · one value or token | DES-execution | — |

**Problem.** At 375 px card titles are cut to one line: both drills show 'Cordless drill 18 V, co...', and 'Extension ladder 3 m ...', 'Pressure washer, 130 ...' lose the distinguishing spec. The distinguishing detail is exactly what members use ('the drill with two batteries'). Phones are the main device. May lead members to open the wrong drill or open both to compare.

**Evidence.** Where: items-ladder-3m at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261009-223234-audit-standard/evidence/screens/items-ladder-3m/default/375-light.png, evidence/screens/items-ladder-3m/default/375-light.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Let titles wrap on narrow widths, or give the title the full card width above the thumbnail. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open

#### F-0030 · Tool names are cut off with an ellipsis at 320 px, so the two cordless drills look identical

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0030 | Tool names are cut off with an ellipsis at 320 px, so the two cordless drills look identi… | 2.67 · major | 1 · one value or token | WCAG 1.4.10 | Reflow |

**Problem.** Expected: at 320 CSS px, content reflows without loss of information (1.4.10). Current: the card title links on / are truncated to one line at 320 px ('Cordless drill 18 V, c...' twice, 'Extension ladder 3 ...', 'Pressure washer, 13...'). The words that tell the two drills apart (two batteries / one battery) are not visible. The scripted check reported horizontal overflow on the same cards; the truncation is a separate loss of content. Members on phones, the main device, and members who zoom cannot see which drill they are opening, and the primary user's own words are 'the drill with two batteries'.

**Evidence.** Where: /?items=ladder-3m `#results .card h2 a` at 320 px. E1, reproduced or measured · evidence/screens/items-ladder-3m/default/320-light.png, .ui-evaluator/runs/20261009-223234-audit-standard/evidence/screens/items-ladder-3m/default/320-light.png, .ui-evaluator/runs/20261009-223234-audit-standard/probes/82/screenshots/index-375-full.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Let card titles wrap (remove white-space: nowrap and text-overflow: ellipsis; add min-width: 0 on the card body). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: A11Y-07 Reflow at 320 CSS px without two-dimensional scrolling

#### F-0037 · A search with no matches leaves the previous results on screen

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0037 | A search with no matches leaves the previous results on screen | 2.67 · major | 2 · one component or file | CMP-05 | Data states exist |

**Problem.** A search that matches nothing should say so and offer a way back. search() only re-renders and updates #results-status when the filtered list is non-empty; with zero matches it does nothing, so the earlier cards and the earlier 'N tools found' status remain, and no empty state exists in the markup. A member searching for a tool the library does not hold may read the unchanged list as matching results and not learn the tool is unavailable.

**Evidence.** Where: /index.html [search-no-results] `#results`; /?items=ladder-3m [no-results] `region "Tools" > status` at 375 px; /?items=ladder-3m [no-results] `#results` at 375 px and 1 more. E1, reproduced or measured · app.js:158-164, probes/36/, probes/33/, probes/6/ · found by 4 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Always render: clear the list, show a 'No tools match' message with a clear-filters action, and update the status text. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-14 —; H2-1 Visibility of system status; H2-9 Help users recognize, diagnose and recover from errors; WCAG 4.1.3 Status messages

#### F-0039 · Repeat Confirm presses allocate extra reservation numbers

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0039 | Repeat Confirm presses allocate extra reservation numbers | 2.67 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A submit should create one reservation however often it is pressed while pending. The confirm submit handler pushes a new reference (FT-4471 + refs.length) into sessionStorage before its 1.5 s timeout, with no guard against a second submit; each extra press in that window adds another reference, and done.html then shows 'Reservation numbers FT-4471 and FT-4472' for the same tools and session. A member who presses twice may leave with two reservation numbers for one booking and not know which to quote at the desk.

**Evidence.** Where: /confirm.html [submitting] `#confirm-form`; /done.html `#c-ref`. E1, reproduced or measured · app.js:413-419, 442-445, .ui-evaluator/runs/20261009-223234-audit-standard/probes/90/screenshots/done-after-double.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Set an in-flight flag (or disable the button) on first submit and return early on repeats. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: CMP-04 Response feedback

#### F-0050 · Membership and phone fields reject common ways of writing valid values

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0050 | Membership and phone fields reject common ways of writing valid values | 2.67 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Validation should accept reasonable variants and normalise them. The membership check /^FT-\d{5}$/ rejects lower-case 'ft-01234' and a missing hyphen; the phone check /^0\d{4}\s?\d{6}$/ rejects '+44 7700 900123', '07700 900 123' and hyphens. Values are only trimmed, not normalised. Members typing their number as printed or as stored on their phone may be told it is wrong and need several attempts.

**Evidence.** Where: /confirm.html [validation-error] `#member`; /confirm.html [validation-error] `#phone`; /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 [errors] `#member` at 375 px and 5 more. E1, reproduced or measured · app.js:386-390, .ui-evaluator/runs/20261009-223234-audit-standard/probes/88/screenshots/confirm-variant-errors.png, probes/26/, probes/40/final.png · found by 4 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Upper-case and strip spaces/hyphens before checking; accept +44 and convert to 0. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-18 —; H2-9 Help users recognize, diagnose and recover from errors; WCAG 3.3.3 Error suggestion; H2-7 Flexibility and efficiency of use

#### F-0144 · Pick-up sessions are listed latest date first

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0144 | Pick-up sessions are listed latest date first | 2.67 · major | 1 · one value or token | DES-execution | — |

**Problem.** The basket lists sessions from Wednesday 28 October down to Saturday 10 October, the reverse of calendar order, at every width. The odd grid implies the first session is special and makes dates hard to scan; reverse order runs against how people read a calendar.

**Evidence.** Where: /basket.html at 1280 px. E1, reproduced or measured · evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, .ui-evaluator/runs/20261009-223234-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, .ui-evaluator/runs/20261009-223234-audit-standard/probes/96/screenshots/v-mon-basket.png, .ui-evaluator/runs/20261009-223234-audit-standard/probes/96/aria.yml · found by 2 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Choose a session layout that keeps every option the same shape at each width, in date order. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-4 Consistency and standards

#### F-0109 · No-results state shows the full list and no message

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0109 | No-results state shows the full list and no message | 2.67 · major | 2 · one component or file | DES-execution | — |

**Problem.** The no-results capture has 'sewing machine' in the search field but shows all ten tools with no empty-state message. Members may believe the listed tools match their search; no designed empty state exists to point them to the desk or other categories.

**Evidence.** Where: / [no-results] at 768 px. E1, reproduced or measured · evidence/screens/items-ladder-3m/no-results/768-light.png, probes/67/aria.yml, probes/67/screenshots/after-search.png, probes/69/screenshots/drill.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Design the empty state for a search with no matches. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P1 · Status open

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
| F-0045 | Results grid's 330 px column minimum is wider than the content area at 320 px | 2.33 · minor | 1 · one value or token | WCAG 1.4.10 | Reflow | E1 | open |
| F-0052 | The three-tool limit stated on the find page is not enforced when reserving | 2.33 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0069 | On phones, search and the date filter sit below the full tool list | 2.33 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0008 | Touch-primary controls closer than 8 px: "Saturday 17 October, open" and "Reserve this to… | 2 · minor (rule) | 2 · one component or file | CMP-06 | Touch-primary targets | E1 | open |
| F-0019 | Body text closer than 16 px to the viewport edge: "Cleaning · deposit £30" | 2 · minor (rule) | 1 · one value or token | LAY-05 | Edge margin | E1 | open |
| F-0032 | Tool-card and basket-item headings sit at the same level as the 'Tools' section heading t… | 2 · minor | 2 · one component or file | A11Y-26 | — | E1 | open |
| F-0033 | 'Reserve this tool' action bar and the 'Added to your basket' status sit outside every la… | 2 · minor | 2 · one component or file | A11Y-26 | — | E1 | open |
| F-0135 | Fixed Reserve bar covers the footer's desk phone number at the end of the tool page | 2 · minor | 1 · one value or token | WCAG 2.4.11 | Focus not obscured, minimum | E1 | open |
| F-0054 | On phones the search field sits below the whole tool catalogue | 2 · minor | 2 · one component or file | CW-Q2 | Is the action visible? | E1 | open |
| F-0056 | Sticky 'Reserve this tool' bar covers the pick-up day instruction on first view | 2 · minor | 2 · one component or file | CW-Q1 | Does the effect of the action match the user’s goal? | E1 | open |
| F-0065 | Change from confirm returns to the basket with the chosen session cleared | 2 · minor | 1 · one value or token | H2-6 | Recognition rather than recall | E1 | open |
| F-0066 | Details typed on the confirm page are lost after using Change | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0071 | Date filter hint says 'on or after this day' but the filter shows tools available by that… | 2 · minor | 1 · one value or token | H2-2 | Match between system and the real world | E1 | open |
| F-0134 | On phones the fixed Reserve bar covers the footer's second line at the end of the tool pa… | 2 · minor | 1 · one value or token | H2-6 | Recognition rather than recall | E1 | open |
| F-0077 | On phones, session days are marked only by a small dot that needs a written explanation | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0085 | Remove in the basket takes effect at once with no undo | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0089 | The date filter sits behind an unlabelled icon button | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0095 | Each calendar day is a separate Tab stop | 2 · minor | 2 · one component or file | H2-7 | Flexibility and efficiency of use | E1 | open |
| F-0096 | Loan length button is announced only by its value | 2 · minor | 1 · one value or token | H2-6 | Recognition rather than recall | E1 | open |
| F-0100 | Done page exposes the tool name twice to assistive technology | 2 · minor | 1 · one value or token | H2-8 | Aesthetic and minimalist design | E1 | open |
| F-0103 | Search and filters fall below the full tool list at 375 | 2 · minor | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0104 | Sticky reserve bar cuts across the calendar and sits outside the content edge | 2 · minor | 2 · one component or file | DES-execution | — | E1 | open |
| F-0107 | Dark theme inverts availability chip emphasis | 2 · minor | 1 · one value or token | DES-coherence | — | E1 | open |
| F-0119 | Done page gives no weight to the reservation number and leaves the viewport bare | 2 · minor | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0125 | Search field moves below all ten cards on phones | 2 · minor | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0126 | Basket session cards: latest-first order and one oversized card above five cramped ones | 2 · minor | 1 · one value or token | DES-execution | — | E1 | open |
| F-0128 | Dark theme drops the chip background on green availability badges only | 2 · minor | 1 · one value or token | DES-coherence | — | E1 | open |
| F-0143 | Basket session grid leaves one full-width row above five squeezed cards at 1280 | 1.67 · minor | 1 · one value or token | DES-execution | — | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0101 | Every tool card shows the same wrench tile instead of the tool | 1.33 · cosmetic | 3 · several components or one flow | DES-appeal | — | E1 | open |
| F-0122 | Every tool card shows the same wrench glyph as its thumbnail | 1.33 · cosmetic | 3 · several components or one flow | SLP-58 | — | E1 | open |
| F-0022 | Cramped padding: "Pressure washer, 130 bar Cleaning · depo" | 1 · cosmetic (rule) | 2 · one component or file | LAY-04 | No cramped padding | E1 | open |
| F-0098 | Stale 'Choose a pick-up session' error stays after the basket is emptied | 1 · cosmetic | 1 · one value or token | H2-9 | Help users recognize, diagnose and recover from errors | E1 | open |
| F-0105 | Details list uses two different label column widths | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0139 | Filter labels 'Available from' and 'Category' are not aligned | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0110 | Wide layouts on confirm and done leave the right half empty | 1 · cosmetic | 2 · one component or file | DES-appeal | — | E1 | open |
| F-0111 | No identity beyond the name in bold body text | 1 · cosmetic | 3 · several components or one flow | DES-specificity | — | E1 | open |
| F-0112 | Navigation items wrap to two lines at 375 | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0113 | Membership number example breaks across lines in error text | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0141 | Filter Category select is unthemed while Loan length select is themed | 1 · cosmetic | 2 · one component or file | DES-coherence | — | E1 | open |
| F-0142 | Filter labels 'Available from' and 'Category' are not aligned | 1 · cosmetic | 1 · one value or token | DES-coherence | — | E1 | open |
| F-0123 | No signature or identity beyond the name in bold text | 1 · cosmetic | 3 · several components or one flow | SLP-64 | — | E1 | open |
| F-0127 | Tool details table uses two different label-column widths | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0145 | Footer does not reach the bottom of short pages at 1280 | 1 · cosmetic | 1 · one value or token | DES-appeal | — | E1 | open |
| F-0146 | Confirm form and done next-steps leave the right side of the container empty | 1 · cosmetic | 2 · one component or file | DES-appeal | — | E1 | open |
| F-0130 | Masthead navigation items wrap to two lines at 375 | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |

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

The raters did not diverge on any finding (spread < 2 everywhere). Open questions for members and the desk:

- Does the green/grey colour of availability badges mean anything the date does not (verifier needs_human on F-0029)?
- Do members on phones mostly scroll the ten cards or search? This decides how much the search placement matters (one rater lowered it for that reason).
- Do members understand "pick-up day" and "pick-up session" as the same thing?

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | not_run | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0032, F-0096, F-0100 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0024, F-0028, F-0054 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | not_run | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | not_run | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001, F-0002, F-0049 |
| 1.4.4 | AA | Resize text | scripted | fail | F-0010, F-0016 |
| 1.4.5 | AA | Images of text | agent-judged | not_run | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0013, F-0030, F-0045 |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | fail | F-0009, F-0015 |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_run | — |
| 2.1.1 | A | Keyboard | scripted | fail | F-0026, F-0027, F-0131, F-0036 |
| 2.1.2 | A | No keyboard trap | scripted | fail | F-0036 |
| 2.1.4 | A | Character key shortcuts | agent-judged | not_run | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0040 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | not_run | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | agent-judged | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0024, F-0028, F-0054 |
| 2.4.4 | A | Link purpose in context | agent-judged | not_run | — |
| 2.4.5 | AA | Multiple ways | agent-judged | not_run | — |
| 2.4.6 | AA | Headings and labels | agent-judged | not_run | — |
| 2.4.7 | AA | Focus visible | scripted | pass | — |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | fail | F-0025, F-0048, F-0135, F-0076, F-0134, F-0087 |
| 2.5.1 | A | Pointer gestures | agent-judged | not_run | — |
| 2.5.2 | A | Pointer cancellation | scripted | pass | — |
| 2.5.3 | A | Label in name | agent-judged | not_run | — |
| 2.5.4 | A | Motion actuation | agent-judged | not_run | — |
| 2.5.7 | AA | Dragging movements | agent-judged | not_run | — |
| 2.5.8 | AA | Target size, minimum | scripted | pass | — |
| 3.1.1 | A | Language of page | scripted | pass | — |
| 3.1.2 | AA | Language of parts | scripted | pass | — |
| 3.2.1 | A | On focus | scripted | pass | — |
| 3.2.2 | A | On input | agent-judged | not_run | — |
| 3.2.3 | AA | Consistent navigation | scripted | pass | — |
| 3.2.4 | AA | Consistent identification | scripted | pass | — |
| 3.2.6 | A | Consistent help | scripted | pass | — |
| 3.3.1 | A | Error identification | scripted | pass | — |
| 3.3.2 | A | Labels or instructions | agent-judged | not_run | — |
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0050 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | not_run | — |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_run | — |
| 4.1.2 | A | Name, role, value | agent-judged | not_run | — |
| 4.1.3 | AA | Status messages | scripted | fail | F-0037 |

Totals by coverage: auto 1 · scripted 22 · agent-judged 23 · needs-human 8; by state: pass 14 · fail 13 · not_run 28. This matrix is not a conformance claim (QUALITY-BAR §8).

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
- Rendered effect of every E0 candidate (needs the verifier). (code)
- Toast duration (about 1.35 s visible) adequacy: needs a probe of how it is perceived; screen-reader announcement path exists via role=status. (code)
- The 'up to three tools at a time' limit: did not add a fourth tool, so the behaviour at the limit is unknown. (he-1)
- Double submit of 'Confirm reservation' during its ~1-2 s delay: not attempted, so whether two reservations can be created is unknown. (he-1)
- Whether a tool returned late is reflected anywhere before confirming ('is it back yet'): no state exposing it was reachable. (he-1)
- inventory.json lists session radio names with a raw id prefix (e.g. 'sat-2026-10-10 Saturday 10 October, ...'); my probes' ARIA snapshots show the names without it, so I could not reproduce it. (he-1)
- Fixed 'Reserve this tool' bar overlapping the Pick-up day heading in the full-page captures (tool/day-chosen 375-light, loan-open 1280-light) may be a full-page screenshot artefact; in live probes it covered only the footer, except for the case recorded as a candidate. (he-1)
- Dark mode, 200% zoom and screen-reader announcements were not judged; left to the accessibility roles. (he-1)
- Double submission of Confirm reservation during the 0.1-2.6 s window with no feedback: not probed to avoid creating duplicate reservations; may create two reservations. (he-2)
- After Back from done.html the confirm page is shown again with name and phone filled (probe 43, after-back.png); whether resubmitting creates a second reservation was not probed (would commit a reservation). (he-2)
- How long the basket hold lasts and what happens when it expires: no expiry could be triggered within the probe time. (he-2)
- Whether inline error messages on confirm are programmatically tied to their fields (aria-describedby); the ARIA snapshot shows only [invalid] on the textboxes, not the description. Needs a screen-reader or DOM-accessibility check. (he-3)
- Actual VoiceOver/TalkBack announcements of the 'Added to your basket' status and of the calendar's aria-pressed change; only the accessibility tree was inspected. (he-3)
- Behaviour at 200% text zoom (as opposed to narrow widths); not probed. (he-3)
- Whether the basket hold expires and what happens then; no expiry was observable within the probes. (he-3)
- Double submission of Confirm reservation and browser Back from done; not probed. (he-3)
- Motion (toast fade, button colour), focus and hover states, listbox behaviour, real scroll behaviour of the sticky action bar. No baseline screenshots, so DES-05 not applicable. (critic-2)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0002, F-0009, F-0010, F-0011, F-0012 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (1 finding(s)); FUN-06 (2 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (5 finding(s)); A11Y-05 (2 finding(s)) ….
3. For L2: USE-05 (4 open P0 finding(s)); USE-06 (37 P1 finding(s) without a recorded decision); DES-02 (0/3 critics judged it specific); DES-03 (2 agreed severe design finding(s) open); DES-04 (0/3 critics: attributes reflected) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (41 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

