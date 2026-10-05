---
description: "Fix open findings one at a time with verification and an independent close-out"
argument-hint: "[finding IDs, or nothing for the queue]"
---

Use the UI-Evaluator skill (`${CLAUDE_PLUGIN_ROOT}/skills/ui-evaluator/SKILL.md`) and run its **fix** workflow. Read `${CLAUDE_PLUGIN_ROOT}/skills/ui-evaluator/references/workflows/fix.md` and follow it step by step. Run the `uie` CLI as `node "${CLAUDE_PLUGIN_ROOT}/skills/ui-evaluator/scripts/uie.mjs"`.

Request: $ARGUMENTS
