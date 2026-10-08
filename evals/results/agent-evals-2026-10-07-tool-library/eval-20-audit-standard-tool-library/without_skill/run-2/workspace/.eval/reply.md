# Reservation flow review: what to fix first

I read every page, the stylesheet, the script and your PRODUCT/DESIGN notes. Then I ran the flow in Chromium at phone width (375 px, and 320 px for small phones) in dark mode, against the copy served on port 4662. I didn't change any site files. Everything below was reproduced in the browser unless I say it came from reading the code.

## Fix before launch: these stop people reserving or send the desk wrong information

**1. After 10 minutes the basket stops working and can't recover** (`app.js` `holdExpired`, basket submit)
- The hold timer starts when the first tool goes in the basket, and nothing ever resets it.
- Once 10 minutes have passed, every tap on Continue shows "Something went wrong. Try again." Trying again doesn't help, and neither does reloading. I tested all three.
- Only "Reserve another tool" on the done page clears it, and someone who never finished won't get there.
- The 10-minute hold isn't mentioned anywhere on the site.
- Your members reserve on a phone in the evening, a few minutes at a time, so many of them will hit this.
- **Fix:** say on the basket page how long the hold lasts ("held until 19:42"). When it runs out, put the tools back on hold, or explain what happened and offer one tap to hold them again. Also restart the timer when the basket is empty and after a reservation is confirmed.

**2. You can pick a day the library is closed, and you only find out on the last step** (tool page calendar, `initConfirm`)
- All 21 days in the calendar can be tapped. I chose Thursday 15 October, filled in my details and tapped Confirm.
- After a 1.5-second wait the confirm page said "The library is closed on Thursday 15 October… Choose another day". There's no link back to where you change the day, which is two pages earlier.
- You can also pick a day before the tool is back. I reserved the pressure washer, available from 17 October, for 10 October and it was accepted without a warning. That goes against your "honest about the stock" commitment.
- **Fix:** only let people choose session days on or after the tool's "available from" date. Disable the rest, or better, show just the sessions as a list.

**3. The pick-up day and the pick-up session can disagree, and the "Change" link loses the choice** (tool page, basket, confirm)
- Members choose a pick-up day on the tool page and then choose a session again in the basket, and nothing checks that the two match.
- I tested your "move to Wednesday" journey. Tapping "Change" opens the basket with no session selected, because the link doesn't carry the current one. After choosing Wednesday 21, the confirm page said "pick up Thursday 15 October" next to "Pick-up session: Wednesday 21 October".
- The desk would get two different dates for one reservation.
- **Fix:** ask for the date once. The simplest way is to drop the calendar from the tool page and keep the session choice in the basket. The "Change" link should pass the current session so it's still selected when the basket opens.

**4. Double-tapping Confirm makes two reservations** (`initConfirm`)
- Nothing on screen changes while the request runs for 1.5 s. The button only gets `aria-busy`, which sighted people can't see.
- I tapped twice and the done page showed "Reservation numbers FT-4471 and FT-4472".
- Continue in the basket has the same unseen 1.2 s wait.
- **Fix:** disable the button and change its text ("Confirming…") until the result comes back, and ignore any second submit.

**5. On a phone you can't tell the two drills apart in the list** (`.card__name a` in `styles.css`)
- Each tool name is cut to one line with "…". At 375 px both drills show as "Cordless drill 18 V, co…", and the part that differs ("two batteries" / "one battery") is hidden.
- That's the exact choice your critical journey depends on. With larger text, which your notes say is common, more names get cut.
- **Fix:** remove `white-space: nowrap` and `text-overflow: ellipsis` and let names wrap.

## Fix next: accessibility failures (WCAG 2.2 AA) that hit your members specifically

**6. "Available from" badges are too faint in dark mode.** Dark mode sets `--color-ok` to `#2f7d4a` on `#1d2622`, which is about 3.1:1 against the required 4.5:1. You can see the dim green in dark mode. DESIGN.md says success should be `#8fd1a8` in dark mode. Using that fixes it.

**7. On small phones the page scrolls sideways.** The results grid has a 330 px minimum column width (`minmax(330px, 1fr)`). At 320 px the page is 347 px wide, so it scrolls sideways or the phone shrinks it to fit (WCAG 1.4.10 Reflow). Use `minmax(min(330px, 100%), 1fr)`.

**8. The loan-length dropdown traps the keyboard.**
- While it's open, Tab just cycles between "One week" and "Two weeks", Escape doesn't close it, and tapping outside doesn't close it either.
- In my test, Escape left it open and the next Enter changed the loan to two weeks without me meaning to.
- The button's accessible name is just "One week", with no "Loan length".
- **Fix:** replace it with two radio buttons or a native `<select>`. That removes all of these problems and is less code.

**9. The session list is in reverse order on screen.** `.sessions` uses `row-reverse` + `wrap-reverse`, so 28 October appears at the top and 10 October at the bottom. Arrow keys and screen readers go in date order, the other way round (WCAG 1.3.2 Meaningful Sequence / 2.4.3 Focus Order). Use a plain column.

**10. The bar at the bottom of the tool page covers the footer.** At the bottom of the page it covers most of the footer, including the desk phone number. Its 72 px height isn't reserved because `.page--bar` sets the bottom padding to 8 px. As you tab down the calendar, focused days can also end up underneath it (WCAG 2.4.11 Focus Not Obscured; I found this risk from the code, not by testing it). Set the bottom padding of the page and footer to at least the bar's height.

## Usability problems worth fixing before launch

- **The "Added to your basket" message disappears after about 1.3 s** and doesn't link to the basket. Members then have to spot "Basket (1)" in the header. Keep the message until it's dismissed and include a "Go to basket" link (a second filled button would break your one-filled-button rule).
- **Search does nothing when nothing matches.** Searching "strimmer" left the previous two drills on screen, and the screen-reader status still said "2 tools found". Show "No tools match 'strimmer'" and clear the list.
- **On phones the search box is below all ten tools.** It starts about 2,100 px down because of `order` swaps under 480 px. The date filter is behind an unlabelled icon button. Put search first and give the button a visible "Filters" label.
- **The form rejects common ways of typing details.** It turns down `ft-01234`, `FT 01234`, `07700 900 123` and `+44 7700 900123`. Ignore spaces and letter case, and accept +44, before checking the format.
- **The done page still shows "Basket (1)",** which makes it look as if nothing happened. If the member goes on to reserve again in the same visit, the old reservation numbers show up again. Empty the basket when the reservation is confirmed.
- **"Choose a pick-up day first."** on the tool page isn't linked to the calendar, so screen readers don't announce it. Focus jumps to the 9 October button instead. Link it to the calendar with `aria-describedby` or put it in a live region.
- **The tool-page hint says "a green dot on a small screen".** That relies on colour and shape alone, and the dot is only 8 px. Showing "Open" under the date at every size, or listing only open days, fixes this and #2 together.

## Suggested order

1. **#1–#4 first.** They're logic bugs in `app.js`: people can't finish, or the desk gets duplicate or contradictory bookings. Fixing #2 and #3 together (one place to choose the session, offering only valid sessions) is the biggest single improvement.
2. **Then #5–#7.** These are small CSS changes with a big effect for phone, dark-mode and large-text users.
3. **Then #8–#10 and the usability list.**

Things I didn't cover: real VoiceOver or TalkBack, real iOS Safari, or 200% zoom on a desktop browser. Your notes list these as test targets, and someone should do them by hand before launch, ideally with one or two older members on their own phones.
