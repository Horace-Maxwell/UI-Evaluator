# Contributing

Thank you for helping. UI-Evaluator holds itself to the same rule it applies to the interfaces it reviews: every claim needs evidence, and every rule traces to a source.

## Before you change anything

- Read [AUTHORING.md](docs/framework/AUTHORING.md). It sets the voice, the ID schemes, the examples policy (no recommended fonts or palettes, neutral example products that rotate), the licence and quotation rules, and the size budgets.
- Normative text lives in [docs/framework/](docs/framework/). The skill under `skills/ui-evaluator/` restates it for agents. When you change a rule, change the framework first, then the skill files that restate it.
- A change of a threshold, a gate or a status vocabulary needs a decision record in [DECISIONS.md](docs/framework/DECISIONS.md).

## Where things live

| Change | Edit | Then run |
|---|---|---|
| a gate criterion or threshold | `docs/framework/QUALITY-BAR.md` (+ ADR) | `node tools/build-rules.mjs` (regenerates `assets/data/rules.json`) |
| an evaluator role prompt | `skills/ui-evaluator/references/evaluators/<role>.md` | `node tools/sync-agents.mjs` (regenerates `agents/`) |
| a CLI command | `skills/ui-evaluator/scripts/lib/commands/<name>.mjs` and its registry entry in `lib/cli.mjs` | `npm test` |
| a file format | `skills/ui-evaluator/assets/schemas/<name>.schema.json` and ARCHITECTURE §8 | `npm test` |
| a research-backed practice | cite its adopt ID in square brackets, e.g. `[CRAFT-018]` | `node tools/check-traceability.mjs` |
| a new adopt item in `docs/research/` | the note's adopt table | `node tools/check-traceability.mjs --write`, then give it a disposition |
| a benchmark round | `evals/results/build-benchmark-<date>/` and a dated subsection under Results in `evals/README.md` | update the measured results in both READMEs |
| an image in the README | `docs/assets/` and its row in `docs/assets/README.md` | check every number in it against the run's `grading.json` |

## Checks

```bash
npm test
```

```bash
npm run validate
```

- `npm test` runs the core unit and end-to-end tests. They need nothing but Node.js 20 or newer.
- `npm run test:browser` runs the browser-layer tests. They need the runtime from `node skills/ui-evaluator/scripts/uie.mjs doctor --install`, which downloads Playwright's Chromium.
- `npm run validate` checks the skill's front matter and budgets, every relative link, CLI commands named in guidance, versions, generated files (agents and rules) and research traceability. CI also runs `skills-ref validate skills/ui-evaluator` and Claude Code's own validators, `claude plugin validate .` (marketplace) and `claude plugin validate .claude-plugin/plugin.json` (manifest, commands, agents and hooks).

## Code style

- Plain ES modules for Node.js 20, no build step. The core (`scripts/lib` outside `browser/`) has no dependencies; keep it that way.
- Every statistic or threshold is computed in one tested function, never re-implemented in a command.
- A command prints one primary result to stdout, supports `--json`, and uses exit code 0 for success, 2 for "ran, but the bar is not met" and 1 for usage or runtime errors.
- Files an evaluator or a person writes are validated against their schema before anything reads them.

## Evaluation

Changes to detectors, gates or workflows are measured, not argued: see [EVALUATION-PLAN.md](docs/framework/EVALUATION-PLAN.md). `node tools/score-fixtures.mjs` audits and lints every fixture in `evals/fixtures/` through the CLI and scores the detections against each fixture's `ground-truth.json`: per-rule precision and recall, false positives on `clean-control`, and the deterministic release thresholds of EVALUATION-PLAN §6. Fixture product names and seeded defects in `evals/` must never appear in `skills/`, so the skill cannot learn the test; `npm run validate` checks the product names.

### Build benchmarks

A change meant to make builds better is measured with paired builds, as in [evals/README.md](evals/README.md#results):

- Run the same prompt with the skill (from a frozen snapshot) and without it, or with the previous snapshot, on the same model and tools. Repeat old prompts and add new ones, because runs vary a lot.
- Grade both configurations with one script: `uie audit`, `uie lint` and `uie gates` on a copy of the shipped files only, plus the eval's assertions.
- Judge looks blind and in pairs, from screenshots, with keys hidden until every answer is in. Ask a person where you can: the model judges are Claude models too, so they may favour what Claude builds.
- Store grading, timing, screenshots, pair keys and judgements under `evals/results/build-benchmark-<date>/`, and write the round up with its caveats. Report a loss as plainly as a win, and update the measured results in both READMEs.

### README images

The images in `docs/assets/` are evidence too. Every number in them comes from a stored run, and [docs/assets/README.md](docs/assets/README.md) names the run behind each image and how a pair was chosen. A picked pair must say that it was picked. When a new round changes the picture, update the images and their captions, or remove them.

## Licence

By contributing you agree that your contribution is licensed under Apache-2.0. Do not paste text or code from sources marked "ideas only" in [NOTICE.md](NOTICE.md) or AUTHORING; paraphrase and cite instead.
