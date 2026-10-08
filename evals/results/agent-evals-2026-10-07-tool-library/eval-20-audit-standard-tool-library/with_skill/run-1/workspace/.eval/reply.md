I reviewed the whole reservation flow (find a tool, tool page, basket, confirm, done) on phone and desktop widths in light and dark mode. It isn't ready to open to members yet. The good news is that most of the serious problems come from a few causes, and most of those are small changes.

**Assurance level:** none reached; the target in PRODUCT.md is L3. Basic accessibility checks fail, so even the first level (L1) is blocked: horizontal scrolling at 320 px, a keyboard trap, low contrast in dark mode, content hidden behind the fixed bar, and clipping with larger text. No real users have been tested. "Members would…" below means a predicted problem, not something we watched happen.

## Fix first

1. **"Reserve this tool" doesn't actually reserve anything.** It only adds the tool to a basket. The only feedback is a message that disappears after about 4 seconds, and on a phone the link onward ("Basket (1)") is scrolled out of view. A walkthrough as a first-time member on a phone predicted they would stop here, thinking they were done. Rename the button "Add to basket" and, after adding, show a bar that stays: "1 tool held · Go to basket". *(P0)*
2. **Dates that can't work are accepted.** You can confirm a reservation for a day before the tool is back: the pressure washer, "available from Sat 17", was confirmed for Sat 10. The calendar also accepts days when the library is closed, and that is only rejected at the very last step, after the details are filled in, with no way back to the day. Offer only open session days on or after the tool's "Available from" date. *(P0)* This links to the next item.
3. **Pick-up day and pick-up session are asked separately and can disagree.** The basket asks again, doesn't preselect the day already chosen, lists sessions latest first (which screen readers and keyboards also read in the reverse order), and the confirm page can end up showing two different dates. "Change" on the confirm page also wipes the details already typed. Treat the chosen day as the session, so it isn't asked twice. *(P1)*
4. **The 10-minute basket hold is invisible.** The basket never says how long tools are held, there is no warning before it runs out, and afterwards every retry says "Something went wrong. Try again." with no way out. Show the time left, warn before it expires, offer to extend, and give a specific message if it does expire. *(P0, WCAG 2.2.1)*
5. **Dark mode: the green "Available from" badge is too faint.** It measures 3.07:1 and needs 4.5:1. Its tint is also the same colour as the card, so the badge loses its shape. `styles.css` uses a different dark green from the one in DESIGN.md (#8fd1a8 on #24352c), and switching to that is a one-line fix. Dark mode is what most of your members use. *(P1)*
6. **Phone layout:**
   - At 320 px the tool list scrolls sideways, because of a 330 px minimum column.
   - Tool names are cut to one line, so the two 18 V drills look identical.
   - Search sits below all ten tools, so results change off-screen.
   - With 200% text size, names clip and "Reserve this tool" overlaps nearby text.

   That last one matters given your older members. *(P1)*
7. **Keyboard:** once the loan-length list is open, Tab can't leave it and Esc doesn't close it, so the rest of the page can't be reached. The fixed "Reserve" bar also covers focused calendar days and the open list. *(P0/P1)*

Smaller items:
- Tapping Confirm twice while it's loading creates a second reservation number.
- The date filter's hint says the opposite of what the filter does.
- The header still shows "Basket (1)" after you confirm.
- A membership number typed in lower case, or without the hyphen, is reported as missing.

## Worth keeping

- The confirm page's error handling: a summary that takes focus, links to each field, and keeps what was typed.
- The done page says what to bring and where to go.
- "Nothing is paid online" is stated clearly.
- Search results and "Added to your basket" are announced to screen readers.
- Dates are written the way members say them.

## Questions I couldn't ask you (I went ahead without them)

- **Does a member need to pick a session separately from the pick-up day?** I assumed not, which is why items 2 and 3 are one fix.
- **Is the 10-minute hold a firm rule?** It's listed in PRODUCT.md, so I treated it as fixed and recommend making it visible rather than removing it.
- **Are real tool photos available?** The three design reviewers agreed the site looks plain and generic, because every card shows the same wrench placeholder. That's a polish point, not a blocker.

## How I checked

- **Automated checks:** accessibility (axe), keyboard, layout, contrast and text resizing, across 5 pages, 6 widths, light and dark mode and reduced motion.
- **Independent reviews:** three usability reviewers, a walkthrough as a first-time member on a phone, three design reviewers, an accessibility auditor and a code reviewer.
- **Verification:** every finding was re-checked against the live site before it was kept. Three separate raters then scored severity without seeing who found what, and they disagreed on nothing.
- **Still needs people:** VoiceOver and TalkBack runs, real larger-text and dark-mode use on phones, and a short test with about five members doing the "drill for Saturday" task.

Files are in `.ui-evaluator/runs/20261007-234951-audit-standard/`:
- `report.md` / `report.html`: the full report, 101 findings, each with screenshots and file:line;
- `debrief.md`: the findings grouped by cause;
- `agree-disagree.csv`: a sheet for you or your volunteers to mark.

I can start on the fixes next, beginning with items 1–5, which share their causes.
