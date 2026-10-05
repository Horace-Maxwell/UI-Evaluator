# UI-Evaluator Framework — Specification

| | |
|---|---|
| Version | 2.0.0 (2026-10-04) |
| Status | Normative. The skill, its scripts and its agent prompts implement this document. Where they disagree, this document wins and the disagreement is a bug. |
| Companion documents | [QUALITY-BAR](QUALITY-BAR.md) (gates and thresholds) · [METHODS](METHODS.md) (evaluation and research methods) · [ARCHITECTURE](ARCHITECTURE.md) (packaging, data model, CLI) · [DECISIONS](DECISIONS.md) (decision records and conflict rulings) · [AUTHORING](AUTHORING.md) (how guidance is written) · [EVALUATION-PLAN](EVALUATION-PLAN.md) (how the skill itself is tested) · [TRACEABILITY](TRACEABILITY.md) · [GLOSSARY](GLOSSARY.md) |
| Evidence base | Eleven research notes in [`docs/research/`](../research/README.md) with about 600 numbered adopt items (IMP, DSL, LOOP, EVAL, PLAT, HCI, CRAFT, TOOL, PROC, PKG) |

## Contents

1. [Conventions](#1-conventions)
2. [Purpose and promise](#2-purpose-and-promise)
3. [Principles](#3-principles)
4. [Core concepts](#4-core-concepts)
5. [The lifecycle](#5-the-lifecycle)
6. [Roles and independence](#6-roles-and-independence)
7. [Evaluation depth](#7-evaluation-depth)
8. [Findings: record, severity, lifecycle](#8-findings-record-severity-lifecycle)
9. [Closing the loop with real users](#9-closing-the-loop-with-real-users)
10. [Fix discipline](#10-fix-discipline)
11. [The anti-slop system](#11-the-anti-slop-system)
12. [Accessibility, localisation and platforms](#12-accessibility-localisation-and-platforms)
13. [Honesty rules for every output](#13-honesty-rules-for-every-output)
14. [Input situations and degraded operation](#14-input-situations-and-degraded-operation)
15. [Ethics, privacy and licences](#15-ethics-privacy-and-licences)
16. [Non-goals and known limits](#16-non-goals-and-known-limits)
17. [Change control](#17-change-control)
- [Appendix A — The CMU lecture, element by element](#appendix-a--the-cmu-lecture-element-by-element)

---

## 1. Conventions

- **MUST / MUST NOT / SHOULD / MAY** are used as in RFC 2119. A MUST is enforced by a script, a schema or a gate wherever that is technically possible. Prose-only MUSTs are listed in [AUTHORING §Enforcement](AUTHORING.md#enforcement) so that they can be moved into mechanisms over time.
- Bracketed IDs such as `[HCI-009]` point to adopt items in the research notes. `[ADR-007]` points to a decision record. Gate criteria such as `TYP-03` or `USE-05` are defined in [QUALITY-BAR](QUALITY-BAR.md).
- "The skill" is the packaged Agent Skill `ui-evaluator`. "The agent" is whichever model runs it. "The lead" is the agent instance that talks to the user and orchestrates. "The owner" is the human who owns the product decision (usually the user).
- "UI" means a web front end unless stated otherwise. Native platforms are covered only through profiles (§12.3).

---

## 2. Purpose and promise

### 2.1 The problem

Four failures recur when AI agents build or review interfaces. Each one was documented independently in the research:

1. **Convergence on unchosen defaults.** Generated UIs reproduce the most frequent choices in training data: indigo-violet accents, the same handful of "tasteful" typefaces, three identical icon cards, tracked-caps eyebrows, a fade-up on every section, invented metrics. People recognise this as "AI-made" because nothing in it was decided for this product (07 §2.1, 01 §3.2, 02 §3.1). Prose instructions alone do not fix it. In one controlled run, ten builds under prose rules produced ten identical page folds; a mechanical draw plus a ledger produced zero repeats in four (02 §2.6).
2. **Unreliable single-pass evaluation.** One human heuristic evaluator finds about a third of the problems. Any two evaluators agree on 5–65% of what they find. Single-rater severities correlate at only about .23–.31. A single LLM pass recovers roughly 35–45% of an expert problem set at 60–83% precision, and LLM feedback gets *less* accurate over repeated rounds (06 §3.1, §3.2 X3; 03 §2.9).
3. **Audits and user feedback never meet.** Audit tools do not ingest what real users say or do. Feedback tools do not code feedback against heuristics, journeys or existing findings (04 §3.5).
4. **Unverified fixes.** Fixes are declared done by the agent that made them. Count-based "resolved" metrics hide regressions, and loops without bounds thrash (03 §3.3).

### 2.2 What the framework does

Given a product, either a running web front end, a URL, screenshots or only a brief, the framework makes an agent:

1. **establish context** before pixels: users, top tasks, context of use, brand truth and constraints;
2. **decide a direction deliberately** when building or redesigning: several genuinely different directions, a seeded draw that keeps the model away from its own first choices, an explicit rationale, locked tokens;
3. **build to a measurable craft and accessibility floor**, with mechanical checks running during the build;
4. **evaluate with HCI rigour**: deterministic checks, several independent evaluators applying heuristic evaluation and cognitive walkthrough, a skeptical verifier, and blind severity ratings from several raters;
5. **bring in real users**: plan studies, ingest feedback and test results, map them onto findings, and re-rate severity with observed frequency;
6. **fix one problem at a time**, verifying each fix against the criterion that raised it and checking for regressions, inside a bounded loop;
7. **report honestly**, stating the assurance level reached, the evidence level of every claim and what was not checked.

### 2.3 The promise, stated so it can be checked

The user's aim is a UI that is "100% beautiful and not AI-looking". No process can prove beauty. The framework therefore turns that aim into the strongest claim that *can* be verified, and refuses to say more than that.

The skill MUST NOT call work "done" until the target **assurance level** is reached, and MUST state the level actually reached ([QUALITY-BAR §3](QUALITY-BAR.md#3-assurance-levels)):

| Level | Name | Plain-language meaning |
|---|---|---|
| L1 | Machine-verified | Every deterministic check passes: evidence integrity, functional integrity, automatable WCAG 2.2 AA, the measurable craft floor, and zero unaccepted AI tells. |
| L2 | Panel-reviewed | L1, plus several isolated evaluators and a design panel found no open severe usability problem and judged the design specific to this product, with every finding verified and rated blind. |
| L3 | Human-confirmed | L2, plus a human expert (the owner or a designer) has confirmed or overruled every severe finding and the design verdict, and has checked the WCAG criteria machines cannot. |
| L4 | User-validated | L3, plus real users completed the critical tasks in a formative test, and the observed problems were fixed and re-tested. |

Default targets: L1 for throwaway prototypes, L3 for anything shipped to users, L4 for high-stakes products (health, finance, government, safety). The owner MAY choose a different target. The choice is recorded in `PRODUCT.md`.

**What this promise means:** at L2 or above, no known craft defect, AI tell, automatable accessibility failure or severe usability problem remains without a recorded decision, and independent reviewers judged the design specific to the product. **What it does not mean:** that every person will find the UI beautiful, that no problem remains undiscovered, or that the product will succeed. [QUALITY-BAR §8](QUALITY-BAR.md#8-what-passing-does-not-mean) states these limits so that reports never imply otherwise.

---

## 3. Principles

These fourteen principles are the constitution. Every rule, workflow and prompt traces to at least one of them. Each states why it exists and how it is enforced.

| # | Principle | Why | Enforced by |
|---|---|---|---|
| P1 | **Context before pixels.** No design or evaluation without declared users, top tasks, context of use and product truth. | Usability is only defined for specified users, goals and context (ISO 9241-11). LLM evaluators perform measurably better with task and navigation context. [HCI-001, HCI-031, IMP-002] | `setup` workflow; `PRODUCT.md` schema; evaluators refuse to run without a context packet |
| P2 | **Decide, don't default.** Every visible choice has a recorded reason. A pattern is a problem when it was *not chosen*, not because it is popular. | "Slop is the absence of decisions, not a style" — the consensus of every serious source (07 §5.1). The brief wins over any tell list [CRAFT-005]. | `DESIGN.md` decisions log; `accepted_tells` allowlist; detectors read the allowlist |
| P3 | **Conventional structure, distinctive brand layer.** Keep navigation, controls and page anatomy where users expect them. Spend distinctiveness on type, colour, imagery, voice, real content and one signature moment. | Prototypicality and low complexity raise first impressions within 50 ms (Tuch 2012). People prefer "most advanced yet acceptable" (Hekkert 2003). Anti-slop must not become anti-convention (07 §4.1, C18). | Surface modes (§4.1); critic rubric; structure rules in heuristics H4 |
| P4 | **Restraint with one signature.** One boldness per screen, one authored motion moment, at most two hero moments per product. Decoration needs a job. | Restraint is the one ethic every mature design system shares: Apple, Ant 克制, Carbon, Atlassian, GOV.UK, M3 (05 §3.2). | Motion and decoration budgets (G3, G4); critic rubric "Restraint" |
| P5 | **The doer is not the grader.** No agent certifies its own work. Quality verdicts come from isolated evaluators with no build transcript. | Self-grading skews positive (Anthropic harness study). A reviewer who cannot check reality rated a plan 9/10 when 3 of 7 premises were false (03 §3.3). [IMP-032, LOOP consensus] | Subagent isolation; DEGRADED banner when isolation is impossible; fix-reviewer role |
| P6 | **Evidence before claims.** Every finding carries a resolvable anchor. A check that did not run is not a pass. The language of a claim matches its evidence level. | Evidence discipline is the main quality lever (04 §3.1). One production fork cut 98 raw agent findings to 28 real ones by gating on evidence (04 §2.13). [HCI-006, HCI-035, TOOL-37] | Finding schema; verifier verification chain; gate states; report language lint |
| P7 | **Measure what can be measured; judge only what must be judged; never gate on an unanchored score.** | Holistic quality ratings have near-zero inter-rater reliability (UICrit ICC ≈ .03–.05). Judged scores drift across rounds. [EVAL C4, DSL X20, LOOP #7] | Gates are defined on measurements and on verified, agreed findings, never on scores |
| P8 | **Many independent eyes, then consolidation.** Several isolated evaluators, a deterministic merge, then blind severity ratings from at least three raters. | Nielsen's 3–5 evaluators; the evaluator effect; severity reliability needs averaging. This is the CMU lecture's protocol. [HCI-002, HCI-009, HCI-014] | `audit` workflow; merge and rating scripts; agreement statistics |
| P9 | **Inspection complements users; it never replaces them.** Alternate analytical and empirical evaluation. Disagreement between evaluators is a question for users, not a vote. When behaviour and opinion conflict, behaviour wins. | HE and user testing find substantially different problems. All nine LLM-evaluator papers conclude "complement, not replace". SUS correlates only about .24 with performance. [HCI-056, EVAL arely protocol] | `study` and `ingest` workflows; disputed findings route to studies; L4 |
| P10 | **One problem, one fix, one verification.** Fix in priority order, at the narrowest correct layer. Verify against the criterion that raised the problem. Revert on regression. Keep loops bounded. | Attribution, revertability and regression control. Unbounded loops degrade (Duan et al. CHI'24). [LOOP consensus, HCI-038] | `fix` workflow; per-fix commits or patches; attempt caps; risk score |
| P11 | **Accessibility is a floor, not a feature.** WCAG 2.2 AA is the minimum and overrides taste. | Legal and ethical baseline. Every design system reviewed sets AA as its floor (05 §3.2). [TOOL-01] | G2 cannot be waived; only deferred, and then the level is not reached |
| P12 | **Honest content.** No invented metrics, testimonials, people, logos, ratings or badges. Use real content or visibly labelled placeholders. | Fabricated proof is both an AI tell and a deception. [CRAFT-007, IMP-028] | Honesty checks in G4; facts section in `PRODUCT.md` |
| P13 | **Mechanisms over admonitions.** Anything that must always happen is a script, a schema, a hook or a gate. Prose explains *why*. | Reference files were opened before UI edits in only 21–53% of measured runs (impeccable #744). Mechanical variety beat prose rules 0/4 vs 10/10 repeats (ui-craft). [IMP-057] | CLI, schemas, hooks, gates; [AUTHORING §Enforcement](AUTHORING.md#enforcement) |
| P14 | **Provenance and licences respected.** Ideas are adopted with attribution. Restricted text, code, fonts and assets are not redistributed. | Several popular sources are licence-restricted or unlicensed (02 §3.3 gap 9; 05 licence notes). | `NOTICE.md`; [AUTHORING §Licences](AUTHORING.md#licences-and-quotation) |

When principles conflict, the order of precedence is **P11 accessibility > P12 honesty > P1 context/brief > P9 user evidence > P3 convention > P2/P4 taste**. This follows the reconciliation order used by designpowers (accessibility > usability > brief > personas > preference) [LOOP], adjusted so that an explicit brief overrides taste rules but never accessibility or honesty.

---

## 4. Core concepts

### 4.1 Surfaces and modes

A **surface** is a screen or page type (landing page, settings, dashboard, article, onboarding step). Every surface declares exactly one **mode**, chosen per surface and not per product [IMP-001]:

| Mode | The visitor is… | Expression allowed | Default colour strategy | Motion budget |
|---|---|---|---|---|
| **Persuade** | deciding whether to care (marketing, landing, pricing) | High in the brand layer; one signature moment | Any declared strategy | ≤ 1 orchestrated sequence plus feedback |
| **Operate** | doing work, often repeatedly (apps, dashboards, forms, settings) | Low; brand through type, colour roles and polish | Restrained | Feedback and state motion only; frequent actions ≤ 150 ms |
| **Read** | reading or learning (docs, articles, help) | Low to medium; typographic voice | Restrained | Feedback and state motion only |
| **Experience** | exploring an immersive or expressive piece (campaigns, portfolios, games) | Highest | Any declared strategy | Declared per piece in `DESIGN.md` (default ≤ 1 orchestrated sequence per screen) |

Operate and Read correspond to Carbon's *productive* style; Persuade and Experience to its *expressive* style [PLAT-004]. Mode changes thresholds, for example body size, type-scale ratio and motion budget ([QUALITY-BAR §5](QUALITY-BAR.md#5-mode-dependent-thresholds)).

### 4.2 Context artifacts

| Artifact | Location | Holds | Never holds |
|---|---|---|---|
| `PRODUCT.md` | project root | Users and groups, top tasks, context of use, positioning, constraints, brand commitments, a **facts section** of claims the UI may make (metrics, customers, prices) with stated absences, principles, accessibility needs, platforms and locales, **surfaces with their single job and mode**, target assurance level | Visual decisions |
| `DESIGN.md` | project root | Google `design.md` format: YAML tokens (colors, typography, rounded, spacing, components) plus the fixed prose sections. UI-Evaluator adds: a reference to the surfaces and modes in `PRODUCT.md`, brand attributes as "X, not Y" pairs, colour strategy, voice and tone positions, motion tokens and budget, the direction contract, a decisions log, accepted tells with reasons | Product facts; findings |
| Journeys | `.ui-evaluator/journeys/*.json` | Critical user journeys: persona, goal, scenario (no UI words), start state, observable success condition, correct action sequence, criticality | — |
| Workspace | `.ui-evaluator/` | Config, runs and evidence, findings register, feedback, studies, ledgers, debt register | — |

`PRODUCT.md` and `DESIGN.md` live at the project root so that other tools reading the same open formats interoperate [IMP-002; 02 §2.11]. Existing files are adopted, never overwritten; changes are proposed as diffs. `DESIGN.md` for an existing product is written *from the shipped build* and MUST NOT canonise a pattern the evaluation rejected [IMP-051].

### 4.3 Findings

A **finding** is one problem, recorded once, with evidence. It is never prose in a chat. The schema is in [ARCHITECTURE §8](ARCHITECTURE.md#8-data-model). Its required parts follow the CMU lecture's heuristic-evaluation report, extended with NN/g, Herr et al., SUTM and PURE [HCI §3.5]:

- **What and where:** title; one-problem description (what happens vs what the user needs); the **problem type** from the lecture (`single_location`, `multiple_locations`, `overall_structure`, `missing_element`); scope (persona, task, viewport, theme, state, UI version).
- **Why:** the violated criterion. This is at least one of a Nielsen heuristic (H1–H10), a cognitive-walkthrough question (CW-Q1…Q4), a WCAG 2.2 success criterion, a framework rule ID, an ISO 9241-110 principle (ISO-1…ISO-7) or a HAX guideline (HAX-G1…G18). It is stated as *why this harms the user*. Preference-only remarks are rejected [HCI-005].
- **Evidence:** a resolvable anchor (route, state, selector or bounding box, screenshot crop, reproduction steps, optionally file:line), the measured value where one exists, and the evidence level (§4.4).
- **Rating:** severity factors (frequency, impact, persistence, optional business impact), each rater's 0–4, the mean and spread, the derived priority, and ease of fix as a separate field.
- **Response:** recommendation (advisory; the fixer may resolve the problem differently), validity, status and verification record.

Finding **identity** depends on where the finding came from (ADR-033). A judged finding's identity is the criterion + location + a normalised snippet hash. A deterministic finding is one rule on one route, and its identity is the rule ID + the normalised route, however many instances it lists. Line numbers are excluded, because they cause phantom regressions [03 §3.3]. Identity allows set-based comparison across runs: cleared, introduced, persisting. A deterministic finding whose rule still fires on its route with fewer instances is persisting and reported as partially fixed (k of n instances cleared); new instances on that route are introduced instances inside it, never a separate finding.

### 4.4 Evidence levels

Every finding and every claim in a report carries an evidence level [HCI-035, extended]. The level governs the wording allowed (§13).

| Level | Meaning | Allowed wording |
|---|---|---|
| **E0 Predicted** | One unverified inspection pass (LLM or human) | "may", "is likely to", "potential" |
| **E1 Reproduced** | Measured deterministically by a tool; or reproduced against the rendered UI by a separate verifier; or found by ≥ 2 independent passes | "measured", "reproduced", "verified in the rendered UI" |
| **E2 Expert-confirmed** | A human expert (owner, designer, accessibility specialist) confirmed it | "confirmed by …" |
| **E3 Observed** | Seen with real users or in real usage data, reported as k of n | "k of n participants …", "users …" |
| **E4 Measured with users** | Quantified with real users, with a confidence interval | "x% (95% CI a–b)" |
| **E5 Causal** | Established by a randomised controlled experiment | "caused", "increased", "reduced" |

Deterministic measurements reach E1 immediately, because the smoke test (§14) guards tool validity. Simulated users and personas never exceed E1, and their outputs are never reported as user metrics [HCI-036].

### 4.5 Severity, priority, ease of fix, criticality

- **Severity (0–4)** follows the Nielsen scale used in the lecture: 0 not a problem, 1 cosmetic, 2 minor, 3 major, 4 catastrophe. It is rated *after* consolidation by at least three raters who are blind to one another and to any suggested severity (the detector's, the rule's or the reporter's). Each rater first decides validity (problem, trade-off or not a problem), then scores frequency, impact and persistence, then the 1–4 label, with a monotone suggested-severity table as a prior [HCI-009/010; EVAL C2/C3]. "Not a problem" is a validity verdict, so it carries no value and is not averaged in (Herr et al. 2016; ADR-029); a trade-off vote keeps its value. The final severity is the mean of the problem and trade-off values; the spread (highest minus lowest of those values) is kept. A spread of 2 or more, or a "not a problem" vote against a mean of 2.5 or more, marks the finding **divergent**, which routes it to user research rather than to a vote [EVAL arely]. When more than half of the raters vote "not a problem", or more than half vote "trade-off", the finding takes that validity and moves to `disputed` for the owner.
- **Priority** derives from the mean: ≥ 3.5 → **P0**, ≥ 2.5 → **P1**, ≥ 1.5 → **P2**, ≥ 0.5 → **P3**, otherwise dropped [LOOP-025/026]. Findings that fail G1 or G2 are at least P1 whatever their rated severity, because they block L1. Journey **criticality** (critical / core / peripheral) caps priority: findings that only affect peripheral journeys are capped at P2 [EVAL carlsz].
- **Ease of fix (1–4)**, rated separately by the white-box role as the lecture prescribes ("rated by the dev team"): 1 one value or token; 2 one component or file; 3 several components or one flow; 4 information architecture or architecture [HCI-011].

### 4.6 Gates and assurance levels

Quality is defined by eight **gates**, each with explicit criteria and thresholds ([QUALITY-BAR §4](QUALITY-BAR.md#4-the-gates)):

| Gate | Name | Kind |
|---|---|---|
| G0 | Evidence integrity | deterministic + process |
| G1 | Functional integrity | deterministic |
| G2 | Accessibility (WCAG 2.2 AA) | deterministic + scripted + agent-judged + human-only parts tracked |
| G3 | Craft floor | deterministic |
| G4 | Deliberateness and anti-slop | deterministic + process |
| G5 | Analytical usability | panel of isolated evaluators, verified and blind-rated |
| G6 | Design quality | panel of isolated critics; gates on agreed findings, never on scores |
| G7 | Empirical validation | real users |

Each gate state is one of `pass`, `fail`, `not_run`, `not_applicable`, `degraded` or `waived`. **`not_run` never counts as `pass`** [P6].

### 4.7 Ledgers and registers

| Name | Purpose | Location |
|---|---|---|
| Direction ledger | Directions, faces, palette buckets and macrostructures used, so that new work differs; DEC-04 compares within the project ledger, and repeats in the cross-project ledger are only reported (ADR-034) | `.ui-evaluator/ledger.json` (project) and `~/.ui-evaluator/ledger.json` (opt-in, cross-project, advisory) |
| Dismissal ledger | Findings a human rejected. They are not re-raised under another heuristic without new evidence [HCI-028] | `.ui-evaluator/dismissals.json` |
| Debt register | Deferred findings with reason, owner and revisit trigger | `.ui-evaluator/debt.md` |
| Decisions log | Design decisions and accepted tells with reasons | `DESIGN.md` |
| Run index | Append-only log of runs, gates and levels | `.ui-evaluator/index.md` |

---

## 5. The lifecycle

### 5.1 Overview

```
                ┌───────────────────── Discover / Define ─────────────────────┐
  request ──▶  SETUP  ──▶  DIRECT ──▶  BUILD ──▶  AUDIT ──▶  FIX ──▶  VERIFY ──▶  REPORT
               context     directions   tokens,    inspect     one at     gates,      level,
               PRODUCT.md  roll+ledger  floor,     panel,      a time     diff,       evidence,
               journeys    DESIGN.md    hooks      verify,                fix review  next steps
                                                   rate                   ▲
                                         ┌─────────────┴──────────┐       │
                                         ▼                        │       │
                                       STUDY  ── people ──▶  INGEST ──────┘
                                       plan tests, surveys,   feedback, results,
                                       A/B                    re-rate severity
```

The loop alternates **analytical** evaluation (AUDIT) and **empirical** evaluation (STUDY → INGEST), as the CMU lecture prescribes. It mirrors the Double Diamond: SETUP and STUDY discover and define; DIRECT diverges and converges on a solution; BUILD, AUDIT and FIX develop and deliver [PROC-001…005].

### 5.2 The nine workflows

Each workflow has a full operational specification in `skills/ui-evaluator/references/workflows/<name>.md`. The summary:

| Workflow | Purpose | Main inputs | Main outputs | Exit criteria |
|---|---|---|---|---|
| **setup** | Establish context and tooling | repo / URL / screenshots, user answers | `PRODUCT.md`, journeys, `config.json`, preflight report | doctor passes; required `PRODUCT.md` fields present (inferred facts labelled); ≥ 1 critical journey for apps |
| **direct** | Choose a deliberate visual direction | `PRODUCT.md`, references, ledger | candidate list, dealt directions, direction contracts, locked `DESIGN.md`, ledger entry | ≥ 2 genuinely different directions elaborated; convergence tests recorded; choice and rationale recorded; `DESIGN.md` lints clean |
| **build** | Implement to the floor | `DESIGN.md`, `PRODUCT.md` | code; tokens; per-edit lint results | G1–G4 deterministic checks pass in the builder's self-check (≤ 2 rounds); then hand off to `audit` |
| **audit** | Analytical evaluation | running UI, context, journeys | evidence bundle, verified and rated findings, gate states, report | all gate states computed; every finding verified, rated and evidence-anchored |
| **study** | Plan empirical evaluation | divergent or disputed findings, open questions, journeys | study plan, task scripts, consent, instruments, analysis plan, A/B spec | plan complete per the method's template; piloted where possible |
| **ingest** | Bring real-user evidence in | notes, recordings' notes, surveys, tickets, analytics exports, agree/disagree sheets | normalised feedback, themes with prevalence, finding links, re-rated severities | every item classified; every theme linked or turned into a candidate finding; severities re-rated |
| **fix** | Resolve findings one at a time | prioritised queue | per-fix changes, commits or patches, verification records | queue exhausted, or budget, risk or zero-progress stop reached |
| **verify** | Confirm fixes and regressions | baseline run, current build | run diff, fix-review verdicts, updated statuses, gates | every fixed finding `verified` or `reopened`; no unexplained introduced finding |
| **report** | Communicate honestly | run artifacts | Markdown + HTML report, agree/disagree sheet, run index entry | language lint passes; assurance level and coverage stated |

### 5.3 Routing

The skill routes from the user's request ([ARCHITECTURE §5](ARCHITECTURE.md#5-workflows-and-routing)):

- *Build, make, design, redesign, create* → `setup` (if context is missing) → `direct` (if there is no locked direction, or a redesign was asked for) → `build` → `audit` → `fix` → `verify` → `report`.
- *Review, audit, evaluate, critique, what's wrong with* → `setup` (if needed) → `audit` → `report`, then offer `fix`.
- *User feedback, test results, survey data, tickets* → `ingest` → offer `fix`.
- *Plan a usability test / survey / A/B test* → `study`.
- *Fix these issues / fix #id* → `fix` → `verify`.
- *Is it ready / can we ship?* → `verify` → `report`, with the gate verdict.

Workflows MAY be entered directly. Each one checks its own preconditions and names the workflow that would satisfy a missing one.

---

## 6. Roles and independence

### 6.1 Roles

| Role | Sees | Never sees | Produces |
|---|---|---|---|
| **Lead** (main agent) | everything | — | orchestration, merges, decisions with the owner, fixes |
| **Builder / fixer** (lead) | source, `DESIGN.md`, findings | evaluators' raw notes as *evidence of success* | code changes, fix notes |
| **Heuristic evaluator** ×N | rendered UI (live probes and screenshots), context packet | source, builder transcript, other evaluators, detector output | candidate findings, no severity |
| **Walkthrough evaluator** | rendered UI, journey with the correct action sequence, persona | source, builder transcript | per-step CW records with failure stories |
| **Design critic** ×N | screenshots, `PRODUCT.md`, `DESIGN.md` | detector output (until its specificity and appeal verdicts are written), builder transcript, other critics | specificity and appeal verdicts, rubric notes, design findings |
| **Accessibility auditor** | automated results, rendered UI, ARIA snapshots, CVD and forced-colour captures | builder transcript | judged a11y findings; resolution of axe `incomplete` items |
| **Code reviewer** (white-box) | source, lint output, findings needing file:line | builder transcript | code-level findings (tokens, states, semantics, IME, i18n); ease-of-fix estimates |
| **Finding verifier** | candidate findings, rendered UI, dismissal ledger | who raised the finding | confirmed or rejected, with reason |
| **Severity rater** ×≥3 | merged confirmed findings with evidence and factor notes | other raters' ratings, any suggested severity (detector, rule or reporter) | factor ratings and 0–4 per finding |
| **Fix reviewer** | baseline and after evidence, diff, list of claimed fixes | the fixer's narration as evidence | confirmed_fixed / partially_fixed / not_fixed per fix; ≤ 3 regressions; disposition |
| **Direction designer** ×N | `PRODUCT.md`, one dealt direction, references | other directions | direction contract, token sketch, optional specimen |
| **Owner** (human) | everything | — | decisions, waivers, confirmations (E2), study execution |
| **Participants** (humans) | the product | findings | behaviour and opinions (E3–E5) |

### 6.2 Independence rules

1. Evaluators, critics, raters, the verifier and the fix reviewer run in **isolated contexts**: subagents in Claude Code, separate processes elsewhere when available.
2. No evaluator sees another evaluator's output before consolidation [HCI-002].
3. **Black-box roles never read source or the builder's transcript.** White-box roles report file:line but do not judge the UX [LOOP #4].
4. Design critics write their specificity and appeal verdicts **before** they see detector output [CRAFT-012, IMP-036; ADR-035].
5. Raters never see each other's ratings or a suggested severity from the detector, the rule or the reporter [EVAL C2].
6. Diversity comes from different model configurations, prompt lenses and input modalities, not from re-sampling one setup, because cheap re-runs are correlated [HCI-027].
7. The provider and model of every evaluator are recorded. If isolation is impossible, every affected output starts with `DEGRADED: <what> (<reason>)` and the gate is at most `degraded` [IMP-036; 03 §3.3].

---

## 7. Evaluation depth

| Depth | Runs | Can reach | Typical use |
|---|---|---|---|
| **quick** | evidence bundle (capture, page audit, source lint); one heuristic pass (labelled single-pass); one design critic, whose appeal verdict is feedback for the builder (ADR-035); verifier | L1 | a quick look, a single component, an early prototype |
| **standard** (default for `audit`) | evidence bundle; 3 isolated heuristic evaluators with 2 passes each; a walkthrough of every critical journey; 3 design critics; accessibility auditor; code reviewer (if source is present); verifier; 3 blind raters | L2 | most audits and pre-release checks |
| **rigorous** | standard, plus 5 heuristic evaluators across ≥ 2 model configurations (external model families when the owner opts in); walkthroughs of all journeys; 5 critics; pairwise comparison with the baseline; a human-confirmation pass | L3 | releases, redesigns, high-stakes products |

The skill states the expected cost of a depth before running it and records the depth in the run manifest. Quick-depth severities are labelled *provisional (single rater)* [HCI-009].

---

## 8. Findings: record, severity, lifecycle

### 8.1 Writing rules

1. One record per problem. An element with k problems yields k records [HCI-004].
2. Problem, impact and evidence are neutral and observable. The recommendation is separate and advisory [LOOP #3].
3. No quotas. "No problems found" is a valid result [HCI-025].
4. Claims about behaviour (feedback, validation, loading, errors) require that the interaction was performed. Otherwise the claim is a *hypothesis* and excluded from the defect list [HCI-007].
5. A claim that something is **missing** requires positive evidence of absence: the states searched and the controls inventoried [EVAL noodisD absence rule].
6. Every report includes **what works well** and must be preserved. Redesign ideas come after evaluation, never during it [HCI-017].
7. Mentions of "7 ± 2", Zeigarnik and other C/D-grade "laws" cannot be the sole justification of a finding [HCI-072, HCI-074].

### 8.2 The finding state machine

```
candidate ──verifier──▶ confirmed ──raters──▶ open ──▶ in_progress ──▶ fixed ──verify──▶ verified ──human──▶ resolved
    │                                     │  │                           │
    └──▶ rejected                         │  ├──▶ deferred (debt)         └──▶ reopened ──▶ open
                                          │  ├──▶ disputed ──study/ingest──▶ open | dismissed
                                          │  ├──▶ wont_fix (trade-off, with rationale)
                                          │  └──▶ dismissed (human: not a problem → dismissal ledger)
any state ──UI changed under the anchor──▶ stale ──re-check──▶ previous state | rejected
```

- A finding moves to `verified` only on evidence its fixer did not produce (ADR-030): for a judged finding, a fresh fix reviewer's `confirmed_fixed`; for a deterministic finding, a re-run of the same check on the fixed build that no longer reports it (`uie diff` lists it as cleared); or a human's confirmation. The fixer's own re-test moves a finding only to `fixed`. Only a human, or the original reporter for feedback-sourced items, moves it to `resolved` [EVAL C12; ADR-020].
- `disputed` is entered when ratings diverge (spread ≥ 2, or a "not a problem" vote against a mean ≥ 2.5), when more than half of the raters vote "not a problem" or more than half vote "trade-off" (ADR-029), or when the owner disagrees with an E0–E1 finding. It leaves only through evidence from `study` or `ingest`.
- In iteration 2 and later, the verifier flags a new LLM-only finding raised by a single pass. After rating, a flagged finding whose mean severity is below 2.5 needs reproduction in ≥ 2 independent passes or human confirmation before it is reported, because LLM precision falls over rounds [HCI-029].

### 8.3 Consolidation, agreement and debrief

Candidates are merged automatically only on a deterministic key: same locator, same failure mechanism, same state. Text similarity only *proposes* merges for the lead to confirm. Merged findings keep every label and every piece of evidence [EVAL C5]. Each run reports:

- any-two agreement between passes (mean Jaccard over pairs) [HCI-015];
- detection counts per finding (k of N passes), as a confidence signal;
- a discovery-rate estimate of undiscovered problems (METHODS §9.6), labelled as an estimate [EVAL §3.4];
- a divergence list (spread ≥ 2, or a "not a problem" vote against a mean ≥ 2.5) with each rater's note.

The **debrief**, the lecture's final HE step, is the lead's synthesis: agreements, detector-only findings, judge-only findings, false positives, strengths, divergent items for user testing, and only then fix ideas.

---

## 9. Closing the loop with real users

### 9.1 From analytical to empirical

The framework follows the lecture's empirical chain: **objectives → tasks → data → analysis**. Studies are planned in `study`, run by people, and brought back through `ingest`. Method choice follows [METHODS §2](METHODS.md#2-choosing-a-method):

- formative usability testing (about 5 per user group per round, think-aloud, neutral probes, RITE-style iteration);
- summative benchmarks (n from the margin of error; 40 per condition by default for binary metrics);
- surveys (SUS, SEQ, UMUX-Lite, NASA-TLX, desirability);
- A/B experiments (pre-registered success metric and guardrails, power analysis, SRM check, no peeking);
- post-launch metrics (HEART via Goals–Signals–Metrics);
- feedback analysis (thematic analysis or affinity diagramming).

### 9.2 Ingesting feedback

1. Normalise every input to the feedback schema. Keep verbatim quotes and the reporter's own scale. Scrub personal data.
2. Classify each item: problem, bug, preference, feature request, praise or question.
3. Build themes with prevalence k/N and at least two supporting extracts. A single vivid quote cannot create a theme, though it can create a *candidate* finding that must be reproduced [HCI-057].
4. Link each theme to existing findings, which raises frequency and evidence level, or create candidate findings and send them through the verifier. Map them to heuristics, CW questions and journey steps.
5. Re-rate severity with the observed frequency given to raters as data.
6. Behaviour beats self-report. Positive comments about visuals do not offset observed task failures [HCI-056, HCI-078].
7. Correlation is not causation. Before/after and observational analytics are reported as associations with candidate confounds; only randomised experiments support causal language [HCI-064].

### 9.3 Participants

Studies follow research ethics: informed consent, the right to stop, data minimisation and anonymised quotes. Incentives are **flat**, never tied to performance, because performance-contingent rewards narrow attention and distort behaviour (Glucksberg; Ariely — CMU lecture).

---

## 10. Fix discipline

The fix loop implements the consensus pipeline from 03 §3.1, adjusted by its conflict rulings:

1. **Preconditions:** a clean working tree and recorded baseline SHA (or checkpoint mode if commits are forbidden); a running app; a current audit run.
2. **Queue order:** priority, then dependency layer (tokens → layout and spacing → typography → colour → components and states → motion → copy), then ease of fix, then frequency [IMP-045; LOOP].
3. **Fix contract:** before changing code, write the acceptance criterion. This is the originating check plus the regression checks [IMP-060].
4. **Smallest change at the narrowest correct layer:** a token, a shared component or a local style. CSS first. Only related files [IMP-045].
5. **Per-fix re-test:** the originating check; the adjacent happy path at the affected viewport; before/after screenshots; console parity; ARIA snapshot diff; detector set difference (anything introduced blocks) [TOOL-24/26].
6. **Classify the re-test:** passed, partial, reverted or deferred. Revert on regression. (A passed re-test moves the finding to `fixed`, never to `verified`. `verified` needs evidence the fixer did not produce: the independent close-out in step 10 for a judged finding, or a re-run of the same check in `verify` for a deterministic one, ADR-030.)
7. **Atomic record:** one commit per finding on a working branch (`fix(ui): <finding-id> <title>`), or one patch file per finding when commits are not allowed [LOOP #2].
8. **Budgets:** ≤ 3 attempts per finding, then revert and defer or escalate. ≤ 2 judgment rounds per unattended run (a third only if deterministic gates still fail). Stop immediately on a zero-progress round. Risk check every 5 fixes. Hard cap of 30 fixes per run. Taste-only rules get exactly one pass [LOOP #6].
9. **Risk score:** +15% per revert, +5% per shared component touched (token files count as shared), +1% per fix after the tenth, +20% per fix that changes files unrelated to its finding. Check it every 5 fixes and after any revert. Above 20%, pause and ask the owner [LOOP gstack; LOOP-047].
10. **Independent close-out:** a fresh fix reviewer scores every claimed fix as `confirmed_fixed`, `partially_fixed` or `not_fixed` from visible evidence and names up to three regressions. `partially_fixed` or `not_fixed` can never lead to "ship" [IMP-040]. A `confirmed_fixed` verdict moves a judged finding to `verified`; a deterministic finding moves to `verified` when a re-run of its check on the fixed build no longer reports it. A human may also confirm a fix (ADR-030).
11. **Modes:** *Direct* (the owner approves the plan) or *Auto*. In Auto, only auto-fix-tier findings and P0/P1 findings with an unambiguous fix run unattended. Taste and ask-tier items are batched into one question set [LOOP #8].

---

## 11. The anti-slop system

"Not AI-looking" is produced by mechanisms acting at every stage. A prohibition list alone is not enough.

| Stage | Mechanism | Why it works |
|---|---|---|
| setup | Brief with subject, audience, single job per surface, mode, use scene, 3–5 brand attributes as "X, not Y", tone positions, real content, facts section [CRAFT-001] | Decisions come from the product, not the training prior |
| direct | References first: ≥ 3 out-of-category and 1–2 in-category, principles not assets [CRAFT-008] | Injects outside taste legally |
| direct | 5–7 candidate directions from the audience's world across ≥ 3 material families. The category default and its predictable opposite are declared off-limits [IMP-006/007] | Escapes the category rut and the anti-rut |
| direct | **Seeded roll** (`uie roll`) deals a non-top-2 candidate, the model's own pick and a conventional option. Structural parameters are drawn from pools not used recently in the ledger [IMP-007; DSL X6] | Mechanical variety beats prose |
| direct | Convergence tests: similar-prompt, category-guess and swap tests, recorded with revisions [CRAFT-004] | Catches genericness before code |
| direct | Direction contract and tokens locked in `DESIGN.md`: OKLCH roles, type roles, scale and measure, spacing, radius, elevation, motion tokens, colour strategy [CRAFT-002] | Prevents drift and improvisation |
| build | Token-only styling; per-edit lint hook for hard tells and floor violations [IMP-049, P13] | Errors are caught when they are cheapest |
| audit | Deterministic tell detection, reported as **density** (0–1 low, 2–3 medium, 4+ high), never as "made by AI" [CRAFT-013] | Avoids false accusations; slop is a pattern |
| audit | Isolated critics judge specificity before seeing detectors [CRAFT-012] | Avoids anchoring |
| over time | Direction ledger; new work differs from the last three entries of the project ledger in display face and macrostructure unless the brand pins them, and the opt-in cross-project ledger only reports repeats (DEC-04; ADR-034) [CRAFT-010]; convergence monitoring across outputs [CRAFT-029] | Stops the skill's own outputs from becoming the next slop |
| over time | Versioned tell catalogue with status (active, rising, migrating, obsolete) and measured precision per detector [CRAFT-013/061] | The target moves with every model release |

Rules that keep anti-slop from becoming a new slop:

- **No recommended-font list ships.** A dated "saturated faces" list exists only to require a reason [CRAFT-015; IMP-013; ADR-012].
- Examples in guidance are deliberately varied or abstract. Spec examples become defaults [07 §4.1].
- Any tell that the brief or `DESIGN.md` explicitly asks for is suppressed and reported as *requested* [CRAFT-005].
- Convention is not slop. Standard navigation, form patterns and controls are kept on Operate and Read surfaces [P3].

---

## 12. Accessibility, localisation and platforms

### 12.1 Accessibility

WCAG 2.2 Level AA (55 success criteria) is the normative target. WCAG 3 drafts and APCA are never pass/fail criteria; APCA Lc may be shown as advisory [TOOL-01, TOOL-15]. Automation covers well under half of the criteria, so every report includes a **coverage matrix** that labels how each criterion was covered (auto, scripted, agent-judged, needs-human, not-tested) together with its state. The skill MUST NOT claim "WCAG compliant" from automation [TOOL-37]. At L3 a human completes the needs-human criteria.

At build time a short, non-negotiable floor applies: contrast, focus-visible, keyboard operability, semantic native controls, labels, target size and reduced motion. It is written as constraints, not caution, so that it does not produce timid design [IMP C9].

### 12.2 Localisation and CJK

Locale is part of context. For Chinese, Japanese and Korean content the framework applies the CJK rules: explicit CJK font stacks (no `system-ui` for content), CJK line height and measure, no negative tracking, kinsoku line-breaking, `text-autospace`, regional `lang` tags, and zh-CN copy and data-format conventions ([QUALITY-BAR](QUALITY-BAR.md) TYP and I18N criteria; knowledge file `cjk.md`) [PLAT-130…137]. Text expansion (+30–40%), RTL mirroring and IME-safe input handling are tested in the hardening fixtures [IMP-048, TOOL-20].

### 12.3 Platform profiles

The default profile is **web**. Optional profiles adjust conventions where platforms legitimately differ, such as button case, target size defaults, focus styles and motion character: `apple` (web apps meant to feel native on Apple platforms), `material`, `fluent` and `enterprise-zh` (Ant/TDesign conventions). Profiles change defaults only. They never lower the G2 floor, and their values come from the systems' token sources rather than their prose, which sometimes disagrees [PLAT-141].

---

## 13. Honesty rules for every output

1. Wording matches the evidence level (§4.4). "Users struggle with…" requires E3 or higher. Causal verbs require E5 [HCI-035, HCI-064].
2. No completeness claims. Reports state expected coverage: a single inspection pass finds about a third; a single LLM pass about 35–45% of an expert set [HCI-016].
3. Every claim in a progress or final report is backed by a tool result from the session. Anything else is labelled unverified [IMP-061].
4. Simulated users and LLM task completions are never presented as predicted user success or as metrics [HCI-023, HCI-036].
5. LLM preferences between two designs are never presented as a predicted A/B outcome. Pairwise judgments are run in both orders and only order-consistent preferences are kept [HCI-034].
6. Not-run, degraded and waived states are shown, never hidden. A DEGRADED banner is the first line of any affected output.
7. Scores, when shown, are labelled *(judged)* or *(measured)*, compared only like-for-like, and never used as the sole exit criterion [LOOP #7].

`uie report` lints report language against rules 1, 2 and 4.

---

## 14. Input situations and degraded operation

| Situation | What runs | What cannot be claimed |
|---|---|---|
| Source + runnable app | everything | — |
| Live URL only (no source) | capture, page audit, black-box evaluators, critics, verifier | code-level findings; fixes (recommendations only) |
| Screenshots or design exports only | critics and heuristic inspection on static images; pixel-level contrast and layout | anything about behaviour. Runtime claims are labelled `potential — unverified` and listed as not assessable. No dynamic heuristic (H1 feedback, loading, confirmation) is scored from a single screenshot. Maximum level: none, since G0–G2 cannot pass [EVAL C8] |
| Brief only (new build) | setup → direct → build → audit | — |
| Harness without subagents | evaluators run sequentially in the main context | independence. Affected gates are `degraded` and outputs carry the DEGRADED banner |
| Tools missing or failing smoke test | nothing that depends on them | any gate that depends on them (`not_run`) |

The **doctor** smoke test runs the toolchain against a known-bad fixture and checks the expected detections before any audit. A tool that silently returns zero findings is the most common false-clean failure in practice [TOOL-40; 03 §3.3].

---

## 15. Ethics, privacy and licences

- **Privacy:** feedback and study data are scrubbed of personal data on import. Participant identities are replaced by codes. Nothing is sent to external services by the scripts, which only talk to the local app under test. Optional integrations (external model CLIs, analytics exports) run only when the owner enables them.
- **Dark patterns:** the evaluators flag deceptive patterns (forced continuity, confirmshaming, disguised ads, pre-checked consent, roach motels) as violations of H3 and H5 and of the honesty principle. The skill does not build them on request without stating the harm.
- **AI features:** UIs that contain AI features are additionally audited against the Microsoft HAX guidelines (G1–G18), with failures classified using PAIR's error taxonomy [HCI-075].
- **Licences:** guidance paraphrases its sources. Quotations stay under 15 words. GOV.UK text (Open Government Licence v3) is adapted with attribution. Licence-restricted sources (Polaris, Atlassian, agentation, unlicensed repositories) contribute ideas only. Fonts are never self-hosted when their licence forbids it (SF, Segoe, PingFang, Microsoft YaHei, GDS Transport). References from galleries whose terms forbid AI use (Mobbin, Dribbble) are for human browsing only. See [AUTHORING §Licences](AUTHORING.md#licences-and-quotation) and `NOTICE.md`.

---

## 16. Non-goals and known limits

- **Not a replacement for designers or user research.** The framework makes agents better collaborators and better first-pass evaluators. It routes taste disputes and user claims to humans.
- **Recall is bounded.** Even a full standard panel misses problems. The discovery-rate estimate of undiscovered problems is only an estimate.
- **Taste rules are partly uncalibrated.** Many tell thresholds are expert heuristics, marked *[calibrating]* until measured on labelled data ([EVALUATION-PLAN](EVALUATION-PLAN.md)).
- **Native apps** (iOS, Android, desktop) are out of scope for v1 beyond platform profiles for web UIs.
- **Data visualisation and dense enterprise UIs** have thinner research coverage. The guidance says so where it applies.
- **Cultural validity:** conventions are mostly Western and Chinese. Other locales need local review.

---

## 17. Change control

- This specification uses semantic versioning. Changing a gate's meaning or a threshold is a minor version. Removing or renaming a gate is a major version.
- Every rule and tell carries `status` (`active`, `calibrating`, `rising`, `migrating`, `obsolete`), `first_seen` and its sources. Tell statuses are reviewed with each major model release [CRAFT-013].
- Threshold changes require either a new source or calibration data from the evaluation suite, recorded as an ADR in [DECISIONS](DECISIONS.md).
- Skill behaviour is regression-tested on tool-call traces across at least two model families. Prose output is not the oracle [IMP-058].

---

## Appendix A — The CMU lecture, element by element

Source: Alexandra Ion, *Evaluation: Analytical vs Empirical*, Carnegie Mellon University, Human-Computer Interaction Institute (course lecture). Paraphrased; full mapping in [TRACEABILITY](TRACEABILITY.md).

| Lecture element | Where it lives in the framework |
|---|---|
| Analytical vs empirical evaluation, and alternating them | §5.1 loop; `audit` vs `study` + `ingest`; P9 |
| Heuristic evaluation with Nielsen's heuristics | §6 heuristic evaluators; `methods/heuristic-evaluation.md`; H1–H10 |
| At least two passes per evaluator | §7; HE protocol [HCI-003] |
| One listing per violation | §8.1 rule 1 [HCI-004] |
| 3–5 independent evaluators, then consensus | §7 standard and rigorous depth; §8.3 [HCI-002] |
| Debrief | §8.3 debrief synthesis |
| Severity 0–4 from frequency, impact and persistence | §4.5; `methods/severity-rating.md` |
| Ease of fix rated by the dev team | §4.5 ease of fix (white-box role) |
| Report fields: problem, heuristic, description, evidence, severity, fix, recommendation | §4.3 finding record |
| Problem types: single location, multiple locations, overall structure, something missing | §4.3 `problem_type`; §8.1 rule 5 (absence evidence) |
| HE limitations ("false problems", misses) | §8.2 verifier; §9 alternation with user tests; P9 |
| Cognitive walkthrough with four questions per step | §6 walkthrough evaluator; `methods/cognitive-walkthrough.md` |
| Empirical chain: objectives → tasks → data → analysis | §9.1; `study` workflow |
| A/B testing (one variable, measured outcome, repetition) | `methods/experiments-analytics.md` |
| Mill's methods; correlation vs causation; controlled experiments | §9.2 rule 7; E5 |
| Combining quantitative and qualitative evidence | §9.2; [HCI-066] |
| Participant motivation and flat incentives | §9.3 |
