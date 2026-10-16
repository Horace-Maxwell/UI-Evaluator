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

# UI evaluation report: Dunmore recycling centre booking · run 20261016-125619-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:b5bc606067 (uncommitted changes present) · run opened 2026-10-16T16:56:19.572Z |
| Input situation | live UI without source review (FRAMEWORK §14) |
| Surfaces and modes | when (operate), vehicle (operate), confirm (operate), confirm (operate), done (read), done (read) |
| Routes × states | 6 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-16T16:55:32.194Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | 0393a5d7 0393a5d7 0393a5d7 |
| walkthrough-evaluator | 2 | subagent | claude-opus-5-5 | d59436e3 bca87b8c |
| design-critic | 3 | subagent | claude-opus-5-5 | 882193bc 882193bc 882193bc |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 06e2c044 |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 030f32e5 a9c5b15c |
| finding-verifier | 4 | subagent | claude-opus-5-5 | 4022f814 83f32a18 3a1b5a99 19ff1dc5 |
| severity-rater | 3 | subagent | claude-opus-5-5 | 6f1265c0 9ae85804 435a59dc |

Coverage: 540 valid capture(s); 92% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (1 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (2 finding(s)); A11Y-04 (2 finding(s)); A11Y-07 (2 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-07 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-04, A11Y-07, A11Y-11, A11Y-15, A11Y-17, A11Y-27 |
| G3 Craft floor | fail | COL-01, CMP-04, CPY-04, I18N-03 |
| G4 Deliberateness and anti-slop | not_run | SLP-11, SLP-26, SLP-35, SLP-36, SLP-37, SLP-01 (degraded), SLP-02 (degraded), SLP-03 (degraded), SLP-04 (degraded), SLP-08 (degraded), SLP-09 (degraded), SLP-10 (degraded), SLP-12 (degraded), SLP-13 (degraded), SLP-14 (degraded), SLP-15 (degraded), SLP-20 (degraded), SLP-22 (degraded), SLP-23 (degraded), SLP-24 (degraded), SLP-25 (degraded), SLP-27 (degraded), SLP-31 (degraded), SLP-34 (degraded), SLP-38 (degraded), SLP-39 (degraded), SLP-40 (degraded), SLP-45 (degraded) |
| G5 Analytical usability | fail | USE-05, USE-06, USE-08 |
| G6 Design quality | fail | DES-02, DES-03, DES-04, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- **Dark mode is coherent at phone width.** Background, cards, borders, buttons and links invert cleanly, and body text holds contrast; the only dark-mode text-contrast failure is the "Few left" tag (capture `evidence/screens/root/date-chosen/375-dark.png`, 375 px dark).
- **The reference is large and given its own card**, with plain gate instructions (capture `evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-dark.png`, 375 px dark).
- **Rules are stated where they apply:** opening days, slot length, the two-a-week limit and the permit rule sit under the slot list on the phone (same capture as the first strength).
- **Both journeys replay end to end** (book-a-slot 17/17 steps; change-slot 9/9). Axe found no violations except the contrast of the tag. The target-size, form-label, language and dialog checks ran clean.

- Error summary takes focus, links to each field and moves focus to the control (vehicle step and confirm step)
- Slot status is shown in words ('Few left', 'Full') as well as colour, so it survives CVD and forced colours
- Changing the slot keeps the resident's earlier answers
- Personal-data inputs carry correct autocomplete (name, tel, postal-code) and registration/permit are autocomplete=off
- Motion limited to 120 ms background-color and opacity with a prefers-reduced-motion override, matching DESIGN.md
- Runtime light and dark colour roles match DESIGN.md hex values within rounding (except 'few')
- Every interactive control has hover, active and aria-pressed/expanded styling via tokens
- Check-and-book summary restates day, 20-minute slot window, vehicle and waste with Change links

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.45 (mean Jaccard over 3 passes); an estimated 1.0 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0017 · Focus order jumps back: "08:00" → "08:20 Few left"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0017 | Focus order jumps back: "08:00" → "08:20 Few left" | 4 · catastrophe (rule) | 1 · one value or token | A11Y-03 | Keyboard |

**Problem.** After "08:00", Tab moves to "08:20 Few left", which sits 216 px above it in the same column; the focus order does not follow the visual reading order (clear-inversion heuristic).

**Evidence.** Where: / `#slots > button.slot:nth-of-type(2)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px. E1, reproduced or measured · evidence/crops/keyboard/4be89c6678.png, evidence/crops/keyboard/2ec11cd4f9.png, evidence/crops/keyboard/c494d4a9db.png. Ratings: rule: 4.

**Recommendation.** Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.4.3 Focus order

#### F-0027 · Double activation of 'Book this slot' turns the booking into a cancellation

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0027 | Double activation of 'Book this slot' turns the booking into a cancellation | 4 · catastrophe | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A submit button should ignore repeat activation while a request is pending. In oe(), a click while the 1500 ms timer is pending sets f=true and relabels the button 'Cancel booking'; when the timer fires the button is relabelled 'Book this slot' and the booking is saved with status 'cancelled' and the user is sent to done.html, whose h1 still reads 'Booked' with a status line saying the booking is not on the gate's list. A double tap or an impatient second tap is enough to trigger it (reproduced by the verifier), and the relabelled button may go unnoticed, because the timer resets the label. Residents tapping twice on a phone may arrive at the gate with a reference the attendant does not have, while the confirmation page headline says 'Booked'.

**Evidence.** Where: /confirm.html [submitting] `#book`; /done.html [cancelled] `h1`. E1, reproduced or measured · app.js:1:11269, app.js:1:12317, <tmp> <tmp> · found by 1 of 12 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Ignore clicks while d is set (or disable the button with aria-disabled); offer cancellation as a separate, explicit action after booking, and make done.html's heading reflect the stored status. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: CMP-15 —; CMP-04 Response feedback

#### F-0061 · Mobile number is required although it is presented as only for a reminder

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0061 | Mobile number is required although it is presented as only for a reminder | 3.67 · catastrophe | 1 · one value or token | H2-5 | Error prevention |

**Problem.** The hint under 'Mobile number' reads 'For a reminder the evening before.', which reads as optional, but leaving it empty or giving a landline (0161 496 0000) blocks booking with 'Enter a UK mobile number, like 07700 900123'. Nothing says it is required or why booking needs it. Many residents are older; those with only a landline cannot complete a booking, and others are surprised by an error on a field they thought optional.

**Evidence.** Where: /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden [errors] `#phone` at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261016-125619-audit-standard/probes/37/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-125619-audit-standard/evidence/screens/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/errors/375-light.png, <tmp> <tmp> · found by 1 of 12 evaluator(s). Ratings: 3.67 (spread 1; 4, 3, 4).

**Recommendation.** none given by the evaluators.

Problem type: single location · Priority P0 · Status open · Also: H2-2 Match between system and the real world

### P1

#### F-0056 · No online way to change or cancel a booking once it is made

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0056 | No online way to change or cancel a booking once it is made | 3.33 · major | 4 · information architecture or architecture | H2-3 | User control and freedom |

**Problem.** Residents changing a booking know their reference and want to move the slot. After booking, the only route offered is 'If you cannot come, call 01632 960771 on a weekday'; there is no way to find a booking by reference, change its slot or cancel it on the site, while the phone line is only open weekdays 09:00 to 17:00 and bookings are usually made in the evening or for weekends. A resident whose Saturday plans change on Friday evening cannot free or move the slot; the slot stays taken and they may book a second one against the two-per-week limit.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `region "At the centre"` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `main` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `role=region[name="At the centre"]` at 375 px. E1, reproduced or measured · <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-125619-audit-standard/probes/33, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.yml, packets/heuristic-evaluator-3/context.md, .ui-evaluator/runs/20261016-125619-audit-standard/probes/60/aria.yml · found by 3 of 12 evaluator(s). Ratings: 3.33 (spread 1; 3, 3, 4).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P1 · Status open · Also: H2-7 Flexibility and efficiency of use; ISO-9241-110-suitability-for-the-task —

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
| F-0009 | Horizontal page overflow on / | 3 · major (rule) | 1 · one value or token | FUN-05 | No horizontal page overflow at any matrix width |

**Problem.** scrollWidth 335 px > clientWidth 320 px at 320 px. Widest offender: #slots > div.slots__head:nth-of-type(1) extends 15 px past the viewport; 10 more.

**Evidence.** Where: / `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px. E1, reproduced or measured · evidence/crops/layout/d0feed3b9b.png, evidence/crops/layout/b1c65f8268.png, evidence/crops/layout/36425b0e42.png. Ratings: rule: 3.

**Recommendation.** Constrain the element (max-width: 100%, min-width: 0 on flex and grid children, overflow-wrap: anywhere) or give genuinely 2-D content its own scroll region and declare it in two_d_regions. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open

#### F-0010 · Content does not reflow at 320 px on /

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0010 | Content does not reflow at 320 px on / | 3 · major (rule) | 1 · one value or token | A11Y-07 | Reflow at 320 CSS px without two-dimensional scrolling |

**Problem.** scrollWidth 335 px > clientWidth 320 px at 320 px. Widest offender: #slots > div.slots__head:nth-of-type(1) extends 15 px past the viewport; 10 more.

**Evidence.** Where: / `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px. E1, reproduced or measured · evidence/crops/layout/35cdee278c.png, evidence/crops/layout/816b6d868b.png, evidence/crops/layout/031de4562c.png. Ratings: rule: 3.

**Recommendation.** Constrain the element (max-width: 100%, min-width: 0 on flex and grid children, overflow-wrap: anywhere) or give genuinely 2-D content its own scroll region and declare it in two_d_regions. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.10 Reflow

#### F-0016 · No visible focus indicator: "08:00"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0016 | No visible focus indicator: "08:00" | 3 · major (rule) | 1 · one value or token | A11Y-04 | Focus visible |

**Problem.** Tab focus on "08:00" changes 0 pixels within its box + 4 px (focused vs blurred crop), so no focus position is visible.

**Evidence.** Where: / `#slots > button.slot:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(6)` at 320 px and 1 more. E1, reproduced or measured · evidence/keyboard/root/default/320-light/stop-9-focused.png, evidence/keyboard/root/date-chosen/320-light/stop-3-focused.png, evidence/keyboard/root/slot-chosen/320-light/stop-1-focused.png, evidence/keyboard/root/default/320-light/stop-9-blurred.png. Ratings: rule: 3.

**Recommendation.** Give every focusable element a :focus-visible indicator from the focus tokens (e.g. a 2 px outline with offset); never remove outline without a replacement. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.7 Focus visible; A11Y-22 —

#### F-0018 · No progress shown during a 1.2 s operation: "Car with trailer"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0018 | No progress shown during a 1.2 s operation: "Car with trailer" | 3 · major (rule) | 1 · one value or token | CMP-04 | Response feedback |

**Problem.** "Car with trailer" runs for about 1201 ms; operations over 1 s must show progress, but nothing animated, no progressbar and no aria-busy region appears while it runs.

**Evidence.** Where: /vehicle.html?date=2026-10-17&slot=09:20 `#vehicle > button:nth-of-type(2)` at 1280 px. E1, reproduced or measured · evidence/crops/states/dc5af67435.png. Ratings: rule: 3.

**Recommendation.** Show an animated indicator where the result will appear (or in the control) after about 1 s, with text saying what is happening (CMP-10). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0020 · Slot grid shows "Few left" slots in a separate block above the Morning heading, out of DOM and time order

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0020 | Slot grid shows "Few left" slots in a separate block above the Morning heading, out of DO… | 3 · major | 1 · one value or token | WCAG 1.3.2 | Meaningful sequence |

**Problem.** Under 1.3.2 the reading order a screen reader or keyboard follows should match the order the page presents visually. In the DOM and the ARIA snapshot every slot sits in time order under the 'Morning' or 'Afternoon' heading (08:00, 08:20 Few left, 08:40 Few left ...). On screen, every 'Few left' slot from both halves of the day is moved into one block above the 'Morning' heading (on Saturday 17: 08:20, 08:40, 09:00, 09:40, 10:20, 10:40, 13:40, 14:00, 15:00, 16:40). Below that block, 'Morning' shows only 08:00, 09:20, 10:00 and the full slots. So the visual grouping (Morning/Afternoon), the time order and the DOM order disagree, at 320 px and at 1280 px. Afternoon slots such as 13:40 appear above the Morning heading. The keyboard check's 08:00 to 08:20 inversion is one symptom; this record covers the meaning: the heading structure the snapshot exposes does not match what sighted users see. Residents who use a screen reader together with sight (low vision, larger text), or a keyboard, may hear or tab through a sequence that does not match the grid they see, and may misread a 'Few left' afternoon slot as a morning slot. That makes it harder to book the right 20-minute slot, which is the scarce resource here.

**Evidence.** Where: / [date-chosen] `#slots .slot__tag--few` at 1280 px; / [slot-chosen] `#slots .slot__tag--few` at 1280 px; / `#slots .slot__tag--few` at 320 px and 5 more. E1, reproduced or measured · evidence/screens/root/slot-chosen/1280-light.png, evidence/screens/root/default/320-light.png, evidence/aria/root/date-chosen/1280-light.yml, app.js:1:6099 · found by 5 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Keep each slot in time order under its Morning or Afternoon heading and show scarcity in place, with the 'Few left' tag already in the button. If a 'nearly gone' summary is wanted, add it as a separate labelled list rather than moving slots with CSS order or grid placement. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.3.1 Info and relationships; A11Y-03 Keyboard; WCAG 2.4.3 Focus order; H2-4 Consistency and standards; CW-Q2 Is the action visible?; H2-2 Match between system and the real world

#### F-0023 · Done page heading reads "Booked" when the booking status is cancelled

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0023 | Done page heading reads "Booked" when the booking status is cancelled | 3 · major | 2 · one component or file | WCAG 2.4.6 | Headings and labels |

**Problem.** Under 2.4.6 headings must describe their topic. On /done.html with status=cancelled the h1 is still 'Booked'. Only a paragraph under 'Your reference' says 'Status: cancelled. This booking is not on the gate's list.', and the paragraphs after it still say 'Show this at the gate' and 'A reminder will be sent to your mobile the evening before'. The heading and the following text contradict the status. A screen-reader user who moves by headings hears 'Booked' and may go to the centre with a cancelled reference, where they would be turned away at the gate.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `role=heading[level=1]` at 1280 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `h1` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `h1` at 375 px and 2 more. E1, reproduced or measured · evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light.yml, evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light.png, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-125619-audit-standard/evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.png, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.yml · found by 5 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Set the h1 from the status ('Booking cancelled'), and hide or reword the gate and reminder lines when the booking is cancelled. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-4 Consistency and standards; H2-2 Match between system and the real world; DES-hierarchy —

#### F-0026 · Injected .slot:focus rule removes the keyboard focus indicator on slot buttons

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0026 | Injected .slot:focus rule removes the keyboard focus indicator on slot buttons | 3 · major | 1 · one value or token | A11Y-04 | Focus visible |

**Problem.** Every focusable control should show a visible :focus-visible indicator and outline should never be removed without a replacement. On the When page, te() appends a <style> element containing '.slot:focus{outline:0}'. Its specificity (0,2,0) beats the global ':focus-visible{outline:3px solid var(--c-focus)}' (0,1,0) in styles.css, and no other focus style is defined for .slot, so slot buttons get no focus indicator. The first-free slot is also focused programmatically when Next is pressed without a slot. Keyboard and switch users choosing a slot are likely to lose track of which slot has focus, and may book a slot they did not mean to.

**Evidence.** Where: /index.html [slots-loaded] `#slots .slot`. E1, reproduced or measured · app.js:1:5439, styles.css:1:713, scratchpad/p2/screenshots/tab-a.png, scratchpad/p2/screenshots/tab-c.png · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Delete the injected style; the global :focus-visible rule already covers .slot. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: WCAG 2.4.7 Focus visible; CMP-02 Focus indicator quality

#### F-0028 · Booking wait and slot loading show no visible progress

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0028 | Booking wait and slot loading show no visible progress | 3 · major | 2 · one component or file | CMP-10 | — |

**Problem.** An action taking over about 1 s should show visible progress. Booking waits 1500 ms with only aria-busy set on #book and no style for [aria-busy] in styles.css, so the button looks unchanged. Changing day clears the slot grid and status text and waits 900 ms with nothing in its place; during that time the When page's Next button returns silently (if(!h) guard) with no message. Residents may think the tap did not register and tap again, which on the confirm page triggers code-02; on the When page an empty grid may be read as no slots.

**Evidence.** Where: /confirm.html [submitting] `#book`; /index.html [loading] `#slots`. E1, reproduced or measured · app.js:1:6648, styles.css, <tmp> <tmp> · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Show a 'Booking…' label or spinner on #book and set #slots-status to 'Loading slots for <day>' while E() waits. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-04 Response feedback; H2-1 Visibility of system status

#### F-0031 · Permit field is visible for every vehicle because .field display overrides hidden

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0031 | Permit field is visible for every vehicle because .field display overrides hidden | 3 · major | 1 · one value or token | CMP-09 | — |

**Problem.** An element marked hidden should not render. #permit-wrap has class 'field', and '.field{display:flex}' in styles.css overrides the UA [hidden]{display:none}; unlike .date-row and .info__panel, there is no '.field[hidden]' rule. So the permit field shows even for 'Car', and the JS toggling of hidden (with an extra 1200 ms setTimeout before reveal) has no visible effect. Car drivers may think they need a permit and stop or look for one; the rule 'vans and trailers need a permit' is no longer tied to the choice.

**Evidence.** Where: /vehicle.html `#permit-wrap`; /vehicle.html [vehicle-car] `role=textbox[name="Permit number"]` at 375 px; /vehicle.html?date=2026-10-17&slot=09:20 `#permit` at 375 px and 4 more. E1, reproduced or measured · styles.css:1:2389, app.js:1:8521, .ui-evaluator/runs/20261016-125619-audit-standard/probes/50/screenshots/car-after-1800.png, .ui-evaluator/runs/20261016-125619-audit-standard/probes/50/aria.yml · found by 7 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Add a global [hidden]{display:none!important} (or .field[hidden]); reveal the field immediately rather than after 1200 ms, which would otherwise cause a late layout shift. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-8 Aesthetic and minimalist design; CW-Q4 Will the user understand the feedback?; H2-2 Match between system and the real world; H2-5 Error prevention; H2-6 Recognition rather than recall; DES-brandfit —; DES-hierarchy —

#### F-0032 · Today's past slots are offered as free and rejected only at final booking

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0032 | Today's past slots are offered as free and rejected only at final booking | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A slot should be shown as free only when it can be booked (DESIGN.md: 'Do show a slot as free only when it is'). The slot generator j() marks today's slots from 08:00 as free/few without regard to time, and the When step renders them selectable. Only after the user has completed vehicle, waste and personal details does the booking timeout reject slots before 10:35 (R(a.slot)<635) with an error-summary item that has no link. Residents booking for today may fill in three steps and then have to start over for a slot that was never available.

**Evidence.** Where: /confirm.html [error-past-slot] `#error-summary`; /index.html [today] `#slots .slot`. E1, reproduced or measured · app.js:1:11911, <tmp> <tmp> · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Render past slots for today as unavailable on the When step using the same cutoff. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open · Also: CMP-18 —

#### F-0033 · Permit format and closed-day checks run only at final booking, in unlinked errors

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0033 | Permit format and closed-day checks run only at final booking, in unlinked errors | 3 · major | 3 · several components or one flow | CMP-18 | — |

**Problem.** Errors should be detected where the input is made and link to the field. The permit entered on vehicle.html is only trimmed there; the DRC-##### format and the Wednesday-closed check run only in the confirm page's booking timeout, and are shown in the error summary as plain text with no href, so the summary offers no way back to the permit field on the previous page. Van and trailer users with a mistyped permit learn about it only after entering all their details and may not find where to fix it.

**Evidence.** Where: /confirm.html [error-permit] `#error-list li`; /vehicle.html?date=2026-10-17&slot=09:20 [van] `#permit` at 375 px; /vehicle.html?date=2026-10-17&slot=09:20 [van] `#permit` at 375 px and 2 more. E1, reproduced or measured · app.js, <tmp> <tmp> <tmp> · found by 3 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Validate the permit format on the vehicle step's Next, and link remaining summary errors to vehicle.html#permit. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-9 Help users recognize, diagnose and recover from errors; WCAG 3.3.1 Error identification; H2-5 Error prevention; H2-4 Consistency and standards

#### F-0035 · Five-minute slot hold expires with no warning or way to extend

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0035 | Five-minute slot hold expires with no warning or way to extend | 3 · major | 3 · several components or one flow | WCAG 2.2.1 | Timing adjustable |

**Problem.** A time limit should be announced and extendable. Choosing a slot stores hold_started; at booking, G() rejects holds older than 5 minutes, clears the slot and shows 'This slot is no longer available.' Nothing on any step states the limit or warns before it runs out. Residents who take time over the details (finding a registration or permit) may lose their slot at the last step without knowing a clock was running.

**Evidence.** Where: /confirm.html [hold-expired] `#error-summary`; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden `role=region[name="Your booking"]` at 375 px. E1, reproduced or measured · app.js:1:4142, evidence/aria/root/slot-chosen/375-light.yml, evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/375-light.yml, <tmp> · found by 2 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** State the hold beside the chosen slot and on the confirm summary, warn before expiry and allow extending it. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-5 Error prevention

#### F-0104 · No in-progress indication while the booking is submitted

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0104 | No in-progress indication while the booking is submitted | 3 · major | 1 · one value or token | CW-Q4 | Will the user understand the feedback? |

**Problem.** After 'Book this slot' the page and button stay unchanged for about 1.3 to 1.5 s until the Booked page loads. A first-time resident who does not know slots take a moment may conclude Saturday has no slots or that the tap failed, and may tap again; on submit a second tap may be made while the booking is in progress.

**Evidence.** Where: / [slots-loading (just after choosing Saturday 17)] `role=region[name="Slots"]` at 375 px; /confirm.html [submitting (just after Book this slot)] `role=button[name="Book this slot"]` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden,wood `#book` at 375 px. E1, reproduced or measured · probes/3/, probes/5/, probes/17/step-15.png, .ui-evaluator/runs/20261016-125619-audit-standard/probes/31/ · found by 2 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Show a short 'Finding slots for Saturday 17 October...' message in the Slots area and a busy state on the Book button that ignores repeat taps. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-5 Error prevention

#### F-0105 · No notice that the chosen slot is held or for how long

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0105 | No notice that the chosen slot is held or for how long | 3 · major | 3 · several components or one flow | CW-Q4 | Will the user understand the feedback? |

**Problem.** After a slot is chosen, no page says the slot is held or when the hold ends, so a resident who pauses cannot know they are about to lose it. Residents often book while doing something else; one who pauses to check the registration may lose the slot without warning and be left with an unexplained error.

**Evidence.** Where: /vehicle.html [default after choosing 09:20] `role=heading[name="Your vehicle and waste"]` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired [expired] at 375 px; / [slot-chosen] `#slots` at 375 px and 4 more. E1, reproduced or measured · probes/9/, probes/14/, evidence/screens/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/375-light.png, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-125619-audit-standard/evidence/screens/root/slot-chosen/375-light.png · found by 3 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Say 'Saturday 17 October, 09:20 held for you until HH:MM' on steps 2 and 3, and make the expired message say the hold ran out and link back to the slots. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-5 Error prevention

#### F-0044 · 'Booked' page does not show the booked day, slot time or vehicle

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0044 | 'Booked' page does not show the booked day, slot time or vehicle | 3 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** A confirmation meant to be shown at the gate should state what was booked. The done page shows 'Booked', the reference DR-265532, gate instructions and the reminder number, but not 'Saturday 17 October', '09:20 to 09:40' or 'Car'. The 20-minute arrival window is not restated. The resident cannot check from the confirmation that the booking is for Saturday morning, and on the day must remember the exact time; arriving outside the slot or with the wrong vehicle can mean being turned away.

**Evidence.** Where: /done.html [booked] `role=region[name="Your reference"]` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `main` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `main` at 375 px and 2 more. E1, reproduced or measured · probes/17/, .ui-evaluator/runs/20261016-125619-audit-standard/probes/29/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-125619-audit-standard/probes/11, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-125619-audit-standard/evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.png · found by 5 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Repeat day, slot window ('arrive between 09:20 and 09:40'), vehicle and registration next to the reference. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; H2-1 Visibility of system status; DES-hierarchy —

#### F-0048 · Change slot and Back to the slots reopen on Today instead of the chosen day

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0048 | Change slot and Back to the slots reopen on Today instead of the chosen day | 3 · major | 2 · one component or file | H2-6 | Recognition rather than recall |

**Problem.** Returning to change a choice should start from the current choice. Both 'Change slot' on /confirm.html and 'Back to the slots' on /vehicle.html open / with Today (Monday 12 October) pressed and its slots listed; the previously chosen Saturday 17 and 09:20 are not selected or mentioned, so the user must find and re-pick the day. In the change-slot journey a resident who wants the afternoon of the same Saturday is shown Monday's slots; a hurried user may pick 14:20 on the wrong day without noticing.

**Evidence.** Where: /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden,wood `role=link[name="Change slot"]` at 375 px; /vehicle.html?date=2026-10-17&slot=09:20 `role=link[name="Back to the slots"]` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden,wood `dd:nth-of-type(2) > a` at 375 px and 3 more. E1, reproduced or measured · .ui-evaluator/runs/20261016-125619-audit-standard/probes/19/, .ui-evaluator/runs/20261016-125619-audit-standard/probes/39/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-125619-audit-standard/probes/25, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-125619-audit-standard/probes/24 · found by 2 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Carry the chosen day (and slot) back to the slots page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-3 User control and freedom; H2-5 Error prevention

#### F-0060 · Slots that have already started today can be chosen and booked

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0060 | Slots that have already started today can be chosen and booked | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A slot whose start has passed should not be offered. With Today (Monday 12 October) chosen at the journey's stated time of 10:05, 08:00 is enabled, can be selected and 'Next' proceeds to the vehicle step; the morning slots up to 10:00 are presented as free ('20 slots free on Monday 12 October'). A resident booking for 'today' may take a slot they cannot arrive within and be turned away at the gate.

**Evidence.** Where: / `.slot[data-slot="08:00"]` at 375 px; / `#slots > button.slot:nth-of-type(1)` at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261016-125619-audit-standard/probes/10/, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-125619-audit-standard/probes/20, <round>/eval-21-audit-standard-slot-booking/with_skill/run-2/workspace/.ui-evaluator/runs/20261016-125619-audit-standard/evidence/screens/root/default/375-light.png, <tmp> · found by 2 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status

#### F-0077 · 'Few left' slots are pulled out of time order into an unlabelled group above Morning and Afternoon

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0077 | 'Few left' slots are pulled out of time order into an unlabelled group above Morning and … | 3 · major | 1 · one value or token | DES-hierarchy | — |

**Problem.** On 'when', every slot tagged 'Few left' is shown in a separate, unheaded block before the Morning and Afternoon grids. On Saturday the Morning grid reads 08:00, 09:20, 10:00, 11:00... with 08:20, 08:40, 09:00, 09:40, 10:20, 10:40 missing from it, because they sit in the block above. The same split happens at 375 (Monday: Morning starts 08:00, 08:40 Full, 09:00 while 08:20 and 09:20 are above). Residents scanning for 'Saturday morning' read the Morning grid as the whole morning and see gaps where free slots exist.

**Evidence.** Where: / [slot-chosen] at 1280 px; / at 375 px; / [date-chosen] at 1440 px and 2 more. E1, reproduced or measured · screens/root/slot-chosen/1280-light.png, screens/root/default/375-light.png, screens/root/date-chosen/1440-light.png, screens/root/slot-chosen/375-light.png · found by 2 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Decide whether scarcity or time is the organising order; if time, keep every slot in its Morning/Afternoon position and let the Few left tag mark scarcity in place. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open

#### F-0078 · Done page shows the reference but not the day, slot or vehicle booked

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0078 | Done page shows the reference but not the day, slot or vehicle booked | 3 · major | 2 · one component or file | DES-hierarchy | — |

**Problem.** The done page ('Booked') shows DR-204117 and generic instructions, but nowhere repeats the day, the 20-minute slot or the vehicle, although these were confirmed one step earlier and the gate checks the vehicle against the booking. The screen residents keep open or screenshot for the gate lacks the arrival time.

**Evidence.** Where: /done.html at 375 px; /done.html at 1440 px; /done.html at 375 px. E1, reproduced or measured · screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-dark.png, screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/1440-light.png, screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.png, .ui-evaluator/runs/20261016-125619-audit-standard/probes/60/aria.yml · found by 2 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Decide what the gate screen must carry to stand alone (the context says it is read from the phone at the gate with poor signal) and give it the same emphasis as the reference. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P1 · Status open · Also: DES-brandfit —

#### F-0015 · Status message not announced: "20 slots free on Monday 12 October"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0015 | Status message not announced: "20 slots free on Monday 12 October" | 2 · minor (rule) | 1 · one value or token | A11Y-15 | Status messages from async actions are exposed through `role=status… |

**Problem.** After Today, the message "20 slots free on Monday 12 October" appeared without moving focus, but its live region (#slots-status) was inserted together with the text; screen readers only announce changes to regions that already exist. Screen readers do not announce the outcome.

**Evidence.** Where: / `#slots-status` at 1280 px; / [date-chosen] `#slots-status` at 1280 px; /index.html [initial] `#slots-status`. E1, reproduced or measured · evidence/crops/live-regions/86e7793db0.png, evidence/crops/live-regions/029daa463c.png, index.html:58. Ratings: rule: 2.

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
| F-0030 | Slot grid at 360 px and below is sized wider than its container | 2.33 · minor | 1 · one value or token | A11Y-07 | Reflow at 320 CSS px without two-dimensional scrolling | E1 | open |
| F-0101 | 'Few left' tag text falls below 4.5:1 contrast | 2.33 · minor | 1 · one value or token | COL-01 | Token conformance | E1 | open |
| F-0045 | Change slot opens a fresh 'Book a slot' page with no sign of the booking being changed | 2.33 · minor | 2 · one component or file | CW-Q4 | Will the user understand the feedback? | E1 | open |
| F-0024 | Current step in the "Steps" list is marked only by bold text | 2 · minor | 1 · one value or token | WCAG 1.3.1 | Info and relationships | E1 | open |
| F-0025 | Expired-hold error says the slot is unavailable but not what to do next | 2 · minor | 1 · one value or token | WCAG 3.3.3 | Error suggestion | E1 | open |
| F-0038 | Slot end time and arrival rule exist only in a title tooltip | 2 · minor | 1 · one value or token | A11Y-17 | Pointer and keyboard static checks | E1 | open |
| F-0103 | No loading indication while slots load | 2 · minor | 2 · one component or file | CW-Q4 | Will the user understand the feedback? | E1 | open |
| F-0106 | Expired-slot error does not explain or guide recovery | 2 · minor | 1 · one value or token | CW-Q4 | Will the user understand the feedback? | E1 | open |
| F-0047 | Vehicle step does not show which day and slot were chosen | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0058 | Slot list goes blank under the previous day's date while new slots load | 2 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0062 | Permit help says to apply on the council site but gives no link | 2 · minor | 1 · one value or token | H2-10 | Help and documentation | E1 | open |
| F-0067 | The waste list can only be changed through a link labelled 'Change vehicle' | 1.67 · minor | 1 · one value or token | H2-4 | Consistency and standards | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0022 | Selected day button is not distinguishable from the other day buttons under forced colours | 1.33 · cosmetic | 1 · one value or token | A11Y-22 | — | E1 | open |
| F-0102 | 'Few left' colours are not DESIGN.md roles | 1 · cosmetic | 1 · one value or token | COL-01 | Token conformance | E1 | open |
| F-0068 | After an invalid date, the slots area still shows the previous day's result | 1 · cosmetic | 1 · one value or token | H2-1 | Visibility of system status | E1 | open |

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
| F-0079 | No focal point or identity moment on the 'when' first viewport | 1 | / |
| F-0080 | Bands end at different widths and the done page leaves an empty band below the footer | 3 | /, /done.html, /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled, /vehicle.html?date=2026-10-17&slot=09:20 |
| F-0081 | Vehicle info button stranded on its own row at 375 and back link crowding the title | 2 | /vehicle.html, /vehicle.html?date=2026-10-17&slot=09:20 |
| F-0082 | Chosen day and chosen slot are marked only by a pale tint and slightly heavier border | 1 | / |
| F-0083 | Date repeated twice under 'Slots' | 1 | / |
| F-0089 | No identity layer: the frame is a portable council form | 1 | /, /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled |
| F-0091 | Vehicle chips and day chips are drawn as two different control styles | 1 | /, /vehicle.html?date=2026-10-17&slot=09:20 |
| F-0098 | Two day chips look selected at 375 | 1 | / |
| F-0099 | Sterile default: no own element on when, vehicle and confirm ('plain, not bare' tips into… | 1 | /, /vehicle.html, /confirm.html |

## 5. Divergent and disputed findings: questions for user research

- No finding was divergent (spread < 2 everywhere). Open questions:
  - Do residents read the "Few left" block as "the only free slots"? A short first-click test on a phone would show this.
  - Do residents expect a reminder field to be optional? Is a landline-only household a real share of bookers? Gate attendants could estimate.

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | not_run | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0020, F-0024 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0020 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | not_run | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | not_run | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001, F-0002, F-0036, F-0101, F-0102 |
| 1.4.4 | AA | Resize text | scripted | pass | — |
| 1.4.5 | AA | Images of text | agent-judged | not_run | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0010, F-0030 |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | pass | — |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_run | — |
| 2.1.1 | A | Keyboard | scripted | pass | — |
| 2.1.2 | A | No keyboard trap | scripted | pass | — |
| 2.1.4 | A | Character key shortcuts | agent-judged | not_run | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0035 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | not_run | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | agent-judged | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0017, F-0020 |
| 2.4.4 | A | Link purpose in context | agent-judged | not_run | — |
| 2.4.5 | AA | Multiple ways | agent-judged | not_run | — |
| 2.4.6 | AA | Headings and labels | agent-judged | fail | F-0023 |
| 2.4.7 | AA | Focus visible | scripted | fail | F-0016, F-0026 |
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
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0025 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | not_run | — |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_run | — |
| 4.1.2 | A | Name, role, value | agent-judged | not_run | — |
| 4.1.3 | AA | Status messages | scripted | fail | F-0015 |

Totals by coverage: auto 1 · scripted 22 · agent-judged 23 · needs-human 8; by state: pass 17 · fail 11 · not_run 27. This matrix is not a conformance claim (QUALITY-BAR §8).

## 7. Not assessed

- A11Y-06 Modal dialogs: focus moves in, Tab wraps inside, Esc closes, focus returns to the invoker; correct dialog semantics: not_applicable — no modal dialog in scope (dialogs check found none to exercise)
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
- aria-describedby association of the hint and error paragraphs with each field: not exposed in the ARIA snapshots; the forms check reported no association failures (a11y)
- Page titles (2.4.2): not in the packet (a11y)
- Slot hold duration and expiry warning (2.2.1): no timer visible; behaviour behind hold=expired not observable (a11y)
- Rendered contrast of 'Few left' and other pairs: computed by hand only; needs uie audit measurement. (code)
- Slot accessible names (whether '08:00' and 'Few left' are separated by a space) depend on the browser's name computation; needs an ARIA snapshot. (code)
- census.json and lint.json were empty, so no tool-measured drift list was available. (code)
- Whether details typed into the Check and book form survive a Change slot round trip (start state has an empty form; not on the defined path) (cw-2)
- Whether the original 09:20 slot is released or still held after the change (cw-2)
- Whether the slot hold actually expires after a set time in a real session: only the seeded hold=expired state could be reached; the hold duration could not be observed. (he-1)
- Whether the reminder SMS is sent: no messaging could be observed. (he-1)
- Whether a resubmission after Back creates a second booking on the server: in probe 31 the second submit landed on the same reference DR-265532, so no duplicate was visible; server state is not observable. (he-1)
- Whether the app's clock is 10:05 on Monday 12 October (affects the past-slot finding); not observable from the UI (he-2)
- Whether the gate accepts a van booking with 'no permit given'; outside the UI (he-2)
- Screen-reader announcement of slot loading and of the alert focus; no real screen reader used (he-2)
- Whether a booking persists server-side after reload; the done page is driven by URL parameters (he-2)
- Hold timer behaviour in real time; only the hold=expired recipe could be exercised (he-2)
- Whether 'Change slot' (href index.html) and 'Change vehicle' (href vehicle.html) on /confirm.html keep the day, slot, vehicle, waste and typed details: both hrefs in the ARIA snapshot carry no query string while the flow passes state in the query, so the booking may be lost; needs a probe of the change-slot journey. (he-3)
- Whether 'Back to the slots' (href index.html) on /vehicle.html returns to the chosen day and slot or resets to Today: needs a probe. (he-3)
- Focus movement after submit with errors on /vehicle.html and /confirm.html (the route recipes expect role=alert focused): could not verify without a probe. (he-3)
- Whether error-summary links (#vehicle, #waste, #reg ...) move keyboard focus to the field: needs a probe. (he-3)
- Behaviour of 'Another day' (#other-day): no capture of its opened state; needs a probe, including keyboard operation of any date picker. (he-3)
- Whether the slot list shows a loading state while slots appear (journey persona 'does not know that the slots take a moment to appear'): needs a timed probe. (he-3)
- Whether the Car/Car with trailer/Van buttons expose aria-pressed=false when unselected (only the pressed value appears in the snapshot) and whether the 'Permit number' field is hidden after choosing Car: needs a probe of the car state. (he-3)
- Whether the hold on a chosen slot times out and whether any warning is given before it does (WCAG 2.2.1): needs a timed probe; only the expired end state was captured. (he-3)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0002, F-0009, F-0010, F-0015, F-0016 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (1 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (2 finding(s)); A11Y-04 (2 finding(s)) ….
3. For L2: USE-05 (3 open P0 finding(s)); USE-06 (24 P1 finding(s) without a recorded decision); USE-08 (1 top task(s) not completable); DES-02 (0/3 critics judged it specific); DES-03 (5 agreed severe design finding(s) open) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (27 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

