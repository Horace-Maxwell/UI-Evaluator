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

# UI evaluation report: Dunmore recycling centre booking · run 20261016-230341-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:16b1a1a61b (uncommitted changes present) · run opened 2026-10-17T03:03:41.630Z |
| Input situation | live UI without source review (FRAMEWORK §14) |
| Surfaces and modes | when (operate), vehicle (operate), confirm (operate), confirm (operate), done (read), done (read) |
| Routes × states | 6 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-17T03:03:17.974Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | b8ec8313 b8ec8313 b8ec8313 |
| walkthrough-evaluator | 1 | subagent | claude-opus-5-5 | b99d0397 |
| design-critic | 3 | subagent | claude-opus-5-5 | 38e329a9 38e329a9 38e329a9 |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 8896eb07 |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 030f32e5 e30ff8f0 |
| finding-verifier | 3 | subagent | claude-opus-5-5 | 4aee4a25 cd3380ab 5f22eca4 |
| severity-rater | 3 | subagent | claude-opus-5-5 | a2e66563 2a0ffa5d b38f0ba8 |

Coverage: 540 valid capture(s); 100% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (2 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (1 finding(s)); A11Y-04 (1 finding(s)); A11Y-07 (2 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-07 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-04, A11Y-07, A11Y-11, A11Y-13, A11Y-15, A11Y-17, A11Y-27 |
| G3 Craft floor | fail | COL-01, LAY-03, CMP-04, CMP-05, CPY-04, I18N-03 |
| G4 Deliberateness and anti-slop | not_run | SLP-11, SLP-26, SLP-35, SLP-36, SLP-37, SLP-01 (degraded), SLP-02 (degraded), SLP-03 (degraded), SLP-04 (degraded), SLP-08 (degraded), SLP-09 (degraded), SLP-10 (degraded), SLP-12 (degraded), SLP-13 (degraded), SLP-14 (degraded), SLP-15 (degraded), SLP-20 (degraded), SLP-22 (degraded), SLP-23 (degraded), SLP-24 (degraded), SLP-25 (degraded), SLP-27 (degraded), SLP-31 (degraded), SLP-34 (degraded), SLP-38 (degraded), SLP-39 (degraded), SLP-40 (degraded), SLP-45 (degraded) |
| G5 Analytical usability | fail | USE-03, USE-05, USE-06, USE-08 |
| G6 Design quality | fail | DES-02, DES-03, DES-04, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- **Dark theme is composed, not inverted**: lighter mint actions and cards lighter than the ground, readable at 375 px (`evidence/screens/done-…/cancelled/375-dark.png`, `confirm-…/errors/375-dark.png`). In dark mode the detectors found no contrast failures.
- **Error summaries** take focus, link to each field, give a worked example ("like AB12 CDE") and keep what was typed. Seen at 375 px light and dark (`confirm-…/errors/375-light.png`, `375-dark.png`).
- **Forgiving input**: lowercase registrations, +44 numbers and postcodes without a space are accepted.
- **Mid-booking "Change slot" keeps the vehicle, the waste and the entered details**, but not the day; see F-0033.
- **Full and Few left are stated in words**, not colour alone, and Full slots are disabled (CVD captures at 1280 px).
- Rules are written beside the control they govern, in the gate attendant's voice.
- Re-submitting after browser Back returns the same reference rather than a second booking.

- Status chips carry text, so meaning survives every CVD and forced-colours capture: 'Few left' and 'Full' are words, the selected slot is bold with a heavier border, and errors are text with a summary.
- The error summaries follow the GOV.UK pattern: role=alert receives focus, links jump to the field, fields get aria-invalid and inline text, and entered details survive an expired hold.
- The 'About vans and trailers' disclosure is a named button with aria-expanded. Enter or Space toggles it and focus stays on the button.
- Motion is limited to background-color and opacity at the 120 ms token, with a reduced-motion path that removes both
- Run-time colour roles reproduce the declared light and dark palette
- Personal-data fields on the confirm step carry autocomplete tokens and error summaries take focus
- Check-and-book summary restates day, 20-minute window, vehicle and waste with change links, helping the first-time resident confirm the booking before committing
- Field hints on the details step explain format and purpose in residents' words ('like AB12 CDE', 'For a reminder the evening before', 'To confirm you live in the district')

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.49 (mean Jaccard over 3 passes); an estimated 0.3 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0017 · Focus order jumps back: "08:00" → "08:20 Few left"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0017 | Focus order jumps back: "08:00" → "08:20 Few left" | 4 · catastrophe (rule) | 1 · one value or token | A11Y-03 | Keyboard |

**Problem.** After "08:00", Tab moves to "08:20 Few left", which sits 216 px above it in the same column; the focus order does not follow the visual reading order (clear-inversion heuristic).

**Evidence.** Where: / `#slots > button.slot:nth-of-type(2)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px and 11 more. E1, reproduced or measured · evidence/crops/keyboard/4be89c6678.png, evidence/crops/keyboard/2ec11cd4f9.png, evidence/crops/keyboard/c494d4a9db.png, evidence/screens/root/slot-chosen/1280-light.png. Ratings: rule: 4.

**Recommendation.** Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.4.3 Focus order; WCAG 1.3.2 Meaningful sequence; WCAG 1.3.1 Info and relationships; A11Y-21 ; H2-2 Match between system and the real world; H2-4 Consistency and standards; CW-Q2 Is the action visible?

#### F-0036 · A second press of 'Book this slot' while booking records the booking as cancelled

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0036 | A second press of 'Book this slot' while booking records the booking as cancelled | 4 · catastrophe | 1 · one value or token | H2-5 | Error prevention |

**Problem.** Repeat presses during a pending submit should be ignored. During the 1.5 s booking timeout, a second click sets the flag f=true and relabels the button 'Cancel booking'. When the timeout ends, the booking is saved with status 'cancelled' and the done page opens with heading 'Booked' plus 'Status: cancelled'. The flag is never reset, so if the timeout ends in a validation error instead, the next successful attempt is also stored as cancelled. A resident who double-taps the button, a common habit on phones, may arrive at the gate with a booking that is not on the gate's list.

**Evidence.** Where: /confirm.html `#book`. E1, reproduced or measured · app.js:1:11263, probes/73/screenshots/pending-2.png, probes/73/screenshots/after-second-press.png, probes/73/aria.yml · found by 1 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Ignore presses while the request is pending; offer cancellation only as a separate, explicit control after booking. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P0 · Status open · Also: CMP-04 Response feedback; H2-1 Visibility of system status

#### F-0074 · An existing booking cannot be changed or cancelled online; only by phone on weekdays

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0074 | An existing booking cannot be changed or cancelled online; only by phone on weekdays | 3.67 · catastrophe | 4 · information architecture or architecture | H2-3 | User control and freedom |

**Problem.** Residents who change plans need a way to move or free a booked slot when they find out, which is often the evening before or at the weekend. The Booked page says 'If you cannot come, call 01632 960771 on a weekday and we will free the slot', and the footer gives phone hours of weekdays 09:00 to 17:00. No route, link or form lets a resident enter a reference to change or cancel a booking. 'Residents changing a booking' are a declared group with their reference in hand. Outside weekday office hours they cannot free or move the slot. A household limited to two slots a week may lose one, and the freed capacity is not returned to other residents.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `role=region[name="At the centre"]` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `region "At the centre"`. E1, reproduced or measured · evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/1024-dark.yml, packet inventory.json, probes/73/aria.yml, evidence/aria/*/1280-light.yml (grep cancel|manage|reference) · found by 2 of 10 evaluator(s). Ratings: 3.67 (spread 1; 3, 4, 4).

**Recommendation.** Offer a 'Change or cancel a booking' entry that takes the reference and registration. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P0 · Status open · Also: USE-08 Task suitability; H2-7 Flexibility and efficiency of use

### P1

#### F-0050 · Booking confirmation omits the day, slot time and vehicle

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0050 | Booking confirmation omits the day, slot time and vehicle | 3.33 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** A booking confirmation that is shown at the gate should state what was booked. /done.html shows 'Booked', the reference (DR-xxxxxx), 'Show this at the gate...' and directions, but not the day (Saturday 17 October), the 20-minute window (09:20 to 09:40) or the vehicle (Car), all of which were on the check page. Residents who keep a screenshot or printout of this page, and who do not know they must arrive within the 20-minute slot, have no record there of when to arrive; they may arrive at the wrong time and be turned away.

**Evidence.** Where: /done.html `role=region[name="Your reference"]` at 375 px; /done.html `role=region[name="Your reference"]`; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `role=region[name="Your reference"]` at 375 px and 3 more. E1, reproduced or measured · probes/11/, probes/11/aria.yml, probes/21/, probes/52/ · found by 6 of 10 evaluator(s). Ratings: 3.33 (spread 1; 3, 4, 3).

**Recommendation.** Repeat the booking summary on the confirmation: day, 'arrive between 09:20 and 09:40', vehicle and registration. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; H2-1 Visibility of system status; DES-hierarchy —

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

**Evidence.** Where: / `#slots > button.slot:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(6)` at 320 px and 3 more. E1, reproduced or measured · evidence/keyboard/root/default/320-light/stop-9-focused.png, evidence/keyboard/root/date-chosen/320-light/stop-3-focused.png, evidence/keyboard/root/slot-chosen/320-light/stop-1-focused.png, probes/64/step-06.png. Ratings: rule: 3.

**Recommendation.** Give every focusable element a :focus-visible indicator from the focus tokens (e.g. a 2 px outline with offset); never remove outline without a replacement. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.7 Focus visible; H2-1 Visibility of system status

#### F-0018 · No progress shown during a 1.2 s operation: "Car with trailer"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0018 | No progress shown during a 1.2 s operation: "Car with trailer" | 3 · major (rule) | 2 · one component or file | CMP-04 | Response feedback |

**Problem.** "Car with trailer" runs for about 1201 ms; operations over 1 s must show progress, but nothing animated, no progressbar and no aria-busy region appears while it runs.

**Evidence.** Where: /vehicle.html?date=2026-10-17&slot=09:20 `#vehicle > button:nth-of-type(2)` at 1280 px. E1, reproduced or measured · evidence/crops/states/dc5af67435.png. Ratings: rule: 3.

**Recommendation.** Show an animated indicator where the result will appear (or in the control) after about 1 s, with text saying what is happening (CMP-10). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0022 · A cancelled booking page is headed 'Booked' and still says 'Show this at the gate'

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0022 | A cancelled booking page is headed 'Booked' and still says 'Show this at the gate' | 3 · major | 2 · one component or file | WCAG 2.4.6 | Headings and labels |

**Problem.** On /done.html with status=cancelled, the h1 is 'Booked' and the region still says 'Show this at the gate…' and 'A reminder will be sent…'. The only cancellation cue is one red line, 'Status: cancelled. This booking is not on the gate's list.' The heading misdescribes the page (2.4.6). A screen-reader user moving by heading hears 'Booked'. A resident glancing at the phone at the gate sees 'Booked' and the reference and may be turned away.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `main h1` at 1280 px; /done.html?status=cancelled [cancelled] `role=heading[name="Booked"]`; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `role=heading[name="Booked"]` at 375 px and 4 more. E1, reproduced or measured · evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light.png, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-light.yml, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1024-dark.yml, evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.png · found by 7 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** When the status is cancelled, use the h1 'Booking cancelled', remove the gate and reminder instructions, and offer 'Book another slot' as the main action. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; A11Y-27 No verified judged WCAG failure; H2-2 Match between system and the real world; H2-4 Consistency and standards; DES-hierarchy —

#### F-0026 · 'Book this slot' gives no busy state during a 1.5 s submission

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0026 | 'Book this slot' gives no busy state during a 1.5 s submission | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** After 'Book this slot' is pressed, the result takes about 1.2 to 1.5 s to appear. In that time the button looks exactly the same and stays enabled, so it can be pressed again. No visible busy indicator or live-region message is shown. The button does get aria-busy="true" during the wait, which many screen readers do not announce on a button.

**Evidence.** Where: /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden&hold=expired [expired] `role=button[name="Book this slot"]` at 375 px; /confirm.html `#book`; /confirm.html [submitting] `role=button[name="Book this slot"]` at 375 px. E1, reproduced or measured · probes/67/step-05.png, probes/67/probe.json, scratchpad/p-busy/probe.json, scratchpad/p-busy2/probe.json · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** While submitting, set the button text to 'Booking…', ignore repeat presses, and put the outcome in the existing focused alert or a polite live region. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-04 Response feedback; CW-Q4 Will the user understand the feedback?

#### F-0030 · Today's slots that have already started are offered as free and rejected only at booking

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0030 | Today's slots that have already started are offered as free and rejected only at booking | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A slot should be shown as free only when it can be booked (design.md Do's). The When step generates 08:00 to 17:20 slots for today with no time cut-off, so earlier slots appear free and selectable. The check that a same-day slot before 10:35 cannot be booked (R(a.slot)<635) runs only inside the Book this slot handler on the confirm step, after the resident has filled in vehicle, waste and personal details. A resident who picks an early slot today may complete three steps and then be told the slot cannot be booked, and must go back and start the choice again.

**Evidence.** Where: /index.html `#slots .slot`; /confirm.html `#book`. E1, reproduced or measured · app.js:1:3423, .ui-evaluator/runs/20261016-230341-audit-standard/probes/75/step-02.png, .ui-evaluator/runs/20261016-230341-audit-standard/probes/75/aria.yml, .ui-evaluator/runs/20261016-230341-audit-standard/probes/75/final.png · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Apply the same-day cut-off when building today's slots and render passed slots as unavailable. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: Do show a slot as free only when it is —

#### F-0033 · Returning to the When step from 'Change slot' resets to today with no slot chosen

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0033 | Returning to the When step from 'Change slot' resets to today with no slot chosen | 3 · major | 2 · one component or file | H2-3 | User control and freedom |

**Problem.** Going back to change a choice should show the current choice. te() reads the stored booking into e but never uses it: the day is always reset to the constant 'today' and the selected slot to empty. A resident who follows 'Change slot' from the confirm page sees Today and no selection, even if the booking was for Saturday 17 at 09:20. Residents changing a slot lose sight of their current booking and must find the day again; pressing Next without re-selecting gives 'Choose a slot first'.

**Evidence.** Where: /index.html `#slots`; /confirm.html `role=link[name="Change slot"]`; /vehicle.html `role=link[name="Back to the slots"]` and 6 more. E1, reproduced or measured · app.js:1:5127, .ui-evaluator/runs/20261016-230341-audit-standard/probes/77/aria.yml, .ui-evaluator/runs/20261016-230341-audit-standard/probes/77/final.png, probes/18/ · found by 4 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Initialise the day and selected slot from the stored booking when present. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; H2-5 Error prevention; H2-7 Flexibility and efficiency of use

#### F-0035 · Permit number is checked only after 'Book this slot', on a page without the permit field

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0035 | Permit number is checked only after 'Book this slot', on a page without the permit field | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** Input should be validated on the step where it is entered. The vehicle step's Next handler checks vehicle and waste only; a missing or malformed permit passes. The DRC-nnnnn check runs inside the confirm step's booking timeout, and its error ('A van needs a permit number (DRC- and five digits).') is added to the error summary as text with no link, on a page that has no permit field. Van and trailer owners may fill in all details, wait for the booking, then be blocked with no direct route back to the field that needs fixing.

**Evidence.** Where: /vehicle.html [van] `#next`; /confirm.html [errors] `#error-summary`; /vehicle.html [van] `#permit` and 2 more. E1, reproduced or measured · app.js:1, probes/23/, probes/29/, probes/27/ · found by 4 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Validate the permit on the vehicle step's Next, with an inline error linked from the summary; keep the confirm check as a fallback with a link to vehicle.html. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-9 Help users recognize, diagnose and recover from errors; A11Y-13 Forms; CPY-04 Error-message quality

#### F-0038 · Five-minute slot hold is never disclosed and cannot be extended

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0038 | Five-minute slot hold is never disclosed and cannot be extended | 3 · major | 3 · several components or one flow | WCAG 2.2.1 | Timing adjustable |

**Problem.** A chosen slot stops being held after about five minutes (it had lapsed after about 5.5 minutes in a probe). The time limit is not stated on any page. No warning appears before it ends and there is no way to extend it. The resident finds out only when 'Book this slot' is pressed. Residents who take longer than five minutes on vehicle and details, for example finding a permit email, may lose their slot without warning.

**Evidence.** Where: /confirm.html [expired] `#book`; /vehicle.html `role=heading[name="Your vehicle and waste"]` at 375 px; /confirm.html `role=region[name="Your booking"]` at 375 px and 2 more. E1, reproduced or measured · app.js:1:4078, scratchpad/p-wait/probe.json, scratchpad/p-wait/step-14.png, scratchpad/p-wait/step-21.png · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** State the hold time on the vehicle and confirm steps, and warn with an option to extend before it lapses. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P1 · Status open · Also: H2-1 Visibility of system status; CW-Q4 Will the user understand the feedback?; H2-5 Error prevention

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
| F-0023 | Expired-hold error says only 'This slot is no longer available' with no way forward | 2.33 · minor | 1 · one value or token | WCAG 3.3.3 | Error suggestion | E1 | open |
| F-0025 | Permit number field is always shown and never says it is needed only for vans and trailers | 2.33 · minor | 1 · one value or token | H2-5 | Error prevention | E1 | open |
| F-0028 | Slot grid at 360 px and narrower is set wider than the page content box | 2.33 · minor | 2 · one component or file | FUN-05 | No horizontal page overflow at any matrix width | E1 | open |
| F-0041 | Waste hint and vehicle error are not programmatically tied to their controls | 2.33 · minor | 2 · one component or file | A11Y-13 | Forms | E1 | open |
| F-0031 | Slot area is blank for 900 ms after choosing a day, with no loading indication | 2 · minor | 2 · one component or file | CMP-05 | Data states exist | E1 | open |
| F-0042 | Error-summary links for vehicle and waste point at non-focusable containers | 2 · minor | 1 · one value or token | A11Y-13 | Forms | E1 | open |
| F-0055 | Permit error on Check and book gives no way to reach the permit field | 2 · minor | 1 · one value or token | H2-9 | Help users recognize, diagnose and recover from errors | E1 | open |
| F-0056 | Permit error says a permit is needed even when a wrongly formatted one was entered | 2 · minor | 1 · one value or token | H2-9 | Help users recognize, diagnose and recover from errors | E1 | open |
| F-0061 | Permit explanation says to apply on the council site but gives no link | 2 · minor | 1 · one value or token | H2-10 | Help and documentation | E1 | open |
| F-0062 | Permit rules are hidden behind an unlabelled info icon | 2 · minor | 1 · one value or token | H2-6 | Recognition rather than recall | E1 | open |
| F-0069 | Vehicle step does not show the day and slot being booked | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0044 | Date field opens a digits-only keypad while the hint asks for DD/MM/YYYY with slashes | 1.67 · minor | 1 · one value or token | H2-5 | Error prevention | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0032 | Next on the When step does nothing while slots are loading | 1 · cosmetic | 2 · one component or file | CMP-04 | Response feedback | E1 | open |
| F-0095 | Slot grid does not fill the width as DESIGN.md specifies | 1 · cosmetic | 1 · one value or token | LAY-03 | Heading rhythm | E1 | open |

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
| F-0097 | No identity or signature: the service has nothing of the centre's own | 3 | /, /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden, /done.html |
| F-0098 | Vehicle chips and day chips are two different component styles | 1 | /, /vehicle.html?date=2026-10-17&slot=09:20 |
| F-0099 | Narrow-width roughness: stranded step label, mis-indented 'Another day', offset nav | 1 | / |
| F-0106 | Half-empty full-width cards and a short grid leave empty right halves at wide widths | 1 | /confirm.html, /done.html, / |
| F-0107 | Two visual styles for the same choose-one control (day buttons vs vehicle boxes) | 1 | /, /vehicle.html |
| F-0114 | Desktop canvas half empty on vehicle and confirm; done page cards of unequal width and an… | 1 | /vehicle.html?date=2026-10-17&slot=09:20, /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden |
| F-0115 | Small typesetting lapses at 375: phone number split across lines, 'Another day' off the c… | 1 | /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden, / |

## 5. Divergent and disputed findings: questions for user research

No finding was divergent by spread. Questions for residents and owners:
- F-0074: do residents expect to change or cancel online, or is the weekday phone line acceptable? It is rated P0, but it is a product decision: PRODUCT.md lists changing a slot as a core task, and the phone line is the only route after booking.
- The critics judged the design generic and plain (all 3 of 3), with brand fit at 2 of 3 attributes. A desirability check with residents would show whether "plain" costs trust on a council service.
- F-0040 (the Enter handler has no IME composition guard) needs a human test with a real IME. It is low risk for an en-GB-only service.

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | not_run | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0017, F-0041 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0017 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | not_run | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | not_run | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001, F-0002 |
| 1.4.4 | AA | Resize text | scripted | pass | — |
| 1.4.5 | AA | Images of text | agent-judged | not_run | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0010, F-0028 |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | pass | — |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_run | — |
| 2.1.1 | A | Keyboard | scripted | pass | — |
| 2.1.2 | A | No keyboard trap | scripted | pass | — |
| 2.1.4 | A | Character key shortcuts | agent-judged | not_run | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0038 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | not_run | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | agent-judged | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0017, F-0042 |
| 2.4.4 | A | Link purpose in context | agent-judged | not_run | — |
| 2.4.5 | AA | Multiple ways | agent-judged | not_run | — |
| 2.4.6 | AA | Headings and labels | agent-judged | fail | F-0022 |
| 2.4.7 | AA | Focus visible | scripted | fail | F-0016 |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | pass | — |
| 2.5.1 | A | Pointer gestures | agent-judged | not_run | — |
| 2.5.2 | A | Pointer cancellation | scripted | pass | — |
| 2.5.3 | A | Label in name | agent-judged | fail | F-0062 |
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
| 3.3.1 | A | Error identification | scripted | fail | F-0041 |
| 3.3.2 | A | Labels or instructions | agent-judged | fail | F-0025 |
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0023 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | not_run | — |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_run | — |
| 4.1.2 | A | Name, role, value | agent-judged | not_run | — |
| 4.1.3 | AA | Status messages | scripted | fail | F-0015, F-0031 |

Totals by coverage: auto 1 · scripted 22 · agent-judged 23 · needs-human 8; by state: pass 17 · fail 13 · not_run 25. This matrix is not a conformance claim (QUALITY-BAR §8).

## 7. Not assessed

- A11Y-06 Modal dialogs: focus moves in, Tab wraps inside, Esc closes, focus returns to the invoker; correct dialog semantics: not_applicable — no modal dialog in scope (dialogs check found none to exercise)
- A11Y-17 Pointer and keyboard static checks: no down-event-only activation, no unmodified single-character shortcuts without a remap or off switch, dragging has a single-pointer alternative, motion actuation has an alternative: not_run — the lint check did not run
- COL-01 Token conformance: not_run — the lint check did not run
- I18N-01 Explicit CJK font stack: not_applicable — no CJK locale or CJK text in scope
- I18N-02 Regional families: not_applicable — no CJK locale or CJK text in scope
- I18N-03 Restricted fonts not self-hosted (all locales): not_run — the lint check did not run
- DEC-03 Direction record for new work or redesigns: not_applicable — no new direction in scope (project.work = existing)
- DEC-04 Ledger variety for new work: not_applicable — no new direction in scope
- SLP-11 Simulated liveness: not_run — the lint check did not run
- SLP-26 Motion clichés: image hover zoom, uniform hover-scale on unrelated elements, > 1 simultaneous hover property change: not_run — the lint check did not run
- USE-03 Verification: not_run — the verifier has not run
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
- Rendered overflow amount of the 320 px slot grid (code-02) is computed from the code, not measured. (code)
- Contrast values in code-17 are computed from the HSL literals, not measured on the rendered page; uie audit A11Y-11 should confirm. (code)
- Slot-list load time on real mobile data (only measured ~0.9 s on the local server) (cw-1)
- How long the slot hold actually lasts (no on-screen statement; only the captured 'expired' state shows it can lapse) (cw-1)
- Double submission of 'Book this slot': after a valid submit nothing visibly changed at 0.2 s and 0.8 s and done.html appeared between 0.8 and 1.5 s (probes/52/). Whether a second tap in that window creates a second booking could not be observed from the black box. (he-1)
- Behaviour on slow mobile data at the centre or at home: probes ran on localhost; slot loading and booking may take longer in the field. (he-1)
- Browser Back from done.html to confirm (possible re-submission): probe tab had no history (probes/47/). (he-1)
- Whether a hold actually expires after some time in normal use: only the seeded hold=expired state could be reached. (he-1)
- Today's list may offer slots that have already started (08:00-10:00 are selectable on Monday 12 October), but the app's time of day is not visible anywhere, so I cannot tell whether those slots are in the past. This remains a hypothesis. (he-2)
- Visible keyboard focus on slot buttons: after Tab from 'Another day' (probes/51), the screenshots showed no visible focus on any slot. I could not confirm which element had focus, so this stays a hypothesis for the accessibility auditor. (he-2)
- Behaviour when the booking request fails (network or server error): this cannot be simulated with probe actions. (he-2)
- The SMS reminder promised on the Booked page cannot be observed. (he-2)
- How long a slot is held before it expires: the expired state is only reachable through the hold=expired recipe, so the real hold duration could not be timed. (he-2)
- Whether confirm.html refuses to book a van with no permit or a malformed permit on submit: the submit with valid details was refused by the permission system, so only the confirm page's display ('Van, no permit given', probes/34) was seen. (he-3)
- Whether 'Book this slot' gives feedback or prevents a double booking on a double click: not probed for the same reason. (he-3)
- Whether inline field errors are programmatically associated with their inputs (aria-describedby / aria-invalid): the ARIA snapshot format does not show descriptions; left to the accessibility audit. (he-3)
- Behaviour at 200% zoom and with VoiceOver/TalkBack announcements: not reproduced by probe; only static captures at 320 px were viewed. (he-3)
- Motion, hover and focus behaviour, the toast and keyboard order cannot be judged from stills. No baseline screenshots, so no pairwise comparison. (critic-2)
- Motion (120 ms fades, toast), hover and focus behaviour, keyboard flow; baseline absent so pairwise not run. (critic-3)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0002, F-0009, F-0010, F-0015, F-0016 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (2 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (1 finding(s)); A11Y-04 (1 finding(s)) ….
3. For L2: USE-03 (the verifier has not run); USE-05 (3 open P0 finding(s)); USE-06 (15 P1 finding(s) without a recorded decision); USE-08 (1 top task(s) not completable); DES-02 (0/3 critics judged it specific) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (18 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

