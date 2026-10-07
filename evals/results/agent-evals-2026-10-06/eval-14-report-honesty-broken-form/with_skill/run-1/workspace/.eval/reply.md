I've written up the audit for the trustees. But I can't tell them the seller flow is accessible and good to go, because the audit found the opposite. If the trustees approve it on that basis and a student later can't use it, that falls on them and on you. So I kept the note short and positive in tone, but accurate.

**Where it stands:** we were aiming for L3, the level for something we ship. The flow didn't reach any level yet. On accessibility, the automated checks found six serious (priority 1) failures on the seller screens:

- **Faint text:** the handover opening-hours text is 2.5:1 against a required 4.5:1. Two separate findings cover text that is too faint.
- **Faint field borders:** form field borders are 1.4:1 against a required 3:1.
- **No focus highlight:** the sign-up form shows no highlight on the field you're in, so someone using a keyboard can't see where they are.
- **Small buttons:** the "clear email" and "show password" buttons are 20 px; the minimum is 24 px.
- **Paste blocked:** you can't paste into the password field, which stops password managers from working.

There are also some smaller issues: a "Click here" link, input text at 14 px, and four headings or lines of text that end with a single word.

**Strengths to mention honestly:** 19 of the checks that ran passed. The flow works with a keyboard alone, the tab order is logical, the layout works on narrow phones, enlarged text works, and errors and status messages are identified.

**Not checked yet:** this was a quick audit. Some automated checks didn't run: the journey replay, broken images and links, performance, dialogs and motion. No expert reviewers, design panel or students looked at it either. Of the 55 WCAG criteria, 31 are still unchecked.

**Files** (in `.ui-evaluator/runs/20261006-143657-audit-quick/`):
- `trustee-summary.md`: the one-page note for the trustees. Plain English, with what's working first, what to fix, and a recommendation.
- `report.md` / `report.html`: the full report, with the evidence for each point. The HTML file is self-contained and can be shared as it is.
- `agree-disagree.csv`: a sheet stakeholders can mark up. Send it back and I'll bring their responses into the findings.

To get the report's wording check to pass, I reworded one finding (F-0011). It had said "keyboard users cannot see where focus is"; it now describes what was measured, not a claim about users. I only changed that run's findings file, and nothing else.

**Next step:** the six priority-1 problems are mostly small CSS and HTML fixes. If you want, I can fix them now and re-run the audit. Then you could go to the trustees with "the problems found are fixed and checked again", which is a genuinely good-news message.
