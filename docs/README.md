# Documentation map

| If you want to… | Read |
|---|---|
| understand the project in Chinese | [OVERVIEW.zh-CN.md](OVERVIEW.zh-CN.md) |
| know what the framework promises and how it works | [framework/FRAMEWORK.md](framework/FRAMEWORK.md) |
| see exactly what "done" means: gates, thresholds, assurance levels | [framework/QUALITY-BAR.md](framework/QUALITY-BAR.md) |
| understand the evaluation and research methods | [framework/METHODS.md](framework/METHODS.md) |
| understand packaging, the CLI, file formats and agents | [framework/ARCHITECTURE.md](framework/ARCHITECTURE.md) |
| know why something was decided | [framework/DECISIONS.md](framework/DECISIONS.md) |
| see how conflicting sources were reconciled | [framework/CONFLICT-REGISTER.md](framework/CONFLICT-REGISTER.md) |
| write or review guidance and prompts | [framework/AUTHORING.md](framework/AUTHORING.md) |
| see how the skill itself is tested | [framework/EVALUATION-PLAN.md](framework/EVALUATION-PLAN.md) |
| trace a rule to its evidence, or a lecture concept to its implementation | [framework/TRACEABILITY.md](framework/TRACEABILITY.md) |
| look up a term (English / 中文) | [framework/GLOSSARY.md](framework/GLOSSARY.md) |
| read the evidence base | [research/README.md](research/README.md) |
| use the skill (agent-facing) | [../skills/ui-evaluator/SKILL.md](../skills/ui-evaluator/SKILL.md) |

## How the documents relate

```
research/ (evidence, 592 adopt items)
      │  cited as [CRAFT-018] etc.
      ▼
framework/FRAMEWORK ──▶ QUALITY-BAR (gate criteria IDs) ──▶ skills/…/knowledge/* (rules, how to fix)
      │                    │                                   assets/data/rules.json (machine-readable)
      ├──▶ METHODS ────────┴──▶ skills/…/methods/* (agent procedures)
      ├──▶ ARCHITECTURE ──────▶ skills/…/scripts (uie CLI), assets/schemas, agents/, hooks/
      ├──▶ DECISIONS + CONFLICT-REGISTER (why; rulings)
      ├──▶ AUTHORING (how everything is written)
      └──▶ EVALUATION-PLAN ───▶ evals/, tests/
TRACEABILITY ties research IDs and lecture concepts to all of the above.
```

Precedence when two documents disagree: FRAMEWORK > QUALITY-BAR > METHODS > ARCHITECTURE > the skill's references. Any disagreement is a bug to fix, not a choice to make at run time.
