# Debrief: audit-standard, Saltmarsh Quay visitor-berth booking

Run 20261007-095104-audit-standard, iteration 1, standard depth. Lead synthesis after verification and blind rating. The isolated roles were 3 heuristic evaluators, 1 cognitive walkthrough of `book-visitor-berth`, 3 design critics, 1 accessibility auditor, 1 code reviewer (review and locate), 2 verifier passes (the second for split parts) and 3 blind severity raters.

Evidence levels: the judged findings are reproduced by the verifier with `uie probe` (E1). No finding has been confirmed by the owner or observed with real skippers. Severities come from three blind raters. They are predictions of impact, not measurements.

## 1. What the passes agree on

These problems were detected by three or more independent passes, reproduced by the verifier and rated P0 or P1:

- **F-0006 (P0, 8 passes):** a boat longer than the chosen berth ends at "Booking stopped. This booking cannot continue. Reference BK-409." The page gives no reason, no way back and no alternative berth. Reproduced with Pontoon B, berth 14 and a 10.4 m boat. Source: `app.js:187` and `boat.html:70`.
- **F-0017 (P1, 8 passes):** the only tide data is a table captioned in UTC below the date form, while arrival times are local (BST on 17 October). The time options carry no time zone.
- **F-0008 (P1, 7 passes):** the only in-flow way to change dates is a "Change dates" link inside an unlabelled "…" menu on the berth list.
- **F-0022 (P1, 5 passes):** an arrival time when the sill gate is shut (08:00 on 17 October) is accepted with no warning, and the berth list repeats it back.
- **F-0023 (P1, 5 passes):** the Length field and the berth limits do not say whether "length" means length overall or hull length, or give a unit. A skipper who enters the hull length (9.6 m) can book Pontoon B, berth 14 for a 10.4 m boat.
- **F-0010 (P1, 4 passes):** the berth is chosen before the boat's length is asked, so a mismatch shows up only after the skipper has filled in the boat form.
- **F-0011 (P1, 3 passes, including the code reviewer):** the boat form is emptied every time the page is shown, including on Back from review (`app.js:165`, a `pageshow` handler calling `reset()`). This contradicts the principle "Never lose what a skipper has typed" and WCAG 3.3.7.
- **F-0037 (P1, 3 passes):** MMSI is required, with no explanation and no option for boats without DSC.
- **F-0066 (P1, 3 critics):** the tide and sill-gate window, the product's defining mechanism, has no visual form. It is a generic table detached from the time choice.

Any-two agreement within the heuristic panel is 59%, near the top of the 5–65% human range. 23 unique problems were found, against an estimated total of about 23.9; that figure is an estimate and optimistic with three passes.

## 2. Detector-only findings

The deterministic checks found no problem at gate level. Axe, keyboard, focus, reflow, contrast, targets, forms and live regions all ran clean on 5 routes × 6 widths. Both journeys replayed to success, and the static lint is clean. The detector-only hits are typographic polish at P3: TYP-14 (F-0001, tabular figures) and TYP-15 (F-0002 to F-0005, one-word last lines).

This is the main lesson of the run. **Every serious problem in this flow is invisible to automated checks**: the flow is technically accessible and completes, but it misleads or strands skippers.

## 3. Judge-only findings

All P0, P1 and P2 findings are judge-only. Single-pass (k = 1) findings that are confirmed but low-confidence by detection count:
- F-0018: the tide table is fixed to one week whatever the arrival date (P1, ease 4).
- F-0016, F-0039, F-0042, F-0045, F-0047, F-0049, F-0089, F-0035, F-0014 and F-0020 (P2).

They are worth a second look in a later pass or a user test.

## 4. Detector false positives and rejected candidates

- Critics 1 and 2 judged the TYP-14 hit (F-0001) a likely false positive: it flags the date labels in the tide table rather than compared figures. It stays at its rule-declared P3 and is recorded here as a suspected detector false positive against TYP-14.
- F-0065 and F-0068 ("the date control shows yyyy/mm/dd") were rejected at the harness filter. The placeholder comes from the capture browser's locale; an en-GB browser shows dd/mm/yyyy.
- F-0097 (the right side of the page is empty at wide widths) is **disputed** by the raters. The verifier noted it may be a deliberate reading column.

