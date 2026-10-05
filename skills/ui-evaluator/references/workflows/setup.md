# Workflow: setup

Establish context, tooling and scope before any design or evaluation. Usability only exists for specified users, goals and contexts, and every later step (direction, build, audit, study) reads what this workflow writes.

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

Use this workflow when:
- a project has no `.ui-evaluator/config.json` or no `PRODUCT.md`;
- the scope changes (new surfaces, new user group, new locale);
- the owner asks to "set up", "onboard" or "configure" UI-Evaluator.

Other workflows call it automatically when their preconditions are missing.

## 2. Preconditions

None. This is the root workflow. First decide the **input situation**, because it determines what can be verified later:

| Situation | How to recognise it | Consequence |
|---|---|---|
| Source + runnable app | a repository with a dev or start script | full method |
| Live URL only | the owner gives a URL; no source | no code findings; fixes become recommendations |
| Screenshots or design exports only | images only | static mode: runtime claims are `potential — unverified`; no assurance level can be reached |
| Brief only | nothing built yet | setup → direct → build |

## 3. Inputs and outputs

**Inputs:** the repository or URL or images; the owner's answers; any existing `PRODUCT.md`, `DESIGN.md`, brand files, analytics or feedback the owner points to.

**Outputs:**

| File | Notes |
|---|---|
| `.ui-evaluator/preflight.json` | detection results |
| `.ui-evaluator/config.json` | scope, app command, matrix, depth, target level, fix policy |
| `PRODUCT.md` | project root; from `../templates/PRODUCT.md` |
| `.ui-evaluator/journeys/<id>.json` | one per critical journey; from `../templates/journey.example.json` |
| `DESIGN.md` | checked if present; drafted "as built" for shipped products; otherwise left for `direct` |
| `.ui-evaluator/index.md` | appended automatically by `uie` |

## 4. Steps

1. **Detect.** Run `uie detect`. It records the framework, styling system, token sources, component libraries, routes, dev command and port, locales, git state, and whether `PRODUCT.md` or `DESIGN.md` exist. Treat every result as a hypothesis to confirm, not a fact, because detection reads files rather than intent [IMP-003].

2. **Check the toolchain.** Run `uie doctor`.
   - If the browser layer is missing, tell the owner what `uie doctor --install` will download: Playwright with Chromium (about 110 MB) plus small packages, installed into a cache outside the project. Ask before installing. Then run it and re-run `uie doctor`.
   - If the owner declines, continue. Deterministic gates will be `not_run`, and every report will say so.
   - The doctor's smoke test runs every check against a known-bad page and confirms the expected detections. Never skip it: a tool that silently finds nothing is the most common false "clean" result.

3. **Scaffold.** Run `uie init`. It creates `.ui-evaluator/` with a config skeleton, ledgers and a `.gitignore` that keeps `runs/` and raw feedback local. It never overwrites existing files.

4. **Read what exists.** Read `README`, any existing `PRODUCT.md` or `DESIGN.md`, brand or style guides, the design-system or token files found by `detect`, and anything the owner pointed to. Note facts and their source. Label everything you infer as *inferred*.

5. **Ask once, compactly** (interactive sessions only). Ask at most one round, combining what you could not infer into a single message [DSL X1]:
   - who the users are and where they use the product;
   - the single job of each main surface;
   - a *specific* tone referent (a product, publication or place the owner admires), not adjectives alone;
   - hard constraints (brand assets, stack, deadlines, legal);
   - the target assurance level, offering the default (L3 for anything shipped to users).

   Offer sensible defaults and a "go ahead with your read" option. Do not ask aesthetic questions here: direction comes later and is grounded in the answers [IMP-003].

   In non-interactive runs, infer and state your read in one line at the top of `PRODUCT.md`.

6. **Write `PRODUCT.md`** from `../templates/PRODUCT.md`. Required sections (DEC-01, checked by `uie gates`): product summary, users and groups, top tasks (ranked), context of use, positioning, constraints, brand commitments, **facts section**, principles, accessibility needs, platforms and locales, surfaces with their mode, and target level. Label every fact in the product summary, users, facts and surfaces sections `[confirmed: source]` or `[inferred: basis]`; unlabelled facts fail DEC-01.
   - The facts section lists every claim the UI may make (metrics, customers, prices, certifications) with its source. It states absences explicitly ("no customer logos available").
   - Never invent a fact to fill a field. Fabricated proof is both dishonest and a hard tell (SLP-12).

