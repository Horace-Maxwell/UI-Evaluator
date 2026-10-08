# UI evaluation report: Fernhill Tool Library reservations · run 20261007-234951-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:b8bea345bf (uncommitted changes present) · run opened 2026-10-08T03:49:51.777Z |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Surfaces and modes | find (operate), tool (operate), basket (operate), confirm (operate), done (read) |
| Routes × states | 5 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-08T03:49:07.244Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | 5b8d6c05 5b8d6c05 5b8d6c05 |
| walkthrough-evaluator | 1 | subagent | claude-opus-5-5 | 89c69522 |
| design-critic | 3 | subagent | claude-opus-5-5 | b09d3200 b09d3200 b09d3200 |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 9c73ce02 |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 09a98abb 9b2f091d |
| finding-verifier | 1 | subagent | claude-opus-5-5 | a7836bec |
| severity-rater | 3 | subagent | claude-opus-5-5 | b9c3a3da fd19397a c09566ac |

Coverage: 540 valid capture(s); 51% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (3 finding(s)); FUN-06 (7 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (5 finding(s)); A11Y-05 (2 finding(s)); A11Y-07 (2 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-06 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-05, A11Y-07, A11Y-08, A11Y-09, A11Y-11, A11Y-13, A11Y-15, A11Y-27 |
| G3 Craft floor | fail | TYP-06, COL-01, LAY-01, LAY-03, LAY-04, LAY-05, CMP-03, CMP-04, CMP-05, CMP-06, CPY-04 |
| G4 Deliberateness and anti-slop | fail | SLP-12 |
| G5 Analytical usability | fail | USE-05, USE-06, USE-09 |
| G6 Design quality | fail | DES-01, DES-02, DES-03, DES-04, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- Confirm-page validation: an error summary that takes focus and links to each field, inline messages, `aria-invalid`, entered values kept, and the format shown with an example.
- The done page says what to bring, where to go and what to do if the session no longer suits.
- Nothing is paid online, and the page says so plainly.
- Search and filter result counts and "Added to your basket" are announced through a status region.
- Day buttons have full accessible names and a pressed state, and Remove buttons include the tool name.
- Dark theme is applied on every route, and dates follow en-GB formats throughout.

- One global :focus-visible ring (3px, --color-focus, offset 2px) with no outline:none anywhere, distinct from hover tints
- Motion limited to background-color and opacity at the 120 ms feedback token, both removed under prefers-reduced-motion
- Form errors use aria-invalid, aria-describedby and a focused error summary with links to fields on the confirm page
- Confirm page restates tool, loan length, pick-up day, session and deposit before commit, with 'Nothing is paid online', which answers the persona's deposit question
- Membership number hint 'On your membership card, like FT-01234' matches what the persona holds
- Done page states reservation number, session, deposit and what to bring, plus what to do if they cannot make the session
- Confirm-page validation names the fix with an example, keeps the input, and links each error to its field
- Membership-number field shows its format before entry

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.29 (mean Jaccard over 3 passes); an estimated 4.0 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0024 · Focus order jumps back: "Electric wet tile saw, 180 mm" → "Search tools"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0024 | Focus order jumps back: "Electric wet tile saw, 180 mm" → "Search tools" | 4 · catastrophe (rule) | 2 · one component or file | A11Y-03 | Keyboard |

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

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.1.1 Keyboard; A11Y-25 —

#### F-0142 · Pick-up before the tool's available-from date is never checked

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0142 | Pick-up before the tool's available-from date is never checked | 4 · catastrophe | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A tool available from Sat 17 can be reserved and confirmed for Sat 10 (same as F-0066). Members may build a basket and fill in their details before learning the day is closed, and may complete a reservation for a tool on a day it is still out on loan.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-12"]`; /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 [errors] `#error-list`; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-12"]` at 375 px. E1, reproduced or measured · app.js:195-208, app.js:256-263, app.js:420-431, .ui-evaluator/runs/20261007-234951-audit-standard/probes/18/ · found by 2 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Disable or mark unavailable days (closed, or before the tool's available-from date) in the calendar and validate on Reserve; make any later error link back to the tool's day picker. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 3.3.4 Error prevention for legal, financial and data submissions; CPY-04 Error-message quality; H2-2 Match between system and the real world

#### F-0043 · Expired hold shows 'Something went wrong. Try again.' and every retry fails the same way

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0043 | Expired hold shows 'Something went wrong. Try again.' and every retry fails the same way | 4 · catastrophe | 2 · one component or file | H2-9 | Help users recognize, diagnose and recover from errors |

**Problem.** An error should say what happened and how to recover. When the hold has expired, Continue shows the generic 'Something went wrong. Try again.'; hold_started is never reset, so trying again fails identically for the rest of the browser session (only 'Reserve another tool' on the done page clears it). A member whose hold has run out may be unable to finish the reservation online and may need to call the desk.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `#error-list`. E1, reproduced or measured · app.js:360-364, 94-96, 452-455, probes/v-hold/screenshots/after-continue-2.png, probes/v-hold/screenshots/after-reload-continue.png · found by 1 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Say the hold ran out, offer to hold the items again (resetting hold_started) and keep the chosen session. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: CPY-04 Error-message quality; WCAG 3.3.3 Error suggestion

#### F-0066 · A reservation can be confirmed for a session before the tool is available

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0066 | A reservation can be confirmed for a session before the tool is available | 4 · catastrophe | 2 · one component or file | H2-5 | Error prevention |

**Problem.** The tool's 'Available from' date should limit which pick-up days and sessions can be chosen. The pressure washer is listed 'Available from Sat 17 Oct', yet Saturday 10 October can be chosen as the pick-up day. The basket then offers the 10 and 14 October sessions. Confirming produces 'Reservation confirmed' for 'Saturday 10 October, 10:00 to 13:00', with no warning anywhere. A member may travel to a session for a tool that is still out with another borrower, which is exactly the 'is it back yet' worry returning members have. The confirmation tells them it is arranged.

**Evidence.** Where: /tool.html?id=pressure-washer `.day[data-day="2026-10-10"]` at 375 px; /basket.html?items=pressure-washer&day=2026-10-10 `div.session:nth-of-type(1) > label > input` at 375 px; /done.html `main` at 375 px. E1, reproduced or measured · probes/61/, probes/62/, probes/62/final.png, probes/v10/aria.yml · found by 1 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Offer only days and sessions on or after the tool's available-from date. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: H2-1 Visibility of system status

#### F-0042 · Ten-minute basket hold is enforced with no warning or way to extend it

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0042 | Ten-minute basket hold is enforced with no warning or way to extend it | 3.67 · catastrophe | 3 · several components or one flow | WCAG 2.2.1 | Timing adjustable |

**Problem.** WCAG 2.2.1 requires a time limit to be adjustable, extendable or warned about. app.js holds items for HOLD_MINUTES = 10 from the first Reserve and fails Continue after that; the basket page says only 'Items are held for you while you finish', with no duration, countdown, warning or extension. Members who browse several tools, or who use assistive technology, may exceed the hold without knowing a limit exists.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `main .intro`. E1, reproduced or measured · app.js:7, 94-100, 360, basket.html:33, probes/v-hold/screenshots/basket-start.png, probes/v-hold/screenshots/after-continue-1.png · found by 1 of 10 evaluator(s). Ratings: 3.67 (spread 1; 3, 4, 4).

**Recommendation.** State the hold length, warn before it ends and offer to extend, or renew the hold on activity. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: H2-1 Visibility of system status

#### F-0055 · 'Reserve this tool' only adds to a basket, and nothing in view says the reservation is unfinished or leads on to finish it

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0055 | 'Reserve this tool' only adds to a basket, and nothing in view says the reservation is un… | 3.67 · catastrophe | 2 · one component or file | CW-Q1 | Does the effect of the action match the user’s goal? |

**Problem.** A button labelled with the user's goal should either complete that goal or make clear what remains and offer the next step. On the tool page, 'Reserve this tool' adds the tool to a basket; the only feedback is a toast 'Added to your basket' that disappears within 4 s, the button label stays the same, and the only way on, the header link 'Basket (1)', is scrolled out of view. A first-time member who pressed 'Reserve' has no cue that a session, their details and a confirmation are still required. A member may leave believing the drill is reserved and arrive on Saturday with no reservation.

**Evidence.** Where: /tool.html?id=drill-18v-two [added] `role=button[name="Reserve this tool"]` at 375 px; /tool.html?id=drill-18v-two [added] `#basket-link` at 375 px; /tool.html?id=drill-18v-two&items=ladder-3m [added] `#reserve` at 375 px and 2 more. E1, reproduced or measured · probes/cw-1-full/screenshots/s5-added.png, probes/cw-1-detail/screenshots/added-after-4s.png, evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/added/375-dark.png, probes/16/ · found by 3 of 10 evaluator(s). Ratings: 3.67 (spread 1; 4, 4, 3).

**Recommendation.** Label the action for what it does (for example 'Add to basket'), and after adding show a persistent in-view message with a link to finish the reservation. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: CW-Q2 Is the action visible?; CW-Q4 Will the user understand the feedback?; H2-1 Visibility of system status; H2-2 Match between system and the real world; H2-7 Flexibility and efficiency of use; H2-4 Consistency and standards

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

**Evidence.** Where: /?items=ladder-3m `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 320 px; /?items=ladder-3m [filters-open] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 320 px; /?items=ladder-3m [no-results] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 320 px and 2 more. E1, reproduced or measured · evidence/crops/layout/4b4ac660ea.png, evidence/crops/layout/5985fa3bb2.png, evidence/crops/layout/e7d97fe9bb.png, evidence/screens/items-ladder-3m/default/375-dark.png. Ratings: rule: 3.

**Recommendation.** Let card names wrap to two or three lines at narrow widths. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; H2-2 Match between system and the real world

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

#### F-0028 · Pick-up session options are shown in reverse date order while keyboard and screen-reader order runs forward

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0028 | Pick-up session options are shown in reverse date order while keyboard and screen-reader … | 3 · major | 1 · one value or token | WCAG 1.3.2 | Meaningful sequence |

**Problem.** Under 1.3.2, the reading order that assistive technology exposes should match the visual order when order affects meaning. On the basket page the DOM and ARIA order of the session radios is chronological, from Saturday 10 October to Wednesday 28 October. On screen the order is reversed at every width. At 320 px Wednesday 28 October is at the top and Saturday 10 October at the bottom. At 1280 px Wednesday 28 October spans the first row, then the second row runs right to left from Saturday 24 to Saturday 10. Arrow keys inside the radio group therefore move visually backwards, and a screen reader reads the dates in the opposite order to what sighted users see. Members choosing a session may be told 'next' while the highlight moves up or left. A sighted keyboard user or a screen-magnifier user may pick the wrong session, and a volunteer helping a screen-reader user may describe a different first option than the one announced.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 320 px; /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 1280 px; /basket.html?items=drill-18v-two&day=2026-10-17 `#sessions` and 1 more. E1, reproduced or measured · evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/320-light.png, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/1280-light.yml, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/errors/1280-dark-forced-colors.png · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Remove the visual reversal (row-reverse, wrap-reverse or order) so the sessions display chronologically in DOM order. If newest-first is wanted, reorder the DOM instead. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.3 Focus order; A11Y-03 Keyboard; H2-4 Consistency and standards

#### F-0029 · Pick-up day chosen on the tool page is not pre-selected among the basket's sessions

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0029 | Pick-up day chosen on the tool page is not pre-selected among the basket's sessions | 3 · major | 2 · one component or file | H2-6 | Recognition rather than recall |

**Problem.** Members should not have to remember a choice they have just made. On the tool page the member picks a pick-up day (for example Saturday 17 October, which is a session), and the basket line repeats 'Pick up Saturday 17 October'. Yet the 'Pick-up session' radios start empty, and pressing Continue gives the error 'Choose a pick-up session'. The same date has to be found and chosen again from six options listed in reverse order. 3.3.7 is met narrowly, because the earlier answer is available to select, but the member still has to carry the choice across screens. Older members and those reserving while doing something else may meet an error on a step they believe they have finished, and may pick a different session from the day they chose.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 [errors] `role=group[name="Pick-up session"]` at 1280 px; /basket.html?items=drill-18v-two&day=2026-10-17 `group "Pick-up session"` at 375 px. E1, reproduced or measured · evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/1280-light.yml, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/375-dark.png, probes/66/ · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Pre-select the session that matches the chosen pick-up day and let the member change it. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-8 Aesthetic and minimalist design; WCAG 3.3.7 Redundant entry; H2-7 Flexibility and efficiency of use

#### F-0030 · Search with no matches shows the full tool list and announces nothing

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0030 | Search with no matches shows the full tool list and announces nothing | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** After a search, members should learn what happened. Searching 'ladder' writes '1 tool found' into the status region and filters the list, which works. Searching 'sewing machine' leaves the status region empty and the list showing all ten tools, with no 'no tools found' message on screen or in the live region (probe 45). Screen-reader users hear nothing, and sighted users see what looks like matching results. Members searching for something the library does not stock may believe the listed tools are matches, or may keep searching without knowing the search failed.

**Evidence.** Where: /?items=ladder-3m [no-results] `#results` at 1280 px; /?items=ladder-3m [no-results] `#results` at 375 px; /?items=ladder-3m [no-results] `#results` at 375 px and 2 more. E1, reproduced or measured · probes/45/, probes/43/, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/probes/1/aria.yml, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/probes/2/aria.yml · found by 5 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** On zero matches, show and announce 'No tools match "…"' in the existing status region, with a way to clear the search. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-9 Help users recognize, diagnose and recover from errors; A11Y-15 Status messages from async actions are exposed through `role=status…; CMP-05 Data states exist; WCAG 4.1.3 Status messages

#### F-0033 · Dark-theme success token diverges from the declared value, giving the 'Available from' badge low text contrast

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0033 | Dark-theme success token diverges from the declared value, giving the 'Available from' ba… | 3 · major | 1 · one value or token | COL-01 | Token conformance |

**Problem.** design.md declares dark success #8fd1a8 and selection #24352c. styles.css sets dark --color-ok to #2f7d4a and --color-ok-tint to #1d2622 (the card surface). The .badge--ok text is therefore #2f7d4a on #1d2622, about 3.1:1 by the WCAG formula, for 16 px bold text, which needs 4.5:1; the badge background also equals the card surface, so the badge has no fill. Members browsing in dark mode on a phone (the declared main use scene) may not be able to read which tools are available soon.

**Evidence.** Where: /?items=ladder-3m `.badge--ok`. E1, reproduced or measured · styles.css:60-61, styles.css:405-408, evidence/screens/items-ladder-3m/default/1280-dark.png (sampled at x 230-435, y 476-494) · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Set dark --color-ok to the declared success (#8fd1a8) and --color-ok-tint to the declared selection (#24352c). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: A11Y-11 Text contrast ≥ 4.5; WCAG 1.4.3 Contrast, minimum

#### F-0035 · Loan-length listbox captures Tab, cycling focus among its options

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0035 | Loan-length listbox captures Tab, cycling focus among its options | 3 · major | 2 · one component or file | A11Y-03 | Keyboard |

**Problem.** Tab should leave a listbox. The keydown handler on #loan-list treats Tab like ArrowDown with preventDefault, so Tab (and Shift+Tab, which is not distinguished) moves to the next option forever; the only exits are choosing an option with Enter/Space or clicking. Keyboard users who open the list may not be able to move on to the pick-up day without changing or re-choosing the loan length, and may not realise how to leave.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#loan-list`. E1, reproduced or measured · app.js:238-251, app.js:224-251, probes/v13/screenshots/after-tabs.png, probes/v13/screenshots/after-enter.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Let Tab close the list and move on (no preventDefault); or replace the custom listbox with a native select or radio group. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 2.1.2 No keyboard trap; H2-3 User control and freedom

#### F-0140 · Calendar accepts closed days without warning

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0140 | Calendar accepts closed days without warning | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** All 21 day buttons can be chosen and Reserve accepts a closed day such as Monday 12 October (same as F-0065). Members may build a basket and fill in their details before learning the day is closed, and may complete a reservation for a tool on a day it is still out on loan.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-12"]`; /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 [errors] `#error-list`; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-12"]` at 375 px. E1, reproduced or measured · app.js:195-208, app.js:256-263, app.js:420-431, .ui-evaluator/runs/20261007-234951-audit-standard/probes/18/ · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Disable or mark unavailable days (closed, or before the tool's available-from date) in the calendar and validate on Reserve; make any later error link back to the tool's day picker. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 3.3.4 Error prevention for legal, financial and data submissions; CPY-04 Error-message quality; H2-2 Match between system and the real world

#### F-0141 · Closed-day error appears only at final confirm, with no route back to the day

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0141 | Closed-day error appears only at final confirm, with no route back to the day | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** After the details are filled in, Confirm shows 'The library is closed on Monday 12 October' as plain text with no link to change the day. Members may build a basket and fill in their details before learning the day is closed, and may complete a reservation for a tool on a day it is still out on loan.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-12"]`; /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 [errors] `#error-list`; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-12"]` at 375 px. E1, reproduced or measured · app.js:195-208, app.js:256-263, app.js:420-431, .ui-evaluator/runs/20261007-234951-audit-standard/probes/18/ · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Disable or mark unavailable days (closed, or before the tool's available-from date) in the calendar and validate on Reserve; make any later error link back to the tool's day picker. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 3.3.4 Error prevention for legal, financial and data submissions; CPY-04 Error-message quality; H2-2 Match between system and the real world

