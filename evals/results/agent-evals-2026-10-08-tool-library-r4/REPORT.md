# Round 4, 8–9 October 2026: the fixed skill, three runs per arm, and a control without a browser

Round 3 left four skill problems with a clear cause and three open questions: whether the bars hold over more than two runs, whether a second labeller agrees with the fixture's ground truth, and what the control finds without a browser. This round answers them on the same fixture with the same prompt, three complete runs per arm, after the four changes were made (`cd5583f`) and after a second labeller's review added thirteen found defects to the ground truth. `PLAN.md` beside this file fixed the nine questions before the runs; the graders' work is in `grading/`, the trace measures in `trace-check.json`.

## Summary

- **The skill met the recall bar in all three runs and the precision bar in none.** By the adjudicated mapping it found 12, 13 and 13 of the 13 seeded defects (24, 23 and 24 of all 26); its judged precision was 57/80 = 0.71 [60–80%], 52/70 = 0.74 [63–83%] and 56/72 = 0.78 [67–86%] against the 0.8 bar. Every run computed no level against a target of L3 and said so, with 0 report-lint violations and 8 of 9 script assertions.
- **Three of the four changes show in use; same-cause grouping does not yet.** No lead ended its turn while work was running (round 3: 12 times a run), `uie audit` ran in the background and the inspectors started 6 minutes in (round 3: 14), the first verification pass ran in three parallel parts and took 6 to 14 minutes (round 3: 16 and 23 with one verifier), and every advisory tool observation stayed a candidate, listed apart in the report. Runs took 50 to 59 minutes (round 3: 65 and 68) and cost $29.51 to $37.09, no less than before. The leads accepted 4, 9 and 5 of 12, 16 and 14 same-cause proposals, and one seeded defect still reached the report as up to 7, 8 and 10 findings (round 3: 9 and 6).
- **The control found every seeded defect with a browser and all but one without.** With Python Playwright on its PATH it found 13 of 13 in all three runs (precision 0.88, 0.96, 0.96) in 3 minutes for about $1. With only the system tools it found 12 of 13 in all three (precision 0.89, 0.77, 0.93) in 2.5 minutes for $0.85: it read all eleven files, computed the dark badge's 3.07:1 contrast in Python from the stylesheet's colours, and wrote no browser script. The fixture was built so that its problems show only in use; for this model, reading the source finds nearly all of them.
- **Where the skill differs is the problems nobody seeded, verification and the record, at about 33 times the cost.** Over all 26 defects it found 23 to 24 against the controls' 19 to 21; but the found defects were chosen from what round-3 reviews reported, all thirteen of them in a skill run's report, so that figure favours the skill. Over the ten found defects a round-3 control had also reported, the skill found 9, 9 and 9, the control 7, 7 and 7, the control without a browser 9, 8 and 7. Every judged finding was re-checked on the live site by a verifier and rated by three blind raters (α 0.81 to 0.89).
- **The design critics' findings are what keeps precision under the bar** (an analysis added after seeing the results, not in the plan). Findings that only the design critics reported were judged problems in 11 of 34, 9 of 24 and 11 of 27 cases; every other judged finding in 46 of 46, 43 of 46 and 45 of 45. In runs 4 and 6 every judged finding the graders called not a problem came from the critics alone; round 3's runs split the same way (0.52 and 0.41 against 0.95 and 0.80).
- **Three new skill problems:** a same-cause proposal can be accepted only whole, so the leads rejected groups that mixed causes and their true duplicates stayed apart; the accessibility auditor's "advisory findings" share the `advisory` field with ADR-038's observations, so two of them were verified, rated (one P1) and promoted in run 4 while the register calls them advisory; and the screens in every packet are labelled by their evidence folder instead of their route, so the design critics' findings carry routes such as `items-ladder-3m`.

## 1. Objectives ("What do I need to know?")

