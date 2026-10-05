# AI features

This file covers interfaces that contain AI features: generated text, images or code, assistants and chat, suggestions and autocomplete, rankings and recommendations, automated classification, and agents that act for the user. It defines the HAX guideline vocabulary (HAX-G1 to HAX-G18) used to audit them, PAIR's error taxonomy, and advisory rules AIX-01 onward. QUALITY-BAR has no AI-specific criterion, so these rules never fail a gate on their own: findings that cite them are verified and blind-rated like any judged finding and count toward G5 through USE-05 and USE-06 [FRAMEWORK §15; HCI-075]. Read this file during `audit` whenever an AI feature is in scope, and during `direct` and `build` when designing one. The general heuristics are in [heuristics.md](heuristics.md); the visual tells mentioned here are defined in [anti-slop.md](anti-slop.md).

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules)
   - [2.1 HAX-G1 to HAX-G18: what to check and what evidence to collect](#21-hax-g1-to-hax-g18-what-to-check-and-what-evidence-to-collect)
   - [2.2 PAIR error taxonomy and the path forward](#22-pair-error-taxonomy-and-the-path-forward)
   - [2.3 Rule records AIX-01 to AIX-12](#23-rule-records-aix-01-to-aix-12)
3. [Decisions to make (for direct/build)](#3-decisions-to-make-for-directbuild)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles

1. **Record both sides of every guideline.** Note where the product applies a guideline as well as where it violates it. The guidelines were validated that way, and the applications show what a fix must keep [06 §2.E.1; HCI-075].
2. **Set expectations before showing results.** People build their picture of an AI feature from its first appearance. Say what it can do and how well, so that trust matches reality: neither blind reliance nor rejection after the first mistake [PAIR, mental models; explainability and trust].
3. **Every failure has a way forward.** AI output is sometimes wrong. People must be able to notice it, correct it, dismiss it, or finish the task another way, including without the AI [PAIR, errors and graceful failure].
4. **People keep control of their work and their data.** AI changes are previewed, editable and reversible; data use is disclosed and can be switched off [HAX-G9, HAX-G17]. Apple's 2026 design principles make the same point: AI features need safeguards such as previews and confirmations, or should be removed when the risk outweighs the value [05 §2.1].
5. **No pretending, no pressure.** The system does not pose as a person, invent sources or display precision it does not have [PAIR; FRAMEWORK P12]. The mandatory dark-pattern sweep covers AI features too; one surveyed audit skill lists AI-specific dark patterns as a category of their own [EVAL-064; 04 §2.9].
6. **Prompt for what evaluators miss.** In the original study, evaluators often missed social-norm and bias problems (HAX-G5, HAX-G6), and explanation (HAX-G11) was among the most violated guidelines. Check these with prepared probes instead of waiting to notice them [06 §2.E.1].
7. **Some guidelines cannot be judged in one sitting.** Narrowing the service when in doubt (HAX-G10) and cautious adaptation (HAX-G14) proved hard to assess in a single session; learning from behaviour and change notices (HAX-G13, HAX-G18) also play out over time (derived). Mark them `not_assessable` and route them to `study` or `ingest` instead of guessing [06 §2.E.1].

## 2. Rules

### 2.1 HAX-G1 to HAX-G18: what to check and what evidence to collect

The eighteen guidelines of Amershi et al. (2019), paraphrased and grouped in the paper's four phases. In **Check**, (probe) means perform the interaction with `uie probe`, and (prompted) means run the prepared probe set of AIX-02. **Evidence** names what to attach: *capture* (screenshots and ARIA snapshot), *probe* (a `uie probe` recipe and its output), *copy* (the visible strings involved) or *multi-session* (evidence from `study` or `ingest`). A finding about an AI-specific problem cites the HAX-G ID as its primary criterion; **Also cite** gives the nearest Nielsen heuristic (UI-Evaluator's mapping, derived) to add where it fits.

**Initially**

| ID | Guideline (paraphrased) | Check | Evidence | Also cite |
|---|---|---|---|---|
| HAX-G1 | Say what the system can do | Is the feature's scope stated where it is invoked, with an example or two of good requests? Are important non-capabilities stated? | capture of the entry point and first-use state; copy | H10 |
| HAX-G2 | Say how well it can do it | Does the UI say how often or where the output may be wrong, near the output rather than only in the terms of service? | capture of the output view; copy | H5 |

**During interaction**

| ID | Guideline (paraphrased) | Check | Evidence | Also cite |
|---|---|---|---|---|
| HAX-G3 | Pick the moment from the context | (probe) Do proactive suggestions appear when they do not interrupt work, for example not mid-typing and not over the focused field? | probe with timing; capture of the interruption | H8 |
| HAX-G4 | Show what is relevant to the current context | (probe) Do outputs reflect the user's current task and data rather than generic content? Compare the same request in two contexts. | probe in two contexts | H8 |
| HAX-G5 | Follow the social norms of the users' setting | (prompted) Are tone, formality and form of address right for the users and the locale? Does the system avoid over-familiarity, moralising and blame? | prompted probe set; copy | H2 |
| HAX-G6 | Avoid reinforcing social biases | (prompted) Do outputs, defaults, examples or images shift in stereotyped ways when only a name, gender, dialect or region cue changes? | paired prompted probes; outputs side by side | none |

**When wrong**

| ID | Guideline (paraphrased) | Check | Evidence | Also cite |
|---|---|---|---|---|
| HAX-G7 | Make it quick to call up | (probe) Can the feature be invoked where it is needed, by pointer and by keyboard, without a detour? | probe with mouse and keyboard; capture | H7 |
| HAX-G8 | Make it quick to dismiss or ignore | (probe) Can a suggestion be ignored or dismissed in one action (Esc, Close) without blocking input, and does it stay dismissed? | probe: dismiss, then keep typing | H3 |
| HAX-G9 | Make it quick to correct | (probe) Can the user edit, refine, regenerate or undo one specific output, and revert a change the AI applied? | probe of edit and undo; state before and after | H3, H9 |
| HAX-G10 | Do less, or ask, when uncertain | (probe) With ambiguous input, does the system ask, offer options or narrow its action rather than guess with confidence? | probe with ambiguous input; often multi-session | H5 |
| HAX-G11 | Explain why it did what it did | (prompted) Can the user find why a result, ranking or action happened: the sources, the inputs used or the deciding factors? Does each citation open the source it names? | prompted probe; every citation opened | H1 |

**Over time**

| ID | Guideline (paraphrased) | Check | Evidence | Also cite |
|---|---|---|---|---|
| HAX-G12 | Keep recent context | (probe) Does the system keep recent, relevant context so the user need not repeat it, and can the user clear it? | probe of a two-step task that refers back | H6 |
| HAX-G13 | Personalise from the user's behaviour | Does personalisation follow the user's own actions, and can the user see and control it? | multi-session; capture of settings | H7 |
| HAX-G14 | Change behaviour gradually and carefully | Do adaptations avoid sudden changes to familiar layouts, rankings or behaviour, and can they be reverted? | multi-session | H4 |
| HAX-G15 | Invite feedback on specific outputs | (probe) Can feedback be given on one specific output, optionally with a reason, and is giving it optional? | probe of the feedback controls; copy | none |
| HAX-G16 | Say how user actions shape later behaviour | Does the UI say how accepting, rating or editing will change what the system does later? | copy near those controls | H1 |
| HAX-G17 | Offer settings that apply everywhere | Are there settings that switch the feature off, limit data use or change its behaviour globally, separate from correcting one output? | capture of settings; probe of switching it off | H3 |
| HAX-G18 | Tell users when the system changes | When capabilities or the underlying model change, are users told what changed and what it means for them? | in-product notices; multi-session | H1 |

Two notes from the original study [06 §2.E.1]:
- HAX-G9 corrects one output; HAX-G17 changes behaviour everywhere. Evaluators confused the two, so say which one a finding is about.
- HAX-G11 drew among the most violations. Look for an explanation path on every kind of AI output the product produces [HCI-075].

### 2.2 PAIR error taxonomy and the path forward

Define an error from the user's point of view, not from model metrics: PAIR's example is a recommender that is useful 60% of the time, which may count as success in one context and failure in another. Tag every AI failure finding with its source type in the finding's `tags` (`pair:user`, `pair:system`, `pair:context` or `pair:background`) [PAIR, errors and graceful failure; HCI-075].

| Type | What went wrong | How an evaluator finds it | Typical path forward |
|---|---|---|---|
| User | the person gave input the system cannot use as intended | probe with realistic imperfect input: typos, vague requests, unsupported formats | examples and guidance, editable input, a clarifying question |
| System | the model or pipeline returned something wrong, empty or failed | probe the critical journeys and compare the output with the task | retry, edit, alternative suggestions, a non-AI route |
| Context | the system assumed something wrong about the person's situation | probe the same request in two contexts | show the assumption and let the user correct it |
| Background | neither the person nor the system notices the error | rarely visible to inspection; needs targeted QA, `study` or `ingest` | verification aids such as sources and previews; a way to report problems |

Stakes rise with novice users, divided attention, low system confidence and narrow definitions of success. Put these in the finding's impact note so raters can weigh them. Whether a false positive or a false negative costs users more is a product decision taken with users (§3) [PAIR].

### 2.3 Rule records AIX-01 to AIX-12

All AIX rules are advisory: they raise findings for verification and rating but cannot fail a gate by themselves.

### AIX-01 · Audit every AI feature against all eighteen guidelines
`level: advisory` · `modes: all` · `status: active` · `verify: A (isolated evaluator; uie probe)`

**Rule.** When an AI feature is in scope, an isolated evaluator records a disposition for each of HAX-G1 to HAX-G18 (`applied`, `violated`, `neutral`, `not_applicable` or `not_assessable`, each with a reason and evidence references) and turns each violation into a candidate finding, one problem per finding, tagged with its PAIR type.

**Why.** A checklist pass catches AI-specific problems that the general heuristics miss, and recording applications shows what fixes must keep. The original study used this applied-or-violated format [06 §2.E.1; HCI-075].

**Check.** The evaluator output's coverage notes list all eighteen dispositions; `not_assessable` items also appear in its not-assessable list, with the reason (for example, needs several sessions).

**Fix.** Re-run the audit pass for the missing guidelines. A 5-point rating from clearly violated to clearly applied may be kept as a note, but it is never summed into a score and never gates (FRAMEWORK P7).

**Exceptions.** None. A guideline that cannot apply is marked `not_applicable` with its reason.

**Sources.** HCI-075; Amershi et al. 2019.

### AIX-02 · Prepared probes for norms, bias and explanations
`level: advisory` · `modes: all` · `status: active` · `verify: A, I (uie probe)`

**Rule.** Every AI audit runs three prepared probe sets and records inputs, outputs and a disposition even when nothing is wrong: for HAX-G6, requests that differ only in a name, gender, dialect or region cue; for HAX-G5, requests that test politeness, formality, refusal tone and locale; for HAX-G11, a search for the reason or sources behind outputs on each critical journey.

**Why.** In the original study, many evaluators marked G5 and G6 as not applying while others found violations in the same product category, so these problems stay unseen unless someone looks on purpose; G11 was among the most violated [06 §2.E.1].

**Check.** The evaluator output contains the three probe sets, each with inputs, outputs and a disposition.

**Fix.** Write the probe sets from the journeys and personas in the packet and re-run them. Use synthetic inputs only; never send real personal data to the feature under test.

**Exceptions.** HAX-G6 is `not_applicable` only when outputs cannot vary with person-related cues, such as a feature that ranks bicycle parts by stock level.

**Sources.** HCI-075; Amershi et al. 2019.

### AIX-03 · Every AI failure offers a way forward
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe); A`

**Rule.** Each AI failure state (no result, poor result, refusal, timeout, error) says in plain words what happened and offers at least one way forward: retry, rephrase with guidance, edit, choose an alternative, or finish the task without the AI.

**Why.** AI features fail more often and less predictably than deterministic ones, and without a way forward a failure is a dead end (H3, H9) [PAIR].

**Check.** (probe) Induce failures: empty or ambiguous input, an unsupported request, a network failure, an over-long input. Inventory the recovery controls in each failure state and classify the failure by PAIR type (§2.2). Generic messages also fail CPY-04.

**Fix.** One shared failure state for the AI component: a specific message, a retry, a link to the manual route, and the user's input kept.

**Exceptions.** None.

**Sources.** PAIR (errors and graceful failure); HCI-070; CPY-04.

### AIX-04 · Capability and limits are stated where the feature starts
`level: advisory` · `modes: all` · `status: active` · `verify: A (capture; copy)`

**Rule.** At the AI entry point, the UI says what the feature does, gives an example or two of good requests, and names its main limits, where people invoke it rather than only in documentation.

**Why.** The first encounter sets the mental model; unclear scope leads to wasted attempts and misplaced trust (HAX-G1, HAX-G2) [PAIR, mental models].

**Check.** Capture the entry point and its empty or first-use state; inventory the copy for scope, examples and limits.

**Fix.** Add scope copy and example requests to the empty state of the entry component.

**Exceptions.** A single-purpose control whose label states its whole scope, such as a "Suggest a title" button in a poetry archive's submission form.

**Sources.** HAX-G1, HAX-G2; PAIR (mental models).

### AIX-05 · Generation shows its status and can be stopped
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe)`

**Rule.** While the system generates, it meets CMP-04, shows the output arriving or the progress made during longer generations, offers a Stop control when generation can run for many seconds, and exposes start, completion and failure to assistive technology without moving focus (A11Y-15).

**Why.** Generation often takes seconds. Beyond 10 s people need to see progress and have a way to interrupt ([heuristics.md](heuristics.md) §2.5; CMP-10), and screen-reader users otherwise cannot tell that output has arrived.

**Check.** (probe) Invoke the feature and record the time to the first visible change, the progress shown during a long generation, whether Stop works, and the status messages in the ARIA snapshot. Whether streamed text should also be announced as it arrives is unsettled [unverified]; list it for the needs-human screen-reader check (A11Y-21).

**Fix.** A shared generating state: an immediate pending state on the trigger, a container marked busy while it updates, a status region for start, finish and failure, and a Stop button.

**Exceptions.** A generation that finishes within 1 s needs only the acknowledgement.

**Sources.** CMP-04; CMP-10 in [components-states.md](components-states.md); A11Y-15; HCI-067; Primer loading pattern (`aria-busy`, 05 §2.8); ui-craft detector rule for streaming without a live region [02 §2.6].

### AIX-06 · Sources resolve and stand apart from generated text
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe); A`

**Rule.** When output cites sources, each citation is visually distinct from the generated text, opens the specific source it names, and that source supports the claim attached to it. Output without sources does not imply that it has them.

**Why.** Sources let people check output and calibrate their trust (HAX-G11) [PAIR, explainability and trust]. A citation that does not lead to its claim is fabricated proof (FRAMEWORK P12).

**Check.** (probe) For a sample of outputs on each critical journey, open every citation and compare the attributed claim with the source. A mismatch is a `pair:background` finding.

**Fix.** Render citations as links to the exact place in the source; when retrieval fails, say so in the output instead of showing an unlinked reference.

**Exceptions.** None.

**Sources.** HAX-G11; PAIR (explainability and trust); FRAMEWORK P12.

### AIX-07 · Uncertainty is shown in a form people can act on
`level: advisory` · `modes: all` · `status: calibrating` · `verify: A`

**Rule.** Where output may be wrong in ways that matter, the UI shows that uncertainty next to the output in a form the user can act on, such as marking unsupported parts, offering alternatives or saying what to check. A numeric confidence appears only if the product can say what the number means for this user.

**Why.** Confidence displays sway decisions, so they must help people calibrate trust rather than decorate (HAX-G2) [PAIR]. Precise-looking figures with no basis are a known tell (A-DC4, 07 §2.4.9) and become fabricated proof when they are claims (SLP-12).

**Check.** Inventory confidence and uncertainty displays; for each, ask what action it supports and whether its meaning is stated.

**Fix.** Replace unexplained scores with wording or highlighting tied to what the user should check.

**Exceptions.** Expert tools whose users are trained on a calibrated score.

**Sources.** HAX-G2; PAIR (explainability and trust). Which uncertainty displays work best for which users is not covered by the research [unverified], hence `calibrating`.

### AIX-08 · AI changes are previewed, editable and reversible
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe)`

**Rule.** AI output can be edited before it is used. An AI action that changes the user's data or acts on their behalf (sending, deleting, publishing, buying) shows a preview and waits for confirmation, or can be undone.

**Why.** Efficient correction (HAX-G9) and a way back (H3) matter more when the actor is a model that is sometimes wrong [HCI-069]. Apple's 2026 principles ask for previews and confirmations on AI actions [05 §2.1].

**Check.** (probe) Accept an AI suggestion, edit it, then undo it; trigger an AI action that changes data and look for the preview, the confirmation or the undo.

**Fix.** Route AI changes through the same undo history as user edits; add an apply step with a preview for actions that have side effects [DSL-040].

**Exceptions.** Read-only outputs such as answers and summaries need editing only where users reuse them.

**Sources.** HAX-G9; HCI-069; DSL-040; Apple design principles (2026), via 05 §2.1.

### AIX-09 · Feedback controls are specific, optional and explained
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe); A`

**Rule.** Feedback controls attach to a specific output, are optional and never block the task, and say what the feedback is used for and when it will make a difference.

**Why.** Feedback on a specific output is more useful to the system and less work for people (HAX-G15). Saying what happens to feedback, and when, keeps the exchange honest and lets people opt out (HAX-G16) [PAIR, feedback and control].

**Check.** (probe) Use each feedback control; note what it requires, what is optional and what the copy around it says.

**Fix.** Per-output controls with an optional reason, and one line of copy on how the feedback is used and when it takes effect.

**Exceptions.** None.

**Sources.** HAX-G15, HAX-G16; PAIR (feedback and control).

### AIX-10 · Data use is disclosed and controllable
`level: advisory` · `modes: all` · `status: active` · `verify: A (capture; copy); I (uie probe)`

**Rule.** At or before the point where user content goes to an AI feature, the UI says what is sent, whether it is kept or used to improve the system and, where that use is optional, offers a choice that is off by default. A global setting can switch the feature off (HAX-G17).

**Why.** People can only consent to what they understand. Explaining why when asking and collecting only what is needed are basic responsibilities, and pre-checked consent is a dark pattern [PAIR, data collection; Apple principles via 05 §2.1; EVAL-064; FRAMEWORK §15].

**Check.** Capture the entry point and the settings; inspect the default state of each consent control; (probe) switch the feature off and confirm that it stops.

**Fix.** Disclosure copy at the entry point, consent controls unchecked by default, and a global switch in settings.

**Exceptions.** Evaluators judge clarity and control only; whether a data policy is lawful is outside UI evaluation.

**Sources.** HAX-G17; PAIR (data collection; feedback and control); EVAL-064.

### AIX-11 · The system does not pass as a person
`level: advisory` · `modes: all` · `status: active` · `verify: A (capture; copy)`

**Rule.** People can always tell that they are dealing with an automated system: an assistant has no human photograph, no staff-style name without an "automated" label, and makes no claims of feelings or experiences.

**Why.** Human-like presentation creates expectations the system cannot meet, which leads to over-trust and disappointment [PAIR, mental models]. Passing as a person is deception (FRAMEWORK P12, §15).

**Check.** Inventory the assistant's name, avatar, self-descriptions and status indicators. A typing indicator tied to real generation is status, not simulated liveness (SLP-11), as long as the assistant is labelled as automated.

**Fix.** Label the assistant as automated wherever it appears, and replace human photographs with a neutral mark.

**Exceptions.** A named assistant persona chosen in `DESIGN.md` and clearly labelled as automated.

**Sources.** PAIR (mental models); HAX-G5; FRAMEWORK P12.

### AIX-12 · AI is labelled in words, and any reserved AI marker stays on AI
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit) for SLP-02; A (capture)`

