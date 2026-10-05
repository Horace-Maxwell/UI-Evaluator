<!-- ui-evaluator: study plan template v1 (METHODS §7, QUALITY-BAR EMP-01, methods/usability-testing.md §3.1) -->
# Study plan: [study title]

<!--
Save as .ui-evaluator/studies/<study-id>/plan.md. The plan follows the lecture's chain, objectives → research
questions → participants → tasks with success criteria → data → analysis, then ethics (EMP-01). Sections 1–11 are
required for every study. Add section 12 for a summative benchmark or section 13 for an A/B experiment, and delete the
one you do not use. Write it before recruiting, pilot it, and get the owner's approval in section 14: EMP-01 is
verified by a human, so an unapproved plan does not pass.
Examples describe a fictional language-learning flashcard app. Replace them all.
-->

Contents: 1 Objectives · 2 Research questions · 3 Participants · 4 Method · 5 Tasks · 6 Environment · 7 Roles · 8 Measures · 9 Analysis · 10 Ethics and data · 11 Schedule · 12 Summative · 13 A/B · 14 Sign-off

| Field | Value |
|---|---|
| Study id | `first-week-r1` |
| Type | formative test (formative test · summative benchmark · A/B experiment) |
| Owner | [role, e.g. product lead] |
| Findings this study must settle | F-0021 (divergent: ratings 1, 3, 3), F-0027 (disputed by the owner) |
| Build | git:[commit] on the staging server |
| Status | draft (draft · piloted · approved · running · analysed) |

## 1. Objectives

<!-- One to three decisions the study informs. A study with no decision attached produces a report nobody acts on. -->

1. Decide whether new learners can add their own words and finish a first practice without help, before the October release.
2. Settle divergent finding F-0021 (pasting a word list creates one card instead of ten).

## 2. Research questions

<!-- Specific, answerable by watching, each linked to a task, journey or finding. -->

1. Can new learners add a list of their own words in one go without help? (T1; journey `add-own-words`; F-0021)
2. Do learners find the day's practice and finish it? (T2; journey `daily-practice`)
3. Do learners notice when the next practice is due? (T3; F-0027)

## 3. Participants

<!-- About 5 per distinct user group per round; 3–4 each for two groups; at least 3 each for three or more
(EMP-02). Summative n comes from section 12, A/B n from section 13. -->

| Group | Profile (behaviour, not self-description) | n this round | Must include |
|---|---|---|---|
| New learners | started a language class in the last 3 months; have not used this app | 4 | at least 1 person who uses a screen reader or zoom |
| Experienced learners | used another flashcard app in the past year, not this one | 4 | at least 1 person who studies in Chinese (zh-CN build) |

- Screener: behaviour questions only, e.g. "When did you last study vocabulary outside a class?" Keep the product and the hypotheses out of it. Store screener answers apart from contact details, which are needed only for scheduling.
- Exclude: people who build, sell or support the product; usability professionals; friends of the team.
- Recruiting: [channel, e.g. a language school's newsletter, with the school's permission]. Over-recruit by 1 per group for no-shows.
- Incentive: [amount or voucher], flat, the same for everyone who starts, including anyone who stops early. Never tied to success or speed (FRAMEWORK §9.3).

## 4. Method

<!-- Moderated in person, moderated remote or unmoderated (unmoderated alone cannot meet EMP-02); think-aloud protocol;
rounds; order of tasks. -->

- Moderated remote sessions, 45 minutes, concurrent think-aloud (the default for finding problems).
- Two rounds: round 1, fixes through the `fix` workflow, round 2 on the fixed build. RITE triage after each session if the decision-maker attends every session.
- Task order: T1 first (simplest start); rotate T2 and T3 across participants.

## 5. Tasks and success criteria

<!-- Derived from journeys. Scenario in the participant's words, with no UI labels (task lint against the latest ARIA
snapshots, result recorded here). Success is binary and fixed before any session. Full cards go in tasks.md
(task-card template). -->

| Task | Journey | Scenario (participant wording) | Success criteria (observable) | Stop rule | Critical |
|---|---|---|---|---|---|
| T1 | `add-own-words` | Your class gave you ten new words today. Put them into the app so you can practise them this week. | the ten words exist as ten cards in one set the learner can open again | 8 min, or no progress after two requests for help | yes |
| T2 | `daily-practice` | You have ten minutes before your bus. Go through what the app wants you to practise today. | the session's end screen is shown with all due cards reviewed | 10 min | yes |
| T3 | `daily-practice` | You want to plan your week. Find out which day you should next open the app to keep up. | the participant names the day the app shows, unprompted | 3 min | no |

Task lint: [date; labels deliberately kept out of the wording, e.g. "Deck", "Import", "Review"]

## 6. Environment

- Devices: participants' own phones (iOS and Android) and laptops, matching the context of use in PRODUCT.md.
- Build: git:[commit], recorded in every session; seeded test accounts L-01 to L-10 with no sets; data reset between sessions.
- Recording: screen and voice through [approved tool]; recordings stay in [research storage]; only timestamps enter the workspace.
- Assistive technology: participants use their own set-up.

## 7. Moderator and observer roles

- Moderator: [role]; follows moderator-guide.md; the only person who speaks.
- Note-takers: 2, each filling their own observation sheet; merged after the session.
- Observers: cameras and microphones off; questions go to the moderator in a private channel and are asked only at the end.
- Decision-maker: [role], present at every session if RITE is used.

## 8. Measures