Whether the four skill changes made after round 3 (CHANGELOG Unreleased: advisory observations are not findings, ADR-038; same-cause proposals before rating, ADR-039; parallel verifiers; the audit workflow keeps the turn, runs the deterministic checks in the background and cites strengths at audited widths) show in use; whether the standard-audit bars hold over three runs rather than one or two; and what a control without a browser finds, beside one with a browser, on a fixture whose problems were built to show only in use. `PLAN.md` beside this file fixed the nine questions and their pass conditions before the runs; its deviations are logged there with their times.

## 2. Tasks

Eval 20, `audit-standard-tool-library`, the same prompt as round 3: "Our community tool library opens online reservations to members next month. Could you review the reservation flow for usability and accessibility problems and tell me what to fix first? Most members use it on a phone in the evening, and a lot of them have dark mode on. The site is served from this folder." Three arms, three runs each, every run a top-level `claude -p` session (claude-opus-5-5, budget 80, Claude Code 2.1.288) in a fresh copy of the fixture served on 127.0.0.1, with the same shell allow-list and no web access:

- with the skill: the plugin as committed in `cd5583f` (the four changes and the verifier-partition fix; version string 2.2.0). Runs 1 to 3 were cut off after 14 to 15 minutes by an account's weekly usage limit and are kept as terminated; runs 4 to 6 replace them, on the same binary, model, snapshot and prompt;
- without the skill, with this machine's PATH (Python Playwright reachable, as in round 3);
- without the skill and without a browser: a PATH holding only the system tools (`/usr/bin:/bin:/usr/sbin:/sbin`, `PYTHONNOUSERSITE=1`), so no Playwright, Node or npx. This approximates a machine without a browser driver; it is the same machine.

The fixture is `tool-library` (Fernhill Tool Library reservations: five pages, light and dark themes, two journeys). Its ground truth was revised before any round-4 run was graded, as the plan allowed: a second blind labeller found all 13 seeded defects (four deterministic, nine judged) with overlapping severity bands, and thirteen problems the fixture did not seed were added as found defects, D14 to D26, each reproduced by that labeller and reported independently by at least two round-3 reviews. Recall is given against the 13 seeded defects, comparable with round 3 (D26, which refines D07, counts toward D07), and against all 26.

## 3. Data

Transcripts, the skill's run files, site hashes, time, tokens and cost; the nine script assertions of eval 20 (two for a control); for every complete run, two blind graders who mapped each reported problem to a ground-truth defect, to "real but not in the ground truth" or to "not a problem" from a packet holding only what the user received and the ground truth (neutral packet codes, no arm), an adjudicator who settled their splits (`grading/consensus-*.json`) and their agreement (`agree-graders.mjs`); `trace-check.mjs` over the skill runs; and, from the transcripts, each control's use of the site and each skill run's phases (when the deterministic checks started and ended, when the first inspector started, the verifiers' wall time, and how many times the lead ended its turn with work still running).

## 4. Analysis

As fixed in `PLAN.md`: recall by criterion and route (the script) and by meaning (the adjudicated mapping) with adjusted-Wald 95% intervals; precision over confirmed judged findings; the arm means with n = 3 complete runs per arm and no significance test; the four skill changes against their pass conditions; the controls' browser use; level claimed against computed; report lint; the trace assertions; cost and time; and skill problems with evidence. Round 3's transcripts were measured with the same phase script, so its figures beside round 4's come from one instrument.

## 5. Results

### 5.1 Release bars, the complete skill runs

