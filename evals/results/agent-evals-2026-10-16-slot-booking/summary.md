# Agent-level evals, 2026-10-16

| Eval | Arm | Assertions passed | Failed | Tokens | Cost (USD) | Minutes |
|---|---|---|---|---|---|---|
| 21 audit-standard-slot-booking (run-1) | with_skill | 9 of 9 | — | 35.2 M | 25.44 | 53.7 |
| 21 audit-standard-slot-booking (run-2) | with_skill | 9 of 9 | — | 37.1 M | 26.99 | 54.6 |
| 21 audit-standard-slot-booking (run-3) | with_skill | 9 of 9 | — | 42.9 M | 26.94 | 39.2 |

Blind mapping of every reported problem to the ground truth (adjusted-Wald 95% intervals):

| Eval | Arm | Problems reported | Recall by meaning | Precision (in the ground truth or real) | Precision (in the ground truth only) |
|---|---|---|---|---|---|
| 21 | with_skill | 37 | 13/14 = 93% [66%–100%] | 34/37 = 92% [78%–98%] | 29/37 = 78% [63%–89%] |
| 21 | with_skill | 35 | 13/14 = 93% [66%–100%] | 31/35 = 89% [73%–96%] | 25/35 = 71% [55%–84%] |
| 21 | with_skill | 32 | 13/14 = 93% [66%–100%] | 30/32 = 94% [79%–99%] | 25/32 = 78% [61%–89%] |
