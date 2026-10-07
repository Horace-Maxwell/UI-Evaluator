# UI evaluation report: Saltmarsh Quay visitor berths · run 20261007-095104-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:7980c64446 (uncommitted changes present) · run opened 2026-10-07T13:51:04.911Z |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Surfaces and modes | plan-visit (operate), choose-berth (operate), boat-details (operate), review (operate), confirmation (read) |
| Routes × states | 5 route(s) × 10 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-07T13:51:08.258Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | d647ae5a d647ae5a d647ae5a |
| walkthrough-evaluator | 1 | subagent | claude-opus-5-5 | ee62e948 |
| design-critic | 3 | subagent | claude-opus-5-5 | d8d208b5 d8d208b5 d8d208b5 |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 3a531299 |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 13967f81 bcc67778 |
| finding-verifier | 1 | subagent | claude-opus-5-5 | 7d259106 |
| severity-rater | 3 | subagent | claude-opus-5-5 | 239333bd 8b47ed72 2694f2b4 |

Coverage: 230 valid capture(s); 97% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** A11Y-13 (1 finding(s)); A11Y-27 (5 confirmed judged WCAG failure(s)); CMP-01 (2 finding(s)); CPY-04 (2 finding(s)); DEC-02 (DESIGN.md is missing)

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | pass | — |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-13, A11Y-27 |
| G3 Craft floor | fail | CMP-01, CPY-04 |
| G4 Deliberateness and anti-slop | fail | DEC-02 |
| G5 Analytical usability | fail | USE-05, USE-06 |
| G6 Design quality | fail | DES-02, DES-03, DES-04, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- The error summaries take focus, link to each field, use plain words and keep what was typed. All 3 heuristic evaluators and the auditor noted this.
- Berth cards state the size limit, tide behaviour and price together. Native radios sit in a named group, and the full description is in each accessible name.
- Review states the total and "You pay at the harbour office when you arrive. Nothing is charged online.", which matches the brief.
- The draught field names its unit and explains the term. This is the model for the Length field.
- The "More options" menu follows the disclosure pattern (Escape closes it and returns focus). "Change dates" pre-fills every earlier choice. The problem is where the link is, not how it behaves.
- Forced-colours and colour-vision renderings keep borders, outlines and error text.

- Error summaries use role=alert, take focus, link to each field, and inline errors are tied to invalid fields on all three forms
- Berth choice uses native radios inside a named group, with the full description in each accessible name
- More options follows the APG disclosure model (aria-expanded toggles, Esc closes and returns focus), and the Change dates link pre-fills earlier answers (3.3.7)
- Tide table has a caption plus column and row headers; review and confirmation pages use description lists
- Forced-colours rendering keeps card borders, radio outlines, button borders and link colours; errors stay readable in text under every CVD simulation
- Design tokens used consistently in every component rule
- Global focus-visible indicator and reduced-motion path
- Error summary and inline errors wired programmatically

## 4. Findings

