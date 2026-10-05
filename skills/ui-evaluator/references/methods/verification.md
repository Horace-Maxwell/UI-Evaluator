# Verification

How candidates become confirmed findings: a deterministic merge, a skeptical verifier who takes every judged candidate through a fixed verification chain, agreement statistics across the panel, and freshness checks that keep stale findings out of reports. Readers: the lead (merge, verdicts, agreement, freshness) and the finding verifier (the verification chain). This file owns gate criteria USE-02 and USE-03 and supports EVD-05, EVD-07 and EVD-08.

## Contents

1. [Purpose and when to use](#1-purpose-and-when-to-use)
2. [Inputs](#2-inputs)
3. [Procedure](#3-procedure)
   - [3.1 Lead: merge on a deterministic key](#31-lead-merge-on-a-deterministic-key)
   - [3.2 Lead: launch the verifier](#32-lead-launch-the-verifier)
   - [3.3 Verifier: the verification chain](#33-verifier-the-verification-chain)
   - [3.4 Lead: apply the verdicts](#34-lead-apply-the-verdicts)
   - [3.5 Lead: agreement and undiscovered problems](#35-lead-agreement-and-undiscovered-problems)
   - [3.6 Freshness and stale findings](#36-freshness-and-stale-findings)
   - [3.7 Harness-artefact catalogue](#37-harness-artefact-catalogue)
   - [3.8 Independence records](#38-independence-records)
4. [Output format](#4-output-format)
5. [Quality checks](#5-quality-checks)
6. [Pitfalls](#6-pitfalls)
7. [Sources](#7-sources)

---

## 1. Purpose and when to use

Run verification:

- after every evaluator, walkthrough, critic, auditor and code-review output is written and validated, and before rating;
- on candidates created from user feedback in `ingest`, before anyone fixes them;
- whenever a finding becomes `stale`.

Inspection reports false problems as well as real ones. One production pipeline found only about 2 of 8 raw agent findings real until it gated them on evidence, which cut 98 raw findings to 28 [04 §2.13]. In another study a separate verifying agent raised precision from .75 to .91 (ISO 9241-110) and from .78 to .96 (Nielsen) with recall roughly unchanged [HCI-026]. Verification is the main precision control. It does not raise recall; more independent evaluators do that.

Gate criteria owned (USE) and supported (EVD), verbatim from QUALITY-BAR:

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| USE-02 | Consolidation | deterministic-key merge done; any-two agreement and detection counts reported | S | HCI-014/015, EVAL C5 |
| USE-03 | Verification | every reported finding passed the verification chain: evidence resolves, behaviour exercised, harness artefact excluded, in scope, absence claims backed by positive evidence | A/I | HCI-006/007/026, EVAL noodisD |
| EVD-05 | Every reported finding has a resolvable evidence anchor (selector resolves in the captured state, or a crop exists) | 100% of reported findings | D/S | HCI-006 |
| EVD-07 | Independence is recorded per evaluator (context isolation, provider, model, inputs given); DEGRADED banner present where isolation was not achieved | 100% | S | IMP-036, LOOP |
| EVD-08 | Freshness: every finding's fingerprint matches the current UI version, or the finding is marked `stale` | 0 stale findings reported as current | S/D | 03 §3.3 |

## 2. Inputs

- **Merged candidates**: `runs/<id>/merged.json`, produced by `uie findings merge` (§3.1).
- **Verifier packet**, built by `uie packet --role finding-verifier`: the candidates without who raised them, the dismissal ledger and the probe instructions. Evaluator identities are excluded so that a verdict cannot lean on who said something.
- **The run's evidence and manifest**: captures, ARIA snapshots and probes; scope (routes, states, personas, matrix); UI version; iteration number.
- **The live UI**, reached only through `uie probe`.

## 3. Procedure

### 3.1 Lead: merge on a deterministic key

1. Run `uie findings merge`. It merges candidates automatically only when they share the key: **same locator, same failure mechanism, same state** [EVAL C5].
   - A different heuristic on the same mechanism does not block a merge. Which heuristic an evaluator cites is part of the evaluator effect, not part of the problem.
   - Text or embedding similarity only *proposes* merges. Confirm or refuse each proposal yourself. Similarity merges different bugs that happen to share words, and here precision matters more than recall [04 §2.13].
2. A merged finding keeps every criterion label (primary plus corroborating) and every piece of evidence from every source.
3. A cascade, where one failure blocks later steps or journeys, is reported once, with the blocked items in `links.also_blocks`.
4. The merge records detection counts: k of N evaluators found each merged finding (`detection`).
5. Match merged findings against the living register (`uie findings list`) so that a known problem keeps its ID and its primary criterion.

### 3.2 Lead: launch the verifier

Spawn an isolated subagent for the finding-verifier role if your environment supports it. Otherwise perform the role yourself, reading only its packet, and mark the output `DEGRADED: single-context (<reason>)`. In that case you already know who raised each candidate, which the role is meant not to know; say so in the reason.

### 3.3 Verifier: the verification chain

Take each candidate through the seven steps in order (METHODS §5 step 2) [HCI-026; EVAL-030…037]. The first step it fails decides the verdict; record that step. Start from the assumption that the claim may be wrong, and judge only from evidence you can resolve or reproduce.

| Step | Passes when | Record on failure |
|---|---|---|
| 1. Evidence resolution | the anchor resolves in the captured state | `evidence_unresolved` |
| 2. Harness filter | the problem is not an artefact of capture, emulation or tooling | `harness_artifact` |
| 3. Scope filter | the problem lies within the declared routes, states and personas | `out_of_scope` |
| 4. Skeptical re-check | you reproduced the problem with `uie probe` | `not_reproduced` |
| 5. Absence rule | an absence claim has positive evidence | `absence_unsupported` |
| 6. Dismissal ledger | no human dismissed this problem before, or new evidence exists | `previously_dismissed` |
| 7. Confidence ceiling | the HCI-029 condition is checked and recorded | held after rating, not rejected |

**1. Evidence resolution.** The selector matches in that state's DOM or ARIA snapshot, or the crop exists and shows what the finding describes (EVD-05). When the claimed route, state or element differs from what the evidence recorded, the recorded value wins and the claim is kept as claimed [EVAL-031]. If the anchor does not resolve, try to re-locate the element with a fresh probe of the same state. If nothing can be anchored, reject.

**2. Harness filter.** Check the candidate against the catalogue in §3.7. When the capture behind it fails the validity check (EVD-03), recapture with `uie capture` and look again; never judge an invalid capture. If the problem disappears, reject and name the artefact.

**3. Scope filter.** The problem must lie within the declared routes, states, personas and matrix (viewports, themes, emulations), and on the target's own site [EVAL-036]. Reject out-of-scope problems with the reason, and list them for the owner as notes, because they may still matter.

**4. Skeptical re-check.** Reproduce the problem: perform the interaction with `uie probe` for any behavioural claim, or re-read the captured state for a static fact. Compare the mechanism claimed with the mechanism observed.
- The session's own evidence overrides narrative. If a journey replay completed the flow claimed broken, or the ARIA snapshot holds the element claimed missing, reject [EVAL-035].
- An evaluator's difficulty is not a defect of the product. A claim supported only by the evaluator's own narration is unsupported.
- Conventional behaviour is not a defect by default; confirm it only with evidence that the user gets no hint [EVAL-040].
- If only part of the claim reproduces, confirm that part when it is a complete problem on its own, and record the narrowing. Otherwise mark `needs_human`.
- If probing cannot settle the question (a domain convention, real assistive-technology behaviour, the owner's intent, an environment that blocks reproduction), mark `needs_human` with the question to ask.

**5. Absence rule.** A claim that something is missing needs positive evidence: the region where it belongs is shown, the element is absent from the DOM and the ARIA snapshot at that step, and the states searched and controls inventoried are listed (FRAMEWORK §8.1 rule 5) [EVAL-034]. Gather the missing evidence yourself where you can, and record your search. An absence also needs a non-empty baseline: "no error message appears" proves nothing on a page that did not render [EVAL-071].

**6. Dismissal ledger.** Compare with `.ui-evaluator/dismissals.json`. A problem a human rejected is not raised again under any heuristic unless new evidence exists: the UI changed under the anchor, user data now points at it, or a new measurement contradicts the dismissal. Match on locator and mechanism, not on wording or heuristic, because models re-raise dismissed problems under a different heuristic [HCI-028; Duan 2024].

**7. Confidence ceiling.** In iteration 2 and later, a single-pass E0 finding whose mean severity after rating is below 2.5 needs a second pass or human confirmation [HCI-029]; you flag it here, and the lead applies the ceiling after rating. Agent precision falls on improved designs: in one study the share of accurate suggestions dropped from 52% to 39% across rounds. Apply it this way:
- "Iteration 2 and later" means any audit run on this product after the first; the packet states the iteration.
- "Single-pass" means detected by one evaluator (k = 1). Your reproduction proves the observation, not that a second inspector judged it a problem, so it does not count as a second pass.
- Severity is not known yet. Confirm what you reproduced and record that the ceiling applies. After `uie findings rate`, the lead holds every such finding whose mean is below 2.5 (that is, P2 or lower) out of the report until a second independent pass finds it or a human confirms it. Held findings are listed as held, never deleted.
- Deterministic findings and human-raised items are exempt.

**Verdicts** (verifier schema): `confirmed`, with your reproduction evidence (the finding becomes E1, "reproduced"); `rejected`, with the deciding step and reason; `needs_human`, with the question for the owner.

Also check, without changing the verdict:
- **one problem per record**: a candidate that bundles several problems is not confirmed as one. List the parts in your note; the lead splits it into separate candidates, which then go through the chain one by one;
- **criterion fit**: if the problem is real but the cited heuristic is wrong, confirm it and suggest the right criterion;
- **wording**: flag descriptions that claim more than the evidence level allows (`finding-records.md` §3.6).

**If you cannot run** (no browser, a crash, a missing packet), stop and say so. The candidates stay unverified at E0, the report states that the run is unverified, and USE-03 is not met. Never empty the list silently. One production verifier puts the rule as "An unverified report is honest; a silently emptied one is not" (noodisD/UXAgent).

### 3.4 Lead: apply the verdicts

1. Run `uie findings apply-verdicts`. Confirmed findings go to rating (`severity-rating.md`). Rejected candidates go to the report's excluded list with their deciding step. `needs_human` items become one batched question set for the owner, or rows on the agree/disagree sheet.
2. Keep rejected candidates; never delete them. They measure the precision of each evaluator configuration and rule over time [METHODS §3].
3. Deterministic findings reach E1 by measurement and are not re-verified one by one. Detector hits are still evidence, not verdicts: when the rendered page contradicts one (a contrast failure on plainly legible text, a cluster of identical measured values), take it through steps 1, 2 and 4 and record a confirmed detector false positive against the rule ID [LOOP-023].

### 3.5 Lead: agreement and undiscovered problems

USE-02 asks for agreement and detection counts. Run `uie findings agreement` after the verdicts are applied, so that false positives do not count as disagreement. Compute it within the heuristic-evaluation panel; corroboration from other roles (a walkthrough or a critic finding the same problem) is reported separately.

- **Any-two agreement**: the mean, over all pairs of passes, of |Pᵢ ∩ Pⱼ| / |Pᵢ ∪ Pⱼ|, where Pᵢ is the set of confirmed findings from evaluator i (METHODS §9.6) [HCI-015]. Illustration: P₁ = {a, b, c, d}, P₂ = {b, c, e} and P₃ = {c, d, e, f} give 2/5, 2/6 and 2/5, mean 0.38. Human evaluators score between 5% and 65%. Low agreement is normal; it is a reason for user research, not a reason to doubt every finding.
- **Detection counts**: k of N per finding. A finding seen by only one of N passes is flagged low-confidence [HCI-015].
- **Discovery-rate estimate** (METHODS §9.6): λ̂ = Σₖ kₖ / (N·F), where F is the number of unique problems found by N passes and kₖ the number of passes that found problem k; estimated total = F / (1 − (1 − λ̂)^N). Illustration: N = 3 and F = 10, with four problems found by one pass, three by two and three by all three, give λ̂ = 19/30 ≈ 0.63 and an estimated total of about 10.5. With few passes λ̂ is biased upwards, so the estimate is optimistic. Label it an estimate, never a coverage figure [EVAL §3.4].

### 3.6 Freshness and stale findings

Every finding records the UI version it was seen on (`scope.ui_version`) and a fingerprint. A finding is fresh only while its fingerprint matches the current UI (EVD-08).

1. **When to check**: at the start of any run that reuses the register, before reporting, and before fixing.
2. **How**: compare `scope.ui_version` with the run manifest's commit or content hash. Where they differ, check whether the anchor still resolves and the snippet still matches. `uie diff <base> <run> --findings` gives the identity-based set difference (cleared, introduced, persisting; ADR-033).
3. **Stale**: when the UI changed under the anchor (the selector no longer resolves, the snippet changed, the route or state recipe changed), the finding becomes `stale` (FRAMEWORK §8.2).
4. **Re-check**: the verifier takes a stale finding through steps 1–5 against the current capture. If it still reproduces, it returns to its previous state with an updated anchor and UI version; if not, it is rejected with the reason "no longer reproduces on <version>".
5. Never report a stale finding as current, and never fix one before the re-check. One project spent about 200k tokens re-proving that an old backlog had gone stale [03 §3.3].

### 3.7 Harness-artefact catalogue

Artefacts of capture, emulation or tooling that look like product problems. Check each candidate against this list in step 2.

| Artefact | How it shows up as a false finding | Check | If it is the artefact |
|---|---|---|---|
| Capture timing | content caught before it loaded or in a transient state: "empty list", "missing image", "no results" | the capture validity check (EVD-03); a fresh probe after the state settles | recapture; reject if the problem disappears |
| Animation mid-state | an entrance caught half-way: faint text read as low contrast, hidden text read as missing, offsets read as misalignment | recapture with animations disabled; in a probe, confirm `document.getAnimations()` has finished | reject. Text still hidden after load and a full scroll is a real MOT-05 failure |
| Emulation side effects | reduced-motion emulation removes transitions ("no feedback"); Chromium's forced-colours emulation also repaints author backgrounds; colour-vision captures recolour the page; touch emulation removes hover | compare with the default-emulation capture; read colour claims only from default captures, and colour-vision captures only for A11Y-19 | reject, or narrow the claim to the emulation it belongs to |
| Headless font fallback | text rendered in a fallback face: the wrong typeface, a different measure, clipping or overflow the real font would not cause; differences between host operating systems | confirm the face actually loaded; recapture after an explicit font load; compare on the same OS or container [TOOL-25] | reject. A font that fails to load for real users is a real finding, not an artefact |
| Frozen clocks and background tabs | the capture recipe freezes the clock, and background tabs throttle timers: "the spinner never stops", "the toast never closes", "no transition" | judge time-dependent behaviour only from a foreground probe with a running clock; confirm the animation's `currentTime` advances [LOOP-044] | reject |
| Mis-composited backgrounds in contrast detection | gradients or transparency composited over the wrong ground, or text over images: legible text reported as failing (one detector reported 17.6:1 text as 1.2:1, with 44 false positives on 7 pages) | pixel-sample the rendered crop and compute contrast on the actual pixels; treat clusters of identical values as a possible engine fault [LOOP-023] | record a detector false positive against the rule ID |
| Overlays and banners | a consent banner, chat widget, development error overlay or the probe's own highlight covers content: "control missing", "content obscured", near-empty observations of a full page [EVAL-033] | ask whether a user in the journey's start state sees the overlay. A consent banner on a first visit is product UI and in scope; for a returning-user journey, clear it with the state recipe, through the UI, never by injecting state [EVAL-071]. Development overlays and tooling highlights are never product UI | reject the artefact. A framework error overlay means the app threw an error: report FUN-02, not a usability finding |
| OS and browser chrome | status bars, notches, browser toolbars or scrollbars in captures or in screenshots supplied by people, read as product elements | the element must exist in the DOM or ARIA snapshot; mask or label chrome before visual inspection [HCI-032] | reject |
| Driver and probe failures | timeouts, retries, fallback actions, the same action tried three times in a row, a mistyped recipe: "the button does nothing", "the form will not submit" | observe again after the error and reproduce with a fresh probe; only a visible failure of the app counts [EVAL-033] | reject |
| Local environment | a cold development server, missing seed data, local network conditions: "slow", "empty dashboard" | repeat with a warm second probe and the declared state recipe; lab timings are noisy (FUN-08 is advisory) | reject or narrow the claim. Whether an empty state exists and works is a real CMP-05 question |

### 3.8 Independence records

EVD-07 needs, for every evaluator, critic, rater and the verifier, a record in the run manifest of: how isolation was achieved (subagent, separate process or single context), provider, model, lens or assignment, and the packet hash of the inputs given. `uie gates` checks the record. Where isolation was not achieved, the first line of the affected output is `DEGRADED: single-context (<reason>)` and the gate is at most `degraded` (FRAMEWORK §6.2 rule 7). The verifier itself never sees who raised a candidate, and raters never see each other's ratings; a packet hash that shows otherwise invalidates the output.

## 4. Output format

`verifier.schema.json`, written to `runs/<id>/verifier.json` and checked with `uie findings validate <file>`. One entry per candidate, none skipped:

- `verdict`: `confirmed`, `rejected` or `needs_human`;
- the deciding verification-chain step (§3.3 table), or the last step passed for a confirmed candidate;
- reproduction evidence: probe directories, captures and ARIA nodes you used;
- the reason, plus any corrected anchor ("recorded value wins"), narrowing, split request, criterion suggestion or wording flag;
- whether the confidence ceiling applies (step 7);
- for `needs_human`, the question to ask the owner.

Return at most 8 lines: the path, counts per verdict, the most common rejection steps, and anything that blocked you. After `uie findings apply-verdicts`, the run holds `merged.json`, `verifier.json` and the confirmed findings, and `uie findings agreement` adds the statistics in §3.5.

## 5. Quality checks

Verifier output is invalid when:

- a candidate has no entry, or an entry has no deciding step;
- a behavioural claim is confirmed without a probe reference;
- an absence claim is confirmed without positive absence evidence;
- the dismissal ledger was not consulted;
- the confidence ceiling was not recorded for k = 1 candidates in iteration 2 and later;
- the packet shows the verifier received evaluator identities, or a single-context run lacks the `DEGRADED` banner.

The run fails USE-02 when the merge or the agreement statistics are missing, and USE-03 when any reported finding skipped the verification chain. It fails EVD-08 when a stale finding is reported as current.

## 6. Pitfalls

| Pitfall | Evidence | Countermeasure |
|---|---|---|
| A verifier that only ever passes | one skill's own evals deliberately break an input to catch a checker that always passes (04 §2.7) | the evaluation suite seeds defects and clean controls [EVAL-110]; rejections are reported |
| A reviewer who cannot check reality | a reviewer forbidden to check against the product rated a plan 9/10 when 3 of 7 premises were false (03 §3.3) | reproduce with `uie probe`; narrative is not evidence |
| Silent tool failure read as clean | the same page gave 1, 0 and 41 findings, all with exit 0 (03 §3.3) | `uie doctor` smoke test first (EVD-02); fail open, never empty the list |
| Self-rated confidence | in one pipeline 56 of 59 findings rated their own confidence high (04 §2.13) | evidence sets the ceiling; never ask an evaluator how sure it is |
| Similarity merges | one bug was filed six times under six heuristics, while embedding merges risk joining different bugs (04 §2.13) | deterministic key; proposals confirmed by the lead |
| Re-raising dismissed problems | dismissed suggestions came back under another heuristic (Duan 2024) | step 6, matched on locator and mechanism |
| Stale backlogs | about 200k tokens spent re-proving a stale backlog (03 §3.3) | §3.6 |
| Detector false positives ranked as severe | 44 contrast false positives on one 7-page site, all ranked most severe (03 §3.3) | §3.7; record them against the rule |
| Later rounds invent problems | accurate agent suggestions fell from 52% to 39% after designs improved (Duan 2024) | step 7 |

## 7. Sources

Research adopt items: HCI-006, HCI-007, HCI-014, HCI-015, HCI-026, HCI-028, HCI-029, HCI-032; EVAL-030…037, EVAL-040, EVAL-071, EVAL-110; EVAL C5; EVAL §3.4; LOOP-023, LOOP-044; TOOL-25; IMP-031; 03 §3.3; 04 §2.13.

- noodisD/UXAgent: evidence resolution, harness attribution, site scope, claim verifier, confidence ceiling (MIT, NOTICE retained). https://github.com/noodisD/UXAgent
- Touir, Barika Ktata & Soui, persona-driven usability simulation with a supervisor agent (SUTM), CEUR-WS Vol-4249, 2026. https://ceur-ws.org/Vol-4249/paper4.pdf
- Hertzum & Jacobsen, *The Evaluator Effect*, IJHCI 15(1), 2003. https://mortenhertzum.dk/publ/IJHCI2003.pdf
- Nielsen & Landauer, *A mathematical model of the finding of usability problems*, INTERCHI 1993.
- Duan, Warner, Li & Hartmann, *Generating Automatic Feedback on UI Mockups with LLMs*, CHI 2024. https://arxiv.org/abs/2403.13139
- Zhong, McDonald & Hsieh, *Synthetic Heuristic Evaluation*, 2025 (preprint). https://arxiv.org/abs/2507.02306
- carlsz/ux-agent-skills: absence baselines, seeded-defect evals (MIT). https://github.com/carlsz/ux-agent-skills
- averliz/visual-ux-review-toolkit: driver timeouts are not findings (MIT). https://github.com/averliz/visual-ux-review-toolkit
- Playwright documentation, visual comparisons and emulation. https://playwright.dev/docs/test-snapshots
- pbakaus/impeccable, issues #660 and #881 (Apache-2.0). https://github.com/pbakaus/impeccable
