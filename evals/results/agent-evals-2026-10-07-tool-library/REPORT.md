# Round 3, 7–8 October 2026: a harder fixture, and a control with a browser

Rounds 1 and 2 could not separate the skill from a plain session on recall: on `journey-app` both arms found 9 or 10 of 11 seeded problems, and a careful reading of the source almost exhausts that fixture. This round asked the same question on a fixture built so that reading the source is not enough, `tool-library` (13 seeded defects, four deterministic and nine that show only in rendering, interaction or time), with two complete runs per arm. `PLAN.md` beside this file fixed the measures before the runs; the graders' work is in `grading/`, the trace measures in `trace-check.json`.

## Summary

- **The skill met the recall bar in both complete runs and the precision bar in one of them.** By the adjudicated mapping run 1 found 12 of 13 seeded defects (95% CI 65–100%) and run 3 found 13 of 13 (73–100%); by criterion and route both found 13 of 13, the four deterministic ones included. Judged precision was 64/77 = 0.83 [73–90%] in run 1 and 53/80 = 0.66 [55–76%] in run 3, so the standard-audit bar (recall ≥ 0.6, precision ≥ 0.8 after verification) was met once in two runs. Both runs computed no level against a target of L3 and said so, with 0 report-lint violations.
- **The control found every seeded defect, in both runs, for about $1.20 and 4 minutes each** (13 of 13 by the adjudicated mapping, 95% CI 73–100%; precision 21/21 and 20/20). It did so because it had a browser: the machine has Python Playwright installed, both control sessions found it with `python3 -c "import playwright"`, wrote a script that drove Chromium at 375 px in dark mode, and read the screenshots back. A model with a browser and a product brief is enough to find these thirteen problems.
- **On recall the arms cannot be told apart; on precision and cost the control wins.** Skill recall 12 and 13 of 13, control 13 and 13; skill judged precision 0.83 and 0.66, control 1.00 and 1.00 over everything it reported (21 and 20 problems, none judged not a problem); $30.74 and $31.86 against $1.25 and $1.09, 65 and 68 minutes against 4 and 3, a cost ratio of about 27. The control gives the owner a page of prose with 20 problems in order; the skill gives 101 and 105 findings with evidence, severity ratings and a computed level, of which the graders called 24 and 40 not problems.
- **What the skill adds is still process, not recall:** three isolated heuristic evaluators, a walkthrough, three critics, an accessibility auditor and a code reviewer, every candidate re-checked against the live site, three blind severity raters (α 0.83 and 0.86), evidence a reader can open, the computed level stated as none against a target of L3, and 0 report-lint violations. It also costs about 27 times the control and reports five times as many items, and its precision moved from 0.83 to 0.66 between two runs of the same task, which puts the 0.8 bar inside its run-to-run noise.
- **One skill run was lost to the harness and one skill problem is new:** run 2 ended at 34 minutes because its lead started the verifier in the background and ended its turn to wait for it, which in `claude -p` terminates the session after 600 s. The harness now lifts that ceiling; the pattern itself is logged as a skill problem.
- **Both arms found seven to ten genuine problems the fixture did not seed** (a pick-up day before the tool is available, a tool-page day that contradicts the basket session, formats the form rejects, a basket that is not cleared after confirming, a Change link that clears the typed details). They count as real in precision; the ground truth is incomplete and says so.

## 1. Objectives ("What do I need to know?")

Whether the skill's standard audit finds more of a site's problems than the same model without the skill when the problems show only in use; whether it holds the release bars of EVALUATION-PLAN §6 (recall ≥ 0.6, precision ≥ 0.8 after verification, honest level and language) on a harder fixture; and what the control does when the problems are not visible in the source.

## 2. Tasks

