# Reservation flow review: Fernhill Tool Library

I read all five pages (`index.html`, `tool.html`, `basket.html`, `confirm.html`, `done.html`), `app.js` and `styles.css`. I traced both journeys in the code: reserving the two-battery drill for Saturday 17 October, and moving the collection to Wednesday 21 October. I checked them against your PRODUCT.md and DESIGN.md, and I calculated colour contrast for the light and dark themes.

**How far to trust this:** I didn't have a browser in this session. I didn't use a real phone or a screen reader, and I didn't zoom the pages. Each finding below comes from reading the code. Where a finding depends on how the page lays out, I say so. Before launch, do one real pass on an iPhone and an Android phone in dark mode, with VoiceOver and TalkBack.

I didn't change any files.

---

## Fix these before launch

These four can stop a member from reserving, or leave the desk with a reservation that can't be met.

### 1. The 10-minute hold breaks the basket for good, with no warning
`app.js:90-100`, `app.js:358-365`

- The timer starts when the first tool is added and is only reset by "Reserve another tool" on the done page.
- After 10 minutes, every tap on **Continue** shows "Something went wrong. Try again." Trying again can't work. Removing and re-adding tools doesn't reset the timer either, so that browser tab can never reach the confirm page.
- Your members reserve on a phone in the evening, a few minutes at a time, while doing something else. Many of them will go past 10 minutes.
- No page says how long the hold lasts. The basket only says "Items are held for you while you finish". It also fails WCAG 2.2.1 (Timing adjustable): there is no warning and no way to get more time.

**Fix:**
- Say "We hold your tools for 10 minutes" on the basket page, with the time left.
- Warn the member before the hold runs out and let them extend it.
- When it does expire, say so in plain words ("Your 10-minute hold ran out. Your tools are still in the basket; continue to hold them again.") and restart the timer. Never show a generic error that can't be fixed by trying again.

### 2. The calendar accepts days the library is closed and days the tool isn't back yet
`app.js:195-208`, `app.js:421-431`

- Any of the 21 days can be chosen. On a phone (under 480 px) the "Open" label is hidden and only an 8 px dot is left (`styles.css:663-671`). Your persona doesn't know that only open days are sessions.
- If the member picks a closed day, nothing happens until the very end. They complete the basket and their details, tap Confirm, wait 1.5 seconds, and then read "The library is closed on Friday 16 October… Choose another day." The message has no link. The confirm page and the basket can't change the day, so they have to go back to the tool page and add the tool again.
- The tool's "Available from" date is never checked. You can reserve the sander (back 21 October) for Saturday 10 October and the reservation goes through. The member then turns up and the tool isn't there, which breaks your "honest about the stock" commitment.

**Fix:**
- Only let members choose open days that are on or after the tool's "Available from" date. Make the other days disabled, or don't show them.
- Keep the word "Open" (or "Sat 10:00–13:00") visible at phone width rather than the dot.
- Check the day when it is picked, not at the final step.

### 3. The pick-up day is asked for twice, and the two answers can disagree
`app.js:314`, `app.js:330-332`, `app.js:379-381`

- The tool page asks for a pick-up **day**, and then the basket asks for a pick-up **session**. Both list every session, whatever day was chosen.
- In the "change pickup session" journey, the confirm page then shows "Cordless drill… pick up Saturday 17 October" next to "Pick-up session: Wednesday 21 October". The member and the desk can't tell which one counts.

**Fix:** ask once.
- Either the tool page offers only session days and the basket confirms that choice,
- or drop the calendar and choose the session in the basket, offering only sessions where every tool in the basket is available.

Fixing this also removes most of finding 2.

### 4. Tapping Confirm twice makes two reservations
`app.js:413-433` and `app.js:343-368`

- Continue waits 1.2 seconds and Confirm waits 1.5 seconds. The only sign that anything is happening is `aria-busy`, which nothing styles, so the button looks dead.
- A second tap on Confirm saves a second reservation. The done page then says "Reservation numbers FT-4471 and FT-4472", and the desk sets aside two reservations.

**Fix:**
- Disable the button once it is tapped and show "Confirming…" or a spinner.
- Ignore repeat submits.
- Clear the basket after a successful confirm. At the moment it still shows "Basket (1)" on the done page, which invites a second confirm.

---

## Fix next: phone, dark mode and keyboard

### 5. Both drills look the same on a phone
`styles.css:373-381`

Tool names are cut to one line with an ellipsis. On a 375 px phone the name column is about 200 px wide, so "Cordless drill 18 V, combi, two batteries" and "…one battery" both show as roughly "Cordless drill 18 V, co…". That is exactly the choice your main journey depends on, and larger text makes it worse. (This comes from my estimate of the layout; check it on a phone.)

**Fix:** let names wrap. Remove `white-space: nowrap` and `text-overflow`.

### 6. On phones, the search box is below all ten tools
`styles.css:261-269`

Under 480 px the results move above the search form, so a phone user has to scroll past every card to search. The filters are also behind an icon-only button.

Searching for something that isn't stocked (for example "hammer") changes nothing: the old list stays and there is no "No tools found" message (`app.js:158-164`).

**Fix:**
- Put search first on phones.
- Show a "No tools match 'hammer'" message and announce it.
- Show "Filters" as text next to the icon.

### 7. The "Available from" badge fails contrast in dark mode
`styles.css:60-61`

