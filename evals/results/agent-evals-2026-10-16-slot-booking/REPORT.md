# Round 6, 16 October 2026: the three round-5 fixes on `slot-booking`

Round 5 met both release bars in all three skill runs on `slot-booking` and listed three problems in the skill, all
fixed after it: same-cause proposals collapsed on the one-line bundle (`3f479cc`, ADR-039 amended), the verifier
rejected a true problem for one overstated clause (`3f479cc`, `corrected_description`), and the checks that wait came
late and were spread over several verifiers (`31ecaaf`, `time_bound` candidates in a part of their own). This round ran
the same eval three times with those fixes, to see whether they show in use and whether the bars still hold.

## Summary

- **Both release bars met in all three runs again.** Recall 13 of 14 seeded defects in every run, the five
  deterministic ones each time; precision of judged findings 0.91 (29 of 32), 0.88 (28 of 32) and 0.92 (23 of 25),
  against round 5's 0.97, 0.94 and 0.92. All nine script assertions passed in every run.
- **Fix 1 held.** The same-cause proposals had at most 5, 4 and 3 members (round 5: 31, 35 and 38), and the leads
  accepted them whole or in part without taking a large group apart.
- **Fix 3 changed the order, and missed the bar set for it by one to four calls.** Every run put all its `time_bound`
  candidates (4, 7 and 6) in the first part and none elsewhere, and that part's verifier started its five-minute wait
  as its first probe, in the background, 0.4 to 0.7 minutes after it started (round 5: the 16th to 57th call). The plan
  asked for it within the first five calls; it came as the 8th, 9th and 6th, after the verifier read its packet.
  All verification took 18.3, 18.4 and 7.7 minutes (round 5: 15.1, 28.5 and 20.6).
- **Fix 2 is used, and did not save the defect it was written for.** Verifiers confirmed 7, 12 and 6 findings with a
  corrected description. The slot length kept in a tooltip (D13) was found in no run: in run 2 the code reviewer
  reported it as "only in the slot buttons' title attribute", and the verifier rejected it because the page states the
  slot length twice and the confirm page shows the end time. That is the round-5 case again, and the ground truth's
  own description of D13 mentions only one of those statements.
- **Two problems in the fixture, one in the skill.** The permit field is never hidden (a stylesheet rule overrides
  `hidden`), so D07's "appears 1.2 seconds later" does not happen on the page and every verifier who checked that claim
  rejected it, rightly; and D13's description leaves out the page's second statement of the slot length. In runs 1
  and 3 the lead ended its turn 20 and 21 times while subagents were running, which the audit workflow tells it not
  to do; the runner keeps such a session alive, a plain `claude -p` might not.

## 1. Objectives ("What do I need to know?")

Whether the three fixes made after round 5 show in use, and whether the release bars still hold with them (PLAN.md,
written and hashed before the runs).

## 2. Tasks

Eval 21 (`audit-standard-slot-booking`), unchanged from round 5: the same prompt, site files with the same source
hashes, the same ground truth of 14 seeded defects (five deterministic, nine judged). One arm, `with_skill`, three
runs, with the plugin at `31ecaaf`, Claude Code 2.1.299 and `claude-opus-5-5`. No control arm: the fixes change only
the skill, and round 5's controls on the same fixture (12 or 13 of 14 found, precision 0.77 to 0.90, about $1 a run)
stand as the comparison.

## 3. Data

As in round 5: transcripts, the runs' files, time, tokens and cost; the nine script assertions; for every run two
blind graders under neutral codes (L5, W8, C3), who mapped each confirmed finding to a seeded defect, to "real but not
in the ground truth" or to "not a problem", and an adjudicator for their one split; the trace checks. For the fixes:
the code reviewer's locations, the proposals and `--accept` calls, every verifier packet and verdict file, and each
verifier subagent's calls in order.

## 4. Analysis

The questions, measures and pass conditions are PLAN.md's, decided before the runs. Rates carry adjusted-Wald 95%
intervals; with n = 3 no significance test is claimed. Instrument changes made while grading are listed in PLAN.md's
deviations; the round-5 figures this report compares with were measured again with the same scripts where the plan's
measure is new.

## 5. Results

### 5.1 Release bars

| Run | Recall (seeded) | Deterministic | Judged precision | All reported | Assertions | Time | Cost |
|---|---|---|---|---|---|---|---|
| 1 (L5) | 13/14 = 93% [66%–100%] | 5/5 | 29/32 = 0.91 [0.75–0.98] | 34/37 | 9 of 9 | 54 min | $25.44 |
| 2 (W8) | 13/14 = 93% [66%–100%] | 5/5 | 28/32 = 0.88 [0.71–0.96] | 31/35 | 9 of 9 | 55 min | $26.99 |
| 3 (C3) | 13/14 = 93% [66%–100%] | 5/5 | 23/25 = 0.92 [0.74–0.99] | 30/32 | 9 of 9 | 39 min | $26.94 |
| Round 5, runs 1–3 | 13, 14, 13 | 5/5 each | 0.97, 0.94, 0.92 | | 9 of 9 each | 51–68 min | $26.37–$27.96 |