Eval 20, `audit-standard-tool-library`: "Our community tool library opens online reservations to members next month. Could you review the reservation flow for usability and accessibility problems and tell me what to fix first? Most members use it on a phone in the evening, and a lot of them have dark mode on. The site is served from this folder." Two complete runs with the 2.2.0 plugin (a third was made after the second was terminated by the harness, see 5.6) and two without it, each a top-level `claude -p` session (claude-opus-5-5, budget 80) in a fresh copy of the fixture served on 127.0.0.1, with the same shell allow-list and no web access. The fixture: Fernhill Tool Library reservations, five pages, light and dark themes, two journeys; 13 seeded defects, four deterministic (dark-theme badge contrast 3.07:1, a 330 px column that overflows at 320 px, a fixed bar over focused calendar days, a Tab trap in the loan-length list) and nine judged (the search and date filter moved below the tool list on phones behind an icon-only button, a silent empty search, two drill names cut to the same prefix, closed days accepted and refused three steps later, a 1.2-second toast as the only feedback, an invisible 10-minute hold that ends in "Something went wrong", sessions laid out in reverse against reading and focus order, a double submit that makes two reservations, a Change link that drops the chosen session). Its deterministic calibration before the round: 4 of 4 detected, 0 false positives (`evals/results/detectors-2026-10-07-tool-library.json`).

## 3. Data

As in rounds 1 and 2: transcripts, the skill's run files, site hashes, time, tokens and cost; the nine script assertions of eval 20 (two for the control); for every complete run, two blind graders who mapped each reported problem to a seeded defect, to "real but not seeded" or to "not a problem" from a packet holding only what the user received and the ground truth, an adjudicator who settled their splits (`grading/consensus-*.json`), and their agreement (`agree-graders.mjs`); `trace-check.mjs` over the skill runs; and, for the control, what its transcript shows it did with the site.

## 4. Analysis

The measures and their pass conditions were fixed in `PLAN.md` before the runs: recall by criterion and route (the script) and by meaning (the adjudicated mapping) with adjusted-Wald 95% intervals; precision over confirmed judged findings; the four deterministic defects per run; the arm means with n = 2 complete runs per arm and no significance test; whether the control opened the site in a browser; level claimed against computed; report lint; the trace assertions; cost; and skill problems with evidence. Deviations are logged in `PLAN.md` with their time.

## 5. Results

### 5.1 Release bars, the complete skill runs

| Bar (EVALUATION-PLAN §6) | skill, run 1 | skill, run 3 |
|---|---|---|
| Recall by criterion and route (of 13) | 13/13 = 100% | 13/13 = 100% |
| Recall by meaning, adjudicated mapping (of 13) | 12/13 = 92% [65%–100%] | 13/13 = 100% [73%–100%] |
|   judged defects (of 9) | 8/9 = 89% [54%–100%] | 9/9 = 100% [66%–100%] |
|   deterministic defects (of 4) | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] |
| Precision after verification, judged findings | 64/77 = 83% [73%–90%] | 53/80 = 66% [55%–76%] |
|   strict (seeded only) | 40/77 = 52% [41%–63%] | 39/80 = 49% [38%–60%] |
| Severity within band ± 0.5 (by mapping / by script) | 83% / 85% | 100% / 77% |
| Level claimed (target L3) | none | none |
| Report lint violations | 0 | 0 |
| Script assertions passed | 9 of 9 | 8 of 9 |
| Time, cost | 65 min, $30.74 | 68 min, $31.86 |

Both complete runs clear the recall bar by either count. Precision splits them: run 1's 77 judged findings had 13 the graders called not problems (brand and appeal remarks from the design critics, a wrapping nav label, an unexplained second badge style, a native date input in the browser's format), run 3's 80 had 27 (the same design-panel themes plus accessibility best-practice items: heading levels, landmarks, label-in-name, arrow-key opening, a count of 21 tab stops before the Reserve button, and one finding that blamed the listbox trap on the masthead link). The inspectors found much the same things in both runs; what differed is what the merge and the verifier let through and how the critics' taste items read to the graders. Severity rating held: by the mapping 10 of 12 found defects in run 1 and 13 of 13 in run 3 were rated within their band ± 0.5; the two outside the band in run 1 were the brief toast (rated 3.7 against 1–2, the raters reading it as 'Reserve does not reserve') and the double submit (2.3 against 3–4). Both runs computed no level against L3, passed the language lint, left no fixture file changed and walked the critical journey with a valid record.

### 5.2 Skill against control, two complete runs per arm

