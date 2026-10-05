<!-- ui-evaluator: debt register template v1 (FRAMEWORK §4.7, QUALITY-BAR USE-06 and §6) -->
# Debt register

<!--
Lives at .ui-evaluator/debt.md. One row per deferred finding. A deferral counts as a decision for USE-06 only when it
has a reason, an owner and a revisit trigger; a row missing any of them is a gap, not a decision.
What lands here:
- P2 and P3 findings outside the "fix now" queue, which holds P0, P1 and quick P2 wins with ease of fix 1 (QUALITY-BAR §6);
- findings reverted after three fix attempts (FRAMEWORK §10);
- deferred soft tells: left in the shipped UI without an accepted_tells entry in DESIGN.md, each with an owner; more than one
  per page fails G4 (QUALITY-BAR G4, ADR-031);
- G2 (accessibility) failures only with a remediation plan in the reason, and then no level that needs G2 is reached
  (QUALITY-BAR §2.3).
Waivers are not debt: owner waivers live in .ui-evaluator/waivers.json. A revisit trigger is an event or a date
("the profile pages are replaced", "2026-12-01, whichever comes first"), never "later".
When a finding is fixed and verified, dismissed or re-prioritised, move its row to Closed and say how.
Examples describe a fictional veterinary clinic's booking tool.
-->

## Open

| Finding | Title | Priority | Reason deferred | Owner | Revisit trigger | Deferred on |
|---|---|---|---|---|---|---|
| F-0013 | Vet profiles open in a new page and the chosen date is lost on return | P2 | The profile pages are being rebuilt on the clinic's new site; a fix to the old pages would be thrown away | Web team lead | New profile pages merged, or 2026-12-01, whichever comes first | 2026-10-02 |
| F-0015 | Opening hours on the zh-CN pages use a 12-hour clock | P3 | Waiting for the translation service's next strings delivery, which replaces these labels | Content owner | Next translation delivery | 2026-10-02 |

## Closed

| Finding | Closed on | How |
|---|---|---|
| [F-0000] | [YYYY-MM-DD] | [fixed and verified in run [id] · dismissed by [who], reason · re-prioritised to P1 and fixed] |
