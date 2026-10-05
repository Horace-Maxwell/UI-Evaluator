# Experiments and analytics

How to run controlled experiments and A/B tests that can support causal claims, how to define post-launch metrics with HEART, and how to turn analytics anomalies into candidate findings without claiming more than the data shows. This file serves G7 criterion EMP-08 and decides when a claim may use causal wording, which the report language lint enforces as EVD-06. Read it in the `study` workflow when writing `ab-spec.md` or a lab comparison, and in the `ingest` workflow when the owner shares analytics exports.

## Contents

1. [Purpose and when to use](#1-purpose-and-when-to-use) · 1.1 Who does what · 1.2 Gate criteria served
2. [Inputs](#2-inputs)
3. [Procedure](#3-procedure)
   - 3.1 Causal claims and Mill's conditions · 3.2 Controlled lab experiments · 3.3 Planning an A/B test · 3.4 Power, sample size and duration · 3.5 Running: instrumentation, SRM, no peeking · 3.6 Interpreting and wording results · 3.7 HEART with Goals–Signals–Metrics · 3.8 Analytics anomalies to candidate findings · 3.9 The confound checklist · 3.10 LLM preferences are not predicted outcomes
4. [Output format](#4-output-format)
5. [Quality checks](#5-quality-checks)
6. [Pitfalls](#6-pitfalls)
7. [Sources](#sources)

---

## 1. Purpose and when to use

| Question | Method | Strongest evidence level |
|---|---|---|
| Does version B change behaviour compared with A, at scale? | A/B test (randomised online experiment) | E5, when every validity check in §3.6 passes |
| Which of two designs is faster or less error-prone for these tasks? | controlled lab experiment | E5, limited to the people, tasks and setting sampled |
| How is the launched product doing over time? | HEART via Goals–Signals–Metrics | E3, or E4 with intervals; association only |
| Something moved in analytics. Is it a problem? | signal rule, then a qualitative probe | E3 association |
| Did the release make things better? | before/after comparison | association only, never causal |

The CMU lecture's logic for A/B testing is: change one variable, measure an outcome defined in advance, and repeat. Repetition means many randomised units within one experiment, and replicating a surprising result before relying on it. Results reported by others need the same replication, because effects vary from product to product (06 §2.D.2).

### 1.1 Who does what

- **The agent** writes the hypothesis and `ab-spec.md`, computes power and duration, analyses the counts and metric values the owner exports, writes HEART specifications, applies signal rules to exports and words the results.
- **The owner** decides whether to experiment on real users at all, configures the experimentation platform and traffic, exports the data and makes the ship decision. The agent does not change production traffic, flags or analytics configuration, and works only on exports the owner provides; optional integrations run only when the owner enables them (FRAMEWORK §15).
- **Ethics.** An experiment exposes real people to an untested version. The owner judges consent and possible harm. Never test a deceptive pattern as a variant (FRAMEWORK §15), and track harm signals such as complaints and support contacts as guardrails beside the success metric (04 §2.9).

### 1.2 Gate criteria served

Repeated exactly from QUALITY-BAR G7. `U` means verified with real users.

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| EMP-08 | (optional) Experiment validity | pre-registered success metric and guardrails; power analysis; SRM check passed; fixed horizon or always-valid inference | U | HCI-060/061/062 |

EMP-08 is optional. When no experiment is planned, record it as `not_applicable` with that reason. Whenever an experiment's result is reported, all four parts apply.

## 2. Inputs

| Input | Where | Why |
|---|---|---|
| Goals, top tasks, users, target level | `PRODUCT.md` | goals come before signals and metrics [HCI-065] |
| The change under test and why it exists | the motivating finding IDs; `DESIGN.md` decisions | a hypothesis grounded in evidence (§3.3) |
| Baseline rates, variances and daily eligible traffic | the owner's analytics, or an A/A test | inputs to power and duration (§3.4) |
| Assignment counts, metric values, event exports | files the owner provides, kept under `.ui-evaluator/feedback/raw/` | analysis; exports can contain user identifiers, so they stay git-ignored and are scrubbed on import |
| Release and campaign calendars | the owner | candidate confounds (§3.9) |

## 3. Procedure

### 3.1 Causal claims and Mill's conditions

A causal claim needs all three of Mill's conditions [HCI-064]:

1. **Temporal precedence:** the cause comes before the effect.
2. **Covariation:** cause and effect vary together.
3. **No plausible alternative explanation:** no confound accounts for the relationship.

Random assignment makes the groups equivalent in expectation, so the only systematic difference between them is the change. That is what rules out alternative explanations, and why only randomised experiments reach E5 (FRAMEWORK §4.4).

| Design | Precedence | Covariation | Alternatives ruled out | Level and allowed wording |
|---|---|---|---|---|
| Randomised A/B test that passes §3.6 | yes | yes | yes | E5: "caused", "increased", "reduced" |
| Lab experiment with random assignment or counterbalancing | yes | yes | yes, for the people and tasks sampled | E5, with its scope stated |
| Before/after a release | yes | yes | no | association: "after the release, X rose; other possible explanations: …" |
| Observational analytics (segments, correlations) | often unclear | yes | no | association |
| LLM pairwise preference; simulated users | no behaviour observed | — | — | not evidence about behaviour (§3.10) |

### 3.2 Controlled lab experiments

Use these to compare two or more designs on the same tasks with a modest number of people, for example the current part-search filter of a bicycle-parts inventory against a redesigned one.

1. **Variables.** The independent variable is the design, with its versions as levels. The dependent variables are outcomes defined in advance: task success, time on task, errors, SEQ (scored as in `surveys-metrics.md`). Hold everything else constant: tasks, protocol, environment, device, build.
2. **Design.**
   - *Within-subjects:* every participant uses every version. Each person is their own control, so fewer participants are needed, but order and learning carry over. Counterbalance, and give each version a different but equally hard task set where learning the answer would carry over (searching for different parts of similar difficulty).
   - *Between-subjects:* each participant uses one version, assigned at random. No carry-over, but more participants are needed.
3. **Counterbalance with a Latin square,** in which each version appears once in each position. For an even number of versions, use a balanced Latin square, in which each version also follows every other version exactly once. For four versions:

   ```
   order 1: A B D C
   order 2: B C A D
   order 3: C D B A
   order 4: D A C B
   ```

   For an odd number of versions, use the square together with its mirror image (six orders for three versions). Recruit in multiples of the number of orders.
4. **Randomise** the assignment of participants to orders or to versions with a seeded random list, and record the seed in the plan. The moderator never chooses.
5. **Control confounds.** Use the same strict moderation protocol for every version, because protocol style changes task performance (06 §3.2 X5). Keep task difficulty, device, environment and time of day comparable. Expect people who know the old design to be slower at first with a new one (primacy). Where possible, the moderator should not know which version is the new one.
6. **Size it.** For a between-subjects comparison, n per group ≈ 16σ²/Δ² for 80% power (§3.4); `uie study ab` computes it from the standard deviation and Δ. A within-subjects design needs fewer people; base its power calculation on the spread of the paired differences, estimated in a pilot.
7. **Analyse.** Report each version's success with an adjusted-Wald interval and its time as a geometric mean (`uie study ci`, `uie study time`), then the difference with its interval and the n per version. In within-subjects designs, analyse paired differences. A valid result is E5 for the sampled people, tasks and setting. Say so, and do not generalise it to all users.

### 3.3 Planning an A/B test

Write `studies/<id>/ab-spec.md` before launch, and date it. Changes after launch are logged as deviations with a date and a reason. The specification contains:

1. **Hypothesis:** the change, the metric, the expected direction and size, and the evidence-based reason, such as an observed finding. It must be specific, measurable, grounded and falsifiable [EVAL-098].
2. **Overall evaluation criterion (OEC):** one primary metric chosen in advance. Prefer one that predicts long-term value over one that measures short-term clicks. Choosing the metric after the fact inflates false positives [HCI-060].
3. **Guardrails:** organisational ones that must not get worse (latency, error rate, page load, support contacts, complaints), and trust guardrails that validate the experiment itself (the SRM check, A/A behaviour).
4. **Randomisation unit:** the person, not the page view, so each person sees one version. Where people interact with each other (shared documents, marketplaces), one person's version can affect another's; choose the unit accordingly (06 §2.D.2).
5. **Population and triggering:** who is eligible. Analyse only the people who were actually exposed to the change, which lowers variance.
6. **Analysis plan:** the test, α, one- or two-sided, which few segments are confirmatory, and that new users are analysed separately (§3.5).
7. **Power and duration** (§3.4).
8. **Stopping rule:** a fixed horizon, or an always-valid sequential method chosen now.
9. **Decision rule:** which results lead to ship, iterate or stop. The decision is the owner's.

### 3.4 Power, sample size and duration

- **Sample size per variant:** n ≈ 16σ²/Δ² (α = .05, power .80) or 21σ²/Δ² (power .90), where σ² = p(1 − p) for proportions and Δ is the smallest absolute change worth detecting (METHODS §9.3) [HCI-060]. Compute it with `uie study ab` from the baseline rate (or the standard deviation, for a mean), Δ and the power. Use `uie study samplesize` instead when the aim is only to estimate one rate to a given margin of error.
- **Derived example:** a baseline of 5% and Δ = 1 percentage point give σ² = .0475, so about 7,600 per variant at 80% power and 9,975 at 90%. The rule of thumb uses the control rate's variance; an exact two-proportion calculation for 5% → 6% gives about 8,158 (04 §2.3), so round up generously.
- **Variance matters.** A lower-variance OEC needs fewer people: in Kohavi's example, switching from purchase spend to conversion rate cut the requirement from about 409,000 to about 122,000 users. For skewed metrics (skewness |s| > 1), the mean needs about 355 × s² observations per variant before it is approximately normal; capping extreme values reduces s (06 §2.D.2).
- **Duration:** days = (n per variant × number of variants) ÷ eligible people per day, rounded up to whole weeks, and never less than 1–2 full weeks, so that weekly cycles and novelty effects are covered [HCI-060]. Derived example: 7,600 × 2 ÷ 1,200 eligible people per day = 12.7 days, so run 2 full weeks.
- **Keep variants the same size.** Unequal splits cost power.
- **Run an A/A test** on a new platform or a new metric. If many more than 5% of metrics come out significant, something is broken; bots are a common cause (06 §2.D.2).

### 3.5 Running: instrumentation, SRM, no peeking

1. **Check instrumentation before launch.** The events that feed the OEC and the guardrails fire the same way in every variant [EVAL-098].
2. **Check SRM on every experiment** [HCI-061]: a χ² goodness-of-fit test of the observed assignment counts against the planned split. A mismatch below the configured threshold (default p < 0.001) invalidates the experiment until its cause is explained (METHODS §9.4). Run `uie study srm`.
   - Derived example: planned 50/50, observed 50,600 and 49,400 people: χ² = 14.4, p ≈ 0.00015. That is an SRM, even though the split looks nearly even.
   - About 6% of experiments at Microsoft showed an SRM. Look for causes such as bots, redirects, triggering bugs or data lost in one variant.
3. **Do not peek.** Analyse once at the planned horizon, or use an always-valid sequential method chosen in advance [HCI-062]. Watching p-values continuously and stopping at p < .05 can raise the false-positive rate about fivefold (Johari et al.).
4. **Twyman's law:** "Any figure that looks interesting or different is usually wrong" (Twyman, via Kohavi et al. 2014). A surprisingly large effect triggers a check of the instrumentation and the data pipeline before anyone acts on it [HCI-063].
5. **Novelty and primacy.** Experienced users can be slower at first with a new design (primacy, which favours the control), while curious users click around a new feature (novelty, which favours the treatment). Compute the OEC for new users separately, since neither effect applies to them [HCI-060].

### 3.6 Interpreting and wording results

A result is E5 only when all of these hold; otherwise it is not causal evidence, and the report says which check failed:

- the OEC and guardrails were pre-registered;
- a power analysis was done;
- the SRM check passed;
- the analysis used a fixed horizon or always-valid inference;
- randomisation used the planned unit and population.

Wording, using a municipal recycling service as an example:

- **Valid, positive:** "In a randomised experiment over 14 days (n₁ and n₂ residents), the new address form increased the share of lookups that reached the collection schedule from a to b (difference d, 95% CI l–u). Guardrails stayed within their limits."
- **No significant difference:** "No difference was detected at this sample size; the interval (l–u) still includes changes of up to u." Never "the change has no effect".
- **Segments:** only pre-registered segments are confirmatory. Others are hypotheses, because many comparisons produce false positives.
- **What, not why.** An experiment shows that behaviour changed, not why. Pair it with a qualitative probe, such as a usability session or replays of the affected step [HCI-066].
- **Short term.** Experiments measure short-term effects; long-term effects need a holdout.
- **Behaviour, not preference.** "Users prefer B" is the wrong wording for a behavioural metric. Say what was measured.

A decision rule the owner can adopt or change: ship when the OEC difference is significant with an interval that excludes zero and no guardrail got worse [EVAL-098].

### 3.7 HEART with Goals–Signals–Metrics

HEART (Happiness, Engagement, Adoption, Retention, Task success) defines metrics for a launched product. It does not replace formative research, and its metrics never stand alone: triangulate them with usability studies [HCI-065].

1. **Decide per category.** Include or exclude each of the five, with a reason. Engagement means nothing for a mandatory tool, for example.
2. **Goals.** What must users accomplish, and what is the change for? Agree on them first; teams often disagree. Do not worry about measurability yet.
3. **Signals.** Which behaviours or attitudes would show success or failure, and from which source (logs, surveys)? Choose signals that move only when the experience changes. Failure is often easier to see than success: abandonment, undo, rage clicks.
4. **Metrics.** Normalise per user and per period, using ratios rather than raw counts; filter bots and test accounts; confirm that the needed actions are logged.
5. **Pair categories** to catch bad growth: engagement with happiness reveals compulsive use, and retention with happiness reveals captive users (04 §2.9).
6. **Expect change aversion.** Satisfaction can dip after a redesign and then recover, so read trends over weeks.

Example for a municipal recycling service:

| Category | Decision | Goal | Signal | Metric |
|---|---|---|---|---|
| Happiness | include | residents trust the schedule | a one-question in-product survey | share agreeing, per week |
| Engagement | exclude | — | — | more visits would not mean a better service |
| Adoption | include | residents start using collection reminders | reminder sign-ups | new subscribers per week as a share of weekly visitors |
| Retention | include | reminders stay useful | subscriptions kept | share of each monthly cohort still subscribed after three months |
| Task success | include | residents find their collection day without phoning | lookups that reach the schedule, and lookups abandoned at the address step | lookup completion rate per week |

Write the table into the study's `plan.md`.

### 3.8 Analytics anomalies to candidate findings

1. **Normalise first** [EVAL-084]: strip query strings and fragments from URLs and replace numeric IDs with `:id`; exclude test accounts and internal traffic; compare against total traffic, because a count that rises with traffic is not a signal.
2. **Apply the signal rule** (METHODS §7.7). An anomaly becomes a candidate only when it is concentrated relative to the surface's own history, for example ≥ 3× its baseline rate, ≥ 10 sessions and ≥ 5 distinct people. These defaults come from PostHog's practice; keep them configurable and state the values used in the report (04 §5). Exclude storms caused by a single person. A page with no history yields a note, not a candidate.
   - Derived example: rage clicks on the address step averaged 4.8 per day over the previous 13 days. A day with at least 15 rage clicks, spread over at least 10 sessions and 5 people, clears the rule.
3. **Corroborate** before calling something broken: dead clicks, errors right after a click, or quick returns to the previous page in the same sessions [EVAL-084].
4. **Name elements from data, not from guesses.** Heatmap hotspots are named from autocapture or DOM selectors and segmented by viewport width, using unique visitors. Rank them: rage-click clusters, then clicks on non-interactive elements, then important actions below the scroll cliff, then ignored primary actions [EVAL-085].
5. **Probe every anomaly qualitatively** [HCI-066]: a shortlist of 3–5 session replays, each with a reason and with the total number of sessions behind the shortlist [EVAL-086]; a usability session; or a walkthrough of that step. Analytics say what and where; the probe says why.
6. **Record it.** Import the export with `uie feedback import <file> --source analytics`, so that it is scrubbed and counted like other feedback. Write a candidate finding with the normalised route and element as its location, the heuristic, CW question or journey step it concerns, and the counts, baseline, window and thresholds as evidence. Send it through the verifier as described in `feedback-analysis.md`. It reaches E3 as real usage data and is always worded as an association with its candidate confounds (§3.9).
7. **The reverse direction.** Every qualitative finding that is a candidate for priority gets a frequency estimate from analytics where the data exists [HCI-066].

### 3.9 The confound checklist

Before writing about any before/after or observational change, list which of these could explain it:

| Confound | Example | Check |
|---|---|---|
| Season and calendar | holidays; schedule changes at the end of the year | the same period last year; weekday mix |
| Marketing and outside events | a campaign, press coverage, a council announcement | campaign calendar |
| Concurrent releases | another team shipped in the same week | release log |
| Traffic and device mix | a surge of mobile visitors from a social post | segment by source and device |
| Novelty and change aversion | a dip after a redesign that later recovers | trend over several weeks; new users separately |
| Instrumentation changes | a renamed or double-firing event | event definitions; SDK version |
| Bots and test accounts | automated traffic inflating counts | filters; A/A behaviour |
| Selection | only people who reached step 3 are counted | funnel denominators |
| Regression to the mean | the page was examined because last week was unusually bad | a longer baseline |
| Outages and slowness | a slow week raises abandonment | latency and error dashboards |

Then word it as an association: "After the release, abandonment at the address step fell from a to b. Other possible explanations: a reminder campaign in the same week, and more mobile traffic." Never "the redesign reduced abandonment" below E5 [HCI-064]. Engagement can even rise because people are lost (Rodden et al. 2010).

### 3.10 LLM preferences are not predicted outcomes

- When multimodal models were asked to pick the winner of 300 real A/B test pairs, their order-consistent accuracy was near chance (the best about 35% against a chance level of 25%), with severe position bias (Jeon et al. 2026) [HCI-034]. An LLM preference between two designs is therefore never a predicted A/B outcome, a conversion forecast or a statement about what users prefer (FRAMEWORK §13 rule 5).
- Pairwise LLM judgements belong only in the design panel (DES-05): run in both orders, keep only order-consistent preferences, label them *(judged)*.
- Completion rates and satisfaction answers from simulated users are never metrics [HCI-036].
- A vendor's own research claims, such as large speed-ups reported without published data, are hypotheses to test with this product's users, not evidence for it [PLAT-143].

## 4. Output format

| File | Content | Format |
|---|---|---|
| `studies/<id>/ab-spec.md` | the dated pre-registration (§3.3), power and duration, analysis plan, deviations log | — |
| `studies/<id>/plan.md` | for lab experiments: design, Latin square, assignment seed; for HEART: the category table | `../templates/study-plan.md` |
| `studies/<id>/results.json` | SRM result (counts, χ², p, threshold); OEC and guardrail estimates with intervals; horizon used; the §3.6 validity checklist; evidence level (E5 only when every check passes) | machine-readable, from `uie study ab`, `srm`, `samplesize` with `--json` |
| `feedback/feedback.jsonl` | imported analytics items | `feedback.schema.json` |
| the findings register | candidate findings with thresholds, window, baseline and confounds in their evidence | `finding.schema.json` |

`uie study ab` sizes an experiment (n per variant); `uie study srm` runs the SRM check on the assignment counts; `uie study samplesize` gives n for a target margin of error; `uie study ci` gives each variant's own interval. Take the OEC difference and its interval from the experimentation platform's analysis, and record which method it used. Run `--help` on each command for the input format.

## 5. Quality checks

An output is invalid when:

- causal wording ("caused", "increased", "reduced", "improved") appears without E5;
- the OEC or guardrails were chosen or changed after launch without a logged deviation;
- an experiment is reported without its SRM result, or with an SRM that was not explained;
- results were analysed before the planned horizon without an always-valid method;
- a non-significant result is reported as "no effect";
- a before/after or observational comparison lacks its list of candidate confounds;
- an analytics anomaly became a candidate without clearing a signal rule, without normalisation, or without a qualitative probe;
- the thresholds of the signal rule are not stated;
- an LLM preference or a simulated-user metric is presented as a predicted outcome;
- the agent changed production traffic, flags or analytics configuration.

## 6. Pitfalls

| Pitfall | Evidence |
|---|---|
| Peeking at p-values and stopping early | can raise the false-positive rate about fivefold (Johari et al.) [HCI-062] |
| Ignoring SRM | about 6% of Microsoft experiments had one; it usually invalidates the result (Fabijan et al. 2019) [HCI-061] |
| Celebrating a surprisingly large effect | such effects are usually wrong, most often because of an instrumentation bug (Kohavi et al. 2014) [HCI-063] |
| Running for a few days | weekly cycles, novelty and primacy distort short tests [HCI-060] |
| Choosing the success metric afterwards | inflates false positives (Kohavi et al. 2009) [HCI-060] |
| Reading a before/after change as an effect | fails Mill's third condition [HCI-064] |
| Counting raw events | engagement can rise because people are lost; normalise per user (Rodden et al. 2010) [HCI-065] |
| Trusting a single-person storm | concentration against the surface's own history separates signal from noise [EVAL-084] |
| Asking an LLM which variant will win | order-consistent accuracy near chance (Jeon et al. 2026) [HCI-034] |
| Treating vendor research as proof | unpublished stimuli and effect sizes; test locally first [PLAT-143] |

## Sources

- Research adopt items: HCI-034, HCI-036, HCI-060 to HCI-066 (06); EVAL-084 to EVAL-086, EVAL-098 (04); PLAT-143 (05).
- Alexandra Ion, *Evaluation: Analytical vs Empirical*, CMU Human-Computer Interaction Institute, course lecture (A/B logic; Mill's methods; correlation and causation).
- Kohavi, Longbotham, Sommerfield & Henne, *Controlled experiments on the web: survey and practical guide*, Data Mining and Knowledge Discovery 18, 2009. https://ai.stanford.edu/~ronnyk/2009controlledExperimentsOnTheWebSurvey.pdf
- Kohavi, Deng, Longbotham & Xu, *Seven Rules of Thumb for Web Site Experimenters*, KDD 2014. https://exp-platform.com/Documents/2014%20experimentersRulesOfThumb.pdf
- Fabijan et al., *Diagnosing Sample Ratio Mismatch in Online Controlled Experiments*, KDD 2019. https://exp-platform.com/Documents/2019_KDDFabijanGupchupFuptaOmhoverVermeerDmitriev.pdf
- Johari, Pekelis & Walsh, *Always Valid Inference: Continuous Monitoring of A/B Tests*, Operations Research, 2022 (arXiv 1512.04922).
- Kohavi, Tang & Xu, *Trustworthy Online Controlled Experiments*, Cambridge University Press, 2020 (chapter list consulted).
- Shadish, Cook & Campbell, 2002, Mill's conditions as summarised in https://pmc.ncbi.nlm.nih.gov/articles/PMC2957016/
- Rodden, Hutchinson & Fu, *Measuring the User Experience on a Large Scale*, CHI 2010. https://research.google.com/pubs/archive/36299.pdf
- Jeon et al., *Do MLLMs Capture How Interfaces Guide User Behavior?* (WiserUI-Bench), ACL 2026. https://aclanthology.org/2026.acl-long.2049/
- PostHog, `PostHog/skills` (MIT): replay signal scouting, heatmap assessment, session shortlisting. https://github.com/PostHog/skills. No text or code was taken from the unlicensed `PostHog/ai-plugin`.
- NN/g, *When to Use Which User-Experience Research Methods*, 2022. https://www.nngroup.com/articles/which-ux-research-methods/