## 5. Strengths to preserve

- The error summaries take focus, link to each field, use plain words and keep what was typed. All 3 heuristic evaluators and the auditor noted this.
- Berth cards state the size limit, tide behaviour and price together. Native radios sit in a named group, and the full description is in each accessible name.
- Review states the total and "You pay at the harbour office when you arrive. Nothing is charged online.", which matches the brief.
- The draught field names its unit and explains the term. This is the model for the Length field.
- The "More options" menu follows the disclosure pattern (Escape closes it and returns focus). "Change dates" pre-fills every earlier choice. The problem is where the link is, not how it behaves.
- Forced-colours and colour-vision renderings keep borders, outlines and error text.

## 6. Divergent findings: questions for user research

The raters flagged no divergent findings. One is disputed (F-0097). Questions worth asking real skippers:
- Which length do skippers type when asked for "Length" with no qualifier: length overall, hull length or waterline? (F-0023)
- Do skippers read tide times in UTC and convert them, or take them as local? (F-0017)
- How many visiting boats lack an MMSI? (F-0037)
- Is a wide empty right side at desktop widths noticed at all, given the mostly-phone audience? (F-0097)

## 7. Fix ideas (after evaluation)

1. **F-0006 and F-0010 together.** Ask the length overall before showing berths, or on the date page, and then show only the berths the boat fits. If a mismatch still happens, replace the dead end with a page that names the cause ("Your boat is 10.4 m; Pontoon B, berth 14 takes boats up to 10 m"), lists the berths that fit, keeps the typed details and gives the office phone number. Narrowest layer: `app.js:187` and `boat.html:70`.
2. **F-0011.** Remove the `pageshow` reset at `app.js:165` and repopulate the boat fields from the query string when the skipper comes back.
3. **F-0017, F-0022, F-0018 and F-0066.** Show the gate window for the chosen date next to the arrival-time choice, in local time ("Gate open 13:10–17:10 BST"). Then warn or block when the chosen time is outside it. This is one change that answers four findings and the brief's first principle. It needs tide data keyed by date (ease 3–4).
4. **F-0023.** Relabel the field "Length overall (LOA) in metres, including bowsprit and davits", and say "LOA" on the berth limits.
5. **F-0008.** Put a visible "Change" link next to the stay summary on the berth list.
6. **F-0037, F-0090 and F-0089.** Explain MMSI, allow "My boat has no MMSI", and check for 9 digits.
7. **F-0019.** Carry the arrival time to the confirmation (`app.js:224` copies only date, nights and berth) and restate the gate window there.

## Process notes

- **Independence leak:** the `_comment` fields in `.ui-evaluator/journeys/*.json` describe a "seeded" problem (Change dates hidden in the menu) and name a ground-truth file. The heuristic evaluators, the walkthrough evaluator and the code reviewer saw these comments in their packets. Several flagged this themselves, and none opened the ground-truth file. F-0008 was reproduced by probe independently, but its detection count (7) is likely inflated, so treat its agreement as weaker than the number suggests. Recommendation: strip `_comment` from journey files.
- **Lead merges after verification:** 13 lead-reviewed proposals (L1–L13) merged duplicates that the deterministic key could not see: split parts that repeated existing findings, and the same mechanism raised at different locators. Each was listed by the verifier as a duplicate. Recorded in `merged.json` as `kind: "lead"`.
- **Splits:** 8 bundled candidates were split into 16 parts (`splits.json`) and verified by a fresh verifier.
- **Coverage gaps:** the change-arrival-date journey (core) had no dedicated walkthrough, although all three heuristic evaluators exercised it. No dark theme is configured. No screen-reader run was done (needs a human). Networks were not throttled.
- **Target mismatch:** `PRODUCT.md` targets L4 and `config.json` says L3. `uie gates --target L4` was run, and the rendered report recomputes gates against the config's L3. The achieved level is none against either target, so the conclusion does not change. Align the two files.
- **No DESIGN.md:** brand fit could not be judged by the critics.
