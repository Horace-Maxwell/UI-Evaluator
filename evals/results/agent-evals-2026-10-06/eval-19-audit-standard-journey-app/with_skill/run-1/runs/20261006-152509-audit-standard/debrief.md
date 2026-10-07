# Debrief: audit-standard, Saltmarsh Quay visitor-berth booking

Run 20261006-152509-audit-standard, standard depth, iteration 1. Lead's synthesis after merge, verification and blind rating. Every finding below is analytical (E0 predicted or E1 reproduced by an evaluator or the lead). None comes from observed skippers yet, so nothing here says what skippers *will* do, only what the evaluation predicts or reproduced.

Independence note: the `journeys.json` file in the three heuristic-evaluator packets carried builder `_comment` fields. One of them names the "Change dates inside More options" problem. All three evaluators disclosed reading it and reproduced that finding with their own probes. Treat the detection count on the "Change dates" findings (F-0010, F-0032, F-0065, F-0073, F-0082) as possibly inflated. The packet builder should strip `_comment` fields from journeys.

Process notes:
- The lead reproduced F-0012 with a real browser Back press (`probes/lead-back-test.png`). Three fresh blind raters then rated it (rater-4 to rater-6, all 3). Rebuilding the rater packet re-dealt the blind IDs, so the first round's files were moved to `ratings/round-1/` before re-aggregating. The 54 first-round severities are unchanged.
- The five verifier `needs_human` items (F-0047, F-0059, F-0070, F-0078, F-0080) are marked `disputed`: they wait for the owner's decision and are not rated. This leaves USE-04 at `not_run`. It does not change the level, because G5 already fails on the open P0s (USE-05).
- `PRODUCT.md` sets the target at L4 and `config.json` says L3. Gates were computed against L4, as PRODUCT.md is the owner's statement.

## 1. What the passes agree on

Several sources found each of these clusters independently (heuristic evaluators, the walkthrough, the accessibility auditor, the critics and the code reviewer). The merge tool accepted only its own proposals, so some clusters still hold more than one record. They are grouped here so the fix queue treats each cluster as one problem.

1. **Boat too long for the chosen berth → "Booking stopped" dead end** (F-0006, F-0013, F-0021, F-0027, F-0069, F-0077; P0, mean 4). The page gives no reason, does not name the berth limit, offers no larger berth and has no route back. Every source found it, and it is reproduced: 10.4 m on B14 ends here. Cause: `app.js:187-193` hides the form and shows a static block.
2. **Berth limits do not say which length, and the boat length is asked only after the berth is chosen** (F-0020, F-0026; P1). The walkthrough predicts that a first-time skipper picks B14 ("up to 10 m") with a 10.4 m LOA boat. Together with cluster 1, this is the main way to fail the critical journey.
3. **"Length" field gives no unit and does not say overall or hull length** (F-0007, F-0029, F-0052; P1/P2). The lead reproduced that a hull length of 9.6 is accepted into a berth too short for the boat's 10.4 m LOA.
4. **Tide times in UTC; arrival times local with no zone** (F-0009, F-0019, F-0063; P1). The dates fall in BST, so a skipper who reads the table at face value is off by an hour at the sill.
5. **Arrival time accepts hours when the sill gate is closed, with no warning** (F-0024, F-0038; P1). This goes against principle 1, "Show the tide window wherever a time is chosen".
6. **Tide table is fixed to 17–23 October** whatever date is chosen (F-0043, F-0057; P1).
7. **Typed details are lost:** the boat form empties on Back (F-0012, reproduced by the lead with a real Back press). Header and menu links and "Tide times" drop the booking (F-0034, F-0042, F-0049; P1). Boat details and review offer no way back or to change answers (F-0033, F-0050; P1). This goes against principle 2, "Never lose what a skipper has typed".
8. **MMSI required but unexplained**, with no format check and no path for boats without one (F-0008, F-0030; P1), and wrong-length values are accepted (F-0031, F-0053; P3).
9. **Change dates is hidden in an unlabelled "…" menu** (F-0010, F-0032, F-0065, F-0073, F-0082; P2). See the independence note above.
10. **Confirmation leaves out the arrival time** (F-0037, F-0046, F-0054; P2).
11. **The same thing has three names: visitor berth, pontoon space and mooring** (F-0035, F-0066, F-0085; P2/P3).
12. **No step or progress indicator** (F-0045, F-0058; P2).

