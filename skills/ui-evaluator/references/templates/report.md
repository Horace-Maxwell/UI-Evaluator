DEGRADED: [what ran without its required isolation, coverage or tools] ([reason])
<!-- ui-evaluator: report template v1 (FRAMEWORK §13, workflows/report.md). The line above is rendered only when part
of the run was degraded, one banner per cause, always first (EVD-07); delete it otherwise. `uie report` fills this
template from the run's files; the lead writes the strengths, the debrief and the next steps. Every sentence must
match the evidence level of what it describes (wording table in §4); `uie report` lints that (EVD-06). Never write
"compliant", "fully accessible" or "all issues". Examples describe a fictional veterinary clinic's booking tool. -->

# UI evaluation report: [product] · run [run id]

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Product and build | [clinic] online booking · git:[commit] · [date] |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Context | PRODUCT.md reviewed [date]: pet owners booking routine visits (primary), front-desk staff; top task "book an appointment" (critical) |
| Surfaces and modes | start (read), booking (operate), my-pets (operate), from PRODUCT.md |
| Routes × states | 6 routes × 14 states (list in runs/[run id]/manifest.json) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light × default and reduced motion; forced colours and more contrast for G2 |
| Depth | standard (FRAMEWORK §7) |
| Doctor smoke test | passed [timestamp] (EVD-02) |

Evaluators (EVD-07):

| Role | Count and passes | Isolation | Provider · model | Packet hash |
|---|---|---|---|---|
| heuristic-evaluator | 3 × 2 passes | isolated subagents | [provider · model] | sha256:[…] |
| walkthrough-evaluator | 1 per critical journey | isolated subagent | [provider · model] | sha256:[…] |
| design-critic | 3 | isolated subagents | [provider · model] | sha256:[…] |
| accessibility-auditor, code-reviewer, finding-verifier | 1 each | isolated subagents | [provider · model] | sha256:[…] |
| severity-rater | 3, blind | isolated subagents | [provider · model] | sha256:[…] |

Coverage: [k of n] route-states and [k of n] matrix cells captured; [x]% of salient controls exercised (USE-09, measured). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 (PRODUCT.md) · **Achieved:** L1 · **Blocking L2:** USE-05 (F-0004 open P0); USE-06 (F-0002 has no decision yet).

| Gate | State | Failing, degraded or waived criteria | Evidence |
|---|---|---|---|
| G0 Evidence integrity | pass | — | runs/[run id]/gates.json#G0 |
| G1 Functional integrity | pass | — | journeys/book-appointment.json |
| G2 Accessibility | pass (automatable and scripted parts) | needs-human items in §6 | evidence/axe/ |
| G3 Craft floor | pass | — | tool-findings.jsonl |
| G4 Deliberateness | pass | 1 tell accepted as requested | DESIGN.md accepted_tells |
| G5 Analytical usability | fail | USE-05, USE-06 | findings.json |
| G6 Design quality | pass | — | panel/critic-1…3.json |
| G7 Empirical validation | not_run | no study yet | — |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): [none, or criterion · scope · who · reason]
- Accepted tells, reported as requested: [SLP-xx · scope · the brief line it cites]
- Threshold overrides (config.json): [none, or criterion · value · reason]

## 3. Strengths to preserve

<!-- Specific and evidenced; fixes must not break these (FRAMEWORK §8.1 rule 6). -->

- Each time slot names the vet and the visit length, so owners can plan the trip (all six widths; E1).
- The booking keeps the chosen clinic and service when the owner goes back a step (journey replay; E1).

## 4. Findings

<!-- P0 first. Severity is the mean of at least three blind raters, with the spread; quick-depth severities are labelled
"provisional (single rater)". Wording by evidence level (FRAMEWORK §4.4):
E0 "may", "is likely to" · E1 "measured", "reproduced" · E2 "confirmed by [who]" · E3 "k of n participants" ·
E4 "x% (95% CI a–b)" · E5 causal verbs ("caused", "reduced"). -->

Agreement: any-two agreement [0.xx] (mean Jaccard over passes); detection counts per finding below; an estimated [n] problems remain undiscovered (discovery-rate estimate, METHODS §9.6; optimistic with few passes).

### P0

