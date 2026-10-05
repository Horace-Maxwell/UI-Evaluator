# Architecture

| | |
|---|---|
| Version | 2.0.0 (2026-10-04) |
| Status | Normative for structure, file formats and the CLI contract. Implementation details may change as long as these contracts hold. |
| Parent | [FRAMEWORK](FRAMEWORK.md) |

## Contents

1. [Design goals](#1-design-goals)
2. [Repository layout](#2-repository-layout)
3. [The skill package](#3-the-skill-package)
4. [Progressive disclosure budget](#4-progressive-disclosure-budget)
5. [Workflows and routing](#5-workflows-and-routing)
6. [Agents](#6-agents)
7. [The `uie` CLI](#7-the-uie-cli)
8. [Data model](#8-data-model)
9. [Evidence pipeline](#9-evidence-pipeline)
10. [Enforcement: hooks and gates](#10-enforcement-hooks-and-gates)
11. [Harness integration](#11-harness-integration)
12. [Dependencies and licences](#12-dependencies-and-licences)
13. [Security and privacy](#13-security-and-privacy)
14. [Testing and release](#14-testing-and-release)

---

## 1. Design goals

| Goal | Consequence |
|---|---|
| One source tree, every harness | The canonical skill lives at `skills/ui-evaluator/` and uses only Agent Skills spec fields [PKG-01/02]. Claude Code extras (plugin, agents, hooks, commands) wrap it and are never required |
| Mechanisms over prose (P13) | Everything that must happen is a CLI command, schema or gate. The skill's prose tells the agent *which command to run* and *why* |
| Independence by construction (P5) | Role-specific input packets are built by a script, not hand-assembled by the lead, so a black-box evaluator cannot receive source by accident |
| Zero-dependency core | Findings, rating, gates, reports, statistics, the roll and source lint run on the Node.js standard library only. Only browser work (capture, page audit, probe, journey replay, visual diff) needs Playwright and axe-core |
| Deterministic, reproducible runs | Seeds, pinned engine versions, a capture recipe and run manifests make runs comparable [TOOL-25/40] |
| Small always-loaded footprint | `SKILL.md` is a router (< 500 lines). Depth is loaded on demand [PKG-06] |

## 2. Repository layout

```
UI-Evaluator/
├── .claude-plugin/
│   ├── plugin.json              # Claude Code plugin manifest (name: ui-evaluator)
│   └── marketplace.json         # makes the repo installable as a marketplace
├── skills/
│   └── ui-evaluator/            # THE canonical skill (portable)
├── agents/                      # Claude Code subagents, generated from skills/ui-evaluator/references/evaluators/
├── commands/                    # thin slash-command wrappers: /ui-evaluator:audit etc.
├── hooks/
│   └── hooks.json               # PostToolUse lint hook (silent outside opted-in projects)
├── docs/
│   ├── README.md                # map of all documentation
│   ├── OVERVIEW.zh-CN.md        # Chinese overview
│   ├── research/                # evidence base (00–10) + index
│   └── framework/               # this specification set
├── evals/
│   ├── evals.json               # skill-creator eval prompts and assertions
│   ├── fixtures/                # seeded-defect apps and pages, feedback datasets
│   └── labels/                  # human labels for detector calibration
├── tests/                       # node:test unit and integration tests
├── tools/                       # repo maintenance: sync-agents, validate-skill, check-traceability
├── README.md · README.zh-CN.md · LICENSE (Apache-2.0) · NOTICE.md · CHANGELOG.md · CONTRIBUTING.md
└── package.json                 # dev scripts only (test, validate, sync)
```

## 3. The skill package

```
skills/ui-evaluator/
├── SKILL.md                     # frontmatter (spec fields only) + router + core rules
├── agents/openai.yaml           # Codex UI metadata (optional, ignored elsewhere)
├── references/
│   ├── workflows/               # setup, direct, build, audit, study, ingest, fix, verify, report
│   ├── evaluators/              # role prompts: heuristic-evaluator, walkthrough-evaluator,
│   │                            #   design-critic, accessibility-auditor, code-reviewer,
│   │                            #   finding-verifier, severity-rater, fix-reviewer, direction-designer
│   ├── methods/                 # heuristic-evaluation, cognitive-walkthrough, severity-rating,
│   │                            #   finding-records, verification, design-panel, direction-process,
│   │                            #   fix-loop, usability-testing, surveys-metrics,
│   │                            #   experiments-analytics, feedback-analysis
│   ├── knowledge/               # principles, heuristics, typography, color, layout, shape-depth,
│   │                            #   motion, components-states, content-copy, accessibility,
│   │                            #   anti-slop, brand-expression, cjk, platforms, data-display, ai-features
│   └── templates/               # PRODUCT.md, DESIGN.md, journey, study plan, moderator guide,
│                                #   consent, task card, observation sheet, feedback import,
│                                #   report, agree-disagree sheet, debt register
├── scripts/
│   ├── uie.mjs                  # single CLI entry point
│   ├── package.json             # pinned runtime dependencies (browser layer)
│   └── lib/                     # implementation modules (see §7)
└── assets/
    ├── schemas/                 # JSON Schemas for every file format (§8)
    ├── data/                    # rules.json, tells.json, saturated-faces.json, words-*.json,
    │                            #   heuristics.json, wcag22.json, reaction-cards.json, direction-pools.json
    └── fixtures/                # known-bad page + expected detections for the doctor smoke test
```

Rules for the package:

- `SKILL.md` frontmatter uses only `name`, `description`, `license`, `compatibility` and `metadata` [PKG-02]. `name: ui-evaluator` matches the directory.
- References are linked **one level deep** from `SKILL.md`, with explicit "read X when Y" pointers. Workflow files may point to methods, knowledge and templates by relative path. They never chain further [PKG-06].
- Every reference file over 100 lines starts with a table of contents.
- `agents/` at the repository root is **generated** from `references/evaluators/` by `tools/sync-agents.mjs`. The evaluator files are the single source of truth. A test fails if the two drift.

## 4. Progressive disclosure budget

| Layer | Loaded when | Budget |
|---|---|---|
| Frontmatter `description` | always (skill listing) | ≤ 600 characters; trigger phrases first [PKG-05] |
| `SKILL.md` body | on activation | ≤ 500 lines (target ≈ 300) |
| One workflow file | when that workflow runs | ≤ 400 lines |
| Method, knowledge and template files | when a workflow step names them | ≤ 500 lines each |
| Evaluator prompt | inside the subagent only | ≤ 300 lines |
| Script source | never (scripts are run, not read) | — |
| Script output | per command | concise by default; `--json` for machine use; long output written to files and summarised |

The lead's own context is protected by having subagents write results to files and return only a short summary with counts and paths.

## 5. Workflows and routing

`SKILL.md` contains a routing table: request intent → workflow sequence (as in [FRAMEWORK §5.3](FRAMEWORK.md#53-routing)), the input situation (§14 of the framework), the depth, and the target level. Each workflow file has the same structure:

1. **Purpose** and **when to use**
2. **Preconditions**, each with the command that checks it and the workflow that satisfies it
3. **Inputs** and **outputs** (exact paths)
4. **Steps**, numbered, each naming the command to run or the role to spawn, with the reason
5. **User checkpoints**: where to ask, and what to ask
6. **Exit criteria**, tied to gate IDs
7. **Degraded operation**: what changes without subagents, without a browser or without source
8. **Common failure modes** and how to recover

## 6. Agents

### 6.1 Roster

| Agent (Claude Code name) | Role file | Box | Tools | Writes |
|---|---|---|---|---|
| `ui-evaluator:heuristic-evaluator` | `heuristic-evaluator.md` | black | Read, Bash (`uie probe`, `uie findings validate`), Write | `runs/<id>/evaluators/he-<n>.json` |
| `ui-evaluator:walkthrough-evaluator` | `walkthrough-evaluator.md` | black | Read, Bash, Write | `runs/<id>/cw/<journey>.json` + candidates |
| `ui-evaluator:design-critic` | `design-critic.md` | black | Read, Bash (packet unlock only), Write | `runs/<id>/panel/critic-<n>.json` |
| `ui-evaluator:accessibility-auditor` | `accessibility-auditor.md` | grey | Read, Bash, Write | `runs/<id>/evaluators/a11y.json` |
| `ui-evaluator:code-reviewer` | `code-reviewer.md` | white | Read, Grep, Glob, Bash, Write | `runs/<id>/evaluators/code.json`; ease-of-fix estimates |
| `ui-evaluator:finding-verifier` | `finding-verifier.md` | black | Read, Bash, Write | `runs/<id>/verifier.json` |
| `ui-evaluator:severity-rater` | `severity-rater.md` | black | Read, Write | `runs/<id>/ratings/rater-<n>.json` |
| `ui-evaluator:fix-reviewer` | `fix-reviewer.md` | black | Read, Bash, Write | `runs/<id>/fix-review.json` |
| `ui-evaluator:direction-designer` | `direction-designer.md` | — | Read, Bash, Write | `.ui-evaluator/directions/<dir-id>/` |

"Black box" means the role reads only its packet (§8.4) and the live UI through `uie probe`. The prompt forbids reading source, and the packet contains no source paths.

### 6.2 Spawning

- **Claude Code with the plugin:** the lead spawns the named agents, passing the packet path and output path. Independent agents start in parallel (a standard audit spawns about 9 evaluators, then 3 raters).
- **Claude Code without the plugin:** the lead spawns general-purpose subagents with the instruction "Read `<skill-dir>/references/evaluators/<role>.md` and follow it; your packet is `<path>`". Isolation is the same.
- **Harnesses without subagents:** the lead performs each role sequentially, reading only the packet for that role, and marks the outputs `DEGRADED: single-context`. Where an isolated CLI is available and the owner opts in (`claude -p`, `codex exec`, `gemini -p`), `uie` can run a role in a separate process for real isolation. The provider is recorded.
- Models: by default agents inherit the lead's model. Rigorous depth assigns different model configurations per evaluator and records them [HCI-027].

### 6.3 Agent output contract

Every agent writes a schema-valid JSON file, validates it with `uie findings validate <file>`, and returns at most about 10 lines: counts, the output path and any blocking problem. It never returns its full findings in chat.

## 7. The `uie` CLI

`uie` means `node <skill-dir>/scripts/uie.mjs`. Every command prints `--help`. All paths are resolved against the project root, found by walking up from the current directory to `.ui-evaluator/` or, failing that, `package.json`.

### 7.1 Conventions

- **Exit codes:** `0` success and clean; `2` ran successfully and found problems (findings, failed gates, level not reached); `1` could not run (bad input, missing tool, crash). This matches the impeccable detector contract, so "0 findings" can never hide a crash [IMP-049].
- **Output:** a human-readable summary on stdout. `--json` prints machine-readable output. Large results go to files, and their paths are printed.
- **Run selection:** `--run <id>`, or `latest` by default (`.ui-evaluator/runs/LATEST`).
- **Determinism:** every random choice takes `--seed`. Every run writes a manifest.
- **Network:** the browser layer only opens `localhost`, `127.0.0.1`, `[::1]` and `*.localhost` URLs unless `--allow-remote` is passed.

### 7.2 Commands

| Command | Purpose | Key outputs | Needs browser |
|---|---|---|---|
| `uie doctor [--install] [--json]` | Check Node ≥ 20, dependencies and the Chromium binary; run the smoke test on the known-bad fixture; `--install` installs pinned runtime deps into the runtime cache after the owner agrees | doctor report; EVD-02 evidence | for the smoke test |
| `uie detect` | Pre-flight scan: framework, styling system, token sources, component libraries, routes, dev command and port, locales, existing `PRODUCT.md`/`DESIGN.md`, git state | `.ui-evaluator/preflight.json` | no |
| `uie init [--force]` | Scaffold `.ui-evaluator/` with config, `.gitignore`, ledgers, and templates for `PRODUCT.md`/`DESIGN.md` when absent. Never overwrites | workspace | no |
| `uie run new [--label]` | Open a run: freeze scope, create the run directory and manifest skeleton | `runs/<id>/manifest.json` | no |
| `uie capture` | Deterministic screenshots and ARIA snapshots over routes × states × widths × themes × emulations; CVD and forced-colour evidence | `evidence/screens`, `evidence/aria` | yes |
| `uie audit [--checks …] [--quick]` | Page audits: axe, keyboard walk, focus visibility and obscuring, dialog contract, reflow, text spacing, text resize, targets, contrast, forms probe, live regions, lang, cross-page consistency, style census, DOM tell detection, motion inspection, vitals | `tool-findings.jsonl`, `evidence/dom`, `evidence/axe` | yes |
| `uie lint [paths…] [--changed f]` | Static source scan: hard tells, token drift, motion rules, a11y source rules (outline removal, `user-scalable=no`, positive tabindex, down-event activation, single-key shortcuts), IME guard, CJK font stacks, restricted fonts, copy tells | findings on stdout or appended to the run | no |
| `uie packet --role <role>` | Build the role-specific input packet with only the materials that role may see | `runs/<id>/packets/<role>/` | no |
| `uie probe --url … --actions …` | Perform an interaction recipe and return screenshots, ARIA snapshot, console and network summary, and timing. Used by evaluators and the verifier to exercise behaviour | `runs/<id>/probes/<n>/` | yes |
| `uie journey <id>` | Replay a journey; check the success condition; record per-step evidence | `runs/<id>/journeys/<id>.json` | yes |
| `uie findings validate\|merge\|apply-verdicts\|rate\|queue\|set\|dismiss\|link\|list\|show\|agreement\|promote` | The findings lifecycle (§8.3). `set` changes status, ease of fix, criticality or notes with a recorded actor; `promote` copies a run's final findings into the living register | `merged.json`, `findings.json`, queue | no |
| `uie diff <base> <run> [--visual] [--aria] [--findings]` | Identity-based set difference (cleared, introduced, persisting; persisting deterministic findings carry instance counts and introduced instances, ADR-033), pixel diff with changed regions, ARIA snapshot diff | `runs/<id>/diff/` | for `--visual` |
| `uie gates [--target L1…L4]` | Compute every criterion state, gate state and the achieved level | `runs/<id>/gates.json` | no |
| `uie report [--format md,html,csv]` | Render the report and the agree/disagree sheet; lint report language | `report.md`, `report.html`, `agree-disagree.csv` | no |
| `uie study sus\|seq\|umux\|tlx\|ci\|time\|samplesize\|discovery\|ab\|srm\|rite\|desirability` | Study statistics (§9 of METHODS) | stdout / JSON | no |
| `uie roll --candidates <file> [--seed] [--deal 3] [--tiebreak a,b]` | Seeded direction deal from the candidate list (candidates may carry an `axis` for identity-lock variants), with structural parameters drawn from ledger-unused pools; `--tiebreak` picks one of several equally grounded options with the recorded seed | `directions/<dir-id>/roll-<seed>.json` | no |
| `uie ledger add\|list\|check` | Maintain and check the direction ledger (DEC-04): `check` compares the newest project-ledger entry with the 3 before it and lists repeats in the opt-in cross-project ledger as advisory (ADR-034) | `ledger.json` | no |
| `uie feedback import\|stats` | Normalise feedback files to the feedback schema, scrub personal data, compute counts | `feedback/feedback.jsonl` | no |
| `uie tokens check\|extract` | Validate `DESIGN.md` (structure, token references, contrast pairs); extract tokens from CSS or Tailwind config into a `DESIGN.md` draft | stdout / draft | no |
| `uie hook` | PostToolUse adapter for Claude Code (§10) | JSON on stdout | no |

**Audit check names.** `uie audit --checks <a,b,…>` selects checks. These names are canonical across the skill's references.

| Check | What it does | Criteria served |
|---|---|---|
| `routes` | loads each in-scope route and state; status and render timing | FUN-01 |
| `console` | collects console errors and page errors; parity vs baseline | FUN-02 |
| `media` | broken images, media and in-scope links; visible email and phone links with no target | FUN-04 |
| `axe` | axe-core with WCAG A/AA tags per state × width × theme; collects `incomplete` items | A11Y-01, A11Y-02 |
| `keyboard` | Tab and Shift+Tab walk; reachability, traps, order, focus visibility diff, focus obscured, context change on focus | A11Y-03, A11Y-04, A11Y-05, CMP-02 |
| `dialogs` | modal dialog contract probe | A11Y-06 |
| `layout` | overflow at every width, clipping and overlap, reflow at 320 px, text-spacing override, 200% text; compares the interactive inventory across widths (LAY-08) | FUN-05, FUN-06, A11Y-07, A11Y-08, A11Y-09 |
| `palette` | pixel colour-area measurement on screenshots with media masked | COL-03 (and advisory COL-17) |
| `targets` | target geometry with the SC 2.5.8 spacing test; primary-control hit areas and gaps on touch viewports (ADR-032) | A11Y-10, CMP-06 |
| `contrast` | computed and pixel-sampled text and non-text contrast in every theme; grey on chromatic surfaces; CJK text of 18–24 px at 3:1–4.5:1 listed for the accessibility auditor (ADR-032) | A11Y-11, A11Y-12, COL-02 |
| `forms` | empty and invalid submission probe; labels, error text and association, focus, `autocomplete`, paste | A11Y-13, A11Y-14, CPY-04 |
| `live-regions` | status messages after scripted async actions | A11Y-15 |
| `lang` | `lang` vs dominant script; regional Chinese tags | A11Y-16 |
| `cross-page` | navigation order, names of identical functions, help placement | A11Y-18 |
| `cvd` | colour-vision-deficiency and forced-colours captures for the accessibility auditor | A11Y-19 (agent-judged) |
| `census` | computed-style census and token conformance: sizes, families, weights, line heights, measure, tracking, colours, spacing, radii, shadows; advisory readings for tabular figures, synthetic CJK italics and stranded last words or characters | TYP-01…10, COL-01, COL-03, COL-04, LAY-01…05, SHP-01, SHP-02; advisory TYP-14, TYP-15, I18N-08, I18N-12 |
| `states` | forced pseudo-state diffs (hover, active, focus); disabled cues and the 2:1 disabled floor, with primary submits disabled at rest emitted as H1/H9 candidates (ADR-032); response feedback timing | CMP-01, CMP-03, CMP-04 |
| `motion` | CSS transitions and animations plus Web Animations; durations, easing, animated properties; re-render under reduced motion with the large-displacement limits (ADR-032); content visible at rest | MOT-01…07 |
| `tells` | DOM tell detectors | SLP-01…26 (DOM-detectable ones) |
| `copy` | rendered text: placeholder text, link text, case consistency, copy tells, generic CTA sets, fabricated-proof candidates | CPY-01…03, SLP-12…15 |
| `i18n` | CJK font resolution and regional families | I18N-01, I18N-02 |
| `vitals` | lab CLS, LCP and INP | FUN-07, FUN-08 |

`--quick` runs `routes, console, axe, keyboard, layout, contrast, census, tells, copy`. `uie lint` covers the static parts of A11Y-17, MOT-01/03/04/06, COL-01, LAY-01, TYP-05, I18N-01/03, CPY-01 and the source-detectable tells.

### 7.3 Module map (`scripts/lib/`)

`cli.mjs` (argument parsing, help) · `project.mjs` (root discovery, config, runs) · `deps.mjs` (runtime dependency resolution) · `schema.mjs` (minimal JSON Schema validator: type, required, enum, const, properties, additionalProperties, items, pattern, min/max, oneOf) · `findings/` (identity, merge, verdicts, rating, priority, queue, agreement, lifecycle) · `gates/` (criteria, levels) · `report/` (markdown, html, csv, language lint) · `study/` (statistics) · `roll/` (seeded PRNG, deal, pools, ledger) · `feedback/` (import, scrub) · `tokens/` (DESIGN.md parse, checks, extraction) · `lint/` (CSS/JSX/HTML/Vue/Svelte scanners, tell rules, copy rules) · `browser/` (launch, capture recipe, audits, probe, journeys, diff, source mapping) · `util/` (fs, hashing, colour maths, text).

### 7.4 Runtime dependency resolution

Browser-layer packages are resolved in this order:
1. `scripts/node_modules` (development checkout);
2. the runtime cache `$UIE_HOME/runtime/<deps-hash>/node_modules` (default `~/.cache/ui-evaluator`);
3. the target project's `node_modules` (only for `playwright`, if already present).

`uie doctor --install` installs into (2) with `npm install --prefix`, then installs Chromium through Playwright. The skill asks the owner before installing, stating the approximate download size. The target project's `package.json` is never modified silently [08 §4.2].

## 8. Data model

### 8.1 Project workspace

```
<project>/
├── PRODUCT.md                         # context (FRAMEWORK §4.2)
├── DESIGN.md                          # Google design.md format + UI-Evaluator sections
└── .ui-evaluator/
    ├── config.json                    # scope, app command, matrix, depth, target level, fix policy
    ├── preflight.json                 # output of `uie detect`
    ├── .gitignore                     # runs/, feedback/raw/, studies/*/data/ — evidence and personal data stay local
    ├── journeys/<id>.json
    ├── directions/<dir-id>/           # candidates, roll, contracts, specimens
    ├── runs/<run-id>/
    │   ├── manifest.json
    │   ├── evidence/{screens,aria,dom,axe,crops}/
    │   ├── packets/<role>/
    │   ├── probes/<n>/
    │   ├── tool-findings.jsonl
    │   ├── evaluators/*.json
    │   ├── cw/<journey>.json
    │   ├── panel/critic-<n>.json
    │   ├── merged.json
    │   ├── verifier.json
    │   ├── ratings/rater-<n>.json
    │   ├── findings.json              # run snapshot
    │   ├── fix-review.json
    │   ├── diff/
    │   ├── patches/                    # checkpoint mode: one patch per finding when commits are not allowed
    │   ├── gates.json
    │   └── report.md · report.html · agree-disagree.csv
    ├── runs/LATEST
    ├── findings.json                  # living register across runs
    ├── feedback/{raw/, feedback.jsonl, themes.json}
    ├── studies/<study-id>/{plan.md, tasks.md, consent.md, data/, results.json}
    ├── ledger.json
    ├── dismissals.json
    ├── waivers.json
    ├── debt.md
    └── index.md                       # append-only run and decision log
```

### 8.2 Schemas

Every machine-readable file has a JSON Schema in `assets/schemas/`, validated by `uie` on read and write.

| Schema | Describes |
|---|---|
| `config.schema.json` | project config: app start command, base URL, routes with mode and state recipes, matrix, locales, platform profile, depth, target level, evaluator models, fix policy, threshold overrides with reasons |
| `journey.schema.json` | persona, goal, scenario (no UI words), start state, success condition (selector, text or URL predicate), correct action sequence (probe actions), criticality, frequency |
| `finding.schema.json` | the finding record (§8.3) |
| `evaluator-output.schema.json` | an evaluator's candidate list plus metadata (role, model, packet hash, passes, coverage notes, not-assessable list) |
| `cw-record.schema.json` | a walkthrough: persona, task, action sequence, and per step the four answers, success or failure story, missing knowledge or feedback |
| `panel.schema.json` | a critic's specificity verdict with the three tests, its appeal verdict, rubric scores with anchors cited, design findings, brand-fit judgement, pairwise result |
| `verifier.schema.json` | per candidate: verdict (confirmed, rejected, needs_human), the verification-chain step that decided it, reproduction evidence |
| `rating.schema.json` | per rater: factor ratings, 0–4, validity, note per finding |
| `fix-review.schema.json` | per fix: `confirmed_fixed`, `partially_fixed` or `not_fixed` with evidence; regressions (≤ 3); disposition (recapture, rebuild, fix, ship) |
| `feedback.schema.json` | a feedback item: source, channel, date and timestamp, participant code, study, task, step, outcome (success, failure, assisted), intervention and prompted flags, UI version, route, verbatim quote, reporter's own severity scale, classification, linked findings, theme |
| `themes.schema.json` | a theme: name, definition, prevalence k/N, participants, supporting extracts, linked findings and heuristics, classification |
| `results.schema.json` | study results: per task success with CI, time geometric mean with CI, SEQ, questionnaire scores with CI, observed problems with k/n |
| `manifest.schema.json` | the run manifest (EVD-01) |
| `gates.schema.json` | criterion states with evidence pointers, gate states, achieved and target level, blocking criteria |
| `ledger.schema.json` | direction entries: date, project, brief hash, direction summary, faces, accent hue bucket, colour strategy, macrostructure (planned at lock time; DEC-04 compares these), optional measured macrostructure from the first audit (used for convergence monitoring, CRAFT-029), fold class, seed |
| `candidates.schema.json` | the direction candidate list submitted to `uie roll` |
| `tells.schema.json` · `rules.schema.json` | the data files for tells and gate rules (ID, statement, threshold, detection, reliability, status, first_seen, sources) |

### 8.3 The finding record

```jsonc
{
  "id": "F-0042",                       // stable within the project register
  "fingerprint": "sha1:…",              // judged: criterion + location + normalised snippet; deterministic: rule ID + normalised route (ADR-033); never line numbers
  "title": "Error message does not say how to fix the date",
  "description": "After submitting an invalid date the field shows 'Invalid'. The user needs to know the expected format.",
  "problem_type": "single_location",    // single_location | multiple_locations | overall_structure | missing_element
  "criteria": [
    { "kind": "heuristic", "id": "H9", "primary": true },
    { "kind": "rule", "id": "CPY-04" }
  ],
  "impact": "Users retry blindly; some abandon the booking.",
  "scope": { "persona": "first-time guest", "task": "book a table", "journey": "book-table",
             "route": "/book", "state": "error", "viewport": { "width": 375, "height": 812 },
             "theme": "light", "ui_version": "git:3f2c1e0" },
  "locations": [
    { "route": "/book", "state": "error", "selector": "#date-error", "bbox": [16, 412, 343, 20],
      "crop": "evidence/crops/F-0042-1.png", "snippet": "<p id=\"date-error\">Invalid</p>",
      "source": { "file": "src/BookingForm.tsx", "line": 88, "method": "data-insp-path", "confidence": "high" } }
  ],
  "evidence": [ { "type": "probe", "ref": "probes/7/", "detail": "typed 31/02, submitted" } ],
  "found_by": [ { "role": "heuristic-evaluator", "agent": "he-2", "model": "…", "method": "HE", "pass": 2 } ],
  "detection": { "k": 2, "n": 3 },
  "evidence_level": "E1",
  "severity": {
    "source": "raters",                 // raters | rule | provisional
    "ratings": [ { "rater": "r1", "frequency": 2, "impact": 2, "persistence": 1, "value": 3, "validity": "problem", "note": "…" } ],
    "mean": 2.67, "spread": 1, "divergent": false
  },
  "priority": "P1",
  "criticality": "critical",
  "ease_of_fix": 1,
  "recommendation": "Show the expected format (DD/MM/YYYY) and keep the typed value.",
  "validity": "confirmed",              // confirmed | needs_verification | trade_off | not_a_problem
  "status": "open",
  "status_history": [ { "status": "candidate", "at": "2026-10-01T10:00:00Z", "by": "he-2" } ],
  "verification": null,                 // filled by fix/verify: originating check, result, run, commit, reviewer verdict, regressions
  "links": { "feedback": [], "duplicates": [], "also_blocks": [] },
  "tags": ["forms", "copy"]
}
```

**Deterministic findings** (from `uie audit` and `uie lint`) use the same schema with `method: "tool"`, `evidence_level: "E1"` and `severity.source: "rule"`. Their severity comes from the rule's declared default in `rules.json`. They skip blind rating unless the owner disputes them. Judged findings (from evaluators, critics, the auditor and the code reviewer) always go through verification and blind rating (ADR-010). A check may also emit a candidate for judgement instead of a deterministic finding, such as the CMP-03 check's primary submit disabled at rest (H1, H9; ADR-032); such a candidate is verified and rated like any judged finding. The check writes its candidates to `evidence/<check>/candidates.json` and names that file in its `checks.json` entry (`candidates_file`). `uie findings merge` reads them as judged candidates found by `tool:<check>`; they merge with matching evaluator candidates but never count toward detection k of N or toward EVD-07.

### 8.4 Packets

`uie packet --role <role>` assembles exactly what a role may see:

| Role | Packet contents | Excluded |
|---|---|---|
| heuristic-evaluator, walkthrough-evaluator | context summary (users, tasks, context of use, modes), journeys, route list, screenshot index, inventory, probe instructions | source paths, `DESIGN.md` rationale, detector output, other evaluators |
| design-critic | context summary, `DESIGN.md` (attributes, strategy, tokens), screenshots across the matrix, baseline screenshots for pairwise comparison | detector output (sealed per critic: each critic's own sealed copy unlocks only after that critic's verdict file exists), builder notes, other critics' packets |
| accessibility-auditor | axe, keyboard, contrast and forms outputs, ARIA snapshots, CVD and forced-colour captures | builder notes |
| code-reviewer | lint output, census, source map hints, findings needing file:line | builder notes |
| finding-verifier | candidate findings (without who raised them), dismissal ledger, probe instructions | evaluator identities |
| severity-rater | confirmed findings with evidence and factor notes, blinded IDs, rating anchors | others' ratings, rule-suggested severities |
| fix-reviewer | baseline and current evidence for the listed findings, the diff, fix list | the fixer's narration |
| direction-designer | brief, references with DNA notes, its one dealt direction with structural parameters, the off-limits list | the other dealt directions and their elaborations |

Every packet records its content hash in the evaluator output, so EVD-07 can prove what each role saw.

### 8.5 Configuration, journeys and probe actions

The canonical shapes are the templates `references/templates/config.example.json` and `journey.example.json`, validated by `config.schema.json` and `journey.schema.json`. Keys beginning with `_` are human notes and are ignored everywhere.

- **Config** top-level keys:
  - `schema_version`;
  - `project {name, work: new|redesign|existing, ai_features}` (optional);
  - `app {start, cwd, base_url, ready_url, timeout_ms, env}`;
  - `routes[] {path, surface, mode, states[] {name, actions[]}, two_d_regions[], mask[]}`;
  - `matrix {widths, height, device_scale_factor, themes, preferences, g2_preferences}`;
  - `locales {list, default, switch}`;
  - `platform_profile`, `depth`, `target_level`;
  - `evaluator_models`, `fix_policy`;
  - `threshold_overrides[]`;
  - `privacy {scrub_pii, roster}` (optional);
  - `capture {clock}` (optional): the instant the frozen page clock shows, by default 10:00 UTC on the day the run was opened;
  - `audit {remote_assets}` (optional, default `true`): load a page's own remote assets (fonts, styles, images, media, scripts; GET only) so captures look as they do for visitors. Every other remote request (navigation, fetch, form post, non-GET) is blocked unless `--allow-remote` is given.
- **Journey:**
  - `id`, `title`, `criticality`, `frequency`;
  - `persona {group, knows[], does_not_know[], context}`, `goal`, `scenario`;
  - `start_state {url, auth, data, locale, viewport_width}`;
  - `success_condition {all[] | any[]}`, with predicates `{url}`, `{text, target?}` or `{target, state}`;
  - `correct_actions[]`.
- **Probe actions** (used by state recipes, journeys and `uie probe`). Each one is an object with an `action` and its parameters:
  - `goto {url}`;
  - `click {target}`, `dblclick {target}`, `hover {target}`, `focus {target}`;
  - `fill {target, value}`, `select {target, value}`, `check {target}`, `uncheck {target}`;
  - `press {key, target?}`, `tab {count?, shift?}`;
  - `scroll {target? | y}`;
  - `wait {ms | target, state?}`;
  - `expect {text, target?} | {url} | {target, state: visible|hidden|enabled|disabled|focused|checked}`;
  - `screenshot {name, full_page?}`;
  - `viewport {width, height?}`, `emulate {colorScheme?, reducedMotion?, forcedColors?}`.

  Targets are locators. `role=<role>[name="…"]`, `label=…`, `text=…`, `placeholder=…`, `testid=…` and `alt=…` map to Playwright's accessible locators; anything else is a CSS selector. Role-and-name targets are preferred because they also prove the control has an accessible name.

### 8.6 Tool hits and `checks.json`

Every browser check and `uie lint` appends **hits** to `runs/<id>/tool-findings.jsonl`. A hit has the shape of a finding (§8.3) with these fields fixed:
- `found_by: [{role: "tool", method: "tool", check: "<check name>", engine: {name, version}}]`;
- `evidence_level: "E1"`;
- `severity: {source: "rule", value: <rules.json default_severity, or the axe impact mapping critical 4 / serious 3 / moderate 2 / minor 1>}`;
- `gate` from `rules.json`;
- `criteria`: the primary criterion ID (e.g. `A11Y-11`) plus any WCAG success criteria (`{kind: "wcag", id: "1.4.3"}`);
- `evidence` with the measured value (`{type: "measurement", value, detail}`).

`uie findings merge` groups hits per criterion and route into one finding with a location list (LOOP-023). Each listed location is an instance. The finding's identity is the rule ID + the normalised route, however many instances it lists, and `uie diff` compares the instances inside it: fewer instances on a re-run means `persisting` and partially fixed (k of n instances cleared), and new instances on the route are introduced instances inside the same finding, never a new finding (ADR-033).

Each check also records its execution in `runs/<id>/checks.json`, as `{checks: {<name>: {state: ran|failed|skipped, at, partial, coverage: {routes, states, widths, themes}, engine: {name, version}, hits, errors[], …check-specific fields}}}`. Check-specific fields include, for example, `axe.incomplete` (the count of incomplete results) and `i18n.cjk_detected`. The gate engine reads `checks.json` to tell `pass` (ran, no hits) from `not_run` (never ran, or failed). A check that ran over less than the declared scope sets `partial: true`, which makes its criteria `degraded`.

Captures are written to:
- `evidence/screens/<route-slug>/<state>/<width>-<theme>[-<preference>].png`;
- `evidence/aria/<route-slug>/<state>/<width>-<theme>.yml`;
- `evidence/dom/<route-slug>/<state>/<width>-<theme>.json` (the interactive inventory: selector, role, name and box per control).

They are summarised in `manifest.captures {valid, invalid, items[]}`.

## 9. Evidence pipeline

1. **Capture recipe** [TOOL-25]: fixed viewport and DPR; `reducedMotion: 'reduce'` for stills (normal motion only in motion checks); animations disabled; caret hidden; clock frozen; fonts explicitly loaded, then `document.fonts.ready`; dynamic regions masked; full-page captures from the top; validity check (EVD-03).
2. **State recipes** from `config.json` (open menus, dialogs, tabs, error states, empty data), so that hidden content is audited [TOOL-03].
3. **Audits** in the order capture → axe → keyboard → layout stress → targets → contrast → forms → semantics → census → DOM tells → motion → vitals → cross-page [08 §4.3].
4. **Source mapping** for each element-level finding: `data-insp-path` (when code-inspector-plugin is present) → `__svelte_meta.loc` → Vue inspector → React owner stacks (bippy) → text-search fallback. Each records method and confidence [TOOL-31].
5. **Crops** are cut around each finding's bounding box, with margin, for the report.

## 10. Enforcement: hooks and gates

### 10.1 PostToolUse lint hook (Claude Code plugin)

```json
{
  "description": "UI-Evaluator: flag hard AI tells and craft-floor violations in edited UI files (active only in projects with .ui-evaluator/)",
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          { "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/skills/ui-evaluator/scripts/uie.mjs\" hook",
            "timeout": 15 }
        ]
      }
    ]
  }
}
```

Behaviour of `uie hook`:
- It reads the hook JSON from stdin and takes `tool_input.file_path` and `cwd`.
- It exits silently (code 0, no output) unless the file has a UI extension (`.css .scss .less .html .jsx .tsx .js .ts .vue .svelte .astro .mdx`) **and** the project contains `.ui-evaluator/config.json`. The hook is therefore inert in projects that never opted in.
- It lints only that file, with the fast rule subset (hard tells, motion rules, outline removal, token drift, restricted fonts, IME guard).
- When there are findings, it prints `{"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": "<≤ 1,500 chars: rule IDs, lines, one-line fixes>"}}` and exits 0.
- On any internal error it exits 0 with no output, so a lint bug never disrupts the session. Its budget is under 300 ms.

### 10.2 Gate computation

`uie gates` reads `rules.json` (criterion definitions, gate membership, waivability), the run's artifacts, `waivers.json` and the config. It computes each criterion state, then each gate, then the level. Every state cites its evidence file. Criteria whose required artifacts are absent are `not_run`.

### 10.3 Language lint

`uie report` scans report prose for wording that exceeds the evidence level (e.g. "users struggle" on an E0–E2 finding), completeness claims ("all issues", "fully accessible", "WCAG compliant"), causal verbs without E5, and synthetic metrics. Violations fail EVD-06.

## 11. Harness integration

| Harness | Install | Subagents | Hooks | Notes |
|---|---|---|---|---|
| Claude Code (plugin) | `/plugin marketplace add Horace-Maxwell/UI-Evaluator` then `/plugin install ui-evaluator@ui-evaluator` | named agents | PostToolUse lint | commands `/ui-evaluator:audit`, `:build`, `:fix`, `:ingest`, `:study`, `:report`, `:setup`, `:direct`, `:verify` |
| Claude Code (skill only) | `npx skills add Horace-Maxwell/UI-Evaluator` | general-purpose subagents + role files | none (optional manual hook) | full independence |
| OpenAI Codex | `npx skills add …` (→ `.agents/skills/`) | per harness capability; otherwise sequential DEGRADED | none | `agents/openai.yaml` supplies display metadata |
| Cursor | `npx skills add …` (→ `.agents/skills/` or `.cursor/skills/`) | sequential DEGRADED unless isolated CLI available | none | invoke with `/ui-evaluator` |
| Gemini CLI | `npx skills add …` (→ `.gemini/skills/` or `.agents/skills/`) | sequential DEGRADED unless isolated CLI available | none | activated via `activate_skill` |
| claude.ai / API upload | zip of `skills/ui-evaluator/` | none | none | browser layer unavailable in sandboxes without Chromium; static and analytical modes only |

## 12. Dependencies and licences

| Package | Use | Licence | Layer |
|---|---|---|---|
| Node.js ≥ 20 | runtime | MIT | core |
| `playwright` (Chromium) | capture, emulation, interaction, ARIA snapshots, CDP | Apache-2.0 | browser |
| `@axe-core/playwright` + `axe-core` | WCAG rule engine (unmodified) | MPL-2.0 | browser |
| `colorjs.io` | advisory APCA (COL-14); reference values for the colour-maths tests | MIT | browser; tests |
| `pixelmatch` + `pngjs` | pixel diffs, focus-visibility diffs | ISC / MIT | browser |
| `web-vitals` (injected IIFE) | lab CLS/LCP/INP | Apache-2.0 | browser |

Not adopted: `apca-w3` (non-OSI licence), Lighthouse CI (pins stale Lighthouse), BackstopJS (dormant), Lost Pixel (archived), AIM as a dependency (EOL toolchain) [TOOL-40]. `code-inspector-plugin` in the target project (dev only, added with the owner's consent) is read when present: its `data-insp-path` attributes are the first source-mapping method (§9.4) [TOOL-31]. Lighthouse ≥ 13 and IBM `accessibility-checker-engine` are candidate owner-enabled engines, not integrated in 1.0 (deferred until calibration shows they find what the current checks miss) [TOOL-34/35].

All other colour maths (parsing every CSS colour syntax, sRGB ↔ OKLab and OKLCH, ΔE OK, WCAG luminance and contrast) is implemented once in `lib/util/color.mjs`, used by the lint, browser and token layers alike, and tested against `colorjs.io` values (ADR-026).

## 13. Security and privacy

- Scripts open only local URLs unless `--allow-remote` is passed. No telemetry. No network calls except to the app under test and, during `doctor --install`, to the npm registry and Playwright's browser CDN after the owner agrees.
- `feedback import` scrubs emails, phone numbers, payment-card-like numbers and government-ID-like patterns, replaces names listed in a participant roster with codes, and keeps raw files under the git-ignored `feedback/raw/`.
- Evidence screenshots may contain personal data from the app under test. `runs/` is git-ignored by default.
- `uie probe` refuses actions that submit real payment or authentication forms on non-local hosts.
- Hooks never write files. They only read the edited file.

## 14. Testing and release

| Layer | What is tested | Where |
|---|---|---|
| Unit | schema validator, finding identity, merge determinism, severity function monotonicity, priority and clamp, gate computation, statistics against published examples, colour maths against colorjs.io, DTCG token parsing, seeded roll determinism, scrubber, language lint | `tests/core/` (`npm test`; Node.js only) |
| Detector | every lint rule and every audit check against fixture pages and files with expected hits and expected non-hits; realistic well-built projects that must produce no gate-level hits | `tests/lint/` (`npm run test:lint`), `tests/browser/` (`npm run test:browser`) |
| Integration | init → run → capture → audit → journey → diff → gates → report through the CLI on fixtures served locally; the doctor smoke test on `assets/fixtures/known-bad.html` | `tests/browser/commands.test.mjs`, `tests/core/e2e.test.mjs`, `uie doctor` |
| Detector calibration | per-rule precision and recall on the seeded fixtures; false positives on `clean-control`; the deterministic release thresholds of EVALUATION-PLAN §6 | `tools/score-fixtures.mjs`, `evals/fixtures/`, `evals/labels/` |
| Skill behaviour | with-skill vs without-skill runs on eval prompts; trace assertions (files read, commands run, gates computed) across ≥ 2 model families [IMP-058] | `evals/` (skill-creator loop; `claude plugin eval` where available) |
| Packaging | `skills-ref validate skills/ui-evaluator`; `claude plugin validate .` and `claude plugin validate .claude-plugin/plugin.json`; `tools/validate-skill.mjs` (frontmatter, line budgets, TOCs, links, CLI commands, flags and check names named in guidance, agents in sync, `rules.json` ⊇ QUALITY-BAR IDs, fixture names kept out of the skill); `tools/check-traceability.mjs` (every research adopt ID has a disposition) | `npm run validate`, CI |

Release checklist: all of the above green; CHANGELOG entry; version bump in `plugin.json`, `SKILL.md` metadata and `scripts/package.json`; tell catalogue statuses reviewed.
