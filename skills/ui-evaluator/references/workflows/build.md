# Workflow: build

Implement UI to the locked direction and to the floor, with mechanical checks running during the build. The builder can run checks and fix what they find. The builder never certifies quality: the verdict comes from the independent `audit`, because people grading their own work skew positive.

## Contents
1. Purpose and when to use
2. Preconditions
3. Inputs and outputs
4. Steps
5. User checkpoints
6. Exit criteria
7. Degraded operation
8. Common failure modes

## 1. Purpose and when to use

Use this workflow when creating or substantially changing UI: new pages, components, redesigns, or the implementation side of a fix that is larger than a single finding.

## 2. Preconditions

| Precondition | Check | If missing |
|---|---|---|
| `PRODUCT.md` complete | DEC-01 | `setup` |
| Locked direction in `DESIGN.md` | DEC-02; for new work DEC-03 | `direct` |
| App runs locally | the config's start command works | fix the environment, or build in static mode (§7) |
| Toolchain verified this session | `uie doctor` | `setup` step 2 |

## 3. Inputs and outputs

**Inputs:**
- `DESIGN.md` (tokens, modes, attributes, motion budget, state model);
- `PRODUCT.md` (content and facts);
- `.ui-evaluator/journeys/`;
- the knowledge files named below.

**Outputs:** code changes; tokens implemented in the project's styling system; a self-check run under `.ui-evaluator/runs/`.

## 4. Steps

1. **Plan the surface before code.** For each surface, write down:
   - its mode;
   - its single job;
   - the one primary action;
   - the content it shows: real content from `PRODUCT.md`. Where a fact is missing, plan copy that works without it, and list the gap for the owner (`../knowledge/content-copy.md` §3.5). A labelled placeholder is the last resort and never sits in the first viewport or on the primary action;
   - the components it needs;
   - every state those components need (rest, hover, focus-visible, pressed, disabled, loading, empty, error, success).

   Missing states are the most common gap in generated UI [CRAFT-053].

2. **Implement tokens first.** Translate `DESIGN.md` tokens into the project's styling system: CSS custom properties, the Tailwind theme, or a token file the build already uses. Cover:
   - colour roles;
   - type roles, sizes and line heights;
   - spacing, radius, elevation and motion tokens.

   After this step, components reference tokens only. A raw hex value, a raw palette utility (`bg-indigo-500`) or an off-scale spacing value inside a component is drift (COL-01, LAY-01). Read `../knowledge/typography.md`, `../knowledge/color.md`, `../knowledge/layout.md` and `../knowledge/shape-depth.md` for the rules each token must satisfy.

3. **Use conventional structure.** Navigation placement, control types, form patterns and page anatomy follow what users of this surface type expect. Distinctiveness goes into the brand layer (type, colour, imagery, voice, one signature moment), not into unfamiliar controls [P3].
   - Use semantic HTML and native controls first.
   - Add ARIA only for widgets HTML lacks, and only together with the keyboard model those widgets require [TOOL-09].
   - One `h1` per page; headings in order; landmarks present.

4. **Build components with their full state sets.** Follow `../knowledge/components-states.md`. The rules most often missed:
   - focus-visible styles that differ from hover;
   - keep the primary submit button enabled and validate on submit;
   - errors next to the field, which say how to fix them and keep the user's input;
   - empty, loading and error states for every data view.

5. **Write the copy as you build.** Follow `../knowledge/content-copy.md` (and `../knowledge/cjk.md` for Chinese):
   - verb + object labels;
   - one name per action throughout the flow;
   - quiet success messages;
   - no hype words;
   - no invented claims (SLP-12). Write around a missing fact where the page can do without it ("we confirm the address when you book"). Where the page cannot work without it, follow `../knowledge/content-copy.md` §3.5.

6. **Make it responsive.** Build mobile-first. Make sure layouts reflow at 320 px without horizontal scrolling, keep touch-primary targets at least 44 px, and respect safe areas. Size layouts by available width, not by device.

7. **Hold the accessibility floor while building,** as constraints, not caution:
   - contrast;
   - visible focus;
   - keyboard operability;
   - labels;
   - target sizes;
   - `lang`;
   - a reduced-motion path for every animation.

   See `../knowledge/accessibility.md`.

8. **Add motion last, and only as planned.** Use the motion tokens and the frequency budget in `DESIGN.md`:
   - no animation on keyboard-initiated or very frequent actions;
   - feedback motion only on Operate and Read surfaces;
   - at most one orchestrated sequence on Persuade surfaces.

   See `../knowledge/motion.md`.

9. **Lint continuously.**
   - In Claude Code with the plugin, the lint hook reports hard tells and floor violations after each edit. Fix them before moving on.
   - Elsewhere, run `uie lint --changed <file>` after editing a UI file, and `uie lint` before each self-check.

   A finding here usually means a decision was skipped. Fix it by deciding something specific, not by swapping in the next fashionable default.

