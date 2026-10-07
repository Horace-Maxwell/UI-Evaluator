# Verification round, 7 October 2026: do the fixes hold?

The twelve problems that the agent-level round of 6 October found in UI-Evaluator were fixed in 2.1.0 and 2.2.0. This round ran the same five tasks and the same control again with the 2.2.0 plugin, under the same prompts, grading and blind-grader procedure, to see whether the problems were gone and whether the release-bar results repeat. `PLAN.md` beside this file fixed the pass condition for each problem before the runs; `verification.json` holds the verdicts and `trace-check.json` the trace measures; the graders' work is in `grading/`.

## Summary

- **11 of the 12 problems are fixed** on the evidence the plan asked for; 1 was not exercised (a second batch of raters never arose) and rests on its end-to-end test; 0 still present.
- **Honesty, verification and feedback ingestion repeated** their results (5 of 5, 5 of 5, 8 of 8 assertions).
- **The fix loop missed its bar again** (2 of 3 seeded serious defects verified fixed), for a different reason: the third defect was found this time and left `blocked` on the owner's answer, which is correct and is not a verified fix.
- **The audit's judged precision fell to 72%** (26 of 36; round 1: 82%), below the 0.8 bar, while recall stayed at 9 of 11, the same as the control's. With two runs per arm the two arms still cannot be told apart on recall; the skill's audit costs about 33× the control's.
- **The process measures moved the way the fixes predicted:** one problem is now one finding (at most 2 findings per seeded defect, against 6), rater agreement α 0.86 → 0.91, any-two agreement among heuristic evaluators 31% → 59%.

## 1. Objectives ("What do I need to know?")

Whether each of the twelve problems still appears in use; whether the four release bars measured on 6 October give the same answer on a second run; and a second run of the controlled comparison, so each arm has n = 2.

## 2. Tasks

The same evals 9, 11, 12, 14 and 19 as round 1, from the same fixtures and setup steps, with a frozen copy of the 2.2.0 plugin; one top-level claude-opus-5-5 session each; eval 19 again without the plugin. The prompts tell the session it is being evaluated and nothing about what is measured.

## 3. Data

As in round 1: transcripts, the skill's run files, site hashes, time, tokens and cost; script assertions; two blind graders per grader assertion and per audit mapping, settled by an adjudicator. New this round: `tools/bench/trace-check.mjs` reads every transcript for the trace assertions of EVALUATION-PLAN §4.4 (black-box roles that read source, failed reads of packet paths, rejected probe steps, workarounds, leaked answer keys, archived rating batches, feedback outputs, blocked findings, recorded splits, the report lint).

## 4. Analysis

Each problem has a pre-registered verdict rule (PLAN.md): "fixed" needs the stated evidence, "still present" the stated counter-evidence, and "not exercised" means the run never reached the situation and is never counted as fixed. Rates carry adjusted-Wald 95% intervals; agreement is raw and Krippendorff's α. Instrument changes made after seeing results are listed in PLAN.md with the time and were applied to round 1 as well.

## 5. Results

### 5.1 The twelve problems

| # | Problem | Round 2 | Evidence |
|---|---|---|---|
| 1 | Heuristic evaluators were shown the walkthrough’s answer key | fixed | 0 of 6 heuristic packets carried a journey's correct path |
| 2 | A second batch of severity raters overwrote the first batch’s key | not exercised | no run rated a second batch |
| 3 | Generated finding text fails the skill’s own report lint | fixed | 0 narration(s) about a lint hit; 0 final report(s) with lint violations |
| 4 | Evidence paths in packets do not open as written | fixed | 0 failed read(s) of evidence or probe files across 19 rater, verifier and fix-reviewer subagents |
| 5 | Probes cannot press the browser’s Back button | fixed | 0 Back workaround(s); 1 hand-written browser script(s) for other purposes |
| 6 | The same problem reaches the report up to six times | fixed | at most 2 finding(s) mapped to one seeded defect (round 1: 6) |
| 7 | Feedback themes can only enter the findings by posing as an inspector | fixed | 1 output(s) with role feedback; no role-schema error |
| 8 | A P0 that waits on the owner’s decision can only stay “open” | fixed | 5 finding(s) blocked with person and question (F-0063 P1, F-0064 P1, F-0029 P1, F-0030 P0, F-0039 P1); outcome assertion passed |
| 9 | Packets do not say where the output schema is | fixed | 0 failed read(s) of schema paths |
| 10 | An empty fix queue does not say why | fixed | 1 of 1 empty-queue result(s) named the cause |
| 11 | A natural way to write a probe step fails with “unknown action undefined” | fixed | 0 "unknown action" error(s) |
| 12 | No command to split a finding the verifier says holds two problems | fixed | uie findings split used 5 time(s); 11 split(s) recorded |

### 5.2 Trace measures over all runs with the skill

| Measure | Round 1 | Round 2 |
|---|---|---|
| Black-box subagents that read no site source | 30 of 30 | 32 of 32 |
| Failed reads of schema paths by subagents | 16 | 0 |
| Failed reads of evidence or probe paths by subagents | 12 | 0 |
| Probe steps rejected as "unknown action" | 5 | 0 |
| Evaluator files rejected for their role | 1 | 0 |
| Back-button workarounds | 10 | 0 |
| Rating files moved by hand | 1 | 0 |
| Heuristic packets carrying a journey's correct path | 4 of 4 | 0 of 6 |
| Uses of uie findings split | 0 | 5 |
| Findings blocked on a named person | 0 | 5 |
| Sandbox refusals (the harness, not the skill) | 60 | 56 |

