# Debrief: audit-standard, 2026-10-09

Depth: standard (3 heuristic evaluators, 1 walkthrough evaluator covering `reserve-tool-for-saturday`, 3 design critics, accessibility auditor, code reviewer, 4 verifier runs, 3 blind raters). All roles ran as isolated subagents. Iteration 1, so no confidence ceiling applies.

Scope as frozen by the run: five routes (find, tool, basket, confirm, done) × 6 widths (320–1440) × light and dark, plus reduced motion, forced colours and more-contrast evidence. Both journeys replayed successfully end to end with the scripted, correct sequence (18/18 and 7/7 steps), so every finding below is about how hard the flow is for a member, not about a broken script.

## 1. What the passes agree on

These were found independently by three or more passes and were reproduced by a verifier:

- **The basket hold is invisible and its expiry is a dead end.** The basket only says "Items are held for you while you finish"; no duration, warning or way to extend appears. After about ten minutes (reproduced at 10.3 min, probe 86) Continue fails with "Something went wrong. Try again." and retrying gives the same error. Members planning a job in the evening "a few minutes at a time" (PRODUCT.md) are the people most likely to hit this. (F-0040, F-0041; code reviewer and all three heuristic evaluators.)
- **Collection time is asked twice and the two answers can disagree.** The tool page asks for a pick-up day; the basket then asks for a pick-up session without pre-selecting it, lists sessions latest date first, and accepts a session that contradicts the day, so the confirm page shows two different dates. (F-0034, F-0061, F-0028/F-0144; five sources.)
- **The calendar accepts days the member cannot collect on**: days the library is closed (rejected only at the last step, F-0042/F-0137, with no way to change the day from that error, F-0043) and days before the tool is available, which goes through to "Reservation confirmed" (F-0138).
- **"Reserve this tool" does not reserve.** It adds to a basket with a toast that disappears in about five seconds; nothing says the reservation is unfinished, and the walkthrough persona would stop here believing they had reserved (CW step 7, `would_not`). (F-0053, F-0063.)
- **On phones, tool names are cut to one line**, so "Cordless drill 18 V, combi, two batteries" and the one-battery drill both read "Cordless drill 18 V, co…" (F-0044, F-0030, F-0102, F-0124; detectors also measured clipping at 200 % text and under text-spacing, F-0009/F-0010/F-0014).
- **On phones, search and filters come after the whole catalogue** (F-0054, F-0069, F-0103, F-0125), and above 480 px the search is shown first but focused after all results (F-0024).
- **Searching for something the library does not have shows the full list with no message** (F-0037, F-0109).
- **After confirming, the header still says "Basket (1)"** and the basket still holds the reserved tool (F-0059).

## 2. Detector-only findings

- Dark mode: the "Available from …" badge text measured 3.07:1 (#2f7d4a on #1d2622), below 4.5:1 (axe and the contrast check, F-0001/F-0002). The code reviewer traced it to dark-theme success tokens that differ from DESIGN.md (F-0049). Several critics also saw that in dark mode the unavailable chips look stronger than the available ones (F-0107/F-0128).
- Reflow: at 320 px the results grid overflows by 26 px (F-0012/F-0013), caused by a 330 px column minimum (F-0045).
- At 200 % text and with text-spacing overrides, the "Reserve this tool" bar text overlaps (F-0011/F-0015/F-0016).
- Keyboard: with the loan-length list open, a full Tab walk never leaves the list (F-0026), the mechanism the accessibility auditor and evaluators described as a Tab trap with no Escape (F-0036, F-0131).
- The fixed Reserve bar hides the focused loan option on phones (F-0025) and the footer's desk phone number (F-0135).
- Touch targets: a calendar day sits closer than 8 px to "Reserve this tool" (F-0008).

## 3. Judge-only findings

- Repeated presses of Confirm allocate extra reservation numbers (F-0039), and Continue/Confirm give no visible response for about a second (F-0038, F-0064).
- Membership and phone fields reject common valid formats (lower-case "ft-", "+44"), and format errors repeat the "Enter your…" empty-field message (F-0050).
- The three-tool limit stated on the find page is not enforced (F-0052).
- Using Change on the confirm page clears the session and the details already typed (F-0065, F-0066).
- Under forced colours at 320 px, the dots that mark session days disappear (F-0031).
- Design panel (3 critics, independent): all three judged the design **generic** in specificity and **plain** in appeal. Every tool card shows the same wrench tile (F-0101/F-0122), and the identity is the name in bold body text (F-0111/F-0123). Each critic found brand fit 1 of 3 attributes fully met ("practical, not corporate").

## 4. Detector false positives and rejected candidates

- No detector false positives were confirmed. The 54 advisory observations (APCA "weak but passes WCAG", one word on the last line) are listed apart and are not findings.
- Rejected: F-0051 (done page with no stored reservation shows a made-up FT-4471, out of declared scope, but it does reproduce: worth adding the state), F-0136 (calendar row hidden when focused: did not reproduce at 375×812), F-0140 (yyyy/mm/dd in the native date field comes from the capture machine's locale).
- Several judged findings are near-duplicates that the merge key did not join because their anchors differ (for example F-0101/F-0122, F-0102/F-0124/F-0030/F-0044, F-0054/F-0069/F-0103/F-0125, F-0105/F-0127, F-0107/F-0128, F-0111/F-0123, F-0112/F-0130, F-0139/F-0142, F-0037/F-0109, F-0038/F-0064, F-0110/F-0146). The report counts them separately; treat each group as one problem when planning work.

## 5. Strengths to preserve

Each was seen at a phone width or in a state the audit ran:

- Error summaries on basket and confirm take focus, are announced as alerts, link to each field and keep what was typed (basket/errors and confirm/errors states, 375 px light; probes 26, 40, 41).
- The done page says plainly what to bring, where to go and what to do if the session is missed (done/default/375-light.png).
- Deposit and "nothing is paid online" are shown where decisions are made (find cards and confirm page, 375 px).
- Reserving without a day gives a specific message next to the calendar, and a double press on Reserve does not add the tool twice (probes 3 and 17).
- Calendar days have full spoken names with session status and a pressed state (tool/day-chosen ARIA snapshot).
- Copy is in the members' own words and matches the library's facts (all three critics; brand attribute "practical, not corporate" met).

## 6. Divergent findings, as questions for user research

The raters did not diverge on any finding (spread < 2 everywhere). Open questions for members and the desk:

- Does the green/grey colour of availability badges mean anything the date does not (verifier needs_human on F-0029)?
- Do members on phones mostly scroll the ten cards or search? This decides how much the search placement matters (one rater lowered it for that reason).
- Do members understand "pick-up day" and "pick-up session" as the same thing?

## 7. Fix ideas (after evaluation)

1. Make the hold visible and recoverable: state "held for ten minutes", warn before it ends, let the member extend, and on expiry re-hold or explain plainly with a way forward (WCAG 2.2.1).
2. Ask for collection once: let the calendar offer only session days on or after the tool's "available from" date, and carry that choice into the basket as the selected session, listed earliest first.
3. Fix the loan-length list's keyboard handling (Escape closes, Tab leaves) and give it the accessible name "Loan length".
4. Dark-theme success tokens: use the DESIGN.md values so badge text reaches at least 4.5:1.
5. Let tool names wrap to two lines; fix the 330 px grid minimum.
6. Add page padding under the fixed Reserve bar equal to its height, and `scroll-padding-bottom`.
7. Rename "Reserve this tool" to say what it does, or follow it with a clear "Go to basket to finish" step.
8. Disable Confirm while submitting; clear the basket after confirmation; add a no-results message.
