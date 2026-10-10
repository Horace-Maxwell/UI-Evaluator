# Round 4, 2026-10-08: the fixed skill on `tool-library`, three runs per arm, plan written before the runs

## Objective ("What do I need to know?")

Whether the four skill changes made after round 3 (`CHANGELOG.md` Unreleased: advisory observations are not findings,
ADR-038; same-cause proposals before rating, ADR-039; parallel verifiers; the audit workflow keeps the turn, runs the
deterministic checks in the background and cites strengths at audited widths) show in use; whether the standard-audit
bars hold over three runs rather than one or two; and what a control without a browser finds, beside one with a
browser, on a fixture whose problems show only in use.

## Tasks

Eval 20 (`audit-standard-tool-library`), the same prompt as round 3, three arms with three runs each:

- `with_skill`: the plugin as committed after round 3 (version string still 2.2.0; the snapshot records the commit);
- `without_skill`: the same request without the plugin, on this machine's PATH (Python Playwright reachable, as in
  round 3);
- `without_skill_nobrowser`: the same, run with a PATH that holds only the system tools (`/usr/bin:/bin:/usr/sbin:/sbin`,
  `PYTHONNOUSERSITE=1`): no Playwright, Node or npx. This approximates "a machine without a browser driver"; it is not
  a different machine, and the report says so.

The fixture is `tool-library` as committed after round 3 (13 seeded defects). A second blind labeller is labelling it
in parallel; if the ground truth is revised before grading, grading uses the revised file and the report gives recall
against the original 13 as well, so round 3 and round 4 stay comparable.

## Data

As in round 3: transcripts, run files, hashes, time, tokens and cost; the script assertions; two blind graders and an
adjudicator per complete run; `agree-graders.mjs`; `trace-check.mjs`; the controls' browser use from their transcripts.

## Analysis, decided now

| # | Question | Measure | Pass or expectation |
|---|---|---|---|
| 1 | Release bars over three runs | recall ≥ 0.6 and judged precision ≥ 0.8 per run, by the adjudicated mapping, with adjusted-Wald 95% intervals | met in all three runs, or the count of runs that meet each is reported |
| 2 | Advisory observations (ADR-038) | advisory tool hits confirmed or promoted: 0 in every run; the report has an "Advisory observations" section; the graders map no advisory tool finding | fixed if 0 and the section exists; not exercised if the audit produced no advisory hit |
| 3 | Same-cause grouping (ADR-039) | `S<n>` proposals listed after `--apply-locate`; the most findings the graders map to one seeded defect, against round 3's 9 and 8 | fixed if proposals were listed and accepted and the maximum per defect is lower than round 3's; still present if the lead ignored them |
| 4 | Keeping the turn | no run terminated by the harness; no lead ends a turn with subagents running (transcript) | fixed if 0 terminations and 0 such turn ends in three runs |
| 5 | Parallel verifiers and the background audit | verifier wall time and the time from `uie audit` start to the first inspector spawn, against round 3's 16–23 min and 15 min | reported; fixed if the audit overlapped the inspectors or the verifier ran in parts |
| 6 | Strengths at audited widths | "keep" items in the reply checked against the fixture at 375 px | 0 false strengths |
| 7 | Skill against the two controls | recall, precision, cost, time per run and arm means (n = 3); which arm found the deterministic defects | reported with intervals; no significance test with n = 3 |
| 8 | What a control without a browser does | its transcript's tools and files; what it found and missed | descriptive |
| 9 | Honesty and trace | level claimed ≤ computed; report lint 0; the trace assertions | 0 overclaims, 0 violations |

Decided now: the matching rules of round 3's plan apply unchanged; a run terminated by the harness is recorded and
replaced, as in round 3; instrument changes after seeing results are logged below with a time and both arms re-graded.

## Deviations from the plan (recorded as they happened)

- 2026-10-08, 17:38–17:53 (America/New_York). The three runs with the skill were cut off after 14 to 15 minutes by
  the account's weekly usage limit: each transcript ends with "You've hit your weekly limit" (exit 1; 37, 32 and 33
  turns; $8.47, $8.75 and $9.06). Under this plan's rule for runs terminated by the harness, they are recorded as
  terminated (`with_skill/run-1` to `run-3`, transcripts and timing kept, not graded) and replaced by `run-4` to
  `run-6`. The six control runs (17:53–17:59) completed and are kept: they do not use the plugin.
