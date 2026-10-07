I fixed 9 of the 11 serious problems on the bay monitor and left them as patches, nothing committed. The other two are a P0 and a P1 that need an answer from you or the growing lead.

**First, the queue was empty.** The earlier audit had only run the automated checks, and its results were never rated. So I finished the audit before fixing anything: one usability reviewer, one walkthrough of the "switch dosing to manual" task, an accessibility review, a checker that re-tested every reported problem, and three raters who scored severity without seeing who found what. That gave 3 P0s and 8 P1s. You asked for P1s; I fixed the P0s as well, since they are worse.

## What's fixed
| Finding | Problem | Fix |
|---|---|---|
| F-0031 + F-0033 (P0) | Sensor status was only a coloured dot. Colour-blind growers couldn't tell red from green, and screen readers heard nothing. | Each row now says **OK**, **Check** or **Fault** next to the dot. A follow-up patch makes the table fit on a 320 px phone. |
| F-0004 + F-0003 (P1) | "Last reading 14:05" and the card labels were pale grey (2.4:1 contrast) | They now use the darker grey already used elsewhere on the page |
| F-0025 (P1) | The Reservoir card showed a green chip while the float sensor was in Fault | Red "Float sensor fault" chip; "Topped up 09:30" stays as plain text |
| F-0029 (P1) | One tap turned automatic dosing back on | Switching to manual is still one tap. Switching back asks: "Check the reservoir is full first", with **Turn automatic on** / **Keep manual** buttons. Escape cancels. |
| F-0020, F-0032 (P1) | In Windows high-contrast mode the dosing switch and the status dots disappeared | Both now draw in system colours |
| F-0026 (P1, partly) | Cards said "In range" or "Warm" without the range | pH, EC and water temperature now show their targets from PRODUCT.md. Dissolved oxygen has no documented target, so I left it blank rather than invent one. |

**How they were checked:**
- Every fix was re-tested on its own, the "switch dosing to manual" task passed every time, and no new problems were introduced.
- A separate reviewer, who saw only the before-and-after screens, confirmed the fixes. It flagged one regression: at 320 px the new status words were cut off at the table edge. A second patch fixed that, and a second review found nothing else and cleared the round.
- The two contrast fixes were also confirmed by re-running the automated checks.

## Needs you
- **F-0022 (P0): after a page reload the switch shows "automatic" again.** I didn't fix this. The page has no connection to the pump controller, so saving the setting in the browser could show "manual" while the pumps are still dosing. Which system owns the dosing mode, and how should the page read it back? It stays open; P0s can't be put off.
- **F-0024 (P1): a fault doesn't say what to do.** This needs the growing lead's wording. Suggested: "Reservoir float: Fault. Check the float in the tank, then tell the growing lead."
- **Wording I chose and you should check:** the status words "OK", "Check" and "Fault", and the confirmation text for turning automatic back on.

## Left for later, as you asked
The cosmetic items are in `.ui-evaluator/debt.md`. Some of them are why the automated quality checks still fail and no quality level is reached yet; the page's target is level 3, which needs the growers to confirm the severe findings.

The new red reservoir chip uses the same chip style as the others, so it has their cramped padding and slow colour fade. Both are on that list.

Reaching the target also needs some checks that only people can do, including a VoiceOver run on the iPad.

## Reviewing the patches
The patches are in `.ui-evaluator/runs/20261006-144207-baseline-audit/patches/`, one per finding, with the reasoning and test results at the top of each. Apply them in this order to commit `00bc7cb`: F-0031, F-0004, F-0026, F-0025, F-0029, F-0020, F-0032, then F-0031-r2-320px. I checked that they apply cleanly in that order and give exactly what's in your working tree now.

The working tree already has all of them applied, with nothing committed. That `runs/` folder is git-ignored, so copy the patches out if you want them in the repo.

The full report is at `.ui-evaluator/runs/20261006-160813-fix-r1-320/report.md`.
