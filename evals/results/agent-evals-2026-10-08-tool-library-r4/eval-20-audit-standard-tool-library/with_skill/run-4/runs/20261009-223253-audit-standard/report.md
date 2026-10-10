# UI evaluation report: Fernhill Tool Library reservations · run 20261009-223253-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:f57654da6c (uncommitted changes present) · run opened 2026-10-10T02:32:53.150Z |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Surfaces and modes | find (operate), tool (operate), basket (operate), confirm (operate), done (read) |
| Routes × states | 5 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-10T02:32:00.783Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | c9fd2cd0 c9fd2cd0 c9fd2cd0 |
| walkthrough-evaluator | 1 | subagent | claude-opus-5-5 | 52046e6d |
| design-critic | 3 | subagent | claude-opus-5-5 | 8188ee80 8188ee80 8188ee80 |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 869bfd46 |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 09a98abb 7566b080 |
| finding-verifier | 4 | subagent | claude-opus-5-5 | 41dc5ff6 b595abc1 fbf083d3 3fce4582 |
| severity-rater | 3 | subagent | claude-opus-5-5 | 50f00103 1dc2e67f 2b5819e2 |

Coverage: 540 valid capture(s); 52% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (1 finding(s)); FUN-06 (2 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (3 finding(s)); A11Y-05 (1 finding(s)); A11Y-07 (2 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-06 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-05, A11Y-07, A11Y-08, A11Y-09, A11Y-11, A11Y-13, A11Y-15, A11Y-27 |
| G3 Craft floor | fail | COL-01, LAY-03, LAY-04, LAY-05, CMP-04, CMP-05, CMP-06, CPY-04 |
| G4 Deliberateness and anti-slop | fail | SLP-24 |
| G5 Analytical usability | fail | USE-04, USE-05, USE-06, USE-09 |
| G6 Design quality | fail | DES-02, DES-03, DES-04, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- Error summaries on basket and confirm are focused alerts whose links move focus to each field, with format examples ("like FT-01234"), and typed values are kept after a failed submit (he-1, he-2, he-3, a11y; confirm `errors` state, 375 px light and 1280 px light captures).
- Calendar day buttons have full spoken names with session status ("Saturday 17 October, open") and expose the selection as pressed (he-2, he-3, a11y; ARIA snapshot for the tool page, `loan-open` state, 1280 px light).
- Adding to the basket and search results are announced through status regions ("Added to your basket", "2 tools found") (he-1, he-2, he-3; probe ARIA at 375 px).
- Confirm and done pages say plainly that nothing is paid online, what deposit to bring and what to do if the member cannot make the session (confirm `default` 375 px light capture; done page probes at 375 px).
- Visible focus rings that survive forced colours (he-3; a11y forced-colours probe).
- The copy is specific to the library and in the volunteer's voice (all three critics).

- Error summaries on basket and confirm are alerts that receive focus, with in-page links to each field and format examples ('like FT-01234')
- Calendar day buttons carry full dates and session status in their names ('Saturday 10 October, open') and expose selection with aria-pressed
- Focus rings use outlines that survive forced colours (listbox option and calendar day)
- Search results count is announced through a pre-existing status region ('1 tool found')
- One global :focus-visible ring (3px solid --color-focus, 2px offset) applies to every control and is distinct from hover; no outline:none anywhere
- Motion matches the declared budget (120 ms colour and opacity fades only) and has a reduced-motion path
- Error summaries receive focus, use role=alert, link to the failing field, and fields carry aria-invalid plus aria-describedby to their error text
- Remove buttons carry the tool name in sr-only text and focus returns to the basket heading after removal

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.43 (mean Jaccard over 3 passes); an estimated 1.6 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0024 · Focus order jumps back: "Electric wet tile saw, 180 mm" → "Search tools"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0024 | Focus order jumps back: "Electric wet tile saw, 180 mm" → "Search tools" | 4 · catastrophe (rule) | 2 · one component or file | A11Y-03 | Keyboard |

**Problem.** After "Electric wet tile saw, 180 mm", Tab moves to "Search tools", which sits 654 px above it in the same column; the focus order does not follow the visual reading order (clear-inversion heuristic).

**Evidence.** Where: /?items=ladder-3m `#q` at 1280 px; /?items=ladder-3m [filters-open] `#q` at 1280 px; /?items=ladder-3m [no-results] `#q` at 1280 px and 2 more. E1, reproduced or measured · evidence/crops/keyboard/21774f91d1.png, evidence/crops/keyboard/8c55f79d69.png, evidence/crops/keyboard/6b7d343985.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/evidence/screens/items-ladder-3m/default/375-light.png. Ratings: rule: 4.

**Recommendation.** Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.4.3 Focus order; H2-6 Recognition rather than recall; H2-4 Consistency and standards; H2-7 Flexibility and efficiency of use

#### F-0026 · Not reachable by keyboard: "Fernhill Tool Library"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0026 | Not reachable by keyboard: "Fernhill Tool Library" | 4 · catastrophe (rule) | 2 · one component or file | A11Y-03 | Keyboard |

**Problem.** The a "Fernhill Tool Library" is tabbable in the DOM, but a complete Tab walk never reached it. People who use a keyboard or switch cannot operate it.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `div > a.library-name` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `li:nth-of-type(1) > a` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m [loan-open] `#basket-link` at 320 px and 7 more. E1, reproduced or measured · evidence/crops/keyboard/838d70f50d.png, evidence/crops/keyboard/68977968e8.png, evidence/crops/keyboard/7a8cae446c.png, evidence/crops/keyboard/062afdd805.png. Ratings: rule: 4.

**Recommendation.** Put the control back in the Tab order (remove tabindex="-1") or give its function a reachable equivalent. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.1.1 Keyboard; A11Y-25 —; H2-4 Consistency and standards

#### F-0043 · After the hold expires, Continue always fails with 'Something went wrong. Try again.'

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0043 | After the hold expires, Continue always fails with 'Something went wrong. Try again.' | 4 · catastrophe | 1 · one value or token | H2-9 | Help users recognize, diagnose and recover from errors |

**Problem.** An error message should state the cause and a fix that works. When holdExpired() is true the basket shows 'Something went wrong. Try again.' (not linked, no cause), but hold_started is never reset or restarted on that path (startHoldIfNeeded only sets it when absent), so every retry fails the same way for the rest of the browser session. A member whose hold lapsed is told to try again, cannot succeed, and has no hint that re-adding the tools or starting over would help.

**Evidence.** Where: /basket.html [hold-expired, Continue pressed] `#error-summary`. E1, reproduced or measured · app.js:358-365, app.js:94-100, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-10-hold-expiry/screenshots/continue-1.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-10-hold-expiry/screenshots/continue-2.png · found by 1 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Say the hold ran out and offer a working recovery (re-check availability and restart the hold, or a button to do so). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: CMP-18 —; CPY-04 Error-message quality

### P1

#### F-0036 · Confirm reservation creates a second reservation when pressed again during the wait

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0036 | Confirm reservation creates a second reservation when pressed again during the wait | 3.33 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A submit that allocates a record should run once per user intent. The confirm handler pushes a new reservation (FT-4471, FT-4472, ...) into sessionStorage before its 1.5 s timeout, and nothing blocks a second submit in that window: the button is not disabled and the handler has no in-flight guard. A double tap or a repeat press therefore allocates two reservation numbers, and the done page then lists both ('Reservation numbers: FT-4471 and FT-4472'). A member on a phone who taps twice may hold two reservations for the same tools, tying up stock and confusing the desk volunteer.

**Evidence.** Where: /confirm.html [valid details submitted, during the 1.5 s wait] `#confirm`. E1, reproduced or measured · app.js:392-433, app.js:442-445, probes/88/aria.yml, probes/88/screenshots/done.png · found by 1 of 10 evaluator(s). Ratings: 3.33 (spread 1; 4, 3, 3).

**Recommendation.** Return early from the submit handler while a request is in flight, and allocate the reference only after the wait succeeds. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: CMP-12 —; CMP-04 Response feedback

#### F-0042 · Basket hold expires after 10 minutes with no notice, warning or way to extend

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0042 | Basket hold expires after 10 minutes with no notice, warning or way to extend | 3.33 · major | 1 · one value or token | WCAG 2.2.1 | Timing adjustable |

**Problem.** A time limit must be stated and adjustable or extendable (WCAG 2.2.1). The hold starts when the first tool is added (HOLD_MINUTES = 10) and is checked only when Continue is pressed. The basket intro says only 'Items are held for you while you finish'; no page shows the limit, the time left or a warning, and nothing extends it. Members comparing tools in the evening may pass 10 minutes without knowing a limit exists and lose the hold at the last step.

**Evidence.** Where: /basket.html `#main .intro`. E1, reproduced or measured · app.js:7, 90-100, basket.html:33, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-10-hold-expiry/screenshots/basket-start.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-10-hold-expiry/screenshots/basket-after-10min.png · found by 1 of 10 evaluator(s). Ratings: 3.33 (spread 1; 4, 3, 3).

**Recommendation.** State the limit, show the time left on the basket page, warn before expiry and offer to extend (or remove the client-side limit). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0044 · Days the library is closed can be chosen as pick-up day and are rejected only at final confirm

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0044 | Days the library is closed can be chosen as pick-up day and are rejected only at final co… | 3.33 · major | 1 · one value or token | H2-5 | Error prevention |

**Problem.** Invalid choices should be prevented or flagged where they are made. The tool-page calendar renders all 21 days as enabled buttons (open days only get an 'Open' tag); choosing a closed day and reserving succeeds, the basket accepts it, and only Confirm reservation, after its 1.5 s wait, reports 'The library is closed on ..., so this pick-up day is not possible. Choose another day.' That error item has no link back to where the day is changed. Members may build a whole reservation around a closed day and learn at the last step, three pages later, that they must start over.

**Evidence.** Where: /tool.html `#calendar .day`. E1, reproduced or measured · app.js:195-208, app.js:421-431, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-02-closed-day/screenshots/basket.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-03-closed-day-confirm/aria.yml · found by 1 of 10 evaluator(s). Ratings: 3.33 (spread 1; 3, 3, 4).

**Recommendation.** Disable or reject closed days on the tool page (with an explained state), or validate when Reserve is pressed. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: CMP-18 —

#### F-0057 · 'Reserve this tool' only adds to a basket, so the reservation may look done when it is not

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0057 | 'Reserve this tool' only adds to a basket, so the reservation may look done when it is not | 3.33 · major | 1 · one value or token | CW-Q1 | Does the effect of the action match the user’s goal? |

**Problem.** A button labelled with the user's goal should complete that goal or say what remains. 'Reserve this tool' puts the tool in a basket; the reservation is made only after choosing a session on the basket page and pressing 'Confirm reservation' on a further page. Nothing on the tool page after the tap says the reservation is unfinished; the brief toast reads 'Added to your basket'. Members may leave believing the drill is reserved, then find nothing set aside at the Saturday session.

**Evidence.** Where: /tool.html [added] `role=button[name="Reserve this tool"]` at 375 px. E1, reproduced or measured · probes/1/, probes/1/step-11.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-06-375-flow/probe.json, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-06-375-flow/screenshots/added-100ms.png · found by 1 of 10 evaluator(s). Ratings: 3.33 (spread 1; 3, 3, 4).

**Recommendation.** Label the action for what it does (for example 'Add to basket') or, after it, state plainly that the reservation is not made yet and offer the next step. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: overall structure · Priority P1 · Status open · Also: H2-2 Match between system and the real world

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

#### F-0025 · Focused element hidden behind body > div.actionbar: "One week"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0025 | Focused element hidden behind body > div.actionbar: "One week" | 3 · major (rule) | 2 · one component or file | A11Y-05 | Focus not obscured |

**Problem.** When "One week" receives focus (Tab), none of nine sample points on its box reaches it: body > div.actionbar (fixed) paints over it, so the focused element is not visible.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m `#loan-button` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m `#calendar > button.day:nth-of-type(3)` at 1280 px; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#loan-button` at 320 px and 6 more. E1, reproduced or measured · evidence/crops/keyboard/acf770e60f.png, evidence/crops/keyboard/ecab508c28.png, evidence/crops/keyboard/698751df87.png, evidence/crops/keyboard/85e4ed9e92.png. Ratings: rule: 3.

**Recommendation.** Add scroll-padding-top / scroll-padding-bottom equal to the sticky bar height (technique C43), or keep floating layers out of the focus path. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.11 Focus not obscured, minimum; CW-Q2 Is the action visible?; H2-5 Error prevention; H2-1 Visibility of system status

#### F-0027 · Basket pick-up sessions are shown in reverse of their reading and arrow-key order

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0027 | Basket pick-up sessions are shown in reverse of their reading and arrow-key order | 3 · major | 1 · one value or token | WCAG 1.3.2 | Meaningful sequence |

**Problem.** Meaningful sequence and focus order should match the visual order. In the 'Pick-up session' radio group, the DOM, the accessibility tree and the arrow-key order run Saturday 10 → Wednesday 14 → Saturday 17 → Wednesday 21 → Saturday 24 → Wednesday 28. On screen the list is reversed: at 320 px Wednesday 28 is at the top and Saturday 10 at the bottom; at 1280 px Wednesday 28 fills the first row and Saturday 10 is last, bottom right. With the keyboard, Tab enters the group at the bottom-right card (Saturday 10), and ArrowDown moves focus up and to the left (to Wednesday 14, then Saturday 17). Sighted keyboard users therefore see focus move against the visual order. Screen-reader users hear the dates in chronological order while sighted helpers see them in reverse. Members choosing a session on a phone, including keyboard-only and low-vision members, may pick the wrong week or lose track of focus. The earliest session is presented last, against the chronological order people expect for dates.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 1280 px; /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 320 px; /basket.html?items=drill-18v-two&day=2026-10-17 [errors] `role=group[name="Pick-up session"]` at 1280 px and 5 more. E1, reproduced or measured · probes/66/, evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/1280-light.yml, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/320-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/375-light.png · found by 4 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Render the sessions in normal DOM order and remove the reversing layout rule (for example column-reverse, wrap-reverse or row-reverse), so that visual, reading and arrow-key order are all chronological. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.3 Focus order; H2-4 Consistency and standards; H2-2 Match between system and the real world

#### F-0030 · Session markers on the pick-up calendar disappear in forced-colours mode at small widths

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0030 | Session markers on the pick-up calendar disappear in forced-colours mode at small widths | 3 · major | 1 · one value or token | A11Y-22 | — |

**Problem.** Under forced-colors: active, meaningful indicators should stay visible. At small widths the calendar marks the library session days (Wednesdays and Saturdays) only with a small green dot under the date; the visible word 'Open' is used at 1280 px. In the 320 px forced-colours captures the dots are gone: days 10, 14, 17, 21, 24 and 28 look exactly like the other days, apart from a slight shift of the date upwards. The on-page hint still says 'Days marked Open (a green dot on a small screen) are library sessions'. The accessible names (', open') still carry the information, so screen-reader users are not affected. At 1280 px the word 'Open' survives forced colours. Members using a Windows contrast theme on a narrow window, or a phone's high-contrast setting that forces colours, cannot tell which days are sessions and may choose a day when the desk is closed.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#calendar > button.day[data-day="2026-10-10"]` at 320 px; /tool.html?id=drill-18v-two&items=ladder-3m `#calendar > button.day[data-day="2026-10-14"]` at 320 px. E1, reproduced or measured · evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/day-chosen/320-light-forced-colors.png, evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/day-chosen/320-light.png, evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/loan-open/1280-light-forced-colors.png, probes/91/step-04.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Keep a text or glyph marker at small widths (for example a short 'Open' or a visible symbol drawn as text or an SVG with fill: currentColor) instead of a background-coloured dot. Or give the dot a forced-colours style (background: CanvasText). Reword the hint so that it does not depend on 'green'. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0031 · A search with no matches shows the full tool list and announces nothing

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0031 | A search with no matches shows the full tool list and announces nothing | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** After a search, the outcome should be shown and announced, including when nothing matches. Searching 'ladder' filters the list to one card, and the status region reads '1 tool found' (probe 67). Searching 'sewing machine' with the Search button shows all ten tools again, and the status region is empty (probe 68; the same in the captured no-results state). There is no 'no tools match' message on screen or in the live region. Screen-reader members hear nothing after searching. Sighted members see a full list. Both may conclude that the library has the tool, or that the search did not run, and browse ten unrelated tools.

**Evidence.** Where: /?items=ladder-3m [no-results] `role=status` at 1280 px; /?items=ladder-3m [no-results] `region "Tools" > status` at 375 px; /?items=ladder-3m [no-results] `#results` at 1280 px and 3 more. E1, reproduced or measured · probes/68/, probes/67/, evidence/screens/items-ladder-3m/no-results/1280-light.png, probes/3/ · found by 5 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** On zero matches, show an empty-results message in the list area (what was searched and a way to clear it), and write 'No tools match "sewing machine"' into the existing status region. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: A11Y-15 Status messages from async actions are exposed through `role=status…; H2-9 Help users recognize, diagnose and recover from errors; H2-2 Match between system and the real world; CMP-05 Data states exist; CMP-14 —; WCAG 4.1.3 Status messages

#### F-0033 · The collection time is chosen twice, and the first choice is not carried into the second

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0033 | The collection time is chosen twice, and the first choice is not carried into the second | 3 · major | 3 · several components or one flow | H2-6 | Recognition rather than recall |

**Problem.** A process should let people decide something once and recognise it later, not re-decide it. On the tool page the member picks a 'pick-up day' from a calendar where any day can be chosen, including days when the desk is closed (Monday 12 October in the day-chosen state). On the basket page they must choose a 'pick-up session' again from six radios, none preselected, even when the chosen day (Saturday 17 October) is itself a session. If Continue is pressed without choosing, the error 'Choose a pick-up session' appears. The two steps use different words for the same decision ('pick-up day', 'pick-up session'). The basket card repeats 'Pick up Saturday 17 October', which may not match the session finally chosen. WCAG 3.3.7 is met in letter, because the earlier answer is available to select, so this is recorded as a cognitive-load problem. Members who are planning while doing something else, and older members, may pick a non-session day, have to remember it across pages, then meet an error. They may also confirm a session that differs from the day shown on the basket card.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `role=group[name="Pick-up day"]` at 1280 px; /basket.html?items=drill-18v-two&day=2026-10-17 `role=group[name="Pick-up session"]` at 1280 px; /basket.html `role=radio[name="Saturday 17 October, 10:00 to 13:00"]` at 375 px and 3 more. E1, reproduced or measured · evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/day-chosen/1280-light.png, evidence/aria/basket-html-items-drill-18v-two-day-2026-10-17/errors/1280-light.yml, probes/1/screenshots/s07-basket.png, probes/24/ · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Ask once. Either offer only session days on the tool page and preselect that session in the basket, or drop the tool-page day and choose the session in the basket. Use one term for it throughout. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: overall structure · Priority P1 · Status open · Also: H2-5 Error prevention; CPY-12 —; CW-Q1 Does the effect of the action match the user’s goal?; H2-4 Consistency and standards; H2-2 Match between system and the real world

#### F-0037 · Continue and Confirm show no visible busy state during their 1.2 s and 1.5 s waits

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0037 | Continue and Confirm show no visible busy state during their 1.2 s and 1.5 s waits | 3 · major | 1 · one value or token | CMP-10 | — |

**Problem.** A wait longer than about 1 s should show visible progress on the control that started it. Both submit buttons only receive aria-busy=true; styles.css has no [aria-busy] rule, the label does not change and the button is not disabled, so the page looks unchanged until it navigates or shows an error. Members may think the tap did not register and tap again (which on Confirm duplicates the booking, see C-code-01) or leave the page.

**Evidence.** Where: /basket.html [session chosen, Continue pressed] `#continue`; /confirm.html [valid details, Confirm pressed] `#confirm`; /basket.html `role=button[name="Continue"]` at 375 px and 1 more. E1, reproduced or measured · app.js:356-367, 418-433, styles.css:470-532, probes/13/, probes/1/ · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Add a .button[aria-busy=true] style with a label change (for example 'Checking...') and block re-entry while busy. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; CMP-04 Response feedback; CW-Q4 Will the user understand the feedback?

#### F-0039 · Tab inside the open loan-length listbox cycles the options and cannot leave

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0039 | Tab inside the open loan-length listbox cycles the options and cannot leave | 3 · major | 1 · one value or token | WCAG 2.1.2 | No keyboard trap |

**Problem.** Tab must move focus out of a widget. The listbox keydown handler treats Tab like ArrowDown: it calls preventDefault and focuses the next option, wrapping around, so a keyboard user can never Tab out of the open list; Shift+Tab is also caught (e.key is 'Tab'). Only Enter or Space on an option closes it. Keyboard and switch users who open the list to look at the options are stuck until they discover they must choose one.

**Evidence.** Where: /tool.html [loan-open] `#loan-list`. E1, reproduced or measured · app.js:238-251, app.js:224-251, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-01-listbox-tab/probe.json, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-01-listbox-tab/step-09.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Let Tab close the list (keeping the current value) and move focus on, as in the APG select-only combobox pattern; or use a native select. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: A11Y-25 —; A11Y-03 Keyboard; H2-3 User control and freedom

#### F-0046 · Results grid's 330 px column minimum is wider than the 320 px viewport's content box

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0046 | Results grid's 330 px column minimum is wider than the 320 px viewport's content box | 3 · major | 1 · one value or token | WCAG 1.4.10 | Reflow |

**Problem.** Content should reflow at 320 CSS px without horizontal scrolling. .results uses repeat(auto-fill, minmax(330px, 1fr)) inside .page with 16 px side padding, leaving 288 px; the single column cannot shrink below 330 px, so cards overflow by about 42 px. Phone members at 320 px or 400 % zoom may get sideways scrolling and cut-off cards on the main list.

**Evidence.** Where: /index.html [default, 320 px] `#results`. E1, reproduced or measured · styles.css:198-202, 329-333, probes/70/final.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Use minmax(min(330px, 100%), 1fr). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: A11Y-07 Reflow at 320 CSS px without two-dimensional scrolling

#### F-0048 · Tool card names are cut to one line, hiding the words that tell similar tools apart

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0048 | Tool card names are cut to one line, hiding the words that tell similar tools apart | 3 · major | 1 · one value or token | H2-6 | Recognition rather than recall |

**Problem.** Truncation should not remove the distinguishing part of a name. .card__name a is white-space: nowrap with text-overflow: ellipsis in a column of roughly 180-300 px; the two drills differ only at the end ('... combi, two batteries' vs '... combi, one battery'), and the full name is not available elsewhere on the card (no title attribute). Members may open or reserve the one-battery drill when they wanted the two-battery kit.

**Evidence.** Where: /index.html `.card__name a`; / `role=link[name="Cordless drill 18 V, combi, two batteries"]` at 375 px; / [search-results] `role=link[name="Cordless drill 18 V, combi, one battery"]` at 375 px and 1 more. E1, reproduced or measured · styles.css:372-381, app.js:10-11, probes/70/final.png, evidence/screens/items-ladder-3m/default/375-light.png · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Allow names to wrap (two-line clamp at most), keeping the 44 px target from padding. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-5 Error prevention; CW-Q3 Will the user recognize the action as the correct one?; H2-2 Match between system and the real world

#### F-0050 · Dark-mode 'available soon' badge uses an undeclared green with no tint

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0050 | Dark-mode 'available soon' badge uses an undeclared green with no tint | 3 · major | 1 · one value or token | COL-01 | Token conformance |

**Problem.** Theme tokens should match the declared roles. design.md declares dark success #8fd1a8 on selection #24352c; styles.css sets dark --color-ok to #2f7d4a and --color-ok-tint to #1d2622 (the card surface). The badge background therefore disappears into the card and its 16 px bold text is #2f7d4a on #1d2622, computed at about 3.1:1, below the 4.5:1 needed for text of that size. Members browsing in dark mode, the declared common case, may not be able to read the availability date that decides what they reserve.

**Evidence.** Where: /index.html [default, dark] `.badge--ok`. E1, reproduced or measured · styles.css:58-61, design.md themes.dark.colors, evidence/screens/items-ladder-3m/default/1280-dark.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Set dark --color-ok to #8fd1a8 and --color-ok-tint to #24352c as declared. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 1.4.3 Contrast, minimum; A11Y-11 Text contrast ≥ 4.5

#### F-0052 · 'Choose a pick-up day first' error is neither announced nor tied to the calendar

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0052 | 'Choose a pick-up day first' error is neither announced nor tied to the calendar | 3 · major | 2 · one component or file | WCAG 3.3.1 | Error identification |

**Problem.** An error should be announced and associated with the control in error. Pressing Reserve without a day unhides #day-error (a plain p, not a live region) and moves focus to the first day button; the calendar group has no aria-describedby pointing to the error, so a screen reader announces only that day's name. Screen-reader users pressing Reserve may hear a date read out with no reason and not learn a day is required.

**Evidence.** Where: /tool.html [Reserve pressed with no day] `#day-error`; /tool.html?id=drill-18v-two `role=region[name="Pick-up day"]` at 375 px. E1, reproduced or measured · tool.html:62-63, app.js:257-262, probes/60/, probes/20/aria.yml · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Reference #day-error from the calendar group with aria-describedby (or make it a live region). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 4.1.3 Status messages; A11Y-15 Status messages from async actions are exposed through `role=status…; H2-9 Help users recognize, diagnose and recover from errors; H2-4 Consistency and standards

#### F-0058 · Basket confirmation vanishes within seconds and the way on is scrolled out of view

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0058 | Basket confirmation vanishes within seconds and the way on is scrolled out of view | 3 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** After adding to the basket the user should see a lasting confirmation and the next step. At 375 px the 'Added to your basket' toast overlaps the calendar and is gone before 2.5 s; the button keeps the same label; the only lasting signal, 'Basket (1)', is in the header, which is out of view when the member is at the calendar, and nothing near the button links onward. Members glancing away may not notice the tool was added, tap again, or not find how to continue.

**Evidence.** Where: /tool.html [added] `text=Added to your basket` at 375 px; /tool.html [added] `#basket-link` at 375 px. E1, reproduced or measured · probes/13/, probes/1/step-11.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-06-375-flow/screenshots/added-100ms.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-06-375-flow/screenshots/added-1700ms-hovered.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Keep a persistent added state near the button with a link to the basket. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: CW-Q2 Is the action visible?; H2-1 Visibility of system status

#### F-0060 · Pick-up sessions are listed latest first

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0060 | Pick-up sessions are listed latest first | 3 · major | 1 · one value or token | CW-Q2 | Is the action visible? |

**Problem.** Dates are expected in calendar order. The basket lists sessions Wed 28, Sat 24, Wed 21, Sat 17, Wed 14, Sat 10 October; the first Saturday a member reads is the 24th and the wanted Saturday 17 is fourth of six. A member skimming for 'Saturday' may pick the wrong week; caught only if they read the confirm summary.

**Evidence.** Where: /basket.html `role=radio[name="Wednesday 28 October, 18:00 to 20:00"]` at 375 px. E1, reproduced or measured · probes/1/screenshots/s07-basket.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-02-closed-day/step-14.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-12-pressure-washer/aria.yml · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** List sessions in date order, earliest first. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-4 Consistency and standards

#### F-0068 · Pick-up calendar accepts days when the library is closed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0068 | Pick-up calendar accepts days when the library is closed | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Collection is only possible at sessions (Wednesdays and Saturdays). The calendar lets the member choose Monday 12 October, 'Reserve this tool' accepts it with 'Added to your basket', and the basket then shows 'Pick up Monday 12 October'. No message says the library is closed that day. First-time members, who by declaration do not know which days are sessions, may plan around a day they cannot collect on.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `#calendar > button.day:nth-of-type(4)` at 375 px; /tool.html?id=drill-18v-two&items=ladder-3m [day-chosen] `.day[data-day="2026-10-12"]` at 375 px; /tool.html?id=pressure-washer [day-chosen] `.day[data-day="2026-10-10"]` at 375 px and 1 more. E1, reproduced or measured · probes/5/, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/day-chosen/375-light.png, probes/16/, probes/50/ · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Make only session days choosable, or refuse other days with a message naming the next session. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-2 Match between system and the real world; H2-1 Visibility of system status

#### F-0069 · Pick-up calendar accepts days before the tool is available

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0069 | Pick-up calendar accepts days before the tool is available | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** The pressure washer is 'Available from Sat 17 Oct', yet choosing Saturday 10 October and pressing 'Reserve this tool' adds it to the basket with no warning. A member may arrive at a session for a tool that is still out with the previous borrower.

**Evidence.** Where: /tool.html?id=pressure-washer [day-chosen] `.day[data-day="2026-10-10"]` at 375 px. E1, reproduced or measured · probes/34/, probes/3/aria.yml, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-12-pressure-washer/step-01.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-12-pressure-washer/aria.yml · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Disable or refuse days before the tool's available date. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0072 · Changing the session from the confirm page clears the details already typed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0072 | Changing the session from the confirm page clears the details already typed | 3 · major | 2 · one component or file | H2-3 | User control and freedom |

**Problem.** On the confirm page the member typed a membership number and name, then used 'Change' next to the session. Changing to Wednesday 21 and pressing Continue returns to the confirm page with Membership number and Your name empty. The previous session is also not preselected in the basket. In the change-session journey on a phone, the member has to retype their details and may not notice until they press Confirm and get errors.

**Evidence.** Where: /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 `dd:nth-of-type(2) > a` at 375 px; /confirm.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17 `role=link[name="Change"]` at 375 px; /confirm.html `#member, #name, #phone` at 375 px. E1, reproduced or measured · probes/18/, probes/9/, probes/36/, probes/51/ · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Keep typed details and the current session when going to Change and back. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; H2-7 Flexibility and efficiency of use; WCAG 3.3.7 Redundant entry

#### F-0077 · After 'Reserve this tool' the page keeps no sign that the tool is in the basket

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0077 | After 'Reserve this tool' the page keeps no sign that the tool is in the basket | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** Pressing 'Reserve this tool' shows a short 'Added to your basket' toast that disappears within six seconds. Afterwards the tool page looks as it did before: the button still reads 'Reserve this tool' and there is no link onward to the basket on the page; only the header count changes, off-screen at the top. First-time members, who do not know how the basket works, may not know the next step is the basket and may press Reserve again or leave thinking the tool is reserved.

**Evidence.** Where: /tool.html?id=drill-18v-two&items=ladder-3m [added] `#reserve` at 375 px. E1, reproduced or measured · probes/39/, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/evidence/screens/tool-html-id-drill-18v-two-items-ladder-3m/added/375-light.png, probes/87/step-04.png, probes/87/step-06.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** After adding, show a lasting in-page state with a link to the basket. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-6 Recognition rather than recall

#### F-0083 · Basket accepts a session before a held tool becomes available

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0083 | Basket accepts a session before a held tool becomes available | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** The session list should rule out sessions at which a held tool cannot be collected. With the pressure washer (available from 17 October) and sander (from 21 October) in the basket, choosing Saturday 10 October and Continue proceeds to confirm without any warning. A member may arrive on 10 October expecting tools that are not yet back, wasting a trip to a session that runs only a few hours a week.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `role=radio[name="Saturday 10 October, 10:00 to 13:00"]`. E1, reproduced or measured · probes/52/, probes/97/aria.yml, probes/97/step-12.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Only offer sessions on or after the latest availability date in the basket, or flag the conflicting tool. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0111 · Tool names truncated on phones so the two drills read the same

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0111 | Tool names truncated on phones so the two drills read the same | 3 · major | 1 · one value or token | DES-execution | — |

**Problem.** At 375 px the card titles are cut with an ellipsis; both drills read 'Cordless drill 18 V, co...', hiding the distinguishing 'two batteries' / 'one battery'. On the primary device the deciding detail of the tool name is hidden, so members may open the wrong tool.

**Evidence.** Where: items-ladder-3m at 375 px. E1, reproduced or measured · evidence/screens/items-ladder-3m/default/375-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/evidence/screens/items-ladder-3m/default/375-light.png, probes/72/step-01.png, probes/72/aria.yml · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Let tool names wrap at narrow widths; decide how the card gives space to the name rather than to the image slot. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: DES-hierarchy —

#### F-0160 · Pick-up sessions listed latest-first

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0160 | Pick-up sessions listed latest-first | 3 · major | 1 · one value or token | H2-4 | Consistency and standards |

**Problem.** The basket session list runs from Wednesday 28 down to Saturday 10 October, against chronological expectation. This duplicates the visual-order mechanism of F-0027. Members are likely to scan against calendar order and may pick a session that contradicts the day they chose; this undercuts 'careful'.

**Evidence.** Where: basket-html-items-drill-18v-two-day-2026-10-17 at 1280 px. E1, reproduced or measured · evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/probes/99/step-01.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Decide the session order from the member's chosen pick-up day and calendar order. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: DES-brandfit —

#### F-0142 · Tool names truncate at 375 so similar tools become indistinguishable

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0142 | Tool names truncate at 375 so similar tools become indistinguishable | 3 · major | 1 · one value or token | DES-execution | — |

**Problem.** At 375 the card names are cut with ellipses: both drills read 'Cordless drill 18 V, co...', hiding 'two batteries' vs 'one battery'. On phones, the main device, members may open the wrong drill; the distinguishing words are the ones lost.

**Evidence.** Where: / at 375 px. E1, reproduced or measured · evidence/screens/items-ladder-3m/default/375-light.png, probes/70/final.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Let names wrap on narrow widths; the card can grow. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open

#### F-0159 · Basket: pick-up sessions shown in reverse, bottom-up order

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0159 | Basket: pick-up sessions shown in reverse, bottom-up order | 2.67 · major | 1 · one value or token | WCAG 1.3.2 | Meaningful sequence |

**Problem.** Session options display Wed 28 to Sat 10, wrapping upward, while reading and arrow-key order run Sat 10 to Wed 28. Keyboard and screen-magnifier users may find focus jumping against the visible layout and pick the wrong session.

**Evidence.** Where: /index.html [default, width > 480 px] `.finder`; /basket.html `#sessions`. E1, reproduced or measured · styles.css:253-269; index.html:36-81, styles.css:816-822; app.js:330-332, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/probes/99/step-07.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/probes/99/aria.yml · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Order the DOM to match the intended layout and drop the order/row-reverse/wrap-reverse rules. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.3 Focus order

#### F-0054 · 'Added to your basket' toast disappears after about 1.3 seconds

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0054 | 'Added to your basket' toast disappears after about 1.3 seconds | 2.67 · major | 1 · one value or token | CMP-04 | Response feedback |

**Problem.** Confirmation that an action succeeded should stay long enough to read. The toast is shown, then given is-leaving after 1200 ms and hidden 150 ms later, regardless of hover or focus; the only other cue is the small 'Basket (n)' count in the masthead. Members looking at the bar or the calendar when they tap Reserve may miss the confirmation and tap again or doubt the tool was added.

**Evidence.** Where: /tool.html [added] `#toast`. E1, reproduced or measured · app.js:271-278, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-02-closed-day/screenshots/added-immediate.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-02-closed-day/screenshots/added-1600ms.png, .ui-evaluator/runs/20261009-223253-audit-standard/probes/vp1-06-375-flow/screenshots/added-1700ms-hovered.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Keep the toast for several seconds (pausing on hover/focus) or show a persistent 'In your basket - view basket' state on the tool page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0062 · Header still shows 'Basket (1)' after the reservation is confirmed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0062 | Header still shows 'Basket (1)' after the reservation is confirmed | 2.67 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** After confirming, the interface should no longer suggest anything is pending. On the done page, and on returning to the find page, the header link still reads 'Basket (1)'. Members may wonder whether the drill is reserved or still waiting in the basket, and may try to check out again.

**Evidence.** Where: /done.html `#basket-link` at 375 px; /done.html?items=drill-18v-two&day=2026-10-17&slot=sat-2026-10-17&ref=FT-4471 `#basket-link`; /basket.html `region "Tools"` and 3 more. E1, reproduced or measured · probes/1/screenshots/s11-done.png, probes/13/aria.yml, probes/21/, probes/41/ · found by 5 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Empty the basket once its tools are reserved. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-5 Error prevention

#### F-0078 · Basket does not say how long tools are held

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0078 | Basket does not say how long tools are held | 2.67 · major | 1 · one value or token | H2-1 | Visibility of system status |

**Problem.** The basket says 'Items are held for you while you finish.' The persona does not know how long the basket holds a tool. No time limit or expiry is shown, and 'while you finish' does not say what happens if the member leaves and comes back later. Members who plan in short bursts while doing something else may leave a tool in the basket believing it is reserved, when only confirming reserves it.

**Evidence.** Where: /basket.html?items=drill-18v-two&day=2026-10-17 `text=Items are held for you while you finish.` at 375 px; /basket.html?items=drill-18v-two&day=2026-10-17 `main > p`. E1, reproduced or measured · probes/5/aria.yml, evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/375-light.png, probes/87/aria.yml, probes/96/aria.yml · found by 2 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** State the hold period, and that the tool is not reserved until confirmed. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-10 Help and documentation

#### F-0122 · Header still shows 'Basket (1)' after the reservation is confirmed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0122 | Header still shows 'Basket (1)' after the reservation is confirmed | 2.67 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** The done page confirms reservation FT-4471 while the navigation still reads 'Basket (1)'. Members may wonder whether the reservation went through or whether an item is still pending.

**Evidence.** Where: done-html-items-drill-18v-two-day-2026-10-17-slot-sat-2026-1 at 1280 px. E1, reproduced or measured · evidence/screens/done-html-items-drill-18v-two-day-2026-10-17-slot-sat-2026-1/default/1280-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/evidence/screens/done-html-items-drill-18v-two-day-2026-10-17-slot-sat-2026-1/default/1280-light.png, probes/88/aria.yml · found by 2 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Decide what the basket shows once a reservation is made. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: DES-execution —

#### F-0162 · Pick-up sessions listed latest-first

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0162 | Pick-up sessions listed latest-first | 2.67 · major | 1 · one value or token | DES-execution | — |

**Problem.** The session radios are shown from Wednesday 28 down to Saturday 10 October. This duplicates F-0027 and the first part of F-0113. The nearest session, usually the one wanted, is last and least prominent; the uneven grid may look broken and slows scanning.

**Evidence.** Where: basket-html-items-drill-18v-two-day-2026-10-17 at 1280 px. E1, reproduced or measured · <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/probes/99/step-01.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Decide the session order from the member's task and one list layout that gives each label room. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: DES-hierarchy —

#### F-0155 · Pick-up sessions are listed latest first

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0155 | Pick-up sessions are listed latest first | 2.67 · major | 1 · one value or token | DES-execution | — |

**Problem.** Sessions appear from 28 October down to 10 October (duplicate of F-0060). Reversed chronology and the broken grid make picking the soonest session harder to scan and look unfinished.

**Evidence.** Where: /basket.html at 1280 px. E1, reproduced or measured · evidence/screens/basket-html-items-drill-18v-two-day-2026-10-17/default/1280-light.png, <round>/eval-20-audit-standard-tool-library/with_skill/run-4/workspace/.ui-evaluator/runs/20261009-223253-audit-standard/probes/99/step-01.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Decide one layout for the session list that keeps each session on one or two lines, in date order. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: DES-hierarchy —

#### F-0009 · Text clips under the text-spacing override in li:nth-of-type(1) > article.card > div.card__body > h2.card_

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0009 | Text clips under the text-spacing override in li:nth-of-type(1) > article.card > div.card… | 2 · minor (rule) | 1 · one value or token | A11Y-08 | Text-spacing override |

**Problem.** With line-height 1.5, paragraph spacing 2em, letter spacing 0.12em and word spacing 0.16em, text ("Cordless drill 18 V, combi, two batteries") is cut off at 1280 px (scroll 427×50 vs client 390×50).

**Evidence.** Where: /?items=ladder-3m `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px; /?items=ladder-3m [filters-open] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px; /?items=ladder-3m [no-results] `li:nth-of-type(1) > article.card > div.card__body > h2.card…` at 1280 px and 7 more. E1, reproduced or measured · evidence/crops/layout/590558f06b.png, evidence/crops/layout/bf44b73749.png, evidence/crops/layout/dcc3a9ef99.png, evidence/crops/layout/b9bfa8cd0f.png. Ratings: rule: 2.

**Recommendation.** Replace fixed heights on text containers with min-height or padding, and let text wrap. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.12 Text spacing; H2-6 Recognition rather than recall; H2-2 Match between system and the real world

### P2

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0055 | Search field sits below the entire tool list on phones | 2.33 · minor | 2 · one component or file | CW-Q2 | Is the action visible? | E1 | open |
| F-0112 | Search and filter moved below all ten tools on phones | 2.33 · minor | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0116 | No-results search shows the full tool list without an empty-state message | 2.33 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0143 | Search moves below all ten cards on phones | 2.33 · minor | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0008 | Touch-primary controls closer than 8 px: "Saturday 17 October, open" and "Reserve this to… | 2 · minor (rule) | 1 · one value or token | CMP-06 | Touch-primary targets | E1 | open |
| F-0019 | Body text closer than 16 px to the viewport edge: "Cleaning · deposit £30" | 2 · minor (rule) | 1 · one value or token | LAY-05 | Edge margin | E1 | open |
| F-0029 | Loan-length control's accessible name is its value, not its label | 2 · minor | 1 · one value or token | WCAG 1.3.1 | Info and relationships | E1 | open |
| F-0034 | Tool-card headings on the find page are at the same level as the section heading that con… | 2 · minor | 1 · one value or token | A11Y-26 | — | E1 | open |
| F-0035 | The primary 'Reserve this tool' button sits outside every landmark | 2 · minor | 1 · one value or token | A11Y-26 | — | E1 | open |
| F-0158 | Find page: tab order reaches results before the visually earlier search form | 2 · minor | 2 · one component or file | WCAG 1.3.2 | Meaningful sequence | E1 | open |
| F-0067 | Date filter is behind an icon-only Filters button | 2 · minor | 1 · one value or token | H2-6 | Recognition rather than recall | E1 | open |
| F-0074 | Reservation number looks like a membership number | 2 · minor | 1 · one value or token | H2-4 | Consistency and standards | E1 | open |
| F-0075 | Membership-number error does not say what is wrong with the number entered | 2 · minor | 2 · one component or file | H2-9 | Help users recognize, diagnose and recover from errors | E1 | open |
| F-0079 | Remove takes the tool out of the basket at once with no undo | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0084 | Three-tool limit is stated but a fourth tool is accepted | 2 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0090 | Date filter hint says 'on or after this day' but the filter keeps only tools available by… | 2 · minor | 1 · one value or token | H2-2 | Match between system and the real world | E1 | open |
| F-0105 | Date-filter results change out of view on phones | 2 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0106 | Each calendar day is a separate Tab stop and arrow keys do nothing | 2 · minor | 2 · one component or file | H2-7 | Flexibility and efficiency of use | E1 | open |
| F-0107 | A UK mobile number in +44 format is rejected | 2 · minor | 1 · one value or token | H2-5 | Error prevention | E1 | open |
| F-0161 | Sessions before the chosen pick-up day are offered | 2 · minor | 2 · one component or file | H2-4 | Consistency and standards | E1 | open |
| F-0117 | Pick-up calendar has no month or year label | 2 · minor | 2 · one component or file | DES-execution | — | E1 | open |
| F-0152 | Open loan-length list and its focused option are hidden under the fixed action bar at 375… | 2 · minor | 2 · one component or file | DES-execution | — | E1 | open |
| F-0131 | Pick-up calendar has no month label | 2 · minor | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0053 | 'Available from' date filter hint is not linked to its input | 1.67 · minor | 1 · one value or token | A11Y-13 | Forms | E1 | open |
| F-0110 | Every tool card shows the same placeholder wrench tile instead of the tool | 1.67 · minor | 3 · several components or one flow | SLP-58 | — | E1 | open |
| F-0153 | Action bar button does not line up with the content column | 1.67 · minor | 2 · one component or file | DES-execution | — | E1 | open |
| F-0140 | Every tool card uses the same wrench placeholder instead of showing the tool | 1.67 · minor | 3 · several components or one flow | DES-appeal | — | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0114 | Session radio cards wrap into a ragged one-plus-five grid | 1.33 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0163 | Orphan full-width session card above five narrow tiles | 1.33 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0154 | Basket session cards at 1280 break into one wide card over five cramped cards | 1.33 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0022 | Cramped padding: "Pressure washer, 130 bar Cleaning · depo" | 1 · cosmetic (rule) | 1 · one value or token | LAY-04 | No cramped padding | E1 | open |
| F-0092 | Removing the last tool leaves a stale error pointing to a session list that is gone | 1 · cosmetic | 2 · one component or file | H2-9 | Help users recognize, diagnose and recover from errors | E1 | open |
| F-0115 | Filter panel uses an unthemed native date input in yyyy/mm/dd and a default select | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0118 | Sticky reserve bar's button sits off the content column | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0119 | Tool details split into two lists with different label column widths | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0120 | Dark theme drops the chip ground on green availability badges only | 1 · cosmetic | 1 · one value or token | DES-coherence | — | E1 | open |
| F-0123 | No identity beyond the name in body type; no signature on any surface | 1 · cosmetic | 3 · several components or one flow | SLP-64 | — | E1 | open |
| F-0124 | Footer ends above an empty grey band on short pages | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0125 | Navigation labels wrap onto two lines on phones | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0130 | 'Added to your basket' toast overlaps the calendar weekday header | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0138 | Navigation labels break mid-phrase at 375 | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0141 | Brand identity is only the name in body type beside a stock icon | 1 · cosmetic | 3 · several components or one flow | DES-specificity | — | E1 | open |
| F-0146 | Details lists on the tool page use two different value-column offsets | 1 · cosmetic | 2 · one component or file | LAY-03 | Heading rhythm | E1 | open |
| F-0148 | 'Added to your basket' toast covers the calendar weekday header | 1 · cosmetic | 2 · one component or file | DES-execution | — | E1 | open |
| F-0156 | Grey band below the footer on short pages at 1280 | 1 · cosmetic | 2 · one component or file | DES-appeal | — | E1 | open |
| F-0157 | Short pages leave the right half of the 1280 layout empty | 1 · cosmetic | 3 · several components or one flow | DES-appeal | — | E1 | open |
| F-0151 | Dark theme: green availability badges lose their pill background | 1 · cosmetic | 1 · one value or token | DES-coherence | — | E1 | open |

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

No finding was divergent among the raters (spread below 2 everywhere). Open questions that only members can settle:
- Do first-time members understand that "Reserve this tool" only holds the tool until they confirm, or do some leave at that point?
- How often does a member on a phone leave the flow for more than ten minutes before confirming?
- Do members expect to choose a day and then a session, or one collection session only?

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | pass | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0029, F-0034, F-0053 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0027, F-0045, F-0158, F-0159 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | pass | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | pass | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001, F-0002, F-0050 |
| 1.4.4 | AA | Resize text | scripted | fail | F-0008, F-0010 |
| 1.4.5 | AA | Images of text | agent-judged | pass | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0013, F-0046 |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | fail | F-0008, F-0009 |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_applicable | — |
| 2.1.1 | A | Keyboard | scripted | fail | F-0026 |
| 2.1.2 | A | No keyboard trap | scripted | fail | F-0039 |
| 2.1.4 | A | Character key shortcuts | agent-judged | pass | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0042 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | pass | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | needs-human | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0024, F-0027, F-0045, F-0158, F-0159 |
| 2.4.4 | A | Link purpose in context | agent-judged | pass | — |
| 2.4.5 | AA | Multiple ways | agent-judged | pass | — |
| 2.4.6 | AA | Headings and labels | agent-judged | pass | — |
| 2.4.7 | AA | Focus visible | scripted | pass | — |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | fail | F-0025 |
| 2.5.1 | A | Pointer gestures | agent-judged | not_applicable | — |
| 2.5.2 | A | Pointer cancellation | scripted | pass | — |
| 2.5.3 | A | Label in name | agent-judged | fail | F-0067 |
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
| 3.3.1 | A | Error identification | scripted | fail | F-0052 |
| 3.3.2 | A | Labels or instructions | agent-judged | pass | — |
| 3.3.3 | AA | Error suggestion | agent-judged | pass | — |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | fail | F-0072 |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_applicable | — |
| 4.1.2 | A | Name, role, value | agent-judged | fail | F-0029 |
| 4.1.3 | AA | Status messages | scripted | fail | F-0031, F-0052 |

Totals by coverage: auto 1 · scripted 22 · agent-judged 22 · needs-human 9; by state: pass 25 · fail 16 · not_run 9. This matrix is not a conformance claim (QUALITY-BAR §8).

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
- Rendered effect of every candidate below is predicted from source; widths for C-code-11, C-code-12 and C-code-13 are computed from CSS, not measured. (code)
- Forced-colours and increased-contrast behaviour: no forced-colors or prefers-contrast rules exist; effect not assessable without a render. (code)
- Whether screen readers announce the 'Added to your basket' message (no screen-reader run in this role) (cw-1)
- How long the basket actually holds a tool (not stated in the UI; behaviour over time not probed) (cw-1)
- Loading/progress feedback on slow connections: the local server answers in under 100 ms, so no wait over 1 s could be observed. (he-1)
- Whether the three-tools-at-a-time limit stated on / is enforced or explained when exceeded: not probed. (he-1)
- Whether a late-return SMS is actually sent to the mobile number: outside the UI. (he-1)
- Screen-reader announcement of the 'Added to your basket' status and of the error summary: ARIA shows role=status / alert, but announcements were not heard; left to the accessibility auditor. (he-1)
- Browser Back mid-flow (confirm -> back to basket) keeping the session choice: not probed separately from the Change link. (he-1)
- Whether the yyyy/mm/dd placeholder in the 'Available from' date field follows the user's locale on real en-GB devices: the probe browser locale is unknown, so not judged. (he-1)
- Whether the basket hold expires and what happens then: no time limit is stated and none could be triggered in a probe session. (he-2)
- Whether the 'Added to your basket' toast is long enough to read for slower readers: its exact display duration was not timed. (he-2)
- Whether Escape closes the loan-length list and returns focus to its button: the probe pressed Escape after the list had already closed, so the result is inconclusive. (he-2)
- Double submission of Confirm reservation: not attempted, to avoid creating duplicate reservations. (he-2)
- Dark mode and forced-colours rendering: left to the accessibility and design roles; not inspected under this lens. (he-2)
- Basket Continue occasionally did not navigate (probes 30, 32, 42) while it did in probes 35, 40, 46, 51; could not separate an intermittent app defect from driver timing. (he-3)
- Whether inline field errors on confirm are programmatically associated with their inputs (aria-describedby); the ARIA snapshot does not expose descriptions. (he-3)
- How long the basket holds a tool ('Items are held for you while you finish'): no expiry could be triggered within a probe. (he-3)
- Behaviour when more than three tools are added (the stated limit); not probed. (he-3)
- Screen-reader announcement wording and VoiceOver/TalkBack behaviour; only Chromium ARIA snapshots were available. (he-3)
- 200% zoom/large text behaviour was not probed directly; contrast and target sizes are left to uie audit. (he-3)
- Toast fade, button hover and focus behaviour, listbox shadow and motion cannot be judged from stills. The sticky bar's overlap of the calendar may be partly a full-page-capture artefact. (critic-1)
- toast fade and button colour transitions (motion) from stills (critic-2)
- focus rings and keyboard order (critic-2)
- whether the 1280 sticky-bar overlap is partly a full-page-capture artefact (the 375 loan-open frame shows it within the first viewport) (critic-2)
- no-results behaviour beyond the still: search 'sewing machine' shows all ten cards with no empty message (critic-2)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0002, F-0009, F-0010, F-0012, F-0013 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (1 finding(s)); FUN-06 (2 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (3 finding(s)); A11Y-05 (1 finding(s)) ….
3. For L2: USE-04 (1 finding(s) with fewer than 3 ratings); USE-05 (3 open P0 finding(s)); USE-06 (39 P1 finding(s) without a recorded decision); USE-09 (interaction coverage 52% < 90%); DES-02 (0/3 critics judged it specific) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (42 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