#### F-0038 · Each tool's pick-up day and the basket's pick-up session are stored separately and never reconciled

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0038 | Each tool's pick-up day and the basket's pick-up session are stored separately and never … | 3 · major | 3 · several components or one flow | H2-4 | Consistency and standards |

**Problem.** The flow asks for a pick-up day per tool on the tool page and again for one pick-up session on the basket page. The two are stored independently (basket item.day, URL slot) and nothing checks that they agree, so the confirm summary can say 'pick up Saturday 10 October' for a tool next to 'Pick-up session: Wednesday 28 October'. Members may confirm a reservation with two different collection dates and turn up on the wrong one.

**Evidence.** Where: /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 `#summary-tools`; /basket.html?items=drill-18v-two&day=2026-10-17 `#sessions`; /tool.html [day-chosen] `#calendar` at 375 px and 6 more. E1, reproduced or measured · app.js:267, 329-331, 366, 374-381, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/probes/30/screenshots/at-3500ms.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/probes/10/screenshots/basket-after-monday.png, .ui-evaluator/runs/20261007-234951-audit-standard/evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/375-dark.yml · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Choose the collection point once (session), or pre-select and constrain the basket session from the tools' chosen days. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: overall structure · Priority P1 · Status open · Also: H2-5 Error prevention; H2-2 Match between system and the real world; H2-6 Recognition rather than recall; H2-1 Visibility of system status

