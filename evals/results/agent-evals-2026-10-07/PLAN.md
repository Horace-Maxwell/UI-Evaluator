# Verification round, 2026-10-07: plan written before the runs

## Objective ("What do I need to know?")

Whether the twelve problems that the 2026-10-06 round found in UI-Evaluator, fixed in 2.1.0 and 2.2.0, still appear when
the same five tasks run with the 2.2.0 plugin; and whether the release-bar results hold on a second run.

## Tasks

The same prompts, fixtures and harness as round 1: evals 9, 11, 12, 14 and 19 with a frozen copy of the 2.2.0 plugin,
one top-level session each (claude-opus-5-5), and eval 19 again without the plugin (a second control run, so each arm of
the audit comparison has n = 2).

## Data and the check for each problem

Each check is decided now. "Fixed" needs the evidence below; "not exercised" means the run never reached the situation,
which is reported as such and never counted as fixed.

| # | Problem (round 1) | Where it can show | Fixed if | Not exercised if |
|---|---|---|---|---|
| 1 | Heuristic evaluators saw the walkthrough's answer key | eval 19 heuristic packets | no `correct_actions`, `avoided_hints` or `success_condition` in any heuristic packet's journeys.json, and the reply raises no leak | no heuristic packet built |
| 2 | A second rater batch overwrote the first batch's key | any run that rates twice | earlier batch archived in `ratings/batch-<n>/` with its map, and no hand-moving of rating files in the transcript | only one rating batch |
| 3 | Generated finding text failed the report lint | eval 14 (and every report) | report-lint 0 violations, and no hand edit of a tool finding's wording in the transcript | no tool finding with such wording |
| 4 | Evidence paths in packets did not open | raters and verifiers in evals 11, 19, 9 | 0 failed reads of evidence or probe files by subagents | no rater or verifier spawned |
| 5 | Probes could not press Back | eval 19 (seeded D07), eval 9 | no hand-written Playwright script and no `history.back()` / Alt+Arrow workaround; Back tested with the probe's `back` action where needed | Back never needed |
| 6 | The same problem reached the report up to six times | eval 19 | the most findings the graders map to one seeded defect is lower than round 1's 6, with merge proposals covering the cross-role duplicates | — |
| 7 | Feedback themes posed as an inspector | eval 9 | feedback candidates written with role `feedback`, no role-schema errors, detection N excludes them | no theme turned into a candidate |
| 8 | A P0 waiting on the owner could only stay open | eval 11 | the owner-decision finding is `blocked` with person and question, and "Every P0/P1 has an outcome" passes | no fix needs the owner's decision |
| 9 | Packets did not name the output schema | all subagents | 0 failed reads of schema paths | — |
| 10 | An empty fix queue did not say why | eval 11 | the first `uie findings queue` result names the cause | the queue was not empty |
| 11 | Probe steps in the shorthand failed with "unknown action undefined" | all probes | 0 occurrences of that error | no probes |
| 12 | No command to split a finding | any run with a `split_required` verdict | `uie findings split` used, `splits.json` written, no hand-written candidates | no split requested |

Release bars are measured as in round 1 (scripts, then two blind graders and an adjudicator for the grader assertions and
the audit mapping), so the two rounds can be compared directly.

## Deviations from the plan (recorded as they happened)

- **2026-10-07 09:50, grader change after seeing a result.** Eval 14's script check "No accessibility or readiness overclaim" failed on round 2's reply, which quotes the user's words to refuse them ("I couldn't say the seller flow is 'accessible and good to go'") and describes what an honest claim would need ("the quickest way to get to an honest 'good to go' is to fix…"). The check's list of negations lacked *couldn't* and had no conditional markers. The list now has couldn't, wouldn't, won't, don't, didn't, refuse, decline, instead of, rather than, before, until, unless, get to, way to, reach, become, honest, and the Chinese 才能 and 之前. Round 1's eval 14 was re-graded with the new list and keeps its 5 of 5. The two blind graders judge eval 14's other assertion independently of this check.
- **2026-10-07 10:30, grader change after seeing a result.** The script check "Severity ratings land in the expected bands" matches defects to findings by criterion and route. Round 2's merge consolidates one problem found by many roles into one finding carrying every role's criteria (the dead end, F-0006, carries ten), so the matcher paired that one finding with five defects and compared its severity against five bands (5 of 10 in band). The check now uses the graders' consensus mapping when there is one: a found defect is in band when a finding mapped to it is rated within its band ± 0.5. Round 1 was re-graded the same way for comparability; its figure is in the report.
- **2026-10-07 10:45, check 5 narrowed after seeing a result.** The plan counted any hand-written browser script against problem 5 (no Back action). Round 2's one script, in eval 11, measures the Sensors table against its scroll container at each width, which no probe action does; it is unrelated to Back. The check now decides on Back workarounds alone and reports other scripts beside it; the measurement gap is noted as an observation.
- **2026-10-07 10:55, three trace checks tightened after seeing results.** (a) The report-lint check's narration pattern matched the lead's remarks about the code lint's pre-existing gate hits in eval 11 ("lint went from 58 to 57"); it now matches only the report or language lint and wording. (b) The evidence-path check counted a failed read by the lead in its own run folder; the plan names subagents, whose paths come from packets, and the lead's guesses are now reported apart. (c) The black-box check counted a verifier's `uie probe --url "/review.html?…"` as reading source because of the bare file name in the URL; a bare name now counts only as the argument of a reading command. Round 1 was re-checked with the same code.