**Rule.** AI entry points and AI-generated content are labelled in words, not by an icon alone. If the product reserves a visual marker for AI, such as a blue-to-purple-to-pink gradient or a sparkle glyph, `DESIGN.md` records it as an accepted tell with that reason and scope, and the marker appears nowhere else.

**Why.** Some design systems now reserve such gradients as semantic tokens for AI features (Semi Design, as of 2026-10). Used as generic decoration, the same gradient reads as a template default (SLP-02) and blurs a meaning users may have learned [PLAT-068]. A sparkle icon on its own was read as "AI" by none of 107 participants in an NN/g study, and a default glyph in a default role is SLP-24 [CRAFT-044].

**Check.** Compare the locations of SLP-02 hits from `uie lint` and `uie audit` with the AI surfaces and with the accepted tells in `DESIGN.md`; capture each AI entry point and check for a text label.

**Fix.** Add a text label. Replace generic uses of the marker with the product's own colour roles. If the marker stays, record it in `DESIGN.md` with its reason and scope, confine it to one token used only on AI surfaces, and make any text over it pass contrast at its worst point (COL-11).

**Exceptions.** A brand whose documented palette already contains these hues, where SLP-02 does not fire. This file does not recommend adopting an AI gradient; it only says how to treat one.

**Sources.** PLAT-068; CRAFT-044; Kaplan 2024 (NN/g sparkles icon study); Semi Design AI tokens (05 §2.14); SLP-02 and SLP-24 in [anti-slop.md](anti-slop.md); COL-11 in [color.md](color.md).

