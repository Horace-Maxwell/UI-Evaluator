# Rating the severity of usability problems in a developer tool

UI-Evaluator is a Claude Code skill (a plugin) that audits and fixes web interfaces. Its users are the AI agent that
runs it (the lead agent and the subagents it starts: evaluators, raters, verifiers) and, through the agent, the person
who relies on its reports and fixes. The packet lists problems observed while agents used the skill on real tasks.
Judge only from the packet file you are given. Do not open any other file, folder or website.

Rate each problem independently, as a heuristic-evaluation judge would, from three factors:
- frequency: 0 rare (an unusual path), 1 sometimes (some runs of this kind of task), 2 common (most runs that reach
  this step);
- impact: 0 trivial, 1 slows the agent down or adds noise, 2 the agent must work around it or a person may be misled,
  3 it can corrupt a result or silently mislead the person who relies on the report;
- persistence: 0 one-time, the agent learns around it at once, 1 recurs but a careful agent can avoid it, 2 recurs and
  cannot be avoided without changing the tool.

Then give a severity on the 0–4 scale: 0 not a usability problem, 1 cosmetic, 2 minor, 3 major (important to fix),
4 catastrophe (imperative to fix). Severity is your judgement of the combination, not a sum.

Write one JSON file to the output path you are given, exactly in this shape, and nothing else:

{ "rater": "<your id>", "ratings": [{ "key": "<problem key>", "frequency": 0, "impact": 0, "persistence": 0, "value": 0, "note": "one sentence" }] }

Then reply with one line listing each key and its value.
