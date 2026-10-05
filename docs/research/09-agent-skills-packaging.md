# 09 — Packaging: the Agent Skills standard and per-harness specifics

- **Date:** 2026-10-01
- **Scope:** How to package UI-Evaluator so one source tree installs cleanly into Claude Code, OpenAI Codex, Cursor, Gemini CLI and other SKILL.md-compatible agents, and which authoring rules apply.
- **Sources read:** [agentskills.io/specification](https://agentskills.io/specification); [Claude Code — Skills](https://code.claude.com/docs/en/skills); [Claude Code — Plugin manifest reference](https://code.claude.com/docs/en/plugins-reference); [Claude Code — Subagents](https://code.claude.com/docs/en/sub-agents); [Anthropic — Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices); [Codex — Build skills](https://learn.chatgpt.com/docs/build-skills) (redirect target of developers.openai.com/codex/skills); [Cursor — Agent Skills](https://cursor.com/docs/skills); [Gemini CLI — Agent Skills](https://geminicli.com/docs/cli/skills/); [vercel-labs/skills](https://github.com/vercel-labs/skills) (`npx skills`); the local `skill-creator` skill (evaluation loop).

## 1. The portable core: Agent Skills specification

A skill is a directory containing `SKILL.md` (YAML frontmatter + Markdown body), plus optional `scripts/`, `references/`, `assets/` and anything else.

| Field | Required | Constraint |
|---|---|---|
| `name` | yes | 1–64 chars; lowercase `a-z`, `0-9`, `-`; no leading/trailing hyphen; no `--`; **must equal the parent directory name** |
| `description` | yes | 1–1024 chars; says what the skill does **and when to use it**, with trigger keywords |
| `license` | no | short license name or bundled file reference |
| `compatibility` | no | ≤500 chars; environment requirements (only when really needed) |
| `metadata` | no | string→string map (e.g. `author`, `version`) |
| `allowed-tools` | no | experimental, space-separated pre-approved tools |

**Progressive disclosure.** The metadata (~100 tokens) is always loaded. The body is loaded on activation (recommended < 5,000 tokens, < 500 lines). Resources load on demand. Keep file references **one level deep** from `SKILL.md`, using relative forward-slash paths. Validate with `skills-ref validate ./skill` ([agentskills/agentskills](https://github.com/agentskills/agentskills)).

Anthropic's platform rules add the following ([best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)):
- No XML tags in `name` or `description`.
- The reserved words `anthropic` and `claude` may not appear in names.
- Write descriptions in the **third person**.
- Give files longer than 100 lines a table of contents.

## 2. Harness specifics

### Claude Code ([skills](https://code.claude.com/docs/en/skills), [plugins](https://code.claude.com/docs/en/plugins-reference), [subagents](https://code.claude.com/docs/en/sub-agents))

- **Skill locations:**
  - personal `~/.claude/skills/<name>/SKILL.md`
  - project `.claude/skills/…`
  - nested `<subdir>/.claude/skills/…`
  - plugin `<plugin>/skills/<name>/SKILL.md`, namespaced `/plugin:skill`
  - Folders named `synced` or `anthropic-skills` are reserved.
- **Claude Code–only frontmatter:**
  - Fields: `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context: fork`, `agent`, `background`, `hooks`, `paths`, `shell`, `disallowed-tools`.
  - Substitutions: `$ARGUMENTS`, `$0`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PROJECT_DIR}`.
  - Dynamic context injection with ``!`cmd` ``.
  - **These are rejected when a skill is uploaded to claude.ai or used via the API.** Only `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools` are accepted there.
- **Listing budget:** about 1% of the context window. Each skill gets at most 1,536 chars of `description` + `when_to_use`. Put the key use case first.
- **Plugin layout:**
  - `.claude-plugin/plugin.json`: only `name` is required; also `version`, `description`, `author`, `license`, `keywords`, `homepage`, `repository`.
  - Defaults: `skills/` (added to by the manifest), `commands/` (prefer skills for new work), `agents/*.md`, `hooks/hooks.json`, `.mcp.json`, `bin/`.
  - Manifest paths must start with `./` and stay inside the plugin root.
  - Plugin names must not start with `claude-`/`anthropic-`. A root `CLAUDE.md` in a plugin is *not* loaded.
  - Validate with `claude plugin validate ./plugin [--strict]`.
  - A `.claude-plugin/marketplace.json` makes the repo installable via `/plugin marketplace add owner/repo`.
- **Subagents (`agents/*.md`):**
  - Frontmatter: `name`, `description` (required); `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills` (preload), `mcpServers`, `hooks`, `memory`, `effort`, `isolation: worktree`, `color`.
  - Non-fork subagents start with a fresh context. That is exactly the isolation independent heuristic evaluators need.
  - Nesting depth defaults to 3. Up to 20 can run concurrently.
  - Subagents cannot use `AskUserQuestion`.

### OpenAI Codex ([build skills](https://learn.chatgpt.com/docs/build-skills))

- **Scopes:** repo `.agents/skills` (scanned from the working directory up to the repo root), user `$HOME/.agents/skills`, admin `/etc/codex/skills`, plus system-bundled skills.
- **Invocation:** reads `name` + `description`; invoked implicitly or explicitly via `$skill-name`.
- **Optional `agents/openai.yaml` inside the skill:** `interface` (display name, icon, brand colour, default prompt), `policy.allow_implicit_invocation`, `dependencies` (e.g. MCP servers).
- **Listing budget:** at most 2% of context, or 8,000 chars when unknown.

### Cursor ([docs](https://cursor.com/docs/skills))

- **Locations:** `.agents/skills/`, `.cursor/skills/`, `~/.agents/skills/`, `~/.cursor/skills/`, including nested monorepo dirs scoped to their subtree.
- **Frontmatter:** `name` (must match folder) + `description`.
- **Invocation:** `/skill-name`.

### Gemini CLI ([docs](https://geminicli.com/docs/cli/skills/))

- **Locations:** workspace `.gemini/skills/` or `.agents/skills/`; user `~/.gemini/skills/` or `~/.agents/skills/`.
- **Activation:** names + descriptions are injected at session start; the model calls `activate_skill`.

### Distribution: `npx skills` ([vercel-labs/skills](https://github.com/vercel-labs/skills))

- **Install:** `npx skills add owner/repo [--list] [-g] [-y] [--all] [--copy]`.
- **Discovery:** scans the repo root (if it has `SKILL.md`), `skills/`, `.agents/skills/`, `.claude/skills/` and many agent dirs up to three levels deep. It also reads `.claude-plugin/marketplace.json`.
- **Agent coverage:** installs into 40+ agents' paths (symlink by default; `--copy` available).
  - Claude Code: `.claude/skills/` or `~/.claude/skills/`
  - Codex and Cursor: `.agents/skills/`
- **Hidden skills:** `metadata.internal: true` hides a skill unless `INSTALL_INTERNAL_SKILLS=1` is set.
- **Registry:** skills.sh is the public leaderboard/registry.

## 3. Decisions for UI-Evaluator packaging

| # | Decision | Why |
|---|---|---|
| PKG-01 | Canonical source lives at `skills/<skill-name>/` at the repo root. | Discovered by `npx skills`, the Claude Code plugin default layout and manual copying into `.agents/skills` / `.claude/skills`. |
| PKG-02 | `SKILL.md` frontmatter uses **only** spec fields (`name`, `description`, `license`, `metadata`; `compatibility` if needed). | Claude Code–only fields break claude.ai/API upload. Portability matters more than slash-command niceties. |
| PKG-03 | Ship a Claude Code plugin wrapper: `.claude-plugin/plugin.json` + `marketplace.json` + optional `agents/` (isolated evaluator subagents). Every workflow must also run **without** subagents (sequential fallback with an explicit "degraded independence" note). | Subagents give true evaluator independence in Claude Code; other harnesses lack them. Impeccable uses the same "degraded" pattern. |
| PKG-04 | Names: lowercase-hyphen, ≤64 chars, matching the directory, never containing `claude`/`anthropic`. | Spec and platform rules. |
| PKG-05 | Descriptions are third-person, say what + when, and put trigger phrases first (≤1024 chars; aim ≤600). | Listing budgets (1–2% of context) truncate long descriptions. |
| PKG-06 | `SKILL.md` body < 500 lines. Depth goes in `references/*.md` (a TOC when > 100 lines), linked one level deep with explicit "read X when Y" pointers. | Progressive disclosure; partial-read risk with nested links. |
| PKG-07 | Deterministic checks are `scripts/` (Node-first, self-contained, clear errors, documented deps, no "voodoo constants"). Instructions say "run", not "read". | Script output costs tokens; script source doesn't. Scripts are more reliable than regenerated code. |
| PKG-08 | Optional `agents/openai.yaml` per skill for Codex UI metadata. | Free polish for Codex users; ignored elsewhere. |
| PKG-09 | Develop with the evaluation loop: `evals/evals.json`, with-skill vs. no-skill runs, graded assertions plus human review (skill-creator), then description-trigger optimisation. | The "build evaluations first" guidance; the only honest way to show the skill improves outcomes. |
| PKG-10 | Validate with `skills-ref validate` and `claude plugin validate --strict` in CI. | Catch frontmatter/path errors before release. |
