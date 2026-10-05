---
description: "Produce the honest report and the agree/disagree sheet for the latest run"
argument-hint: "[run id, optional]"
---

Use the UI-Evaluator skill (`${CLAUDE_PLUGIN_ROOT}/skills/ui-evaluator/SKILL.md`) and run its **report** workflow. Read `${CLAUDE_PLUGIN_ROOT}/skills/ui-evaluator/references/workflows/report.md` and follow it step by step. Run the `uie` CLI as `node "${CLAUDE_PLUGIN_ROOT}/skills/ui-evaluator/scripts/uie.mjs"`.

Request: $ARGUMENTS
