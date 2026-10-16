# Grading a usability review against a seeded ground truth

You are grading the output of one usability review of a small website: Dunmore recycling centre's drop-off slot
booking (a council site; residents choose a day and a 20-minute slot, say which vehicle and waste they bring, give
their details and book, mostly on a phone the evening before). The packet's `ground_truth` lists fourteen problems
seeded when the site was built: five show up in browser checks (a layout shift when the slots arrive, the contrast
of the 'Few left' tag, the slot grid overflowing at 360 px and below, slot buttons with no focus ring, a status line
that is not announced) and nine need judgement.

Several defects sit close together. Map by the harm the item describes:
- Slots that arrive late: `slot-booking-D01` is the wait itself (nothing says slots are coming, the grid and the
  status line are empty, Next does nothing); `slot-booking-D02` is the page moving when they arrive (content jumps
  down, the layout shifts, an #opening link lands in the wrong place); `slot-booking-D11` is a screen reader not
  being told the slots or their count.
- `slot-booking-D06` is today's slots that have started or are about to start being offered and refused at the end;
  `slot-booking-D08` is the five-minute hold running out unseen and the slot being dropped. An item about 'Change
  slot' forgetting the chosen day is `slot-booking-D12`, even when it comes up after an expired hold.
- The 'Few left' tag: its contrast is `slot-booking-D03`; those slots being moved to the front of the grid, out of
  time order and out of the focus and reading order, is `slot-booking-D10`. No visible focus on the slot buttons is
  `slot-booking-D05`, while focus jumping around the grid is `slot-booking-D10`.
- The permit rule, the delayed permit field and the confirm page's 'A van needs a permit number' are all
  `slot-booking-D07`. Book doing nothing visible and a second press cancelling the booking are both
  `slot-booking-D09`. The slot length and end time shown only in a tooltip are `slot-booking-D13`; the done page
  missing the day, the slot or the vehicle is `slot-booking-D14`.

Judge only from the packet file you are given. Do not open any other file, folder or website.

The packet holds either
- `findings`: a list of problems the review reported, each with an `id`; or
- `report`: the review's text as the user received it (a final reply, perhaps followed by a short chat message that
  repeats it, and any document it wrote). Extract every distinct problem it raises and number them R1, R2, … in the
  order they first appear. A problem restated later (in a summary, a "where to start" list or the chat message) is
  the same item, not a new one. Two different problems in one paragraph are two items.

## Task 1: map every reported problem

For each reported problem (every finding id, or every R-number), choose exactly one:
- a ground-truth defect id (for example `slot-booking-D06` or `slot-booking-D12`): the reported problem is the same
  underlying problem as that defect, on the same page or across the same flow. A broader or narrower statement counts if fixing
  what the review describes would fix the defect. Several reported problems may map to the same defect.
- `real-unseeded`: a genuine usability or accessibility problem for residents using this flow that is not in the
  ground truth. Say in the reason why it would hurt these users.
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
