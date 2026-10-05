# Skill Benchmark: ui-evaluator

**Model**: claude-opus-5-5
**Date**: 2026-10-02T04:36:19Z
**Evals**: 1, 2 (1 run each per configuration)

## Summary

| Metric | With Skill | Without Skill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 96% ± 6% | 32% ± 33% | +0.64 |
| Time | 4860.9s ± 4.0s | 2980.8s ± 315.6s | +1880.1s |
| Tokens | 792969 ± 42573 | 302068 ± 39923 | +490901 |

## Analyst notes

- One run per configuration per eval (n = 1): treat every difference as a signal to investigate, not a measured effect.
- The assertions are the skill's own gates (G1-G4, tells) plus brief compliance, graded by the same instrument for both configurations. They partly measure what the skill optimises for, so the +0.64 pass-rate delta overstates its value.
- Blind pairwise comparison (one comparator per presentation order, A/B swapped, site copies with comments stripped): the baseline won more_beautiful, less_generic and better_overall in both orders on both evals, 6 of 6 order-consistent verdicts. Mean comparator scores, with skill vs without: visual 3.0 vs 4.0 on both evals; distinct 2.5 vs 3.5 and 3.0 vs 4.0; honesty 5.0 vs 3.0 and 5.0 vs 3.5.
- Diagnosis from the with-skill DESIGN.md files: both directions were defined by what to avoid (the calligraphy page rejected rice paper, cinnabar and seals as second-order defaults; the repair-cafe page abandoned the luggage tag it started from and ruled out icons and shadows), and build step 11 removes decoration without checking finish. The rubric's six criteria reward classical aesthetics (clean, ordered) and do not score expressive aesthetics or finish.
- The with-skill builds missed brief facts that the baseline handled: visible '[... to add]' placeholder boxes in the first viewport and a booking mailto link with no recipient (eval 1).
- Cost: with skill took about 1.6x the wall time (81 vs 50 min) and 2.6x the tokens; most of the extra went to process (captures, audits, gates) rather than to the design.
