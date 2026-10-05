# Research notes — the evidence base

These eleven notes are the evidence the framework is built on. They were written between 2026-10-01 and 2026-10-02 from **primary sources**: repository source code and issue trackers, official design-system token sources, W3C specifications, peer-reviewed papers, and vendor documentation read in full. Every note ends with a numbered **adopt list**: testable practices with their sources and licence notes. Together the notes hold **592 adopt items**. The framework cites them in square brackets (e.g. `[CRAFT-018]`), and [TRACEABILITY](../framework/TRACEABILITY.md) records where each one is implemented, or why it was rejected.

## The notes

| # | Note | Scope | Adopt IDs | Size |
|---|---|---|---|---|
| 00 | [Landscape survey](00-landscape-survey.md) | Is there already a skill like UI-Evaluator? The closest projects scored against the CMU lecture checklist, feedback-intake tools, research prototypes, LLM-evaluator reliability headlines, and the gaps to close | — | 1.1k words |
| 01 | [Impeccable and Anthropic's frontend-design guidance](01-impeccable-and-anthropic-frontend-design.md) | The most developed design skill (impeccable v4.4: modes, context files, concept-seed roll, 61 detector rules, critique and finish-review loops) and Anthropic's skill, blog, harness study and model prompting docs | IMP-001…062 | 19k words |
| 02 | [Design-skill landscape](02-design-skills-landscape.md) | Creation-side skills: ui-ux-pro-max, Vercel guidelines, interface-design, wondelai, ui-craft, designer-skills, taste-skill, Emil Kowalski, hallmark, Google's DESIGN.md format, ibelick and others | DSL-001…080 | 23k words |
| 03 | [Fix loops and review pipelines](03-fix-loop-and-review-pipelines.md) | Review → fix → re-verify mechanics: gstack, designpowers, impeccable, OneRedOak, impaccable-agent, uimax, agent-browser; documented failure modes | LOOP-001…072 | 21k words |
| 04 | [Evaluation skills, research prototypes and feedback intake](04-evaluation-skills-research-and-feedback.md) | Heuristic-evaluation and walkthrough skills, multi-evaluator protocols, false-positive gate chains, UXBench, UICrit, feedback tools (agentation, Marker, Formbricks, PostHog, MarkuprPlus) | EVAL-001…124 (81 items) | 24k words |
| 05 | [Platform design systems and CJK typography](05-platform-design-systems.md) | Apple HIG (2026), Material 3 (incl. Expressive), Fluent 2, Carbon, Polaris, GOV.UK, Atlassian, Primer, Radix, Tailwind defaults, Ant Design, TDesign, Arco, Semi, W3C clreq, CJK fonts and licences | PLAT-001…144 (96 items) | 23k words |
| 06 | [HCI evaluation methodology](06-hci-evaluation-methodology.md) | Heuristic sets, severity, evaluator effect, cognitive walkthrough, usability testing, metrics (SUS, SEQ, UMUX-Lite, NASA-TLX), PURE, KLM, A/B rigour, HEART, AI-feature guidelines, LLM-evaluator reliability (nine papers) | HCI-001…078 | 24k words |
| 07 | [Anti-slop and visual craft](07-anti-slop-and-visual-craft.md) | Why generated UIs converge; a catalogue of about 70 tells with thresholds; craft numbers for type, colour, space, depth, motion and copy; operationalising taste; computational aesthetics | CRAFT-001…064 | 22k words |
| 08 | [Accessibility and verification tooling](08-accessibility-and-verification-tooling.md) | WCAG 2.2 AA coverage by engines, contrast, targets, keyboard and focus, preferences, semantics, CJK; Playwright, axe, Lighthouse, pa11y, visual regression, CSS analytics, DOM→source mapping; experiments E1–E10 | TOOL-01…44 | 13k words |
| 09 | [Agent Skills packaging](09-agent-skills-packaging.md) | The Agent Skills specification; Claude Code, Codex, Cursor and Gemini CLI specifics; `npx skills` distribution | PKG-01…10 | 1.1k words |
| 10 | [Design-process frameworks](10-design-process-frameworks.md) | Double Diamond and the GV Design Sprint, as staging for the create side | PROC-001…005 | 0.7k words |

Course material: Alexandra Ion, *Evaluation: Analytical vs Empirical* (CMU HCII lecture). It is the methodological backbone. Its mapping is in [FRAMEWORK Appendix A](../framework/FRAMEWORK.md#appendix-a--the-cmu-lecture-element-by-element).

## Conventions used in the notes

- **Adopt-list columns:** ID · practice (testable wording) · category · how to verify · sources · licence or attribution note.
- **Markers:** `[unverified]` means the claim could not be confirmed from a primary source. `[proposal]`, `[HEUR]` and `[calibrating]` mark thresholds synthesised by the note, not taken from a source. `[EMP]` marks empirical evidence. `[PRAC]` marks practitioner guidance.
- **Licence tags** (e.g. A2-IMP, OGL, "ideas only") say how a source may be reused. The framework's licence policy is in [AUTHORING](../framework/AUTHORING.md#licences-and-quotation).
- Each note ends with **conflicts and proposed resolutions**. These are unified in the [CONFLICT-REGISTER](../framework/CONFLICT-REGISTER.md).

## How the research flows into the skill

```
research adopt item ──▶ framework rule / gate criterion / workflow step / script check ──▶ test or eval
   (e.g. CRAFT-018)       (QUALITY-BAR SLP-05; knowledge/anti-slop.md)   (uie audit DOM rule)   (tests/detectors)
```

`tools/check-traceability.mjs` fails the build if any adopt ID lacks a disposition (`implemented`, `partial`, `rejected` with reason, or `deferred`) in [TRACEABILITY](../framework/TRACEABILITY.md).

## Keeping the evidence fresh

| Item | Re-verify |
|---|---|
| Model house styles and the saturated-faces list | each major model release |
| Tool versions (Playwright, axe-core, Lighthouse, design.md CLI) | each release of the skill |
| Design-system values (Material, Fluent, Carbon, Apple HIG) | twice a year, against token sources |
| WCAG status (2.2 → 3.0) | when W3C publishes a new Recommendation or Candidate Recommendation |
| Licences (fonts, Polaris, Atlassian, gallery terms) | each release |
