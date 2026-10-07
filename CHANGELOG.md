# Changelog

All notable changes are recorded here. The project follows [Semantic Versioning](https://semver.org/): a change to a gate, a threshold or a file format that makes an earlier pass fail is a major change and needs a decision record.

## 2.1.0 — 2026-10-06

Reports in the CMU lecture's heuristic-evaluation format, an agent-level eval harness with a control arm, the first measurement of four release bars, and fixes for ten problems that round found in the skill. Formats change only by addition: evaluator outputs accept a `feedback` role, probe actions add `back`, `forward` and `reload`, and an earlier batch of rating files moves to `ratings/batch-<n>/`. No gate or threshold changes.

- **Reports read like the lecture's heuristic-evaluation report.** `uie report` prints each P0 and P1 finding as one entry: a header row (# · Problem · Severity · Ease of fixing · Heuristic number · Broad heuristic), then Problem, Evidence and Recommendation. Severity carries its word from the 0–4 scale (cosmetic, minor, major, catastrophe), ease of fixing its scope, Nielsen's heuristics print as H2-1…H2-10 with their names, and walkthrough findings print their question in the lecture's words ("Is the action visible?"). The P2 and P3 table has the same columns. IDs in files do not change. The report template, `methods/cognitive-walkthrough.md`, `knowledge/heuristics.md` and the lecture map in FRAMEWORK Appendix A say the same.
- **The HTML report tints severity and ease of fixing.** In a table with the lecture's columns, the severity cell is shaded by its 0–4 value and the ease cell by its 1–4 value, under a pale header row, as in the lecture's example entry. The number and its word stay in the cell.
- **Agent-level eval harness.** `tools/bench/prepare-evals.mjs` builds a workspace per audit, ingest, fix, verify or report eval from its fixtures (the steps of `evals/README.md`), with a frozen copy of the plugin; `tools/bench/run-headless.mjs` runs each prompt as a top-level, non-interactive Claude Code session, so the audit's isolated roles are real subagents; `tools/bench/grade-eval.mjs` checks every script assertion against the workspace, the transcript and the ground truth, and writes a packet for the grader assertions. Eval 19 is new: a standard-depth audit of `journey-app`, for the standard-audit release bar.
- **A control arm and grader consensus.** `prepare-evals.mjs --baseline` prepares the same task without the plugin (same site, documents, tools and prompt, less the plugin lines), and `run-headless.mjs --arm` runs one arm; a run another runner has started is skipped. `grade-eval.mjs` grades a control run on the assertions that do not read the skill's files, and computes precision and recall by meaning, with adjusted-Wald 95% intervals, from a grader's mapping of every reported problem. `tools/bench/agree-graders.mjs` gives the agreement of two independent graders (percentage and Krippendorff's alpha) before a third settles their splits. `record-evals.mjs` stores both arms.
- **Measured: the agent-level round of 2026-10-06.** Five tasks run as top-level sessions with the 2.0.1 plugin, and the standard audit again without it as a control, graded by scripts and by two blind graders settled by a third. The standard-audit bar is met in one run (recall 10 of 11, precision 0.82 after verification), but the control found 10 of 11 as well, so the fixture cannot show the skill improves recall; it costs 41 times as much. Feedback ingestion and the honesty checks are met; the fix-loop bar is not (2 of 3 seeded serious defects verified fixed; the audit never found the third). `evals/results/agent-evals-2026-10-06/` holds the runs, the graders' work and `REPORT.md`, written in the CMU lecture's evaluation format; `evals/README.md` and the READMEs carry the new status.

### Fixed (found by watching the agents in the eval round)

- **Tool findings no longer fail their own report lint.** Eight sentences the browser checks wrote said what keyboard or screen-reader users "cannot" do, which the lint rejects below E3 evidence, so every report with such a finding needed a hand edit. They now state what was measured ("so no focus position is visible"). A test runs the lint over every check's wording.
- **Packets give evidence paths that open.** Findings store evidence relative to the run or to the project, and the raters in the eval round looked for screenshots in the wrong folder. Packets now carry absolute paths when the file exists, and each packet README names the JSON schema its output must follow.
- **Heuristic evaluators no longer see the walkthrough's answer key.** Their packets carried each journey's correct path, the labels its scenario avoids and its success test, which pointed them at the hidden "Change dates" control the walkthrough was meant to judge; the lead of the eval round flagged the inflated detection count itself. The packets keep the persona, goal, scenario and start for orientation.
- **A second batch of raters can no longer be decoded with the wrong key.** Raters see findings as B-001, B-002…, and `uie packet` rewrote that blind map for every batch, while `uie findings rate` decoded every file in `ratings/` with the newest one. After a re-rating, an earlier batch's B-001 would have been read as the new batch's B-001; the lead of the eval round noticed and moved the files by hand. `uie packet` now moves the earlier batch to `ratings/batch-<n>/` with its own map, and `findings rate` decodes each batch with its map and takes each finding's ratings from the latest batch that rated it.
- **Duplicate proposals find the same problem across roles.** In the eval round's standard audit one dead end reached the report six times, reported by eight inspectors in six roles who wrote different URLs and criteria for it. `uie findings merge` now compares pages without their query strings and over every location, and also proposes pairs on the same page that share a criterion and have related wording; same-element pairs still need the same route. On that audit's findings the new rule proposes every duplicate group the report repeated. The lead still accepts or rejects each proposal.
- **An empty fix queue says why.** `uie findings queue` printed only "the fix queue is empty" when an audit had run its checks but was never merged or promoted, and the agent in the eval round had to investigate. It now names the cause: tool hits never merged, merged findings never promoted, no audit yet, or a register with nothing open and the findings still unrated.
- **Feedback themes become candidates without posing as an inspector.** The ingest workflow said to add unmatched problem themes as candidates but not how, and the evaluator-output schema had no role for them; the agent in the eval round labelled its feedback file a heuristic evaluator's output, which counted user feedback as one more independent inspector in every detection count. Evaluator outputs may now have `"role": "feedback"`: their candidates are verified like any other and never count toward k of N, and `ingest.md` names the file to write.
- **Probe actions accept the shorthand agents write.** In three of the five eval sessions an agent wrote steps as `{"goto": {"url": "/"}}` and got `unknown action "undefined"`. That form is now read as `{"action": "goto", "url": "/"}`, and a step with no `action` key gets a message showing the expected form.
- **Probes can use the browser's history.** `back`, `forward` and `reload` join the probe actions (journeys, state recipes and `uie probe`), so the H3 exits and whether a page keeps what was typed can be tested without a hand-written script. ARCHITECTURE §8.5 lists them.

Still open from the same round: a status for a finding blocked on the owner's decision (the fix loop had to leave such a P0 open), and a `uie findings split` command for the verifier's split requests. Both change the framework's rules and wait for a decision.

## 2.0.1 — 2026-10-06

Documentation, repository tools and one detector message. No gate, threshold or file format changes.

- **SLP-13 names what the page shows.** The audit's placeholder-identity finding now quotes the text it matched, such as `repaircafe@example.org`, instead of the list entry behind it ("example.com addresses"). Finding identity does not depend on the title, so earlier runs still match. The lint layer already quoted the match.
- **Release thresholds.** `evals/README.md` now tracks the measured status of every bar in EVALUATION-PLAN §6. Version 2.0.0 misses the build-outcome bar, a blind preference for the skill of at least 70%, and four bars are not measured yet. The READMEs, the overview and the plan say so.
- **CI and community files.** `.github/workflows/checks.yml` runs the core and lint tests and `npm run validate` on Node.js 20 and 22 for every push and pull request, and `browser.yml` runs the browser suite on Linux by hand. Issue forms (a wrong finding, a bug, an idea), a pull request checklist and `SECURITY.md` are new. CONTRIBUTING no longer describes a CI that did not exist.
- **README, second pass.** A quick start at the top, the workflows each kind of request runs, the audit depths, eight questions with plain answers, and a contributing section with the test suites and the issue forms.
- **README.** Both READMEs are rewritten around pictures: a title banner with the gates and levels, two before-and-after pairs from the build benchmark with the `uie` audit numbers under each page, the repair café audit with the detectors' own boxes, and a workflow diagram. A note under the pairs says they were picked because the owner preferred the skill's page, and that they are not typical. The measured results are now a table, and the gate list and CLI reference fold away.
- **Images.** `docs/assets/` holds the images in English and Chinese, a social preview for the repository, and a README naming the run behind every image and how its numbers were read.
- **Benchmark tools.** `tools/bench/` holds the build benchmark that was run by hand before: prepare a round (a frozen skill and one prompt per run), grade a run, pair the runs, write the comparator prompts, make a blind judging page whose result line carries no key, and record the round with its tallies. The grader marks each assertion as output (the page or the reply) or process (the skill's own files). `tests/core/bench-tools.test.mjs` tests the helpers.
- **Image tools.** `tools/readme-media/build.mjs` draws every README image from the stored runs and stops when a caption no longer matches the stored judgement. `audit-capture.mjs` takes the annotated audit's boxes and capture from the baseline page, which is kept in `docs/assets/src/`.
- **A fairer comparison.** The headline rates (90–100% against 0–64% of assertions met) counted process assertions that a build without the skill cannot pass. The READMEs, the pair images and the overview now compare the output assertions only: 83–100% against 0–70%. `evals/README.md` gives both.
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
