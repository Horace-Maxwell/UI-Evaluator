# UI evaluation report: Saltmarsh Quay visitor berths · run 20261006-152509-audit-standard

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:0117998a03 (uncommitted changes present) · run opened 2026-10-06T19:25:09.062Z |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Surfaces and modes | plan-visit (operate), choose-berth (operate), boat-details (operate), review (operate), confirmation (read) |
| Routes × states | 5 route(s) × 10 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-06T19:30:19.608Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| heuristic-evaluator | 3 | subagent | claude-opus-5-5 | 6426e2a3 6426e2a3 6426e2a3 |
| walkthrough-evaluator | 1 | subagent | claude-opus-5-5 | 33d40a31 |
| design-critic | 3 | subagent | claude-opus-5-5 | e11035b9 e11035b9 e11035b9 |
| accessibility-auditor | 1 | subagent | claude-opus-5-5 | 137a9a2f |
| code-reviewer | 2 | subagent | claude-opus-5-5, inherit (lead model) | 13967f81 555d909d |
| finding-verifier | 1 | subagent | claude-opus-5-5 | 5d837aab |
| severity-rater | 6 | subagent | claude-opus-5-5 | c9e3b446 c9e3b446 c9e3b446 |

Coverage: 230 valid capture(s); 97% of salient controls exercised (USE-09). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** A11Y-13 (1 finding(s)); A11Y-27 (5 confirmed judged WCAG failure(s)); CMP-01 (2 finding(s)); DEC-02 (DESIGN.md is missing)

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | pass | — |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-13, A11Y-27 |
| G3 Craft floor | fail | CMP-01 |
| G4 Deliberateness and anti-slop | fail | DEC-02 |
| G5 Analytical usability | fail | USE-04, USE-05, USE-06 |
| G6 Design quality | fail | DES-02, DES-03, DES-04, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- Error summaries take focus, link to each field, keep the typed values, and repeat the message beside the field with an example of the right format. This is the GOV.UK pattern, done well.
- Berth cards give fit, tidal behaviour (afloat or drying) and price in the skipper's own terms.
- The review page states the total and "nothing is charged online", which matches the product facts.
- "Change dates", once found, returns a prefilled form, and the menu closes on Escape with focus restored.
- The tide table is a real data table with a caption and row headers. Forced-colours rendering keeps borders, radios and focus visible.
- Field help is in the skipper's terms: draught is "the depth of water your boat needs to float", and the mobile number is wanted because the office "sends a text if the gate times change".
- Token discipline in the CSS, a visible focus ring everywhere, 44 px targets and a reduced-motion path.

- Error summaries take focus, link to each field and repeat the message beside the field on every form
- Forced-colours rendering keeps field borders, the selected radio, links and the focus ring visible
- Tide table is a real data table with caption, column and row headers
- Token discipline: every colour, type size, spacing step, radius and transition duration in component rules uses a :root custom property
- Global focus-visible indicator (3 px solid ink outline, 2 px offset) distinct from hover, with no outline:none anywhere
- Reduced-motion path present and transitions limited to colour/background/border properties
- Error summary pattern: role=alert container focused on submit, per-field messages wired with aria-invalid and aria-describedby, hints preserved
- Contact fields carry autocomplete=name and autocomplete=tel; 44 px minimum targets on buttons, inputs, nav and menu links

## 4. Findings

Agreement: any-two agreement 0.31 (mean Jaccard over 3 passes); an estimated 3.4 more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes).

### P0