#### F-0047 · Tool names on result cards are cut to one line, hiding the words that tell similar tools apart

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0047 | Tool names on result cards are cut to one line, hiding the words that tell similar tools … | 3 · major | 1 · one value or token | H2-6 | Recognition rather than recall |

**Problem.** Names that distinguish items should not be truncated. .card__name a sets white-space: nowrap and text-overflow: ellipsis with no full-text alternative; at phone widths the name box is about 200 px, so 'Cordless drill 18 V, combi, two batteries' and '... one battery' are likely to both end in an ellipsis before the distinguishing words. Members comparing tools on a phone may not tell the two drills (or the two tile cutters) apart without opening each one.

**Evidence.** Where: /?items=ladder-3m `.card__name a` at 375 px; / `#results li` at 375 px; /?items=ladder-3m `h2.card__name > a` at 375 px. E1, reproduced or measured · styles.css:341-345, 373-381, probes/cw-1-full/screenshots/s2-results.png, evidence/aria/items-ladder-3m/default/375-light.yml, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/evidence/screens/items-ladder-3m/default/375-dark.png · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Let names wrap (remove nowrap/ellipsis), clamping to two or three lines at most if needed. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.10 Reflow; CW-Q3 Will the user recognize the action as the correct one?

#### F-0061 · Basket asks for a pick-up session after the pick-up day was already chosen

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0061 | Basket asks for a pick-up session after the pick-up day was already chosen | 3 · major | 2 · one component or file | CW-Q1 | Does the effect of the action match the user’s goal? |

