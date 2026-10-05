# Workflow: verify

Confirm that fixes hold and nothing regressed, then recompute the gates. This answers "is it ready?" with evidence: what changed between two runs, which fixes an independent reviewer accepts, and which assurance level the current build reaches.

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
- after `fix`;
- before a release or demo;
- when the owner asks "is it ready", "can we ship" or "did that fix work";
- when the UI changed since the last audit, to find stale findings.

## 2. Preconditions

| Precondition | Check | If missing |
|---|---|---|
| A baseline run to compare against | `.ui-evaluator/runs/` contains the audit run the fixes came from | run `audit` first. Without a baseline, verify becomes an audit |
| The build to verify is running and frozen | journeys replay; no edits in progress | start it; finish or stash work |
| Toolchain verified this session | `uie doctor` | run it |

## 3. Inputs and outputs

**Inputs:** the baseline run ID; the current build; the findings register.

**Outputs:** a new run containing:
- `diff/` with `cleared`, `introduced` and `persisting` sets, pixel diffs and an ARIA diff;
- `fix-review.json`;
- `gates.json`;
- the report;
- updated finding statuses, including any `stale` detections.

## 4. Steps

1. **Open a run.** `uie run new --label verify`. Match the baseline's scope, unless the owner widened it.

2. **Re-collect evidence.** Run `uie capture`, `uie audit` and `uie lint` over the same scope, and `uie journey <id>` for every critical journey.

3. **Diff against the baseline.** Run `uie diff <baseline-run> <this-run> --visual --aria --findings`. Comparison is set-based on finding identity, never on counts: rule ID + normalised route for a deterministic finding, however many instances it lists; criterion + location + normalised snippet for a judged one (ADR-033). A drop from 12 to 10 findings can hide 3 cleared and 1 introduced [03 §3.3].
   - **cleared:** in the baseline, absent now (not yet proof of a fix: a scope change also clears findings);
   - **introduced:** absent in the baseline, present now. Every introduced deterministic finding blocks until explained;
   - **persisting:** present in both. A deterministic finding whose rule still fires on its route with fewer instances is persisting and partially fixed (k of n instances cleared); new instances on that route are listed inside it as introduced instances, which the fix reviewer treats as possible regressions.

   A deterministic finding marked `fixed` that is cleared under the baseline's scope moves to `verified`: the re-run of its check is evidence the fixer did not produce (ADR-030). One that persists, even with fewer instances, moves to `reopened`. Pixel changes outside the fixed findings' areas and lost ARIA names, roles or landmarks are listed as possible collateral.

4. **Mark stale findings.** Findings whose evidence anchor no longer matches the UI (the element changed or disappeared) become `stale` automatically. Re-check each with `uie probe`, or send it to the verifier. Never report a stale finding as current (EVD-08).

5. **Independent fix review.** If `fix` did not already review the latest fixes, run `uie packet --role fix-reviewer` and spawn the reviewer (`../evaluators/fix-reviewer.md`). Then run `uie findings apply-verdicts --fix-review`:
   - `confirmed_fixed` → `verified` for judged findings (deterministic findings are verified by step 3);
   - `partially_fixed` or `not_fixed` → `reopened`.

   A human may also confirm a fix: `uie findings set <id> --status verified --by human:<name>`. Never set `verified` on your own re-check; your re-test only reaches `fixed` (ADR-030).

6. **Judged findings.** For judged findings marked fixed (heuristic, walkthrough, critic), the reviewer's verdict is the verification. If the change was large (a new layout or flow), run a quick audit pass on the changed surfaces (`audit` with `--quick`, scoped to the routes). Large changes can create new judged problems that a diff cannot see.

7. **Recompute the gates.** `uie gates --target <level>`.

8. **Report.** `uie report`. The report leads with:
   - the achieved level vs the target, and the blocking criteria;
   - cleared, introduced and persisting counts, with the introduced items listed and partially fixed findings shown with their instance counts;
   - the fix-review dispositions;
   - what still needs a human (L3) or users (L4).

## 5. User checkpoints

Show the verdict plainly:

> "L2 reached (target L3). Blocking for L3: 2 P1 findings need your confirmation, and 6 WCAG criteria need a human check."

Then ask the owner to confirm P0/P1 findings and the design verdict through the agree/disagree sheet if L3 is the target.

## 6. Exit criteria

- Every finding fixed since the baseline is `verified`, `reopened` or `stale`-rechecked. A judged finding whose review ran without isolation stays `fixed` and is listed for the owner's confirmation (§7).
- There are no unexplained introduced findings.
- The gates are computed and the report is written.
- The owner knows exactly what remains for the target level.

## 7. Degraded operation

| Situation | What changes |
|---|---|
| No browser layer | Only lint-based findings can be re-verified. Every browser criterion is `not_run`, and the level cannot be confirmed |
| No subagents | The fix review is done in a fresh pass from its packet and marked `DEGRADED: single-context`. You made the fixes, so its verdicts are not independent: judged findings stay `fixed` until the owner confirms them (`--by human:<name>`) or an isolated reviewer repeats the review. Deterministic findings still reach `verified` through the re-run in step 3 (ADR-030). Nothing reaches `resolved` without the owner |
| Different machine or OS than the baseline | Pixel diffs are unreliable across machines. Rely on finding identity and ARIA diffs, and re-capture a fresh baseline if needed |

## 8. Common failure modes

| Failure | Prevention |
|---|---|
| Count-based "fewer findings = better" | identity-based set difference |
| Comparing runs with different scopes or matrices | matching scope; the manifest records the matrix; mismatches are flagged by `uie diff` |
| Calling it shipped while P1 decisions are pending | USE-06; the report lists blocking criteria |
| Noisy metrics (vitals) flipping verdicts | vitals are advisory; trends are compared like-for-like only |
