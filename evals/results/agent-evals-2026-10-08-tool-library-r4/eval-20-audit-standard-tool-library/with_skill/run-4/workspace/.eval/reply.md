I reviewed the reservation flow across all five pages (find → tool → basket → confirm → done). It isn't ready for members yet. Most of the problems are on phones and in dark mode, which is how most members will use it. The good news is that most fixes are small: a CSS value or a few lines of `app.js`.

**Result:** the target in `PRODUCT.md` is L3, and this run reached **no level**. Reaching L1 needs every machine check to pass, and the WCAG 2.2 AA keyboard, contrast, reflow and text-resize checks all fail, along with the functional checks. I ran a standard-depth audit:
- automated checks at 6 widths from 320 to 1440 px, in light and dark mode;
- 3 independent heuristic reviewers, a step-by-step walkthrough of "reserve a drill for Saturday" at 375 px, 3 design critics, an accessibility auditor and a code reviewer;
- every finding re-checked against the running site, then rated blind by 3 raters.

All of this is expert and automated review. None of it comes from real members.

## Fix first (in this order)

1. **The basket hold runs out silently, and the member can't recover (P0).** Tools are held for 10 minutes, but the basket never says so, never warns and can't extend the hold. After it expires, every "Continue" shows "Something went wrong. Try again." This survives a reload, because the hold start is never reset (`app.js:97`, `app.js:361`). It was reproduced with a real 10-minute wait. Someone reserving in the evening while doing something else will easily hit this.
2. **"Confirm reservation" can book twice.** A second tap during the 1.5 s wait creates a second reservation (`app.js:413`). Neither Continue nor Confirm shows that anything is happening.
3. **The collection day is chosen twice, and the two choices can disagree.**
   - The tool-page calendar accepts days the library is closed and days before the tool is back. A closed day is only rejected at the final Confirm.
   - The basket then asks for a session again without carrying the day over.
   - It lists sessions **latest first** (`styles.css:818-819`, `row-reverse` / `wrap-reverse`), so screen-reader order and visual order disagree.
   - It offers sessions before the chosen day.
4. **"Reserve this tool" only adds the tool to a basket.** The "Added" message disappears after about 1.3 s, and the Basket link is scrolled out of view. The walkthrough judged that a first-time member would likely stop here, thinking the drill was reserved.
5. **Keyboard trap in the loan-length list.** Tab can't leave the open list and Escape doesn't close it (`app.js:241`, WCAG 2.1.2). Its spoken name is "One week" instead of "Loan length".
6. **Dark mode: the green "Available from …" badge measures 3.07:1** (needs 4.5:1), on every tool card at every width. The fix is the dark `--color-ok` token at `styles.css:60-61`; it should also get back the tinted background it has in light mode.
7. **Phones:**
   - Tool names are cut to one line, so the two cordless drills read identically (`styles.css:373-379`).
   - Search and filters come after all ten tools, both on screen and in Tab order (fix the HTML order instead of using CSS `order`).
   - The results grid's 330 px minimum column causes sideways scrolling at 320 px (`styles.css:331`).
   - The fixed "Reserve" bar covers the focused calendar day and the open loan list (`styles.css:758`).

Also worth fixing:
- Using "Change" on the confirm page wipes the name, membership number and phone already typed.
- A search with no matches leaves the old results showing and says nothing.
- The header still shows "Basket (1)" after confirming.
- A +44 mobile number is rejected.
- The reservation number "FT-4471" looks like a membership number.

## Keep these
- The error summaries are well built: they take focus, link to each field, give format examples and keep what was typed.
- Calendar days are announced in full ("Saturday 17 October, open").
- "Added" and search counts are announced to screen readers.
- Focus rings are clear and survive forced colours.
- The copy states plainly what to bring and that nothing is paid online.

## Things to know
- **Design:** all three critics found the look plain. Every card has the same wrench placeholder, and the identity is just the name in body text. Two found it only partly specific to the library, and one found it generic. This is secondary to the fixes above.
- **Duplicates:** a few problems appear more than once in the report because different reviewers found them; the debrief lists which IDs are one problem. One reviewer file had a formatting error that made the report generator crash. I fixed the format only, without changing its content.
- **Assumptions:** I couldn't ask you questions, so I assumed the 10-minute hold and the day-then-session design are meant to stay. If either can change, fix 3 gets simpler.
- **Not tested:** real VoiceOver or TalkBack, real phones, and real members. Before launch, it's worth having two or three members try "reserve a drill for Saturday" on their own phones in dark mode.

Files:
- Full report: `.ui-evaluator/runs/20261009-223253-audit-standard/report.md` (and `report.html`).
- Debrief: `.ui-evaluator/runs/20261009-223253-audit-standard/debrief.md`.
- Review sheet for volunteers or the committee: `agree-disagree.csv`.

I can fix these one at a time in priority order and re-check each one, or plan a short test session with members. I can also publish the report as a shareable page if you want to pass it to the committee.
