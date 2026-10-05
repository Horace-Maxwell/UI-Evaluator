# Workflow: fix

Resolve findings one at a time, in priority order. Each fix is made at the narrowest correct layer and verified against the criterion that raised it, with regression checks and an independent close-out. A fix is a hypothesis until it is re-tested.

## Contents
1. Purpose and when to use
2. Preconditions
3. Inputs and outputs
4. Steps
5. User checkpoints
6. Exit criteria
7. Degraded operation
8. Common failure modes

## 1. Purpose and when to use

Use this workflow:
- after an `audit` or `ingest` leaves open findings;
- when the owner says "fix these" or names finding IDs.

Read `../methods/fix-loop.md` for the full procedure. This file is the operational checklist.

**Modes:**

| Mode | Behaviour |
|---|---|
| **Direct** (default in interactive sessions) | The owner approves the plan, then you work through it |
| **Auto** | Only auto-fix-tier findings and P0/P1 findings with one unambiguous fix run unattended. Taste-dependent and ask-tier items are batched into one question set. The pause conditions in §5 always apply |

## 2. Preconditions

| Precondition | Check | If missing |
|---|---|---|
| A current audit run | `.ui-evaluator/runs/LATEST` is newer than the last code change in scope | run `audit` (quick depth is enough for a small scope) |
| A clean working tree and a recorded baseline | `git status` is clean; record `git rev-parse HEAD` | commit or stash first. If commits are not allowed, use checkpoint mode: one patch file per finding in `.ui-evaluator/runs/<id>/patches/` |
| Work on a branch | `git switch -c ui-fixes/<run-id>` | create one. Never fix on the default branch without the owner's say-so |
| App running | journeys replay | start it |

## 3. Inputs and outputs

**Inputs:** the fix queue; `DESIGN.md`; the knowledge files for each finding's domain.

**Outputs:**
- one commit (or patch) per finding;
- updated finding statuses with verification records;
- `runs/<id>/fix-review.json` from the independent reviewer;
- debt-register entries for deferred items.

## 4. Steps

1. **Build the queue.** Run `uie findings queue`. It orders open findings:
   1. by priority (P0 → P3);
   2. then by dependency layer (tokens → layout and spacing → typography → colour → components and states → motion → copy), so that later fixes are not undone by earlier ones;
   3. then by ease of fix;
   4. then by frequency.

   The "fix now" queue holds P0, P1 and quick P2 wins (ease 1). Everything else is proposed for the debt register [HCI-077].

2. **Triage each item** before touching code [HCI-037]:
   - obvious cause, quick fix → fix now;
   - obvious cause, slow fix → fix now if it is P0 or P1, otherwise propose deferral;
   - unknown cause → gather evidence first (`uie probe`, the code reviewer);
   - possible artefact of the evaluation method → send it back to the verifier, don't fix it.

   Divergent and disputed findings are not fixed until evidence settles them (`study`, `ingest`).

3. **Write the fix contract** for the item. The acceptance criterion is the **originating check**:
   - the same rule threshold, for deterministic findings;
   - the same probe no longer reproducing the problem, for judged findings;
   - the same walkthrough step now passing, for CW findings.

   Add the regression checks that apply. Write it in one or two lines in the finding (`uie findings set <id> --note "contract: …"`) [IMP-060].

4. **Choose the narrowest correct layer.** Classify the drift:
   - **missing token** → add or adjust the token in `DESIGN.md` and the token source;
   - **one-off value** → replace it with the existing token;
   - **conceptual mismatch** → raise it with the owner (it may need `direct`);
   - **local defect** → fix the component.

   Prefer CSS over markup changes and markup over behaviour changes when each would resolve the problem. Touch only files related to the finding [IMP-045].

5. **Make the change.** Run `uie findings set <id> --status in_progress` first. Resolve the *observed problem*. The recommendation is advisory, and a different implementation that resolves the problem is fine. Never "fix" a tell by swapping to the next fashionable default. Decide something specific from the brief.

6. **Re-test this fix** with cheap deterministic checks:
   - the originating check:
     - deterministic: `uie audit --checks <the finding's check> --route <route>`, or `uie lint <file>`;
     - judged: `uie probe` with the finding's reproduction steps;
     - CW: `uie journey <id>`;
   - the adjacent happy path at the affected viewport: `uie journey <id>`;
   - regressions: `uie capture --route <route>`, then `uie diff <baseline-run> <current-run> --visual --aria --findings`. Any *introduced* deterministic finding blocks. Pixel changes outside the target's box plus margin are flagged as collateral. Lost names, roles or landmarks in the ARIA snapshot are regressions [TOOL-24/26];
   - console parity: no new errors.

