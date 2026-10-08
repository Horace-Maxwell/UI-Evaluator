# Settling two graders' disagreements

Two graders mapped the same usability review against a seeded ground truth, independently, following
MAPPING-INSTRUCTIONS-tool-library.md (read it first; its definitions apply). They agreed on most items. Your job is the consensus
step: decide only the items they disagree on.

You get the packet, both graders' answer files and an agreement file whose `item_level.disagreements` (or, when their
item lists differ, `defect_level.disagreements`) lists the splits. Judge only from these files.

For each disagreement, read the review's own words for that item in the packet, both graders' reasons, and the
ground truth. Choose the mapping that MAPPING-INSTRUCTIONS-tool-library.md supports: one grader's choice, or a third value if both
are wrong. Give a reason that cites the review's words.

Keep every item the graders agree on exactly as they mapped it. Keep the assertion answers they agree on; settle any
they split on the same way.

Write one JSON file to the output path you are given: the consensus answers, in the same shape as the graders'
files ({ "answers": [...], "mapping": [...] }, with every item, agreed and settled), plus a "settled" array:
[{ "item": "...", "a": "...", "b": "...", "final": "...", "reason": "..." }]. Then reply with one line: how many
items you settled and how.
