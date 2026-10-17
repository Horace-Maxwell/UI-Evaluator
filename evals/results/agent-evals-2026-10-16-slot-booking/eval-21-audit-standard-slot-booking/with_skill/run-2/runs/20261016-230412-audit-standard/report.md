DEGRADED: SLP-01 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-02 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-03 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-04 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-08 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-09 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-10 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-12 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-13 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-14 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-15 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-20 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-22 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-23 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-24 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-25 (no findings (partial coverage: lint did not run))

DEGRADED: SLP-27 (no findings (partial coverage: lint did not run) (catalogue soft tell, ADR-031))

DEGRADED: SLP-31 (no findings (partial coverage: lint did not run) (catalogue soft tell, ADR-031))

DEGRADED: SLP-34 (no findings (partial coverage: lint did not run) (catalogue soft tell, ADR-031))

DEGRADED: SLP-38 (no findings (partial coverage: lint did not run) (catalogue soft tell, ADR-031))

DEGRADED: SLP-39 (no findings (partial coverage: lint did not run) (catalogue soft tell, ADR-031))

DEGRADED: SLP-40 (no findings (partial coverage: lint did not run) (catalogue soft tell, ADR-031))

DEGRADED: SLP-45 (no findings (partial coverage: lint did not run) (catalogue soft tell, ADR-031))

# UI evaluation report: Dunmore recycling centre booking · run 20261016-230412-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:6131a8979c (uncommitted changes present) · run opened 2026-10-17T03:04:12.029Z |
| Input situation | live UI without source review (FRAMEWORK §14) |
| Surfaces and modes | when (operate), vehicle (operate), confirm (operate), confirm (operate), done (read), done (read) |
| Routes × states | 6 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-17T03:03:17.974Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | d9e0a9a7 d9e0a9a7 d9e0a9a7 |
| walkthrough-evaluator | 1 | subagent | claude-opus-5-5 | 73700dda |
| design-critic | 3 | subagent | claude-opus-5-5 | 399802b4 399802b4 399802b4 |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | ec826891 |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 030f32e5 70a3581e |
| finding-verifier | 4 | subagent | claude-opus-5-5 | d488c432 b5ebacd4 cbdbd1bd cb81c0f4 |
| severity-rater | 3 | subagent | claude-opus-5-5 | be525b16 d4485013 f1b70e85 |

