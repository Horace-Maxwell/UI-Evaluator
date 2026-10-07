# Decision records

| | |
|---|---|
| Version | 2.2.0 (2026-10-06) |
| Status | Normative. Each record states a decision, why it was made and what it costs. Rule-level conflict rulings live in [CONFLICT-REGISTER](CONFLICT-REGISTER.md) (CR-*). A ruling changes only through a new or superseding ADR. |
| Parent | [FRAMEWORK](FRAMEWORK.md) |

Format: **Context** (the forces) · **Decision** · **Consequences** (including costs) · **Alternatives rejected** · **Sources**. Status values: `accepted`, `superseded by ADR-x`, `proposed`.

## Index

| ID | Title | Status |
|---|---|---|
| [ADR-001](#adr-001--one-umbrella-skill-with-a-workflow-router) | One umbrella skill with a workflow router | accepted |
| [ADR-002](#adr-002--portable-core-optional-claude-code-wrapper) | Portable core, optional Claude Code wrapper | accepted |
| [ADR-003](#adr-003--languages-english-for-agents-chinese-for-the-owner-cjk-first-class) | Languages: English for agents, Chinese for the owner, CJK first-class | accepted |
| [ADR-004](#adr-004--web-first-scope) | Web-first scope | accepted |
| [ADR-005](#adr-005--100-beautiful-becomes-gates-and-assurance-levels) | "100% beautiful" becomes gates and assurance levels | accepted |
| [ADR-006](#adr-006--nielsen-h1h10-as-the-primary-taxonomy-with-add-ons) | Nielsen H1–H10 as the primary taxonomy, with add-ons | accepted |
| [ADR-007](#adr-007--severity-per-finding-rated-blind-by-three-or-more-raters) | Severity per finding, rated blind by three or more raters | accepted |
| [ADR-008](#adr-008--evidence-levels-govern-wording) | Evidence levels govern wording | accepted |
| [ADR-009](#adr-009--axe-gate-zero-wcag-violations-of-any-impact) | axe gate: zero WCAG violations of any impact | accepted |
| [ADR-010](#adr-010--deterministic-findings-carry-rule-declared-severity) | Deterministic findings carry rule-declared severity | accepted |
| [ADR-011](#adr-011--scores-never-gate) | Scores never gate | accepted |
| [ADR-012](#adr-012--no-recommended-font-or-palette-lists) | No recommended font or palette lists | accepted |
| [ADR-013](#adr-013--mechanical-variety-seeded-roll-plus-ledger) | Mechanical variety: seeded roll plus ledger | accepted |
| [ADR-014](#adr-014--context-files-at-the-project-root-workspace-in-ui-evaluator) | Context files at the project root, workspace in `.ui-evaluator/` | accepted |
| [ADR-015](#adr-015--zero-dependency-core-playwright-browser-layer) | Zero-dependency core, Playwright browser layer | accepted |
| [ADR-016](#adr-016--bounded-fix-loop-with-atomic-fixes) | Bounded fix loop with atomic fixes | accepted |
| [ADR-017](#adr-017--black-box-and-white-box-roles-script-built-packets) | Black-box and white-box roles, script-built packets | accepted |
| [ADR-018](#adr-018--disagreement-goes-to-users-not-to-a-vote) | Disagreement goes to users, not to a vote | accepted |
| [ADR-019](#adr-019--wcag-22-aa-normative-apca-advisory-two-tier-targets) | WCAG 2.2 AA normative, APCA advisory, two-tier targets | accepted |
| [ADR-020](#adr-020--humans-close-feedback-sourced-findings) | Humans close feedback-sourced findings | accepted |
| [ADR-021](#adr-021--the-lint-hook-is-inert-outside-opted-in-projects) | The lint hook is inert outside opted-in projects | accepted |
| [ADR-022](#adr-022--modes-are-declared-per-surface) | Modes are declared per surface | accepted |
| [ADR-023](#adr-023--static-only-inputs-cannot-reach-an-assurance-level) | Static-only inputs cannot reach an assurance level | accepted |
| [ADR-024](#adr-024--quick-depth-cannot-pass-g5) | Quick depth cannot pass G5 | accepted |
| [ADR-025](#adr-025--licence-policy) | Licence policy | accepted |
| [ADR-026](#adr-026--one-colour-library) | One colour library | accepted |
| [ADR-027](#adr-027--subagent-results-go-to-files-not-to-the-leads-context) | Subagent results go to files, not to the lead's context | accepted |
| [ADR-028](#adr-028--simulated-users-generate-hypotheses-only) | Simulated users generate hypotheses only | accepted |
| [ADR-029](#adr-029--validity-votes-stay-outside-the-severity-mean) | Validity votes stay outside the severity mean | accepted |
| [ADR-030](#adr-030--verified-needs-independent-evidence) | `verified` needs independent evidence | accepted |
| [ADR-031](#adr-031--soft-tell-dispositions-and-the-per-page-rule) | Soft-tell dispositions and the per-page rule | accepted |
| [ADR-032](#adr-032--operational-definitions-for-mot-04-cmp-03-cmp-06-and-a11y-11-in-cjk) | Operational definitions for MOT-04, CMP-03, CMP-06 and A11Y-11 in CJK | accepted |
| [ADR-033](#adr-033--identity-of-grouped-tool-findings) | Identity of grouped tool findings | accepted |
| [ADR-034](#adr-034--dec-04-compares-against-the-project-ledger) | DEC-04 compares against the project ledger | accepted |
| [ADR-035](#adr-035--appeal-is-judged-and-gates-g6) | Appeal is judged, and gates G6 | accepted |
| [ADR-036](#adr-036--a-finding-can-wait-on-a-named-persons-decision) | A finding can wait on a named person's decision | accepted |
| [ADR-037](#adr-037--splitting-a-finding-is-a-recorded-command) | Splitting a finding is a recorded command | accepted |

---

## ADR-001 — One umbrella skill with a workflow router

**Context.** Building, auditing, studying, ingesting and fixing share context (`PRODUCT.md`, `DESIGN.md`, findings, ledgers) and one CLI. Several small skills would each consume listing budget, could not reliably reference each other's files after installation, and would trigger inconsistently. Impeccable ships one skill with many modes successfully [01 §2.1].
**Decision.** Ship one skill, `ui-evaluator`. `SKILL.md` routes requests to nine workflows held in `references/workflows/`.
**Consequences.** The description must cover building *and* evaluating, so it triggers widely on front-end work, which is intended. `SKILL.md` stays a router under 500 lines.
**Alternatives rejected.** A skill per workflow (fragmented context, cross-skill path breakage). A build skill plus an audit skill (the loop crosses both).
**Sources.** PKG-01/06; 01 §3.1.

## ADR-002 — Portable core, optional Claude Code wrapper

**Context.** The owner wants the skill to work in Claude Code, Codex, Cursor and Gemini CLI. Claude Code–only frontmatter fields are rejected by claude.ai and API uploads. Subagents give real independence but only exist in some harnesses.
**Decision.** The skill uses only Agent Skills spec fields. A Claude Code plugin wrapper adds subagents, a lint hook and slash commands. Every workflow also runs without them, with independence marked `degraded`.
**Consequences.** Claude Code users get the strongest guarantees. Other harnesses still get the full method, with honest labels. Agent prompts have one source of truth (`references/evaluators/`), from which `agents/` is generated.
**Alternatives rejected.** Claude-only features in `SKILL.md` (breaks portability). Separate per-harness forks (drift).
**Sources.** PKG-02/03; 09 §2.

## ADR-003 — Languages: English for agents, Chinese for the owner, CJK first-class

**Context.** Agent instruction-following and source material are strongest in English. The owner reads Chinese, and Chinese-language products are a primary use case. Almost every Western craft rule is Latin-centric [07 §5.3].
**Decision.** Agent-facing files are in English. `README.zh-CN.md` and `docs/OVERVIEW.zh-CN.md` serve the owner. CJK typography, copy and data-format rules are first-class: their own knowledge file and I18N gate criteria.
**Consequences.** Chinese examples appear inside English files. The glossary fixes Chinese translations of the terms.
**Alternatives rejected.** Chinese agent files (weaker portability and fewer sources). Treating CJK as a footnote (fails a core audience).

## ADR-004 — Web-first scope

**Context.** The research covers web tooling deeply (Playwright, axe, CSS analysis). Native iOS and Android need simulators and platform tooling, and platform numbers alone are not a verification stack.
**Decision.** Version 1 evaluates and builds web front ends. Platform profiles adapt web conventions (e.g. web apps meant to feel native on Apple platforms). Native apps are a non-goal for v1.
**Consequences.** Clear verification guarantees. Native teams can still use the analytical and empirical methods, without the deterministic gates.

## ADR-005 — "100% beautiful" becomes gates and assurance levels

**Context.** The owner's aim is that every UI built with the skill is beautiful and not AI-looking. Beauty cannot be proven, and taste ratings are noisy (UIClip designers α = 0.37). An unverifiable promise would violate the framework's honesty principle.
**Decision.** Define the bar as eight gates and four assurance levels (L1 machine-verified → L4 user-validated). The skill refuses to call work done below the target level, and states what each level does and does not mean.
**Consequences.** Every claim is checkable. The strongest claim needs real users. The skill's behaviour is testable through evals.
**Alternatives rejected.** A single beauty score (unreliable, gameable). Promising "100%" (dishonest).
**Sources.** QUALITY-BAR §1, §8; 07 §4.3–4.4; EVAL C4.

## ADR-006 — Nielsen H1–H10 as the primary taxonomy, with add-ons

**Context.** No significant effectiveness difference was found between Nielsen's and Gerhardt-Powals' sets. Nielsen's is the shared vocabulary of the CMU lecture and of industry. Nielsen's set does not test utility, AI features or data fusion.
**Decision.** H1–H10 are primary. The add-ons are ISO 9241-110 suitability for the task and user engagement, Gerhardt-Powals' data fusion for dashboards, and HAX for AI features. A crosswalk maps other principle sets onto H1–H10.
**Sources.** HCI X7; HCI-075/076.

## ADR-007 — Severity per finding, rated blind by three or more raters

**Context.** Severity scales diverge across sources: P0–P3, Blocker/High, 0–4 per heuristic. Single-rater severity correlates only at about .23–.31. The lecture and NN/g rate per problem from frequency, impact and persistence, after discovery, with several raters.
**Decision.** The canonical scale is Nielsen 0–4 per finding. Raters score the factors first, then the label, using a monotone suggested-severity function as a prior. At least three raters are blind to one another. The mean and spread are kept; spread ≥ 2 marks a finding divergent. Priority P0–P3 is derived from the mean. Ease of fix is a separate field, rated by the white-box role.
**Consequences.** Severity becomes reliable enough to gate (USE-05/06). Rating costs three short subagent runs per audit.
**Alternatives rejected.** Detector-assigned severity for judged findings (anchoring). A single rater (unreliable). Per-heuristic scores as the primary output (not actionable).
**Sources.** HCI-009/010/011; EVAL C1–C3; LOOP #5; DSL X19.
**Amended by ADR-029.** A not-a-problem vote carries no value and stays out of the mean; such a vote against a mean ≥ 2.5 also marks a finding divergent.

## ADR-008 — Evidence levels govern wording

**Context.** LLM evaluators produce plausible but unverified claims. Synthetic users are overly competent and sycophantic. Analytics invite causal over-reading.
**Decision.** Every finding and claim carries E0–E5. Allowed wording depends on the level: "users …" needs E3; causal verbs need E5. Simulated output never exceeds E1. The report linter enforces this (EVD-06).
**Sources.** HCI-035/036/064; FRAMEWORK §4.4.

## ADR-009 — axe gate: zero WCAG violations of any impact

**Context.** The tooling research proposed gating on zero *serious or critical* axe violations [TOOL-02]. axe's `impact` field estimates user impact. It does not decide conformance: a "minor" or "moderate" violation of a WCAG-tagged rule is still a failure of that success criterion, and axe's WCAG-tagged rules are designed for very low false-positive rates.
**Decision.** A11Y-01 requires zero violations of any impact for rules tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`. Best-practice rules are reported but not gated. Impact still informs the rule-declared severity used for ordering (ADR-010).
**Consequences.** Stricter than the research proposal, and aligned with what "AA" means. A minor violation can block L1, which is correct for a floor.
**Alternatives rejected.** The impact threshold (lets real failures pass the floor).

## ADR-010 — Deterministic findings carry rule-declared severity

**Context.** A standard audit can yield dozens of deterministic findings (contrast, targets, tells). Blind-rating each would triple cost without improving their validity, since the threshold already decides them. Judged findings need blind rating because their existence and impact are uncertain.
**Decision.** Findings from `uie audit` and `uie lint` take `default_severity` from `rules.json` (`severity.source: "rule"`). They skip blind rating unless the owner disputes them, in which case they enter the normal rating step. Judged findings always go through verification and blind rating. G1 and G2 failures are at least P1 whatever their severity.
**Consequences.** Rating effort goes where uncertainty is. Rule severities are reviewable data, not hidden judgement.
**Sources.** 08 §4.3 (axe impact mapping as a proposal); QUALITY-BAR §6.

## ADR-011 — Scores never gate

**Context.** Holistic quality ratings have near-zero inter-rater reliability (UICrit ICC ≈ .03–.05). LLM scores drift and degrade over rounds. The only unbounded loop found in the research exited on a VLM score and graded itself.
**Decision.** No gate passes or fails on a score. G6 gates on the specificity majority, on agreed severe design findings and on order-consistent pairwise comparisons. Rubric scores are reported as context and labelled *(judged)*.
**Sources.** EVAL C4; DSL X20; LOOP #7; FRAMEWORK P7.

## ADR-012 — No recommended font or palette lists

**Context.** Fonts recommended by one generation of guidance become the next generation's tells: the 2025 cookbook list is now on detector lists. Examples in specifications become defaults.
**Decision.** The skill ships no "use these" lists. A dated saturated-faces list exists only to require a recorded reason when such a face is the display or only face. Examples always show contrasting directions and avoid saturated looks.
**Consequences.** The agent must derive choices from the brief through a procedure. This is harder, and it is the point.
**Sources.** IMP C1; CRAFT C1, CRAFT-015; DSL X4; AUTHORING §6.

## ADR-013 — Mechanical variety: seeded roll plus ledger

**Context.** Under prose rules, ten builds produced ten identical folds. A mechanical draw plus a ledger produced zero repeats in four. Impeccable's roll never assigns the model's top-two ranked ideas.
**Decision.** `uie roll` deals three directions: a seeded draw from ranks 3…n, the model's own pick with a familiarity note, and the conventional option. It also draws structural parameters from pools unused in recent ledger entries. The project ledger is mandatory. A cross-project ledger is opt-in and advisory.
**Consequences.** Reproducible (seeded) yet varied outputs. The skill's own outputs are monitored for convergence (CRAFT-029).
**Sources.** IMP-007; DSL X6; CRAFT-010.

## ADR-014 — Context files at the project root, workspace in `.ui-evaluator/`

**Context.** Google's `design.md` format and impeccable expect `DESIGN.md` (and `PRODUCT.md`) at the root, and interoperability with those tools has value. Evidence and run artifacts are bulky and may contain personal data.
**Decision.** `PRODUCT.md` and `DESIGN.md` live at the root and are adopted, never overwritten. Everything else lives in `.ui-evaluator/`, with `runs/` and raw feedback git-ignored by default.
**Sources.** IMP-002; 02 §2.11.

## ADR-015 — Zero-dependency core, Playwright browser layer

**Context.** Agents run in varied environments. A heavy dependency tree fails often, and silent tool failure is the most common false-clean result. Browser verification needs a real engine.
**Decision.** Findings, rating, gates, reports, statistics, the roll and source lint use only the Node.js standard library. Capture, page audit, probe, journeys and visual diff use Playwright (Chromium), axe-core, colorjs.io, pixelmatch and pngjs. These are installed into a runtime cache after the owner agrees, never silently into the project. The doctor smoke test gates every audit.
**Consequences.** Static and analytical work runs anywhere. Deterministic gates require the browser layer and report `not_run` without it.
**Alternatives rejected.** Lighthouse or LHCI (stale pins, second browser stack). BackstopJS or Lost Pixel (dormant or archived). AIM (end-of-life stack) [TOOL-40].

## ADR-016 — Bounded fix loop with atomic fixes

**Context.** One-at-a-time fixing preserves attribution and revertability, but full judgment re-review per fix is expensive. LLM feedback quality falls over rounds. Unbounded loops thrash.
**Decision.** Each finding gets its own minimal change and commit (or patch), followed by cheap deterministic re-tests. The expensive fresh-reviewer judgment runs once per round, scoped to the listed fixes. Budgets: ≤ 3 attempts per finding; ≤ 2 unattended judgment rounds; stop on zero progress; risk check every 5 fixes with a 20% threshold; cap of 30 fixes.
**Sources.** LOOP #1, #2, #6; FRAMEWORK §10.

## ADR-017 — Black-box and white-box roles, script-built packets

**Context.** Evaluators who read source or the builder's notes anchor on intent. Evaluators who cannot see source cannot give file:line. Independence that relies on the lead's discipline fails silently.
**Decision.** Black-box roles see only the rendered UI and their packet. The white-box code reviewer reports file:line and ease of fix. `uie packet` builds each role's inputs and records its hash. For critics, the detector section is sealed until the specificity verdict exists.
**Sources.** LOOP #4; IMP-032/036; CRAFT-012.

## ADR-018 — Disagreement goes to users, not to a vote

**Context.** Low evaluator agreement is normal (5–65% any-two). Settling divergent ratings by majority hides real uncertainty about user impact.
**Decision.** Findings with rating spread ≥ 2, or contested by the owner at E0–E1, become `disputed` and route to `study` or `ingest`. They leave that state only with new evidence.
**Sources.** EVAL arely protocol; HCI-015; FRAMEWORK P9.
**Amended by ADR-029.** A not-a-problem vote against a mean ≥ 2.5 also makes a finding divergent, and a majority of not-a-problem votes, or of trade-off votes, also sends it to `disputed`.

## ADR-019 — WCAG 2.2 AA normative, APCA advisory, two-tier targets

**Context.** Some guidance prefers APCA. WCAG 3 has no contrast algorithm yet, and the APCA reference package is not OSI-licensed. Target-size guidance ranges from 24 px (WCAG AA) through 44 pt (Apple) to 48 dp (Material).
**Decision.** Contrast gates use WCAG 2.2 formulas. APCA Lc is advisory and computed with MIT code. Targets: the 24 px gate with SC 2.5.8 exceptions sits in G2 (A11Y-10), and the 44 px touch-primary requirement sits in G3 (CMP-06).
**Sources.** DSL X10/X11; CRAFT C8; EVAL C9; TOOL-15.

## ADR-020 — Humans close feedback-sourced findings

**Context.** An agent re-checking its own fix can mark it verified. A user-reported problem is resolved only when the reporter, or a human acting for them, agrees.
**Decision.** Agents may set `verified`. Only a human, or the original reporter, sets `resolved` for feedback-sourced findings. For L3, every P0/P1 finding needs human confirmation.
**Sources.** EVAL C12.
**Amended by ADR-030.** `verified` needs evidence the fixer did not produce: a fresh fix reviewer's `confirmed_fixed`, a re-run of a deterministic check that no longer reports the finding, or a human. An agent's own re-check moves a finding only to `fixed`.

## ADR-021 — The lint hook is inert outside opted-in projects

**Context.** Plugin hooks run in every project where the plugin is enabled. A UI lint firing in unrelated repositories would be noise. The research shows guidance is skipped unless enforced mechanically.
**Decision.** `uie hook` acts only when the edited file has a UI extension *and* the project has `.ui-evaluator/config.json`. It reports through `additionalContext`, never blocks, stays silent on internal errors, and runs in under 300 ms.
**Sources.** IMP-049/057; Claude Code hooks reference.

## ADR-022 — Modes are declared per surface

**Context.** A distinctive marketing page and a productive dashboard need different expressiveness, type ratios and motion budgets. Applying Persuade rules to tools harms task performance. Applying Operate rules to marketing yields blandness.
**Decision.** Every surface declares Persuade, Operate, Read or Experience. Thresholds that depend on mode are resolved through QUALITY-BAR §5.
**Sources.** IMP-001; PLAT-004; CRAFT C3, C11, C18.

## ADR-023 — Static-only inputs cannot reach an assurance level

**Context.** Screenshots cannot show behaviour, focus, semantics or reflow. Static audits that score dynamic heuristics from one image produce confident errors.
**Decision.** With screenshots only, the skill runs critics and inspection with runtime claims labelled `potential — unverified`, lists what cannot be assessed, and reports no assurance level, since G0–G2 cannot pass.
**Sources.** EVAL C8.

## ADR-024 — Quick depth cannot pass G5

**Context.** A single pass finds about a third of problems, and its severities are single-rater.
**Decision.** Quick depth reaches at most L1. Its G5 state is at most `degraded`, and its severities are labelled provisional.
**Sources.** HCI-002/009.

## ADR-025 — Licence policy

**Context.** The best sources span permissive licences, government open licences, restricted product licences and unlicensed repositories.
**Decision.** Paraphrase by default; at most one short quote per file. Apache-2.0 and MIT ideas are re-expressed with attribution in `NOTICE.md`. GOV.UK OGL text is adapted with its attribution line. Restricted or unlicensed sources contribute ideas only. Restricted fonts are never bundled. Reference galleries whose terms forbid AI use are for humans only.
**Sources.** AUTHORING §Licences; 05 licence notes; 07 §4.2.

## ADR-026 — One colour library

**Context.** The tooling note proposed culori for WCAG contrast and OKLab clustering, and colorjs.io for advisory APCA. Two colour libraries means two sets of conversion maths that can disagree.
**Decision.** One implementation of colour maths, `scripts/lib/util/color.mjs`, serves every layer: CSS colour parsing (hex, named, `rgb`, `hsl`, `lab`, `lch`, `oklab`, `oklch`, and `color()` in srgb, srgb-linear, display-p3 and xyz), sRGB ↔ OKLab and OKLCH, ΔE OK, WCAG luminance and contrast. It is unit-tested against colorjs.io (MIT) in `tests/core/color.test.mjs`. colorjs.io itself is used only for what `util/color.mjs` does not implement: the advisory APCA reading (COL-14).
**Consequences.** One dependency fewer in the core. The lint layer, the browser checks and the token checks give identical numbers for the same colour. A new colour space is added to `util/color.mjs` and its test, never computed separately in a check.
**Amended 2026-10-01.** The first version gave colorjs.io all colour maths in the browser layer. The browser checks were built on `util/color.mjs` instead, which keeps a single set of conversion maths across layers, the aim of this decision; the test against colorjs.io keeps it honest.

## ADR-027 — Subagent results go to files, not to the lead's context

**Context.** A standard audit spawns about nine evaluators and three raters. Returning full JSON to the lead would consume its context and invite selective reading.
**Decision.** Agents write schema-valid files and return at most about ten lines. The lead works through `uie findings …` commands on the files.
**Sources.** ARCHITECTURE §6.3.

## ADR-028 — Simulated users generate hypotheses only

**Context.** Synthetic users are overly competent and sycophantic. LLM walkthroughs complete tasks that real users fail. Vendors sell synthetic research as a replacement.
**Decision.** Persona walkthroughs and simulated pilots are labelled *simulated*. They never exceed E1, never produce metrics, and are never phrased as user behaviour.
**Sources.** HCI-023/036; LOOP #9; EVAL C7.

## ADR-029 — Validity votes stay outside the severity mean

**Context.** Raters may judge a confirmed finding "not a problem" or "a trade-off" instead of only rating how bad it is. Averaging a not-a-problem vote as 0 drags the mean down and silently turns a disagreement about validity into a low severity; Herr et al. found that the "not a problem" point distorts ratings on Nielsen's scale. FRAMEWORK §4.5 and `methods/severity-rating.md` §3.6–§3.7 already applied this rule and cited this record before it was written (CONFLICT-REGISTER §4 O9).
**Decision.** Every rating carries a validity: `problem`, `trade_off` or `not_a_problem`. A `not_a_problem` vote has severity `null` and is left out of the mean; a `trade_off` vote keeps its 1–4 value, so the owner sees what is being traded. The finding's severity is the mean of the problem and trade-off values, and its spread is the highest minus the lowest of those values. The finding is divergent when that spread is ≥ 2, or when any `not_a_problem` vote coexists with a mean ≥ 2.5; divergent findings go to `disputed` and to user research (ADR-018). When more than half of the raters vote `not_a_problem`, or more than half vote `trade_off`, the finding takes that validity and goes to `disputed` for the owner.
**Consequences.** A minority's not-a-problem vote no longer lowers the severity the other raters gave; it stays visible as a validity vote in the record and in the report's divergence list. A finding whose raters all vote `not_a_problem` has no mean and goes to the owner. This record refines ADR-007 (what the mean covers) and ADR-018 (a second divergence condition, and a validity majority as a route to `disputed`). FRAMEWORK §4.5 and §8.2, METHODS §5 step 4, QUALITY-BAR USE-04 and §6, and `methods/severity-rating.md` §3.7 state the rule in the same terms.
**Alternatives rejected.** Averaging "not a problem" as 0 (hides validity dissent as a low severity). Dropping not-a-problem votes without a trace (loses the dissent that should go to users). Treating a validity majority as final (a majority of inspectors is not evidence about users; the owner or a study decides, P9).
**Sources.** CONFLICT-REGISTER §4 O9 and CR-057 (decided 2026-10-01); HCI-010, HCI-013; Herr, Baumgartner & Gross 2016; EVAL arely protocol.

## ADR-030 — `verified` needs independent evidence

**Context.** FRAMEWORK §8.2, ADR-020 and the glossary let an agent set `verified` after its own re-check, while FRAMEWORK §10 steps 6 and 10 let a passed re-test reach only `fixed` and tie `verified` to a fresh fix reviewer, and P5 says no agent certifies its own work (CONFLICT-REGISTER §4 O1). Deterministic findings had no stated route to `verified`. Self-assessment skews positive, so the status that means "fixed, and seen to be fixed" has to rest on evidence the fixer did not produce.
**Decision.** A finding moves to `verified` only on evidence its fixer did not produce: (a) for a judged finding, a fresh fix reviewer's `confirmed_fixed`, applied with `uie findings apply-verdicts --fix-review`; (b) for a deterministic (tool) finding, a re-run of the same check on the fixed build that no longer reports it, so that `uie diff` lists it as cleared, which is independent of the fixer by construction because a tool measures the same way whoever runs it; (c) a human, recorded with `uie findings set <id> --status verified --by human:<name>`. The fixer's own re-test (the fix-loop re-test with the outcome "passed") moves a finding to `fixed`, never to `verified`. Only a human, or the original reporter for feedback-sourced findings, moves a finding to `resolved` (ADR-020, unchanged).
**Consequences.** FRAMEWORK §8.2 and §10, METHODS §8, ADR-020, the glossary, `SKILL.md`, the `fix`, `verify` and `ingest` workflows, and `methods/fix-loop.md`, `finding-records.md` and `feedback-analysis.md` state the same three routes. A fix review performed in the fixer's own context (no subagents) is the fixer's evidence: its verdicts are recorded under the DEGRADED banner, and judged findings stay `fixed` until a human confirms them or an isolated reviewer repeats the review. A cleared result counts only when the re-run covered the baseline's scope, because a narrower scope also clears findings, and only when no instance of the finding is left (ADR-033).
**Alternatives rejected.** The fixer's own re-check as enough for `verified` (contradicts P5). A fix review for every deterministic finding (spends a judgement round on a result the tool already measures).
**Sources.** CONFLICT-REGISTER §4 O1 and CR-066 (decided 2026-10-01); P5; EVAL C12; IMP-032; 03 §3.3.

## ADR-031 — Soft-tell dispositions and the per-page rule

**Context.** QUALITY-BAR G4 asked for a disposition for every soft tell and allowed "at most 1 unaddressed soft tell per page" without defining "unaddressed", so the two clauses could not both be checked. QUALITY-BAR also brought every active or rising catalogue soft tell (SLP-20…49) under the rule, while `knowledge/anti-slop.md` said catalogue additions join it only when QUALITY-BAR lists them (CONFLICT-REGISTER §4 O2). Soft tells depend on context, so the gate has to accept a reasoned decision to keep one, record a disputed detection, and bound how many are simply left in place.
**Decision.** A soft-tell disposition is one of `fixed`, `accepted`, `disputed` or `deferred`. Accepted: recorded in `DESIGN.md` `ui-evaluator.accepted_tells` with a reason tied to the brief or the direction. Disputed: evidence that the detection is wrong, recorded on the finding (status `disputed`) until a reviewer settles it. Deferred: left in the shipped UI and logged in `debt.md` with an owner; a `wont_fix` soft tell not listed in `accepted_tells` counts as deferred. G4 passes when DEC-01…04 pass, there are 0 unaccepted hard tells, every soft tell has a disposition, and no page carries more than 1 deferred soft tell (distinct tell IDs). A soft tell with no disposition fails G4. Older wording "unaddressed" means "deferred". The rule covers every catalogue soft tell with status active or rising (SLP-20…49 in `knowledge/anti-slop.md`); experimental tells (SLP-50 and above) are reported as "possible" only and never count.
**Consequences.** QUALITY-BAR G4 and `knowledge/anti-slop.md` state one rule, and a catalogue addition counts as soon as its status is active or rising, without a QUALITY-BAR edit. Keeping a tell on purpose is an owner decision written where detectors and critics read it (P2). Deferred tells reach the debt register, so each has an owner and is revisited. The same edit moved the layout-density row of QUALITY-BAR §5 (PLAT-038) back inside its table (O11); that row concerns layout density, not tell density.
**Alternatives rejected.** No soft tell left at all (treats context-dependent signals as hard tells before their detectors reach precision ≥ 0.9). A QUALITY-BAR list as the only way in (two lists to keep in step, as O2 showed).
**Sources.** CONFLICT-REGISTER §4 O2 and O11, CR-014, CR-016, CR-020, CR-022, CR-043 (decided 2026-10-01); CRAFT-005, CRAFT-013, CRAFT-061; P2.

## ADR-032 — Operational definitions for MOT-04, CMP-03, CMP-06 and A11Y-11 in CJK

**Context.** Four gate criteria used terms that a check cannot compute (CONFLICT-REGISTER §4 O3, O5, O6, O8): MOT-04's "large-displacement"; CMP-03's "stay perceivable", and whether a primary submit disabled at rest fails it; CMP-06's "touch viewport" and "primary controls", and how its 8 px gap is measured; and A11Y-11, whose gate text applied the Latin large-text cut-off to CJK text while `knowledge/accessibility.md` §5 already sent part of it to the auditor. An undefined term gates on whatever a detector happens to do.
**Decision.**
- **MOT-04.** Large displacement: an animation or transition that, while running under emulated `prefers-reduced-motion: reduce`, translates an element by ≥ min(200 CSS px, one third of the viewport along that axis); scales an element whose box covers ≥ 25% of the viewport area by ≥ 1.25× or ≤ 0.8×; rotates an element by ≥ 90°; or moves content in response to scroll (parallax, scroll-linked transforms) by any amount.
- **CMP-03.** Fails only when a disabled control uses fewer than two cues, or is not perceivable: neither its label text nor its outline reaches 2:1 contrast against the adjacent background. WCAG exempts inactive components from 1.4.3 and 1.4.11; the 2:1 floor is UI-Evaluator's own, chosen so that common system disabled styles pass while near-invisible ones fail. A primary submit button disabled at rest does not fail CMP-03; the check emits it as a candidate finding under H1 and H9 (the person cannot tell what is missing) for normal verification and rating.
- **CMP-06.** Touch viewports are the matrix entries captured with touch emulation (`hasTouch`, `pointer: coarse`), by default every width below 1024 CSS px. Primary controls are a surface's primary action (from `PRODUCT.md` or `config.json`), controls used by journey steps, primary navigation items, form submit buttons and dialog action buttons; inline links in running text are excluded. The hit area is the element's border box, united with its associated `<label>` box for inputs. Each hit area is ≥ 44 × 44 CSS px, and the spacing, the shortest edge-to-edge distance between the hit areas of neighbouring primary controls, is ≥ 8 CSS px.
- **A11Y-11.** CJK text from 18 to 24 px that is not already large text by the bold rule, with contrast between 3:1 and 4.5:1, goes to the accessibility auditor instead of being auto-passed or auto-failed, and 1.4.3 is recorded as agent-judged whenever such text is in scope.

The MOT-04, CMP-03 and CMP-06 numbers are UI-Evaluator proposals and are marked [calibrating].
**Consequences.** The QUALITY-BAR rows and `knowledge/motion.md`, `components-states.md` and `accessibility.md` carry the same definitions, and the rulings that waited on them (CR-027, CR-033, CR-034, CR-049, CR-050) cite this record. MOT-19 stays the stricter advisory guidance. The disabled-at-rest candidate is a judged finding, so ADR-010's rule-declared severity does not apply to it: the verifier's convention rule (a convention is a defect only with evidence that the user gets no hint) and the blind raters decide it, which replaces the earlier default severity of 2. CMP-06 counts padding and a larger control size, but not a pseudo-element that extends the hit area beyond the border box. The A11Y-11 band changes no pass or fail threshold, it only routes text to the auditor, so the G2 row carries no [calibrating] tag and stays unwaivable (P11). The evaluation plan calibrates the new numbers.
**Alternatives rejected.** MOT-04: failing any transform-based movement under reduced motion (MOT-19's stricter position, which would also fail small feedback movements). CMP-03: the soft 3:1 floor proposed in note 05 (fails common system disabled styles). CMP-06: widths below 768 px as the only touch viewports (portrait tablets at the 768 px matrix width would escape). A11Y-11: a national CJK size (the research leaves it open, 08 §A9).
**Sources.** CONFLICT-REGISTER §4 O3, O5, O6, O8 and CR-027, CR-033, CR-034, CR-049, CR-050 (decided 2026-10-01); CRAFT-052, PLAT-084, TOOL-18; PLAT-053, CRAFT-053, 05 C18; PLAT-040, CRAFT-047, TOOL-13, 08 A5; TOOL-14, 08 A9; WCAG 2.2 SC 1.4.3 and 1.4.11.

## ADR-033 — Identity of grouped tool findings

**Context.** FRAMEWORK §4.3 defined identity as criterion + location + normalised snippet, but `uie findings merge` groups a rule's tool hits on one route into one finding with a location list, and `multiple_locations` findings carry several anchors. Which location the fingerprint used was undefined, so a partial fix could show as one finding cleared and another introduced instead of one finding partly fixed (CONFLICT-REGISTER §4 O4). Identity exists to stop count-like illusions of this kind [03 §3.3].
**Decision.** A deterministic finding is one rule on one route (rule × route). Its identity is the rule ID plus the normalised route, independent of how many instances it lists. A re-run in which the rule still fires on that route with fewer instances reports the finding as `persisting` with instance counts (k of n instances cleared), shown as partially fixed, never as cleared plus introduced. New instances on the same route are recorded as introduced instances inside the persisting finding. Judged findings keep the identity criterion + location + normalised snippet.
**Consequences.** `uie diff` compares deterministic findings by rule and route, and their instances within them, so a fix that removes 7 of 10 contrast failures on a route reads as 7 of 10 instances cleared. A deterministic finding is cleared, and can become `verified` (ADR-030), only when no instance is left; a persisting finding that had been marked `fixed` is reopened, as a `partially_fixed` verdict would be. Introduced instances are listed under their finding, and the fix reviewer treats them as possible regressions of the fix that touched the route. FRAMEWORK §4.3, ARCHITECTURE §8.3 and §8.6, `methods/finding-records.md`, `methods/fix-loop.md` and the `verify` workflow use this definition.
**Alternatives rejected.** A root-cause key of criterion, route, component or token, and mechanism, with a sub-identity per location (O4's proposal; tool hits carry no mechanism key to build it from). The first listed location as the fingerprint (it changes with the order of the list and with a partial fix).
**Sources.** CONFLICT-REGISTER §4 O4 and CR-056, CR-062 (decided 2026-10-01); LOOP-023, LOOP-045; 03 §3.3.

## ADR-034 — DEC-04 compares against the project ledger

**Context.** DEC-04 did not name its ledger. ADR-013 makes the project ledger mandatory and the cross-project ledger opt-in and advisory, so DEC-04 could only read the project ledger, which is empty on a new project: the check passed vacuously and did not serve FRAMEWORK §11's aim of keeping the skill's own outputs apart (CONFLICT-REGISTER §4 O7).
**Decision.** DEC-04 compares the newest entry of the project ledger `.ui-evaluator/ledger.json` with the 3 entries before it. When the project ledger has no earlier entry, DEC-04 is `not_applicable` ("first direction in this project"); variety for a first direction comes from the seeded roll (ADR-013) and DEC-01…03. When the opt-in cross-project ledger `~/.ui-evaluator/ledger.json` exists, repeats found there are listed in the criterion's detail as advisory and never change its state, consistent with ADR-013.
**Consequences.** A first direction no longer shows a pass that compared nothing; the report gives `not_applicable` with its reason. With one or two earlier entries, DEC-04 compares against those. One client's history never gates another client's work (CR-005). Convergence of the skill's outputs across projects is watched by convergence monitoring (CRAFT-029), not by this gate. QUALITY-BAR DEC-04, FRAMEWORK §4.7 and §11, `methods/direction-process.md`, the `direct` workflow and `knowledge/anti-slop.md`, `brand-expression.md` and `typography.md` use this definition.
**Alternatives rejected.** Making the cross-project comparison gating once the owner opts in (one client's taste would gate another's work, which ADR-013 and CR-005 rule out). Passing DEC-04 on an empty ledger (a pass with nothing compared).
**Sources.** CONFLICT-REGISTER §4 O7 and CR-005, CR-014, CR-022 (decided 2026-10-01); ADR-013; CRAFT-010, CRAFT-029.

## ADR-035 — Appeal is judged, and gates G6

**Context.** The first build benchmark (`evals/results/build-benchmark-2026-10-01/`) built two pages with and without the skill. The skill's builds passed G1–G4 and carried no tells; the baselines failed several gates and carried hard tells. A blind comparator, run once in each presentation order, still preferred the baselines on beauty, on distinctiveness and overall, in 6 of 6 order-consistent verdicts, and called the skill's pages plain and unfinished. Three causes were found in the skill itself. First, the G6 rubric scored only classical aesthetics (clear, ordered, consistent, restrained). Perceived visual aesthetics has a second dimension, expressive aesthetics (creative, fascinating, original), so a clean but bare page could score well on every criterion. Measures of visual appeal also count richness, colourfulness and craftsmanship beside simplicity. Second, `build` step 11 always removed decoration and never asked whether the page looked finished. Third, the direction process treated the category's own materials as off-limits, and when it chose without the owner it scored only fit and convergence risk. Both directions in the benchmark were therefore defined by what they avoided. The calligraphy page refused rice paper, cinnabar and seals and shipped in pure grey; the repair-cafe page abandoned the luggage tag it started from and ruled out icons and shadows. "Restraint is not emptiness" existed only as a cap on the Restraint score.
**Decision.** (1) The rubric gains a seventh criterion, **Appeal**, scored 0–4 with written anchors in `methods/design-panel.md`. Its evidence is whether the page looks finished and cared for, whether it has visual interest suited to its mode, whether colour does work, and whether the audience would find it attractive. (2) Each critic writes an **appeal verdict** of `appealing`, `plain` or `unappealing` in its verdict file before detector output is unsealed, with the signs of unfinish it saw. New criterion **DES-07** passes when a majority of critics judge the design `appealing`. Like DES-02 and DES-04, it is a categorical verdict that requires a majority, never a score threshold (P7). (3) The `build` restraint pass becomes a two-sided **finish pass**: fix what looks unfinished, then remove decoration that has no job. (4) Off-limits means the category's generic execution, not the subject's own materials. A subject's materials used with the product's specifics are a referent, and when a detector flags them, they are accepted in `DESIGN.md` with that reason. (5) A non-interactive choice of direction also rates appeal to the audience, and never prefers a direction because it is the least likely to look familiar. (6) Missing facts are written around, and labelled placeholders stay out of the first viewport and off the primary action. (7) Quick audits include one design critic, whose output is feedback and not a G6 verdict.
**Consequences.** G6, and with it L2, can now fail a page that is clean but bare. Builders are asked to look at their own captures and improve them, which is not certification: the verdict still comes from isolated critics (P5). QUALITY-BAR G6 and its rubric line, `methods/design-panel.md`, `evaluators/design-critic.md`, `methods/direction-process.md`, the `build`, `direct` and `audit` workflows, `knowledge/brand-expression.md`, `knowledge/anti-slop.md` (SLP-21) and `knowledge/content-copy.md` state the same rules. The `critic-verdict` and `panel` schemas gain `appeal`, and `uie gates` evaluates DES-07. Verdict files written before this change have no appeal verdict, so DES-07 is `not_run` for them until the panel is re-run.
**Alternatives rejected.** A detector for visual richness (no reliable measure exists, and one would reward clutter). A numeric appeal threshold (judged scores drift across rounds and raters; P7). A pairwise comparison of every build against an unconstrained build (it doubles the cost of a build; it remains available as a benchmark method).
**Sources.** Build benchmark 2026-10-01 (`evals/results/build-benchmark-2026-10-01/`); Lavie & Tractinsky, IJHCS 60(3), 2004, https://doi.org/10.1016/j.ijhcs.2003.09.002; Moshagen & Thielsch, IJHCS 68, 2010, https://doi.org/10.1016/j.ijhcs.2010.05.006; Hekkert et al. 2003 and Tuch et al. 2012 (already cited in `methods/design-panel.md`); DSL-080; CR-006.

## ADR-036 — A finding can wait on a named person's decision

**Context.** Some fixes need a decision only the owner, or someone the owner names, can make: which system owns a setting, what a fault message should tell staff to do, whether a backend exists. Deferral and won't-fix are owner decisions (`methods/finding-records.md` §3.8), and a P0 cannot be deferred to pass USE-05 [LOOP-058]. In the agent-level round of 2026-10-06 (`evals/results/agent-evals-2026-10-06/`, eval 11) the fix loop reached such a P0: the dashboard's manual dosing mode reverts on reload, and the page cannot know what the pump controller does. The lead declined to guess a fix and asked the owner in its reply. The register could only show the finding as `open`, the same as one nobody had looked at; the question lived only in chat; and the grader's check that every P0 and P1 has an outcome failed although the lead had made the right call. Three raters rated the problem major (3).
**Decision.** (1) A new status, `blocked`, means the finding cannot move until a named person decides something. Entering it records who must decide and the question, `uie findings set <id> --status blocked --on <who> --question <text>`, stored as `blocked {on, question, since, by}` and in the status history. (2) It may be entered from `confirmed`, `open`, `in_progress` or `reopened`, at any priority including P0, by the lead: it records a question, not a decision. (3) It leaves through the answer, recorded with `--answer <text>` in `blocked.answer`: back to `open` or `in_progress` (lead), or to `deferred`, `wont_fix` or `dismissed` when the answer is that decision (owner, with the records those transitions already require). (4) For the gates a blocked finding is still open. USE-05 counts a blocked P0, USE-06 counts a blocked P1 as undecided, and the critical-journey and severe-design checks count it too, so blocking passes no gate; it only makes the wait visible. (5) `uie findings queue` lists blocked findings first, as waiting on the named person with the question, and never as items to fix now. The report lists them in its verdict and as the first next step, so the question reaches the person who can answer it.
**Consequences.** The finding schema gains the status and the `blocked` object. QUALITY-BAR USE-05, `methods/severity-rating.md`, `methods/finding-records.md` §3.8, FRAMEWORK §8.2, `methods/fix-loop.md`, the `fix` workflow and ARCHITECTURE §7.2 say the same. A blocked finding can wait across runs; nothing expires it, because an expiry would make a decision nobody took. Registers written before this change have no blocked finding, so no earlier result changes.
**Alternatives rejected.** Letting the lead defer a P0 with a question attached (deferral is the owner's decision, and the finding would read as decided). A note on an open finding (the queue, the gates and the report could not tell it apart). A block that lapses into deferral after a set time (it would record a decision nobody made).
**Sources.** Agent-level round 2026-10-06, eval 11 (F-0022) and the round's report §8; LOOP-058; ADR-020; ADR-030.

## ADR-037 — Splitting a finding is a recorded command

**Context.** Verification keeps one problem per record: a candidate that bundles several problems gets the verdict `split_required`, and the lead splits it into candidates that go through the chain one by one (`methods/verification.md`). No command did this. In the agent-level round of 2026-10-06 (eval 11) the lead wrote the parts by hand as new candidates in an evaluator's output, re-merged, which resets every status and verdict in the run, re-applied the earlier verdicts and sent the parts back to a verifier. Hand-edited outputs lose the record of which evaluator reported what, and the next re-merge would have brought the bundled candidate back. Three raters rated the problem minor (2).
**Decision.** (1) `uie findings split <id> --into <parts.json> [--run <id>]` replaces a `candidate` or `confirmed` finding in the run's merged findings with two or more parts. Each part gives at least a title and a description; criteria, locations, evidence, scope and problem type default to the original's. The parts keep the original's sources (`found_by`, `merged_from`, detection), get new IDs from the register's counter and `split_from`, and start as candidates, so each is verified on its own. (2) The original takes the new terminal status `split`, with `split_into` naming the parts. It leaves the verifier packet, the ratings, the gates and the register. (3) The split is recorded in `runs/<id>/splits.json`, and `uie findings merge` re-applies recorded splits after a re-merge, matching the original by fingerprint, so a re-merge never brings a split finding back and the parts keep their IDs. (4) A finding that has been rated, or has moved further, is not split: its severity belongs to the whole problem, and its parts would carry severities no rater gave. A new audit finds the parts instead.
**Consequences.** The finding schema gains the `split` status, `split_from` and `split_into`. `methods/verification.md`, `evaluators/finding-verifier.md`, `methods/finding-records.md` §3.8, FRAMEWORK §8.2 and ARCHITECTURE §7.2 describe the command. The parts inherit the original's evaluators, so detection k of N does not change; each part's evidence is the original's until its own verification adds more.
**Alternatives rejected.** Having the verifier write the parts (the verifier judges and the lead edits, which keeps the roles apart). Splitting by editing the evaluators' outputs (it changes another role's record). Allowing a split at any status (it would split a severity the raters gave to the whole).
**Sources.** Agent-level round 2026-10-06, eval 11 and the round's report §8; `methods/verification.md` (one problem per record); METHODS §5.