| Bar (EVALUATION-PLAN §6) | skill, run 4 | skill, run 5 | skill, run 6 |
|---|---|---|---|
| Recall by criterion and route (of 13 seeded) | 13/13 = 100% | 13/13 = 100% | 13/13 = 100% |
| Recall by meaning, adjudicated mapping (of 13 seeded) | 12/13 = 92% [65%–100%] | 13/13 = 100% [73%–100%] | 13/13 = 100% [73%–100%] |
|   judged defects (of 9) | 8/9 = 89% [54%–100%] | 9/9 = 100% [66%–100%] | 9/9 = 100% [66%–100%] |
|   deterministic defects (of 4) | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] |
|   all ground-truth defects, found ones included (of 26) | 24/26 = 92% [75%–99%] | 23/26 = 88% [70%–97%] | 24/26 = 92% [75%–99%] |
| Precision after verification, judged findings | 57/80 = 71% [60%–80%] | 52/70 = 74% [63%–83%] | 56/72 = 78% [67%–86%] |
|   strict (in the ground truth only) | 50/80 = 63% [52%–72%] | 47/70 = 67% [55%–77%] | 50/72 = 69% [58%–79%] |
| Severity within band ± 0.5 (by mapping / by script) | 79% / 72% | 87% / 72% | 92% / 62% |
| Level claimed (target L3) | none | none | none |
| Report lint violations | 0 | 0 | 0 |
| Script assertions passed | 8 of 9 | 8 of 9 | 8 of 9 |
| Time, cost | 55 min, $37.09 | 50 min, $29.51 | 59 min, $33.56 |

All three runs clear the recall bar, by the script's criterion matcher and by the graders' mapping. Run 4 missed D13, the Change link that drops the chosen session (it reported the details the same link clears, D22); runs 5 and 6 described the 'Reserve this tool' dead end as the unfinished reservation (D26, which refines D07) rather than as the short toast, so D07 counts through D26. None of the three clears the precision bar, though each interval reaches it (run 4's only just, 60–80%): 23, 18 and 16 of the 80, 70 and 72 judged findings were judged not problems. Severity landed within the band for 19 of 24, 20 of 23 and 22 of 24 found defects; the raters rated D07 at 3.0 against its band of 1–2 in run 4, as round 3's raters did, and rated several found defects with narrow bands higher than the two labellers (D23 at 3.0 in all three runs against 2, D24 at 2.0 against 1). The level claimed was none in all three runs, the computed value, with the remaining checks named.

### 5.2 The skill against the two controls, three runs per arm

|  | skill, run 4 | skill, run 5 | skill, run 6 | control, run 1 | control, run 2 | control, run 3 | no browser, run 1 | no browser, run 2 | no browser, run 3 |
|---|---|---|---|---|---|---|---|---|---|
| Problems reported (items the graders mapped) | 89 | 80 | 86 | 24 | 24 | 25 | 27 | 31 | 27 |
|   a ground-truth defect | 58 | 56 | 63 | 20 | 21 | 20 | 21 | 22 | 20 |
|   real, not in the ground truth | 7 | 5 | 6 | 1 | 2 | 4 | 3 | 2 | 5 |
|   not a problem | 24 | 19 | 17 | 3 | 1 | 1 | 3 | 7 | 2 |
| Seeded defects found (of 13) | 12/13 = 92% [65%–100%] | 13/13 = 100% [73%–100%] | 13/13 = 100% [73%–100%] | 13/13 = 100% [73%–100%] | 13/13 = 100% [73%–100%] | 13/13 = 100% [73%–100%] | 12/13 = 92% [65%–100%] | 12/13 = 92% [65%–100%] | 12/13 = 92% [65%–100%] |
|   judged (of 9) | 8/9 = 89% [54%–100%] | 9/9 = 100% [66%–100%] | 9/9 = 100% [66%–100%] | 9/9 = 100% [66%–100%] | 9/9 = 100% [66%–100%] | 9/9 = 100% [66%–100%] | 8/9 = 89% [54%–100%] | 9/9 = 100% [66%–100%] | 8/9 = 89% [54%–100%] |
|   deterministic (of 4) | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] | 3/4 = 75% [29%–97%] | 4/4 = 100% [45%–100%] |
| All defects found (of 26) | 24/26 = 92% [75%–99%] | 23/26 = 88% [70%–97%] | 24/26 = 92% [75%–99%] | 20/26 = 77% [58%–89%] | 21/26 = 81% [62%–92%] | 20/26 = 77% [58%–89%] | 21/26 = 81% [62%–92%] | 21/26 = 81% [62%–92%] | 19/26 = 73% [54%–87%] |
| Precision over everything reported | 65/89 = 73% [63%–81%] | 61/80 = 76% [66%–84%] | 69/86 = 80% [71%–87%] | 21/24 = 88% [68%–96%] | 23/24 = 96% [78%–100%] | 24/25 = 96% [79%–100%] | 24/27 = 89% [71%–97%] | 24/31 = 77% [60%–89%] | 25/27 = 93% [76%–99%] |
| Grader agreement, defects (items) | 100% (96%) | 100% (100%) | 100% (99%) | 100% (free text) | 100% (free text) | 100% (100%) | 100% (free text) | 100% (free text) | 100% (free text) |
| Time | 55 min | 50 min | 59 min | 3 min | 3 min | 3 min | 2 min | 3 min | 2 min |
| Cost | $37.09 | $29.51 | $33.56 | $1.04 | $0.98 | $0.98 | $0.83 | $0.88 | $0.84 |
| Subagent messages | 507 | 483 | 510 | 0 | 0 | 0 | 0 | 0 | 0 |

