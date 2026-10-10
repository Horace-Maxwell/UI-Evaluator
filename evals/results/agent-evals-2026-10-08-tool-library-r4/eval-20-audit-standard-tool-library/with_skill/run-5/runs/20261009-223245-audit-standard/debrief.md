# Debrief: reservation flow audit (standard depth, iteration 1)

Scope: the five surfaces of the reservation flow (find, tool, basket, confirm, done) at 320 to 1440 px, light and dark, plus reduced motion, forced colours and more-contrast evidence. Inspection: deterministic checks, 3 heuristic evaluators, 1 walkthrough of the critical journey at 375 px, 3 design critics, an accessibility auditor, a code reviewer, 4 verifier passes and 3 blind severity raters. All evaluator evidence is analytical (E0 to E1); none of it is real-user evidence.

Housekeeping: several confirmed findings in the register describe one cause from different angles and were not caught by the merge proposals (for example F-0014, F-0047, F-0057, F-0115, F-0139 and F-0149 all describe tool names truncated to one line). They are grouped by cause below; fix by cause, not by ID.

## 1. What the passes agree on

These causes were reported by two or more independent roles and reproduced by the verifier:

- **"Reserve this tool" only adds to a basket** (F-0054; walkthrough, heuristic evaluators). The "Added to your basket" message disappears after a few seconds and offers no link onward, so a first-time member may leave believing the tool is reserved. Located at app.js:271.
- **No pending state on Continue and Confirm reservation** (F-0037, merged with F-0060, F-0067, F-0087, F-0105; code reviewer, heuristic evaluators, walkthrough). Nothing changes on screen for about 1.2 s and 1.5 s after the tap. The code reviewer and verifier reproduced the consequence: pressing Confirm twice created two reservations, FT-4471 and FT-4472 (F-0036).
- **Pick-up day and pick-up session are two unreconciled choices** (F-0031, F-0041, F-0055, F-0064; walkthrough, heuristic evaluators, accessibility auditor, code reviewer). The basket asks for the session again without preselecting the day already chosen. After a change the confirm summary shows two different collection dates.
- **The calendar accepts days the tool cannot be collected** (F-0062, F-0141, F-0142, F-0143). Reproduced end to end: a pressure washer picked for Saturday 10 October, before its "Available from Sat 17 Oct" date, reached "Reservation confirmed". A closed Monday is rejected only after Confirm, with no link back to change the day. Located at app.js:198.
- **Basket sessions are drawn in reverse** (F-0027, merged with F-0044, F-0056, F-0075, F-0099; F-0135). The screen shows 28 October first while focus and screen-reader order run from 10 October, so arrow keys move "backwards" (WCAG 1.3.2). Cause: `flex-direction: row-reverse; flex-wrap: wrap-reverse` at styles.css:818–819.
- **On phones, search and filters come after all ten tools** (F-0024 merged with F-0058, F-0069; also F-0140, F-0148, F-0043). On a 375 px phone the search field is below the tenth card; on desktop the focus order jumps from the last card back to the search field. Located at index.html:36.
- **Tool names are cut to one line**, so both cordless drills read "Cordless drill 18 V, co…" at 375 px (F-0014, F-0047, F-0057, F-0115, F-0139, F-0149; detectors, walkthrough, critics). The same rule makes names clip at 200 % text size and under text-spacing overrides (F-0009, F-0010). Cause: `white-space: nowrap; text-overflow: ellipsis` at styles.css:377.
- **"Basket (1)" still shows after the reservation is confirmed** (F-0061, F-0112, F-0125; walkthrough, heuristic evaluator, critics).
- **A search with no matches keeps showing the full list** (F-0033, F-0068, F-0130). Seen in the no-results capture and reproduced by probe.
- **The fixed "Reserve this tool" bar covers content on phones** (F-0008 merged with F-0025, F-0059; F-0045 merged with F-0078). Keyboard focus on calendar days and on "One week" is hidden behind it (WCAG 2.4.11), the "Two weeks" option opens underneath it, and it sits closer than 8 px to the calendar.

## 2. Detector-only findings

- **Dark mode: "Available from" badges are 3.07:1** (F-0001, F-0002; axe and the contrast check, dark theme). Needs 4.5:1. The code reviewer traced it to the dark `--color-ok: #2f7d4a` at styles.css:60 drifting from the declared token, with the badge losing its chip background in dark only (F-0042, F-0132). Visible in `evidence/screens/items-ladder-3m/default/375-dark.png`: available badges are dim green text on the card with no chip; unavailable ones keep a chip.
- **The find page does not reflow at 320 px** (F-0012, F-0013, F-0032). Cause: `minmax(330px, 1fr)` at styles.css:331.
- **"Reserve this tool" text overlaps at 200 % text size and under text spacing** (F-0011, merged with F-0015, F-0016).
- Body text closer than 16 px to the viewport edge at 320 px (F-0019); cramped badge padding (F-0022).

