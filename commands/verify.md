---
description: "Verify fixes against the baseline, detect regressions and recompute the gates"
argument-hint: "[baseline run id, optional]"
---

Use the UI-Evaluator skill (`${CLAUDE_PLUGIN_ROOT}/skills/ui-evaluator/SKILL.md`) and run its **verify** workflow. Read `${CLAUDE_PLUGIN_ROOT}/skills/ui-evaluator/references/workflows/verify.md` and follow it step by step. Run the `uie` CLI as `node "${CLAUDE_PLUGIN_ROOT}/skills/ui-evaluator/scripts/uie.mjs"`.

Request: $ARGUMENTS