| Arm mean (n = 3) | Seeded recall | All-defect recall | Precision | Time | Cost |
|---|---|---|---|---|---|
| with the skill (judged precision) | 97% | 91% | 74% | 55 min | $33.39 |
| control with a browser | 100% | 78% | 93% | 3 min | $1.00 |
| control without a browser | 92% | 78% | 86% | 3 min | $0.85 |

Nine runs, three per arm. On the seeded defects the arms are not told apart: 12 or 13 of 13 in every run, and the four deterministic defects in every skill and browser-control run (the control without a browser missed the overflow at 320 px once). The arms differ in three ways. Volume: the controls wrote 24 to 31 problems, the skill confirmed 80 to 89 findings. Precision: 0.77 to 0.96 for the controls over everything they reported, 0.71 to 0.78 for the skill's judged findings. Cost and time: $0.83 to $1.04 and 2.4 to 3.1 minutes against $29.51 to $37.09 and 50 to 59 minutes, about 33 times the cost of the control with a browser and 39 times the one without. With n = 3 per arm no significance test is claimed; the intervals on seeded recall overlap entirely, those on cost do not. The control without a browser was as good as the one with it on recall, within one defect, and a little less precise in one run (seven items judged not problems in no-browser run 2: small technical claims in which the graders saw no harm to a member).

### 5.3 Each defect, by run

Cells give the items mapped to the defect and, for the skill, the highest rated severity among them ("out" when no item lands within the band ± 0.5).

Seeded defects:

| Defect | Kind | Criterion | Band | skill, run 4 | skill, run 5 | skill, run 6 | control, run 1 | control, run 2 | control, run 3 | no browser, run 1 | no browser, run 2 | no browser, run 3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D01 | judged | CW-Q2 | 2–3 | 7, 4.0 | 5, 4.0 | 6, 4.0 | 1 | 1 | 1 | 1 | 2 | 2 |
| D02 | judged | H1 | 2–3 | 2, 3.0 | 2, 2.7 | 2, 2.7 | 1 | 1 | 1 | 1 | 1 | 1 |
| D03 | judged | CW-Q3 | 2–3 | 6, 3.0 | 8, 3.0 | 7, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D04 | deterministic | 1.4.3 | 2–3 | 3, 3.0 | 4, 3.0 | 5, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D05 | deterministic | FUN-05 | 2–3 | 4, 3.0 | 4, 3.0 | 4, 3.0 | 1 | 1 | 1 | 1 | — | 1 |
| D06 | judged | H5 | 2–3 | 2, 3.3 | 3, 3.0 | 3, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D07 | judged | H1 | 1–2 | 3, 3.0 (out) | — | — | 1 | 1 | 1 | 1 | 1 | 1 |
| D08 | deterministic | 2.4.11 | 2–3 | 3, 3.0 | 3, 3.0 | 10, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D09 | deterministic | 2.1.2 | 2–4 | 2, 4.0 | 4, 4.0 | 3, 4.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D10 | judged | H1 | 2–4 | 3, 4.0 | 3, 4.0 | 2, 4.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D11 | judged | 2.4.3 | 2–3 | 6, 3.0 | 2, 3.0 | 3, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D12 | judged | H5 | 3–4 | 2, 3.3 | 2, 3.0 | 3, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D13 | judged | H3 | 1–2 | — | 1, 2.0 | 1, 2.0 | 1 | 1 | 1 | — | 1 | — |

