# README images

The images in the two READMEs, where each one comes from, and how its numbers were read. Every number in them is read from a graded benchmark run in [evals/results/](../../evals/results/) or from the audit capture in `src/`, and `node tools/readme-media/build.mjs` draws them all again from those files.

| Image | What it shows | Source |
|---|---|---|
| `banner-en.png`, `banner-zh.png` | the title, and the eight gates grouped into assurance levels | [QUALITY-BAR.md §3](../framework/QUALITY-BAR.md#3-assurance-levels) |
| `social-preview.png` | the English banner at 1280 × 640, for the repository's social preview | as above |
| `workflow-en.png`, `workflow-zh.png` | the seven workflows and the loop through real users | [FRAMEWORK.md](../framework/FRAMEWORK.md) |
| `before-after-cafe-en.png`, `before-after-cafe-zh.png` | eval 1, the repair café (English, Persuade), at 1280 px: the iteration-1 baseline against the iteration-3 skill run | [build-benchmark-2026-10-03/eval-1-build-en-repair-cafe/](../../evals/results/build-benchmark-2026-10-03/eval-1-build-en-repair-cafe/) |
| `before-after-calligraphy-en.png`, `before-after-calligraphy-zh.png` | eval 2, the calligraphy class sign-up (Chinese), at 375 px: run 1 of each configuration in iteration 4 | [build-benchmark-2026-10-04/eval-2-build-zh-calligraphy-signup/](../../evals/results/build-benchmark-2026-10-04/eval-2-build-zh-calligraphy-signup/) |
| `audit-annotated-en.png`, `audit-annotated-zh.png` | the repair café baseline with the boxes the audit reported for five of its findings | `src/` (below), and the same baseline's grading for the counts in the footnote |

## How the numbers were read

- **Hard AI tells**: `metrics.hard_tells` in the run's `grading.json`.
- **WCAG criteria failed** and **craft criteria failed**: the failed G2 and G3 criteria, `metrics.counts.G2` and `metrics.counts.G3`.
- **Checks on the page and reply**: the output assertions passed, out of all output assertions. The grader's process assertions, which check the skill's own files (PRODUCT.md, DESIGN.md, the direction roll, the ledger, the self-check run), are left out, because a build without the skill cannot pass them.
- **Blind judgement**: `human-judgement.json` in the same round's folder. The build script stops if a caption no longer matches it.

## Why these pairs

They are the pairs in which the project owner, judging blind, preferred the skill's page on all three questions. They are not typical: in the latest round the person judged the page built without the skill the more beautiful one in 6 of 8 pairs. The captions in the images and in the READMEs say so.

## The audit capture in `src/`

`src/cafe-baseline-site/` holds the files of the repair café page built without the skill (iteration 1, reused as the baseline in later rounds). `src/audit-cafe-hits.json` and `src/audit-cafe-1280.png` come from one run of

```bash
node tools/readme-media/audit-capture.mjs docs/assets/src/cafe-baseline-site docs/assets/src/audit-cafe --width 1280 --max-height 1640
```

which audits the page in-process and captures it right afterwards, so the boxes and the pixels match. The page prints the next opening date and the audit's checks see the live clock, so a capture taken on another day can wrap the date differently and move the boxes. Take the boxes and the capture again together, never one alone. This capture was taken on 2026-10-04, so it shows a later date than the frozen-clock stills in the pair image.

## How they are drawn

`node tools/readme-media/build.mjs` writes each image as an HTML page and renders it with Playwright's Chromium at twice the pixel density (the social preview at 1280 × 640). `--only <name part>` redraws some of them, and `--html <dir>` keeps the pages. The committed images were rendered on macOS with its system fonts (Avenir Next, SF Mono, PingFang SC); on another system the fallback fonts change the result.
