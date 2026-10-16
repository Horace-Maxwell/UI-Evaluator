# Round 5, 16 October 2026: a fixture shipped as a bundle, and the 2.3.0 skill

Round 4 left two questions. Its control without a browser read `tool-library`'s source and found 12 of 13 seeded defects from it, so the fixtures so far could not tell what the skill adds when the source is not there to read; and the changes released in 2.3.0 after round 4 (design notes for critics' remarks that name no harm, ADR-040; partial acceptance of same-cause proposals; one meaning of `advisory`; packet screens labelled by route; a verifier that starts its waiting checks first) had not been seen in use. This round ran eval 21 on a new fixture, `slot-booking`, which ships only as a minified bundle and a minified stylesheet, computes its colours at run time and seeds its problems in timing, geometry, computed colour, runtime order and state. Three runs per arm: the 2.3.0 skill, the same request without it, and the same request without it or a browser. `PLAN.md` beside this file fixed the nine questions before the runs; the graders' work is in `grading/`, the trace measures in `trace-check.json`.

## Summary

- **The skill met both release bars in all three runs, for the first time.** By the adjudicated mapping it found 13, 14 and 13 of the 14 seeded defects (the five deterministic ones in every run); its judged precision was 31/32 = 0.97, 33/35 = 0.94, 35/38 = 0.92, against the 0.8 bar (round 4: 0.71 to 0.78). Every run computed no level against a target of L3 and said so, with 0 report-lint violations and 9 of 9 script assertions.
- **The bundle did not take the source route away from the controls.** All six control runs read the minified `app.js` with the pages; the three without a browser re-implemented its slot generator and its run-time colours in Python and found 13, 12 and 13 of the 14 seeded defects (precision 0.90, 0.81, 0.86) in about 3 minutes for $1. With a browser the control found 12, 12 and 13 (precision 0.88, 0.77, 0.88). A minified bundle is still code this model reads.
- **One seeded defect separated the arms: the layout shift when the slots arrive (D02).** Every skill run reported it, from the deterministic layout-shift check; no control run did, with or without a browser, because it shows only as a measurement over time. The controls in turn found the slot length kept in a tooltip (D13) in all six runs, which the skill missed in two of three: one run never raised it, and in the other its verifier rejected the code reviewer's candidate because the candidate overstated its case.
- **The critics' remarks are out of the count, and that is most of the precision gain.** Of the critics' own candidates, 6, 9, 7 were kept as design notes, listed apart in each report and never rated; 5, 2, 0 critic-only findings were counted, all of them problems. The other judged findings were problems in 96%, 94%, 92% of cases, about what round 4 measured for them (100%, 93%, 100%). The fixture is different, so the comparison is indicative, not causal.
- **The 2.3.0 changes mostly show in use.** No inspector output carried `advisory`, no critic finding carried a folder for a route, the leads accepted parts of same-cause proposals, and one seeded defect reached a report as at most 7, 4 and 5 findings (round 4: 7, 8 and 10). The verifier used the fixture's expired-hold state, and ran the waits that only real time can check in the background, but not first, and once in the foreground.
- **Cost and time:** the skill took 51 min, 68 min, 56 min and $27.96, $26.80, $26.37 (round 4: 50 to 59 minutes, $29.51 to $37.09), about 24 times a control's cost. Two new skill problems are listed: same-cause proposals collapse on a one-line bundle, and the verifier rejects a true problem whose wording overstates it.

## 1. Objectives ("What do I need to know?")

