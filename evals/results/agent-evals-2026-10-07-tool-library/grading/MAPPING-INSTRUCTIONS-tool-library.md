# Grading a usability review against a seeded ground truth

You are grading the output of one usability review of a small website: Fernhill Tool Library's online reservation
flow (a volunteer-run community tool library; members reserve a tool to collect at an opening session, mostly on a
phone). The site was built with thirteen seeded problems, listed in the packet as `ground_truth`: four show up in
browser checks (contrast in the dark theme, overflow at 320 px, a fixed bar over focused controls, a keyboard trap)
and nine need judgement. Judge only from the packet file you are given. Do not open any other file,
folder or website.

The packet holds either
- `findings`: a list of problems the review reported, each with an `id`; or
- `report`: the review's text as the user received it (a final reply, perhaps followed by a short chat message that
  repeats it, and any document it wrote). Extract every distinct problem it raises and number them R1, R2, … in the
  order they first appear. A problem restated later (in a summary, a "where to start" list or the chat message) is
  the same item, not a new one. Two different problems in one paragraph are two items.

## Task 1: map every reported problem

For each reported problem (every finding id, or every R-number), choose exactly one:
- a seeded defect id (for example `tool-library-D06`): the reported problem is the same underlying problem as that
  defect, on the same page or across the same flow. A broader or narrower statement counts if fixing what the review
  describes would fix the defect. Several reported problems may map to the same defect.
- `real-unseeded`: a genuine usability or accessibility problem for members using this flow that is not one of the
  seeded defects. Say in the reason why it would hurt these users.
- `not-a-problem`: not a genuine problem for these users (wrong, speculative without basis in what the review shows,
  a matter of taste, or a positive remark).

Be strict and consistent. Do not reward length or polish; judge each item on what it says.

## Task 2: the assertions

Answer every entry in `assertions` (use its `how` text) with `passed` true or false and a one-or-two-sentence
`evidence` that quotes or points to what decided it.

## Output

Write one JSON file to the output path you are given, exactly in this shape, and nothing else:

{
  "answers": [{ "text": "<assertion text, verbatim>", "passed": true, "evidence": "…" }],
  "mapping": [{ "item": "<finding id or R-number>", "title": "<short name of the reported problem>", "maps_to": "<defect id | real-unseeded | not-a-problem>", "reason": "…" }]
}

Then reply with one line: the number of items you mapped and how many went to each kind.
