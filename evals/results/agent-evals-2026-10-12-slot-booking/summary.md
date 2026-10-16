# Agent-level evals, 2026-10-16

| Eval | Arm | Assertions passed | Failed | Tokens | Cost (USD) | Minutes |
|---|---|---|---|---|---|---|
| 21 audit-standard-slot-booking (run-1) | with_skill | 9 of 9 | — | 40.8 M | 27.96 | 51 |
| 21 audit-standard-slot-booking (run-2) | with_skill | 9 of 9 | — | 38.2 M | 26.80 | 68.4 |
| 21 audit-standard-slot-booking (run-3) | with_skill | 9 of 9 | — | 35.0 M | 26.37 | 55.8 |
| 21 audit-standard-slot-booking (run-1) | without_skill | 1 of 2 | The reply puts the fixes in priority order and says what needs a person | 0.6 M | 1.06 | 3.6 |
| 21 audit-standard-slot-booking (run-2) | without_skill | 1 of 2 | The reply puts the fixes in priority order and says what needs a person | 0.7 M | 1.14 | 3.5 |
| 21 audit-standard-slot-booking (run-3) | without_skill | 2 of 2 | — | 0.8 M | 1.15 | 3.5 |
| 21 audit-standard-slot-booking (run-1) | without_skill_nobrowser | 2 of 2 | — | 0.6 M | 1.03 | 2.9 |
| 21 audit-standard-slot-booking (run-2) | without_skill_nobrowser | 2 of 2 | — | 0.4 M | 0.92 | 2.5 |
| 21 audit-standard-slot-booking (run-3) | without_skill_nobrowser | 2 of 2 | — | 0.7 M | 1.16 | 3.8 |

Blind mapping of every reported problem to the ground truth (adjusted-Wald 95% intervals):

| Eval | Arm | Problems reported | Recall by meaning | Precision (in the ground truth or real) | Precision (in the ground truth only) |
|---|---|---|---|---|---|
| 21 | with_skill | 35 | 13/14 = 93% [66%–100%] | 34/35 = 97% [84%–100%] | 29/35 = 83% [67%–92%] |
| 21 | with_skill | 42 | 14/14 = 100% [75%–100%] | 40/42 = 95% [83%–100%] | 34/42 = 81% [66%–90%] |
| 21 | with_skill | 47 | 13/14 = 93% [66%–100%] | 44/47 = 94% [82%–98%] | 38/47 = 81% [67%–90%] |
| 21 | without_skill | 17 | 12/14 = 86% [59%–97%] | 15/17 = 88% [64%–98%] | 12/17 = 71% [47%–87%] |
| 21 | without_skill | 22 | 12/14 = 86% [59%–97%] | 17/22 = 77% [56%–90%] | 13/22 = 59% [39%–77%] |
| 21 | without_skill | 17 | 13/14 = 93% [66%–100%] | 15/17 = 88% [64%–98%] | 13/17 = 76% [52%–91%] |
| 21 | without_skill_nobrowser | 20 | 13/14 = 93% [66%–100%] | 18/20 = 90% [69%–98%] | 13/20 = 65% [43%–82%] |
| 21 | without_skill_nobrowser | 21 | 12/14 = 86% [59%–97%] | 17/21 = 81% [59%–93%] | 12/21 = 57% [37%–76%] |
| 21 | without_skill_nobrowser | 21 | 13/14 = 93% [66%–100%] | 18/21 = 86% [65%–96%] | 13/21 = 62% [41%–79%] |
