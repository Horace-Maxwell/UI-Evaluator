# Skill Benchmark: ui-evaluator

**Model**: claude-opus-5-5
**Date**: 2026-10-02T06:12:01Z
**Evals**: 1, 2 (1 run each per configuration)

## Summary

| Metric | With Skill | Without Skill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 96% ± 6% | 32% ± 33% | +0.64 |
| Time | 4471.9s ± 91.3s | 2980.8s ± 315.6s | +1491.2s |
| Tokens | 802730 ± 19110 | 302068 ± 39923 | +500662 |

## Analyst notes

- Iteration 2 tests ADR-035 (appeal verdict DES-07, build finish pass, subject materials as referents, missing-facts guidance, one critic at quick depth). With-skill runs used a frozen snapshot of the skill; the baselines are the iteration-1 runs, regraded with the current grader (results identical).
- One run per configuration per eval (n = 1): differences are signals, not measured effects.
- Assertions (the skill's own gates plus brief compliance): unchanged from iteration 1, 21 of 22 with the skill vs 7 of 22 without. The only with-skill miss is COL-03 on the cafe page, measured without its DESIGN.md strategy.
- Blind pairwise comparison, one comparator per presentation order: the skill now wins less_generic on both evals in both orders (iteration 1: 0 of 2). The baseline still wins more_beautiful and better_overall on both evals in both orders: 2 of 6 order-consistent verdicts for the skill, up from 0 of 6.
- Comparator means, with skill vs without: distinct 4.0 vs 3.0 on both evals (iteration 1: 2.5 vs 3.5 and 3.0 vs 4.0); visual 3.0 vs 4.0 (cafe, unchanged) and 3.5 vs 4.0 (calligraphy, up from 3.0); honesty 4.5 vs 2.5 and 5.0 vs 4.0.
- Why the baseline still wins on beauty and overall, in the comparators' words: a warmer palette, display type with character (a slab serif; a Kai title with a seal and a brush stroke), cards with depth, and more features (several dates, a check step, a success screen, a fallback when no email app opens, an organiser roster with CSV export). The with-skill pages were called flatter and sparser, with a heavy ink button and single characters stranded on a line.
- Validity threat: the comparator and both builders are Claude models, and the baselines land in Claude's own house look (cream or warm grounds, serif display, terracotta or cinnabar accents), which the skill's catalogue lists as SLP-21. LLM judges can prefer outputs like their own, so the beauty verdicts need a human or a judge from another model family before they are trusted.
- Cost: with skill took about 74 and 76 minutes and 789k and 816k tokens, against 46 and 53 minutes and 274k and 330k without.