Found defects, added after the second labeller:

| Defect | Criterion | Band | skill, run 4 | skill, run 5 | skill, run 6 | control, run 1 | control, run 2 | control, run 3 | no browser, run 1 | no browser, run 2 | no browser, run 3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| D14 | H5 | 3–4 | 2, 3.0 | 1, 3.0 | 1, 3.3 | 1 | 1 | 1 | 1 | 1 | 1 |
| D15 | H5 | 2–3 | 1, 2.0 | 2, 3.0 | 1, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D16 | 4.1.2 | 1–2 | 1, 2.0 | — | 1, 2.0 | — | — | — | 1 | — | — |
| D17 | H5 | 2–3 | 2, 2.0 | 2, 2.3 | 1, 2.7 | 1 | 1 | 1 | 1 | 1 | 1 |
| D18 | H1 | 2–3 | 2, 2.7 | 2, 2.7 | 2, 3.0 | 1 | 1 | 1 | 1 | 1 | 1 |
| D19 | 4.1.3 | 2–2 | 1, 3.0 (out) | 1, 2.7 (out) | — | — | — | 1 | 1 | 1 | 1 |
| D20 | H6 | 1–2 | 1, 3.0 (out) | 1, 2.3 | 1, 2.0 | — | — | 1 | 1 | 1 | — |
| D21 | H5 | 2–2 | 1, 2.0 | 1, 2.0 | 1, 2.3 | 1 | 1 | 1 | 1 | 1 | 1 |
| D22 | 3.3.7 | 2–2 | 1, 3.0 (out) | 1, 2.0 | 1, 2.0 | 1 | 1 | — | — | — | — |
| D23 | CW-Q1 | 2–2 | 1, 3.0 (out) | 2, 3.0 (out) | 1, 3.0 (out) | — | 1 | — | — | 1 | — |
| D24 | H8 | 1–1 | — | 1, 2.0 (out) | 1, 2.0 (out) | 1 | 1 | — | 1 | 1 | 1 |
| D25 | H2 | 1–2 | 1, 2.0 | — | 1, 2.0 | — | — | — | — | — | — |
| D26 (refines D07) | CW-Q1 | 3–4 | 1, 3.3 | 1, 3.7 | 2, 3.3 | — | — | — | — | — | — |

The controls mapped one item to almost every defect they found. The skill mapped one to ten: the fixed bar (D08) arrived as ten findings in run 6, the cut names (D03) as six to eight, the phone-width reorder (D01) as five to seven, the reversed sessions (D11) as two to six, the dark contrast (D04) as three to five. Of the found defects, the unfinished reservation (D26) was reported by every skill run and by no control: the controls described the same moment as the 1.2-second toast (D07), and the mapping instructions keep the two apart. The loan-length button named only by its value (D16) and the filter label that misdescribes the filter (D25) were found almost only by the skill; the error that is not announced (D19) was found by every control run without a browser, which read the markup, by two of the three skill runs and by one control run with a browser.

### 5.4 How the controls looked at the site

| Control run | Source files read | Browser script written | Script runs (succeeded) | Screenshots read back | Shell commands (refused by the sandbox) |
|---|---|---|---|---|---|
| control, run 1 | 11 | probe.py | 1 (1) | 3 | 7 (3) |
| control, run 2 | 11 | probe.py | 1 (1) | 3 | 8 (3) |
| control, run 3 | 11 | probe.py | 1 (1) | 2 | 4 (2) |
| no browser, run 1 | 11 | none | 0 (0) | 0 | 3 (2) |
| no browser, run 2 | 11 | none | 0 (0) | 0 | 3 (2) |
| no browser, run 3 | 11 | none | 0 (0) | 0 | 3 (2) |

