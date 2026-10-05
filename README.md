# UI-Evaluator

**An Agent Skill and Claude Code plugin that builds, audits and fixes web front ends to a verifiable bar: usable, accessible (WCAG 2.2 AA), well crafted, and free of the generic AI-generated look.**

[中文说明](README.zh-CN.md) · [Documentation map](docs/README.md) · [Framework](docs/framework/FRAMEWORK.md) · [Quality bar](docs/framework/QUALITY-BAR.md)

---

## What it does

Ask your coding agent to build, review, polish or fix a web page, app screen or component, and UI-Evaluator gives it a method instead of taste alone:

- **Build** from product context, not from defaults. `PRODUCT.md` records who the users are and what each surface is for. `DESIGN.md` (Google's design.md format) records tokens and decisions. A seeded direction roll and a ledger keep new work from converging on the same look.
- **Audit** like a usability lab would. The agent runs deterministic browser checks (axe, keyboard, contrast on the composited background, layout, motion, targets, tells), then spawns isolated evaluators: three or more heuristic evaluators, cognitive walkthroughs per persona and journey, a design panel and an accessibility auditor. A verifier re-checks every candidate finding against the rendered UI. Severity is rated blind by at least three raters.
- **Bring in real users.** Usability-test notes, survey answers, tickets, reviews and stakeholder sheets are imported and scrubbed of personal data, themed with prevalence, and linked to findings, which raises their evidence level and triggers re-rating. Study statistics (SUS, SEQ, UMUX-Lite, adjusted-Wald intervals, A/B sizing, sample-ratio checks, Krippendorff's α) are computed by script, never by hand.
- **Fix one thing at a time.** The queue is ordered by priority, then dependency layer, then ease. Each fix is re-tested and committed, and a fresh reviewer who did not make the fix confirms it. Loops have budgets and a risk stop.
- **Report honestly.** Reports are generated from the run's files. A language lint blocks "users struggle…" without observed evidence, causal claims without an experiment, and any claim of completeness or WCAG conformance.

## What "100%" means here

No process can prove beauty. UI-Evaluator turns the aim into the strongest claims that can be checked, and refuses to claim more:

| Level | Name | What has been shown |
|---|---|---|
| L1 | Machine-verified | every deterministic check passes: evidence integrity, functional integrity, automatable WCAG 2.2 AA, the measurable craft floor, zero unaccepted AI tells |
| L2 | Panel-reviewed | L1, plus isolated evaluators and a design panel found no open severe problem and judged the design specific to this product and appealing to its audience |
| L3 | Human-confirmed | L2, plus a person confirmed the needs-human WCAG checks, the severe findings and the design verdict |
| L4 | User-validated | L3, plus formative tests with real users met the task criteria, with every severe observed problem fixed and re-tested |

Each criterion is `pass`, `fail`, `not_run`, `not_applicable`, `degraded` or `waived`. `not_run` never counts as a pass. The full bar is in [QUALITY-BAR.md](docs/framework/QUALITY-BAR.md).

## Install

**Claude Code (plugin, recommended).** Adds the skill, nine slash commands, nine isolated subagents and an optional lint hook. In a Claude Code session:

```
/plugin marketplace add Horace-Maxwell/UI-Evaluator
/plugin install ui-evaluator@ui-evaluator
```

**Any Agent Skills client** (Claude Code, Codex, Cursor, Gemini CLI and others): copy or link `skills/ui-evaluator/` into the client's skills folder, or use the skills installer:

```bash
npx skills add Horace-Maxwell/UI-Evaluator
```

**Requirements.** Node.js 20 or newer. The core CLI has no dependencies. Browser checks use Playwright with Chromium; the skill asks before installing them and runs `uie doctor --install` only with your agreement. Without a browser it still works from source code and screenshots, and says which checks it could not run.

## Use

Talk to your agent normally. The skill triggers on requests such as:

- "Build a booking page for our clinic. Here's what it needs to do…"
- "Review this dashboard for usability and accessibility before we ship."
- "这个页面看起来很像 AI 做的，帮我改得有设计感一点。"
- "Here are the notes from five usability sessions. What should we fix first?"
- "Is this ready to ship?"

In Claude Code you can also call a workflow directly:

| Command | Workflow |
|---|---|
| `/ui-evaluator:setup` | product context, tooling, `PRODUCT.md`, journeys, scope |
| `/ui-evaluator:direct` | design direction for new work: candidates, seeded roll, convergence tests, locked `DESIGN.md` |
| `/ui-evaluator:build` | build to the floor: tokens first, full states, copy, responsive, accessibility, motion last |
| `/ui-evaluator:audit` | evidence, deterministic checks, isolated evaluators, verification, blind rating, gates, report |
| `/ui-evaluator:study` | plan a usability test, survey or experiment |
| `/ui-evaluator:ingest` | user feedback and study results into themes, linked findings and re-rated severity |
| `/ui-evaluator:fix` | one verified fix at a time from the prioritised queue |
| `/ui-evaluator:verify` | run diff, fix review, regression check, gates |
| `/ui-evaluator:report` | the honest report and the stakeholder agree/disagree sheet |

## The `uie` command line

The agent runs the bundled CLI (`node skills/ui-evaluator/scripts/uie.mjs`, called `uie` below). You can run it too:

| Command | What it does |
|---|---|
| `uie doctor [--install]` | check Node, the browser runtime and the smoke test |
| `uie init` · `uie detect` | scaffold `.ui-evaluator/`; scan the project's stack, tokens and routes |
| `uie capture` · `uie audit` · `uie probe` · `uie journey` | screenshots and ARIA snapshots; deterministic page checks; scripted interactions; journey replay |
| `uie lint` | static source scan for tells, motion, token drift and accessibility source rules |
| `uie packet` | build the input packet for each isolated role |
| `uie findings …` | validate, merge, verify, rate, promote, queue, link and close findings |
| `uie gates` · `uie report` | criterion and gate states and the assurance level; the report with its language lint |
| `uie tokens check\|extract` | check `DESIGN.md` values; draft an as-built `DESIGN.md` from shipped source |
| `uie roll` · `uie ledger` | seeded direction deal; the variety ledger |
| `uie feedback import\|stats\|set\|themes\|selftest` | import and scrub feedback; counts; themes |
| `uie study …` | outcomes, CIs, SUS, SEQ, UMUX-Lite, TLX, sample sizes, A/B sizing, SRM, RITE, Krippendorff's α |

Run `uie <command> --help` for options. Everything the CLI writes lives in `.ui-evaluator/` in your project. Screenshots, packets and raw feedback are git-ignored by default.

## How it avoids the AI look

The generic look comes from defaults that nobody decided. The skill makes decisions visible and checkable:

1. **Context first.** Each surface has one job and one mode (persuade, operate, read, experience) in `PRODUCT.md`. A brand is described as three to five "X, not Y" attributes.
2. **Directions from the audience's world,** not from the model's favourite. `uie roll` deals three directions with a seed: one from beyond the model's top two, the model's own pick with a familiarity note, and the conventional option. Swap, category and similarity tests decide.
3. **Tells are named and counted.** A catalogue of AI tells (gradient text, tracked-caps eyebrows on every section, three equal icon cards, invented social proof, bounce easing on UI state…) is checked in code and in the render. Hard tells must be absent. Soft tells need a decision: fixed, accepted in `DESIGN.md` with a reason, disputed or deferred.
4. **Isolated critics** judge specificity, brand fit and appeal from screenshots before they may see detector output, and never see the builder's rationale.
5. **A ledger** stops the next project from repeating the last one's display face and page structure.
6. **Not bare either.** Avoiding defaults must not leave a page empty. The build ends with a finish pass, and the critics' appeal verdict fails a page that is clean but plain. The subject's own materials, such as a calligraphy class's paper and seal, are treated as references to use with the product's specifics, not as tells to avoid ([ADR-035](docs/framework/DECISIONS.md#adr-035--appeal-is-judged-and-gates-g6)).

## Repository layout

```
skills/ui-evaluator/      the portable skill: SKILL.md, references (workflows, methods, knowledge,
                          evaluator roles, templates), scripts (uie CLI), assets (schemas, rules, data)
agents/                   Claude Code subagents generated from the evaluator roles
commands/  hooks/         Claude Code slash commands and the optional lint hook
.claude-plugin/           plugin manifest and marketplace entry
docs/framework/           the specification: framework, quality bar, methods, architecture, decisions,
                          conflict register, authoring rules, evaluation plan, traceability, glossary
docs/research/            the evidence base: eleven research notes, 592 adopt items with sources
evals/  tests/  tools/    evaluation fixtures and prompts; unit and integration tests; maintenance scripts
```

## Develop

```bash
npm test
```

```bash
npm run validate
```

`npm test` runs the core tests (no dependencies). `npm run validate` checks packaging, links, agents and rules against the specification, and research traceability. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Status

Version 2.0.0. Thresholds marked **[calibrating]** in the quality bar are initial values that the [evaluation plan](docs/framework/EVALUATION-PLAN.md) measures and revises by decision record.

What has been measured, in brief (details, data and caveats in [evals/README.md](evals/README.md#results)):

- **Detectors work on their seeded cases.** The audit and lint ran on six fixtures at 320, 768 and 1280 px. They found all 51 deterministic seeded defects and reported 0 false positives on the clean control page. The fixtures are small, so these numbers do not estimate precision on real sites.
- **The skill reliably lifts what it can verify.** Over four build iterations on four prompts (14 runs with the skill, 8 without), the skill's builds carried no hard AI tells, passed the automated WCAG checks, invented no contact details, prices or testimonials, and met 90–100% of the brief and gate assertions. Builds without the skill met 0–64%, often carried hard tells, and several invented phone numbers, addresses or house rules.
- **It does not yet reliably win on looks.** In blind pairwise judgements by the project owner, the most recent round (8 pairs) preferred the builds made without the skill as more beautiful in 6 of 8, as less template-like in 5 of 8, and to publish in 5 of 8. Runs vary widely: the same calligraphy prompt won all three questions in one run and lost all three in two others. Model judges (Claude) agreed with the person on beauty in 7 of 8 pairs in that round, but credited the skill's concepts as less generic more often than the person did.
- **The cost is roughly 2.7 times the tokens and 2.3 times the time** of an unaided build (medians: about 860k tokens and 94 minutes, against 315k and 41 minutes), mostly spent on audits, gates and records.

These are one judge, small samples and one model family. The [decision records](docs/framework/DECISIONS.md) (ADR-035 onward) say what changed after each measurement.

## Licence and acknowledgements

Apache-2.0. UI-Evaluator builds on published research and on ideas from open-source design and evaluation skills; sources, licences and attributions are listed in [NOTICE.md](NOTICE.md) and in each research note. The methodological backbone follows Alexandra Ion's lecture *Evaluation: Analytical vs Empirical* (Carnegie Mellon University, HCII).
