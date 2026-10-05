# Design panel

The critic protocol for gate G6 (design quality), and the rules the lead uses to turn critic outputs into gate states. It judges what measurement cannot: whether the design belongs to this product, whether its hierarchy, coherence, restraint, brand fit and execution hold up, and whether its audience would find it attractive and finished. This file owns DES-01…DES-07 and the rubric anchors. Readers: the design critic (§3.1–§3.7) and the lead (§3.8).

## Contents

1. [Purpose and when to use](#1-purpose-and-when-to-use)
2. [Inputs](#2-inputs)
3. [Procedure](#3-procedure)
   - [3.1 Critic: the steps](#31-critic-the-steps)
   - [3.2 The three specificity tests](#32-the-three-specificity-tests)
   - [3.3 The specificity and appeal verdicts](#33-the-specificity-and-appeal-verdicts)
   - [3.4 Unsealing the detectors](#34-unsealing-the-detectors)
   - [3.5 Brand fit](#35-brand-fit)
   - [3.6 Design findings and strengths](#36-design-findings-and-strengths)
   - [3.7 Pairwise comparison with the baseline](#37-pairwise-comparison-with-the-baseline)
   - [3.8 Lead: aggregate the panel](#38-lead-aggregate-the-panel)
   - [3.9 The rubric and its anchors](#39-the-rubric-and-its-anchors)
   - [3.10 Exemplars across contrasting aesthetics](#310-exemplars-across-contrasting-aesthetics)
4. [Output format](#4-output-format)
5. [Quality checks](#5-quality-checks)
6. [Pitfalls](#6-pitfalls)
7. [Sources](#7-sources)

---

## 1. Purpose and when to use

- **What the panel decides.** Whether a majority of isolated critics judge the design specific to this product, on brand and appealing to its audience, whether an agreed severe design finding is still open, and, for redesigns, whether the new version is at least as good as the baseline. Rubric scores are reported as context only. G6 never gates on a score, because holistic quality ratings have near-zero inter-rater reliability [P7].
- **When it runs.** Standard depth uses 3 critics. Rigorous depth uses 5 critics with different model configurations, adds the pairwise comparison and a human-confirmation pass (FRAMEWORK §7; ARCHITECTURE §6.2). Quick depth runs one critic whose output is feedback for the builder: one critic cannot meet DES-01, so G6 is at most `degraded`, and L1 does not need it.
- **What it is not.** Usability problems belong to heuristic evaluation and the walkthrough (G5). Measured craft and tells belong to `uie audit` and `uie lint` (G3, G4). The panel adds judgment on top of them, checks detector hits against the render, and corroborates H8 findings from heuristic evaluators, which are unreliable on their own (METHODS §4.1).

**Criteria owned** (QUALITY-BAR G6, verbatim). G6 never gates on a score. It gates on verified, agreed findings and on the critics' categorical verdicts: specificity, brand fit and appeal [P7].

| ID | Criterion | Threshold | Verify | Src |
|---|---|---|---|---|
| DES-01 | Panel protocol | standard depth: ≥ 3 isolated critics; no build transcript; specificity written before detector output is shown; screenshots from the full matrix | A | CRAFT-012, IMP-032/036 |
| DES-02 | Specificity verdict | a majority of critics judge the design specific to this product, citing evidence from the swap, category-guess and similar-prompt tests | A | CRAFT-004, IMP-035 |
| DES-03 | No agreed severe design finding | 0 open design findings with mean severity ≥ 3 that were raised by ≥ 2 critics or confirmed by the verifier, unless decided (as USE-06) | A | IMP-035, P8 |
| DES-04 | Brand fit | a majority of critics judge the declared "X, not Y" attributes as reflected, citing elements | A | CRAFT-001/057 |
| DES-05 | Not worse than baseline (redesigns) | pairwise comparison with the baseline in both orders; only order-consistent preferences count; the new version is preferred or tied by the majority | A | HCI-034, CRAFT-062 |
| DES-06 | Rubric scores reported, labelled *(judged)* | present; never used for pass/fail | A | IMP-035, DSL X20 |
| DES-07 | Appeal verdict | a majority of critics judge the design `appealing` (finished, cared for, attractive to its audience, with visual interest its mode allows), written before detector output is shown and citing elements; `plain` and `unappealing` name the signs of unfinish | A | ADR-035 |

## 2. Inputs

The lead gives each critic a packet built by `uie packet --role design-critic` and an output path `runs/<id>/panel/critic-<n>.json`.

| Part | Holds | When the critic reads it |
|---|---|---|
| Context summary | users, top tasks, context of use, the product's category, each surface's job and mode (from `PRODUCT.md`) | first |
| Screenshots | routes × states × widths × themes from `uie capture`, with an index | from step 1 on |
| `DESIGN.md` material | brand attributes as "X, not Y", tone positions, colour strategy, tokens, accepted tells with reasons | after the inventory (step 4) |
| Baseline screenshots | the previous version, for redesigns | only for §3.7 |
| Detector section (sealed) | tool findings: tells and tell density per page, style census, measured failures | only after the specificity verdict is on disk |

The critic never sees the builder's transcript or notes, source code, other critics' outputs or any rating. If one reaches it, it stops and says so, because the run's independence record (EVD-07) would otherwise be false.

**Isolation.** Spawn an isolated subagent per critic if your environment supports it. Otherwise perform the role yourself, reading only this packet, and start every output with `DEGRADED: single-context (<reason>)`; G6 is then at most `degraded` [IMP-036].

**Tools.** The critic reads files, writes its output, and runs only `uie packet --role design-critic` (to release the sealed section) and `uie findings validate <file>`. It does not probe, so its evidence is the screenshots. Behaviour (feedback, focus, loading, motion) cannot be judged from stills: list it as not assessable instead of guessing (FRAMEWORK §8.1 rule 4).

## 3. Procedure

### 3.1 Critic: the steps

1. **Check the evidence.** Open each screenshot once. It must show what its name claims, contain no blank or near-uniform regions, start at the page top when it is a full-page capture, and come from a settled page. If captures are invalid, stop and return `recapture` with the file names: judging broken evidence turns breakage into approval [IMP-031; EVD-03]. If widths or themes are missing, continue and record the gap, because DES-01 needs the full matrix.
2. **Read the context summary.** Note each surface's job, mode and users. Leave the `DESIGN.md` material closed for now.
3. **Write your inventory before judging anything.** For each surface, at a wide and a narrow width and in each captured state, describe in your own words:
   - what is on screen, and the first three things your eye goes to;
   - the type voices and the roles they play;
   - colour as seen: what dominates, where the accent appears, light or dark;
   - shape and depth: corners, borders, shadows, surfaces;
   - the imagery and what it shows;
   - the copy voice, quoting two or three real strings;
   - the signature element, if there is one;
   - the conventions kept: navigation, controls, page anatomy;
   - what stills cannot show.

   Note suspected problems as you go but do not rate them yet. An inventory written first records what the design shows rather than what it was meant to show [IMP-032; LOOP-017].
4. **Read the `DESIGN.md` material.** Note the attributes, tone positions, colour strategy and accepted tells. A tell accepted with a reason is a decision: record it as *requested* and never count it against specificity [CRAFT-005; P2].
5. **Run the three specificity tests** (§3.2) and record each.
6. **Write the specificity and appeal verdicts** (§3.3) into your verdict file, then into your output file, and run `uie findings validate <file>`.
7. **Unseal the detectors** and sort what they report (§3.4).
8. **Judge brand fit** pair by pair (§3.5).
9. **Score the rubric** (§3.9), citing evidence for every score.
10. **Record design findings and strengths** (§3.6).
11. **Compare with the baseline** in both orders when your packet contains baseline screenshots (§3.7).
12. **Validate and return.** Run `uie findings validate <file>` and return at most 10 lines: the verdicts, the finding count, the output path and any blocking problem. Never paste findings into chat (ARCHITECTURE §6.3).

### 3.2 The three specificity tests

Apply the tests to the identity-carrying elements: the first viewport, the signature, the colour anchor, the type voice, the imagery and the copy. Leave conventional structure out of them. Navigation, form patterns and controls placed where users expect them are correct, above all on Operate and Read surfaces, because prototypical structure helps people use and like a page [P3].

| Test | Question | How to perform it | What to record |
|---|---|---|---|
| Swap | Could an unrelated product use this unchanged? | Name two products from unrelated categories. Put their name, content and job into the design in your head. List which identity-carrying elements would have to change and which would survive. Then hide this product's name: could a reader still tell what it is for? [DSL-005; DSL-075] | the two products; elements that survive; elements bound to this product; pass or fail |
| Category-guess | Could the look be guessed from the category alone, or from the category plus avoidance? | Before comparing, write down what a typical product in this category looks like (the default) and that default inverted to look different (the predictable opposite). Compare each identity-carrying choice with both. A choice that either prediction would produce fails for that element [IMP-006; IMP-012] | the predicted default; the predicted opposite; matching elements; pass or fail |
| Similar-prompt | Would a similar brief land here? | Write a one-line brief for a similar product: same category and mode, a different audience or place. Predict the main choices a model would make for it. Where this design is what that brief would also produce, its choices were not driven by this brief [CRAFT-004] | the similar brief; the predicted choices; the overlap; pass or fail |

Predictions to test against, shown as a counter-example (not looks to use): for a veterinary clinic's booking page, a critic might predict a white ground, one soft clinical accent, rounded cards and stock photographs of pets as the default, and a dark high-contrast look chosen only to seem different as the opposite. Identity-carrying elements that match either fail the category-guess test.

### 3.3 The specificity and appeal verdicts

**Specificity.** Write `specific` when the identity-carrying elements belong to this product: they would have to change in the swap test, and neither the category default, its opposite nor a similar brief predicts them. Write `partly_specific` when the first viewport or the signature belongs to the product but other identity-carrying elements are predictable, and `generic` otherwise. Only `specific` counts toward DES-02. Cite the elements and all three test records, because DES-02 counts only verdicts that cite all three.

- One predictable secondary element does not decide the verdict when the first viewport and the signature belong to the product. Name it anyway.
- Novelty is not the target. A conventional design whose content, voice and signature belong to the product can be `specific`; an unusual design that a similar brief would also produce cannot.
- When the evidence is too thin to judge (one surface, one width), say so. That counts as not specific, because the gate needs a positive judgment (P6).
- Once written, the verdict is final. If the detectors later change your mind, add a post-unseal note (§3.4) and leave the verdict as it is. The seal exists so that one judgment stays free of anchoring [CRAFT-012].

**Appeal** (DES-07; ADR-035). Specificity asks whether the design belongs to this product; appeal asks whether its audience would find it attractive and whether it looks finished. They are independent: a specific page can be bare, and an attractive page can be generic. Look at the first viewport and one scroll at each width, as a first-time visitor in the use scene would, and judge what you see, not the idea behind it: a concept you could explain does not make a flat or sparse page appealing. Write one of:

- `appealing`: finished at every captured width; something on each main screen rewards a look and suits the mode (a strong typographic moment, imagery or illustration, a drawn device, colour doing real work); you would expect the owner to be proud to publish it today.
- `plain`: clean and orderly but bare. It reads as a wireframe, a default form or an unstyled document; the identity is only the name set in body text; or one clever detail sits inside an otherwise generic page.
- `unappealing`: disorderly, cluttered, clashing or broken.

For `plain` and `unappealing`, list the signs of unfinish you saw: placeholder boxes on show, browser-default controls, flat system grey that nothing chose, sections that are only a heading and a list, no focal point, bands or columns that stop short for no reason, an empty first viewport, large flat blocks of unrelated hues, single characters or words stranded on a line, half-empty columns or empty bands at wide widths, browser-default controls, headings that differ from the body only in size. Clean is not appealing by default. Perceived visual aesthetics has a classical side (orderly, clear) and an expressive side (creative, original, fascinating) [Lavie & Tractinsky 2004], and the VisAWI measures diversity, colourfulness and craftsmanship beside simplicity [Moshagen & Thielsch 2010]. The other criteria cover order, clarity and simplicity, so this verdict covers the rest: expression, richness and finish. Decoration without a job is still a Restraint problem: appeal never asks for more ornament, only for a page that is finished and has something of its own. The verdict and your Appeal score must agree: `appealing` goes with 3 or 4, `plain` with 2, `unappealing` with 0 or 1. Like specificity, the appeal verdict is written before unsealing and is final.

### 3.4 Unsealing the detectors

1. Run `uie packet --role design-critic` again. Once your verdict is on disk, it releases the detector section. If detector files were visible before your verdict (another critic may have unsealed a shared packet), leave them closed until your verdict is written, and record that they were visible.
2. Read the detector findings, tell density and census for the surfaces in your inventory.
3. Sort everything into four lists [CRAFT-012; FRAMEWORK §8.3]:
   - **Agreements:** you noted it and a detector flagged it.
   - **Detector-only:** a detector flagged it and you had not noted it. Look at the screenshot again. If the problem is visible and costs users something, record a finding that cites the detector as corroboration; if the render contradicts the hit, move it to the false positives.
   - **Critic-only:** you noted it and no detector flagged it. Keep it: catching these is why the panel exists.
   - **False positives:** hits the render contradicts (for example contrast computed against the wrong background) or that `DESIGN.md` accepts with a reason. Record the rule ID and the reason, so that the rule's precision can be measured [CRAFT-061; METHODS §3].
4. Write post-unseal notes for anything that would have changed your specificity verdict. The lead reports them beside it.

### 3.5 Brand fit

For each "X, not Y" pair declared in `DESIGN.md` (3–5 pairs) [CRAFT-001]:

1. cite the elements that express X, across type, colour strategy, shape, density, depth, imagery and copy;
2. cite the elements that pull toward Y;
3. judge the pair `reflected`, `partly`, `absent` or `contradicted`.

Check the copy against the declared tone positions: formal↔casual, serious↔funny, respectful↔irreverent, matter-of-fact↔enthusiastic [CRAFT-057]. The overall judgment is `reflected` when no pair is absent or contradicted on a primary surface, and `not_reflected` otherwise. Name the weakest pair either way. If `DESIGN.md` declares no attributes, write `not_assessable` and note that DEC-02 is not met.

Example: a language-learning flashcard app declares "encouraging, not childish". Progress shown as the words a learner can now read, and a single celebration kept for finishing a deck, express X. A cartoon mascot on every screen and an exclamation mark on every button label pull toward Y. The pair is `partly`.

A critic's brand-fit judgment is E0 evidence, E1 once several critics agree. Whether people perceive the attributes needs a desirability test with pre-registered on-brand words (EMP-07) [CRAFT-063].

### 3.6 Design findings and strengths

Record each problem as a candidate finding in the standard record (`finding.schema.json`; FRAMEWORK §4.3):

- **One problem per record** [HCI-004], with its problem type: `single_location`, `multiple_locations`, `overall_structure` or `missing_element`.
- **Criterion.** A heuristic (most often H8, H4 or H2), a gate rule (a TYP, COL, LAY, SHP, MOT, CMP, CPY or SLP ID) or a panel criterion (DES-02 for specificity, DES-04 for brand fit). Tag the rubric criterion it bears on.
- **Impact.** Why it costs users something, in plain words; for example, that visitors cannot tell the booking action from the reminders link. A remark you cannot tie to a cost for users, or to a default nobody chose, is taste: drop it [HCI-005; DSL-060].
- **Evidence.** The screenshot file and a marked region (bounding box or crop), with route, state, width and theme. Critique tied to marked regions is more accurate than free-floating critique [CRAFT-064].
- **No severity number.** Add factor notes if useful (where it recurs, who meets it). Blind raters assign severity later (USE-04).
- **Recommendation.** Separate and advisory: the fixer may solve the problem another way [LOOP-021]. Redesign ideas come after the evaluation, never in place of it (FRAMEWORK §8.1 rule 6).
- **Wording.** One critic's judgment is E0, so it "may" or "is likely to" harm; never write "users struggle" (FRAMEWORK §4.4).

Then list at least two strengths that fixes must preserve, and one *keep* line naming what must not be diluted [LOOP-031].

### 3.7 Pairwise comparison with the baseline

Run this only when your packet contains baseline screenshots. For new work DES-05 is `not_applicable`.

1. Label the two versions neutrally, as first and second; never as old and new.
2. **Order A.** Show the current version first. Judge which serves this product better on the six rubric criteria, or call a tie. Cite elements.
3. **Order B.** Swap positions and labels and judge again without rereading your Order A notes. When the lead can run Order B as a separate isolated task, it does, because Order B only adds information if it is judged fresh.
4. **Outcome.** `current` or `baseline` only when both orders agree; `tie` when both orders are ties; otherwise `no_preference`, recording which way each order went [HCI-034; CRAFT-062].

Never present a preference as a prediction of user behaviour or of an A/B result (FRAMEWORK §13 rule 5).

### 3.8 Lead: aggregate the panel

1. **Spawn the critics** with the same packet path and separate output paths, all at once. Record each critic's provider and model (EVD-07). Diversity comes from model configurations and lenses, not from re-running one setup, because re-runs of one setup share its blind spots [HCI-027].
2. **Check every output** against §5. An invalid output does not count. With fewer valid outputs than the depth requires, DES-01 is not met: re-run the missing critics rather than filling the gap yourself.
3. **Count verdicts** over the valid critics; a majority is more than half.
   - DES-02 counts `specific` verdicts.
   - DES-04 counts `reflected` judgments.
   - DES-07 counts `appealing` verdicts. Report the signs of unfinish the other critics named, because they are the builder's fix list.
   - DES-05 passes unless a majority's outcome is `baseline`. `tie` and `no_preference` count as tied, because a preference that flips with order is no preference.

   Report the split and the minority's reasons. A split that persists is a question for the owner and then for users, not a vote [P9].
4. **Merge** the critics' findings with the other evaluators' candidates using `uie findings merge` (deterministic key: same locator, failure mechanism and state; text similarity only proposes merges). Send them through the verifier (`uie packet --role finding-verifier`, then `uie findings apply-verdicts`) and the blind raters (`uie packet --role severity-rater`, then `uie findings rate`).
5. **Mark agreed design findings:** raised by at least two critics, or confirmed by the verifier. A finding raised by one critic that the verifier cannot check against the render (`needs_human`) stays E0. It is reported and placed on the agree/disagree sheet, but it cannot fail DES-03. An H8 finding from a heuristic evaluator that merges with a critic's finding counts as corroborated.
6. **Compute the gate** with `uie gates`. DES-03 fails while an agreed design finding with mean severity ≥ 3 is open without a decision (as USE-06).
7. **Report the rubric** (DES-06): each critic's scores, plus the median and range per criterion, labelled *(judged)*. The median suits an ordinal scale. Scores never feed a pass or fail.
8. **Write the debrief** (FRAMEWORK §8.3): agreements, detector-only and critic-only findings, false positives, strengths to keep, divergent items (rating spread ≥ 2, or a not-a-problem vote against a mean ≥ 2.5; split verdicts) for study, and only then fix ideas.
9. **In later rounds** spawn fresh critics and never give them the previous panel's report. In iteration 2 or later, the verifier flags a new single-critic finding, and if its mean severity after rating is below 2.5 it needs a second independent pass or human confirmation before it is reported [HCI-029].
10. **At L3** the owner confirms or overrules the G6 verdict on the agree/disagree sheet written by `uie report`.

### 3.9 The rubric and its anchors

Score seven criteria from 0 to 4 after unsealing. Every score cites its evidence (elements, screens, test records) and carries the label *(judged)*. Scores are context: they never decide a gate (DES-06) and never serve as the exit of a fix loop, because judged scores drift across rounds and raters [P7]. Write `n/a` with a reason when the evidence cannot support a score; an explicit unknown beats a guess [IMP-034].

The rubric covers the criteria Anthropic used to make design gradable: design quality (Coherence, Hierarchy), originality (Specificity) and craft (Execution); functionality is covered by G1 and G5 [IMP-035]. Appeal adds the expressive side of aesthetics and finish, which the other six do not measure (ADR-035). The anchors are UI-Evaluator proposals, not yet calibrated against human ratings [calibrating]. They describe evidence, never a look.

**Specificity.** Evidence: the three test records (§3.2).
- 4: Every identity-carrying element traces to the product, its audience's world or a recorded decision; all three tests pass; the signature could only exist here; with the name hidden, a reader can still tell what it is for.
- 3: The first viewport and the signature pass all three tests; one or two secondary elements are portable or predictable, and named.
- 2: Some choices trace to the brief, such as the colour strategy or the type voice, but the first viewport or the signature is portable, or predicted by the category or its opposite.
- 1: Product content (name, real copy, screenshots) sits on a frame that fails the swap test.
- 0: Interchangeable: all three tests fail, and the identity-carrying elements are a category default or a house look nobody asked for.

**Hierarchy.** Evidence: your first-three-fixations notes per surface, a blurred view of each screenshot, and each surface's job [CRAFT-046].
- 4: At every width and captured state you can name the primary, secondary and tertiary elements within about two seconds; the order survives the blur; the first three fixations match the job; one primary action per view.
- 3: As 4 at the main widths, with one named lapse: a width, a state or one competing element.
- 2: Clear on the main wide view, but the primary competes or collapses at narrow widths or in empty, error or loading states.
- 1: A primary exists, but two or more equal-weight elements compete with it; the job's main action is not among the first three fixations.
- 0: No discernible order; the blurred view is a uniform field; you cannot name the primary.

**Coherence.** Evidence: comparison across routes, states and themes; the token system as visible in the render; one radius, elevation and icon system [CRAFT-030].
- 4: Every route, state and theme reads as one product; type, colour, shape, depth, imagery and voice share one character; the decisions in `DESIGN.md` are visible in the render.
- 3: One system throughout, with a minor named lapse.
- 2: Mostly consistent, but one area drifts: a route, a component family, or a dark theme that was inverted rather than composed.
- 1: A system exists but breaks in several visible places: mixed icon families, several shadow styles, competing type voices.
- 0: The screens look like different products.

**Restraint.** Evidence: the bold moves on each screen; each decorative element and its job; hero moments against the mode budget (QUALITY-BAR §5); tell density after unsealing [P4].
- 4: One signature move per screen with everything else in its service; you can state the job of every decorative element; removing any element would lose something.
- 3: As 4, with one removable accessory, named [IMP-056].
- 2: A signature exists, but one or two other loud moves dilute it, or several decorative elements have no job.
- 1: Several moves compete on each screen; decoration mostly lacks a job; or the surface shows expression its mode does not allow, such as choreography on an Operate screen.
- 0: Everything competes; tell density is high (4 or more per page).
- Restraint is not emptiness. With no focal point and no signature at all, score 2 at most and record the missing direction under Specificity [DSL-080].

**Brand fit.** Evidence: the pair-by-pair judgments of §3.5.
- 4: Every pair is reflected through several levers on all primary surfaces; nothing pulls toward any Y.
- 3: Every pair is reflected; one is weak or drifts toward its Y in one named area.
- 2: About half the pairs are reflected and the rest are absent; none is contradicted.
- 1: Most pairs are absent, or reflected only in the copy while the visuals say otherwise.
- 0: The design expresses the Y side of most pairs.

**Execution.** Evidence: what measurement cannot settle: optical alignment, spacing rhythm, type detailing (wraps, widows, aligned figures), state polish, image quality and cropping, composition at each width, the dark theme. Measured failures belong to G3; do not score them twice.
- 4: Polished at every width, state and theme; details such as balanced headline wraps, aligned figures, themed selection and focus, and concentric corners are handled; a careful reviewer would change nothing.
- 3: Polished at the main widths and states, with a few named details.
- 2: Clean at the main widths, rough at the edges: narrow widths, long content, empty or error states, the dark theme.
- 1: Works but rough throughout: misalignments, awkward wraps, browser defaults left unthemed, unpolished states.
- 0: Visible breakage: overlap, clipping, broken images, collapsed layouts.

**Appeal.** Evidence: the first viewport and one scroll at each width, seen as a first-time visitor in the use scene; the signs of unfinish (§3.3); what there is to look at on each main screen and whether it suits the mode; whether colour, type and imagery do expressive work. Order, clarity and consistency are scored under Hierarchy and Coherence; Appeal scores the expressive side and finish [Lavie & Tractinsky 2004; Moshagen & Thielsch 2010].
- 4: Finished and inviting at every width. Something on each main screen rewards a look, such as a typographic moment, imagery, a drawn device or colour with a role, and it comes from the product. You would expect the audience to call it beautiful or warm, and the owner to publish it today.
- 3: Finished and attractive at the main widths; one area is merely adequate, named.
- 2: Clean but plain: the identity is only the name; the signature is one detail inside an otherwise default page; or one sign of unfinish is on show, such as a placeholder or browser-default controls.
- 1: Reads as a wireframe or an unstyled document, or shows several signs of unfinish; or it is busy and incoherent enough to put people off.
- 0: Broken or repellent: clashing, garish, or visibly unfinished throughout.
- Appeal never rewards ornament for its own sake: an element without a job still costs Restraint. A page with very little ornament can score 4 when its type, colour and content do the work, as the poetry archive below shows.

### 3.10 Exemplars across contrasting aesthetics

These exemplars show how evidence maps to anchors across very different looks. None is a look to reproduce: each scores well only because its choices come from its own product, and the same choices on another product would fail the swap test [CRAFT-064]. Scores run Specificity · Hierarchy · Coherence · Restraint · Brand fit · Execution · Appeal; they illustrate the anchors and are not targets.

| Exemplar | What a critic sees | Where the choices come from | Scores |
|---|---|---|---|
| Logistics dashboard (Operate) | Restrained colour; dense tables; one workhorse text family with tabular figures; a conventional sidebar; one alert hue kept for late departures; motion only on state changes | the depot's bay numbering and shift times; the signature is a departures timeline laid out like the depot's loading board | 3 · 4 · 4 · 4 · 4 · 3 · 3: specific through content and signature, not novelty |
| Municipal recycling service (Persuade) | A full palette whose roles are the colour coding residents already use for their bins; very large figures for the next collection date; photographs of the actual local drop-off points; one authored moment when the calendar switches to the visitor's street | the city's own sorting system and streets | 4 · 4 · 3 · 4 · 4 · 3 · 4 |
| Poetry archive (Read) | Almost no colour; generous measure and leading; one marker for the reading position; no imagery | type proportions taken from the archive's founding anthology, recorded in the direction contract; the signature is an index of first lines | 4 · 4 · 4 · 4 · 3 · 4 · 4: little ornament, but the type and the index do the expressive work |
| Language-learning flashcards (Operate) | Soft shapes; Committed colour with one saturated hue per deck; springy motion only on the rare finished-deck moment, with a playful brand declared in `DESIGN.md` | the learner's own decks and progress | 3 · 3 · 3 · 3 · 2 · 3 · 3: the mascot pulls toward "childish" |

Counter-examples, marked as such, show what low scores look like:

| Counter-example | What a critic sees | Scores |
|---|---|---|
| Veterinary booking page | A badge, an oversized centred headline that would fit any clinic, two calls to action with a gradient primary, a glowing orb; nothing in the brief asked for any of it (SLP-22, SLP-08, SLP-15) | 0 · 2 · 3 · 1 · 1 · 3 · 2: a well-executed template is still a template, and Execution does not rescue Specificity |
| Bicycle-parts inventory | Built like a Persuade page: drenched colour, a display face in the table headers, an entrance animation on every panel | 2 · 1 · 2 · 1 · 2 · 2 · 2: distinctive, but in the wrong mode (MOT-07) |
| Community booking page with nothing of its own | A near-white ground, one system sans, native controls in a single column, labelled placeholder boxes in the first viewport, and one clever device (the class's practice grid) inside an otherwise default form | 2 · 4 · 4 · 4 · 3 · 3 · 1: every classical criterion holds and the page is still `plain`. Removing the familiar left nothing in its place (ADR-035) |
| One look, two verdicts | A cream ground, a high-contrast serif and a terracotta accent (SLP-21) | Specificity 1 where nothing asked for it; 3 or 4 where it is the owner's existing brand, or where the product's own world supplies it (rice paper and a cinnabar seal for a calligraphy class, set with the class's own name and characters) and `DESIGN.md` accepts it with that reason. The look did not change; the decision did [P2; CRAFT-005] |

## 4. Output format

Each critic writes `runs/<id>/panel/critic-<n>.json`, valid against `panel.schema.json` and checked with `uie findings validate <file>`:

| Part | Content |
|---|---|
| Provenance | role, provider and model, packet hash, isolation; the `DEGRADED` banner when it applies |
| Inventory | per surface, as in §3.1 step 3 |
| Specificity | the three test records, the verdict and the elements cited |
| Appeal | the verdict, the signs of unfinish, and the elements cited |
| Detector comparison | the four lists and any post-unseal notes |
| Brand fit | per pair: X evidence, Y evidence, judgment; the overall judgment and the weakest pair |
| Rubric | seven scores, each with the anchor chosen, its evidence and the *(judged)* label |
| Findings | candidate records in the `finding.schema.json` shape, without severity |
| Strengths | at least two, and the keep line |
| Pairwise | the judgment per order with reasons, and the outcome |
| Not assessable | what the stills or the packet could not show |

The lead's aggregation lands in `merged.json`, `verifier.json`, `ratings/` and `gates.json`, and in the report.

## 5. Quality checks

A critic output is invalid, and counts toward no majority, when:

- the packet log shows the detector section released before the specificity and appeal verdicts existed, or the critic read builder material or another critic's output (DES-01);
- the appeal verdict is missing, cites no elements, or is `plain` or `unappealing` without the signs of unfinish (DES-07);
- a specificity test names no elements, or the verdict does not cite all three tests (DES-02);
- a brand-fit pair cites no elements (DES-04);
- a rubric score has no evidence or lacks the *(judged)* label (DES-06);
- the pairwise result covers one order only (DES-05 is then `not_run`);
- it ran in a single context without the `DEGRADED` banner (EVD-07).

A single finding, not the whole output, is rejected when it has no anchor (EVD-05), no criterion, more than one problem, a severity number, a claim about behaviour made from stills, or a rationale that is preference only.

## 6. Pitfalls

| Pitfall | Evidence | Countermeasure |
|---|---|---|
| Anchoring on detectors | deterministic output still anchors a judge who reads it first, which is why the critique protocol adapted here completes the design assessment before detector output enters [IMP-036; CRAFT-012] | the seal; the verdict is never edited after unsealing |
| Taste reported as a defect | the framework rejects preference-only remarks; mature review practice drops bold choices that work as intended and choices the design system records [HCI-005; DSL-060] | every finding states a cost to users or names an unchosen default |
| Trusting one aesthetic judgment | GPT-4 heuristic feedback reached 0.603 precision against 0.829 for human evaluators, and the aesthetic and minimalist design guideline was its least accurate (Duan et al. 2024) [LOOP-030] | single-critic aesthetic findings stay E0 until agreed or verified |
| Position bias | LLM judges can prefer an option for its position rather than its content [HCI-034] | both orders, neutral labels; only consistent preferences count |
| Self-preference and leniency | in Anthropic's harness study agents praised their own work, and a separate evaluator stayed lenient toward LLM-made output until it was tuned to be skeptical [IMP-032; IMP-033] | no builder transcript; mixed model configurations at rigorous depth; a preference is never reported as a predicted user outcome |
| Degradation over rounds | once the obvious problems were fixed, accurate LLM suggestions fell from 52% to 39% and inaccurate ones rose from 20% to 35% (Duan et al. 2024) | fresh critics each round; the HCI-029 confirmation rule (§3.8) |
| Rubric wording that steers toward a look | in the same harness study, a criterion praising museum-grade work pushed designs toward one look [IMP-035] | anchors describe evidence; exemplars span several looks [CRAFT-064] |
| Punishing convention, rewarding emptiness | prototypical, low-complexity pages win first impressions (Tuch et al. 2012) and people prefer the most advanced design that is still acceptable (Hekkert et al. 2003); removing tells can leave a sterile page [P3; DSL-080]. In the 2026-10-01 build benchmark, two clean, tell-free builds lost all 6 order-consistent blind comparisons (beauty, distinctiveness, overall) to builds made without the skill (ADR-035) | tests exclude conventional structure; Restraint caps a page without a signature at 2; the appeal verdict (DES-07) fails a clean but bare page |
| A rubric that only sees classical aesthetics | perceived visual aesthetics has two dimensions, classical (orderly, clear) and expressive (creative, original, fascinating) [Lavie & Tractinsky 2004]; the VisAWI's facets are simplicity, diversity, colourfulness and craftsmanship [Moshagen & Thielsch 2010]. A rubric of order, clarity, consistency and restraint scores a bare page well | the Appeal criterion and verdict (ADR-035) |
| Scores treated as targets | holistic quality ratings show near-zero inter-rater reliability, and designers judging UI pairs reached Krippendorff's α = 0.37 in UIClip's data [P7] | scores are labelled *(judged)* and never gate |
| Automated aesthetic scores read as specificity | UIClip separates intact from broken designs and AIM metrics describe complexity; neither tells competent-but-generic from specific [CRAFT-059; CRAFT-060] | use them, if at all, to rank variants of one screen |

## 7. Sources

Research adopt items: CRAFT-001, CRAFT-004, CRAFT-005, CRAFT-012, CRAFT-030, CRAFT-046, CRAFT-057, CRAFT-059…064; IMP-006, IMP-012, IMP-031…036, IMP-056; DSL-005, DSL-060, DSL-075, DSL-080, DSL X19, DSL X20; LOOP-017, LOOP-021, LOOP-030, LOOP-031; HCI-004, HCI-005, HCI-027, HCI-029, HCI-034; 07 §4.3.

- impeccable, `skill/reference/critique.md` and `skill/agents/impeccable-finish-reviewer.md`, commit 4adabaf, 2026 (Apache-2.0; ideas re-expressed). https://github.com/pbakaus/impeccable
- Anthropic, *Harness design for long-running application development*, 2026 (ideas only). https://www.anthropic.com/engineering/harness-design-long-running-apps
- Anthropic, *Demystifying evals for AI agents*, 2026 (ideas only). https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Dammyjay93/interface-design, swap, squint, signature and token tests; review false-positive filter, 2026 (MIT). https://github.com/Dammyjay93/interface-design
- Duan, Warner, Li & Hartmann, *Generating Automatic Feedback on UI Mockups with LLMs*, CHI 2024. https://doi.org/10.1145/3613904.3642782
- Duan et al., *UICrit*, UIST 2024. https://arxiv.org/abs/2407.08850
- Wu et al., *UIClip*, UIST 2024. https://arxiv.org/abs/2404.12500
- *UI-Bench*, 2025. https://arxiv.org/abs/2508.20410
- Tuch et al., visual complexity and prototypicality in website first impressions, IJHCS 70(11), 2012.
- Hekkert, Snelders & van Wieringen, typicality and novelty in aesthetic preference, British Journal of Psychology 94, 2003. https://doi.org/10.1348/000712603762842147
- Lavie & Tractinsky, *Assessing dimensions of perceived visual aesthetics of web sites*, IJHCS 60(3), 2004. https://doi.org/10.1016/j.ijhcs.2003.09.002
- Moshagen & Thielsch, *Facets of visual aesthetics*, IJHCS 68(10), 2010. https://doi.org/10.1016/j.ijhcs.2010.05.006
- Benedek & Miner, Microsoft Desirability Toolkit, 2002; NN/g summary. https://www.nngroup.com/articles/microsoft-desirability-toolkit/
- Moran, *The Four Dimensions of Tone of Voice*, NN/g, 2016. https://www.nngroup.com/articles/tone-of-voice-dimensions/
