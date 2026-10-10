# Reservation flow review: Fernhill Tool Library

I reviewed all five pages (find → tool → basket → confirm → done) and `app.js`/`styles.css`, using the two journeys in `journeys/` and the facts in `PRODUCT.md`. I measured the dark-mode contrast numerically. **I did not run the pages in a browser or on a phone, and I did not test them with a screen reader.** Each finding below comes from reading the code. Where I worked out what a 375 px phone would show, I say so. I didn't change any files.

## Fix these before launch

### 1. Members can reserve a day the library is closed, or before the tool is back, and only find out at the last step
- On the tool page you can pick any of the next 21 days. Nothing stops you choosing a day without a session (`app.js:195-208`). The member learns this only after filling in their details and tapping **Confirm reservation**. After a 1.5 s wait they get "The library is closed on … Choose another day" (`app.js:421-430`). That error has no link and no way to change the day. The basket doesn't let you edit the day either, so the only way out is to remove the tool and start again.
- Days before the tool's "Available from" date aren't blocked. Take the pressure washer, which is available from 17 Oct. You can reserve it for Saturday 10 Oct and the reservation **succeeds**, because the 10th is a session. The desk ends up with a reservation for a tool it doesn't have. That breaks your "honest about the stock" commitment.
- **The member picks a date twice, and the two can disagree.** They choose a pick-up day on the tool page and then a session in the basket. Nothing links the two. In the "change pickup session" journey, the confirm page ends up saying *"Cordless drill … pick up Saturday 17 October"* right above *"Pick-up session: Wednesday 21 October"*. The closed-day check also looks at the tool page's day, not the session the member actually chose.

**Fix:** have the member choose the date in one place only. My recommendation is to drop the free calendar on the tool page and let them choose from the session list. Only offer sessions on or after the tool's available-from date (the latest date across everything in the basket), and use that one choice everywhere. If you keep the calendar, make the non-session days and the days before the tool is available unselectable (`disabled`, and leave them out of the tab order).

### 2. The basket hold expires silently and then blocks the member for the rest of the visit
- The hold is ten minutes from the first tool added (`HOLD_MINUTES`). The basket page only says "Items are held for you while you finish". It never mentions a time limit, shows a countdown or offers a way to extend it. WCAG 2.2.1 (Timing adjustable) requires some way to turn off, adjust or extend a time limit like this, with a warning before it runs out.
- When the hold runs out, **Continue** shows only "Something went wrong. Try again." (`app.js:360-364`). Trying again never works, because the hold start time is only cleared by "Reserve another tool" on the done page. Removing the tools and adding them again doesn't clear it either. **The member can't finish a reservation in that tab at all.**
- Your main user is on a phone in the evening, "doing something else", with "a cup of tea going cold". Going past ten minutes is a normal case for them.

**Fix:** state the limit when the first tool is added ("We'll hold this for 10 minutes"). Warn near the end and offer to extend. When the hold has expired, say so in plain words and re-hold the tools if they are still free. Reset the timer whenever the basket becomes empty.

### 3. On a phone the two drills look identical, and search and filters sit below the whole list
- Tool names are cut to one line with an ellipsis (`styles.css:372-381`). At 375 px a card leaves roughly 200 px for the name. By my estimate, both "Cordless drill 18 V, combi, two batteries" and "… one battery" show as about **"Cordless drill 18 V, co…"**. That is exactly the difference the main journey depends on, and larger text makes it worse. **Fix:** let names wrap.
- At 480 px and below the results come *before* the search form (`styles.css:261-269`). A member looking for "drill" has to scroll past all ten cards to reach Search. The "Available from" filter (top task 3) sits behind an icon-only button below that. **Fix:** put search first on phones, and show the date filter instead of hiding it.
- On desktop the reverse happens. The form is shown first, but its code still comes after the results, so keyboard and screen-reader order doesn't match what members see (WCAG 1.3.2 and 2.4.3).
- The results grid has a minimum column width of 330 px. At 320 px wide, or at high zoom, the page scrolls sideways (WCAG 1.4.10 Reflow). Use `minmax(min(330px, 100%), 1fr)`.