| Measure | When | How it is reported |
|---|---|---|
| Task outcome: success without help, assisted, failed, abandoned | each task | k of n per build; a completion after any hint counts as assisted |
| Observed problems | during tasks | k of n distinct participants per problem |
| Interventions | as they happen | logged with time, words and reason; the segment is excluded from metrics |
| SEQ (7 points) | after each task | per-task mean; "why" asked below 5 |
| UMUX-Lite or SUS (pick one) | end of session | mean with CI; never a benchmark from a formative round |
| Time on task | only in silent or retrospective sessions | geometric mean with CI on log times |
| Reaction cards (optional, EMP-07) | end | share choosing at least one pre-registered on-brand word |

Observer severity scale (optional column in the sheet): [low · medium · high]. It is a note-taker's prior, never a rating.

## 9. Analysis plan

<!-- Written before the first session (analysis-plan.md may hold the detail), so the data cannot steer the analysis. -->

1. After each session: 15-minute debrief; each note-taker lists observations alone first; RITE categories 1–4.
2. Import every sheet: `uie feedback import .ui-evaluator/studies/first-week-r1/data/observation-sheet.csv --source usability --study first-week-r1`; counts from `uie feedback stats`, never by hand.
3. One problem per record; cluster by location, failure mechanism and state; count distinct participants.
4. Link problems to findings (E3) or write candidates for the verifier; re-rate severity with observed k of n (EMP-03).
5. Statistics with `uie study seq|umux|sus|ci|time|rite`; fix confidence 1 − (1 − p)^n for every severity ≥ 3 problem (EMP-05).
6. Will not be reported: percentages of "users", NPS, or SUS benchmarks from this round; causal claims.
7. Behaviour beats opinion: a failed task rated easy is still a failure.

Other feedback analysed with this study (survey free text, tickets, reviews) uses `feedback-import.csv`, one row per item, imported with `uie feedback import <file> --source <source>`:

| Column | Content |
|---|---|
| source | usability, survey, tickets, reviews, interviews, analytics or stakeholders |
| source_ref, channel | the item's id in its system; where it came from, e.g. "post-visit survey" |
| date | YYYY-MM-DD |
| participant_code | a code such as R-0187, never a name or address; names left in are scrubbed with the roster on import |
| quote | the exact words, original language, no corrections |
| context | the survey question, help-desk category or app version the words answer |
| reporter_severity, reporter_scale | the reporter's own rating and its scale, kept apart from severity; a prior only |
| route, screenshot | where it happened; a path under .ui-evaluator/feedback/ (raw/ stays git-ignored) |
| tags | free tags separated by semicolons |

## 10. Ethics, consent and data handling

- Consent: consent.md, signed or recorded verbally before anything is recorded. Recording, quoting and clips are asked separately; a no does not end the session.
- Right to stop or skip at any time, without a reason, keeping the full incentive; said aloud at the start.
- Data minimisation: only what the research questions need; no age, health or other personal characteristics unless a question depends on it (reason: [none]).
- Participant codes (P01…) in every note, file and report. The roster linking codes to people stays with [role] in feedback/raw/ (git-ignored) and is deleted on [date].
- Retention: recordings deleted [n] days after analysis; coded notes kept [period]; deletion on request until [date].
- Quotes: anonymised before they enter a report.
- Higher-risk groups or data (children, patients, health or financial data): owner's ethics or legal review before recruiting. This study: [none / review reference].

## 11. Schedule

| Step | Date | Notes |
|---|---|---|
| Simulated pre-pilot | [date] | `uie journey` replay and clue check; headed "SIMULATED PILOT (not participant data)" |
| Human pilot | [date] | one person outside the team; data not counted |
| Sessions | [dates] | 30–60 min each; at most 6 a day; at least 15 min between sessions |
| Analysis and readout | [dates] | |
| Round 2 on the fixed build | [dates] | re-test every observed problem of severity ≥ 3 (EMP-05) |

## 12. Summative benchmark (only for a summative study)

- Sample size from the margin of error: n ≈ z²·p(1 − p)/E²; default 40 per condition, about ±15% at 95% (`uie study samplesize`).
- Protocol identical across conditions; silent or retrospective sessions when time is measured.
- Report task success with the adjusted-Wald 95% CI; time as a geometric mean with a CI on log times, success-only and all attempts; SEQ mean with CI; SUS with CI (a score, not a percentage).
- Published reference points, for context only: median task completion 78%, SEQ about 5.5, SUS 68 (METHODS §7.3).
- Comparison and decision rule, written before data: [baseline or previous version; what result changes what decision].

## 13. A/B experiment (only for an A/B test)

| Item | Plan |
|---|---|
| Hypothesis | Showing when the next practice is due at the end of a session raises the share of learners who come back within 7 days |
| One variable | end-of-session screen: control (no date) or variant (next practice date) |
| OEC (overall evaluation criterion) | share of learners who start another session within 7 days |
| Guardrails | session completion rate; reminder opt-out rate; error rate |
| Unit and split | learner account; 50/50; assignment kept for the whole test |
| Power | baseline 40%, smallest effect worth detecting 2 points: n per variant ≈ 16·p(1 − p)/Δ² = 16 × 0.24 / 0.02² = 9,600 (`uie study ab`) |
| Duration | fixed horizon: at least 2 full weeks and until n is reached; no peeking |
| SRM check | χ² on assignment counts (`uie study srm`); p < 0.001 invalidates the test until the cause is found |
| Novelty and primacy | new learners analysed separately |
| Surprising result | a very large effect triggers an instrumentation check first (Twyman's law) |
| Decision rule | ship if the OEC's 95% CI excludes 0 and no guardrail worsens by more than [threshold] |
| Language | causal claims only for this randomised result (E5) |

## 14. Sign-off

| Item | Record |
|---|---|
| Owner approval | [name or role, date] |
| Pilot completed | [date; what changed after it] |