Dark mode sets `--color-ok: #2f7d4a` on `--color-ok-tint: #1d2622`:

- The text contrast is **3.07:1**, below the 4.5:1 that 16 px bold text needs.
- The tint is the same colour as the card, so the badge also loses its box.

Your DESIGN.md says dark `success` should be `#8fd1a8` on `selection` `#24352c`, which gives **7.3:1**, so the stylesheet doesn't match its own spec. Set `--color-ok: #8fd1a8` and `--color-ok-tint: #24352c`.

Every other text colour I checked passes in both themes: muted text, buttons, errors, the toast and the "Open" marker.

### 8. Calendar day borders are faint in both themes
`styles.css:616`

The day cells are outlined with `--color-rule`, at about 1.6:1 against the card in both themes. In dark mode, the selected day's tint is only 1.2:1 against the card, although its 2 px green border does carry the selection.

The cells barely read as buttons (WCAG 1.4.11 asks for 3:1). **Fix:** outline open days with `--color-edge`.

### 9. The sticky Reserve bar covers content
`styles.css:204-206`, `758-771`

- The bar is fixed and 72 px tall, but the page reserves only 8 px of space for it. The footer, which holds the desk phone number, ends up underneath it.
- When someone tabs through the calendar, the focused day can scroll under the bar (WCAG 2.4.11, Focus not obscured).
- The bar doesn't pad for the iPhone home indicator.

**Fix:**
- Add bottom padding to the page equal to the bar's height plus `env(safe-area-inset-bottom)`.
- Add `scroll-padding-bottom` so focused items stop above the bar.

### 10. The session cards are displayed in reverse order
`styles.css:816-822`

`row-reverse` and `wrap-reverse` show the sessions newest first, with Wednesday 28 at the top on a phone. Keyboard and screen-reader order is still oldest first.

That is confusing when you're looking for "this Saturday", and it fails WCAG 1.3.2 and 2.4.3. **Fix:** use a plain `flex-direction: column` or a grid.

### 11. Tab and Escape don't work as expected in the loan-length list
`app.js:238-251`

While the list is open, Tab is captured to cycle through the options, Escape does nothing, and tapping outside the list doesn't close it. A keyboard user can only leave by choosing an option.

With only two choices, the simplest fix is two radio buttons, "One week" and "Two weeks". Otherwise, let Tab and Escape close the list.

### 12. "Added to your basket" disappears after 1.2 seconds and offers no next step
`app.js:271-278`

The toast is too brief for many members to read, and nothing points them onward. Your persona doesn't know how the basket works, and their only route is the small "Basket (1)" link in the header.

**Fix:** after Reserve, show a message that stays on screen, such as "Drill added. [Go to basket] or keep browsing", and mention the 3-tool limit. The limit isn't enforced anywhere at the moment.

---

## Fix after that: the confirm and done pages

**13. The validation rejects what phones autofill.** `app.js:387-389`
- `autocomplete="tel"` usually fills "+44 7700 900123", which the phone check rejects. So do "07700 900 123" and "07700-900123".
- The membership check rejects "ft-01234", "FT 01234" and "01234".

Accept all of these. Remove spaces and dashes, uppercase the input, add "FT-" if it's missing, and accept +44. When a value is still wrong, say what is wrong with it.

**14. The membership number and the reservation number look alike.** Membership is "FT-01234" and reservations are "FT-4471". At the desk, and in the confirm form, it's easy to give one for the other. Use a different prefix for reservations, such as "R-4471".

**15. "Change" loses the member's choice and doesn't say what it changes.** `confirm.html:44`
- The link goes to `basket.html` without the current session, so the choice isn't pre-selected.
- Its accessible name is just "Change". Use "Change pick-up session", with the extra words visually hidden if needed.

**16. A confirmation can go through with an empty basket.** `app.js:376-433`
- If the session's storage is lost (for example, the member opened the confirm page in a new tab), the confirm page shows "Your basket is empty." but still confirms.
- The done page then says "See your confirmation text", but no text is ever sent.
- Opening done.html directly shows a made-up "FT-4471".

Block Confirm when the basket is empty, and don't mention a text message unless one is sent.

**17. Smaller points:**
- On the done page, a hidden duplicate of the tool name (`#c-tool`, `done.html:38`) makes screen readers read the tool twice.
- The "Choose a pick-up day first" error isn't linked to the calendar with `aria-describedby`.
- The error summary's "#sessions" link scrolls to the list but doesn't move focus to the first radio button.
- `role="alert"` plus moving focus makes some screen readers read the error summary twice. Moving focus is enough.

---

## Order of work

1. **Hold timer (1) and double submit (4).** These are small code fixes that remove dead ends and duplicate reservations.
2. **Ask for the day once, and only offer open days when the tool is available (2 and 3).** This is the biggest change, and it fixes the most failed reservations.
3. **Phone layout and dark mode (5 to 10).** Mostly CSS, about half a day: wrapping names, putting search first, the dark badge colour, the space under the sticky bar, and session order.
4. **Input formats, the reservation number prefix, and the rest (11 to 17).**

Then test both journeys on a real phone in dark mode, at the largest text size, and with VoiceOver and TalkBack. That is the check I couldn't do here.

I can make these fixes in the code, starting with 1 and 4. I can also turn this review into a page you can share with the volunteers.
