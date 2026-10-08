# Agent-level evals, 2026-10-08

| Eval | Arm | Assertions passed | Failed | Tokens | Cost (USD) | Minutes |
|---|---|---|---|---|---|---|
| 20 audit-standard-tool-library (run-1) | with_skill | 9 of 9 | — | 49.2 M | 30.74 | 64.8 |
| 20 audit-standard-tool-library (run-2) | with_skill | 4 of 7 (+2 pending) | Verification and three blind ratings exist; Recall of the seeded defects is at least 0.6; Report language passes the lint and the level is not overstated | 37.8 M | 22.18 | 34.3 |
| 20 audit-standard-tool-library (run-3) | with_skill | 8 of 9 | Precision after verification is at least 0.8 | 49.6 M | 31.86 | 68.1 |
| 20 audit-standard-tool-library (run-1) | without_skill | 2 of 2 | — | 1.3 M | 1.25 | 4.1 |
| 20 audit-standard-tool-library (run-2) | without_skill | 2 of 2 | — | 1.1 M | 1.09 | 3.4 |

Blind mapping of every reported problem to the seeded defects (adjusted-Wald 95% intervals):

| Eval | Arm | Problems reported | Recall by meaning | Precision (seeded or real) | Precision (seeded only) |
|---|---|---|---|---|---|
| 20 | with_skill | 101 | 12/13 = 92% [65%–100%] | 77/101 = 76% [67%–84%] | 53/101 = 52% [43%–62%] |
| 20 | with_skill | 105 | 13/13 = 100% [73%–100%] | 65/105 = 62% [52%–71%] | 51/105 = 49% [39%–58%] |
| 20 | without_skill | 21 | 13/13 = 100% [73%–100%] | 21/21 = 100% [82%–100%] | 14/21 = 67% [45%–83%] |
| 20 | without_skill | 20 | 13/13 = 100% [73%–100%] | 20/20 = 100% [81%–100%] | 13/20 = 65% [43%–82%] |
