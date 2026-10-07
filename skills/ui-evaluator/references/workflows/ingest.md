# Workflow: ingest

Bring real-user evidence into the findings register: test observations, survey answers, support tickets, reviews, interview notes, analytics exports and stakeholders' agree/disagree sheets. This is where audits and user feedback finally meet. Each feedback theme either strengthens an existing finding (raising its frequency and evidence level) or becomes a candidate that must be reproduced. Severity is then re-rated with the observed frequency.

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

Use this workflow:
- after usability sessions or a survey (`study`);
- when the owner shares user feedback, tickets, reviews or analytics;
- when stakeholders return the `agree-disagree.csv` from a report;
- whenever someone says "users are complaining about…".

## 2. Preconditions

| Precondition | Check | If missing |
|---|---|---|
| Workspace exists | `.ui-evaluator/` | `setup` (`uie init`) |
| A findings register to link to | `.ui-evaluator/findings.json` | not required. Themes can create candidates, but an `audit` gives them something to link to |
| Permission to process the data | the owner confirms the data may be analysed here | ask. Feedback often contains personal data |

## 3. Inputs and outputs

**Inputs:** files in any of these forms:
- CSV matching `../templates/feedback-import.csv` or `../templates/observation-sheet.csv`;
- JSON;
- plain text or Markdown notes;
- `agree-disagree.csv`.

**Outputs:**

| File | Contents |
|---|---|
| `.ui-evaluator/feedback/raw/` | the originals; git-ignored |
| `.ui-evaluator/feedback/feedback.jsonl` | normalised, scrubbed items |
| `.ui-evaluator/feedback/themes.json` | themes with prevalence, extracts and links |
| the findings register | updated with links, frequency and evidence level; new candidates |
| `.ui-evaluator/studies/<study-id>/results.json` | computed metrics, when study data is present |

## 4. Steps

1. **Import and scrub.** Run `uie feedback import <file> --source <usability|survey|tickets|reviews|interviews|analytics|stakeholders> [--study <id>]` for each input.
   - It copies the original to `feedback/raw/`.
   - It normalises each item to the feedback schema, keeping the verbatim quote and the reporter's own severity scale in a separate field.
   - It replaces participant identities with codes and scrubs emails, phone numbers, card-like and ID-like numbers, and names in a supplied roster.
   - Run `uie feedback stats` to see counts per source and per participant.

2. **Classify every item** as one of: problem, bug, preference, feature request, praise or question. Praise matters. It tells the next `fix` what to preserve. Record classes with `uie feedback set <FB-ids> --class <class>` (several IDs at once); never hand-edit `feedback.jsonl`.

3. **Build themes.** Follow `../methods/feedback-analysis.md`: thematic analysis in six phases, or an affinity diagram.
   - Each theme records prevalence k/N (distinct participants or reporters out of the total) and at least two supporting extracts.
   - A single vivid quote cannot create a theme. It may still create a *candidate* finding that must be reproduced [HCI-057].
   - Tag items with `uie feedback set <FB-ids> --theme <name>`, write the themes to `feedback/themes.json`, then run `uie feedback themes`. It checks that every extract exists and comes from ≥ 2 different people, recomputes prevalence k/N from the items (`--fix` writes the computed values) and lists problem themes that are neither linked nor candidates.

4. **Link themes to findings.** For each theme, search the register (`uie findings list --q "<terms>"`) and link matches with `uie findings link <F-id> --feedback <FB-ids>`. Linking:
   - raises the finding's observed frequency;
   - raises its evidence level to E3 (observed, k of n);
   - attaches the extracts as evidence.

   Map unmatched problem themes to the heuristic, CW question or journey step they concern, and add them as candidates: write them to `runs/<id>/evaluators/feedback.json` as an evaluator output with `"role": "feedback"` and `"agent": "feedback"`, each candidate citing its items as quote evidence (`"ref": "feedback:FB-0012"`), then run `uie findings merge`. Feedback candidates are never counted as an inspector in detection k of N. Candidates go through verification like any other: reproduce them with `uie probe` against the current build before they become findings.