|  | skill, run 1 | skill, run 3 | control, run 1 | control, run 2 |
|---|---|---|---|---|
| Problems reported (items the graders mapped) | 101 | 105 | 21 | 20 |
|   a seeded defect | 53 | 51 | 14 | 13 |
|   real but not seeded | 24 | 14 | 7 | 7 |
|   not a problem | 24 | 40 | 0 | 0 |
| Seeded defects found (of 13) | 12/13 = 92% [65%–100%] | 13/13 = 100% [73%–100%] | 13/13 = 100% [73%–100%] | 13/13 = 100% [73%–100%] |
|   judged (of 9) | 8/9 = 89% [54%–100%] | 9/9 = 100% [66%–100%] | 9/9 = 100% [66%–100%] | 9/9 = 100% [66%–100%] |
|   deterministic (of 4) | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] | 4/4 = 100% [45%–100%] |
| Precision over everything reported | 77/101 = 76% [67%–84%] | 65/105 = 62% [52%–71%] | 21/21 = 100% [82%–100%] | 20/20 = 100% [81%–100%] |
| Grader agreement, items (α) | 99% (—) | 95% (—) | — (—) | 95% (—) |
| Time | 65 min | 68 min | 4 min | 3 min |
| Cost | $30.74 | $31.86 | $1.25 | $1.09 |
| Subagent messages | 443 | 477 | 0 | 0 |

Four runs, two per arm. Every run found at least 12 of the 13 seeded defects, so the fixture did not separate the arms on recall: problems that show only in use were found by a plain session as soon as it had a browser. The arms differ in three things the table shows. Volume: the control wrote 20 and 21 problems, the skill confirmed 101 and 105 findings. Precision: nothing the control reported was judged not a problem (precision 1.00, intervals 82–100% and 81–100%), while 24% and 38% of the skill's confirmed findings were, so its judged precision was 0.83 and 0.66 against the 0.8 bar. Cost: $1.17 against $31.30 on average, 4 minutes against 66. With n = 2 per arm no significance test is claimed; the recall intervals overlap entirely and the cost figures do not. The control's two reports also agree with each other (the same seven unseeded real problems, the same four blockers first), which says the fixture's problems are legible to this model once it runs the flow, not that they are easy to see in the source.

### 5.3 Each seeded defect, by run

| Defect | Kind | Criterion | skill, run 1 | skill, run 3 | control, run 1 | control, run 2 |
|---|---|---|---|---|---|---|
| D01 | judged | CW-Q2 | 8 item(s), severity 4.0 | 6 item(s), severity 4.0 | 1 item(s) | 1 item(s) |
| D02 | judged | H1 | 1 item(s), severity 3.0 | 4 item(s), severity 2.7 | 1 item(s) | 1 item(s) |
| D03 | judged | CW-Q3 | 6 item(s), severity 3.0 | 6 item(s), severity 3.0 | 1 item(s) | 1 item(s) |
| D04 | deterministic | 1.4.3 | 4 item(s), severity 3.0 | 5 item(s), severity 3.0 | 1 item(s) | 1 item(s) |
| D05 | deterministic | FUN-05 | 6 item(s), severity 3.0 | 4 item(s), severity 3.0 | 1 item(s) | 1 item(s) |
| D06 | judged | H5 | 3 item(s), severity 3.0 | 2 item(s), severity 3.0 | 1 item(s) | 1 item(s) |
| D07 | judged | H1 | 1 item(s), severity 3.7 (out of band) | 2 item(s), severity 4.0 | 1 item(s) | 1 item(s) |
| D08 | deterministic | 2.4.11 | 9 item(s), severity 3.0 | 6 item(s), severity 3.0 | 1 item(s) | 1 item(s) |
| D09 | deterministic | 2.1.2 | 3 item(s), severity 4.0 | 3 item(s), severity 4.0 | 1 item(s) | 1 item(s) |
| D10 | judged | H1 | 3 item(s), severity 4.0 | 3 item(s), severity 4.0 | 1 item(s) | 1 item(s) |
| D11 | judged | 2.4.3 | 6 item(s), severity 3.0 | 5 item(s), severity 3.0 | 1 item(s) | 1 item(s) |
| D12 | judged | H5 | 3 item(s), severity 2.3 (out of band) | 3 item(s), severity 3.0 | 2 item(s) | 1 item(s) |
| D13 | judged | H3 | — | 2 item(s), severity 2.0 | 1 item(s) | 1 item(s) |

