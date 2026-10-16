# Debrief: audit-standard, 20261016-125619

Lead synthesis after merge, verification and blind rating. All findings below are E0 (predicted) or E1 (reproduced or measured). None is observed with residents, so this debrief says "may" or "measured", never "residents do".

## 1. What the passes agree on

- **"Few left" slots are pulled out of time order** into an unlabelled block above "Morning". Raised by all three heuristic evaluators, both walkthroughs, all three critics, the accessibility auditor and the code reviewer, and measured by the keyboard check as a focus-order jump (F-0017, F-0020, F-0077; one cause, inline `order:-1` at app.js:1:6073). On a 375 px phone, 09:20 sits below a block of morning and afternoon "Few left" slots (capture `evidence/screens/root/date-chosen/375-dark.png`), so free morning slots may look missing.
- **The done page gives the reference but not the day, slot or vehicle** (F-0044, F-0078). Six inspectors raised it. At the gate, with poor signal, that page is what residents show.
- **A cancelled booking is still headed "Booked"** (F-0023). Five inspectors raised it. Together with F-0027, below, this is the most serious combination in the run.
- **The 5-minute hold is never mentioned, and expiry gives no way forward** (F-0035, F-0105, F-0025, F-0106). A verifier waited out the hold in real time and reproduced the expiry.
- **The permit field shows for cars and before any vehicle is chosen** (F-0031; one cause, `.field{display:flex}` overriding `hidden` at styles.css:1:2389).

## 2. Detector-only findings

- No visible focus indicator on slot buttons (F-0016, plus forced colours F-0021, merged). Measured: 0 changed pixels on focus at 320 px. Cause: an injected `.slot:focus{outline:0}` (F-0026, app.js:1:5439). Keyboard-only residents can't see which slot they are on.
- "Few left" tag contrast is 3.02:1 in light and 3.38:1 in dark (F-0001, F-0002, F-0101; one cause, the undeclared `few` token). The only text-contrast failure in dark mode.
- Horizontal overflow and no reflow at 320 px on the slots page (F-0009, F-0010, F-0030; one cause, a fixed 3-column grid at app.js:1:5505). This matters for residents using larger text, since that narrows the effective width.
- The slot-count status message isn't announced on first load (F-0015, and F-0039 merged): the live region is armed after its text is written.
- A layout shift above budget on / (F-0019), and no progress during the 1.2 s vehicle change (F-0018).

## 3. Judge-only findings

- **A double tap on "Book this slot" saves the booking as cancelled** (F-0027, rated 4 by all three raters). A verifier reproduced it by using the app. The done page then still says "Booked" (F-0023), so a resident may drive to the gate with a reference the attendant doesn't have. Phones and an unresponsive 1.5 s submit with no progress (F-0104) make a second tap likely.
- **The mobile number is required but presented as "for a reminder"** (F-0061, mean 3.67). A landline is rejected, so a resident with only a landline can't book.
- **No online way to change or cancel a booking** (F-0056, mean 3.33). Only a weekday phone line is offered, while bookings happen the evening before.
- Today's slots that have already started can be chosen, and are refused only at the final step (F-0032, F-0060).
- "Change slot" and "Back to the slots" reopen on Today, not on the chosen day (F-0048), so a change can silently move the booking to today. The change page also looks like a fresh booking (F-0045).
- Permit format and closed-day checks happen only at the last step, in an unlinked error (F-0033).

## 4. Detector false positives

- No deterministic finding was rejected. One judged candidate was: F-0034, error-summary links that "cannot take focus", did not reproduce (probes 51 and 52).
- Advisory observations (APCA weak-but-passing text, single-word last lines) are listed apart and not counted.

## 5. Strengths to preserve

- **Dark mode is coherent at phone width.** Background, cards, borders, buttons and links invert cleanly, and body text holds contrast; the only dark-mode text-contrast failure is the "Few left" tag (capture `evidence/screens/root/date-chosen/375-dark.png`, 375 px dark).
- **The reference is large and given its own card**, with plain gate instructions (capture `evidence/screens/done-html-ref-dr-204117-date-2026-10-17-slot-09-20-vehicle-c/default/375-dark.png`, 375 px dark).
- **Rules are stated where they apply:** opening days, slot length, the two-a-week limit and the permit rule sit under the slot list on the phone (same capture as the first strength).
- **Both journeys replay end to end** (book-a-slot 17/17 steps; change-slot 9/9). Axe found no violations except the contrast of the tag. The target-size, form-label, language and dialog checks ran clean.

## 6. Divergent findings: questions for user research

- No finding was divergent (spread < 2 everywhere). Open questions:
  - Do residents read the "Few left" block as "the only free slots"? A short first-click test on a phone would show this.
  - Do residents expect a reminder field to be optional? Is a landline-only household a real share of bookers? Gate attendants could estimate.

## 7. Fix ideas (after evaluation)

1. Make "Book this slot" ignore activation while pending, and show progress. Separately, never render a "Booked" heading for a cancelled status.
2. Remove `.slot:focus{outline:0}` and the `order:-1` on "Few left" slots, and keep slots in time order with the tag inline.
3. Put the booked day, time, vehicle and waste on the done page next to the reference.
4. Make the mobile number optional, or state plainly why it is needed and accept landlines.
5. Fix the `few` colour token to reach 4.5:1 in both themes, and let the slot grid reflow below 360 px.
6. State the 5-minute hold where the slot is chosen and on later steps. On expiry, link straight to choosing a new slot.
7. Respect `hidden` on the permit field. Validate the permit on the vehicle step.
8. Carry the chosen day back into "Change slot". Disable past slots for today.
