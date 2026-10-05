# 06 — HCI Evaluation Methodology, Metrics, Experimentation, and LLM-Evaluator Reliability

- **Date:** 2026-10-01
- **ID prefix for adopted rules:** `HCI-`
- **Status:** COMPLETE (research pass finished 2026-10-01). Sections 2.A–2.G hold the notes; §3 the synthesis; §4 the adopt list (HCI-001 … HCI-078); §5 open questions.

## 1. Scope and method

**Scope.** This note is the evidence base for UI-Evaluator's *evaluation* behaviour: how to inspect a UI, how to ingest and analyse user evidence, how to measure, how to run experiments, and how far an LLM/VLM evaluator can be trusted. It covers six areas:
- **(a)** Inspection frameworks: Nielsen's heuristics and severity ratings, HE procedure, evaluator-count curves, the evaluator effect, Shneiderman, Norman, Tognazzini, Gerhardt-Powals, ISO 9241-110/-11/-210, Gestalt, "Laws of UX" with evidence grades, and KLM-GOMS.
- **(b)** Cognitive walkthrough (Wharton, Spencer), pluralistic walkthrough, and pitfalls.
- **(c)** Empirical methods: test planning, tasks, moderation, think-aloud theory, RITE, remote unmoderated testing, sample sizes, SUS/SEQ/UMUX-Lite/NASA-TLX/NPS, thematic analysis, affinity diagramming, and PURE.
- **(d)** HEART/GSM, A/B-test rigor, causal inference, and mixing quantitative and qualitative evidence.
- **(e)** Guidelines for AI features (Microsoft HAX, Google PAIR).
- **(f)** Reliability of LLM/VLM evaluators for UI/UX, 2024–2026.

**Out of scope** (covered by other notes): visual-design taste, WCAG and accessibility conformance in detail, and platform design systems.

**Method.**
- **Retrieval.** Pages were fetched as raw HTML or PDF (Python requests/BeautifulSoup, `curl` + `pdftotext`). WebSearch/WebFetch was used for discovery and for a few pages that blocked scripts.
- **Reading.** Every source listed below was read at the level stated: full text, the full article, or abstract/preview only.
- **Primaries unreachable.** Some primary sources sat behind paywalls or bot walls (ACM DL, Springer, ISO OBP, ANSI). For those I used official previews or reputable secondary summaries and marked the claims **[secondary]**, **[unverified]** or **[partially verified]**.
- **Derived numbers.** Values I computed myself are marked **(derived)**.
- **Copyright.** All content is paraphrased, with quotations kept under 15 words.

**Sources actually read (full text unless noted):**
- *NN/g articles:*
  - 10 Usability Heuristics; Severity Ratings; How to Conduct a Heuristic Evaluation (2023); The Theory Behind Heuristic Evaluations; Characteristics of Usability Problems Found by HE
  - Why You Only Need to Test with 5 Users; How Many Test Users; Quantitative Studies: How Many Users; How Many Participants for Quantitative Usability Studies (2021)
  - Two UX Gulfs; Proximity, Similarity and Common Region; Aesthetic-Usability Effect; Short-Term Memory and Web Usability; Response Times; Progress Indicators
  - Cognitive Walkthroughs; CW Workshop; Usability Testing 101; Task Scenarios; Thinking Aloud; Talking with Participants; Remote Usability Tests
  - Affinity Diagramming; PURE; NPS; When to Use Which UX Research Methods; Synthetic Users
- *Original papers and author preprints (full text):*
  - Hertzum & Jacobsen 2003 (IJHCI); Hertzum, Molich & Jacobsen 2014 (BIT); Spencer 2000 (CHI); Lewis & Rieman, *TCUID* ch. 4; Medlock et al. 2002 (RITE)
  - Krahmer & Ummelen 2004; Braun & Clarke 2006; Kieras 2001 (KLM); the NASA-TLX paper-and-pencil package
  - Rodden, Hutchinson & Fu 2010 (HEART); Kohavi et al. 2009 (DMKD); Kohavi et al. 2014 (KDD rules of thumb); Fabijan et al. 2019 (SRM); Johari, Pekelis & Walsh (always-valid inference)
  - Amershi et al. 2019 (HAX); the PAIR Guidebook all-chapters PDF; Chernev et al. 2015; Herr et al. 2016
- *LLM-evaluator papers (all nine assigned, full text):*
  - Duan et al. CHI'24; Guerino et al. INTERACT'25; Ebrahimi Pourasad & Maalej ICSE'25 (UX-LLM); Zhong et al. 2025 (synthetic HE)
  - Campos et al. SBQS'25; Zhong et al. CHI'26 (synthetic CW); Touir et al. CEUR Vol-4249 paper 4 (SUTM); Wang et al. 2026 (UXBench); Jeon et al. ACL'26 (WiserUI-Bench)
  - Plus PerceptUI (2026, preprint)
