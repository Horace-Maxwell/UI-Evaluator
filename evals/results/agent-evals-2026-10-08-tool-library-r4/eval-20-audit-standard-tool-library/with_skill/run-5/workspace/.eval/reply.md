I reviewed the reservation flow from finding a tool to the confirmation page. It isn't ready for members yet. The biggest problems are in the flow itself, not in how it looks: a member can believe they've reserved a tool when they haven't, can reserve the same thing twice, or can confirm a pick-up day the library can't honour. Dark mode and phone layout have smaller problems, and those are quick to fix.

I checked phone and desktop widths in light and dark mode, plus a keyboard-only pass. Independent reviewers found the problems, and each one was reproduced in the running site before it counted. None of this comes from testing with real members, so treat the "may confuse members" items as predictions.

## Fix first

1. **"Reserve this tool" only adds the tool to a basket.** The "Added to your basket" message disappears after a few seconds and has no link to the basket. A first-time member may close the page thinking the drill is reserved. Make the message stay, add a "Go to basket" button, and use wording that shows the reservation isn't finished (`app.js:271`).
2. **When the basket hold runs out, the member is stuck.** After about 10 minutes, Continue only shows "Something went wrong. Try again." Every retry fails, and reloading doesn't help. That will hit people who reserve in the evening while doing something else. Tell them how long tools are held, and when time runs out, explain what happened and let them start again (`app.js:94`).
3. **Tapping Confirm twice makes two reservations.** We got FT-4471 and FT-4472 this way. There's no sign that anything is happening for about 1.5 seconds after the tap, so a second tap is likely. Disable the button and show progress while it's working (`app.js:413`).
4. **The pick-up day can be wrong.**
   - The calendar accepts closed days and days before a tool is back. A pressure washer booked for 10 October, a week before it's available, went all the way to "Reservation confirmed". A closed Monday is only rejected after Confirm, and the error has no link back to change the day.
   - The basket then asks for the session again without using the day already chosen.
   - The sessions are shown latest first, while keyboard and screen readers go through them earliest first (`styles.css:818–819`).
   - Only let members pick open days when the tool is available, and pre-select that session in the basket (`app.js:198`, `app.js:265`).
5. **Keyboard users get stuck in the loan-length list.** Once it's open, Tab only moves between "One week" and "Two weeks", so you can't leave without choosing. Esc doesn't close it either (`app.js:238–251`). This is a WCAG failure and a small fix.

## Dark mode

- The green "Available from …" labels on the tool list fail the WCAG contrast minimum in dark mode: 3.07:1 against the 4.5:1 required. The dark-mode green (`--color-ok`, `styles.css:60`) has drifted from the value in your design notes, and those labels also lose their background in dark mode. It's a one-line token fix.
- Everything else I looked at in dark mode reads well, including the error messages and the confirm page.

## Phones

- **Search is below all ten tools on a phone.** The search box and filters come after the tenth card (`index.html:36`).
- **Tool names are cut to one line.** Both drills read "Cordless drill 18 V, co…", so members can't tell the two-battery drill from the other one (`styles.css:377`). The same rule cuts names off at 200% text size, which matters for members who use larger text.
- **The tool list is too wide for the smallest phones.** At 320 px it scrolls sideways, because of a 330 px minimum column width (`styles.css:331`).
- **The fixed "Reserve this tool" bar covers content.** It hides calendar days and "One week" from keyboard focus, and the "Two weeks" option opens underneath it. The bar needs space reserved below the page content (`styles.css:758`).

## Also worth fixing

- A search with no matches still shows the whole list instead of saying nothing was found.
- "Basket (1)" still shows after the reservation is confirmed.
- Membership numbers without "FT-" and mobile numbers written as "+44…" are rejected, and the error reads as if the field were empty.
- The done page shows reservation number FT-4471 even when no reservation was made.

## Keep these

- The confirm page's error messages are well done: one summary links to each field, the examples are clear, and what members typed is kept.
- The confirm page says plainly that nothing is paid online.
- The done page tells members where to go, what to bring and what to do if they miss the session.
- The calendar reads out full dates and which days the library is open.

## Where it stands

- The flow doesn't pass the basic machine checks yet, and you're aiming for human-confirmed. What blocks it is the keyboard, reflow, contrast and text-size failures above.
- The three design reviewers also found the look plain and generic: the same wrench placeholder on every tool, and nothing that's distinctly Fernhill's. That matters less than the flow problems.
- Real screen-reader checks (VoiceOver and TalkBack) and testing with real members haven't been done.

I couldn't ask you, so I took the audience, devices and accessibility needs from `PRODUCT.md`. I assumed that only the reservation flow was in scope.

If you'd like, I can fix items 1–5 and the dark-mode contrast one at a time, re-checking each fix. Before launch, it's also worth watching three or four members try a reservation on their own phones. That would show whether point 1 really trips people up.

Files are in `.ui-evaluator/runs/20261009-223245-audit-standard/`:
- `report.md` / `report.html`: the full report.
- `debrief.md`: findings grouped by cause.
- `agree-disagree.csv`: for volunteers to mark up.
