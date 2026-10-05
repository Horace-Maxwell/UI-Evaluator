# Workflow: audit

Analytical evaluation with HCI rigour. Deterministic checks first. Then several isolated evaluators apply heuristic evaluation, cognitive walkthrough, design critique, an accessibility review and a code review. A skeptical verifier filters their candidates, and at least three blind raters score severity. The result is a set of gate states, an assurance level and an honest report.

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
- after `build`;
- before a release;
- when the owner asks to review, evaluate, critique or audit a UI;
- after a batch of fixes, at the depth the change deserves.

| Depth | Use for | Spawns | Reaches at most |
|---|---|---|---|
| `quick` | a quick look, one component, an early prototype | every deterministic check, 1 heuristic pass (labelled single-pass), 1 design critic (feedback, not a G6 verdict) + verifier | L1 — the auditor-judged G2 rows (A11Y-02 leftovers, A11Y-19, A11Y-27) are listed for judgement, not claimed |
| `standard` (default) | most audits and pre-release checks | 3 heuristic evaluators, walkthroughs of critical journeys, 3 critics, accessibility auditor, code reviewer, verifier, 3 raters (about 12 runs) | L2 |
| `rigorous` | releases, redesigns, high stakes | 5 heuristic evaluators across ≥ 2 model configurations, walkthroughs of all journeys, 5 critics, pairwise comparison with the baseline, then human confirmation | L3 |

Tell the owner the depth and its approximate cost before starting. Record the depth in the run.

## 2. Preconditions

| Precondition | Check | If missing |
|---|---|---|
| Context | `PRODUCT.md` (DEC-01), journeys, `.ui-evaluator/config.json` | `setup` |
| App running at the configured base URL | `uie journey <id>` reaches its start state | start it with the configured command in the background |
| Toolchain verified this session | `uie doctor` | run it; deterministic gates are `not_run` without it |
| Scope frozen | no edits during the audit | finish or stash in-progress work. Auditing a moving target produces stale findings |

## 3. Inputs and outputs

**Inputs:** the running UI; `PRODUCT.md`; `DESIGN.md`; journeys; the config; a baseline run, if one exists.

**Outputs** in `.ui-evaluator/runs/<run-id>/`:

| Artifact | Contents |
|---|---|
| `manifest.json` | the run record |
| `evidence/` | screenshots, ARIA snapshots, DOM and axe data, crops |
| `tool-findings.jsonl` | deterministic findings |
| `packets/` | role inputs |
| `evaluators/`, `cw/`, `panel/` | candidate findings, walkthrough records, critic verdicts |
| `merged.json` | merged candidates and merge proposals |
| `verifier.json` | verdict per candidate |
| `ratings/` | blind severity ratings |
| `findings.json` | the run's final findings |
| `debrief.md` | the lead's synthesis |
| `gates.json` | criterion and gate states, achieved level |
| `report.md`, `report.html`, `agree-disagree.csv` | the report and the review sheet |

## 4. Steps

### Evidence

1. **Open a run.** `uie run new --label audit-<depth>`. This freezes scope (routes, states, matrix) and starts the manifest.

2. **Capture.** `uie capture` takes deterministic screenshots and ARIA snapshots over routes × state recipes × widths × themes, plus reduced-motion, forced-colours and colour-vision-deficiency evidence. Captures that fail the validity check (blank, wrong size, fonts not loaded, mid-animation) are retaken automatically. Never evaluate an invalid capture [IMP-031].

3. **Run deterministic checks.**
   - `uie audit` runs axe, the keyboard walk with focus visibility and obscuring, the dialog contract, reflow, text spacing, text resize, targets, contrast, forms, live regions, language, cross-page consistency, style census, DOM tell detection, motion inspection and vitals.
   - `uie lint` runs the static source rules (when source is present).
   - At every depth, run the full `uie audit`. L1 needs every G1–G3 check, so a check you skip leaves its criteria `not_run`, and `not_run` never passes. `uie audit --quick` is the build loop's fast self-check (routes, console, axe, keyboard, layout, contrast, census, tells, copy). It cannot reach a level on its own.

   Results go to `tool-findings.jsonl` with E1 evidence and rule-declared severity [ADR-010].