7. **Classify and record:**
   - **passed:** `uie findings set <id> --status fixed`, then commit. Your own re-test never sets `verified`: a judged finding becomes `verified` only through the independent close-out in step 9, a deterministic one when the re-run in `verify` no longer reports it (ADR-030);
   - **partial:** keep it open, note what remains, and count an attempt;
   - **regression:** revert the change and count an attempt.

   After 3 attempts, revert, then defer (`--status deferred` with a reason and owner in the debt register) or escalate (fresh context, a stronger model, or the owner).

   Commit message format: `fix(ui): F-0042 Error message says how to fix the date`. The body names the criterion, the layer changed and the checks run. One finding per commit, so that any fix can be reverted or bisected alone [LOOP #2].

8. **Watch the risk score** every 5 fixes [LOOP gstack]:
   - +15% per revert;
   - +5% per shared component touched;
   - +1% per fix after the tenth;
   - +20% for any change to files unrelated to the finding.

   Above 20%, pause and ask the owner. Hard cap: 30 fixes per run.

9. **Independent close-out**, once per round. Run `uie run new --label fix-review`, `uie capture` for the affected routes, then `uie packet --role fix-reviewer`, and spawn the fix reviewer (`../evaluators/fix-reviewer.md`). The reviewer scores each claimed fix as `confirmed_fixed`, `partially_fixed` or `not_fixed` from visible evidence, names up to three regressions, and gives a disposition: recapture, rebuild, fix or ship. Run `uie findings apply-verdicts --fix-review`:
   - `confirmed_fixed` → `verified` for judged findings; deterministic findings are verified by the re-run in `verify` (ADR-030);
   - `partially_fixed` or `not_fixed` → `reopened`.

   `partially_fixed` or `not_fixed` never leads to "ship" [IMP-040].

   When every fix in the round was deterministic and the re-run has already verified them, there is no item to score. The close-out still happens as a regression review: `uie packet --role fix-reviewer --baseline <run>` builds a packet with no items, and the reviewer compares the screens for collateral damage, names up to three regressions and gives a disposition. Your own look at the pixel diff is not that review.

10. **Bound the judgment rounds.** At most 2 judgment rounds unattended. A third is allowed only if deterministic gates still fail. Stop immediately if a round resolves nothing. Taste-only rules (soft tells, design-panel findings without agreement) get exactly one pass [LOOP #6].

11. **Hand off to `verify`** for the gate re-computation and the run diff.

## 5. User checkpoints

- Before starting (Direct mode): show the queue with the proposed debt-register deferrals and get approval.
- Pause conditions (both modes): the risk score is over 20%; a fix needs a conceptual change to `DESIGN.md`; a fix would change factual copy or remove functionality; 3 failed attempts on a P0; a fix touches authentication, payment or data deletion flows.
- Auto mode: one batched question set for taste and ask-tier items.

## 6. Exit criteria

One of:
- the "fix now" queue is empty;
- the budget, risk or zero-progress stop was reached and recorded.

In every case:
- each fixed finding has a verification record;
- the fix reviewer's verdicts are applied;
- deferred items are in the debt register with an owner and a trigger.

Next: `verify`.

## 7. Degraded operation

| Situation | What changes |
|---|---|
| Commits not allowed | Checkpoint mode: patch files per finding plus the baseline SHA, so any single fix can still be reverted |
| No subagents for the fix review | Do the review in a fresh pass, reading only the fix-review packet. Mark it `DEGRADED: single-context`. Because you made the fixes, your verdicts are not independent evidence: judged findings stay `fixed` until the owner confirms them (`uie findings set <id> --status verified --by human:<name>`) or an isolated reviewer repeats the review; deterministic findings are still verified by the re-run in `verify` (ADR-030). Only the owner sets `resolved` |
| No source (URL only) | No fixes. Produce recommendations with evidence in the report |
| No browser layer | Only `uie lint`-checkable findings can be verified. Others stay `fixed` (unverified) and are listed |

## 8. Common failure modes

| Failure | Prevention |
|---|---|
| Fixing several findings in one change, then not knowing which caused a regression | one finding per commit; the risk score |
| Self-certifying | the fix reviewer is independent; the builder's narration is not evidence |
| Thrash: re-running whole passes that undo each other | targeted re-tests per finding; the dependency-layer order |
| Swapping one default for another to silence a tell | decide from the brief; DEC criteria; the fix reviewer checks for new tells |
| Silencing a detector instead of fixing | waivers only from the owner, with a reason, value-scoped [IMP-050] |
| Endless polishing of taste items | one pass for taste-only rules; bounded rounds |
