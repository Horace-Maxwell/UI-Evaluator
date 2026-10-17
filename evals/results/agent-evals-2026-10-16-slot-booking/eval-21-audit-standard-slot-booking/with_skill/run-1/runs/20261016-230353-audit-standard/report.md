# UI evaluation report: Dunmore recycling centre booking · run 20261016-230353-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:e5456928e8 (uncommitted changes present) · run opened 2026-10-17T03:03:53.141Z |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Surfaces and modes | when (operate), vehicle (operate), confirm (operate), confirm (operate), done (read), done (read) |
| Routes × states | 6 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-17T03:03:17.974Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | 840aca53 840aca53 840aca53 |
| walkthrough-evaluator | 2 | subagent | claude-opus-5-5 | 5019e89d 869dcb62 |
| design-critic | 3 | subagent | claude-opus-5-5 | bbf0687f bbf0687f bbf0687f |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 43dd94da |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 030f32e5 e928a9d6 |
| finding-verifier | 4 | subagent | claude-opus-5-5 | e8440a33 c41941f5 27e5ee73 1b1403ee |
| severity-rater | 3 | subagent | claude-opus-5-5 | cf83d309 9b241c69 44d45d97 |

Coverage: 540 valid capture(s); 29% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (1 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (1 finding(s)); A11Y-04 (1 finding(s)); A11Y-07 (1 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-07 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-04, A11Y-07, A11Y-11, A11Y-15, A11Y-27 |
| G3 Craft floor | fail | COL-01, LAY-01, CMP-03, CMP-04, CPY-04 |
| G4 Deliberateness and anti-slop | pass | — |
| G5 Analytical usability | fail | USE-05, USE-06, USE-08, USE-09 |
| G6 Design quality | fail | DES-02, DES-03, DES-04, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- Error summaries take focus and link to each field, with format examples ("Enter a UK mobile number, like 07700 900123"). Capture: `evidence/screens/confirm-…/errors/375-light.png`, probed by the accessibility auditor.
- Changing the slot or vehicle keeps vehicle, waste and typed details (probed by cw-2 and he-2 at 375 px).
- The confirm step's "Your booking" summary shows the slot as a range ("09:20 to 09:40") with Change links. Capture: `evidence/screens/confirm-…/default/375-dark.png`.
- Dark theme is complete and keeps the green identity; text, borders and buttons hold contrast except the "Few left" amber. Capture: `evidence/screens/root/date-chosen/375-dark.png`.
- Availability is in text ("Few left", "Full"), full slots are disabled, and status survives all colour-vision simulations and forced colours.
- Quick day buttons (Today, Tomorrow, Saturday 17, Sunday 18) match the "tomorrow or at the weekend" need.
- Field hints say why each detail is asked for; autocomplete tokens are set on name, mobile and postcode.

- Error summaries take focus and link to each field, with format examples in the messages
- Changing the slot keeps vehicle, waste and personal details (3.3.7)
- Native buttons with aria-pressed and aria-expanded for day, slot, vehicle and info toggles; status words ('Few left', 'Full') are in text and survive all four CVD simulations and forced colours
- Complete landmark set (banner, named navigation, main, contentinfo) and one h1 per page with no skipped levels
- Global :focus-visible ring (3px, --c-focus, 2px offset) distinct from hover on every control except slots
- Personal-data fields carry autocomplete tokens (name, tel, postal-code) and inputmode on the date field
- Error summary pattern: focusable role=alert summary with links to fields, inline errors wired with aria-describedby and aria-invalid
- Motion limited to background-color and opacity at 120 ms with a prefers-reduced-motion override; no transition:all

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.31 (mean Jaccard over 3 passes); an estimated 2.3 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0017 · Focus order jumps back: "08:00" → "08:20 Few left"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0017 | Focus order jumps back: "08:00" → "08:20 Few left" | 4 · catastrophe (rule) | 1 · one value or token | A11Y-03 | Keyboard |

**Problem.** After "08:00", Tab moves to "08:20 Few left", which sits 216 px above it in the same column; the focus order does not follow the visual reading order (clear-inversion heuristic).

**Evidence.** Where: / `#slots > button.slot:nth-of-type(2)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px. E1, reproduced or measured · evidence/crops/keyboard/4be89c6678.png, evidence/crops/keyboard/2ec11cd4f9.png, evidence/crops/keyboard/c494d4a9db.png. Ratings: rule: 4.

**Recommendation.** Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.4.3 Focus order

#### F-0030 · A second tap on 'Book this slot' while booking turns the booking into a cancelled one

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0030 | A second tap on 'Book this slot' while booking turns the booking into a cancelled one | 4 · catastrophe | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Repeat activation during a pending submission should be ignored. After the first click starts the 1.5 s booking timer, a second click sets a cancel flag and relabels the button 'Cancel booking'; when the timer fires the label is reset to 'Book this slot' and the booking is saved with status 'cancelled' and the resident is sent to the done page, which shows 'Status: cancelled'. A double-tap therefore produces a cancelled booking with no confirmation. A resident who taps twice, which is common on phones when nothing visibly changes, may arrive at the gate with a booking that is not on the gate's list.

**Evidence.** Where: /confirm.html [submitting] `#book`; /confirm.html [submitting] `#book`. E1, reproduced or measured · app.js:1:11269, verifier-3/out3/screenshots/dbl-t200.png, verifier-3/out3/screenshots/dbl-second.png, verifier-3/out3/screenshots/dbl-after.png · found by 1 of 12 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Ignore clicks while a submission is pending; offer cancellation, if needed, as a separate deliberate action after booking. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: CMP-04 Response feedback; H2-3 User control and freedom

### P1

#### F-0054 · No online way to change or cancel a booking after it is made

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0054 | No online way to change or cancel a booking after it is made | 3.33 · major | 4 · information architecture or architecture | H2-3 | User control and freedom |

**Problem.** Residents whose plans change need to move a slot using their reference (top task 2). After booking, the only route offered is 'If you cannot come, call 01632 960771 on a weekday', although the centre is open at weekends. There is no 'manage booking' entry. A resident changing plans on a Friday evening or at the weekend cannot move or free the slot; the slot may go unused and the resident must rebook from scratch within the two-a-week limit.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `#again` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `role=region[name="At the centre"]` at 375 px. E1, reproduced or measured · evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.png, packets/heuristic-evaluator-3/inventory.json, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.yml, verifier-3/out3/screenshots/dbl-after.png · found by 2 of 12 evaluator(s). Ratings: 3.33 (spread 1; 3, 4, 3).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P1 · Status open · Also: H2-7 Flexibility and efficiency of use; ISO-9241-110-suitability-for-the-task —

#### F-0060 · Change slot and Back to the slots reopen the slot page on Today, not on the chosen day

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0060 | Change slot and Back to the slots reopen the slot page on Today, not on the chosen day | 3.33 · major | 2 · one component or file | H2-3 | User control and freedom |

**Problem.** From confirm (Saturday 17 October, 09:20) Change slot opens index.html with no day carried over; Today (Monday 12 October) is pressed and its slots are shown. Tapping 14:20 and Next returned to confirm with 'Day Monday 12 October, Slot 14:20 to 14:40'. Back to the slots on the vehicle step does the same. A resident moving the time on the same day expects the chosen day to stay selected. Residents changing to the afternoon may book the right time on the wrong day and be turned away at the gate, since nothing on the slot page signals that the day was reset.

**Evidence.** Where: /confirm.html `role=link[name="Change slot"]` at 375 px; /vehicle.html `role=link[name="Back to the slots"]` at 375 px. E1, reproduced or measured · probes/8/, probes/14/, verifier-3/out5/screenshots/after-change-slot.png, verifier-3/out1/aria.yml · found by 1 of 12 evaluator(s). Ratings: 3.33 (spread 1; 3, 3, 4).

**Recommendation.** Carry the chosen day (and current slot) back to the slot page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-5 Error prevention; H2-1 Visibility of system status

#### F-0078 · A booking can only be changed or cancelled by phoning on weekdays

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0078 | A booking can only be changed or cancelled by phoning on weekdays | 3.33 · major | 4 · information architecture or architecture | H2-3 | User control and freedom |

**Problem.** After booking, the only stated way to change or free a slot is 'call 01632 960771 on a weekday'; phone hours are weekdays 09:00 to 17:00, while the centre is open at weekends and residents book in the evening. The done page offers only Book another slot. Residents changing a booking with their reference (a declared group) have no self-service route. A resident whose weekend plans change on a Friday evening cannot free or move the slot, and the household's two-a-week allowance may be consumed.

**Evidence.** E1, reproduced or measured · evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.png, done/default, verifier-2/out8/aria.yml, verifier-2/out7/aria.yml · found by 1 of 12 evaluator(s). Ratings: 3.33 (spread 1; 3, 4, 3).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P1 · Status open · Also: H2-7 Flexibility and efficiency of use

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
| F-0009 | Horizontal page overflow on / | 3 · major (rule) | 2 · one component or file | FUN-05 | No horizontal page overflow at any matrix width |

**Problem.** scrollWidth 335 px > clientWidth 320 px at 320 px. Widest offender: #slots > div.slots__head:nth-of-type(1) extends 15 px past the viewport; 10 more.

**Evidence.** Where: / `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px and 1 more. E1, reproduced or measured · evidence/crops/layout/d0feed3b9b.png, evidence/crops/layout/b1c65f8268.png, evidence/crops/layout/36425b0e42.png, app.js:1:5508. Ratings: rule: 3.

**Recommendation.** Constrain the element (max-width: 100%, min-width: 0 on flex and grid children, overflow-wrap: anywhere) or give genuinely 2-D content its own scroll region and declare it in two_d_regions. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: A11Y-07 Reflow at 320 CSS px without two-dimensional scrolling; WCAG 1.4.10 Reflow; LAY-01 Spacing scale conformance

#### F-0016 · No visible focus indicator: "08:00"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0016 | No visible focus indicator: "08:00" | 3 · major (rule) | 1 · one value or token | A11Y-04 | Focus visible |

**Problem.** Tab focus on "08:00" changes 0 pixels within its box + 4 px (focused vs blurred crop), so no focus position is visible.

**Evidence.** Where: / `#slots > button.slot:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(6)` at 320 px and 2 more. E1, reproduced or measured · evidence/keyboard/root/default/320-light/stop-9-focused.png, evidence/keyboard/root/date-chosen/320-light/stop-3-focused.png, evidence/keyboard/root/slot-chosen/320-light/stop-1-focused.png, evidence/keyboard/root/default/320-light/stop-9-blurred.png. Ratings: rule: 3.

**Recommendation.** Give every focusable element a :focus-visible indicator from the focus tokens (e.g. a 2 px outline with offset); never remove outline without a replacement. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.7 Focus visible; CMP-02 Focus indicator quality; WCAG 2.4.11 Focus not obscured, minimum

#### F-0018 · No progress shown during a 1.2 s operation: "Car with trailer"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0018 | No progress shown during a 1.2 s operation: "Car with trailer" | 3 · major (rule) | 1 · one value or token | CMP-04 | Response feedback |

**Problem.** "Car with trailer" runs for about 1201 ms; operations over 1 s must show progress, but nothing animated, no progressbar and no aria-busy region appears while it runs.

**Evidence.** Where: /vehicle.html?date=2026-10-17&slot=09:20 `#vehicle > button:nth-of-type(2)` at 1280 px. E1, reproduced or measured · evidence/crops/states/dc5af67435.png. Ratings: rule: 3.

**Recommendation.** Show an animated indicator where the result will appear (or in the control) after about 1 s, with text saying what is happening (CMP-10). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0020 · "Few left" slots are shown above the Morning and Afternoon headings, out of time order, while the DOM keeps them in place

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0020 | "Few left" slots are shown above the Morning and Afternoon headings, out of time order, w… | 3 · major | 1 · one value or token | WCAG 1.3.2 | Meaningful sequence |

**Problem.** Visual order and reading order should convey the same sequence (1.3.2), and grouping shown visually should match the programmatic grouping (1.3.1). In the slot grid every 'Few left' slot is drawn in a separate block above the 'Morning' heading, so 08:20, 09:20, 12:00, 12:20 … appear before 08:00 and outside both day-part groups. The ARIA snapshot keeps them in chronological order under 'Morning' [level=3] and 'Afternoon' [level=3]. A screen-reader user hears '08:00, 08:20 Few left, 08:40 …' under Morning, while a sighted user sees 08:20 in an unlabelled block above Morning and a gap in the Morning list. The scripted keyboard walk already reports the resulting focus jump (A11Y-03, 2.4.3); this record covers the reading sequence and the mismatched grouping, which the walk does not judge. Residents who use a screen reader together with sight, or sighted helpers guiding them, may get a different slot order than the one on screen. Sighted residents scanning by time may miss slots, because 08:20 and the other near-full slots are missing from the Morning list where they would look for them.

**Evidence.** Where: / `#slots > button.slot:nth-of-type(2)` at 1280 px; / [date-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(2)` at 1280 px and 7 more. E1, reproduced or measured · evidence/screens/root/default/1280-light.png, evidence/screens/root/date-chosen/320-light.png, evidence/aria/root/default/1280-light.yml, app.js:1:6099 · found by 6 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Keep each slot in its chronological place inside its Morning or Afternoon group and mark scarcity on the slot itself (the 'Few left' tag already does this). Do not move slots with CSS order or a separate grid. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.3.1 Info and relationships; A11Y-26 —; H2-2 Match between system and the real world; WCAG 2.4.3 Focus order; H2-4 Consistency and standards; CW-Q2 Is the action visible?; H2-8 Aesthetic and minimalist design

#### F-0022 · Cancelled booking page keeps the heading "Booked" and the gate instructions

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0022 | Cancelled booking page keeps the heading "Booked" and the gate instructions | 3 · major | 2 · one component or file | WCAG 2.4.6 | Headings and labels |

**Problem.** Headings should describe the topic of the content (2.4.6). On /done.html with status=cancelled, the h1 still reads 'Booked'. Below 'Status: cancelled. This booking is not on the gate's list.' the page still says 'Show this at the gate…' and 'A reminder will be sent to your mobile the evening before.' The ARIA outline gives a screen-reader user who navigates by headings 'Booked' and 'Your reference' only. The cancelled status is a paragraph and is not part of any heading. A resident whose booking was cancelled may read or hear 'Booked', go to the centre with a loaded car and be turned away at the gate, which is the outcome the service exists to prevent.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `main h1` at 1280 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `h1` at 375 px; /done.html [cancelled] `h1` at 375 px and 2 more. E1, reproduced or measured · evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light.yml, evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light.png, evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.png, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.yml · found by 6 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** For a cancelled booking, use an h1 such as 'Booking cancelled'. Remove the gate and reminder instructions and offer 'Book another slot' as the main action. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; A11Y-26 —; H2-2 Match between system and the real world; H2-4 Consistency and standards; DES-hierarchy —

#### F-0023 · Booking confirmation shows only the reference, not the day, slot or vehicle booked

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0023 | Booking confirmation shows only the reference, not the day, slot or vehicle booked | 3 · major | 2 · one component or file | H2-6 | Recognition rather than recall |

**Problem.** A process should not rely on the user remembering details from earlier screens (cognitive-load checklist: no memory bridges; H6). The done page (status=booked) shows the reference DR-204117, the gate instructions and 'Book another slot'. It does not show the day, the 20-minute slot, the vehicle or the waste. All four were on the confirm page one step earlier and are in the page URL. Residents, many of them older, must remember the slot time from the previous screen. The gate checks the vehicle against the booking, so a resident who forgets the slot time or which vehicle they booked may arrive at the wrong time or in the wrong vehicle and be turned away.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `role=region[name="Your reference"]` at 1280 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `role=region[name="Your reference"]` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `main` at 375 px and 2 more. E1, reproduced or measured · evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/1280-light.yml, evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/1280-light.png, evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/default/1280-light.yml, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.yml · found by 6 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Repeat the booking summary (day, slot time range, vehicle, waste) beside the reference on the done page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P1 · Status open · Also: A11Y-21 ; H2-1 Visibility of system status; CW-Q4 Will the user understand the feedback?; DES-hierarchy —

#### F-0031 · 'Book this slot' shows no visible pending state during the 1.5 s submission

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0031 | 'Book this slot' shows no visible pending state during the 1.5 s submission | 3 · major | 2 · one component or file | CMP-04 | Response feedback |

**Problem.** A control should acknowledge activation within about 100 ms. On click the script only sets aria-busy="true" on #book; styles.css has no rule for [aria-busy], the label does not change, the button is not disabled and no progress text appears for 1.5 s. Residents may think the tap did not register and tap again (which triggers code-04) or leave the page.

**Evidence.** Where: /confirm.html [submitting] `#book`; /confirm.html `#book` at 375 px. E1, reproduced or measured · app.js:1:11638, probes/13/, verifier-3/out2/screenshots/book-t0.png, verifier-3/out2/screenshots/book-t600.png · found by 2 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Show a visible pending label such as 'Booking…' and disable or guard the button until the result. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-5 Error prevention

#### F-0033 · Today's slots before the cut-off are offered as free but rejected at booking

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0033 | Today's slots before the cut-off are offered as free but rejected at booking | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** DESIGN.md: 'Do show a slot as free only when it is.' The slot generator j() marks slots free/few/full with no regard to the current time, so on today every slot from 08:00 is selectable. Only at the final Book step, after 1.5 s, does the script reject any slot before minute 635 (10:35) today with 'The HH:MM slot today can no longer be booked.' That error item has no link back to the slot step. Residents booking for today may complete three steps and enter personal details for a slot that could never be booked.

**Evidence.** Where: /index.html [today] `#slots .slot`; /confirm.html [error] `#error-summary`. E1, reproduced or measured · app.js:1:11909, verifier-2/out1/aria.yml, verifier-2/out10/aria.yml, verifier-2/out10/screenshots/after-book.png · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Render past slots today as unavailable in the grid, using the same cut-off the booking check uses. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: DESIGN.md Do's: show a slot as free only when it is —; CMP-03 Disabled states

#### F-0034 · Permit number format is checked only at the final booking step, with no link to the field

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0034 | Permit number format is checked only at the final booking step, with no link to the field | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Errors should be caught where the input is given. The permit field is on the vehicle step, but that step's Next validates only vehicle and waste; the DRC-nnnnn format is checked only after Book on the confirm step, 1.5 s later, and the error item has no href, while the field it concerns is on another page. Van and trailer owners may finish the form and only then learn the permit is wrong, then have to find their way back to the vehicle step.

**Evidence.** Where: /vehicle.html `#next`; /confirm.html [error] `#error-summary`. E1, reproduced or measured · app.js:1:12118, verifier-3/out2/screenshots/confirm-badpermit.png, verifier-3/out2/aria.yml, verifier-3/out6/aria.yml · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Validate the permit on the vehicle step's Next with an inline error; on confirm, link the error to vehicle.html#permit. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-9 Help users recognize, diagnose and recover from errors; WCAG 3.3.1 Error identification

#### F-0104 · Slot hold time limit is never stated

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0104 | Slot hold time limit is never stated | 3 · major | 3 · several components or one flow | WCAG 2.2.1 | Timing adjustable |

**Problem.** A chosen slot lapses within a few minutes (observed: lapsed when 'Book this slot' was pressed about 5.5 minutes after reaching the confirm step), but no step mentions a hold or its length, so a resident who fills in the details slowly loses the slot without warning. Residents who take time over their details may lose the slot after filling the whole form and not know how to recover.

**Evidence.** Where: /confirm.html [hold-expired] `#error-summary`; /confirm.html [hold-expired] `#book`. E1, reproduced or measured · app.js:1:4078, <tmp> <tmp> <tmp> · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** State the hold length near the slot summary and link the expiry error to index.html. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: H2-9 Help users recognize, diagnose and recover from errors; H2-1 Visibility of system status

#### F-0043 · How long a chosen slot is held is never shown

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0043 | How long a chosen slot is held is never shown | 3 · major | 3 · several components or one flow | CW-Q4 | Will the user understand the feedback? |

**Problem.** When a choice is held only for a limited time, the user should be told at the moment of choosing and reminded while they finish. Choosing 09:20 only tints the button; neither the slot page, the vehicle page nor the confirm page says the slot is held or for how long. The captured 'expired' state shows the hold can lapse before 'Book this slot' is pressed. A resident who stops to find their registration or answer the door may lose the slot without warning and have to start choosing again, possibly losing the Saturday morning time.

**Evidence.** Where: / [slot-chosen] `.slot[data-slot="09:20"]` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden `role=region[name="Your booking"]` at 375 px; / [slot-chosen] `#next` at 375 px and 2 more. E1, reproduced or measured · evidence/aria/root/slot-chosen/375-light.yml, evidence/aria/vehicle-html-date-2026-10-17-slot-09-20/default/375-light.yml, evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/default/375-light.yml, evidence/screens/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/375-light.png · found by 3 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** State the hold period when a slot is chosen and show the remaining time on later steps. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; WCAG 2.2.1 Timing adjustable; H2-5 Error prevention

#### F-0064 · Missing or malformed van permit is only flagged on the last step, after all details are typed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0064 | Missing or malformed van permit is only flagged on the last step, after all details are t… | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** On the vehicle step, Van with an empty permit, or with '12345' (no DRC- prefix, despite the hint 'Starts DRC-, then five digits'), passes Next without any message. Confirm then shows 'Van, no permit given' or 'Van, permit 12345' without comment; only after filling registration, name, mobile and postcode and pressing Book this slot does 'A van needs a permit number (DRC- and five digits).' appear. Unlike the other errors, this one is plain text, not a link to the field, which is on a different page. Van and trailer residents complete the whole form before learning the permit is wrong, then must find Change vehicle to fix it; error prevention at the point of entry is absent for a rule that otherwise gets them turned away.

**Evidence.** Where: /vehicle.html [van] `#permit` at 375 px. E1, reproduced or measured · probes/11/screenshots/van-empty-permit.png, probes/10/screenshots/bad-permit.png, probes/17/aria.yml, probes/12/screenshots/van-nopermit-booked.png · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: single location · Priority P1 · Status open · Also: H2-9 Help users recognize, diagnose and recover from errors

#### F-0079 · No indication that a chosen slot is held only for a limited time

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0079 | No indication that a chosen slot is held only for a limited time | 3 · major | 3 · several components or one flow | H2-1 | Visibility of system status |

**Problem.** Nothing on the slot, vehicle or confirm steps says that a chosen slot is held, or for how long, although an expired-hold state exists. Residents do not know how long a chosen slot is held (context.md). Residents booking 'while doing something else' may pause mid-form and lose the slot without warning.

**Evidence.** E1, reproduced or measured · evidence/screens/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/default/375-light.png, evidence/screens/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/375-light.png, <tmp> <tmp> · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P1 · Status open

#### F-0045 · Permit number field shown before a vehicle is chosen, with no sign it is only for vans and trailers

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0045 | Permit number field shown before a vehicle is chosen, with no sign it is only for vans an… | 2.67 · major | 1 · one value or token | CW-Q1 | Does the effect of the action match the user’s goal? |

**Problem.** A field that applies only to some users should be shown only to them, or labelled with who needs it. On the vehicle page, 'Permit number — Starts DRC-, then five digits.' appears under the vehicle buttons before any vehicle is chosen. Nothing visible says it is for vans and cars with trailers only; that is explained only behind an icon-only (i) button ('About vans and trailers'). A first-time resident with an ordinary car, who does not know only vans and trailers need a permit, may think they need a permit they do not have, stop to look for one, or abandon the booking.

**Evidence.** Where: /vehicle.html?date=2026-10-17&slot=09:20 `role=textbox[name="Permit number"]` at 375 px; /vehicle.html?date=2026-10-17&slot=09:20 `#permit` at 375 px; /vehicle.html?date=2026-10-17&slot=09:20 [errors] `#permit` at 375 px and 1 more. E1, reproduced or measured · evidence/screens/vehicle-html-date-2026-10-17-slot-09-20/default/375-light.png, evidence/aria/vehicle-html-date-2026-10-17-slot-09-20/info-open/375-light.yml, evidence/screens/vehicle-html-date-2026-10-17-slot-09-20/errors/375-light.png, evidence/aria/vehicle-html-date-2026-10-17-slot-09-20/default/375-light.yml · found by 4 of 12 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Show the permit field only after Van or Car with trailer is chosen, or label it 'Vans and trailers only'. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-2 Match between system and the real world; H2-5 Error prevention; H2-8 Aesthetic and minimalist design; DES-execution —

#### F-0047 · Change slot opens the When page reset to Today, with no sign that an existing booking is being changed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0047 | Change slot opens the When page reset to Today, with no sign that an existing booking is … | 2.67 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** Activating 'Change slot' on Check and book opens the When page headed 'Book a slot' with 'Today' pressed and Today's slots shown (after the usual load gap); the previously chosen day and slot are not preselected and nothing says the vehicle, waste or entered details are kept. Residents changing a booking, who do not know whether changing keeps the rest, may think they have started a new booking and abandon or go back; they may also not notice the day was reset and read the empty slot area under 'Today' as no slots or still loading.

**Evidence.** Where: /index.html [after Change slot from confirm] `role=heading[name="Book a slot"]` at 375 px; /index.html [after Change slot from confirm] `role=group[name="Day"] >> role=button[name="Today"]` at 375 px. E1, reproduced or measured · probes/2/, probes/2/final.png, probes/9/, verifier-2/out14/screenshots/after-change-300.png · found by 1 of 12 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** When arriving from Change slot, preselect the booked day and slot, and say that the vehicle, waste and details are kept (for example a line naming the current booking and a button that returns to Check and book). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CW-Q1 Does the effect of the action match the user’s goal?; H2-1 Visibility of system status; H2-6 Recognition rather than recall

#### F-0069 · Permit number field is shown when Car is selected

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0069 | Permit number field is shown when Car is selected | 2.67 · major | 1 · one value or token | H2-8 | Aesthetic and minimalist design |

**Problem.** With Car selected (or no vehicle), the Permit number field and its hint stay visible between the vehicle choice and the waste list. Cars need no permit, so the field asks car drivers for something they do not have. Car residents, the primary group, may stop to wonder whether they need a permit or try to obtain one.

**Evidence.** Where: /vehicle.html `#permit` at 375 px. E1, reproduced or measured · probes/11/screenshots/car.png, verifier-3/out1/screenshots/v-car-1600.png · found by 1 of 12 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: single location · Priority P1 · Status open · Also: H2-2 Match between system and the real world

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
| F-0038 | Done page shows a placeholder reference 'DR-000000' when no booking exists | 2.33 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0056 | Permit rules are hidden behind an icon-only (i) button next to the vehicle choices | 2.33 · minor | 2 · one component or file | H2-10 | Help and documentation | E1 | open |
| F-0025 | "This slot is no longer available" error gives no next step and blanks the slot | 2 · minor | 2 · one component or file | H2-9 | Help users recognize, diagnose and recover from errors | E1 | open |
| F-0032 | Slot list loads for 900 ms with no loading indicator, and Next silently does nothing mean… | 2 · minor | 2 · one component or file | CMP-04 | Response feedback | E1 | open |
| F-0036 | 'Few left' tag uses an undeclared amber with low computed contrast in both themes | 2 · minor | 1 · one value or token | WCAG 1.4.3 | Contrast, minimum | E1 | open |
| F-0042 | Next is far below the chosen slot on phones, with no prompt to continue | 2 · minor | 2 · one component or file | CW-Q2 | Is the action visible? | E1 | open |
| F-0059 | Waste row in the booking summary has no change link | 2 · minor | 1 · one value or token | H2-3 | User control and freedom | E1 | open |
| F-0085 | 'Few left' chip text appears lighter than the declared warning colour | 2 · minor | 1 · one value or token | DES-execution | — | E1 | open |
| F-0057 | Permit help says 'Apply on the council site' without a link | 1.67 · minor | 1 · one value or token | H2-10 | Help and documentation | E1 | open |
| F-0058 | Vehicle step does not show the day and slot already chosen | 1.67 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0103 | Previous day's caption stays shown while the new day loads | 1.67 · minor | 1 · one value or token | H2-1 | Visibility of system status | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0040 | Slot status line gets aria-live only after its first update | 1.33 · cosmetic | 1 · one value or token | WCAG 4.1.3 | Status messages | E1 | open |
| F-0026 | Selected day in forced colours differs from the others only by a slightly heavier border | 1 · cosmetic | 2 · one component or file | A11Y-22 | — | E1 | open |

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
| F-0081 | Booking reference has no focal treatment on the done page | 2 | /done.html |
| F-0082 | Identity is only the council name; 'plain, not bare' lands on bare | 1 | /, /vehicle.html |
| F-0083 | Done page at wide widths: half-width card under a full-width card and an empty band below… | 2 | /done.html, / |
| F-0084 | Expired state shows a bare dash placeholder in the Slot row | 1 | /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired |
| F-0086 | Info (i) button styled as a fourth equal option in the vehicle segmented control | 1 | /vehicle.html?date=2026-10-17&slot=09:20 |
| F-0092 | Identity is only the council name and a generic bin glyph; nothing from the recycling cen… | 2 | / |
| F-0094 | Day buttons and vehicle buttons use different text weight, colour and selected treatment | 1 | /, /vehicle.html |

## 5. Divergent and disputed findings: questions for user research

None diverged by the rating rule (spread < 2 everywhere). Open questions worth testing with residents:
- Do residents read the "Few left" block as "the best slots" or miss the earlier times? (Raters agreed on severity; behaviour is unknown.)
- How long do residents actually take on the confirm step on a phone? This decides how much the unstated 5-minute hold matters.
- The design panel judged the look plain and only partly specific to the service; whether residents care is a question for a desirability check, not a blocker.

Needs a human: IME composition on Enter (F-0039); a VoiceOver and TalkBack pass of both journeys; 200% zoom on a real phone; the 2.2.1 timing judgement for the hold.

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | pass | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0020 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0020 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | pass | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | pass | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001, F-0036, F-0085 |
| 1.4.4 | AA | Resize text | scripted | pass | — |
| 1.4.5 | AA | Images of text | agent-judged | pass | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0009 |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | pass | — |
| 1.4.13 | AA | Content on hover or focus | agent-judged | pass | — |
| 2.1.1 | A | Keyboard | scripted | pass | — |
| 2.1.2 | A | No keyboard trap | scripted | pass | — |
| 2.1.4 | A | Character key shortcuts | agent-judged | pass | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0025, F-0037, F-0104, F-0043 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | pass | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | needs-human | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0017, F-0020 |
| 2.4.4 | A | Link purpose in context | agent-judged | pass | — |
| 2.4.5 | AA | Multiple ways | agent-judged | not_applicable | — |
| 2.4.6 | AA | Headings and labels | agent-judged | fail | F-0022 |
| 2.4.7 | AA | Focus visible | scripted | fail | F-0016 |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | fail | F-0016 |
| 2.5.1 | A | Pointer gestures | agent-judged | pass | — |
| 2.5.2 | A | Pointer cancellation | scripted | pass | — |
| 2.5.3 | A | Label in name | agent-judged | pass | — |
| 2.5.4 | A | Motion actuation | agent-judged | pass | — |
| 2.5.7 | AA | Dragging movements | agent-judged | pass | — |
| 2.5.8 | AA | Target size, minimum | scripted | pass | — |
| 3.1.1 | A | Language of page | scripted | pass | — |
| 3.1.2 | AA | Language of parts | scripted | pass | — |
| 3.2.1 | A | On focus | scripted | pass | — |
| 3.2.2 | A | On input | agent-judged | pass | — |
| 3.2.3 | AA | Consistent navigation | scripted | pass | — |
| 3.2.4 | AA | Consistent identification | scripted | pass | — |
| 3.2.6 | A | Consistent help | scripted | pass | — |
| 3.3.1 | A | Error identification | scripted | fail | F-0034 |
| 3.3.2 | A | Labels or instructions | agent-judged | pass | — |
| 3.3.3 | AA | Error suggestion | agent-judged | pass | — |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | pass | — |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_applicable | — |
| 4.1.2 | A | Name, role, value | agent-judged | pass | — |
| 4.1.3 | AA | Status messages | scripted | fail | F-0015, F-0040 |

Totals by coverage: auto 1 · scripted 22 · agent-judged 22 · needs-human 9; by state: pass 33 · fail 11 · not_run 9. This matrix is not a conformance claim (QUALITY-BAR §8).

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
- Page titles (2.4.2): not shown in captures or probe records available to the auditor. (a11y)
- Slot hold duration and timeout warning (2.2.1): the fixture only exposes an already-expired hold. (a11y)
- Rendered contrast of the 'Few left' tag: computed from HSL here, not measured; uie audit should measure it. (code)
- Actual overflow width at 320-360 px: computed from the formula, not measured in the rendered UI. (code)
- Whether a loading indication appears while Saturday's slots load (persona does not know they take a moment): needs a probe of the day click. (cw-1)
- Whether the permit field hides once Car is chosen: Car-selected state not captured, not probed. (cw-1)
- How long a chosen slot is held, and whether any countdown appears on later pages over time: needs a timed probe. (cw-1)
- Whether 'Full' slot buttons can be selected and what happens if one is (they are exposed as buttons in the inventory, e.g. '11:00 Full'); needs a probe. (he-1)
- Whether 'Today' (Monday 12 October) offers slots whose start time has already passed (08:00-10:00 are shown free in root/default); depends on the app clock, needs a probe. (he-1)
- Whether the Permit number field hides when 'Car' is chosen; in vehicle/default it is visible before any vehicle is chosen. (he-1)
- Whether 'Change slot' from confirm keeps the vehicle, waste and typed details (change-slot journey); needs a probe. (he-1)
- Whether 'Book this slot' gives in-progress feedback while submitting, and whether double submission is prevented. (he-1)
- Whether the slot list shows a loading state after choosing a day (journey persona notes slots take a moment to appear). (he-1)
- Where 'Back to the slots' returns to and whether the chosen day and slot are kept. (he-1)
- Whether 'Book this slot' is still actionable after the expired message, with the slot row showing '–'. (he-1)
- Whether a double tap on Book this slot creates two bookings: I saw no visual change during submission (finding 6) but did not attempt a double submission. (he-2)
- Whether the Opening days header link on vehicle and confirm discards the booking in progress: not probed. (he-2)
- How long a chosen slot is held before the expired state occurs: the expired state is seeded by a URL parameter, so the real hold length could not be observed. (he-2)
- Whether 'Change slot' (href index.html) and 'Change vehicle' (href vehicle.html) on /confirm.html keep the chosen vehicle, waste and entered details: the links carry no query parameters in the ARIA snapshot, which suggests data may be lost, but this needs a probe (journey change-slot). Potential H3/H6 - unverified. (he-3)
- 'Back to the slots' on /vehicle.html links to index.html without date/slot; whether the previous choice is restored is unverified. (he-3)
- Whether past slots for 'Today' are selectable after their start time (root/default shows 08:00 enabled on Monday 12 October, but the capture clock time is unknown). Potential H5 - unverified. (he-3)
- Loading feedback while slots appear after choosing a day (journey says slots 'take a moment to appear'). Potential H1 - unverified. (he-3)
- Focus movement to the error summary on submit (recipes expect role=alert focused, but I could not observe it) and focus return after toggling 'About vans and trailers'. (he-3)
- What 'Another day' opens and whether it is keyboard operable. (he-3)
- Whether choosing Car after Van clears or ignores an entered permit number. (he-3)
- Double-submit of 'Book this slot' and browser Back after booking. (he-3)
- Motion, focus rings, hover and the info-open interaction cannot be judged from stills beyond their captured state. (critic-1)
- Motion (120 ms fades) and hover/focus states cannot be judged from stills; no baseline, so pairwise was not run (DES-05 not_applicable). (critic-3)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0009, F-0015, F-0016, F-0017, F-0018 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (1 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (1 finding(s)); A11Y-04 (1 finding(s)) ….
3. For L2: USE-05 (2 open P0 finding(s)); USE-06 (22 P1 finding(s) without a recorded decision); USE-08 (2 top task(s) not completable); USE-09 (interaction coverage 29% < 90%); DES-02 (0/3 critics judged it specific) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (24 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