#### F-0006 · Over-length boat stops the booking with no description of the error and no way to correct it
- Problem type: single location · Criteria: 3.3.1 (primary), 3.3.3, H9, A11Y-27 · Where: /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 [length-over-limit]
- What happens: When an input error is detected, WCAG 3.3.1 expects the item in error to be identified and the error described in text, and 3.3.3 expects a correction suggestion when one is known. Entering a length of 10.4 (or 34) for berth B14, whose limit is 10 metres, replaces the whole form with a page whose only content is the heading 'Booking stopped' and 'This booking cannot continue. Reference BK-409.' The page does not say which value caused the stop (length versus the berth's 10 m limit), does not suggest the known fix (berth C3 or the wall berth take longer boats), offers no link back to the form or the berth choice, and the entered boat details are not kept on screen.
- Impact: A visiting skipper whose boat is slightly too long for the chosen pontoon space may not learn why the booking failed and has no path to choose a larger berth; people with cognitive impairments or using a screen reader on a phone are likely to be stranded and may abandon the booking or phone the office.
- Evidence: E1, reproduced or measured · evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/length-over-limit/1280-light.yml, evidence/screens/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/length-over-limit/1280-light.png, .ui-evaluator/runs/20261006-152509-audit-standard/probes/26/, evidence/aria/berths-html-date-2026-10-17-nights-2-arrive-15-00/default/1280-light.yml · detected by 1 of 10 pass(es)
- Severity 4 (spread 0; 4, 4, 4) · Priority P0 · Ease of fix 2
- Recommendation (advisory): Validate length against the chosen berth on the boat form itself: keep the values, mark Length invalid with text such as 'Pontoon B, berth 14 takes boats up to 10 metres. Your boat is 10.4 metres', and link to the berth choice with the larger berths that fit.
- Status: open

#### F-0013 · Over-length boat leads to a 'Booking stopped' screen that gives no cause and no way to continue
- Problem type: single location · Criteria: H9 (primary), H3, 3.3.3 · Where: /boat.html [length-over-limit]
- What happens: A blocking error should say what went wrong and how to recover. When the entered length exceeds the chosen berth's maximum (app.js:187), the script hides the form and reveals a hard-coded block reading 'Booking stopped' / 'This booking cannot continue. Reference BK-409.' (boat.html:70-73). It does not mention the length limit, the chosen berth, or that a larger berth exists (Wall berth 2 takes up to 15 m, app.js:7), and it offers no link back to the berth choice or the form; the only route on is the masthead or browser Back.
- Impact: A skipper whose boat is longer than the berth they picked may not learn why the booking stopped and may abandon it, although a suitable berth is available.
- Evidence: E1, reproduced or measured · app.js:186-192, boat.html:70-73, probes/verifier/v01/, probes/verifier/v01m/ · detected by 1 of 10 pass(es)
- Severity 4 (spread 0; 4, 4, 4) · Priority P0 · Ease of fix 2
- Recommendation (advisory): Treat the mismatch as a field error on Length that names the berth's maximum, and link back to berths.html with the stay query so a larger berth can be chosen.
- Status: open

#### F-0021 · 'Booking stopped' page gives no reason and no way back to change the berth
- Problem type: multiple locations · Criteria: CW-Q4 (primary), H9, H3 · Where: /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 [length-over-limit] and 1 more location(s)
- What happens: When the system refuses to go on, the message should say what went wrong and how to fix it, and offer a way back. After the boat details are submitted for a berth the boat is too long for, the page shows only the heading 'Booking stopped' and 'This booking cannot continue. Reference BK-409.' It does not say the boat is too long for the berth, has no link back to the berth choice or the boat form, and offers nothing but the footer phone number. All the earlier entries (dates, time, berth, boat) look lost.
- Impact: A skipper who picked a berth that is too short may not learn why the booking failed or what to change, and may give up or have to phone the office (open 08:00-20:00), possibly from the cockpit with poor signal.
- Evidence: E1, reproduced or measured · probes/14/, probes/14/aria.yml, probes/16/, evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/length-over-limit/375-light.yml · detected by 2 of 10 pass(es)
- Severity 4 (spread 0; 4, 4, 4) · Priority P0 · Ease of fix 2
- Recommendation (advisory): Say that the boat (x m) is longer than the berth allows (y m), and link back to the berth list with the dates kept, or better, show the problem inline on the boat form.
- Status: open

#### F-0027 · 'Booking stopped' gives no reason and no way to fix the booking
- Problem type: single location · Criteria: H9 (primary), H3 · Where: /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 [length-over-limit]
- What happens: An error should say what went wrong and how to recover. After a 10.4 m boat is entered for a 10 m berth, the page replaces the form with 'Booking stopped. This booking cannot continue. Reference BK-409.' It does not say the boat is too long for the berth, does not offer to choose another berth, and the form and entered values are gone; only the header links and the office phone number remain.
- Impact: A first-time skipper may not understand why the booking failed and may call the office or give up, when choosing a longer berth would have worked.
- Evidence: E1, reproduced or measured · probes/13/, evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/length-over-limit/375-light.yml, probes/20/, probes/15/final.png · detected by 2 of 10 pass(es)
- Severity 4 (spread 0; 4, 4, 4) · Priority P0 · Ease of fix 2
- Recommendation (advisory): State that the boat is longer than the berth allows and link back to the berth list with longer berths.
- Status: open

#### F-0069 · 'Booking stopped' state is a bare dead end
- Problem type: single location · Criteria: H9 (primary), DES-execution · Where: /boat.html [length-over-limit]
- What happens: The length-over-limit state replaces the form with 'Booking stopped' and 'This booking cannot continue. Reference BK-409.' with no reason, no alternative berth and no next step beyond the footer phone number.
- Impact: A skipper whose boat is too long for the chosen pontoon berth is likely to abandon or phone, although the wall berth takes boats up to 15 m.
- Evidence: E1, reproduced or measured · probes/verifier/v01/ · detected by 1 of 10 pass(es)
- Severity 4 (spread 0; 4, 4, 4) · Priority P0 · Ease of fix 2
- Recommendation (advisory): Explain why the booking stopped in the skipper's terms and offer the way forward (for example a berth that fits).
- Status: open

#### F-0077 · 'Booking stopped' state is a bare dead end
- Problem type: single location · Criteria: DES-execution (primary), H9 · Where: /boat.html [length-over-limit]
- What happens: When the boat is over the berth's length limit, the page replaces the form with 'Booking stopped' and 'This booking cannot continue. Reference BK-409.' with no reason, no link back to choose another berth, and the footer floating at y≈222 at 1280.
- Impact: A skipper whose boat is too long for the chosen pontoon (the wall berth takes up to 15 m) may abandon the booking and phone the office instead.
- Evidence: E1, reproduced or measured · boat/length-over-limit/1280-light.png, probes/verifier/v01/ · detected by 1 of 10 pass(es)
- Severity 4 (spread 0; 4, 4, 4) · Priority P0 · Ease of fix 2
- Recommendation (advisory): Decide what this state should say and offer (the reason and a route to a berth that fits) and design it as a state, not an empty page.
- Status: open

### P1

#### F-0008 · Required MMSI field is unexplained and gives no format or alternative
- Problem type: single location · Criteria: 3.3.2 (primary), H2, A11Y-27 · Where: /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14
- What happens: Labels and instructions should tell people what to enter (3.3.2). The boat form requires 'MMSI' with no expansion, no hint about its 9-digit format and no option for boats that have none; submitting without it shows 'Enter the MMSI' and blocks the step. The product context lists the skippers' own terms as LOA, draught and HW, not MMSI, and boats without DSC radio do not have one.
- Impact: Skippers unfamiliar with the abbreviation, or whose boat has no MMSI, may be unable to continue; people with cognitive impairments get no explanation of an unexpected required term.
- Evidence: E1, reproduced or measured · .ui-evaluator/runs/20261006-152509-audit-standard/probes/27/, evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/default/1280-light.yml, probes/verifier/v16/, probes/verifier/v02/ · detected by 1 of 10 pass(es)
- Severity 3.33 (spread 1; 4, 3, 3) · Priority P1 · Ease of fix 2
- Recommendation (advisory): Label it 'MMSI number (optional)' with a hint 'the 9-digit number on your VHF DSC radio licence', unless the harbour truly requires it, in which case say why and what to do without one.
- Status: open

#### F-0030 · MMSI is required but not explained
- Problem type: single location · Criteria: H10 (primary), H2 · Where: /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 [errors]
- What happens: Every other boat field is either self-evident or explained ('The depth of water your boat needs to float'). 'MMSI' has no hint about what it is, where to find it or why it is needed, yet submitting without it gives 'Enter the MMSI' and blocks the booking. The context lists what newcomers know (length, hull length, draught) and MMSI is not among them.
- Impact: A skipper unsure of the term, or whose boat has no DSC radio, may be unable to continue and has no guidance other than calling the office.
- Evidence: E1, reproduced or measured · evidence/screens/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/errors/375-light.png, probes/35/, evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/errors/375-light.yml, probes/33/ · detected by 2 of 10 pass(es)
- Severity 3.33 (spread 1; 4, 3, 3) · Priority P1 · Ease of fix 1
- Recommendation (advisory): Add a hint (the 9-digit number from the DSC radio) and say what to do without one.
- Status: open

#### F-0007 · Length field does not state the unit expected
- Problem type: multiple locations · Criteria: 3.3.2 (primary), H5, A11Y-27, CW-Q3, H4 · Where: /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 and 1 more location(s)
- What happens: WCAG 3.3.2 expects labels or instructions when input requires a specific format. The boat form labels the field only 'Length', with no unit and no hint, while the next field states 'Draught in metres'. The error message 'Enter the length' also gives no unit. Many UK skippers state boat length in feet; a value of 34 (feet) is accepted as input and leads to the 'Booking stopped' page (probe 26).
- Impact: Skippers who think in feet may enter feet, which the system reads as metres, and then hit an unexplained stop; people relying on the label alone (screen reader, magnification) get no cue about the unit.
- Evidence: E1, reproduced or measured · evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/errors/1280-light.yml, evidence/screens/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/default/1280-light.png, .ui-evaluator/runs/20261006-152509-audit-standard/probes/26/, evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/default/375-light.yml · detected by 2 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 1
- Recommendation (advisory): Label it 'Length overall (LOA) in metres' with a hint such as 'for example 9.5', matching the draught field; optionally flag values that look like feet.
- Status: open

#### F-0009 · Tide table gives high water in UTC while arrival times are chosen in local time
- Problem type: multiple locations · Criteria: H2 (primary), H6, H5, H4, CW-Q3 · Where: / and 5 more location(s)
- What happens: The arrival-time decision depends on the sill-gate window (high water ±2 h). The tide table caption reads 'High water at the quay, times in UTC', while the arrival-time select (06:00–21:00) and the berth page ('Arriving … at 15:00') carry no zone and the product's stated format is local 24-hour time. On 17–23 October 2026 the UK is on BST (UTC+1), so a skipper must add an hour and then apply ±2 h in their head; reading 14:32 as local would put the gate window an hour early.
- Impact: Older skippers and people with cognitive or memory impairments, often planning on a phone in a cockpit, may mis-convert and arrive when the sill gate is closed.
- Evidence: E1, reproduced or measured · evidence/aria/root/errors/1280-light.yml, evidence/screens/root/errors/1280-light.png, evidence/aria/root/default/375-light.yml, evidence/screens/root/default/375-light.png · detected by 5 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 2
- Recommendation (advisory): Show high water in local time (stating BST/GMT), and show the gate-open window directly, for example 'Gate open about 13:30 to 17:30'.
- Status: open

#### F-0012 · Boat details form is emptied every time the page is shown, including after Back from the review page
- Problem type: single location · Criteria: H3 (primary), H5 · Where: /boat.html
- What happens: Details a skipper has entered should survive returning to a step. app.js registers a pageshow listener on the boat page that calls boatForm.reset() (app.js:164-167); pageshow fires on first load and on back/forward-cache restore, so going Back from review.html clears boat name, length, draught and MMSI. The boat page also never prefills from the boat/loa/draught/mmsi query parameters that review.html receives, unlike the plan page which prefills from params (app.js:107-109). The form additionally sets autocomplete="off" (boat.html:42), so the browser cannot offer the values again.
- Impact: A skipper who goes back to correct one detail (for example after seeing the total on review) may have to re-enter all four boat fields, including the 9-digit MMSI.
- Evidence: E1, reproduced or measured · app.js:164-167, app.js:162-196, boat.html:42 · detected by 1 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1
- Recommendation (advisory): Remove the pageshow reset, prefill the inputs from the query parameters when present, and drop autocomplete="off".
- Status: open

#### F-0019 · Tide table is in UTC while arrival times and office hours carry no time zone
- Problem type: single location · Criteria: H2 (primary), H5 · Where: /index.html
- What happens: Times a user must compare should share a time zone. The tide table caption states 'times in UTC' (index.html:79) and the copy asks skippers to plan arrival around high water (index.html:34, 94), but the arrival-time options (index.html:62-68) and harbour-office hours (footer) are bare clock times. The tabled dates (17-23 October 2026) fall in British Summer Time, when local time is UTC+1.
- Impact: A skipper who picks an arrival time straight from the tide table may plan to arrive an hour off the sill-gate window.
- Evidence: E1, reproduced or measured · index.html:79, index.html:62-68, probes/verifier/v11/ · detected by 1 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 2
- Recommendation (advisory): Show tide times in UK local time (or label both columns and the arrival select with the same zone).
- Status: open

#### F-0020 · Berth size limits do not say which boat length they refer to
- Problem type: single location · Criteria: CW-Q3 (primary), H5, H2 · Where: /berths.html?date=2026-10-17&nights=2&arrive=15:00
- What happens: When a skipper is asked to choose a berth by size, the limit should name the measure it applies to (length overall including bowsprit, or hull length), because boats with bowsprits or davits have two quite different lengths. Each berth card says only 'Boats up to N metres' (A6: 8, B14: 10, C3: 12, Wall 2: 15). A persona whose boat is 10.4 m overall but 9.6 m on the hull may read B14 ('up to 10 metres', and cheaper) as fitting. Probed outcome: B14 with an overall length of 10.4 ends on 'Booking stopped' (probes/14); B14 with hull length 9.6 is accepted and reaches the review as a B14 booking for a '9.6 metres long' boat (probes/7).
- Impact: A visiting skipper may choose a berth that is too short for the boat overall. They may then hit an unexplained stop, or be booked into a space that may not take the boat on arrival in a tidal harbour.
- Evidence: E1, reproduced or measured · evidence/aria/berths-html-date-2026-10-17-nights-2-arrive-15-00/default/375-light.yml, probes/5/, probes/7/, probes/14/ · detected by 1 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 1
- Recommendation (advisory): State the measure on each card (e.g. 'Length overall up to 10 m, including bowsprit'), and consider asking for the boat's length before the berth choice so that only berths that fit are offered.
- Status: open

#### F-0024 · Arrival time accepts hours when the sill gate is closed
- Problem type: single location · Criteria: H5 (primary), H1 · Where: /
- What happens: Since boats can only enter around high water, the booking should prevent or warn about an arrival outside the gate window. Choosing 17 October at 08:00 (high water 14:32 UTC, gate open about 12:30-16:30 local) goes straight to the berth list with 'Arriving on Saturday 17 October 2026 at 08:00' and no warning; all hours 06:00-21:00 are offered for every date.
- Impact: A new visitor may book an arrival time at which the boat cannot get over the sill, and only find out at the harbour entrance.
- Evidence: E1, reproduced or measured · probes/2/, probes/10/, probes/verifier/v06/ · detected by 2 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 3
- Recommendation (advisory): Mark or limit arrival times to the gate window for the chosen date.
- Status: open

#### F-0026 · Boat size is asked only after the berth is chosen, so the fit check comes at the end
- Problem type: overall structure · Criteria: H5 (primary), 9241-110 suitability for the task, ISO9241-110-1, H6 · Where: /berths.html?date=2026-10-17&nights=2&arrive=15:00 and 2 more location(s)
- What happens: Skippers do not know which berth fits; the flow should let them pick among berths that fit. The berths page lists all four berths before the boat's length is known; the length is asked on the next page, and a mismatch (10.4 m on Pontoon B, berth 14, 'up to 10 metres') is only detected after the whole boat form is filled, ending the booking.
- Impact: A newcomer who misjudges which berth fits may fill in the boat details and then lose the booking, with no prompt to pick a larger berth.
- Evidence: E1, reproduced or measured · probes/13/, probes/15/, evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/default/375-light.yml, probes/33/ · detected by 3 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 3
- Recommendation (advisory): Ask the boat's length before listing berths, or flag berths too short for it.
- Status: open

#### F-0029 · 'Length' field does not say which length or which unit
- Problem type: single location · Criteria: H2 (primary), H5, H4 · Where: /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14
- What happens: Skippers know two lengths: length overall (LOA, including bowsprit) and hull length, and may think in feet. The field is labelled only 'Length', with no unit and no hint (unlike 'Draught in metres'). Entering the 9.6 m hull length for a boat 10.4 m overall on Pontoon B, berth 14 ('up to 10 metres') is accepted and reaches review as 'Curlew, 9.6 metres long', with a total of £61.44.
- Impact: A skipper may enter the hull length and book a berth that is too short for the boat overall, discovered only on arrival.
- Evidence: E1, reproduced or measured · probes/19/, evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/default/375-light.yml, probes/15/, probes/3/screenshots/boat.png · detected by 3 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 1
- Recommendation (advisory): Label it 'Length overall (LOA) in metres, including bowsprit'.
- Status: open

#### F-0034 · Header and menu links leave the booking and clear what was entered
- Problem type: multiple locations · Criteria: H3 (primary), H6 · Where: /berths.html?date=2026-10-17&nights=2&arrive=15:00 and 3 more location(s)
- What happens: Reference links used mid-booking should not discard the booking. From the berth list, 'Tide times' goes to index.html#tides and the menu's 'Harbour rules' to index.html#harbour-rules, both without the booking's parameters; the home form comes back empty (date yyyy/mm/dd, 1 night, 'Choose a time'). 'Book a berth' and 'Saltmarsh Quay' likewise go to bare index.html on every step. There is no way back to the berth list from there.
- Impact: A newcomer who checks the tide or the rules mid-booking (the task the header invites) loses their place and must re-enter dates and choices.
- Evidence: E1, reproduced or measured · probes/24/, probes/32/, evidence/aria/review-html-date-2026-10-17-nights-2-arrive-15-00-berth-c3-b/default/375-light.yml, probes/verifier/v10/ · detected by 1 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 3
- Status: open

#### F-0038 · Arrival time outside the sill-gate window is accepted without warning
- Problem type: single location · Criteria: H5 (primary), ISO9241-110-1 · Where: /
- What happens: The page states the gate is open only about two hours either side of high water, so the system has what it needs to flag an arrival time when the gate is shut. Choosing 08:00 on Saturday 17 October (high water 02:08 and 14:32 UTC, so the gate is shut around 08:00) proceeds straight to the berth list with 'Arriving on Saturday 17 October 2026 at 08:00' and no notice; nothing later in the flow mentions the gate.
- Impact: A skipper who picks a time by habit rather than by the tide may arrive when the gate is shut and wait outside; the booking confirms the impossible time.
- Evidence: E1, reproduced or measured · probes/8/, probes/verifier/v06/, probes/verifier/v03/, probes/verifier/v09/ · detected by 1 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 3
- Recommendation (advisory): Indicate which arrival times fall inside the gate window for the chosen date, or warn when a time outside it is chosen.
- Status: open

#### F-0042 · Opening Tide times during a booking discards the booking details entered
- Problem type: multiple locations · Criteria: H3 (primary), H6 · Where: /berths.html?date=2026-10-17&nights=2&arrive=15:00 and 2 more location(s)
- What happens: Checking the tide is part of planning, so it should be possible mid-booking without losing work. The 'Tide times' item in the main navigation links to index.html#tides with no booking parameters. Clicked from the review page, it lands on the plan page with an empty date ('yyyy/mm/dd'), '1 night' and 'Choose a time'; berth, boat details and stay are no longer carried. The same nav is on the berths, boat and review pages.
- Impact: Skippers who check the tide after starting (the core task 3) lose their booking and must re-enter every field on a phone, often one-handed.
- Evidence: E1, reproduced or measured · probes/23/, probes/29/, evidence/aria/boat-html-date-2026-10-17-nights-2-arrive-15-00-berth-b14/default/375-light.yml, probes/verifier/v10/ · detected by 1 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 3
- Status: open

#### F-0043 · Tide table is fixed to 17-23 October and does not follow the chosen arrival date
- Problem type: single location · Criteria: H1 (primary), ISO9241-110-1 · Where: /
- What happens: To check the gate window for their own arrival day, skippers need the tide for that day. The table always lists Sat 17 Oct to Fri 23 Oct. After entering 10 November 2026 as the arrival date, the table still shows the same seven rows and no message says tides for that date are unavailable.
- Impact: For any arrival outside that week the skipper cannot plan the entry time from this site and must find tide data elsewhere, without being told so.
- Evidence: E1, reproduced or measured · probes/29/, probes/verifier/v18/ · detected by 1 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 3
- Status: open

#### F-0049 · Header links 'Book a berth' and 'Tide times' discard the dates entered so far
- Problem type: multiple locations · Criteria: H3 (primary), H6 · Where: /berths.html?date=2026-10-17&nights=2&arrive=15:00 and 3 more location(s)
- What happens: The header shows 'Book a berth' and 'Tide times' on every booking step, and checking tides mid-booking is a declared task. From the berth list, following 'Tide times' or 'Book a berth' returns to / with an empty date, '1 night' and 'Choose a time'; the entered date, nights and time are gone, and no warning is shown.
- Impact: A skipper who checks tide times while choosing a berth must re-enter everything; with patchy data and one hand busy, re-entry is costly.
- Evidence: E1, reproduced or measured · probes/30/, evidence/aria/review-html-date-2026-10-17-nights-2-arrive-15-00-berth-c3-b/default/375-light.yml, probes/verifier/v10/, probes/verifier/v11/ · detected by 1 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 3
- Status: open

#### F-0057 · Tide times exist only for 17-23 October, whatever arrival date is chosen
- Problem type: missing element · Criteria: 9241-110 suitability for the task (primary), H1
- What happens: Top task 3 is to check tide times and the gate window for an arrival day. The only tide information is a fixed seven-row table for Sat 17 Oct to Fri 23 Oct. The date field accepts any date (probes/4 accepted 2025-01-01), and the berth list and review show no tide or gate information for the chosen date.
- Impact: A skipper planning any other day may have no way to check when the gate opens before choosing an arrival time.
- Evidence: E1, reproduced or measured · evidence/aria/root/default/375-light.yml, probes/4/, probes/verifier/v18/, probes/verifier/v04/ · detected by 1 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 3
- Recommendation (advisory): Show high water and the gate window for the chosen arrival date.
- Status: open

#### F-0063 · Tide times shown in UTC while the arrival times are local
- Problem type: single location · Criteria: H2 (primary), DES-brandfit · Where: /
- What happens: The caption reads 'High water at the quay, times in UTC', but the product's formats specify 24-hour local times and the arrival time chosen on the same page (15:00) is presented as local. In October (BST) the table is an hour off what the skipper will choose.
- Impact: A skipper planning arrival around the sill-gate window may be an hour out, which could mean arriving when the gate is shut.
- Evidence: E1, reproduced or measured · probes/verifier/v11/ · detected by 1 of 10 pass(es)
- Severity 3 (spread 0; 3, 3, 3) · Priority P1 · Ease of fix 2
- Recommendation (advisory): Show tide times in the same local time as the arrival-time choice, and say which.
- Status: open

#### F-0033 · Review page offers no way to change any booking detail
- Problem type: missing element · Criteria: H3 (primary), H7 · Where: /review.html?date=2026-10-17&nights=2&arrive=15:00&berth=C3&boat=Curlew&loa=10.4&draught=1.5&mmsi=123456789 and 1 more location(s)
- What happens: A review step should let the user correct what they review. 'Check your mooring booking' lists Arrival, Nights, Berth, Boat and Total, but none has a change link and there is no back link; the only controls in main are the two contact fields and 'Confirm booking'.
- Impact: A skipper who spots a wrong date, berth or length at review may have to start again from the home page, or confirm a wrong booking.
- Evidence: E1, reproduced or measured · evidence/aria/review-html-date-2026-10-17-nights-2-arrive-15-00-berth-c3-b/default/375-light.yml, probes/21/, probes/23/, probes/verifier/v03/ · detected by 2 of 10 pass(es)
- Severity 2.67 (spread 1; 2, 3, 3) · Priority P1 · Ease of fix 3
- Recommendation (advisory): Add a change link per summary row.
- Status: open

#### F-0050 · Boat details and review pages offer no way back or to change earlier answers
- Problem type: missing element · Criteria: H3 (primary) · Where: /boat.html?date=2026-10-17&nights=2&arrive=15:00&berth=B14 and 1 more location(s)
- What happens: Once past the berth list, a skipper who wants to change the berth or boat details has nothing in the page to do it: the boat page has only the four fields and Continue, and the review page lists Arrival, Nights, Berth and Boat with no change links and no back link.
- Impact: A skipper who spots a mistake on the review page (wrong berth, wrong length) may have to restart from the header, losing all entries.
- Evidence: E1, reproduced or measured · inventory.json, evidence/aria/review-html-date-2026-10-17-nights-2-arrive-15-00-berth-c3-b/default/375-light.yml, probes/verifier/v16/, probes/verifier/v03/ · detected by 1 of 10 pass(es)
- Severity 2.67 (spread 1; 2, 3, 3) · Priority P1 · Ease of fix 3
- Status: open

### P2

| ID | Title | Criterion | Evidence | Severity | Ease of fix | Status |
|---|---|---|---|---|---|---|
| F-0010 | Change dates is reachable only through an unlabelled 'More options' icon button | H6 | E1 | 2.33 (spread 1; 2, 2, 3) | 2 | open |
| F-0017 | Arrival date outside the bookable season or in the past is accepted | H5 | E1 | 2.33 (spread 1; 3, 2, 2) | 2 | open |
| F-0025 | Arrival date accepts dates in the past | H5 | E1 | 2.33 (spread 1; 3, 2, 2) | 2 | open |
| F-0032 | The only way to change dates is inside an unlabelled '…' menu | H3 | E1 | 2.33 (spread 1; 2, 2, 3) | 2 | open |
| F-0065 | Unlabelled '...' button hides 'Change dates' and floats detached on the berth list | DES-hierarchy | E1 | 2.33 (spread 1; 2, 2, 3) | 2 | open |
| F-0073 | Overflow '...' button stranded at the far right of the berth step, hiding 'Change dates' | DES-hierarchy | E1 | 2.33 (spread 1; 2, 2, 3) | 2 | open |
| F-0082 | 'Change dates' is hidden behind an isolated kebab button that becomes the second thing se… | DES-hierarchy | E1 | 2.33 (spread 1; 2, 2, 3) | 2 | open |
| F-0011 | Boat details step does not restate the chosen berth or its length limit | H6 | E1 | 2 (spread 0; 2, 2, 2) | 2 | open |
| F-0035 | The thing being booked is called a visitor berth, a pontoon space and a mooring | H4 | E1 | 2 (spread 0; 2, 2, 2) | 2 | open |
| F-0037 | Confirmation page omits the arrival time | H6 | E1 | 2 (spread 0; 2, 2, 2) | 2 | open |
| F-0045 | No indication of the current step or how many steps remain in the booking | H1 | E1 | 2 (spread 0; 2, 2, 2) | 2 | open |
| F-0046 | Confirmation omits the arrival time the booking was made for | H6 | E1 | 2 (spread 0; 2, 2, 2) | 2 | open |
| F-0052 | Length error rejects '34 ft' without saying metres are required | H9 | E1 | 2 (spread 0; 2, 2, 2) | 1 | open |
| F-0054 | Confirmation omits the arrival time the skipper chose | H6 | E1 | 2 (spread 0; 2, 2, 2) | 2 | open |
| F-0058 | The booking flow shows no indication of steps or progress | H1 | E1 | 2 (spread 0; 2, 2, 2) | 2 | open |
| F-0066 | The place noun drifts between headings | DES-coherence | E1 | 2 (spread 0; 2, 2, 2) | 2 | open |

### P3

| ID | Title | Criterion | Evidence | Severity | Ease of fix | Status |
|---|---|---|---|---|---|---|
| F-0014 | Error-summary link for the berth choice points at the fieldset, not at a radio button | A11Y-13 | E1 | 1.33 (spread 1; 1, 2, 1) | 2 | open |
| F-0015 | Invalid-state border is styled for text inputs only, not for the arrival-time select or t… | CMP-01 | E1 | 1.33 (spread 1; 1, 1, 2) | 2 | open |
| F-0016 | Chosen berth card has no selected style beyond the native radio dot | CMP-01 | E1 | 1.33 (spread 1; 1, 1, 2) | 2 | open |
| F-0031 | MMSI field accepts numbers of the wrong length | H5 | E1 | 1.33 (spread 1; 2, 1, 1) | 1 | open |
| F-0053 | A 5-digit MMSI is accepted without comment | H5 | E1 | 1.33 (spread 1; 2, 1, 1) | 1 | open |
| F-0064 | Error borders applied inconsistently across error states | DES-coherence | E1 | 1.33 (spread 1; 1, 1, 2) | 1 | open |
| F-0075 | Invalid-field styling inconsistent across error states | DES-coherence | E1 | 1.33 (spread 1; 1, 1, 2) | 1 | open |
| F-0083 | Errored fields are marked inconsistently: some keep the default border | DES-coherence | E1 | 1.33 (spread 1; 1, 1, 2) | 1 | open |
| F-0085 | List heading 'Pontoon spaces free on these dates' also covers the wall berth | H2 | E1 | 1.33 (spread 1; 1, 1, 2) | 1 | open |
| F-0001 | Compared number without tabular figures: "Sat 17 Oct" | TYP-14 | E1 | rule: 1 | 1 | open |
| F-0002 | One word on the last line: "Keep to 4 knots inside the harbour walls" | TYP-15 | E1 | rule: 1 | 1 | open |
| F-0003 | One word on the last line: "Choose a pontoon space" | TYP-15 | E1 | rule: 1 | 1 | open |
| F-0004 | One word on the last line: "The depth of water your boat needs to fl" | TYP-15 | E1 | rule: 1 | 1 | open |
| F-0005 | One word on the last line: "Saturday 17 October 2026 at 15:00" | TYP-15 | E1 | rule: 1 | 1 | open |
| F-0055 | Single words stranded on the last line at narrow widths | TYP-15 | E1 | 1 (spread 0; 1, 1, 1) | 1 | open |
| F-0056 | Tide table, the one product-specific element, is set as an unstyled default table with mi… | DES-execution | E1 | 1 (spread 0; 1, 1, 1) | 2 | open |
| F-0061 | Footer band stops short on short pages, leaving bare ground below | DES-execution | E1 | 1 (spread 0; 1, 1, 1) | 2 | open |
| F-0062 | Tide-table column headers misaligned with their figures | DES-execution | E1 | 1 (spread 0; 1, 1, 1) | 1 | open |
| F-0074 | Tide table column headings misaligned with right-aligned times | DES-execution | E1 | 1 (spread 0; 1, 1, 1) | 1 | open |

### Not yet rated

Confirmed judged findings without a severity rating. They need blind raters (`uie packet --role severity-rater`, then `uie findings rate`) before they can be prioritised.

| ID | Title | Criterion | Evidence | Found by | Status |
|---|---|---|---|---|---|
| F-0047 | No way to reuse boat details when booking again | H7 | E0 | heuristic-evaluator | disputed |
| F-0059 | No signature or identity layer: a sterile default frame carries the product | SLP-64 | E0 | design-critic | disputed |
| F-0070 | No visual identity: the harbour's world appears only in the copy, on a category-default f… | DES-specificity | E0 | design-critic | disputed |
| F-0078 | Content hugs the left of the container at wide widths, leaving the right half empty | DES-appeal | E0 | design-critic | disputed |
| F-0080 | No identity layer of the harbour's own: the visual frame is a swappable default booking f… | DES-specificity | E0 | design-critic | disputed |

## 5. Divergent and disputed findings: questions for user research

The raters produced no divergent severities. These remain open:

- **Visual identity (F-0059, F-0070, F-0080, F-0078; disputed).** All three critics judged the design generic and plain, with no identity layer of the harbour's own. Is a plain, utility look intended for this harbour? DESIGN.md does not exist, so the critics could not judge brand fit.
- **Rebooking for returning skippers (F-0047; disputed).** Is "same berth and boat as last time" in scope for launch?
- **For the first usability round:** do first-time skippers actually read "Boats up to 10 m" as LOA? Would they read the tide table as local time? These are predictions; a 5-skipper formative test settles them.

| ID | Title | Ratings and validity votes | Status |
|---|---|---|---|
| F-0047 | No way to reuse boat details when booking again | — | disputed |
| F-0059 | No signature or identity layer: a sterile default frame carries the product | — | disputed |
| F-0070 | No visual identity: the harbour's world appears only in the copy, on a category-default f… | — | disputed |
| F-0078 | Content hugs the left of the container at wide widths, leaving the right half empty | — | disputed |
| F-0080 | No identity layer of the harbour's own: the visual frame is a swappable default booking f… | — | disputed |

Divergent findings are never settled by a vote (ADR-018). The study workflow turns them into tasks and measures.

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | not_run | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | not_run | — |
| 1.3.2 | A | Meaningful sequence | needs-human | not_run | — |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | not_run | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | not_run | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | pass | — |
| 1.4.4 | AA | Resize text | scripted | pass | — |
| 1.4.5 | AA | Images of text | agent-judged | not_run | — |
| 1.4.10 | AA | Reflow | scripted | pass | — |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | pass | — |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_run | — |
| 2.1.1 | A | Keyboard | scripted | pass | — |
| 2.1.2 | A | No keyboard trap | scripted | pass | — |
| 2.1.4 | A | Character key shortcuts | agent-judged | not_run | — |
| 2.2.1 | A | Timing adjustable | agent-judged | not_run | — |
| 2.2.2 | A | Pause, stop, hide | agent-judged | not_run | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | agent-judged | not_run | — |
| 2.4.3 | A | Focus order | scripted | pass | — |
| 2.4.4 | A | Link purpose in context | agent-judged | not_run | — |
| 2.4.5 | AA | Multiple ways | agent-judged | not_run | — |
| 2.4.6 | AA | Headings and labels | agent-judged | not_run | — |
| 2.4.7 | AA | Focus visible | scripted | pass | — |
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
| 3.3.1 | A | Error identification | scripted | fail | F-0006, F-0017 |
| 3.3.2 | A | Labels or instructions | agent-judged | fail | F-0007, F-0008 |
| 3.3.3 | AA | Error suggestion | agent-judged | fail | F-0006, F-0013 |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | not_run | — |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_run | — |
| 4.1.2 | A | Name, role, value | agent-judged | not_run | — |
| 4.1.3 | AA | Status messages | scripted | pass | — |

Totals by coverage: auto 1 · scripted 22 · agent-judged 23 · needs-human 9; by state: pass 22 · fail 3 · not_run 30. This matrix is not a conformance claim (QUALITY-BAR §8).

## 7. Not assessed

- A11Y-06 Modal dialogs: focus moves in, Tab wraps inside, Esc closes, focus returns to the invoker; correct dialog semantics: not_applicable — no modal dialog in scope (dialogs check found none to exercise)
- I18N-01 Explicit CJK font stack: not_applicable — no CJK locale or CJK text in scope
- I18N-02 Regional families: not_applicable — no CJK locale or CJK text in scope
- DEC-03 Direction record for new work or redesigns: not_applicable — no new direction in scope (project.work = existing)
- DEC-04 Ledger variety for new work: not_applicable — no new direction in scope
- USE-04 Blind severity: not_run — 5 confirmed finding(s) not rated
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
- Page titles (2.4.2) — not present in the packet artefacts. (a11y)
- Real screen-reader announcements — simulated only through ARIA snapshots. (a11y)
- Census-based drift ranking: census.json in the packet was empty, so drift was checked by reading styles.css rather than from computed-style counts. (code)
- uie lint output: lint.json in the packet was empty; no static tool findings to cross-check. (code)
- Behaviour of the browser Back button mid-flow (whether entered values survive): the probe has no back action and Alt+ArrowLeft did not navigate (probes/13 steps 10-12 stayed on boat.html). (he-1)
- Whether a confirmation text or email is sent after booking: no external channel observable; the confirmation page does not mention one. (he-1)
- Behaviour under weak mobile data (slow or failed submit): the probe cannot throttle the network here, so loading and failure feedback on Check berths, Continue and Confirm booking were not assessed. (he-1)
- Whether arrival-time options are meant as local time: the Arrival time select states no time zone; the context says local times, so F1 assumes that. (he-1)
- Browser Back from the 'Booking stopped' state: the probe's Alt+ArrowLeft did not navigate (probes/20, URL unchanged), so whether Back returns to a filled form could not be confirmed with the driver. (he-2)
- Whether the booking persists server-side (e.g. retrievable by reference SQ-1017-C3): no lookup function exists in the UI to re-read it; not probed beyond the confirmation page. (he-2)
- Behaviour on weak connectivity (slow submit, double submit feedback): network throttling was not available in the probe; transitions completed in under 60 ms locally, so no loading state could be observed. (he-2)
- Whether VoiceOver/TalkBack announce the error summary on submit: ARIA shows role=alert and the route recipe expects it focused, but no real screen reader was run. (he-3)
- Reflow and legibility at 200% zoom / large text: not emulated by the probe tool beyond viewport widths; left to the measured audit. (he-3)
- Browser Back button behaviour mid-flow: the probe has no history-back action. (he-3)
- Behaviour on slow or dropped mobile data (no loading states observed because every step answered in under 60 ms locally). (he-3)
- Whether a confirmed booking persists or is sent to the harbour office: no observable record after confirmation. (he-3)
- Brand fit (DES-04): DESIGN.md missing, no attributes declared. (critic-3)
- Dark theme: not captured; context mentions night use, so its absence is a gap in the matrix rather than a judgement. (critic-3)
- Focus, selected-card, hover and menu behaviour cannot be judged from stills. (critic-3)

## 8. Fixes and verification

No fixes were made against this run yet.

## 9. Next steps

1. Fix queue: F-0006, F-0007, F-0008, F-0009, F-0012, F-0013 (`fix` workflow, one finding per commit).
2. For L1: A11Y-13 (1 finding(s)); A11Y-27 (5 confirmed judged WCAG failure(s)); CMP-01 (2 finding(s)); DEC-02 (DESIGN.md is missing).
3. For L2: USE-04 (5 confirmed finding(s) not rated); USE-05 (6 open P0 finding(s)); USE-06 (19 P1 finding(s) without a recorded decision); DES-02 (0/3 critics judged it specific); DES-03 (3 agreed severe design finding(s) open) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (25 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. Plan a study for 5 divergent or disputed finding(s) (`study` workflow).
6. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

