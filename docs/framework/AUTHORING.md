# Authoring guide

| | |
|---|---|
| Version | 1.0.0 (2026-10-01) |
| Status | Normative for everything written into `skills/ui-evaluator/` and `docs/`. Reviewers reject changes that break it. |
| Parent | [FRAMEWORK](FRAMEWORK.md) |

## Contents

1. [Audiences and registers](#1-audiences-and-registers)
2. [Voice](#2-voice)
3. [IDs and naming](#3-ids-and-naming)
4. [File templates](#4-file-templates)
5. [Rules inside knowledge files](#5-rules-inside-knowledge-files)
6. [Examples policy](#6-examples-policy)
7. [Citations](#7-citations)
8. [Licences and quotation](#licences-and-quotation)
9. [Size and structure budgets](#9-size-and-structure-budgets)
10. [Portability across harnesses](#10-portability-across-harnesses)
11. [Data files](#11-data-files)
12. [Enforcement](#enforcement)
13. [Review checklist](#13-review-checklist)

---

## 1. Audiences and registers

| Location | Reader | Register |
|---|---|---|
| `docs/framework/*` | maintainers, reviewers, researchers | specification: RFC 2119 keywords, complete, cross-referenced |
| `docs/research/*` | maintainers | research notes: sourced, dated, critical |
| `skills/ui-evaluator/SKILL.md`, `references/**` | the agent at run time | operational: imperative, explains *why*, names the command to run, no RFC capitals |
| `references/evaluators/*` | an isolated subagent with no other context | self-contained: everything the role needs is in the file or its packet |
| `README*.md`, `docs/OVERVIEW.zh-CN.md` | people deciding whether to use the project | plain, short, honest about limits |

Agent-facing files are in English. CJK rules include Chinese examples. User-facing overviews exist in English and Simplified Chinese.

## 2. Voice

Agents follow reasons better than commands, and stacked capitals degrade instruction following [IMP-059].

- **Explain why.** Every non-obvious instruction carries its reason in the same sentence or the next one.
- **Imperative and calm.** Write "Run `uie gates` before reporting, because…". Do not write "YOU MUST ALWAYS…". Never stack CRITICAL, IMPORTANT or MUST banners. Never tell the model it used to be timid or bad.
- **Plain words.** Avoid the vocabulary the framework flags in UI copy (leverage, seamless, robust, empower, elevate and similar). Our own prose is held to our own rules.
- **Specific over general.** Name patterns and give the alternative. "Avoid an AI look" or "make it clean and minimal" is not guidance, because it swaps one default for another [IMP-055].
- **No contradictions.** One budget, one threshold, one name per concept. When two files would disagree, one of them links to the other instead of restating it.
- **Dated facts.** Facts that will age carry an "as of YYYY-MM" marker: tool versions, model house styles, saturated-face lists.

## 3. IDs and naming

| Kind | Format | Defined in | Examples |
|---|---|---|---|
| Gate criteria | `<DOMAIN>-<NN>` | [QUALITY-BAR](QUALITY-BAR.md) (reserved; never renumbered) | `TYP-03`, `A11Y-11`, `USE-05` |
| Additional rules | same domain, next free number | knowledge files | `TYP-11` |
| Tells | `SLP-<NN>` (hard 01–19, soft 20–49, experimental 50+) | `knowledge/anti-slop.md` + `assets/data/tells.json` | `SLP-05` |
| Heuristics | `H1`–`H10` (Nielsen) | `knowledge/heuristics.md` | `H9` |
| CW questions | `CW-Q1`–`CW-Q4` | `methods/cognitive-walkthrough.md` | `CW-Q2` |
| AI-feature guidelines | `HAX-G1`–`HAX-G18` | `knowledge/ai-features.md` | `HAX-G11` |
| ISO 9241-110 principles | `ISO-1`–`ISO-7` (1 suitability for the task … 7 user engagement) | `knowledge/heuristics.md` | `ISO-1` |
| WCAG | the success-criterion number | `knowledge/accessibility.md` | `2.4.11` |
| Findings | `F-<NNNN>` per project | the findings register | `F-0042` |
| Decisions | `ADR-<NNN>` | [DECISIONS](DECISIONS.md) | `ADR-009` |
| Conflict rulings | `CR-<NNN>` | [CONFLICT-REGISTER](CONFLICT-REGISTER.md) | `CR-031` |
| Research adopt items | as in the notes | `docs/research/*` | `CRAFT-018` |

Domains: `EVD` evidence · `FUN` functional · `A11Y` accessibility · `TYP` typography · `COL` colour · `LAY` layout and spacing · `SHP` shape and depth · `MOT` motion · `CMP` components and states · `CPY` content and copy · `I18N` localisation · `DEC` decision records · `SLP` tells · `USE` analytical usability · `DES` design panel · `EMP` empirical · `DAT` data display · `AIX` AI features · `PLT` platform profiles.

Use the [GLOSSARY](GLOSSARY.md) terms exactly. In particular:
- finding (not "issue"), criterion, gate, evidence level, severity, priority, ease of fix;
- the severity words: cosmetic (1), minor (2), major (3), catastrophe (4);
- the mode names: Persuade, Operate, Read, Experience.

## 4. File templates

### 4.1 Knowledge file (`references/knowledge/<domain>.md`)

```markdown
# <Domain>

<One paragraph: what this file covers, which gates it serves, when to read it.>

## Contents
...

## 1. Principles
<3–7 short principles with reasons; no numbers yet>

## 2. Rules
<Rule records, gate rules first (IDs from QUALITY-BAR, same thresholds), then advisory rules>

## 3. Decisions to make (for direct/build)
<What must be decided and recorded in DESIGN.md for this domain, with the options and how mode or brand chooses between them>

## 4. How to fix common failures
<Failure → narrowest correct fix (token, component, local) → how to verify>

## 5. CJK and localisation notes   (where relevant)

## Sources
<Research IDs and external references>
```

### 4.2 Method file (`references/methods/<method>.md`)

Sections: Purpose and when to use · Inputs · Procedure (numbered) · Output format (schema name) · Quality checks (what makes an output invalid) · Pitfalls (each with the evidence behind it) · Sources.

### 4.3 Workflow file (`references/workflows/<workflow>.md`)

Use the eight-part structure in [ARCHITECTURE §5](ARCHITECTURE.md#5-workflows-and-routing). Every step names the exact command or role and gives the reason. Every exit criterion cites gate IDs.

### 4.4 Evaluator prompt (`references/evaluators/<role>.md`)

Sections:
- Who you are, and what you may and may not see (independence rules)
- Inputs (the packet layout)
- Procedure
- How to record findings (schema and examples)
- What not to do
- Output and the return message (≤ 10 lines)

The prompt is self-contained, because the subagent has no other context. It may tell the subagent to read specific knowledge or method files by path.

### 4.5 Template file (`references/templates/*`)

Every field has an inline comment saying what belongs there, and an example from a *neutral* product (see §6). Required fields are marked.

## 5. Rules inside knowledge files

Each rule is one record:

```markdown
### TYP-03 · Line height
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit)`

**Rule.** Multi-line Latin body text has line-height ≥ 1.4 (1.5–1.6 for long-form reading); multi-line CJK text ≥ 1.5; wrapping headings ≥ 1.1.

**Why.** Tight leading makes lines hard to track. CJK glyphs are dense and uniform, with no ascenders or descenders, so they need more space between lines.

**Check.** Computed `line-height ÷ font-size` on text nodes that render on more than one line.

**Fix.** Change the body and heading line-height tokens, not individual components. Re-run `uie audit --checks census,layout`.

**Exceptions.** Single-line UI labels. Display headings that never wrap.

**Sources.** CRAFT-033, PLAT-011, IMP-016; W3C clreq §7.1.
```

- Gate rules repeat the QUALITY-BAR threshold **exactly**. If a knowledge author believes a threshold is wrong, they raise it as a decision record and do not silently change it.
- Advisory rules use `level: advisory` in place of a gate tag.
- A rule without a **Check** line is guidance, not a rule. Put it under Principles or "Decisions to make".

## 6. Examples policy

Examples in skills and specifications become defaults. The design.md spec's own sample palette is a recognisable second-order look [07 §4.1].

- Never present a font, palette, radius or layout as *recommended*. No "use these fonts" lists [ADR-012].
- When illustrating a choice, show **at least two contrasting directions**, and name why each fits a different brief.
- Prefer abstract token names (`--color-accent`, `--type-display`) over concrete hex values and font names in instructions. Concrete values appear only in clearly labelled illustrations.
- Never use the saturated looks in examples (cream ground with terracotta and serif, indigo-violet gradients, near-black with an acid accent, tracked-caps eyebrows) except as *counter*-examples, marked as such.
- Neutral example products rotate across domains (a municipal recycling service, a veterinary clinic's booking tool, a bicycle-parts inventory, a poetry archive, a logistics dashboard, a language-learning flashcard app). Do not reuse one product everywhere.
- Copy examples must pass our own copy rules (CPY-*, SLP-14).

## 7. Citations

- Cite research adopt IDs inline in square brackets: `[CRAFT-018]`. They trace each statement to the evidence base.
- External sources are listed under **Sources** at the end of the file: short name, year, URL or DOI.
- Mark heuristics and proposals honestly: `[calibrating]` for UI-Evaluator thresholds not yet measured; `[unverified]` for claims the research could not confirm.
- Vendor claims (e.g. M3 Expressive's study figures) are labelled vendor-reported and are never the sole support for a rule [PLAT-143].

## Licences and quotation

- **Paraphrase by default.** At most one direct quotation per file, under 15 words, in quotation marks, with attribution.
- **Apache-2.0 and MIT sources** (impeccable, Anthropic's frontend-design skill, google-labs-code/design.md, Carbon, Material tokens, Radix, Fluent, Ant Design, TDesign, Arco, Semi): ideas and values may be re-expressed in our words. Copying any substantial text or code also copies its licence notice into `NOTICE.md`.
- **GOV.UK content** (Open Government Licence v3.0) may be adapted with the attribution: *"Contains public sector information licensed under the Open Government Licence v3.0."* It is used for the plain-English words-to-avoid list.
- **W3C documents** (WCAG, clreq, APG): cite; quote sparingly.
- **Ideas only, no text:** Shopify Polaris (platform-restricted licence), the Atlassian Design System (product-restricted licence), agentation (PolyForm Shield), Formbricks (AGPL), and repositories without a licence (e.g. UXBench, neuhai/UXAgent, impaccable-agent, PostHog/ai-plugin).
- **Proprietary books and courses** (Refactoring UI, NN/g articles, the CMU lecture): cite and paraphrase. Never reproduce figures, tables or substantial passages.
- **Fonts and assets:** never bundle or self-host SF Pro/New York, Segoe UI, PingFang, Microsoft YaHei or GDS Transport. HarmonyOS Sans and MiSans forbid modification, so subsetting them needs a legal check [PLAT-017/018].
- **Reference galleries:** Mobbin and Dribbble terms forbid AI use or scraping. Guidance may tell *humans* to browse them, never the agent [CRAFT-008].

## 9. Size and structure budgets

| File type | Hard limit | Target |
|---|---|---|
| `SKILL.md` body | 500 lines | ≈ 300 |
| Workflow | 400 lines | 150–300 |
| Knowledge or method file | 500 lines | 200–400 |
| Evaluator prompt | 300 lines | 120–220 |
| Template | 250 lines | as short as the format allows |

- Files over 100 lines start with a table of contents.
- Links from `SKILL.md` go one level deep. A workflow may link to methods, knowledge and templates. Those files do not send the reader further to more than one more file.
- Cross-references by rule ID to a sibling knowledge file (e.g. "contrast is owned by `[A11Y-11](accessibility.md)`", written inside a knowledge file) are encouraged. They point to the single owner of a rule. They are not instructions to read a chain of files to finish one task.
- One topic per file. Split by domain, not by length.

## 10. Portability across harnesses

- Refer to the CLI as `uie <command>` and define once, in `SKILL.md`, that this means `node <skill-dir>/scripts/uie.mjs`.
- Do not use harness-specific syntax in the skill: no `$ARGUMENTS`, no `${CLAUDE_*}` variables, no `!` command injection. These belong only in `commands/`, `agents/` and `hooks/`.
- Describe isolation in harness-neutral terms: "Spawn an isolated subagent for this role if your environment supports it. Otherwise perform the role yourself, reading only its packet, and mark the output `DEGRADED: single-context`."
- Never assume a browser MCP. `uie probe` is the portable way to interact with the UI. Browser tools, when available, are an optional convenience.

## 11. Data files

`assets/data/*.json` are machine-readable rule sources. Each entry has:

```jsonc
{
  "id": "SLP-05",
  "title": "Eyebrow or kicker labels",
  "class": "hard",                 // hard | soft | experimental (tells); gate | advisory (rules)
  "gate": "G4",
  "statement": "…",                // one sentence, same as the knowledge file
  "detect": { "layer": "dom", "params": { "maxFontPx": 14, "minTrackingEm": 0.06 } },
  "default_severity": 2,           // rule-declared severity for deterministic findings (ADR-010)
  "modes": ["persuade", "operate", "read", "experience"],
  "reliability": "S",              // S strong · M medium · W weak (source agreement)
  "precision": null,               // measured on evals/labels once calibrated
  "status": "active",              // active | calibrating | rising | migrating | obsolete
  "first_seen": "2025-08",
  "sources": ["CRAFT-018", "IMP-014"]
}
```

A test checks that every QUALITY-BAR criterion ID exists in `rules.json` with the same threshold parameters.

## Enforcement

The register of prose-only requirements, which are candidates for mechanisation. Move items into scripts or schemas when possible and delete them from this list.

| Requirement | Current enforcement | Mechanisation path |
|---|---|---|
| Evaluators do not read source | prompt + packet without source paths | path-restricted tools or hooks per subagent, where the harness supports them |
| Critics write specificity before seeing detectors | sealed packet section (`uie packet` unlocks after the verdict file exists) | already mechanical in Claude Code; prose elsewhere |
| One problem per finding | prompt + verifier | schema lint for multi-clause descriptions [HCI-004] |
| Recommendations come after evaluation | prompt | trace check in evals |
| Owner questions are batched and targeted | workflow prose | eval trace assertions (question count) |
| Examples are varied (§6) | review checklist | lint of reference files for saturated looks and repeated example products |

## 13. Review checklist

- [ ] Uses the templates and IDs above; gate thresholds match QUALITY-BAR exactly
- [ ] Every non-obvious instruction says why
- [ ] No stacked capitals, no contradictions with other files (searched)
- [ ] Examples follow §6; copy examples pass CPY and SLP-14
- [ ] Sources listed; licences respected; quotes under 15 words and at most one per file
- [ ] Within size budget; TOC when over 100 lines
- [ ] Harness-neutral (§10)
- [ ] Commands named exactly as in [ARCHITECTURE §7](ARCHITECTURE.md#7-the-uie-cli)