5. **Resolve disputes with evidence.** Findings in `disputed` status leave it here:
   - users experienced the problem → back to `open` with E3 evidence;
   - a well-powered test shows no problem → `dismissed`, with the evidence recorded in the dismissal ledger.

   Behaviour beats self-report. A failed task rated "easy" is still a failure, and praise for the visuals does not offset observed task failures [HCI-056, HCI-078].

6. **Compute metrics** when study data is present. Add `--save <study-id>` to each command so the result lands in `studies/<study-id>/results.json` (validated):
   - task success from the observation sheet: `uie study outcomes --file <observation-sheet.csv> --critical <task-ids>` (k of n unassisted successes per task; assisted counts as failure). For a single rate: `uie study ci --successes x --n n`;
   - time on task: `uie study time --file <csv>`;
   - SEQ: `uie study seq --file <csv>`;
   - SUS: `uie study sus --file <csv>`;
   - UMUX-Lite: `uie study umux --file <csv>`;
   - fix confidence for RITE-style re-tests: `uie study rite`.

   Results are E4 with intervals. Never report quantitative benchmarks or NPS from a 5-user formative round.

7. **Re-rate severity with observed frequency.** Spawn three severity raters again for the findings whose frequency changed (`uie packet --role severity-rater --n 3 --only-changed`), then run `uie findings rate`. Raters now see observed frequency as data rather than estimating it [EVAL §3.5].

8. **Agree/disagree sheets.** For stakeholder sheets:
   - "disagree" on an E0–E1 finding moves it to `disputed`, unless the stakeholder gives evidence that it is not a problem; then it is `dismissed`, with the reason;
   - "agree" from a qualified expert raises the evidence level to E2.

   Record who reviewed.

9. **Analytics.** An anomaly becomes a candidate finding only when it clears a signal rule, for example ≥ 3× the baseline rate, ≥ 10 sessions and ≥ 5 distinct people. It always gets a qualitative probe (a replay, a session or a walkthrough of that step). It is described as an association, with candidate confounds, never as a cause [HCI-064/066].

10. **Report back.** Run `uie report --feedback` to produce the theme summary: themes with prevalence and extracts, linked findings with their new severities, new candidates, and items that were praise. Feedback-sourced findings are only *resolved* by a human or the original reporter [ADR-020]. They become `verified` only on evidence their fixer did not produce: the fix reviewer's `confirmed_fixed`, a re-run of a deterministic check that no longer reports them, or a human. Your own re-check moves them only to `fixed` [ADR-030].

## 5. User checkpoints

- Before importing: confirm permission to process the data, and supply a participant roster for name scrubbing if one exists.
- After theming: show the top themes with prevalence and ask whether any theme is misread. Owners often know context that the text lacks.

## 6. Exit criteria

- Every item is classified, and every problem theme is linked or turned into a candidate.
- Severities of linked findings are re-rated (EMP-03).
- Disputed findings have moved where the evidence allows.
- Personal data is scrubbed from everything outside `feedback/raw/`.
- Next: `fix` for confirmed problems; `study` for questions still open.

## 7. Degraded operation

| Situation | What changes |
|---|---|
| No subagents for re-rating | Re-rate yourself in a separate pass, reading only the rating packet, and mark the ratings `DEGRADED: single-rater`. They stay provisional |
| Only free text, no participant identities | Prevalence is counted per item, not per person. Say so; prevalence may be inflated by repeat reporters |
| No current build to reproduce candidates | Keep candidates as `needs_verification` and do not report them as findings |

## 8. Common failure modes

| Failure | Prevention |
|---|---|
| One loud quote driving a redesign | themes need prevalence and ≥ 2 extracts; single quotes become candidates only |
| Quoting personal data in reports | scrub on import; participant codes; raw files stay git-ignored |
| Treating "users said they like it" as proof of usability | behaviour beats self-report; aesthetic-usability guard |
| Mapping a reporter's "critical" straight to severity 4 | the reporter scale is a prior; raters decide |
| Causal claims from dashboards | association wording; confounds listed; E5 needs an experiment |
| Agent closing user-reported problems itself | only humans or reporters set `resolved` |
