# Workflow: direct

Choose a deliberate visual direction before any UI code is written, and lock it into `DESIGN.md`. This workflow is the main defence against generic output. Generated UIs look "AI-made" when nothing in them was decided for this product, so the job here is to force decisions that come from the product's own world, and to break the model's habit of picking the same top idea.

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

Use this workflow:
- for new products, new surfaces or redesigns;
- whenever `build` finds no locked direction in `DESIGN.md`.

For an **existing** product whose identity must be kept, use the identity-lock variant (step 2) instead of a new direction.

Read `../methods/direction-process.md` for the full procedure and `../knowledge/brand-expression.md` for the levers. This file is the operational checklist.

## 2. Preconditions

| Precondition | Check | If missing |
|---|---|---|
| `PRODUCT.md` complete (DEC-01) | open it; required fields present | run `setup` |
| Surfaces and modes declared | `PRODUCT.md` surfaces list | run `setup` step 7 |
| Ledger available | `uie ledger list` | `uie init` creates it |

## 3. Inputs and outputs

**Inputs:** `PRODUCT.md`, the owner's tone referent, existing brand assets, the ledger.

**Outputs:** everything in `.ui-evaluator/directions/<dir-id>/`, plus `DESIGN.md` and a ledger entry.

| File | Content |
|---|---|
| `brief.md` | the brief |
| `references.md` | references and DNA notes |
| `candidates.json` | the ranked candidate directions |
| `roll-<seed>.json` | the dealt directions and structural parameters |
| `<direction>/contract.md`, `<direction>/tokens.md`, optional `<direction>/specimen.html` | each dealt direction, elaborated |
| `decision.md` | the choice and its rationale |
| `DESIGN.md` (project root) | the locked direction |
| ledger entry | appended by `uie ledger add` |

## 4. Steps

1. **New direction or identity lock?** If brand assets or a design system must be kept, write an **identity-lock sentence**: the actual colours, fonts, layout topology, surface treatment and voice in use. Then produce variants that each commit to a different primary axis (hierarchy, layout topology, type system, colour strategy, density or structural decomposition) without breaking the lock. Reject variants that drift from the lock or rhyme with each other [IMP-053]. Skip to step 9. Otherwise continue.

2. **Write the brief** (`brief.md`) for each main surface [CRAFT-001]:
   - **subject:** what this is, in the product's own terms;
   - **audience:** who, and what they already know;
   - **the surface's single job;**
   - **mode;**
   - **use scene:** who, where and in what light. This decides light or dark; "variety" is not a reason [IMP-011];
   - **3–5 brand attributes as "X, not Y" pairs** (e.g. *precise, not cold*);
   - **tone positions** on the four tone dimensions;
   - **constraints and real content.**

3. **Gather references** (`references.md`): at least three from outside the category and one or two inside it.
   - Use only sources whose terms allow the use you make of them. Galleries that forbid AI use (Mobbin, Dribbble) are for the *owner* to browse. You may ask the owner to share what they like from them.
   - For each reference, write DNA notes: macrostructure, type logic, colour anchor, density, signature move. Never copy assets, copy text or code [CRAFT-008].

4. **Name what is off-limits.** Write down:
   - the page this category always ships;
   - its predictable opposite;
   - the looks currently on the saturated list in `../knowledge/anti-slop.md`.

   All are off-limits unless the brief pins one [IMP-006]. Off-limits means the generic execution, never the subject's own materials. A calligraphy class's rice paper and cinnabar seal, or a repair cafe's luggage tags, are referents. What is off-limits is using them as stock decoration: a seal with no characters of this class, one texture behind everything, a brush font for every heading. Use them with the product's specifics instead: its name in the seal, its real characters, its own dates on the tag (ADR-035).

5. **Generate candidates** (`candidates.json`, schema `candidates.schema.json`): 5–7 directions drawn from the audience's own world, spanning at least three material families (e.g. a printed timetable, a field notebook, a workshop parts drawer, a broadcast lower-third), ranked by fit.
   - On Operate and Read surfaces, directions must not be costumes of the tools the audience uses (a terminal skin for developers, a ledger skin for accountants). Borrow type, density, palette and one signature move instead [07 §4.1].
   - Each candidate states its thesis in one sentence and why it fits the attributes.

6. **Roll.** Run `uie roll --candidates .ui-evaluator/directions/<dir-id>/candidates.json --deal 3`. The roll is seeded and recorded. It deals:
   - one candidate drawn from ranks 3…n, never the model's top two;
   - the model's own top pick, with a familiarity-risk note;
   - the conventional option.

   It also draws structural parameters (fold class, layout families, colour strategy, type-pairing class, density, motion character) from pools not used in recent ledger entries. The mechanical draw exists because prose instructions alone produced identical outputs run after run [ADR-013].

