I don't think the booking flow is ready to open yet. It works end to end: a skipper can book a berth, the automated accessibility checks pass, and the error messages are good. But I found one blocker and a handful of serious problems, and the automated tests miss all of them. Each one can let a skipper book a berth their boat can't fit, or an arrival time when the gate is shut, or get stuck with no way forward.

I reviewed it with three independent usability reviewers, a step-by-step walkthrough as a first-time visiting skipper on a phone, three design critics, an accessibility check and a code review. Every problem below was then reproduced in the live site and rated for severity by three separate raters who didn't know who had found it. In total there are 41 confirmed problems; these are the ones to fix first.

## Fix first

1. **"Booking stopped" is a dead end (the blocker; 8 of 10 reviewers found it).** If the boat is longer than the chosen berth, the whole form is replaced with "Booking stopped. This booking cannot continue. Reference BK-409." It gives no reason, no way back, and no mention of the berths that would fit. Whatever the skipper typed is lost. The trigger is in `app.js:187` and the page in `boat.html:70`. It should say what's wrong ("Your boat is 10.4 m; Pontoon B, berth 14 takes boats up to 10 m"), list the berths that fit, keep their details and give the office phone number.
2. **The berth is chosen before the boat's length is asked.** That order is what sends skippers into the dead end above. Ask for length overall up front, or at the top of the berth list, and show only the berths the boat fits. This also fixes most of item 1.
3. **"Length" doesn't say which length or which unit.** Draught says "in metres", but Length says nothing. A skipper who types the hull length (9.6 m) instead of the length overall (10.4 m with bowsprit) can book a 10 m berth the boat doesn't fit. Label it "Length overall (LOA) in metres, including bowsprit", and say "LOA" on the berth limits.
4. **The tide information doesn't help choose the arrival time.** These are four linked problems, and one change solves them all:
   - the only tide table is in UTC, while the arrival times are local (BST);
   - choosing 08:00 on 17 October, when the gate is shut, is accepted with no warning;
   - the table is the same fixed week whatever date is chosen;
   - the sill-gate window, the thing that makes this harbour different, never appears where the time is chosen.

   Show the gate window for the chosen date in local time beside the arrival-time choice, and warn when the chosen time falls outside it. This needs tide data by date, so it is the biggest job on the list.
5. **Going Back to the boat page wipes the boat details.** `app.js:165` resets the form every time the page is shown. That breaks your own principle "Never lose what a skipper has typed" and WCAG 3.3.7. Removing the reset and refilling the fields from the address is a small fix.
6. **"Change dates" is hidden in an unlabelled "…" menu on the berth list.** Put a visible "Change" link next to the stay summary.
7. **MMSI is required, with no explanation and no option for boats without one.** It also accepts a five-digit number. Explain the term, add "My boat has no MMSI", and check for 9 digits.

Items 1, 3, 5 and 6 are each a change to one file or one part of the flow. Items 2 and 4 change the flow.

## Also worth doing before launch (quick, P2)

- The confirmation page drops the arrival time: `app.js:224` passes on only the date, nights and berth.
- The review page has no "Change" links.
- The berth cards show no selected or keyboard-focus state.
- The arrival time drop-down and the berth cards don't turn red when they are in error.
- Dates in the past are accepted.
- The booking reference repeats for the same day and berth.

## Keep these

- Your error summaries are good: they link to each field and keep what was typed.
- The berth cards put the size limit, tide behaviour and price side by side.
- The review page says clearly that you pay on arrival and nothing is charged online.
- The draught field explains itself, which is the model for the Length field.

## Where this leaves you

Your PRODUCT.md sets the goal for this flow at L4: tested with real skippers. That's the right goal for a safety-relevant booking, but the flow reaches no level yet, not even the first one (all automated checks passing). The blocking items are:

- the open P0;
- five problems judged to fail WCAG 3.3.1, 3.3.2, 3.3.3 and 3.3.7;
- no DESIGN.md;
- all three design critics judged the look generic and plain;
- no screen-reader or real-user testing yet.

Three questions to settle with real skippers:

- Which length do skippers type when a form just says "Length"?
- Do skippers read UTC tide times as local?
- How many visiting boats have no MMSI?

A few things to know about the review:

- Every problem was reproduced on the live site, but none has been confirmed by you or by real skippers yet.
- The severity ratings are predictions, not measurements.
- The journey files in `.ui-evaluator/journeys/` contain comments describing a planted problem (the hidden "Change dates"). Several reviewers saw them, so the count for that problem is probably inflated. Removing those comments would keep future reviews independent.
- `PRODUCT.md` (L4) and `config.json` (L3) set different goals. The flow reaches no level against either, but the two files should agree.
- I didn't change any site files.

The full report, with screenshots and evidence for every problem, is in `.ui-evaluator/runs/20261007-095104-audit-standard/report.md` (and `report.html`). There's also an agree/disagree sheet (`agree-disagree.csv`) for you or the harbour office to mark up. If it helps, I can fix these one at a time, starting with the dead end and the Back reset, and re-check each fix. I can also write a short test plan for a handful of visiting skippers, or turn the report into a shareable page.
