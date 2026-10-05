# README images

The images in the two READMEs, where each one comes from, and how its numbers were read. Every number in them is copied from a graded benchmark run in [evals/results/](../../evals/results/).

| Image | What it shows | Source |
|---|---|---|
| `banner-en.png`, `banner-zh.png` | the title, and the eight gates grouped into assurance levels | [QUALITY-BAR.md §3](../framework/QUALITY-BAR.md#3-assurance-levels) |
| `social-preview.png` | the English banner at 1280 × 640, for the repository's social preview | as above |
| `workflow-en.png`, `workflow-zh.png` | the seven workflows and the loop through real users | [FRAMEWORK.md](../framework/FRAMEWORK.md) |
| `before-after-cafe-en.png`, `before-after-cafe-zh.png` | eval 1, the repair café (English, Persuade), at 1280 px: the iteration-1 baseline against the iteration-3 skill run | [build-benchmark-2026-10-03/eval-1-build-en-repair-cafe/](../../evals/results/build-benchmark-2026-10-03/eval-1-build-en-repair-cafe/) |
| `before-after-calligraphy-en.png`, `before-after-calligraphy-zh.png` | eval 2, the calligraphy class sign-up (Chinese), at 375 px: run 1 of each configuration in iteration 4 | [build-benchmark-2026-10-04/eval-2-build-zh-calligraphy-signup/](../../evals/results/build-benchmark-2026-10-04/eval-2-build-zh-calligraphy-signup/) |
| `audit-annotated-en.png`, `audit-annotated-zh.png` | the repair café baseline with the bounding boxes `uie audit` reported for five of its findings | the same baseline, audited at 1280 px |

## How the numbers were read

- **Hard AI tells**: `metrics.hard_tells` in the run's `grading.json`.
- **WCAG criteria failed** and **craft criteria failed**: the failed G2 and G3 criteria, `metrics.counts.G2` and `metrics.counts.G3`.
- **Brief and gate checks**: `summary.passed` of `summary.total` assertions.
- **Blind judgement**: `human-judgement.json` in the same round's folder.

## Why these pairs

They are the pairs in which the project owner, judging blind, preferred the skill's page on all three questions. They are not typical: in the latest round the person judged the page built without the skill the more beautiful one in 6 of 8 pairs. The captions in the images and in the READMEs say so.

## How they were made

Each image was drawn as an HTML page and rendered with Playwright's Chromium at twice the pixel density, on macOS with its system fonts (Avenir Next, SF Mono, PingFang SC). The boxes in the audit image are the bounding boxes from a `uie audit` of the baseline site. That screenshot was taken with the real clock, so the page shows a later date than the frozen-clock capture in the pair image.
