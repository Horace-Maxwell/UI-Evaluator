# Surveys and metrics

How to measure task success, time on task, perceived ease and usability, workload and brand reaction, and how to report each number honestly. This file serves G7 criteria EMP-06 and EMP-07. Read it in the `study` workflow when choosing instruments and sample sizes, and in the `ingest` workflow when results come back. Every number here is computed with `uie study`, which implements the formulas of METHODS §9; this file repeats them so you can check the output.

## Contents

1. [Purpose and when to use](#1-purpose-and-when-to-use) · 1.1 Gate criteria served · 1.2 Formative or summative
2. [Inputs](#2-inputs)
3. [Procedure](#3-procedure)
   - 3.1 Choose and pre-register measures · 3.2 Sample size · 3.3 Task success · 3.4 Time on task · 3.5 SEQ · 3.6 SUS · 3.7 UMUX-Lite · 3.8 NASA-TLX · 3.9 NPS · 3.10 Desirability (reaction cards) · 3.11 Five-second test · 3.12 Self-report against behaviour · 3.13 Commands
4. [Output format](#4-output-format)
5. [Quality checks](#5-quality-checks)
6. [Pitfalls](#6-pitfalls)
7. [Sources](#sources)

---

## 1. Purpose and when to use

| Question | Measure | Evidence level |
|---|---|---|
| How good is it, or is it better than before? | summative benchmark: task success, time on task, SEQ, SUS or UMUX-Lite | E4 when reported with a confidence interval |
| How hard was this task, and why? | SEQ after each task, with a "why" follow-up (formative or summative) | diagnostic in formative rounds; E4 in summative ones |
| How heavy is the workload in an expert tool? | NASA-TLX | E4 with an interval |
| Does it feel the way the brand intends? | reaction cards and a five-second test | E3 counts; E4 with an interval when n allows |
| Should this UI change ship? | none of these alone; see `experiments-analytics.md` for causal questions | — |

Questionnaire answers from simulated personas are never reported, at any level [HCI-036].

### 1.1 Gate criteria served

Repeated exactly from QUALITY-BAR G7. `U` means verified with real users.

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| EMP-06 | Honest metrics | task success with 95% adjusted-Wald CI; SEQ mean with CI; SUS with CI if collected; time as geometric mean; no NPS or SUS reported from a 5-user formative round as a benchmark | U | HCI-049…055 |
| EMP-07 | (optional) Desirability | share of participants choosing ≥ 1 pre-registered on-brand word from a ~25-word reaction-card list (~40% negative); 5-second test | U | CRAFT-063 |

- EMP-06 applies to every metric that is reported, whatever kind of study produced it.
- EMP-07 is optional. When the owner has not planned a desirability test, record it as `not_applicable` with that reason. When one runs, it has to meet the criterion.

### 1.2 Formative or summative

- **Formative rounds** (about 5 per group) find problems. Report counts ("4 of 5 participants"), never rates or benchmarks: METHODS §7.3 rules out quantitative metrics from a five-person round, and the interval shows why. 4 of 5 has a 95% adjusted-Wald interval of 36–98% (derived), which is compatible with almost any true rate. No SUS benchmark and no NPS from a five-person round (EMP-06).
- **Summative benchmarks** estimate how good the UI is. Size them from the margin of error (§3.2), keep the protocol silent or retrospective so times are valid, and report every metric with its interval.

## 2. Inputs

| Input | Where | Why |
|---|---|---|
| Study plan, analysis plan and research questions | `studies/<id>/plan.md`, `analysis-plan.md` | measures are fixed before data (§3.1) |
| Task success criteria and stop rules | `studies/<id>/tasks.md` | success is scored against predefined criteria [HCI-049] |
| Questionnaire forms and reaction-card lists | `studies/<id>/instruments/` | the exact wording administered |
| Raw responses and observations, scrubbed | `studies/<id>/data/` | the input to `uie study` |
| Brand attributes as "X, not Y" pairs | `DESIGN.md` | the source of pre-registered on-brand and off-brand words |
| Captures of the surface at the intended viewport | `uie capture` output in `runs/<id>/evidence/screens/` | stimuli for five-second tests |

## 3. Procedure

### 3.1 Choose and pre-register measures

Before the first session, write into `analysis-plan.md`: each measure, its exact wording and scale, when it is asked, how it is scored, what it is compared with (a benchmark, a previous version, a target), the exclusion rules (for example sessions with a technical failure), and n. Choosing metrics after seeing the data inflates false positives, the same reason experiments fix their success metric in advance (06 §2.D.2).

| Measure | Construct | When | Scale | Compute with |
|---|---|---|---|---|
| Task success | effectiveness | observed per task | binary against predefined criteria | `uie study ci` |
| Time on task | efficiency | observed per task, silent or retrospective sessions only | seconds | `uie study time` |
| SEQ | perceived ease of one task | right after each task | 1–7 | `uie study seq` |
| SUS | overall perceived usability | after all tasks, before the debrief | 10 items, 1–5 | `uie study sus` |
| UMUX-Lite | short-form usability, including usefulness | end of session or in-product | 2 items, 1–7 | `uie study umux` |
| NASA-TLX | workload in demanding expert tools | after a task segment | 6 subscales, 0–100 | `uie study tlx` |
| Reaction cards | brand reaction | after use or after a five-second exposure | ~25 words, top 5 | `uie study desirability` |
| Five-second test | first impression and recall | after a 5 s exposure | coded open answers | `uie study ci` on the counts |

**Instrument wording.** The items below are reproduced as published, with attribution, because rewording a validated instrument breaks comparison with its norms: one survey platform's paraphrased SUS cannot be compared with the SUS average of 68 [EVAL-095]. Do not reword or "improve" items. If participants need another language, use a published translation where one exists and record which; a home-made translation is a different instrument, and its scores are not compared with the norms.

### 3.2 Sample size

- **Margin of error for a proportion:** n ≈ z²·p(1 − p)/E² (METHODS §9.3). The planning default is **40 per condition** for binary metrics, which gives about ±15% at 95% confidence [HCI-043]. With p = .5 and E = .15 the plain formula gives about 43; NN/g's 39, rounded to 40, follows from subtracting z², because the adjusted-Wald interval used at analysis adds z² to the sample (derived). NN/g advises against margins wider than ±20%.
- Each condition being compared needs its own n. For the power of a difference between two versions, use the formula in `experiments-analytics.md`.
- Time on task varies a lot: in NN/g's data the standard deviation was about 52% of the mean, so 20 users gave about ±19% at 90% confidence (06 §2.C.6).
- Run `uie study samplesize` and record its inputs and output in `analysis-plan.md`.

### 3.3 Task success

1. Score each attempt 1 or 0 against the predefined success criterion. A completion after any hint from the moderator scores 0, as in EMP-04. Note partial progress in the observations, not in the score [HCI-049].
2. Compute the 95% adjusted-Wald interval (METHODS §9.1) with `uie study ci`. With x successes of n and z = 1.96: p̃ = (x + z²/2) / (n + z²); CI = p̃ ± z·√(p̃(1 − p̃)/(n + z²)), clipped to [0, 1].
3. Report it as "77.5% (95% CI 62–88%), 31 of 40" (derived example).
4. Use the benchmark only as context: the median completion rate across about 1,200 tasks was 78%, the top quartile above 92% and the bottom quartile below 49%. Set the target from consequences instead: close to 100% where failure is costly, lower for walk-up consumer flows (06 §2.C.7).

### 3.4 Time on task

1. Take times only from sessions where timing is valid: a silent or retrospective protocol, and no intervention in the segment. Concurrent think-aloud changes how fast people work [HCI-047].
2. Task times are skewed by a few slow attempts. Report the **geometric mean** exp(mean(ln tᵢ)), and compute the interval on ln t with the t-interval, then exponentiate (METHODS §9.1) [HCI-050]. In simulations over small samples, the geometric mean had 13% less error and 23% less bias than the median.
3. Report success-only times and all-attempt times separately [HCI-050]. Failed attempts end when the participant gives up or the stop rule applies, so their times describe the stop rule as much as the task.
4. Derived example: eight successful times of 42, 48, 55, 61, 66, 75, 90 and 130 s give a geometric mean of 66.7 s (95% CI 49.3–90.3 s). The arithmetic mean, 70.9 s, is pulled up by the single slow attempt.
5. Compute with `uie study time`.

### 3.5 SEQ (Single Ease Question)

- **Item (Sauro):** "Overall, how difficult or easy was the task to complete?" on a 7-point scale with only the endpoints labelled, 1 = very difficult and 7 = very easy. Ask it immediately after each task [HCI-051].
- **Score:** the mean with the t-interval x̄ ± t(0.975, n − 1)·s/√n (METHODS §9.1), via `uie study seq`. Derived example: 12 responses with mean 5.5 give a 95% CI of 4.8–6.2.
- **Benchmark:** about 5.5 (5.3–5.6 across more than 400 tasks). Context only.
- **Ask why** whenever the rating is below 5; the answer is the diagnostic part [HCI-051].
- **Never the sole outcome.** About 14% of failed tasks are still rated very easy, and SEQ correlates only about .5 with time and completion. Report it beside task success.

### 3.6 SUS (System Usability Scale)

**Attribution.** The SUS was created by John Brooke at Digital Equipment Corporation in 1986 and published in Brooke (1996). It is free to use, provided the source is acknowledged (Brooke 2013). Reproduce the items exactly, in this order, each on a 5-point scale from 1 = strongly disagree to 5 = strongly agree:

1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

**Administration.** After all tasks and before the debrief [EVAL-096]. The alternating positive and negative items are part of the instrument; keep their order. Replacing the word "system" with the product's name is common practice [unverified that norms are unaffected]; change nothing else. The score needs all ten answers; Brooke's original instructions ask respondents to mark the centre point when they cannot answer an item [unverified].

**Scoring (METHODS §9.2):** Score = 2.5 × Σ[(odd item − 1) + (5 − even item)], range 0–100. Derived example: answers 4, 2, 4, 1, 4, 2, 5, 2, 4, 2 score 80.0.

**Interpretation:**

- It is **not a percentage**: 80 does not mean "80% usable".
- The mean across studies is **68**, about the 50th percentile.
- Sauro–Lewis curved grades (METHODS §9.2): A+ ≥ 84.1; A 80.8–84.0; A− 78.9–80.7; B+ 77.2–78.8; B 74.1–77.1; B− 72.6–74.0; C+ 71.1–72.5; C 65.0–71.0; C− 62.7–64.9; D 51.7–62.6; F ≤ 51.6 [HCI-052].
- Report the mean with its t-interval and the grades the interval spans. Derived example: 40 participants, mean 73.5, SD 10.2, give a 95% CI of 70.3–76.7, which spans grades C to B; the point estimate alone (B−) overstates the precision.
- It is **not diagnostic**: it says how good, not what to fix. Pair it with observed problems.
- It correlates only about .24 with completion and time in the same test, so a high score can coexist with severe observed problems [HCI-052].
- Never report it as a benchmark from a five-person formative round (EMP-06).
- **Variants.** METHODS §7.4 allows a published validated variant, but the §9.2 formula fits only the original alternating items. If the owner chooses a variant, record which one and score it the way its authors specify.

### 3.7 UMUX-Lite

- **Items** (Lewis, Utesch & Maher 2013), each on a 7-point agreement scale from 1 = strongly disagree to 7 = strongly agree, with the product's name in brackets:
  1. "[Product]'s capabilities meet my requirements."
  2. "[Product] is easy to use."
- **Score:** SUS-equivalent = 0.65 × ((i1 + i2 − 2) × 100/12) + 22.9 (METHODS §7.4), via `uie study umux`. Its range is 22.9–87.9 (derived). Label it "SUS-equivalent", because it is a regression estimate, not a SUS score, and report it with its interval [HCI-053].
- **Use** when a survey has to stay short, such as an in-product prompt in a language-learning flashcard app. Item 1 checks usefulness, which Nielsen's heuristics do not cover. Its reliability is about α = .86, and it correlates about .83 with SUS (06 §2.C.7).

### 3.8 NASA-TLX

- **Use** for cognitively demanding expert tools, such as the dispatch screen of a logistics dashboard. It is excessive for consumer flows [HCI-054].
- **Six subscales:** mental demand, physical demand, temporal demand, performance, effort and frustration. Each is a line of 20 intervals, scored 0–100 in steps of 5; marks between ticks round up. A higher number always means more workload; on the performance scale that means worse self-rated performance.
- **Weighted score:** 15 pairwise comparisons between the subscales; each subscale's weight is the number of times it was chosen (0–5, summing to 15); weighted = Σ(rating × weight) / 15. **Raw TLX** is the mean of the 6 ratings. Declare which one you report (METHODS §7.4).
- Derived example: ratings 70, 10, 55, 40, 60 and 35 with weights 5, 0, 3, 2, 4 and 1 give a weighted score of 58.0 and a raw score of 45.0. The two are not interchangeable.
- Collect ratings after each task segment, or afterwards while replaying a recording. Compute with `uie study tlx`.

### 3.9 NPS

NPS is the share of promoters (9–10) minus the share of detractors (0–6) on a 0–10 likelihood-to-recommend question, from −100 to +100. It is not a UI measure [HCI-055]:

- it says nothing about why;
- it is meaningless at small n;
- binning discards information: a move from 2 to 5 is still a detractor;
- loyalty depends on price and on whether use is mandatory, not only on usability;
- it cannot be attributed to a local UI change, and it is easy to game;
- norms differ by country.

Never use it as an acceptance criterion for a fix, and never report it from a formative round (EMP-06). If the owner tracks it, it stays a relationship metric in their own dashboards; `uie study` does not compute it.

### 3.10 Desirability: reaction cards (EMP-07)

Reaction cards test whether the product feels the way `DESIGN.md` says it should, which is the strongest evidence about "on brand" that the framework can give (QUALITY-BAR §8) [CRAFT-063].

1. **Build the list:** about 25 words, about 40% negative. Start from the starter list below, then add the brand's own words: each X attribute becomes an on-brand candidate and each Y an off-brand word. Swap out starter words so the total stays near 25 and the negative share near 40%.
2. **Pre-register** in `analysis-plan.md`, before any session, which words count as on-brand (from X) and which as off-brand (from Y). Choosing them after seeing the answers invalidates the result.
3. **Randomise** the word order for each participant and record the seed, so that position does not favour any word.
4. **Administer** after the participant has used the product, or after a five-second exposure (§3.11). Ask them to mark every word that describes it, then to choose the five that fit best, then to say why for each of the five. The reasons are the diagnostic part.
5. **Analyse** with `uie study desirability`: give it k, the number of participants with at least one on-brand word in their top five, and n; it returns the share with its adjusted-Wald interval. Run it again with the off-brand count for the off-brand share, and list the most-chosen words. Quote reasons with participant codes only.
6. **Report** it as, for example, "11 of 15 participants put at least one on-brand word in their top five (95% CI 48–90%)" (derived).

**Starter list.** It was assembled for UI-Evaluator from generic usability qualities, written as opposite pairs, plus one word for each of Aaker's five brand-personality dimensions. It is not taken from any published card set, and it is a starting point, not a validated instrument.

| Positive or neutral (15) | Negative (10) |
|---|---|
| clear, effortless, quick, trustworthy, friendly, organised, fresh, flexible, calm, polished, honest, lively, capable, refined, sturdy | confusing, tiring, slow, unreliable, cold, cluttered, dated, rigid, stressful, unfinished |

Example of adapting it: a poetry archive whose `DESIGN.md` says "quiet, not dull" adds "quiet" and "dull", drops one positive and one negative starter word, and pre-registers "quiet" and "calm" as on-brand and "dull" as off-brand. A logistics dashboard declaring "precise, not cold" adds "precise", keeps "cold" as its off-brand word, and drops one positive starter word.

**Limits.** The share is judged evidence about a reaction, not proof of beauty. Aesthetic response varies between people and cultures (QUALITY-BAR §8). With small groups, report counts.

### 3.11 Five-second test

1. Show one screen, a static capture at the intended viewport, for 5 seconds, then hide it.
2. Ask recall and impression questions: what is this page for, who is it for, what do you remember, what would you do first. Optionally follow with the reaction cards.
3. Code the open answers against answers pre-registered in `analysis-plan.md` (for example "purpose correctly identified") and report counts, or adjusted-Wald intervals when n allows.
4. Show each participant only one version of a screen, because a second version is seen through the expectations the first one set.

First impressions form within 50 ms and persist (Lindgaard 2006), and low complexity with high prototypicality raises them (Tuch 2012). A five-second test therefore rewards conventional structure. Read its result as a first impression, not as usability and not as distinctiveness (07 §4.1).

### 3.12 Self-report against behaviour

- **Behaviour beats self-report** [HCI-056]. A failed task rated "easy" is still a failure. SUS correlates about .24 with performance, and about 14% of failed tasks are rated very easy on SEQ.
- **Aesthetic-usability guard** [HCI-078]. Attractive designs are perceived as more usable, and minor problems are forgiven. Praise for the visuals and a high on-brand share never offset observed task failures, and visual redesigns are re-tested against the previous version.
- Report both kinds of measure, decide with behaviour, and explain the gap with qualitative data: the "why" answers, observations and quotes.

### 3.13 Commands

Run `uie study <subcommand> --help` for the exact input format. Add `--json` and store the output in the study's `results.json`.

| Subcommand | Computes | Typical input |
|---|---|---|
| `uie study ci` | adjusted-Wald interval for a proportion; t-interval for a mean | successes and n (`--successes x --n n`), or a column of values |
| `uie study time` | geometric mean with a log-scale t-interval | one time per attempt; run it once for success-only times and once for all attempts |
| `uie study seq` | mean SEQ with a t-interval | one rating per participant per task |
| `uie study sus` | per-participant SUS, mean, t-interval, grade | ten answers per participant, in questionnaire order |
| `uie study umux` | SUS-equivalent per participant, mean, t-interval | two answers per participant |
| `uie study tlx` | raw TLX, and weighted TLX when weights are given | six ratings; for weighted, six weights summing to 15 (the tallies of the 15 pairwise choices) |
| `uie study desirability` | share of participants choosing ≥ 1 pre-registered word, with its adjusted-Wald interval | k and n (once for on-brand words, once for off-brand words) |
| `uie study samplesize` | n for a target margin of error | p, E, confidence |

## 4. Output format

Store results in `studies/<id>/results.json`, one entry per metric, with: the measure and its exact wording or scoring variant, n (and how many were excluded and why), the point estimate, the interval and its method, the build version, and the `uie study` command that produced it. In reports, write every metric as value, interval and n, for example "SEQ for the booking task: 5.5 (95% CI 4.8–6.2), n = 12". Metrics from summative studies are E4; counts from formative rounds are E3.

## 5. Quality checks

An output is invalid when:

- a metric lacks n, an interval or its method, or a percentage lacks its denominator;
- SUS is called a percentage, or any SUS or NPS figure from a five-person formative round is presented as a benchmark;
- time on task is an arithmetic mean, or includes think-aloud sessions or segments with interventions;
- an assisted completion counts as success;
- a reworded or home-translated instrument is compared with published norms;
- on-brand words were chosen after the data, the word list was not randomised, or the list is far from ~25 words and ~40% negative;
- TLX is reported without saying whether it is weighted or raw;
- answers from simulated personas appear anywhere as data;
- a desirability result is presented as proof that the UI is beautiful or not AI-made;
- self-report is used to overrule observed failures.

## 6. Pitfalls

| Pitfall | Evidence |
|---|---|
| Paraphrasing SUS items | one platform's reworded SUS had no scoring and could not be compared with the norm of 68 [EVAL-095] |
| Reporting the median or arithmetic mean time | for small samples the geometric mean had 13% less error and 23% less bias than the median [HCI-050] |
| Trusting SEQ alone | about 14% of failed tasks are rated very easy [HCI-051] |
| Treating a high SUS as "no problems" | SUS correlates only about .24 with performance in the same test [HCI-052] |
| NPS as a UI metric | binning, small-n noise, confounding by price and country norms [HCI-055] |
| Holistic quality scores | holistic 1–10 ratings showed near-zero agreement between annotators (ICC about .03–.05 in UICrit) (04 §3.2 C4) |
| Picking on-brand words after the fact | it turns the test into a search for agreeable words [CRAFT-063] |
| Five-second tests as a distinctiveness check | prototypical, low-complexity designs win first impressions (Tuch 2012) |
| Rates from five people | 4 of 5 has a 95% interval of 36–98% (derived) [HCI-043] |

## Sources

- Research adopt items: HCI-036, HCI-043, HCI-047, HCI-049 to HCI-056, HCI-078 (06); EVAL-095, EVAL-096 (04); CRAFT-063 (07).
- Brooke, J., *SUS: a "quick and dirty" usability scale*, in Jordan et al. (eds.), *Usability Evaluation in Industry*, Taylor & Francis, 1996 (scale © Digital Equipment Corporation, 1986). Item wording checked against the AHRQ copy: https://digital.ahrq.gov/sites/default/files/docs/survey/systemusabilityscale%2528sus%2529_comp%255B1%255D.pdf
- Brooke, J., *SUS: A Retrospective*, Journal of Usability Studies 8(2), 2013 (free use with acknowledgement).
- Sauro & Lewis, SUS interpretation and curved grading. https://measuringu.com/sus/ and https://measuringu.com/interpret-sus-score/
- MeasuringU, *10 Things to Know About the SEQ*. https://measuringu.com/seq10/
- MeasuringU, *What Is a Good Task-Completion Rate?* https://measuringu.com/task-completion/
- Sauro & Lewis, *Average Task Times in Usability Tests: What to Report?*, CHI 2010. https://measuringu.com/average-times/
- Lewis, Utesch & Maher, UMUX-Lite, CHI 2013; MeasuringU summary. https://measuringu.com/umux-lite/
- Hart & Staveland; NASA Ames TLX paper-and-pencil package. https://ntrs.nasa.gov/api/citations/20000021488/downloads/20000021488.pdf
- NN/g, *Net Promoter Score and UX*, 2024. https://www.nngroup.com/articles/nps-ux/
- NN/g, *How Many Participants for Quantitative Usability Studies*, 2021. https://www.nngroup.com/articles/summary-quant-sample-sizes/
- Benedek & Miner, *Measuring Desirability*, Microsoft, 2002; NN/g summary. https://www.nngroup.com/articles/microsoft-desirability-toolkit/
- Aaker, *Dimensions of Brand Personality*, Journal of Marketing Research 34, 1997.
- Lindgaard et al., Behaviour & IT 25(2), 2006, DOI 10.1080/01449290500330448; Tuch et al., IJHCS 70(11), 2012.
- NN/g, *The Aesthetic-Usability Effect*. https://www.nngroup.com/articles/aesthetic-usability-effect/
