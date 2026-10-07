# Heuristics

This file is the inspection vocabulary that evaluators cite in findings: Nielsen's ten heuristics (H1–H10) with probing questions and frequent false positives, a crosswalk from five other principle sets, the add-ons Nielsen lacks, evidence grades for the "laws of UX", response-time limits, Gestalt grouping checks and a cognitive-load checklist. It serves G5 (analytical usability, USE-01 to USE-10) and gives design critics shared terms for G6. Read it before a heuristic or walkthrough pass, when writing or verifying a finding, and when rating severity. The procedure itself (passes, isolation, merging, rating) is in [heuristic-evaluation.md](../methods/heuristic-evaluation.md). Gate thresholds belong to QUALITY-BAR (`docs/framework/QUALITY-BAR.md` in the repository, `assets/data/rules.json` in the skill); this file cites criteria by ID and repeats a threshold only word for word.

## Contents

1. [Principles](#1-principles)
2. [Rules: the criteria findings cite](#2-rules-the-criteria-findings-cite)
   - [2.1 Reading the entries](#21-reading-the-entries) · [H1](#h1--visibility-of-system-status) · [H2](#h2--match-between-the-system-and-the-real-world) · [H3](#h3--user-control-and-freedom) · [H4](#h4--consistency-and-standards) · [H5](#h5--error-prevention) · [H6](#h6--recognition-rather-than-recall) · [H7](#h7--flexibility-and-efficiency-of-use) · [H8](#h8--aesthetic-and-minimalist-design) · [H9](#h9--help-users-recognize-diagnose-and-recover-from-errors) · [H10](#h10--help-and-documentation)
   - [2.2 Crosswalk to other principle sets](#22-crosswalk-to-other-principle-sets)
   - [2.3 Add-ons where Nielsen is silent](#23-add-ons-where-nielsen-is-silent)
   - [2.4 "Laws of UX" and their evidence grades](#24-laws-of-ux-and-their-evidence-grades)
   - [2.5 Response-time limits](#25-response-time-limits)
   - [2.6 Gestalt grouping checks](#26-gestalt-grouping-checks)
   - [2.7 Cognitive-load checklist](#27-cognitive-load-checklist)
3. [Decisions to make (for direct/build)](#3-decisions-to-make-for-directbuild)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles

1. **Heuristics name the harm; the protocol finds it.** Nielsen derived the ten from a factor analysis of real usability problems, so they work well as a shared vocabulary for explaining why something hurts users. On their own they do not reliably find problems: evaluators applying the same set agree on only 5–65% of what they report. That is why several isolated passes, verification and blind rating do the finding [06 §2.A.1, §2.A.5; HCI-002].
2. **A violation is not automatically a defect.** Some violations are deliberate trade-offs. Record them with `validity: trade_off` and the rationale, and route them to users instead of the fix queue [HCI-013].
3. **One problem, one finding, one reason.** Each finding states what happens, what the declared user needs, and which heuristic explains the harm. An element with three problems gets three findings. Preference ("I would prefer…") is not a finding [HCI-004, HCI-005].
4. **Perform behaviour before you judge it.** Feedback, validation, loading, errors and confirmation are claims about behaviour. Exercise them with `uie probe`, or record the claim as a hypothesis outside the defect list (FRAMEWORK §8.1 rule 4) [HCI-007, EVAL-032].
5. **Context decides.** Whether a word is jargon or a shortcut is missing depends on the users, tasks and context in your packet. A finding with no declared context is invalid [HCI-001].
6. **Nielsen first, add-ons only where Nielsen is silent.** The one controlled comparison found no significant difference between Nielsen's set and Gerhardt-Powals' set, so procedure matters more than the list. H1–H10 stay primary because they are the shared vocabulary of the CMU lecture, which numbers this version-2 set H2-1 to H2-10 (H1 here is the lecture's H2-1, and so on); reports print the lecture's numbers and names. Task suitability, engagement, data fusion and HAX fill the gaps (§2.3) [06 X7].
7. **No quotas, no padding.** "No problems found" is a valid result, and a heuristic that surfaces nothing gets no finding [HCI-025, EVAL-043].

## 2. Rules: the criteria findings cite

### 2.1 Reading the entries

Each heuristic below has five parts:
- **Means:** a paraphrase of the heuristic.
- **On the web:** what it covers in web interfaces.
- **Ask:** probing questions. A question marked (probe) needs the interaction performed with `uie probe` before any finding can be reported; the others can be answered from captures, ARIA snapshots and copy.
- **Typical violations:** each with one example finding in the register's style: the title in bold, then what happens and what the user needs, then the criterion and problem type. Example products rotate on purpose; they illustrate and are not defaults.
- **Not a violation:** frequent false positives for that heuristic.

False positives that apply to every heuristic, each documented in published LLM-evaluator studies [06 §2.F.3]:
- **Assumed behaviour.** "No hover feedback" or "no confirmation" judged from a still image. Probe it or drop it [HCI-007].
- **Chrome mistaken for product.** Browser bars, OS status bars and tool overlays judged as UI. Mask or label them [HCI-032].
- **Convention mistaken for defect.** A login wall at guest checkout, a button disabled until a required option is chosen, a confirmation step, overlay search. Report these as heuristic findings only with evidence that the user gets no hint [EVAL-040]. A primary submit disabled at rest is raised by the CMP-03 check as an H1 and H9 candidate, without failing CMP-03, and is verified and rated like any judged finding (ADR-032).
- **Vague claims.** "High cognitive load" or "cluttered" with no element named and no task cost stated. Reject them [HCI-005].
- **Duplicates and heuristic-swapping.** One problem filed once per screen, or re-raised under another heuristic after a human dismissed it. Merge into one finding with every location, and check the dismissal ledger [HCI-014, HCI-028].
- **A grade C or D "law" as the only reason** (§2.4) [HCI-074].

Single LLM passes were weakest on H3, H6, H7, H9 and cross-screen consistency. On H8 the evidence is mixed, and in one study H8 findings were the least accurate category (studies of 2024–2026 models). Findings in these categories need a reproducing probe from the verifier, and H8 findings also need corroboration from the design panel or a measurement (METHODS §4.1) [06 §2.F.3 F4; HCI-030].

### H1 · Visibility of system status

**Means.** People can always tell what the system is doing and what just happened, because feedback arrives soon enough to be connected to their action.

**On the web.** Click and submit acknowledgement, loading and progress, saved or unsaved state, the current location (active navigation, page heading, selected tab or filter, step n of m), async status messages, sync and connection state, and changes the system makes on its own.

**Ask.**
- (probe) After each primary action, does something visibly change within 0.1 s, and does an operation longer than 1 s show progress? (CMP-04, §2.5)
- (probe) After save or submit, can the user tell whether it worked, and does a reload show that the change persisted? [EVAL-059]
- (probe) Are async results exposed to assistive technology without moving focus? (A11Y-15)
- Can the user tell where they are and what step comes next?
- Is displayed status accurate and current (last updated, live or cached)? [Tognazzini, Autonomy]

**Typical violations.**
- No acknowledgement. *Example, veterinary clinic booking tool:* **Choosing a time slot shows no response.** Clicking a free slot changes nothing on screen for 2.3 s while the request runs (probe timing). The pet owner needs a sign that the slot is being reserved. `H1` · `single_location`.
- A static "Loading…" as the only indicator (also fails CMP-04).
- A success message although the change did not persist. State the data-loss risk in the impact field so raters can weigh it.
- No indication of position in a multi-step flow.

**Not a violation.**
- No spinner for an operation under about 1 s; there a spinner distracts more than it informs [06 §2.A.14].
- No extra feedback for direct manipulation that completes within 0.1 s.
- "No feedback" judged from a screenshot: it stays a hypothesis until probed.

### H2 · Match between the system and the real world

**Means.** The interface uses the words, concepts and order its users know from their own world and work, rather than the organisation's or the code's vocabulary, and controls relate to their effects the way physical things do.

**On the web.** Labels, headings and messages; units, numbers and dates in the user's locale ([data-display.md](data-display.md)); icons and metaphors; sort and field orders (for example address order by country); control–effect mapping for sliders, toggles and steppers; whether a state label reads as the state or as the action.

**Ask.**
- Would a declared user understand every label without looking it up? Do internal IDs, field names or status codes appear?
- Does information appear in the order users expect (time, process, address)?
- Does each control map naturally to its effect, and does each toggle read as a state? Visible is not the same as interpretable [06 §2.A.7].
- Are icons standard for their meaning, and labelled where ambiguous? [PLAT-112]

**Typical violations.**
- Internal vocabulary. *Example, municipal recycling service:* **Collection calendar names bins by internal stream codes.** The calendar lists 'STR-2' and 'STR-4', while the bins residents put out are labelled by material. Residents need the names printed on their bins. `H2` · `multiple_locations`.
- Unnatural ordering; a toggle labelled with the action instead of the current state; a metaphor that implies the wrong behaviour.

**Not a violation.**
- Domain terms that are the declared users' own language, such as clinical terms in a tool for veterinary staff. Judge against the persona, not a general reader.
- An established technical term with no plain equivalent that the declared users know.

### H3 · User control and freedom

**Means.** People take wrong turns, so every state offers an obvious way back or out, and actions can be reversed without a long detour.

**On the web.** Undo and redo; Cancel, Close and Back in dialogs, drawers and multi-step flows; Esc on overlays; browser Back that keeps state; skippable onboarding and guided flows; interrupting long operations; leaving a flow without losing entries; exits as easy as entries (subscriptions, accounts, consent).

**Ask.**
- (probe) Can every dialog and drawer be closed with Cancel or Close and with Esc, with focus returning to the trigger (A11Y-06), and can every guided flow be left without finishing it?
- (probe) Does browser Back mid-flow keep entered data and state? [EVAL-058, DSL-041]
- (probe) Is each consequential action undoable, or confirmed when it cannot be undone? [HCI-069, DSL-040]
- (probe) Can a long operation be interrupted? (§2.5)
- Is leaving (unsubscribe, cancel, opt out) as easy as joining? [EVAL-064]

**Typical violations.**
- No way back. *Example, logistics dashboard:* **Route-planning wizard has no way back to an earlier step.** On step 4 of 5 the only controls are Continue and Cancel; changing the depot chosen in step 1 means cancelling and re-entering every step. The planner needs to step back without losing later entries. `H3` · `single_location`.
- Irreversible deletion without confirmation; onboarding that cannot be skipped; an exit that needs a phone call when joining took one click (also a dark pattern, FRAMEWORK §15).

**Not a violation.**
- No confirmation for an action that is easy to undo. Confirmation is for unexpected, irreversible or uncommon destructive actions; undo is preferred otherwise [PLAT-092].
- Conventional steps such as a review page before payment [EVAL-040].

### H4 · Consistency and standards

**Means.** A word, look or action means the same thing everywhere in the product (internal consistency), and the product follows the conventions people know from the platform and from other products (external consistency).

**On the web.** Terminology; placement and styling of primary, secondary and destructive actions; identical-looking elements behaving identically; link styling; navigation order and names across pages (A11Y-18); case conventions (CPY-03); icon meanings; date and number formats; web conventions such as underlined links and native form controls.

**Ask.**
- Do elements that look alike behave alike, and do different behaviours look different? [Tognazzini; HCI-073]
- Is there one term per concept, and does each entry label match its destination's title? [PLAT-125]
- Do identical functions keep the same name and position across pages? (A11Y-18)
- Does the cross-screen pass over the twelve invariant areas find accidental variation? (USE-10) [EVAL-063]

**Typical violations.**
- Two names for one action. *Example, bicycle-parts inventory:* **The same action is called 'Archive' on the parts list and 'Retire' on the part page.** Both move a part out of active stock. Staff need one name so they know it is one action. `H4` · `multiple_locations`.
- Look-alike controls that behave differently; a custom control that breaks a web convention without a recorded reason.

**Not a violation.**
- Deliberate variation with a recorded reason, such as destructive actions styled apart [EVAL-063].
- Conventions applied per platform, for example sentence case on the web and title case in Apple-native contexts [PLAT-120].
- A distinctive brand layer (type, colour, imagery). The framework keeps structure conventional and spends distinctiveness on the brand layer (FRAMEWORK P3).
- Different layouts for different content: consistent is not the same as uniform.

### H5 · Error prevention

**Means.** Design so that mistakes are hard to make: remove the conditions that cause them, constrain input to what is valid, and check consequential actions before they take effect.

**On the web.** Input types, pickers and ranges; formats and limits shown before entry; sensible defaults; protection against double submission (PLAT-054); warnings about unsaved changes; distance between destructive and frequent controls; confirmation of costly irreversible actions. Norman's distinction helps choose the fix: constraints and defaults prevent slips of attention, while clearer models, undo and warnings prevent mistakes that come from a wrong mental model [06 §2.A.7].

**Ask.**
- (probe) What happens on empty submit, invalid input, double submit, and Back or refresh mid-flow? [EVAL-058]
- Are constraints visible before entry rather than discovered after it?
- Are the costliest errors (payment, deletion, sending) prevented first?
- (probe) Does leaving with unsaved changes warn the user?

**Typical violations.**
- Missing constraint. *Example, bicycle-parts inventory:* **Stock quantity accepts negative numbers.** Entering −3 in the quantity field saves, and the part now shows −3 in stock. Staff need impossible values refused at entry. `H5` · `single_location`.
- A destructive control next to a frequent one; a free-text date field with no stated format.

**Not a violation.**
- Validation on submit rather than while typing. Submit-time validation is a sound default; live feedback is for limits users cannot know [PLAT-095].
- A primary button that stays enabled and validates on submit [PLAT-053]. A primary submit disabled at rest is raised by the CMP-03 check as a candidate under H1 and H9, not here (ADR-032).
- No confirmation on an action that can be undone (see H3).

### H6 · Recognition rather than recall

**Means.** What people need to act is in front of them or one step away; they never have to carry a value, choice or instruction in their head from one screen to the next.

**On the web.** Persistent visible labels (A11Y-13); navigation and primary actions visible rather than only in overflow menus, gestures or hover (PLAT-003, PLAT-041); summaries that carry earlier choices forward; recent items and suggestions; visible signifiers on everything clickable and on nothing else [06 §2.A.7].

**Ask.**
- Does any step need something remembered from an earlier screen, such as a code, a price or a choice? [HCI-071]
- Do labels stay visible while typing and after an error?
- Are the primary tasks reachable from the main view?
- Does everything clickable look clickable, and does nothing else?
- (probe) Do filters, selections and scroll position survive opening an item and coming back? [DSL-041]

**Typical violations.**
- Lost context. *Example, poetry archive:* **Search filters reset after opening a poem.** Returning from a poem to the results clears the chosen era and form. The reader needs the filters kept to compare the next result. `H6` · `single_location`.
- Placeholder-only labels; actions that appear only on hover; links with no visual signifier.

**Not a violation.**
- A menu or list longer than seven items. Menus work by recognition; the "7 ± 2" limit is a misapplied memory finding [HCI-072].
- A collapsed navigation menu on small screens. It trades recall for space: record it as a trade-off and test it with users [HCI-013].
- Progressive disclosure of rarely used options while the main path stays visible.

### H7 · Flexibility and efficiency of use

**Means.** The interface serves newcomers and frequent users at once: experienced people get faster routes (accelerators, defaults, saved settings) that newcomers can ignore.

**On the web.** Keyboard shortcuts and command menus (remappable, A11Y-17); bulk actions; saved views and filters; sensible defaults and autocomplete; deep links (DSL-041); remembered preferences; size and distance of targets for frequent actions (Fitts's law, §2.4); paste allowed (A11Y-14).

**Ask.**
- For the most frequent steps in the journeys, is there an accelerator (keys, bulk selection, defaults, saved filters)?
- Are accelerators discoverable, for example shown in menus or tooltips?
- (probe) Do frequent actions respond without decorative delay? (MOT-02: interactions declared frequent ≤ 150 ms.)
- Are frequent targets large and near the work? A claim that one flow is slower than another needs a timed test or a KLM comparison [06 §2.A.8; HCI-059].

**Typical violations.**
- No accelerator for a high-frequency step. *Example, language-learning flashcard app:* **Grading a card needs a pointer click.** A review session asks for a grade on every card, and the grade buttons have no keyboard equivalent. Learners who review at a keyboard need to grade without the pointer. `H7` · `single_location`.
- One dialog per item where bulk edits are routine.

**Not a violation.**
- No shortcuts in a rarely used or walk-up flow; accelerators matter where use is frequent.
- No customisation when the defaults already fit the declared tasks.

### H8 · Aesthetic and minimalist design

**Means.** Each screen carries only what serves the task at hand, because every irrelevant or rarely needed element draws attention away from the ones that matter. The heuristic is about relevance and focus, not about a flat or sparse style.

**On the web.** A hierarchy that makes the main task obvious; elements with no job (decoration, stand-ins, repeated content); instructions that compensate for an unclear control [CRAFT-058]; competing calls to action; density that suits the surface mode.

**Ask.**
- Can you name each screen's main task, and is it the most visible thing on the screen?
- Which elements carry no information for the declared task?
- Does decoration (motion, glow, badges) compete with content for attention?
- Is density constant within the page and right for its mode? [PLAT-038]

**Typical violations.**
- The answer buried. *Example, municipal recycling service:* **Next collection date sits below three campaign panels.** A resident who opens the page to check tomorrow's pickup scrolls past three campaign panels before reaching the date they came for. `H8` · `overall_structure`.
- Several equally prominent calls to action; paragraphs explaining how a control works.

**Not a violation.**
- A dense, well-ordered data screen on an Operate surface: density is not clutter [PLAT-038].
- Brand expression the brief asked for. The design panel (G6) judges it, not H8; do not use H8 to push designs toward generic minimalism [06 §5 Q6].
- "Too busy" or "dated" without a named competing element and a task cost [HCI-005].

### H9 · Help users recognize, diagnose, and recover from errors

**Means.** When something fails, the message says in plain words what went wrong and what to do next, sits where the problem is, and keeps the person's work so recovery is quick.

**On the web.** Field validation and error summaries; failed requests, timeouts and offline states; permission and payment failures; no-results pages; conventional error styling that does not rely on colour alone (A11Y-19); generic messages, which CPY-04 fails.

**Ask.**
- (probe) Trigger every error you can (invalid input, empty required field, network failure, permission denial). Does the message name the problem and the fix in the label's own words? [HCI-070, PLAT-094]
- (probe) Is entered data kept after the error?
- (probe) Does focus move to the error or to a summary, and is the message programmatically tied to its field? (A11Y-13)
- Do raw codes, stack traces or blaming words appear?

**Typical violations.**
- No diagnosis. *Example, language-learning flashcard app:* **Word-list import failure does not say what is wrong.** Uploading a list with one malformed line shows 'Something went wrong'. The learner needs the line number and the expected format. `H9` · `single_location` (also CPY-04).
- Input cleared after an error; an error shown only by a red border.

**Not a violation.**
- An error code next to a plain-language explanation, kept for support reference. A code on its own is the defect.
- Error handling judged without triggering the error: that is a hypothesis.
- A short, plain message without an apology. That is the preferred tone, not curtness [PLAT-122].

### H10 · Help and documentation

**Means.** The best interface needs no manual. Where explanation is unavoidable, it is easy to find, appears where the question arises, stays on the task and gives concrete steps.

**On the web.** Hints and helper text; tooltips on icon-only controls (PLAT-112); contextual help in a consistent place on every page (A11Y-18); skippable onboarding that can be found again; empty states that teach the next step (PLAT-093); searchable help.

**Ask.**
- Where users are likely to hesitate (unfamiliar terms, complex inputs), is help available at that point?
- Is help in the same place on every page? (A11Y-18)
- Is help task-focused, with concrete steps?
- (probe) Can onboarding be skipped and found again later?

**Typical violations.**
- Help away from the point of need. *Example, veterinary clinic booking tool:* **Fasting instructions for surgery appear only in a PDF linked from the confirmation email.** The booking form, confirmation page and help link were inventoried and none mentions fasting. Owners need the instruction when they choose the surgery time. `H10` · `missing_element`.

**Not a violation.**
- No help for a self-explanatory flow.
- A confusing control that is well documented. It is still a finding, but under the heuristic the control violates, not H10: people start using products without reading manuals (paradox of the active user, grade B), so documentation cannot rescue it [PLAT-128].

### 2.2 Crosswalk to other principle sets

Use this table to translate a principle cited by a source, a teammate or another tool into the H-number a finding records. It is UI-Evaluator's own mapping, a vocabulary aid rather than a claim of equivalence [06 X7]. Numbers refer to each source's own list. The last row holds principles with no Nielsen counterpart; §2.3 says what to cite for them.

| Nielsen | Shneiderman, golden rules (6th ed.) | Norman (2013) | Tognazzini, first principles | Gerhardt-Powals (1996) | ISO 9241-110:2020 |
|---|---|---|---|---|---|
| H1 | 3 informative feedback; 4 dialogs that reach closure | feedback; discoverability of the current state; gulf of evaluation | Latency Reduction; Autonomy (status); State* | 2 reduce uncertainty | 2 self-descriptiveness |
| H2 | – | conceptual model; mapping | Metaphors; Human-Interface Objects* | 4 aids to interpretation; 5 names tied to function | 3 conformity with user expectations |
| H3 | 6 easy reversal; 7 users in control | – | Explorable Interfaces; Protect Users' Work | – | 5 controllability |
| H4 | 1 consistency | – | Consistency | 6 consistent, meaningful grouping | 3 conformity with user expectations |
| H5 | 5 prevent errors | constraints; slips versus mistakes | Defaults; Protect Users' Work | – | 6 use error robustness (avoid, tolerate) |
| H6 | 8 reduce short-term memory load | discoverability of actions; signifiers; gulf of execution | Discoverability; Visible Navigation; Anticipation* | – | 2 self-descriptiveness; 4 learnability |
| H7 | 2 universal usability (novice to expert) | – | Efficiency of the User; Fitts's Law | 1 automate unwanted workload | 5 controllability (individualisation) |
| H8 | – | – | Simplicity; Aesthetics; Readability | 7 limit data-driven tasks; 8 only what is needed now | – |
| H9 | 5 prevent errors (repair only the faulty part) | – | – | – | 6 use error robustness (recovery) |
| H10 | – | – | Learnability* | – | 4 learnability |
| No Nielsen counterpart | 2 universal usability for people with disabilities (cite WCAG; gate G2) | affordances: the needed action exists at all (USE-08) | Color: never the only carrier (A11Y-19) | 3 fuse data; 9 multiple coding; 10 judicious redundancy (dashboards, §2.3) | **1 suitability for the user's tasks; 7 user engagement** (§2.3) |

\* Mapped by name only: the research notes list these Tognazzini areas without detail [unverified].

Norman's gulfs also line up with the walkthrough questions in [cognitive-walkthrough.md](../methods/cognitive-walkthrough.md) (derived): the gulf of execution with CW-Q2 and CW-Q3, the gulf of evaluation with CW-Q4. Deciding whether a problem is one of visibility or of interpretation points toward the fix [06 §2.A.7].

### 2.3 Add-ons where Nielsen is silent

- **Suitability for the user's tasks (ISO 9241-110 #1).** Nielsen's ten never ask whether the product does what users need. For every declared top task, check that it can be completed with what the UI offers, and cite USE-08. Gaps are `missing_element` findings backed by positive evidence of absence: the states searched and the controls inventoried [HCI-076, EVAL-034]. No study has measured how well LLM evaluators find missing functions, so walk each task deliberately instead of expecting a sweep to notice [06 §5 Q4].
- **User engagement (ISO 9241-110 #7).** Functions and information are presented so that people want to continue: visible progress (goal gradient, grade B) and encouragement that fits the moment. Engagement must serve the user's goal. Pressure tactics such as fake urgency, confirmshaming and nagging are dark patterns, reported under H3 or H5 and the honesty principle (FRAMEWORK §15) [EVAL-064]; Molich notes that engagement would be wrong for a product such as a betting site [06 §2.A.10]. No criterion ID covers engagement on its own yet, so cite the nearest heuristic as primary and add "ISO 9241-110 #7" as a corroborating label.
- **Data fusion for dashboards (Gerhardt-Powals 1, 3, 7, 9, 10).** On data-dense screens ask: does the screen do the comparisons and sums people would otherwise do in their heads? Does it combine low-level values into the answer the task needs? Does it keep the time spent reading raw numbers low? Is important data coded in more than one way? Is any redundancy deliberate and helpful for comparison? [data-display.md](data-display.md) turns these into dashboard rules [06 §2.A.9].
- **AI features (HAX).** Interfaces with AI features are also audited against HAX-G1 to HAX-G18, with PAIR's error taxonomy: see [ai-features.md](ai-features.md) [HCI-075].

### 2.4 "Laws of UX" and their evidence grades

Only grade A or B items may support a finding, and the finding still cites the heuristic it violates. Grade C and D items may frame a discussion but are never the sole justification (FRAMEWORK §8.1 rule 7) [HCI-074]. Grades [06 §2.A.14]: **A** a quantitative law replicated many times in HCI; **B** a reliable laboratory phenomenon whose transfer to interfaces is plausible but not directly quantified; **C** contested or mixed replication; **D** a maxim or design philosophy.

| Item | Claim (paraphrased) | Grade | How to use it |
|---|---|---|---|
| Fitts's law | Time to reach a target grows with distance and shrinks with size | A | Flag small or distant targets for frequent or primary actions (H7); speed claims need a timed test |
| Hick–Hyman law | Choice time grows with the log of the number of equally likely options | A in choice-reaction tasks; B in UI | A reason to cut simultaneous unfamiliar choices. It does not cap menu length, because scanning an unordered menu is linear |
| Miller's 7 ± 2 | Short-term memory holds a few chunks; Cowan (2001) puts the core capacity nearer 4 (3–5) | B for the capacity limit; the "7 items" rule is a misapplication | Flag designs that make people remember across screens (H6); never flag item counts [HCI-072] |
| Peak–end rule | Remembered experience is weighted by its peak and its end | B (meta-analysis, read through a secondary summary) | Give end-of-flow moments (confirmation, recovery) weight in impact notes |
| Aesthetic–usability effect | Attractive designs are perceived as easier, and small problems are forgiven | B (for perceived usability) | Behaviour outweighs stated satisfaction; praise for visuals never offsets an observed failure [HCI-056, HCI-078] |
| Von Restorff effect | A distinctive item is remembered better | B | The primary action and critical warnings stand out, one or a few per view |
| Serial position | First and last items are recalled best | B | Put the most important navigation items at the ends of a sequence |
| Goal gradient | Effort rises as the goal gets closer | B | Supports progress indicators in multi-step flows |
| Gestalt grouping | Proximity, similarity, common region and connectedness group elements | B | Layout checks in §2.6 |
| Paradox of the active user | People skip manuals and start using the product | B | Help and onboarding cannot rescue a confusing control |
| Cognitive load | Load added by the design (extraneous load) harms performance | B | Remove extraneous load (§2.7) |
| Choice overload | Large assortments impair choosing | C: mean effect near zero; it appears only with moderators such as complex options, a hard task or unclear preferences | Flag only complex, hard-to-compare assortments; suggest comparison aids and filters |
| Zeigarnik effect | Unfinished tasks are remembered better | C: a 2025 meta-analysis found no memory advantage | Do not cite. Progress indicators rest on the goal gradient and on the tendency to resume |
| Doherty threshold | Productivity rises sharply below 400 ms | C/D: practice reports, venue unverified | Use the limits in §2.5 instead |
| Jakob's law | People expect a product to work like the others they use | D | Framing only; cite H4 for a convention break |
| Tesler, Postel, Pareto, Parkinson, Occam | Maxims from engineering, economics and philosophy | D | Never evidence. Postel's idea of accepting varied input is better cited as ISO 9241-110 #6 |
| Attention, mental models, working memory, flow, chunking, cognitive biases | Established constructs rather than laws | B as constructs | Use them to explain a finding, never as its only support |

### 2.5 Response-time limits

| Delay | What the person experiences | What the interface owes them |
|---|---|---|
| up to 0.1 s | the result feels immediate, like direct manipulation | nothing beyond the result |
| up to 1 s | the delay is noticed, but the train of thought holds | beyond 1 s, a sign that the system is working |
| up to 10 s | the limit for keeping attention on the task | beyond 10 s, how much is done so far and a clear way to interrupt |

These are Nielsen's limits, drawn from Miller (1968) and Card et al. (1991) [06 §2.A.14; HCI-067]. Tognazzini's 50 ms click acknowledgement is a stretch target, not a threshold; 0.1 s is the research-cited pass line [06 X12]. The Doherty 400 ms threshold is not used (§2.4).

- **Gate.** CMP-04 (G3) sets the threshold: a visible acknowledgement within 0.1 s of a user action; operations > 1 s show progress; a static "Loading…" alone fails.
- **Beyond the gate.** The 10 s row is not part of CMP-04; the advisory rule CMP-10 covers it. When a wait passes 10 s without a progress measure or a way to stop it, report it under H1 (no progress) or H3 (no way out), one finding per problem.
- **Which indicator, and when.** Indicator choice by expected wait and skeletons are CMP-10 and CMP-11 in [components-states.md](components-states.md); how indicators move is MOT-20 in [motion.md](motion.md).

### 2.6 Gestalt grouping checks

The perceptual effects are reliable, and applying them to layouts is well-grounded practice that can be checked on any capture [06 §2.A.13; HCI-073].
- **Proximity.** Space between groups is larger than space within groups, at every nesting level. The measured check and its starting ratios are LAY-06 in [layout.md](layout.md) [calibrating].
- **Common region.** Related controls share a container or background. A container outweighs other grouping cues, but containers everywhere become clutter, and a card inside a card is a tell (SLP-07).
- **Similarity.** Things that look alike behave alike, and things that behave differently look different. Similarity is the weakest cue but works across distance, which suits scattered items of one kind.
- **Strength order.** Proximity can overpower similarity of colour or shape, so check that spacing does not contradict a colour grouping.
- **Breakpoints.** Groupings survive every width in the matrix; check the capture at each width.

A grouping finding names the elements that read as one group (or as separate groups) and the task error that follows, usually under H4, H6 or H8.

### 2.7 Cognitive-load checklist

An eight-item screening list adapted from impeccable's critique protocol [IMP-043]. Count failures per screen: 0–1 low, 2–3 moderate, 4 or more high. This banding is impeccable's heuristic [calibrating].

| # | Item | Fails when | Usually cited as |
|---|---|---|---|
| 1 | Single focus | the screen has no clear main task | H8 |
| 2 | Chunking | long runs of items are not broken into small groups (impeccable: at most 4 per group [unverified]) | H8 |
| 3 | Grouping | related items are not visibly grouped (§2.6) | H8, H4 |
| 4 | Visual hierarchy | the most important item is not the most obvious | H8 |
| 5 | One decision at a time | a step asks for several unrelated decisions at once | H8 |
| 6 | Few options per decision | a decision point shows many options at once (impeccable: at most 4 visible [unverified]) | H8 (Hick–Hyman) |
| 7 | No memory bridges | the user must carry information between screens | H6 |
| 8 | Progressive disclosure | rarely used options crowd the main path | H8 |

**Treat the numbers with care.** Impeccable bases its limits of 4 on Cowan (2001), which concerns working-memory capacity, not how many options a screen may show. Options on screen are recognised rather than recalled, so applying a memory span to them is the same mistake as the 7 ± 2 menu rule; the research marks this basis as needing verification [01 §5 Q2; HCI-072]. Use the counts as prompts to look closer and never as the sole justification: a load finding names what the person must hold in mind or decide, and what that costs the task. Only extraneous load, the load the design adds, is the design's fault; a hard task keeps its intrinsic load. Impeccable's named violations map onto the heuristics as follows: wall of options and visual noise (H8), memory bridge and hidden navigation (H6), jargon barrier (H2), inconsistent pattern (H4), multi-task demand (H8), context switch (H6).

## 3. Decisions to make (for direct/build)

Heuristics are applied during evaluation, but several of the choices they test are better made deliberately and recorded, so evaluators can tell a decision from an accident:
- **Status model (H1):** for each async action, the feedback it gives in each band of §2.5.
- **Recovery policy (H3, H5):** which actions get undo, which get confirmation, and how double submission is blocked [PLAT-092, DSL-040].
- **Validation and error pattern (H5, H9):** submit-time validation by default, an error summary plus inline messages, input kept [PLAT-094, PLAT-095].
- **Terminology (H2, H4):** a glossary with one term per concept, kept with the copy; zh-CN term choices follow [cjk.md](cjk.md) [PLAT-125].
- **Accelerators (H7):** for each frequent journey, which accelerators exist, and a remappable shortcut scheme (A11Y-17).
- **Help strategy (H10):** which concepts need inline help, and where help lives on every page.
- **Add-ons in scope:** dashboards ([data-display.md](data-display.md)), AI features ([ai-features.md](ai-features.md)), and any engagement goals with their ethical limits (§2.3).
- **Known trade-offs:** for example a collapsed menu on small screens. Record them in the `DESIGN.md` decisions log so evaluators mark them `trade_off` instead of raising them again [HCI-013, HCI-028].

## 4. How to fix common failures

Fix one finding at a time, at the narrowest correct layer, then re-run the check that raised it (FRAMEWORK §10).

| Failure | Narrowest correct fix | Verify |
|---|---|---|
| H1: a button gives no acknowledgement | pending state in the shared button component: in-button progress, changed label, repeat clicks blocked [PLAT-054] | `uie probe` click with timing; CMP-04 |
| H1: a static "Loading…" | an indicator chosen by expected wait (CMP-10 in [components-states.md](components-states.md)), with a line saying what is loading | probe on a throttled connection |
| H2: internal vocabulary | change the term in the glossary and the string files, not in one component | copy inventory; re-walk the step that failed CW-Q3 |
| H3: irreversible delete | soft delete with an undo notice, or a confirmation that names the consequence [DSL-040] | probe: delete, undo, data restored |
| H4: two names for one action | pick one term in the glossary and replace it everywhere | cross-screen consistency pass (USE-10) |
| H5: double submission | in-button progress plus an idempotent request [PLAT-054] | probe a double click: one request sent |
| H6: placeholder-only label | persistent label in the shared field component | A11Y-13; capture while typing |
| H6: state lost on Back | keep filters, tabs and paging in the URL [DSL-041] | probe: open an item, go Back |
| H8: competing elements | remove or demote the element with no task job; delete before adding [DSL-066] | re-capture; design panel |
| H9: generic error | field-specific cause and fix, input kept [PLAT-094, HCI-070] | trigger the error again; CPY-04 |
| H10: help far from the need | an inline hint at the step | walk the step again |

## 5. CJK and localisation notes

- H2 depends on locale: formats, units, address order and the form of address (你 or 您, chosen once per product) all vary. zh-CN conventions are in [cjk.md](cjk.md); number, date and time formats in [data-display.md](data-display.md).
- External consistency (H4) is regional. Dense Chinese enterprise forms may use right-aligned labels with colons on wide screens; the `enterprise-zh` profile in [platforms.md](platforms.md) covers this, so do not report it as inconsistency [05 §3.3 C8].
- Chinese commerce and super-app interfaces are often denser than Western ones, and whether Western density heuristics transfer is an open question. Avoid density-only H8 findings on zh-CN surfaces without user evidence [07 §7 Q3].
- Social norms for AI features (HAX-G5) vary by culture: see [ai-features.md](ai-features.md).
- The conventions in this file are mostly Western and Chinese; other locales need local review (FRAMEWORK §16).

## Sources

**Research adopt IDs.** HCI-001, HCI-002, HCI-004, HCI-005, HCI-007, HCI-013, HCI-014, HCI-025, HCI-028, HCI-030, HCI-032, HCI-056, HCI-059, HCI-067, HCI-069, HCI-070, HCI-071, HCI-072, HCI-073, HCI-074, HCI-075, HCI-076, HCI-078; EVAL-032, EVAL-034, EVAL-040, EVAL-043, EVAL-058, EVAL-059, EVAL-063, EVAL-064; PLAT-003, PLAT-031, PLAT-038, PLAT-041, PLAT-053, PLAT-054, PLAT-092, PLAT-093, PLAT-094, PLAT-095, PLAT-112, PLAT-120, PLAT-122, PLAT-125, PLAT-128; DSL-040, DSL-041, DSL-066; CRAFT-058; IMP-043. Research notes 06 (§2.A, §2.F, §3.2 X7, X9, X12, §5), 04 (§2.0), 01 (§2.1.F, §5), 05 (§3.3), 07 (§7).

**External sources** (cited and paraphrased; NN/g articles and books are never reproduced):
- Nielsen, *10 Usability Heuristics for User Interface Design*, NN/g, 1994, refreshed 2020. https://www.nngroup.com/articles/ten-usability-heuristics/
- Nielsen, *Response Times: The 3 Important Limits*, NN/g, 1993, updated 2014. https://www.nngroup.com/articles/response-times-3-important-limits/
- NN/g, *Progress Indicators*. https://www.nngroup.com/articles/progress-indicators/
- NN/g, Gestalt articles on proximity, similarity and common region, 2020. https://www.nngroup.com/articles/gestalt-proximity/
- NN/g, *Short-Term Memory and Web Usability*. https://www.nngroup.com/articles/short-term-memory-and-web-usability/
- NN/g, *The Two UX Gulfs: Evaluation and Execution*, 2018. https://www.nngroup.com/articles/two-ux-gulfs-evaluation-execution/
- Shneiderman, *Eight Golden Rules of Interface Design*, 6th ed., 2016. https://www.cs.umd.edu/users/ben/goldenrules.html
- Norman, *The Design of Everyday Things*, revised ed., 2013; *Signifiers, not affordances*, 2008. https://jnd.org/signifiers-not-affordances/
- Tognazzini, *First Principles of Interaction Design*. https://asktog.com/atc/principles-of-interaction-design/
- Gerhardt-Powals, *Cognitive engineering principles for enhancing human–computer performance*, IJHCI 8(2), 1996.
- Hvannberg, Law and Lárusdóttir, *Heuristic evaluation: comparing ways of finding and reporting usability problems*, Interacting with Computers 19(2), 2007.
- ISO 9241-110:2020 and ISO 9241-11:2018, read through Molich's summary. https://www.dialogdesign.dk/isos-dialogue-principles-2019/
- Yablonski, *Laws of UX*. https://lawsofux.com/
- Cowan, short-term memory capacity, Behavioral and Brain Sciences 24:87–114, 2001.
- Ghibellini and Meier, Zeigarnik meta-analysis, Humanities and Social Sciences Communications, 2025. https://www.nature.com/articles/s41599-025-05000-w
- Chernev et al., choice-overload meta-analysis, Journal of Consumer Psychology, 2015. https://chernev.com/wp-content/uploads/2017/02/ChoiceOverload_JCP_2015.pdf · Scheibehenne et al., 2010.
- Alaybek et al., peak–end meta-analysis, 2022. DOI 10.1016/j.obhdp.2022.104149
- Duan et al., CHI 2024 (LLM feedback on UI mockups). https://arxiv.org/abs/2403.13139 · Guerino et al., INTERACT 2025. https://arxiv.org/abs/2506.16345
- impeccable critique reference (Apache-2.0), summarised in research note 01 §2.1.F.
