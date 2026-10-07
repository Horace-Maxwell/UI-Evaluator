The booking flow isn't ready to open yet: the automated accessibility checks pass, but a skipper picking a berth for the first time is likely to get stuck. The most serious problem has a cheap fix. Fix the first three items below before launch.

I reviewed all five pages (plan visit, choose berth, boat details, review, confirmation) at phone to desktop widths. All the automated checks pass: no accessibility-checker violations, keyboard, contrast and target sizes OK, and both booking journeys complete when someone knows the right path. Three independent reviewers checked the flow against usability principles, one walked the booking as a first-time skipper on a phone, and others covered accessibility, design and the code. Three blind raters scored each problem's severity.

## What to fix first

**1. The "Booking stopped" dead end (most serious; the raters gave it the top score of 4).**
- **What happens:** if the boat is longer than the chosen berth, the form disappears and the page says only "Booking stopped. This booking cannot continue. Reference BK-409." It gives no reason, doesn't suggest a berth that fits and has no way back. I reproduced it with a 10.4 m boat on B14, which takes up to 10 m.
- **Fix:** show it as an error on the Length field ("Pontoon B, berth 14 takes boats up to 10 m. Your boat is 10.4 m"), keep what was typed, and link to the berths that fit. The code is `app.js:187-193`, and this one is cheap.

**2. Skippers are likely to pick a berth that's too short in the first place (severity 3).**
- The berth cards say "Boats up to 10 m" without saying which length, and the boat's length is only asked after the berth is chosen.
- The boat form's "Length" field doesn't say "overall" or give a unit. A hull length of 9.6 was accepted for a boat whose length overall is 10.4.
- **Fix:** say "length overall (LOA)" on the cards and the field, and ideally ask LOA before the berth list so it shows only berths that fit.

**3. The tide information is risky (severity 3).**
- **Time zones:** the tide table is in UTC, but arrival times are local with no zone, and these dates are in British Summer Time (BST). Read at face value, the table puts a skipper an hour out at the sill.
- **Gate window:** you can choose an arrival time when the sill gate is closed, with no warning.
- **Fixed week:** the tide table only covers 17 to 23 October, whatever date is chosen.
- **Fix:** show local high water and the gate window for the chosen date next to the arrival-time choice, and warn when the time is outside it.

**4. The flow loses what skippers type (severity 3).**
- **Back button:** after Continue, pressing Back empties the boat form. I reproduced this with a real Back press; the cause is `app.js:164`, which resets the form every time the page is shown.
- **Header links:** "Book a berth" and "Tide times" in the header throw away the booking.
- **No way back:** the boat-details and review pages have no Back or Change links.

**5. MMSI is required but not explained (severity 3).** There is no format hint and no option for boats without one, and any number is accepted. Either explain it and check for 9 digits, or make it optional.

**Smaller items.** "Change dates" is hidden behind an unlabelled "…" button. The confirmation leaves out the arrival time. The same thing is called "visitor berth", "pontoon space" and "mooring". There's no step indicator.

## Worth keeping
- The error summaries are done well: they take focus, link to each field and keep what was typed.
- The berth cards give fit, afloat or drying, and price in skippers' own words.
- The review page says clearly that nothing is charged online.
- The draught and mobile-number hints explain why each is needed.
- Focus rings, 44 px targets and a real data table for the tides.

## Questions for you
These are open; I couldn't ask you during the review:
- **Look and feel:** all three design reviewers rated the look plain and generic, with nothing of the harbour's own. Is a plain utility look what you want? There's no design brief to judge it against.
- **Returning skippers:** is "same boat as last time" needed for launch?
- **Testing with skippers:** your product brief sets the bar at testing with real skippers. Whether skippers really misread "up to 10 m" or the UTC table is predicted, not observed. A five-skipper test after fixes 1–3 would settle it.

## Where things stand
- **Quality level reached:** none. The minimum level is blocked by the dead end and two other form-error problems, inconsistent red error borders, and the missing design brief. Your product brief targets the top level (testing with real skippers) and the tool's config says the level below; I judged against the brief.
- **Not done yet:** a screen-reader pass (VoiceOver and TalkBack) and testing with real skippers.
- **Reliability caveat:** the three usability reviewers' setup files included a builder note mentioning the hidden "Change dates" menu. They found it with their own tests, but treat that finding's detection count as possibly inflated.

The full report is at `.ui-evaluator/runs/20261006-152509-audit-standard/report.md` (and `report.html`). The review notes are in `debrief.md` in the same folder. `agree-disagree.csv` is a sheet for you or the harbour office to mark which findings you accept. The report lists some problems several times (the dead end shows up six times) because separate reviewers found them; the list above groups them.

If you'd like, I can fix them in this order next, checking each fix and having it reviewed independently.
