# Round 6, 2026-10-16: the three round-5 fixes on `slot-booking`, plan written before the runs

## Objective ("What do I need to know?")

Round 5 met both release bars in all three skill runs and listed three problems in the skill, fixed after it:
same-cause proposals collapsed on the one-line bundle (fixed in `3f479cc`, ADR-039 amended: a minified line groups by
column), the verifier rejected a true problem for one overstated clause (`3f479cc`: a confirmed verdict may carry
`corrected_description`), and the checks that wait came late and were spread over several verifiers (`31ecaaf`:
`time_bound` candidates first, in a part of their own). This round asks whether the three fixes show in use, and
whether the bars still hold with them.

## Tasks

Eval 21 (`audit-standard-slot-booking`), unchanged: the prompt is round 5's word for word, the site files match round
5's source hashes, and the ground truth is the same 14 seeded defects (five deterministic, nine judged). One arm:

- `with_skill`: the plugin at commit `31ecaaf` (2.3.0 and the Unreleased changes), three runs, ports 4731–4733,
  Claude Code 2.1.299, `claude-opus-5-5`, a budget of $60 a run, the runner settings of round 5.

No control arm. The fixes change only the skill, and round 5's controls on the same fixture and ground truth (12 to
13 of 14 found, precision 0.77 to 0.90, about $1 a run) stand as the comparison; the report says the controls are not
from the same day.

## Data

As in round 5: transcripts, the skill's run files, timing, tokens and cost; the nine script assertions of eval 21; two
blind graders per complete run under neutral codes and an adjudicator for their splits, `agree-graders.mjs`;
`trace-check.mjs`. For the fixes, from each run's files: the code reviewer's locations, `merged.json`'s proposals and
the `--accept` calls in the transcript; every verifier packet's `candidates.json` and README; every `verifier*.json`;
the verifier subagents' calls in the transcript.

## Analysis, decided now

| # | Question | Measure | Pass or expectation |
|---|---|---|---|
| 1 | Release bars with the fixes | recall ≥ 0.6 and judged precision ≥ 0.8 per run, by the adjudicated mapping, with adjusted-Wald 95% intervals | met in all three runs, or the count of runs that meet each is reported |
| 2 | Fix 1: same-cause proposals on the bundle | the share of the code reviewer's `app.js` locations that carry a column above 0; the number and sizes of same-cause proposals; the `--accept` calls; the most findings mapped to one seeded defect (round 5: 7, 4, 5) | no proposal of more than ten members (round 5: 31 to 38); the rest reported |
| 3 | Fix 2: corrected descriptions | confirmed verdicts with `corrected_description`, and how the graders mapped those findings; `not_reproduced` rejections of candidates that describe a seeded defect, read against the ground truth (not blind; round 5: one, D13 in run 3); D13 found (round 5: 1 of 3 runs) | counts reported; no seeded defect lost to a rejection for wording |
| 4 | Fix 3: checks that wait come first | the `time_bound` candidates per packet and the part that holds them; in the verifier that holds them, the position among its calls of the first probe that waits more than two minutes, and whether it ran in the background (round 5: the 16th to 33rd call); each verification part's wall time | that wait starts among the verifier's first five calls; the rest reported |
| 5 | Precision by role | counted findings only the critics reported, and how many the graders called real (round 5: 5, 2, 0, all real); design notes per run (round 5: 6, 9, 7) | reported |
| 6 | Honesty and trace | level claimed ≤ computed; report lint 0; the trace assertions | 0 overclaims, 0 violations |
| 7 | Cost and time | per run, against round 5 ($26.37 to $27.96, 51 to 68 min) | reported |

Decided now: the matching rules of rounds 3 to 5 apply; grading follows round 5 (two blind graders who see neither the
arm nor the round, an adjudicator for their splits); a run terminated by the harness or by an account limit is
recorded and replaced; instrument changes after seeing results are logged below with a time and applied to every run.

## Deviations from the plan (recorded as they happened)

- 2026-10-16, 23:44, after run 3 finished and before any grading. `grade-eval.mjs`'s assertion "Verification and
  three blind ratings exist" read only `verifier.json`, and run 3's lead verified in three parallel parts that wrote
  `verifier-p1.json` to `verifier-p3.json` and no `verifier.json` (in round 5 every run also had a `verifier.json`, from
  its pass over split parts). The assertion now reads every `verifier.json` and `verifier-p<k>.json` and needs all of
  them valid; it applies to every run of this round, and the grader packet it writes is unchanged.
- 2026-10-17, while grading. Instrument notes, applied to every run they concern and to round 5's figures where this
  report compares with them:
  - Question 4 is read with a transcript script (`waits`): for each verifier subagent, every call of its own that ran
    two minutes or more, or that asked for a wait of 120 s or more in a probe's actions (read from the actions file
    when the verifier wrote one first). Round 5's figures for the comparison were measured again with the same script
    (first long wait at call 26, 16 and, in run 3, 57 in the pass over split parts; its report gave "the 16th to 33rd"
    from a reading by hand).
  - In runs 1 and 2 the pass over split parts rebuilt `packets/finding-verifier-1`, so the first pass's part-1 packet
    is no longer on disk. What each verifier was given is read from its own read of `candidates.json` in the
    transcript (the packet on disk where the transcript has no such read).
  - `record-evals.mjs` kept `verifier.json` only; it now keeps the parallel parts' `verifier-p<k>.json` as well, since
    run 3 has no `verifier.json` and question 3 reads the parts' verdicts.
  - Grading: L5's graders split on one item (F-0042), settled by an adjudicator; W8's and C3's graders agreed on every
    item and assertion, so their consensus is the agreed mapping.