10. **Self-check, mechanically, at most twice.**
    1. `uie run new --label build-check`
    2. `uie capture`
    3. `uie audit --quick`
    4. `uie lint`
    5. Fix the deterministic failures in G1–G4: functional, accessibility, craft floor, hard tells.
    6. Repeat once at most. If deterministic failures remain after two rounds, list them for the audit instead of looping.

    Do not judge your own design quality here. That belongs to isolated critics [IMP-030/032].

11. **Finish pass.** Open the step 10 captures at 375 px and 1280 px next to the brief, and look at them the way a first-time visitor in the use scene would. This pass makes the page better. It does not certify it, because the verdict comes from the panel. Fix whatever fails these checks:
    - **It looks finished.** Nothing reads as a wireframe. There are no placeholder boxes in the first viewport or on the primary action, no browser-default controls, and no flat system grey that the direction did not choose. No section is only a heading and a list. Bands and columns line up with the layout.
    - **The product has an identity.** The name is set as a designed mark (type, colour or a small device from the referent), not as body text. The first viewport says what this is and for whom.
    - **The referent shows in several places,** for example the ground, the type, one drawn device and the copy voice, not in one isolated signature. One clever detail inside an otherwise default page reads as default.
    - **There is something to look at,** suited to the mode. On Persuade and Read surfaces that means imagery, illustration, a drawn device or a strong typographic moment. On a Persuade surface, the referent's own object (the tag, the ticket, the seal) should appear in the first viewport, drawn or photographed, not only named. On Operate surfaces it means type and colour that make the job pleasant to do.
    - **The colours hang together.** Look at the captures blurred. The large areas should share one family, with strong hues kept small (roughly 60/30/10; `../knowledge/color.md` principle 8). Two or more large flat blocks of unrelated hues read as a template's colour-coding.
    - **Flat is a decision.** If every surface is a flat fill or a hairline, ask whether the referent's material would read better with depth: card on a ground, or a paper object casting a soft shadow (`../knowledge/shape-depth.md`).
    - **The wide layout is composed for the width.** At 1280 px there are no half-empty columns, no empty bands and no narrow strip floating in a wide field. Either use the width (facts beside the form at matched heights, the referent's object beside the text), or set the page narrower on purpose.
    - **Controls are styled, not left at the browser's defaults.** Keep them native, and give them the direction's accent (`accent-color`), comfortable sizes, a themed focus ring and, for a few options, choice cards.
    - **The type has a voice.** The display role differs from the body in more than size, through its face, weight or width, and the headings step clearly. A page set entirely in the platform's UI sans has no type voice, even when every size is right. With system fonts only, most platforms still ship faces with a point of view; choose one for its job.
    - **Every primary action works as shipped.** A booking link with no address, or a form with nowhere to send, is broken. Build what you can (a small server that keeps sign-ups and lets the owner read them); only facts the owner alone has become settings (`../knowledge/content-copy.md` §3.5).
    - **Then remove** any decoration without a job [IMP-056]. Each screen keeps one primary action and one signature moment at most. Restraint decides where boldness goes, never whether there is any (ADR-035).

12. **Hand off to `audit`.** Run it at standard depth, or at the depth the owner chose. The build is not "done" until the audit reaches the target level.

## 5. User checkpoints

- When real content or facts are missing: ask; otherwise write around the gap and list it for the owner. Never invent, and never leave a primary action that cannot work.
- When the plan needs a pattern that conflicts with `DESIGN.md`: propose a decision-log entry instead of silently deviating.

## 6. Exit criteria

- The self-check shows no deterministic G1–G4 failures, or the remaining ones are listed for the audit.
- The `audit` workflow has started. "Done" is defined by the audit's gates, never by the build.

## 7. Degraded operation

| Situation | What changes |
|---|---|
| App cannot run locally | Build, then run `uie lint` only. Every browser criterion is `not_run`. Tell the owner the build is unverified |
| No browser layer | Same as above. Ask the owner to allow `uie doctor --install` |
| Existing design system that conflicts with `DESIGN.md` | The design system wins for components. `DESIGN.md` records that decision. Run `direct` in identity-lock mode if the conflict is large |

## 8. Common failure modes

| Failure | Prevention |
|---|---|
| Improvised values per component | tokens first; COL-01, LAY-01; the lint hook |
| Motion on everything (fade-up per section, hover on every card) | motion last, from the budget; SLP-09 |
| Happy-path-only components | the step 1 state list; CMP-01…05 |
| Fabricated metrics, testimonials or logos to fill a layout | facts section; copy written around missing facts; SLP-12 |
| A page that passes every gate and still looks unfinished: a direction made of avoidances, placeholders on show, one isolated signature | the finish pass (step 11); the appeal verdict (DES-07). In the 2026-10-01 benchmark, two such builds lost every blind comparison to builds made without the skill (ADR-035) |
| Placeholder boxes in the first viewport, or a primary action that cannot work | step 1; `../knowledge/content-copy.md` §3.5 |
| Hover-only information or actions | every action reachable without hover (`../knowledge/components-states.md`) |
| Claiming "done" after the self-check | only the audit's gates define done |
