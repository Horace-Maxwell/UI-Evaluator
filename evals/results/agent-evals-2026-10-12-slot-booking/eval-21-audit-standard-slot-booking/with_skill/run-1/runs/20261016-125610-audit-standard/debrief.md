# Debrief: audit-standard, Dunmore recycling centre booking (run 20261016-125610)

Standard depth: full deterministic audit (6 routes, 6 widths, light and dark), 2 journey replays, 3 heuristic evaluators, 2 walkthroughs, 3 design critics, an accessibility auditor, a code reviewer (review and locate), 4 verifier runs and 3 blind raters. All findings are analytical (E0/E1); none were observed with residents.

## 1. What the passes agree on

- **"Few left" slots are pulled out of time order** (F-0017, which absorbs F-0020/F-0069; F-0079 is the critic's view of the same cause). Found by all 3 heuristic evaluators, both walkthroughs, all 3 critics, the accessibility auditor, the code reviewer and the keyboard detector. An inline `order:-1` moves them into an unlabelled block above "Morning", so 13:40 appears among the morning slots and Tab jumps backwards (WCAG 1.3.1, 1.3.2, 2.4.3).
- **The cancelled booking page still says "Booked"** (F-0021, F-0022): flagged by 3 HE, 3 critics and the auditor. It is the landing page of the double-tap defect below.
- **The done page does not repeat the day, time or vehicle** (F-0044, F-0080): flagged by 3 HE, the walkthrough and 3 critics.
- **A van's permit is only checked after "Book this slot"** (F-0033), and the late errors carry no link back to the field (F-0034).
- **Nothing says how long a slot is held**, and the 5-minute hold expires without warning (F-0036, F-0075, F-0078).
- **"Change slot" resets the day to Today** (F-0046): the change journey can silently book Monday instead of Saturday.

## 2. Detector-only findings

- "Few left" tag contrast: 3.02:1 in light (measured); the code reviewer computed about 3.4:1 in dark (F-0001).
- Slot buttons have no visible focus indicator: `.slot:focus{outline:0}` is injected at run time (F-0016; the code reviewer found the cause).
- Horizontal overflow and no reflow at 320 px on / (F-0009; F-0101 is the critic's view of it).
- Slot-count status message not announced to screen readers (F-0015).
- Layout shift 0.169 on / at 320 px (F-0019); no progress during a 1.2 s vehicle change (F-0018).

## 3. Judge-only findings

- **A second tap on "Book this slot" saves the booking as cancelled** (F-0029, code reviewer; the verifier confirmed it; all 3 raters scored 4). On a phone a double tap is common, and the resident lands on a page headed "Booked" with a reference the gate will reject.
- Today's past slots are offered and refused only at the last step (F-0032).
- No online way to change or cancel a booking once it is made (F-0067, F-0076).
- The vehicle step doesn't show the chosen day and slot (F-0058); permit field is shown for cars (F-0042, F-0056, F-0083); the permit rule sits behind an (i) button (F-0104); the permit help has no link (F-0105).
- Expired hold: the error has no next step and "Book this slot" stays the primary action (F-0024, F-0082).

## 4. Detector false positives

None identified among gate-level hits. The APCA and one-word-last-line hits are advisory observations, not findings. Two judged candidates were rejected: F-0035 (late permit field insertion, not reproduced on screen) and F-0099 (selected day hard to see in dark mode; the verifier found it visible, and the tint was the hover state left over from the capture).

## 5. Strengths to preserve

- **Dark theme exists and holds together at 375 px**: text, borders and the selected 09:20 slot are clear in `evidence/screens/root/slot-chosen/375-dark.png`; only the "Few left" tag is weak.
- **Slot buttons are large tap targets at 375 px** (about 97 × 56 px; same capture) and "Full" slots are labelled with text, not colour alone.
- **The opening days, slot length, two-per-week limit and permit rule are written in plain language on the first page** (same capture, "Opening days" box).
- **Changing the slot from the confirm page keeps the vehicle, waste and details** once the day is reselected (walkthrough change-slot, step 4, 375 px).
- **The done page states the reference large and says to show it on phone or paper** (`screens/done-.../default/375-dark.png`).
- **Vehicle-step error summary takes focus and is announced** (state `errors`, 375 px).

## 6. Divergent findings: questions for user research

The raters did not diverge (0 divergent). Open questions worth testing with residents:
- Do residents who double-tap "Book this slot" notice the "Status: cancelled" line under the large "Booked" heading?
- Do residents expect the "Few left" block to be all the morning has, and miss 08:00 and 09:20?
- How many van owners reach the confirm page without a permit?
- F-0037 (Enter during IME composition) needs a manual test with a real IME; the probe could not produce composition events.

## 7. Fix ideas (after evaluation)

1. Ignore repeat presses while booking is pending, with a visible "Booking…" state (F-0029, F-0030). On the cancelled page, change the heading and title to "Booking cancelled" and remove the gate instructions (F-0021, F-0022).
2. Remove the `order:-1` rule so "Few left" stays as a tag in time order; restore the focus ring on `.slot`; raise the "Few left" tag contrast in both themes (F-0017, F-0016, F-0001).
3. Make the slot grid reflow at 320 px (F-0009).
4. Validate the permit on the vehicle step, show the permit field only for a van or trailer, and state the rule inline (F-0033, F-0042, F-0104).
5. Show the hold time ("held until 21:14") and give the expired state a "Choose another slot" action (F-0036, F-0024).
6. Restate the day, time window and vehicle on the done page and the vehicle step (F-0044, F-0058).
7. Keep the chosen day when "Change slot" is used (F-0046); hide past slots for today (F-0032).
