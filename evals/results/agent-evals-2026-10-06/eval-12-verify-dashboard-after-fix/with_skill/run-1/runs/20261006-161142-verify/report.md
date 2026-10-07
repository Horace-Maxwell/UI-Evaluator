DEGRADED: A11Y-15 (no action that starts work could be exercised (2 found); the criterion is unverified, see checks.json live-regions)

# UI evaluation report: Lower Mill Growers hydroponics monitor · run 20261006-161142-verify

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | git:923c800dad (uncommitted changes present) · run opened 2026-10-06T20:11:42.321Z |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Surfaces and modes | bay-monitor (operate) |
| Routes × states | 1 route(s) × 2 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | passed 2026-10-06T20:11:00.258Z (EVD-02) |

Evaluators (EVD-07):

| Role | Agents | Isolation | Model | Packet hashes |
|---|---|---|---|---|
| fix-reviewer | 1 | subagent | claude-opus-5-5 | b0459bd8 |

Coverage: 46 valid capture(s). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** TYP-01 (10 finding(s)); TYP-06 (2 finding(s)); COL-01 (33 finding(s)); LAY-01 (25 finding(s)); LAY-04 (10 finding(s)); SHP-02 (16 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | pass | — |
| G1 Functional integrity | pass | — |
| G2 Accessibility (WCAG 2.2 AA) | not_run | A11Y-02, A11Y-19, A11Y-27, A11Y-15 (degraded) |
| G3 Craft floor | fail | TYP-01, TYP-06, COL-01, LAY-01, LAY-04, SHP-02, MOT-03 |
| G4 Deliberateness and anti-slop | fail | DEC-02, SLP-07, SLP-23 |
| G5 Analytical usability | not_run | USE-01, USE-02, USE-07, USE-08, USE-09, USE-10 |
| G6 Design quality | not_run | DES-01, DES-02, DES-03, DES-04, DES-06, DES-07 |
| G7 Empirical validation | not_run | EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06 |

States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.

- Waivers (owner, .ui-evaluator/waivers.json): none
- Accepted tells, reported as requested: none
- Threshold overrides (config.json): none

## 3. Strengths to preserve

- None recorded. Evaluators list strengths with evidence; the debrief adds the ones to keep.

## 4. Findings

Agreement statistics were not computed for this run.

No findings were reported in this run. That is not a claim that none exist (METHODS §10).

## 5. Divergent and disputed findings: questions for user research

None in this run.

## 6. WCAG 2.2 AA coverage

| SC | Level | Name | Coverage | State | Findings |
|---|---|---|---|---|---|
| 1.1.1 | A | Non-text content | agent-judged | not_run | — |
| 1.2.1 | A | Audio-only and video-only, prerecorded | needs-human | not_run | — |
| 1.2.2 | A | Captions, prerecorded | needs-human | not_run | — |
| 1.2.3 | A | Audio description or media alternative | needs-human | not_run | — |
| 1.2.4 | AA | Captions, live | needs-human | not_run | — |
| 1.2.5 | AA | Audio description, prerecorded | needs-human | not_run | — |
| 1.3.1 | A | Info and relationships | agent-judged | not_run | — |
| 1.3.2 | A | Meaningful sequence | needs-human | not_run | — |
| 1.3.3 | A | Sensory characteristics | needs-human | not_run | — |
| 1.3.4 | AA | Orientation | agent-judged | not_run | — |
| 1.3.5 | AA | Identify input purpose | scripted | pass | — |
| 1.4.1 | A | Use of colour | agent-judged | not_run | — |
| 1.4.2 | A | Audio control | auto | pass | — |
| 1.4.3 | AA | Contrast, minimum | scripted | pass | — |
| 1.4.4 | AA | Resize text | scripted | pass | — |
| 1.4.5 | AA | Images of text | agent-judged | not_run | — |
| 1.4.10 | AA | Reflow | scripted | pass | — |
| 1.4.11 | AA | Non-text contrast | scripted | pass | — |
| 1.4.12 | AA | Text spacing | scripted | pass | — |
| 1.4.13 | AA | Content on hover or focus | agent-judged | not_run | — |
| 2.1.1 | A | Keyboard | scripted | pass | — |
| 2.1.2 | A | No keyboard trap | scripted | pass | — |
| 2.1.4 | A | Character key shortcuts | agent-judged | not_run | — |
| 2.2.1 | A | Timing adjustable | agent-judged | not_run | — |
| 2.2.2 | A | Pause, stop, hide | agent-judged | not_run | — |
| 2.3.1 | A | Three flashes or below threshold | needs-human | not_run | — |
| 2.4.1 | A | Bypass blocks | scripted | pass | — |
| 2.4.2 | A | Page titled | agent-judged | not_run | — |
| 2.4.3 | A | Focus order | scripted | pass | — |
| 2.4.4 | A | Link purpose in context | agent-judged | not_run | — |
| 2.4.5 | AA | Multiple ways | agent-judged | not_run | — |
| 2.4.6 | AA | Headings and labels | agent-judged | not_run | — |
| 2.4.7 | AA | Focus visible | scripted | pass | — |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | pass | — |
| 2.5.1 | A | Pointer gestures | agent-judged | not_run | — |
| 2.5.2 | A | Pointer cancellation | scripted | pass | — |
| 2.5.3 | A | Label in name | agent-judged | not_run | — |
| 2.5.4 | A | Motion actuation | agent-judged | not_run | — |
| 2.5.7 | AA | Dragging movements | agent-judged | not_run | — |
| 2.5.8 | AA | Target size, minimum | scripted | pass | — |
| 3.1.1 | A | Language of page | scripted | pass | — |
| 3.1.2 | AA | Language of parts | scripted | pass | — |
| 3.2.1 | A | On focus | scripted | pass | — |
| 3.2.2 | A | On input | agent-judged | not_run | — |
| 3.2.3 | AA | Consistent navigation | scripted | pass | — |
| 3.2.4 | AA | Consistent identification | scripted | pass | — |
| 3.2.6 | A | Consistent help | scripted | pass | — |
| 3.3.1 | A | Error identification | scripted | pass | — |
| 3.3.2 | A | Labels or instructions | agent-judged | not_run | — |
| 3.3.3 | AA | Error suggestion | agent-judged | not_run | — |
| 3.3.4 | AA | Error prevention for legal, financial and data submissions | needs-human | not_run | — |
| 3.3.7 | A | Redundant entry | agent-judged | not_run | — |
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | not_run | — |
| 4.1.2 | A | Name, role, value | agent-judged | not_run | — |
| 4.1.3 | AA | Status messages | scripted | pass | — |

Totals by coverage: auto 1 · scripted 22 · agent-judged 23 · needs-human 9; by state: pass 23 · fail 0 · not_run 32. This matrix is not a conformance claim (QUALITY-BAR §8).

## 7. Not assessed

- A11Y-02 Every axe `incomplete` result is resolved by a scripted check or the accessibility auditor: not_run — 10 incomplete result(s); the accessibility auditor has not run
- A11Y-06 Modal dialogs: focus moves in, Tab wraps inside, Esc closes, focus returns to the invoker; correct dialog semantics: not_applicable — no modal dialog in scope (dialogs check found none to exercise)
- A11Y-18 Cross-page consistency: navigation order, names of identical functions, help placement: not_applicable — only one route is in scope; WCAG 3.2.3, 3.2.4 and 3.2.6 apply to a set of pages
- A11Y-19 Colour is not the only visual means of conveying information: status, series, links and required markers stay distinguishable under deuteranopia, protanopia, tritanopia and achromatopsia emulation: not_run — agent-judged: the accessibility auditor has not run
- A11Y-27 No verified judged WCAG failure: success criteria without a dedicated G2 row (e.g. 1.3.4, 1.4.5, 1.4.13, 2.4.5, 2.4.6, 2.5.1, 2.5.3, 3.2.2, 3.3.3, 3.3.7) still fail G2 when a confirmed finding cites them: not_run — no judged accessibility review ran
- CPY-04 Error-message quality: not_applicable — no form error state in scope (forms check found none to exercise)
- I18N-01 Explicit CJK font stack: not_applicable — no CJK locale or CJK text in scope
- I18N-02 Regional families: not_applicable — no CJK locale or CJK text in scope
- DEC-03 Direction record for new work or redesigns: not_applicable — no new direction in scope (project.work = existing)
- DEC-04 Ledger variety for new work: not_applicable — no new direction in scope
- USE-01 Heuristic-evaluation protocol: not_run — no heuristic-evaluation outputs
- USE-02 Consolidation: not_run — findings were not merged
- USE-07 Cognitive walkthrough of critical journeys: not_run — not walked: switch-dosing-to-manual
- USE-08 Task suitability: not_run — no task-suitability check recorded
- USE-09 Interaction coverage: not_run — no coverage recorded by evaluators
- USE-10 Cross-screen consistency pass: not_run — no heuristic-evaluation outputs
- USE-11 AI features audited (when the UI contains AI features): not_applicable — no AI features declared (project.ai_features)
- DES-01 Panel protocol: not_run — no design-panel outputs
- DES-02 Specificity verdict: not_run — no design-panel outputs
- DES-03 No agreed severe design finding: not_run — no design-panel outputs
- DES-04 Brand fit: not_run — no design-panel outputs
- DES-05 Not worse than baseline (redesigns): not_applicable — no baseline to compare (not a redesign)
- DES-06 Rubric scores reported, labelled *(judged)*: not_run — no design-panel outputs
- DES-07 Appeal verdict: not_run — no design-panel outputs
- EMP-01 Study plan: not_run — no study plan
- EMP-02 Formative round: not_run — no study results
- EMP-03 Observed problems integrated: not_run — no study results
- EMP-04 Critical tasks succeed: not_run — no study results
- EMP-05 Fixes re-tested: not_run — no study results
- EMP-06 Honest metrics: not_run — no study results
- EMP-07 (optional) Desirability: not_applicable — no desirability study planned
- EMP-08 (optional) Experiment validity: not_applicable — no experiment planned

## 8. Fixes and verification

No fixes were made against this run yet.

Run diff against 20261006-144251-baseline-audit: cleared 5 · introduced 0 · persisting 13.

Fix review disposition: **ship**.

## 9. Next steps

1. For L1: TYP-01 (10 finding(s)); TYP-06 (2 finding(s)); COL-01 (33 finding(s)); LAY-01 (25 finding(s)); LAY-04 (10 finding(s)) ….
2. For L2: A11Y-02 (10 incomplete result(s); the accessibility auditor has not run); A11Y-19 (agent-judged: the accessibility auditor has not run); A11Y-27 (no judged accessibility review ran); USE-01 (no heuristic-evaluation outputs); USE-02 (findings were not merged) ….
3. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (the design verdict has not been confirmed by a human).
4. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