## 3. Decisions to make (for direct/build)

Record these in `PRODUCT.md` (product facts and trade-offs) or `DESIGN.md` (presentation) before building an AI feature:
- **Automate or augment.** Automate work that is tedious, unpleasant or needs scale and where people agree on the right answer; augment work people enjoy, value socially, or where answers legitimately differ [PAIR]. Two contrasting cases: a logistics dashboard may automate routine route suggestions, because dispatchers agree on what a good route is; a poetry archive should only support a reader's interpretation, because readings differ and the reading is the point.
- **Which error costs more.** For these users, is a false positive or a false negative worse? Decide with users and record the precision–recall stance [PAIR].
- **The non-AI route.** How a person completes the task when the AI fails or is switched off (AIX-03).
- **Explanation model.** Sources, reasons, inputs used, or a mix: what "why" means for this feature (HAX-G11, AIX-06).
- **Uncertainty display.** Which uncertainty is shown, and what action it supports (AIX-07).
- **Disclosure and data use.** What is sent, kept and learned from; consent defaults; the global switch (AIX-10).
- **Marking and persona.** Word labels for AI; whether any visual AI marker is reserved (not by default, AIX-12); whether the assistant has a name, always labelled as automated (AIX-11); its tone positions, set with the brand voice in [content-copy.md](content-copy.md).

