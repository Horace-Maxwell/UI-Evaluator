DEGRADED: SLP-45 (no findings (partial coverage: cross-page did not run) (catalogue soft tell, ADR-031))

# UI evaluation report: Margins textbook exchange · run 20261006-143657-audit-quick

Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits

## 1. Scope and method

| Item | Value |
|---|---|
| Build | no commit recorded · run opened 2026-10-06T18:36:57.073Z |
| Input situation | source and a runnable app (FRAMEWORK §14) |
| Surfaces and modes | account (operate), listing (operate), handover (operate), listing-live (read) |
| Routes × states | 4 route(s) × 7 state(s) |
| Matrix | widths 320, 375, 768, 1024, 1280, 1440 × light × default, reduced-motion |
| Depth | standard (iteration 1) |
| Doctor smoke test | not run (EVD-02) |

Coverage: 42 valid capture(s). A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).

## 2. Verdict

**Target level:** L3 · **Achieved:** none · **Blocking L1:** EVD-02 (uie doctor has not run); FUN-03 (journeys were not replayed (`uie journey`)); FUN-04 (the media check did not run); FUN-07 (the vitals check did not run); A11Y-01 (2 finding(s)); A11Y-04 (1 finding(s))

| Gate | State | Failing, degraded or waived criteria |
|---|---|---|
| G0 Evidence integrity | not_run | EVD-02 |
| G1 Functional integrity | not_run | FUN-03, FUN-04, FUN-07 |
| G2 Accessibility (WCAG 2.2 AA) | fail | A11Y-01, A11Y-04, A11Y-06, A11Y-10, A11Y-11, A11Y-12, A11Y-13, A11Y-14, A11Y-15, A11Y-16, A11Y-18, A11Y-19, A11Y-27 |
| G3 Craft floor | fail | TYP-02, COL-03, MOT-01, MOT-02, MOT-03, MOT-04, MOT-05, MOT-06, MOT-07, CMP-01, CMP-03, CMP-04, CMP-05, CMP-06, CPY-02, CPY-04 |
| G4 Deliberateness and anti-slop | fail | DEC-02, SLP-45 (degraded) |
| G5 Analytical usability | fail | USE-01, USE-02, USE-06, USE-07, USE-08, USE-09, USE-10 |
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

### P1

#### F-0002 · axe target-size: All touch targets must be 24px large, or leave sufficient space
- Problem type: multiple locations · Criteria: A11Y-01 (primary), 2.5.8 · Where: / and 1 more location(s)
- What happens: Ensure touch targets have sufficient size and space (serious impact). Fix any of the following: Target has insufficient size (20px by 20px, should be at least 24px by 24px) Target has insufficient space to its closest neighbors. Safe clickable space has a diameter of 20px instead of at least 24px.
- Evidence: E1, reproduced or measured · evidence/crops/axe/55dd817005.png, evidence/crops/axe/5d75d4d206.png, evidence/axe/root/default/1280-light.json
- Severity rule: 3 · Priority P1
- Recommendation (advisory): All touch targets must be 24px large, or leave sufficient space
- Status: confirmed

