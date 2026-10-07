I fixed the P1s that had one clear fix, plus the P0s above them. The P0 that matters most for growers, manual dosing quietly going back to automatic, I couldn't fix: it needs your answer first (question 1 below). Nothing is committed. You're on a new branch, `ui-evaluator/fixes`, cut from `665ca18`, and the changes are uncommitted in `index.html` and `styles.css`.

**The baseline audit wasn't finished.** Its automated checks had run, but nothing had been merged or rated, so no P1 list existed yet. I finished it first:
- isolated evaluators (three heuristic passes, a walkthrough of "take dosing off automatic", an accessibility auditor and a code reviewer);
- a verifier, then three blind severity raters.

I skipped the design critics because you're leaving cosmetic work for later. The raters put two problems at **P0**, above P1. I took that as in scope, since you clearly want the serious problems handled.

## Fixed
| Finding | Problem | Fix |
|---|---|---|
| F-0019 (P0), plus the same defect as F-0025, F-0032 and F-0020 | Sensor status was only a coloured dot. Colour-blind growers couldn't tell which sensor needs attention, and screen readers heard nothing. | Each status cell now says **OK / Warning / Alarm** next to the dot. |
| F-0003 and F-0004 (P1) | "Last reading 14:05" and the reading labels were 2.42:1, hard to read under grow lights. | Changed to the page's existing dark grey, about 9:1. |
| F-0021 (P1) | In high-contrast (forced-colours) mode the dosing switch disappeared. | The switch now draws with on and off clearly different. |

**How these were checked:**
- After each fix I re-ran the check that raised the problem and replayed the dosing journey. The full audit shows nothing new.
- A separate reviewer, who never saw my notes, confirmed all seven fixes. It found one regression: the new status words didn't fit the narrow Sensors column ("Warning" was clipped on phones). I fixed that in a second round.
- The second-round reviewer found only cosmetic leftovers: at 320 px the word sits under its dot, and at 1280 px the table is tight. Both are in the debt register, so its verdict was "fix", not "ship".
- **Wording:** I chose "OK / Warning / Alarm" myself, to match the three states the page already had. Change them if the bay-door checklist uses other words.

## Waiting on you (not guessed)
1. **F-0030 (P0): does the dosing switch actually control the pumps?** It only changes the page (`dashboard.js` sends nothing), so after a reload it shows automatic again. A grower could drain the tank believing dosing is off.
   - If it should drive the controller, the page needs to read the real mode and only say "now manual" once the controller confirms.
   - If it doesn't, it shouldn't claim the pumps changed.
2. **F-0029 and F-0039 (P1):** how old can a reading get before the page should mark it stale? And does the controller export include a full date and time? Right now it only shows "14:05".
3. **F-0063 and F-0064 (P1), for the growing lead:** what does the reservoir float alarm mean, and what should a volunteer do about it? Should the Reservoir card's green "Topped up 09:30" change while the float is in alarm?

## Patches to review
In `.ui-evaluator/runs/20261007-002136-baseline-audit/patches/`, one per finding. Each starts with what it fixes, how it was checked and what it assumes. They apply cleanly in this order on `665ca18`:
1. `F-0003.patch`
2. `F-0021.patch`
3. `F-0019.patch`
4. `F-0019-regression.patch`

`F-0004.txt` explains that F-0004 shares F-0003's change. One reverted attempt is kept for reference.

## Left for later
All 27 P2 and P3 findings are in `.ui-evaluator/debt.md`. Most are cosmetic. A few aren't cosmetic but fall below the P1 line:
- no target ranges shown on the readings;
- "Warm" doesn't say whether it's out of range;
- the manual-mode message tells growers to start the pumps, but there's no way to start them;
- two minor WCAG items (a duplicate "Sensors" region name, and the "Readings" link not matching its section heading).

**Readiness:** the page doesn't reach any assurance level yet, including the L3 target. Those P2/P3 items, the open questions and the skipped design critics still block it. The next step is the `verify` workflow once you've answered the questions.
