# Round 5, 2026-10-12: the bundled fixture, plan written before the runs

## Objective ("What do I need to know?")

Two things rounds 3 and 4 left open. First, whether the skill finds more than a plain session when reading the
source is not an option: round 4 showed a control with only the system tools reading `tool-library`'s source and
finding 12 of 13 seeded defects from it, so the new fixture, `slot-booking`, ships as a minified bundle, computes its
colours at run time and seeds its problems in timing, geometry, computed colour, runtime order and state. Second,
whether the changes released in 2.3.0 after round 4 show in use: ADR-040 (a design critic's remark is a design note
unless it names a harm), partial acceptance of same-cause proposals, one meaning of `advisory`, packet screens
labelled by route, and the verifier starting its waiting checks first.

## Tasks

Eval 21 (`audit-standard-slot-booking`): "Residents will have to book a slot online before bringing anything to the
recycling centre from next month, and the agency has handed over the booking site as a built bundle. Could you review
the booking flow for usability and accessibility problems and tell me what to fix first? Most residents will book on
a phone the evening before, and a lot of them use dark mode. The site is served from this folder." Three arms with
three runs each, as in round 4:

- `with_skill`: the 2.3.0 plugin (commit `d1cf7f6`, or the commit the snapshot records);
- `without_skill`: the same request without the plugin, on this machine's PATH (Python Playwright reachable);
- `without_skill_nobrowser`: the same, with a PATH that holds only the system tools (no Playwright, Node or npx).

The fixture: Dunmore recycling centre's drop-off slot booking, four steps, light and dark themes, two journeys, 14
seeded defects (five deterministic, nine judged), deterministic calibration 5 of 5 detected with 0 false positives
(`evals/results/detectors-2026-10-12-slot-booking.json`). A second blind labeller is labelling it before the runs; if
the ground truth is revised, grading uses the revised file and the report gives recall against the seeded 14 as well.

## Data

As in round 4: transcripts, run files, hashes, time, tokens and cost; the script assertions of eval 21; two blind
graders and an adjudicator per complete run, `agree-graders.mjs`; `trace-check.mjs`; the controls' tools and files
from their transcripts (what a control can do with a bundle: strings it can read, behaviour it cannot).

## Analysis, decided now

| # | Question | Measure | Pass or expectation |
|---|---|---|---|
| 1 | Release bars over three runs | recall ≥ 0.6 and judged precision ≥ 0.8 per run, by the adjudicated mapping, with adjusted-Wald 95% intervals | met in all three runs, or the count of runs that meet each is reported |
| 2 | Does the bundle take the source route away? | per control run: files read, bundle reads, browser scripts written and run, and recall by meaning; against round 4's controls (13 of 13 with a browser, 12 of 13 without) | the no-browser control's recall is reported against round 4's; the browser control's as well |
| 3 | Skill against the two controls | recall, precision, cost, time per run and arm means (n = 3); which arm found the deterministic defects and the timing-and-state defects (D01, D02, D08, D09, D11) | reported with intervals; no significance test with n = 3 |
| 4 | ADR-040 in use | critic findings without a harm kept as design notes (uncounted); the share of judged findings that only the critics reported and that the graders called not a problem, against round 4's 11 of 34, 9 of 24, 11 of 27 | fixed if that share falls and the report has a "Design notes" section; not exercised if the critics report nothing |
| 5 | Partial same-cause acceptance | `--accept S<n>:…` used; the most findings mapped to one defect, against round 4's 7, 8, 10 | reported |
| 6 | One meaning of advisory; screens by route | no inspector output carries `advisory`; critic findings' routes are configured routes, not folder slugs | 0 and 0 |
| 7 | Verifier waits first | the verifier part that holds the 5-minute hold check starts it first (transcript) and the first verification pass's wall time, against round 4's 6 to 14 min | reported |
| 8 | Honesty and trace | level claimed ≤ computed; report lint 0; the trace assertions | 0 overclaims, 0 violations |
| 9 | Code reviewer on a bundle | what the code reviewer's locate pass attaches when the source is minified; whether the reply says the source was not readable | descriptive |

Decided now: the matching rules of rounds 3 and 4 apply; a run terminated by the harness or by an account limit is
recorded and replaced; instrument changes after seeing results are logged below with a time and every arm re-graded.

## Deviations from the plan (recorded as they happened)

(none yet)