Whether the skill finds more than a plain session when reading the source is not an option, and whether the changes released in 2.3.0 show in use. `PLAN.md` fixed nine questions and their pass conditions before the runs; its deviations (the second labeller's revision before any run, a sign-in that did not complete on 12 October, the runs on Claude Code 2.1.299) are logged there.

## 2. Tasks

Eval 21, `audit-standard-slot-booking`: "Residents will have to book a slot online before bringing anything to the recycling centre from next month, and the agency has handed over the booking site as a built bundle. Could you review the booking flow for usability and accessibility problems and tell me what to fix first? Most residents will book on a phone the evening before, and a lot of them use dark mode. The site is served from this folder." Three arms, three runs each, every run a top-level `claude -p` session (claude-opus-5-5, budget 80, Claude Code 2.1.299) in a fresh copy of the fixture served on 127.0.0.1, with the same shell allow-list and no web access: the 2.3.0 plugin; the same request without it, on this machine's PATH (Python Playwright reachable); and the same without it or a browser (only the system tools on the PATH). All nine started together on 16 October at 12:54 and finished within 69 minutes.

The fixture is Dunmore recycling centre's drop-off slot booking: four steps (a day and a 20-minute slot, the vehicle and waste, the details, the done page), light and dark themes, two journeys, delivered as one minified `app.js` and a minified stylesheet built from a readable source kept outside every workspace. Fourteen seeded defects, five deterministic (a layout shift when the slots arrive about a second late, the "Few left" tag's computed contrast of 3.0:1 and 3.2:1, the slot grid sized from the window and overflowing at 360 px, slot buttons whose focus ring a run-time style removes, a status line made live after its text) and nine judged (no loading state with an inert Next, today's started slots refused three steps later, the van permit rule behind an info button, a five-minute hold that lapses silently, a double press that cancels the booking, "Few left" slots moved out of time order, Change slot forgetting the day, the slot length only in a tooltip, a done page without the day, slot or vehicle). Calibration before the round: 5 of 5 deterministic defects detected, 0 false positives. A second blind labeller found 13 of the 14 before any run; the problems the fixture had not meant to have were fixed, and recall is against the 14 seeded defects.

## 3. Data

As in round 4: transcripts, the skill's run files, site hashes, time, tokens and cost; the nine script assertions of eval 21 (two for a control); for every run, two blind graders who mapped each reported problem to a seeded defect, to "real but not in the ground truth" or to "not a problem" from a packet holding only what the user received and the ground truth (neutral codes, no arm), an adjudicator for their splits (`grading/consensus-*.json`) and their agreement (`agree-graders.mjs`); `trace-check.mjs`; each control's tools and files from its transcript; and each skill run's phases from its transcript.

## 4. Analysis

As fixed in `PLAN.md`: recall by criterion and route (the script) and by meaning (the adjudicated mapping), with adjusted-Wald 95% intervals; precision over confirmed judged findings; arm means with n = 3 and no significance test; the controls' use of the bundle; the 2.3.0 changes against their pass conditions; level claimed against computed; report lint; the trace assertions; cost and time. Round 4's figures for comparison are the recorded ones in its report: its transcripts are no longer on this machine. Precision split by the role that reported a finding is the analysis round 4 added after its results; here it was decided before.

## 5. Results

### 5.1 Release bars, the skill runs

| Bar (EVALUATION-PLAN §6) | skill, run 1 | skill, run 2 | skill, run 3 |
|---|---|---|---|
| Recall by criterion and route (of 14) | 14/14 = 100% | 13/14 = 93% | 14/14 = 100% |
| Recall by meaning, adjudicated mapping (of 14) | 13/14 = 93% [66%–100%] | 14/14 = 100% [75%–100%] | 13/14 = 93% [66%–100%] |
|   judged defects (of 9) | 8/9 = 89% [54%–100%] | 9/9 = 100% [66%–100%] | 8/9 = 89% [54%–100%] |
|   deterministic defects (of 5) | 5/5 = 100% [51%–100%] | 5/5 = 100% [51%–100%] | 5/5 = 100% [51%–100%] |
| Precision after verification, judged findings | 31/32 = 97% [83%–100%] | 33/35 = 94% [80%–99%] | 35/38 = 92% [78%–98%] |
|   strict (in the ground truth only) | 26/32 = 81% [64%–91%] | 27/35 = 77% [61%–88%] | 29/38 = 76% [61%–87%] |
| Severity within band ± 0.5 (by mapping / by script) | 92% / 79% | 100% / 85% | 92% / 79% |
| Level claimed (target L3) | none | none | none |
| Report lint violations | 0 | 0 | 0 |
| Script assertions passed | 9 of 9 | 9 of 9 | 9 of 9 |
| Time, cost | 51 min, $27.96 | 68 min, $26.80 | 56 min, $26.37 |

All three runs clear both bars by either count. Runs 1 and 3 missed D13, the slot length kept in a tooltip (see 5.3); run 2 found all fourteen. The 32 to 38 judged findings held one to three the graders called not problems each. Severity landed within the band for 12 of 13, 14 of 14 and 12 of 13 found defects; Change slot forgetting the day (D12) was rated 3.0 against its band of 1–2 in two runs. The level claimed was none in every run, as computed, with the remaining checks named.

### 5.2 The skill against the two controls

|  | skill, run 1 | skill, run 2 | skill, run 3 | control, run 1 | control, run 2 | control, run 3 | no browser, run 1 | no browser, run 2 | no browser, run 3 |
|---|---|---|---|---|---|---|---|---|---|
| Problems reported (items the graders mapped) | 35 | 42 | 47 | 17 | 22 | 17 | 20 | 21 | 21 |
|   a seeded defect | 29 | 34 | 38 | 12 | 13 | 13 | 13 | 12 | 13 |
|   real, not in the ground truth | 5 | 6 | 6 | 3 | 4 | 2 | 5 | 5 | 5 |
|   not a problem | 1 | 2 | 3 | 2 | 5 | 2 | 2 | 4 | 3 |
| Seeded defects found (of 14) | 13/14 = 93% [66%–100%] | 14/14 = 100% [75%–100%] | 13/14 = 93% [66%–100%] | 12/14 = 86% [59%–97%] | 12/14 = 86% [59%–97%] | 13/14 = 93% [66%–100%] | 13/14 = 93% [66%–100%] | 12/14 = 86% [59%–97%] | 13/14 = 93% [66%–100%] |
|   judged (of 9) | 8/9 = 89% [54%–100%] | 9/9 = 100% [66%–100%] | 8/9 = 89% [54%–100%] | 8/9 = 89% [54%–100%] | 9/9 = 100% [66%–100%] | 9/9 = 100% [66%–100%] | 9/9 = 100% [66%–100%] | 8/9 = 89% [54%–100%] | 9/9 = 100% [66%–100%] |
|   deterministic (of 5) | 5/5 = 100% [51%–100%] | 5/5 = 100% [51%–100%] | 5/5 = 100% [51%–100%] | 4/5 = 80% [36%–98%] | 3/5 = 60% [23%–88%] | 4/5 = 80% [36%–98%] | 4/5 = 80% [36%–98%] | 4/5 = 80% [36%–98%] | 4/5 = 80% [36%–98%] |
| Precision over everything reported | 34/35 = 97% [84%–100%] | 40/42 = 95% [83%–100%] | 44/47 = 94% [82%–98%] | 15/17 = 88% [64%–98%] | 17/22 = 77% [56%–90%] | 15/17 = 88% [64%–98%] | 18/20 = 90% [69%–98%] | 17/21 = 81% [59%–93%] | 18/21 = 86% [65%–96%] |
| Grader agreement, defects (items) | 100% (100%) | 100% (98%) | 100% (100%) | 100% (94%) | 100% (95%) | 100% (100%) | 100% (100%) | 100% (48%) | 100% (100%) |
| Time | 51 min | 68 min | 56 min | 4 min | 3 min | 3 min | 3 min | 3 min | 4 min |
| Cost | $27.96 | $26.80 | $26.37 | $1.06 | $1.14 | $1.15 | $1.03 | $0.92 | $1.16 |

| Arm mean (n = 3) | Recall | Deterministic recall | Precision | Time | Cost |
|---|---|---|---|---|---|
| with the skill (judged precision) | 95% | 100% | 94% | 58 min | $27.04 |
| control with a browser | 88% | 73% | 85% | 4 min | $1.11 |
| control without a browser | 90% | 80% | 86% | 3 min | $1.04 |

Nine runs, three per arm. On recall the arms sit within two defects of one another: the skill 13 to 14 of 14, both controls 12 to 13; with n = 3 and intervals that overlap almost entirely, no difference is claimed. Two things the table shows do separate them. The deterministic defects: the skill found all five in every run, the controls three or four, always missing the layout shift and once the status line that is never announced. Precision: the skill's 92% to 97% of judged findings against 77% to 90% of everything the controls reported, whose misses were mostly speculative edge cases and advice without a harm. The cost is about 24 times the control's and the time about 17 times. The control without a browser did as well as the one with a browser.

### 5.3 Each defect, by run

Cells give the items mapped to the defect and, for the skill, the highest rated severity among them ("out" when none lands within the band ± 0.5).

| Defect | Kind | Criterion | Band | skill, run 1 | skill, run 2 | skill, run 3 | control, run 1 | control, run 2 | control, run 3 | no browser, run 1 | no browser, run 2 | no browser, run 3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D01 | judged | H1 | 2–3 | 1, 2.0 | 3, 3.0 | 3, 2.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D02 | deterministic | FUN-07 | 1–2 | 1, 2.0 | 1, 2.0 | 1, 2.0 | — | — | — | — | — | — |
| D03 | deterministic | 1.4.3 | 2–3 | 1, 3.0 | 4, 3.0 | 3, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D04 | deterministic | FUN-05 | 2–3 | 2, 3.0 | 3, 3.0 | 3, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D05 | deterministic | A11Y-04 | 2–3 | 1, 3.0 | 2, 3.0 | 3, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D06 | judged | H9 | 2–3 | 1, 3.0 | 2, 3.0 | 2, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D07 | judged | H6 | 2–3 | 7, 3.0 | 3, 3.0 | 5, 3.0 | 1 | 2 | 1 | 1 | 1 | 1 |
| D08 | judged | H1 | 2–3 | 5, 3.0 | 4, 3.0 | 5, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D09 | judged | H5 | 3–4 | 4, 4.0 | 3, 4.0 | 5, 4.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D10 | judged | 2.4.3 | 2–3 | 2, 4.0 | 3, 4.0 | 3, 4.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D11 | deterministic | A11Y-15 | 1–2 | 1, 2.0 | 1, 2.0 | 1, 2.0 | 1 | — | 1 | 1 | 1 | 1 |
| D12 | judged | H3 | 1–2 | 1, 3.0 (out) | 2, 3.0 | 3, 3.0 (out) | 1 | 1 | 1 | 1 | 1 | 1 |
| D13 | judged | H6 | 1–2 | — | 1, 2.0 | — | 1 | 1 | 1 | 1 | 1 | 1 |
| D14 | judged | H6 | 2–3 | 2, 3.0 | 2, 3.0 | 1, 3.0 | — | 1 | 1 | 1 | — | 1 |

The layout shift (D02) is the one defect no control found: it needs the page measured while the slots arrive, and the skill's layout-shift check reported it in every run (0.169 at 320 px, and above the budget at 1280 px). The slot length kept in a tooltip (D13) is the one the skill missed most: all six controls named it, while in skill run 1 no inspector raised it and in run 3 the code reviewer raised it ("Slot end time and arrival rule are only in a title tooltip") and the verifier rejected it as not reproduced because the intro says "20-minute slot" once above the slots, which the ground truth itself notes. The controls mapped one item to almost every defect; the skill one to seven, most for the permit rule (D07) and the hold (D08).

### 5.4 How the controls looked at the bundle

| Control run | Files read | Minified app.js read | Browser scripts written (runs that succeeded) | Screenshots read back | Shell commands (refused) |
|---|---|---|---|---|---|
| control, run 1 | 10 | yes | probe.py (1) | 3 | 5 (2) |
| control, run 2 | 10 | yes | walk.py (1) | 3 | 7 (3) |
| control, run 3 | 10 | yes | probe.py, probe2.py (2) | 2 | 8 (4) |
| no browser, run 1 | 10 | yes | none (0) | 0 | 7 (5) |
| no browser, run 2 | 10 | yes | none (0) | 0 | 3 (2) |
| no browser, run 3 | 10 | yes | none (0) | 0 | 7 (5) |

Every control read the four pages, the documents, the journeys, the stylesheet and the minified bundle first. The three with a browser then wrote a Python Playwright script (two in control run 3), ran it against the served site and read two or three screenshots back. The three without one had no Playwright, Node or npx: two tried `node` and got "command not found", their `curl` calls were refused by the sandbox, and each turned to Python instead. They computed the run-time colours from the bundle's hue (no-browser run 1: "few on fewbg: 3.42" in the dark theme, where the rendered value is 3.2:1) and two of them re-implemented the bundle's seeded slot generator to list which slots each day shows as "Few left" or full. From that reading they found the timing and state defects (the inert Next, the silent hold, the double press, the status line made live too late) as well as the browser controls did. What none of them found is the layout shift, which no reading of the code measures. So a minified bundle narrows the source route only slightly for this model; what it does not reach is behaviour that has to be measured.

### 5.5 The 2.3.0 changes, against the plan

| Measure (plan question) | Round 4 (runs 4, 5, 6) | skill, run 1 | skill, run 2 | skill, run 3 |
|---|---|---|---|---|
| Critics' candidates kept as design notes (named a harm) (4) | — (no design notes before 2.3.0) | 6 of 12 (6) | 9 of 11 (2) | 7 of 8 (1) |
| Critic-only judged findings counted, judged problems (4) | 11/34, 9/24, 11/27 | 5/5 | 2/2 | 0 |
| Every other judged finding, judged problems (4) | 46/46, 43/46, 45/45 | 26/27 | 31/33 | 35/38 |
| Report section "Design notes (not counted)" (4) | — | yes | yes | yes |
| Same-cause proposals listed (accepted, in part) (5) | 12 (4), 16 (9), 14 (5) | 10 (9, 9) | 3 (2, 2) | 3 (1, 1) |
| Most items mapped to one seeded defect (5) | 7, 8, 10 | 7 | 4 | 5 |
| Inspector outputs carrying `advisory` (6) | 2 confirmed in run 4 | 0 | 0 | 0 |
| Critic locations with a folder for a route (6) | 19 to 36 a run | 0 | 0 | 0 |
| Advisory tool observations kept as candidates / confirmed (2.3.0, ADR-038) | 10 / 0 each | 10 / 0 | 10 / 0 | 10 / 0 |
| First verification pass, wall time (7) | 14.3 min, 13.1 min, 6.4 min | 4.6 min | 10.0 min | 7.5 min |
| Second pass over split parts (7) | 4.5, 4.3, 5.7 min | 1.4 min | 16.5 min | 12.6 min |
| Turn ends with work still running | 0, 0, 0 | 0 | 0 | 0 |
| Code reviewer's source locations, in the bundle (9) | — | 74 (59 at app.js:1) | 79 (64 at app.js:1) | 89 (70 at app.js:1) |

Question by question. (4) ADR-040 in use: fixed. Each run kept most of its critics' remarks as design notes (6 of 12, 9 of 11, 7 of 8), listed under "Design notes (not counted)"; the critics' candidates that named a harm went through verification, and the 5, 2 and 0 critic-only findings that were counted were all judged problems, against round 4's 11 of 34, 9 of 24 and 11 of 27. The other judged findings scored about what round 4's did, so the precision gain comes from what ADR-040 leaves out; on a different fixture that is indicative, not proof. (5) Partial acceptance: used in every run (parts of 9, 2 and 1 proposals) and the most findings on one defect fell to 7, 4 and 5; but on this fixture the proposals themselves were wrong-sized, see problem 1. (6) One meaning of advisory and screens by route: fixed, 0 and 0 in every run. (7) The verifier and its waiting checks: the waits ran in the background (three probes of 313 to 320 seconds in runs 1 and 2) but not first (they were the 16th to 33rd of 39 to 58 calls), and run 2's second pass waited out the hold in the foreground for 510 seconds, which made it 16.5 minutes long. Every run's verifiers used the fixture's expired state (`hold=expired`) for the end of the hold (2 to 4 verdicts a run) and waited in real time only to check that nothing warns before it lapses, which no state can show. (8) Honesty and trace: met, see 5.6. (9) The code reviewer on a bundle: its locate pass found the minified code by text search and attached 59 to 70 locations a run to `app.js` line 1 with low confidence; every reply told the owner that the source is minified, that the static checks could not read it, and that fixes go either into the bundle or to the agency.

### 5.6 Process measures, the skill runs

| Measure | skill, run 1 | skill, run 2 | skill, run 3 |
|---|---|---|---|
| Confirmed findings (judged) | 35 (32) | 42 (35) | 47 (38) |
| Rater agreement on severity, Krippendorff α (ordinal) | 0.91 over 28 findings, 3 raters | 0.88 over 33 findings, 3 raters | 0.87 over 38 findings, 3 raters |
| Any-two agreement among heuristic evaluators | 62% | 45% | 37% |
| Seeded defects per inspector, λ | 0.40 | 0.40 | 0.39 |
| Found by the 3 heuristic evaluators together | 57% | 57% | 64% |
| Found by all inspectors together | 79% | 93% | 79% |
| Black-box roles that read no source | 16 of 16 | 16 of 16 | 15 of 15 |
| Heuristic packets carrying the walkthrough answer key | 0 of 3 | 0 of 3 | 0 of 3 |
| Failed reads by subagents (schema, evidence, other) | 0, 0, 0 | 0, 0, 0 | 1, 0, 0 |
| Sandbox refusals (harness) | 32 | 18 | 29 |
| First inspector started, minutes into the session | 8.7 | 9.0 | 8.5 |

The process held. Three raters agreed on severity at α = 0.91, 0.88 and 0.87; no black-box subagent read the site's files; no heuristic packet carried the walkthrough's answer key; one subagent read of a schema failed in run 3. Every lead ran `uie audit` in the background and started the inspectors 8.5 to 9 minutes into the session (round 4: about 7), and no lead ended its turn with work running.

### 5.7 Problems in the skill seen in this round

1. **Same-cause proposals collapse on a one-line bundle.** The code reviewer located findings in the minified `app.js` by text search, so 59 to 70 locations a run sit on line 1 with low confidence and no column. Proposals group findings located within three lines of one file, so each run got one proposal of 31, 35 and 38 members, and after each partial acceptance the remainder came back as a new proposal (run 1 listed ten, from 31 members down to 20). The leads coped by accepting two or three members at a time. Locations found by text search, or in a file whose lines are minified, should not seed same-cause proposals; a column, when the reviewer has one, should.
2. **The verifier rejects a true problem whose wording overstates it.** In run 3 the code reviewer's candidate said the slot's end time is "only in a title tooltip"; the verifier found the intro's single "20-minute slot" and rejected the whole candidate as not reproduced, and the seeded defect (D13) went unreported. Its instructions say to flag wording that overstates the evidence and to confirm a real problem with the right criterion; a candidate that is true in substance and overstated in one clause should be confirmed with the wording corrected, not rejected.
3. **Waiting checks still come late.** To check that nothing warns before the five-minute hold lapses, a verifier has to wait it out; the verifiers did so in probes of five to eleven minutes, in the background as 2.3.0 asks, but as the 16th to 33rd of their calls rather than first, and run 2's second pass waited 510 seconds in the foreground, which made it 16.5 minutes long. The instruction alone did not change the order; the packet could list time-bound candidates first, or the lead could give them a part of their own.
4. **The static checks cannot read a minified bundle**, and every reply said so; it is a limit of the lint layer rather than a defect, and the round shows the browser checks carry the deterministic work on a bundle.

## 6. Limitations

- n = 3 runs per arm; no significance test is claimed and the intervals are wide (13 of 14 has a lower bound of 66%).
- The precision comparison with round 4 crosses fixtures: `slot-booking` is a different site with a different ground truth, built after the critics' problem was known. The split by role (critic-only findings against the rest) is the better evidence for ADR-040, and it is still from one round.
- The ground truth has 14 seeded defects and no found ones; the problems the graders judged real but not seeded (2 to 6 a run in every arm) are counted in precision but not in recall.
- The runs, the graders, the adjudicators and the second labeller are instances of the same model family; the mapping is blind to the arm, not independent of the model.
- The control without a browser ran on the same machine with a reduced PATH and could read every file.
- Round 4's transcripts were removed from this machine by its temporary-file cleanup before this round, so round 4's figures are the recorded ones, not re-measured.

## 7. Next steps

- Fix the two clearest problems: keep text-search and minified-file locations out of same-cause proposals, and have the verifier confirm a real problem with corrected wording instead of rejecting it for one overstated clause.
- List time-bound candidates first in the verifier's packet, or give them a part of their own, and measure whether the waiting checks then start first.
- Keep this fixture and run it again after those fixes; three runs per arm put the precision bar's margin (the lowest interval is 78% to 98%) on the record, and a fourth run of the controls would show whether D02 is ever found without a measurement.
- Say plainly in the READMEs what this round adds to the answer of round 4: the skill met both bars on a fixture whose problems are behavioural, found the one defect that needs a measurement, and was more precise than the controls; on everything else a plain session, even without a browser, found as much for about 4% of the cost.