4. **Replay journeys.** Run `uie journey <id>` for each critical journey. A failure is a FUN-03 finding with per-step evidence.

### Independent inspection

5. **Build packets.** Run `uie packet --role <role>` for each role you will spawn. Packets contain exactly what each role may see. Black-box roles never get source paths. The critics' detector section stays sealed until each critic's specificity verdict exists [ADR-017].

6. **Spawn the evaluators in parallel, isolated** (standard depth). In Claude Code with the plugin, use the named agents. Otherwise spawn general-purpose subagents told to read the role file. Without subagents, see §7. At quick depth, spawn one heuristic evaluator and one design critic. The critic's appeal verdict and signs of unfinish go back to the builder as a fix list, because a page can pass every check and still look unfinished (ADR-035). One critic cannot meet DES-01, so G6 stays at most `degraded`.

   | Role | Count (standard) | Role file | Lens or assignment |
   |---|---|---|---|
   | Heuristic evaluator | 3 | `../evaluators/heuristic-evaluator.md` | novice, expert, accessibility-minded or mobile-first. Each applies all of H1–H10 |
   | Walkthrough evaluator | 1 per critical journey (one agent may walk several) | `../evaluators/walkthrough-evaluator.md` | the journey's persona |
   | Design critic | 3 | `../evaluators/design-critic.md` | no lens; independent judgement |
   | Accessibility auditor | 1 | `../evaluators/accessibility-auditor.md` | resolves axe `incomplete`; colour-only meaning, forced colours, semantics |
   | Code reviewer | 1 (if source) | `../evaluators/code-reviewer.md` | white-box: tokens, states, semantics, IME, i18n; ease of fix |

   Give each agent its packet path and output path. Each validates its own output with `uie findings validate <file>` and returns at most about ten lines. Never ask an evaluator for a fixed number of findings. "No problems found" is a valid result [HCI-025].

7. **Merge.** `uie findings merge` merges tool findings, evaluator candidates, walkthrough failures and critic design findings on a deterministic key (same locator + same failure mechanism + same state). It keeps every label and piece of evidence, and lists text-similarity merge *proposals* separately. Review the proposals and accept only true duplicates with `uie findings merge --accept <proposal-ids>` [EVAL C5].

### Verification and rating

8. **Verify.** Run `uie packet --role finding-verifier`, spawn the verifier (`../evaluators/finding-verifier.md`), then run `uie findings apply-verdicts`. The verifier re-checks every judged candidate:
   1. evidence resolution;
   2. harness filter;
   3. scope;
   4. reproduction with `uie probe`;
   5. absence evidence;
   6. dismissal ledger;
   7. confidence-ceiling flag (iteration ≥ 2, single pass); the flag does not change the verdict, and the ceiling is applied after rating (step 10).

   Rejected candidates are kept for statistics, never reported as findings. Read `../methods/verification.md`.

9. **Locate and estimate ease of fix.** Confirmed findings from black-box roles still lack source locations and ease-of-fix estimates.
   - Run `uie packet --role code-reviewer --phase locate`, and spawn the code reviewer again for a short second pass. It attaches file:line to the confirmed element-level findings and estimates ease of fix (1–4) for every confirmed finding.
   - Then run `uie findings merge --apply-locate`.
   - Without a code-reviewer run, the white-box role is you: set ease with `uie findings set <id> --ease <1-4>`. Without any source, leave ease empty; it is estimated when someone with the source fixes the finding.

10. **Rate blind.** Run `uie packet --role severity-rater --n 3` and spawn three raters (`../evaluators/severity-rater.md`) in parallel. Then run `uie findings rate`. It computes the mean of the problem and trade-off values (not-a-problem votes carry no value), the spread and the priority; flags divergent findings (spread ≥ 2, or a not-a-problem vote against a mean ≥ 2.5) and sends them to `disputed`, as it does findings where more than half of the raters vote not a problem, or more than half vote trade-off (ADR-029); holds flagged single-pass findings whose mean is below 2.5 in iteration ≥ 2 [HCI-029]; and applies the criticality clamp and the G1/G2 floor. Read `../methods/severity-rating.md`.

