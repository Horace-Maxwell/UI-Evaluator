# 00 — Landscape survey: is there already a skill like UI-Evaluator?

- **Date:** 2026-10-01
- **Question:** Does any open-source project package UI/UX evaluation knowledge into an agent skill that (1) finds UI problems in a given project, (2) ingests real user feedback, and (3) checks and fixes the problems one by one?
- **Method:** Three parallel searches (agent skills for UX audit; LLM usability-evaluation research code; feedback-to-fix tooling). Every repository below was opened through the GitHub API on the survey date; stars and push dates are as of that day. The deep-dive notes `01`–`08` supersede this file wherever they go into more detail.

## Bottom line

No single project closes the whole loop. The pieces exist, but in three separate camps:

1. **Rigorous but report-only.** Skills that follow the textbook (Nielsen heuristics, cognitive walkthrough, 0–4 severity) stop at a report.
2. **Fixing, but judged on polish.** Tools with strong fix-and-verify loops judge quality by visual polish or technical scores, not by usability heuristics.
3. **Feedback intake as a separate product.** Tools that capture real user feedback hand it to agents but have no usability-heuristic triage.

UI-Evaluator's opportunity is to join the three.

## Closest projects, scored against the lecture checklist

✓ full · ◐ partial · ✗ none. HE = heuristic evaluation, CW = cognitive walkthrough.

