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

# UI evaluation report: Dunmore recycling centre booking · run 20261016-125610-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:ff36e1df48 (uncommitted changes present) · run opened 2026-10-16T16:56:10.887Z |
| Input situation | live UI without source review (FRAMEWORK §14) |
| Surfaces and modes | when (operate), vehicle (operate), confirm (operate), confirm (operate), done (read), done (read) |
| Routes × states | 6 route(s) × 12 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light, dark × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-16T16:55:32.194Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | 082ebf4a 082ebf4a 082ebf4a |
| walkthrough-evaluator | 2 | subagent | claude-opus-5-5 | 6620060e 64f5d877 |
| design-critic | 3 | subagent | claude-opus-5-5 | 032998bb 032998bb 032998bb |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | a125061f |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 030f32e5 f930ca39 |
| finding-verifier | 4 | subagent | claude-opus-5-5 | b8cf6274 943e3c8b 1386c1da 0120e535 |
| severity-rater | 3 | subagent | claude-opus-5-5 | bb561958 a69069f6 6a0d0b7d |

Coverage: 540 valid capture(s); 92% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** FUN-05 (1 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (1 finding(s)); A11Y-04 (1 finding(s)); A11Y-07 (1 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | fail | FUN-05, FUN-07 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-03, A11Y-04, A11Y-07, A11Y-11, A11Y-15, A11Y-17, A11Y-27 |
| G3 Craft floor | fail | COL-01, LAY-03, CMP-04, CMP-05, I18N-03 |
| G4 Deliberateness and anti-slop | not_run | SLP-11, SLP-26, SLP-35, SLP-36, SLP-37, SLP-01 (degraded), SLP-02 (degraded), SLP-03 (degraded), SLP-04 (degraded), SLP-08 (degraded), SLP-09 (degraded), SLP-10 (degraded), SLP-12 (degraded), SLP-13 (degraded), SLP-14 (degraded), SLP-15 (degraded), SLP-20 (degraded), SLP-22 (degraded), SLP-23 (degraded), SLP-24 (degraded), SLP-25 (degraded), SLP-27 (degraded), SLP-31 (degraded), SLP-34 (degraded), SLP-38 (degraded), SLP-39 (degraded), SLP-40 (degraded), SLP-45 (degraded) |
| G5 Analytical usability | fail | USE-05, USE-06, USE-08 |
| G6 Design quality | fail | DES-02, DES-03, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- **Dark theme exists and holds together at 375 px**: text, borders and the selected 09:20 slot are clear in `evidence/screens/root/slot-chosen/375-dark.png`; only the "Few left" tag is weak.
- **Slot buttons are large tap targets at 375 px** (about 97 × 56 px; same capture) and "Full" slots are labelled with text, not colour alone.
- **The opening days, slot length, two-per-week limit and permit rule are written in plain language on the first page** (same capture, "Opening days" box).
- **Changing the slot from the confirm page keeps the vehicle, waste and details** once the day is reselected (walkthrough change-slot, step 4, 375 px).
- **The done page states the reference large and says to show it on phone or paper** (`screens/done-.../default/375-dark.png`).
- **Vehicle-step error summary takes focus and is announced** (state `errors`, 375 px).

- Change slot keeps every earlier answer
- Error summaries take focus, link to each field, and errors are in text with aria-invalid
- Availability is given in words, not only colour
- Disclosures use real buttons with aria-expanded and inline panels
- Closed-day handling is explained in text
- Spacing, radius, type sizes and motion duration come from :root custom properties matching DESIGN.md (4-48 px steps, 4 px radius, 120 ms); no literal off-scale spacing found in component rules
- Motion is limited to background-color and opacity at var(--duration) ease-out, with a prefers-reduced-motion block removing both; no transition: all and no layout-property animation
- Error summary receives focus on failed submit and per-field errors set aria-invalid and aria-describedby, which helps residents on screen readers find what to fix

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.62 (mean Jaccard over 3 passes); an estimated 0.2 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0017 · Focus order jumps back: "08:00" → "08:20 Few left"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0017 | Focus order jumps back: "08:00" → "08:20 Few left" | 4 · catastrophe (rule) | 1 · one value or token | A11Y-03 | Keyboard |

**Problem.** After "08:00", Tab moves to "08:20 Few left", which sits 216 px above it in the same column; the focus order does not follow the visual reading order (clear-inversion heuristic).

**Evidence.** Where: / `#slots > button.slot:nth-of-type(2)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(2)` at 320 px and 9 more. E1, reproduced or measured · evidence/crops/keyboard/4be89c6678.png, evidence/crops/keyboard/2ec11cd4f9.png, evidence/crops/keyboard/c494d4a9db.png, evidence/screens/root/slot-chosen/1280-dark.png. Ratings: rule: 4.

**Recommendation.** Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 2.4.3 Focus order; WCAG 1.3.1 Info and relationships; A11Y-26 —; H2-4 Consistency and standards; WCAG 1.3.2 Meaningful sequence; CW-Q2 Is the action visible?; H2-2 Match between system and the real world; H2-6 Recognition rather than recall

#### F-0029 · A second press of 'Book this slot' while it is pending turns the booking into a cancelled one

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0029 | A second press of 'Book this slot' while it is pending turns the booking into a cancelled… | 4 · catastrophe | 2 · one component or file | H2-5 | Error prevention |

**Problem.** A repeated activation of a submit control should be ignored or clearly cancel nothing without the user's intent (CMP-04, H5). While the 1.5 s booking timer runs, a second click sets f=true and relabels the button 'Cancel booking'; when the timer fires it saves status 'cancelled' and navigates to done.html anyway. The done page keeps its h1 'Booked' and shows the reference, with 'Status: cancelled. This booking is not on the gate's list.' in a secondary line. A double tap is enough to trigger this. A resident who double-taps Book on a phone may leave with a reference that the gate will reject, under a page headed 'Booked'.

**Evidence.** Where: /confirm.html [booking-pending] `#book`; /done.html [done-cancelled] `h1`. E1, reproduced or measured · app.js:1, probes/79/step-07.png, probes/79/step-10.png, probes/79/aria.yml · found by 1 of 12 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Ignore clicks while pending (or disable with aria-disabled); if cancel is a real feature, make it a separate, labelled control and switch the done page heading when status is cancelled. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: CMP-04 Response feedback; CMP-15 —; H2-1 Visibility of system status

### P1

#### F-0067 · No online way to cancel or change a booking after it is made

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0067 | No online way to cancel or change a booking after it is made | 3.33 · major | 4 · information architecture or architecture | H2-3 | User control and freedom |

**Problem.** After booking, the only route to cancel or move the slot is 'call 01632 960771 on a weekday', with the phone line open weekdays 09:00 to 17:00. Residents book in the evening or at weekends and change plans ('move it to the afternoon'); they need a way to change or free the slot themselves. Residents changing a booking (a declared user group) cannot do it outside office hours; unused slots stay blocked.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `main` at 375 px. E1, reproduced or measured · probes/37, .ui-evaluator/runs/20261016-125610-audit-standard/probes/96/aria.yml, .ui-evaluator/runs/20261016-125610-audit-standard/probes/78/aria.yml, .ui-evaluator/runs/20261016-125610-audit-standard/probes/76/aria.yml · found by 1 of 12 evaluator(s). Ratings: 3.33 (spread 1; 4, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P1 · Status open · Also: H2-7 Flexibility and efficiency of use

#### F-0076 · There is no online way to change or cancel a booking once it is made

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0076 | There is no online way to change or cancel a booking once it is made | 3.33 · major | 4 · information architecture or architecture | H2-3 | User control and freedom |

**Problem.** After booking, the only way to change or free a slot is 'call 01632 960771 on a weekday'. No screen offers 'change my booking' or 'cancel' by reference. Residents changing a booking are a declared user group, and their typical moment (the evening before, or a weekend morning) falls outside the phone hours. Residents whose plans change at the weekend cannot free or move their slot; they hold a slot that others need, or turn up at the wrong time.

**Evidence.** E1, reproduced or measured · .ui-evaluator/runs/20261016-125610-audit-standard/probes/12/aria.yml, inventory.json, .ui-evaluator/runs/20261016-125610-audit-standard/probes/12/screenshots/done.png, probes/79/aria.yml · found by 1 of 12 evaluator(s). Ratings: 3.33 (spread 1; 4, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P1 · Status open · Also: H2-7 Flexibility and efficiency of use

#### F-0001 · axe color-contrast: Elements must meet minimum color contrast ratio thresholds

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0001 | axe color-contrast: Elements must meet minimum color contrast ratio thresholds | 3 · major (rule) | 1 · one value or token | A11Y-01 | axe-core with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wca… |

**Problem.** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds (serious impact). Fix any of the following: Element has insufficient color contrast of 3.02 (foreground color: #bd7d0f, background color: #fbefda, font size: 12.0pt (16px), font weight: bold). Expected contrast ratio of 4.5:1

**Evidence.** Where: / [date-chosen] `button[data-slot="08:20"] > .slot__tag--few.slot__tag` at 1280 px; / [date-chosen] `button[data-slot="08:40"] > .slot__tag--few.slot__tag` at 1280 px; / [date-chosen] `button[data-slot="09:00"] > .slot__tag--few.slot__tag` at 1280 px and 22 more. E1, reproduced or measured · evidence/crops/axe/b86bafb1c5.png, evidence/crops/axe/59c812bf19.png, evidence/crops/axe/40aa32265b.png, evidence/crops/axe/20d592f2e4.png. Ratings: rule: 3.

**Recommendation.** Elements must meet minimum color contrast ratio thresholds (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 1.4.3 Contrast, minimum; A11Y-11 Text contrast ≥ 4.5; COL-01 Token conformance

#### F-0009 · Horizontal page overflow on /

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0009 | Horizontal page overflow on / | 3 · major (rule) | 2 · one component or file | FUN-05 | No horizontal page overflow at any matrix width |

**Problem.** scrollWidth 335 px > clientWidth 320 px at 320 px. Widest offender: #slots > div.slots__head:nth-of-type(1) extends 15 px past the viewport; 10 more.

**Evidence.** Where: / `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > div.slots__head:nth-of-type(1)` at 320 px and 1 more. E1, reproduced or measured · evidence/crops/layout/d0feed3b9b.png, evidence/crops/layout/b1c65f8268.png, evidence/crops/layout/36425b0e42.png, app.js:1. Ratings: rule: 3.

**Recommendation.** Constrain the element (max-width: 100%, min-width: 0 on flex and grid children, overflow-wrap: anywhere) or give genuinely 2-D content its own scroll region and declare it in two_d_regions. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: A11Y-07 Reflow at 320 CSS px without two-dimensional scrolling; WCAG 1.4.10 Reflow

#### F-0016 · No visible focus indicator: "08:00"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0016 | No visible focus indicator: "08:00" | 3 · major (rule) | 1 · one value or token | A11Y-04 | Focus visible |

**Problem.** Tab focus on "08:00" changes 0 pixels within its box + 4 px (focused vs blurred crop), so no focus position is visible.

**Evidence.** Where: / `#slots > button.slot:nth-of-type(1)` at 320 px; / [date-chosen] `#slots > button.slot:nth-of-type(1)` at 320 px; / [slot-chosen] `#slots > button.slot:nth-of-type(6)` at 320 px and 2 more. E1, reproduced or measured · evidence/keyboard/root/default/320-light/stop-9-focused.png, evidence/keyboard/root/date-chosen/320-light/stop-3-focused.png, evidence/keyboard/root/slot-chosen/320-light/stop-1-focused.png, evidence/keyboard/root/default/320-light/stop-9-blurred.png. Ratings: rule: 3.

**Recommendation.** Give every focusable element a :focus-visible indicator from the focus tokens (e.g. a 2 px outline with offset); never remove outline without a replacement. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: WCAG 2.4.7 Focus visible; H2-1 Visibility of system status; CMP-02 Focus indicator quality

#### F-0018 · No progress shown during a 1.2 s operation: "Car with trailer"

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0018 | No progress shown during a 1.2 s operation: "Car with trailer" | 3 · major (rule) | 1 · one value or token | CMP-04 | Response feedback |

**Problem.** "Car with trailer" runs for about 1203 ms; operations over 1 s must show progress, but nothing animated, no progressbar and no aria-busy region appears while it runs.

**Evidence.** Where: /vehicle.html?date=2026-10-17&slot=09:20 `#vehicle > button:nth-of-type(2)` at 1280 px. E1, reproduced or measured · evidence/crops/states/dc5af67435.png. Ratings: rule: 3.

**Recommendation.** Show an animated indicator where the result will appear (or in the control) after about 1 s, with text saying what is happening (CMP-10). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: single location · Priority P1 · Status open

#### F-0021 · Cancelled-booking page keeps the heading 'Booked'

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0021 | Cancelled-booking page keeps the heading 'Booked' | 3 · major | 2 · one component or file | WCAG 2.4.6 | Headings and labels |

**Problem.** Headings should describe the topic or purpose of the content. On the done page with status=cancelled, the only level 1 heading still reads 'Booked'. The status line 'Status: cancelled. This booking is not on the gate's list.' sits below it as an ordinary paragraph inside 'Your reference'. A screen-reader user who moves by headings, and a sighted user glancing at the page, gets 'Booked' as the page's topic. A resident checking a booking they or someone else cancelled may take 'Booked' as confirmation and drive to the centre. The gate turns away anyone not on the list.

**Evidence.** Where: /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `role=heading[level=1][name="Booked"]` at 1280 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `h1` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=cancelled [cancelled] `h1, region "Your reference"` at 375 px and 4 more. E1, reproduced or measured · <round>/eval-21-audit-standard-slot-booking/with_skill/run-1/workspace/.ui-evaluator/runs/20261016-125610-audit-standard/evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.png, evidence/aria/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-dark.yml, evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/1280-dark.png, evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/cancelled/375-light.png · found by 6 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Set the h1 from the status, for example 'Booking cancelled', and put the status sentence directly under it. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-4 Consistency and standards; H2-2 Match between system and the real world; DES-hierarchy —; H2-5 Error prevention

#### F-0030 · 'Book this slot' shows no visible pending state during the 1.5 s booking wait

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0030 | 'Book this slot' shows no visible pending state during the 1.5 s booking wait | 3 · major | 2 · one component or file | CMP-04 | Response feedback |

**Problem.** A control should acknowledge activation and show progress for waits over about 1 s (CMP-04, CMP-10). On a valid submit the code sets only aria-busy="true" on #book; there is no CSS for [aria-busy], the label is unchanged and the button stays enabled until navigation 1.5 s later. Residents may think the tap did not register and tap again, which triggers code-4.

**Evidence.** Where: /confirm.html [booking-pending] `#book`; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden `#book` at 375 px; /confirm.html [booking-submitting] `role=button[name="Book this slot"]`. E1, reproduced or measured · app.js:1; styles.css:1, probes/39, probes/79/step-07.png, probes/75/step-07.png · found by 3 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Change the label to 'Booking…' and style [aria-busy=true] with a visible busy cue while the request runs. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: CMP-10 —; H2-1 Visibility of system status; H2-5 Error prevention; CW-Q4 Will the user understand the feedback?

#### F-0032 · Today's slots before 10:35 are offered as free on step 1 but refused only after 'Book this slot'

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0032 | Today's slots before 10:35 are offered as free on step 1 but refused only after 'Book thi… | 3 · major | 2 · one component or file | H2-5 | Error prevention |

**Problem.** DESIGN.md: 'Do show a slot as free only when it is.' Slot availability j(date) ignores the time of day, so on the current day every slot from 08:00 renders as free or 'Few left'. The final submit then rejects date===today && slot < 10:35 (635 minutes) with 'The <time> slot today can no longer be booked', after the resident has entered vehicle, waste and personal details. Residents booking for today may complete three steps for a slot that was never bookable and have to start over.

**Evidence.** Where: /index.html `#slots .slot`; /confirm.html [validation-errors] `#error-summary`. E1, reproduced or measured · app.js:1, .ui-evaluator/runs/20261016-125610-audit-standard/probes/86/aria.yml, .ui-evaluator/runs/20261016-125610-audit-standard/probes/90/aria.yml, .ui-evaluator/runs/20261016-125610-audit-standard/probes/90/screenshots/after-book.png · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Apply the same cut-off when building today's slot list, rendering past slots as unavailable with a reason. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: DESIGN.md Do's and Don'ts: show a slot as free only when it is —; CMP-18 —

#### F-0033 · Permit number is not checked on the vehicle step; a missing or malformed permit is reported only after 'Book this slot'

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0033 | Permit number is not checked on the vehicle step; a missing or malformed permit is report… | 3 · major | 3 · several components or one flow | CMP-18 | — |

**Problem.** Validation should run where the field is (CMP-18). On vehicle.html, Next validates vehicle and waste only and saves the permit as typed. The DRC-##### format and presence check for van and trailer runs only in the confirm-page submit, where there is no permit field. Residents bringing a van or trailer may fill in their details and only then learn the permit is wrong, on a page where they cannot correct it.

**Evidence.** Where: /vehicle.html [vehicle-permit] `#next`; /confirm.html [validation-errors] `#error-summary`; /vehicle.html?date=2026-10-17&slot=09:20 [van] `#permit` at 375 px and 1 more. E1, reproduced or measured · app.js:1, .ui-evaluator/runs/20261016-125610-audit-standard/probes/38/screenshots/van-no-permit.png, .ui-evaluator/runs/20261016-125610-audit-standard/probes/41/, probes/23 · found by 4 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Validate the permit in the vehicle step's Next handler with an inline error on #permit. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-5 Error prevention; WCAG 3.3.1 Error identification; H2-9 Help users recognize, diagnose and recover from errors

#### F-0036 · The 5-minute slot hold expires without any warning, time display or way to extend

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0036 | The 5-minute slot hold expires without any warning, time display or way to extend | 3 · major | 3 · several components or one flow | WCAG 2.2.1 | Timing adjustable |

**Problem.** A time limit should be announced and adjustable (WCAG 2.2.1). Selecting a slot stores hold_started; on submit, if more than 5 minutes have passed, the slot is cleared and 'This slot is no longer available.' is shown. No page mentions the limit, shows remaining time, or offers an extension, and the check runs client-side regardless of whether the slot is still free. Residents who take time over vehicle, waste and personal details, including those using assistive technology, may lose their slot at the last step and have to restart.

**Evidence.** Where: /confirm.html [hold-expired] `#error-summary`; /index.html [slot-selected] `#slots .slot[aria-pressed=true]`; / [slot-selected] `role=region[name="Slots"]` and 1 more. E1, reproduced or measured · app.js:1, probes/31/aria.yml, probes/9/aria.yml, probes/15/aria.yml · found by 2 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** State the hold on slot selection and on later steps, warn before expiry with an option to extend, or drop the client-side expiry. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-5 Error prevention; CW-Q4 Will the user understand the feedback?

#### F-0044 · 'Booked' page does not restate the day, time window or vehicle

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0044 | 'Booked' page does not restate the day, time window or vehicle | 3 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** A booking confirmation should state what was booked. /done.html shows 'Booked', the reference and 'Show this at the gate…', but not Saturday 17 October, 09:20 to 09:40, or the car and registration. The day and window appear only on the previous page. A resident who keeps or prints this page as their record, and who does not know they must arrive within the 20-minute slot, may not know when to arrive and may be turned away.

**Evidence.** Where: /done.html [booked] `role=region[name="Your reference"]`; /done.html `main` at 375 px; /done.html?ref=DR-204117&date=2026-10-17&slot=09:20&vehicle=car&waste=garden&status=booked `main` at 375 px and 1 more. E1, reproduced or measured · probes/20/screenshots/done.png, probes/20/aria.yml, .ui-evaluator/runs/20261016-125610-audit-standard/probes/12/screenshots/done.png, <round>/eval-21-audit-standard-slot-booking/with_skill/run-1/workspace/.ui-evaluator/runs/20261016-125610-audit-standard/evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-light.png · found by 6 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Show day, 20-minute window ('arrive between 09:20 and 09:40'), vehicle and registration next to the reference. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; H2-1 Visibility of system status; DES-hierarchy —

#### F-0046 · 'Change slot' opens a blank 'Book a slot' page with no trace of the booking being changed

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0046 | 'Change slot' opens a blank 'Book a slot' page with no trace of the booking being changed | 3 · major | 2 · one component or file | CW-Q4 | Will the user understand the feedback? |

**Problem.** A change action should open the chooser on the current choice and say what is kept. Here, on the confirm page, 'Change slot' links to a bare index.html. The page that opens is the generic first step, 'Book a slot', with 'Today' pressed and an empty Slots area. Saturday 17 and 09:20 are not shown as the current choice. Nothing says this is a change to an existing booking, or that the vehicle (Car) and waste (Garden waste, Wood) will be kept. A resident moving a slot may believe their booking has been discarded and that they must start again. They may re-enter vehicle and waste details or abandon the change. They also have to re-pick a day they wanted to keep.

**Evidence.** Where: /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden,wood `role=link[name="Change slot"]` at 375 px; /index.html [after Change slot] `role=group[name="Day"]` at 375 px; /confirm.html?date=2026-10-17&slot=09:20&vehicle=car&waste=garden,wood `role=link[name="Change slot"]` at 375 px and 4 more. E1, reproduced or measured · probes/5/, probes/2/aria.yml, probes/5/final.png, .ui-evaluator/runs/20261016-125610-audit-standard/probes/36/ · found by 3 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Open the chooser with the current day and slot selected. Show a line such as 'Changing your Saturday 17 October booking; your vehicle and waste are kept'. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-1 Visibility of system status; H2-6 Recognition rather than recall; H2-5 Error prevention; H2-3 User control and freedom

#### F-0075 · Nowhere does the flow say how long a chosen slot is held

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0075 | Nowhere does the flow say how long a chosen slot is held | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** Slots are held while the resident finishes, and the hold can expire (the expired state exists), but no screen gives the hold time or a countdown. The persona explicitly does not know how long a chosen slot is held. Residents booking while doing something else can lose the slot without warning.

**Evidence.** Where: / [slot-chosen] at 375 px; /vehicle.html at 375 px; /confirm.html at 375 px and 2 more. E1, reproduced or measured · .ui-evaluator/runs/20261016-125610-audit-standard/probes/26/aria.yml, .ui-evaluator/runs/20261016-125610-audit-standard/probes/38/aria.yml, .ui-evaluator/runs/20261016-125610-audit-standard/probes/12/screenshots/vehicle.png, probes/37 · found by 2 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P1 · Status open · Also: H2-5 Error prevention

#### F-0078 · No indication anywhere of how long a chosen slot is held

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0078 | No indication anywhere of how long a chosen slot is held | 3 · major | 2 · one component or file | H2-1 | Visibility of system status |

**Problem.** The context says residents do not know how long a chosen slot is held, and the confirm page can fail with 'This slot is no longer available'. Neither the slot page, the vehicle page nor the confirm page states a hold time or shows time remaining. Residents booking while doing something else, and slower keyboard or screen-reader users, can lose the slot after filling in all details without warning or a way to extend.

**Evidence.** E1, reproduced or measured · evidence/aria/root/slot-chosen/375-light.yml, evidence/aria/vehicle-html-date-2026-10-17-slot-09-20/default/375-light.yml, evidence/aria/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/default/375-light.yml, evidence/screens/confirm-html-date-2026-10-17-slot-09-20-vehicle-car-waste-ga/expired/375-light.png · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: missing element · Priority P1 · Status open · Also: WCAG 2.2.1 Timing adjustable

#### F-0080 · Done page does not show the booked day, time or vehicle

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0080 | Done page does not show the booked day, time or vehicle | 3 · major | 2 · one component or file | DES-hierarchy | — |

**Problem.** /done shows only 'Booked', the reference DR-204117 and generic instructions. The day (Saturday 17 October), the slot (09:20 to 09:40) and the vehicle, all present on /confirm, are not repeated. The done surface's job is 'know the booking is made and what to show at the gate'; the gate checks the vehicle against the booking and the slot is the scarce thing.

**Evidence.** Where: /done.html at 1440 px. E1, reproduced or measured · <round>/eval-21-audit-standard-slot-booking/with_skill/run-1/workspace/.ui-evaluator/runs/20261016-125610-audit-standard/evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/1440-light.png, .ui-evaluator/runs/20261016-125610-audit-standard/probes/78/aria.yml, .ui-evaluator/runs/20261016-125610-audit-standard/probes/78/screenshots/booked.png · found by 1 of 12 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Decide what the gate and the resident need on one screen (reference, day, slot, vehicle, registration) and make that block the page's focal point. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: missing element · Priority P1 · Status open

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
| F-0024 | Expired-slot error does not say how to recover and is not linked to the fix | 2.33 · minor | 2 · one component or file | WCAG 3.3.3 | Error suggestion | E1 | open |
| F-0022 | Cancelled-booking page title reads 'Booked' | 2 · minor | 2 · one component or file | WCAG 2.4.2 | Page titled | E1 | open |
| F-0031 | Slot list has no loading state: grid and status line are blank for 0.9 s and Next silentl… | 2 · minor | 2 · one component or file | CMP-05 | Data states exist | E1 | open |
| F-0034 | Errors raised after 'Book this slot' (permit, past slot, closed day, expired hold) carry … | 2 · minor | 2 · one component or file | CMP-18 | — | E1 | open |
| F-0039 | Error summary links on the vehicle step point at non-focusable containers | 2 · minor | 1 · one value or token | CMP-18 | — | E1 | open |
| F-0042 | Permit number field stays visible after choosing Car, without saying it is for vans and t… | 2 · minor | 2 · one component or file | CW-Q4 | Will the user understand the feedback? | E1 | open |
| F-0056 | The permit field is shown and labelled the same whatever vehicle is chosen | 2 · minor | 2 · one component or file | H2-8 | Aesthetic and minimalist design | E1 | open |
| F-0104 | Permit rule on the vehicle step is hidden behind an icon-only (i) button | 2 · minor | 2 · one component or file | H2-10 | Help and documentation | E1 | open |
| F-0058 | Vehicle step does not show which day and slot are being booked | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0079 | 'Few left' slots are pulled out of the Morning/Afternoon lists into an unlabelled group | 2 · minor | 1 · one value or token | DES-hierarchy | — | E1 | open |
| F-0083 | Permit field shown before a vehicle is chosen; the permit rule sits behind an (i) button | 2 · minor | 2 · one component or file | DES-brandfit | — | E1 | open |
| F-0105 | Permit help says to apply on the council site but gives no link and no timing | 1.67 · minor | 1 · one value or token | H2-10 | Help and documentation | E1 | open |
| F-0082 | Expired hold keeps 'Book this slot' as the filled primary while the slot shows '–' | 1.67 · minor | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0101 | At 320px the slot grid appears wider than the header rule and the Opening days card | 1.67 · minor | 2 · one component or file | LAY-03 | Heading rhythm | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0025 | Selected day is marked only by a 1 px thicker border under forced colours | 1 · cosmetic | 2 · one component or file | A11Y-22 | — | E1 | open |

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
| F-0084 | No identity beyond the council name; the gate reference has no treatment of its own | 2 | /done.html, / |
| F-0085 | Columns stop short and bands empty at wide widths | 2 | /, /done.html, /vehicle.html |
| F-0086 | Two styles for the same choice control (day buttons vs vehicle buttons) | 2 | /, /vehicle.html |
| F-0087 | Small detailing lapses: stranded (i), cramped back link, crammed inline errors, repeated … | 1 | /vehicle.html, / |
| F-0102 | The gate reference has no focal treatment on the done page | 1 | /done.html |
| F-0103 | Forms and slot grid leave the right half of the content column empty at desktop widths | 1 | /, /vehicle.html, /confirm.html |

## 5. Divergent and disputed findings: questions for user research

The raters did not diverge (0 divergent). Open questions worth testing with residents:
- Do residents who double-tap "Book this slot" notice the "Status: cancelled" line under the large "Booked" heading?
- Do residents expect the "Few left" block to be all the morning has, and miss 08:00 and 09:20?
- How many van owners reach the confirm page without a permit?
- F-0037 (Enter during IME composition) needs a manual test with a real IME; the probe could not produce composition events.

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | pass | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | fail | F-0017 |
| 1.3.2 | A | Meaningful sequence | human | fail | F-0017 |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | pass | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | pass | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0001 |
| 1.4.4 | AA | Resize text | scripted | pass | — |
| 1.4.5 | AA | Images of text | agent-judged | pass | — |
| 1.4.10 | AA | Reflow | scripted | fail | F-0009 |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | pass | — |
| 1.4.13 | AA | Content on hover or focus | agent-judged | pass | — |
| 2.1.1 | A | Keyboard | scripted | pass | — |
| 2.1.2 | A | No keyboard trap | scripted | pass | — |
| 2.1.4 | A | Character key shortcuts | agent-judged | pass | — |
| 2.2.1 | A | Timing adjustable | agent-judged | fail | F-0036, F-0078 |
| 2.2.2 | A | Pause, stop, hide | agent-judged | pass | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | agent-judged | fail | F-0022 |
| 2.4.3 | A | Focus order | scripted | fail | F-0017, F-0039 |
| 2.4.4 | A | Link purpose in context | agent-judged | pass | — |
| 2.4.5 | AA | Multiple ways | agent-judged | not_applicable | — |
| 2.4.6 | AA | Headings and labels | agent-judged | fail | F-0021 |
| 2.4.7 | AA | Focus visible | scripted | fail | F-0016 |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | pass | — |
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
| 3.3.1 | A | Error identification | scripted | fail | F-0033 |
| 3.3.2 | A | Labels or instructions | agent-judged | pass | — |
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0024, F-0034 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | pass | — |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_applicable | — |
| 4.1.2 | A | Name, role, value | agent-judged | pass | — |
| 4.1.3 | AA | Status messages | scripted | fail | F-0015 |

Totals by coverage: auto 1 · scripted 22 · agent-judged 23 · needs-human 8; by state: pass 33 · fail 12 · not_run 8. This matrix is not a conformance claim (QUALITY-BAR §8).

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
- 2.2.1 slot hold: the expired state is reachable only through the hold=expired fixture parameter. The real hold duration, any warning, and whether it can be extended could not be observed. (a11y)
- Error state of the 'Another day' date field (invalid or out-of-range dates) was not probed beyond the closed Wednesday case. (a11y)
- Checkbox boundary contrast in the dark theme looks low (grey box on a dark row). It is left to the scripted contrast check and the native-control exemption; I did not judge it. (a11y)
- Rendered effect of every finding below: no probe or capture was run by this role; findings are E0 except where the code itself is the defect (E1). (code)
- uie lint output: lint.json in the packet is empty and lint was not re-run by this role. (code)
- Line and column within the minified bundle: files are single-line; locations use text-search snippets. (code)
- Whether slots earlier than the current time are offered for 'Today'. The app's clock time is not visible, and 08:00 on Monday 12 was selectable in probe 57. (he-1)
- How long a chosen slot is held before it expires. I could not trigger expiry naturally; only the seeded hold=expired state was seen. (he-1)
- Whether 'A household can book two slots a week' is enforced. I did not book a third slot for the same household. (he-1)
- Whether resubmitting after Back creates a duplicate booking. Probe 52 returned the same reference both times, so the server side cannot be judged from the UI. (he-1)
- Hypothesis: on 'Today' the slots before the current time (journey says today is Monday 12 October 10:05) remain bookable. Probe 10 booked Monday 12 October 08:00 through to confirm, but I cannot confirm the app's notion of the current time, so this is not recorded as a finding. (he-2)
- Whether a permit number without the DRC- prefix ('12345') is rejected at final submit: probe 23 shows it accepted on the vehicle step and displayed on confirm; I did not submit it. (he-2)
- Double submission of 'Book this slot' during the ~1-2 s delay was not attempted (would create a second booking); only absence of feedback is recorded. (he-2)
- How long a slot is held in practice (expiry timing) could not be produced live; only the seeded hold=expired state was seen. (he-2)
- Whether the slot-loading delay and the arrival of slots are announced to screen readers (a live region): the ARIA snapshot does not expose aria-live, and no screen reader was run. (he-3)
- Whether the vehicle error summary moves focus to the alert on submit: the route recipe asserts it is focused, but I did not capture focus myself beyond the screenshot. (he-3)
- Whether a hold actually expires after a fixed time in normal use: only the seeded hold=expired state was reachable. (he-3)
- Whether today's already-passed slots (e.g. 08:00 when the time is 10:05) are offered as bookable: the app clock during probes could not be set, so I could not confirm the time the app uses. (he-3)
- Behaviour at 200% zoom and with VoiceOver/TalkBack: not available in the probe tool; only 320 px captures were inspected as a proxy. (he-3)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0001, F-0009, F-0015, F-0016, F-0017, F-0018 (`fix` workflow, one finding per commit).
2. For L1: FUN-05 (1 finding(s)); FUN-07 (1 finding(s)); A11Y-01 (1 finding(s)); A11Y-03 (1 finding(s)); A11Y-04 (1 finding(s)) ….
3. For L2: USE-05 (2 open P0 finding(s)); USE-06 (18 P1 finding(s) without a recorded decision); USE-08 (1 top task(s) not completable); DES-02 (0/3 critics judged it specific); DES-03 (3 agreed severe design finding(s) open) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (20 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