Coverage: 540 valid capture(s); 46% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (1 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (1 finding(s)); A11Y-04 (1 finding(s)); A11Y-07 (1 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-07 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-04, A11Y-07, A11Y-11, A11Y-13, A11Y-15, A11Y-17, A11Y-27 |
| G3 Craft floor | fail | COL-01, CMP-04, CMP-05, CPY-04, I18N-03 |
| G4 Deliberateness and anti-slop | not_run | SLP-11, SLP-26, SLP-35, SLP-36, SLP-37, SLP-01 (degraded), SLP-02 (degraded), SLP-03 (degraded), SLP-04 (degraded), SLP-08 (degraded), SLP-09 (degraded), SLP-10 (degraded), SLP-12 (degraded), SLP-13 (degraded), SLP-14 (degraded), SLP-15 (degraded), SLP-20 (degraded), SLP-22 (degraded), SLP-23 (degraded), SLP-24 (degraded), SLP-25 (degraded), SLP-27 (degraded), SLP-31 (degraded), SLP-34 (degraded), SLP-38 (degraded), SLP-39 (degraded), SLP-40 (degraded), SLP-45 (degraded) |
| G5 Analytical usability | fail | USE-05, USE-06, USE-08, USE-09 |
| G6 Design quality | fail | DES-02, DES-03, DES-04, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- The dark theme is complete and coherent: body text and hints pass WCAG contrast in dark mode on every page (evidence/screens/root/date-chosen/375-dark.png). The only dark-mode failure is the "Few left" tag.
- The copy is plain and states the rules where they apply: "Choose a day and the 20-minute slot you will arrive in; the gate checks the reference and the vehicle" (root/date-chosen/375-dark.png).
- The quick day buttons (Today, Tomorrow, Saturday 17, Sunday 18) suit the evening-before booking pattern (root/date-chosen/375-dark.png).
- Error summaries move focus to role=alert on the vehicle and confirm steps (the config's `errors` states captured at 375 px).
- The step list exposes `aria-current="step"` (verifier, F-0075 rejection).

- One global :focus-visible outline built from the focus token (3px, offset 2px) covers every control except slots
- Motion matches the declared budget: only background-color on .button and opacity on .toast transition, 120 ms ease-out, both removed under prefers-reduced-motion
- Personal-data fields carry correct autocomplete tokens (name, tel, postal-code) and visible labels with hints associated through aria-describedby
- Error summary pattern: role=alert container receives focus, lists linked errors, fields get aria-invalid and associated error text
- Full slots are disabled with three cues (muted colour, ground background, 'Full' text tag) and not-allowed cursor
- Runtime colour roles reproduce the declared design.md hex values in both themes (checked by conversion) apart from the warning pair
- Check-and-book summary repeats day, 09:20 to 09:40, vehicle and waste with 'Change slot' / 'Change vehicle' links, so a first-time resident can check the booking before committing
- Field hints on the details step say why each item is asked ('For a reminder the evening before', 'To confirm you live in the district') and give a registration example

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.46 (mean Jaccard over 3 passes); an estimated 0.8 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0017 · Focus order jumps back: "08:00" → "08:20 Few left"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0017 | Focus order jumps back: "08:00" → "08:20 Few left" | 4 · catastrophe (rule) | 1 · one value or token | A11Y-03 | Keyboard |

**Problem.** After "08:00", Tab moves to "08:20 Few left", which sits 216 px above it in the same column; the focus order does not follow the visual reading order (clear-inversion heuristic).

**Evidence.** Where: / `#slots > button.slot:nth-of-type(2)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px and 14 more. E1, reproduced or measured · evidence/crops/keyboard/4be89c6678.png, evidence/crops/keyboard/2ec11cd4f9.png, evidence/crops/keyboard/c494d4a9db.png, evidence/screens/root/slot-chosen/1280-light.png. Ratings: rule: 4.

**Recommendation.** Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.4.3 Focus order; WCAG 1.3.2 Meaningful sequence; A11Y-27 No verified judged WCAG failure; H2-4 Consistency and standards; H2-6 Recognition rather than recall; H2-2 Match between system and the real world; CW-Q2 Is the action visible?; DES-hierarchy —

#### F-0036 · A second press of Book during submission records the booking as cancelled

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0036 | A second press of Book during submission records the booking as cancelled | 4 · catastrophe | 2 · one component or file | CMP-15 | — |

**Problem.** While the 1.5 s booking is pending, a second press on 'Book this slot' relabels the button 'Cancel booking'; when the wait ends the booking is saved as cancelled and the resident lands on done.html, whose heading still says 'Booked' while a smaller line says 'Status: cancelled. This booking is not on the gate's list.' Residents may arrive at the gate with a cancelled booking that the done page headed 'Booked', and be turned away.

**Evidence.** Where: /confirm.html [submitting] `#book`; /done.html [done-cancelled] `h1`. E1, reproduced or measured · app.js:1:11263, .ui-evaluator/runs/20261016-230412-audit-standard/probes/v3-F/screenshots/second-press.png, .ui-evaluator/runs/20261016-230412-audit-standard/probes/v3-F/aria.yml · found by 1 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Ignore clicks while pending (disable or aria-disabled the button); offer cancellation, if needed, as a separate action on the done page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: CMP-04 Response feedback; H2-5 Error prevention; H2-3 User control and freedom

#### F-0078 · No online way to change or cancel an existing booking by reference

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0078 | No online way to change or cancel an existing booking by reference | 3.67 · catastrophe | 4 · information architecture or architecture | H2-3 | User control and freedom |

**Problem.** Residents changing a booking know their reference. Searched: header navigation (Book a slot, Opening days) on all routes; step 1 default; confirm page; done page booked and cancelled states; footer. None offers a 'Change or cancel a booking' entry or a reference field. The done page says only 'If you cannot come, call 01632 960771 on a weekday', and the footer gives phone hours weekdays 09:00 to 17:00, while the centre opens every day except Wednesday. Residents who need to move a weekend slot on Friday evening or at the weekend cannot do it; others may book a second slot (limit two per week) instead of moving the first, and phone-only access excludes residents who cannot use the phone.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `region 'At the centre'` at 375 px. E1, reproduced or measured · <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.yml, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/evidence/aria/root/default/375-light.yml, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/50/aria.yml, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/45/aria.yml · found by 1 of 10 evaluator(s). Ratings: 3.67 (spread 1; 3, 4, 4).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P0 · Status open · Also: H2-7 Flexibility and efficiency of use

#### F-0080 · No online way to change or cancel an existing booking

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0080 | No online way to change or cancel an existing booking | 3.67 · catastrophe | 4 · information architecture or architecture | H2-3 | User control and freedom |

**Problem.** Changing the slot of an existing booking is a declared core task, and residents know their reference. No route, navigation item or control lets a resident open a booking by reference to change or cancel it; the only path offered is 'If you cannot come, call 01632 960771 on a weekday and we will free the slot.' Residents whose plans change in the evening or at the weekend (the declared times of use) cannot move the slot until a weekday phone call, and may book a second slot against the two-per-week limit or not turn up, leaving a scarce slot unused.

**Evidence.** E1, reproduced or measured · packets/heuristic-evaluator-1/inventory.json, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.yml, evidence/aria/root/default/375-light.yml, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.yml · found by 2 of 10 evaluator(s). Ratings: 3.67 (spread 1; 3, 4, 4).

**Recommendation.** Offer a 'Change or cancel a booking' entry that takes the reference. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P0 · Status open · Also: ISO 9241-110 suitability for the task —; H2-7 Flexibility and efficiency of use

### P1

#### F-0001 · axe color-contrast: Elements must meet minimum color contrast ratio thresholds

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0001 | axe color-contrast: Elements must meet minimum color contrast ratio thresholds | 3 · major (rule) | 1 · one value or token | A11Y-01 | axe-core with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wca… |

**Problem.** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds (serious impact). Fix any of the following: Element has insufficient color contrast of 3.02 (foreground color: #bd7d0f, background color: #fbefda, font size: 12.0pt (16px), font weight: bold). Expected contrast ratio of 4.5:1

**Evidence.** Where: / [date-chosen] `button[data-slot="08:20"] > .slot__tag--few.slot__tag` at 1280 px; / [date-chosen] `button[data-slot="08:40"] > .slot__tag--few.slot__tag` at 1280 px; / [date-chosen] `button[data-slot="09:00"] > .slot__tag--few.slot__tag` at 1280 px and 20 more. E1, reproduced or measured · evidence/crops/axe/b86bafb1c5.png, evidence/crops/axe/59c812bf19.png, evidence/crops/axe/40aa32265b.png, evidence/crops/axe/20d592f2e4.png. Ratings: rule: 3.

**Recommendation.** Elements must meet minimum color contrast ratio thresholds (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.3 Contrast, minimum; A11Y-11 Text contrast ≥ 4.5

#### F-0009 · Horizontal page overflow on /

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0009 | Horizontal page overflow on / | 3 · major (rule) | 1 · one value or token | FUN-05 | No horizontal page overflow at any matrix width |

**Problem.** scrollWidth 335 px > clientWidth 320 px at 320 px. Widest offender: #slots > div.slots__head:nth-of-type(1) extends 15 px past the viewport; 10 more.

**Evidence.** Where: / `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px and 1 more. E1, reproduced or measured · evidence/crops/layout/d0feed3b9b.png, evidence/crops/layout/b1c65f8268.png, evidence/crops/layout/36425b0e42.png, app.js:1:5604. Ratings: rule: 3.

**Recommendation.** Constrain the element (max-width: 100%, min-width: 0 on flex and grid children, overflow-wrap: anywhere) or give genuinely 2-D content its own scroll region and declare it in two_d_regions. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: A11Y-07 Reflow at 320 CSS px without two-dimensional scrolling; WCAG 1.4.10 Reflow

#### F-0016 · No visible focus indicator: "08:00"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0016 | No visible focus indicator: "08:00" | 3 · major (rule) | 1 · one value or token | A11Y-04 | Focus visible |

**Problem.** Tab focus on "08:00" changes 0 pixels within its box + 4 px (focused vs blurred crop), so no focus position is visible.

**Evidence.** Where: / `#slots > button.slot:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(6)` at 320 px and 2 more. E1, reproduced or measured · evidence/keyboard/root/default/320-light/stop-9-focused.png, evidence/keyboard/root/date-chosen/320-light/stop-3-focused.png, evidence/keyboard/root/slot-chosen/320-light/stop-1-focused.png, evidence/keyboard/root/default/320-light/stop-9-blurred.png. Ratings: rule: 3.

**Recommendation.** Give every focusable element a :focus-visible indicator from the focus tokens (e.g. a 2 px outline with offset); never remove outline without a replacement. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.7 Focus visible; H2-1 Visibility of system status; H2-4 Consistency and standards; CMP-08 —

#### F-0018 · No progress shown during a 1.2 s operation: "Car with trailer"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0018 | No progress shown during a 1.2 s operation: "Car with trailer" | 3 · major (rule) | 2 · one component or file | CMP-04 | Response feedback |

**Problem.** "Car with trailer" runs for about 1202 ms; operations over 1 s must show progress, but nothing animated, no progressbar and no aria-busy region appears while it runs.

**Evidence.** Where: /vehicle.html?date=2026-10-17&slot=09:20 `#vehicle > button:nth-of-type(2)` at 1280 px. E1, reproduced or measured · evidence/crops/states/dc5af67435.png. Ratings: rule: 3.

**Recommendation.** Show an animated indicator where the result will appear (or in the control) after about 1 s, with text saying what is happening (CMP-10). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0021 · Cancelled booking page keeps the heading 'Booked' and the 'show this at the gate' instructions

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0021 | Cancelled booking page keeps the heading 'Booked' and the 'show this at the gate' instruc… | 3 · major | 2 · one component or file | WCAG 2.4.6 | Headings and labels |

**Problem.** On /done.html with status=cancelled the h1 still reads 'Booked'. The cancellation appears only as a bold red line, 'Status: cancelled. This booking is not on the gate's list.', followed by the unchanged 'Show this at the gate…' and 'A reminder will be sent to your mobile the evening before.' The heading contradicts the status, and screen-reader users navigating by headings hear 'Booked'. A resident may drive to the centre with a cancelled booking and be turned away.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `main h1` at 1280 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `main` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `role=heading[level=1]` at 375 px and 3 more. E1, reproduced or measured · evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light-cvd-achromatopsia.png, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light.yml, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.yml, evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.png · found by 6 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Make the h1 follow the status ('Booking cancelled'), drop the gate and reminder instructions for cancelled bookings, and offer 'Book another slot' as the main action. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: A11Y-27 No verified judged WCAG failure; H2-1 Visibility of system status; H2-4 Consistency and standards; DES-execution —

#### F-0022 · Expired-hold error gives no way forward and blanks the slot the resident had chosen

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0022 | Expired-hold error gives no way forward and blanks the slot the resident had chosen | 3 · major | 2 · one component or file | WCAG 3.3.3 | Error suggestion |

**Problem.** When the hold has expired, the first press of Book this slot shows the summary 'There is a problem / This slot is no longer available.' as plain text with no next step, while the field-error summary items on the same page are links to the fields. At the same time the Slot row in 'Your booking' changes to '—', so the resident can no longer see which slot was lost (a screen reader reads it as 'dash'). Only a second press of Book this slot replaces the item with a link 'Choose a slot'. The details the resident typed are kept. Older residents and screen-reader users are left at a dead end on the step that completes the booking.

**Evidence.** Where: /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired [expired] `[role=alert]` at 1280 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired [expired] `role=alert` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired [expired] `role=alert` at 375 px and 5 more. E1, reproduced or measured · evidence/screens/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/1280-light.png, evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/1280-light.yml, evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/375-light.yml, evidence/screens/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/375-light.png · found by 6 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Word it as 'Your hold on 09:20 on Saturday 17 October ran out and the slot has been taken. Choose another slot.' with 'Choose another slot' as a link (the existing change-slot route keeps the details), and keep the lost time visible in the summary. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: A11Y-27 No verified judged WCAG failure; H2-9 Help users recognize, diagnose and recover from errors; H2-6 Recognition rather than recall; CPY-04 Error-message quality; H2-1 Visibility of system status; CW-Q1 Does the effect of the action match the user’s goal?; CW-Q4 Will the user understand the feedback?; WCAG 2.2.1 Timing adjustable; H2-5 Error prevention; DES-execution —

#### F-0023 · The slot hold is a hidden time limit: no duration, countdown or warning anywhere in the flow

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0023 | The slot hold is a hidden time limit: no duration, countdown or warning anywhere in the f… | 3 · major | 3 · several components or one flow | H2-1 | Visibility of system status |

**Problem.** A chosen slot is held for a limited time (the expired state proves the hold can lapse before 'Book this slot'), but no page states how long the hold lasts, shows time remaining, or warns before it ends; the context notes residents do not know how long a slot is held. Residents who type slowly, use a screen reader or switch tasks (the scene is 'often while doing something else') are the ones most likely to lose the slot. Whether this fails 2.2.1 depends on the actual hold length (exempt only if 20 hours or more) and on whether the real-time exception applies to a shared slot; that could not be measured from the packet, so 2.2.1 is put on the needs-human list. Loss of the scarce slot at the last step, with the dead-end error in a11y-03.

**Evidence.** Where: /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden `main`; /vehicle.html?date=2026-10-17&slot=09:20 `main`. E1, reproduced or measured · evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/errors/1280-light.yml, evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/1280-light.yml, .ui-evaluator/runs/20261016-230412-audit-standard/probes/35/screenshots/confirm-start.png, .ui-evaluator/runs/20261016-230412-audit-standard/probes/35/screenshots/confirm-150s.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** State the hold when the slot is chosen ('We hold 09:20 for you for 15 minutes'), warn at least 20 seconds before it ends with a one-action 'Keep holding' control, and announce the warning through a role=status region. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P1 · Status open · Also: WCAG 2.2.1 Timing adjustable

#### F-0024 · Booked page does not repeat the day, time or vehicle, so the resident must remember them

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0024 | Booked page does not repeat the day, time or vehicle, so the resident must remember them | 3 · major | 2 · one component or file | H2-6 | Recognition rather than recall |

**Problem.** /done.html (status=booked) shows only the reference DR-204117, gate instructions and 'Book another slot'. The day, the 20-minute slot and the vehicle (all on the URL and on the confirm page) are not shown. This is the screen residents are told to show at the gate from their phone, where signal is poor; they must remember when to arrive across screens and days. A cognitive-accessibility memory bridge. Residents who forget the time arrive outside their slot and are turned away; older residents relying on the phone screen are hit hardest.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `main` at 1280 px; /done.html [default (after booking)] `role=region[name="Your reference"]` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `region "Your reference"` at 375 px and 3 more. E1, reproduced or measured · evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/1280-light.yml, probes/6/screenshots/done.png, probes/6/aria.yml, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.yml · found by 6 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Show 'Saturday 17 October, 09:20 to 09:40, car, garden waste' directly under the reference, in the same large type block the gate attendant reads. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CW-Q4 Will the user understand the feedback?; H2-1 Visibility of system status; DES-hierarchy —

#### F-0033 · Permit number is not checked on the vehicle step; the format error appears only after booking is attempted

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0033 | Permit number is not checked on the vehicle step; the format error appears only after boo… | 3 · major | 2 · one component or file | CMP-18 | — |

**Problem.** Errors should be caught where the field is. vehicle.html's Next handler validates vehicle and waste but not the permit, and saves any value, including an empty one. The DRC- plus five digits check runs only on the confirm page, after the 1.5 s booking wait, as an error-summary item on a page that has no permit field. Van and trailer owners fill in all their details, press Book, and only then learn the permit is missing or wrong, and must go back a step to fix it.

**Evidence.** Where: /vehicle.html [vehicle-permit] `#permit`; /confirm.html [error] `#error-summary`; /vehicle.html?date=2026-10-17&slot=09:20 [van] `#permit` at 375 px and 3 more. E1, reproduced or measured · app.js:1:12037, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/15/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/18/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/21/final.png · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Validate the permit in the vehicle step's Next handler with an inline error and summary link to #permit. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-5 Error prevention; WCAG 3.3.1 Error identification; H2-9 Help users recognize, diagnose and recover from errors

#### F-0035 · Today's slots that can no longer be booked are shown as free and selectable

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0035 | Today's slots that can no longer be booked are shown as free and selectable | 3 · major | 2 · one component or file | CMP-18 | — |

**Problem.** design.md: 'Do show a slot as free only when it is.' x() renders today's slots from the generator with no time filter, so early slots (before 10:35 in this build) show as free and can be chosen. Only the confirm page's Book handler rejects them, after details are entered and the 1.5 s wait: 'The HH:MM slot today can no longer be booked.' Residents booking for today can pick a slot, complete two more steps, and then be told at the end that it was never available.

**Evidence.** Where: / `#slots .slot`; /confirm.html [error] `#error-summary`. E1, reproduced or measured · app.js:1:11909, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/46/screenshots/today-0800-free.png, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/46/screenshots/after-book.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Apply the same cut-off when rendering today's slots: mark them unavailable with a 'Passed' tag. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-5 Error prevention; design.md Do's and Don'ts: show a slot as free only when it is —

#### F-0037 · Book button gives no visible sign of the 1.5 s submission

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0037 | Book button gives no visible sign of the 1.5 s submission | 3 · major | 2 · one component or file | CMP-10 | — |

**Problem.** Waits over about a second need visible progress (CMP-10). On a valid press, #book only gets aria-busy="true"; its label, style and the page stay unchanged for 1.5 s, and no CSS targets [aria-busy]. Residents see nothing happen and are likely to press again, which triggers the cancellation path in code-12.

**Evidence.** Where: /confirm.html [submitting] `#book`; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden,wood [submitting] `role=button[name="Book this slot"]` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden `#book` at 375 px. E1, reproduced or measured · app.js:1:11638, .ui-evaluator/runs/20261016-230412-audit-standard/probes/v3-E/screenshots/before-book.png, .ui-evaluator/runs/20261016-230412-audit-standard/probes/v3-E/screenshots/book-700ms.png, probes/6/ · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Change the label to 'Booking…' and style the busy state while pending. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-12 —; H2-1 Visibility of system status; CW-Q4 Will the user understand the feedback?

#### F-0038 · The five-minute slot hold is never shown, warned about or extendable

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0038 | The five-minute slot hold is never shown, warned about or extendable | 3 · major | 3 · several components or one flow | WCAG 2.2.1 | Timing adjustable |

**Problem.** A time limit must be stated and adjustable or extendable (WCAG 2.2.1). Selecting a slot stores hold_started; G() treats the hold as expired after 5 minutes, checked only when Book's timer fires, which then clears the slot. No page states the limit, shows time remaining, warns before expiry, or offers more time. Residents who take time over the vehicle and details steps (looking up a permit or registration) may lose their slot at the last press with no warning.

**Evidence.** Where: / [slot-selected] `#slots .slot`; /confirm.html [hold-expired] `#error-summary`; /vehicle.html?date=2026-10-17&slot=09:20 `main` at 375 px and 4 more. E1, reproduced or measured · app.js:1:4087, .ui-evaluator/runs/20261016-230412-audit-standard/probes/35/probe.json, .ui-evaluator/runs/20261016-230412-audit-standard/probes/35/screenshots/confirm-320s-before-book.png, .ui-evaluator/runs/20261016-230412-audit-standard/probes/35/screenshots/after-book-1.png · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** State the hold on the vehicle and confirm steps, warn before it ends and let the resident extend it. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P1 · Status open · Also: H2-1 Visibility of system status; CW-Q1 Does the effect of the action match the user’s goal?; CW-Q4 Will the user understand the feedback?; H2-9 Help users recognize, diagnose and recover from errors; H2-5 Error prevention

#### F-0081 · No page states how long a chosen slot is held

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0081 | No page states how long a chosen slot is held | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** When a scarce resource is reserved temporarily, the user needs to know how long they have. The booking can expire ('This slot is no longer available.'), but no route or state mentions a hold, a time limit or a countdown. Residents booking while doing something else (the declared context) may pause, for example to fetch a permit number, and lose the slot without warning.

**Evidence.** E1, reproduced or measured · <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/evidence/aria/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/5/, .ui-evaluator/runs/20261016-230412-audit-standard/probes/35/screenshots/confirm-320s-before-book.png, .ui-evaluator/runs/20261016-230412-audit-standard/probes/48/aria.yml · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** State the hold time once the slot is chosen, e.g. on the vehicle and confirm steps. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P1 · Status open · Also: H2-5 Error prevention

#### F-0048 · Permit number field stays visible and unexplained after 'Car' is chosen

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0048 | Permit number field stays visible and unexplained after 'Car' is chosen | 2.67 · major | 1 · one value or token | CW-Q4 | Will the user understand the feedback? |

**Problem.** Fields that do not apply should not appear required. On /vehicle.html the 'Permit number' field ('Starts DRC-, then five digits.') shows before any vehicle is chosen and remains unchanged after 'Car' is pressed, with no 'only for vans and trailers' text beside it. The rule is only in a panel behind an icon-only (i) button named 'About vans and trailers'. Next proceeds with the field empty. A car owner without a permit may think they need one and stop to apply for a permit they do not need, or abandon the booking.

**Evidence.** Where: /vehicle.html?date=2026-10-17&slot=09:20 [car chosen] `role=textbox[name="Permit number"]` at 375 px. E1, reproduced or measured · probes/4/screenshots/car-chosen.png, probes/8/aria.yml, probes/4/, .ui-evaluator/runs/20261016-230412-audit-standard/probes/v3-A/screenshots/car-1700ms.png · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** Show the permit field only for 'Car with trailer' and 'Van', with the permit rule in visible text. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: CW-Q1 Does the effect of the action match the user’s goal?; H2-6 Recognition rather than recall

#### F-0055 · Permit number field is shown to every resident, before and regardless of the vehicle chosen

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0055 | Permit number field is shown to every resident, before and regardless of the vehicle chos… | 2.67 · major | 1 · one value or token | H2-5 | Error prevention |

**Problem.** A field that applies only to vans and trailers should say so or appear only when needed. The 'Permit number' field with 'Starts DRC-, then five digits.' is visible in the default state before any vehicle is chosen and is identical in the Van state; the field itself does not say it is only for vans and trailers (that is only inside the collapsed 'About vans and trailers' panel). First-time residents bringing a car may think they need a permit they do not have and stop or call the helpline; residents with a van are not told at the field where the permit comes from.

**Evidence.** Where: /vehicle.html?date=2026-10-17&slot=09:20 `#permit` at 375 px; /vehicle.html?date=2026-10-17&slot=09:20 [van] `#permit` at 375 px; /vehicle.html?date=2026-10-17&slot=09:20 `#permit` at 375 px and 3 more. E1, reproduced or measured · evidence/aria/vehicle-html-date-2026-10-17-slot-09-20/default/375-light.yml, evidence/aria/vehicle-html-date-2026-10-17-slot-09-20/van/375-light.yml, evidence/screens/vehicle-html-date-2026-10-17-slot-09-20/default/375-light.png, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/5/ · found by 6 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** Label the field as only for vans and cars with trailers, or show it once one of those is chosen. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-2 Match between system and the real world; H2-8 Aesthetic and minimalist design; DES-brandfit —; DES-execution —

#### F-0063 · Returning to the slot page resets the day to Today and hides the chosen slot

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0063 | Returning to the slot page resets the day to Today and hides the chosen slot | 2.67 · major | 2 · one component or file | H2-6 | Recognition rather than recall |

**Problem.** When a user goes back to change or check the slot, the page should open on the day and slot already chosen. Both 'Change slot' on the confirm page and 'Back to the slots' on the vehicle page open the slot page with 'Today' (Monday 12 October) pressed and no slot selected, although Saturday 17 at 09:20 was chosen. The user has to find and re-select the day before they can see or change the slot. Residents moving a slot to the afternoon of the same day must redo the day choice and wait for slots to reload; a resident who only wanted to check the time sees a different day and may think the booking changed.

**Evidence.** Where: /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden,wood `role=link[name="Change slot"]` at 375 px; /vehicle.html?date=2026-10-17&slot=09:20 `role=link[name="Back to the slots"]` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden `dd:nth-of-type(2) > a` at 375 px and 1 more. E1, reproduced or measured · <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/7/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/27/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/5/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-230412-audit-standard/probes/17/aria.yml · found by 2 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** Open the slot page on the booking's day with the current slot pressed. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-3 User control and freedom

#### F-0015 · Status message not announced: "20 slots free on Monday 12 October"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0015 | Status message not announced: "20 slots free on Monday 12 October" | 2 · minor (rule) | 1 · one value or token | A11Y-15 | Status messages from async actions are exposed through `role=status… |

**Problem.** After Today, the message "20 slots free on Monday 12 October" appeared without moving focus, but its live region (#slots-status) was inserted together with the text; screen readers only announce changes to regions that already exist. Screen readers do not announce the outcome.

**Evidence.** Where: / `#slots-status` at 1280 px; / [date-chosen] `#slots-status` at 1280 px; / `#slots-status`. E1, reproduced or measured · evidence/crops/live-regions/86e7793db0.png, evidence/crops/live-regions/029daa463c.png, app.js:1:6564. Ratings: rule: 2.

**Recommendation.** Render one persistent, initially empty role="status" region (role="alert" for errors) with the page, and write the message text into it. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 4.1.3 Status messages

#### F-0019 · Layout shift above the 0.1 budget on /

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0019 | Layout shift above the 0.1 budget on / | 2 · minor (rule) | 2 · one component or file | FUN-07 | Lab Cumulative Layout Shift over load + scripted interactions |

**Problem.** Lab CLS 0.169 at 320 px over load, a full scroll and one click (budget ≤ 0.1). The largest shift moved #opening (0.169). Lab values from one local run on this machine; they vary between runs and are not field data. FUN-08 (LCP, INP) is advisory and never fails the gate.

**Evidence.** Where: / `#opening` at 320 px; / [date-chosen] `#opening` at 320 px; / [slot-chosen] `#opening` at 320 px. E1, reproduced or measured · evidence/crops/vitals/dd0bb54507.png, evidence/crops/vitals/6700d336fa.png, evidence/vitals/root/default/320-light.json, evidence/vitals/root/date-chosen/320-light.json. Ratings: rule: 2.

**Recommendation.** Reserve space for late content (width and height on media, min-height on injected regions); insert new content below the viewport or in response to input. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open

### P2

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0034 | Booking-time errors in the error summary have no link to where they can be fixed | 2.33 · minor | 2 · one component or file | CMP-18 | — | E1 | open |
| F-0056 | Permit help sits behind an unlabelled info icon that looks like a fourth vehicle option | 2.33 · minor | 2 · one component or file | H2-10 | Help and documentation | E1 | open |
| F-0028 | Slot list shows no loading state while a day's slots are fetched | 2 · minor | 2 · one component or file | CMP-05 | Data states exist | E1 | open |
| F-0031 | Single-choice groups (day, slot, vehicle) are built as independent toggle buttons | 2 · minor | 3 · several components or one flow | A11Y-25 | — | E1 | open |
| F-0040 | 'Few left' tag colours drift from the warning token to a lighter amber with low text cont… | 2 · minor | 1 · one value or token | COL-01 | Token conformance | E1 | open |
| F-0042 | Vehicle-step error-summary links point to containers that cannot take focus | 2 · minor | 1 · one value or token | CMP-18 | — | E1 | open |
| F-0045 | 'Few left' badge on a single 20-minute slot has no clear meaning | 2 · minor | 2 · one component or file | CW-Q3 | Will the user recognize the action as the correct one? | E1 | open |
| F-0046 | Vehicle step does not show the day and time just chosen | 2 · minor | 2 · one component or file | CW-Q4 | Will the user understand the feedback? | E1 | open |
| F-0057 | Permit explanations say 'apply on the council site' without a link or where to go | 2 · minor | 1 · one value or token | H2-10 | Help and documentation | E1 | open |
| F-0060 | Waste has no change link on the confirm summary; 'Change vehicle' does not say it also co… | 2 · minor | 1 · one value or token | H2-4 | Consistency and standards | E1 | open |
| F-0087 | Info button styled as a fourth vehicle option; vehicle control not segmented | 1.67 · minor | 2 · one component or file | DES-coherence | — | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0041 | Waste-limit hint is attached to a generic div, so the checkboxes do not expose it | 1 · cosmetic | 1 · one value or token | A11Y-13 | Forms | E1 | open |
| F-0086 | Slot grid fixed at seven columns instead of filling the width | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |

### Advisory observations (not counted)

Measured by the deterministic checks against advisory rules, which gate nothing. They are listed for information and are not findings; one becomes a finding only when an inspector reports the same problem (ADR-038).

| ID | Observation | Rule | Instances | Routes |
|---|---|---|---|---|
| F-0003 | Weak by APCA, passes WCAG: "Choose a day and the 20-minute slot you " | COL-14 | 3 | / |
| F-0004 | Weak by APCA, passes WCAG: "Choose everything you have loaded. Rubbl" | COL-14 | 4 | /vehicle.html?date=2026-10-17&slot=09:20 |
| F-0005 | Weak by APCA, passes WCAG: "The vehicle you are bringing, like AB12 " | COL-14 | 6 | /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden |
| F-0006 | Weak by APCA, passes WCAG: "The vehicle you are bringing, like AB12 " | COL-14 | 2 | /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired |
| F-0007 | Weak by APCA, passes WCAG: "Dunmore recycling centre, Quarry Road, D" | COL-14 | 1 | /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked |
| F-0008 | Weak by APCA, passes WCAG: "Status: cancelled. This booking is not o" | COL-14 | 2 | /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled |
| F-0011 | One word on the last line: "Your vehicle and waste" | TYP-15 | 5 | /vehicle.html?date=2026-10-17&slot=09:20 |
| F-0012 | One word on the last line: "The vehicle you are bringing, like AB12 " | TYP-15 | 6 | /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden |
| F-0013 | One word on the last line: "The vehicle you are bringing, like AB12 " | TYP-15 | 2 | /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired |
| F-0014 | One word on the last line: "Status: cancelled. This booking is not o" | TYP-15 | 1 | /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled |

### Design notes (not counted)

The design critics' remarks on appeal, identity and finish that name no harm to the product's users and no PRODUCT.md or DESIGN.md line they break. They are for the owner's judgement, were not verified or rated, and count toward nothing; one becomes a finding when an inspector reports the same problem (ADR-040).

| ID | Note | Critics | Routes |
|---|---|---|---|
| F-0090 | No consistent content width; bare band under the footer on done | 2 | /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired, /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden, /, /done.html |
| F-0091 | Plain tips into bare: no focal point on the booking steps | 1 | /, /vehicle.html?date=2026-10-17&slot=09:20 |
| F-0092 | Faint selected states and mismatched option styles | 1 | /, /vehicle.html?date=2026-10-17&slot=09:20 |
| F-0093 | Small detailing lapses: stepper wrap, cramped back link, duplicated date, tinted unchecke… | 1 | /, /vehicle.html?date=2026-10-17&slot=09:20 |
| F-0099 | No identity beyond the council name in body text; no focal point or signature on any step | 2 | /, /done.html, /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled |

## 5. Divergent and disputed findings: questions for user research

The raters did not diverge on any finding (0 divergent). Open questions for residents:
- Does "Few left" mean anything for a slot that holds one vehicle (F-0045)? Would residents rather see the slots in plain time order?
- Do residents on phones double-tap "Book this slot" when nothing happens for 1.5 s? A short observed test would show how often F-0036 bites.

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | not_run | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0031, F-0041 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0017 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | not_run | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | not_run | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001, F-0040 |
| 1.4.4 | AA | Resize text | scripted | pass | — |
| 1.4.5 | AA | Images of text | agent-judged | not_run | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0009 |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | pass | — |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_run | — |
| 2.1.1 | A | Keyboard | scripted | pass | — |
| 2.1.2 | A | No keyboard trap | scripted | pass | — |
| 2.1.4 | A | Character key shortcuts | agent-judged | not_run | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0022, F-0023, F-0038, F-0047 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | not_run | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | agent-judged | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0017, F-0042 |
| 2.4.4 | A | Link purpose in context | agent-judged | not_run | — |
| 2.4.5 | AA | Multiple ways | agent-judged | not_run | — |
| 2.4.6 | AA | Headings and labels | agent-judged | fail | F-0021 |
| 2.4.7 | AA | Focus visible | scripted | fail | F-0016 |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | pass | — |
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
| 3.3.1 | A | Error identification | scripted | fail | F-0033 |
| 3.3.2 | A | Labels or instructions | agent-judged | not_run | — |
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0022 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | not_run | — |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_run | — |
| 4.1.2 | A | Name, role, value | agent-judged | not_run | — |
| 4.1.3 | AA | Status messages | scripted | fail | F-0015 |

Totals by coverage: auto 1 · scripted 22 · agent-judged 23 · needs-human 8; by state: pass 17 · fail 11 · not_run 27. This matrix is not a conformance claim (QUALITY-BAR §8).

## 7. Not assessed

- A11Y-06 Modal dialogs: focus moves in, Tab wraps inside, Esc closes, focus returns to the invoker; correct dialog semantics: not_applicable — no modal dialog in scope (dialogs check found none to exercise)
- A11Y-17 Pointer and keyboard static checks: no down-event-only activation, no unmodified single-character shortcuts without a remap or off switch, dragging has a single-pointer alternative, motion actuation has an alternative: not_run — the lint check did not run
- I18N-01 Explicit CJK font stack: not_applicable — no CJK locale or CJK text in scope
- I18N-02 Regional families: not_applicable — no CJK locale or CJK text in scope
- I18N-03 Restricted fonts not self-hosted (all locales): not_run — the lint check did not run
- DEC-03 Direction record for new work or redesigns: not_applicable — no new direction in scope (project.work = existing)
- DEC-04 Ledger variety for new work: not_applicable — no new direction in scope
- SLP-11 Simulated liveness: not_run — the lint check did not run
- SLP-26 Motion clichés: image hover zoom, uniform hover-scale on unrelated elements, > 1 simultaneous hover property change: not_run — the lint check did not run
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
- SLP-35 Blueprint and grain textures: not_run — the lint check did not run
- SLP-36 Costume block shadow: not_run — the lint check did not run
- SLP-37 Generic or generated imagery: not_run — the lint check did not run
- Whether the inline end-of-body DR.init() sets colours before first paint (possible flash of unstyled colours) needs a rendered trace. (code)
- Rendered contrast values for code-16 are computed from the HSL source, not measured; the contrast check should confirm. (code)
- Hypothesis (H3/H6): 'Change slot' and 'Back to the slots' link to index.html with no query, and 'Change vehicle' links to vehicle.html with no date/slot query (confirm and vehicle ARIA). They may drop the chosen day, slot, vehicle, waste or entered details. Not probed (Bash denied). (he-1)
- Hypothesis (H1/H5): on root/default the Today button is pressed for Monday 12 October and slots from 08:00 are enabled; if the app's clock is 10:05 (journey start_state), slots already in the past may be bookable. App clock at capture time unknown; not probed. (he-1)
- Hypothesis (H1): whether clicking a slot or a day gives immediate feedback, and whether slots take a moment to appear without a loading indicator (journey persona note). Needs probe timing. (he-1)
- Hypothesis (H5): what 'Next' on / does with no slot chosen; what 'Book this slot' does on double submit; whether the Permit number field validates the DRC- format or is required for vans. Not probed. (he-1)
- Hypothesis (H1): in root/slot-chosen at 375 the Tomorrow button is drawn with a tinted fill similar to the pressed Saturday 17 button, while ARIA marks only Saturday 17 pressed. May be a hover/focus capture artefact; needs probe to confirm. (he-1)
- Hypothesis (H3): 'Another day' control behaviour (date picker or list) not observable from captures. (he-1)
- Hypothesis (H9): expired-state recovery: whether 'Change slot' from the expired state keeps the kept details and returns the user to the same day. (he-1)
- Past slots on Today: on Monday 12 October the 08:00-10:00 slots are offered as selectable and 08:00 proceeds to vehicle.html (probe 10). The journey says the time is 10:05, but the app's clock is not visible, so I cannot confirm these slots are in the past. (he-2)
- Double submission: pressing Book this slot twice within 200 ms, and again after Back from done.html, returned the same reference DR-265532 (probe 22); whether the server would create two bookings in a real backend cannot be observed. (he-2)
- Behaviour of a real hold timer (how long a slot is held before the expired state) cannot be triggered except via the hold=expired fixture parameter. (he-2)
- Whether past slots for Today (e.g. 08:00 at 10:05) can be booked: app clock time unknown, not probed to completion. (he-3)
- Double submission of 'Book this slot' not probed. (he-3)
- Dark mode and 200% zoom reviewed only via captured screenshots, not probed; contrast left to tools. (he-3)
- Screen-reader announcement of the slot-load result and of the 'Choose a slot first.' alert not verified with a real screen reader (alert role present in ARIA). (he-3)
- Motion (120 ms fades), focus rings, hover and keyboard behaviour cannot be judged from stills. No baseline screenshots, so pairwise is not applicable. (critic-2)
- No baseline, so no pairwise comparison. Stills cannot show focus order, the 'Another day' picker, hold timing or motion. Vehicle default and car-selected states were not separately inspected for the permit field. (critic-3)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0009, F-0015, F-0016, F-0017, F-0018 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (1 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (1 finding(s)); A11Y-04 (1 finding(s)) ….
3. For L2: USE-05 (4 open P0 finding(s)); USE-06 (18 P1 finding(s) without a recorded decision); USE-08 (2 top task(s) not completable); USE-09 (interaction coverage 46% < 90%); DES-02 (0/3 critics judged it specific) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (22 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