All six control runs read the whole fixture first: the two documents, the two journeys, the five pages, the script and the stylesheet, by `cat` or the Read tool. The three with a browser then probed for Playwright (`python3 -c "import playwright"` succeeded; listing its cache was refused), wrote `probe.py`, ran it once against the served site and read two or three screenshots back. The three without a browser had no Playwright, Node or npx on their PATH: one tried `node` and got "command not found", one tried `curl` and was refused by the sandbox, and each computed contrast ratios with Python from the stylesheet's hex values ("dark badge ok 3.07"). None wrote a browser script or read a screenshot, and each found 12 of the 13 seeded defects, among them the deterministic ones, read from the source: the dark badge's contrast from its colours, the overflow from the stylesheet's 330 px minimum column (two runs of three), the fixed bar from its CSS, the Tab trap from the key handler. They missed the Change link that drops the session twice and the overflow once. So on this fixture a control does not need a browser; what it needs is the source.

### 5.5 The four changes, against the plan

| Measure (plan question) | Round 3, runs 1 and 3 | skill, run 4 | skill, run 5 | skill, run 6 |
|---|---|---|---|---|
| Turn ends with work still running (4) | 12 and 12 | 0 | 0 | 0 |
| `uie audit` run in the background (5) | no and no | yes | yes | yes |
| Deterministic phase, first check to first inspector (5) | 14.1 min and 13.6 min | 6.1 min | 5.9 min | 6.0 min |
| Inspectors started while `uie audit` ran (5) | no and no | yes | yes | yes |
| First verification pass, wall time (verifiers in it) (5) | 15.8 min (1) and 22.6 min (1) | 14.3 min (3) | 13.1 min (3) | 6.4 min (3) |
| Second pass over split parts (5) | 6.0 min and 6.0 min | 4.5 min | 4.3 min | 5.7 min |
| Verifier packets in parts (`verifier-p<k>.json`) (5) | — | 3 | 3 | 3 |
| Advisory tool observations: kept as candidates / confirmed / promoted (2) | — | 10 / 0 / 0 | 10 / 0 / 0 | 10 / 0 / 0 |
| Report section "Advisory observations (not counted)" (2) | — | yes | yes | yes |
| Inspector findings flagged advisory, confirmed (2) | — | 2 (F-0030, F-0035) | 0 | 0 |
| Same-cause proposals listed (accepted) (3) | — | 12 (4) | 16 (9) | 14 (5) |
| Most items the graders mapped to one seeded defect (3) | 9 and 6 | 7 | 8 | 10 |
| Whole run | 65 min and 68 min | 55 min | 50 min | 59 min |

Question by question against the plan. (2) Advisory observations: fixed. Each run kept its ten advisory tool hits (APCA and stranded-word measurements) as candidates; none was verified, confirmed, rated or promoted, and each report lists them under "Advisory observations (not counted)". Separately, run 4's accessibility auditor marked two of its own findings advisory, as its instructions say for forced-colour failures; those went through verification and rating like any finding (see problem 3). (3) Same-cause grouping: still present. The proposals were listed after `--apply-locate` in every run and the leads accepted the ones that described one problem, but they rejected groups that mixed causes, so the most findings mapped to one seeded defect was 7, 8 and 10 against round 3's 9 and 6 (the plan's comparison figure, "9 and 8", were run 1's two largest). (4) Keeping the turn: fixed. No run was terminated by the harness and no lead ended its turn while subagents or shell tasks ran; the leads waited with the Monitor tool and blocking shell loops. (5) Parallel verifiers and the background audit: fixed. Every lead started `uie audit` in the background and spawned the seven black-box inspectors while it ran, so the first inspector started 6 minutes after the first check instead of 14; every lead split verification into three parts. The first pass took 14.3, 13.1 and 6.4 minutes; the two longer ones held the candidates whose check waits out the basket's ten-minute hold. (6) Strengths at audited widths: fixed. The replies list 5, 4 and 4 things to keep; all thirteen hold at 375 px. Two are narrower than worded: run 4's "search counts are announced" holds only for a search that matches (an empty search announces nothing, which the same reply reports), and run 5's "the calendar marks which days are open" holds through the accessible names and a dot whose meaning the page does not explain at that width (D20). (9) Honesty and trace: met. Level none, as computed; report lint 0; the trace assertions below.