Both bars (recall ≥ 0.6, judged precision ≥ 0.8) were met in every run. Each run missed only D13, which round 5
found once. Precision fell in runs 1 and 2: the graders called 3, 4 and 2 judged findings not a
problem (round 5: 1, 2 and 3). Four of those nine were findings the verifier had confirmed with a corrected
description (5.3). The lower ends of the intervals are now 0.71 to 0.75, below round 5's lowest, 0.78. The graders
agreed on every item in two runs and on 36 of 37 in the third.

### 5.2 Fix 1: same-cause proposals on the bundle (PLAN question 2)

| Run | Bundle locations with a column | Same-cause proposals | Largest | Accepted (members applied of proposed) | Most findings on one defect |
|---|---|---|---|---|---|
| 1 | 43 of 69 | 12 | 5 | 6: 2/2, 2/5, 2/4, 2/3, 2/2, 3/4 | 6 (D07) |
| 2 | 39 of 65 | 10 | 4 | 8: 2/2, 3/3, 4/4, 2/2, 3/4, 2/2, 2/2, 2/2 | 7 (D07) |
| 3 | 31 of 64 | 7 | 3 | 6: 2/2, 2/2, 3/3, 2/2, 2/2, 2/3 | 6 (D07) |
| Round 5 | 19 of 65, 47 of 75, 41 of 79 | 10, 3, 3 | 31, 35, 38 | taken apart two or three at a time | 7, 4, 5 |

