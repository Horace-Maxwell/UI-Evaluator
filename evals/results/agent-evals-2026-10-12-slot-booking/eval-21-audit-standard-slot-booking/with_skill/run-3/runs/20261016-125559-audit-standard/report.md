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

# UI evaluation report: Dunmore recycling centre booking · run 20261016-125559-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:aa813b623e (uncommitted changes present) · run opened 2026-10-16T16:55:59.050Z |
| Input situation | live UI without source review (FRAMEWORK §14) |
| Surfaces and modes | when (operate), vehicle (operate), confirm (operate), confirm (operate), done (read), done (read) |
| Routes × states | 6 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-16T16:55:32.194Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | 169f5251 169f5251 169f5251 |
| walkthrough-evaluator | 1 | subagent | claude-opus-5-5 | 57ba7099 |
| design-critic | 3 | subagent | claude-opus-5-5 | 72f16a43 72f16a43 72f16a43 |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 90f8f38d |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 030f32e5 0ce08988 |
| finding-verifier | 4 | subagent | claude-opus-5-5 | 735a9b42 8b7cd339 ac2913dd 6aa03094 |
| severity-rater | 3 | subagent | claude-opus-5-5 | 074f6d8b c574cac3 aa756f2b |

Coverage: 540 valid capture(s); 32% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (1 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (2 finding(s)); A11Y-04 (2 finding(s)); A11Y-07 (2 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-07 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-04, A11Y-07, A11Y-11, A11Y-12, A11Y-13, A11Y-15, A11Y-17, A11Y-27 |
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

Each strength is seen at a width and theme the audit ran:
- Error summaries name every problem in plain words, link to the field, give a valid example ("Enter a UK mobile number, like 07700 900123") and keep typed values. Seen on confirm/errors at 375 light; typed values survive the expired state (confirm expired, 375).
- Fields say why personal data is asked ("For a reminder the evening before", "To confirm you live in the district"). Seen on confirm/default at 375 px.
- The confirm summary restates the 20-minute window (09:20 to 09:40) with a change link per item. Change slot and Change vehicle keep the vehicle, the waste and typed details (probes 11 and 31 at 375).
- Full and Few-left slots carry their state in words, not colour alone, and toggles expose pressed, disabled and expanded states (root/slot-chosen ARIA).
- The quick-day buttons use residents' words ("Tomorrow", "Saturday 17"). The closed-Wednesday case is explained in place.
- The dark theme renders cleanly at 375 px (root/slot-chosen/375-dark.png). The one contrast failure in dark is the "Few left" tag.

- Error summaries take focus and their links move focus to the field (vehicle page Tab after link lands on 'Car')
- Details, vehicle and waste are kept across 'Change slot' and after an expired hold
- Slot availability carries text ('Few left', 'Full'), so it survives all four CVD simulations and forced colours
- 'Another day' and the vans info control are native buttons with aria-expanded; focus moves into the date field when it opens
- Shared :focus-visible outline (3 px, focus token, 2 px offset) for every control except the slot buttons
- Motion limited to 120 ms colour and opacity fades with a reduced-motion path, as DESIGN.md specifies
- Personal-data fields on the confirm step carry autocomplete tokens (name, tel, postal-code), visible labels and aria-describedby hints and errors
- Hover, active and pressed states exist for every button variant, slot, segmented button and icon button, and run-time colours match the declared light and dark role values

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.37 (mean Jaccard over 3 passes); an estimated 1.8 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0017 · Focus order jumps back: "08:00" → "08:20 Few left"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0017 | Focus order jumps back: "08:00" → "08:20 Few left" | 4 · catastrophe (rule) | 2 · one component or file | A11Y-03 | Keyboard |

**Problem.** After "08:00", Tab moves to "08:20 Few left", which sits 216 px above it in the same column; the focus order does not follow the visual reading order (clear-inversion heuristic).

**Evidence.** Where: / `#slots > button.slot:nth-of-type(2)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px. E1, reproduced or measured · evidence/crops/keyboard/4be89c6678.png, evidence/crops/keyboard/2ec11cd4f9.png, evidence/crops/keyboard/c494d4a9db.png. Ratings: rule: 4.

**Recommendation.** Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.4.3 Focus order

#### F-0030 · A second tap on Book this slot while it is pending saves the booking as cancelled

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0030 | A second tap on Book this slot while it is pending saves the booking as cancelled | 4 · catastrophe | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Repeating an action while it is pending should be ignored or harmless. While the 1.5 s booking timer runs, a further click sets a flag and relabels the button 'Cancel booking'. When the timer fires, the label reverts to 'Book this slot' and the booking is stored with status 'cancelled' and sent to done.html, where 'Status: cancelled. This booking is not on the gate's list.' appears. The resident never confirmed a cancellation. An impatient or double tap may silently turn a booking into a cancelled one, so the resident may arrive at the gate without a valid slot.

**Evidence.** Where: confirm.html `#book`; confirm.html `#book`. E1, reproduced or measured · app.js:1, <tmp> <tmp> · found by 1 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Ignore clicks while the request is pending; offer cancellation, if needed, as a separate confirmed action after booking. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: H2-3 User control and freedom; CMP-04 Response feedback

#### F-0058 · No way to change or cancel an existing booking online with the reference

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0058 | No way to change or cancel an existing booking online with the reference | 4 · catastrophe | 4 · information architecture or architecture | H2-3 | User control and freedom |

**Problem.** Residents changing a booking know their reference and want to move the slot (top task 2). The service offers no route or control that accepts a reference: the navigation has only 'Book a slot' and 'Opening days', and the done page says 'If you cannot come, call 01632 960771 on a weekday and we will free the slot.' The phone line is open weekdays 09:00-17:00, while most bookings are for weekends and made in the evening. A resident whose plans change on a Friday evening or at the weekend cannot move or free the slot; they may lose the slot, waste one of the two weekly bookings, or leave a slot unused that another household needed.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `role=region[name="At the centre"]` at 375 px. E1, reproduced or measured · evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.yml, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light.yml, .ui-evaluator/runs/20261016-125559-audit-standard/probes/39/aria.yml, .ui-evaluator/runs/20261016-125559-audit-standard/probes/v2-done/aria.yml · found by 2 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Offer a 'change or cancel a booking' entry that takes the reference and postcode. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P0 · Status open · Also: H2-7 Flexibility and efficiency of use; ISO 9241-110 suitability for the task —

#### F-0079 · No online way to change or cancel an existing booking

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0079 | No online way to change or cancel an existing booking | 4 · catastrophe | 4 · information architecture or architecture | H2-3 | User control and freedom |

**Problem.** Changing the slot of an existing booking is a top task, but once a booking is made no route accepts a reference to change or cancel it. The done page offers only 'Book another slot' and 'If you cannot come, call 01632 960771 on a weekday'. The phone line is open weekdays 09:00 to 17:00, but residents mostly book in the evening and visit at weekends. Residents changing a booking ('move it to the afternoon') on a Friday evening or at the weekend cannot do so. They may book a second slot (households are limited to two a week) or simply not turn up, which leaves a scarce slot unused.

**Evidence.** E1, reproduced or measured · .ui-evaluator/runs/20261016-125559-audit-standard/evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.yml, .ui-evaluator/runs/20261016-125559-audit-standard/probes/v2-done/aria.yml, .ui-evaluator/runs/20261016-125559-audit-standard/probes/39/aria.yml · found by 1 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P0 · Status open · Also: H2-7 Flexibility and efficiency of use

### P1

#### F-0001 · axe color-contrast: Elements must meet minimum color contrast ratio thresholds

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0001 | axe color-contrast: Elements must meet minimum color contrast ratio thresholds | 3 · major (rule) | 1 · one value or token | A11Y-01 | axe-core with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wca… |

**Problem.** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds (serious impact). Fix any of the following: Element has insufficient color contrast of 3.02 (foreground color: #bd7d0f, background color: #fbefda, font size: 12.0pt (16px), font weight: bold). Expected contrast ratio of 4.5:1

**Evidence.** Where: / [date-chosen] `button[data-slot="08:20"] > .slot__tag--few.slot__tag` at 1280 px; / [date-chosen] `button[data-slot="08:40"] > .slot__tag--few.slot__tag` at 1280 px; / [date-chosen] `button[data-slot="09:00"] > .slot__tag--few.slot__tag` at 1280 px and 17 more. E1, reproduced or measured · evidence/crops/axe/b86bafb1c5.png, evidence/crops/axe/59c812bf19.png, evidence/crops/axe/40aa32265b.png, evidence/crops/axe/20d592f2e4.png. Ratings: rule: 3.

**Recommendation.** Elements must meet minimum color contrast ratio thresholds (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.3 Contrast, minimum

#### F-0002 · Text contrast below 4.5:1: "Few left"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0002 | Text contrast below 4.5:1: "Few left" | 3 · major (rule) | 1 · one value or token | A11Y-11 | Text contrast ≥ 4.5 |

**Problem.** Text "Few left" (16 px, weight 700) has 3.02:1 against its computed background in the light theme at 1280 px; it needs 4.5:1.

**Evidence.** Where: / `button.slot:nth-of-type(2) > span.slot__tag.slot__tag--few` at 1280 px; / [date-chosen] `button.slot:nth-of-type(2) > span.slot__tag.slot__tag--few` at 1280 px; / [slot-chosen] `button.slot:nth-of-type(2) > span.slot__tag.slot__tag--few` at 1280 px. E1, reproduced or measured · evidence/crops/contrast/2da24eeba2.png, evidence/crops/contrast/b008b1cfbc.png, evidence/crops/contrast/901fd513da.png. Ratings: rule: 3.

**Recommendation.** Change the colour role token for this text (or add a solid backing behind text over media). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.3 Contrast, minimum

#### F-0009 · Horizontal page overflow on /

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0009 | Horizontal page overflow on / | 3 · major (rule) | 2 · one component or file | FUN-05 | No horizontal page overflow at any matrix width |

**Problem.** scrollWidth 335 px > clientWidth 320 px at 320 px. Widest offender: #slots > div.slots__head:nth-of-type(1) extends 15 px past the viewport; 10 more.

**Evidence.** Where: / `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px. E1, reproduced or measured · evidence/crops/layout/d0feed3b9b.png, evidence/crops/layout/b1c65f8268.png, evidence/crops/layout/36425b0e42.png. Ratings: rule: 3.

**Recommendation.** Constrain the element (max-width: 100%, min-width: 0 on flex and grid children, overflow-wrap: anywhere) or give genuinely 2-D content its own scroll region and declare it in two_d_regions. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open

#### F-0010 · Content does not reflow at 320 px on /

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0010 | Content does not reflow at 320 px on / | 3 · major (rule) | 2 · one component or file | A11Y-07 | Reflow at 320 CSS px without two-dimensional scrolling |

**Problem.** scrollWidth 335 px > clientWidth 320 px at 320 px. Widest offender: #slots > div.slots__head:nth-of-type(1) extends 15 px past the viewport; 10 more.

**Evidence.** Where: / `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px. E1, reproduced or measured · evidence/crops/layout/35cdee278c.png, evidence/crops/layout/816b6d868b.png, evidence/crops/layout/031de4562c.png. Ratings: rule: 3.

**Recommendation.** Constrain the element (max-width: 100%, min-width: 0 on flex and grid children, overflow-wrap: anywhere) or give genuinely 2-D content its own scroll region and declare it in two_d_regions. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.10 Reflow

#### F-0016 · No visible focus indicator: "08:00"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0016 | No visible focus indicator: "08:00" | 3 · major (rule) | 1 · one value or token | A11Y-04 | Focus visible |

**Problem.** Tab focus on "08:00" changes 0 pixels within its box + 4 px (focused vs blurred crop), so no focus position is visible.

**Evidence.** Where: / `#slots > button.slot:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(6)` at 320 px. E1, reproduced or measured · evidence/keyboard/root/default/320-light/stop-9-focused.png, evidence/keyboard/root/date-chosen/320-light/stop-3-focused.png, evidence/keyboard/root/slot-chosen/320-light/stop-1-focused.png, evidence/keyboard/root/default/320-light/stop-9-blurred.png. Ratings: rule: 3.

**Recommendation.** Give every focusable element a :focus-visible indicator from the focus tokens (e.g. a 2 px outline with offset); never remove outline without a replacement. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.7 Focus visible

#### F-0018 · No progress shown during a 1.2 s operation: "Car with trailer"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0018 | No progress shown during a 1.2 s operation: "Car with trailer" | 3 · major (rule) | 1 · one value or token | CMP-04 | Response feedback |

**Problem.** "Car with trailer" runs for about 1202 ms; operations over 1 s must show progress, but nothing animated, no progressbar and no aria-busy region appears while it runs.

**Evidence.** Where: /vehicle.html?date=2026-10-17&slot=09:20 `#vehicle > button:nth-of-type(2)` at 1280 px. E1, reproduced or measured · evidence/crops/states/dc5af67435.png. Ratings: rule: 3.

**Recommendation.** Show an animated indicator where the result will appear (or in the control) after about 1 s, with text saying what is happening (CMP-10). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0021 · 'Few left' slots are moved visually above the Morning heading, away from their programmatic group

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0021 | 'Few left' slots are moved visually above the Morning heading, away from their programmat… | 3 · major | 2 · one component or file | WCAG 1.3.1 | Info and relationships |

**Problem.** Visual grouping and the programmatic structure should agree (1.3.1). The slot grid uses CSS order:-1 to pull every 'Few left' slot to the top, above the 'Morning' heading, at 320 px and 1280 px. In the DOM and ARIA snapshot these buttons stay under 'Morning' or 'Afternoon' in time order, so afternoon slots such as 13:40, 14:00 and 16:40 appear visually above 'Morning' and outside the 'Afternoon' group. Sighted readers see one order and grouping, screen-reader users hear another. The tool already reported the resulting focus-order jump (2.4.3), so this record covers only the grouping mismatch. A resident with low vision who also uses a screen reader or magnifier may hear '13:40' under 'Afternoon' but find it above 'Morning' on screen. They may also read the top row as the earliest slots and book the wrong time.

**Evidence.** Where: / [date-chosen] `#slots > button.slot[data-slot="08:20"]` at 320 px; / [slot-chosen] `#slots > button.slot[data-slot="13:40"]` at 1280 px; / [date-chosen] `group "Slots"` at 375 px and 6 more. E1, reproduced or measured · <round>/eval-21-audit-standard-slot-booking/with_skill/run-3/workspace/.ui-evaluator/runs/20261016-125559-audit-standard/evidence/screens/root/slot-chosen/1280-light.png, <round>/eval-21-audit-standard-slot-booking/with_skill/run-3/workspace/.ui-evaluator/runs/20261016-125559-audit-standard/evidence/screens/root/date-chosen/320-light.png, <round>/eval-21-audit-standard-slot-booking/with_skill/run-3/workspace/.ui-evaluator/runs/20261016-125559-audit-standard/evidence/aria/root/date-chosen/1280-light.yml, probes/4/final.png · found by 6 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Keep slots in time order under their heading and mark scarcity with the existing 'Few left' tag. If a 'nearly full' shortlist is wanted, render it as its own labelled group in the DOM rather than by CSS order. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.3.2 Meaningful sequence; A11Y-27 No verified judged WCAG failure; H2-4 Consistency and standards; CW-Q3 Will the user recognize the action as the correct one?; H2-2 Match between system and the real world; WCAG 2.4.3 Focus order; DES-hierarchy —

#### F-0023 · Cancelled booking page is headed 'Booked' and tells the resident to show the reference at the gate

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0023 | Cancelled booking page is headed 'Booked' and tells the resident to show the reference at… | 3 · major | 2 · one component or file | WCAG 2.4.6 | Headings and labels |

**Problem.** Headings should describe the topic or purpose of the content (2.4.6). On the cancelled-status done page, the h1 is still 'Booked'. The 'Your reference' section says 'Status: cancelled. This booking is not on the gate's list.' and then, unchanged, 'Show this at the gate…' and 'A reminder will be sent…'. A screen-reader user moving by headings hears 'Booked' and may never reach the status line. The status itself is red bold text, which is also text, so 1.4.1 is not involved. A resident whose booking was cancelled may drive to the centre and be turned away at the gate, which the product brief names as the costly failure.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `role=heading[level=1]` at 1280 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `h1` at 375 px; /done.html?status=cancelled [cancelled] `h1` at 375 px and 3 more. E1, reproduced or measured · <round>/eval-21-audit-standard-slot-booking/with_skill/run-3/workspace/.ui-evaluator/runs/20261016-125559-audit-standard/evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light.yml, <round>/eval-21-audit-standard-slot-booking/with_skill/run-3/workspace/.ui-evaluator/runs/20261016-125559-audit-standard/evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light.png, evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.png, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.yml · found by 7 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Make the h1 and the instructions follow the status, e.g. 'Booking cancelled', and drop the gate and reminder text when the booking is not on the list. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: A11Y-27 No verified judged WCAG failure; H2-1 Visibility of system status; H2-2 Match between system and the real world; H2-4 Consistency and standards; DES-hierarchy —

#### F-0024 · 'Change slot' returns to the day picker with 'Today' selected, not the booked day

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0024 | 'Change slot' returns to the day picker with 'Today' selected, not the booked day | 3 · major | 2 · one component or file | WCAG 3.3.7 | Redundant entry |

**Problem.** Information the user already entered in a process should be auto-populated or offered for selection (3.3.7). From the confirm page for Saturday 17 October 09:20, 'Change slot' links to index.html with no day. The day picker then shows 'Today' pressed and the slot list empty while it loads. Choosing 10:00 and Next produced a booking for Monday 12 October 10:00, not 17 October. Vehicle, waste and personal details were kept. The resident must notice the day change and choose the day again, and must type it again in full if it came from 'Another day'. Residents changing a booking 'to the afternoon' may move it to a different day without noticing, then arrive on the wrong day and be turned away. Residents with memory or attention difficulties carry the extra re-entry.

**Evidence.** Where: /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden `role=link[name="Change slot"]` at 1280 px. E1, reproduced or measured · <round>/eval-21-audit-standard-slot-booking/with_skill/run-3/workspace/.ui-evaluator/runs/20261016-125559-audit-standard/probes/36/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-3/workspace/.ui-evaluator/runs/20261016-125559-audit-standard/evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/default/1280-light.yml, probes/51/aria.yml, probes/51/screenshots/index-300ms.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Carry the booked date (and slot) in the Change slot link so the day picker opens on that day with it pressed. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: A11Y-27 No verified judged WCAG failure; H2-5 Error prevention

#### F-0026 · Slot buttons have their focus outline removed with no replacement

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0026 | Slot buttons have their focus outline removed with no replacement | 3 · major | 1 · one value or token | A11Y-04 | Focus visible |

**Problem.** Every tab stop should show a visible focus indicator. The when step injects a style element at run time containing '.slot:focus{outline:0}'. Its specificity (0,2,0) beats the shared ':focus-visible' outline (0,1,0), and no other focus style exists for .slot, so a focused slot button changes nothing on screen. The Next button's 'Choose a slot first' path also moves focus to the first slot, where it is then invisible. Keyboard and switch users choosing a slot are likely to lose track of which slot they are on, and the error path sends focus to an element they cannot see.

**Evidence.** Where: index.html [date-chosen] `#slots .slot`. E1, reproduced or measured · app.js:1, <tmp> <tmp> <tmp> · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Delete the injected style so the shared :focus-visible outline applies to .slot. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 2.4.7 Focus visible; CMP-02 Focus indicator quality

#### F-0027 · 'Few left' slots are moved ahead of time order with CSS order, so visual and focus order diverge

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0027 | 'Few left' slots are moved ahead of time order with CSS order, so visual and focus order … | 3 · major | 2 · one component or file | A11Y-03 | Keyboard |

**Problem.** Slots should appear, and be reached by Tab, in time order under their Morning and Afternoon headings. Each slot with state 'few' is rendered with an inline style 'order:-1'. In the grid this pulls every few-left slot, morning and afternoon, before the 'Morning' heading and out of time sequence, while the DOM and Tab order keep time order. Residents may read an afternoon slot as a morning one because it sits above the Morning heading, and keyboard focus jumps around the grid instead of moving in reading order.

**Evidence.** Where: index.html [date-chosen] `#slots .slot[style*='order']`. E1, reproduced or measured · app.js:1, <tmp> <tmp> · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Remove the order style and keep slots in time order; the 'Few left' tag already signals scarcity. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 2.4.3 Focus order; WCAG 1.3.2 Meaningful sequence; H2-4 Consistency and standards

#### F-0029 · Book this slot shows no visible change during its 1.5 s wait

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0029 | Book this slot shows no visible change during its 1.5 s wait | 3 · major | 2 · one component or file | CMP-04 | Response feedback |

**Problem.** An action taking over 1 s should show progress, and any action should be acknowledged within 0.1 s. On click the Book button only gets aria-busy='true' (no style uses it) for a 1500 ms timeout before navigating or showing errors. Label, colour and enabled state stay the same. Residents may think the tap did not register and tap again, which triggers code-05.

**Evidence.** Where: confirm.html `#book`. E1, reproduced or measured · app.js:1, <tmp> <tmp> · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Change the label to 'Booking…' and style [aria-busy=true] while the request runs; ignore further clicks. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0031 · Done page heading says 'Booked' when the booking status is cancelled

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0031 | Done page heading says 'Booked' when the booking status is cancelled | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** A confirmation page should state the true outcome in its heading. done.html hard-codes h1 'Booked' and the reminder text; ne() only reveals a red 'Status: cancelled' paragraph under the reference and leaves the heading, the reminder and 'Show this at the gate' text unchanged. Residents may read 'Booked' and the gate instructions and miss that the booking is not on the gate's list.

**Evidence.** Where: done.html [cancelled] `h1`; done.html [cancelled] `#status`. E1, reproduced or measured · done.html:28; app.js:1 ne(), <tmp> · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Set the heading, title and instructions from the status (e.g. 'Booking cancelled') and hide the gate and reminder text when cancelled. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-4 Consistency and standards

#### F-0034 · Slots already in the past today are offered as free and rejected only at booking

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0034 | Slots already in the past today are offered as free and rejected only at booking | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** DESIGN.md says: 'Do show a slot as free only when it is.' The slot generator j() produces 08:00-17:20 for any open day, including today, with no comparison to the current time. Only the final booking step rejects today's slots before 10:35 ('The 09:20 slot today can no longer be booked'), after the resident has completed vehicle and personal details. 'Today' is the default selected day. Residents booking for today may choose an unavailable slot and learn it only after three steps of input.

**Evidence.** Where: index.html `#slots .slot`; confirm.html [errors] `#error-summary`. E1, reproduced or measured · app.js:1, <tmp> <tmp> · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Mark today's past slots as unavailable (disabled with a 'Past' tag) in the slot list. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: DESIGN.md Do's and Don'ts —

#### F-0035 · Returning to the when step drops the saved day and slot

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0035 | Returning to the when step drops the saved day and slot | 3 · major | 2 · one component or file | H2-6 | Recognition rather than recall |

**Problem.** Coming back to change an answer should show the earlier answer. te() reads the session (let e=b()) but never uses it: the day always resets to the fixed 'today' and the selected slot to none. 'Change slot' on the confirm step and 'Back to the slots' on the vehicle step both land on this blank state, while the session still holds the old slot until a new day or slot is chosen. Residents changing only the time may have to find their day again, and may be unsure whether their earlier choice still stands.

**Evidence.** Where: index.html `#slots`; confirm.html `a[href='index.html']`. E1, reproduced or measured · app.js:1, <tmp> <tmp> · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Initialise f and i from the session (e.date, e.slot) when present. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-3 User control and freedom

#### F-0103 · The 5-minute slot hold is never disclosed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0103 | The 5-minute slot hold is never disclosed | 3 · major | 2 · one component or file | WCAG 2.2.1 | Timing adjustable |

**Problem.** No page tells the resident that the chosen slot is held for only 5 minutes while they finish, but the hold is enforced at booking: after it lapses, Book this slot fails with 'This slot is no longer available.' Residents who take more than five minutes over vehicle and details may lose the slot without warning and without knowing why.

**Evidence.** Where: confirm.html [expired] `#error-summary`. E1, reproduced or measured · app.js:1, .ui-evaluator/runs/20261016-125559-audit-standard/probes/78/probe.json, .ui-evaluator/runs/20261016-125559-audit-standard/probes/78/final.png, .ui-evaluator/runs/20261016-125559-audit-standard/probes/77/probe.json · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** State the hold length when a slot is chosen and on later steps; on expiry say the hold ran out and link to index.html. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-9 Help users recognize, diagnose and recover from errors

#### F-0045 · Slot hold and its time limit are not stated after choosing a slot

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0045 | Slot hold and its time limit are not stated after choosing a slot | 3 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** Once a slot is chosen and the resident continues, the flow should say the slot is held for them and for how long. The vehicle page does not mention the chosen slot or any hold; the only signal is an error on the final step, 'This slot is no longer available', with the slot cleared from the summary. A resident booking on a phone while doing other things, who does not know slots are held only briefly, may pause and lose the slot, finding out only after filling in all details.

**Evidence.** Where: /vehicle.html?date=2026-10-17&slot=09:20 `main` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired [expired] `role=alert` at 375 px; /vehicle.html?date=2026-10-17&slot=09:20 `main` at 375 px and 1 more. E1, reproduced or measured · probes/7/aria.yml, probes/13/, evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/default/375-light.yml, evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/375-light.yml · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** After a slot is chosen, show 'Saturday 17, 09:20 held for you for N minutes' on the following pages. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CW-Q1 Does the effect of the action match the user’s goal?; H2-1 Visibility of system status; H2-5 Error prevention

#### F-0047 · 'Book this slot' shows no pending state while the booking is made

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0047 | 'Book this slot' shows no pending state while the booking is made | 3 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** A submit that takes more than a moment should acknowledge the tap. For about 1.5 s after tapping 'Book this slot' the page is unchanged: same label, no status text, button not disabled. A resident may tap again, unsure whether the booking went through, risking a duplicate attempt against a two-slots-a-week limit.

**Evidence.** Where: /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden [submitting] `role=button[name="Book this slot"]` at 375 px. E1, reproduced or measured · probes/14/, probes/47/screenshots/car-at-1000.png, probes/47/aria.yml, probes/45/screenshots/just-after-book.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Change the button to 'Booking…', disable it and announce the status while the request runs. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0048 · Booking confirmation omits the day, the arrival window and the vehicle

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0048 | Booking confirmation omits the day, the arrival window and the vehicle | 3 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** The confirmation a resident shows at the gate should restate when to come and what was booked. The 'Booked' page shows the reference and gate instructions but not Saturday 17 October, 09:20 to 09:40, the vehicle or the registration, and does not say to arrive within the 20-minute window. A resident who did not know slots are 20-minute arrival windows may leave without a record on screen of when to arrive, and at the gate (poor signal) may not be able to check their time or vehicle.

**Evidence.** Where: /done.html [booked] `region "Your reference"` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `role=region[name="Your reference"]` at 375 px; /done.html `role=region[name="Your reference"]` at 375 px and 5 more. E1, reproduced or measured · probes/14/screenshots/done.png, probes/14/aria.yml, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.yml, .ui-evaluator/runs/20261016-125559-audit-standard/probes/32/final.png · found by 7 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Repeat day, time window ('arrive between 09:20 and 09:40'), vehicle and registration next to the reference. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; H2-1 Visibility of system status; DES-hierarchy —

#### F-0060 · Past slots on Today are offered as free and rejected only at the final step

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0060 | Past slots on Today are offered as free and rejected only at the final step | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** On Today (Monday 12 October), slots earlier in the day such as 08:00 can be selected and look the same as later free slots. The resident goes through vehicle, waste and four personal details. Only when they press Book this slot does an error say 'The 08:00 slot today can no longer be booked. Choose another slot or day.' Unbookable times should not be offered as available in the first place. Residents booking 'today' with a loaded car may fill in the whole booking before learning that the slot was never possible, then have to go back and choose again.

**Evidence.** Where: / `.slot[data-slot="08:00"]` at 375 px; /confirm.html [past-slot] `role=alert` at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261016-125559-audit-standard/probes/30/, .ui-evaluator/runs/20261016-125559-audit-standard/evidence/aria/root/default/375-light.yml, .ui-evaluator/runs/20261016-125559-audit-standard/probes/v2-f0060/screenshots/today.png, .ui-evaluator/runs/20261016-125559-audit-standard/probes/v2-f0060/screenshots/confirm.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Disable or hide slots that have already started on today's grid. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0064 · 'Change slot' reopens the slot page on Today instead of the booked day and slot

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0064 | 'Change slot' reopens the slot page on Today instead of the booked day and slot | 3 · major | 2 · one component or file | H2-6 | Recognition rather than recall |

**Problem.** From Check and book with Saturday 17 October 09:20, 'Change slot' opens step 1 with Today (Monday 12 October) pressed and nothing selected. To move to another time on the same day, the resident has to find Saturday 17 again (or retype the date under Another day), wait for the slots to load, and pick again, without being shown which slot they had. The same thing happens from the expired-hold error. The booking's own day is what they most likely want to stay on. In the change-slot journey ('move it to the afternoon'), residents have to re-navigate to the day. If they booked via Another day they have to retype it, and a hurried tap on a slot under the preselected Today could book the wrong day.

**Evidence.** Where: /confirm.html `role=link[name="Change slot"]` at 375 px; /confirm.html?hold=expired [expired] `role=link[name="Change slot"]` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden,wood `role=link[name="Change slot"]` at 375 px and 1 more. E1, reproduced or measured · .ui-evaluator/runs/20261016-125559-audit-standard/probes/8/final.png, .ui-evaluator/runs/20261016-125559-audit-standard/probes/33/final.png, probes/31/screenshots/after-change-slot.png, probes/34/screenshots/after-back-to-slots.png · found by 2 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Open step 1 with the booked day selected and the current slot marked. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-7 Flexibility and efficiency of use; H2-3 User control and freedom

#### F-0070 · Keyboard focus on slot buttons has no visible indicator

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0070 | Keyboard focus on slot buttons has no visible indicator | 3 · major | 1 · one value or token | H2-1 | Visibility of system status |

**Problem.** Keyboard users need to see where focus is. After tabbing to the 08:20 slot (focus confirmed by the probe's expect step), the screenshot shows no ring, outline or change of colour on 08:20 or on any other slot. The page only scrolled. The same happened after focusing 'Another day' (probe 5, step-03). Context names residents who book with a keyboard only. Among 29 identical-looking slot boxes they may not be able to tell which slot Enter will choose, and may book the wrong time.

**Evidence.** Where: / [date-chosen] `.slot[data-slot="08:20"]` at 375 px; / [date-chosen] `#other-day` at 375 px. E1, reproduced or measured · probes/9/, probes/5/step-03.png, .ui-evaluator/runs/20261016-125559-audit-standard/probes/v2-f0070b/step-08.png, .ui-evaluator/runs/20261016-125559-audit-standard/probes/v2-f0070b/step-11.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Give the slot buttons a high-contrast :focus-visible outline in both themes. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 2.4.7 Focus visible

#### F-0078 · No indication anywhere of how long a chosen slot is held

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0078 | No indication anywhere of how long a chosen slot is held | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** Choosing a slot holds it for a limited time (the expired state shows 'This slot is no longer available'), but no page says that a hold exists, how long it lasts, or how much time is left. Context lists 'how long a chosen slot is held' among the things residents do not know. Residents often book while doing something else. Without knowing a timer is running, they may pause and lose the slot on a busy day.

**Evidence.** E1, reproduced or measured · .ui-evaluator/runs/20261016-125559-audit-standard/evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/default/375-light.yml, .ui-evaluator/runs/20261016-125559-audit-standard/evidence/aria/, .ui-evaluator/runs/20261016-125559-audit-standard/probes/v2-f0060/screenshots/vehicle.png, .ui-evaluator/runs/20261016-125559-audit-standard/probes/v2-f0060/screenshots/confirm.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P1 · Status open · Also: H2-5 Error prevention; WCAG 2.2.1 Timing adjustable

#### F-0025 · Expired-slot message does not say what to do next and blanks the slot

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0025 | Expired-slot message does not say what to do next and blanks the slot | 2.67 · major | 2 · one component or file | H2-9 | Help users recognize, diagnose and recover from errors |

**Problem.** An error message should say how to recover (H9; CPY-04). When the held slot has gone, the summary reads only 'This slot is no longer available.' It is plain text, not a link. The booking summary replaces the slot time with '—', so the resident no longer sees which slot they lost. The way forward, the small 'Change slot' link in the summary, is not named in the message. Entered details are kept, which helps. A resident whose hold lapsed may press 'Book this slot' again, or give up, instead of choosing another slot.

**Evidence.** Where: /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired [expired] `role=alert[name="There is a problem"]` at 1280 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired [expired] `role=alert` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired [expired] `role=alert` at 375 px and 2 more. E1, reproduced or measured · <round>/eval-21-audit-standard-slot-booking/with_skill/run-3/workspace/.ui-evaluator/runs/20261016-125559-audit-standard/evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/1280-light.yml, <round>/eval-21-audit-standard-slot-booking/with_skill/run-3/workspace/.ui-evaluator/runs/20261016-125559-audit-standard/evidence/screens/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/1280-light.png, evidence/screens/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/375-light.png, evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/375-light.yml · found by 5 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Name the lost slot and link to the slot list for the same day, e.g. 'Saturday 17 October 09:20 has just been taken. Choose another slot' linking to the day. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CPY-04 Error-message quality; H2-4 Consistency and standards; H2-6 Recognition rather than recall; WCAG 3.3.3 Error suggestion; DES-hierarchy —

#### F-0038 · Missing or malformed permit is not checked on the vehicle step; the error appears only after booking, with no link

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0038 | Missing or malformed permit is not checked on the vehicle step; the error appears only af… | 2.67 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Errors should be caught where the field is. The vehicle step's Next validates vehicle and waste but not the permit. The permit format (DRC- plus five digits) is checked only inside the 1.5 s booking timeout on the confirm step, and the message goes into the error summary with no href, although the field is on another page. Van and trailer owners may fill in all their details before learning the permit is missing, then have to find the vehicle step themselves.

**Evidence.** Where: vehicle.html [van] `#next`; confirm.html [errors] `#error-list`; /vehicle.html [van] `#permit` at 375 px and 2 more. E1, reproduced or measured · app.js:1, probes/45/aria.yml, probes/46/aria.yml, .ui-evaluator/runs/20261016-125559-audit-standard/probes/22/final.png · found by 3 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** Validate the permit on the vehicle step's Next with an inline error; on the confirm step link the message to vehicle.html#permit. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: A11Y-13 Forms; WCAG 3.3.1 Error identification; H2-9 Help users recognize, diagnose and recover from errors

#### F-0104 · Expired-hold error does not say the hold expired or link to choose another slot

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0104 | Expired-hold error does not say the hold expired or link to choose another slot | 2.67 · major | 2 · one component or file | WCAG 2.2.1 | Timing adjustable |

**Problem.** When the hold has lapsed, the error summary says only 'This slot is no longer available.', with no reason and no link; the slot row in the summary becomes '—', and recovery depends on noticing the separate 'Change slot' link in the booking summary below. Residents who take more than five minutes over vehicle and details may lose the slot without warning and without knowing why.

**Evidence.** Where: confirm.html [expired] `#error-summary`. E1, reproduced or measured · app.js:1, .ui-evaluator/runs/20261016-125559-audit-standard/probes/75/probe.json, .ui-evaluator/runs/20261016-125559-audit-standard/probes/75/final.png, .ui-evaluator/runs/20261016-125559-audit-standard/probes/73/probe.json · found by 1 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 2, 3).

**Recommendation.** State the hold length when a slot is chosen and on later steps; on expiry say the hold ran out and link to index.html. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-9 Help users recognize, diagnose and recover from errors; WCAG 3.3.3 Error suggestion

#### F-0015 · Status message not announced: "20 slots free on Monday 12 October"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0015 | Status message not announced: "20 slots free on Monday 12 October" | 2 · minor (rule) | 1 · one value or token | A11Y-15 | Status messages from async actions are exposed through `role=status… |

**Problem.** After Today, the message "20 slots free on Monday 12 October" appeared without moving focus, but its live region (#slots-status) was inserted together with the text; screen readers only announce changes to regions that already exist. Screen readers do not announce the outcome.

**Evidence.** Where: / `#slots-status` at 1280 px; / [date-chosen] `#slots-status` at 1280 px. E1, reproduced or measured · evidence/crops/live-regions/86e7793db0.png, evidence/crops/live-regions/029daa463c.png. Ratings: rule: 2.

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
| F-0046 | Permit number field stays shown, unmarked, after 'Car' is chosen | 2.33 · minor | 1 · one value or token | CW-Q1 | Does the effect of the action match the user’s goal? | E1 | open |
| F-0067 | Invalid 'Another day' date leaves the previous day's slots selectable under the error | 2.33 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0022 | Selected day button differs from unselected days only by a 1 px thicker border and a 1.16… | 2 · minor | 1 · one value or token | WCAG 1.4.11 | Non-text contrast | E1 | open |
| F-0028 | Slot grid at 360 px and below is wider than the content box | 2 · minor | 2 · one component or file | A11Y-07 | Reflow at 320 CSS px without two-dimensional scrolling | E1 | open |
| F-0036 | 'Few left' tag colours bypass the declared warning token and fall below 4.5:1 | 2 · minor | 1 · one value or token | COL-01 | Token conformance | E1 | open |
| F-0105 | Error summary links on the vehicle step do not move focus to a control | 2 · minor | 2 · one component or file | A11Y-13 | Forms | E1 | open |
| F-0106 | Vehicle and waste errors are not programmatically tied to their controls | 2 · minor | 2 · one component or file | A11Y-13 | Forms | E1 | open |
| F-0043 | Slot area shows the previous day's date over an empty list while the chosen day's slots l… | 2 · minor | 2 · one component or file | CW-Q4 | Will the user understand the feedback? | E1 | open |
| F-0054 | Vehicle step does not show which day and slot are being booked | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0056 | Permit help tells residents to apply on the council site but gives no link | 2 · minor | 1 · one value or token | H2-10 | Help and documentation | E1 | open |
| F-0057 | Two-working-day permit lead time is revealed only after a slot is chosen | 2 · minor | 1 · one value or token | H2-5 | Error prevention | E1 | open |
| F-0059 | Vans and trailers help is an unlabelled icon among the vehicle buttons | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0020 | Current step in the step list is shown only by bold text, not exposed programmatically | 1.67 · minor | 1 · one value or token | WCAG 1.3.1 | Info and relationships | E1 | open |
| F-0032 | Slot list is empty with no loading indicator for 0.9 s after each day change | 1.67 · minor | 2 · one component or file | CMP-05 | Data states exist | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0033 | Next on the when step does nothing while slots are loading | 1 · cosmetic | 2 · one component or file | CMP-04 | Response feedback | E1 | open |

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
| F-0086 | No identity or focal point of the recycling centre on any screen (sterile default) | 1 | /, /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden |
| F-0087 | Wide widths leave the right half of the page empty while cards stretch with text in their… | 2 | /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired, /, /done.html |
| F-0088 | Narrow-width wraps split the registration example and strand words | 1 | /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired, /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled |
| F-0092 | No identity or signature: 'plain' has become 'bare' | 2 | /, /done.html |
| F-0093 | Done page at wide widths: stretched card, half-width card, band under footer | 1 | /done.html |
| F-0094 | 'Back to the slots' link sits flush against the H1 | 1 | /vehicle.html |
| F-0095 | Expired-slot state keeps 'Book this slot' as the primary action | 1 | /confirm.html |

## 5. Divergent and disputed findings: questions for user research

No finding was flagged divergent by the raters (spread < 2 everywhere). Open questions worth a short test with residents on phones:
- Do residents read "Few left" slots above "Morning" as recommended or earliest slots, and pick a slot they did not mean?
- After a slot is lost to the hold, do residents find "Change slot", or abandon?
- How often does a double tap happen on the real "Book this slot" button over mobile data?

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | not_run | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0020, F-0021, F-0106 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0021, F-0027 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | not_run | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | not_run | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001, F-0002, F-0036 |
| 1.4.4 | AA | Resize text | scripted | pass | — |
| 1.4.5 | AA | Images of text | agent-judged | not_run | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0010, F-0028 |
| 1.4.11 | AA | Non-text contrast | scripted | fail | F-0022 |
| 1.4.12 | AA | Text spacing | scripted | pass | — |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_run | — |
| 2.1.1 | A | Keyboard | scripted | pass | — |
| 2.1.2 | A | No keyboard trap | scripted | pass | — |
| 2.1.4 | A | Character key shortcuts | agent-judged | not_run | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0041, F-0103, F-0104, F-0078 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | not_run | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | agent-judged | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0017, F-0021, F-0027, F-0039, F-0105, F-0106 |
| 2.4.4 | A | Link purpose in context | agent-judged | not_run | — |
| 2.4.5 | AA | Multiple ways | agent-judged | not_run | — |
| 2.4.6 | AA | Headings and labels | agent-judged | fail | F-0023 |
| 2.4.7 | AA | Focus visible | scripted | fail | F-0016, F-0026, F-0070 |
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
| 3.3.1 | A | Error identification | scripted | fail | F-0038, F-0039, F-0105, F-0106 |
| 3.3.2 | A | Labels or instructions | agent-judged | not_run | — |
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0025, F-0104 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | fail | F-0024 |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_run | — |
| 4.1.2 | A | Name, role, value | agent-judged | not_run | — |
| 4.1.3 | AA | Status messages | scripted | fail | F-0015, F-0043 |

Totals by coverage: auto 1 · scripted 22 · agent-judged 23 · needs-human 8; by state: pass 16 · fail 13 · not_run 26. This matrix is not a conformance claim (QUALITY-BAR §8).

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
- 2.2.1 slot hold time limit: the expired state exists, but the hold length and any warning cannot be observed without real-time waiting (needs-human). (a11y)
- 2.4.2 page titles: not present in the packet's ARIA snapshots or probe output. (a11y)
- Rendered contrast of the 'Few left' tag: computed from source hsl values only (about 3.0:1 light, 3.4:1 dark); uie audit should measure it. (code)
- Horizontal overflow at 320 px: computed from the JS column formula and CSS padding, not measured in the rendered page. (code)
- 'Change slot' (confirm) links to index.html and 'Change vehicle' to vehicle.html, and 'Back to the slots' (vehicle) to index.html, all without the date/slot/vehicle/waste parameters the flow carries in the URL. Whether the other choices and the typed details survive the change (the change-slot journey) could not be probed. (he-1)
- Whether pressing Next on / without choosing a slot gives an error or silently proceeds. (he-1)
- What 'Another day' does (date picker, list, or field) and whether Wednesday (closed) can be chosen. (he-1)
- On Today (Monday 12 October, fixture time 10:05) slots 08:00-10:00 are enabled in root/default; whether the app's clock makes these bookable past slots could not be checked. (he-1)
- Whether slots take a moment to appear after choosing a day and whether a loading state is shown (journey persona does not know this). (he-1)
- Whether focus moves to the error summary on vehicle/errors and confirm/errors, and whether 'Book this slot' can be double-submitted. (he-1)
- Whether the Permit number field is validated against the 'DRC-' plus five digits format, and what the message says. (he-1)
- Browser Back and refresh behaviour mid-flow. (he-1)
- Feedback while Book this slot is processing: a screenshot taken immediately after the click (probes/32/screenshots/immediately.png) shows the unchanged confirm page, but the capture came too soon after the click to show whether a busy state follows or how long submission takes. (he-2)
- Whether the 'Back to the slots' link on the vehicle page keeps the chosen day and slot: not probed. (he-2)
- Whether a permit in the wrong format (e.g. '12345') is rejected at Book this slot: probe 18 shows it accepted at the vehicle step and shown on confirm as 'Van, permit 12345'; submission not probed. (he-2)
- Whether the reminder SMS and 'gate list' behave as described: outside the UI. (he-2)
- Whether the field hints and inline errors on confirm are linked to their inputs with aria-describedby. The ARIA snapshot does not show descriptions; this needs a screen-reader check. (he-3)
- Whether focus moves to the error summary on vehicle and confirm. The packet's state recipes assert that role=alert is focused, but I did not probe it myself. (he-3)
- The visual distinction between Full and available slots in dark mode, and the contrast of 'Few left' badges, are left to the measured audit (root/slot-chosen/375-dark.png suggests the backgrounds are close). (he-3)
- Hold duration and expiry timing: the expired state was reached only through the hold=expired URL recipe, so the real hold length could not be observed. (he-3)
- Behaviour at 200% zoom and with larger text was not probed. (he-3)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0002, F-0009, F-0010, F-0015, F-0016 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (1 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (2 finding(s)); A11Y-04 (2 finding(s)) ….
3. For L2: USE-05 (4 open P0 finding(s)); USE-06 (28 P1 finding(s) without a recorded decision); USE-08 (3 top task(s) not completable); USE-09 (interaction coverage 32% < 90%); DES-02 (0/3 critics judged it specific) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (32 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

