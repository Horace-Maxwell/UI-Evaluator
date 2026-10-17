I reviewed the whole booking flow and it isn't ready for launch yet. Two problems can send a resident to the gate with a booking the gate won't honour, and keyboard users can't see where they are in the list of slots. Most of the fixes are small changes to the agency's bundle.

The review covered all four pages at six widths (320 to 1440 px), in light and dark mode. Several independent reviewers walked through the flow, and each finding below was re-tested on the live site before it was kept. No residents were involved, so these are problems that are likely to hit residents, not things residents have been seen doing.

The target in your `PRODUCT.md` is L3 (human-confirmed); the site reaches **none** of the levels. 32 problems were confirmed: 3 P0, 15 P1, 12 P2 and 2 P3.

## Fix first

1. **Tapping "Book this slot" twice saves the booking as cancelled** (P0, rated 4 of 4 by all three raters). A double tap is easy on a phone: for about 1.5 s after the first tap the button looks the same and still works. A second tap in that time stores the booking as *cancelled* (`app.js` 1:11263). The done page then still says "Booked", so the resident sets off believing they have a slot. Fix: disable the button and show "Booking…" during the wait, and ignore repeat taps.
2. **The done page doesn't work as a gate pass** (P1). It shows only the reference, with no day, no 20-minute slot time and no vehicle. Residents are told to show this page at the gate, where the phone signal is poor. A cancelled booking is still headed "Booked" and still says "Show this at the gate"; I checked this myself in the 375 px dark-mode screenshot. Fix: add the day, "arrive between 09:20 and 09:40", the vehicle and the registration. Change the heading and wording when the booking is cancelled.
3. **"Change slot" quietly switches the booking to today** (P1). Going back to change the slot resets the day to Today. One reviewer chose 14:20 that way and the booking moved from Saturday 17 to Monday 12 with no warning (`app.js` 1:5127). It also lists today's slots that have already passed as free, and only rejects them at the last step (P1).
4. **Keyboard use of the slot list** (P0/P1, both WCAG failures):
   - The script turns off the focus outline on slot buttons (`app.js` 1:5424), so keyboard users can't see which slot they are on.
   - "Few left" slots are pulled out of time order into an unlabelled row above "Morning" (`app.js` 1:6073), so the tab order jumps back and forth.

   Each is a one-line fix.
5. **Problems on narrow phones:** at 320 px the slot page scrolls sideways (WCAG reflow failure). The "Few left" label is 3.02:1 contrast in **light mode only**; it needs 4.5:1.
6. **The slot hold and the van permit** (P1):
   - A chosen slot is held for about 5 minutes, but no page says so. When the hold runs out, the error offers no way back to choosing a slot.
   - The permit field shows for cars too. A CSS rule stops it being hidden (`styles.css` 1:2389).
   - The permit is only checked at "Book this slot", on a page with no permit field to correct it.

## Dark mode and phones

Dark mode holds up well. It is properly designed rather than just inverted colours, and the checks found no contrast failures there; the one contrast failure is in light mode. The worst problems for an evening booking on a phone are items 1, 2, 3 and 5.

## Worth keeping

- The error messages are good: they take focus, link to the field, give an example and keep what was typed.
- Input is forgiving: lowercase registrations, +44 numbers and postcodes without a space all work.
- Rules are written next to the control they apply to.
- "Full" and "Few left" are written as words, not shown by colour alone.
- Changing the slot keeps the vehicle, the waste and the details typed in. Only the day is lost.

## Decisions for you

- **Changing or cancelling a booking:** there is no way to do this online, only by phone on weekdays. The raters made it P0, but it is a new feature rather than a bug, so I've left it as your call. I assumed it stays out of scope for launch.
- **Look and feel:** all three design reviewers found the look clean but generic. It is a judgement call, not a fault, and I'd treat it as low priority.

## Gaps in this review

- Because the bundle is minified, the source lint checks couldn't run, so those checks are "not run" rather than passed.
- One item still needs a person to test it: pressing Enter while typing with an input method (IME).
- Real screen-reader passes (VoiceOver, TalkBack) and a resident test are still to do. They are needed before you can claim L3.

I fixed a format problem in two reviewers' output files so the report would generate, and didn't change their content. The full report is in `.ui-evaluator/runs/20261016-230341-audit-standard/report.md` (with `report.html`), and `agree-disagree.csv` is there for stakeholders to mark up.

If you want, I can fix items 1–5 next, one fix per commit with a re-test after each. All of them are in the agency's minified `app.js` and `styles.css`, so they're patches to the bundle. The agency should make the same changes in their source.