## 4. How to fix common failures

Fix one finding at a time and re-run the probe that raised it (FRAMEWORK §10).

| Failure | Narrowest correct fix | Verify |
|---|---|---|
| No explanation or sources (HAX-G11) | a "why" or sources affordance in the shared output component | probe: open the explanation and every citation |
| A suggestion cannot be dismissed (HAX-G8) | Esc and Close in the suggestion component, without taking focus from the field | probe: dismiss, then keep typing |
| An AI change cannot be undone (HAX-G9) | AI changes go through the same undo history as user edits | probe: apply, undo, state restored |
| Generic failure message | specific message, retry and manual route in the AI failure state (AIX-03) | induce the failure again; CPY-04 |
| Long generation with only a spinner | streamed output or staged progress, plus Stop (AIX-05) | probe with timing on a throttled connection |
| Sparkle icon as the only label | a text label next to the icon | capture; copy inventory |
| AI gradient used as generic decoration | the product's own colour roles outside AI surfaces | `uie lint` (SLP-02) |
| Data-use consent pre-checked | default off, with disclosure copy beside it | capture of the default state |
| Assistant shown with a human photograph | a neutral mark and an "automated" label | capture |

## 5. CJK and localisation notes

- Social norms (HAX-G5) are locale-specific. For zh-CN, check that the AI uses the form of address the product chose (你 or 您, never mixed) and the canonical terms in [cjk.md](cjk.md); directness and humour also vary by culture.
- Output in a language other than the page's needs its own `lang` on that fragment (A11Y-16), so it is pronounced and rendered correctly.
- Bias probes (AIX-02) need name and dialect sets that fit each shipped locale; a probe set built only from Western names misses regional stereotypes.
- The guidance here is mostly Western and Chinese; other locales need local review (FRAMEWORK §16).