#### F-0003 · axe color-contrast: Elements must meet minimum color contrast ratio thresholds
- Problem type: multiple locations · Criteria: A11Y-01 (primary), 1.4.3 · Where: /handover.html and 2 more location(s)
- What happens: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds (serious impact). Fix any of the following: Element has insufficient color contrast of 2.53 (foreground color: #9ca3af, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- Evidence: E1, reproduced or measured · evidence/crops/axe/282f400cde.png, evidence/crops/axe/8fb4a1af1d.png, evidence/crops/axe/9b5b4cc604.png, evidence/axe/handover-html/default/1280-light.json
- Severity rule: 3 · Priority P1
- Recommendation (advisory): Elements must meet minimum color contrast ratio thresholds
- Status: confirmed

#### F-0005 · Text contrast below 4.5:1: "Staffed points are open from 09:00 to 18"
- Problem type: multiple locations · Criteria: A11Y-11 (primary), 1.4.3 · Where: /handover.html and 2 more location(s)
- What happens: Text "Staffed points are open from 09:00 to 18:00 on weekdays" (16 px, weight 400) has 2.54:1 against its computed background in the light theme at 1280 px; it needs 4.5:1.
- Evidence: E1, reproduced or measured · evidence/crops/contrast/663103a5aa.png, evidence/crops/contrast/a25059142b.png, evidence/crops/contrast/69ad8bcb1a.png
- Severity rule: 3 · Priority P1
- Recommendation (advisory): Change the colour role token for this text (or add a solid backing behind text over media).
- Status: confirmed

#### F-0011 · No visible focus indicator: "Full name"
- Problem type: multiple locations · Criteria: A11Y-04 (primary), 2.4.7 · Where: / and 5 more location(s)
- What happens: Tab focus on "Full name" changes 0 pixels within its box + 4 px (focused vs blurred crop), so no focus position is visible when navigating by keyboard (measured).
- Evidence: E1, reproduced or measured · evidence/keyboard/root/default/320-light/stop-2-focused.png, evidence/keyboard/root/default/320-light/stop-3-focused.png, evidence/keyboard/root/default/320-light/stop-4-focused.png, evidence/keyboard/root/default/320-light/stop-5-focused.png
- Severity rule: 3 · Priority P1
- Recommendation (advisory): Give every focusable element a :focus-visible indicator from the focus tokens (e.g. a 2 px outline with offset); never remove outline without a replacement.
- Status: confirmed

#### F-0012 · A11Y-14 Paste blocked in a credential field: paste is blocked in a password or one-time-code field
- Problem type: single location · Criteria: A11Y-14 (primary), 3.3.8
- What happens: paste is blocked in a password or one-time-code field. Found by the static source scan (uie lint).
- Evidence: E1, reproduced or measured
- Severity rule: 3 · Priority P1
- Recommendation (advisory): Remove the paste handler and add the autocomplete token (current-password, new-password, one-time-code).
- Status: confirmed

#### F-0004 · Control boundary contrast below 3:1: "ISBN"
- Problem type: multiple locations · Criteria: A11Y-12 (primary), 1.4.11 · Where: /listing.html and 7 more location(s)
- What happens: The textbox is identified by its border (top 1.36:1, right 1.36:1, bottom 1.36:1, left 1.36:1) against the surrounding surface in the light theme; at least one boundary needs 3:1.
- Evidence: E1, reproduced or measured · evidence/crops/contrast/e87228e26e.png, evidence/crops/contrast/5e2436db27.png, evidence/crops/contrast/58538a9b9f.png, evidence/crops/contrast/d6d2060ee6.png
- Severity rule: 2 · Priority P1
- Status: confirmed

### P2

| ID | Title | Criterion | Evidence | Severity | Ease of fix | Status |
|---|---|---|---|---|---|---|
| F-0001 | Link text "Click here" has no context | CPY-02 | E1 | rule: 2 | — | confirmed |
| F-0007 | Input text 14 px below 16 px: "Full name" | TYP-02 | E1 | rule: 2 | — | confirmed |

### P3

| ID | Title | Criterion | Evidence | Severity | Ease of fix | Status |
|---|---|---|---|---|---|---|
| F-0006 | One word on the last line: "Buyers never see it; we text you when so" | TYP-15 | E1 | rule: 1 | — | confirmed |
| F-0008 | One word on the last line: "Describe your textbook" | TYP-15 | E1 | rule: 1 | — | confirmed |
| F-0009 | One word on the last line: "Choose a handover point" | TYP-15 | E1 | rule: 1 | — | confirmed |
| F-0010 | One word on the last line: "Buyers can now find your book by its ISB" | TYP-15 | E1 | rule: 1 | — | confirmed |

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
| 1.4.3 | AA | Contrast, minimum | scripted | fail | F-0003, F-0005 |
| 1.4.4 | AA | Resize text | scripted | pass | — |
| 1.4.5 | AA | Images of text | agent-judged | not_run | — |
| 1.4.10 | AA | Reflow | scripted | pass | — |
| 1.4.11 | AA | Non-text contrast | scripted | fail | F-0004 |
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
| 2.4.7 | AA | Focus visible | scripted | fail | F-0011 |
| 2.4.11 | AA | Focus not obscured, minimum | scripted | pass | — |
| 2.5.1 | A | Pointer gestures | agent-judged | not_run | — |
| 2.5.2 | A | Pointer cancellation | scripted | pass | — |
| 2.5.3 | A | Label in name | agent-judged | not_run | — |
| 2.5.4 | A | Motion actuation | agent-judged | not_run | — |
| 2.5.7 | AA | Dragging movements | agent-judged | not_run | — |
| 2.5.8 | AA | Target size, minimum | scripted | fail | F-0002 |
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
| 3.3.8 | AA | Accessible authentication, minimum | agent-judged | fail | F-0012 |
| 4.1.2 | A | Name, role, value | agent-judged | not_run | — |
| 4.1.3 | AA | Status messages | scripted | pass | — |

Totals by coverage: auto 1 · scripted 22 · agent-judged 23 · needs-human 9; by state: pass 19 · fail 5 · not_run 31. This matrix is not a conformance claim (QUALITY-BAR §8).

## 7. Not assessed

- EVD-02 Doctor smoke test passed in this session: each tool produced the expected detections on the known-bad fixture: not_run — uie doctor has not run
- EVD-07 Independence is recorded per evaluator (context isolation, provider, model, inputs given); DEGRADED banner present where isolation was not achieved: not_applicable — no judged roles ran
- FUN-03 Every declared critical journey completes by scripted replay to its success condition: not_run — journeys were not replayed (`uie journey`)
- FUN-04 No broken images or media (`naturalWidth = 0`, failed requests) and no broken in-scope links: not_run — the media check did not run
- FUN-07 Lab Cumulative Layout Shift over load + scripted interactions: not_run — the vitals check did not run
- FUN-08 Lab LCP ≤ 2.5 s and INP ≤ 200 ms: not_run — the vitals check did not run
- A11Y-06 Modal dialogs: focus moves in, Tab wraps inside, Esc closes, focus returns to the invoker; correct dialog semantics: not_run — the dialogs check did not run
- A11Y-10 Targets ≥ 24 × 24 CSS px unless an SC 2.5.8 exception applies (spacing circle, equivalent, inline, user-agent, essential): not_run — the targets check did not run
- A11Y-13 Forms: visible persistent label for every input (no placeholder-only labels); errors in text with `aria-invalid` and programmatic association; focus moves to the first error or an error summary; `autocomplete` on personal-data fields: not_run — the forms check did not run
- A11Y-15 Status messages from async actions are exposed through `role=status`, `alert` or a live region without moving focus: not_run — the live-regions check did not run
- A11Y-16 `lang` present and matching the dominant script of the content; mixed-language runs tagged; Chinese tagged with a region or script subtag (`zh-CN`, `zh-TW`, `zh-HK`, `zh-Hans`, `zh-Hant`), never bare `zh` when both scripts ship: not_run — the lang check did not run
- A11Y-18 Cross-page consistency: navigation order, names of identical functions, help placement: not_run — the cross-page check did not run
- A11Y-19 Colour is not the only visual means of conveying information: status, series, links and required markers stay distinguishable under deuteranopia, protanopia, tritanopia and achromatopsia emulation: not_run — agent-judged: the accessibility auditor has not run
- A11Y-27 No verified judged WCAG failure: success criteria without a dedicated G2 row (e.g. 1.3.4, 1.4.5, 1.4.13, 2.4.5, 2.4.6, 2.5.1, 2.5.3, 3.2.2, 3.3.3, 3.3.7) still fail G2 when a confirmed finding cites them: not_run — no judged accessibility review ran
- COL-03 Declared colour strategy is honoured: not_run — the palette check did not run
- MOT-01 Animated properties: not_run — the motion check did not run
- MOT-02 Duration budget: not_run — the motion check did not run
- MOT-03 No overshoot on UI state changes: not_run — the motion check did not run
- MOT-04 Reduced motion: not_run — the motion check did not run
- MOT-05 Content visible at rest: not_run — the motion check did not run
- MOT-06 No scale-from-zero entrances: not_run — the motion check did not run
- MOT-07 Mode budget: not_run — the motion check did not run
- CMP-01 State styling exists: not_run — the states check did not run
- CMP-03 Disabled states: not_run — the states check did not run
- CMP-04 Response feedback: not_run — the states check did not run
- CMP-05 Data states exist: not_run — neither the states check nor the code reviewer ran
- CMP-06 Touch-primary targets: not_run — the targets check did not run
- CPY-04 Error-message quality: not_run — the forms check did not run
- I18N-01 Explicit CJK font stack: not_applicable — no CJK locale or CJK text in scope
- I18N-02 Regional families: not_applicable — no CJK locale or CJK text in scope
- DEC-03 Direction record for new work or redesigns: not_applicable — no new direction in scope (project.work = existing)
- DEC-04 Ledger variety for new work: not_applicable — no new direction in scope
- USE-01 Heuristic-evaluation protocol: not_run — no heuristic-evaluation outputs
- USE-02 Consolidation: not_run — agreement statistics missing (`uie findings agreement`)
- USE-07 Cognitive walkthrough of critical journeys: not_run — not walked: list-a-textbook
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

## 9. Next steps

1. Fix queue: F-0002, F-0003, F-0004, F-0005, F-0011, F-0012 (`fix` workflow, one finding per commit).
2. For L1: EVD-02 (uie doctor has not run); FUN-03 (journeys were not replayed (`uie journey`)); FUN-04 (the media check did not run); FUN-07 (the vitals check did not run); A11Y-01 (2 finding(s)) ….
3. For L2: A11Y-19 (agent-judged: the accessibility auditor has not run); A11Y-27 (no judged accessibility review ran); USE-01 (no heuristic-evaluation outputs); USE-02 (agreement statistics missing (`uie findings agreement`)); USE-06 (6 P1 finding(s) without a recorded decision) ….
4. For L3: human (needs-human WCAG criteria not completed (A11Y-21)); human (6 P0/P1 finding(s) not confirmed or overruled by a human); human (the design verdict has not been confirmed by a human).
5. The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.

## 10. Limits

- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).
- No real users took part in this run, so nothing here describes what users do.
- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).

