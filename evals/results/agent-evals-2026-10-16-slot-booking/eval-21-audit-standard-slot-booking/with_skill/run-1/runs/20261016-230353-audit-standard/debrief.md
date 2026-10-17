# Debrief: Dunmore recycling centre booking, standard audit (run 20261016-230353-audit-standard)

Depth: standard. Roles: 3 heuristic evaluators (novice, expert, accessibility-minded), 2 walkthrough evaluators (book-a-slot, change-slot), 3 design critics, 1 accessibility auditor, 1 code reviewer (review and locate), 4 verifier passes, 3 blind severity raters. All ran as isolated subagents. Two heuristic evaluators (he-1, he-3) and the book-a-slot walkthrough (cw-1) could not run `uie probe` because their shell calls were denied, so their candidates came from captures only; every candidate they raised was then reproduced or rejected by a verifier that did probe. Both journeys complete in the replay (`uie journey`). Any-two agreement between heuristic passes is 31%; the estimate of total problems (≈ 22 from 20 found) is optimistic with three passes.

Lead edit to evaluator files: critic-1.json and critic-3.json stored `not_assessable` as a string, which the report renderer cannot read; the lead wrapped each string in a one-item list without changing its wording.

Same-problem groups the merge could not combine (the code reviewer anchored them at different columns, and re-merging would reset every verdict), so they were rated separately: F-0001/F-0036/F-0085 (Few left contrast); F-0043/F-0079/F-0104 (hold never stated); F-0045/F-0069 (permit field shown for a car); F-0034/F-0064 (permit checked only at the end); F-0047/F-0060 (Change slot resets the day); F-0054/F-0078 (no online change or cancel); F-0020/F-0017 (out-of-order slots and the focus order they cause). The report counts them separately; read each group as one problem.

Evidence levels: tool findings are measured (E1); judged findings were reproduced by a verifier with `uie probe` (E1). Nothing here has been observed with residents; wording below says "may" for effects on people.

## 1. What the passes agree on

- **"Few left" slots are pulled out of time order** (F-0020, with the keyboard consequence F-0017). Raised by he-1, he-2, he-3, cw-1, cw-2, the accessibility auditor, the code reviewer (inline `order:-1`, app.js:1 col 6099) and all three critics; the keyboard check measured focus jumping back from 08:00 to 08:20. At 375 px the grid shows 08:20, 08:40, 09:00 … 16:40 above "Morning", then 08:00, 09:20 … so the Morning and Afternoon lists are incomplete and the reading order differs from the visual order (1.3.2, 2.4.3).
- **A cancelled booking is still headed "Booked"** and still says to show the reference at the gate (F-0022). Raised by five sources.
- **The done page shows only the reference**, not the day, slot or vehicle (F-0023), which matters because the reference is read at the gate from the phone with poor signal.
- **The slot hold is enforced but never stated** (F-0043, F-0079, F-0104: one problem, reported three ways), and **the expiry error gives no way forward** (F-0025). Verifiers waited about 330 s on the real flow and reproduced the expiry.
- **The permit field shows for a car and before any vehicle is chosen** (F-0045, F-0069: one problem). The code reviewer traced it to `.field{display:flex}` overriding the `hidden` attribute (styles.css:1 col 2389).
- **Changing a slot returns to Today, not the chosen day** (F-0047, F-0060: one problem), so the resident may book the wrong day.

## 2. Detector-only findings

- No visible focus indicator on slot buttons (F-0016; script injects `.slot:focus{outline:0}`, app.js:1 col 5439). Measured at every width and both themes.
- Horizontal overflow / no reflow at 320 px on the slot page (F-0009; fixed slot-grid column widths at ≤ 360 px).
- "Few left" text contrast 3.0:1 light and 3.4:1 dark (F-0001; also reported as F-0036 by the code reviewer and F-0085 by a critic: one problem).
- Slot-count status not announced (F-0015, with F-0040 the code-level cause: aria-live is added only after the first update).
- Layout shift above 0.1 on the slot page when slots reload (F-0019).
- No progress during the 1.2 s vehicle operation (F-0018). Note: the field is already visible because of the CSS bug above, so this timer currently changes nothing on screen.

## 3. Judge-only findings

