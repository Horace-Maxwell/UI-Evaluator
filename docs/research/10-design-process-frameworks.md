# 10 — Design-process frameworks (how the "create" side should be staged)

- **Date:** 2026-10-01
- **Scope:** Process frameworks that structure *creating* a UI (as opposed to evaluating one), used to stage UI-Evaluator's build workflow. The evaluation methodology itself (ISO 9241-210, HE, CW, usability testing) lives in `06`.
- **Sources read:** [Design Council — The Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/); [GV — The Design Sprint](https://www.gv.com/sprint/) (from *Sprint*, Knapp, Zeratsky & Kowitz, 2016).

## Double Diamond (Design Council, 2003; revised as the Framework for Innovation)

There are two diverge → converge cycles:

- **First diamond:**
  - **Discover** — understand the problem by spending time with affected people instead of assuming.
  - **Define** — reframe the challenge from those insights.
- **Second diamond:**
  - **Develop** — generate *different* answers, drawing inspiration from elsewhere and co-designing.
  - **Deliver** — test at small scale, discard what fails, improve what works.

The later Framework for Innovation version stresses that teams loop back to discovery. Prototyping can start early, and digital products are never "finished". The Council presents it as an invitation, not a manual.

**For UI-Evaluator.** Generic AI UIs skip the first diamond: they assume the problem and jump to a stock layout. They also collapse the second diamond to a single answer, which is the "distributional convergence" failure discussed in `01`/`07`. So the build workflow must:

1. **Discover/Define.** Capture users, top tasks, context and brand attributes in a short brief before any code.
2. **Develop.** Produce more than one genuinely different direction, then choose one with a stated rationale.
3. **Deliver.** Build, evaluate (analytical gates), test with people where possible, and iterate.

## GV Design Sprint (five days)

| Day | Step | What happens |
|---|---|---|
| Mon | Map | Long-term goal; problem map; ask experts; pick a target |
| Tue | Sketch | Review existing solutions (Lightning Demos), then individual four-step solution sketches (incl. Crazy 8s); start recruiting testers |
| Wed | Decide | Critique sketches, vote (heat map), stitch the winners into a storyboard |
| Thu | Prototype | Build a realistic façade of the customer-facing surface in one day |
| Fri | Test | Interview real customers on the prototype and observe |

**For UI-Evaluator:**
- **Lightning Demos → reference gathering.** Look at real, well-crafted references before designing, not at the model's priors. See `07` on reference sources and their licensing.
- **Sketch individually, then decide → independent divergence first, then a structured decision.** The same independence principle as multiple heuristic evaluators.
- **Façade prototypes → evaluate early.** Analytical evaluation works on low- or high-fidelity prototypes (lecture: CW benefits).
- **Friday test with a handful of users** links to the empirical loop in `06`, including the sample-size debate.

## Adopt list

| ID | Practice | Category | Verify | Source |
|---|---|---|---|---|
| PROC-001 | Before writing UI code, write a brief: primary users, top 3–5 tasks, context of use, brand/voice attributes, constraints, and success criteria. | process | manual review (brief exists and is used) | Double Diamond (Discover/Define); ISO 9241-210 via `06` |
| PROC-002 | Explore at least two genuinely different visual directions (type, color, layout, density) before converging. Record why the chosen one fits the brief. | process | manual review (directions + rationale recorded) | Double Diamond (Develop); GV Sprint (Sketch/Decide) |
| PROC-003 | Gather real references (existing products and design-system exemplars) before designing, and note what is borrowed and why. | process | manual review | GV Sprint (Lightning Demos) |
| PROC-004 | Make divergent work independent before merging it (designers, or evaluators, should not see each other's output until synthesis). | process | process log | GV Sprint (individual sketching); lecture (independent severity ratings) |
| PROC-005 | Treat delivery as iterative: build → analytical evaluation → small-scale user test → fix → re-evaluate. Never declare a UI finished after one pass. | process | ledger shows ≥1 evaluate-fix cycle | Double Diamond (Deliver; Framework for Innovation); lecture ("alternate HE/CW & user testing") |