## 3. Judge-only findings

- **An expired basket hold cannot be recovered** (F-0039, P0; F-0038; code reviewer, reproduced by the verifier after waiting about ten minutes). Continue shows only "Something went wrong. Try again.", every retry fails the same way and a reload does not clear it. The basket also never says how long it holds tools (F-0074). This matters for members who reserve "a few minutes at a time, while doing something else".
- **Loan-length list traps keyboard focus** (F-0034, F-0145; accessibility auditor, code reviewer; WCAG 2.1.2). Tab is captured to move between the two options (app.js:241), so a keyboard user cannot leave the list without choosing; this is why the header links read "not reachable" in the loan-open state (F-0026, detector, same cause). Esc does not close it either (F-0144).
- Done page shows reservation number FT-4471 when no reservation exists (F-0050); unknown tool id silently opens the first tool (F-0052); the three-tools limit is not enforced (F-0051).
- Missing-day error is not announced to screen readers (F-0046). Membership and mobile formats such as "01234" or "+44 7700 900123" are rejected without normalising (F-0049), and the messages read as if the field were empty (F-0103).
- Session dots vanish under forced colours at 320 px (F-0029, seen under browser emulation only). Card headings sit at the same level as their section heading (F-0030, F-0048).
- Design panel: all three critics judged the design `generic` and its appeal `plain` (same wrench placeholder on every card, identity only the name in body text, browser-default filter controls). These are P2/P3 and secondary to the flow problems above.

## 4. Detector false positives and artefacts

- Full-page captures draw the fixed action bar mid-page. Two critic findings built on them (F-0109, F-0119) were rejected by the verifier; the real overlap was confirmed from viewport probes instead (F-0045).
- The "yyyy/mm/dd" format in the filter date field comes from the test browser's locale, not the app.
- Advisory observations (APCA "weak" contrast that passes WCAG, one-word last lines) were kept apart and not counted.
- The design critics unsealed detector output while the deterministic audit was still running, so they saw 0 detector hits. Their verdicts were written blind as required; the cross-check against detectors did not happen.

## 5. Strengths to preserve

Each seen at 375 px, the width members mostly use:

- Error summaries on basket and confirm take focus, link to each field, give an example format and keep what was typed, in dark mode too (`evidence/screens/confirm-html-items-drill-18v-two-day-2026-10-17-slot-sat-202/errors/375-dark.png`).
- The confirm page says "Nothing is paid online" and states the deposit before committing (same capture).
- The done page says where to go, what to bring and what to do if the session is missed (`evidence/screens/done-html-items-drill-18v-two-day-2026-10-17-slot-sat-2026-1/default/375-light.png`).
- Calendar day buttons announce full dates and "open" for session days and echo the chosen day in words (tool/day-chosen ARIA snapshot).
- A single visible focus ring with light and dark values; reduced motion removes the only two transitions.

## 6. Divergent findings

None. The three raters did not diverge on any finding (spread below 2 everywhere). Questions to settle with members, not by vote: whether first-time members read "Added to your basket" as a finished reservation, and how long members actually leave the flow open in the evening (which decides how much the hold expiry bites).

## 7. Fix ideas (after evaluation)

Ordered by what blocks the critical task first:

1. Make reservation state honest: after "Reserve this tool", show a persistent message with a "Go to basket" link; state the ten-minute hold; on expiry, explain and offer to restart instead of a generic error (app.js:94, app.js:271).
2. Disable Confirm and Continue while pending, show progress, and ignore repeat presses (app.js:413).
3. One pick-up decision: offer only open session days the tool is available on, and carry the chosen day into the basket as the preselected session (app.js:198, app.js:265–267).
4. Remove the reversed session layout (styles.css:818–819).
5. Fix the loan-length list keyboard handling: Tab should leave, Esc should close (app.js:238–251).
6. Dark mode: restore the declared dark success token and the chip background on available badges (styles.css:60–61).
7. Phone layout: move search above the results in the DOM (index.html:36), let names wrap (styles.css:377), drop the 330 px column minimum (styles.css:331), add bottom padding for the fixed bar (styles.css:758).