Every control run mapped one item to each defect (two for D12 in control run 1, where the silent wait and the double tap were listed apart). The skill runs mapped between one and nine items to a defect: the fixed bar (D08) arrived as nine and six findings, the phone-width reorder (D01) as eight and six, the overflow (D05), the reversed sessions (D11) and the cut names (D03) as four to six each; the merge joins what inspectors describe the same way, and these were described from different angles (a focus-order jump, a content-order inversion, an obscured focus, a target too close to another). The one defect the skill missed by meaning, D13 in run 1, was matched by the script because a merged finding carried its criterion (H3) on its route; the graders found no finding there that says the Change link drops the chosen session (F-0069 says it clears the typed details, a different loss), and run 3 reported it as two findings rated 2.0, inside its band. The brief toast (D07) was rated 3.7 and 4.0 against a band of 1–2 in both runs, because the raters read it as 'Reserve does not reserve', a dead end for first-time members; that is arguably the ground truth's error, and it is listed for the second labeller.

### 5.4 How the control looked at the site

| Control run | Source files read | Browser script written | Script runs (succeeded) | Screenshots read back | Shell commands (refused by the sandbox) |
|---|---|---|---|---|---|
| control, run 1 | 6: PRODUCT.md, DESIGN.md, reserve-tool-for-saturday.json, change-pickup-session.json, app.js, styles.css | check.py | 2 (1) | 5 | 13 (7) |
| control, run 2 | 0:  | check.py | 3 (1) | 2 | 9 (6) |

Neither control run stopped at the source. Both probed the machine for a browser (`npx playwright` was refused by the sandbox; `python3 -c "import playwright"` succeeded), wrote `check.py` with Playwright, ran it against the served site at 375 px in dark mode (and 320 px, 200% text), measured the clipped names, the page width, the toast's timing, the keyboard trap and the double submit, took screenshots and read them back. Control run 1 read all nine source and document files first; control run 2 read them in one command and then only the screenshots and its own output. In rounds 1 and 2 the control did not use a browser; nothing in the prompt changed between rounds, only the fixture, whose product document says members use phones in dark mode and whose problems do not read off the source.

### 5.5 Process measures, the complete skill runs

| Measure | skill, run 1 | skill, run 3 |
|---|---|---|
| Confirmed findings (judged) | 101 (77) | 105 (80) |
| Rater agreement on severity, Krippendorff α (ordinal) | 0.83 over 74 findings, 3 raters | 0.86 over 79 findings, 3 raters |
| Any-two agreement among heuristic evaluators | 29% | 32% |
| Seeded defects per inspector, λ (lecture curve) | 0.51 | 0.47 |
| Found by 3 heuristic evaluators together | 77% | 85% |
| Black-box roles that read no source | 13 of 13 | 13 of 13 |
| Heuristic packets carrying the walkthrough answer key | — | — |

The process measures repeat round 2's picture and show what the skill buys. Rater agreement on severity was α = 0.83 and 0.86 over 74 and 79 findings; any-two agreement among the three heuristic evaluators 29% and 32%; λ, the per-inspector discovery rate on the seeded set, 0.51 and 0.47, so three heuristic evaluators together found 77% and 85% of the seeded defects and all nine inspectors 92% and 100% (the lecture's curve on this fixture, drawn from the consensus mapping). Every black-box subagent, 13 of 13 in each run, read no source; no heuristic packet carried the walkthrough's answer key; one subagent read of an evidence path failed in run 1 and none in run 3; no probe step was rejected and no rating file was moved by hand. The sandbox refused 20 and 33 of the leads' shell commands (quoted variables, `cd` with writes, a polling loop); the leads rewrote every one, and the refusals are the harness's, not the skill's.

### 5.6 The terminated run

Skill run 2 ran the same way as run 1 for 24 minutes (deterministic checks 15 minutes, nine inspectors in parallel, merge), then its lead started the verifier as a background subagent and ended its turn: "The verifier is now re-checking all 65 judged candidates against the live site. I'll continue when it reports back." In an interactive session the subagent's result wakes the lead; in `claude -p` the session waits at most 600 s for background work and then terminates ("Background tasks still running after 600s; terminating"). The verifier was still writing at that point. The run produced no verifier output, ratings, gates or report, and no reply; by the script's criterion matcher its merged candidates already covered 6 of 13 defects (the four deterministic ones and two judged) before verification. It is kept on record as terminated and not graded by the blind graders; the harness lifts the ceiling for later runs (`CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`), and the lead's choice is listed below.

### 5.7 Problems in the skill seen in this round