**Problem.** Users should not be asked the same thing twice. The basket line already says 'Pick up Saturday 17 October', yet 'Pick-up session' radios start unselected and Continue fails with 'Choose a pick-up session' until one is chosen. Members may press Continue, hit an error and be unsure how the 'session' differs from the 'day' they chose.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=radiogroup` at 375 px. E1, reproduced or measured · probes/cw-1-full/screenshots/s6-basket.png, probes/cw-1-detail/screenshots/basket-continue-no-session.png, probes/v01/screenshots/basket.png, probes/v02/screenshots/continue-no-session.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Preselect the session that matches the chosen pick-up day, or ask only once. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-7 Flexibility and efficiency of use

#### F-0062 · Pick-up session list runs latest first and includes sessions before the chosen pick-up day

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0062 | Pick-up session list runs latest first and includes sessions before the chosen pick-up day | 3 · major | 2 · one component or file | CW-Q3 | Will the user recognize the action as the correct one? |

**Problem.** Date choices are expected in chronological order and limited to valid options. The list reads Wed 28, Sat 24, Wed 21, Sat 17, Wed 14, Sat 10 October, although the tool's pick-up day is Saturday 17; the first 'Saturday' a scanning user meets is the 24th. Members may pick the wrong Saturday, or a session before their pick-up day, and not notice until the confirm page or the desk.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=radio[name="Wednesday 28 October, 18:00 to 20:00"]` at 375 px. E1, reproduced or measured · probes/cw-1-full/screenshots/s6-basket.png, probes/v01/screenshots/basket.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** List sessions earliest first, from the pick-up day onwards. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-5 Error prevention

#### F-0065 · Calendar accepts a pick-up day when the library is closed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0065 | Calendar accepts a pick-up day when the library is closed | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Members do not know which days are sessions, so the pick-up day control should prevent or flag days when the desk is shut. On the tool page any of the 21 days can be chosen. Choosing Monday 12 October (not marked open) and pressing 'Reserve this tool' adds the drill, and the basket then reads 'Pick up Monday 12 October'. No warning appears at any point. A first-time member planning a weekend job may pick a convenient-looking weekday, believe the tool will be ready that day, and only learn at the session step, or at the door, that the library is closed.

**Evidence.** Where: /tool.html?id=drill-18v-two [day-chosen] `#calendar > button.day:nth-of-type(4)` at 375 px; /basket.html `region "Tools" paragraph` at 375 px; /tool.html [day-chosen] `.day[data-day="2026-10-12"]` at 375 px. E1, reproduced or measured · probes/16/, probes/16/screenshots/reserved-twice.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/probes/10/screenshots/reserve-monday.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/probes/10/screenshots/basket-after-monday.png · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Restrict selectable days to open sessions, or explain the consequence when a closed day is chosen. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-2 Match between system and the real world

#### F-0068 · Confirm page shows two different collection dates after the session is changed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0068 | Confirm page shows two different collection dates after the session is changed | 3 · major | 3 · several components or one flow | H2-1 | Visibility of system status |

**Problem.** A check-and-confirm summary should state one collection date. After Change > Wednesday 21 October > Continue, the summary's Tools row still reads 'one week, pick up Saturday 17 October' while the Pick-up session row reads 'Wednesday 21 October, 18:00 to 20:00'. The same contradiction appears whenever the session differs from the calendar day. A member who has just changed plans cannot tell from the page they are meant to check which day the tool will be waiting. They may confirm unsure or turn up on the wrong day.

**Evidence.** Where: /confirm.html?slot=wed-2026-10-21 [default (after Change)] `region "Your reservation"` at 375 px. E1, reproduced or measured · probes/31/, probes/31/final.png, probes/50/, probes/v02/screenshots/confirm-after-change.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: single location · Priority P1 · Status open · Also: H2-4 Consistency and standards

#### F-0077 · Pick-up sessions are listed latest first

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0077 | Pick-up sessions are listed latest first | 3 · major | 1 · one value or token | H2-2 | Match between system and the real world |

**Problem.** Dates are expected in calendar order. The basket shows sessions from Wednesday 28 October at the top down to Saturday 10 October at the bottom, while the accessibility tree lists them earliest first. A member scanning for 'Saturday morning' may take the first Saturday they see (24 October) as the next one. Screen-reader and sighted users also meet different orders.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `group "Pick-up session"` at 375 px. E1, reproduced or measured · evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/375-dark.png, probes/55/aria.yml, probes/v01/screenshots/basket.png, probes/v01/aria.yml · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: single location · Priority P1 · Status open · Also: H2-4 Consistency and standards