7. **Declare surfaces and modes.** List each surface (page or screen type) with exactly one mode: Persuade, Operate, Read or Experience. Mode sets expressiveness, type ratios and motion budgets later (`../knowledge/brand-expression.md`).

8. **Define critical journeys.** Follow the task-derivation rule in `../methods/cognitive-walkthrough.md`:
   - derive candidates from declared top tasks, analytics funnels, feedback clusters and changed routes;
   - rank them by criticality × frequency.

   For each journey, write `.ui-evaluator/journeys/<id>.json` with:
   - the persona;
   - the goal;
   - a scenario with no UI words;
   - the start state;
   - an observable success condition;
   - the correct action sequence as probe actions;
   - criticality (`critical`, `core` or `peripheral`).

   Apps need at least one critical journey.

9. **Configure scope** in `.ui-evaluator/config.json` (see `../templates/config.example.json`):
   - routes with their mode;
   - **state recipes**, the clicks that open menus, dialogs, tabs, error states and empty states, so that hidden content is evaluated;
   - the viewport matrix (default 320, 375, 768, 1024, 1280, 1440) and themes shipped;
   - locales and the platform profile (`web` by default; see `../knowledge/platforms.md`);
   - depth (`quick`, `standard` or `rigorous`) and target level;
   - fix policy (commit per fix or patch files) and evaluator models.

   Every `uie` command validates the config when it loads.

10. **Start the app and validate journeys** (when there is source). Put the start command in `config.app.start` (with `cwd`, `env`, `ready_url`). The browser commands (`uie capture`, `audit`, `journey`, `probe`) start the app themselves when the base URL does not answer, wait for `ready_url`, and stop it afterwards; when no start command can be configured, start it yourself in the background. Run `uie journey <id>` for each journey. A journey that fails here is either a broken recipe (fix the recipe) or a real defect (keep it: it will appear as FUN-03 in the audit).

11. **Handle `DESIGN.md`:**
    - If it exists, run `uie tokens check` and fix structural problems in the file only, with the owner's agreement.
    - If the product is already shipped and has no `DESIGN.md`, run `uie tokens extract` to draft one *as built*. Mark it "as built — not endorsed", and never canonise a pattern the audit later rejects [IMP-051].
    - If this is new work or a redesign, leave `DESIGN.md` to the `direct` workflow.

## 5. User checkpoints

- Before installing the browser layer: ask, stating the size.
- The single compact question round (step 5).
- Show the owner the one-line read, the surfaces with their modes, the critical journeys and the target level. Corrections are cheap now and expensive later.

## 6. Exit criteria

- `uie doctor` passed in this session (EVD-02), or the owner declined and the limitation is recorded.
- DEC-01 passes: `PRODUCT.md` has every required field, inferred facts are labelled, and the facts section is present.
- At least one critical journey exists for apps, and replays or is recorded as failing.
- The config validates.
- The next workflow is named: `direct` for new work or redesigns, `audit` for existing UIs.

## 7. Degraded operation

| Situation | What changes |
|---|---|
| Live URL only | Journeys are written from black-box exploration. `uie detect` and `uie lint` do not apply. Every `uie` browser command needs `--allow-remote`, and only with the owner's agreement, because the target is not local |
| Screenshots only | No journeys replay and no doctor browser check. Record in `PRODUCT.md` that no assurance level is reachable [ADR-023] |
| No answers from the owner | Infer, label as inferred, proceed. Re-confirm at the first report |

## 8. Common failure modes

| Failure | Prevention |
|---|---|
| Inventing users, metrics or testimonials to make `PRODUCT.md` look complete | The facts section with explicit absences; SLP-12 catches leaks into the UI |
| Asking many questions, or aesthetic questions, too early | One compact round; aesthetics are decided in `direct` |
| Overwriting an existing `DESIGN.md` or brand file | `uie init` never overwrites; propose diffs instead |
| Journeys written with UI words ("click Book now") | Scenarios use the user's goal and words; UI labels belong only in the action sequence |
| Forgetting state recipes, so audits see only default states | List menus, dialogs, errors and empty states in the config |