The pass condition (no proposal of more than ten members) was met in every run. The share of bundle locations with a
column moved little (62%, 60% and 48%, against round 5's 29%, 63% and 52%), so the gain comes from grouping by it: on
a minified line a location without a column now seeds nothing, and one with a column groups only with its neighbours. The most findings on one defect did not fall: D07, the permit,
drew six or seven findings a run, partly because of the fixture problem in 5.6.

### 5.3 Fix 2: corrected descriptions (PLAN question 3)

| Run | Confirmed with `corrected_description` | Their mapping | Rejected as not reproduced | Seeded defect lost to a rejection |
|---|---|---|---|---|
| 1 | 7 | 5 seeded, 1 not a problem, 1 merged into another | 3: Next with no slot (D01, found elsewhere), the step list (not seeded), the permit delay (D07, found elsewhere) | none |
| 2 | 12 | 5 seeded, 1 real, 2 not a problem, 4 merged into others | 3: the slot length in a title attribute (**D13**), the step list (not seeded), the permit delay (D07, found elsewhere) | D13 |
| 3 | 6 | 3 seeded, 1 real, 1 not a problem, 1 merged into another | 2: Next with no slot (D01, found elsewhere), the permit delay (D07, found elsewhere) | none |

The verifiers used the new rule 25 times, mostly to trim a clause that did not reproduce (a second width, a "not
marked aria-busy" the probe contradicted, a count of rows). Four of the nine findings the graders called not a
problem had been corrected; in three the correction only narrowed the scope, and in one the verifier's own note said
the impact was overstated. Whether those four would have been rejected without the rule cannot be told from one round.

The expectation, no seeded defect lost to a rejection for wording, was not met. Run 2's code reviewer wrote that the
slot's end time and the arrival rule "exist only in the slot buttons' title attribute"; the verifier found the title,
then rejected the candidate because the intro says "the 20-minute slot you will arrive in", the Opening days section
says "Slots last 20 minutes" and the confirm page shows "08:00 to 08:20". That is the "only" the instruction names, and
the verifier treated it as the whole claim rather than one clause. It also has a case: what the ground truth seeds
(the button shows only its start time, and the end of the window is only in a hover tooltip) is true, but the ground
truth says the page states the slot length once, and it states it twice. In runs 1 and 3 no inspector reported D13.

### 5.4 Fix 3: checks that wait (PLAN question 4)

| Run | `time_bound` in part 1 / elsewhere | Waiting verifier: first long wait | Started after | Background | First pass | Split pass | All verification |
|---|---|---|---|---|---|---|---|
| 1 | 4 of 4 / 0 | call 8, its first probe | 0.6 min | yes | 9.1 min | 8.4 min, waited again (call 14) | 18.3 min |
| 2 | 7 of 7 / 0 | call 9, its first probe | 0.7 min | yes | 9.5 min | 7.9 min, waited again (call 4) | 18.4 min |
| 3 | 6 of 6 / 0 | call 6, its first probe | 0.4 min | yes | 7.7 min | none | 7.7 min |
| Round 5 | spread over 2 or 3 parts | calls 26, 16 and 57 (run 3's in the split pass) | 1.8, 1.5, 7.6 min | 2 of 3 | 4.6, 10.0, 7.5 min | 1.4, 16.5, 12.6 min | 15.1, 28.5, 20.6 min |

The packet did what it was changed to do: every hold candidate went to one verifier, whose README named them, and
that verifier's first probe was the wait, run in the background while it checked the rest. The plan's bar, the wait
within the first five calls, was not met: the calls before it read the README, the candidates, the dismissals, the
probe help and the captured pages, which a verifier needs before any probe. The part that waited was the longest of
its pass each time (9.0, 9.4 and 7.6 minutes, against 3.3 to 8.1 for the others), so the first pass did not get
shorter. All verification was shorter in runs 2 and 3 and longer in run 1 than in round 5's runs; the passes over
split parts, which in runs 1 and 2 again got two hold candidates each and started their waits early, took about 8
minutes, where round 5's took 1.4, 16.5 and 12.6.

### 5.5 Precision by role, design notes, honesty and trace (PLAN questions 5 and 6)

- Design notes 7, 5 and 7 a run (round 5: 6, 9 and 7), listed apart in every report. Counted findings only the
  critics reported: 1, 2 and 1, of which the graders called 1, 1 and 0 real (round 5: 5, 2 and 0, all real). The other
  judged findings: 28 of 31, 27 of 30 and 23 of 24 (round 5: 26 of 27, 31 of 33, 35 of 38).
- Report lint 0 violations in every report; every run computed no level against a target of L3 and claimed none.
- The 45 black-box subagents (16, 15 and 14) read no source. No unknown probe action, role-schema error, back-button
  workaround or browser script; 15, 30 and 31 sandbox refusals (round 5: 32, 18 and 29); one failed evidence read in
  run 1, one schema and two evidence reads in run 3.

### 5.6 Problems seen in this round

1. **The fixture's permit field is never hidden.** `#permit-wrap` carries `hidden`, but the stylesheet's
   `.field{display:flex}` overrides the browser's `[hidden]{display:none}` and the stylesheet has no `[hidden]` rule of
   its own, so the field shows for every vehicle and the 1.2-second reveal D07 describes has no visible effect. The
   code reviewer, reading the bundle, reported the delay in every run; the verifier rejected it in every run, rightly,
   as it did in round 5. D07 was still found each time, from the field's other faults, which makes it the defect with
   the most findings. The fixture should be fixed, or D07 described as the page behaves, before it is used again.
2. **D13's description leaves out half of what the page says.** The ground truth says the intro mentions the slot
   length once; the Opening days section says it too, and the confirm page shows the end time. The seeded fault (the
   slot button shows only its start, the end only in a hover tooltip) stands, but it is weaker than described, and a
   verifier who reads the page as a whole can reject it in good faith.
3. **The lead ended its turn while work was running**, 20 times in run 1 and 21 in run 3 ("Both watches are armed; I'll
   act as each completes"), none in run 2 or in round 5. The runner lifts print mode's limit on waiting for background
   work, so these sessions went on; a plain `claude -p` stops waiting after 600 seconds and ends the session. The audit workflow says to keep
   the turn; the instruction alone did not hold.
4. **A pass over split parts overwrites the first pass's packet.** `uie packet --role finding-verifier` for the split
   parts rebuilds `packets/finding-verifier-1`, so the record of what the first part's verifier was given is lost (this
   report read it from the transcript).
5. **The verifier still rejects a true problem whose wording overstates it**, at least where the overstated word
   carries the claim (5.3).

## 6. Limitations

- n = 3 runs and one arm; the intervals are wide (13 of 14 has a lower bound of 66%), and the comparison with round 5
  crosses days, not arms.
- No control arm this round; round 5's controls stand in for it.
- The time-bound detector was written against round 5's wording on this fixture; it found every hold candidate here,
  but nothing in this round tests it on another site.
- The ground truth has the two problems in 5.6; grading used it as it was before the runs.
- The runs, graders and adjudicator are instances of the same model family.

## 7. Next steps

- Fix the fixture: give the permit field a working `hidden` (or describe D07 as the page behaves) and either remove
  the Opening days sentence from the slot page or describe D13 with it; calibrate again.
- Make the verifier's correction rule cover a claim whose "only" is contradicted by the page: confirm the part that
  reproduces (the slot button shows only its start time) and correct the rest, rather than rejecting it.
- Keep the first pass's packets when a later pass builds its own (a new folder per pass).
- Look at why the lead ends its turn in some runs and not others, and whether `claude -p` without the runner's setting
  would have ended those sessions.
- Run the fixed fixture again with the controls, since the fixture change touches D07 and D13 for every arm.
