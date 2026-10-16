# Debrief: audit-standard, 20261016-125559

Depth standard (target L3, standard reaches at most L2). Six routes × widths 320–1440 × light and dark, plus reduced motion, forced colours and more contrast. Inspection: 3 heuristic evaluators, 1 walkthrough (book-a-slot at 375 px), 3 design critics, an accessibility auditor and a code reviewer, all isolated. Then 4 verifier runs and 3 blind raters. Both journeys replay successfully with the scripted correct actions.

## 1. What the passes agree on

- **The "Few left" slots are pulled out of time order.** On the When step, every slot with few places left is rendered in an unheaded block above "Morning" (CSS `order:-1`). The keyboard and screen-reader order still follows time. Found by the tools (focus order jumps back, F-0017), the accessibility auditor (F-0021), the code reviewer (F-0027), all three heuristic evaluators, the walkthrough and all three critics. The capture at 375 px dark shows ten such slots above "Morning" (evidence/screens/root/slot-chosen/375-dark.png). F-0017, F-0021 and F-0027 describe one cause.
- **A cancelled booking is still headed "Booked"** and still says "Show this at the gate". Raised by the auditor, the code reviewer, the heuristic evaluators and all three critics (F-0023, F-0031: one cause, done.html).
- **The done page leaves out the day, slot time and vehicle** (F-0048). Raised by the walkthrough, the heuristic evaluators and all three critics.
- **The 5-minute hold is never shown, and the expiry message has no next step** (F-0045, F-0078, F-0103 for the hold; F-0025, F-0104 for the expiry message). Raised by the walkthrough, the heuristic evaluators, the auditor and the code reviewer. A verifier reproduced a real expiry after about 312 s (probe 78).
- **The permit field shows for cars**, unmarked (F-0046). Raised by the walkthrough, the heuristic evaluators and a critic. The cause, located by the code reviewer: `.field{display:flex}` overrides `[hidden]` in styles.css.
- **"Change slot" goes back to Today, not the booked day** (F-0024, F-0035, F-0064: one cause). Raised by the auditor, the code reviewer and a heuristic evaluator. Probe 36 produced a booking for Monday 12 October after starting from Saturday 17.
- **No online way to change or cancel a booking once it is made** (F-0058, F-0079: the same problem from two evaluators).

## 2. Detector-only findings

- Focus outline removed on slot buttons (A11Y-04, F-0016). One cause with the code reviewer's F-0026 and a heuristic evaluator's F-0070: an injected `.slot:focus{outline:0}`.
- Horizontal overflow and no reflow at 320 px on the When step (F-0009, F-0010). One cause with F-0028: the slot-grid width rule for screens 360 px and narrower.
- Contrast of the "Few left" tag: 3.02:1 in light and 3.38:1 in dark, measured by a verifier from rendered pixels (F-0001, F-0002, same cause as F-0036). This fails in both themes, which matters because many residents use dark mode.
- The slot-count status ("22 slots free on …") is not announced (F-0015). Layout shift above 0.1 on the When step (F-0019). No progress while the van and trailer options load (F-0018).

## 3. Judge-only findings

- **A second tap on "Book this slot" during its 1.5 s wait saves the booking as cancelled** (F-0030). The code reviewer found it, and a verifier reproduced it: the button relabels to "Cancel booking" and the done page shows "Status: cancelled" under the heading "Booked". The button also shows no pending state (F-0029, F-0047), which makes a second tap likely on a phone. All three raters gave it severity 4.
- Past slots on Today are offered as free and rejected only at booking (F-0034, F-0060).
- Permit format and presence are checked only at the final step (F-0038).
- The vehicle step does not restate the day and slot (F-0054). The permit help gives no link (F-0056). The two-working-day permit lead time is shown late (F-0057). The vans and trailers help is an unlabelled icon (F-0059). An invalid "Another day" date leaves the old slots selectable (F-0067).
- The selected day is weakly distinguished, at 1.16:1 tint (F-0022). The error-summary links do not move focus (F-0105). The vehicle error is not tied to its buttons (F-0106).

## 4. Detector false positives and rejected candidates

- The design critics' sealed detector section had no hits, so nothing there was disputed.
- Rejected by verifiers: F-0037 (a delayed permit reveal, not reproduced), F-0042 (the arrival rule "only in a tooltip": the page text states it) and F-0084 (a faint selected tint: the capture showed pointer hover).
- **F-0020 is a probable false positive.** All three step lists mark the current step with `aria-current="step"` (index.html:31, vehicle.html:32, confirm.html:32). The ARIA snapshot may omit that attribute. The finding is left at P2 with a note, for a screen-reader check.
- F-0040 (Enter acts during IME composition) needs a human: probes cannot drive an IME. The site is en-GB only, so this is low-stakes.

## 5. Strengths to preserve

Each strength is seen at a width and theme the audit ran:
- Error summaries name every problem in plain words, link to the field, give a valid example ("Enter a UK mobile number, like 07700 900123") and keep typed values. Seen on confirm/errors at 375 light; typed values survive the expired state (confirm expired, 375).
- Fields say why personal data is asked ("For a reminder the evening before", "To confirm you live in the district"). Seen on confirm/default at 375 px.
- The confirm summary restates the 20-minute window (09:20 to 09:40) with a change link per item. Change slot and Change vehicle keep the vehicle, the waste and typed details (probes 11 and 31 at 375).
- Full and Few-left slots carry their state in words, not colour alone, and toggles expose pressed, disabled and expanded states (root/slot-chosen ARIA).
- The quick-day buttons use residents' words ("Tomorrow", "Saturday 17"). The closed-Wednesday case is explained in place.
- The dark theme renders cleanly at 375 px (root/slot-chosen/375-dark.png). The one contrast failure in dark is the "Few left" tag.

## 6. Divergent findings, as questions for user research

No finding was flagged divergent by the raters (spread < 2 everywhere). Open questions worth a short test with residents on phones:
- Do residents read "Few left" slots above "Morning" as recommended or earliest slots, and pick a slot they did not mean?
- After a slot is lost to the hold, do residents find "Change slot", or abandon?
- How often does a double tap happen on the real "Book this slot" button over mobile data?

## 7. Fix ideas, after evaluation

1. Disable "Book this slot" and show "Booking…" on the first tap. Never turn a second tap into a cancellation (F-0030, F-0029/F-0047).
2. Make done.html show "Cancelled" as the heading when status=cancelled, and drop the gate instructions (F-0023/F-0031).
3. Remove `order:-1` and keep "Few left" as a tag in place (F-0017/F-0021/F-0027). Darken the tag colours to the warning token in both themes (F-0001/F-0002/F-0036).
4. Remove the injected `.slot:focus{outline:0}` (F-0016/F-0026/F-0070).
5. Fix the ≤360 px slot-grid width (F-0009/F-0010/F-0028).
6. Pre-select the saved day and slot when returning to the When step (F-0024/F-0035/F-0064).
7. Say "We hold this slot for 5 minutes" after a slot is chosen. On expiry, say so and link to choose another slot (F-0045/F-0103, F-0025/F-0104).
8. Restate the day, time and vehicle on the done page (F-0048). Hide past slots on Today (F-0034/F-0060). Make `[hidden]` win over `.field` (F-0046). Validate the permit on the vehicle step (F-0038).
9. Online change and cancel by reference needs a back-end path; it is the owner's call (F-0058/F-0079).

Tool note: `findings merge --accept` allowed only one partial accept of the catch-all same-cause proposal S1 (every app.js finding sits on minified line 1). The other same-cause groups above stay as separate findings in the register and are grouped here and in the report by hand.
