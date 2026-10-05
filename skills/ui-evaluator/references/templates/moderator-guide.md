<!-- ui-evaluator: moderator guide template v1 (METHODS §7.1, QUALITY-BAR EMP-02, methods/usability-testing.md §3.5) -->
# Moderator guide: [study title]

<!--
Save as .ui-evaluator/studies/<study-id>/moderator-guide.md and pilot it with the tasks. Lines in quote blocks are the
script: say them in your own natural words, but keep the meaning, and keep the protocol identical for every
participant you will compare (moderation style changes task success). Translate the whole guide in advance for
sessions in another language. Examples describe a fictional language-learning flashcard app.
-->

Contents: Before the session · 1 Welcome and consent · 2 Think-aloud practice · 3 Warm-up questions · 4 Tasks · 5 Neutral probes · 6 Interventions · 7 Questionnaire · 8 Participant debrief · 9 After the session · Logging

## Before the session

- [ ] Build recorded (git:[commit]); test account [L-0x] reset to the start state; real payment and real messages switched off.
- [ ] Consent form ready; recording tool tested; notifications off on the moderator's machine.
- [ ] Task cards in order for this participant (see the rotation in the plan); stop rules at hand.
- [ ] Note-takers have their own observation sheet with study id, session id and participant code filled in.
- [ ] Observers briefed: silent, cameras and microphones off, questions to the moderator in private.

## 1. Welcome and consent (about 5 minutes)

> Thank you for joining. Today we're testing [product], not you. If something is hard to use, that tells us what to fix, so there are no wrong answers and nothing you can break.
>
> I didn't design what you'll see, so you won't hurt my feelings. Honest reactions help most.
>
> You can stop, skip a task or take a break at any time, without giving a reason, and you'll still receive the full thank-you of [amount].
>
> [If recording:] With your permission we'd like to record the screen and your voice, only so the team can check what happened. Is that all right? [Wait for a clear yes; for remote sessions, ask again once the recording has started.]
>
> Do you have any questions before we start?

Go through consent.md before anything is recorded. A no to recording, quoting or clips does not end the session.

## 2. Think-aloud practice (about 2 minutes)

> While you work, please say what you're looking at, what you're trying to do and what you're thinking, as if you were talking to yourself. Let's practise on something else first: find tomorrow's weather forecast for your town on any website you like, and talk me through it.

If the participant falls silent for about 15–20 seconds during tasks, say only "Please keep talking." Use retrospective or silent sessions instead when time on task is a measure (see the plan).

## 3. Warm-up questions (about 3 minutes)

<!-- Only what the research questions need. No age, health, income or contact details here. -->

> How do you study vocabulary at the moment? When did you last do it?

## 4. Tasks

For each task:
1. Hand over or show the participant card and ask them to read it aloud.
2. Note the start time. Stay neutral: no "good", "right" or "almost" while they work.
3. End the task when they say they are done, when the success criteria are met, or when the stop rule is reached. Do not say whether it worked: "Thank you, let's go to the next one."
4. Ask the single ease question (SEQ) straight away, before any discussion:

> "Overall, how difficult or easy was the task to complete?" (SEQ, Sauro, MeasuringU). Please answer from 1, very difficult, to 7, very easy.

If the answer is below 5: "What made you choose that number?" Record the answer as a verbatim quote.

## 5. Neutral probes

Use these when the participant asks you something, trails off or stops talking. They give nothing away.

| Probe | What you do | Example |
|---|---|---|
| Echo | repeat their last words as a question | "Not sure where they went?" |
| Boomerang | hand the question back | "If I weren't here, what would you try?" |
| Columbo | ask an open, unfinished question | "And this part is…?" |

Avoid: closed or leading questions ("Did you see the button at the top?"), naming anything on screen, explaining the design, and reassuring about it. If they ask whether they did it right: "What would you expect to happen?"

## 6. When to intervene, and how to log it

Let people struggle up to the stop rule: the struggle is the data. Intervene only when:
- the stop rule is reached (time limit, or no progress and the participant asks for help twice);
- the participant is distressed or asks to stop;
- the build or environment fails (crash, wrong test data), or the next action would affect real data, money or messages.

| Level | What you do | Counts as | Task outcome |
|---|---|---|---|
| 0 | neutral probe or "please keep talking" | not an intervention | unchanged |
| 1 | re-read the task with them | intervention, segment excluded from timing | unchanged |
| 2 | any hint about where or how | assistance | `assisted` at best |
| 3 | show or do the step so the session can go on | moderator completion | `failed` |

Log every intervention at once in the observation sheet: `intervention` holds the time, your exact words and why; set `outcome` on the task's last row. If the participant is distressed, stop the task and say: "This is exactly what we need to see. The problem is in the app, not with you." Offer a break or to end the session, with the full thank-you either way.

## 7. Questionnaire (end of session, before discussion)

Use the instrument named in the plan, one only:
- **UMUX-Lite**: two items on a 7-point agreement scale (Lewis, Utesch and Maher, 2013);
- **SUS**: ten items on a 5-point agreement scale (Brooke, 1996).

Paste the published wording into your form and do not edit the items or the scale, because edited items cannot be compared with published norms. Score with `uie study umux` or `uie study sus`. With about five participants, report scores only as context, never as a benchmark.

## 8. Participant debrief (about 5 minutes)

> Was there anything you expected to be able to do but couldn't?
>
> What, if anything, surprised you?
>
> Is there anything else you'd like to tell us, or ask us?

Then explain what happens next: the notes use a code instead of their name; recordings are kept for [period] and then deleted; any quotes are anonymised. Thank them and give the thank-you as described in the consent form.

## 9. After the session (15 minutes before the next one)

1. Each note-taker finishes their own sheet alone before any discussion, so one view does not shape another.
2. Short team debrief: what happened, not what to redesign. Propose a RITE category per problem (1 quick fix, 2 slow fix, 3 unknown cause, 4 maybe caused by the script or moderator); the decision-maker confirms.
3. Reset the test account and data; check the recording saved; record anything that went wrong with the protocol.

## Logging: observation sheet columns

One row per observation in `data/observation-sheet.csv` (from the template of the same name). Write what people did and said, not what you think they felt; interpretations go in `notes`. The columns map to the feedback schema so `uie feedback import --source usability --study <id>` can read the sheet (mapping: methods/usability-testing.md §3.9).

| Column | Content |
|---|---|
| study_id, session_id | e.g. `first-week-r1`, `S03` |
| channel | moderated in person, moderated remote or unmoderated |
| date | session date, YYYY-MM-DD |
| observer | note-taker code, e.g. `O1`; each note-taker keeps a separate sheet |
| participant_code | `P03`, never a name |
| task_id, step | task card id; journey step number if known |
| timestamp | time in the recording, hh:mm:ss |
| route | where it happened: route, state or element |
| observation | neutral behaviour: "opened Settings, went back after 20 s" |
| verbatim_quote | exact words, original language; empty if none |
| prompted | yes if the words answered a question from the moderator |
| outcome | only on a task's last row: success, assisted, failed or abandoned |
| intervention | time, exact words and reason; empty if none |
| observer_severity | optional prior on the scale named in the plan; never shown to raters as a rating |
| classification, theme, linked_finding | usually filled during analysis (problem, bug, preference, feature request, praise, question) |
| notes | the note-taker's interpretation, kept apart from the observation |