- 2026-10-08, before the replacements. The function that splits the verifier's candidates between parallel
  verifiers cut the sorted list into equal slices, so a route's candidates could land in two packets, although the
  audit workflow, the verification method and the changelog say each route's candidates stay together. It was
  corrected (one packet per route, and a route with more candidates than a packet holds cut into packet-sized
  pieces), with a test, and the four changes were committed as `cd5583f`. The snapshot the terminated runs used is
  kept as `plugin-snapshot-terminated`; the replacements run on a fresh snapshot of `cd5583f`. The prompt, the
  fixture and the grading are unchanged.
- 2026-10-08. The second blind labeller was cut off by the same limit before it wrote its list. It was started again
  on the same instructions, told that the earlier attempt's working files (a Playwright script, measurements and
  screenshots) are in its folder and may be reused or redone.
- 2026-10-08, 20:41. The first start of the replacements was refused at once by the same weekly limit: the
  headless binary is signed in to the account that hit it. No tokens were used, and the attempt's files were removed
  so the runs can start cleanly. The replacements wait until the binary runs on an account with quota.
- 2026-10-08, before any round-4 run was graded. The second labeller's list (52 problems, 51 reproduced or measured in
  a browser; `second-labeller.json` here) found all 13 seeded defects, and every severity band overlapped the
  seeder's. As this plan allows, the ground truth of `tool-library` was revised before grading. Each seeded band is
  now the union of the two labellers' (D09 and D10 widened to [2, 4]). Thirteen problems the fixture did not seed were
  added as found defects, D14 to D26: each was reproduced by the second labeller and reported independently by at
  least two round-3 reviews that the graders judged real. D26 ("Reserve this tool" does not reserve) refines D07 and
  counts toward it in recall against the seeded 13. The grader reports recall against the 13 seeded defects, which
  stays comparable with round 3 (two round-3 runs re-graded with the revised file reproduced their recorded figures
  exactly), and against all 26. The mapping instructions gained the rule that separates D07 from D26.
- 2026-10-09, 22:32 (America/New_York). The replacements started after the headless binary was signed in to an account
  with quota: the weekly windows of the two accounts used so far were full. The binary (2.1.288), the model, the
  plugin snapshot of `cd5583f` and the prompts are unchanged.

- 2026-10-09, 22:40–23:55 (America/New_York), while the replacements ran and after they were graded. Instrument
  notes, all applied to every run they concern:
  - Questions 4 and 5 are read from the transcripts by a phase script written for this round. A turn end is a
    `result` event; `claude -p` writes the results of earlier turns only at the end of the stream, so every result
    before the last is a turn the lead ended while work was running. Run on round 3's transcripts, the script gives
    round 3's recorded phase times (14 minutes to the first inspector, verifiers of 16 and 23 minutes). After seeing
    that the time from the first verifier to the last includes the lead's split work in between, the verifier measure
    was split into a first pass and a second pass over split parts, for both rounds.
  - The controls' source reads count files read through `cat` and leave out Read calls the harness refused. Round 3's
    table had counted Read calls only (6 and 0 files); it is corrected in that report, with the date.
  - Question 2 counts the advisory tool observations, as planned. The accessibility auditor also flags some of its own
    findings `advisory` (two in run 4); those are reported apart.
  - Question 3's comparison figure, "9 and 8", were round-3 run 1's two largest counts; round 3's per-run maxima were
    9 and 6, and the report compares with those.
  - Two analyses were added after the results were seen and are labelled so in the report: judged precision split by
    the role that reported a finding (the design critics alone, or anyone else), also for round 3's runs; and recall
    over the ten found defects that a round-3 control had also reported, since all thirteen were in a round-3 skill
    run's report.
  - Grading: run 5's two graders agreed on all 80 items and both assertions, so its consensus is their agreed mapping
    without an adjudicator; runs 4 and 6 had 4 and 1 splits, settled by an adjudicator. The cut-off runs 1 to 3 were
    graded by script only, as round 3's terminated run was.