Each finding is one problem, listed separately, in the form of a heuristic-evaluation report: severity 0 not a usability problem · 1 cosmetic · 2 minor · 3 major · 4 catastrophe, the mean of at least three independent raters (deterministic findings carry their rule's severity); ease of fixing 1 one value or token · 2 one component or file · 3 several components or one flow · 4 information architecture, rated by the code reviewer; heuristics are Nielsen's ten, version 2, numbered H2-1 to H2-10; walkthrough questions are the four asked at every step.

Agreement: any-two agreement 0.59 (mean Jaccard over 3 passes); an estimated 0.9 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0006 · "Booking stopped" does not say which entry is wrong or how to fix it when the boat is longer than the chosen berth

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0006 | "Booking stopped" does not say which entry is wrong or how to fix it when the boat is lon… | 4 · catastrophe | 2 · one component or file | WCAG 3.3.1 | Error identification |

**Problem.** On the boat-details step, a length over the chosen berth's limit (10.4 m on Pontoon B, berth 14, which takes boats up to 10 m) replaces the whole form with 'Booking stopped. This booking cannot continue. Reference BK-409.' The system has detected an input error, but the message does not name the field (Length), does not describe the error (longer than the 10 m limit of this berth), and does not suggest a fix, although one is known: Pontoon C, berth 3 (12 m) and Wall berth 2 (15 m) were free on the same dates. The page has no link back to the berth list or to the form, and the entered values are gone. 3.3.1 requires the item in error to be identified and described in text; 3.3.3 requires a known correction to be suggested. Visiting skippers on the critical book-visitor-berth journey reach a dead end with no idea why. Screen-reader users hear only 'This booking cannot continue'. The only way forward is to phone the harbour office, which is open 08:00 to 20:00, or to start again from the home page.

**Evidence.** Where: /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 [length-over-limit] `role=heading[name="Booking stopped"]` at 1280 px; /boat.html [length-over-limit] `#dead-end`; /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 [length-over-limit] `role=heading[name="Booking stopped"]` at 375 px and 4 more. E1, reproduced or measured · .ui-evaluator/runs/20261007-095104-audit-standard/evidence/screens/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/length-over-limit/1280-light.png, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/length-over-limit/1280-light.yml, .ui-evaluator/runs/20261007-095104-audit-standard/probes/30/, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/aria/berths-html-date-2026-10-17-nights-2-arrive-15-00/default/1280-light.yml · found by 8 of 10 evaluator(s). Ratings: 4 (spread 0; 4, 4, 4).

**Recommendation.** Keep the form and show the standard error pattern (summary with role=alert plus an inline error on Length tied with aria-describedby and aria-invalid): 'Your boat is 10.4 metres long. Pontoon B, berth 14 takes boats up to 10 metres.' Add a link back to the berth list ('Choose a different berth') that keeps the dates and boat details, and name the berths that fit. Better still, ask for length before or alongside the berth choice and show only berths that fit (see a11y-4). (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P0 · Status open · Also: WCAG 3.3.3 Error suggestion; A11Y-27 No verified judged WCAG failure; H2-9 Help users recognize, diagnose and recover from errors; H2-3 User control and freedom; CPY-04 Error-message quality; CW-Q4 Will the user understand the feedback?; H2-2 Match between system and the real world; DES-execution —; DES-appeal —

### P1

#### F-0022 · Choosing an arrival time when the sill gate is shut gives no feedback

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0022 | Choosing an arrival time when the sill gate is shut gives no feedback | 3.33 · major | 3 · several components or one flow | CW-Q4 | Will the user understand the feedback? |

**Problem.** After choosing an arrival time, the persona needs to see whether the harbour can be entered then. Choosing 08:00 on Saturday 17 October (high water 02:08 and 14:32 UTC, so the gate is shut) and pressing Check berths goes straight to 'Choose a pontoon space' with 'Arriving on Saturday 17 October 2026 at 08:00' and no warning. For the correct 15:00 there is likewise no confirmation that the gate is open. A skipper may book an arrival time at which the boat cannot get over the sill, and learn this only on arrival.

**Evidence.** Where: / `role=combobox[name="Arrival time"]` at 375 px; /berths.html `main > p` at 375 px; / `#arrive` at 375 px and 2 more. E1, reproduced or measured · .ui-evaluator/runs/20261007-095104-audit-standard/probes/22/final.png, probes/14/, probes/1/, .ui-evaluator/runs/20261007-095104-audit-standard/probes/11/ · found by 5 of 10 evaluator(s). Ratings: 3.33 (spread 1; 3, 4, 3).

**Recommendation.** Mark or warn on arrival times outside the gate window for the chosen date, and restate the window on the berths page. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-5 Error prevention; H2-6 Recognition rather than recall; H2-2 Match between system and the real world

#### F-0010 · Berth is chosen before boat length is asked, so a mismatch is only found at the end

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0010 | Berth is chosen before boat length is asked, so a mismatch is only found at the end | 3 · major | 3 · several components or one flow | H2-5 | Error prevention |

**Problem.** The flow asks the skipper to pick a berth (each card states 'Boats up to N metres') before asking for the boat's length on the next page. Nothing on the berth list asks for or filters by length, and nothing on the boat page re-checks the fit until submission, which then ends in 'Booking stopped' (a11y-1). The skipper has to compare their LOA with each card's limit from memory. Avoidable dead ends in the critical journey, and a memory bridge across two pages for a figure that decides whether the booking can go ahead.

**Evidence.** Where: /berths.html?date=2026-10-17&nights=2&arrive=15:00 `role=group[name="Pontoon spaces free on these dates"]`; /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 `role=textbox[name="Length"]`; /berths.html?date=2026-10-17&nights=2&arrive=15:00 `role=group[name="Pontoon spaces free on these dates"]` at 375 px and 1 more. E1, reproduced or measured · .ui-evaluator/runs/20261007-095104-audit-standard/evidence/screens/berths-html-date-2026-10-17-nights-2-arrive-15-00/default/1280-light.png, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/aria/berths-html-date-2026-10-17-nights-2-arrive-15-00/default/1280-light.yml, .ui-evaluator/runs/20261007-095104-audit-standard/probes/2/, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/screens/berths-html-date-2026-10-17-nights-2-arrive-15-00/default/375-light.png · found by 4 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Ask for length (and draught) on the plan-visit step or at the top of the berth list, then show only berths that fit, with the others listed as 'too short for your boat'. Show the chosen berth's limit beside the Length field. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: overall structure · Priority P1 · Status open · Also: H2-6 Recognition rather than recall; ISO 9241-110 suitability for the task —; H2-7 Flexibility and efficiency of use

#### F-0011 · Boat details form is emptied whenever the boat page is shown, including on Back from review

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0011 | Boat details form is emptied whenever the boat page is shown, including on Back from revi… | 3 · major | 2 · one component or file | WCAG 3.3.7 | Redundant entry |

**Problem.** Information a user has already entered in the same process should be restored or offered when they return to a step (WCAG 3.3.7; product principle 'Never lose what a skipper has typed'). app.js registers a pageshow listener on the boat page that calls boatForm.reset() every time the page is shown, including restores from the back-forward cache, and the page never reads the boat, loa, draught and mmsi values that app.js itself carries forward in the review URL. boat.html also sets autocomplete="off" on the form, which stops the browser restoring or suggesting the values. A skipper who goes back from the review step to correct one boat detail may find all four fields blank and have to retype the boat name, length, draught and nine-digit MMSI, often on a phone on board.

**Evidence.** Where: /boat.html `form#boat-form`; /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=C3 [default (after Back from review)] `form` at 375 px; /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=C3 `#boat` at 375 px. E1, reproduced or measured · app.js:164-167, app.js:93,194, .ui-evaluator/runs/20261007-095104-audit-standard/probes/verifier-B/screenshots/boat-after-back.png, .ui-evaluator/runs/20261007-095104-audit-standard/probes/23/ · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Remove the pageshow reset, prefill the four inputs from the query string when present, and drop autocomplete="off" from the form. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-3 User control and freedom; H2-5 Error prevention; H2-6 Recognition rather than recall; H2-7 Flexibility and efficiency of use

#### F-0017 · Tide table states times in UTC while arrival times are chosen in local time

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0017 | Tide table states times in UTC while arrival times are chosen in local time | 3 · major | 2 · one component or file | H2-2 | Match between system and the real world |

**Problem.** Times a user must compare should share one time zone, the one the product declares (24-hour local time). The tide table caption says 'times in UTC', while the arrival-time select offers plain local clock times; on 17-23 October 2026 UK local time is BST (UTC+1, until 25 October), so the table's high-water times are one hour behind the clock the skipper reads and the select uses. A skipper planning arrival inside the sill-gate window may misjudge it by an hour unless they convert, and may arrive when the gate is closed.

**Evidence.** Where: / `table.tides caption`; / `role=table[name="High water at the quay, times in UTC"]` at 375 px; / `#arrive` at 375 px and 6 more. E1, reproduced or measured · .ui-evaluator/runs/20261007-095104-audit-standard/probes/22/final.png, index.html:79,84-90, index.html:62-68, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/aria/root/default · found by 8 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Show tide times in UK local time (BST/GMT as applicable) and say so in the caption, matching the arrival-time list. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-4 Consistency and standards; H2-6 Recognition rather than recall; DES-coherence —; CW-Q3 Will the user recognize the action as the correct one?; H2-5 Error prevention; DES-execution —

#### F-0018 · Tide times are a fixed seven-day table unrelated to the chosen arrival date

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0018 | Tide times are a fixed seven-day table unrelated to the chosen arrival date | 3 · major | 4 · information architecture or architecture | H2-6 | Recognition rather than recall |

**Problem.** The product requires the tide window wherever a time is chosen. The tide data is seven hard-coded rows (17-23 October 2026) on the plan page only; the arrival date input accepts dates until 31 March 2027, the arrival-time select carries no tide information, and the berth and review pages, which restate the arrival time, show no tide or gate window. For any arrival outside that week a skipper gets no tide information in the booking and must find it elsewhere; on later steps they must remember the window.

**Evidence.** Where: / `table.tides tbody`; / `select#arrive`; /berths.html `#stay`. E1, reproduced or measured · index.html:84-90, app.js, .ui-evaluator/runs/20261007-095104-audit-standard/probes/verifier-F/screenshots/table-after-dec-date.png, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/aria/berths-html-date-2026-10-17-nights-2-arrive-15-00/menu-open/1280-light.yml · found by 1 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Drive the table from tide data keyed by date, show the gate window for the chosen date next to the arrival-time field, and repeat it in the stay summaries. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: PRODUCT-P1 Show the tide window wherever a time is chosen

#### F-0023 · Which boat length counts is not stated, on the berth limits or on the Length field

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0023 | Which boat length counts is not stated, on the berth limits or on the Length field | 3 · major | 2 · one component or file | CW-Q3 | Will the user recognize the action as the correct one? |

**Problem.** A skipper with a bowsprit has two lengths (10.4 m overall, 9.6 m hull) and needs to know which one the harbour uses. On /berths.html the cards say 'Boats up to 10 metres' / 'up to 12 metres' without saying length overall. On /boat.html the field is labelled just 'Length', with no unit and no hint, while the next field reads 'Draught in metres' with a hint. Probes show the consequence: with Pontoon B, berth 14, a Length of 9.6 is accepted and priced at £61.44, while 10.4 is stopped. A first-time skipper may pick the cheaper 10-metre berth and enter hull length, booking a berth the boat may not fit, or may hit an unexplained stop.

**Evidence.** Where: /berths.html?date=2026-10-17&nights=2&arrive=15:00 `role=radio[name=/Pontoon B, berth 14/]` at 375 px; /boat.html `role=textbox[name="Length"]` at 375 px; /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 `#loa` at 375 px and 3 more. E1, reproduced or measured · .ui-evaluator/runs/20261007-095104-audit-standard/evidence/screens/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/default/1280-light.png, evidence/aria/berths-html-date-2026-10-17-nights-2-arrive-15-00/default/375-light.yml, evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/default/375-light.yml, probes/19/ · found by 5 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** Say 'length overall (LOA), including bowsprit, in metres' on the field and the same basis on the berth limits. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-2 Match between system and the real world; H2-5 Error prevention; WCAG 3.3.2 Labels or instructions; WCAG 3.3.3 Error suggestion; A11Y-27 No verified judged WCAG failure

#### F-0037 · MMSI is required with no explanation and no option for boats without one

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0037 | MMSI is required with no explanation and no option for boats without one | 3 · major | 2 · one component or file | H2-10 | Help and documentation |

**Problem.** Unfamiliar or conditional inputs need help at the point of entry. 'MMSI' is an unexplained acronym with no hint (unlike 'Draught in metres', which has one), and leaving it empty gives 'Enter the MMSI'; there is no way to continue without it. A visiting skipper whose boat has no DSC radio, or who does not know the number by heart, may be unable to complete the booking online.

**Evidence.** Where: /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 `#mmsi` at 375 px; /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 [errors] `#mmsi` at 375 px. E1, reproduced or measured · .ui-evaluator/runs/20261007-095104-audit-standard/probes/20/, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/default, .ui-evaluator/runs/20261007-095104-audit-standard/probes/28/probe.json, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/screens/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/errors/375-light.png · found by 3 of 10 evaluator(s). Ratings: 3 (spread 0; 3, 3, 3).

**Recommendation.** none given by the evaluators.

Problem type: multiple locations · Priority P1 · Status open · Also: H2-5 Error prevention; H2-2 Match between system and the real world; H2-3 User control and freedom

#### F-0008 · Change dates, a core task, is hidden behind an unlabelled "..." overflow button

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0008 | Change dates, a core task, is hidden behind an unlabelled "..." overflow button | 2.67 · major | 2 · one component or file | H2-6 | Recognition rather than recall |

**Problem.** On the berth list, the only in-flow way to change the arrival date (top task 2, journey change-arrival-date) is a 'Change dates' link inside a disclosure opened by an icon-only '...' button. The button sits at the far right, away from the 'Arriving on Saturday 17 October 2026 at 15:00' summary it relates to. Its accessible name is 'More options', but nothing visible says so. The disclosure works by keyboard (probe 22: Enter opens, Tab reaches the link, Esc closes and returns focus), so this is not a WCAG failure; it is a recognition problem. Users have to guess that dates live under a generic overflow icon. Speech-control users must also guess the hidden name 'More options' to activate it. Skippers who realise they picked the wrong day (e.g. after checking the tide) cannot see how to fix it. They are likely to use browser Back or restart, and at 400% zoom or on a phone in a cockpit the small icon is easy to miss.

**Evidence.** Where: /berths.html?date=2026-10-17&nights=2&arrive=15:00 `role=button[name="More options"]` at 1280 px; /berths.html?date=2026-10-17&nights=2&arrive=15:00 `#more-button` at 375 px; /berths.html?date=2026-10-17&nights=2&arrive=15:00 [menu-open] `#change-dates` at 375 px and 3 more. E1, reproduced or measured · .ui-evaluator/runs/20261007-095104-audit-standard/evidence/screens/berths-html-date-2026-10-17-nights-2-arrive-15-00/default/1280-light.png, .ui-evaluator/runs/20261007-095104-audit-standard/probes/22/, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/screens/berths-html-date-2026-10-17-nights-2-arrive-15-00/default/375-light.png, .ui-evaluator/runs/20261007-095104-audit-standard/probes/9/ · found by 7 of 10 evaluator(s). Ratings: 2.67 (spread 1; 3, 3, 2).

**Recommendation.** Put a visible 'Change dates' text link directly after the arrival summary sentence (and 'Harbour rules' as a plain link). Drop the overflow menu; with only two items it saves no space. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: multiple locations · Priority P1 · Status open · Also: H2-8 Aesthetic and minimalist design; H2-3 User control and freedom; H2-7 Flexibility and efficiency of use; CW-Q2 Is the action visible?; DES-hierarchy —; DES-execution —

#### F-0066 · The tide and sill-gate window, the product's defining mechanism, has no visual form

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |
|---|---|---|---|---|---|
| F-0066 | The tide and sill-gate window, the product's defining mechanism, has no visual form | 2.67 · major | 3 · several components or one flow | DES-specificity | — |

**Problem.** The one fact that distinguishes this booking from any marina form — boats can only cross the sill about two hours either side of high water — appears only as body copy, a stock tide table below the form and a grey footnote. The arrival-time select is not visibly connected to the gate window, and no later step (berths, review, confirmation) shows the window for the chosen day. Skippers new to the harbour may pick an arrival time outside the gate window because nothing in the form shows it; the design also has no element a visitor would recognise as belonging to this harbour.

**Evidence.** Where: / at 1280 px; /confirmed.html at 1280 px; /berths.html at 1280 px and 1 more. E1, reproduced or measured · .ui-evaluator/runs/20261007-095104-audit-standard/evidence/screens/root/default/1280-light.png, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/screens/root/default/375-light.png, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/aria/root/default/1280-light.yml, .ui-evaluator/runs/20261007-095104-audit-standard/evidence/aria/berths-html-date-2026-10-17-nights-2-arrive-15-00/menu-open/1280-light.yml · found by 3 of 10 evaluator(s). Ratings: 2.67 (spread 1; 2, 3, 3).

**Recommendation.** Decide how the gate window for the chosen day becomes the organising element of the arrival step and recurs (review, confirmation), so the signature comes from the harbour's own mechanism rather than ornament. (advisory: the fix workflow chooses the narrowest correct change)

Problem type: overall structure · Priority P1 · Status open · Also: DES-02 Specificity verdict; H2-2 Match between system and the real world

### P2

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0013 | Invalid-state border applies only to input elements, not to the arrival-time select or th… | 2 · minor | 1 · one value or token | CMP-01 | State styling exists | E1 | open |
| F-0014 | Berth option cards have no selected or keyboard-focus state at card level | 2 · minor | 1 · one value or token | CMP-01 | State styling exists | E1 | open |
| F-0015 | Arrival date outside the bookable season or in the past is accepted | 2 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0016 | Error summary link for the berth question targets the fieldset, so focus does not reach a… | 2 · minor | 2 · one component or file | A11Y-13 | Forms | E1 | open |
| F-0019 | Confirmation omits the arrival time shown on the review step | 2 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0020 | Booking reference is derived from month, day and berth only, so it repeats | 2 · minor | 4 · information architecture or architecture | H2-5 | Error prevention | E1 | open |
| F-0033 | Review page has no links to change earlier answers | 2 · minor | 3 · several components or one flow | H2-3 | User control and freedom | E1 | open |
| F-0035 | No indication of the steps in the booking or where the user is in them | 2 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0039 | Boat page does not show which berth was chosen or its size limit | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0042 | Back from the confirmation shows the editable review page with no sign the booking is made | 2 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |
| F-0043 | The same thing is called berth, pontoon space and mooring across the flow | 2 · minor | 2 · one component or file | H2-4 | Consistency and standards | E1 | open |
| F-0045 | Tide times link mid-booking opens an empty booking form | 2 · minor | 2 · one component or file | H2-6 | Recognition rather than recall | E1 | open |
| F-0047 | The visible 'Book a berth' link mid-booking discards the chosen date, nights and time wit… | 2 · minor | 2 · one component or file | H2-3 | User control and freedom | E1 | open |
| F-0089 | MMSI accepts a malformed value | 2 · minor | 2 · one component or file | H2-5 | Error prevention | E1 | open |
| F-0090 | MMSI has no hint about what it is or its format | 2 · minor | 1 · one value or token | H2-5 | Error prevention | E1 | open |
| F-0049 | Review step omits the draught and MMSI the skipper entered | 2 · minor | 2 · one component or file | H2-1 | Visibility of system status | E1 | open |

### P3

| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic | Evidence | Status |
|---|---|---|---|---|---|---|---|
| F-0046 | Error link scrolls the field to the top edge, hiding its label and message | 1.33 · cosmetic | 1 · one value or token | H2-9 | Help users recognize, diagnose and recover from errors | E1 | open |
| F-0052 | Tide table column headers misaligned with right-aligned time figures | 1.33 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0095 | Booking reference has no prominence | 1.33 · cosmetic | 2 · one component or file | DES-hierarchy | — | E1 | open |
| F-0001 | Compared number without tabular figures: "Sat 17 Oct" | 1 · cosmetic (rule) | 1 · one value or token | TYP-14 | — | E1 | open |
| F-0002 | One word on the last line: "Keep to 4 knots inside the harbour walls" | 1 · cosmetic (rule) | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0003 | One word on the last line: "Choose a pontoon space" | 1 · cosmetic (rule) | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0004 | One word on the last line: "The depth of water your boat needs to fl" | 1 · cosmetic (rule) | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0005 | One word on the last line: "Saturday 17 October 2026 at 15:00" | 1 · cosmetic (rule) | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0053 | Summary list keeps a wide label column at 320, wrapping values to three lines | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0091 | Booking reference breaks across lines at its hyphen | 1 · cosmetic | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0056 | One-word last lines in headings and hints at 320-375 | 1 · cosmetic | 1 · one value or token | TYP-15 | — | E1 | open |
| F-0059 | Identity floor missing: name set as body text on an unchosen pale ground | 1 · cosmetic | 3 · several components or one flow | DES-appeal | — | E1 | open |
| F-0094 | Opening the overflow menu shifts the berth list | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0063 | Footer stops short, leaving an empty band of page ground below it on short pages | 1 · cosmetic | 1 · one value or token | DES-execution | — | E1 | open |
| F-0097 | Wide viewports leave the right side empty | 1 · cosmetic | 2 · one component or file | DES-appeal | — | E1 | disputed |

## 5. Divergent and disputed findings: questions for user research

The raters flagged no divergent findings. One is disputed (F-0097). Questions worth asking real skippers:
- Which length do skippers type when asked for "Length" with no qualifier: length overall, hull length or waterline? (F-0023)
- Do skippers read tide times in UTC and convert them, or take them as local? (F-0017)
- How many visiting boats lack an MMSI? (F-0037)
- Is a wide empty right side at desktop widths noticed at all, given the mostly-phone audience? (F-0097)

| ID | Title | Ratings and validity votes | Status |
|---|---|---|---|
| F-0097 | Wide viewports leave the right side empty | 1 (spread 0; n/p, 1, n/p); not a problem 2, trade-off 0 | disputed |

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
| 1.3.1 | A | Info and relationships | agent-judged | pass | — |
| 1.3.2 | A | Meaningful sequence | needs-human | not_run | — |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | pass | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | pass | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | pass | — |
| 1.4.4 | AA | Resize text | scripted | pass | — |
| 1.4.5 | AA | Images of text | agent-judged | pass | — |
| 1.4.10 | AA | Reflow | scripted | pass | — |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | pass | — |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_applicable | — |
| 2.1.1 | A | Keyboard | scripted | pass | — |
| 2.1.2 | A | No keyboard trap | scripted | pass | — |
| 2.1.4 | A | Character key shortcuts | agent-judged | not_applicable | — |
| 2.2.1 | A | Timing adjustable | agent-judged | pass | — |
| 2.2.2 | A | Pause, stop, hide | agent-judged | not_applicable | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | needs-human | not_run | — |
| 2.4.3 | A | Focus order | scripted | fail | F-0016 |
| 2.4.4 | A | Link purpose in context | agent-judged | pass | — |
| 2.4.5 | AA | Multiple ways | agent-judged | pass | — |
| 2.4.6 | AA | Headings and labels | agent-judged | pass | — |
| 2.4.7 | AA | Focus visible | scripted | pass | — |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | pass | — |
| 2.5.1 | A | Pointer gestures | agent-judged | not_applicable | — |
| 2.5.2 | A | Pointer cancellation | scripted | pass | — |
| 2.5.3 | A | Label in name | agent-judged | pass | — |
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
| 3.3.1 | A | Error identification | scripted | fail | F-0006 |
| 3.3.2 | A | Labels or instructions | agent-judged | fail | F-0007, F-0023, F-0090 |
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0006, F-0007, F-0023, F-0090 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | fail | F-0011 |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_applicable | — |
| 4.1.2 | A | Name, role, value | agent-judged | pass | — |
| 4.1.3 | AA | Status messages | scripted | pass | — |

Totals by coverage: auto 1 · scripted 22 · agent-judged 22 · needs-human 10; by state: pass 33 · fail 5 · not_run 10. This matrix is not a conformance claim (QUALITY-BAR §8).

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
- Whether a booking reaches the harbour office: the fixture has no back end, app.js only navigates to confirmed.html. (code)
- Rendered effect of :focus-visible after programmatic focus on the error summary and the 'Booking stopped' heading (browser heuristic dependent); needs a probe. (code)
- Whether the arrival-time options on / are meant as local time (BST on 17 October 2026) or UTC: nothing on screen states it; treated as ambiguous in the UTC finding rather than as a confirmed mismatch. (he-1)
- Behaviour on slow or failed network (declared weak mobile data): pages loaded locally in under 100 ms and no network failure could be simulated with the probe tool. (he-1)
- Whether the 300 ms wait after browser Back (probe 23) is long enough for a browser to restore form values: the boat fields were empty in the capture; real Safari/Chrome bfcache behaviour on phones may differ. (he-1)
- Double submission of 'Confirm booking': not exercised to avoid creating duplicate bookings beyond the one needed for the task check. (he-1)
- Whether pressing Confirm booking again after Back from the confirmation creates a second booking: not performed, to avoid a duplicate confirmation; only the reappearance of the editable review page was observed (probe 32). (he-2)
- Behaviour on slow or failed network (weak mobile data at sea): the probe server answers in ~20 ms and no offline emulation was run. (he-2)
- Tide information for arrival dates after Fri 23 Oct: the table stops there; no probe with a later date was completed, so what the page shows for such dates is unverified. (he-2)
- Screen-reader announcement of the 'Booking stopped' page and of the berths error summary on VoiceOver/TalkBack: ARIA roles look correct (alert, headings) but actual announcement was not tested on a real screen reader. (he-3)
- Behaviour at 200% zoom and with large OS text sizes: reflow and target sizes belong to uie audit; not measured here. (he-3)
- Whether 'Boats up to N metres' on the berth list means length overall or hull length: the UI does not say, so the correct value for the persona (10.4 LOA vs 9.6 hull) cannot be determined from the UI; probes only show that 10.4 is rejected for B14. (he-3)
- Weak-connectivity behaviour (slow submit, double submit, offline): all pages responded in under 100 ms locally; no throttling was available in the probe. (he-3)
- Brand fit (no DESIGN.md) (critic-2)
- Pairwise (no baseline/ in packet) (critic-2)
- Focus, menu behaviour, native picker on mobile, motion — stills only (critic-2)
- Dark theme not captured (only light variants in screens.json) (critic-2)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0006, F-0008, F-0010, F-0011, F-0017, F-0018 (`fix` workflow, one finding per commit).
2. For L1: A11Y-13 (1 finding(s)); A11Y-27 (5 confirmed judged WCAG failure(s)); CMP-01 (2 finding(s)); CPY-04 (2 finding(s)); DEC-02 (DESIGN.md is missing).
3. For L2: USE-05 (1 open P0 finding(s)); USE-06 (9 P1 finding(s) without a recorded decision); DES-02 (0/3 critics judged it specific); DES-03 (2 agreed severe design finding(s) open); DES-04 (0/3 critics: attributes reflected) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (10 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. Plan a study for 1 divergent or disputed finding(s) (`study` workflow).
6. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

