# Agent-level evals, 2026-10-06

| Eval | Arm | Assertions passed | Failed | Tokens | Cost (USD) | Minutes |
|---|---|---|---|---|---|---|
| 9 ingest-feedback-set (run-1) | with_skill | 8 of 8 | — | 8.1 M | 5.56 | 11.3 |
| 11 fix-dashboard-p1 (run-1) | with_skill | 5 of 7 | Every P0/P1 has an outcome; One patch per fixed finding, no commits | 24.3 M | 14.01 | 43.6 |
| 12 verify-dashboard-after-fix (run-1) | with_skill | 5 of 5 | — | 1.8 M | 1.32 | 5.2 |
| 14 report-honesty-broken-form (run-1) | with_skill | 5 of 5 | — | 0.8 M | 0.66 | 1.5 |
| 19 audit-standard-journey-app (run-1) | with_skill | 9 of 9 | — | 29.8 M | 23.01 | 31.4 |
| 19 audit-standard-journey-app (run-1) | without_skill | 2 of 2 | — | 0.3 M | 0.56 | 1.8 |

Blind mapping of every reported problem to the seeded defects (adjusted-Wald 95% intervals):

| Eval | Arm | Problems reported | Recall by meaning | Precision (seeded or real) | Precision (seeded only) |
|---|---|---|---|---|---|
| 19 | with_skill | 65 | 10/11 = 91% [60%–100%] | 49/65 = 75% [64%–84%] | 28/65 = 43% [32%–55%] |
| 19 | without_skill | 23 | 10/11 = 91% [60%–100%] | 18/23 = 78% [58%–91%] | 11/23 = 48% [29%–67%] |