| Repo | ★ / last push | HE | CW | 0–4 severity | Independent evaluators | Real-user feedback | Fix + re-verify | Note |
|---|---|---|---|---|---|---|---|---|
| [Owl-Listener/designpowers](https://github.com/Owl-Listener/designpowers) (MIT) | 247 / 2026-06-23 | ✓ | ✓ (4 questions) | ◐ critical/major/minor | ◐ three different-lens reviewers + reconciliation | ◐ plans tests; simulated personas | ✓ fix round; Critical/Major must be resolved | Closest end-to-end |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0) | 73.6k / 2026-10-01 | ◐ scores each of Nielsen's 10 from 0–4 | ◐ persona walks | ◐ P0–P3 | ◐ two isolated sub-agents | ✗ | ✓ critique → polish → re-score | Most popular design-quality loop |
| [garrytan/gstack](https://github.com/garrytan/gstack) `/design-review` (MIT) | 134.7k / 2026-10-01 | ✗ (Krug + visual checklist) | ◐ | ◐ high/medium/polish | ◐ optional second opinion | ✗ | ✓✓ atomic commit per fix, before/after screenshots, regression baseline | Best fix loop |
| [mastepanoski/claude-skills](https://github.com/mastepanoski/claude-skills) (MIT) | 54 / 2026-06-05 | ✓ | ✓ | ✓ | ✗ | ◐ accepts known issues/tickets | ✗ | Most faithful to the lecture |
| [45ck/hci-review-skill](https://github.com/45ck/hci-review-skill) (MIT) | 18 / 2026-04-11 | ✓ | ✓ | ✓ | ✗ | ◐ test planner, time/error metrics | ◐ findings → issues | 34 HCI-course-style skills |
| [uw-ssec/rse-plugins](https://github.com/uw-ssec/rse-plugins) uiux-design-team (BSD-3) | 29 / 2026-09-14 | ✓ | ✓ | ✓ with frequency/impact/persistence | ◐ describes 3–5 evaluators, runs one | ◐ SUS/SEQ | ✗ | Most complete textbook template |
| [EliaAlberti/ux-audit-skill](https://github.com/EliaAlberti/ux-audit-skill) (MIT) | 19 / 2026-06-12 | ✓ | ◐ | ✓ | ✗ (4 passes) | ✗ | ✗ | Best report format (annotated screenshots, effort) |
| [emiliacurie/arely-skills](https://github.com/emiliacurie/arely-skills) ux-audit-panel (MIT) | 2 / 2026-09-17 | ◐ | ✗ | ◐ | ✓ 2–5 isolated evaluators + disagreement report | ✗ | ✗ | Only true independent-evaluator merge |
| [ogatakatsuya/UXCascade](https://github.com/ogatakatsuya/UXCascade) (MIT, unofficial impl. of a UIST'26 paper) | 10 / 2026-02-26 | ◐ | ✗ | ✓ | ✗ | ◐ simulated users | ◐ DOM patch, then re-simulate | Research prototype |

Point solutions worth borrowing: [averliz/visual-ux-review-toolkit](https://github.com/averliz/visual-ux-review-toolkit) (cognitive walkthrough in a live browser) and [carlsz/ux-agent-skills](https://github.com/carlsz/ux-agent-skills) (findings mapped to file:line).

Popular but different purpose: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (132k★, a design-knowledge database for generating UI) and [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) `web-design-guidelines` (31.8k★, rule lint of code, no severity, no fixes). The Anthropic `design` plugin in [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (Apache-2.0, 26k★) has `design-critique`, `accessibility-review`, `user-research` and `research-synthesis`, but no Nielsen IDs, no cognitive walkthrough and no code fixes.

## Feedback-intake tools

| Repo | ★ | License | What reaches the agent | Note |
|---|---|---|---|---|
| [benjitaylor/agentation](https://github.com/benjitaylor/agentation) | 4.8k | PolyForm Shield (source-available, not OSI) | Click/area annotations with selector, bbox and component path, via MCP (`get_all_pending`, `resolve`, …) | Best intake adapter; ideas only, no code reuse |
| [marker-io/mcp-skills](https://github.com/marker-io/mcp-skills) | 7 | MIT (needs the hosted Marker.io MCP) | Reports with screenshot, console, network, DOM | `marker-triage` and `marker-bug-to-fix` are the closest "triage then fix one by one" blueprint |
| PostHog ([skills](https://github.com/PostHog/skills), MCP in [posthog](https://github.com/PostHog/posthog)) | 40k | MIT outside `ee/` | Session replay, rage/dead clicks, heatmaps, surveys, experiments | Empirical evidence source |
| [formbricks/formbricks](https://github.com/formbricks/formbricks) | 13k | AGPLv3 core | Surveys incl. a built-in SUS template, via MCP | SUS/NPS source |
| [hashfunction/MarkuprPlus](https://github.com/hashfunction/MarkuprPlus) | 79 | MIT | Narrated screen recordings → one issue per mark | Closest to think-aloud intake |
| [Lee-Soyeon/ux-research-agents](https://github.com/Lee-Soyeon/ux-research-agents) | 2 | MIT | Test transcripts → Nielsen-tagged issues, x/4 severity | No fix loop |

## Research prototypes and benchmarks

[Jackwwj619/UXBench](https://github.com/Jackwwj619/UXBench) (41 runnable web fixtures; no license file), [neuhai/UXAgent](https://github.com/neuhai/UXAgent) (persona-based simulated usability tests), [Onflow-AI/Avenir-UX](https://github.com/Onflow-AI/Avenir-UX), [AIG-ist-tugraz/MLLM-Usability-Improvements](https://github.com/AIG-ist-tugraz/MLLM-Usability-Improvements) (HE report pipeline, MIT), [UGAIForge/DesignRepair](https://github.com/UGAIForge/DesignRepair) (ICSE'25, Material-guideline repair), [google-research-datasets/uicrit](https://github.com/google-research-datasets/uicrit) (UI critique dataset, CC BY 4.0), [noodisD/UXAgent](https://github.com/noodisD/UXAgent) (false-positive verification gates).

## How reliable are LLM evaluators? (headline numbers; verified in detail in `06`)

- GPT-4o found 21.2% of the issues experts found, plus hallucinated ones (Guerino et al., INTERACT'25, arXiv 2506.16345).
- UX-LLM: precision 0.61–0.66, recall 0.35–0.38 (ICSE'25, arXiv 2411.00634).
- Synthetic HE covered 73–77% of issues vs 57–63% for five experts, but was weak on design conventions and multi-screen problems (arXiv 2507.02306).
- A supervisor-verification pass raised precision from 0.78 to 0.96 (SUTM, CEUR Vol-4249).
- GPT-4 feedback became less useful over repeated iterations (Duan et al., CHI'24, arXiv 2403.13139).

**Implication:** The lecture's warning that HE and CW miss problems and find "false problems" applies even more strongly to LLM evaluators. Real-user confirmation and evidence-gated verification are core requirements of the framework, not optional extras.

## Gaps UI-Evaluator should close

1. **Map real feedback onto heuristics.** Map each observation from think-aloud, tests, SUS or analytics to a heuristic (H1–H10) or a cognitive-walkthrough step, then re-score severity using observed frequency.
2. **Verify each fix against its own criterion.** Fix finding N, re-check that heuristic or CW step plus regressions, then mark it verified. Today, rigorous tools only report and fixing tools judge polish.
3. **Run true multi-evaluator HE.** Use 3–5 independent evaluators, then dedupe, calibrate severity and debrief.
4. **Ground cognitive walkthroughs in the codebase.** Derive tasks from the routes, run the 4 questions in a real browser, and map each breakdown to file:line.
5. **Stay open.** Keep the core MIT/Apache-compatible, with adapters for closed or source-available intake tools.
