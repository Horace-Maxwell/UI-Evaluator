# Round 3, 2026-10-07: a harder audit fixture, plan written before the runs

## Objective ("What do I need to know?")

Whether the skill's standard audit finds more of a site's problems than the same model without the skill when the
problems show only in use. On `journey-app` (rounds 1 and 2) both arms found 9 or 10 of the 11 seeded problems, at a
cost ratio of about 1 to 30, and a careful reading of the source almost exhausts that fixture, so no causal claim about
recall was possible. `tool-library` was built so that reading the source and the product document is not enough: four
of its thirteen defects are deterministic and need the browser (dark-theme contrast, overflow at 320 px, a fixed bar
over focused controls, a keyboard trap), and nine are judged and appear in rendering, interaction or time (a filter
behind an icon below the list on phones, a silent empty search, names cut to the same prefix, a closed day accepted and
refused three steps later, a 1.2-second toast, an invisible basket hold, sessions laid out against reading order, a
double submit, a Change link that drops the chosen session).

## Tasks

Eval 20 (`audit-standard-tool-library`): the same prompt, two runs with the 2.2.0 plugin (`with_skill`) and two without
it (`without_skill`, the control arm), each a top-level `claude -p` session (claude-opus-5-5, budget 80, the desktop
app's bundled binary), prepared by `prepare-evals.mjs` with the fixture copied into a fresh project and served on
127.0.0.1. n = 2 per arm, as in round 2.

## Data

As in rounds 1 and 2: transcripts, the skill's run files, site hashes, time, tokens and cost; the script assertions of
eval 20; two blind graders who map every reported problem to a seeded defect, to "real but not seeded" or to "not a
problem", settled by an adjudicator; `agree-graders.mjs` for their agreement; `trace-check.mjs` over the skill runs.

## Analysis, decided now

| # | Question | Measure | Pass or expectation |
|---|---|---|---|
| 1 | Release bar, recall | matched seeded defects / 13 by criterion and route; the graders' mapping by meaning as the second figure, with adjusted-Wald 95% intervals | ≥ 0.6 in each skill run (EVALUATION-PLAN §6) |
| 2 | Release bar, precision | (seeded + real but not seeded) / confirmed judged findings, by the consensus mapping | ≥ 0.8 in each skill run |
| 3 | Deterministic defects | D04, D05, D08, D09 found, per run and arm | all four in every skill run; the control's count reported |
| 4 | Judged defects, skill vs control | judged defects found (of 9) per run; the difference of the arm means with both runs' values | reported with intervals; with n = 2 per arm no significance test is claimed |
| 5 | "Shows only in use" | for each defect the control reports, whether its transcript shows the page opened in a browser or the problem inferred from the source | descriptive |
| 6 | Honesty | level claimed ≤ computed level; report-lint violations; the trace assertions of EVALUATION-PLAN §4.4 | 0 overclaims, 0 violations |
| 7 | Cost | wall time, tokens and dollars per run and arm | reported |
| 8 | Skill problems | anything the transcripts show the skill doing badly, with evidence | listed, as in rounds 1 and 2 |

Decided now, so that matching cannot be bent afterwards:

- A defect counts as found by criterion when a confirmed finding carries its criterion or one of its `also_criteria` on
  its route (the matcher of `grade-eval.mjs`, unchanged); by meaning when the adjudicated mapping names it.
- D08 (the fixed bar) counts by meaning when a finding says the bar covers focused controls or page content at the end
  of the page, at any width.
- D03 (names cut to the same prefix) counts by meaning when a finding says the truncated names cannot be told apart; a
  finding that only says names are truncated maps to it as well, since that is the construction.
- D10 (the invisible hold) counts by meaning only when the finding says the hold is not shown or that the failure
  message after it lapses does not say what happened; a finding about the basket copy alone does not.
- The control arm is graded on the same mapping; its "report" is its final reply plus any document it wrote.
- Instrument changes made after seeing results are logged below with a timestamp, and both arms are re-graded with the
  changed instrument.

## Deviations from the plan (recorded as they happened)

- **2026-10-08 01:00, a run terminated by the harness; a third skill run added.** The first launch of the four runs
  failed at once with HTTP 401 (the CLI's login had lapsed, as in round 2); the user logged in again and the runs were
  relaunched unchanged. Skill run 2 then ended after 34 minutes without a verifier, ratings, gates or a reply: its lead
  started the verifier as a background subagent and ended its turn to wait for it ("I'll continue when it reports
  back"), and `claude -p` stops waiting for background work after 600 s and terminates the session (its own message:
  "Background tasks still running after 600s; terminating. Set CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0 to wait
  indefinitely"). In an interactive session the lead would have been woken by the subagent's result. Decided now: the
  harness lifts that ceiling for every later run (`run-headless.mjs` sets the variable); run 2 stays on record as
  terminated, with its script results (what it had matched before verification) but without a blind grading, since it
  produced no report; and a third skill run is made under the lifted ceiling so that the comparison has two complete
  runs per arm, as the plan intended. The two control runs completed (3 and 4 minutes) and are graded as planned. The
  termination itself is logged as a skill problem (the lead waiting on a background verifier by ending its turn is
  fragile in print mode), see the report.