### 5.6 Process measures, the complete skill runs

| Measure | skill, run 4 | skill, run 5 | skill, run 6 |
|---|---|---|---|
| Confirmed findings (judged) | 89 (80) | 80 (70) | 86 (72) |
| Rater agreement on severity, Krippendorff α (ordinal) | 0.87 over 76 findings, 3 raters | 0.81 over 67 findings, 3 raters | 0.89 over 70 findings, 3 raters |
| Any-two agreement among heuristic evaluators | 43% | 59% | 49% |
| Seeded defects per inspector, λ (lecture curve) | 0.44 | 0.46 | 0.48 |
| Found by the 3 heuristic evaluators together | 62% | 77% | 77% |
| Black-box roles that read no source | 15 of 15 | 15 of 15 | 15 of 15 |
| Heuristic packets carrying the walkthrough answer key | 0 of 3 | 0 of 3 | 0 of 3 |
| Failed reads by subagents (schema, evidence, other) | 0, 0, 1 | 0, 1, 0 | 0, 0, 0 |
| Sandbox refusals (harness) | 36 | 32 | 16 |
| Subagents | 17 | 17 | 17 |

The process measures repeat round 3's. Three raters agreed on severity at α = 0.87, 0.81 and 0.89; any-two agreement among the heuristic evaluators was 43%, 59% and 49% (round 3: 29% and 32%); λ, the per-inspector discovery rate on the seeded set, 0.44, 0.46 and 0.48, so the three heuristic evaluators together found 62%, 77% and 77% of the seeded defects and all nine inspectors 92%, 100% and 100%. No black-box subagent read the site's source (15 of 15 in each run), no heuristic packet carried the walkthrough's answer key, one subagent read failed in each of runs 4 and 5, and the sandbox refused 36, 32 and 16 shell commands, mostly the leads' attempts at wrappers and variables, which cost turns.

### 5.7 The cut-off runs

| Run | Minutes | Turns | Cost |
|---|---|---|---|
| skill, run 1 | 14.4 | 37 | $8.47 |
| skill, run 2 | 14.3 | 32 | $8.75 |
| skill, run 3 | 14.5 | 33 | $9.06 |

The first three runs with the skill were cut off by an account's weekly usage limit after 14 to 15 minutes, each ending in "You've hit your weekly limit". They had opened the run, captured the screens, started the deterministic checks in the background and spawned the seven black-box inspectors at about 7 minutes, as runs 4 to 6 did. Under the plan's rule for runs terminated by the harness they are recorded and not graded by the graders (their script assertions: 2 of 9), and runs 4 to 6 replace them on the same binary, model, snapshot and prompt, a day later and on another account.

### 5.8 Problems in the skill seen in this round