#### F-0092 · Sessions are shown latest first, the reverse of the calendar and of reading order

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0092 | Sessions are shown latest first, the reverse of the calendar and of reading order | 3 · major | 1 · one value or token | H2-2 | Match between system and the real world |

**Problem.** The basket's session list is shown visually with Wednesday 28 October first and Saturday 10 last, at 375 px and at 1280 px; the accessible order runs Saturday 10 to Wednesday 28, and the tool-page calendar runs forward in time. A member scanning for 'this Saturday' expects the nearest session first. Slower scanning and a real chance of picking the wrong Saturday; keyboard and screen-reader order differs from what sighted users see.

**Evidence.** Where: /basket.html `div.session` at 375 px; /basket.html `div.session` at 1280 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/375-light.yml, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, probes/v01/aria.yml · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: single location · Priority P1 · Status open · Also: H2-4 Consistency and standards

#### F-0104 · The fixed 'Reserve this tool' bar covers focused controls and the open loan-length list on phones

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0104 | The fixed 'Reserve this tool' bar covers focused controls and the open loan-length list o… | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** Keyboard focus and open option lists should stay visible. At 375 x 812 the tool page keeps a 'Reserve this tool' bar fixed at the bottom of the viewport. When the Loan length button gets focus, most of it sits behind the bar. When the list is opened with Enter, the 'Two weeks' option is completely hidden behind the bar, and it is selected by ArrowDown without being visible. Keyboard members, and members with large text where the bar takes up more of the screen, may not see which control or option they are on. They may then choose a loan length they cannot see.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#loan-list` at 375 px; /tool.html?id=drill-18v-two&items=ladder-3m `#reserve` at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261007-234951-audit-standard/probes/44/, probes/v08/screenshots/loan-button-focused.png, probes/v08/screenshots/loan-open.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Reserve space for the fixed bar (scroll-padding) or make it non-fixed at narrow widths. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 2.4.11 Focus not obscured, minimum

#### F-0143 · Sessions listed latest first

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0143 | Sessions listed latest first | 3 · major | 1 · one value or token | DES-hierarchy | — |

**Problem.** The basket shows Wed 28 first and Sat 10 last (duplicate of F-0028/F-0077/F-0092). The full-width first card implies it is recommended or different when it is just the latest date; members choosing 'Saturday morning' may have to read all six; the wraps look unfinished.

**Evidence.** Where: /basket.html at 1280 px. E1, reproduced or measured · evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, <tmp> · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Decide one order and one layout for the session list in which all sessions have equal weight and the chosen pick-up day is easy to find. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: DES-execution —

#### F-0145 · Card titles truncated on phones

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0145 | Card titles truncated on phones | 3 · major | 1 · one value or token | DES-hierarchy | — |

**Problem.** Both drill names render as 'Cordless drill 18 V, co...' (duplicate of F-0047/F-0122). On the main device, members may not tell 'two batteries' from 'one battery', a distinction their own words use, and may not find search at all.

**Evidence.** Where: /?items=ladder-3m at 375 px; /?items=ladder-3m at 375 px. E1, reproduced or measured · evidence/screens/items-ladder-3m/default/375-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/evidence/screens/items-ladder-3m/default/375-light.png, <tmp> · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Decide the phone layout from the members' task: full tool names visible, search reachable at the top, nav that fits. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: FUN-06 No clipped or overlapping text at rest at any matrix width

#### F-0121 · Dark-mode 'Available from' pill drops its tint and goes dim

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0121 | Dark-mode 'Available from' pill drops its tint and goes dim | 3 · major | 1 · one value or token | COL-14 | — |