7. **Elaborate each dealt direction in isolation.** Run `uie packet --role direction-designer` once per direction. Then spawn an isolated direction-designer subagent for each (role file `../evaluators/direction-designer.md`), or perform the role yourself one direction at a time if your environment cannot isolate. Each produces:
   - a **contract**: thesis, the audience's world it borrows from, story, first viewport, form;
   - a **token sketch**: OKLCH colour roles with the colour strategy, type roles with scale ratio, measure and leading, spacing scale, radius scale, elevation approach, motion tokens and frequency budget;
   - optionally a **specimen** page showing type, colour roles, a button, a form field, a card and one signature moment.

   If the browser layer is available, capture the specimens with `uie capture --url file://…/specimen.html`.

8. **Run the convergence tests** on each direction and record the result and any revision [CRAFT-004]:
   - **similar-prompt test:** would a similar brief land here?
   - **category-guess test:** could someone guess this look from the category alone, or from the category plus "avoid the usual"?
   - **swap test:** could an unrelated product use it unchanged?

9. **Choose.**
   - Interactive: show the owner the three directions side by side (specimens if rendered), each with a one-paragraph rationale and its familiarity risk, and let them pick or mix.
   - Non-interactive: score the directions against the brief's attributes, the tests and their **appeal to this audience** (would these people find the specimen attractive and finished?), record the scores, and break ties between equally grounded options at random with the recorded seed. Never prefer a direction because it is the least likely to look familiar: the safest direction is usually the barest, and the finished, warm page wins with people (ADR-035).

   Write `decision.md`: what was chosen, what was rejected and why.

10. **Lock into `DESIGN.md`** using `../templates/DESIGN.md`. Include:
    - tokens;
    - modes per surface;
    - attributes;
    - colour strategy;
    - type roles and scale;
    - spacing, radius, elevation and motion tokens, with the frequency budget;
    - the state model;
    - the direction contract and roll seed;
    - the decisions log;
    - `accepted_tells`: patterns the brief explicitly asks for, and the subject's own materials when a detector flags them (step 4), each with its reason.

    Then run `uie tokens check`. If `npx @google/design.md lint DESIGN.md` is available, run it too.

11. **Record the ledger entry and check variety.** Run `uie ledger add --direction .ui-evaluator/directions/<dir-id>/decision.md`, then `uie ledger check`. DEC-04 passes when the new direction differs from the last three entries of the project ledger in display face and macrostructure, unless the brand pins them [CRAFT-010]. On the project's first direction there is nothing to compare with, so DEC-04 is `not_applicable`; repeats found in the opt-in cross-project ledger are listed as advice and never change the state (ADR-034).

## 5. User checkpoints

- Step 2: confirm the brief, especially the attributes and the use scene.
- Step 9: the choice between dealt directions. This is the most valuable question in the whole loop, so keep it concrete and visual.

## 6. Exit criteria

- DEC-02: `DESIGN.md` is complete and validates.
- DEC-03: the direction record has ≥ 2 elaborated directions, off-limits named, convergence tests recorded, the choice and rationale, and the roll seed.
- DEC-04: the ledger variety check passes, or is `not_applicable` on the project's first direction.
- Next: `build`.

## 7. Degraded operation

| Situation | What changes |
|---|---|
| No isolated subagents | Elaborate the directions sequentially. Finish and save each before starting the next. Mark `decision.md` `DEGRADED: single-context` |
| No browser | Specimens are described, not rendered. The owner chooses from descriptions and token sketches |
| Identity lock | Steps 2–8 are replaced by step 1's variant procedure. DEC-03 records the lock sentence and the variant axes |

## 8. Common failure modes

| Failure | Prevention |
|---|---|
| Directions that differ only in colour | Each dealt direction must differ in at least type logic and macrostructure. The roll's structural parameters enforce this |
| "Fixing" slop by swapping to the next fashionable default (bento grid, editorial serif with an italic accent, beige and brass) | Off-limits list (step 4); the rising entries in `../knowledge/anti-slop.md`; convergence tests |
| A direction made of avoidances ("no icons, no shadows, no cream, no seal") that ships a bare page | Every "not" in the contract names what replaces it; the subject's own materials stay available (step 4); appeal is scored at step 9; `build` runs a finish pass (ADR-035) |
| Costumes on Operate or Read surfaces | Step 5 rule: conventional structure, a distinctive brand layer |
| Copying a reference | DNA notes only; blend several references |
| Picking light or dark for variety | Decide from the use scene |
| Skipping the roll because "my first idea is good" | The model's own pick is always dealt. The roll only guarantees it is not the *only* option |