### 5.3 Release bars, both rounds

| Run | Round 1 | Round 2 | Round 2 time · cost |
|---|---|---|---|
| 19 Standard audit (skill) | 9 of 9 | 8 of 9 | 34.4 min · $21.69 |
| 19 Control | 2 of 2 | 2 of 2 | 1.8 min · $0.66 |
| 11 Fix loop | 5 of 7 | 6 of 7 | 44.5 min · $16.96 |
| 12 Verify | 5 of 5 | 5 of 5 | 6.4 min · $1.48 |
| 14 Report honesty | 5 of 5 | 5 of 5 | 0.9 min · $0.45 |
| 9 Feedback ingestion | 8 of 8 | 8 of 8 | 13.6 min · $6.21 |

Fix loop, seeded serious defects: D06 verified fixed; D07 found, F-0029 blocked; D15 verified fixed. P0/P1 findings: 7 verified, 0 deferred, 5 blocked, of 12. The failing assertion in both rounds, one patch per fixed finding, counts findings that another finding's change cleared; the register records the shared change.

### 5.4 The controlled comparison, n = 2 per arm

| Measure | Skill r1 | Skill r2 | Control r1 | Control r2 |
|---|---|---|---|---|
| Problems reported | 65 | 41 | 23 | 17 |
| Seeded / real / not a problem | 28 / 21 / 16 | 11 / 15 / 15 | 11 / 7 / 5 | 11 / 4 / 2 |
| Recall by meaning | 10/11 = 91% [60%–100%] | 9/11 = 82% [51%–96%] | 10/11 = 91% [60%–100%] | 9/11 = 82% [51%–96%] |
| Precision (seeded or real) | 49/65 = 75% [64%–84%] | 26/41 = 63% [48%–76%] | 18/23 = 78% [58%–91%] | 15/17 = 88% [64%–98%] |
| Judged precision (the bar) | 49/60 = 82% [70%–90%] | 26/36 = 72% [56%–84%] | n/a | n/a |
| Most findings mapped to one defect | 6 | 2 | — | — |

| Defect | Skill r1 | Skill r2 | Control r1 | Control r2 |
|---|---|---|---|---|
| D01 | F-0010, F-0032, F-0065, F-0073, F-0082 | F-0008 | R13 | R10 |
| D02 | F-0045, F-0058 | F-0035 | missed | missed |
| D03 | F-0007, F-0029, F-0052 | F-0023 | R5 | R6 |
| D04 | F-0006, F-0013, F-0021, F-0027, F-0069, F-0077 | F-0006 | R4, R6 | R5 |
| D05 | F-0009, F-0019, F-0063 | F-0017 | R9 | R1 |
| D06 | missed | missed | R20 | missed |
| D07 | F-0012 | F-0011 | R11 | R7 |
| D08 | F-0035, F-0066, F-0085 | F-0043 | R19 | R15 |
| D09 | F-0024, F-0038 | F-0022, F-0066 | R8 | R2 |
| D10 | F-0008, F-0030 | F-0037, F-0090 | R15 | R14, R16 |
| D11 | F-0037 | missed | R18 | R3, R13 |

Both arms missed D06 (per-metre prices with no total) in both rounds; the skill missed D11 in round 2 and the control missed D02 both times. Round 2's not-a-problem items with the skill: the five tool findings (stranded words, tabular figures; the fixture does not seed them) and nine design or typography judgements, mostly the critics' taste calls on a page without a design brief. The merge fix halved the count of findings; the taste items stayed, so the judged precision fell.

### 5.5 Process measures, eval 19

| Measure | Round 1 | Round 2 |
|---|---|---|
| Findings in the register | 65 | 41 |
| Rater agreement α (ordinal) | 0.86 | 0.91 |
| Found defects rated within band (by mapping) | 100% | 100% |
| Any-two agreement, heuristic evaluators | 31% | 59% |
| λ, three heuristic evaluators | 0.70 | 0.73 |
| λ, all nine inspectors | 0.42 | 0.48 |
| Level reached (target L3) | none | none |
| Time · cost | 31.4 min · $23.01 | 34.4 min · $21.69 |

## 6. Limitations

One run per task and arm, so the intervals are wide and a difference of one defect between rounds is noise. Claude graded Claude, blind and adjudicated, with no human check yet. Three instrument changes were made after seeing results and are logged in PLAN.md; round 1 keeps its results under each. The fixture is near the ceiling for a careful reader of the source, and the control cannot open a browser. The fix loop's bar counts verified fixes, so a correct wait on the owner counts against it.

## 7. Next steps

A harder audit fixture with problems that show only in use, and a second labeller for its ground truth; three or more runs per arm; a human grader on a sample of the mappings; a design brief in the audit fixtures, so the critics' taste calls can be judged against something; a probe action that measures an element against its container (candidate problem 13); and a decision on whether the fix-loop bar should count a finding blocked on the owner, with the question recorded, as an outcome.