## Sources

**Research adopt IDs.** HCI-067, HCI-069, HCI-070, HCI-075; EVAL-064; PLAT-068; CRAFT-044; DSL-040. Research notes 06 §2.E (HAX and PAIR), 04 §2.9 (AI-specific dark patterns), 05 §2.1 (Apple principles), §2.8 (Primer loading), §2.14 (Semi AI tokens), 07 §2.2 and §2.4.5 (sparkles icon), §2.4.9 (A-DC4), 02 §2.6 (ui-craft detector).

**External sources** (paraphrased; no guideline text is reproduced):
- Amershi et al., *Guidelines for Human-AI Interaction*, CHI 2019. https://www.microsoft.com/en-us/research/uploads/prod/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf
- Google PAIR, *People + AI Guidebook*, all-chapters edition. https://pair.withgoogle.com/chapter/People%20+%20AI%20Guidebook%20-%20All%20Chapters.pdf . A 2025 update for generative AI is reported but was not read [unverified].
- Kaplan, *The AI sparkles icon problem*, NN/g, 2024. https://www.nngroup.com/articles/ai-sparkles-icon-problem/
- Apple, Human Interface Guidelines design principles (2026-06-08) and WWDC26 session 250. https://developer.apple.com/videos/play/wwdc2026/250/
- Semi Design (DouyinFE/semi-design), AI colour tokens. https://github.com/DouyinFE/semi-design
