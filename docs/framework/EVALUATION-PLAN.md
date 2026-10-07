# Evaluation plan — testing the skill itself

| | |
|---|---|
| Version | 2.0.0 (2026-10-04) |
| Status | Normative for releases. A release that does not meet §6 is not tagged. |
| Parent | [FRAMEWORK](FRAMEWORK.md) |

## Contents

1. [What must be shown](#1-what-must-be-shown)
2. [Test layers](#2-test-layers)
3. [Fixtures and ground truth](#3-fixtures-and-ground-truth)
4. [Metrics](#4-metrics)
5. [Protocols](#5-protocols)
6. [Release thresholds](#6-release-thresholds)
7. [Calibration programme](#7-calibration-programme)
8. [Threats to validity](#8-threats-to-validity)

---

## 1. What must be shown

The framework makes claims about itself. Each claim needs evidence before release, just as the skill demands evidence for every finding.

| Claim | Evidence required |
|---|---|
| C1 Detectors are trustworthy | per-rule precision and recall on labelled fixtures; no silent false-clean results |
| C2 Audits find real problems | recall of seeded usability, accessibility and craft defects by depth; precision after verification |
| C3 Severity ratings are sensible | agreement with ground-truth severity; spread behaves as expected |
| C4 Builds with the skill are better | with-skill vs without-skill comparison on deterministic metrics and blind human preference |
| C5 Builds with the skill are less generic | lower tell density; human swap-test verdicts; lower cross-brief convergence |
| C6 Fixes resolve problems without regressions | resolution, regression and re-fix rates on seeded defects |
| C7 Feedback ingestion is correct | theme and link accuracy against a labelled feedback set; scrubbing recall |
| C8 The skill behaves as specified | trace assertions: doctor ran, packets built, isolated roles spawned, gates computed before "done", targeted questions only |
| C9 Reports are honest | zero language-lint violations; no level claimed above what the gates support |

## 2. Test layers

| Layer | Runs | Tooling |
|---|---|---|
| Unit | every commit | `npm test` (`tests/core/`) |
| Detector calibration | every change to a rule; every release | `tests/lint/`, `tests/browser/` (expected hits and non-hits); `tools/score-fixtures.mjs` on `evals/fixtures/` + `evals/labels/` |
| Integration | every commit (headless Chromium) | `tests/browser/commands.test.mjs` serves fixtures locally and runs capture → audit → journey → diff → gates through the CLI; `uie doctor` runs the smoke test |
| Skill behaviour | every release and every major model release | `evals/evals.json` through the skill-creator loop (with-skill vs without-skill subagents, graders, benchmark aggregation, review viewer). `claude plugin eval` is used where available |
| Human evaluation | every minor release | blind pairwise preference, swap test, desirability mini-panel (§5.3) |
| Packaging | every commit | `skills-ref validate`, `claude plugin validate`, `npm run validate` (`tools/validate-skill.mjs`, `tools/check-traceability.mjs`, rules and agents in sync) |

## 3. Fixtures and ground truth

Each fixture lives in `evals/fixtures/<name>/` with `ground-truth.json`. Each seeded defect has an ID, its criterion (rule, heuristic, WCAG SC, CW step), its location and its expected severity band. Fixtures are small, self-contained web apps or pages served locally. Their example products follow the neutral-product rotation of [AUTHORING §6](AUTHORING.md#6-examples-policy).

| Fixture | Mode | Seeded defects (examples) | Tests |
|---|---|---|---|
| `slop-landing` | Persuade | gradient headline text; indigo-violet gradient CTA outside the brand; emoji feature icons; tracked-caps eyebrow above every section; three equal icon-tile cards; traffic-light window chrome around a div "screenshot"; invented "10,000+ teams" and logo row; em-dash flood and buzzwords; identical fade-up on every section; generic "Get started" / "Learn more" only | C1, C2, C4, C5 |
| `broken-form` | Operate | placeholder-only labels; disabled submit at rest; "Invalid" errors without a fix; focus outline removed; 20 px icon buttons; no error summary or focus move; missing `autocomplete`; paste blocked on password; layout shift from a late banner; async save with no status message | C1, C2, C6 |
| `dashboard` | Operate | flat type hierarchy; off-scale spacing; nested cards; one 20 px radius everywhere; numbers without tabular figures; status by colour only; no empty, loading or error state; `transition: all`; bounce easing on a toggle; 600 ms state transitions | C1, C2, C6 |
| `zh-reader` | Read | `system-ui` as the CJK face; negative letter-spacing on Chinese; line-height 1.2; `lang="en"` on Chinese text; 70-glyph measure; mixed 你/您; half-width punctuation in Chinese sentences; Enter handler without IME guard | C1, C2 |
| `journey-app` | Operate | a multi-step booking flow with seeded learnability problems (an action hidden in an overflow menu; no progress indicator; ambiguous label; a dead-end error state) and an analytical ground truth for CW | C2, C3 |
| `clean-control` | Read + Operate | none (built to the floor by hand) | false-positive rates for C1, C2 |
| `feedback-set` | — | about 120 synthetic but realistic feedback items (session notes, tickets, survey text) linked to known problems in `journey-app`, with planted personal data (emails, phone numbers, names) | C7 |

Ground truth for analytical defects is set by two people independently, with disagreements resolved and recorded. Seeded defects are kept out of the skill's own prompts and examples, so the skill cannot overfit to them.

## 4. Metrics

### 4.1 Detection
- Per rule: precision, recall and F1 on fixtures and labelled real pages, with counts.
- Per depth (quick, standard, rigorous): recall of seeded analytical defects; precision after the verifier; number of verifier rejections; any-two agreement; discovery-estimate error (estimated total vs ground-truth total).
- Severity: Spearman correlation of the mean rated severity with ground-truth severity bands; the share of findings that are divergent.

### 4.2 Build outcomes (with vs without the skill)
- Deterministic: hard-tell count, soft-tell density tier, G3 criteria failed, axe violations, gate pass rates, achieved level.
- Human: blind pairwise preference aggregated with Bradley–Terry, with a CI; swap-test verdicts ("could another product use this unchanged?"); share choosing ≥ 1 on-brand reaction word (small panel).
- Variety: across ≥ 10 different briefs, the mean pairwise structural similarity (section and component-sequence Jaccard) and image-embedding similarity. Lower is better. Report the difference between conditions with a CI [CRAFT-029].

### 4.3 Fix loop
Resolution rate of P0/P1 seeded defects; regression rate (introduced findings per fix); re-fix ratio; attempts per finding; risk-score stops; the share of fixes the fresh reviewer scores `confirmed_fixed`.

### 4.4 Behaviour and honesty
Trace assertions per eval run, for example: `uie doctor` ran before the first audit; packets were built for every role; black-box roles did not read source paths; `uie gates` ran before any completion claim; setup asked at most one compact question round; language lint is clean; the achieved level matches the gates.

### 4.5 Cost
Tokens and wall-clock time per workflow and depth, reported with each benchmark so that owners can choose depth knowingly.

## 5. Protocols

### 5.1 Skill-behaviour evals
- Prompts in `evals/evals.json` cover build, audit (each depth), ingest, study, fix and verify, in English and Chinese, across the fixtures.
- Each prompt runs with the skill and without it (a clean baseline), ≥ 3 runs per condition, on ≥ 2 model families where available [IMP-058].
- Graders check assertions with scripts wherever possible: gate files, finding schemas, detector counts. Graders are separate agents from the runs. Their outputs use `text`, `passed` and `evidence` fields.
- Results are aggregated into benchmark files and reviewed in the eval viewer together with the qualitative outputs.

### 5.2 Detector calibration
Labels come from at least two labellers per item, with agreement reported. A rule is promoted from soft to hard only at precision ≥ 0.9 and with recall reported [CRAFT-061]. Rules below agreed precision report as "possible".

### 5.3 Human evaluation
- Raters are designers or experienced front-end developers, blind to condition. Pairs are shown in both orders, randomised. Only order-consistent judgements count [HCI-034].
- The desirability mini-panel uses ≥ 10 participants per condition, with pre-registered on-brand words from each brief's attributes. Results are reported as shares with CIs and labelled exploratory.
- Ethics: consent, flat incentives, no personal data retained beyond codes.

## 6. Release thresholds

These are the initial bars for v1.0. They are revised by ADR as calibration data accumulates. The measured status of each bar is kept in [evals/README.md](../../evals/README.md#status-against-the-release-thresholds): version 2.0.0 shipped with the build-outcome bar unmet and four bars not yet measured, and its README says so. The agent-level round of 2026-10-06 measured four of them for 2.1.0; the fix-loop bar is not met.

| Area | Threshold |
|---|---|
| Unit, integration, packaging | 100% passing |
| Hard-tell detectors | each rule precision ≥ 0.9 and recall ≥ 0.8 on fixtures **[calibrating]** |
| Scripted accessibility checks | recall ≥ 0.9 of seeded WCAG defects; 0 false positives on `clean-control` |
| Standard audit | recall ≥ 0.6 of seeded analytical defects with precision ≥ 0.8 after verification **[calibrating; literature baseline for one LLM pass is 0.35–0.45]** |
| Build outcomes | with-skill builds: 0 hard tells and no G3 failures in ≥ 80% of runs; blind pairwise preference for with-skill ≥ 70% with the 95% CI excluding 50% |
| Variety | mean cross-brief structural similarity lower with the skill than without, with the CI of the difference excluding 0 |
| Fix loop | ≥ 90% of seeded P0/P1 defects verified fixed; 0 regressions left unflagged |
| Feedback ingestion | theme-to-problem link accuracy ≥ 0.8; personal-data scrubbing recall ≥ 0.95 on planted items |
| Honesty and behaviour | 0 language-lint violations in final reports; 0 runs claiming a level above the computed one; all trace assertions pass in ≥ 90% of runs |

## 7. Calibration programme

1. **Detectors:** grow `evals/labels/` with real-world pages, both generated and hand-built, labelled per tell. Publish per-rule precision and recall in `assets/data/tells.json` (`precision` field) [CRAFT-061].
2. **Thresholds marked [calibrating]** in QUALITY-BAR (COL-01, COL-02, COL-03, LAY-01, USE-09, CMP-02; MOT-04, CMP-03 and CMP-06 from ADR-032): estimate their effect on false positives and false negatives on fixtures and labelled pages, then propose final values by ADR.
3. **Evaluator discovery curve:** estimate λ for LLM passes and the marginal value of extra evaluators and model families. Use it to tune the evaluator counts per depth [HCI §3.3 gap 1].
4. **Severity calibration:** compare LLM rater means with human expert consensus on a shared set, and report bias and spread.
5. **Taste rules vs humans:** check that tell density predicts human "generic" judgements. Rules that do not predict are demoted [03 §3.4 gap 6].

## 8. Threats to validity

- Seeded defects are cleaner than real ones, which inflates recall. Mitigation: labelled real pages and a held-out fixture set.
- LLM graders can share biases with LLM evaluators. Mitigation: scripted assertions first, human review of samples, different model families for graders.
- Human panels are small, so preference results are exploratory and are reported with CIs.
- Model drift changes both slop priors and evaluator behaviour. Mitigation: re-run on each major model release and review tell statuses.
- Fixture products could leak into the skill's examples and teach to the test. Mitigation: the examples policy and a lint that flags fixture names in skill files.