**Problem.** In dark, the green 'Available from Sat 10 Oct' pill loses its tinted background and its text uses a mid-green (#2f7d4a on #1d2622 per detectors) rather than the light dark-theme green used by the Search button, while the grey 'later' pill keeps its background. The availability signal, the find list's most product-specific element, becomes the weakest text on the card in the theme many members use. Members browsing in dark mode, many of them older, may struggle to read which tools are collectable now.

**Evidence.** Where: /?items=ladder-3m at 1280 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/evidence/screens/items-ladder-3m/default/1280-dark.png, items-ladder-3m/default/1280-dark.png, evidence/screens/items-ladder-3m/default/1280-dark.png · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Map the badge to the dark theme's selection and success roles as the light theme does. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: DES-coherence —; A11Y-11 Text contrast ≥ 4.5

#### F-0122 · Tool names truncated with an ellipsis on phones

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0122 | Tool names truncated with an ellipsis on phones | 3 · major | 1 · one value or token | DES-execution | — |

**Problem.** At 375 and 320 card titles are cut to one line ('Cordless drill 18 V, co...' twice, 'Extension ladder 3 m ...'), so the two drills, which differ only by 'two batteries' vs 'one battery', become indistinguishable. Tool names are the content members choose by. Members on phones may open the wrong drill or have to open each card to read its name.

**Evidence.** Where: /?items=ladder-3m at 375 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/evidence/screens/items-ladder-3m/default/375-light.png, items-ladder-3m/default/375-light.png, probes/v06/screenshots/find-full.png, probes/v07/screenshots/find-320-viewport.png · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Let tool names wrap; decide the card layout at narrow widths around the full name. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: FUN-06 No clipped or overlapping text at rest at any matrix width

#### F-0048 · Fixed action bar on the tool page is not offset, so content and focused days can sit beneath it

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0048 | Fixed action bar on the tool page is not offset, so content and focused days can sit bene… | 2.67 · major | 2 · one component or file | A11Y-05 | Focus not obscured |

**Problem.** Content under a fixed bar needs matching bottom padding and scroll-padding. The .actionbar is fixed and 72 px high, but .page--bar reduces bottom padding to 8 px and no scroll-padding-bottom is set, so the end of the page (footer phone number) stays under the bar, and a day button (56 px) brought into view by Tab can be entirely covered. Keyboard users may lose sight of the focused pick-up day, and phone users cannot read the last lines of the page.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m `.actionbar`. E1, reproduced or measured · styles.css:44, 204-206, 758-771, probes/v09/screenshots/tool-bottom.png, probes/v13/screenshots/reserve-no-day-focus.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Give the body bottom padding of var(--actionbar) on the tool page and set html { scroll-padding-bottom: calc(var(--actionbar) + var(--space-4)) }. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 2.4.11 Focus not obscured, minimum

#### F-0057 · Search results update above the viewport with no visible change near the Search button

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0057 | Search results update above the viewport with no visible change near the Search button | 2.67 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** A search should show its result where the user is looking. After tapping Search at 375 px the page stays scrolled at the field; the filtered list changes above, out of view, and no count or message appears near the button. Members may think the search did nothing and tap again or give up on search.

**Evidence.** Where: / [after-search] `role=button[name="Search"]` at 375 px; /?items=ladder-3m [filters-open] `region "Search"` at 375 px; /?items=ladder-3m [filters-open] `#results` at 375 px. E1, reproduced or measured · probes/cw-1-detail/screenshots/after-search-viewport.png, probes/12/, probes/12/screenshots/from-17-search.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/probes/54/aria.yml · found by 3 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** Show the result count near the field and move focus or scroll to the results. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0064 · Header still shows 'Basket (1)' after the reservation is confirmed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0064 | Header still shows 'Basket (1)' after the reservation is confirmed | 2.67 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** After a checkout completes, indicators of pending items should reset. On 'Reservation confirmed' the header link reads 'Basket (1)'. A member may wonder whether the drill is still waiting in the basket rather than reserved.

**Evidence.** Where: /done.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17&ref=FT-4471 `#basket-link` at 375 px; /done.html `#basket-link` at 375 px; /basket.html [after confirmation] `region "Tools"` at 375 px and 2 more. E1, reproduced or measured · probes/cw-1-full/screenshots/s8-done.png, probes/cw-1-full/aria.yml, probes/55/, probes/62/final.png · found by 4 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** Empty the basket on confirmation. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-5 Error prevention; H2-4 Consistency and standards

#### F-0069 · Using Change on the confirm page clears the details already entered

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0069 | Using Change on the confirm page clears the details already entered | 2.67 · major | 2 · one component or file | H2-3 | User control and freedom |

**Problem.** Changing one choice in a review step should keep the rest of the reservation, including the form. With membership number, name and mobile filled in, following Change, picking Wednesday 21 and pressing Continue returns to a confirm page with all three fields empty. The journey persona does not know whether changing the session keeps the reservation. Finding the form blank on a phone may suggest the reservation was lost, and it forces retyping three fields.

**Evidence.** Where: /confirm.html `dd:nth-of-type(2) > a` at 375 px; /confirm.html `dd:nth-of-type(2) > a` at 375 px; /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 `dd:nth-of-type(2) > a` at 375 px. E1, reproduced or measured · probes/50/, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/probes/36/aria.yml, .ui-evaluator/runs/20261007-234951-audit-standard/probes/37/, probes/v02/aria.yml · found by 3 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Keep the entered details when returning from Change, or place Change before the details. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; H2-5 Error prevention

#### F-0080 · Basket does not say how long tools are held

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0080 | Basket does not say how long tools are held | 2.67 · major | 1 · one value or token | H2-1 | Visibility of system status |

**Problem.** The persona does not know how long the basket holds a tool. The basket says only 'Items are held for you while you finish', with no time limit and no statement that nothing is reserved until confirmation. Members who reserve 'a few minutes at a time while doing something else' may leave and return later, assuming the tool is still theirs.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `main > p` at 375 px; /basket.html?items=drill-18v-two&day=2026-10-17 `main > p` at 375 px; /basket.html `main > p` at 375 px. E1, reproduced or measured · evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/375-dark.png, probes/55/aria.yml, .ui-evaluator/runs/20261007-234951-audit-standard/evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/default/375-dark.yml, probes/v01/aria.yml · found by 3 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open · Also: H2-10 Help and documentation; WCAG 2.2.1 Timing adjustable

#### F-0085 · Date filter's helper text says the opposite of what the filter does

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0085 | Date filter's helper text says the opposite of what the filter does | 2.67 · major | 1 · one value or token | H2-2 | Match between system and the real world |

**Problem.** The 'Available from' filter says 'Show tools you could pick up on or after this day.' With 17 October set, the list drops the sander (available Wed 21) and wet tile saw (Sat 24), which can be picked up after that day, and keeps tools available on or before it. Members need the wording to match the rule so they trust the result. Task 3 (see which tools can be collected on a given day): a member planning further ahead may conclude tools are unavailable when they are only later.

**Evidence.** Where: /?items=ladder-3m [filters-open] `#from` at 375 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/probes/54/aria.yml, probes/v06/aria.yml · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** none given by the evaluators.

Problem type: single location · Priority P1 · Status open · Also: H2-4 Consistency and standards

#### F-0087 · On phones, session days are marked only by a small dot that the user must decode

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0087 | On phones, session days are marked only by a small dot that the user must decode | 2.67 · major | 2 · one component or file | H2-6 | Recognition rather than recall |

**Problem.** At 1280 px session days in the pick-up calendar say 'Open'. At 375 px the word is replaced by a small green dot, and the instruction above says 'Days marked Open (a green dot on a small screen) are library sessions', so the member has to read and remember that rule to interpret the grid. Members need the session days to be recognisable on the phone itself. Most members use phones, many in dark mode and with older eyes; a small coloured dot is the only cue to which days work.

**Evidence.** Where: /tool.html `#calendar` at 375 px; /tool.html `#calendar` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m `#calendar` at 375 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/default/375-dark.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-1/workspace/.ui-evaluator/runs/20261007-234951-audit-standard/evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/default/1280-dark.png, .ui-evaluator/runs/20261007-234951-audit-standard/evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/day-chosen/375-dark.png, evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/default/1280-light.png · found by 2 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Mark open days with a stronger cue that does not rely on a tiny dot, such as a text label or a distinct cell style. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-4 Consistency and standards; H2-2 Match between system and the real world

#### F-0116 · Masthead still shows 'Basket (1)' after the reservation is confirmed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0116 | Masthead still shows 'Basket (1)' after the reservation is confirmed | 2.67 · major | 2 · one component or file | DES-coherence | — |

**Problem.** On done, the nav reads 'Basket (1)' although the reservation FT-4471 has been made. Members may think the tool is still waiting in the basket and the reservation did not go through.

**Evidence.** Where: /done.html at 1280 px. E1, reproduced or measured · evidence/screens/done-html-items-drill-18v-two-day-2026-10-17-slot-sat-2026-1/default/1280-light.png, probes/v03/aria.yml · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** Make the basket count reflect the state after confirmation. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

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
| F-0039 | Continue and Confirm set aria-busy with no visible or disabled state while waiting | 2.33 · minor | 2 · one component or file | CMP-04 | Response feedback | E1 | open |
| F-0049 | 'Choose a pick-up day first' error is neither announced nor associated with the calendar | 2.33 · minor | 1 · one value or token | A11Y-13 | Forms | E1 | open |
| F-0073 | Filter control is an unlabelled icon | 2.33 · minor | 1 · one value or token | H2-6 | Recognition rather than recall | E1 | open |
| F-0093 | Continue and Confirm give no acknowledgement while the next page loads | 2.33 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0109 | Sticky reserve bar covers the calendar and overhangs the content column | 2.33 · minor | 2 · one component or file | DES-execution | — | E1 | open |
| F-0008 | Touch-primary controls closer than 8 px: "Saturday 17 October, open" and "Reserve this to… | 2 · minor (rule) | 2 · one component or file | CMP-06 | Touch-primary targets | E1 | open |
| F-0019 | Body text closer than 16 px to the viewport edge: "Cleaning · deposit £30" | 2 · minor (rule) | 1 · one value or token | LAY-05 | Edge margin | E1 | open |
| F-0031 | 'Reserve this tool' sits outside every landmark | 2 · minor | 1 · one value or token | A11Y-26 | — | E1 | open |
| F-0032 | Item headings share the level of their section heading on the find and basket pages | 2 · minor | 1 · one value or token | A11Y-26 | — | E1 | open |
| F-0036 | Loan-length button's accessible name omits the field label | 2 · minor | 1 · one value or token | WCAG 4.1.2 | Name, role, value | E1 | open |
| F-0040 | Pressing Confirm again while waiting allocates a second reservation number | 2 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0041 | Done page reservation number comes from session history, with a hard-coded fallback | 2 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0045 | Above 480 px the search form is shown above the results but follows them in tab order | 2 · minor | 2 · one component or file | WCAG 2.4.3 | Focus order | E1 | open |
| F-0046 | Results grid minimum column of 330 px exceeds the content width at 320 px | 2 · minor | 1 · one value or token | A11Y-07 | Reflow at 320 CSS px without two-dimensional scrolling | E1 | open |
| F-0050 | The three-tool limit stated on the find page is not enforced anywhere in the flow | 2 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0051 | Membership and mobile number checks reject common equivalent formats | 2 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0052 | Tool names on result cards and basket rows are marked up as h2 at the same level as their… | 2 · minor | 1 · one value or token | WCAG 1.3.1 | Info and relationships | E1 | open |
| F-0053 | Done page repeats the first tool name in visually hidden text after the tools list | 2 · minor | 1 · one value or token | WCAG 1.3.1 | Info and relationships | E1 | open |
| F-0056 | Search field sits after the full tool list on a phone | 2 · minor | 2 · one component or file | CW-Q2 | Is the action visible? | E1 | open |
| F-0059 | Sticky 'Reserve this tool' is in view before the required pick-up day calendar | 2 · minor | 2 · one component or file | CW-Q1 | Does the effect of the action match the user’s goal? | E1 | open |
| F-0060 | 'Choose a pick-up day first.' error stays on screen after a day is chosen | 2 · minor | 1 · one value or token | CW-Q4 | Will the user understand the feedback? | E1 | open |
| F-0072 | Search is placed above the tool list on desktop but below all ten cards on phones | 2 · minor | 2 · one component or file | H2-4 | Consistency and standards | E1 | open |
| F-0078 | Loan-length list does not close with Escape | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0079 | Two styles of availability badge with no explanation | 2 · minor | 2 · one component or file | H2-2 | Match between system and the real world | E1 | open |
| F-0095 | On phones the open loan-length list is hidden behind the fixed Reserve bar | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0096 | Remove takes a tool out of the basket at once with no undo | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0097 | No way to change loan length or pick-up day once a tool is in the basket | 2 · minor | 3 · several components or one flow | H2-3 | User control and freedom | E1 | open |
| F-0098 | A membership number typed in lower case or without the hyphen is reported as missing | 2 · minor | 2 · one component or file | H2-9 | Help users recognize, diagnose and recover from errors | E1 | open |
| F-0144 | Uneven 1 + 5 session layout at desktop | 2 · minor | 1 · one value or token | DES-hierarchy | — | E1 | open |
| F-0146 | Search below all cards on phones | 2 · minor | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0117 | Find page overflows horizontally at 320 px | 2 · minor | 1 · one value or token | FUN-05 | No horizontal page overflow at any matrix width | E1 | open |
| F-0119 | On phones the search field sits below all ten tool cards | 2 · minor | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0125 | Basket session cards break into an uneven 1 + 5 layout at desktop | 2 · minor | 1 · one value or token | DES-execution | — | E1 | open |
| F-0139 | Find page overflows horizontally at 320 px | 2 · minor | 1 · one value or token | FUN-05 | No horizontal page overflow at any matrix width | E1 | open |
| F-0123 | Filter panel uses an unthemed native date input in the wrong format | 1.67 · minor | 2 · one component or file | DES-execution | — | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0111 | Every tool card shows the same wrench placeholder instead of the tool | 1.33 · cosmetic | 3 · several components or one flow | DES-appeal | — | E1 | open |
| F-0127 | Done page has no focal confirmation | 1.33 · cosmetic | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0138 | Pick-up calendar lacks a month label and the toast lands on its header | 1.33 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
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
| F-0110 | Tool spec list split into two misaligned label columns | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0112 | No brand layer or signature on any surface | 1 · cosmetic | 3 · several components or one flow | DES-specificity | — | E1 | open |
| F-0147 | Navigation labels wrap to two lines on phones | 1 · cosmetic | 1 · one value or token | DES-hierarchy | — | E1 | open |
| F-0115 | Empty bands and half-used columns on basket, confirm and done at wide widths | 1 · cosmetic | 2 · one component or file | DES-appeal | — | E1 | open |
| F-0128 | Identity is only the name: no visual lever carries the library | 1 · cosmetic | 3 · several components or one flow | DES-brandfit | — | E1 | open |

## 5. Divergent and disputed findings: questions for user research

- The raters did not diverge on any finding (spread < 2 throughout).
- One evaluator recorded "loan-length listbox works fully by keyboard" as a strength. The keyboard check and the auditor both reproduced a Tab trap once the list is open. The trap is confirmed; what remains open is whether keyboard members open the list and then try to Tab away, which a keyboard-only session would show.
- Is "basket then choose session" a model members already have from shops, or do they expect "Reserve" to finish? Observe five first-time members on phones doing the Saturday drill task.
- Do members need a session choice separate from the pick-up day at all?

| ID | Title | Ratings and validity votes | Status |
|---|---|---|---|
| F-0054 | Inline style attributes set spacing outside the stylesheet's tokens | — (spread 0; n/p, n/p, n/p); not a problem 3, trade-off 0 | disputed |

Divergent findings are never settled by a vote (ADR-018). The study workflow turns them into tasks and measures.

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | pass | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0052, F-0053 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0028 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | pass | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | pass | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001, F-0002, F-0033 |
| 1.4.4 | AA | Resize text | scripted | fail | F-0010, F-0016 |
| 1.4.5 | AA | Images of text | agent-judged | pass | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0013, F-0046, F-0047 |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | fail | F-0009, F-0015 |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_applicable | — |
| 2.1.1 | A | Keyboard | scripted | fail | F-0026 |
| 2.1.2 | A | No keyboard trap | scripted | fail | F-0035 |
| 2.1.4 | A | Character key shortcuts | agent-judged | pass | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0042, F-0080 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | pass | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | needs-human | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0024, F-0028, F-0045 |
| 2.4.4 | A | Link purpose in context | agent-judged | pass | — |
| 2.4.5 | AA | Multiple ways | agent-judged | pass | — |
| 2.4.6 | AA | Headings and labels | agent-judged | fail | F-0036 |
| 2.4.7 | AA | Focus visible | scripted | pass | — |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | fail | F-0025, F-0048, F-0104 |
| 2.5.1 | A | Pointer gestures | agent-judged | not_applicable | — |
| 2.5.2 | A | Pointer cancellation | scripted | pass | — |
| 2.5.3 | A | Label in name | needs-human | not_run | — |
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
| 3.3.1 | A | Error identification | scripted | fail | F-0049 |
| 3.3.2 | A | Labels or instructions | agent-judged | pass | — |
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0043 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | human | fail | F-0037, F-0140, F-0141, F-0142 |
| 3.3.7 | A | Redundant entry | agent-judged | fail | F-0029 |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_applicable | — |
| 4.1.2 | A | Name, role, value | agent-judged | fail | F-0036 |
| 4.1.3 | AA | Status messages | scripted | fail | F-0030, F-0049 |

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
- uie lint was not run by this role; packet lint.json and census.json were empty, so token drift was reviewed by reading styles.css and the HTML directly (code)
- Rendered effects of C-13, C-15, C-16 and C-17 are predicted from CSS and need the verifier's captures (code)
- Basket Continue sometimes did not advance after a session was chosen (probes/20, 21, 23, 34, 39, 41) but did advance in others (probes/26, 31, 46, 47). The failures came with very short gaps between actions or with the text= locator, and probes/39 with 800 ms waits also failed. I could not separate an app fault from my driver, so it is a hypothesis for the verifier. (he-1)
- The basket says items are 'held for you while you finish'. Whether a hold actually expires, and when, could not be exercised without waiting through it. (he-1)
- At 375x900 with the loan list open, the 'Two weeks' option sits under the sticky 'Reserve this tool' bar (probes/56/screenshots/loan-open.png). That is an obscured-content measurement, so I left it to the tools and did not file it. (he-1)
- Dark-mode contrast of the green availability text on the find page. This is measured by tools, so I did not judge it. (he-1)
- Duplicate reservation via browser Back: after confirming (probe 42) Back returns to the confirm form with name and phone still filled and 'Basket (1)' in the header; whether resubmitting creates a second reservation was not tested, to avoid relying on fixture behaviour. Hypothesis under H5. (he-2)
- Whether a returning member's membership number, name and phone are remembered between visits (H7, 'same as last time'): cannot be tested across browser sessions with uie probe. (he-2)
- Screen-reader announcement of the 'Added to your basket' toast and of the search status: no assistive-technology run available. (he-2)
- Behaviour at 200% zoom and with large system text: not probed by this evaluator. (he-2)
- Basket error-summary link to #sessions: whether focus moves to the first radio. No focus ring was visible after activating it (probe 58 final.png), but the probe output does not show the focused element. (he-3)
- Tool page inline error 'Choose a pick-up day first.' (probe 18 step-03): whether screen readers announce it. Only the final ARIA snapshot of that probe exists. (he-3)
- 'Added to your basket' toast (probe 18 step-07) covers calendar days 26-28. How long it stays, and whether it can be dismissed, was not measured. (he-3)
- Behaviour at 200% zoom and with large OS text: the probe has no zoom emulation. The sticky Reserve bar finding may be worse there, but this is unverified. (he-3)
- Actual VoiceOver and TalkBack output: judged from the ARIA tree only. (he-3)
- Whether and when the basket hold expires: the time limit cannot be triggered in a probe. (he-3)
- Toast and button fade timing, hover and focus styles, keyboard behaviour of the calendar (detectors report reachability problems; not judgeable from stills). (critic-3)
- The no-results state: the capture shows the query typed but the full list still displayed; the empty state itself is not visible. (critic-3)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0002, F-0009, F-0010, F-0011, F-0012 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (3 finding(s)); FUN-06 (7 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (5 finding(s)); A11Y-05 (2 finding(s)) ….
3. For L2: USE-05 (7 open P0 finding(s)); USE-06 (39 P1 finding(s) without a recorded decision); USE-09 (interaction coverage 51% < 90%); DES-01 (a critic has no verdict file, or unsealed detector output before writing it); DES-02 (0/3 critics judged it specific) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (46 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. Plan a study for 1 divergent or disputed finding(s) (`study` workflow).
6. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

