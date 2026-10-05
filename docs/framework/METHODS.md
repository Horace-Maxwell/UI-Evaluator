# Methods

| | |
|---|---|
| Version | 2.0.0 (2026-10-04) |
| Status | Normative summary. The agent-facing procedures live in `skills/ui-evaluator/references/methods/`. This document states what each method is for, its minimum procedure, its evidence level and its known limits, so that humans can audit what the agents do. |
| Parent | [FRAMEWORK](FRAMEWORK.md) |

## Contents

1. [Method families](#1-method-families)
2. [Choosing a method](#2-choosing-a-method)
3. [Deterministic checks](#3-deterministic-checks)
4. [Analytical inspection](#4-analytical-inspection) — heuristic evaluation · cognitive walkthrough · task-suitability · design panel · accessibility audit · code review · optional PURE and KLM · persona walkthroughs
5. [Consolidation, verification and rating](#5-consolidation-verification-and-rating)
6. [Direction-setting](#6-direction-setting)
7. [Empirical methods](#7-empirical-methods) — formative tests · RITE · summative benchmarks · surveys · desirability and first impressions · A/B experiments · post-launch metrics · feedback analysis
8. [Fix verification](#8-fix-verification)
9. [Statistics reference](#9-statistics-reference)
10. [Method limits that reports must state](#10-method-limits-that-reports-must-state)

---

## 1. Method families

The CMU lecture divides evaluation into **analytical** methods (experts or models inspect the design) and **empirical** methods (data from real people). The framework adds a third family below them, **deterministic checks** (tools measure the artifact), and a design family above them, **direction-setting**.

| Family | Answers | Evidence level reached | Can gate |
|---|---|---|---|
| Deterministic checks | Does the artifact meet a measurable threshold? | E1 | G0–G4 |
| Analytical inspection | Where will people likely have trouble, and why? | E0 → E1 after verification; E2 with human confirmation | G5, G6 |
| Empirical methods | What do real people actually do, say and achieve? | E3–E5 | G7 |
| Direction-setting | Which visual direction fits this product and differs from the default? | process evidence | G4 (DEC criteria) |

Analytical inspection finds some "false problems" and misses others. The framework therefore alternates it with user testing, as the lecture recommends, and routes evaluator disagreement to users (FRAMEWORK P9).

## 2. Choosing a method

| Question | Method | Minimum procedure | Output | Agent-facing file |
|---|---|---|---|---|
| Does the UI meet WCAG, the craft floor and the tell rules? | Deterministic checks | full scope matrix; doctor smoke test first | tool findings, census | `workflows/audit.md` |
| What general usability problems does it have? | Heuristic evaluation | ≥ 3 isolated evaluators × 2 passes; one problem per record; blind severity later | candidate findings | `methods/heuristic-evaluation.md` |
| Can a first-time user work out this new or unfamiliar flow? | Cognitive walkthrough | persona + task + correct action sequence fixed first; 4 questions per step; continue past failures | per-step failure stories | `methods/cognitive-walkthrough.md` |
| Can the declared top tasks be done at all? | Task-suitability check | walk each top task with what the UI offers | utility gaps (`missing_element`) | `methods/heuristic-evaluation.md` §Task suitability |
| Is the design specific, coherent, restrained and on brand? | Design panel | ≥ 3 isolated critics; specificity before detectors; pairwise vs baseline in both orders | verdicts, design findings | `methods/design-panel.md` |
| What do machines miss in accessibility? | Accessibility audit | resolve axe `incomplete`; CVD and forced-colour review; semantics from ARIA snapshots; dialog and focus behaviour | judged a11y findings; needs-human list | `evaluators/accessibility-auditor.md` |
| Are tokens, states and semantics implemented soundly? | Code review (white-box) | lint output + source; file:line; ease-of-fix | code findings | `evaluators/code-reviewer.md` |
| How much friction do the fundamental tasks have over time? | PURE (optional) | ≤ 10–20 tasks; 3 silent raters; α ≥ .667; consensus | step and task scores | `methods/heuristic-evaluation.md` §PURE |
| Which of two flows is faster for experts? | KLM (optional) | operator sequence; standard times | seconds per task (comparative) | `methods/heuristic-evaluation.md` §KLM |
| Do real users succeed, and why not? | Formative usability test | ≈ 5 per user group per round; think-aloud; clue-free tasks | observed problems with k/n | `methods/usability-testing.md` |
| How good is it, or is it better than before? | Summative benchmark | n from margin of error (default 40 per condition) | metrics with CIs | `methods/surveys-metrics.md` |
| Does it feel like the brand intends? | Desirability + 5-second test | reaction cards (~25 words, ~40% negative); pre-registered on-brand words | share choosing on-brand words | `methods/surveys-metrics.md` |
| Will a change improve behaviour at scale? | A/B experiment | pre-registered OEC and guardrails; power; SRM check; fixed horizon | causal effect | `methods/experiments-analytics.md` |
| How is the launched product doing? | HEART via Goals–Signals–Metrics | explicit include/exclude per category | dashboard spec | `methods/experiments-analytics.md` |
| What are users telling us? | Thematic analysis / affinity | six phases; prevalence k/N; ≥ 2 extracts per theme | themes linked to findings | `methods/feedback-analysis.md` |
| Is our AI feature well designed? | HAX audit + PAIR error review | 18 guidelines; applications and violations | AI-specific findings | `knowledge/ai-features.md` |

LLM-only use is permitted for first-pass triage in the analytical rows, as long as every output carries its evidence level [HCI §3.4].

## 3. Deterministic checks

`uie audit` and `uie lint` implement the scripted checks S1–S16 from the tooling research (08 §4.3): capture, axe-core, keyboard walk with focus-visibility and obscuring checks, dialog contract, reflow, text spacing, text resize, target geometry, contrast (computed and pixel-sampled), forms probe, live regions, language detection, cross-page consistency, style census, DOM tell detection, motion inspection, lab vitals, and static source rules.

- **Validity first:** the doctor smoke test must pass in the session, and captures must pass the validity check (EVD-02/03).
- **Coverage honesty:** automation touches under half of WCAG 2.2 A/AA. Each criterion is labelled auto, scripted, agent-judged, needs-human or not-tested (A11Y-20).
- **Detector hits are evidence, not verdicts:** a hit that the rendered page contradicts (e.g. a contrast error on a mis-composited background) is a detector false positive. It is recorded as such so that the rule's precision can be measured [03 §3.3].

## 4. Analytical inspection

### 4.1 Heuristic evaluation (HE)

- **Taxonomy:** Nielsen's ten heuristics as the primary vocabulary (H1 visibility of system status … H10 help and documentation), as taught in the CMU lecture. Add-ons are used where Nielsen is silent:
  - ISO 9241-110 suitability for the task and user engagement;
  - Gerhardt-Powals' data-fusion principles for dashboards;
  - Microsoft HAX guidelines for AI features.

  A crosswalk maps Shneiderman, Norman, Tognazzini and ISO principles onto H1–H10 [HCI X7].
- **Procedure:**
  1. The evaluator receives a context packet: users, tasks, context of use, journeys and screens.
  2. Pass 1 learns the flow; no findings are recorded.
  3. Pass 2 inspects element by element and records one problem per finding, naming the heuristic and why it harms the user.
  4. Behavioural claims are confirmed by probing.
  5. A cross-screen consistency pass follows.
  6. There is no quota; "no problems" is valid.
- **Independence:** ≥ 3 evaluators (standard), each isolated. Diversity comes from model configuration, prompt lens (novice, expert, accessibility-minded, mobile-first) and input modality, not from re-sampling. Each evaluator still applies the full heuristic set, which keeps outputs comparable [EVAL C6].
- **Known limits:** HE finds some false problems and misses others. Single passes recover about a third. LLM recall is 35–45%, and LLM findings under H8 (aesthetic and minimalist design) were the least accurate category in the literature. H8 findings therefore need corroboration from the design panel or measurement [06 §3.3].

### 4.2 Cognitive walkthrough (CW)

- **Use for** new or unfamiliar flows and first-time use. Skip it for flows built only from ubiquitous patterns [HCI-018].
- **Before walking:** fix the persona (what they know), the task, the start state and the complete correct action sequence. The evaluator must not discover the path while walking [HCI-019].
- **Per step, Wharton's four questions:**
  1. Will the user try to achieve the right effect?
  2. Will the user notice that the correct action is available?
  3. Will the user associate the correct action with the effect they want?
  4. If the correct action is performed, will the user see that progress is being made?

  Each answer is a short success or failure story. Any "no" fails the step. After a failure, record it and continue as if the step had succeeded [HCI-020].
- **Streamlined variant** (two questions: will the user know what to do; will they see progress) is allowed when time is short. Each failure must name the missing knowledge or missing feedback [HCI-021].
- **For LLM walkers:** the full navigation history is carried, and the walker flags failure points at every step. LLM task completion is never reported as predicted user success [HCI-022/023].
- **Output:** qualitative verdicts per step (would, would with effort, would not) and failure stories. No invented success percentages or times [EVAL C11].

### 4.3 Task-suitability check

Nielsen's ten heuristics do not test utility. For every declared top task, an evaluator checks that the task can actually be completed with what the UI offers. Gaps are `missing_element` findings with positive evidence of absence: the states searched and the controls inventoried [HCI-076].

### 4.4 Design panel

- **Purpose:** judge what measurement cannot: specificity to the product, hierarchy, coherence, restraint, brand fit, execution quality and appeal (whether the audience would find it attractive and finished).
- **Procedure:**
  1. Each of ≥ 3 isolated critics receives screenshots across the matrix plus `PRODUCT.md` and `DESIGN.md`.
  2. Each critic first writes its own inventory of the screen.
  3. It then runs the **swap test** (could an unrelated product use this unchanged?), the **category-guess test** (could the look be guessed from the category alone, or from the category plus avoidance?) and the **similar-prompt test** (would a similar brief land here?), and writes a specificity verdict citing elements. Beside it, the critic writes an appeal verdict (`appealing`, `plain` or `unappealing`) with the signs of unfinish it saw (ADR-035).
  4. Only then is the detector output unsealed, so the critic can note agreements and false positives.
  5. Finally the critic scores the rubric (Specificity, Hierarchy, Coherence, Restraint, Brand fit, Execution, Appeal; 0–4 with written anchors and multi-aesthetic exemplars) and records design findings in the standard finding format.
- **Comparison:** for redesigns, pairwise against the baseline in both orders. Only order-consistent preferences count [HCI-034; CRAFT-062].
- **Gating:** never on scores. Only on the specificity, brand-fit and appeal majorities, on agreed severe design findings and on order-consistent pairwise results (QUALITY-BAR G6).

### 4.5 Accessibility audit

Interprets the automated output and covers what automation cannot:
- axe `incomplete` items;
- colour-only meaning, using CVD captures;
- forced-colours visibility;
- reading and focus order against the visual layout;
- dialog and menu behaviour against WAI-ARIA APG patterns;
- name, role and value quality in ARIA snapshots;
- meaningful sequence;
- cognitive load (single focus, grouping, at most about four visible options per decision point where possible; the four-item figure rests on Cowan 2001 and is applied loosely here [unverified]).

It produces the needs-human list for L3 [TOOL-37, TOOL-44, IMP-043].

### 4.6 Code review (white-box)

Reviews tokens and drift, state implementation, semantic markup, keyboard models of composite widgets, IME guards, i18n readiness (logical properties, `lang`) and performance hazards. It attaches file:line to element-level findings and estimates **ease of fix**. It does not judge UX quality.

### 4.7 Optional inspection methods

- **PURE** (pragmatic usability rating by experts) tracks friction of fundamental tasks over releases. A step begins when the system presents options and ends when the user acts expecting a significant response. Each step is rated 1–3 for the declared user by ≥ 3 silent raters. Krippendorff's α ≥ .667 is required, otherwise recalibrate. Final scores are reached by consensus. The task score is the sum, and its colour is the worst step [HCI-058].
- **KLM** compares expert execution time of alternative flows: K 0.28 s, P 1.1 s, B 0.1 s, H 0.4 s, M 1.2 s, with consistent rules for placing M. It is comparative only [HCI-059].
- **Persona walkthroughs** (simulated power user, first-timer, screen-reader or keyboard user, one-handed mobile, stress tester) generate hypotheses cheaply. They are labelled *simulated* and never exceed E1 [HCI-036; IMP-044].

## 5. Consolidation, verification and rating

1. **Merge** on a deterministic key: same locator + same failure mechanism + same state. Text similarity only proposes merges. Merged findings keep all labels and evidence. Cascades are reported once with an `also_blocks` list [EVAL C5].
2. **Verify** each candidate through the verification chain [EVAL noodisD; HCI-026]:
   1. evidence resolution: the anchor resolves in the captured state;
   2. harness filter: not an artefact of capture, emulation or the evaluator's own tooling;
   3. scope filter: within the declared routes, states and personas;
   4. skeptical re-check: the verifier reproduces the problem with a probe;
   5. absence rule: claims of absence need positive evidence;
   6. dismissal ledger: not previously rejected by a human, unless new evidence exists;
   7. confidence-ceiling flag: in iteration ≥ 2 the verifier flags a single-pass E0 finding; the flag does not change the verdict, because severity does not exist yet, and the ceiling itself is applied after rating (step 4) [HCI-029].
3. **Rate** blind. At least three raters see the confirmed findings with evidence but not each other's ratings or any suggested severity. Each rater scores:
   - **frequency** — 0 rare, 1 occasional, 2 common, 3 nearly always;
   - **impact** — 0 trivial, 1 minor delay or annoyance, 2 significant difficulty or error, 3 blocks the task or causes loss of data, money or a support contact;
   - **persistence** — 0 one-time, 1 recurring but overcome once learned, 2 recurring and not overcome;
   - optional **business impact** — 0 none, 1 noticeable cost (support load, lost conversions), 2 major cost (revenue, legal or reputational exposure) **[calibrating]**;

   then the validity (problem, trade-off, not a problem) and, unless it is not a problem, the 1–4 severity. The rater's own factors produce a suggested severity as a prior: `s = impact + ⌊(frequency + persistence) / 2⌋`, capped at 4. If impact = 0, s ≤ 1; if impact = 3, s ≥ 3. The function is monotone in every factor and unit-tested. The rater may deviate with a note [EVAL C3; HCI-010].
4. **Aggregate:** mean of the problem and trade-off values, spread, validity dissent, divergent flag (spread ≥ 2, or a "not a problem" vote against a mean ≥ 2.5), priority, criticality clamp and G1/G2 floor (QUALITY-BAR §6). When more than half of the raters vote "not a problem", or more than half vote "trade-off", the finding takes that validity and moves to `disputed` (ADR-029). Then the confidence ceiling: in iteration ≥ 2, a flagged single-pass finding whose mean is below 2.5 is held out of the report until a second independent pass finds it or a human confirms it; held findings are listed as held [HCI-029].
5. **Report agreement:** any-two agreement (mean pairwise Jaccard over passes), detection counts k of N, and an estimate of undiscovered problems (§9.6), labelled as an estimate.
6. **Debrief:** the lead's synthesis lists agreements, detector-only findings, judge-only findings, false positives, strengths to preserve, divergent items for user research, and then fix ideas.

## 6. Direction-setting

Used by `direct` for new work and redesigns. The full procedure is in `methods/direction-process.md`.

1. **Brief:** subject, audience, the single job of each surface, mode, use scene (light or dark from the physical scene), 3–5 attributes as "X, not Y", tone positions, constraints, real content [CRAFT-001; IMP-011].
2. **References:** ≥ 3 out of category and 1–2 in category, from sources whose terms allow it. Record DNA notes (macrostructure, type logic, colour anchor, density, signature move). Never lift assets [CRAFT-008].
3. **Candidates:** 5–7 directions from the audience's world across ≥ 3 material families, ranked by fit. The category default and its predictable opposite are off-limits unless the brief pins them. On Operate and Read surfaces, candidates must not be costumes of the tools the audience uses [IMP-006/007; 07 §4.1].
4. **Roll:** `uie roll` deals three: a seeded draw from ranks 3…n, the model's own top pick (with a familiarity-risk note) and the conventional option. It also draws structural parameters (fold class, layout families, colour strategy, type-pairing class, density, motion character) from pools unused in recent ledger entries.
5. **Elaborate in isolation:** a direction designer per dealt direction writes a contract (thesis, the audience's world, story, first viewport, form), a token sketch (OKLCH roles, type roles and scale, spacing, radius, elevation, motion) and optionally a specimen page.
6. **Convergence tests:** similar-prompt, category-guess and swap tests. Revise and record what changed [CRAFT-004].
7. **Choose:** the owner picks, or a recorded rubric selects, with a random tie-break between equally grounded options. Lock into `DESIGN.md` and add the ledger entry [CRAFT-010].

For an existing product, the variant procedure applies instead: an identity-lock sentence first, then variants that each commit to a different primary axis without breaking identity [IMP-053].

## 7. Empirical methods

### 7.1 Formative usability testing

- **Plan** (lecture chain: objectives → tasks → data → analysis): objectives, research questions, participant profile and recruiting, method, tasks with success criteria, environment, moderator role, measures, analysis and report plan, ethics and consent [HCI-044].
- **Participants:** about 5 per distinct user group per round; 3–4 each for two groups; ≥ 3 each for three or more. Run several rounds. Raise n for complex or heterogeneous products, or estimate p after 2–4 sessions (§9.5). Never claim a coverage percentage [HCI-041/042; HCI X1].
- **Tasks:** realistic, actionable ("do", not "say how"), free of UI labels and clues, with predefined success criteria. Pilot every task [HCI-024/045].
- **Moderation:** concurrent think-aloud by default. Neutral probes only (echo, boomerang, Columbo). Every intervention is logged, and the affected segment is excluded from metrics. Use retrospective or silent sessions when time on task is measured. Keep the protocol identical across compared conditions [HCI-046/047].
- **Incentives:** flat, never tied to performance (CMU lecture). Reassure participants that the product, not they, is being tested [PLAT-142].
- **Logistics:** sessions of 30–60 minutes, ≤ 6 per day, ≥ 15 minutes between sessions [PLAT-142].
- **Remote unmoderated tests:** only for focused questions on few elements. Pilot and over-recruit [HCI-048].

### 7.2 RITE iteration

After each session, triage RITE-style:
1. obvious cause, quick fix → fix now;
2. obvious cause, slow fix → start the fix;
3. unknown cause → gather more evidence;
4. possible method artefact → gather more evidence.

Report fix confidence 1 − (1 − p)^n over n clean sessions, the impact ratio (fixed ÷ found) and the re-fix ratio [HCI-037/039/040].

### 7.3 Summative benchmarks

n comes from the target margin of error; the default is 40 per condition for binary metrics (about ±15% at 95%). Report:
- task success, binary against predefined criteria, with the adjusted-Wald CI (benchmark: median completion 78%);
- time on task as a geometric mean with a CI on log times, success-only and all-attempt times separately;
- SEQ after every task (benchmark about 5.5; ask "why" below 5);
- SUS at the end (mean 68; Sauro–Lewis grades).

Never report quantitative metrics or NPS from a 5-user formative round [HCI-043/049/050/051/052/055].

### 7.4 Questionnaires

| Instrument | Use | Scoring (implemented in `uie study`) |
|---|---|---|
| **SUS** (original Brooke wording, or the validated all-positive variant) | overall perceived usability | §9.2 (`--variant positive` for the all-positive version) |
| **SEQ** (single 7-point item) | per-task ease | mean with t-CI |
| **UMUX-Lite** (2 items, 7-point) | short-form usability, including usefulness | SUS-equivalent = 0.65 × ((i1 + i2 − 2) × 100/12) + 22.9 |
| **NASA-TLX** | workload in expert tools | weighted = Σ(rating × weight) / 15 from 15 pairwise comparisons; raw TLX = mean of the 6 ratings (declare which) |
| **NPS** | not a UI acceptance criterion; never for small n | — |

Behaviour beats self-report when they conflict. About 14% of failed tasks are still rated "easy" on SEQ [HCI-051/056].

### 7.5 Desirability and first impressions

- **Reaction cards:** about 25 words, about 40% negative, randomised. Participants pick their top 5. Pre-register which words count as on-brand (from the "X, not Y" attributes). Report the share of participants choosing ≥ 1 on-brand word, with a CI [CRAFT-063].
- **5-second test:** recall and impression questions after a 5-second exposure. First impressions form within 50 ms and persist (Lindgaard 2006).

### 7.6 Controlled experiments and A/B tests

- **Logic** (CMU lecture): change one variable; measure a predefined outcome; repeat. Causal claims follow Mill's conditions — the cause precedes the effect, cause and effect covary, and alternative explanations are ruled out — which randomisation secures. Within-subject designs counterbalance order (Latin square). Between-subject designs randomise assignment.
- **A/B:** pre-register the overall evaluation criterion (OEC) and guardrail metrics. Size each variant with n ≈ 16σ²/Δ² (80% power) or 21σ²/Δ² (90%), where σ² = p(1 − p) for proportions. Run ≥ 1–2 full weeks and analyse new users separately for novelty and primacy effects. Run an SRM chi-square check on every experiment; a mismatch invalidates the results until its cause is found. No peeking: use a fixed horizon or always-valid sequential inference. Twyman's law: a surprisingly large effect triggers an instrumentation investigation first [HCI-060…063].
- **Language:** causal verbs only for randomised experiments (E5). Before/after and observational analytics are associations, reported with candidate confounds [HCI-064].

### 7.7 Post-launch metrics

HEART (Happiness, Engagement, Adoption, Retention, Task success) via Goals → Signals → Metrics, with an explicit include or exclude decision per category and per-user normalisation [HCI-065]. Analytics anomalies become candidate findings only when they clear a signal rule (e.g. ≥ 3× baseline rate, ≥ 10 sessions, ≥ 5 distinct people, from the PostHog practice) [EVAL]. Every quantitative anomaly gets a qualitative probe, such as a replay, a session or a walkthrough of that step [HCI-066].

### 7.8 Feedback analysis

Thematic analysis in six phases (familiarise; code; generate themes; review themes; define and name; report) or affinity diagramming. Each theme reports prevalence k/N and ≥ 2 supporting extracts, from ≥ 2 different people whenever identities are known. A single vivid quote, or one person's repeated complaints, cannot create a theme [HCI-057]. Themes link to findings, which raises frequency and evidence level, or become candidate findings that must be reproduced. The reporter's own severity scale is kept in a separate field and maps only to a prior that orders reproduction and verification work. Raters never see the reporter's severity or the prior mapped from it, like any other suggested severity (ADR-007). Raters never see the reporter's severity or its mapped prior, because a suggested severity shown before rating anchors them (FRAMEWORK §6.2) [EVAL C1; EVAL-014]. Personal data is scrubbed on import.

## 8. Fix verification

A fix is a hypothesis until it is re-tested [06 §3.1]. "Verified" means:
1. the **originating criterion** passes again (the same rule threshold, the same probe no longer reproducing the problem, or the same CW step now passing);
2. the **adjacent happy path** still works at the affected viewport;
3. there is **no regression**: no introduced deterministic finding (identity-based set difference, ADR-033), no unexplained pixel change outside the target's box plus margin, no lost ARIA names, roles or landmarks, and console parity;
4. the evidence comes from someone other than the fixer (ADR-030): a **fresh fix reviewer** scores a judged finding's fix `confirmed_fixed` from visible evidence; a **re-run of the same check** on the fixed build no longer reports a deterministic finding (`uie diff` lists it as cleared); or a **human** confirms it. The fixer's own re-test moves a finding only to `fixed`.

With real users, report fix confidence over clean sessions (§9.5) [HCI-038/039; TOOL-24/26].

## 9. Statistics reference

All formulas are implemented and unit-tested in `scripts/lib/study/`.

### 9.1 Confidence intervals
- **Completion rate (adjusted Wald):** with x successes of n and z = 1.96: p̃ = (x + z²/2) / (n + z²); CI = p̃ ± z·√(p̃(1 − p̃)/(n + z²)), clipped to [0, 1].
- **Mean** (SEQ, SUS, ratings): x̄ ± t(0.975, n − 1)·s/√n.
- **Time on task:** geometric mean exp(mean(ln tᵢ)). Compute the CI on ln t with the t-interval, then exponentiate [HCI-050].

### 9.2 SUS
Score = 2.5 × Σ[(odd item − 1) + (5 − even item)], range 0–100. For the all-positive variant every item scores (item − 1). It is not a percentage. Mean 68. Sauro–Lewis curved grades: A+ ≥ 84.1; A 80.8–84.0; A− 78.9–80.7; B+ 77.2–78.8; B 74.1–77.1; B− 72.6–74.0; C+ 71.1–72.5; C 65.0–71.0; C− 62.7–64.9; D 51.7–62.6; F ≤ 51.6 [HCI-052].

### 9.3 Sample sizes
- **Margin of error for a proportion:** n ≈ z²·p(1 − p)/E² (43 for ±15% at 95%). With the adjusted-Wald interval the requirement is n ≈ z²·p(1 − p)/E² − z² (≈ 40), which is NN/g's planning default of 40 per condition for ±15% [HCI-043]. `uie study samplesize` prints both.
- **A/B:** n per variant ≈ 16σ²/Δ² (α = .05, power .80) or 21σ²/Δ² (power .90) [HCI-060]. For two proportions `uie study ab` also prints the exact normal-approximation n = (z₁₋α/₂·√(2p̄(1 − p̄)) + z₁₋β·√(p₁(1 − p₁) + p₂(1 − p₂)))² / Δ².

### 9.4 SRM check
χ² goodness-of-fit of observed assignment counts against the planned split. A mismatch below the configured threshold (default p < 0.001) invalidates the experiment until explained [HCI-061].

### 9.5 Problem discovery and fix confidence
- P(problem seen at least once in n sessions) = 1 − (1 − p)^n.
- Sessions needed for target probability P: n = ln(1 − P) / ln(1 − p).
- RITE fix confidence after n clean sessions = 1 − (1 − p)^n (e.g. 6 clean sessions → 88% at p = .30, 47% at p = .10) [HCI-039/042].

### 9.6 Evaluator agreement and undiscovered problems
- **Any-two agreement:** the mean over pairs of passes of |Pᵢ ∩ Pⱼ| / |Pᵢ ∪ Pⱼ|. The human baseline is 5–65% [HCI-015].
- **Discovery-rate estimate:** λ̂ = Σₖ kₖ / (N·F), where F is the number of unique problems found by N passes and kₖ the number of passes that found problem k. Estimated total = F / (1 − (1 − λ̂)^N). With few passes λ̂ is biased upwards, so the estimate is optimistic and is labelled as such [EVAL §3.4; Hertzum & Jacobsen].

### 9.7 Inter-rater reliability
Severity spread per finding; for PURE, Krippendorff's α (ordinal, since PURE's 1–3 rubric is ordinal) ≥ .667, computed with `uie study alpha` [HCI-058].

## 10. Method limits that reports must state

| Method | Statement required in the report |
|---|---|
| Any single inspection pass | recovers roughly a third of problems (LLM: 35–45% of an expert set) |
| Heuristic evaluation | can report false problems; validated by the verifier and, for divergent items, by users |
| LLM cognitive walkthrough | failure points are hypotheses; completion is not predicted user success |
| Design panel | judged; scores are context only; aesthetic agreement between raters is modest |
| Automated accessibility | covers a minority of WCAG criteria; needs-human items listed |
| Formative test (n ≈ 5) | finds problems; does not estimate rates; no benchmarks or NPS |
| Observational analytics | association, not causation; confounds listed |
| Simulated personas | hypothesis generation only; never metrics |
