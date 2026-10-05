# Workflow: report

Communicate results honestly: what was evaluated, how, what was found, how sure we are, what was not checked, and what to do next. A report that overstates its evidence does more harm than no report, because people act on it.

## Contents
1. Purpose and when to use
2. Preconditions
3. Inputs and outputs
4. Steps
5. User checkpoints
6. Exit criteria
7. Degraded operation
8. Common failure modes

## 1. Purpose and when to use

Use this workflow at the end of `audit`, `verify` or `ingest`, or whenever the owner asks for a report, summary, scorecard or "where are we".

## 2. Preconditions

| Precondition | Check | If missing |
|---|---|---|
| A run with computed gates | `runs/<id>/gates.json` | `uie gates` |
| Findings verified and rated | `uie findings list --run <id> --status candidate` is empty | finish the `audit` steps |

## 3. Inputs and outputs

**Inputs:** the run directory, the findings register, the debrief, the ledger and the debt register.

**Outputs:**

| File | Purpose |
|---|---|
| `runs/<id>/report.md` | the report (template `../templates/report.md`) |
| `runs/<id>/report.html` | the same report, self-contained, with crops inline |
| `runs/<id>/agree-disagree.csv` | stakeholder review sheet; it returns through `ingest` |
| `.ui-evaluator/index.md` | the run and level, appended |

## 4. Steps

1. **Generate.** `uie report` renders the report from the run's artifacts. Do not hand-write findings into the report: everything in it must trace to a file. The report contains, in order:
   1. **Header:**
      - scope (routes, states, matrix);
      - context summary (users, tasks, modes);
      - method and depth;
      - evaluators with providers and models;
      - DEGRADED banners;
      - the coverage statement (what a single pass is expected to find; what was not assessed).
   2. **Verdict:** target level, achieved level, the gates table, and the blocking criteria for the next level.
   3. **Strengths to preserve:** things that work well, with evidence.
   4. **Findings by priority:** P0 → P3. Each finding shows its title, problem type, criterion, evidence crop, wording that matches its evidence level, severity mean and spread, ease of fix, recommendation and status.
   5. **Divergent and disputed findings:** framed as questions for user research.
   6. **WCAG coverage matrix:** auto, scripted, agent-judged, needs-human and not-tested, for each of the 55 criteria. Never "compliant".
   7. **Not assessed:** everything the input situation or depth could not cover.
   8. **Fixes and verification:** the fixes table with commits, verdicts, and the cleared, introduced and persisting sets, with partially fixed deterministic findings shown as k of n instances cleared (ADR-033).
   9. **Next steps:** what each next level needs; the study plan if one exists; the debt-register summary.

2. **Language lint.** `uie report` lints the prose it renders and the finding text. It checks for:
   - "users …" claims below E3;
   - causal verbs below E5;
   - completeness claims ("all issues", "fully accessible", "WCAG compliant");
   - metrics from simulations;
   - single-rater severities not labelled provisional.

   Fix flagged wording at its source (the finding or `debrief.md`) and re-run until clean (EVD-06).

3. **Read it once yourself.** Check that the summary at the top would let a busy owner decide what to do in two minutes. Check that nothing in it would surprise someone who later reads the evidence.

4. **Share.** Give the owner the paths to `report.md` and `report.html`. Explain that `agree-disagree.csv` can go to stakeholders and comes back through `ingest`. For L3, the owner's own sheet *is* the human confirmation.

5. **Index.** `uie` appends the run, target, achieved level and blocking criteria to `.ui-evaluator/index.md`.

## 5. User checkpoints

Present the summary in chat:
- the level reached vs the target;
- what blocks the next level;
- the P0/P1 findings, at most seven lines;
- the next-step options.

The full report stays in the files.

## 6. Exit criteria

- The report is generated, the language lint is clean, and the files are linked to the owner.
- The index is updated.

## 7. Degraded operation

| Situation | What changes |
|---|---|
| Static mode (screenshots only) | The report states in its header that no assurance level is reachable. Every runtime claim is labelled `potential — unverified` |
| Degraded independence | DEGRADED banners appear at the top, and the level is reported as "(degraded)" |

## 8. Common failure modes

| Failure | Prevention |
|---|---|
| Writing "the UI is accessible" or "all issues fixed" | the language lint; the coverage matrix |
| Burying the verdict in detail | verdict first, then strengths, then findings |
| Reporting scores as if they were measurements | scores are labelled *(judged)* and never gate |
| Omitting what was not checked | the "Not assessed" section is mandatory |