#### F-0004 · Choosing a time on a phone clears the selected pet
- Problem type: single location · Criteria: H3 (primary), H5 · Journey: book-appointment (critical) · Scope: /book/time, 320–414 px, light
- What happens: at widths below 415 px, tapping a time slot reloads the step and the pet field returns to empty; an owner with more than one pet must choose again, and the summary can show the wrong pet. Reproduced by the verifier at 320 and 375 px (E1).
- Evidence: probes/7/ (before and after screenshots), crop evidence/crops/F-0004-1.png, detection 3 of 3 passes
- Severity 3.7 (raters 4, 4, 3; spread 1) · Priority P0 · Ease of fix 2 (one component)
- Recommendation (advisory): keep the pet selection in the step's state when the time changes.
- Status: open

### P1

| ID | Title | Criterion | Evidence | Severity (spread) | Ease of fix | Status |
|---|---|---|---|---|---|---|
| F-0002 | Text-message reminders are switched on by default at booking | H3, honesty (FRAMEWORK §15) | E1, reproduced | 3.0 (0) | 1 | open |
| F-0006 | Time-slot buttons have no accessible name that includes the time | A11Y-01 (WCAG 4.1.2) | E1, measured by axe | rule: 3 | 2 | fixed |

### P2 and P3

| ID | Title | Priority | Evidence | Severity (spread) | Ease of fix | Status |
|---|---|---|---|---|---|---|
| F-0011 | Clinic phone number on the confirmation page is not a link | P2 | E1 | 2.0 (1) | 1 | fixed |
| F-0013 | Vet profiles open in a new page and the chosen date is lost on return | P2 | E1 | 2.3 (1) | 3 | deferred |

## 5. Divergent and disputed findings: questions for user research

<!-- Spread of 2 or more, a not-a-problem vote against a mean of 2.5 or more, a majority of not-a-problem or of trade-off votes (ADR-029), or disputed by the owner. Framed as questions; never settled by a vote (ADR-018). -->

| ID | Question for users | Ratings and why raters differ | Proposed study |
|---|---|---|---|
| F-0009 | Do owners hesitate when the price appears only after they choose a time? | 1, 3, 3: one rater expects owners to know routine prices | formative test, task "book a vaccination"; SEQ and observed hesitation |

## 6. WCAG 2.2 AA coverage

<!-- One row per success criterion, all 55 (A11Y-20), generated by `uie report`. No conformance claim (QUALITY-BAR §8). -->

| SC | Name | Coverage | State | Evidence |
|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | auto | pass | axe and pixel sampling, light theme |
| 2.4.11 | Focus Not Obscured (Minimum) | scripted | pass | keyboard walk, Tab and Shift+Tab |
| 1.3.2 | Meaningful Sequence | needs-human | not_run | listed for the L3 checklist |
| [all other criteria] | | | | |

Totals by coverage: auto [n] · scripted [n] · agent-judged [n] · needs-human [n] · not-tested [n]; by state: pass [n] · fail [n] · not_run [n].

## 7. Not assessed

<!-- Everything the input situation, depth or tooling could not cover, with the criterion state. -->

- Dark theme: not shipped (COL-04 not_applicable).
- Payment page hosted by the payment provider: out of scope; not evaluated.
- [criterion or area]: [reason: tool missing, input situation, depth] (not_run)

## 8. Fixes and verification

| Finding | Change | Layer | Commit or patch | Originating check | Fix review | Regressions |
|---|---|---|---|---|---|---|
| F-0006 | Time slots named "[time] with [vet]" | component | [commit] | axe 4.1.2 passes on /book/time | confirmed_fixed | none |
| F-0011 | Phone number marked up as a telephone link | local | [commit] | probe 12 no longer reproduces | confirmed_fixed | none |

Run diff against the baseline (`uie diff`): cleared [n] · introduced [n] · persisting [n], of which partially fixed [n] (each shown as instances cleared out of instances found; ADR-033). Any introduced finding or introduced instance is explained here.

## 9. Next steps

1. Fix queue: F-0004, then F-0002 (`fix` workflow, one finding per commit).
2. For L2: no open P0 (USE-05) and a decision on every P1 (USE-06).
3. For L3: the owner completes agree-disagree.csv and the needs-human WCAG checklist (A11Y-21).
4. Study: the formative test proposed in §5 (study plan [path, when written]).
5. Debt register: [n] deferred findings in .ui-evaluator/debt.md ([n] P2, [n] P3).

The review sheet `agree-disagree.csv` has one row per P0 and P1 finding plus the design-panel verdict (DES-02). Columns: finding_id, title, priority, verdict (agree, disagree or unsure), comment, reviewer (the person's name), role, date. A disagreement with an E0 or E1 finding marks it disputed; the sheet comes back through `ingest` (`--source stakeholders`).

## 10. Limits

- Method limits: heuristic evaluation can report false problems and misses others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part, so no statement here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).
