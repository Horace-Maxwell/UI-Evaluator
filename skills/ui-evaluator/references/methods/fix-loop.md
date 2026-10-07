# Fix loop

The procedure behind the `fix` workflow: resolve findings one at a time, at the narrowest correct layer, verify each change against the criterion that raised it, and stop inside fixed budgets. It implements FRAMEWORK §10 (P10) and METHODS §8. Readers: the lead acting as fixer, and anyone reviewing a fix round.

## Contents

1. [Purpose and when to use](#1-purpose-and-when-to-use)
2. [Inputs](#2-inputs)
3. [Procedure](#3-procedure)
   - [3.1 Preconditions](#31-preconditions)
   - [3.2 The loop at a glance](#32-the-loop-at-a-glance)
   - [3.3 Build the queue](#33-build-the-queue)
   - [3.4 Triage tiers](#34-triage-tiers)
   - [3.5 Write the fix contract](#35-write-the-fix-contract)
   - [3.6 Choose the layer](#36-choose-the-layer)
   - [3.7 Make the change](#37-make-the-change)
   - [3.8 Re-test the fix](#38-re-test-the-fix)
   - [3.9 Classify and record](#39-classify-and-record)
   - [3.10 Budgets and the risk score](#310-budgets-and-the-risk-score)
   - [3.11 The independent fix review](#311-the-independent-fix-review)
   - [3.12 Direct and Auto modes](#312-direct-and-auto-modes)
   - [3.13 Escalation](#313-escalation)
   - [3.14 Taste-only rules get one pass](#314-taste-only-rules-get-one-pass)
   - [3.15 Debt register entries](#315-debt-register-entries)
   - [3.16 What never to do](#316-what-never-to-do)
4. [Output format](#4-output-format)
5. [Quality checks](#5-quality-checks)
6. [Pitfalls](#6-pitfalls)
7. [Sources](#7-sources)

---

## 1. Purpose and when to use

- **Use it** when the owner asks for fixes: all of them, a priority level, or named finding IDs. An audit, a score or a status request does not authorise edits; offer `fix` instead [DSL-058].
- **Why one at a time.** One finding per change keeps every change attributable and revertable; small, self-contained changes are reviewed more thoroughly, carry fewer defects and are easier to roll back (Google, Small CLs). Unbounded loops degrade, so every budget below is fixed [P10].
- **Two costs of checking.** Cheap deterministic re-tests run after every change. One expensive independent judgment runs once per round over the listed fixes. Attribution stays per finding without paying for a full review per change [03 §3.2].
- **Not for** building new surfaces (`build`), changing the direction (`direct`), or `disputed` findings, which leave that state only through `study` or `ingest` (FRAMEWORK §8.2).

## 2. Inputs

- The findings register `.ui-evaluator/findings.json` and the current run `runs/<id>/`: evidence, strengths, keep lines and gate states.
- The **baseline run**: the audit run whose findings you are fixing. Every comparison is made against it.
- `DESIGN.md` (tokens, decisions log, accepted tells) and `PRODUCT.md` (the facts section).
- `.ui-evaluator/config.json`: the fix policy (commits or checkpoint mode; Direct or Auto).
- `waivers.json`, `dismissals.json`, `debt.md`, and the journeys in `.ui-evaluator/journeys/`.

## 3. Procedure

### 3.1 Preconditions

| Precondition | Check | If it fails |
|---|---|---|
| Clean tree and baseline SHA | `git status --porcelain` prints nothing; record the current commit as the baseline SHA in the run manifest | ask the owner to commit, stash or abort, and record any override, because each fix must be its own revertable change [LOOP-001] |
| Or checkpoint mode | the fix policy forbids commits | keep one patch file per finding plus the baseline SHA (§3.9); editor or harness checkpoints alone are not enough, because they may miss changes made outside the editor |
| Toolchain proven this session | the `uie doctor` smoke test passed (EVD-02) | run `uie doctor`: a tool that cannot show a true positive cannot re-test anything [LOOP-002] |
| Running app | started with the command in `config.json` | `uie` commands exit with code 1 when they cannot reach it; never read that as a pass |
| Current findings | the run's commit is the baseline SHA, and finding fingerprints match the current UI (EVD-08) | re-check stale findings or re-run `audit` before fixing [LOOP-059] |

### 3.2 The loop at a glance

```
queue ─▶ for each finding: re-check ─▶ contract ─▶ layer ─▶ change ─▶ re-test ─▶ classify ─▶ record
             every 5 fixes and after any revert: risk check
         end of round: independent fix review ─▶ disposition ─▶ next round or stop
```

### 3.3 Build the queue

Run `uie findings queue`. It orders open and reopened findings by:

1. **priority**: P0, P1, P2, P3;
2. **dependency layer** within a priority: tokens → layout and spacing → typography → colour → components and states → motion → copy;
3. **ease of fix**: 1 before 4;
4. **frequency**: the problems users meet most often first [IMP-045].

Why this layer order: a token change moves everything built on it, so later fixes should build on corrected tokens; spacing is the substrate that type sits in; colour follows type because contrast thresholds depend on size and weight; motion comes late because earlier fixes move the animated elements; copy comes last because wording rarely invalidates visual fixes, and a copy fix that changes text length gets layout checks in its re-test [03 §2.5].

**What enters this run.** P0, P1 and quick P2 wins (ease of fix 1). Other P2 and P3 findings go to the debt register unless the owner explicitly includes them (QUALITY-BAR §6). Left out: `disputed` findings, findings tagged `needs-evidence`, dismissed findings, and pre-existing problems in files and routes this run does not touch [LOOP-046]. Do not reorder by taste; when a dependency forces another order, record the reason.

### 3.4 Triage tiers

| Tier | What belongs here | How it runs |
|---|---|---|
| auto-fix | deterministic (E1) findings from high-confidence mechanical rules where exactly one correction follows: `outline: none` without a visible replacement, `transition: all` or transitions on layout properties, justified text without hyphenation, disabled zoom | may run unattended in Auto mode |
| ask | anything needing a design judgment or changing visible behaviour: layout, hierarchy, palette, type choices, copy, any deviation from `DESIGN.md`, every tell and taste finding, URLs, labels, field names | waits for the owner's answer, asked in one batch (§3.12) |
| possible | low confidence: single-pass E0 findings, detector rules below their precision threshold, contested findings | confirm in the render first; never fixed unattended |

[LOOP-027; LOOP-029; LOOP-030; CRAFT-061]

Findings that come from real users through `ingest` are first triaged RITE-style (METHODS §7.2):

| RITE category | Action |
|---|---|
| obvious cause, quick fix | queue at its priority |
| obvious cause, slow fix | queue, and start it this run if the budget allows; otherwise defer with a revisit trigger |
| unknown cause | keep it out of the queue; tag `needs-evidence` and route it to `study` |
| possible method artefact | as for unknown cause |

### 3.5 Write the fix contract

First confirm that the finding still reproduces on the current build. If it does not, mark it for re-check instead of "fixing" it [LOOP-057]. Then, before touching code, write the acceptance criterion [IMP-060]:

- **Originating check:** the rule and its threshold, the probe recipe that must stop reproducing, or the walkthrough step that must pass, at the finding's route, state, width and theme.
- **Regression checks:** the adjacent happy path (a journey or probe through the same surface); the check families the change can affect; the strengths and keep line recorded for that surface (FRAMEWORK §8.1 rule 6); console parity.
- **Scope:** the files you expect to touch. Touching anything else later counts in the risk score.

The contract travels in the commit body or patch header, so the fix reviewer can test against it. Example from a bicycle-parts inventory:

```
F-0117 Part numbers overlap the stock column at 375 px
Originating: FUN-06 on /inventory, state "filtered", 375 px, light and dark: no clipped or overlapping text
Regression: journey restock-part at 375 px; A11Y-07 reflow; keep line "the table can be scanned in one pass"
Scope: column rules of the inventory table component
```

### 3.6 Choose the layer

Classify the drift, then change the narrowest layer where the cause lives [IMP-045; LOOP-036]:

| Drift class | Signs | Where to fix |
|---|---|---|
| Missing token | the same raw value repeats, or no token expresses the needed role | add or change a token and propose the matching `DESIGN.md` change; this alters the locked direction, so it is ask tier unless `DESIGN.md` already defines the role |
| One-off implementation | a local copy of what a shared component already does | replace it with the shared component |
| Conceptual mismatch | flow, structure or hierarchy differs from comparable areas | do not patch; escalate to the owner, because a patch would hide a design decision |
| Local defect | one place is wrong while the system is right | the local style or markup |

Fix at the layer of the cause: patching locally what a wrong token causes creates drift (COL-01, LAY-01). Prefer CSS to structural change, touch only related files, and add no features or refactors [LOOP-035]. Prefer removing to adding: delete, then reduce, then correct the value through a token [DSL-066]. The wider the layer, the wider the re-test.

### 3.7 Make the change

- Change one finding, minimally. Note the assumptions you made instead of asking, and what you deliberately left alone [LOOP-035].
- Take the fix from `DESIGN.md` and the brief. Replacing a flagged choice with the next most common one is not a fix: swapping a default indigo accent for the equally common "purple-escape" emerald (counter-example) only moves the tell [DSL-011].
- For a behavioural (script or state) fix in a project with a test runner, write the regression test first: it fails, passes after the fix, and fails again when the fix is reverted. CSS-only fixes are guarded by the visual re-test instead [LOOP-065].
- After each edit run `uie lint --changed <file>` for every touched file. Where the plugin's edit hook is installed it runs the fast rules for you; run the full lint anyway.

### 3.8 Re-test the fix

1. `uie run new --label fix-<finding-id>` opens a verification run with the scope frozen from `config.json`.
2. `uie capture` takes the after screenshots and ARIA snapshots.
3. **Originating check**, by the finding's origin:
   - deterministic rule: `uie audit --checks …` with the check family that raised it (for example `contrast` for an A11Y-11 finding, `census,layout` for a TYP-03 finding);
   - behaviour: `uie probe --url … --actions …` replaying the finding's reproduction steps;
   - journey or walkthrough step: `uie journey <id>`;
   - judged finding with no deterministic proxy: the before and after evidence goes to the fix reviewer, who decides (§3.11).
4. **Adjacent happy path:** `uie journey <id>` for the journey that crosses the surface, or a `uie probe` of the surface's main action, at the affected width.
5. **Regression sweep:** `uie audit`, in full when the change touched a token or a shared component (it can move anything), otherwise at least for the check families the change can affect; then `uie diff <baseline> <run> --visual --aria --findings`.

Reading the diff:

- `--findings`: any finding in the introduced set blocks. Identity never includes line numbers, so moved lines do not create phantom regressions [LOOP-045]: a deterministic finding is one rule on one route (rule ID + normalised route, however many instances it lists), and a judged finding is criterion + location + normalised snippet (ADR-033). A deterministic finding whose rule still fires on the route with fewer instances is persisting and partially fixed (k of n instances cleared), so classify the re-test as partial; new instances on that route are introduced instances inside it and count as possible regressions of this fix. Read the cleared set only for check families that ran in both runs: a finding missing because its check did not run is not cleared (EVD-04) [LOOP-060].
- `--visual`: pixel change outside the target's box plus a margin blocks unless the commit body explains it. Compare only captures with the same viewport, pixel ratio and browser; a size mismatch aborts the comparison rather than passing [LOOP-062].
- `--aria`: a lost accessible name, role or landmark blocks.
- Console: the probe and journey summaries show no error the baseline lacked (FUN-02).

Trust a capture only when animations had settled: content hidden by an unfinished entrance animation looks missing and then gets "fixed" into a regression [IMP-031]. Without a working browser the visual and behavioural re-tests are `not_run`, and the fix can be at most `partial` [DSL-064]. At every risk check (§3.10), also run the full `uie audit` in the current verification run, so that fixes re-tested with `--checks` are swept together.

### 3.9 Classify and record

| Re-test result | Meaning | Then |
|---|---|---|
| passed | the originating check passes, the adjacent path works, no regression | keep the commit; set the finding to `fixed`; it goes to the fix reviewer |
| partial | no regression, but the originating check passes only in part (some widths or states) or rests on a check only a human can run | keep the commit if it improves things; set `fixed` and state the gap; it counts as an attempt, and you may try again within the cap |
| reverted | a regression, or the originating check got worse | `git revert` the commit, or drop the patch; it counts as an attempt; retry within the cap or defer |
| deferred | cannot be fixed now: it needs owner input, lies outside the source, or the cap is reached | set `deferred` and write a debt entry (§3.15) |

A re-test result of *passed* is not the finding status `verified`, because it is your own evidence. A finding reaches `verified` only on evidence you did not produce (ADR-030): the fix reviewer's `confirmed_fixed` for a judged finding (§3.11), a re-run of the same check in the `verify` workflow that no longer reports a deterministic finding, or a human (`--by human:<name>`). Only a human moves it to `resolved` (FRAMEWORK §8.2). Record each result with `uie findings set`, citing the verification run and the commit.

**Commits.** Work on a branch created from the baseline SHA. Make one commit per finding with the message `fix(ui): <finding-id> <title>`, and never bundle findings. The body carries the contract, the drift class and layer, the files touched, the assumptions made, what was left alone, and the verification run with its result. Regression tests go in their own commit [LOOP-037].

**Checkpoint mode.** When commits are not allowed, write one patch file per finding with the same header into the run directory, for example `runs/<run-id>/patches/<finding-id>.patch`, and keep the baseline SHA, so that any single fix can still be reverted.

### 3.10 Budgets and the risk score

These budgets are stated once, in FRAMEWORK §10 and here; no other file changes them [LOOP-072].

| Budget | Limit | When reached |
|---|---|---|
| Attempts per finding | ≤ 3 | revert to the last good state, then defer or escalate (§3.13) |
| Judgment rounds per unattended run | ≤ 2; a third only if deterministic gates still fail | stop and report |
| Zero-progress round | stop immediately | report, with *Left unfixed* first |
| Risk check | every 5 fixes, and after any revert [LOOP-047] | compute the risk score |
| Fixes per run | hard cap of 30 | stop and report |
| Taste-only rules | exactly one pass | §3.14 |

Definitions: an **attempt** is one change plus its re-test. A **fix**, for the cap and the risk score, is an attempt that reached the re-test, whether kept or reverted. A **judgment round** is a batch of fixes followed by one independent fix review. A **zero-progress round** is one in which the fix review scores no fix `confirmed_fixed`. In attended Direct runs, the owner may fund further rounds, and that decision is recorded.

**Risk score.** Start at 0 for the run and add:

| Event | Adds |
|---|---|
| each revert | +15% |
| each shared component touched | +5% |
| each fix after the tenth | +1% |
| each fix that changed a file unrelated to its finding | +20% |

- A shared component is a component, stylesheet or token file used by more than one surface; count it once per fix that touches it. Local edits add nothing.
- "Unrelated" means outside the contract's scope and not required by the finding's cause.
- **Above 20%, pause and ask the owner.** Show the breakdown (reverts, shared components touched, unrelated files, fixes so far) and offer three options: continue, stop and report, or narrow the queue.

Example: after 12 fixes with one revert and two shared components touched, 15 + 10 + 2 = 27%, so pause. These weights are heuristics from the skill that introduced them; treat a high score as a reason to look, not as proof [03 §5].

### 3.11 The independent fix review

At the end of each round:

1. Build the packet with `uie packet --role fix-reviewer`: baseline and current evidence for the listed findings, the diff and the fix list. It never contains your notes or narration, because a reviewer that hears how the fixes were made inherits the fixer's framing [IMP-032; LOOP-038].
2. Spawn an isolated subagent for the fix reviewer if your environment supports it. Otherwise perform the role yourself, reading only its packet, and mark the output `DEGRADED: single-context (<reason>)`. A review in your own context is still your evidence, so its `confirmed_fixed` verdicts leave judged findings at `fixed` until the owner confirms them or an isolated reviewer repeats the review (ADR-030).
3. The reviewer writes `runs/<id>/fix-review.json` (`fix-review.schema.json`): each fix `confirmed_fixed`, `partially_fixed` or `not_fixed` from visible evidence only; up to three regressions introduced by the batch; and a disposition derived by rule [IMP-040; LOOP-051; LOOP-052]:

   | Disposition | When | What you do |
   |---|---|---|
   | recapture | the evidence is invalid | fix capture validity, recapture, review again; nothing is decided on bad evidence |
   | rebuild | the round failed wholesale, or the approach is wrong | stop the loop; report; route to `build` or `direct` with the owner |
   | fix | material problems remain: `partially_fixed`, `not_fixed` or regressions | start the next round if the budget allows; otherwise stop |
   | ship | every listed fix is `confirmed_fixed` and no regression was found | the round is complete; continue to `verify` |

4. Report the disposition word for word; never soften it. `partially_fixed` or `not_fixed` can never lead to `ship`, and `ship` covers only the listed fixes, not the whole product.
5. `confirmed_fixed` moves a judged finding to status `verified` (`uie findings apply-verdicts --fix-review`); a deterministic finding is verified when the re-run in `verify` no longer reports it (ADR-030). `partially_fixed` and `not_fixed` fixes become `reopened`, and their attempt count continues. Revert the commit behind a named regression when it can be identified; otherwise record the regression as a new candidate finding for the next round.
6. Evidence from the owner (their screenshot, a named mismatch) reopens review by a fresh reviewer. Never patch inline against it and certify the result yourself [IMP-041; LOOP-069].
7. Keep every round's commits and evidence and never overwrite artifacts between rounds: quality across rounds is not monotonic, and the owner may prefer an earlier state [01 §3.3 C12; LOOP-071].

### 3.12 Direct and Auto modes

| Mode | Before the loop | During the loop |
|---|---|---|
| Direct | show the plan: the queue by tier, a one-line contract per finding, the budgets; the owner approves or edits it | ask-tier findings wait for the owner's answers |
| Auto | the owner chose it in `config.json` or at the start | only auto-fix-tier findings and P0/P1 findings with an unambiguous fix run unattended; every taste and ask-tier item goes into one question set |

A fix is **unambiguous** when exactly one correction follows from the evidence without inventing product intent or changing the locked direction [DSL-059]. Write each question in the set against specific findings, with two or three concrete options: priority, whether a tone is intended, scope, areas to leave alone [IMP-042].

Pause and ask, in either mode, when [LOOP-034]:

- a new P0 finding, or any P0 accessibility barrier, appears;
- the fix review returns `rebuild`;
- a critical H1 (the user is lost) or H3 (no undo on a destructive action) violation is found;
- a critical journey stops completing (FUN-03);
- the risk score is above 20%;
- a fix needs knowledge only the owner has (facts, brand decisions, legal copy), or would change `DESIGN.md` or `PRODUCT.md`;
- findings conflict and the precedence order does not settle them (accessibility, honesty, brief, user evidence, convention, taste; FRAMEWORK §3).

Say which condition fired. Any correction from the owner switches the run to Direct.

### 3.13 Escalation

After the third failed attempt, revert to the last good state, then pick the route the failures point to:

- **Fresh context:** your context is full of failed approaches. Hand the finding to an isolated subagent with the finding, its evidence, the contract, and the diffs and re-test results of the three attempts, never your narration. Practitioner guidance for coding agents is to start afresh after repeated failed corrections [03 §2.8.3].
- **Stronger model:** the fix is beyond the current configuration. Record the model used [03 §2.8.1].
- **Owner:** the failures point to a conceptual mismatch or a missing decision.

An escalated attempt follows the same contract, re-test and classification, and it counts toward the cap and the risk score. Give it one attempt [calibrating]; if that fails, defer the finding with your best hypothesis.

### 3.14 Taste-only rules get one pass

This covers soft tells (the active or rising catalogue tells SLP-20…49), design findings with no measurable criterion, and H8-only findings [LOOP-050]:

1. Fix them once, in queue order.
2. Re-run the detectors that raised them (`uie audit --checks …`, `uie lint`); the fix reviewer judges the rest.
3. Give each remaining soft tell a disposition (G4; ADR-031): accepted, through an `accepted_tells` entry in `DESIGN.md` with a reason tied to the brief or the direction; disputed, with evidence on the finding that the detection is wrong, until a reviewer settles it; or deferred, left in the shipped UI and logged in `debt.md` with an owner (§3.15). A `wont_fix` soft tell without an `accepted_tells` entry counts as deferred, and more than one deferred soft tell on a page fails G4. Acceptance belongs to the owner: you may propose an acceptance; you may not grant one.

There is no second pass, even with budget left, because taste findings are the least reliable LLM judgments and get less accurate in later rounds [LOOP-030; LOOP-049].

### 3.15 Debt register entries

Add a row to `.ui-evaluator/debt.md` for every deferred finding [LOOP-058; USE-06]:

| Field | Content |
|---|---|
| ID | the finding ID, never reused |
| Date | when it was deferred |
| Source | evaluator, detector or user evidence |
| Severity and priority | mean severity and priority |
| What and who | the problem, and who is affected |
| Suggested fix | the best current hypothesis |
| Reason | why it is deferred now |
| Owner | who decides |
| Revisit trigger | the event that brings it back |
| Status | Open, Resolved, Accepted or Escalated |

- Raise its priority when it has been open for 3 or more iterations, when several entries cluster on one screen or persona, when users raise it independently, or when two entries compound.
- Accepting accessibility debt needs the owner's explicit acknowledgement. A G2 failure may be deferred only with a remediation plan, and then the level that needs G2 is not reached (QUALITY-BAR §2.3).
- Never defer a P0 finding as debt: it stays open and keeps blocking USE-05 [LOOP-058]. When its fix needs a decision only the owner, or someone the owner names, can make, do not guess: set it `blocked` with the person and the question (`uie findings set <id> --status blocked --on <who> --question <text>`). It still blocks USE-05, the queue and the report put the question first, and it leaves with the answer (`--answer <text>`) (ADR-036).
- Never delete resolved rows.

### 3.16 What never to do

- **Certify your own fix.** Your re-test is evidence; the verdict comes from the fix reviewer (P5).
- **Batch unrelated changes** into one commit or patch.
- **"Fix" by swapping to the next default** (§3.7).
- **Silence a detector without a recorded waiver.** Never add an ignore to skip a fix. A confident false positive gets the narrowest suppression, value- or file-scoped, with the reason written as `<who decided>: <evidence>`; rule-wide or file-wide suppressions need the owner [IMP-050; LOOP-055].
- **Weaken the bar:** never loosen an acceptance criterion, a test or a threshold to make a fix pass. A criterion changes only through a recorded decision [03 §2.8.2].
- **Widen the scope mid-loop.** New observations go to the deferred list [LOOP-053].
- **Re-run whole passes** to clean up. Repair only the listed findings, because whole passes undo each other [03 §2.5].
- **Exit on a score.** Exit on findings and gates: every P0 and P1 verified or ruled on, no introduced deterministic finding, and the fix-review disposition [03 §3.2].
- **Call anything done before the fix review.**

## 4. Output format

| Record | Location | Schema or format |
|---|---|---|
| One commit per finding, or one patch | working branch; `runs/<run-id>/patches/` in checkpoint mode | `fix(ui): <finding-id> <title>`, with the contract and notes in the body or header |
| Verification record per finding | findings register | `finding.schema.json`, `verification` field: originating check, result, run, commit, reviewer verdict, regressions |
| Verification runs | `runs/<id>/`, including `diff/` | `manifest.schema.json` |
| Fix review | `runs/<id>/fix-review.json` | `fix-review.schema.json` |
| Debt entries | `.ui-evaluator/debt.md` | §3.15 |
| Report section | via `uie report` | *Left unfixed* first when it is not empty; then the fixes table (status, commit, files, before and after), regressions, deferred items, budgets used and the risk-score history [LOOP-049; LOOP-066] |

## 5. Quality checks

A fix round is invalid when:

- a commit or patch covers more than one finding, or lacks the finding ID;
- a finding is set to `fixed` without a re-test record (run, checks, result);
- a finding is called fixed from a diff across different check coverage;
- the fix reviewer's packet held the fixer's notes, or the review ran in the fixer's context without the `DEGRADED` banner;
- `ship` was reported with any `partially_fixed` or `not_fixed` fix;
- a budget was exceeded without a recorded pause and owner decision, or the risk score was not computed at a checkpoint;
- a suppression lacks `<who decided>: <evidence>`, or a rule-wide suppression lacks the owner;
- a deferred finding lacks its reason, owner or revisit trigger (USE-06).

## 6. Pitfalls

| Pitfall | Evidence | Countermeasure |
|---|---|---|
| Counting instead of comparing identities | one tool computed resolved as before minus after, so five fixes plus five new defects showed no change [LOOP-045] | identity-based set difference; the introduced set blocks |
| Line numbers inside finding identity | edits that move lines report phantom regressions and resolutions [LOOP-045] | rule ID + route for deterministic findings, criterion + location + normalised snippet for judged ones (ADR-033) |
| Stale findings | a weeks-old critique was treated as a live backlog, and a full subagent pass (about 200k tokens) went into proving it stale (impeccable #660) [LOOP-059] | fingerprints checked before fixing (EVD-08) |
| Thrash from whole passes | re-running refinement passes made them undo each other [03 §2.5] | targeted repair of the listed findings only |
| Over-fixing | a reviewer asked to find gaps usually finds some, even in sound work [03 §2.8.3; LOOP-056] | the fix-now queue; minor findings go to debt |
| Silent tool failure | one project measured the same page at 1, 0 and 41 findings from three ways of invoking one detector, all exiting 0 [03 §2.5] | the doctor smoke test; `not_run` is never a pass [LOOP-002; LOOP-003] |
| Detector false positives | a contrast rule composited a gradient over black and reported 17.6:1 text as 1.2:1, giving 44 false positives on one 7-page site (impeccable #881) [LOOP-023] | confirm every hit in the render before fixing it |
| Noisy metrics | the median of 5 Lighthouse runs is only about twice as stable as one run [LOOP-061] | never classify a fix by a vitals change inside the noise; FUN-08 is advisory |
| Falling precision in later rounds | accurate LLM suggestions fell from 52% to 39% once the obvious problems were fixed (Duan et al. 2024) [LOOP-049] | ≤ 2 judgment rounds; one pass for taste |
| Self-certification | a plan rated 9/10 by its own reviewer had 3 of 7 premises false when checked against the files [03 §3.3] | the independent fix reviewer; P5 |

## 7. Sources

Research adopt items: LOOP-001…003, LOOP-023, LOOP-027, LOOP-029, LOOP-030, LOOP-034…038, LOOP-045…053, LOOP-055…062, LOOP-065, LOOP-066, LOOP-069, LOOP-071, LOOP-072; IMP-031, IMP-032, IMP-040…042, IMP-045, IMP-050, IMP-060; DSL-011, DSL-058, DSL-059, DSL-063…066; CRAFT-011, CRAFT-061; 03 §3.1–§3.3; 01 §3.3 C8, C12.

- garrytan/gstack, `design-review` (fix loop, risk heuristic, cap), `review/design-checklist.md` (auto-fix, ask and possible tiers), commit 7fca42a, 2026 (MIT; some catalogue files derive from impeccable under Apache-2.0; ideas re-expressed). https://github.com/garrytan/gstack
- impeccable, `skill/reference/polish.md`, `skill/reference/hooks.md`, `skill/agents/impeccable-finish-reviewer.md`, commit 4adabaf, 2026 (Apache-2.0; ideas re-expressed). https://github.com/pbakaus/impeccable
- Owl-Listener/designpowers, Auto-mode pause conditions, reconciliation order and debt tracker, 2026 (MIT). https://github.com/Owl-Listener/designpowers
- obra/superpowers, receiving review, verification before completion, fix-loop escalation, 2026 (MIT). https://github.com/obra/superpowers
- BuildTheWeb1/impaccable-agent, preflight and verification gates, 2026 (no licence; ideas only). https://github.com/BuildTheWeb1/impaccable-agent
- Yeachan-Heo/oh-my-claudecode, feedback baseline, 2026 (MIT). https://github.com/Yeachan-Heo/oh-my-claudecode
- vercel-labs/agent-browser, ARIA-tree and pixel diff primitives, 2026 (Apache-2.0). https://github.com/vercel-labs/agent-browser
- educlopez/ui-craft, one-fix-per-iteration loop and renderer honesty, 2026 (MIT). https://github.com/educlopez/ui-craft
- Anthropic, *Claude Code best practices*, 2026 (ideas only). https://code.claude.com/docs/en/best-practices
- Google Engineering Practices, *Small CLs*. https://google.github.io/eng-practices/review/developer/small-cls.html
- Duan, Warner, Li & Hartmann, *Generating Automatic Feedback on UI Mockups with LLMs*, CHI 2024. https://doi.org/10.1145/3613904.3642782
- Lighthouse, *Score variability*. https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md
- Playwright, *Visual comparisons*. https://playwright.dev/docs/test-snapshots
