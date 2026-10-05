# Build benchmark tools

The scripts behind the build benchmark: the same prompt built with and without the skill, graded by one script, and judged blind. The method, the results and their caveats are in [evals/README.md](../../evals/README.md#running-a-build-benchmark). Run them in order, with the round folder outside the repository:

| Step | Script | What it writes in the round folder |
|---|---|---|
| 1 | `prepare-round.mjs <round> --evals 1,2,17,18 --runs 3` | a frozen copy of the skill, an empty project per run, `run-prompts.json` |
| 2 | give each prompt to a fresh agent; save the harness's tokens and time as `timing.json` in its run folder | `outputs/project`, `outputs/reply.md` |
| 3 | `grade-build.mjs <run-dir> <eval-id>` for every run | `metrics.json`, `grading.json`, `screens/`, `blind-site/` |
| 4 | `make-pairs.mjs <round> --seed <n>` | `pairs.json` and A/B copies per pair |
| 5 | `comparator-prompts.mjs <round>`; give each prompt to a fresh agent | `comparator-prompts.json`; each agent writes `stage1.json` |
| 6 | `judge-page.mjs <round> --seed <n> [--lang en]`; send `judge.html` to the person | `judge.html`, `judge-key.json` |
| 7 | `record-round.mjs <round> --date <YYYY-MM-DD> --human "<their line>" --judge "<who>"` | the round under `evals/results/build-benchmark-<date>/` |

Grading needs the browser runtime: `node skills/ui-evaluator/scripts/uie.mjs doctor --install`. `lib.mjs` and `strip-comments.mjs` hold the shared helpers; `tests/core/bench-tools.test.mjs` tests them.