- **A second tap on "Book this slot" while it is booking records the booking as cancelled** (F-0030, P0). Found by the code reviewer, reproduced by a verifier with `uie probe`. On a slow phone connection a second tap is likely; the resident may then arrive with a cancelled booking.
- No pending state on "Book this slot" during the 1.5 s submission (F-0031), which invites that second tap.
- Permit format checked only at the final step, with no link to the field (F-0034, F-0064: one problem).
- No online way to change or cancel a booking; only a weekday phone line (F-0054, F-0078: one problem). Ease 4: needs a manage-booking route and a backend.
- Next is far below the chosen slot on a phone (F-0042); vehicle step does not repeat the chosen day and slot (F-0058); permit help hidden behind an icon-only (i) (F-0056); "Apply on the council site" without a link (F-0057); Waste row has no change link (F-0059); placeholder reference DR-000000 on a bare done page (F-0038); stale day caption while slots load (F-0103); 900 ms blank slot area with no indicator (F-0032).

## 4. Detector false positives and rejected candidates

- No detector false positives were found by the verifiers.
- Rejected judged candidates: Next with no slot "does nothing" (it shows "Choose a slot first."), step list marked only by bold (it has `aria-current="step"`), two day buttons looking selected (hover artefact in the capture), permit field revealed after 1.2 s (it is visible from load; see the CSS cause above).
- Advisory only, not counted: APCA weakness on muted hint text; stranded last words in several hints.

## 5. Strengths to preserve (seen at 375 px, the width residents use)

- Error summaries take focus and link to each field, with format examples ("Enter a UK mobile number, like 07700 900123"). Capture: `evidence/screens/confirm-…/errors/375-light.png`, probed by the accessibility auditor.
- Changing the slot or vehicle keeps vehicle, waste and typed details (probed by cw-2 and he-2 at 375 px).
- The confirm step's "Your booking" summary shows the slot as a range ("09:20 to 09:40") with Change links. Capture: `evidence/screens/confirm-…/default/375-dark.png`.
- Dark theme is complete and keeps the green identity; text, borders and buttons hold contrast except the "Few left" amber. Capture: `evidence/screens/root/date-chosen/375-dark.png`.
- Availability is in text ("Few left", "Full"), full slots are disabled, and status survives all colour-vision simulations and forced colours.
- Quick day buttons (Today, Tomorrow, Saturday 17, Sunday 18) match the "tomorrow or at the weekend" need.
- Field hints say why each detail is asked for; autocomplete tokens are set on name, mobile and postcode.

## 6. Divergent findings, as questions for user research

None diverged by the rating rule (spread < 2 everywhere). Open questions worth testing with residents:
- Do residents read the "Few left" block as "the best slots" or miss the earlier times? (Raters agreed on severity; behaviour is unknown.)
- How long do residents actually take on the confirm step on a phone? This decides how much the unstated 5-minute hold matters.
- The design panel judged the look plain and only partly specific to the service; whether residents care is a question for a desirability check, not a blocker.

Needs a human: IME composition on Enter (F-0039); a VoiceOver and TalkBack pass of both journeys; 200% zoom on a real phone; the 2.2.1 timing judgement for the hold.

## 7. Fix ideas (after evaluation)

1. Make the booking submission idempotent: disable "Book this slot" and show "Booking…" on first tap; never let a second tap cancel (F-0030, F-0031).
2. Remove the inline `order:-1` so slots stay in time order; keep the "Few left" tag on each slot (F-0020, F-0017).
3. Restore the focus ring on slots (delete the injected `.slot:focus{outline:0}`) and let the slot grid wrap at ≤ 360 px (F-0016, F-0009).
4. Darken the "Few left" amber in both themes to ≥ 4.5:1, from a DESIGN.md warning token (F-0001).
5. Done page: show day, slot, vehicle and the reference large; for a cancelled booking, change the heading and drop the gate instructions (F-0023, F-0022, F-0038).
6. State the hold ("We hold this slot for 5 minutes while you finish") on the slot and confirm steps, and make the expiry error link back to the slots for the same day (F-0043, F-0025).
7. Respect `hidden` on the permit field (`.field[hidden]{display:none}`), validate the permit on the vehicle step, and link to the permit application (F-0045, F-0034, F-0057).
8. "Change slot" opens on the booked day (F-0047).
9. Make the slot-count line a live region from page load (F-0015).

Because only the minified bundle exists, each fix is a patch to app.js or styles.css; the agency should ideally supply source.
