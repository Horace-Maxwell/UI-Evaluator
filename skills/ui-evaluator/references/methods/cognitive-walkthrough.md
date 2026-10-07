# Cognitive walkthrough

The cognitive-walkthrough (CW) protocol: how the lead derives, ranks and fixes the tasks, and how the walkthrough evaluator walks each one, step by step, with Wharton's four questions. This file defines the question IDs **CW-Q1…CW-Q4** and owns gate criterion USE-07. Candidate findings follow `finding-records.md`; they are merged, verified and rated like every other judged finding (`verification.md`, `severity-rating.md`). The `setup` and `study` workflows reuse the task derivation in §3.1.

## Contents

1. [Purpose and when to use](#1-purpose-and-when-to-use)
2. [Inputs](#2-inputs)
3. [Procedure](#3-procedure)
   - [3.1 Task derivation (lead)](#31-task-derivation-lead)
   - [3.2 Fix persona, task and sequence before walking](#32-fix-persona-task-and-sequence-before-walking)
   - [3.3 The four questions](#33-the-four-questions)
   - [3.4 Failure stories](#34-failure-stories)
   - [3.5 Continue after a failure](#35-continue-after-a-failure)
   - [3.6 Verdicts](#36-verdicts)
   - [3.7 The streamlined variant](#37-the-streamlined-variant)
   - [3.8 Rules for agent walkers](#38-rules-for-agent-walkers)
   - [3.9 Lead: close the walkthrough](#39-lead-close-the-walkthrough)
4. [Output format](#4-output-format)
5. [Quality checks](#5-quality-checks)
6. [Pitfalls](#6-pitfalls)
7. [Sources](#7-sources)

---

## 1. Purpose and when to use

CW predicts where a first-time or infrequent user, learning by exploring, will fail on a specific task. Heuristic evaluation takes the analyst's view across the whole UI; CW takes the new user's view along one task, one action at a time [06 §2.B.1].

- **Always:** walk every critical journey (USE-07). At rigorous depth, walk all journeys (FRAMEWORK §7).
- **Beyond critical journeys:** choose CW for new or unfamiliar flows and first-time use. Skip it for flows built only from ubiquitous patterns, where it costs much and adds little [HCI-018].
- **Not a user test.** CW applies expertise to an imagined class of users. Its failure points are hypotheses: the verifier can confirm the conditions (the control is hidden, the feedback is missing), but only users can show that people actually fail there [06 §2.B.4].

Gate criterion owned by this file (QUALITY-BAR G5, verbatim):

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| USE-07 | Cognitive walkthrough of critical journeys | each critical journey walked with persona, task and correct action sequence fixed first; four questions per step; no failed step left without a decision | A | HCI-019/020/022 |

## 2. Inputs

- **Journey file** `.ui-evaluator/journeys/<id>.json`: persona, goal, scenario without UI words, start state, observable success condition, correct action sequence as probe actions, criticality (`critical`, `core` or `peripheral`) and frequency.
- **Packet**, built by `uie packet --role walkthrough-evaluator`: context summary, journeys, route list, screenshot index, inventory and probe instructions. It contains no source, builder notes, detector output or other evaluators' work.
- **Persona** with what they know: experience with this kind of product, domain knowledge, device and context, motivation [EVAL-051]. A label such as "new user" is not enough, because every answer depends on what the persona knows.
- **The live UI**, reached only through `uie probe`.

## 3. Procedure

### 3.1 Task derivation (lead)

Use this rule in `setup` to write journeys, in `audit` to choose what to walk, and in `study` to write test tasks [EVAL §3.3; EVAL-123].

1. **Collect candidates** from four sources:
   - declared critical journeys and, before any exist, the ranked top tasks in `PRODUCT.md`;
   - analytics funnels: the top flows and the steps where people drop off;
   - feedback clusters from `ingest` that point at a task;
   - routes touched by the change under review.
2. **Rank by criticality × frequency**: critical before core before peripheral; within a class, more frequent first (the journey's `frequency`, or analytics counts where they exist).
3. **Write each task** as:
   - **goal**: the outcome the persona wants, not a feature;
   - **scenario**: the situation and motivation, with every detail needed to finish and **no UI words**;
   - **start state**: what is true before step 1 (signed in or not, which data exists), stated as facts, not steps;
   - **observable success condition**: a visible element, a specific text, a URL, or a value that persists after reload;
   - **avoided hints**: the UI labels deliberately kept out of the scenario;
   - **correct action sequence**: one observable user action per step.
4. **Lint the scenario** against the UI string inventory. A task that names the control tells the walker where to go and hides findability problems [HCI-024; Sears & Hess 1998].

Illustration (a municipal recycling service):

| Field | Content |
|---|---|
| goal | get a replacement for a damaged collection bin |
| scenario | Your recycling bin cracked when it was emptied this morning. Arrange for a new one to arrive before next week's collection. Your address is 14 Orchard Row. |
| start state | signed out; the address is registered with the service |
| success condition | a confirmation with a reference number is shown, and the request is listed for the address after reload |
| avoided hints | "Report a problem", "Bin request", "My services" |
| correct sequence | open the address lookup → enter the address → choose the bin service → choose replacement → choose the bin type → submit |

### 3.2 Fix persona, task and sequence before walking

The walker must never discover the path during the walk. A walker who searches for the path ends up evaluating its own stumbling, not the design; this is the first common mistake Lewis and Rieman describe [HCI-019].

1. **Prove the sequence runs.** `uie journey <id>` replays it and checks the success condition. A failing replay is a functional failure (FUN-03) and is reported as such. Repair the journey outside the audit, never during it [EVAL-071].
2. **Name the primary path.** If several paths are valid, list the alternatives now, so the walk does not turn into a debate about which one is right.
3. **Fix the step granularity.** One observable action per step. Actions people always do together (filling one form section, then Next) may form one step. Decide before walking, not while walking.
4. **Hand over** the persona, the task and the sequence together. The walker uses the sequence to know which action to judge; the persona does not know it.

### 3.3 The four questions

At each step, look at the screen as the persona sees it at that moment: the capture of the current state, its ARIA snapshot, and everything that happened in earlier steps. Record the **visible cues** and the persona's **most likely action**. Then answer the four questions, each with a short success or failure story grounded in evidence [HCI-020].

| ID | Question (paraphrasing Wharton et al. 1994) | Evidence that answers it | Typical failure |
|---|---|---|---|
| CW-Q1 | Will the user try to achieve the right effect? | the persona's goal and knowledge; what the screen and earlier feedback say is needed next | a hidden prerequisite the persona has no reason to expect |
| CW-Q2 | Will the user notice that the correct action is available? | the control in the captured state at this viewport: visible without hovering or scrolling, its prominence, its presence in the ARIA snapshot, what competes with it | the control sits in an overflow menu or below the fold, or looks like plain text |
| CW-Q3 | Will the user associate the correct action with the effect they want? | the visible label and accessible name against the persona's own words for the goal; similar controls nearby | internal jargon; two controls that read as the same thing; an unlabelled icon |
| CW-Q4 | If the correct action is performed, will the user see that progress is being made? | a probe of the action: what changed, how fast, where focus went, the URL, and for data changes the state after reload | nothing visible changes, or the message is ambiguous or out of view |

The CMU lecture asks the same four questions in shorter words, and reports print them that way: CW-Q1 *Does the effect of the action match the user's goal (their conceptual model)?* · CW-Q2 *Is the action visible?* · CW-Q3 *Will the user recognize the action as the correct one?* · CW-Q4 *Will the user understand the feedback?* As in the lecture, write the action sequence for the task first, then ask all four questions at every step.

Answering:

- Answer **yes** only with a credible success story grounded in evidence ("the button's label is the persona's own word for the goal"; "a confirmation appears at once and the list updates"). Answer **no** when a credible failure story exists for this persona, even if other users would succeed. Agent walkers tend to see too few failures (§3.8), so a plausible failure story counts.
- Any **no** fails the step.
- CW-Q4 needs a probe: perform the action with `uie probe` and cite the result directory. CW-Q2 and CW-Q3 can be answered from the step's capture and ARIA snapshot.
- When the persona's most likely action differs from the correct one, that is a CW-Q2 or CW-Q3 failure. When the persona's most likely *first* action of the task leads away from the goal, record it at step 1 [EVAL-054].
- Read labels literally, and use no knowledge the persona lacks: no source, no attribute names that are not visible, no guessed URLs.

### 3.4 Failure stories

A failure story is a short narrative in the persona's terms: what they see, what they believe, what they do instead, and why. It names the cause:

- for CW-Q1 to CW-Q3, the **missing knowledge**: what the persona would need to know;
- for CW-Q4, the **missing feedback**: what they would need to see.

Illustration (a veterinary clinic's booking tool; task "book a vaccination"; step 3):

> **CW-Q3: no.** The persona, a first-time pet owner, wants to "book a vaccination". The services list offers "Wellness visit", "Consultation" and "Procedures". Vaccination is mentioned only inside the collapsed description of "Wellness visit". Missing knowledge: that vaccinations are filed under wellness visits. Most likely action: "Consultation". Evidence: `screens/services-375.png`; ARIA snapshot of the services list.

Each distinct problem behind a no becomes one candidate finding: the failed CW question as the primary criterion, a heuristic as corroboration where one clearly applies, `found_by.method: "CW"`, anchored at the step's state, with the story in the description and the verdict in the factor notes. Two questions failing for one cause at one step make one finding citing both questions; two steps failing for the same cause make one finding with two locations. Do not rate severity; raters do that later, blind.

Recommendations stay short and advisory. For a CW-Q1 failure, the strongest remedies are to remove the step (automate it) or to reorder the task so the persona starts with something they already know to do and is then prompted for the step [06 §2.B.5].

### 3.5 Continue after a failure

After recording a failure, continue as if the step had succeeded: assume the system reached the correct state and go on with the correct sequence [HCI-020]. Stopping at the first failure hides every later failure point, and fixing only the first would expose the next one a round later.

### 3.6 Verdicts

Give every step and the whole journey one qualitative verdict [EVAL C11]:

| Verdict | Step | Journey |
|---|---|---|
| `would` | all four answers yes | every step `would` |
| `would_with_effort` | at least one no, but the persona plausibly recovers (notices on a second look, backs out and tries the next likely control) | no step `would_not`; at least one `would_with_effort` |
| `would_not` | at least one no, and the persona is unlikely to recover without help | at least one step `would_not` |

Both failing verdicts produce failure stories and candidates. Never add percentages, success rates, times or "k of n users": an analytical method produces no numbers about people [EVAL-039; HCI-023].

### 3.7 The streamlined variant

When time is short, Spencer's two-question variant may replace the four questions [HCI-021]:

1. Will the user know what to do at this step? (This folds CW-Q1 to CW-Q3 together.)
2. If the user does the right thing, will they know it was right and that they are making progress? (CW-Q4.)

Every failure must still name the missing knowledge or the missing feedback. Record which variant was used. The variant trades cause for coverage: its findings tend to name the problem without its cause, where the four-question form points at it. It does **not** satisfy USE-07, so use it only for non-critical journeys or at quick depth.

### 3.8 Rules for agent walkers

LLM walkers are too competent. In one study, model runs completed the tasks 97–100% of the time where people managed 88%, and all model runs together found 3 failure points where people found 10. Given the full navigation history and an explicit request to look for failure points, model ratings did predict where people failed; without that context they were weak and inconsistent [HCI-022, HCI-023; Zhong 2026]. Therefore:

1. **Carry the full history** into every step: earlier screens, actions, observations and messages. Never judge a step from a single screen.
2. **Flag failure points at every step.** Look actively for the ways this persona could go wrong, not only when you feel stuck.
3. **Stay inside the persona's knowledge.** The correct sequence is your map of what to judge, not something the persona knows.
4. **Never report completion as predicted success.** You knew the path; users do not. Your output is a set of failure-point hypotheses at E0 until verified.
5. **Keep Spencer's ground rules**: no redesigning, no defending the design, no debating theory during the walk. Note a design idea in one line and move on.

### 3.9 Lead: close the walkthrough

1. Validate each record with `uie findings validate <file>`.
2. Send the candidates through merge, verification and rating together with the heuristic-evaluation candidates.
3. **USE-07: every failed step needs a decision.** A decision is one of: the candidate rejected by the verifier (with the deciding step); dismissed by the owner; fixed and verified; deferred with reason, owner and revisit trigger; disputed with a study planned; won't fix with a trade-off rationale. A finding sitting in `open` with no plan is not a decision.
4. A failed step in a critical journey is a strong candidate task for the next formative test (`study`), because only users can turn the hypothesis into an observation.

## 4. Output format

`cw-record.schema.json`, one record per journey at `runs/<id>/cw/<journey>.json`:

- persona (with what they know) and task (goal, scenario, start state, success condition, avoided hints);
- the action sequence and the variant used (four-question or streamlined);
- per step: number, sub-goal, visible cues, most likely action, the answers to CW-Q1…CW-Q4 (or the two streamlined questions) each with its story, the missing knowledge or missing feedback, the step verdict, and evidence references (capture, ARIA snapshot, probe directory);
- the journey verdict and the list of failure points;
- the banner `DEGRADED: single-context (<reason>)` when the walk was not isolated.

Candidate findings from failed steps are written in finding-record form (`finding-records.md`) to the evaluator-output path named in the packet, with `found_by.method: "CW"` and `evidence_level: "E0"`. Return at most 10 lines: paths; per journey the steps walked, the steps failed with their question IDs, and the journey verdict; anything that blocked you.

## 5. Quality checks

A walkthrough record is invalid when:

- the persona's knowledge, the task or the full correct sequence is missing before step 1, or the walker changed the sequence while walking;
- a step lacks any of the four answers (four-question variant), or an answer has no story;
- a no has no failure story, or the story names neither missing knowledge nor missing feedback;
- a CW-Q4 answer has no probe evidence;
- the walk stopped at the first failure;
- it contains success percentages, times, or completion presented as predicted success;
- a critical journey was walked with the streamlined variant and counted towards USE-07;
- it ran without isolation and lacks the `DEGRADED` banner.

## 6. Pitfalls

| Pitfall | Evidence | Countermeasure |
|---|---|---|
| Discovering the action sequence during the walk | the first common mistake in Lewis & Rieman, TCUID ch. 4 | §3.2 |
| Treating CW as a user test | the second common mistake in Lewis & Rieman; CW applies expertise to imagined users | hypotheses only; route critical failures to `study` |
| Clued task wording | detailed step-by-step task text surfaced more feedback problems but fewer problems with finding the control (Sears & Hess 1998) | no UI words in the scenario; avoided-hints list [HCI-024] |
| Agent walker too competent | 97–100% vs 88% completion; 3 vs 10 failure points (Zhong 2026) | §3.8 |
| Single-screen judgement | without navigation context, model failure predictions were weak and some runs agreed at κ ≈ 0 (Zhong 2026) | carry the full history |
| Tedium and skipped steps | repeating four questions over many actions led evaluators to skip actions (Hertzum & Jacobsen 2003) | the per-step record makes a skipped step visible |
| Labels only | analyses drift to wording and neglect task structure and error recovery (UXPA BoK) | take CW-Q1 and CW-Q4 as seriously as the labels |
| Redesign during the walk | redesigning inline fixes problems in task order rather than by severity, and derails the session (Spencer 2000) | ground rules in §3.8 |
| Invented metrics | walkthrough templates in public skills ask for predicted success percentages and times (04 §2.1) | verdict vocabulary only [EVAL-039] |

## 7. Sources

Research adopt items: HCI-018…024; EVAL-039, EVAL-051…055, EVAL-071, EVAL-123; EVAL C11; 04 §3.3; 06 §2.B, §2.F.1 (7).

- Wharton, Rieman, Lewis & Polson, *The cognitive walkthrough method: a practitioner's guide*, in *Usability Inspection Methods*, 1994, pp. 105–140 (questions as listed in Spencer 2000, Table 1).
- Spencer, *The Streamlined Cognitive Walkthrough Method*, CHI 2000, pp. 353–359. https://facweb.cdm.depaul.edu/cmiller/eval/p353-spencer.pdf
- Lewis & Rieman, *Task-Centered User Interface Design*, ch. 4, 1993/94. http://hcibib.org/tcuid/chap-4.html
- NN/g, *Evaluate Interface Learnability with Cognitive Walkthroughs*, 2022. https://www.nngroup.com/articles/cognitive-walkthroughs/
- NN/g, *How to Conduct a Cognitive Walkthrough Workshop*, 2022. https://www.nngroup.com/articles/cognitive-walkthrough-workshop/
- NN/g, *Turn User Goals into Task Scenarios for Usability Testing*, 2014. https://www.nngroup.com/articles/task-scenarios-usability-testing/
- UXPA Usability Body of Knowledge, *Cognitive Walkthrough*. https://www.usabilitybok.org/cognitive-walkthrough/
- Sears & Hess, task-description detail in cognitive walkthroughs, CHI 1998 (via the UXPA BoK).
- Hertzum & Jacobsen, *The Evaluator Effect*, IJHCI 15(1), 2003. https://mortenhertzum.dk/publ/IJHCI2003.pdf
- Zhong, McDonald & Hsieh, *Synthetic Cognitive Walkthrough*, CHI 2026. https://arxiv.org/abs/2512.03568
- carlsz/ux-agent-skills, CUJ contract and journey replay (MIT). https://github.com/carlsz/ux-agent-skills
- averliz/visual-ux-review-toolkit, `ux-flow-walkthrough` (MIT). https://github.com/averliz/visual-ux-review-toolkit
- Alexandra Ion, *Evaluation: Analytical vs Empirical*, Carnegie Mellon University HCII, course lecture (paraphrased).
