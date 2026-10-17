I reviewed the four booking pages at phone width (320 px and 375 px) in both dark and light mode, and at desktop widths. **The flow isn't ready for launch yet.** A booking can be made end to end, but one bug can cancel a resident's booking without them noticing, and there are several accessibility failures. None of this was tested with residents: the findings are reproduced in a browser or measured. Where I say what residents "may" do, that is a prediction.

## What to fix first

1. **A second tap on "Book this slot" cancels the booking.** If the button is tapped again while a booking is going through, the booking is saved as cancelled. The resident lands on a page still headed "Booked", so they may arrive at the gate with a cancelled booking. The button also shows no "booking…" state during the 1.5-second wait, which makes a second tap likely on a phone. Fix: ignore taps while a booking is going through and show that it is in progress.

2. **"Few left" slots are taken out of time order.** They are pulled into a block above "Morning", so on a phone the list starts 08:20, 08:40, 09:00… and only then 08:00. The Morning and Afternoon lists are missing times, and keyboard and screen-reader order jumps back and forth. Fix: delete the injected `order:-1` and keep the "Few left" tag on each slot where it belongs.

3. **On a phone, the slot page breaks in three ways:**
   - Slot buttons show no focus ring, because the script removes it.
   - The slot grid is wider than the screen at 360 px and below, so the page scrolls sideways.
   - The amber "Few left" text measures 3.0:1 in light mode and 3.4:1 in dark mode, below the 4.5:1 minimum. It is the only text that fails contrast in dark mode.

4. **The done page doesn't do its job at the gate.** It shows only the reference, not the day, time or vehicle, and the centre has poor signal, so residents rely on that page. A cancelled booking is still headed "Booked" and still says "Show this at the gate".

5. **The 5-minute slot hold is never mentioned.** A slot lapses after about 5 minutes. When it does, "This slot is no longer available" offers no reason and no way back to the slots. The person booking on a phone in the evening, filling in details slowly, is exactly who this catches.

6. **The van permit is handled badly:**
   - The permit field shows even when Car is chosen. A stylesheet rule (`.field{display:flex}`) overrides `hidden`.
   - A wrong permit number is only caught at the last step.
   - "Apply on the council site" has no link.

7. **"Change slot" reopens on Today, not the day you booked**, which makes booking the wrong day easy.

Also confirmed:
- There is no online way to change or cancel a booking, only a weekday phone line. This is the largest fix, because it needs a manage-booking page and backend support.
- The "N slots free" message isn't announced to screen readers.
- The slots take about 0.9 s to appear, with nothing shown while they load.

## Dark mode and what already works

Dark mode is complete apart from the "Few left" amber. What already works well:
- Error messages link to each field and give examples.
- Changing the slot or vehicle keeps everything already entered.
- The check page shows the slot as "09:20 to 09:40".
- Availability is written out in words, not shown by colour alone.
- The Today / Tomorrow / Saturday / Sunday buttons match how people plan a trip.

## Status and limits

- **Not reached:** the agreed bar for launch, which is human-checked (L3). Accessibility, layout and usability all fail, so even the automated first level isn't met.
- **Still needs people:** a VoiceOver and TalkBack pass of both journeys, a check at 200% zoom on a real phone, and a test with a phone keyboard that composes text before inserting it (a predictive or IME keyboard), because pressing Enter there could submit the form. A short test with a few residents would also settle how long people actually take to fill in their details, which decides how much the hidden 5-minute hold matters.
- **Only the minified bundle exists,** so every fix is a patch to `app.js` or `styles.css`. It's worth asking the agency for the unminified source.
- **Some findings appear more than once in the report.** A few problems were reported under several IDs (for example F-0043, F-0079 and F-0104 are all the hidden hold). The run's debrief lists these groups; read each group as one problem.
- **A lot is out of scope:** the design reviewers rated the look plain and only partly specific to this service. That is not a launch blocker, and I've left it out of the list above.

The full report is in `.ui-evaluator/runs/20261016-230353-audit-standard/` (`report.md`, `report.html`, and `agree-disagree.csv` for whoever signs off). The debrief and the gate results are in the same folder.

To pick the right fixes, I need to know two things:
1. Can the council patch the bundle itself, or do fixes have to go back to the agency?
2. Is changing or cancelling online in scope for launch, or will the phone line do for now?

If the council can patch it, I can make fixes 1–3 and 7 directly and re-check them. I can also publish the report as a private web page you can send to the agency.
