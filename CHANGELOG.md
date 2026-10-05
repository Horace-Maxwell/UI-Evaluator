# Changelog

All notable changes are recorded here. The project follows [Semantic Versioning](https://semver.org/): a change to a gate, a threshold or a file format that makes an earlier pass fail is a major change and needs a decision record.

## Unreleased

Documentation only; the skill, the CLI and the plugin are unchanged.

- **README.** Both READMEs are rewritten around pictures: a title banner with the gates and levels, two before-and-after pairs from the build benchmark with the `uie` audit numbers under each page, the repair café audit with the detectors' own boxes, and a workflow diagram. A note under the pairs says they were picked because the owner preferred the skill's page, and that they are not typical. The measured results are now a table, and the gate list and CLI reference fold away.
- **Images.** `docs/assets/` holds the images in English and Chinese, a social preview for the repository, and a README naming the run behind every image and how its numbers were read.
- **Other documents.** CONTRIBUTING covers build benchmarks and README images. NOTICE covers the images. `evals/README.md` counts 18 prompts and lists `results/`. The documentation map and the Chinese overview follow, and the overview now states the appeal criterion, the finish pass and the measured results.

## 2.0.0 — 2026-10-04

A major release under the rule above: DES-07 adds a G6 criterion that can make an earlier pass fail. Measured results for this version are in [evals/README.md](evals/README.md#results).

- **Appeal (ADR-035).** The first build benchmark found the skill's builds clean, honest and accessible but plain: a blind comparator preferred builds made without the skill in 6 of 6 order-consistent verdicts. Changes made in response:
  - The design rubric gains Appeal.
  - Critics write an appeal verdict before they may unseal detector output, and `uie packet --unseal` refuses until the verdict exists.
  - New criterion DES-07 needs a majority `appealing`.
  - The build's restraint pass becomes a two-sided finish pass.
  - The subject's own materials are referents, not tells (`direct`, `direction-process.md`, SLP-21).
  - Choosing a direction without the owner also rates appeal.
  - `knowledge/content-copy.md` §3.5 covers missing facts.
  - Quick audits include one design critic.
- **Colour, depth and finish.** These follow from the human blind judgement of the second benchmark iteration:
  - `knowledge/color.md` principle 8: the big areas of the page are one colour family, about 60/30/10 by area.
  - COL-17: a full palette has related hues, and at most one of them covers large areas.
  - `knowledge/shape-depth.md`: a drawn object from the referent may cast a soft shadow, and Persuade surfaces decide depth deliberately.
  - The build's finish pass checks colour cohesion in a blurred view, asks for the referent's object in a Persuade first viewport, and treats flat as a decision.
  - The critics' signs of unfinish include large blocks of unrelated hues and stranded characters.
  - Critics judge appeal from the pixels, not from the concept behind them.
  - After the third iteration, the build's finish pass also checks that the accent belongs on the primary action (`knowledge/color.md` principle 4), that the wide layout is composed for the width, that controls are styled, and that the type has a voice.
  - `knowledge/anti-slop.md` principle 9: removing tells is necessary for G4 but does not make a page look designed. In the human judgement, a crafted page that carried tells beat a tell-free plain page.
- **Levels.** L1 needs G2's automatable and scripted parts only: criteria waiting for the accessibility auditor are listed, not required, and a confirmed failure still blocks. L2 requires them.
- **Fix review (ADR-030).** `findings apply-verdicts --fix-review` no longer verifies deterministic findings, which reach `verified` through a clean re-run in `uie diff`. It also no longer verifies anything from a single-context review. Such findings stay `fixed`, and the command lists them.
- **Doctor.** `uie doctor` also writes `$UIE_HOME/doctor.json`. `uie gates` uses it for EVD-02 when it is newer than the project's record and comes from the same version, so a doctor run before `uie init` counts.
- **App lifecycle.** When a page load is refused mid-run, the browser commands restart an app that `uie` started, up to twice. When `uie` reuses a server it did not start, it says so.
- **Remote assets.** Audits and captures load a page's own remote assets (fonts, styles, images, media and scripts, GET only) by default, so captures show the page as visitors see it, and a web font no longer shows up as a console error. Navigations, fetch and XHR, form posts and other non-GET requests to remote hosts stay blocked; `config.audit.remote_assets: false` restores full blocking. The link check confirms a failed HEAD with a GET, because many small servers do not implement HEAD. `config.json` gains `capture` and `audit` keys in its schema.
- **Frozen clock.** Captures freeze the clock at 10:00 UTC on the day the run was opened, not on a fixed 2026-01-15. `config.capture.clock` pins another instant. Date-like sample values in form checks honour the input's `min`.
- **Detectors.** TYP-03 judges inline text inside a heading (for example `<time>` in an `h1`) by the heading limits. FUN-04 (`media`) reports visible `mailto:`, `tel:` and `sms:` links with no target. Share links are exempt. `census` reports stranded last words in headings and short paragraphs (TYP-15) and single stranded CJK characters (I18N-12), as advisories.
- **CLI.**
  - `uie audit --quick` is described as the build self-check, which cannot reach a level on its own.
  - `uie findings validate` accepts a directory.
  - `uie findings merge` no longer crashes when two merged candidates both carry factor notes; the notes are combined per factor.
  - `uie ledger add` records the brand colour (for example a cinnabar signature) as the accent when the primary is a neutral ink.
  - `uie report` lists confirmed findings that have not been rated yet.
- **Gates and reports.** USE-05 and USE-06 also count open judged findings carried in the register, so a verify or fix run that did not re-examine them cannot show "no open P0". The report lists them under "Still open from earlier runs". SLP-21 judges a serif display from the primary face, never from the `sans-serif` fallback keyword.
- **Missing facts.** `knowledge/content-copy.md` §3.5 now starts by making the action work without the fact (for example, a small server that keeps sign-ups for the owner). Only facts the owner alone has become settings.
- **Fourth-iteration dogfood fixes.**
  - A11Y-27 also counts open judged WCAG findings carried in the register.
  - `uie findings set` takes `--add-criterion kind:id` and `--drop-criterion id` to correct a mis-cited criterion, with history. Dropping a WCAG criterion needs `--by human:<name>`.
  - `live-regions` counts an action that navigates as exercised, because a change of context needs no status message, so A11Y-15 is no longer `degraded` on sites whose forms post to a new page.
  - COL-17 compares a Drenched surface against the ground role's hue, not the accent.
  - `forms` clears prefilled text-like values before its empty submission, so a form with a default value is really submitted empty. It no longer reads a bare `feedback` class as error styling, because Bootstrap's `valid-feedback` is a success note.
  - `uie packet --role fix-reviewer` builds a regression-only packet when every fix was deterministic and already verified by the re-run, so the round still gets an independent look for collateral damage (`fix` step 9).
- **Panel protocol.** A quick-depth critic is feedback, never a panel: DES-01 is at most `degraded`. A standard or rigorous panel with any critic run without isolation is `degraded`, not `pass`.
- **LAY-04.** Takes its size basis from the same visible text the inset is measured to, so an `aria-hidden` display glyph no longer raises the threshold.
- **Evals.** Added `tools/score-fixtures.mjs` results and the build benchmark under `evals/results/`.

## 1.0.0 — 2026-10-01

First release.

- **Specification** (`docs/framework/`): framework with 14 principles and four assurance levels; quality bar with gates G0–G7 and their criteria; methods; architecture; 34 decision records; a conflict register reconciling the sources; authoring rules; an evaluation plan; traceability for all 592 research adopt items; an English–Chinese glossary.
- **Evidence base** (`docs/research/`): eleven research notes on design and evaluation skills, fix loops, HCI evaluation methods, platform design systems and CJK typography, anti-slop and visual craft, accessibility tooling and Agent Skills packaging.
- **Skill** (`skills/ui-evaluator/`): nine workflows (setup, direct, build, audit, study, ingest, fix, verify, report), nine isolated evaluator roles, twelve method files, fifteen knowledge files and the templates they use (`PRODUCT.md`, `DESIGN.md`, config, journeys, study plan, moderator guide, consent, task cards, observation sheet, feedback import, report, agree/disagree sheet, debt register).
- **CLI** (`uie`): workspace and runs; evidence capture and deterministic audits in the browser; static lint; packets for isolated roles; the findings lifecycle (merge, verification, blind rating with validity votes, promotion, queue, fix review); gates and assurance levels; reports with a language lint; design-token checks and as-built extraction; seeded direction rolls and the variety ledger; feedback import with personal-data scrubbing; study statistics.
- **Claude Code plugin**: slash commands for each workflow, generated subagents for each role, and an optional PostToolUse lint hook that stays inert outside initialised projects.
