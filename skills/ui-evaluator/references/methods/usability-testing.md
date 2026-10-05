# Usability testing (formative)

A formative usability test puts the product in front of real people, watches what they do, and turns what goes wrong into findings with observed frequencies (k of n). It is the empirical half of the alternation the CMU lecture prescribes, and it follows the lecture's chain: objectives → tasks → data → analysis. This file serves G7 criteria EMP-01 to EMP-05. Read it in the `study` workflow when planning and piloting sessions, and in the `ingest` workflow when session notes come back. Benchmarks with confidence intervals belong to `surveys-metrics.md`.

## Contents

1. [Purpose and when to use](#1-purpose-and-when-to-use) · 1.1 Who does what · 1.2 Gate criteria served
2. [Inputs](#2-inputs)
3. [Procedure](#3-procedure)
   - 3.1 Plan · 3.2 Participants and sample size · 3.3 Tasks and the task lint · 3.4 Pilot · 3.5 Moderation · 3.6 Session logistics · 3.7 Incentives · 3.8 Remote unmoderated sessions · 3.9 Observation logging · 3.10 RITE triage and fix confidence · 3.11 Analysis into findings · 3.12 Ethics, consent and data handling
4. [Output format](#4-output-format)
5. [Quality checks](#5-quality-checks)
6. [Pitfalls](#6-pitfalls)
7. [Sources](#sources)

---

## 1. Purpose and when to use

Use a formative test when the question is *do real users succeed, and why not?* (METHODS §2). Typical triggers:

- findings in `disputed` status or marked divergent (rater spread ≥ 2, or a not-a-problem vote against a mean ≥ 2.5; ADR-029). They leave that state only through evidence from `study` or `ingest`, never through a vote (FRAMEWORK §8.2);
- critical journeys before an L4 claim;
- a redesign of a flow people already use;
- inspection results the owner doubts. Heuristic evaluation and user testing find substantially different problem sets, so neither replaces the other (06 §3.1).

Do not use it to estimate how often a problem occurs in the population, to compare against benchmarks, or to show that a change caused an improvement. A round of about five finds problems and does not estimate rates (METHODS §10). Use a summative benchmark (`surveys-metrics.md`) or an experiment (`experiments-analytics.md`) for those questions.

### 1.1 Who does what

People run sessions with people. The agent prepares, analyses and fixes. It never stands in for a participant.

| Activity | Agent | Humans |
|---|---|---|
| Objectives, research questions, screener, tasks, consent text, moderator guide | drafts them from the templates | the owner approves; EMP-01 is verified by a human (`H`) |
| Pre-pilot of tasks and environment | runs a simulated walkthrough, labelled as simulated | — |
| Pilot session | prepares it and analyses it | a moderator runs it with a person |
| Recruiting, scheduling, paying incentives | never | the owner or a researcher |
| Consent, moderation, note-taking | never | the moderator and note-takers |
| Importing, scrubbing, coding, counting, linking, statistics | yes | the owner reviews themes and wording |
| RITE triage between sessions | proposes a category per problem | a decision-maker confirms |
| Fixes between sessions | yes, through the `fix` workflow | the decision-maker approves the scope |
| Moving a finding to `resolved` | never | the owner, or the original reporter |

The agent never contacts participants, never keeps their contact details and never presents simulated output as session data. Simulated users are too competent and too agreeable to stand in for people: in one study, LLM walkers completed 97–100% of tasks against 88% for humans, and all LLM runs together surfaced 3 failure points against 10 from people [HCI-023, HCI-036].

### 1.2 Gate criteria served

Repeated exactly from QUALITY-BAR G7. `Verify`: `H` human, `U` real users, `A` isolated agent judgement.

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| EMP-01 | Study plan | objectives → research questions → participants → tasks with success criteria → measures → analysis plan → ethics and consent; flat incentives | H | HCI-044, lecture |
| EMP-02 | Formative round | moderated round with about 5 participants for a single primary user group (3–4 per group when two groups are tested; ≥ 3 per group for three or more); think-aloud; neutral probes; clue-free tasks from the journeys | U | HCI-041/045/046 |
| EMP-03 | Observed problems integrated | each logged with k/n; merged with analytical findings; severity re-rated with observed frequency | U/A | HCI-057, EVAL §3.5 |
| EMP-04 | Critical tasks succeed | in the latest round, each critical task completed without assistance by ≥ 80% of participants (e.g. ≥ 4 of 5); no open observed severity-4 problem | U | HCI-049, §6 |
| EMP-05 | Fixes re-tested | every observed problem of severity ≥ 3 fixed and re-tested with users; fix confidence 1 − (1 − p)^n reported | U | HCI-038/039 |

How to read them in practice:

- **EMP-02** counts participants per *primary* user group in the round being claimed: about 5 for a single group, 3–4 per group when two groups are tested, and at least 3 per group for three or more (the planning rule in §3.2).
- **EMP-04** is a count over the latest round ("4 of 5 participants booked without help"), not a rate estimate. A completion after any hint is assisted and does not count.
- **Unmoderated rounds** cannot meet EMP-02 on their own, because nobody is present to probe (§3.8).
- L4 needs G7 to pass (QUALITY-BAR §3). `uie gates --target L4` shows which EMP criteria still block it.

## 2. Inputs

| Input | Where | Why |
|---|---|---|
| User groups, top tasks, context of use, accessibility needs, target level | `PRODUCT.md` | usability exists only for specified users, goals and context, so recruiting and success both start here [HCI-001] |
| Journeys with criticality and success conditions | `.ui-evaluator/journeys/*.json` | tasks come from journeys; criticality decides which tasks EMP-04 covers |
| Disputed and divergent findings | `uie findings list --status disputed`, `uie findings list --divergent` | the research questions should settle what inspection could not |
| The build and its version | the running app; `ui_version` in the latest run manifest | every session records the build it saw, so counts can be split by version |
| Latest ARIA snapshots | `.ui-evaluator/runs/<id>/evidence/aria/` | the task lint compares task wording with visible labels (§3.3) |
| Templates | `../templates/study-plan.md`, `task-card.md`, `moderator-guide.md`, `consent.md`, `observation-sheet.csv` | the plan structure that EMP-01 checks |

## 3. Procedure

### 3.1 Plan (EMP-01)

Write the plan to `.ui-evaluator/studies/<study-id>/plan.md`. Vague goals let task scenarios drift between observers, which is one of the three root causes of the evaluator effect [HCI-044]. Fill these fields in order (Rubin & Chisnell's plan, in the lecture's chain):

1. **Objectives.** One to three decisions the study informs, such as "decide whether online booking can be claimed at L4" or "settle disputed finding F-0031". A study with no decision attached produces a report nobody acts on.
2. **Research questions.** Specific, answerable by watching, and linked to finding or journey IDs. Write "Can first-time clients book a vaccination for a named pet without help?" rather than "Is booking easy?".
3. **Participant profile and screener** (§3.2).
4. **Method.** Moderated in person, moderated remote, or unmoderated (§3.8); think-aloud protocol (§3.5); number of rounds.
5. **Tasks with success criteria** (§3.3), written to `tasks.md`.
6. **Environment.** Devices, browsers and viewports that match the context of use; the build version; test accounts and seeded data; how the start state is reset between sessions.
7. **Moderator role.** Who moderates, who takes notes, who observes; the protocol and the stop rule for each task (`moderator-guide.md`).
8. **Measures.** Observed problems with k/n. Per task: completed without assistance, completed with assistance, failed or abandoned. Errors. SEQ after each task if collected. Time on task only when the protocol allows timing (§3.5).
9. **Analysis and report plan** (`analysis-plan.md`): how notes become findings (§3.11), who re-rates severity, what the report will state, including its limits. Write it before the first session, so the data cannot steer the analysis.
10. **Ethics, consent and data handling** (§3.12), with the flat incentive stated (§3.7).

Show the plan to the owner and record their approval in `plan.md`. EMP-01 is verified by a human, so an unapproved plan does not pass.

### 3.2 Participants and sample size

- **Per round:** about 5 participants per distinct user group; 3–4 each when there are two groups; at least 3 each for three or more groups. Plan several small rounds rather than one large one, because the aim is to find, fix and re-test [HCI-041].
- **Recruit representative people.** Exclude people who build, sell or support the product, and usability professionals. Screen on behaviour ("When did you last book an appointment for a pet?") rather than on self-description ("Are you good with apps?"). Keep the product and the hypothesis out of the screener, because they prime behaviour. Include people who use assistive technology whenever the audience includes them, and let them use their own setup.
- **Raise n for complex or heterogeneous products,** and estimate the problem discovery rate p after 2–4 sessions instead of trusting a default [HCI-042]. Use the METHODS §9.6 estimator λ̂ = Σₖ kₖ / (N·F) with sessions in place of passes: N is the number of sessions so far, F the number of distinct problems seen, and kₖ the number of sessions that showed problem k. Use λ̂ as p. With few sessions the estimate runs high, so the n it implies is a minimum.
- **Plan n with `uie study discovery`.** P(problem seen at least once in n sessions) = 1 − (1 − p)^n, and the sessions needed for a target probability P are n = ln(1 − P) / ln(1 − p) (METHODS §9.5). To have an 85% chance of seeing a problem that affects 15% of people you need 12 sessions; five sessions see a p = .10 problem only 41% of the time (derived) [HCI-042].
- **Never claim coverage.** In Faulkner's resampling, groups of five found anywhere from about 55% to 100% of known problems, so "five users find 85%" is not a property of any single study (06 §3.2 X1). Report what was found, the n, and what was not tested.

### 3.3 Tasks and the task lint

Derive each task from a journey: its scenario (no UI words), its start state and its observable success condition. Give participants the goal, never the correct action sequence; the sequence belongs to the cognitive walkthrough, not to the test [EVAL-123]. Use `../templates/task-card.md` for each task.

1. **Realistic.** A goal a real client would have, with every detail needed to finish it: "Book a rabies vaccination for your cat, Miso, at the Northside clinic on any weekday morning next week." [HCI-045]
2. **Actionable.** Ask people to do it, not to describe how they would. A participant narrating hypothetical clicks is a sign the task is not actionable.
3. **Clue-free.** No labels, menu names or step hints taken from the UI. Use the established term only when no natural alternative exists.
4. **Success criteria fixed before any session:** the observable end state (the appointment appears in the client's upcoming visits with the right pet, service and time); what counts as assistance (any hint from the moderator about where or how); and the stop rule (when the moderator ends the attempt and records a failure). Success is binary. Partial progress goes in the notes, not the score.
5. **Order.** Start with a simple task. When tasks or versions are compared, rotate the order across participants so that learning does not favour later tasks.

**Task lint.** Before piloting, compare the words of every task with the visible labels and accessible names in the latest ARIA snapshots. Reword any task that repeats a control's name or describes a step, and list the labels you deliberately kept out as the card's avoided hints. Clued tasks hide findability problems: detailed step text surfaced more feedback problems but fewer "can't find the control" problems [HCI-024]. Record the lint result in `plan.md`.

Ask participants to read each task aloud, which makes sure they read all of it.

### 3.4 Pilot every task

1. **Simulated pre-pilot (agent).** Replay the journey with `uie journey <id>` to confirm that the start state is reachable and the success condition can be observed, then read every task card against the UI for clues and ambiguity. Write the result in `plan.md` under a heading that starts with `SIMULATED PILOT (not participant data)`. It reaches E1 at most, and its completion and timing say nothing about people [HCI-036].
2. **Human pilot.** A moderator runs the full session with one person: a colleague outside the team, or a participant whose data is not counted. Fix tasks that people misread, timings that overrun, broken environments and unclear consent wording, then freeze the protocol. Pilot data never enters the counts.

### 3.5 Moderation

- **Concurrent think-aloud is the default** for finding problems. In one comparison it found more problems than retrospective think-aloud for about half the analysis time [HCI-047].
- **Use retrospective or silent sessions when time on task or success is the measure,** or when tasks are complex enough that talking interferes. Concurrent think-aloud hurt task performance in another comparison (06 §3.2 X4) [HCI-047].
- **Keep the protocol identical across anything you compare.** A conversational protocol and a strict one found the same problems, but participants under the conversational one completed more tasks (06 §3.2 X5). When collecting metrics, use the strict form: only a neutral reminder to keep talking after about 15–20 seconds of silence.
- **Probe only neutrally** [HCI-046]:
  - *echo*: repeat the participant's last words as a question ("Not sure which clinic?");
  - *boomerang*: hand the question back ("What would you do if you were on your own?");
  - *Columbo*: ask an open, deliberately unfinished question ("And this part is…?").

  Avoid closed and leading questions ("Did you see the date picker?"), explanations of the design and reassurance about it.
- **Log every intervention** with its time, the words used and why. Exclude the affected segment from metrics, and count a task completed after a hint as assisted [HCI-046].
- **Reassure at the start** that the product is being tested, not the participant, and that they can stop at any time [PLAT-142].
- **Observers stay silent and out of the participant's view.** Remote observers keep cameras and microphones off.
- **After the tasks,** ask open debrief questions, then administer any questionnaires: SEQ after each task, SUS or UMUX-Lite at the end. Scoring is in `surveys-metrics.md`.

### 3.6 Session logistics

- Sessions last 30–60 minutes, with at most 6 sessions per day and at least 15 minutes between sessions for notes and resetting [PLAT-142].
- Fit the number of tasks to the session length using the pilot's timings.
- Before each session: record the build version, reset test data to the start state, check the recording set-up, and have the consent form ready.
- Over-recruit to cover no-shows, more so for unmoderated sessions [HCI-048].
- Have at least one note-taker besides the moderator. When the same think-aloud sessions were analysed by two evaluators instead of one, they found about 42% more problems (Hertzum & Jacobsen).

### 3.7 Incentives and motivation

Pay every participant the same flat incentive for taking part, whether they finish, succeed, go fast or stop early. Never tie payment, prizes or bonuses to success or speed. Performance-contingent rewards narrow attention and distort behaviour (Glucksberg's candle studies and Ariely's high-stakes experiments, as taught in the CMU lecture) [FRAMEWORK §9.3]. A participant paid for success has a reason to push through confusion, avoid exploring and hide the struggles the test exists to observe. State the incentive in the consent form, including that stopping early does not reduce it.

### 3.8 Remote unmoderated sessions

The testing tool plays the moderator: written tasks, automatic recording, nobody to ask. Use it only for focused questions about a few elements or about a minor change, never for a broad review [HCI-048]. You lose follow-up probes, help when people are stuck, reminders to keep talking (think-aloud gets quieter), and the chance to notice an unusable session before it ends. Rules:

1. Write tasks early and pilot them, because written instructions must stand entirely on their own.
2. Over-recruit to cover unusable sessions.
3. Keep a contact channel open for participants during the study. This is the owner's job, not the agent's.
4. Report unmoderated and moderated results separately. Unmoderated sessions alone cannot meet EMP-02.

Professionals analysing recordings found a similar share of problems in unmoderated and moderated sessions (32% against 33%), so the analysis effort does not shrink (06 §2.G.2).

### 3.9 Observation logging

Note-takers fill `data/observation-sheet.csv` (from `../templates/observation-sheet.csv`) during or right after each session, one row per observation. Its columns carry the feedback schema's fields so that `uie feedback import` can read the sheet directly, plus the session columns that analysis needs:

| Column | Feedback schema field | Content |
|---|---|---|
| study and session id | source | e.g. `vet-booking-r2 / S04` |
| moderated in person, moderated remote, unmoderated | channel | how the observation was made |
| date | date | the session date |
| participant code | participant code | `P04`, never a name |
| verbatim quote with recording timestamp | verbatim quote | exact words; empty when the row records behaviour only |
| reporter severity | reporter's own severity scale | left empty: participants do not rate severity, and note-takers do not either (§3.11) |
| problem, bug, preference, feature request, praise, question | classification | may be completed during analysis |
| finding IDs | linked findings | when the observation matches a known finding |
| theme | theme | completed during analysis |
| task id and outcome | session column | unassisted success, assisted, failed or abandoned; needed for EMP-04 |
| what the participant did | session column | neutral behaviour: "opened the clinic list twice, returned to the home page after 40 s" |
| route, state, element | session column | where it happened, for linking |
| prompted or spontaneous | session column | prompted statements carry less weight [EVAL-082] |
| intervention | session column | yes or no, with the words used; excluded from metrics [HCI-046] |
| note-taker's interpretation | session column | kept apart from what was seen |

Write what people did and said, not what you think they felt: "hovered over the price for 6 s, said 'is that per dose?'" rather than "was confused". Interpretations go in their own column [EVAL-082]. Each note-taker logs independently and the sheets are merged after the session, because one observer misses problems another catches.

Keep raw notes and the participant roster under `.ui-evaluator/feedback/raw/`, which is git-ignored. Recordings stay in the owner's research storage; the workspace keeps only timestamps and references.

### 3.10 RITE triage and fix confidence

When a decision-maker attends every session and the team can change the build before the next participant, iterate RITE-style [HCI-037]. After each session, place every observed problem in one category (METHODS §7.2):

| Category | Meaning | Action |
|---|---|---|
| 1 | obvious cause, quick fix | fix now through the `fix` workflow; the next participant sees the fixed build |
| 2 | obvious cause, slow fix | start the fix; test it once it is ready |
| 3 | unknown cause | gather more evidence before fixing |
| 4 | possibly caused by the script or the moderator | gather more evidence; correct the protocol if it is the cause |

The agent proposes the categories from the notes; the decision-maker confirms them. Without these preconditions, or without someone experienced in both the domain and typical user problems, run a conventional round and fix afterwards (06 §2.C.5).

- **Count per build version.** Record the build in every session and compute k/n per version. A fix starts a new denominator.
- **Expect new problems after a fix.** Removing a blocker lets participants reach later steps.
- **Fix confidence** [HCI-039]: after a fix, the probability that a problem with rate p would have shown up in n clean sessions is 1 − (1 − p)^n. Six clean sessions give 88% at p = .30 but only 47% at p = .10. A session is clean only if the participant reached the affected step and the problem did not recur. Use the problem's observed rate before the fix as p, and also report the value at p = .10, so readers see how much the conclusion depends on p. EMP-05 requires this figure for every observed problem of severity ≥ 3.
- **Track the impact ratio** (problems fixed ÷ problems found) **and the re-fix ratio** (re-fixes ÷ all fixes) [HCI-040]. In the RITE case study, 6 of the 30 problems fixed needed a second fix, which is why a fix stays a hypothesis until it is re-tested.
- `uie study outcomes --file <observation-sheet.csv> --save <study-id>` computes k of n unassisted successes per task from the sheet. `uie study rite --p <rate> --n <clean sessions> --problem <id> --save <study-id>` records fix confidence on that observed problem, and `--found`, `--fixed` and `--refixes` record the impact and re-fix ratios. `--save` merges the results into the study's `results.json`.

### 3.11 Analysis into findings (EMP-03, EMP-04)

1. **Import and scrub.** Run `uie feedback import <file> --source usability --study <study-id>` on each observation sheet, then `uie feedback stats` for counts per session, task and classification. Report the script's counts; do not count by hand.
2. **Task outcomes.** For each critical task in the latest round: k of n participants completed it without assistance, where n is the number who attempted it. Say how many did not reach the task and why. EMP-04 needs ≥ 80% (for example ≥ 4 of 5) and no open observed severity-4 problem.
3. **Problems.** Cluster observations into problems, one problem per record, keyed on the same location, the same failure mechanism and the same state (METHODS §5). Count distinct participants, not occurrences.
4. **Remarks without matching behaviour** (someone called a step confusing but completed it smoothly) are self-report. Code them with the theme rules in `feedback-analysis.md`: a theme needs prevalence k/N and at least two extracts [HCI-057].
5. **Link or create.**
   - If a problem matches an existing finding, link it: `uie findings link <F-id> --feedback <FB-ids>`. The finding gains the observed k/n and evidence level E3.
   - Otherwise write a candidate finding. Put the reproducible UI condition in the description (what the UI shows or does at that step, in that state and viewport) and the observation in the evidence (session IDs, timestamps, k of n). Check it with `uie findings validate`, build the verifier packet with `uie packet --role finding-verifier`, and spawn an isolated verifier subagent if your environment supports it. Otherwise do the role yourself, reading only that packet, and mark the output `DEGRADED: single-context`.
   - The verifier reproduces the UI condition; it does not have to be confused itself. If it rejects a candidate that rests on observed behaviour as `not_reproduced`, do not drop the observation. Check whether the build changed since the session (then the finding may be stale), and otherwise put it to the owner as `needs_human`. An agent failing to struggle is not evidence that people do not struggle [FRAMEWORK P9].
6. **Re-rate severity with observed frequency** (EMP-03). Build rater packets with `uie packet --role severity-rater --n 3 --only-changed`; each packet carries the finding's k of n as data, with its adjusted-Wald interval from `uie study ci` and what was observed (failed, gave up, needed help). At least three isolated raters score frequency, impact, persistence and the 0–4 label; record the result with `uie findings rate`. The criticality clamp and the divergence rule apply as usual (QUALITY-BAR §6).
7. **Disputed findings.** Move each disputed finding that the study addressed back to `open` with the session evidence (`uie findings set`, which records the actor). Only the owner dismisses a finding.
8. **Report.** Per task: k of n without assistance. Per problem: k of n, severity mean and spread, evidence level, anonymised quotes with participant codes and timestamps, linked finding IDs. Also include what worked well and must be kept, what was not tested (groups, devices, tasks), and the method limit: a formative test finds problems and does not estimate rates, so it carries no benchmarks and no NPS (METHODS §10). Use E3 wording: "3 of 5 participants did not find the clinic selector", never "60% of users".
9. **Gates and report.** Run `uie gates --target L4` and read the EMP states, then `uie report`, whose language lint enforces EVD-06.

### 3.12 Ethics, consent and data handling

These belong to EMP-01 and apply to every session, including pilots.

- **Informed consent before anything is recorded.** Use `../templates/consent.md`: the purpose, what participants will do, the duration, what is recorded and who sees it, how long data is kept and how to have it deleted, the incentive, and a contact. Ask separately for recording, for quoting their words in reports and for sharing clips. A no to any of these does not end the session.
- **The right to stop.** Participants may stop, or skip a task, at any time without giving a reason, and they keep the incentive. Say this aloud at the start, not only in the form.
- **Minimal data.** Collect only what the research questions need. Ask about age, health or other personal characteristics only when a research question depends on them, and record the reason in the plan.
- **Participant codes everywhere.** Use P01, P02 and so on in every note, file and report. The roster that maps codes to people stays with the owner or under `feedback/raw/`, never in `plan.md`, `results.json` or a report.
- **Anonymised quotes.** Before a quote enters a report, remove names, places, account details and anything else that identifies the participant or people they mention.
- **Real data.** Prefer test accounts. If a task needs participants' own data, keep it off recordings where possible and out of notes.
- **Higher-risk settings.** Children, patients and other vulnerable groups, and health or financial data, need the owner's ethics or legal review before recruiting starts. The agent flags these; it does not decide them.
- **Storage.** `studies/<id>/data/` is not git-ignored by default (ARCHITECTURE §8.1), so put only scrubbed, coded data there.
- **No external services.** The scripts send nothing off the machine (FRAMEWORK §15). Do not paste participant data into any tool the owner has not approved.

## 4. Output format

| File | Content | Format |
|---|---|---|
| `studies/<id>/plan.md` | the EMP-01 plan, the owner's approval, the task-lint result, pilot notes (the simulated pre-pilot labelled as such) | `../templates/study-plan.md` |
| `studies/<id>/tasks.md` | task cards with success criteria and stop rules | `../templates/task-card.md` |
| `studies/<id>/moderator-guide.md`, `consent.md` | the protocol and consent text actually used | templates of the same names |
| `studies/<id>/analysis-plan.md` | written before the first session | — |
| `studies/<id>/data/observation-sheet.csv` | scrubbed, coded observations | `../templates/observation-sheet.csv` |
| `studies/<id>/results.json` | task outcomes (k/n per build version), observed problems with finding IDs, RITE log, `uie study … --json` outputs | machine-readable |
| `feedback/feedback.jsonl` | the imported observations | `feedback.schema.json` |
| the findings register | linked or new findings with E3 evidence and re-rated severity | `finding.schema.json` |

## 5. Quality checks

An output is invalid when:

- the plan lacks any EMP-01 element, the owner's approval or a flat incentive;
- a task contains UI labels or step instructions, lacks a predefined success criterion or stop rule, or was not piloted with a person;
- a session ran without recorded consent, or a recording exists without recording consent;
- simulated pre-pilot output appears in counts, quotes or metrics, or is not labelled;
- a metric includes a segment with a logged intervention, or an assisted completion counts as success;
- a problem is reported without k/n or participant codes, or "users …" wording appears below E3;
- a report claims coverage ("found most of the problems") or reports a rate, a benchmark, a SUS benchmark or NPS from a formative round;
- severity came from the analyst alone instead of at least three isolated raters;
- k/n pools sessions run on different build versions;
- a quote contains a name or another identifying detail;
- the agent moved a finding to `resolved`.

## 6. Pitfalls

| Pitfall | Evidence |
|---|---|
| Tasks that echo UI labels | detailed, clued task text surfaced more feedback problems but fewer problems with finding controls (Sears & Hess 1998) [HCI-024] |
| A talkative moderator | leading and closed questions bias behaviour; a looser protocol changed task performance while finding the same problems (Krahmer & Ummelen 2004) [HCI-046, HCI-047] |
| Treating five users as coverage | groups of five found about 55–100% of known problems (Faulkner 2003) [HCI-041] |
| A single observer | a second evaluator of the same sessions added about 42% more problems (Hertzum & Jacobsen 2003) |
| Trusting praise over behaviour | attractive designs are perceived as more usable and can mask problems in tests; positive remarks about visuals do not offset failures [HCI-078] |
| Paying for performance | performance-contingent rewards narrow attention (Glucksberg; Ariely; CMU lecture) |
| Simulated participants | LLM walkers complete nearly every task and surface far fewer failure points than people [HCI-023] |
| Declaring a fix verified after one or two clean sessions | six clean sessions give only 47% confidence for a p = .10 problem [HCI-039] |
| Pooling build versions | a fix changes the denominator; pooled counts hide whether it worked [HCI-038] |
| Interpretation in place of observation | "confused" records the note-taker, not the participant [EVAL-082] |

## Sources

- Research adopt items: HCI-001, HCI-023, HCI-024, HCI-036 to HCI-048, HCI-057, HCI-078 (06); EVAL-082, EVAL-123 (04); PLAT-142 (05).
- Alexandra Ion, *Evaluation: Analytical vs Empirical*, CMU Human-Computer Interaction Institute, course lecture (empirical chain; participant motivation; flat incentives).
- Nielsen, *Why You Only Need to Test with 5 Users*, NN/g, 2000. https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
- NN/g, *Turn User Goals into Task Scenarios for Usability Testing*, 2014. https://www.nngroup.com/articles/task-scenarios-usability-testing/
- NN/g, *Talking with Participants During a Usability Test*, 2014. https://www.nngroup.com/articles/talking-to-users/
- NN/g, *Remote Usability Tests: Moderated and Unmoderated*, 2013. https://www.nngroup.com/articles/remote-usability-tests/
- Krahmer & Ummelen, *Thinking about thinking aloud*, IEEE TPC 47(2), 2004. https://pure.uvt.nl/ws/portalfiles/portal/869509/thinking.pdf
- van den Haak, de Jong & Schellens, BIT 22(5), 2003; Alhadreti & Mayhew, CHI 2018.
- Medlock et al., *The RITE Method*, UPA 2002. https://www.jpattonassociates.com/wp-content/uploads/2015/04/rite_method.pdf
- Hertzum & Jacobsen, *The Evaluator Effect*, IJHCI 15(1), 2003. https://mortenhertzum.dk/publ/IJHCI2003.pdf
- Faulkner, BRMIC 35(3), 2003, via HFI. https://www.humanfactors.com/newsletters/how_many_test_participants.asp
- Rubin & Chisnell, *Handbook of Usability Testing*, 2nd ed., 2008, ch. 5.
- Sears & Hess, CHI 1998, via the UXPA Usability Body of Knowledge.
- Zhong, McDonald & Hsieh, *Synthetic Cognitive Walkthrough*, CHI 2026. https://arxiv.org/abs/2512.03568
- GOV.UK Service Manual, *Using moderated usability testing*. https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing. Contains public sector information licensed under the Open Government Licence v3.0.