## 2. Detector-only findings

- TYP-15 single words on the last line at 320/375 (F-0002–F-0005, F-0055; P3).
- TYP-14 tabular figures on "Sat 17 Oct" (F-0001; P3). Two critics consider it a probable false positive, because the date column is a row header and not a compared number.
- Every gate-level deterministic check is clean: axe 0 violations, keyboard, focus, targets, contrast, reflow, text spacing, forms, live regions, lang and vitals. Both journeys replay to completion.

## 3. Judge-only findings

All usability findings above are judge-only. The detectors cannot see meaning such as which length, which time zone or why a booking stopped. Code-reviewer-only findings: the error-summary link targets the fieldset (F-0014), invalid styling misses the select and the radios (F-0015), the chosen berth card has no selected style (F-0016), and past or out-of-season dates are accepted (F-0017, F-0025).

## 4. Detector false positives and rejected candidates

- Rejected F-0036, a dark Length border that came from the pointer's hover. The verifier traced it to the hover style.
- Rejected F-0068 (yyyy/mm/dd comes from the browser's locale) and F-0071 (the controls are themed).
- Rejected F-0018 and F-0060 as out of scope: hand-edited URLs, and DESIGN.md not being part of this review.
- F-0067, F-0076, F-0081 and F-0084 bundled several problems. Their parts are covered by the clusters above. Two small parts are recorded only here: the booking reference has little visual weight on the confirmation, and at 375 px the tide table is below the fold.

## 5. Strengths to preserve

- Error summaries take focus, link to each field, keep the typed values, and repeat the message beside the field with an example of the right format. This is the GOV.UK pattern, done well.
- Berth cards give fit, tidal behaviour (afloat or drying) and price in the skipper's own terms.
- The review page states the total and "nothing is charged online", which matches the product facts.
- "Change dates", once found, returns a prefilled form, and the menu closes on Escape with focus restored.
- The tide table is a real data table with a caption and row headers. Forced-colours rendering keeps borders, radios and focus visible.
- Field help is in the skipper's terms: draught is "the depth of water your boat needs to float", and the mobile number is wanted because the office "sends a text if the gate times change".
- Token discipline in the CSS, a visible focus ring everywhere, 44 px targets and a reduced-motion path.

## 6. Divergent findings: questions for the owner and for user research

The raters produced no divergent severities. These remain open:

- **Visual identity (F-0059, F-0070, F-0080, F-0078; disputed).** All three critics judged the design generic and plain, with no identity layer of the harbour's own. Is a plain, utility look intended for this harbour? DESIGN.md does not exist, so the critics could not judge brand fit.
- **Rebooking for returning skippers (F-0047; disputed).** Is "same berth and boat as last time" in scope for launch?
- **For the first usability round:** do first-time skippers actually read "Boats up to 10 m" as LOA? Would they read the tide table as local time? These are predictions; a 5-skipper formative test settles them.

## 7. Fix ideas (after evaluation)

In priority order:
1. Replace the dead end with a recoverable error that names the limit and the boat's LOA, lists the berths that fit, and offers "Choose another berth". Better still, ask LOA (and draught) before the berth list and show only berths that fit.
2. Label the field "Length overall (LOA), in metres", say "LOA" on the berth cards, and validate against the selected berth on the same page.
3. Show tide times in local time (BST/GMT, labelled) next to the arrival-time select, with the gate window for the chosen date. Warn when the chosen time falls outside it.
4. Remove the `pageshow` reset (`app.js:164`) and pre-fill each step from the query. Add "Change" links on the review page and a visible "Back" on each step.
5. Explain MMSI and either make it optional or check its 9-digit format.
6. Put "Change dates" next to the stay summary as a visible link. Add the arrival time to the confirmation. Pick one noun, "visitor berth".
