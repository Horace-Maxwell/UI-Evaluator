# Agent-level evals, 2026-10-08

| Eval | Arm | Assertions passed | Failed | Tokens | Cost (USD) | Minutes |
|---|---|---|---|---|---|---|
| 20 audit-standard-tool-library (run-1) | with_skill | 2 of 7 (+2 pending) | The critical journeys were walked and the records validate; Verification and three blind ratings exist; Recall of the seeded defects is at least 0.6; Severity ratings land in the expected bands for most matched defects; Report language passes the lint and the level is not overstated | 12.4 M | 8.47 | 14.4 |
| 20 audit-standard-tool-library (run-2) | with_skill | 2 of 7 (+2 pending) | The critical journeys were walked and the records validate; Verification and three blind ratings exist; Recall of the seeded defects is at least 0.6; Severity ratings land in the expected bands for most matched defects; Report language passes the lint and the level is not overstated | 11.4 M | 8.75 | 14.3 |
| 20 audit-standard-tool-library (run-3) | with_skill | 2 of 7 (+2 pending) | The critical journeys were walked and the records validate; Verification and three blind ratings exist; Recall of the seeded defects is at least 0.6; Severity ratings land in the expected bands for most matched defects; Report language passes the lint and the level is not overstated | 13.5 M | 9.06 | 14.5 |
| 20 audit-standard-tool-library (run-4) | with_skill | 8 of 9 | Precision after verification is at least 0.8 | 58.9 M | 37.09 | 55.3 |
| 20 audit-standard-tool-library (run-5) | with_skill | 8 of 9 | Precision after verification is at least 0.8 | 42.4 M | 29.51 | 50.4 |
| 20 audit-standard-tool-library (run-6) | with_skill | 8 of 9 | Precision after verification is at least 0.8 | 54.1 M | 33.56 | 58.8 |
| 20 audit-standard-tool-library (run-1) | without_skill | 2 of 2 | — | 0.7 M | 1.04 | 3.1 |
| 20 audit-standard-tool-library (run-2) | without_skill | 2 of 2 | — | 0.8 M | 0.98 | 2.8 |
| 20 audit-standard-tool-library (run-3) | without_skill | 2 of 2 | — | 0.7 M | 0.98 | 3 |
| 20 audit-standard-tool-library (run-1) | without_skill_nobrowser | 2 of 2 | — | 0.5 M | 0.83 | 2.4 |
| 20 audit-standard-tool-library (run-2) | without_skill_nobrowser | 2 of 2 | — | 0.5 M | 0.88 | 2.7 |
| 20 audit-standard-tool-library (run-3) | without_skill_nobrowser | 2 of 2 | — | 0.4 M | 0.84 | 2.5 |

Blind mapping of every reported problem to the ground truth (adjusted-Wald 95% intervals):

| Eval | Arm | Problems reported | Recall by meaning (seeded) | Recall by meaning (all defects) | Precision (in the ground truth or real) | Precision (in the ground truth only) |
|---|---|---|---|---|---|---|
| 20 | with_skill | 89 | 12/13 = 92% [65%–100%] | 24/26 = 92% [75%–99%] | 65/89 = 73% [63%–81%] | 58/89 = 65% [55%–74%] |
| 20 | with_skill | 80 | 13/13 = 100% [73%–100%] | 23/26 = 88% [70%–97%] | 61/80 = 76% [66%–84%] | 56/80 = 70% [59%–79%] |
| 20 | with_skill | 86 | 13/13 = 100% [73%–100%] | 24/26 = 92% [75%–99%] | 69/86 = 80% [71%–87%] | 63/86 = 73% [63%–82%] |
| 20 | without_skill | 24 | 13/13 = 100% [73%–100%] | 20/26 = 77% [58%–89%] | 21/24 = 88% [68%–96%] | 20/24 = 83% [64%–94%] |
| 20 | without_skill | 24 | 13/13 = 100% [73%–100%] | 21/26 = 81% [62%–92%] | 23/24 = 96% [78%–100%] | 21/24 = 88% [68%–96%] |
| 20 | without_skill | 25 | 13/13 = 100% [73%–100%] | 20/26 = 77% [58%–89%] | 24/25 = 96% [79%–100%] | 20/25 = 80% [60%–92%] |
| 20 | without_skill_nobrowser | 27 | 12/13 = 92% [65%–100%] | 21/26 = 81% [62%–92%] | 24/27 = 89% [71%–97%] | 21/27 = 78% [59%–90%] |
| 20 | without_skill_nobrowser | 31 | 12/13 = 92% [65%–100%] | 21/26 = 81% [62%–92%] | 24/31 = 77% [60%–89%] | 22/31 = 71% [53%–84%] |
| 20 | without_skill_nobrowser | 27 | 12/13 = 92% [65%–100%] | 19/26 = 73% [54%–87%] | 25/27 = 93% [76%–99%] | 20/27 = 74% [55%–87%] |
