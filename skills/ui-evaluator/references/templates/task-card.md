<!-- ui-evaluator: task card template v1 (METHODS §7.1, QUALITY-BAR EMP-02, methods/usability-testing.md §3.3) -->
# Task cards: [study title]

<!--
Save as .ui-evaluator/studies/<study-id>/tasks.md, one card per task. Each card has two parts:
- the participant side, printed or shown on its own, with nothing but the scenario;
- the moderator side, which never reaches the participant.

Rules for the participant side:
- Realistic and actionable: a goal a real person would have, asking them to do it, not to describe how.
- No clues: none of the labels, menu names, icons or step order on screen. Use the established term only when there is
  no everyday word. The task lint compares the wording with the latest ARIA snapshots; list what you kept out.
- Complete: every detail needed to finish (names, amounts, dates), using test data that is obviously fictional.
- One goal per card.
Derive each card from a journey (.ui-evaluator/journeys/<id>.json): its scenario, start state and success condition.
Never give the correct action sequence; it belongs to the cognitive walkthrough. Pilot every card.
Examples describe a fictional language-learning flashcard app.
-->

---

## T1 · Participant card

> **Task 1**
>
> Your evening class gave you ten new words today. The list is on the sheet next to you. Put them into the app so that you can practise them this week.
>
> Please read the task aloud, then start. Tell me when you think you're done.

## T1 · Moderator side (do not show)

| Field | Value |
|---|---|
| Journey | `add-own-words` (critical) |
| Research question | RQ1; settles F-0021 |
| Start state | signed in as test learner L-03 with no word sets; app on its first screen; printed list of 10 words with translations beside the device |
| Success criteria | the 10 words exist as 10 cards in one set that the learner opens again from the first screen; checked on that set's page |
| Counts as assisted | any hint about where or how (moderator guide, level 2) |
| Counts as failed | moderator shows or does a step; words saved as one card and not corrected; gives up |
| Stop rule | 8 minutes, or no progress after the participant asks for help twice |
| Kept out of the wording | "Deck", "New set", "Import", "Add cards" |
| Watch for | where they look first; what they call a group of words; whether they notice that pasting a list is possible |
| After the task | SEQ; if below 5, "What made you choose that number?" |

---

## T2 · Participant card

> **Task 2**
>
> You have about ten minutes before your bus arrives. Go through the words the app wants you to practise today.
>
> Please read the task aloud, then start. Tell me when you think you're done.

## T2 · Moderator side (do not show)

| Field | Value |
|---|---|
| Journey | `daily-practice` (critical) |
| Research question | RQ2 |
| Start state | test learner L-04 with one set of 20 cards, 12 of them due today; app on its first screen |
| Success criteria | all 12 due cards answered and the end-of-session screen shown |
| Counts as assisted | any hint about where or how (moderator guide, level 2) |
| Counts as failed | moderator shows or does a step; stops before the end-of-session screen believing they finished |
| Stop rule | 10 minutes |
| Kept out of the wording | "Review", "Due", "Study now" |
| Watch for | how they find today's cards; whether they notice how many are left; reactions to wrong answers |
| After the task | SEQ; if below 5, "What made you choose that number?" |

---

## Card checklist

- [ ] The scenario contains no label, menu name or icon description from the screen (task lint passed on [date]).
- [ ] Every detail needed to finish is on the card or on the sheet beside the device.
- [ ] Success, assisted and failed are defined before the first session; success is yes or no, partial progress goes in the notes.
- [ ] The start state can be reset between participants.
- [ ] The card was piloted, and the wording frozen afterwards.