### 4. A search with no results leaves the old list on screen
`search()` only redraws when it finds something (`app.js:158-164`). Search for "hammer" or "drll" and the previous list stays put. There's no "No tools match" message, and screen readers hear nothing. Members will think the old list is their result. **Fix:** always redraw, and show an empty state such as "No tools match 'hammer'. Clear search", plus the desk number.

### 5. Double-tapping Confirm makes two reservations
Confirm creates the reservation number straight away and then waits 1.5 s (`app.js:413-433`). The button is never disabled, and nothing on screen shows that it's working: `aria-busy` has no styling. On a slow phone a second tap creates a second reservation, and the done page then shows "Reservation numbers FT-4471 and FT-4472". The desk sets the tool aside twice. The Continue button in the basket has the same missing busy state.

**Fix:** disable the button on submit, show "Confirming…", and ignore repeat taps.

## Fix next

6. **Dark mode: the green "Available from" badge is hard to read.** In dark mode `--color-ok` is `#2f7d4a` on `#1d2622`. That's **3.07:1**, and 16 px bold text needs 4.5:1. `DESIGN.md` specifies `#8fd1a8` for dark success (about 8.8:1), so the CSS doesn't follow the design. The badge background is also the same colour as the card, so it doesn't look like a badge. This is the only text that failed in my dark-mode contrast check. Body text, links, buttons, errors, the focus ring and the "Open" dot all passed.
7. **The loan-length dropdown is hard to use by keyboard and confusing with a screen reader.** Once it's open, Tab and Shift+Tab only cycle through the options, Escape doesn't close it, and tapping outside doesn't close it either (`app.js:238-251`). The button's accessible name is just "One week", without "Loan length". **Fix:** there are only two options, so use two radio buttons, or a native `<select>`.
8. **The "Added to your basket" message disappears after about 1.2 s, and the member isn't told what to do next.** Many members are older, so this is too fast. After reserving, the only way forward is the small "Basket (1)" link in the header. **Fix:** keep the message on screen with a "Go to basket" link. Better still, change the bar's button to "Go to basket" once the tool is added.
9. **Sessions in the basket are shown in reverse order.** The `row-reverse` and `wrap-reverse` styles (`styles.css:816-822`) put Wed 28 Oct at the top on a phone. Screen readers and keyboard users get them earliest first. **Fix:** remove the reversal so they're shown in date order.
10. **The membership and phone checks are too strict.** "ft-01234" and "FT 01234" are rejected; phone keyboards often lower-case the first letter. "+44 7700 900123" and "07700 900 123" are rejected too. **Fix:** accept these and tidy them up before checking. Use `autocapitalize="characters"` on the membership field.
11. **Only the "Open" label shows which days are sessions on a phone.** Below 480 px it becomes an unlabelled 8 px dot. Screen readers do hear "open". This stops mattering if you fix item 1.

## Smaller issues
- The done page shows a made-up reservation number, "FT-4471", if it's opened without reservation data (`app.js:443`). Reservation numbers also look like membership numbers ("FT-…"); use a different prefix.
- After confirming, the basket still holds the tools unless the member taps "Reserve another tool". Members could easily reserve the same tool again. Empty the basket once the reservation is confirmed.
- The page doesn't enforce the "up to three tools" limit.
- The fixed Reserve bar on the tool page covers the footer, which has the desk phone number, at the bottom of the page. Add bottom padding equal to the bar's height.
- When Reserve is tapped without a day, the error "Choose a pick-up day first" isn't read out. Focus moves to the first day button instead. Link the error to the calendar, or announce it.
- Headings: tool names on cards are `h2` inside the "Tools" `h2`; make them `h3`. On the done page, the hidden `#c-tool` makes screen readers read the tool name twice.

## Suggested order
1. Make the date a single choice that only offers real sessions on or after the tool's available date (item 1).
2. Make the hold visible, extendable and recoverable (item 2).
3. Let tool names wrap, and put search first on phones (item 3).
4. Fix the empty search result and stop double reservations (items 4 and 5).
5. Fix the dark-mode badge colour, the loan-length control, the "added" message and the session order (items 6–9).

Items 1, 2 and 5 can create wrong or duplicate reservations at the desk, or lock members out, so they need fixing before members get access. Items 3 and 4 slow down the main phone journey. Once items 1–5 are fixed, I'd run both journeys on a real phone in dark mode, with VoiceOver and at 200% text size. That check is still to do; this review didn't include it.