1. **Waiting on a background subagent by ending the turn.** Run 2's lead started the verifier in the background and ended its turn to wait for it, which a print-mode session cannot survive; run 3's lead tried to wait with a shell polling loop (`until [ -f …/he-1.json ]`), which the sandbox refused. Run 1 kept working while its inspectors ran and was woken by each completion. The workflow should say that the verifier and the raters are run in the foreground, or that the lead keeps the turn until they return.
2. **The deterministic checks take 14–15 minutes of a 65-minute audit, and the verifier 16–23.** All three runs spent 14–15 minutes in `uie audit` before any inspector started (five routes, nine states, six widths, two themes, reduced motion; the keyboard walk, the layout checks and the vitals are the slow parts), and the verifier re-checked 65–80 candidates in 16 and 23 minutes. On a five-page site that is more than half the audit; the standard depth should run fewer widths for the slow checks, start the inspectors while they run, and verify in parallel.
3. **One problem, up to nine findings.** The merge joined what inspectors described the same way, but the fixed bar reached the report as nine and six confirmed findings (an obscured focus, a focus-order jump, a target too close to the Reserve button, overlapping text, a covered footer), the reorder as eight and six, the overflow as six and four. Round 2's wider duplicate proposals did not cover findings that describe one cause from different checks' angles; the merge should offer a 'same cause' grouping by location when several criteria point at one element.
4. **A quarter to two-fifths of the confirmed findings were not problems for members** (24 of 101 and 40 of 105 by the adjudicated mappings): the design critics' brand and appeal remarks on a page whose brief asks for one filled button and no decoration, accessibility best-practice items with no effect the reviewer could name (heading levels, landmarks, label-in-name, arrow keys to open a list, a count of tab stops), and advisory tool findings (APCA-weak text that passes WCAG, stranded last words, a 2 px padding shortfall) that the lead confirmed and reported. Advisory findings should stay out of the confirmed count unless an inspector adopts them, the critics' taste calls should be rated against the product's own brief before they count, and the precision bar, which the same task met and missed in two runs, needs more than one run to be read.
5. **A 'keep' claim that was false at the width the audit prioritised.** Run 3's reply listed 'Open days are marked with the word Open, not just colour' among the things to keep; from 480 px up that is true, but on the 375 px phone the review itself put first the fixture shows a dot, which the control called out as colour-and-shape-only. A keep-list claim should be checked at the widths the audit ran.
6. **The 'Reserve this tool' dead end was rated P0 and reported first in both runs, against a ground-truth band of 1–2.** The raters' reading (the button adds to a basket and nothing durable says so) is defensible and the fixture's band is probably too low; recorded here so the ground truth can be revisited by a second labeller, as EVALUATION-PLAN §3 asks.
7. **One subagent read of an evidence path failed** in run 1 (trace check); every other packet path opened in all three runs, and no probe step was rejected.

## 6. Limitations

- n = 2 complete runs per arm, so the comparison is descriptive: no significance test is claimed, and the intervals are wide (a 13 of 13 has a lower bound of 73%). The skill's own precision moved from 0.83 to 0.66 between its two runs, so a bar read from one run is read from noise.
- The fixture and its ground truth were seeded by one person on the same day as the round; EVALUATION-PLAN §3 asks for two labellers, and this round's own graders found seven to ten unseeded problems in it, so the true set is larger than 13 and the recall figures are against the seeded set only.
- The graders, the adjudicators and the runs are instances of the same model family; the mapping is blind to the arm (neutral packet codes, no run files) but not independent of the model.
- The control had a browser because the machine happened to have Python Playwright; on a machine without one the control would be the round-1 control (source reading only). That is a property of the environment the harness does not control and the comparison inherits.
- Lab timings and costs come from one machine and one evening; the skill's run 1 took 65 minutes partly because the deterministic phase ran every width and theme.

## 7. Next steps

- Decide what the skill is for when a plain session with a browser finds the same problems at 4% of the cost: the evidence says its value is verification, blind rating, the computed level and the written record, and the README should say so rather than imply better recall.
- Fix the skill problems with a clear cause (foreground verifier, the slow deterministic phase, same-cause grouping, advisory findings out of the confirmed count) and re-run eval 20 three times per arm, once with the control on a machine without Playwright, so both control conditions are on record and the precision bar is read from more than one run.
- Have a second person label `tool-library` (the seven unseeded problems both arms found belong in the ground truth, and D07's band needs a second opinion).
- Keep the control arm's browser use as a reported measure in every audit round.

