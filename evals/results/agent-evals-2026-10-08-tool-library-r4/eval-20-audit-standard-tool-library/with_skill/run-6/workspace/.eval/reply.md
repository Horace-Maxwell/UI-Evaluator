I audited the reservation flow on all five pages (find, tool, basket, confirm, done) at six widths from 320 to 1440 px, in light and dark mode. It isn't ready for members yet, and most of what needs fixing hits phone and dark-mode users hardest.

**How it was checked.** I ran every automated check, and replayed both journeys. Three independent reviewers worked through the flow from different angles, and a persona walked the "reserve a tool for Saturday" journey on a 375 px phone. Three design critics, an accessibility auditor and a source-code reviewer also took part. Every candidate problem was re-checked on the live site, and three raters scored severity blind.

**Result.** The site reached no assurance level; your PRODUCT.md target is L3. It is blocked by WCAG and functional failures, 4 P0 and about 30 P1 findings, and the design panel's verdict. Nothing has been tested with real members yet. I didn't change any site files.

## Fix first (P0)

1. **The 10-minute basket hold is invisible, and when it runs out the reservation is stuck.** The basket only says "Items are held for you while you finish." There is no time shown, no warning and no way to extend. A verifier waited 10.3 minutes: Continue then showed "Something went wrong. Try again." and every retry showed the same error. Members reserving in the evening a few minutes at a time are the people most likely to hit this (`app.js:7`, `app.js:90-100`, `app.js:360-364`; also WCAG 2.2.1).
2. **The loan-length list traps the keyboard.** Once it is open, Escape doesn't close it. Tab only moves between "One week" and "Two weeks", so the calendar and "Reserve this tool" can't be reached (`app.js:238-251`). Its button is also announced only as "One week", not "Loan length".
3. **Focus order on the find page.** At tablet and desktop widths, the search box sits above the results but receives focus only after all ten tools. On phones, the search and filters sit below the whole catalogue (`styles.css:247-269`, `index.html:35-82`).

## Next (P1, grouped by cause)

4. **Collection time is asked twice, and the two answers can disagree.** The member picks a pick-up day on the tool page. The basket then asks for a pick-up session, doesn't pre-select it, and lists sessions latest date first. It also accepts a session that contradicts the day, so the confirm page shows two different dates.
5. **The calendar accepts days that don't work.** Closed days are only rejected on the last step, and that error offers no way to change the day. Days before the tool is available go all the way through to "Reservation confirmed": the pressure washer was booked for a date before it is available.
6. **"Reserve this tool" doesn't reserve.** It adds the tool to a basket and shows a toast for about 5 seconds. The walkthrough persona would stop there, believing the tool was reserved.
7. **Dark mode.** The green "Available from…" badge text measured 3.07:1, and WCAG AA needs 4.5:1. The dark success colours in `styles.css:60-61` don't match the values in DESIGN.md. In dark mode the unavailable chips also look stronger than the available ones.
8. **Tool names on phones are cut to one line.** Both drills read "Cordless drill 18 V, co…". At 320 px the results grid also overflows sideways because of a 330 px minimum column width. At 200% text size, both names and the Reserve bar clip or overlap (`styles.css:377`).
9. **The fixed Reserve bar has too little space under it.** On phones it covers the focused loan option, the pick-up instruction and the desk phone number in the footer (`styles.css:205`, `styles.css:758`).
10. **Smaller flow problems.** Pressing Confirm twice gives two reservation numbers. Continue and Confirm show nothing for about a second after being pressed. After confirming, the header still says "Basket (1)". A search with no matches shows the full list with no message. "ft-…" and "+44…" are rejected as invalid, with an "Enter your…" message.

The design panel judged the look *generic* and *plain*: every card has the same wrench tile, and the name is set in bold body text. That matters less than the items above.

## Keep these

- The error summaries on basket and confirm work well: they take focus, are announced, link to each field and keep what was typed.
- The done page says plainly what to bring and where to go.
- Deposits and "nothing is paid online" appear where people make decisions.
- The copy is in members' own words.

## Things to know

- **Duplicates in the report.** It lists 86 confirmed findings, but several are the same problem reported by different reviewers. For example, truncated names appear four times and "search below the list" four times. The groups are listed in the debrief, and the numbered list above is the de-duplicated view.
- **Inferred priorities.** You couldn't be asked during the run, so I prioritised for phones in dark mode, as your brief says. I treated nothing as off-limits to change.
- **Questions for members or the desk.** Does the green or grey badge colour mean anything the date doesn't? Do members think of "pick-up day" and "pick-up session" as the same thing?
- **Still needed for L3.** Someone needs to do real VoiceOver and TalkBack passes, test 200% zoom on a phone, and confirm the P0s.
- **One file edit.** One critic wrote a field in the wrong shape, which crashed the report generator. I wrapped that text in a list without changing its content.

Files are in `.ui-evaluator/runs/20261009-223234-audit-standard/`:
- `report.md` / `report.html`: the full report
- `debrief.md`: the synthesis, including the duplicate groups
- `agree-disagree.csv`: for you or volunteers to mark up

I can fix these one at a time in the order above, starting with the basket hold and the loan-length keyboard trap, and verify each fix.