- *Abstract or preview level only:*
  - UICrit (UIST'24); Zheng et al. 2023 (MT-Bench); Verga et al. 2024 (PoLL); Prometheus; G-Eval
  - van den Haak et al. 2003; Alhadreti & Mayhew 2018; Hvannberg et al. 2007; Ghibellini & Meier 2025 (Zeigarnik meta-analysis); Alaybek et al. 2022 (search summary)
  - the ISO/FDIS 9241-210:2019 official preview (clauses 1–4, table of contents, Table 1); the Kohavi, Tang & Xu book chapter list
- *Other primary web pages:*
  - Shneiderman's Eight Golden Rules page (UMD); Tognazzini's First Principles (asktog); Norman's "Signifiers, not affordances" (jnd.org)
  - Molich's ISO 9241-110:2020 summary (dialogdesign.dk); UXPA Usability BoK (HE, CW, pluralistic walkthrough); HFI newsletters (heuristic sets; sample sizes); lawsofux.com (all 30 laws)
  - MeasuringU (SUS, interpreting SUS, SEQ, UMUX-Lite, task completion, average task times, HE vs CW)

## 2. Source-by-source / topic-by-topic notes

_(Sections 2.A–2.G below; sections 3–5 follow at the end of the file.)_

### 2.A Inspection frameworks: heuristic sets, principles, standards, "laws"

#### 2.A.1 Nielsen's 10 usability heuristics — current NN/g wording

Source read: NN/g, "10 Usability Heuristics for User Interface Design" (orig. 24 Apr 1994; names/descriptions refreshed by Kate Moran & Feifei Liu in 2020; "last reviewed" 30 Jan 2024) — https://www.nngroup.com/articles/ten-usability-heuristics/

- The heuristics themselves are unchanged since 1994. Nielsen's note on the page says they were first developed with Rolf Molich in 1990 and refined in 1994 through a factor analysis of 249 usability problems; the 2020 refresh only added explanations and examples and lightly reworded the definitions.
- Current names, with my paraphrase of each definition and the tips NN/g gives that can be checked:

| # | Current name | Paraphrase of definition | Testable cues from NN/g tips |
|---|---|---|---|
| H1 | Visibility of system status | Keep users informed about what is going on, with appropriate feedback, within a reasonable time | No consequential action happens without informing the user; feedback appears as soon as possible (ideally immediately) |
| H2 | Match between the system and the real world | Use the user's words, phrases and concepts, not internal jargon. Follow real-world conventions and natural ordering | Terms are understandable without a lookup. Controls use natural mapping |
| H3 | User control and freedom | Users act by mistake, so give a clearly marked "emergency exit" that does not need a long process | Undo/redo exist; a clearly labelled, discoverable Cancel/exit |
| H4 | Consistency and standards | Different words, situations or actions should never leave users wondering whether they mean the same thing. Follow platform and industry conventions | Internal consistency (within the product or product family) and external consistency (industry conventions) |
| H5 | Error prevention | Remove error-prone conditions, or check for them and ask for confirmation before commit | Prevent high-cost errors first; prevent slips with constraints and good defaults; prevent mistakes by removing memory burdens, supporting undo, and warning |
| H6 | Recognition rather than recall | Make elements, actions and options visible. Users should not have to carry information from one part of the UI to another | Field labels and menu items stay visible or easy to retrieve; help is offered in context |
| H7 | Flexibility and efficiency of use | Shortcuts hidden from novices speed up experts. Let users tailor frequent actions | Accelerators (keyboard shortcuts, gestures); personalization; customization |
| H8 | Aesthetic and minimalist design | No irrelevant or rarely needed information, because every extra unit competes with the relevant ones | Not a mandate for "flat design"; keep the visual design focused on the primary goals |
| H9 | Help users recognize, diagnose, and recover from errors | Plain-language error messages with no codes, a precise statement of the problem, and a constructive fix | Use conventional error visuals (e.g., bold red text); avoid jargon; offer a solution or shortcut |
| H10 | Help and documentation | Ideally none is needed, but any help should be searchable, focused on the task, concise, and list concrete steps | Present help in context, at the moment it is needed |

Evidence quality: the set was derived empirically (factor analysis), but it is a coarse diagnostic vocabulary. On their own the heuristics do not reliably find problems (see the evaluator effect in 2.A.5). They should be read as categories for classifying problems, not as pass/fail tests.

#### 2.A.2 NN/g severity ratings (0–4)

Source read: Nielsen, "Severity Ratings for Usability Problems" (1 Nov 1994) — https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/

- Severity combines three factors:
  - **frequency**: is the problem common or rare?
  - **impact**: is it easy or hard to overcome?
  - **persistence**: is it a one-time hurdle, or does it keep bothering users?
- **Market impact** is assessed on top of these three. The factors are usually folded into a single rating for prioritization.
- The scale:
  - 0 = I don't agree this is a usability problem at all
  - 1 = cosmetic; fix only if time is available
  - 2 = minor; low priority
  - 3 = major; high priority
  - 4 = usability catastrophe; must fix before release
- Procedure rules:
  1. Collect severity ratings **after** the evaluation sessions, not during them. During the session evaluators are focused on finding problems.
  2. Send each evaluator the **complete aggregated problem list**. Problems need enough description, and screenshots, that evaluators who did not find a problem can still judge it. Rating takes about 30 minutes.
  3. Each evaluator rates **independently**.
  4. A single evaluator's ratings are "too unreliable to be trusted". The **mean of 3 evaluators** is satisfactory for many practical purposes.
- Use for release decisions: if several catastrophes remain, release is probably unadvisable. Releasing with only cosmetic problems may be acceptable.

#### 2.A.3 How to run a heuristic evaluation (HE)

Sources read: NN/g, "How to Conduct a Heuristic Evaluation" (25 Jun 2023), https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/ ; Nielsen, "The Theory Behind Heuristic Evaluations" (1994), https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/ ; Nielsen, "Characteristics of Usability Problems Found by Heuristic Evaluation" (1995), https://www.nngroup.com/articles/usability-problems-found-by-heuristic-evaluation/ ; UXPA Usability Body of Knowledge, "Heuristic Evaluation", https://www.usabilitybok.org/heuristic-evaluation/

Operational procedure (synthesized from the sources above):
1. **Prepare.**
   - Choose the heuristic set: Nielsen's 10, plus domain-specific heuristics where needed.
   - Train the evaluators and do a practice round as a group.
   - Choose a documentation format with **one observation per line, tagged with its heuristic**.
   - Set a narrow scope: one task, one section, one user group, or one device.
   - Domain-specific systems need extra support. Either give evaluators a **typical usage scenario** built from task analysis, or provide an observer who answers domain questions. Evaluators should get hints only once they are clearly stuck and have already commented on the problem.
2. **Evaluate independently.**
   - Ideally **3–5 evaluators** work separately. They must not see each other's findings until all are done, because independence is the whole point.
   - Timebox each session to **1–2 hours**. Split larger interfaces into several sessions.
   - Make **at least two passes**. The first pass is to learn the flow and scope; the second inspects specific elements while knowing how they fit into the whole.
   - Write **each problem separately**, even when several problems sit in one element, and justify each one by citing a heuristic or another usability result. "I don't like it" is not a finding.
   - NN/g gives two reasons for separate listings: a redesign may otherwise repeat a problem that went unrecorded, and some problems in an element can be fixed even when the element cannot be replaced.
3. **Consolidate.**
   - Merge the findings, for example with an affinity diagram.
   - Discuss where evaluators agree and disagree, which issues hurt the experience or the business most, which need more data or a usability test, and what the short-term and long-term fixes are.
4. **Rate severity** independently afterwards (see 2.A.2).
5. **Debrief** with the evaluators, the observer and the design team.
   - Use brainstorming to generate redesigns, because HE does not produce fixes systematically.
   - Use the debrief to record the design's positive aspects, which HE otherwise misses.

Caveats stated by the sources:
- **A heuristic violation is not automatically a defect.** NN/g's example is a mobile hamburger menu: it violates H6 (recognition rather than recall), but the trade-off is often justified by screen space.
- Before deliberately violating a heuristic, run user research to justify it. NN/g quotes Nielsen: "you should not bet that your design is one of the few exceptions."
- HE **cannot replace user research.** HE and user testing find fairly distinct sets of problems, so alternate them. Use HE first to clean up the obvious problems so test users are not "wasted" on them, then user-test the redesign.
- Domain-specific problems may be essentially unfindable without users.
- **Paper-prototype blind spot.** On paper prototypes, "something missing" problems are much harder to find than other problems, so look harder for missing elements.
- Problem lists from HE are **dominated by minor problems**: 59 major vs 152 minor across six case studies (Nielsen 1992, as summarized on NN/g).
- Single evaluators find **major problems more often (42%) than minor ones (32%)** (same source).
- **False alarms.** HE can report problems that do not affect real users (Jeffries 1994, as cited in the UXPA BoK).
- **Critique.** Cockton & Woolrych (2002) argued that discount methods are error-prone enough that their costs may outweigh their benefits (cited in the UXPA BoK).
- **Counter-evidence.** In CUE-4 (Molich & Dumas), 17 professional teams evaluated the same hotel site. The expert reviews produced no more false alarms than the usability tests and found a similar proportion of major problems (UXPA BoK summary).

#### 2.A.4 How many evaluators: the Nielsen & Landauer (1993) curve

Sources read: NN/g theory article (above); Nielsen, "Why You Only Need to Test with 5 Users" (2000), https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/

- **Formula:** ProblemsFound(i) = N · (1 − (1 − λ)^i)
  - N = total number of problems in the interface
  - λ = proportion of all problems found by one evaluator (or one test user)
  - i = number of independent evaluators (or users)
- **Parameter values from six HE case studies:** λ ranged from 19% to 51% (mean 34%); N ranged from 16 to 50 (mean 33).
- **Single-evaluator performance:** averaged over six projects, one evaluator found only **35%** of the problems.
- **Recommendation:** about five evaluators, and at least three. Nielsen's worked cost–benefit example peaks at **4 evaluators**: $4,000 fixed cost plus $600 per evaluator, with each problem found valued at $15,000.
- **The same model for user testing:** the typical λ is **31%**, so 5 users find about 85% of problems.
- Nielsen's recommendation is **3 studies × 5 users** rather than 1 study × 15 users, because the goal is iterative improvement.
- With distinct user groups, test 3–4 users per group for two groups, and 3 per group for three or more.
- **Expertise effect** (Nielsen 1992, CHI'92; the primary PDF was not retrievable behind a bot wall, so these numbers come from secondary summaries and are [verify against primary]):
  - mean single-evaluator detection: **22%** for novices, **41%** for usability specialists, **60%** for "double experts" (usability plus domain expertise)
  - **14 novices** were needed to reach more than 75% detection, while **3–5 specialists** reached 74–87% and **2–3 double experts** reached 81–90%
  - the UXPA BoK confirms the qualitative ordering: specialists beat non-specialists, and double experts beat both

**Important caveat (from 2.A.5):** the formula assumes every problem has the same detection probability and that evaluators are independent. Both assumptions fail in practice. Hertzum & Jacobsen show that estimating N from a single evaluator's data underestimates it.

#### 2.A.5 The evaluator effect (Hertzum & Jacobsen 2001/2003; Hertzum, Molich & Jacobsen 2014)

Sources read (full text): Hertzum & Jacobsen, "The Evaluator Effect: A Chilling Fact about Usability Evaluation Methods", IJHCI 15(1), 2003 (reprint of the 2001 paper), preprint https://mortenhertzum.dk/publ/IJHCI2003.pdf ; Hertzum, Molich & Jacobsen, "What You Get Is What You See: Revisiting the Evaluator Effect in Usability Tests", BIT 33(2), 2014, preprint https://mortenhertzum.dk/publ/BIT2014.pdf

- **Definition.** The evaluator effect is the observation that evaluators using the same method on the same system detect markedly different problem sets and give different severity judgments.
- **Metric: any-two agreement** = the mean over all ½n(n−1) evaluator pairs of |P_i ∩ P_j| / |P_i ∪ P_j|, where P_i is the set of problems evaluator i found.
  - The authors prefer it to the "detection rate" because the detection rate depends on the pooled total and measures coverage, not agreement.
  - **Use this exact metric to measure LLM-run consistency (see 2.F).**
- **Findings across 11 studies of cognitive walkthrough (CW), HE and thinking-aloud (TA) studies:**
  - mean any-two agreement ranged from **5% to 65%**, and no method was consistently better than the others
  - the effect holds for novice and experienced evaluators, for cosmetic and severe problems, for simple and complex systems, and for paper and running systems
  - CW's strict procedure gives only marginally better agreement than HE
- **Severity agreement is also poor.** Average Spearman correlations between pairs of evaluators were **0.31** (CW), **0.24** (HE) and **0.23** (TA).
  - In one study, 35% of severe problems were rated severe only once.
  - In another, 56% of the problems on evaluators' top-10 lists were rated severe only once.
  - No problem was unanimously rated severe in either study.
- **One evaluator observing TA sessions:** going from 1 to 2 evaluators added **42%** more problems, 2→3 added 20%, and 3→4 added 13%. One evaluator analysing 4 users found 48 problems on average, while the 4 evaluators together found 93.
  - The authors' rough model: problems found ∝ √(evaluators × users).
  - Practical rule from the paper: trading a couple of users for an extra evaluator can pay off.
- **Root causes the paper identifies:**
  1. vague goal analysis, which lets task scenarios vary between evaluators
  2. vague evaluation procedures, which lead to anchoring
  3. vague problem criteria, under which "anything" gets accepted as a problem
- **The paper's prescriptions:**
  - be explicit about evaluation goals and task selection
  - add at least one extra evaluator for critical evaluations
  - tighten procedures and problem criteria
  - periodically peer-review evaluation practice
- **Open issue the paper raises: validity, not just agreement.** Few method studies check for false alarms, so we do not know whether evaluators should use a higher reporting threshold (to avoid false alarms) or a lower one (to avoid misses).
- **2014 follow-up** (19 experienced professionals analysing videos of the same 5 users):
  - each professional reported on average **33%** of the pooled problems for the moderated sessions and **32%** for the unmoderated sessions
  - for problems rated critical or serious by at least one professional, the shares rose to **50%** (moderated) and **40%** (unmoderated)
  - severity conflicts: **24%** (moderated) and **30%** (unmoderated) of the problems reported by more than one professional were rated critical by one and minor by another
  - the evaluator effect was similar for moderated and unmoderated sessions

Implication for UI-Evaluator:
- A single pass by a single LLM is equivalent to "one evaluator". Expect low recall and idiosyncratic severity.
- Use multiple independent passes, pool them, and measure consistency with any-two agreement.
- Pin down problem criteria and task scenarios beforehand, which addresses the three root causes.

#### 2.A.6 Shneiderman's Eight Golden Rules (6th ed., 2016)

Source read: https://www.cs.umd.edu/users/ben/goldenrules.html (Section 3.3.4 of *Designing the User Interface*, 6th ed.)

1. **Strive for consistency.** Consistent action sequences, terminology, color, layout, capitalization and fonts. Exceptions (e.g., confirming a delete, not echoing passwords) should be few and understandable.
2. **Seek universal usability.** Design for novices and experts, a range of ages, disabilities, international users, and varied technology.
3. **Offer informative feedback.** Every user action gets feedback. Make it modest for frequent minor actions and more substantial for infrequent major ones.
4. **Design dialogs to yield closure.** Action sequences have a beginning, middle and end, with feedback when a group of actions completes (e.g., a checkout confirmation page).
5. **Prevent errors.** Gray out inappropriate menu items; block alphabetic input in numeric fields. After an invalid entry, guide repair of only the faulty part. Erroneous actions should leave the state unchanged or explain how to restore it.
6. **Permit easy reversal of actions.** The unit of reversal can be one action, one data-entry task, or a group of actions.
7. **Keep users in control.** No surprises or changes to familiar behaviour.
8. **Reduce short-term memory load.** Don't make users carry information between displays (the page invokes "7 ± 2 chunks"; see the Miller caveat in 2.A.13).

Note: the wording changed between editions. Older lists (e.g., the one Wikipedia reproduces) read "enable frequent users to use shortcuts", "offer simple error handling" and "support internal locus of control". Cite the 6th-edition wording above. Evidence quality: an expert synthesis, which Shneiderman himself says requires "validation and tuning" for specific domains.

#### 2.A.7 Norman: fundamental interaction principles

Sources: Norman, *The Design of Everyday Things*, revised ed. 2013 (book; NN/g page https://www.nngroup.com/books/design-everyday-things-revised/ ; principle list verified through secondary summaries such as https://medium.com/@laythsihan/7-principles-of-design-from-the-design-of-everyday-things-48f90b25dc84 — the book itself was not read here [partially verified]). Also read: Norman, "Signifiers, not affordances", ACM *Interactions* 15(6), 2008, https://jnd.org/signifiers-not-affordances/ ; NN/g, "The Two UX Gulfs: Evaluation and Execution" (2018), https://www.nngroup.com/articles/two-ux-gulfs-evaluation-execution/

- **Seven fundamental design principles** (2013 ed.):
  1. **discoverability**: one can tell which actions are possible and what the current state is
  2. **feedback**: full, continuous information about results and the new state
  3. **conceptual model**: the design conveys a model that supports understanding and a sense of control
  4. **affordances**: the desired actions are actually possible
  5. **signifiers**: perceivable cues show where and how to act
  6. **mappings**: the control–effect relationship uses spatial layout and temporal contiguity
  7. **constraints**: physical, logical, semantic and cultural constraints guide action
- **Signifiers vs. affordances.**
  - Norman says that when he brought "affordance" into design in 1988 he meant *perceived* affordances, and the term has since been widely misused.
  - What design must actually provide is **signifiers**: perceivable cues, deliberate or incidental, that indicate what is possible.
  - Operational consequence for UI review: a clickable element with no visible signifier (e.g., flat text that is actually a link) is a discoverability defect even though it does afford clicking.
- **Gulfs of execution and evaluation** (Hutchins, Hollan & Norman 1986).
  - Evaluation means perceiving the system state *and* interpreting it. Execution means planning *and* manipulating.
  - NN/g's example is a Windows 10 Bluetooth toggle whose "Off" label was visible but misread. Visible is not the same as interpretable, so check both.
  - Diagnostic value: deciding whether a problem is one of **visibility or interpretation** points toward the fix.
- **Seven stages of action as review questions** (secondary summaries, [partially verified]):
  1. What do I want to accomplish?
  2. What are the alternative action sequences?
  3. What action can I do now?
  4. How do I do it?
  5. What happened?
  6. What does it mean?
  7. Is this okay — have I accomplished my goal?
- **Slips vs. mistakes** (NN/g H5 article): slips are unconscious errors of inattention, mistakes are conscious errors from a wrong mental model. Prevent slips with constraints and defaults; prevent mistakes with clearer models, undo and warnings.

#### 2.A.8 Tognazzini's First Principles of Interaction Design (revised & expanded)

Source read: https://asktog.com/atc/principles-of-interaction-design/

The 19 principle areas: Aesthetics; Anticipation; Autonomy (which includes status mechanisms); Color; Consistency; Defaults; Discoverability; Efficiency of the User; Explorable Interfaces; Fitts's Law; Human-Interface Objects; Latency Reduction; Learnability; Metaphors; Protect Users' Work; Readability; Simplicity; State; Visible Navigation. NN/g notes the list is "slightly too long for heuristic evaluation" but works as a checklist.

Concrete, testable sub-principles worth adopting:
- Acknowledge every button click with visual or aural feedback **within 50 ms**, and trap repeated clicks on the same control (Latency Reduction).
- Never use color as the only carrier of information; add a clear secondary cue. Do not strip color cues to follow a graphic fad (Color).
- Make status information accurate and up to date (Autonomy).
- Defaults should be easy to "blow away" (replace) and intelligent (Defaults).
- "If the user cannot find it, it does not exist." Hiding complexity increases it. Controls needed for successful use should be visible at all times, with no "elegance" exception (Discoverability).
- Text that must be read needs high contrast. Use larger characters for the data itself than for its labels. Put the key word first in menu and button labels. Test with the oldest expected users, since presbyopia affects most people over 45 (Readability).
- Users must never lose their work (Protect Users' Work).
- Always allow Undo and always allow a way out (Explorable Interfaces).
- User-test visual changes as thoroughly as behavioural ones, benchmarking against the old design: fashion should never trump usability (Aesthetics).
- Fitts's Law: screen edges and corners "pin" the pointer; even a 1-px gap at the edge can slow edge targets by 20–30% (Tog's claim; mouse-specific). Fitts's-law efficiency claims require a timed test.

Evidence quality: expert practice synthesis. Some numbers (the 50 ms acknowledgment, the 20–30% edge penalty) are stated without citations on the page [practitioner claim].

#### 2.A.9 Gerhardt-Powals' cognitive engineering principles (1996)

Sources: Gerhardt-Powals, J. (1996), "Cognitive engineering principles for enhancing human–computer performance", IJHCI 8(2), 189–211 (paywalled; list verified via https://www.humanfactors.com/newsletters/heuristic_evaluations.asp and https://en.wikipedia.org/wiki/Heuristic_evaluation)

The ten principles:
1. Automate unwanted workload: eliminate mental calculations, estimations and comparisons.
2. Reduce uncertainty: display data clearly and obviously.
3. Fuse data: combine lower-level data into higher-level summaries.
4. Present new information with meaningful aids to interpretation, using familiar frameworks.
5. Use names that are conceptually related to function.
6. Group data in consistently meaningful ways.
7. Limit data-driven tasks: reduce the time spent assimilating raw data, and use color and graphics appropriately.
8. Include only the information needed by the user at a given time.
9. Provide multiple coding of data when appropriate.
10. Practice judicious redundancy, which resolves the conflict between principles 6 and 8.

Evidence:
- HFI's newsletter argues this set is more research-based than Nielsen's.
- The one controlled comparison found **no significant differences** between Nielsen's heuristics and Gerhardt-Powals' principles in effectiveness, efficiency or inter-evaluator reliability (Hvannberg, Law & Lárusdóttir 2007, *Interacting with Computers* 19(2):225–240, abstract at https://iris.hi.is/en/publications/heuristic-evaluation-comparing-ways-of-finding-and-reporting-usab/).
- Takeaway: the choice of heuristic set matters less than procedure and evaluator.
- Gerhardt-Powals' principles add value mainly for **data-dense dashboards** (data fusion, automating comparisons).

#### 2.A.10 ISO 9241-110:2020 — interaction principles (7)

Sources: ISO 9241-110:2020 is paywalled. Read instead Rolf Molich's summary, with definitions reproduced under licence from the DS/ISO FDIS text: https://www.dialogdesign.dk/isos-dialogue-principles-2019/ ; also https://en.wikipedia.org/wiki/ISO_9241

The seven principles (definitions paraphrased):
1. **Suitability for the user's tasks**: functions and interactions are based on the task's characteristics, not on the technology.
2. **Self-descriptiveness**: the system presents appropriate information where it is needed, so that its capabilities and use are immediately obvious without unnecessary interactions.
3. **Conformity with user expectations**: behaviour is predictable from the context of use and accepted conventions.
4. **Learnability**: the system supports discovery and exploration, minimizes the need for learning, and supports learning when it is needed.
5. **Controllability**: the user controls the interaction, including its speed, its sequence and individualization.
6. **Use error robustness**: the system helps avoid errors, tolerates identifiable errors, and assists recovery.
7. **User engagement**: functions and information are presented in an inviting, motivating way that supports continued interaction.

Notes:
- **Changes from the 2006 edition:** "individualization" was folded into controllability, and *user engagement* was added.
- **Size of the standard:** 20 categories of recommendations, 65 recommendations and about 140 examples, filling 15 dense pages.
- **Gap in Nielsen's set:** Molich notes that the first principle (essentially "meeting user needs") is covered by neither Nielsen's 1990 nor his 1994 heuristics. This is a real coverage gap, and an evaluator should add a utility/task-fit check.
- **Ethics of engagement:** Molich also cautions that engagement must be pursued ethically; it would be inappropriate for something like a betting site.

#### 2.A.11 ISO 9241-11:2018 — usability definitions

Source: definitions as reproduced (with "SOURCE: ISO 9241-11:2018" tags) in the official ISO/FDIS 9241-210:2019 preview distributed by iTeh Standards, https://cdn.standards.iteh.ai/samples/68886/dbb3962de19e422aa1c9f4909a76c252/SIST-EN-ISO-9241-210-2020.pdf (the ISO OBP page itself returned HTTP 403 to automated fetch).

- **Usability** (3.1.1): the extent to which a system, product or service can be used by specified users to achieve specified goals with effectiveness, efficiency and satisfaction in a specified context of use.
- **Effectiveness** (3.1.12): accuracy and completeness with which users achieve specified goals. *Measure with task success and errors.*
- **Efficiency** (3.1.13): resources used in relation to the results achieved; typical resources are time, human effort, costs and materials. *Measure with time-on-task, steps and workload.*
- **Satisfaction** (3.1.14): the extent to which the user's physical, cognitive and emotional responses to use meet their needs and expectations. It includes UX, and anticipated use can influence satisfaction. *Measure with SUS, SEQ, UMUX-Lite and similar.*
- **Context of use** (3.1.15): users, goals and tasks, resources, and environment, where environment covers technical, physical, social, cultural and organizational factors.
- **User experience** (3.2.3): the user's perceptions and responses resulting from the use and/or anticipated use of a system, product or service, occurring before, during and after use.

Operational consequence: a usability claim is meaningless unless it states **which users, which goals and which context**. Every UI-Evaluator report should declare all three.

#### 2.A.12 ISO 9241-210:2019 — human-centred design (HCD) process

Source read: the same iTeh preview of ISO/FDIS 9241-210:2019 (table of contents, clauses 1–4, Table 1).

- **Six principles** (clauses 5.2–5.7):
  1. the design is based on an explicit understanding of users, tasks and environments
  2. users are involved throughout design and development
  3. the design is driven and refined by user-centred evaluation
  4. the process is iterative
  5. the design addresses the whole user experience
  6. the design team includes multidisciplinary skills and perspectives
- **Four activities and example outputs** (Table 1):
  1. understand and specify the context of use → user-group profiles, as-is scenarios, personas
  2. specify the user requirements → user needs description, user requirements specification
  3. produce design solutions → scenarios of use, low- and high-fidelity prototypes, UI specification
  4. evaluate the designs against requirements → usability-test report, conformance-test results, field report, long-term-monitoring results, user-survey report
- **Evaluation clause 7.5** covers user-based testing (7.5.4), inspection-based evaluation (7.5.5) and long-term monitoring (7.5.6). So the standard expects **both inspection and user-based evidence, plus post-release monitoring**.

#### 2.A.13 Gestalt grouping principles (as applied to UI)

Sources read: NN/g "Proximity Principle in Visual Design" (2020), https://www.nngroup.com/articles/gestalt-proximity/ ; "Similarity Principle in Visual Design" (2020), https://www.nngroup.com/articles/gestalt-similarity/ ; "The Principle of Common Region" (2020), https://www.nngroup.com/articles/common-region/ ; lawsofux.com pages for Prägnanz and uniform connectedness.

- **Original Gestalt principles:** proximity, similarity, closure (plus continuity and Prägnanz). Common region and uniform connectedness were added by later research.
- **Relative strength, per NN/g:**
  - proximity "can overpower" similarity of color or shape
  - common region (a border or background container) "overpowers" other groupings
  - similarity is weaker but "the most resilient", because it groups elements even when they are spread out
- **Testable rules:**
  - spacing *between* groups > spacing *within* groups
  - elements that behave the same look the same, and elements that behave differently look different (which matches Tog's "visual inconsistency for different behaviour")
  - containers are used to group, but overusing them creates clutter
  - responsive layouts must preserve these groupings at every breakpoint (NN/g's Wellington example)
- **Evidence quality:** the perceptual phenomena are robust and long established. Applying them to UI is well-grounded practice, and individual layouts can be checked by inspection.

#### 2.A.14 "Laws of UX" — what each claims and how strong the evidence is

Source read: all 30 pages of https://lawsofux.com/ (Jon Yablonski), checking each page's "Origins" section, plus the primary or meta-analytic sources cited per row. Grades: **A** = quantitative law with robust replication in HCI; **B** = robust lab phenomenon whose transfer to UI is plausible but not directly quantified; **C** = contested or mixed replication; **D** = maxim or design philosophy, not an empirical finding. Use A/B items as evidence in findings. Use C/D items only as framing, never as the sole justification for a "violation".

| Law | Core claim (paraphrase) | Origin and evidence | Grade | How UI-Evaluator should use it |
|---|---|---|---|---|
| Fitts's law | Time to acquire a target rises with distance and falls with size | Fitts 1954. Shannon form MT = a + b·log₂(D/W + 1) (MacKenzie); throughput TP = ID/MT with effective width W_e = 4.133·SD_x; used in ISO 9241-9 (https://en.wikipedia.org/wiki/Fitts%27s_law) | A | Flag small or distant targets for frequent or primary actions. Claims about efficiency need a timed test (Tog) |
| Hick–Hyman law | Decision time grows with the log of the number of equally likely choices: T = b·log₂(n+1) | Hick 1952; Hyman 1953. **Does not apply to visual search of unordered menus**, where scanning is linear; alphabetical menus that users already know can be logarithmic (Landauer & Nachbar 1985) (https://en.wikipedia.org/wiki/Hick%27s_law) | A in choice-reaction tasks, B for UI | Use as a reason to reduce *simultaneous, unfamiliar* choices, not to cap menu length |
| Miller's law (7±2) | Short-term memory holds about 7 chunks | Miller 1956. Cowan 2001 (BBS 24:87–114) revises the central capacity to **~4 chunks (3–5)**. NN/g states plainly that limiting menus to 7 items is a misconception, because menus rely on recognition (https://www.nngroup.com/articles/short-term-memory-and-web-usability/) | B (the capacity limit is real), but the usual "7-item" rule is a misapplication | Check that users never have to *remember* across screens. **Do not** flag menus for having more than 7 items |
| Doherty threshold | Productivity soars when system response is under 400 ms | Doherty & Thadani 1982. lawsofux.com calls it an *IBM Systems Journal* paper; it is often cited as an IBM report instead, so the venue is [unverified]. The productivity claims come from IBM practice, not from a controlled-experiment literature | C/D | Prefer NN/g's 0.1 s / 1 s / 10 s limits (below) |
| Jakob's law | Users spend most of their time on other sites and expect yours to work the same way | Nielsen's maxim (lawsofux); consistent with H4 "external consistency" | D (sound principle, not an experiment) | Supports flagging deviations from platform conventions |
| Tesler's law | Every system has irreducible complexity; someone (system or user) must handle it | Tesler interview in Saffer's *Designing for Interaction* | D | Framing only |
| Postel's law | Be liberal in what you accept and conservative in what you send | Robustness principle from the TCP specs (lawsofux) | D (an engineering maxim) | Supports accepting varied input formats (also ISO 9241-110 use-error tolerance) |
| Peak–end rule | Retrospective judgments are dominated by the peak and the end of an experience | Kahneman et al. 1993. **Meta-analysis** (Alaybek et al. 2022, OBHDP; 174 samples): peak–end effect r ≈ 0.58, duration effect essentially nil; but the average across the whole experience predicted overall evaluations about as well (https://www.sciencedirect.com/science/article/abs/pii/S0749597822000334; DOI 10.1016/j.obhdp.2022.104149 — abstract numbers taken from a search-engine summary because the publisher page blocked access [secondary]) | B | Weigh end-of-flow moments (confirmation, error recovery) heavily in UX review |
| Aesthetic–usability effect | Attractive designs are *perceived* as more usable, and minor issues are forgiven | Kurosu & Kashimura 1995 (252 participants, 26 ATM layouts); NN/g notes it masks problems in tests and works only for *minor* problems (https://www.nngroup.com/articles/aesthetic-usability-effect/) | B (for perceived usability) | **Evaluation rule:** weight observed behaviour over stated satisfaction; positive comments about visuals do not cancel task failures |
| Von Restorff (isolation) effect | A distinctive item is remembered better | von Restorff 1933; a robust memory phenomenon | B | Primary CTAs and critical warnings should be visually distinctive, but only one or a few per view |
| Serial-position effect | First and last list items are recalled best | Ebbinghaus; primacy and recency are robust in recall | B | Put key navigation items at the ends of a sequence |
| Zeigarnik effect | Incomplete tasks are remembered better | Zeigarnik 1927. **2025 meta-analysis: no memory advantage for unfinished tasks**, though a reliable tendency to *resume* them (Ovsiankina effect) (Ghibellini & Meier, *Humanities & Social Sciences Communications*, https://www.nature.com/articles/s41599-025-05000-w) | C (memory claim not supported) | Do not cite it. Progress indicators are justified by goal-gradient and resumption instead |
| Goal-gradient effect | Effort increases as a goal gets closer | Hull 1932; consumer field evidence from Kivetz, Urminsky & Zheng 2006 (cited on the lawsofux page) | B | Progress indicators in multi-step flows |
| Choice overload | Too many options impairs choice | Iyengar & Lepper 2000. Scheibehenne et al. 2010 meta-analysis (63 conditions, N = 5,036): mean effect **≈ 0**. Chernev et al. 2015 (99 observations, N = 7,202): significant once four moderators are modelled (choice-set complexity, task difficulty, preference uncertainty, effort-minimizing goal) (https://chernev.com/wp-content/uploads/2017/02/ChoiceOverload_JCP_2015.pdf) | C (conditional) | Flag large assortments only when the options are complex or hard to compare. Recommend comparison aids and filters |
| Gestalt laws (proximity, similarity, common region, uniform connectedness, Prägnanz) | Perceptual grouping | See 2.A.13 | B (perception robust) | Layout checks |
| Paradox of the active user | Users skip manuals and start using the product immediately | Carroll & Rosson 1987 | B | Do not rely on docs or onboarding to rescue a confusing UI |
| Cognitive load | Extraneous load harms performance | Sweller's cognitive load theory (instructional design) | B | Remove extraneous load |
| Pareto, Parkinson's, Occam's razor | Heuristic maxims | Economics, an essay, philosophy | D | Never cite as evidence |
| Selective attention, mental model, working memory, flow, chunking, cognitive bias | Psychology constructs | Established constructs, not "laws" | B as constructs | Use for explanation |

**Response-time limits (used instead of the Doherty threshold).** Source: Nielsen, "Response Times: The 3 Important Limits" (1993, updated 2014), https://www.nngroup.com/articles/response-times-3-important-limits/ , citing Miller 1968 and Card et al. 1991.

| Response time | What the user experiences | Feedback required |
|---|---|---|
| ≤ 0.1 s | Instantaneous, direct manipulation | None |
| ≤ 1 s | Flow of thought uninterrupted, though the delay is noticed | Above 1 s, signal that the system is working (e.g., change the cursor) |
| ≤ 10 s | Limit of attention | Above 10 s, show a percent-done indicator **and** a clearly signposted way to interrupt |

NN/g's progress-indicator article (https://www.nngroup.com/articles/progress-indicators/) adds:
- Show a progress indicator for any action taking longer than about 1 s.
- Use a **looped animation (spinner) only for waits of about 2–10 s**. Below 1 s it is distracting.
- Use a **percent-done indicator for waits of ≥ 10 s**, or for countable batches such as "Updating address 3 of 50".
- **Avoid static "Loading…" indicators.**
- Add text explaining why the user is waiting.

#### 2.A.15 KLM-GOMS (Keystroke-Level Model)

Sources read: Kieras, "Using the Keystroke-Level Model to Estimate Execution Times" (2001), https://web.eecs.umich.edu/~kieras/docs/GOMS/KLM.pdf. The original is Card, Moran & Newell (1980), CACM 23(7):396–410, which was not retrievable (ACM bot wall). Its roughly 21% prediction error is reported by secondary sources, e.g., https://en.wikipedia.org/wiki/Keystroke-level_model [secondary].

**Operators and standard times** (Kieras' values; the original Card, Moran & Newell M = 1.35 s):

| Op | Meaning | Time |
|---|---|---|
| K | Keystroke or button press; Shift and Ctrl count separately | 0.12 s (90 wpm expert) / 0.20 s (55 wpm) / **0.28 s (40 wpm, the recommended default)** / 1.2 s (unfamiliar with the keyboard) |
| T(n) | Type n characters | n × K |
| P | Point with the mouse | **1.1 s** average (range 0.8–1.5 s; compute with Fitts's law for unusual targets) |
| B / BB | Mouse button press or release / click | 0.1 s / 0.2 s |
| H | Home hands between keyboard and mouse | **0.4 s** |
| M | Routine mental act (locate, decide, retrieve, verify) | 0.6–1.35 s; **use 1.2 s** |
| W(t) | Wait for the system | measured |

**Method:**
1. Pick representative task scenarios.
2. Specify the design down to keystroke-level actions.
3. Choose the method users will use.
4. List the physical operators.
5. Add W where users must wait.
6. Insert M operators.
7. Sum the times.

**Where to place M operators:**
- at the start of a task
- at strategy decisions
- at each chunk retrieved from memory
- when finding something on screen; every P to an object should be preceded by an M to locate it
- when thinking of a task parameter
- when verifying before commit; new users verify after every step

**Rules for comparing designs:**
- Consistency in where Ms are placed matters more than absolute accuracy.
- The *number* of Ms matters, not their positions.
- If physical times differ by more than a few Ms, decide without resolving the M questions.
- Use the "yellow pad" heuristic for apples-to-oranges comparisons: assume the user already knows the task parameters, and model only the interface actions.
- Model both new and experienced users. If the design decision flips between them, KLM cannot settle it.

**Scope:** expert, error-free, routine execution time. KLM says nothing about learnability, errors or satisfaction. It is a cheap check for **comparing alternative flows** (e.g., "the new menu path costs 4P+4B = 4.8 s vs 3.5 s for drag-to-trash" in Kieras's worked example).

### 2.B Cognitive walkthrough (CW) and related walkthroughs

Sources read:
- Spencer, "The Streamlined Cognitive Walkthrough Method…", CHI 2000, pp. 353–359, full text: https://facweb.cdm.depaul.edu/cmiller/eval/p353-spencer.pdf
- Lewis & Rieman, *Task-Centered User Interface Design*, ch. 4 (1993/94, by two of the CW's originators), http://hcibib.org/tcuid/chap-4.html
- NN/g, "Evaluate Interface Learnability with Cognitive Walkthroughs" (2022), https://www.nngroup.com/articles/cognitive-walkthroughs/
- NN/g, "How to Conduct a Cognitive Walkthrough Workshop" (2022), https://www.nngroup.com/articles/cognitive-walkthrough-workshop/
- UXPA BoK, "Cognitive Walkthrough", https://www.usabilitybok.org/cognitive-walkthrough/
- UXPA BoK, "Pluralistic Walkthrough", https://www.usabilitybok.org/pluralistic-walkthrough/
- MeasuringU, "What's the difference between a Heuristic Evaluation and a Cognitive Walkthrough?", https://measuringu.com/he-cw/

The Wharton, Rieman, Lewis & Polson (1994) chapter in *Usability Inspection Methods* (pp. 105–140) was not available online. Its four questions are quoted verbatim in Spencer's Table 1 and in the UXPA BoK, citing p. 106.

#### 2.B.1 What a CW is for
- CW evaluates **learnability for new or infrequent users who learn by exploration**. It is grounded in Polson & Lewis's CE+ theory of exploratory learning.
- It was originally built for walk-up-and-use systems (kiosks, ATMs) and later applied to complex software.
- NN/g's guidance:
  - Use CW for **complex, new or unfamiliar workflows**.
  - It is "overkill" for UIs built from ubiquitous patterns, such as a standard e-commerce checkout.
- CW versus HE, as NN/g compares them:

| Dimension | Heuristic evaluation | Cognitive walkthrough |
|---|---|---|
| Perspective | Analyst | New user |
| Target | General usability | Learnability |
| Scope | Comprehensive | Specific tasks |
| Method | Check the interface against guidelines | Simulate the user's reactions, step by step |

#### 2.B.2 Inputs
Lewis & Rieman list four required inputs; NN/g frames them as four questions to answer before starting.
1. **A description or prototype of the interface.** It need not be complete but should be detailed; the exact menu wording matters.
2. **A task description.** Use a representative or top task, ideally core or high-risk.
3. **A complete, written list of the correct actions** for that task.
4. **Who the users are and what knowledge they bring.** NN/g says to use personas and to run one walkthrough per persona, so the analysis does not rest on "fantasy users".

Practical notes:
- **Alternative paths.** If a task has several valid paths, define a primary path first and specify alternatives in advance, so the session does not derail into debate (NN/g).
- **Step granularity.** Decide in advance what counts as one step. Small actions that are normally done together, such as filling one form section and clicking Next, can be merged (NN/g).

#### 2.B.3 Per-step questions

**Wharton et al. 1994: four questions.** Tell a credible success story or a failure story for each step.
1. Will the user try to achieve the right effect?
2. Will the user notice that the correct action is available?
3. Will the user associate the correct action with the effect they are trying to achieve?
4. If the correct action is performed, will the user see that progress is being made toward the task?

Lewis & Rieman phrase the same questions as:
1. Will users be trying to produce the effect the action has?
2. Will they see the control?
3. Will they recognize that the control produces the effect they want?
4. Will they understand the feedback well enough to go on with confidence?

**Scoring rule (NN/g):**
- A step **passes only if all four answers are "yes"**. A single "no" fails the step.
- Record *why* for every answer. NN/g's template pre-lists common reasons for success: "from experience", "the system tells them so".
- **After a failure, record it and continue as if the step had succeeded**, assuming the system reached the correct state. This keeps the later steps analysable.

**Streamlined CW (Spencer 2000): two questions.**
1. Will the user know what to do at this step? (This collapses questions 1–3.)
2. If the user does the right thing, will they know they did the right thing and are making progress toward their goal?

Spencer's procedure:
1. Define the inputs: users, tasks, action sequences, interface.
2. Convene: state the goals, say what will and will not be done, explicitly defuse defensiveness, post the ground rules, assign roles, and appeal to the group to accept the facilitator's leadership.
3. Walk through each action sequence. The facilitator first describes the action and the resulting system state.
4. Record only:
   - possible learnability problems
   - design ideas
   - design gaps
   - flaws in the task analysis
   If credible stories exist for both questions, nothing is recorded.
5. Revise the interface afterwards.

Spencer's four **ground rules**:
1. No designing.
2. No defending a design.
3. No debating cognitive theory.
4. The usability specialist leads.

When writing up a failure, record the knowledge the user would need. Spencer's example: users might not click the ellipsis because they might not know the list can be modified.

**Spencer's reported results** (one IDE case study, so weak evidence):
- Task analysis took about 25 hours.
- About 8 people walked through 32 action sequences in 1.5 hours and found 24 potential problems:
  - 14 were missing-knowledge problems
  - 10 were feedback problems
  - they also produced 11 design ideas
- Comparison with a later usability test:
  - the CW predicted 6 of the 9 problems the test found
  - of 13 CW predictions in the overlapping UI area, 7 matched the test report directly, 4 indirectly, and 2 were unrelated (likely false positives)
- **Trade-off:** collapsing questions 1–3 trades granularity for coverage. Many streamlined findings name the problem but not its cause, while the four-question version points to the cause, e.g., the word "Print" implies an action, not a dialog.

**Original long-form CW** (Lewis et al. 1990; Polson et al. 1992). MeasuringU lists 8 questions per action, from "first/next atomic action" to "describe appropriate modified goal". Later versions were simplified because practitioners found it too laborious.

#### 2.B.4 Common pitfalls and their remedies

1. **Discovering the action sequence during the walkthrough** (Lewis & Rieman, "common mistake #1").
   - Evaluators who do not know the correct path stumble through the UI and then evaluate their own stumbling.
   - Remedy: the walkthrough **starts only once the correct action list is in hand**. Exploring to find the actions is a separate step that comes earlier.
2. **Treating CW as a user test** (common mistake #2). CW does not test real users. It applies design expertise to imagined classes of users.
3. **Design discussions and defensiveness** derail sessions (Spencer; NN/g ground rules).
   - Remedy: note design ideas and gaps as bullets and move on.
   - Spencer adds that redesigning inline fixes problems in task order rather than by severity, and risks running out of time ("profile before you optimize").
4. **Tedium and slips.** Repeating 4 questions over 100+ actions led evaluators to accidentally skip actions (Hertzum & Jacobsen 2003). CW is still subject to the evaluator effect (2.A.5).
5. **Task-description detail changes what is found.** Detailed step-by-step task descriptions surfaced *more feedback problems* but *fewer "can't find the control" problems* (Sears & Hess, CHI'98, abstract via UXPA BoK and search summary).
   - Remedy: do not reveal UI-specific wording in the task prompt. This also applies to LLM simulators.
6. **Task selection is weakly specified by the method** (Jeffries et al. 1991, per UXPA BoK). Recommended practice:
   - start with simple tasks
   - plan **1–4 tasks per session**; NN/g says about 2 full tasks fit in 90 minutes
   - choose realistic tasks that use core features and the transitions between them
7. **Superficial focus.** Analyses gravitate to labels and wording rather than task structure or error recovery. CW also gives no frequency or severity estimate (UXPA BoK).
8. **Social and political setting.** Hold walkthroughs among peers. Senior managers in the room turn the evaluation into "a show" (Lewis & Rieman).

#### 2.B.5 What to do with results
- Fix the interface (Lewis & Rieman). Most fixes are obvious: more visible controls, recognizable labels, better feedback.
- The hardest failure is "the user has no reason to think the action is needed" (question 1). Preferred remedies, in order:
  1. Eliminate the action by automating it.
  2. Reorder the task so the user starts something they already know to do and is then prompted for the action.

#### 2.B.6 Pluralistic walkthrough (Bias 1991/1994)
- A group walkthrough with **6–10 representative users**, plus developers and usability practitioners, working on hard-copy panels in task order.
- Procedure:
  1. Each user writes the action they would take on each panel *before* any discussion.
  2. The "right" answer is announced.
  3. Users discuss first while developers stay silent; developers join afterwards.
  4. A short questionnaire follows each task.
- Strengths: early feedback, and developers develop empathy for users.
- Weaknesses: a fixed linear path with no exploration, all users must finish a task before discussion starts, and developers can get defensive.
- Facilitation: a usability practitioner facilitates, not a developer.

#### 2.B.7 Variants relevant to automation
- **Cognitive Walkthrough for the Web (CWW)**: Blackmon, Polson, Kitajima & Lewis, CHI 2002 (cited in the UXPA BoK). It estimates how well headings and links match the user's goal, which suits an automated "information scent" check.
- **LLM-based CW** is covered in 2.F.

### 2.C Empirical methods: usability testing, think-aloud, RITE, sample sizes, metrics, qualitative analysis, PURE

#### 2.C.1 Planning a usability test: objectives → tasks → data → analysis
Sources:
- NN/g, "Usability (User) Testing 101" (2019; last reviewed Jul 2026), https://www.nngroup.com/articles/usability-testing-101/
- Hertzum & Jacobsen 2003, §6.2 (above)
- Rubin & Chisnell, *Handbook of Usability Testing*, 2nd ed. (2008), ch. 5 "parts of a test plan" (book table of contents via https://www.oreilly.com/library/view/handbook-of-usability/9780470185483/ ; [secondary])

**Test plan fields** (Rubin & Chisnell):
1. purpose, goals and objectives
2. research questions
3. participant characteristics
4. method / test design
5. task list
6. environment, equipment and logistics
7. moderator role
8. data to be collected and evaluation measures
9. report contents and presentation

**Core elements of every test** (NN/g): a facilitator, tasks and a participant.
- **Qualitative tests** find problems, using small samples and insights.
- **Quantitative tests** benchmark metrics such as task success and time on task.

**Why goals come first.**
- Hertzum & Jacobsen trace the evaluator effect partly to *vague goal analysis* that lets task scenarios drift.
- So: state what the evaluation must answer, which parts of the system it covers, and which users and contexts it involves.
- Check task coverage before running sessions.

#### 2.C.2 Writing tasks
Sources:
- NN/g, "Turn User Goals into Task Scenarios for Usability Testing" (2014), https://www.nngroup.com/articles/task-scenarios-usability-testing/
- NN/g Usability Testing 101

How to build tasks:
1. List the top **user goals** first.
2. Turn each goal into a **scenario** that gives context and motivation.

**Three rules:**
1. **Realistic.** Example: "Buy a pair of shoes for less than $40", not "Purchase orange Nike running shoes".
2. **Actionable.** Ask participants to *do* the task, not to *say* how they would do it. If a participant takes their hand off the mouse and narrates hypothetical clicks, the task is not actionable.
3. **No clues and no step descriptions.**
   - Avoid the UI's own words. Example: "Find a way to get information on upcoming events sent to your email regularly", not "Sign up for the newsletter".
   - Use the established term when no natural alternative exists.
   - Avoiding clues does not mean being vague. Give every detail needed to finish the task, e.g., "Tuesday at 10 am with Dr. Petersen".

**Delivery and wording:**
- Small wording errors can **prime** behaviour.
- Asking participants to read the task aloud ensures they read all of it and helps note-taking (NN/g).
- For LLM user simulation, task prompts must follow the same no-clue rule. This matches Sears & Hess: detailed step text hides "can't find the control" problems.

#### 2.C.3 Moderation
Sources:
- NN/g, "Talking with Participants During a Usability Test" (2014), https://www.nngroup.com/articles/talking-to-users/
- NN/g, "Thinking Aloud: The #1 Usability Tool" (2012), https://www.nngroup.com/articles/thinking-aloud-the-1-usability-tool/

**Minimal recipe** (Nielsen):
1. Recruit representative users.
2. Give them representative tasks.
3. "Shut up and let the users do the talking."

**Classic facilitator mistakes:**
- treating the session as a conversation
- leading questions and closed questions
- total silence (better than leading, but it wastes probing opportunities)

**Safe probes** when the participant asks something or trails off:
- **Echo**: repeat the participant's last words with a questioning tone.
- **Boomerang**: hand the question back, e.g., "What would you do if you were on your own?"
- **Columbo**: ask an open, deliberately incomplete question.

**Think-aloud downsides to control for:**
- the situation is unnatural
- participants filter their statements to appear smart
- facilitator interruptions can **bias behaviour**; mark and discard the affected segments
- the method is not suited to detailed statistics

#### 2.C.4 Think-aloud theory: concurrent vs. retrospective (Ericsson & Simon; Boren & Ramey)
Sources (read):
- Krahmer & Ummelen 2004, IEEE TPC 47(2):105–117, full text https://pure.uvt.nl/ws/portalfiles/portal/869509/thinking.pdf. It summarizes and tests both Ericsson & Simon (1993) and Boren & Ramey (2000).
- van den Haak, de Jong & Schellens 2003, BIT 22(5):339–351, abstract https://research.utwente.nl/en/publications/retrospective-vs-concurrent-think-aloud-protocols-testing-the-usa/
- Alhadreti & Mayhew 2018, CHI'18, abstract https://research-portal.uea.ac.uk/en/publications/rethinking-thinking-aloud-a-comparison-of-three-think-aloud-proto/

**Ericsson & Simon (protocol analysis).** Verbal reports are valid when they are level 1 or level 2:
- **Level 1**: thoughts already in verbal form are reported.
- **Level 2**: non-verbal thoughts are recoded into words.
- **Level 3** reports require explanation or retrieval from long-term memory. They alter cognition and are less reliable.

To minimize level-3 data, the experimenter stays out of the way, apart from a neutral **"Keep talking"** after about **15–20 s** of silence.

**Boren & Ramey (2000).**
- Practitioners routinely depart from E&S: they probe, and they value level-3 explanations.
- Their speech-communication model replaces "keep talking" with **acknowledgment tokens** ("mm-hmm" with rising intonation) and allows limited clarification and encouragement.

**Krahmer & Ummelen's experiment** (rigid E&S protocol vs. B&R protocol, non-standard website):
- the verbal reports did not differ
- the number of navigation problems found did not differ
- website-quality ratings did not differ
- **but task performance did**: B&R participants completed more tasks and were less lost
- So moderation style is *reactive* on performance metrics. **Hold the protocol constant when comparing metrics.**

**Concurrent (CTA) vs. retrospective (RTA):**
- *van den Haak et al. 2003*:
  - both reveal comparable sets of problems
  - in RTA more problems surface through verbalization; in CTA more surface through observation
  - CTA **hurt task performance**, a reactivity concern especially for complex tasks
- *Alhadreti & Mayhew 2018* (library website):
  - CTA found more problems than RTA and about as many as a hybrid
  - no reactivity was observed
  - CTA needed about half the evaluator time, since RTA and the hybrid doubled testing and analysis time

**Decision rule:**
- **CTA is the default for formative problem-finding.**
- Use RTA, or silent task performance followed by a retrospective, when **time-on-task or task success is the metric of interest**, or when tasks are complex enough that talking interferes.

#### 2.C.5 RITE — Rapid Iterative Testing and Evaluation (Medlock et al., UPA 2002)
Source (full text read): https://www.jpattonassociates.com/wp-content/uploads/2015/04/rite_method.pdf

**Purpose.** Maximize the share of problems that actually get fixed. The paper names four blockers:
1. findings are not believed
2. fixes cost resources
3. feedback arrives late
4. teams are unsure a fix will work

**Procedure:**
- Agree in advance on the tasks *every* user must be able to perform. These set issue importance.
- A decision-maker from the team attends every session.
- The team can change the prototype quickly (within about 2 h, or before the next test day).
- Time is set aside after each participant to triage.
- After each participant, sort issues into four categories:

| Category | Description | Action |
|---|---|---|
| 1 | Obvious cause, obvious and quick fix | Fix now; test with the next participant |
| 2 | Obvious cause, slow fix | Start the fix; use it once ready |
| 3 | No obvious cause | Collect more data; then reclassify (upgrade to 1/2 or drop as a non-issue) |
| 4 | Possibly caused by the script or moderator | Collect more data; then reclassify (upgrade to 1/2 or drop as a non-issue) |

**Preconditions:** the usability engineer needs both domain experience and experience with typical user problems. Otherwise a traditional test is more appropriate.

**Case study** (Age of Empires II tutorial):
- 16 participants, 6 iterations
- 31 problems found, 30 fixed: **impact ratio 97%**
- 36 fixes including re-fixes, of which 6 needed re-fixing: **re-fix ratio 20%**
  - example: "train" vs "create" units was re-fixed twice before the problem disappeared
- Error "spikes" after fixes are expected, because removing a blocker exposes later steps.

**Verifying a fix.** The probability that a problem with occurrence rate p would have shown up in n clean sessions is 1 − (1 − p)^n.
- 6 clean participants give **≥88%** confidence for problems with p = 0.30, but only **47%** for p = 0.10.
- A fix verified by 15 participants gives 79% confidence at p = 0.10.
- **Rule: a fix counts as "verified" only once enough clean sessions have accumulated for the assumed p. Report that confidence explicitly.**

**Metrics defined:**
- impact ratio = problems fixed ÷ problems found
- re-fix ratio = re-fixes ÷ total fixes

Both map directly onto UI-Evaluator's "fix one at a time, verify" loop.

#### 2.C.6 How many participants (the 5-user debate)
Sources read:
- Nielsen 2000 and 2012 (above)
- NN/g "Quantitative Studies: How Many Users to Test?" (2006), https://www.nngroup.com/articles/quantitative-studies-how-many-users/
- NN/g "How Many Participants for Quantitative Usability Studies" (2021), https://www.nngroup.com/articles/summary-quant-sample-sizes/
- HFI, "Five, ten, or twenty-five", https://www.humanfactors.com/newsletters/how_many_test_participants.asp, which summarizes Faulkner 2003 and Sauro & Lewis 2012
- RITE paper (above)

**Qualitative (formative) studies:**
- **5 users per round, then iterate.** Use 3–4 per group when there are two distinct user groups.
- For very low-overhead Agile work, as few as 2 per study may be optimal (Nielsen 2012).
- Exceptions (Nielsen 2012): quantitative studies need at least 20; card sorting at least 15 per user group; eye-tracking heatmaps 39.

**Why "5 is enough" is fragile:**
- **Faulkner 2003** (BRMIC 35(3):379–383; 60 participants; 100 random draws per group size):
  - groups of 5 found **85% on average, but anywhere from ~55% to ~100%**
  - groups of 10 averaged **95%, minimum 82%** (via HFI; [primary PDF behind auth])
- Perfetti & Landesman (2001) and Spool & Schroeder (2001) found 5 users nowhere near 85% on large websites (via HFI).
- Root cause: **low problem discoverability p.** Large, unstructured tasks and heterogeneous users lower p.

**Planning formula.** P(a problem with occurrence p is seen at least once in n users) = 1 − (1 − p)^n.
- Sauro & Lewis example: to be 85% likely to see problems with p = 0.15, you need **12 users**.
- With 10 users you will likely see 94% of p = 0.25 problems but only 40% of p = 0.05 problems.
- You can estimate p after 2 and then 4 participants from the overlap of problems found (all via HFI).

**Quantitative (summative) studies:**
- NN/g 2006: time-on-task SD ≈ **52% of the mean** (1,520 measures), so **20 users** give about ±19% margin of error at 90% confidence.
- NN/g 2021: **40 participants** gives a ±15% margin of error at 95% confidence for a binary metric such as success rate (39, rounded up). NN/g advises against margins wider than 20%.

#### 2.C.7 Core metrics and their formulas

**Task success (effectiveness)** — sources: MeasuringU, "What Is a Good Task-Completion Rate?", https://measuringu.com/task-completion/ ; NN/g quant articles.
- Score each attempt binary: 1 = success against predefined criteria, 0 = failure.
- **Always report a confidence interval.** MeasuringU example: 10/10 successes gives a 95% CI of roughly 75–100%.
- **Benchmark:** across 1,189 tasks (115 tests, 3,472 users) the median completion rate was **78%**. The top quartile is above 92%; the bottom quartile is below 49%.
- Context sets the target: aim for 100% when failure is costly; walk-up-and-use consumer apps often target 70%.

**Time on task (efficiency)** — source: MeasuringU, "Average Task Times in Usability Tests: What to Report?", https://measuringu.com/average-times/ (Sauro & Lewis, CHI 2010).
- Task times are positively skewed.
- For n < 25, report the **geometric mean**: it had 13% less error and 23% less bias than the sample median in simulations over 61 tasks.
- The median overestimates the middle value by up to about 10%.
- Report confidence intervals computed on log-transformed times.

**Errors.** Count error events per task, e.g., RITE's "failures" (cannot continue) vs. "errors" (confusion).

**SEQ (Single Ease Question)** — source: MeasuringU, "10 Things to Know About the SEQ", https://measuringu.com/seq10/
- Ask immediately after each task: "Overall, how difficult or easy was the task to complete?" on a 1–7 scale, typically with only the endpoints labelled.
- **Historical average ≈ 5.5** (range 5.3–5.6 across more than 400 tasks and 10,000 users; updated 2019).
- Correlates about **r = 0.5** with time and completion.
- About **14%** of task failures are still rated "very easy", so never use SEQ alone.
- Ask "why?" when the rating is below 5.

**SUS (System Usability Scale)** — sources: MeasuringU, https://measuringu.com/sus/ and https://measuringu.com/interpret-sus-score/
- 10 items with 5-point agreement scales.
- **Scoring formula:**
  1. Odd items: score = response − 1.
  2. Even items: score = 5 − response.
  3. Sum the ten scores and multiply by 2.5, giving a range of 0–100.
- **Interpretation rules:**
  - The score is **not a percentage**.
  - The average is **68**, which is the 50th percentile and a "C".
  - SUS is **not diagnostic**.
  - SUS correlates only about **r ≈ 0.24** with completion and time in the same test, so a high SUS can coexist with severe observed problems.
  - Sub-scales: **learnability** = items 4 + 10; usability = the other 8 items.
  - Reliable down to small n, but imprecise. **Report a confidence interval.**
- **Sauro–Lewis curved grading scale** (raw SUS → grade → percentile):

| Grade | Raw SUS | Percentile |
|---|---|---|
| A+ | 84.1–100 | 96–100 |
| A | 80.8–84.0 | 90–95 |
| A− | 78.9–80.7 | 85–89 |
| B+ | 77.2–78.8 | 80–84 |
| B | 74.1–77.1 | 70–79 |
| B− | 72.6–74.0 | 65–69 |
| C+ | 71.1–72.5 | 60–64 |
| C | 65.0–71.0 | 41–59 |
| C− | 62.7–64.9 | 35–40 |
| D | 51.7–62.6 | 15–34 |
| F | 0–51.6 | < 15 |

- **Bangor, Kortum & Miller adjective scale** (JUS 2009; 7-point adjective item added to about 1,000 SUS surveys, correlation r ≈ 0.82):
  - "Excellent" ≈ above 85
  - "Good" ≈ 71
  - "OK" ≈ 51 (MeasuringU notes "OK" may be better read as "Fair")
  - The commonly cited full set of means — 12.5 Worst Imaginable, 20.3 Awful, 35.7 Poor, 50.9 OK, 71.4 Good, 85.5 Excellent, 90.9 Best Imaginable — is [unverified against primary; consistent with the MeasuringU summary]
- **Acceptability ranges** (Bangor et al. 2008): acceptable ≈ above 70; marginal 50–70; not acceptable below 50.
- **Relation to NPS:** SUS ≈ 81 on average for promoters and ≤ 53 for detractors (MeasuringU, n = 4,664).

**UMUX and UMUX-Lite** — source: MeasuringU, https://measuringu.com/umux-lite/
- **UMUX** (Finstad 2010): 4 items on a 7-point scale, aligned with ISO effectiveness, efficiency and satisfaction.
- **UMUX-Lite** (Lewis, Utesch & Maher 2013): 2 positive items.
  1. "[System]'s capabilities meet my requirements."
  2. "[System] is easy to use."
- Reliability: α ≈ .86 (vs .91 for SUS).
- Correlations: r ≈ .83 with SUS and .72 with NPS.
- **Regression to a SUS-equivalent score:** SUS ≈ 0.65 × ((item1 + item2 − 2) × 100/12) + 22.9.
- Use it when a survey must stay short. Item 1 is a **usefulness** check, which Nielsen's heuristics lack (see ISO 9241-110 #1).

**NASA-TLX (workload)** — source read: the NASA Ames paper-and-pencil package, https://ntrs.nasa.gov/api/citations/20000021488/downloads/20000021488.pdf
- **Six subscales:**
  - mental, physical and temporal demand (demands imposed on the subject)
  - performance, effort and frustration (the subject's interaction with the task)
- **Rating scale:** each scale is a line divided into 20 intervals, giving **0–100 in steps of 5**. Marks between ticks round up.
- **Weights:** **15 pairwise comparisons** between the six subscales. Each subscale's weight is the number of times it was chosen, from 0 to 5.
- **Overall score:** Σ(rating × weight) / **15**.
- Ratings can be collected after each task segment, or retrospectively with a replay; the two correlate highly.
- "Raw TLX" (unweighted mean of the six ratings) is common in practice [secondary, Hart 2006].
- Use TLX for cognitively demanding professional tools. It is overkill for consumer flows.

**NPS: why not to use it as a usability metric** — source: NN/g, "Net Promoter Score…" (2024), https://www.nngroup.com/articles/nps-ux/
- **Formula:** % promoters (9–10) − % detractors (0–6), on a 0–10 "likelihood to recommend" scale. Range −100 to +100.
- **Caveats:**
  1. It says nothing about *why*.
  2. It is meaningless at small n; never report NPS from a 5-user test.
  3. Binning throws away information. A user moving from 2 to 5 is still a detractor.
  4. Loyalty is not usability; price and mandatory use confound it.
  5. It cannot be attributed to a local UI change.
  6. It is easily gamed (Campbell's law).
  7. Norms differ by country (Qualtrics XM, 18 countries).
- **Rule:** NPS is a relationship or brand metric only, never an acceptance criterion for a UI fix.

#### 2.C.8 Qualitative analysis: affinity diagramming and thematic analysis

**Affinity diagramming** — source: NN/g (2024; reviewed 2026), https://www.nngroup.com/articles/affinity-diagram/

Steps:
1. **Generate** notes individually and independently, 5–10 minutes, one observation or idea per note. Color can separate direct quotes from observations.
2. **Cluster** the notes, grouping by content first and labelling the themes afterwards. Small clusters still count.
3. **Prioritize** the clusters, e.g., by dot voting, and assign actions and an owner.

The independence in step 1 mirrors heuristic evaluation: it prevents dominant voices from skewing the result.

**Thematic analysis** — source (full text read): Braun & Clarke 2006, *Qualitative Research in Psychology* 3(2):77–101, https://www2.uwe.ac.uk/services/Marketing/students/Newstudents/HAS/Using%20thematic%20analysis%20in%20psychology.pdf

Six recursive phases:
1. Familiarize yourself with the data.
2. Generate initial codes.
3. Search for themes.
4. Review themes against the coded extracts and the whole dataset.
5. Define and name themes.
6. Produce the report.

**Pitfalls:**
1. No real analysis: extracts are strung together and paraphrased.
2. Using the interview or survey questions as the "themes".
3. Weak themes: overlapping, incoherent, or backed by only one or two extracts.
4. A mismatch between data and claims; ignoring contradictions or alternative readings.
5. A mismatch between theory and claims.
6. **"Anecdotalism"**: one or a few vivid instances reified into a theme.

**15-point quality checklist** (Table 2). The items most relevant here:
- every data item gets equal attention
- themes are not generated from a few vivid examples
- themes are checked against each other and against the original dataset
- each theme is internally coherent and distinct from the others
- data are interpreted, not merely paraphrased
- the extracts actually illustrate the claims
- the researcher is active; themes do not just "emerge"

**Prevalence.** There is no fixed prevalence threshold for a theme; "keyness" matters more than counts. Still, **report counts** (e.g., "7/12 participants") to avoid overclaiming.

#### 2.C.9 PURE — Pragmatic Usability Rating by Experts
Source (read): NN/g, Rohrer, "Quantifying and Comparing Ease of Use Without Breaking the Bank" (2017), https://www.nngroup.com/articles/pure-method/ (method first published as a CHI 2016 case study).

**Purpose:** an expert-generated **ease-of-use (friction) metric** for **fundamental tasks along the happy path** for a **specific target user type**. It does not measure aesthetics, usefulness or emotion.

**Rubric, applied per step:**
- **1 (green):** easy; low cognitive load or a known pattern
- **2 (yellow):** notable cognitive load or effort, but achievable
- **3 (red):** difficult; some target users would likely fail or abandon here

**Scores and colors:**
- Task score = sum of its step scores. Product score = sum of its task scores.
- The color of a task or product is that of its **worst** step: one red step makes the task and the product red.

**Procedure:**
1. Define 1–3 target user types and document their assumed knowledge.
2. Choose the fundamental tasks: aim for about 10, maximum about 20. Fundamental means business-critical or core-need.
3. Fix the happy path for each task (or the "popular path" from analytics).
4. Fix step boundaries. A step **begins when the system presents options** and **ends when the user acts and expects a significant system response**.
5. **Three expert raters** watch the same walkthrough together and **rate silently and independently**. The designers of the flow must not be raters.
6. Compute inter-rater reliability with **Krippendorff's α (ordinal)**. If **α < 0.667**, treat the session as training and discuss the assumptions. Panels typically need 2–3 rounds before they calibrate.
7. Discuss and agree a single consensus score per step. **Do not average**, because the rubric is ordinal.
8. Sum the scores and color them.
9. Optional: a screenshot and rationale for each step.
10. Optional: a side-by-side comparison scorecard.

**Validity** (as reported by NN/g; author-reported, moderate evidence):
- PURE correlated with SEQ (r ≈ 0.5, p < .05) and SUS (r ≈ 0.4, p < .01) in benchmark studies.
- Inter-rater reliability ranged 0.5–0.9, generally above 0.8 after training.

**Why it matters for UI-Evaluator:** PURE is the closest existing *expert-rating protocol* to what an LLM evaluator does. It already contains a rubric, step segmentation, independent ratings, a reliability gate (α ≥ 0.667) and consensus.

### 2.D Metrics at scale, experimentation rigor, causal inference, and mixing methods

#### 2.D.1 HEART + Goals–Signals–Metrics (Rodden, Hutchinson & Fu, CHI 2010)
Source (full text read): "Measuring the User Experience on a Large Scale: User-Centered Metrics for Web Applications", https://research.google.com/pubs/archive/36299.pdf

**PULSE metrics and why they are not enough.** PULSE metrics are Page views, Uptime, Latency, Seven-day active users and Earnings. They are important for product health but are low-level or indirect for UX, and they are ambiguous to interpret:
- a rise in page views may mean popularity *or* users getting lost
- seven-day active users can rise even with 100% weekly turnover

**The five HEART categories:**
1. **Happiness**: attitudinal, e.g., satisfaction, visual appeal, likelihood to recommend, perceived ease, measured with a recurring in-product survey.
   - iGoogle example: satisfaction dipped after a redesign and then recovered. That pattern is **change aversion**, and the team kept the new design.
2. **Engagement**: frequency, intensity or depth of use, *reported per user*, not as a total.
   - Gmail example: the share of active users who visited on at least 5 of the last 7 days. It predicted long-term retention.
3. **Adoption**: new users in a period.
4. **Retention**: users from period t who are still active at t + k.
5. **Task success**: effectiveness, efficiency and error rate, measured with remote benchmark studies or with optimal-path adherence in logs.
   - Google Maps example: error rates were compared in an A/B test of a single search box vs. the dual box.

Not every category applies to every product; for example, Engagement may be meaningless for mandatory enterprise tools. Use the framework to make an **explicit decision** to include or exclude each category.

**Goals → Signals → Metrics process:**
1. **Goals.** What must users accomplish, and what is the redesign for? Teams often disagree, so use this step to reach consensus. Feature goals may differ from product goals. Don't worry about measurability yet.
2. **Signals.** Which behaviours or attitudes would show success or failure? Identify the data source: logs, surveys, or a panel of raters.
   - Choose signals that are **sensitive and specific** to the goal, i.e., they move only when the UX changes.
   - Failure is often easier to detect than success: abandonment, undo, frustration.
3. **Metrics.** Normalize: ratios, percentages and per-user averages instead of raw counts. Filter out bots. Make sure key actions are actually logged.

**Positioning:**
- Metrics "should not stand alone". **Triangulate** them with usability studies and field studies.
- HEART is primarily for **launched** products and does **not** replace formative research.

#### 2.D.2 A/B testing rigor (Kohavi et al.)
Sources read (full text):
- Kohavi, Longbotham, Sommerfield & Henne, "Controlled experiments on the web: survey and practical guide", *Data Mining and Knowledge Discovery* 18 (2009), https://ai.stanford.edu/~ronnyk/2009controlledExperimentsOnTheWebSurvey.pdf
- Kohavi, Deng, Longbotham & Xu, "Seven Rules of Thumb for Web Site Experimenters", KDD 2014, https://exp-platform.com/Documents/2014%20experimentersRulesOfThumb.pdf
- Fabijan et al., "Diagnosing Sample Ratio Mismatch in Online Controlled Experiments", KDD 2019, https://exp-platform.com/Documents/2019_KDDFabijanGupchupFuptaOmhoverVermeerDmitriev.pdf
- Johari, Pekelis & Walsh, "Always Valid Inference: Continuous Monitoring of A/B Tests" (arXiv 1512.04922; *Operations Research* 2022)
- Chapter list of Kohavi, Tang & Xu, *Trustworthy Online Controlled Experiments* (Cambridge UP 2020), https://www.cambridge.org/core/books/trustworthy-online-controlled-experiments/D97B26382EB0EB2DC2019A7A7B518F59/listing (chapters 19 A/A test, 21 SRM and trust-related guardrails, 22 leakage and interference, 23 long-term effects). The book text itself was not read.

**Rigor checklist with numbers:**
1. **OEC (Overall Evaluation Criterion).**
   - A quantitative measure, chosen **in advance**, that aligns the organization. Choosing it after the fact inflates familywise Type I error.
   - It should predict **long-term** value, e.g., lifetime value or repeat visits, not only short-term clicks. Include penalty terms, e.g., for ad space that is never clicked.
2. **Power and sample size.**
   - n per variant ≈ **16σ²/Δ²** for 95% confidence and **80% power**. Replace 16 with **21 for 90% power**. σ² is the variance of the OEC and Δ is the smallest change worth detecting.
   - Lower-variance OECs shrink the required sample. Kohavi's example: switching from purchase spend to conversion rate dropped the need from about 409k to about 122k users.
   - Triggering, i.e., analysing only exposed users, lowers variance further.
3. **Skewed metrics.** The mean needs about **355 × s²** observations per variant, where s is skewness, before it is approximately normal. Use this rule when |s| > 1.
   - Example: Revenue/user had s = 18.2, implying about 114k users.
   - Capping (e.g., revenue at $10 per user per week) cut skewness from 18 to 5.3 and improved sensitivity.
   - Keep control and treatment **equal in size**.
4. **A/A tests.** Validate the platform and estimate variance. If many more than 5% of A/A metrics come out significant, something is wrong; bots are a common cause.
5. **Sample Ratio Mismatch (SRM).**
   - Test the observed vs. configured split with a chi-square test.
   - SRM in most cases "completely invalidates" results. Example: a 50.2/49.8 split over 1.6M users has a chance probability below 1 in 500k.
   - About **6%** of Microsoft experiments, and about 10% of LinkedIn triggered analyses, showed SRM.
   - SRM is a mandatory **trust-related guardrail**.
6. **Guardrail metrics.**
   - *Organizational guardrails*, such as latency and page-load time, must not regress.
   - *Trust guardrails*, such as SRM and A/A behaviour, validate the experiment itself.
   - Speed matters a lot (rule of thumb #4).
7. **No peeking without correction.** Continuously monitoring p-values and stopping when p < .05 inflates Type I error. Even at 10,000 samples it can "easily increase fivefold" (Johari et al.). Use a fixed horizon or always-valid / sequential methods.
8. **Novelty (newness) and primacy effects.**
   - Experienced users may at first be slower with a new navigation (primacy, which favours control).
   - Curious users click around a new feature (newness, which favours treatment).
   - So run for **multiple weeks**, and compute the OEC for **new users only**, who are affected by neither effect.
9. **Interference / SUTVA.** In social networks, collaboration tools and two-sided marketplaces, one unit's assignment affects others. Choose the randomization unit accordingly (book ch. 14 and 22).
10. **Twyman's law.** "Any figure that looks interesting or different is usually wrong."
    - Kohavi's illustration: if experiment effects are distributed with SD 0.25%, a +2.0% lift is 8 standard deviations out, with a prior probability around 1e-15.
    - So look for a bug, usually instrumentation, before celebrating.
11. **Base-rate realism.**
    - Small changes *can* have big impact (rule 1), but changes rarely have big positive impact (rule 2). Most progress comes from accumulating many small wins.
    - "Your mileage WILL vary" (rule 3): replicate results claimed by others before relying on them.
12. **Limits of A/B tests** (Kohavi 2009 §3.6):
    - they quantify *what* changed, not **why**, so augment them with usability studies
    - they measure short-term effects only
    - the feature must already be implemented, so paper prototypes are better for early ideas
    - users may notice inconsistencies between variants
    - launch announcements make holdouts impractical

#### 2.D.3 Causal-inference basics
Sources:
- Mill's three conditions as restated by Shadish, Cook & Campbell (2002): see the summary in PMC2957016, https://pmc.ncbi.nlm.nih.gov/articles/PMC2957016/
- Kohavi 2009 (randomization establishes causality)

**Mill's three conditions:** a causal claim requires all three.
1. **Temporal precedence**: the cause comes before the effect.
2. **Covariation**: cause and effect are related.
3. **No plausible alternative explanation**: no confound or third variable accounts for the relationship.

**Why controlled experiments are the strongest design:**
- Random assignment makes the groups equivalent in expectation.
- The only systematic difference is then the treatment, which rules out confounds.
- So a statistically significant OEC difference can be attributed to the change (Kohavi 2009).

**Correlation ≠ causation in UX practice:**
- A metric that moved after a release (before/after comparison) fails condition 3. Seasonality, marketing, novelty and concurrent releases are all candidate confounds.
- Engagement can rise because users are *lost*, not satisfied (HEART paper).
- So **only a randomized comparison or an explicitly argued quasi-experiment can support a causal claim about a UI change.** Otherwise, report the result as association.

#### 2.D.4 Combining quantitative and qualitative evidence
Sources:
- NN/g, "When to Use Which User-Experience Research Methods" (2022; reviewed 2026), https://www.nngroup.com/articles/which-ux-research-methods/
- HEART paper
- Kohavi 2009

**NN/g's three dimensions:**
1. **Attitudinal vs. behavioural**: what people say vs. what they do. They often differ; lean behavioural.
2. **Qualitative vs. quantitative**:
   - **qualitative** answers *why* and *how to fix*
   - **quantitative** answers *how many* and *how much*, which helps prioritize
3. **Context of use**: natural, scripted, limited, or not using the product.

**Time dimension:**
- **generative** methods: strategize phase
- **formative** methods (e.g., usability testing): design phase
- **summative** methods (benchmarking, A/B tests, analytics): launch-and-assess phase

**Triangulation rules from the sources:**
- Metrics "should not stand alone" (Rodden).
- A/B tests tell you *what* but not *why*, so pair them with usability studies (Kohavi).
- Self-report can contradict behaviour (aesthetic–usability effect; SEQ's 14% "easy but failed").

**Operational pairing for UI-Evaluator:**
- every quantitative anomaly (drop-off, error spike, low SUS/SEQ) triggers a qualitative "why" probe: a session replay, a think-aloud, or a walkthrough of that step
- every qualitative finding that is a candidate for prioritization gets a "how many" estimate: analytics frequency, or the share of participants who hit it

### 2.E Guidelines for AI features inside a UI

#### 2.E.1 Microsoft HAX — Guidelines for Human-AI Interaction (Amershi et al., CHI 2019)
Source (full text read): https://www.microsoft.com/en-us/research/uploads/prod/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf

**How the guidelines were derived:**
1. More than 150 recommendations were consolidated.
2. An internal modified heuristic evaluation cut the set from 20 to 18.
3. A user study had **49 design practitioners** test the guidelines against **20 AI-infused products**. They reported **785 examples**: 313 applications, 277 violations, 89 neutral, 106 "does not apply".
4. 11 experts reviewed the revised wording.

**The 18 guidelines by phase:**

| Phase | Guidelines |
|---|---|
| Initially | G1 Make clear what the system can do. G2 Make clear how well the system can do what it can do. |
| During interaction | G3 Time services based on context. G4 Show contextually relevant information. G5 Match relevant social norms. G6 Mitigate social biases. |
| When wrong | G7 Support efficient invocation. G8 Support efficient dismissal. G9 Support efficient correction. G10 Scope services when in doubt. G11 Make clear why the system did what it did. |
| Over time | G12 Remember recent interactions. G13 Learn from user behaviour. G14 Update and adapt cautiously. G15 Encourage granular feedback. G16 Convey the consequences of user actions. G17 Provide global controls. G18 Notify users about changes. |

**Findings to carry over:**
- **G11 (explain why)** had one of the highest violation counts, so it is a likely hotspot when auditing AI features.
- **G10 and G14** were hard to assess in a single session; they need longitudinal or multi-session observation.
- **G5 and G6** drew many "does not apply" ratings even though other evaluators found violations in the same product category. Evaluators under-detect social-norm and bias issues, so these need explicit, prompted checks.
- Evaluators confused G9 (efficient correction) with G17 (global controls), which is why "global" was added to G17's wording.

The paper's method — a modified HE in which participants report both **applications and violations** for each guideline and rate them on a 5-point "clearly violated → clearly applied" scale — can be reused directly as an AI-feature audit template.

#### 2.E.2 Google PAIR People + AI Guidebook
Sources read:
- "All chapters" PDF of the guidebook (the edition hosted under guidebook-v2), https://pair.withgoogle.com/chapter/People%20+%20AI%20Guidebook%20-%20All%20Chapters.pdf
- v2 chapter index, https://pair.withgoogle.com/guidebook-v2/chapters/mental-models/

The current landing page, https://pair.withgoogle.com/guidebook/, is rendered by JavaScript and could not be read. A 2025 update for generative AI is reported (PAIR Medium post, inaccessible), so the details of that update are [unverified].

**The six chapters, with key considerations paraphrased:**
1. **User Needs + Defining Success**
   - Find where real user needs and AI strengths intersect. Use AI only where it adds unique value.
   - Automate tasks that are tedious, unpleasant or need scale, where people agree on the "correct" answer. Augment tasks that people enjoy, that carry social capital, or where people disagree on the correct answer.
   - Design the reward function deliberately. **Weigh false positives against false negatives** and **choose the precision/recall trade-off with users**.
2. **Data Collection + Evaluation**: match data needs to user needs, commit to fairness, protect personal information, split the data.
3. **Mental Models**
   - Set expectations for adaptation.
   - Introduce the AI system initially, and keep doing so over time.
   - Be cautious about presenting AI as human-like, because people form unachievable expectations of anthropomorphic systems.
4. **Explainability + Trust**
   - Help users **calibrate** their trust, avoiding both over-trust and algorithm aversion.
   - Optimize for understanding.
   - Explain data sources: scope, use, and when the system lacks information the user has.
   - Manage the influence of confidence displays on user decisions.
5. **Feedback + Control**
   - Align feedback with model improvement; distinguish implicit from explicit feedback.
   - Communicate the value of feedback and how long it takes to have an effect.
   - Balance control and automation, and let users opt out of giving feedback.
6. **Errors + Graceful Failure**
   - Define "errors" and "failure" from the user's expectations. A recommender that is useful 60% of the time can count as success or failure depending on context.
   - Identify the error sources:
     - user errors
     - system errors
     - **context errors**: wrong assumptions about the user's situation
     - **background errors**: neither the user nor the system notices; these need dedicated QA
   - Weigh the stakes. Risk is higher with novice users, divided attention, low system confidence and narrow success definitions.
   - Always provide a path forward from failure, including falling back to non-AI options.

**Synthesis for UI-Evaluator:**
- HAX gives the **checklist**: 18 items, auditable per screen or flow.
- PAIR gives the **design rationale and decision framing**: automate vs. augment, the precision/recall trade-off, the error taxonomy.
- An AI-feature audit should run the HAX checks and attach PAIR's error taxonomy to each finding.

### 2.F LLM/VLM-as-evaluator reliability for UI/UX (2024–2026)

All nine assigned papers were located and read in full text: seven arXiv PDFs, the CEUR PDF, and the ACL paper via its arXiv version. Supporting LLM-as-judge literature was checked through arXiv abstracts. Numbers below were extracted from the papers. Where I computed a value myself, it is marked **(derived)**.

#### 2.F.1 Paper-by-paper evidence

**(1) Duan, Warner, Li & Hartmann — "Generating Automatic Feedback on UI Mockups with Large Language Models", CHI 2024** (https://arxiv.org/abs/2403.13139)
- **Setup.**
  - A Figma plugin sends GPT-4 a JSON description of the UI layer tree (semantic and visual attributes) plus the guideline text, at temperature 0.
  - Suggestions the designer dismisses are fed back into the next prompt.
  - Smaller and other contemporary LLMs performed far worse in the authors' comparison.
- **Performance study** (51 UIs, 3 guideline sets, 3 expert raters):
  - accuracy: **52% accurate / 19% partially / 29% not accurate**
  - helpfulness: **49% helpful or very helpful**, 36% slightly or not helpful
  - agreement among the raters was itself only slight: **Fleiss' κ = 0.112 for accuracy and 0.100 for helpfulness**
- **Versus 12 human experts on 12 UIs:**
  - the experts found 91 distinct violations
  - GPT-4 found 38 helpful ones: 29 shared with the experts, 9 GPT-only, 62 human-only
  - **GPT-4: P = 0.603, R = 0.380, F1 = 0.466. Average single human: P = 0.829, R = 0.336, F1 = 0.478.**
  - GPT-4 was less comprehensive than a group of 6 experts.
- **Degradation over iterations** (12 designers, 2–3 edit rounds per UI):
  - after edits, accuracy fell to **39% accurate / 35% not accurate**, and only **33% of suggestions were helpful**
  - the decline appeared in both accuracy and helpfulness, across guidelines and participants
  - interpretation: as the UI improves, fewer real violations remain and the model begins to **invent** them
- **Heuristic-swapping.** After a designer dismissed a suggestion, GPT-4 often re-raised **the same issue under a different heuristic** (seen by 5 participants).
- **Strengths:** catching subtle layout inconsistencies, improving text, and reasoning about UI semantics.
- **Weaknesses:** "Aesthetic and Minimalist Design" findings were largely inaccurate; feedback was repetitive.

**(2) Duan et al. — "UICrit", UIST 2024** (abstract: https://arxiv.org/abs/2407.08850)
- 3,059 critiques with quality ratings for 983 mobile UIs, written by 7 experienced designers.
- Few-shot and visual prompting with these critiques produced a **55% performance gain** in LLM-generated UI feedback.
- Evidence that **expert exemplars and calibration data** improve LLM critique.

**(3) Guerino, Rodrigues, Capeleti, Mello, Freire & Zaina — "Can GPT-4o Evaluate Usability Like Human Experts?", INTERACT 2025** (https://arxiv.org/abs/2506.16345)
- **Setup.** GPT-4o was run once per screenshot on 20 screenshots of a Brazilian web GIS system, with a literature-grounded prompt (Nielsen heuristics, severity 1–4). The comparison was against 66 issues found by 3 HCI experts in a prior study.
- **Output funnel:**
  - 111 raw issues (5.55 per screen, SD 1.14)
  - 43 were duplicates (38.7%), leaving 68 unique issues
  - 27 false positives (**24.3% of the raw output**, ≈ **40% of the unique output** (derived))
  - 41 valid issues remained, of which **14 matched the experts and 27 were new valid issues**
- **Recall against the expert list: 21.2% (14/66).** Issue identification differed significantly between GPT-4o and the experts (χ²(1) = 34.1, p < .001).
- **Severity distributions did not differ significantly** (Mann–Whitney).
- **By heuristic:**
  - GPT-4o was relatively strong on H2 (match with the real world) and H8 (aesthetic/minimalist)
  - it was weak on H3 (user control), H6 (recognition) and H7 (flexibility)
  - it found **no H9 issues**
  - 37.8% of expert issues cited two or more heuristics; GPT-4o rarely did
- **False-positive taxonomy:**
  - 15 *problem disagreements*: the problem is not present
  - 9 *problem assumptions*: interaction behaviour that cannot be verified from a static image, e.g., "no feedback on hover"
  - 3 *generalized problems*: vague claims such as "high cognitive load"
- **The paper's takeaways:** GPT-4o lacks depth; its severity ratings are similar to experts'; it complements experts on overlooked issues; it is strong on visual/language heuristics; it **hallucinates, so human-in-the-loop validation is required**.

**(4) Ebrahimi Pourasad & Maalej — "Does GenAI Make Usability Testing Obsolete?" (UX-LLM), ICSE 2025** (https://arxiv.org/abs/2411.00634)
- **Setup.** GPT-4 Turbo with Vision received the app overview, the user task, a screenshot and the **SwiftUI source code**. It was tested on 2 open-source iOS apps (Quiz, To-Do).
- **Expert labelling.** Two UX experts labelled the 49 predicted issues:
  - **precision 0.61–0.66, recall 0.35–0.38**
  - the experts agreed with each other at only **κ = 0.53** (moderate) on what counts as a real issue
- **Three methods compared** (110 matched issues in total):

| Method | Issues found | Unique to that method |
|---|---|---|
| Usability testing (10 participants per app) | 26 | 8 |
| Expert review | 55 | 31 |
| UX-LLM | 29 | 8 |

  Only **9 issues were found by all three**.
- Because UX-LLM reads source code, it surfaced issues on **less-common paths** that no other method saw, such as missing loading indicators on slow networks.
- **Prompt lesson:** asking the model to list *exactly 10* issues made it **fabricate** issues when fewer existed and discard real ones when more existed. The final design leaves the count unconstrained.

**(5) Zhong, McDonald & Hsieh — "Synthetic Heuristic Evaluation", arXiv 2507.02306 (2025, preprint)**
- **Setup.** GPT-4 evaluated 3–9 screenshots per task, with task context, across 2 mobile apps.
- **Comparison groups:**
  - 5 UpWork UX freelancers per app, each paid $30
  - a "master set" built from experts, GPT-4 and 5 trained research assistants: 133 and 113 violations with severity ≠ 0
- **Recall:** GPT-4 found **73% and 77%** of the master set. Aggregated 5-expert coverage was **57% and 63%**; individual experts averaged **18% and 17%**.
- **Non-issues:** GPT-4 produced far more severity-0 items (**43 and 52**, vs 6 and 3 from the experts). That implies precision of roughly **69% and 63%** (derived: 97/140 and 87/139).
- **Where the false positives came from:**
  - **misrecognized components** — e.g., treating the iOS status bar as part of the app: 42% and 27% of its severity-0 items
  - **ignorance of design conventions** — e.g., a deliberately emphasized map/list toggle, or a primary vs. link button: 42% and 38%
- **Duplicates:** GPT-4 re-reported the same issue on every screen where it appeared (8 and 9 duplicates); the experts produced none.
- **Cross-screen violations:** GPT-4 caught 3/7 and 3/6, vs 6/7 and 5/6 for the experts. All of the misses were consistency violations.
- **Stability:** GPT-4 stayed **stable over 3 months and 2 accounts** (coverage-consistency ≈ 94%; performance SD ≈ 1.5–1.6 points), while human evaluators' performance **declined across tasks** (fatigue).
- **Other models:** Gemini-1.5-pro reached 59%/59% and Claude 3.5 Sonnet 57%/58% with the same prompt, which was not re-tuned for them.
- **Evidence caveats:**
  - the master set was partly built *from GPT-4's own output*, which biases its recall upward
  - the human baseline was low-paid and asynchronous
  - unreviewed preprint with placeholder ACM metadata

**(6) Campos, Marques & Nakamura — "Will AI also replace inspectors?", SBQS 2025** (https://arxiv.org/abs/2510.17056)
- **Setup.** One clinical-form prototype (a pediatric early-warning score, PEWS) was inspected from screenshots by 4 experienced inspectors, GPT-4o and Gemini 2.5 Flash, all using Nielsen's heuristics.
- **Precision / recall / F1:**

| Evaluator | Precision | Recall | F1 |
|---|---|---|---|
| Inspectors (group) | **.917** | **.567** | **.701** |
| Gemini 2.5 Flash | .829 | .433 | .569 |
| GPT-4o | .820 | .409 | .546 |
| Gemini ∪ GPT-4o | .824 | .701 | .757 |
| **Inspectors ∪ Gemini** | **.880** | **.843** | **.861** |
| Inspectors ∪ GPT-4o | .870 | .724 | .791 |

- **False positives:** 17–18% of AI reports, vs 0–14% for individual inspectors. The AIs' false positives came from **assumptions that cannot be verified from screenshots**; the inspectors' came from personal preferences.
- **Duplicates:** GPT-4o 30, Gemini 8. The models report the *same defect under a different heuristic*, and re-report it across screenshots of the same interaction.
- **Effectiveness and speed:** each AI alone found more defects than any single inspector (individual effectiveness about 60% vs 22–47%) and took seconds instead of 35–170 minutes.
- **Overlap with the inspectors' 72 defects:** Gemini found 20, GPT-4o 24, the two together 33.

**(7) Zhong, McDonald & Hsieh — "Synthetic Cognitive Walkthrough", CHI 2026** (https://arxiv.org/abs/2512.03568)
- **Setup.** GPT-4 (5 runs per app) and Gemini-2.5-pro (3 runs per app), 16 runs in total, against 10 human participants doing a think-aloud CW on 2 apps.
- **Task completion:** LLMs **100% and 97.2%** vs humans **88.2%**. LLMs used fewer steps and followed paths closer to optimal.
- **Failure points** (a key CW output):
  - humans reported **7.5 on average**; GPT runs 0.6, Gemini runs 0.5
  - in total humans found **10**, and all LLM runs combined found **3**
  - **LLMs are too competent and too rational.** Humans explore breadth-first when uncertain and make memory errors; the LLMs did neither.
- **Follow-up with explicit failure-point prompting:**
  - **with full navigation context**, LLM ratings predicted human failure points: odds ratios **5.45–7.5** (GPT) and **2.22–4.72** (Gemini)
  - run-to-run consistency was moderate: mean pairwise κ = **0.64** (GPT) and **0.63** (Gemini)
  - **without context** (single screens), predictions were weak and inconsistent; some pairs of runs had κ ≈ 0 or below
- **Conclusion:** LLM-CW does not simulate users. It can surface likely failure points *if* it carries the walk's history and is explicitly asked to look for them.

**(8) Touir, Barika Ktata & Soui — "Grounding Persona-Driven Usability Simulation in Established Standards" (SUTM), CEUR-WS Vol-4249 paper 4, CHI 2026 RAIP workshop** (https://ceur-ws.org/Vol-4249/paper4.pdf)
- **Setup.**
  - Persona-driven user agents run perceive–decide–act loops on rendered prototypes.
  - A **Supervisor agent** checks each trace before any issue is promoted, then maps it to ISO 9241-110 and Nielsen. It checks three things:
    1. constraint compliance
    2. evidence plausibility: the cited UI target exists at that step
    3. trace coherence
  - It also normalizes issues to a schema, synthesizes minimal patches, and **re-simulates to verify each fix**.
  - Ground truth: 45 automotive-infotainment prototypes, each labelled by 3 of 12 experts (Fleiss **κ = 0.78**).
- **Supervised ("Full") vs single-agent ("Base"):**

| Metric | Full | Base |
|---|---|---|
| ISO 9241-110 precision / recall | **0.91 / 0.85** | 0.75 / 0.88 |
| Nielsen precision / recall | **0.96 / 0.92** | 0.78 / 0.90 |
| Persona inconsistency | **0.8%** | 45% |
| Hallucination rate | **0.9%** | 45% |

- **Patch outcomes:** 78% applied cleanly, **85% passed verification**, **7% caused regressions**.
- **Developer review:** trust 5 vs 4 (1–7 scale), NASA-TLX 35 vs 50, ACCEPT rate **65% vs 45%**.
- **Evidence quality: workshop paper.** Large effects, the LLM model is not named, and details are thin. Treat it as *directional*, not definitive.

**(9) Wang et al. — "UXBench: Measuring the Actionability of LLM-Generated UX Critiques", arXiv 2606.16262 (June 2026, preprint)**
- **Fixtures:** 41 runnable local web fixtures (11 real-product anchors and 30 synthetic siblings) across 10 surface families.
- **Coverage-gated exploration:** the judge **cannot finish until it has exercised the salient controls**; premature "finish" decisions are rejected.
- **Rubric:** 7 dimensions on a 1–5 scale, each grounded in validated instruments:
  1. goal-state clarity
  2. navigation scent
  3. action feedback
  4. flow efficiency
  5. error recovery
  6. trust transparency
  7. scanability and accessibility
- **Scoring by "repair lift":** a fixed repair agent fixes the UI using each judge's report, and the change in score is measured.
- **Results across 8 frontier judges:**
  - baseline 3.27 → repaired 3.41–3.49 (**Δ +0.14 to +0.22**)
  - no single judge dominates: leadership changes by surface family, and each model shows its own rubric-level "signature"
  - fixture-level reliability varies (the top model by mean has a wide interval)
  - automated repair lift did not fully match **blind human ratings** (6 reviewers)
  - the LLM scorer (GPT-5.4-Mini) is itself a potential bias
- **Practical lessons:**
  - critiques must be **interaction-grounded**, because many failures appear only after interacting
  - rotate or ensemble judges rather than trusting one
  - confirm with human review

**(10) Jeon et al. — "Do MLLMs Capture How Interfaces Guide User Behavior?" (WiserUI-Bench), ACL 2026** (https://aclanthology.org/2026.acl-long.2049/ ; arXiv 2505.05026)
- **Data:** 300 real A/B-test UI pairs with known winners (from GoodUI, VWO and ABTest.design) and 684 expert interpretations.
- **Task 1: pick the winner.** The order-invariant **consistent accuracy (CA)** is near chance (25%):
  - best ≈ 34.6% (InternVL-2.5-38B)
  - GPT-5.1 33.3%, Claude 4.5 Sonnet 32.3%, GPT-4o 30.1%
  - **position bias** is severe; e.g., o1 scored 16.6% when the winner was shown first and 97.8% when shown second
- **Task 2: explain why the winner won.** Interpretation recall reached about 64–69% for the best models (GPT-5.1 68.7%, Claude 4.5 Sonnet 67.4%).
- **Implication: today's models cannot predict behavioural outcomes from screenshots.** An LLM preference between two variants is *not* evidence, and certainly not a substitute for an A/B test.
- A 2026 fine-tuned approach trained on human decisions (PerceptUI, arXiv 2606.05697, preprint) raised CA to 44.3%. That is better, but still far from reliable.

#### 2.F.2 Supporting evidence from LLM-as-judge and synthetic-user literature
- **Judge biases.** Zheng et al. 2023 (MT-Bench; https://arxiv.org/abs/2306.05685) identified **position, verbosity and self-enhancement biases** and limited reasoning. Strong judges still reached over 80% agreement with human preferences on chat answers. → Swap orders and control for length.
- **Panels beat single judges.** Verga et al. 2024 (https://arxiv.org/abs/2404.18796) found that a **panel of diverse smaller models** outperformed a single large judge, showed less intra-model bias, and cost over 7× less.
- **Rubric-anchored judging can reach human-level agreement.**
  - Prometheus (https://arxiv.org/abs/2310.08491): when given an explicit **score rubric + reference answer**, the 13B evaluator reached Pearson r = 0.897 with human evaluators across 45 custom rubrics, vs GPT-4 0.882 and ChatGPT 0.392 under the same rubric-based protocol. This shows rubric-anchored judging *can* match humans. It is not a with/without-rubric ablation, so the size of the rubric's own effect is [unverified].
  - G-Eval (https://arxiv.org/abs/2303.16634): **CoT + form-filling** improves alignment and also flags a bias toward LLM-generated text.
- **Synthetic users are not users.** NN/g (2024, https://www.nngroup.com/articles/synthetic-users/) found them:
  - **sycophantic and overly optimistic** — synthetic users claimed to have finished every course, while real users had not
  - better at tree testing than real users (Sauro et al., cited there)
  - so useful only for **desk research and hypothesis generation**, never for decisions

#### 2.F.3 Failure-mode taxonomy (consolidated)
| # | Failure mode | Magnitude in the evidence | Sources |
|---|---|---|---|
| F1 | **Low recall** in single-pass, static-screenshot HE | 21% (Guerino); 35–38% (UX-LLM); 38% (Duan); 41–43% (SBQS) vs expert sets. Up to 73–77% with multi-screen, task-contextual prompting against a GPT-inclusive master set (Zhong) | 2.F.1 (1)(3)(4)(5)(6) |
| F2 | **False positives / hallucinated issues** | ≈17–40% of output; up to 45% in an unverified agent baseline (SUTM) | (1)(3)(4)(5)(6)(8) |
| F2a | …from **assuming invisible interaction** (hover, feedback, validation) | 9/27 FPs (Guerino); the main FP cause in SBQS | (3)(6) |
| F2b | …from **misrecognizing components / OS chrome** | 27–42% of severity-0 items | (5) |
| F2c | …from **ignorance of conventions** | 38–42% of severity-0 items | (5) |
| F2d | …from **vague, generic claims** | 3/27 (Guerino) | (3) |
| F2e | …from **forced quotas** ("list exactly N") | Qualitative (UX-LLM) | (4) |
| F3 | **Duplicates and heuristic-swapping** | GPT-4o 30 duplicates (SBQS); per-screen repeats (Zhong); re-raising dismissed items under a new heuristic (Duan) | (1)(5)(6) |
| F4 | **Heuristic blind spots** | Weak: H3, H6, H7, H9 and cross-screen consistency. Strong: H2, H8 and layout | (3)(5) |
| F5 | **Degradation on improved designs / over iterations** | Accurate 52% → 39%; helpful 49% → 33% | (1) |
| F6 | **Simulated users are too competent and too agreeable** | Completion 100% vs 88%; failure points found 3 vs 10; sycophancy | (7), NN/g |
| F7 | **Cannot predict behavioural outcomes**; position bias | Consistent accuracy ≈ chance on A/B winners | (10) |
| F8 | **Model and vendor variance** | Recall 57–78% across vendors with the same prompt; no dominant judge | (5)(9) |
| F9 | **The ground truth itself is noisy** | Human raters' κ = 0.10–0.53 on LLM suggestions; any-two agreement among experts 5–65% | (1)(4), 2.A.5 |

#### 2.F.4 Mitigations and the evidence for each
| # | Mitigation | What it addresses | Evidence |
|---|---|---|---|
| M1 | **Interaction grounding.** Evaluate the running UI and exercise controls; don't judge static screenshots alone. Gate "done" on coverage of salient controls | F1, F2a | UXBench coverage gate; SUTM traces; Guerino FP analysis; SBQS FP analysis |
| M2 | **Evidence anchoring.** Every finding cites a specific element, screen, state or trace step plus a reproduction cue. **No anchor, no finding** | F2, F2d | SUTM (normalized schema; hallucination 45% → 0.9% in the full pipeline); Guerino generic FPs |
| M3 | **Separate actor and verifier.** A second pass re-checks each candidate against the evidence, then downgrades it or re-simulates | F2 | SUTM precision 0.75 → 0.91 (ISO) and 0.78 → 0.96 (Nielsen), recall roughly unchanged |
| M4 | **Multiple independent samples or a panel, then pool and deduplicate** | F1, F8 | HE needs 3–5 evaluators (Nielsen); PoLL; SBQS union recall .701 vs .409/.433 alone; with-context CW runs κ ≈ 0.63–0.64 |
| M5 | **Measure run-to-run agreement** (any-two agreement or κ). Flag findings that appear in only one run as low-confidence | F8 | Hertzum & Jacobsen metric; Synthetic CW κ tables |
| M6 | **Give full context:** app purpose, persona, task, ordered screen sequence and navigation history. Evaluate flows, not isolated screens | F1, F3, F4 (cross-screen) | Synthetic CW with- vs without-context (OR 5.45–7.5 vs mostly non-significant); Zhong cross-screen misses; UX-LLM inputs |
| M7 | **Rubric anchoring plus expert exemplars:** PURE-style 1–3 step scale, HE 0–4 severity with definitions, few-shot critiques | F2, F8 | UICrit (+55% from expert few-shot/visual prompting); Prometheus (r = .897 with humans under a rubric + reference protocol); PURE α ≥ .667 gate |
| M8 | **Never force a quota of findings.** Allow "no issue found" | F2e | UX-LLM |
| M9 | **Normalize and deduplicate** into one canonical issue per root cause, with all its locations and heuristics attached | F3 | Zhong; SBQS; SUTM normalization |
| M10 | **Keep a dismissal ledger.** Once a human rejects an issue, suppress semantically equivalent re-raises under any heuristic | F3, F5 | Duan heuristic-swapping |
| M11 | **Raise the evidence bar on polished designs and later iterations**, e.g., require a confirmed observation for new low-severity items in round ≥ 2 | F5 | Duan degradation |
| M12 | **Targeted human confirmation:** of all severity ≥ 3 findings and of findings in weak categories (H3/H6/H7/H9, cross-screen consistency, convention-dependent claims) | F2, F4 | Guerino takeaway 5; SBQS hybrid F1 .861; Zhong conventions |
| M13 | **Order-swapped pairwise judgments** with consistent accuracy reported, and **no behavioural-outcome claims without empirical data** | F7 | WiserUI-Bench; Zheng et al. position bias |
| M14 | **Treat simulated users as hypothesis generators.** Explicitly prompt for confusion points; never report their success rates as user metrics | F6 | Synthetic CW; NN/g synthetic users |
| M15 | **Verify fixes by re-running the same persona and task**, with a regression check. Report the verification scope | Fix quality | SUTM (85% pass, 7% regression); RITE (1 − (1 − p)^n) |
| M16 | **Rotate or ensemble across model families**, and re-tune prompts per model | F8 | Zhong cross-platform; UXBench; PoLL |

### 2.G Addenda: severity-scale psychometrics and remote unmoderated testing

#### 2.G.1 Is the 0–4 severity scale a good measurement instrument?
Source (full text read): Herr, Baumgartner & Gross, "Evaluating Severity Rating Scales for Heuristic Evaluation", CHI 2016 Extended Abstracts, https://cml.hci.uni-bamberg.de/~gross/publ/chi16_herr_et_al_severity_rating_scales__proceedings.pdf

**Psychometric critique of Nielsen's 0–4 scale:**
1. **Unbalanced**, which biases ratings toward the side that offers more points.
2. **"0 = not a problem" is not a severity level**, and mixing it in distorts the means.
3. Only **4 severity points**, whereas 5–7 points are optimal for reliability.
4. **Unidimensional**, although severity is multidimensional.

**The proposed alternative: an Individual Factor (IF) scale.** Seven factors, each rated on a 5-point "very low → very high" scale:
1. frequency
2. difficulty to overcome
3. workflow impact
4. persistence
5. frustration
6. market impact
7. **fixing effort**

**Study design:** between-subjects, 103 participants, 32 problem cases, ground truth set by two experts with 20+ years' experience.

**Results** (deviation from ground truth on a 0–100 POMP scale; lower is better):

| Scale | Mean deviation | SD | Rating time |
|---|---|---|---|
| **IF** | **23.4** | **2.5** | about **30% longer** than Nielsen |
| Nielsen | 28.1 | 6.7 | — |
| Practitioner's minor / moderate / major | 39.3 | 8.8 | — |

The Nielsen scale also produced significantly *higher* ratings, which the authors attribute to the "not a problem" option.

**Evidence quality:** a late-breaking work, so the study is small and short. It is consistent with general psychometric advice.

**Consequence for UI-Evaluator:** keep Nielsen's 0–4 as the reported label, for compatibility with the CMU lecture and NN/g. But:
- derive it from separately rated factors: frequency, impact/difficulty, persistence, and optionally workflow impact and frustration
- record **ease of fix / fixing effort as a separate field**, never folded into severity
- record "not a problem" as a **separate validity verdict**, not as severity 0

#### 2.G.2 Remote unmoderated testing
Sources: NN/g, "Remote Usability Tests: Moderated and Unmoderated" (2013), https://www.nngroup.com/articles/remote-usability-tests/ ; NN/g "Usability Testing 101"

**What it is.** The testing platform plays the facilitator: written tasks are delivered automatically, sessions are recorded, and metrics are collected.

**What is lost** compared with moderated testing:
- **no real-time follow-up or probing**
- participants can't get help when stuck
- you don't learn that a session was unusable until it is over
- **quieter think-aloud**, because no one is there to remind participants to keep talking

**When to use it** (NN/g):
- focused questions about **a few specific elements**, or the impact of a minor change
- tight timelines, since sessions can run in parallel
- **not** a broad overall review

**Rules:**
1. Write tasks far enough ahead to **pilot** them, because written instructions must stand entirely on their own ("anything that can be misunderstood will be misunderstood").
2. Practice with the tool.
3. Be reachable by email during the study.
4. **Over-recruit**, to cover no-shows and unusable sessions.

**Measurement note.** Unmoderated sessions showed an evaluator effect similar to moderated ones: 32% vs 33% mean detection (Hertzum et al. 2014, see 2.A.5). The analysis bottleneck is the same for both.

## 3. Cross-source synthesis

### 3.1 Consensus across sources
1. **No single evaluator is reliable, whether human or LLM.**
   - One HE evaluator finds about 35% of problems (Nielsen).
   - Any two evaluators agree on only 5–65% of what they find (Hertzum & Jacobsen).
   - Severity correlations between pairs of evaluators are only about .23–.31.
   - A single LLM pass recovers about 21–43% of an expert set (Guerino, Duan, UX-LLM, SBQS).
   - Every source therefore converges on **multiple independent evaluations followed by consolidation**: Nielsen's 3–5 evaluators, Hertzum's "extra evaluator", SBQS's union F1 of .757–.861, PoLL panels.
2. **Inspection is not user research, and the two are complementary.**
   - HE and user testing find substantially different problem sets (Nielsen 1995; UX-LLM's three-method diagram shows only 9 of 110 issues were found by all three methods).
   - ISO 9241-210 requires user-centred evaluation, and NN/g states HE "cannot replace user research".
   - LLM inspection is a third, partly overlapping lens. All nine LLM papers conclude "complement, not replace".
3. **Findings must be specific, separate, evidence-backed and tied to a principle.** This appears as:
   - Nielsen's "list each problem separately" and "explain why with reference to heuristics"
   - Braun & Clarke's warning against anecdotalism and unsupported claims
   - SUTM's evidence anchors
   - Guerino's "generalized problem" false positives (the failure case)
4. **Severity is multi-factor and must be rated independently after discovery.** The factors are frequency, impact and persistence, plus market impact. Single-rater severities are unreliable (Nielsen, Hertzum, Herr).
5. **Behaviour beats self-report.** Evidence:
   - SUS correlates only r ≈ .24 with performance in the same test
   - about 14% of task failures are still rated "very easy" on the SEQ
   - the aesthetic–usability effect masks problems
   - synthetic users are sycophantic
   - NN/g's attitudinal vs. behavioural dimension
6. **Iterate and verify.** Run small rounds, fix, then re-test. Sources: Nielsen's 3×5 users, RITE's impact and re-fix ratios, ISO 9241-210 principle 4, SUTM's verify-before-reporting. A fix is a hypothesis until it is re-tested; RITE re-fixed 20% of its fixes.
7. **Context is part of the measurement.** Usability exists only for specified users, goals and context (ISO 9241-11). PURE, CW and HEART all start by fixing the user type, the tasks and the goals. LLMs perform measurably better with full task and navigation context (Synthetic CW).
8. **Metrics need goals and triangulation.** Sources: HEART's Goals–Signals–Metrics, Kohavi's OEC chosen in advance, NN/g's "quant answers how many, qual answers why".

### 3.2 Conflicts and proposed resolutions
| # | Conflict | Resolution adopted |
|---|---|---|
| X1 | "5 users are enough" (Nielsen, λ = .31) vs. Faulkner 2003 (5 users found anywhere from ~55% to ~100% of problems) and Spool & Schroeder (far below 85% on large sites) | Use 5 per *iteration* per homogeneous user group in **formative** work, and plan several iterations. Never claim a coverage percentage. Increase n, or estimate p after 2–4 sessions, for complex or heterogeneous products (HCI-041/042). |
| X2 | 3–5 evaluators "find most problems" vs. the evaluator effect, which shows even pooled evaluators miss problems and disagree | Pool evaluators **and** reduce the three vaguenesses: fix the tasks and goals, the procedure, and explicit problem criteria. For LLMs, cheap re-runs are **correlated**, so diversify the model family, the prompt framing and the input modality instead of re-sampling one setup (HCI-027). |
| X3 | LLM recall of 73–77%, beating 5 experts (Zhong 2025), vs. 21–43% in four other studies | The difference comes from ground-truth construction (Zhong's master set included GPT-4's own output), a weak human baseline ($30 freelancers), and richer multi-screen context. **Planning assumption: a single LLM pass recalls roughly 35–45% of an expert issue set at roughly 60–83% precision.** Treat higher figures as optimistic. |
| X4 | Concurrent think-aloud is reactive (van den Haak 2003) vs. not reactive (Alhadreti & Mayhew 2018) | CTA by default for problem discovery. Use RTA or silent sessions when time-on-task is a measured outcome or the tasks are complex (HCI-047). |
| X5 | Strict Ericsson & Simon ("keep talking") vs. Boren & Ramey (acknowledgment tokens) moderation | Both find the same problems, but B&R improves task performance (Krahmer & Ummelen). **Keep the protocol constant within any comparison.** Use E&S-strict when collecting metrics. |
| X6 | Nielsen's 0–4 scale (industry standard) vs. Herr et al.'s multi-factor scale (more accurate) | Rate the factors separately, then derive the 0–4 label. Keep "not a problem" as a separate validity verdict, and fixing effort as a separate field (HCI-010/011). |
| X7 | Which heuristic set to use: Nielsen, Gerhardt-Powals, ISO 9241-110, Tognazzini or Shneiderman | No significant effectiveness difference was found between Nielsen and Gerhardt-Powals (Hvannberg 2007). Use **Nielsen H1–H10 as the primary taxonomy** (shared vocabulary, CMU lecture), plus three add-ons:<br>• ISO 9241-110 #1 (task suitability) and #7 (engagement), which fill Nielsen's utility gap<br>• Gerhardt-Powals data-fusion principles for dashboards<br>• HAX for AI features<br>Keep a crosswalk table in the skill. |
| X8 | Quantitative sample size: 20 (NN/g 2006) vs. 40 (NN/g 2021) | Derive n from the target margin of error. The default is **40 per condition for binary metrics** (±15%, 95% confidence) (HCI-043). |
| X9 | "Laws of UX" are cited as laws, but their evidence ranges from robust (Fitts) to failed replication (Zeigarnik memory effect) | Grade every law A–D. Only grade A or B laws may justify a finding (HCI-074). |
| X10 | Synthetic-user vendors vs. NN/g and Synthetic CW | Simulated users are hypothesis generators and failure-point predictors (with context). They are never a source of behavioural or satisfaction metrics (HCI-023/036). |
| X11 | LLM evaluation is "stable over time" (Zhong) vs. "degrades over iterations" (Duan) | These are different properties. Run-to-run **stability** on the same UI does not imply **validity** on an improved UI. Measure both, and raise the evidence bar on later iterations (HCI-029). |
| X12 | Tognazzini's 50 ms acknowledgment vs. NN/g's 0.1 s "instantaneous" limit | Use NN/g's 0.1 s as the pass/fail threshold, since it is research-cited. Treat 50 ms as a stretch target for click acknowledgment (HCI-067). |

### 3.3 Gaps in the evidence
1. **No discovery curve for LLM evaluators.** There is no λ and no inter-run correlation for LLM runs, so "how many runs or models are enough" is unknown. Our own benchmark must estimate it (Open Q1).
2. **Missing-element and utility problems.** Nielsen (1995) notes that missing elements are hard to find on paper prototypes. No LLM study measures detection of "something missing" or of task-fit (ISO #1) problems.
3. **LLM severity calibration** against consensus severity is untested beyond Guerino's coarse "no significant difference".
4. **Fix verification without users.** Only workshop-level evidence exists (SUTM). RITE's binomial verification requires real users.
5. **Aesthetic quality and distinctiveness** (UI-Evaluator's anti-"AI slop" goal) is outside classic HCI evaluation. H8 "minimalist" findings from LLMs were the *least accurate* category in Duan et al., which is a warning against using H8 as a proxy for aesthetic quality.
6. **Cultural validity.** NPS norms differ by country, and HAX G5/G6 social-norm checks were under-detected. LLM conventions are likely Western-centric (inferred; not tested in the sources).
7. **Primary sources not reached:** Nielsen 1992's 22/41/60% figures, the full Bangor 2009 adjective table, the KLM paper's ~21% error figure, the full text of Wharton et al. 1994, and the details of PAIR's 2025 update. All are marked in the notes.

### 3.4 Method-selection decision rules (operational)
| Question the team is asking | Method | Minimum procedure | Output |
|---|---|---|---|
| "What general usability problems does this UI have?" | **Heuristic evaluation** | ≥ 3 independent passes or evaluators; ≥ 2 passes each; one problem per record; severity rated later by ≥ 3 raters | Canonical issue list + severity |
| "Can a first-time user figure out this new or unfamiliar flow?" | **Cognitive walkthrough** (Wharton 4-question, or Spencer 2-question when time is short) | Persona + task + correct action sequence first; per-step pass/fail; continue past failures | Failure points with the missing knowledge or feedback |
| "How much friction do our fundamental tasks have, and is it trending down?" | **PURE** | Target user; ≤ ~10–20 fundamental tasks; happy path; 3 silent raters; α ≥ .667; consensus | Step, task and product scores with colors |
| "Which of two flows is faster for experts?" | **KLM** | Operator sequence; standard times; consistent M rules | Seconds per task (comparative only) |
| "Do real users succeed, and why not?" | **Formative usability test** with think-aloud | 5 users per group per round; clue-free tasks; CTA | Observed problems with frequency (k/n) |
| "How good is it, and is it better than before or than a competitor?" | **Summative benchmark** | n from margin of error (default 40); success with CI, time (geometric mean), SEQ/SUS | Metrics with CIs vs. benchmarks (78% success, SEQ 5.5, SUS 68) |
| "Will this change improve behaviour at scale?" | **A/B test** | OEC and guardrails set in advance; power analysis; SRM check; ≥ 1–2 weeks; no peeking | Causal effect estimate |
| "How is the launched product doing over time?" | **HEART** via Goals–Signals–Metrics | Per-category include/exclude decision; normalized metrics | Dashboard |
| "Is our AI feature well designed?" | **HAX audit + PAIR error review** | 18 guidelines, recording both applications and violations | AI-specific issue list |
| "What are users telling us?" (support tickets, reviews, interviews) | **Thematic analysis or affinity diagramming** | Six phases; counts plus extracts; no anecdotalism | Themes with prevalence |

**LLM-only use** is permitted for the first four rows as a first-pass triage, as long as every output is labelled with an evidence level.

**Evidence levels** for every finding:
- **E0**: LLM-predicted
- **E1**: LLM-predicted, verified by a separate check, and found in multiple runs
- **E2**: confirmed by a human expert
- **E3**: observed with users (k of n)
- **E4**: measured with a confidence interval
- **E5**: causally established by a randomized experiment

### 3.5 Unified finding record (template)
This record merges the HE report fields from the CMU lecture with NN/g, Herr, SUTM and PURE:
- `id`, `title`
- `scope`: persona, task, device/context, UI version
- `evidence_anchor`: screen or state, element selector or bounding box, trace step, screenshot crop, and reproduction steps
- `description`: what happens vs. what the user needs or expects (one problem only)
- `principles`: Nielsen H#, optionally ISO 9241-110 principle, Gestalt law or HAX G#
- `found_by`: method, evaluator or run ids, and k/n detection count
- `severity_factors`: frequency, impact, persistence, and optionally business impact
- `severity_0_4`: the derived label, plus each rater's rating and the spread
- `validity`: confirmed, needs-verification, trade-off, or not-a-problem
- `ease_of_fix`: separate effort estimate
- `recommendation`: plus its rationale and the principle that motivates it
- `evidence_level`: E0–E5
- `fix_verification`: re-run result, confidence 1 − (1 − p)^n where users are involved, and regression check
- `status`: open / fixed / verified / won't-fix / dismissed (dismissed items go into the ledger)

## 4. ADOPT LIST

Categories: principle / process / template / check / metric / decision rule. "Verify" says how an agent or reviewer can confirm compliance. Full citations for every source are in §2; the § numbers point there.

| ID | Practice / rule (testable wording) | Category | How to verify | Source(s) | Note |
|---|---|---|---|---|---|
| HCI-001 | [Scope] Every evaluation declares the target user group or persona, the top tasks, the device/context and the UI version. A finding without a declared context is invalid. | template | Manual review: report header fields present | ISO 9241-11:2018 defs via ISO/FDIS 9241-210 preview (§2.A.11); NN/g HE scope (https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/) | Usability is only defined for specified users, goals and context |
| HCI-002 | [HE] Run ≥ 3 independent inspection passes (human evaluators or isolated LLM runs). No pass may see another's findings before consolidation. | process | Run metadata shows separate contexts and isolation | Nielsen theory (https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/); Hertzum & Jacobsen 2003 | A single evaluator finds ~35% |
| HCI-003 | [HE] Each pass inspects scope twice: pass 1 learns the flow (no findings recorded); pass 2 inspects element by element. | process | Trace shows 2 traversals | Nielsen theory; NN/g 2023 | Lecture: "≥2 passes" |
| HCI-004 | [HE] One record = one problem. An element with k problems yields k records, each with its own principle reference. Combined statements are split before consolidation. | check | Schema lint: a description containing multiple problem clauses is flagged | Nielsen theory; Duan et al. CHI'24 (72 → 91 after splitting) | Lecture: "one listing per violation" |
| HCI-005 | [HE] Every finding names ≥ 1 principle (Nielsen H1–H10 primary; ISO 9241-110, Gestalt or HAX optional) and states why it harms the user. Preference-only remarks are rejected. | template | Schema validation of the `principles` and `description` fields | Nielsen theory; NN/g 10 heuristics | — |
| HCI-006 | [Evidence] Every finding carries a resolvable evidence anchor: screen/state id + element selector or bbox + (for interactive issues) the trace step that reproduces it. Findings without an anchor are not reported. | check | DOM: the selector resolves; replaying the trace reproduces the state | SUTM (CEUR Vol-4249 p.4); Guerino 2025 FP taxonomy; UXBench | Main hallucination control |
| HCI-007 | [Evidence] Claims about interactive behaviour (feedback, hover, validation, loading, error, confirmation) must be confirmed by performing the interaction. If not exercised, the claim is labelled "hypothesis" and excluded from the defect list. | decision rule | Browser trace contains the action and the observed result | Guerino 2025 (9/27 FPs were "problem assumptions"); Campos 2025; UXBench | — |
| HCI-008 | [Evidence] Coverage gate: a run may not finish until every salient interactive control in scope (from a DOM inventory) has been exercised or marked out of scope. | check | Ratio of DOM inventory to trace coverage ≥ threshold | UXBench §3.4 (arXiv 2606.16262) | Threshold to be calibrated (Open Q2) |
| HCI-009 | [Severity] Severity is rated in a separate step after consolidation, by ≥ 3 independent raters on the full problem list. Report the mean and spread. A single-rater severity is "provisional". | process | ≥ 3 ratings stored per finding | NN/g severity (https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/); Hertzum & Jacobsen (Spearman .23–.31) | Nielsen: the mean of 3 is satisfactory |
| HCI-010 | [Severity] Rate frequency, impact (difficulty to overcome) and persistence separately (+ business impact if known), then derive the 0–4 label. "Not a problem" is a validity verdict, not severity 0. | template | Schema: factor fields present; validity is a separate field | NN/g severity; Herr et al. CHI'16 EA | IF scale deviated least from ground truth (23.4 vs 28.1) |
| HCI-011 | [Severity] Record ease of fix (fixing effort) as its own field. Never fold it into severity. Priority = f(severity, effort). | template | Schema field present | Herr et al. 2016 (fixing-effort factor); CMU lecture HE fields | — |
| HCI-012 | [Severity] Release gate: any open severity-4 finding blocks "done". Severity-3 findings need explicit sign-off to remain open. | decision rule | Status check before completion | NN/g severity definitions | — |
| HCI-013 | [HE] Report a principle violation with a documented, justified trade-off (e.g., a mobile hamburger menu) as "trade-off — verify with users", not as a defect. | decision rule | `validity` = trade-off with rationale | NN/g 2023 hamburger example; Nielsen "don't bet on exceptions" | — |
| HCI-014 | [Consolidation] Merge all passes into canonical issues (one per root cause) listing every location and principle. Merge duplicates across screens and across heuristics. | process | Dedup report; no two open issues share a root-cause signature | NN/g affinity (https://www.nngroup.com/articles/affinity-diagram/); Zhong 2025; Campos 2025 | LLMs duplicate per screen and per heuristic |
| HCI-015 | [Reliability] Report any-two agreement = mean over pairs of \|Pi∩Pj\| / \|Pi∪Pj\| across passes. Flag a finding seen in only 1 of n passes as low-confidence. | metric | Computed from the pass outputs | Hertzum & Jacobsen 2003 (https://mortenhertzum.dk/publ/IJHCI2003.pdf) | Human baseline 5–65% |
| HCI-016 | [Reporting] Never claim completeness. State the expected coverage (one pass ≈ ⅓ of problems; LLM single pass ≈ 35–45% of an expert set). | decision rule | Report-language lint (no "all issues" claims) | Nielsen & Landauer 1993; Guerino, Duan, UX-LLM, Campos | — |
| HCI-017 | [Reporting] Include what works well and must be preserved. Generate redesign ideas only after evaluation, never during it. | template | Report has a "strengths" section; no design changes inside the evaluation trace | Nielsen theory (debriefing); Spencer 2000 ground rule 1 | — |
| HCI-018 | [CW] Use cognitive walkthrough for learnability of new or unfamiliar flows. Skip it for flows built entirely from ubiquitous patterns. | decision rule | Plan justification | NN/g CW 2022 (https://www.nngroup.com/articles/cognitive-walkthroughs/) | — |
| HCI-019 | [CW] Before walking, fix the persona (prior knowledge), the task and the complete correct action sequence. The evaluator must not discover the path during the walk. | process | The CW record contains all three before step 1 | Lewis & Rieman ch. 4 (http://hcibib.org/tcuid/chap-4.html); NN/g workshop | Common mistake #1 |
| HCI-020 | [CW] At each step, answer Wharton's 4 questions (right goal? notice action? associate action with goal? see progress?) with a success or failure story. Any "no" fails the step. After a failure, record it and continue as if the step had succeeded. | process | Per-step records with 4 answers + rationale | Wharton et al. 1994 via Spencer 2000 & UXPA BoK; NN/g workshop (https://www.nngroup.com/articles/cognitive-walkthrough-workshop/) | Lecture: 4 questions per step |
| HCI-021 | [CW] The streamlined 2-question variant is allowed for speed, but each failure must name the missing knowledge or missing feedback. | process | Failure records name a cause | Spencer 2000 (https://facweb.cdm.depaul.edu/cmiller/eval/p353-spencer.pdf) | Streamlined CW trades granularity for coverage |
| HCI-022 | [CW-LLM] LLM walkthroughs carry the full navigation history (prior screens + actions) and are explicitly asked to flag potential failure points at each step. Context-free single-screen judgments are not used for CW. | process | Prompt/trace includes the history; per-step failure ratings exist | Zhong et al. CHI'26 (arXiv 2512.03568): with context OR 5.45–7.5; without context, weak and inconsistent | — |
| HCI-023 | [CW-LLM] Never report LLM task completion as predicted user success. LLM-CW output is a set of failure-point hypotheses. | decision rule | Report-language lint | Zhong CHI'26 (100% vs 88% completion; 3 vs 10 failure points) | — |
| HCI-024 | [Tasks] Task prompts for evaluators and simulated users contain all needed data but no UI labels or step instructions. | check | Diff the task text against the UI string inventory | NN/g task scenarios (https://www.nngroup.com/articles/task-scenarios-usability-testing/); Sears & Hess 1998 | Clued tasks hide findability problems |
| HCI-025 | [LLM] Never ask for a fixed number of findings. "No issues found" is valid output. | check | Prompt lint | UX-LLM (arXiv 2411.00634) | A quota caused fabrication |
| HCI-026 | [LLM] Separate actor and verifier: a second pass re-checks every candidate against the evidence (element exists, state reproduced, persona constraints respected) and downgrades or re-runs anything that fails. | process | Verifier log per finding | SUTM (precision .75 → .91 ISO; hallucination 45% → 0.9%) | Workshop-level evidence |
| HCI-027 | [LLM] Inspect with ≥ 2 model families (or ≥ 3 diversified runs) and pool the results. Report each model's unique contribution. | process | Run metadata | Verga et al. 2024 PoLL; Zhong 2025 (57–78% across vendors); UXBench; Campos 2025 (union recall .701) | — |
| HCI-028 | [LLM] Keep a dismissal ledger. A finding a human rejected is not re-raised under any heuristic unless new evidence appears. | check | Semantic match of new findings against the ledger | Duan et al. CHI'24 (heuristic-swapping) | — |
| HCI-029 | [LLM] In iteration ≥ 2, a new LLM finding of severity ≤ 2 needs reproduction in ≥ 2 independent passes or human confirmation before it is reported. | decision rule | Pass counts per finding | Duan CHI'24 (accurate 52% → 39%; helpful 49% → 33% over rounds) | — |
| HCI-030 | [LLM] Human confirmation is required for: every severity ≥ 3 finding; findings under H3, H6, H7 or H9; cross-screen consistency findings; any claim depending on domain or platform conventions. | decision rule | `confirmed_by` field set | Guerino 2025; Zhong 2025 (conventions); Campos 2025 (hybrid F1 .861) | — |
| HCI-031 | [LLM] Inspection input includes app purpose, persona, task and the ordered multi-screen flow. Run a dedicated cross-screen consistency pass. | process | Prompt/trace check | Zhong 2025 (LLM caught 3/7 and 3/6 cross-screen issues vs 6/7 and 5/6 for experts); UX-LLM inputs | — |
| HCI-032 | [LLM] Mask or label OS/browser chrome (status bars, notches, browser UI) before VLM inspection. | check | Preprocessing step present | Zhong 2025 (27–42% of severity-0 items came from misrecognized components) | — |
| HCI-033 | [LLM] LLM ratings use anchored rubrics (PURE 1–3; severity factors with definitions) plus few-shot expert exemplars. Free-form scores are not used. | template | Prompt contains the rubric and exemplars | NN/g PURE; Prometheus (r = .897 with rubric); UICrit (+55%) | — |
| HCI-034 | [LLM] Run pairwise design comparisons in both orders and keep only order-consistent preferences. Never present an LLM preference as a predicted A/B outcome. | check | Both orders logged | WiserUI-Bench ACL'26 (consistent accuracy ≈ chance); Zheng et al. 2023 (position bias) | — |
| HCI-035 | [Reporting] Label every finding with an evidence level: E0 LLM-predicted, E1 verified + multi-run, E2 expert-confirmed, E3 observed with users, E4 measured with CI, E5 causal. Only E3+ may be phrased as "users struggle with…". | template | Schema + language lint | Synthesis §3.4; NN/g synthetic users | — |
| HCI-036 | [LLM] Synthetic users and personas are used only to generate hypotheses and cover edge personas. Their SUS/SEQ/satisfaction outputs are never reported as metrics. | decision rule | Report lint | NN/g synthetic users (https://www.nngroup.com/articles/synthetic-users/); Zhong CHI'26 | Sycophantic; overly competent |
| HCI-037 | [Fix loop] Triage each round RITE-style: (1) obvious cause, quick fix → fix now; (2) obvious cause, slow fix → start the fix; (3) unknown cause or (4) possible method artifact → gather more evidence before fixing. | process | `triage_category` field | Medlock et al. 2002 (https://www.jpattonassociates.com/wp-content/uploads/2015/04/rite_method.pdf) | — |
| HCI-038 | [Fix loop] Fix one issue or root-cause cluster at a time, then re-run the exact task/persona that exposed it. "Verified" = the issue no longer reproduces AND no new severity ≥ 3 regression appears in the exercised paths. | check | Before/after traces + regression scan | RITE; SUTM verify-before-report (85% pass, 7% regression) | Report the verification scope |
| HCI-039 | [Fix loop] When verifying with real users, report fix confidence = 1 − (1 − p)^n over n clean sessions (e.g., 6 clean → 88% at p = .30, 47% at p = .10). | metric | Computed | Medlock et al. 2002 | — |
| HCI-040 | [Fix loop] Track impact ratio (fixed ÷ found) and re-fix ratio (re-fixes ÷ all fixes). | metric | Issue-tracker computation | Medlock et al. 2002 (97% and 20% in the case study) | — |
| HCI-041 | [Testing] Formative tests use ~5 representative users per distinct group per iteration (3–4 each for two groups; ≥ 3 each for three or more), across several iterations. Raise n for complex or heterogeneous products. | decision rule | Test plan | Nielsen 2000/2012 (https://www.nngroup.com/articles/how-many-test-users/); Faulkner 2003 (via HFI) | 5 users found 55–~100% (Faulkner) |
| HCI-042 | [Testing] Plan n with P(detect) = 1 − (1 − p)^n (e.g., 12 users for an 85% chance at p = .15). Estimate p from the problem overlap after 2–4 sessions. | metric | Calculator in the skill | Nielsen & Landauer; Sauro & Lewis via HFI (https://www.humanfactors.com/newsletters/how_many_test_participants.asp) | — |
| HCI-043 | [Testing] Choose quantitative-benchmark n from the target margin of error. Default 40 per condition for binary metrics (±15%, 95%). Never report quantitative metrics or NPS from a 5-user formative test. | decision rule | Test plan | NN/g 2021 (https://www.nngroup.com/articles/summary-quant-sample-sizes/); NN/g NPS | — |
| HCI-044 | [Testing] The test plan contains: objectives, research questions, participant profile, method, tasks with success criteria, environment, moderator role, measures, and report plan. | template | Plan schema check | Rubin & Chisnell 2008 ch. 5 (secondary: book ToC) | Lecture: objectives → tasks → data → analysis |
| HCI-045 | [Testing] Every task scenario is realistic, actionable ("do", not "say how") and clue-free, with predefined success criteria. | check | Task lint | NN/g task scenarios | — |
| HCI-046 | [Testing] Moderators use only neutral probes (echo, boomerang, Columbo). Every intervention is logged, and the affected segment is excluded from metrics. | process | Session log review | NN/g talking-to-users (https://www.nngroup.com/articles/talking-to-users/); NN/g thinking-aloud | — |
| HCI-047 | [Testing] Use concurrent think-aloud by default for formative work. Use retrospective or silent sessions when time-on-task is measured. Keep the moderation protocol identical across compared conditions. | decision rule | Plan | van den Haak 2003; Alhadreti & Mayhew 2018; Krahmer & Ummelen 2004 | — |
| HCI-048 | [Testing] Use remote unmoderated tests only for focused questions on a few elements. Pilot every written task and over-recruit. | decision rule | Plan | NN/g remote (https://www.nngroup.com/articles/remote-usability-tests/) | — |
| HCI-049 | [Metric] Task success is scored binary against predefined criteria and reported with a 95% CI. Benchmark: median 78% completion. | metric | Computed | MeasuringU (https://measuringu.com/task-completion/) | — |
| HCI-050 | [Metric] For n < 25, report time-on-task as the geometric mean, with a CI computed on log times. Report success-only and all-attempt times separately. | metric | Computed | MeasuringU (https://measuringu.com/average-times/) | 13% less error and 23% less bias than the median |
| HCI-051 | [Metric] Ask SEQ (1–7) after every task; benchmark mean ≈ 5.5. Ask "why" whenever SEQ < 5. Never use SEQ as the sole outcome. | metric | Computed | MeasuringU (https://measuringu.com/seq10/) | 14% of failures are rated "easy" |
| HCI-052 | [Metric] Score SUS as Σ[(odd − 1) + (5 − even)] × 2.5. Interpret against mean 68 and the Sauro–Lewis grades (A ≥ 80.8; F ≤ 51.6). Report a CI. Never call it a percentage or treat it as diagnostic. | metric | Computed | MeasuringU (https://measuringu.com/sus/, https://measuringu.com/interpret-sus-score/) | SUS–performance correlation r ≈ .24 |
| HCI-053 | [Metric] Use UMUX-Lite when brevity is needed. SUS-equivalent = 0.65 × ((i1 + i2 − 2) × 100/12) + 22.9. | metric | Computed | MeasuringU (https://measuringu.com/umux-lite/) | Item 1 also checks usefulness |
| HCI-054 | [Metric] Use NASA-TLX for high-workload expert tools: 6 subscales scored 0–100 in steps of 5; weighted score = Σ(rating × weight) / 15 from 15 pairwise comparisons (declare if raw-TLX is used instead). | metric | Computed | NASA TLX package (https://ntrs.nasa.gov/api/citations/20000021488/downloads/20000021488.pdf) | — |
| HCI-055 | [Metric] NPS is never the acceptance criterion for a UI fix and is never reported for small n. | decision rule | Report lint | NN/g NPS (https://www.nngroup.com/articles/nps-ux/) | — |
| HCI-056 | [Metric] When behavioural and self-report data conflict, the behavioural data decide (e.g., a failed task rated "easy" is still a failure). | decision rule | Manual review | NN/g which-methods; NN/g aesthetic-usability; MeasuringU SEQ/SUS | — |
| HCI-057 | [Feedback] Analyse ingested user feedback with thematic analysis (6 phases) or affinity diagramming. Each theme reports prevalence k/N and ≥ 2 supporting extracts. A single vivid quote cannot create a theme. | check | Analysis artifact review | Braun & Clarke 2006 (15-point checklist); NN/g affinity | — |
| HCI-058 | [PURE] Score fundamental tasks PURE-style: a step begins when the system presents options and ends when the user acts expecting a significant response. Rate 1–3 per step for the declared user. Task score = sum; colour = worst step. ≥ 3 silent raters; Krippendorff's α ≥ .667, otherwise recalibrate; final scores by consensus, not averaging. | metric | Computed scorecard + α | NN/g PURE (https://www.nngroup.com/articles/pure-method/) | Validity vs SEQ r ≈ .5, vs SUS r ≈ .4 |
| HCI-059 | [KLM] Compare expert execution time of alternative flows with KLM: K = 0.28 s, P = 1.1 s, B = 0.1 s, H = 0.4 s, M = 1.2 s. Place M operators by consistent rules. Compute novice and expert variants. | metric | Computed from the action sequence | Kieras 2001 (https://web.eecs.umich.edu/~kieras/docs/GOMS/KLM.pdf) | Comparative only; error-free experts |
| HCI-060 | [A/B] Pre-register the OEC and guardrails. n per variant ≈ 16σ²/Δ² (80% power) or 21σ²/Δ² (90%). Run ≥ 1–2 full weeks and analyse new users separately for novelty/primacy. | process | Experiment spec review | Kohavi et al. 2009 (https://ai.stanford.edu/~ronnyk/2009controlledExperimentsOnTheWebSurvey.pdf) | — |
| HCI-061 | [A/B] Run an SRM chi-square check on every experiment. An SRM invalidates the results until the root cause is found. | check | Computed | Fabijan et al. KDD'19 (https://exp-platform.com/Documents/2019_KDDFabijanGupchupFuptaOmhoverVermeerDmitriev.pdf) | ~6% of Microsoft experiments had an SRM |
| HCI-062 | [A/B] No peeking: use a fixed horizon or always-valid sequential inference. | decision rule | Analysis plan | Johari et al. (arXiv 1512.04922) | Type I error can rise ~5× |
| HCI-063 | [A/B] Twyman's law: a surprisingly large effect triggers an instrumentation and bug investigation before it is accepted. | decision rule | Manual | Kohavi et al. KDD'14 (https://exp-platform.com/Documents/2014%20experimentersRulesOfThumb.pdf) | — |
| HCI-064 | [Causality] Use causal language ("X caused Y") only for randomized experiments. Report before/after or observational analytics as association, listing candidate confounds. | decision rule | Report-language lint | Mill via Shadish et al. (https://pmc.ncbi.nlm.nih.gov/articles/PMC2957016/); Kohavi 2009 | Lecture: correlation ≠ causation |
| HCI-065 | [Metrics] Define post-launch UX metrics with Goals → Signals → Metrics across HEART. Include or exclude each category explicitly, and normalize per user. | template | Metric spec review | Rodden et al. CHI'10 (https://research.google.com/pubs/archive/36299.pdf) | — |
| HCI-066 | [Mixing] Every quantitative anomaly gets a qualitative probe (replay, think-aloud or walkthrough of that step). Every qualitative finding that is a candidate for priority gets a frequency estimate. | process | Report cross-links | NN/g which-methods (https://www.nngroup.com/articles/which-ux-research-methods/); Rodden 2010; Kohavi 2009 | — |
| HCI-067 | [UI check] Visible acknowledgment of a user action within ≤ 0.1 s. Operations > 1 s show a progress indicator: looped spinner for ~2–10 s; percent-done plus a cancel/interrupt control for ≥ 10 s. No static "Loading…"-only indicators. | check | Performance trace: time to first visual change; DOM check for progress/cancel | NN/g response times (https://www.nngroup.com/articles/response-times-3-important-limits/); NN/g progress indicators; Tog (≤ 50 ms stretch) | — |
| HCI-068 | [UI check] Colour is never the only carrier of meaning; every colour-coded state has a secondary cue (text, icon, shape, position). | check | Screenshot/DOM: states differ in more than hue | Tognazzini (Color) | Pair with WCAG 1.4.1 (other research note) |
| HCI-069 | [UI check] Every consequential action offers undo, cancel or exit. Destructive actions are either undoable or confirmed. | check | Interaction test | Nielsen H3/H5; Shneiderman rules 5–6; ISO 9241-110 controllability & use-error robustness | — |
| HCI-070 | [UI check] Error messages are plain language (no raw codes), say what went wrong and how to fix it, are visually distinct, and keep valid input already entered. | check | Trigger errors; inspect DOM/text | Nielsen H9; Shneiderman rule 5 | — |
| HCI-071 | [UI check] No task requires remembering information from a previous screen; field labels stay visible (no placeholder-only labels). | check | DOM inspection + task walk | Nielsen H6; Shneiderman rule 8; NN/g short-term memory | — |
| HCI-072 | [Rule hygiene] Do not flag menus or lists only for exceeding "7 ± 2" items; flag only designs that rely on memory. | decision rule | Report lint | NN/g STM article; Cowan 2001 | Common misapplication |
| HCI-073 | [UI check] Spacing between groups is larger than spacing within groups; related controls share proximity or a container; elements that look identical behave identically. | check | DOM geometry analysis | NN/g Gestalt articles (proximity, similarity, common region); Tognazzini (consistency) | — |
| HCI-074 | [Rule hygiene] Only grade A or B "laws of UX" (Fitts, Hick in choice tasks, Gestalt, peak-end, von Restorff, serial position, goal-gradient) may justify a finding. C/D items (Zeigarnik memory claim, Doherty 400 ms, unconditional choice overload, Pareto, Parkinson, Tesler, Postel, Jakob) cannot be the sole justification. | decision rule | Report lint against the grade table (§2.A.14) | Ghibellini & Meier 2025; Scheibehenne 2010 / Chernev 2015; Alaybek 2022; etc. | — |
| HCI-075 | [AI features] Audit AI features against HAX G1–G18, recording both applications and violations. Run explicit prompted checks for G5/G6 (norms, bias) and G11 (explain why). Classify each failure with PAIR's taxonomy (user / system / context / background) and require a path forward. | template | Checklist + DOM/interaction | Amershi et al. CHI'19 (Microsoft PDF); PAIR guidebook | G11 had among the most violations |
| HCI-076 | [Utility] Every audit includes a task-suitability check: can the declared top tasks actually be completed with what the UI offers? Nielsen's 10 do not cover this. | check | Task walk per top task | ISO 9241-110 #1 via Molich (https://www.dialogdesign.dk/isos-dialogue-principles-2019/) | Fills the utility gap |
| HCI-077 | [Severity → workload] Over-long problem lists are dominated by minor issues. Present findings sorted by severity, then frequency, and cap the "fix now" queue at items with severity ≥ 3 or quick category-1 fixes. | decision rule | Report ordering check | Nielsen 1995 (59 major vs 152 minor); RITE triage | Keeps the one-at-a-time fix loop focused |
| HCI-078 | [Testing hygiene] Aesthetic-usability guard: positive comments about visuals do not offset observed task failures, and visual redesigns are re-tested against the previous version. | decision rule | Manual | NN/g aesthetic-usability (https://www.nngroup.com/articles/aesthetic-usability-effect/); Tognazzini (Aesthetics) | — |

## 5. Open questions

1. **How many LLM runs or models make an "evaluator panel"?** No source estimates λ (the single-pass detection rate) or the correlation between runs for LLM evaluators.
   - *Proposal:* build a seeded-defect benchmark from our own fixtures plus human-labelled issues.
   - Fit Found(i) = N(1 − (1 − λ)^i) separately for (a) re-runs of one model and (b) a mixed-model panel.
   - Use the result to set the default for HCI-002/027.
2. **Coverage-gate threshold (HCI-008).** UXBench defines the gate qualitatively. What share of salient controls must be exercised before a report is allowed, and how should "salient" be computed from the DOM?
3. **Severity calibration for LLMs.** Do LLM factor-based severities (HCI-010) match expert consensus better than direct 0–4 ratings, as Herr et al. found for humans? This is untested.
4. **Can an LLM find "something missing" and utility (task-fit) problems?** No study measures it. HCI-076 is a procedural safeguard, not validated detection.
5. **Fix verification without users.** SUTM's 85% pass / 7% regression comes from a workshop paper. What re-run protocol (personas × tasks × runs) gives an acceptable false-"verified" rate? RITE's binomial confidence applies only to real users.
6. **Aesthetic distinctiveness vs. H8 "minimalist" findings.** LLM H8 findings were the least accurate category in Duan et al. How should UI-Evaluator stop H8 critiques from pushing designs toward generic "AI slop" minimalism? Coordinate with the design-quality research note.
7. **Simulated-user realism.** Can prompting for exploration or memory limits (Synthetic CW §6) make LLM walkers produce human-like failure points without fine-tuning? PerceptUI suggests training on human decisions helps (WiserUI-Bench consistent accuracy 44%), but that requires data we do not have.
8. **Unverified primary sources**, to recheck if access becomes possible:
   - the Nielsen 1992 novice/specialist/double-expert detection rates (22/41/60%)
   - the full Bangor et al. 2009 adjective-mean table
   - the ~21% KLM prediction error (Card, Moran & Newell 1980)
   - the full text of Wharton et al. 1994
   - details of the 2025 PAIR Guidebook update
   - the Faulkner 2003 primary tables (the 55%/82% minimums came via HFI)
9. **Model drift.** All LLM numbers above are tied to specific models (GPT-4/4o, Gemini 1.5–3.1, Claude 3.5–4.6, GPT-5.x). How often should UI-Evaluator re-benchmark its own evaluator? Zhong found 3-month stability for one model, but vendor variance is large.
10. **ISO licensing.** ISO 9241-110/-11/-210 text is paywalled. The skill must paraphrase principle definitions (as done here, via Molich's licensed summary and the official preview) rather than quote the standards.
