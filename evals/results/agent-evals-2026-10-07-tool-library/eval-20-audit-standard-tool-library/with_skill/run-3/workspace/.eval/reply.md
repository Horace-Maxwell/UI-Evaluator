I'd hold the launch until a handful of problems are fixed. They are mostly in the logic of the flow rather than the look, and the biggest ones are on phones and in dark mode, which is how most of your members will use it. The flow reached **no assurance level**; you were aiming for L3.

I reviewed the five pages that make up the reservation flow: finding a tool, the tool page, the basket, confirming and the done page. They were checked at phone, tablet and desktop widths, in light and dark mode. The review combined automated accessibility and layout checks with step-by-step runs of the "reserve a drill for Saturday" journey on a 375 px phone. Independent reviewers then examined the flow, a separate checker re-ran every candidate problem in the browser, and three more reviewers rated how serious each one is without seeing who found it.

Everything here is expert and automated review. No real members were watched, so read "members may…" as a prediction, not an observation.

## Fix these first

1. **"Reserve this tool" doesn't actually reserve anything.**
   - It only adds the tool to a basket, and the only sign is an "Added to your basket" message that disappears in about 1.3 seconds.
   - On a phone the "Basket (1)" link has already scrolled out of view.
   - A member may close the page thinking the drill is booked and turn up on Saturday to find nothing set aside. All three raters gave this the top severity.
   - Fix: rename the button "Add to basket", or keep a message on screen saying "1 tool held — choose a session to finish", with a link.
2. **The basket gets stuck if a member pauses for more than 10 minutes.**
   - The basket silently holds tools for 10 minutes. After that, Continue shows "Something went wrong. Try again." on every attempt, and there's no way out.
   - This was reproduced after about 10.5 minutes, which is very likely for someone booking in the evening between other things.
   - Fix: show how long the hold lasts, warn before it ends, and renew it rather than failing.
3. **The pick-up date is asked for twice, and the answers can contradict each other.**
   - Members pick a day on the tool page, then pick a session again in the basket. Nothing is pre-selected, and the sessions are listed latest first, so the first Saturday shown isn't this Saturday.
   - The confirm page can end up showing "pick up Saturday 17 October" next to "session Wednesday 21 October".
   - Closed days and dates before a tool is back are accepted. Closed days are only rejected after Confirm.
   - Fix: offer only open days on or after the tool's return date, ask for the date once, and list sessions soonest first.
4. **Confirm can be pressed twice.**
   - Continue and Confirm show no response for 1.2–1.5 s, and pressing Confirm a second time produced two reservation numbers for one booking (FT-4471 and FT-4472).
   - Fix: disable the button and show progress while it works.
5. **Dark mode: the green "Available from…" label is too faint to read comfortably.**
   - Its contrast is 3.07:1 against the 4.5:1 required, and its pill background disappears because it is the same colour as the card.
   - Fix: change two dark-mode colour values in `styles.css:60–61`. This is the cheapest fix on the list.
6. **The sticky "Reserve this tool" bar on phones hides what sits under it.**
   - It covers keyboard focus on calendar days and on the loan-length button, and covers the open loan-length options at 375 px.
   - Separately, that loan-length list doesn't close with Escape or a tap outside, and Tab stays inside it.
7. **The tool list on phones.**
   - Tool names are cut to one line, so the one-battery and two-battery drills look identical.
   - At 320 px the list scrolls sideways by 26 px.
   - Search sits below all ten tools, and a search with no matches just shows the whole list with no message.

**Also worth fixing before launch:**
- Phone numbers starting "+44" and lowercase "ft-" membership numbers are rejected.
- "Change" on the confirm page drops the chosen session and clears the details already typed.
- After confirming, the basket still shows the tool as "Basket (1)".
- The three-tools-per-member limit isn't enforced.

## Keep these

- Error messages on the basket and confirm pages are very good. They're specific, link to the field, take keyboard focus and keep what was typed.
- The done page clearly says what to bring, where to go and what to do if plans change.
- The confirm page says nothing is paid online.
- Open days are marked with the word "Open", not just colour.
- Apart from that green label, dark mode holds up: error and selected states stay clear.

## Look and feel

All three design reviewers independently found the site plain and generic. The main reasons are the same wrench placeholder on every tool, unstyled browser date pickers, and no identity beyond the library's name. That doesn't block reservations, but it's the next thing to tackle once the problems above are fixed.

## Still needs a person

- A pass with a screen reader (VoiceOver or TalkBack) to check whether the "Added to your basket" message is announced.
- Ten WCAG checks that can't be automated, such as page titles.
- A short test with about five members on their phones in the evening, to confirm how serious problem 1 really is.

I couldn't ask you questions during this run, so I made these assumptions:
- "Reservation flow" means those five pages.
- Your goal is L3, the level the project setup already specified (owner-confirmed, before real-member testing).
- The bare done page showing a made-up reservation number when no booking exists is out of scope. Tell me if it should be in scope, because a member who bookmarks or reloads that page would see it.

The test reservations I made exist only in the browser session; the site sends nothing to a server.

If you'd like, I can start fixing in the order above, one problem at a time with a re-check after each. I'd begin with the dark-mode colours and the double-submit, which are quick, then problem 1.

Files are in `.ui-evaluator/runs/20261008-005630-audit-standard/`:
- report.md
- report.html
- debrief.md
- agree-disagree.csv
