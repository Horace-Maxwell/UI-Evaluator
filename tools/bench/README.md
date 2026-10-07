# Benchmark tools

The scripts behind two kinds of round: the build benchmark (below) and the agent-level evals ([further down](#agent-level-evals)).

## Build benchmark

The same prompt built with and without the skill, graded by one script, and judged blind. The method, the results and their caveats are in [evals/README.md](../../evals/README.md#running-a-build-benchmark). Run them in order, with the round folder outside the repository:

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

## Agent-level evals

The audit, fix, verify, ingest and report evals run as top-level, non-interactive Claude Code sessions, so the skill's isolated roles are real subagents. The method and its caveats are in [evals/README.md](../../evals/README.md#running-an-agent-level-eval-round).

| Step | Script | What it writes |
|---|---|---|
| 1 | `prepare-evals.mjs <round> --evals 9,11,12,14,19 [--baseline]` | a frozen plugin, one workspace per run (or per control run), `eval-prompts.json` |
| 2 | `run-headless.mjs <round> [--only 19] [--arm without_skill] --claude <binary>` | `transcript.jsonl`, `stderr.log`, `timing.json` per run |
| 3 | `grade-eval.mjs <run-dir> [--grader <answers.json>]` | `grading.json`, `grader-packet.json` |
| 4 | `agree-graders.mjs <answers-a.json> <answers-b.json> --out <file>` | the two graders' agreement and their splits, for the adjudicator |
| 5 | `trace-check.mjs <round> [--out <file>]` | the trace assertions per run: black-box roles that read source, failed packet paths, rejected probe steps, workarounds, leaked answer keys, blocked findings, recorded splits |
| 6 | `record-evals.mjs <round> --date <YYYY-MM-DD> [--grading <dir>]` | the round under `evals/results/agent-evals-<date>/`, local paths scrubbed |
