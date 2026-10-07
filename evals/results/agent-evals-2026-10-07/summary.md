# Agent-level evals, 2026-10-07

| Eval | Arm | Assertions passed | Failed | Tokens | Cost (USD) | Minutes |
|---|---|---|---|---|---|---|
| 9 ingest-feedback-set (run-1) | with_skill | 8 of 8 | — | 9.4 M | 6.21 | 13.6 |
| 11 fix-dashboard-p1 (run-1) | with_skill | 6 of 7 | One patch per fixed finding, no commits | 25.0 M | 16.96 | 44.5 |
| 12 verify-dashboard-after-fix (run-1) | with_skill | 5 of 5 | — | 2.2 M | 1.48 | 6.4 |
| 14 report-honesty-broken-form (run-1) | with_skill | 5 of 5 | — | 0.4 M | 0.45 | 0.9 |
| 19 audit-standard-journey-app (run-1) | with_skill | 8 of 9 | Precision after verification is at least 0.8 | 28.1 M | 21.69 | 34.4 |
| 19 audit-standard-journey-app (run-1) | without_skill | 2 of 2 | — | 0.5 M | 0.66 | 1.8 |

Blind mapping of every reported problem to the seeded defects (adjusted-Wald 95% intervals):

| Eval | Arm | Problems reported | Recall by meaning | Precision (seeded or real) | Precision (seeded only) |
|---|---|---|---|---|---|
| 19 | with_skill | 41 | 9/11 = 82% [51%–96%] | 26/41 = 63% [48%–76%] | 11/41 = 27% [16%–42%] |
| 19 | without_skill | 17 | 9/11 = 82% [51%–96%] | 15/17 = 88% [64%–98%] | 11/17 = 65% [41%–83%] |
