The booking flow is not ready for launch as handed over. The worst problem: a resident can end up with a booking the gate will reject while the page in front of them says "Booked". There are also a few accessibility failures that hit phone and keyboard users on the very first screen.

I reviewed it at phone widths (320 and 375 px) and desktop widths, in light and dark mode. Several independent reviewers checked it, then other reviewers confirmed or rejected each problem and rated how severe it is without seeing who found it. All of this is expert review. Nothing has been tried with residents yet.

## What to fix first

1. **A double tap on "Book this slot" cancels the booking.** While the booking is processing (about 1.5 s), a second tap silently changes the button to "Cancel booking". The booking is then saved as cancelled. The resident still lands on a page headed **"Booked"** with a reference, and only a small red line says it isn't on the gate's list. That page also still says "Show this at the gate". Double taps are common on phones, so this sends people with a loaded car to a gate that turns them away. All three raters gave it the top severity. The fix:
   - ignore repeat taps and show "Booking…" while it processes;
   - head the cancelled page "Booking cancelled", and change its tab title too;
   - remove the gate instructions from the cancelled page.
2. **"Few left" slots are moved out of time order.** Every slot with "Few left" is pulled into an unlabelled block above "Morning", so 13:40 sits among the morning times. Residents may think 08:00 or 09:20 are gone. The keyboard and screen-reader order also jumps backwards (WCAG 1.3.1, 1.3.2 and 2.4.3). Nearly every reviewer found this independently. It comes from one CSS rule (`order:-1`).
3. **Slot buttons show no keyboard focus.** A rule added at run time removes the focus outline (WCAG 2.4.7).
4. **The "Few left" label is hard to read.** It measured 3.0:1 contrast in light mode, against the 4.5:1 required. In dark mode the code works out to about 3.4:1; that figure was calculated, not measured. Either way it's below the minimum in the theme many residents use.
5. **The slot grid doesn't fit a small phone.** At 320 px the page scrolls sideways (WCAG 1.4.10 Reflow).

## Next round, also high priority

- **Permits are checked too late.** A van with no permit, or a wrong one, gets through the vehicle step and is only stopped after "Book this slot". The error there doesn't link back to the field. The permit field also shows for cars, and the permit rule is hidden behind an (i) button.
- **The 5-minute hold is invisible.** Nothing says a slot is held or for how long. When it expires, the message gives no next step and "Book this slot" stays the main button.
- **The confirmation page leaves out the booking itself.** It doesn't repeat the day, the time window or the vehicle, which is what someone glancing at their phone at the gate needs.
- **"Change slot" resets the day to Today.** Someone moving their Saturday booking can quietly end up booking Monday.
- **Today's earlier slots look bookable.** They show as free and are refused only at the last step.
- **No online way to change or cancel.** Residents can only do it by phone, on weekdays.
- **Screen readers aren't told when slots load.** "22 slots free…" isn't announced, and the slot area is blank for about a second with no loading message.

## Worth keeping

- The dark theme holds together well on a phone apart from the "Few left" label.
- Slot buttons are large tap targets, and full slots say "Full" in text rather than relying on colour.
- The centre's rules are written plainly on the first page.
- The reference is shown large.

## Where things stand

The UI-Evaluator check reached no assurance level against the L3 target in your product notes. It is held back by the WCAG failures above and the two top-severity problems.

Some things can't be checked by machine and need a person:
- VoiceOver and TalkBack in dark mode;
- real 200% zoom;
- typing with an IME (one finding about this is waiting on that test).

The "how distinctive and appealing is it" checks for minified code didn't run, and the design reviewers called the look plain and generic for a council form. That's a lower priority than the problems above.

Because the agency's files are minified and you have no original source, each fix means either editing the bundle or asking the agency. Most of the top items are small changes.

## Files

All in `.ui-evaluator/runs/20261016-125610-audit-standard/`:
- `report.md` and `report.html`: the full report;
- `debrief.md`: the review summary;
- `agree-disagree.csv`: a sheet for you or the agency to mark findings agree or disagree.

## Questions for you

1. Can you change the bundle yourselves, or should I write the fixes up as a change request for the agency?
2. Is online change and cancel in scope for launch, or is the phone line the intended route?
3. Should the "Few left" marker stay at all, or is "Full" enough?

I can start the fixes in priority order (the double tap first) if you'd like.
