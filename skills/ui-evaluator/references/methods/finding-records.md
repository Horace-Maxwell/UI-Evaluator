# Finding records

How to write a finding: one problem, recorded once, in neutral words, anchored to the rendered UI and tied to a criterion. Every judged role writes findings this way (heuristic and walkthrough evaluators, design critics, the accessibility auditor, the code reviewer), and so does the lead when user feedback creates a candidate. The record is the finding schema of ARCHITECTURE §8.3. This file also sets the evidence levels and their wording, the identity rules, and who may move a finding through its lifecycle. It supports EVD-05, EVD-06 and EVD-08 and the one-problem rule of USE-01.

## Contents

1. [Purpose and when to use](#1-purpose-and-when-to-use)
2. [Inputs](#2-inputs)
3. [Procedure](#3-procedure)
   - [3.1 One problem per record](#31-one-problem-per-record)
   - [3.2 Title, description, impact and recommendation](#32-title-description-impact-and-recommendation)
   - [3.3 Problem types](#33-problem-types)
   - [3.4 Criteria](#34-criteria)
   - [3.5 Evidence anchors](#35-evidence-anchors)
   - [3.6 Evidence levels and wording](#36-evidence-levels-and-wording)
   - [3.7 Identity and fingerprints](#37-identity-and-fingerprints)
   - [3.8 Status lifecycle](#38-status-lifecycle)
   - [3.9 Strengths](#39-strengths)
   - [3.10 Good and bad findings](#310-good-and-bad-findings)
4. [Output format](#4-output-format)
5. [Quality checks](#5-quality-checks)
6. [Pitfalls](#6-pitfalls)
7. [Sources](#7-sources)

---

## 1. Purpose and when to use

Read this before writing a candidate, before changing a finding's status, and before phrasing any claim about a finding in a report. Findings are records, never prose in a chat (FRAMEWORK §4.3), because only records can be verified, rated blind, merged, compared across runs and closed one at a time.

The record's parts follow the CMU lecture's heuristic-evaluation report (problem, heuristic, description, evidence, severity, ease of fix, recommendation), extended with NN/g, Herr et al., SUTM and PURE [HCI §3.5].

## 2. Inputs

Before writing a finding, have:

- the scope from your packet: persona, task or journey, route, state, viewport, theme, UI version;
- an anchor that resolves in the captured state: a selector, a measured box or a crop;
- for any behaviour, the probe or journey step that shows it;
- the criterion it violates, and why that harms the declared users.

If one of these is missing, you have a hypothesis, not a finding. Put it on your not-assessable list with the reason.

## 3. Procedure

### 3.1 One problem per record

- An element with k problems yields k records, each with its own criterion [HCI-004]. Two problems belong in separate records when one could be fixed without the other.
- One failure mechanism in several places is **one** record listing every location (`multiple_locations`), never one record per screen. Repeating it per screen inflates counts and splits its frequency evidence [HCI-014].
- A quick test: if the description needs "and also", split it.

### 3.2 Title, description, impact and recommendation

- **Title**: what fails, and where or when, in neutral words. No severity words and no fix. Write "Date error does not state the expected format", not "Terrible date validation" or "Add a date picker".
- **Description**: the expected standard, then what the current design does, as observable facts. This is UICrit's critique template (standard, then current design, then fix) with the fix moved to the recommendation [EVAL-023].
- **impact**: why this harms the declared users in their task, worded at the finding's evidence level (§3.6).
- **factor_notes**: the evidence for frequency, impact and persistence, without a value (`severity-rating.md` §3.1).
- **recommendation**: advisory and separate. It may be specific (a value, a pattern), but the fixer may resolve the problem another way, and the problem stands even if the recommendation is rejected [LOOP #3]. Write it after the problem, never instead of it. Redesign ideas belong in the debrief, after evaluation [HCI-017].

### 3.3 Problem types

Choose exactly one problem type, from the lecture's four:

| Type | Use when | Illustration |
|---|---|---|
| `single_location` | one element or one state carries the problem | A veterinary clinic's booking tool: at 375 px the Confirm button on the summary step is covered by a sticky footer until the page is scrolled to the end. Anchor: the button, state `summary`, 375 px. |
| `multiple_locations` | one failure mechanism appears in several places | A bicycle-parts inventory names the same action "Remove" in the list, "Delete" on the detail page and "Discard" in bulk edit. One H4 finding with three locations. |
| `overall_structure` | the problem lies in the information architecture or the flow, not in one element | A poetry archive reaches poems only through author pages, so a reader looking for poems on a theme must open every author. Anchors: the navigation landmark's ARIA snapshot and the route list, which offer no theme or search entry. |
| `missing_element` | something the task needs is absent | A municipal recycling service offers no way to report a missed collection. Needs positive evidence of absence (below). |

**Absence needs positive evidence** (FRAMEWORK §8.1 rule 5; EVAL-034). A `missing_element` finding lists:

- the routes and states searched (for example signed in and signed out);
- the controls inventoried from the ARIA snapshots of those states;
- any site search tried, with the terms and results;
- the region where the element belongs, captured without it.

"I could not find it" alone is a hypothesis. Missing elements are easy to overlook in inspection (on paper prototypes they were much harder to find than other problems), which is why the search must be deliberate and recorded [06 §2.A.3]. The same evidence applies whenever any finding, of any type, asserts that something is absent.

### 3.4 Criteria

Cite at least one criterion, primary first, then any corroborating ones:

- a Nielsen heuristic, `H1`–`H10` (`knowledge/heuristics.md`);
- a cognitive-walkthrough question, `CW-Q1`–`CW-Q4` (`cognitive-walkthrough.md`);
- a WCAG 2.2 success criterion by number, such as `2.4.11`;
- a framework rule ID, such as `CPY-04`, `A11Y-13` or `SLP-12`, or an AI-feature guideline such as `HAX-G11`.

State why the violation harms the declared users. A criterion without a harm is a checklist tick, and a harm without a criterion is a preference; neither is a finding [HCI-005]. One mechanism cited under several heuristics stays one record with several criteria. Only grade A or B laws may support a finding; "7 ± 2" and the Zeigarnik memory claim never justify one alone [HCI-072, HCI-074].

### 3.5 Evidence anchors

Every reported finding has an anchor that resolves in the captured state (EVD-05). Refusing findings without an anchor was the main control against invented problems in the research [HCI-006].

| Part | What to record | Rule |
|---|---|---|
| `route`, `state` | the route and the state recipe (`error`, `empty`, `menu-open` …) | the state must be reproducible from the recipe |
| `scope.viewport`, `scope.theme` | width × height, theme, emulation | the matrix values where the problem was seen |
| `selector` | a selector that matches in that state's DOM or ARIA snapshot | prefer roles, accessible names and stable attributes |
| `bbox` | the measured `getBoundingClientRect` in CSS px at one stated viewport | never estimated; no measurement, no box [EVAL-041]. Screenshot-only mode: fractional and marked approximate |
| `crop` | `evidence/crops/<id>-<n>.png` | cut by the pipeline around the box |
| `snippet` | the element's stable text or markup | quote only the stable part, because a judged finding's identity is computed from it |
| `evidence[]` | probe directory, journey step, measured value with its threshold, ARIA node, console or network entry, quote with timestamp | behaviour needs a probe; a measurement needs the value and the threshold |
| `source` | file, line, method (`data-insp-path`, Svelte metadata, Vue inspector, React owner stack, text search) and confidence | white-box role and source mapping only; black-box roles leave it empty [TOOL-31] |

With static captures only, every runtime claim is labelled `potential — unverified`, listed as not assessable and never scored [EVAL C8; EVAL-032].

### 3.6 Evidence levels and wording

Every finding, and every claim about it, carries an evidence level. The level limits the wording (FRAMEWORK §4.4, §13) [HCI-035].

| Level | Meaning | Reached through | Allowed wording | Illustration |
|---|---|---|---|---|
| E0 Predicted | one unverified inspection pass | every candidate starts here | "may", "is likely to", "potential" | "The error may leave guests unsure how to correct the date." |
| E1 Reproduced | measured by a tool; reproduced in the rendered UI by a separate verifier; or found by ≥ 2 independent passes | `uie audit` and `uie lint`; the verifier; detection k ≥ 2 | "measured", "reproduced", "verified in the rendered UI" | "Reproduced in the rendered UI: submitting 31/02 shows only 'Invalid'." |
| E2 Expert-confirmed | a human expert confirmed it | the owner or a named expert, usually on the agree/disagree sheet | "confirmed by …" | "Confirmed by the clinic's reception lead." |
| E3 Observed | seen with real users or in real usage data | `ingest` of sessions, feedback or analytics | "k of n participants …", "users …" | "k of n participants retyped the date." |
| E4 Measured with users | quantified with real users, with a confidence interval | `ingest` of a benchmark | "x% (95% CI a–b)" | "Date-entry success x% (95% CI a–b)." |
| E5 Causal | established by a randomised controlled experiment | `ingest` of an A/B test | "caused", "increased", "reduced" | "Showing the format reduced date errors (randomised test)." |

Wording rules (FRAMEWORK §13; `uie report` lints them for EVD-06):

1. "Users struggle with…" and any claim about people need E3 or higher. Causal verbs need E5 [HCI-064].
2. No completeness claims: no "all issues", "fully accessible" or "WCAG compliant". A single inspection pass finds roughly a third of the problems [HCI-016].
3. Simulated users, personas and agent task completions never exceed E1 and are never presented as predicted user success or as metrics [HCI-023, HCI-036].
4. A model's preference between two designs is never presented as a predicted A/B outcome [HCI-034].
5. Scores, where shown, are labelled *(judged)* or *(measured)*.
6. Every claim in a report rests on a tool result from the session; anything else is labelled unverified [IMP-061].

### 3.7 Identity and fingerprints

- A judged finding's identity is its criterion + location + a normalised snippet hash, stored as `fingerprint` (FRAMEWORK §4.3). A deterministic finding is one rule on one route: its identity is the rule ID + the normalised route, however many instances (locations) it lists (ADR-033). `uie findings merge` computes the fingerprint; never write one by hand.
- **No line numbers.** They move with unrelated edits and create phantom "cleared plus introduced" pairs [03 §3.3]. Volatile values (counters, timestamps, user data) stay out of the snippet for the same reason.
- **Keep the primary criterion stable.** When a known problem is raised again under another heuristic, the lead keeps the register's primary criterion and adds the new one as corroborating; otherwise the same problem gets a new identity.
- Identity makes runs comparable as sets: `uie diff <base> <run> --findings` reports cleared, introduced and persisting findings. A deterministic finding whose rule still fires on its route with fewer instances is persisting and partially fixed (k of n instances cleared), never cleared plus introduced; new instances on that route are introduced instances inside it. Never count fixes as "before minus after"; a count hides a regression behind a fix [03 §3.3].
- `scope.ui_version` records the commit or content hash the finding was seen on. When the UI changes under the anchor, the finding becomes `stale` (EVD-08; `verification.md` §3.6).

### 3.8 Status lifecycle

The state machine of FRAMEWORK §8.2:

```
candidate ──verifier──▶ confirmed ──raters──▶ open ──▶ in_progress ──▶ fixed ──verify──▶ verified ──human──▶ resolved
    │                                     │  │                           │
    └──▶ rejected                         │  ├──▶ deferred (debt)         └──▶ reopened ──▶ open
                                          │  ├──▶ disputed ──study/ingest──▶ open | dismissed
                                          │  ├──▶ wont_fix (trade-off, with rationale)
                                          │  └──▶ dismissed (human: not a problem → dismissal ledger)
any state ──UI changed under the anchor──▶ stale ──re-check──▶ previous state | rejected
```

Who may make each transition:

| Transition | Who | How, and on what condition |
|---|---|---|
| candidate → confirmed / rejected | finding verifier | verification chain passed, or the deciding step recorded; applied with `uie findings apply-verdicts` |
| confirmed → open | the rating step | ≥ 3 blind ratings (one provisional rating at quick depth), mean ≥ 0.5; `uie findings rate` |
| open → disputed | `uie findings rate`, or the owner | divergent ratings (spread ≥ 2, or a `not_a_problem` vote against a mean ≥ 2.5); more than half of the raters voting `not_a_problem`, or more than half `trade_off` (ADR-029); or the owner disagrees with an E0–E1 finding |
| disputed → open / dismissed | lead (open) or owner (dismissed) | only on evidence from `study` or `ingest`, cited; never by vote |
| open → in_progress | fixer (lead) | the fix contract is written first |
| in_progress → fixed | fixer | after the per-fix re-test; the fixer's own re-test never reaches `verified` |
| fixed → verified | lead, on evidence the fixer did not produce (ADR-030) | judged finding: a fresh fix reviewer scores it `confirmed_fixed` (`uie findings apply-verdicts --fix-review`); deterministic finding: a re-run of the same check on the fixed build no longer reports it (`uie diff` lists it as cleared); or a human confirms it (`--by human:<name>`) (METHODS §8) |
| fixed → reopened → open | lead | the fix reviewer scores `partially_fixed` or `not_fixed`; a deterministic finding persists, even with fewer instances (ADR-033); or a regression appears |
| verified → resolved | the owner; for feedback-sourced items, the original reporter or the owner | a human only, never an agent [EVAL C12] |
| open → deferred | lead for P2 and P3 under the queue policy; owner for P0 and P1 | debt-register entry with reason, owner and revisit trigger |
| open → wont_fix | owner | trade-off rationale recorded |
| open → dismissed | owner | `uie findings dismiss`, which writes the dismissal ledger |
| any → stale | freshness check | the UI under the anchor changed |
| stale → previous state / rejected | finding verifier | re-check against the current capture |

A verifier verdict of `needs_human` leaves the finding a `candidate` until the owner answers the verifier's question; the lead then applies `confirmed` or `rejected` and records the answer. Use `uie findings set` for the manual transitions and `uie findings link` to connect feedback. Every transition lands in `status_history` with time and actor.

### 3.9 Strengths

- Every report includes what works well and must be preserved (FRAMEWORK §8.1 rule 6) [HCI-017].
- A strength is anchored like a finding (route, state, element) and says which declared user and task it helps. Generic praise is not a strength.
- Strengths protect what works from the fix loop: the fixer checks them before changing a shared component.
- Liking never offsets failure: positive comments about the visuals do not cancel an observed task failure [HCI-078].

### 3.10 Good and bad findings

A good candidate, from a language-learning flashcard app (illustration; values are examples):

```jsonc
{
  "title": "Pronunciation button shows no response until the audio starts",
  "description": "A tap should be acknowledged at once. On a card's first play nothing on screen changes until the audio starts, after the 1 s limit; a second tap in that time plays the word twice.",
  "problem_type": "single_location",
  "criteria": [ { "kind": "heuristic", "id": "H1", "primary": true }, { "kind": "rule", "id": "CMP-04" } ],
  "impact": "Learners practising aloud may tap again, hear the word twice and lose their rhythm.",
  "scope": { "persona": "adult beginner on a phone", "task": "practise a deck aloud", "journey": "study-session",
             "route": "/decks/:id/study", "state": "card-front", "viewport": { "width": 375, "height": 812 },
             "theme": "light", "ui_version": "git:<commit>" },
  "locations": [ { "route": "/decks/:id/study", "state": "card-front",
                   "selector": "role=button[name='Play pronunciation']", "bbox": [300, 96, 44, 44],
                   "snippet": "<button aria-label=\"Play pronunciation\">" } ],
  "evidence": [ { "type": "probe", "ref": "probes/12/", "detail": "tap at 0 s; first visual change at audio start, 1.8 s; second tap replays" } ],
  "factor_notes": "Button on every card; delay on each card's first play; recurs every session.",
  "found_by": [ { "role": "heuristic-evaluator", "agent": "he-1", "model": "<model>", "method": "HE", "pass": 2 } ],
  "evidence_level": "E0", "validity": "needs_verification", "status": "candidate",
  "recommendation": "Show a pressed or loading state on tap and ignore repeat taps while the audio loads.",
  "tags": ["feedback", "audio"]
}
```

Bad candidates, and what to do instead:

| Bad candidate | What is wrong | Instead |
|---|---|---|
| "The dashboard is cluttered and confusing." (logistics dashboard) | vague: no element, no mechanism, no criterion; a generalised claim | "Delayed and on-time counts in the summary strip differ only by colour", anchored to the strip, H1 with WCAG 1.4.1, checked on the colour-vision captures |
| "Pet-details form: labels are low contrast, required fields are unmarked and the Save button is too small." (veterinary clinic) | three problems in one record | three records; contrast and target size are measured by `uie audit` (A11Y-11, A11Y-10), so check the tool output before adding judged duplicates |
| "Poems should be set in a serif face." (poetry archive) | preference only: no criterion, no harm to a declared user | drop it; if reading is measurably hard, cite the TYP rule with the measurement; taste questions belong to the design panel |
| "Some buttons don't respond." (bicycle-parts inventory) | unanchored and unprobed | "'Reorder' on out-of-stock rows gives no response to a click", with selector, state and the probe showing no request and no state change |
| "There is no loading state on search." (recycling service, from a screenshot) | behaviour claimed from a still image | probe the search; until then it is a not-assessable hypothesis |
| "Most residents will give up here." | a claim about people at E0 | the mechanism, in E0 wording ("may abandon the request"); claims about people need E3 |
| A list ending "consider micro-animations; could use more whitespace; maybe add a dark mode" | padding to reach a count: no criterion, harm or anchor | stop at the evidenced findings; "no further problems found on these screens" is a valid result [HCI-025] |

## 4. Output format

`finding.schema.json` (ARCHITECTURE §8.3). Each part has one owner:

| Field | Filled by |
|---|---|
| `title`, `description`, `problem_type`, `criteria`, `impact`, `scope`, `locations` (without `source`), `evidence`, `factor_notes`, `recommendation`, `tags`, `found_by` | the role that raises the finding |
| `id`, `fingerprint`, `detection` (k of N), `links.duplicates`, `links.also_blocks` | `uie findings merge` |
| `locations[].source`, `ease_of_fix` | the code reviewer, or source mapping |
| `evidence_level` | E0 at candidate; raised by tools, the verifier, k ≥ 2, humans and users (§3.6) |
| `validity` | `needs_verification` at candidate; `confirmed` by the verifier; `trade_off` or `not_a_problem` through rating or the owner |
| `severity`, `priority`, `criticality` | `uie findings rate`, from the rater files (`severity-rating.md`) |
| `status`, `status_history` | the transitions in §3.8 |
| `verification` | the fix and verify workflows |
| `links.feedback` | `uie findings link` |

Candidates go into the role's output file (evaluator-output schema) and are checked with `uie findings validate <file>`.

## 5. Quality checks

A record is invalid when:

- it describes more than one problem, or repeats per screen a mechanism that should be one `multiple_locations` record;
- it has no criterion, or no harm to the declared users;
- its anchor does not resolve in the captured state, or its box was estimated;
- it claims behaviour without a probe, or absence without the evidence in §3.3;
- the title or description carries severity words or a fix in place of the problem;
- its wording exceeds its evidence level, or it contains predicted percentages, times or completeness claims;
- a black-box role filled `source` or `ease_of_fix`;
- a fingerprint was hand-written or includes line numbers.

## 6. Pitfalls

| Pitfall | Evidence | Countermeasure |
|---|---|---|
| Generalised, assumed or absent problems | of GPT-4o's 27 false positives, 15 described problems not present, 9 assumed unobservable behaviour, 3 were generalised claims (Guerino 2025) | anchors, probes and §3.10 |
| Bundled problems | splitting combined statements turned 72 expert-reported violations into 91 (Duan 2024) | §3.1 |
| Ungated agent output | one production pipeline found about 2 of 8 raw agent findings real, and evidence gates cut 98 raw findings to 28 (04 §2.13) | verification before rating |
| Estimated boxes | a box drawn on the wrong element misleads the fixer, so one review toolkit draws boxes only from measured rectangles and otherwise leaves the finding unboxed (averliz) | measured boxes only [EVAL-041] |
| Line-number identity | identity keys that include lines produced phantom regressions (03 §3.3) | §3.7 |
| Count-based "cleared" | before-minus-after counts hid regressions (03 §3.3) | set-based `uie diff` |
| Invented precision | public audit templates ask for predicted success rates, times and tool scores that were never measured (04 §2.1) | evidence-level wording [EVAL-039] |

## 7. Sources

Research adopt items: HCI-004…006, HCI-014, HCI-016, HCI-017, HCI-023, HCI-025, HCI-034…036, HCI-064, HCI-072, HCI-074, HCI-078; EVAL-020, EVAL-023, EVAL-030, EVAL-032, EVAL-034, EVAL-039, EVAL-041; EVAL C8, C12; TOOL-31; IMP-061; LOOP #3; 06 §3.5; 03 §3.3.

- Nielsen, *How to Conduct a Heuristic Evaluation* (1994; rewritten 2023). https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/
- Nielsen, *Characteristics of Usability Problems Found by Heuristic Evaluation*, 1995. https://www.nngroup.com/articles/usability-problems-found-by-heuristic-evaluation/
- Duan, Chen, Li, Hartmann & Li, *UICrit*, UIST 2024 (dataset CC BY 4.0; critique template). https://arxiv.org/abs/2407.08850
- Duan, Warner, Li & Hartmann, *Generating Automatic Feedback on UI Mockups with LLMs*, CHI 2024. https://arxiv.org/abs/2403.13139
- Guerino et al., *Can GPT-4o Evaluate Usability Like Human Experts?*, INTERACT 2025. https://arxiv.org/abs/2506.16345
- Touir, Barika Ktata & Soui, persona-driven usability simulation (SUTM), CEUR-WS Vol-4249, 2026. https://ceur-ws.org/Vol-4249/paper4.pdf
- noodisD/UXAgent, evidence and verification gates (MIT, with NOTICE). https://github.com/noodisD/UXAgent
- carlsz/ux-agent-skills, report contract (MIT). https://github.com/carlsz/ux-agent-skills
- averliz/visual-ux-review-toolkit, measured annotation boxes (MIT). https://github.com/averliz/visual-ux-review-toolkit
- Alexandra Ion, *Evaluation: Analytical vs Empirical*, Carnegie Mellon University HCII, course lecture (paraphrased).
