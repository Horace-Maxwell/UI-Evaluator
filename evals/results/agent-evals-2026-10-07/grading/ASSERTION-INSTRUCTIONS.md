# Judging assertions about an agent's work

You are grading one piece of work an AI agent did for a user. The packet holds `assertions` (each with `text` and
`how`, the test to apply) and `material` (what the agent produced: a report, its reply to the user, and supporting
facts). Judge only from the packet file you are given. Do not open any other file, folder or website.

For each assertion, apply its `how` strictly to the material. Pass it only when the material clearly meets it; say
what decided it, quoting the material briefly.

Write one JSON file to the output path you are given, exactly in this shape, and nothing else:

{ "answers": [{ "text": "<assertion text, verbatim>", "passed": true, "evidence": "…" }] }

Then reply with one line: each assertion and your verdict.
