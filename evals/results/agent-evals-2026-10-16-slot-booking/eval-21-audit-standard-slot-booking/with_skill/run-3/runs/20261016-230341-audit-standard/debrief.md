# Debrief: audit-standard, run 20261016-230341

Depth: standard. Inspectors: 3 heuristic evaluators, 1 walkthrough evaluator (book-a-slot), 3 design critics, 1 accessibility auditor and 1 code reviewer (review and locate passes), each in an isolated subagent. Then 3 parallel verifiers and 3 blind severity raters. The deterministic audit ran 22 checks over 6 routes × 6 widths (320–1440) × light and dark. All evidence is analytical (E0–E1). No residents took part, so nothing here says what residents do.

## 1. What the passes agree on

- **The done page leaves out what was booked** (F-0050, sev 3.33, P1). Every heuristic evaluator, the walkthrough and all three critics raised it, and a verifier reproduced it. The page shows only the reference: no day, slot time or vehicle. Yet residents are told to show this page at the gate, with poor signal there.
- **A cancelled booking is headed "Booked" and still says "Show this at the gate"** (F-0022, sev 3, P1). All three heuristic evaluators, all three critics and the accessibility auditor (2.4.6) raised it, and it was reproduced at 375 px in dark mode (`evidence/screens/done-…/cancelled/375-dark.png`).
- **"Few left" slots are pulled out of time order** (F-0017, P0 by rule severity). The script sets an inline `order:-1` on these slots (`app.js` 1:6073), so they sit in an unlabelled group above "Morning". The keyboard detector, the accessibility auditor (1.3.2 / 2.4.3), all three heuristic evaluators, the walkthrough and all three critics found it.
- **Slot buttons have no visible keyboard focus** (F-0016, P1). An injected `.slot:focus{outline:0}` removes the ring (`app.js` 1:5424). The detector found it at 320 px, and the auditor and evaluators found it at 1280 px.
- **The permit field shows for a car with no note that only vans and trailers need it** (F-0025, P2). The cause is `.field{display:flex}`, which overrides `hidden` (`styles.css` 1:2389).
- **The 5-minute slot hold is never stated, and the expired-hold error gives no way forward** (F-0038 P1; F-0023 P2). A verifier let a real hold lapse (about 330 s): nothing warns, and nothing offers more time.

## 2. Detector-only findings

- "Few left" tag contrast is 3.02:1 (#bd7d0f on #fbefda) in the **light theme only** (F-0001, F-0002). The same tag passes in dark mode, as measured.
- Horizontal overflow and failed reflow at 320 px on the slot page (F-0009, F-0010). The code reviewer separately traced the slot grid to a JS-set width about 31 px too wide at 360 px and below (F-0028).
- The "N slots free on …" status is not announced (F-0015). The page shifts layout above 0.1 CLS while slots load (F-0019). "Car with trailer" and "Van" show no progress during a 1.2 s operation (F-0018).

## 3. Judge-only findings

- **A second press of "Book this slot" saves the booking as cancelled** (F-0036, sev 4, P0). The code reviewer found it at `app.js` 1:11263 and a verifier reproduced it. The button stays enabled with no visible busy state for about 1.5 s (F-0026, P1), so a resident on a slow phone who taps twice ends up with a cancelled booking. The done page then still says "Booked" (F-0022).
- **"Change slot" resets the day to today** (F-0033, P1). A verifier picked 14:20 after "Change slot" and the booking moved from Saturday 17 to Monday 12 with nothing to say so.
- **Slots that have already started today are offered as free** (F-0030, P1).
- **The permit is checked only at "Book this slot"**, on a page without the permit field (F-0035, P1). The error there has no link to the field (F-0055) and says "needed" even when a malformed permit was entered (F-0056).
- **An existing booking cannot be changed or cancelled online**, only by phone on weekdays (F-0074, sev 3.67, P0 by the raters). This is a missing feature rather than a defect in the flow; see §6.
- Smaller (P2–P3): the blank slot area while loading (F-0031), Next ignored while loading (F-0032), hint and error not tied to their controls (F-0041), error links aimed at containers that cannot take focus (F-0042), the date keypad (F-0044), no apply link for the permit (F-0061), permit rules behind an unlabelled icon (F-0062), the vehicle step not showing the chosen slot (F-0069), the slot grid width (F-0095).

## 4. Detector and judge false positives

- F-0024 (the current step "not exposed programmatically") was rejected after verification. `aria-current="step"` is present on index.html:31, vehicle.html:32 and confirm.html:32; Playwright's ARIA snapshot omits that attribute on list items, which misled the auditor.
- F-0034 (permit field appears 1.2 s late), F-0065 (Next does nothing with no slot), F-0092 ("Few left" contradicts one vehicle per slot) and F-0093 (selected slot looks like Full) were rejected by the verifiers.
- 18 APCA and stranded-word hits are advisory observations only. They are not counted.

## 5. Strengths to preserve

- **Dark theme is composed, not inverted**: lighter mint actions and cards lighter than the ground, readable at 375 px (`evidence/screens/done-…/cancelled/375-dark.png`, `confirm-…/errors/375-dark.png`). In dark mode the detectors found no contrast failures.
- **Error summaries** take focus, link to each field, give a worked example ("like AB12 CDE") and keep what was typed. Seen at 375 px light and dark (`confirm-…/errors/375-light.png`, `375-dark.png`).
- **Forgiving input**: lowercase registrations, +44 numbers and postcodes without a space are accepted.
- **Mid-booking "Change slot" keeps the vehicle, the waste and the entered details**, but not the day; see F-0033.
- **Full and Few left are stated in words**, not colour alone, and Full slots are disabled (CVD captures at 1280 px).
- Rules are written beside the control they govern, in the gate attendant's voice.
- Re-submitting after browser Back returns the same reference rather than a second booking.

## 6. Divergent findings, as questions for user research

No finding was divergent by spread. Questions for residents and owners:
- F-0074: do residents expect to change or cancel online, or is the weekday phone line acceptable? It is rated P0, but it is a product decision: PRODUCT.md lists changing a slot as a core task, and the phone line is the only route after booking.
- The critics judged the design generic and plain (all 3 of 3), with brand fit at 2 of 3 attributes. A desirability check with residents would show whether "plain" costs trust on a council service.
- F-0040 (the Enter handler has no IME composition guard) needs a human test with a real IME. It is low risk for an en-GB-only service.

## 7. Fix ideas (after evaluation)

1. Disable "Book this slot" with a visible "Booking…" state on first press, and make a repeat submit idempotent (F-0036, F-0026).
2. Done page: show the day, slot range, vehicle and registration beside the reference. Branch the heading and copy on status, so a cancelled booking says "Cancelled" and never "Show this at the gate" (F-0050, F-0022).
3. Delete the injected `.slot:focus{outline:0}` and the inline `order:-1` (F-0016, F-0017).
4. Keep the chosen day when coming back through "Change slot"; hide slots that have passed for today (F-0033, F-0030).
5. Give the "Few left" tag a darker amber in the light theme (≥ 4.5:1); fix the slot grid width at 320–360 px (F-0001/2, F-0009/10, F-0028).
6. State the 5-minute hold where the slot is chosen and on confirm; offer "Choose another slot" in the expired error (F-0038, F-0023).
7. Restore `hidden` on the permit field (`.field[hidden]{display:none}`) and validate the permit on the vehicle step (F-0025, F-0035).
