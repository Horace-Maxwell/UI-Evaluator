# Severity rating

How findings get a severity, a priority and an ease of fix. Detection records factor evidence only; at least three isolated raters then rate every confirmed finding blind; the lead aggregates and applies the priority policy; the white-box role rates ease of fix separately. This file owns gate criteria USE-04, USE-05 and USE-06. Readers: the lead, the severity rater, and the code reviewer (ease of fix, §3.9).

## Contents

1. [Purpose and when to use](#1-purpose-and-when-to-use)
2. [Inputs](#2-inputs)
3. [Procedure](#3-procedure)
   - [3.1 Two phases](#31-two-phases)
   - [3.2 Lead: run the rating](#32-lead-run-the-rating)
   - [3.3 Rater: the three factors](#33-rater-the-three-factors)
   - [3.4 The suggested-severity function](#34-the-suggested-severity-function)
   - [3.5 Anchors for 0–4](#35-anchors-for-04)
   - [3.6 Rater: value, validity and note](#36-rater-value-validity-and-note)
   - [3.7 Aggregation and priority](#37-aggregation-and-priority)
   - [3.8 What priorities gate](#38-what-priorities-gate)
   - [3.9 Ease of fix](#39-ease-of-fix)
   - [3.10 Rule-declared severity for deterministic findings](#310-rule-declared-severity-for-deterministic-findings)
   - [3.11 Re-rating with user evidence](#311-re-rating-with-user-evidence)
   - [3.12 Calibration exemplars](#312-calibration-exemplars)
4. [Output format](#4-output-format)
5. [Quality checks](#5-quality-checks)
6. [Pitfalls](#6-pitfalls)
7. [Sources](#7-sources)

---

## 1. Purpose and when to use

- Rate every **confirmed judged finding** (from heuristic and walkthrough evaluators, design critics, the accessibility auditor and the code reviewer) after merge and verification [ADR-010].
- **Deterministic findings** carry their rule's declared severity and are rated only when the owner disputes them (§3.10).
- **Re-rate** when user evidence arrives through `ingest` or `study` (§3.11).

Three separate quantities, kept apart:

- **severity** (0–4): how bad the problem is for the declared users;
- **priority** (P0–P3): the order of work, derived from severity;
- **ease of fix** (1–4): how much work the narrowest correct fix is.

Folding effort into severity hides cheap catastrophes and inflates expensive cosmetic problems, so ease of fix never enters severity [HCI-011].

Gate criteria owned by this file (QUALITY-BAR G5, verbatim):

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| USE-04 | Blind severity | ≥ 3 independent raters per confirmed finding; validity votes, the mean of problem and trade-off values, spread and factors stored; spread ≥ 2, or a `not_a_problem` vote against a mean ≥ 2.5, marked divergent | A | HCI-009/010, EVAL C2 |
| USE-05 | No open P0 | 0 findings with mean severity ≥ 3.5 in status open, in_progress, blocked, fixed, reopened, disputed or deferred. A P0 cannot be deferred to pass this criterion, and waiting on a decision (blocked, ADR-036) does not pass it either | S | HCI-012, LOOP-058 |
| USE-06 | Every P1 has a decision | each P1 is verified-fixed, deferred (reason, owner, revisit trigger), disputed with a study planned, or won't-fix as a justified trade-off | S | HCI-012/013 |

## 2. Inputs

- **Confirmed findings**: `uie findings apply-verdicts` has run, so only verified problems are rated.
- **Rater packet**, built by `uie packet --role severity-rater`: the confirmed findings with their evidence and factor notes, blinded IDs and the rating anchors (§3.3–§3.5). It excludes other raters' ratings and any rule- or detector-suggested severity, because a visible guess anchors every rater to it [EVAL C2].
- **Ease of fix** (§3.9): the code reviewer's packet, with the findings that need file:line and the source-mapping hints.

## 3. Procedure

### 3.1 Two phases

1. **Detection** (evaluators). Record factor evidence only, in words: who meets the problem and how often, what happens when they do, whether it recurs. No 0–4 value, and no severity words in titles or descriptions ("critical", "minor", "catastrophic"), which would act as a hidden suggestion.
2. **Rating** (raters). After consolidation and verification, each rater independently rates the complete list [HCI-009]. During inspection, evaluators are focused on finding problems, not on weighing them, and a single evaluator's severities are "too unreliable to be trusted" (Nielsen 1994); the mean of three is good enough for most practical decisions.

### 3.2 Lead: run the rating

1. Build the packet with `uie packet --role severity-rater`.
2. Spawn an isolated subagent for each of at least three raters if your environment supports it; at rigorous depth, give them different model configurations [HCI-027]. Otherwise perform the role yourself, reading only the rater packet, and mark the output `DEGRADED: single-context (<reason>)`. Say in the reason that you saw the evaluators' work, so the rating is not blind.
3. Each rater writes `runs/<id>/ratings/rater-<n>.json`; validate each with `uie findings validate <file>`.
4. Aggregate with `uie findings rate` (§3.7).
5. At quick depth there is one rater. Store `severity.source: "provisional"` and label the severity *provisional (single rater)* wherever it appears [FRAMEWORK §7].

### 3.3 Rater: the three factors

Rate each finding on its own evidence, not by comparison with the others. Open the crop or the probe output first; the description is a summary, the evidence is the problem. Then set the three factors, on the scales of METHODS §5:

| Factor | Question (Nielsen) | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|
| frequency | How many of the declared users meet it, and how often, in the tasks in scope? | rare | occasional | common | nearly always |
| impact | When met, how hard is it to overcome? | trivial | minor delay or annoyance | significant difficulty or error | blocks the task or causes loss of data, money or a support contact |
| persistence | Is it a one-time hurdle, or does it keep bothering users? | one-time | recurring but overcome once learned | recurring and not overcome | — |

Base each factor on evidence:

- **frequency**: the route's place in the journeys and the journey's frequency; how many screens, states or records carry the problem; observed counts once user data exists (§3.11). The number of evaluators who detected a finding measures confidence, not frequency.
- **impact**: what the probe or walkthrough showed: blocked, error, detour, delay. Loss of data or money, or a support contact, is impact 3 by definition. Do not add a further step for it: the research's +1 modifier for errors that cost data, money or a support contact is already built into this anchor [EVAL-012].
- **persistence**: whether learning removes the problem.

**Business impact** is optional and has no canonical scale (METHODS §5). It never enters the suggested-severity function. Note in words which business outcome is exposed; it may justify a deviation, explained in the note.

### 3.4 The suggested-severity function

From your own three factors, compute the suggested severity (METHODS §5):

> s = impact + ⌊(frequency + persistence) / 2⌋, capped at 4. If impact = 0, s ≤ 1. If impact = 3, s ≥ 3.

The function is monotone in every factor and unit-tested. It is a prior, not the answer: choose the 0–4 value yourself and explain any difference from s in the note [EVAL C3; HCI-010]. If your value is more than one point away, re-check the factors first; a large gap usually means a factor is mis-rated.

Every combination (frequency 0–3 × persistence 0–2 × impact 0–3):

| frequency | persistence | ⌊(f + p) / 2⌋ | impact 0 | impact 1 | impact 2 | impact 3 |
|---|---|---|---|---|---|---|
| 0 rare | 0 one-time | 0 | 0 | 1 | 2 | 3 |
| 0 rare | 1 recurring, overcome | 0 | 0 | 1 | 2 | 3 |
| 0 rare | 2 recurring, not overcome | 1 | 1 | 2 | 3 | 4 |
| 1 occasional | 0 one-time | 0 | 0 | 1 | 2 | 3 |
| 1 occasional | 1 recurring, overcome | 1 | 1 | 2 | 3 | 4 |
| 1 occasional | 2 recurring, not overcome | 1 | 1 | 2 | 3 | 4 |
| 2 common | 0 one-time | 1 | 1 | 2 | 3 | 4 |
| 2 common | 1 recurring, overcome | 1 | 1 | 2 | 3 | 4 |
| 2 common | 2 recurring, not overcome | 2 | 1 | 3 | 4 | 4 |
| 3 nearly always | 0 one-time | 1 | 1 | 2 | 3 | 4 |
| 3 nearly always | 1 recurring, overcome | 2 | 1 | 3 | 4 | 4 |
| 3 nearly always | 2 recurring, not overcome | 2 | 1 | 3 | 4 | 4 |

Reading it: impact sets the band, and frequency with persistence add at most two levels. A trivial effect stays at 1 or below however common it is; anything that blocks a task or loses data starts at 3.

### 3.5 Anchors for 0–4

The labels follow Nielsen's scale, as taught in the CMU lecture (paraphrased). The examples are illustrations from deliberately different products.

| Value | Label | Meaning | Illustration (factors → suggested s) |
|---|---|---|---|
| 0 | not a problem | You do not agree this is a usability problem at all. Validity `not_a_problem` | A poetry archive lists poems by first line as well as by title. Flagged under H8 as redundant, but the declared users include readers who know a poem only by its first line, so the second list serves their task. |
| 1 | cosmetic | Fix only if time allows | A bicycle-parts inventory: at 1024 px one column header wraps to two lines while the others do not; the header still reads correctly (f 2, i 0, p 1 → 1). |
| 2 | minor | Low priority | A language-learning flashcard app does not show whether shuffle is on, so a learner who uses shuffle must open the menu to check it before each session (f 1, i 1, p 1 → 2). |
| 3 | major | High priority | A municipal recycling service's collection-day lookup rejects postcodes typed with a space and says only "Invalid", with no hint of the accepted format (f 2, i 2, p 1 → 3). |
| 4 | catastrophe | Fix before release | A logistics dashboard: pressing Back while reassigning a shipment discards the unsaved manifest without warning, so it must be entered again (f 1, i 3, p 1 → 4). |

### 3.6 Rater: value, validity and note

For each finding record:

- **value**, 1–4, or empty when the validity is `not_a_problem`.
- **validity**:
  - `problem`;
  - `trade_off`: a real violation that the design accepts for a stated reason (a collapsed menu on narrow screens). Rate the harm it causes as you would for any problem, so the owner sees what is being traded; the lead routes trade-offs to the owner or to a study [HCI-013];
  - `not_a_problem`: you do not agree it is a usability problem. Leave the value empty: "not a problem" is a judgement about validity, not a degree of severity, and mixing it into the mean distorts severities (Herr et al. 2016) [HCI-010; ADR-029].
- **note**: one or two sentences naming the evidence behind each of the three factors, and the reason for any difference from s [EVAL-011].

Rater rules:

- Rate alone. Do not look for other raters' files or for any severity suggested by a detector or by whoever found the problem.
- Do not park ratings on the middle value to avoid deciding; a 2 needs the same justification as a 4 [EVAL-043].
- Ignore who found the finding and how many found it.
- Ignore ease of fix: a hard fix does not make a problem worse, and an easy fix does not make it milder.
- Do not rate an accessibility failure low because it affects "only some users": impact on those users is the impact, and frequency covers how many they are.

### 3.7 Aggregation and priority

`uie findings rate` computes, per finding:

1. **Mean** of the values given by raters who judged it a problem or a trade-off: the finding's severity. `not_a_problem` votes carry no value and are counted separately as validity dissent. Every rating, factor and note is kept.
2. **Spread** = highest − lowest of the problem and trade-off values. The finding is **divergent** when the spread is ≥ 2, or when any rater votes `not_a_problem` while the mean is ≥ 2.5. A divergent finding moves to `disputed`, keeps its mean for ordering, and goes to user research. Divergence is never settled by a vote or by asking raters to agree; inspectors' disagreement is a question for users (P9) [EVAL-005]. The report's divergence list shows every rater's value and note in the rater's own words. When more than half of the raters vote `not_a_problem`, or more than half vote `trade_off`, the finding takes that validity and moves to `disputed` for the owner to decide [HCI-013; ADR-029].
3. **Priority** from the mean (QUALITY-BAR §6): ≥ 3.5 **P0**; ≥ 2.5 **P1**; ≥ 1.5 **P2**; ≥ 0.5 **P3**; otherwise **dropped** (not queued, never reported as a finding, listed with its ratings among the excluded items).
4. **Criticality clamp.** Findings that only affect peripheral journeys are capped at P2. A finding takes the highest criticality (`critical` > `core` > `peripheral`) of the journeys it affects. A finding tied to no journey is not clamped, because the clamp needs evidence that the harm stays within peripheral journeys.
5. **G1/G2 floor.** Findings that fail a G1 or G2 criterion are at least P1 whatever their rated severity, because they block L1. Where the floor and the clamp disagree, the floor wins: accessibility outranks every other principle (P11), and the gate fails regardless of queue position.
6. **Confidence ceiling.** In iteration 2 and later, a finding the verifier flagged as raised by a single LLM pass (`ceiling_flag`) whose mean is below 2.5 is held out of the report until a second independent pass finds it or a human confirms it; held findings are listed as held, never deleted (`verification.md` step 7) [HCI-029].

Worked examples: ratings 3, 3, 2 give mean 2.67 and spread 1, so P1; if every journey it affects is peripheral, P2. Ratings 4, 2, 1 give mean 2.33 and spread 3, so P2, divergent and `disputed`. Ratings 3, 3 and one `not_a_problem` give mean 3.0, so P1, but the dissent against a mean ≥ 2.5 makes it divergent and `disputed`.

### 3.8 What priorities gate

- **USE-05.** No finding with mean ≥ 3.5 may be `open`, `in_progress`, `blocked`, `fixed`, `reopened`, `disputed` or `deferred`. A P0 leaves those states only by being verified, or by an owner decision (won't fix as a justified trade-off, or dismissed) that the report lists. Deferring a P0 does not pass USE-05 [LOOP-058], and neither does waiting on a decision: a `blocked` P0 records the question, not the answer (ADR-036).
- **USE-06.** Each P1 is verified-fixed, deferred with reason, owner and revisit trigger, disputed with a study planned, or won't-fix as a justified trade-off. A `blocked` P1 is still undecided.
- Deferring a P0 or P1, or declaring it won't-fix, is the owner's decision. The lead proposes; the owner decides and the decision is recorded, because in effect it waives part of G5.
- **Fix-now queue** (`uie findings queue`): P0, P1 and quick P2 wins (ease of fix 1). Other P2 and P3 findings go to the debt register. Long lists are dominated by minor problems (59 major vs 152 minor across six studies, Nielsen 1995) and would starve the important fixes [HCI-077].

### 3.9 Ease of fix

Ease of fix is rated separately, by the white-box role (the code reviewer), as the lecture prescribes for the development team [HCI-011; FRAMEWORK §4.5]:

| Value | Scope of the narrowest correct fix |
|---|---|
| 1 | one value or token |
| 2 | one component or file |
| 3 | several components, or one flow |
| 4 | information architecture or architecture |

- Rate the narrowest layer that would resolve the observed problem (token, then shared component, then local style), with file:line where known. The fixer may still choose a different implementation (FRAMEWORK §10).
- Black-box roles never rate ease of fix, and raters never see it.
- With source but no code-reviewer run, the lead may take the white-box role and record that it did. Without source there is no white-box view: leave ease of fix empty and record why. The quick-win rule then does not apply.

### 3.10 Rule-declared severity for deterministic findings

Findings from `uie audit` and `uie lint` use the same record with `method: "tool"`, `evidence_level: "E1"` and `severity.source: "rule"` [ADR-010]. Their severity is the rule's `default_severity` in `rules.json`, set once per rule rather than per page, so they skip blind rating. When the owner disputes one, it goes through blind rating like a judged finding, with the rule's default hidden from the raters. The G1/G2 floor applies to them as to every finding.

### 3.11 Re-rating with user evidence

When `ingest` or `study` links observations to a finding, run a new rating round in that run [FRAMEWORK §9.2 step 5; EMP-03]:

1. Give raters the observed frequency as data: k of n participants with the adjusted-Wald 95% interval (`uie study ci`), or analytics counts with their denominators and time window, together with what was observed (failed, gave up, needed help).
2. Behaviour beats self-report. A task observed failing stays a failure even when participants rated it easy, and praise for the visuals does not offset it [HCI-056, HCI-078].
3. The reporter's own severity stays in its own field. It may set the order in which candidates are reproduced, but raters never see it, like any other suggested severity [EVAL-014; EVAL C1].
4. Earlier ratings stay in their run; the new mean sets the priority. The evidence level rises to E3, or E4 with an interval.
5. A `disputed` finding leaves that state on this evidence: the lead returns it to `open`, or the owner dismisses it, and the deciding evidence is recorded (FRAMEWORK §8.2).

### 3.12 Calibration exemplars

Agents rate more consistently with anchored rubrics and expert examples than with free-form scores [HCI-033; UICrit].

- Every rater packet carries the factor scales (§3.3), the lookup table (§3.4) and the anchors (§3.5).
- As the owner confirms or overrules ratings on the agree/disagree sheet, add those findings as exemplars, with their factors and the owner's value. Keep exemplars varied across products and aesthetics so that no single look becomes the standard.
- Compare agent ratings with human confirmations run by run; the evaluation plan measures rater agreement against expert panels **[calibrating]**.
- Never calibrate against holistic quality scores: three annotators rating the same screens showed almost no agreement (ICC ≈ .03–.05) [EVAL C4].

## 4. Output format

- `rating.schema.json`, one file per rater: per finding, the blinded ID, `frequency`, `impact`, `persistence`, `value`, `validity` and `note`.
- Aggregated into the finding record (ARCHITECTURE §8.3): `severity` (`source`: `raters`, `rule` or `provisional`; `ratings[]`; `mean`; `spread`; `divergent`), `priority`, `criticality`, `ease_of_fix`, `validity`.
- The report's divergence list: each divergent finding with every rating and note.
- Rater return message: at most 5 lines (path, number rated, distribution of values, number of departures from s).

## 5. Quality checks

A rating file is invalid when:

- any finding lacks one of the three factors, the value, the validity or the note;
- a value differs from the rater's own s without a reason in the note;
- validity `not_a_problem` comes with a value, or a `problem` or `trade_off` vote comes without a value from 1 to 4;
- the packet hash shows the rater received other ratings or a suggested severity;
- it ran without isolation and lacks the `DEGRADED` banner.

A run fails USE-04 when any confirmed judged finding has fewer than three ratings at standard depth, or lacks a stored mean, spread or factors. Ease of fix rated by a black-box role is discarded.

## 6. Pitfalls

| Pitfall | Evidence | Countermeasure |
|---|---|---|
| Trusting one rater | pairwise severity correlations between evaluators were only .23–.31; no problem was rated severe by everyone (Hertzum & Jacobsen 2003) | ≥ 3 blind raters; keep the spread |
| Severity conflicts hidden by averaging | 24–30% of problems reported by more than one professional were rated critical by one and minor by another (Hertzum, Molich & Jacobsen 2014) | divergent flag; route to users, not to a vote |
| One-dimensional rating | a multi-factor scale deviated less from expert ground truth than Nielsen's single scale (23.4 vs 28.1) (Herr et al. 2016) | factors first, then the label |
| "Not a problem" mixed into severity | Nielsen's scale produced higher ratings, attributed to its "not a problem" point (Herr et al. 2016) | validity as its own field (§3.6) |
| Rating during detection | most public skills assign severity in the same pass that finds problems (04 §3.2 C2) | two phases (§3.1) |
| Anchoring on a suggested value | a visible detector or reporter severity anchors raters [EVAL C2] | blinded packets |
| Reporter wording read as severity | triage practice rates criticality from impact and breadth, not from how a report is worded (Marker.io triage) | `reporter_severity` kept apart [EVAL-014] |
| Incomplete lookup tables | one public severity table left 8 of 27 factor combinations uncovered and had a conflict (04 §2.10) | the complete table in §3.4, unit-tested |
| Untested agent calibration | no study checks LLM factor ratings against expert consensus (06 §3.3) | human confirmation of P0/P1 at L3; exemplars (§3.12) |

## 7. Sources

Research adopt items: HCI-009…013, HCI-027, HCI-033, HCI-056, HCI-077, HCI-078; EVAL-004, EVAL-005, EVAL-010…014, EVAL-043; EVAL C1…C4; ADR-010; 06 §2.A.2, §2.G.1; 04 §2.0, §3.2.

- Nielsen, *Severity Ratings for Usability Problems*, NN/g 1994. https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/
- Nielsen, *Characteristics of Usability Problems Found by Heuristic Evaluation*, NN/g 1995. https://www.nngroup.com/articles/usability-problems-found-by-heuristic-evaluation/
- Herr, Baumgartner & Gross, *Evaluating Severity Rating Scales for Heuristic Evaluation*, CHI 2016 Extended Abstracts. https://cml.hci.uni-bamberg.de/~gross/publ/chi16_herr_et_al_severity_rating_scales__proceedings.pdf
- Hertzum & Jacobsen, *The Evaluator Effect*, IJHCI 15(1), 2003. https://mortenhertzum.dk/publ/IJHCI2003.pdf
- Hertzum, Molich & Jacobsen, *What You Get Is What You See*, BIT 33(2), 2014. https://mortenhertzum.dk/publ/BIT2014.pdf
- Duan et al., *UICrit*, UIST 2024 (dataset CC BY 4.0). https://arxiv.org/abs/2407.08850
- uw-ssec/rse-plugins `uiux-design-team` (plugin licence proprietary; ideas only, no text reused).
- AndersonWang/heuristics-evaluation-skill (MIT), as a counter-example for incomplete lookup tables. https://github.com/AndersonWang/heuristics-evaluation-skill
- carlsz/ux-agent-skills, criticality clamp (MIT). https://github.com/carlsz/ux-agent-skills
- emiliacurie/arely-skills, divergence rule (MIT). https://github.com/emiliacurie/arely-skills
- marker-io/mcp-skills, `marker-triage` (MIT). https://github.com/marker-io/mcp-skills
- Alexandra Ion, *Evaluation: Analytical vs Empirical*, Carnegie Mellon University HCII, course lecture (paraphrased).
