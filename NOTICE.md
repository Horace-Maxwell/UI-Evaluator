# NOTICE

UI-Evaluator
Copyright 2026 The UI-Evaluator Authors

Licensed under the Apache License, Version 2.0 (see `LICENSE`).

UI-Evaluator re-expresses ideas, procedures and published values from the sources below in its own words. No third-party source code is vendored into this repository. Runtime dependencies are installed separately under their own licences. Where a source's licence requires attribution or a statement of changes, it is given here.

## Sources whose ideas or values are adapted

| Source | Licence | What UI-Evaluator adapts (changes: re-expressed and integrated into a different framework) |
|---|---|---|
| pbakaus/impeccable | Apache-2.0 | visitor modes; the PRODUCT.md / DESIGN.md / brief split; the concept-seed idea of never assigning the model's top-ranked directions; detector rule thresholds (kicker labels, side stripes, glow, cream palette, em-dash density, tracking, measure); the critique isolation rule and DEGRADED banner; finish-reviewer verdicts and dispositions; drift classes; the capture-validity gate |
| anthropics/skills — `frontend-design` | Apache-2.0 | subject grounding; plan-then-review against the generic answer; calibration of generated looks; restraint with one signature |
| google-labs-code/design.md | Apache-2.0 | the DESIGN.md file format (YAML tokens plus fixed prose sections) used for `DESIGN.md` templates |
| ehmo/platform-design-skills (via impeccable) | MIT | background numbers for native platform targets |
| garrytan/gstack | MIT (with Apache-2.0 parts derived from impeccable) | design-review loop mechanics: clean-tree baseline, one commit per fix, risk score, fix caps, coverage reporting |
| Owl-Listener/designpowers | MIT | reconciliation order, pause conditions, debt register |
| obra/superpowers | MIT | verification before completion; per-finding attempt caps and escalation |
| vercel-labs/web-interface-guidelines | MIT | interaction-detail rules (paste, loading buttons, URL state, tooltips, nested radii) |
| Dammyjay93/interface-design | MIT | intent first; swap, squint, signature and token tests |
| educlopez/ui-craft | MIT | mechanical draw plus ledger for variety; deterministic vs judged scores; one fix per iteration |
| Leonxlnx/taste-skill | MIT | layout-family and eyebrow budgets (as inputs to tell thresholds) |
| emilkowalski/skills | MIT | motion frequency budget; easing and duration guidance; no scale-from-zero |
| Nutlope/hallmark | MIT | pre-flight scan; DESIGN.md lock with injection guard; output log for variety |
| ibelick/ui-skills | MIT | rendered or user evidence required for hierarchy claims |
| nextlevelbuilder/ui-ux-pro-max-skill | MIT | evidence that framework default palettes dominate retrieved palettes |
| Owl-Listener/designer-skills, wondelai/skills | MIT | triangulation; book-derived checklists (ideas only; the original books are credited to their authors) |
| emiliacurie/arely-skills, averliz/visual-ux-review-toolkit, carlsz/ux-agent-skills, mastepanoski/claude-skills, 45ck/hci-review-skill, EliaAlberti/ux-audit-skill, AndersonWang/heuristics-evaluation-skill, Lee-Soyeon/ux-research-agents, marker-io/mcp-skills, hashfunction/MarkuprPlus, PostHog/skills, ruxailab/RUXAILAB, AIG-ist-tugraz/MLLM-Usability-Improvements | MIT | multi-evaluator isolation and merge; disagreement routed to users; journey criticality clamp; report contracts; first-click and stuck-after-three-steps rules; propose-then-apply feedback triage; analytics signal rules; transcript-to-issue coding |
| ghaida/intent | CC0-1.0 | HEART / Goals–Signals–Metrics framing and triangulation (credited as a courtesy) |
| noodisD/UXAgent (incl. the MIT notice of neuhai/UXAgent's agent loop) | MIT | the false-positive gate chain: evidence resolution, harness filter, scope filter, skeptical verifier, absence rule, confidence ceiling |
| google-research-datasets/uicrit | CC BY 4.0 | the standard → current → fix critique template; evidence that holistic ratings are unreliable |
| IBM Carbon Design System | Apache-2.0 | spacing and motion token values; productive vs expressive modes; disabled, loading, empty-state and notification patterns |
| Material Design 3 (material-web, material-color-utilities, Compose tokens) | Apache-2.0 | breakpoints; state-layer opacities; motion tokens and spring-to-bezier conversions; tone-delta contrast heuristic |
| Microsoft Fluent UI | MIT | spacing, radius, motion and focus-style values |
| Radix Colors / Radix Themes | MIT | the 12-step colour-scale job mapping; tinted-grey pairing |
| GitHub Primer | MIT | loading thresholds; saving patterns; contrast against the muted background |
| Ant Design, TDesign, Arco Design, Semi Design | MIT | zh-CN copy, punctuation and data-format conventions; line-height = size + 8 px for CJK UI text; CJK font stacks |
| Tailwind CSS | MIT | observations about default tokens (no code used) |
| GOV.UK Design System and Service Manual | Open Government Licence v3.0 (text); MIT (govuk-frontend) | plain-English "words to avoid" list; error-message and validation guidance; moderated-testing logistics. *Contains public sector information licensed under the Open Government Licence v3.0.* |
| W3C: WCAG 2.2, WAI-ARIA Authoring Practices, Requirements for Chinese Text Layout (clreq), CSS Text Level 4 | W3C Document License | cited and paraphrased; success-criterion numbers and names |
| Apple Human Interface Guidelines; Microsoft HAX guidelines; Google PAIR Guidebook; Nielsen Norman Group articles; MeasuringU; published papers listed in `docs/research/` | © their owners | cited and paraphrased only |
| System Usability Scale (John Brooke, 1986) | free to use with acknowledgement | the ten-item questionnaire in the study templates |
| Alexandra Ion, *Evaluation: Analytical vs Empirical* (CMU HCII lecture) | © the author | the methodological backbone; paraphrased and cited |

## Sources used for ideas only (no text, code or data copied)

Shopify Polaris (licence restricted to Shopify-integrated apps), the Atlassian Design System (licence restricted to Atlassian add-ons), benjitaylor/agentation (PolyForm-Shield-style licence with a non-compete clause), formbricks (AGPL-3.0), Jakubantalik/transitions.dev (no redistribution), uw-ssec/rse-plugins `uiux-design-team` (licence conflict between the repository and the plugin), ogatakatsuya/UXCascade prompts (reproduced from a paper), and repositories without a licence file (including Jackwwj619/UXBench, neuhai/UXAgent, BuildTheWeb1/impaccable-agent, ruxailab/ai-heuristic-evaluation, PostHog/ai-plugin).

## Fonts and reference galleries

UI-Evaluator bundles no fonts. Its guidance never self-hosts SF Pro or New York, Segoe UI, PingFang, Microsoft YaHei or GDS Transport. It flags HarmonyOS Sans and MiSans for licence review before subsetting. Gallery sites whose terms forbid AI use (e.g. Mobbin, Dribbble) are recommended for human browsing only.

## Images in this repository

The images in `docs/assets/` show pages that Claude built for this project's own benchmark, with the numbers from their graded runs; [docs/assets/README.md](docs/assets/README.md) lists the run behind each one. They are part of this repository and covered by its licence, as is `docs/assets/src/cafe-baseline-site/`, the page Claude built without the skill in the first round, kept as the source of the annotated audit image. They were rendered with fonts installed on macOS (Avenir Next, SF Mono, PingFang SC), and no font file is included. The pages in them may show web fonts they loaded, which remain under their own licences.

## Runtime dependencies (installed on request, not vendored)

Playwright (Apache-2.0), axe-core and @axe-core/playwright (MPL-2.0, used unmodified), colorjs.io (MIT), pixelmatch (ISC), pngjs (MIT), web-vitals (Apache-2.0).