1. **The design critics' findings are counted as findings, and two-thirds of them are judged not problems.** The three critics wrote 24 to 34 of each run's confirmed judged findings; 11 of 34, 9 of 24 and 11 of 27 were judged problems (a placeholder thumbnail on every card, a brand mark in body type, unthemed date and select controls, two misaligned label columns, an empty band under the footer), while every other judged finding was judged a problem in 93 to 100% of cases. Round 3 showed the same split. The verifier confirms that what a critic describes is on the page, and it is; it does not ask whether a member is harmed, and the graders, who were asked, said no for most of them. Keeping the critics' remarks as design notes beside the findings, unless they name a harm or a PRODUCT.md requirement, would close most of the precision gap; it changes what counts as a finding, so it needs a decision record.
2. **A same-cause proposal can be accepted only whole.** Proposals group the findings the code reviewer located within three lines of one file. A component's markup holds several problems in that window: in run 6, S14 grouped nine findings at `tool.html:68–73`, six of them the fixed bar over the calendar (D08), two the unfinished reservation (D26) and one a landmark. The lead rightly rejected the group, so the six stayed apart and D08 reached the report as ten findings. The leads accepted 4 of 12, 9 of 16 and 5 of 14. Accepting a subset of a proposal's members, or proposing within a criterion family, would keep the true duplicates together.
3. **"Advisory" means two things.** ADR-038 uses the `advisory` field for tool observations that are never counted. The accessibility auditor's instructions, older than that record, say to report forced-colour failures "as advisory findings unless they also fail a WCAG criterion", and the merge keeps an inspector's field as written. In run 4 two such findings (session dots that vanish in forced colours, the Reserve button outside every landmark) were verified, rated (P1 and P2) and promoted, while the register marks them advisory and the report lists them as findings. The auditor's wording should change, or the merge should drop the field from an inspector's output.
4. **Screens in every packet are labelled by their evidence folder, not their route.** `evidenceIndex` in `packet.mjs` gives each screenshot the folder's name as its `route` (`items-ladder-3m`, `basket-html-items-drill-18v-two-day-2026-10-17`: the URL cut to 40 characters). The design critics copied it into 19 to 36 locations a run, so their findings meet no other inspector's on a page in the duplicate proposals and the verifier partition cannot keep a page's candidates together. The capture knows each folder's route; the packet should carry it.
5. **The slowest verifier part is the one that waits.** In runs 4 and 5 the part that held the basket-hold candidates took 13 to 14 minutes, against 4 to 6 for the others, because checking an expired hold means waiting ten minutes. Starting the time-bound checks first, or alone, would shorten the pass.
6. **The audit is faster but not cheaper.** Runs took 50 to 59 minutes against 65 and 68, with 17 subagents instead of 15 (the verifier parts), 42 to 59 million tokens and $29.51 to $37.09, against $30.74 and $31.86.

## 6. Limitations

- n = 3 complete runs per arm, so the comparison is descriptive: no significance test is claimed and the intervals are wide (13 of 13 has a lower bound of 73%). The skill's judged precision ranged from 0.71 to 0.78, and the 0.8 bar lies inside all three intervals, at the upper edge of run 4's.
- The found defects were chosen from problems that at least two round-3 reviews reported and a second labeller reproduced. All thirteen were in one round-3 skill run's report and ten in a control's, so recall over all 26 favours the skill by construction; the comparison over the ten is fairer but still draws on the same reviews. A third labeller, or a ground truth set without either arm's reports, would remove the bias.
- The runs, the graders, the adjudicators and the second labeller are instances of the same model family. The mapping is blind to the arm (neutral packet codes, only what the user received), not independent of the model.
- The control without a browser ran on the same machine with a reduced PATH; it could still read every file, and the sandbox refused its `curl`. A machine without a browser would give the same picture only if the source is readable there too.
- The controls ran on 8 October and the replacement skill runs on 9 October, on another account; the binary (2.1.288), the model, the plugin snapshot and the prompts were the same, and the cut-off runs show the same opening steps.
- Two analyses were added after the results were seen and are labelled so: precision split by the role that reported a finding, and recall over the found defects a round-3 control also reported.

## 7. Next steps

- Decide whether the design critics' remarks count as findings (problem 1) and record it as a decision; then fix the three problems with a clear cause: accepting part of a same-cause proposal, one meaning of `advisory`, and routes in the packets' screen lists.
- Say plainly what the skill is for on evidence like this: a plain session finds the seeded problems of both audit fixtures, with or without a browser, at about 3% of the cost; the skill adds more of the problems nobody seeded, verification, blind ratings, a computed level and a record a reader can check.
- Build the next audit fixture so that reading the source is not enough for this model: problems that come from data, time, a server or a browser's own behaviour rather than from the page's code.
- Have a third labeller review `tool-library` without the round-3 reports, so recall over the found defects stops depending on what either arm reported.