11. **Agreement.** `uie findings agreement` reports any-two agreement between passes, detection counts, and the estimate of undiscovered problems (labelled as an estimate).

### Synthesis

12. **Debrief.** Write `runs/<id>/debrief.md`, the HE debrief from the lecture, in this order:
    1. what the passes agree on;
    2. detector-only findings;
    3. judge-only findings;
    4. detector false positives;
    5. strengths to preserve;
    6. divergent findings, as questions for user research;
    7. only then, fix ideas.

    Redesign ideas come after evaluation, never during it [HCI-017].

13. **Promote.** `uie findings promote` copies the run's confirmed, rated findings into the living register `.ui-evaluator/findings.json`. Identities that match existing findings update them rather than duplicating them.

14. **Gates.** `uie gates --target <level from PRODUCT.md>` computes every criterion state, each gate and the achieved level. `not_run` never counts as pass.

15. **Report.** `uie report` writes `report.md`, `report.html` and `agree-disagree.csv` and lints the language: wording must match evidence levels, with no completeness or causal over-claims. Read `report.md` once yourself before showing it. Fix any wording the linter flags in the debrief or in finding text, then re-run.

## 5. User checkpoints

At the end, present a short summary, not the whole report:
- the achieved level vs the target, and the blocking criteria;
- the P0/P1 findings, at most seven, each with one line of evidence;
- the divergent findings, framed as questions for users;
- strengths to keep.

Then ask 2–4 targeted questions tied to specific findings [IMP-042]: priority between areas, intended tone where critics split, what is out of scope, what is off-limits to change. Offer the next steps:
- `fix` (Direct or Auto mode);
- `study` for divergent items;
- review of the agree/disagree sheet by the owner or stakeholders, which feeds `ingest`.

## 6. Exit criteria

- All gate states are computed (EVD-04), with artifacts.
- Every reported finding is verified, rated (or carries a rule-declared severity) and evidence-anchored (EVD-05, USE-02…04).
- Independence is recorded per evaluator (EVD-07).
- The report exists and its language lint passes (EVD-06).

## 7. Degraded operation

| Situation | What changes |
|---|---|
| No subagents | Perform each role yourself, sequentially. Read only that role's packet, and finish and save its output before reading the next packet. Every affected output starts with `DEGRADED: single-context`. G5 and G6 are at most `degraded`, and the level is reported as "(degraded)" |
| An isolated CLI is available (`claude -p`, `codex exec`, `gemini -p`) and the owner opted in | Run roles there for real isolation; the provider is recorded |
| No browser layer | Static mode: critics and heuristic inspection on screenshots only; runtime claims labelled `potential — unverified`; G0–G3 `not_run`; no level |
| No source | Skip `uie lint` and the code reviewer. Fixes become recommendations |
| Quick depth | One heuristic pass, labelled single-pass; severities provisional; G5 at most `degraded` [ADR-024] |

## 8. Common failure modes

| Failure | Prevention |
|---|---|
| Auditing a build that changes mid-run | freeze scope (precondition); fingerprints mark findings `stale` |
| Capturing mid-animation or before fonts load | the capture validity gate; never evaluate invalid captures |
| Trusting a detector false positive (e.g. contrast on a mis-composited background) | the verifier reproduces; record the false positive against the rule |
| An evaluator reading source or the builder's notes | packets without source; record what each role saw |
| Quota-padded findings ("find 10 issues") | no quotas; "no problems" is valid |
| Severity copied from the detector or from the evaluator who found it | blind raters; rule-declared severity only for deterministic findings |
| A 150-item list that buries what matters | P0/P1 and quick P2 wins go to the fix queue; the rest go to the debt register [HCI-077] |
| Re-raising a finding a human dismissed | the dismissal ledger check in verification |
