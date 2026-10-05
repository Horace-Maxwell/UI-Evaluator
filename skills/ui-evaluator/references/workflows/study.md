# Workflow: study

Plan empirical evaluation with real people: usability tests, surveys, desirability tests and experiments. Inspection, by humans or models, predicts problems. Only people show what actually happens. The CMU lecture's chain applies throughout: **objectives → tasks → data → analysis**.

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
- after an audit leaves **divergent** or **disputed** findings (raters or the owner disagree), which go to users rather than to a vote [ADR-018];
- before a release targeting L4;
- when the owner asks for a usability test, a survey, a desirability study or an A/B test;
- when `PRODUCT.md` rests on assumptions that would be expensive to get wrong.

The agent plans, prepares materials, pilots with clearly labelled simulations, and analyses results. People run sessions with participants. The agent never fabricates participant data.

## 2. Preconditions

| Precondition | Check | If missing |
|---|---|---|
| Context and journeys | `PRODUCT.md`, `.ui-evaluator/journeys/` | `setup` |
| A question worth answering | a divergent or disputed finding, an assumption, a release decision | ask the owner what decision the study should inform |
| A testable build or prototype | the app runs, or a clickable prototype exists | `build` |

## 3. Inputs and outputs

**Inputs:**
- divergent and disputed findings (`uie findings list --status disputed`, `uie findings list --divergent`);
- journeys;
- `PRODUCT.md` users and groups;
- the owner's constraints (time, budget, access to participants).

**Outputs** in `.ui-evaluator/studies/<study-id>/`:

| File | Contents |
|---|---|
| `plan.md` | the study plan (from `../templates/study-plan.md`) |
| `tasks.md` | task cards (`../templates/task-card.md`) |
| `moderator-guide.md` | the moderator's script |
| `consent.md` | the consent form |
| `instruments/` | SEQ, SUS or UMUX-Lite forms, reaction cards |
| `data/observation-sheet.csv` | the empty observation sheet |
| `analysis-plan.md` | how the data will be analysed |
| `ab-spec.md` | for experiments |

## 4. Steps

1. **State the objectives and decisions.** What will the owner decide differently depending on the result? Write 1–3 objectives and the research questions that serve them. Studies without a decision attached produce reports nobody uses.

2. **Choose the method** using the table in `METHODS.md` §2, as summarised in `../methods/usability-testing.md`:

   | Question | Method | Read |
   |---|---|---|
   | Why do people fail, and where? | formative usability test (about 5 per user group per round, think-aloud) | `../methods/usability-testing.md` |
   | How good is it, or is it better than before? | summative benchmark (n from margin of error; default 40 per condition) | `../methods/surveys-metrics.md` |
   | Does it feel like the brand intends? | desirability reaction cards + 5-second test | `../methods/surveys-metrics.md` |
   | Will this change improve behaviour at scale? | A/B experiment | `../methods/experiments-analytics.md` |
   | What are existing users already telling us? | feedback analysis (route to `ingest`) | `../methods/feedback-analysis.md` |

3. **Size the study.** Use `uie study samplesize` for margins of error and `uie study discovery` for the chance of seeing a problem of rate p across n sessions. For A/B tests use `uie study ab`. Never promise a coverage percentage from a formative test [HCI X1].

4. **Write tasks.** Derive them from the journeys (`../methods/cognitive-walkthrough.md`, task derivation). Each task is:
   - realistic and actionable ("do", not "say how");
   - free of UI labels;
   - paired with a predefined success criterion.

   Use `../templates/task-card.md`.

5. **Plan participants.** Write a profile and screener per user group. Plan recruiting. Incentives are **flat**, never tied to performance, because performance-contingent rewards narrow attention and distort behaviour (CMU lecture). Plan sessions of 30–60 minutes, at most 6 per day, with at least 15 minutes between them.

6. **Prepare the materials:**
   - the moderator guide (`../templates/moderator-guide.md`): neutral probes only, intervention logging, SEQ after each task, SUS or UMUX-Lite at the end;
   - consent (`../templates/consent.md`);
   - the observation sheet (`../templates/observation-sheet.csv`, whose columns match the feedback schema so that `ingest` can read it directly).

7. **Write the analysis plan before collecting data:**
   - which metrics, and with which intervals (adjusted-Wald for success; geometric mean for time; t-intervals for SEQ and SUS);
   - how observations become findings (k of n, severity re-rating);
   - what result would change which decision.

   For A/B tests, pre-register the overall evaluation criterion, the guardrails, the power, the duration, the SRM check and the no-peeking rule in `ab-spec.md`.

8. **Pilot.** Pilot every task. You may run a *simulated* pilot with a walkthrough evaluator to catch broken or leading tasks. Label it simulated; it is never data [ADR-028]. Then ask the owner to run one real pilot session before the study.

9. **Hand over.** Give the owner the study folder and a one-paragraph checklist: who to recruit, how to run a session, where to record observations, and how to bring the results back (`ingest`).

## 5. User checkpoints

- Step 1: confirm the decisions the study informs.
- Step 5: confirm access to participants, incentives and timing.
- Step 8: the owner runs the real pilot.

## 6. Exit criteria

- EMP-01: the plan is complete per the template: objectives, questions, participants with flat incentives, tasks with success criteria, measures, analysis plan, ethics and consent.
- Materials are ready, and the tasks are piloted, or the plan says why they could not be.
- Next: the owner runs the sessions, then `ingest`.

## 7. Degraded operation

| Situation | What changes |
|---|---|
| No access to participants | Plan the study anyway, and say clearly that L4 is unreachable until it runs. Offer cheaper options: 5 colleagues outside the team, or a remote unmoderated test for one focused question [HCI-048] |
| Only analytics available | Route to `ingest` with analytics signal rules. Results are associations, not causes |

## 8. Common failure modes

| Failure | Prevention |
|---|---|
| Tasks that contain the UI's own labels, so findability problems are hidden | the task lint in `../methods/usability-testing.md` |
| Leading or helping participants | neutral probes; log every intervention and exclude affected segments from metrics |
| Reporting SUS or NPS from 5 users as a benchmark | formative rounds report problems, not rates |
| Peeking at A/B results and stopping early | fixed horizon or always-valid inference |
| Paying per success | flat incentives |
| Treating a simulated pilot as evidence | it is labelled simulated and never enters findings as E3+ |
