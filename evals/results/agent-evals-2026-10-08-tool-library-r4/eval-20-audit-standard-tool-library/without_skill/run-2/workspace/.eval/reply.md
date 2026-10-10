I went through the whole reservation flow (find → tool → basket → confirm → done). I read the code and then ran it in a headless Chromium at phone width (375 px) in dark mode, plus 320 px and a 200%-zoom width. I made no changes to the site. Line references point at `app.js` / `styles.css`.

**Bottom line:** the flow works if you click the exact right things. But four problems will cause wrong or lost reservations at launch, and they matter more than any polish. Fix those first.

## Fix before launch (members will fail or get the wrong result)

**1. Members can reserve a day the library is closed, and only find out on the last step.**
The tool page offers all 21 days. The basket then asks again, separately, for a "pick-up session". The two choices are never checked against each other:
- I picked Friday 16 Oct and then the Saturday 17 session. The confirm page showed "pick up Friday 16 October" next to "Saturday 17 October". After a silent 1.5-second wait, the confirm button failed with "The library is closed on Friday 16 October… Choose another day." That error has no link, and the only way to fix it is to go back to the tool page.
- In the "change session" case, the confirm page shows "pick up Saturday 17 October" and the session "Wednesday 21 October" side by side.
- The calendar also lets you pick days before a tool is back (the sander isn't available until 21 Oct, but 10 Oct can be chosen).

**Fix:** ask once. Make the calendar on the tool page offer only open session days on or after the tool's "Available from" date, and carry that choice through so the basket just shows it. If you keep the basket choice, list only sessions every item can make, and drop the per-item day. `app.js:195-200`, `330-332`, `421-431`.

**2. After 10 minutes, the basket is permanently stuck.**
The hold timer starts when the first tool is added and is never reset (`app.js:94-100`). After 10 minutes, Continue says "Something went wrong. Try again." Retrying gives the same error every time. I confirmed this with two attempts. The only way out is "Reserve another tool" on the done page, which a stuck member never reaches. The time limit is also never shown ("Items are held for you while you finish").

For phone users in the evening who are doing something else at the same time, this will be common.

**Fix:**
- State the limit ("held for 10 minutes, until 19:42").
- Warn before it runs out and offer more time (this is also a WCAG 2.2.1 requirement).
- When it expires, say what happened and either re-hold the tools automatically or reset the timer so Continue works.

**3. Double-tapping "Confirm reservation" makes two reservations.**
The reference number is created before the 1.5-second wait, and the button stays active during that wait (`app.js:413-420`). One double tap produced "Reservation numbers: FT-4471 and FT-4472". There is also no visible sign that anything is happening; `aria-busy` alone isn't visible.

**Fix:** disable the button and show "Confirming…" on the first tap. Do the same for Continue on the basket page (`app.js:356-367`).

**4. On a phone, the two drills look identical, and the search box is at the bottom.**
- At 375 px, every tool name is cut to one line. "Cordless drill 18 V, co…" appears twice, so a member can't tell the two-battery drill from the one-battery one. That is exactly the difference that matters in your main scenario. **Fix:** let names wrap (`styles.css:373-381`).
- The search box is about 2,100 px down, after all ten cards (`styles.css:261-269`). On desktop, keyboard focus also reaches the cards before the search box, so the focus order doesn't match what's on screen. **Fix:** put search first everywhere, and give "Filters" a visible text label instead of an icon only.

## Fix next (accessibility and dark mode)

5. **Dark-mode "Available from" badges are hard to read.**
   - Green text #2f7d4a on #1d2622 has a contrast of **3.07:1**, against a required 4.5:1. That colour isn't the dark-mode green in your DESIGN.md (#8fd1a8).
   - Its background colour is the same as the card's (1.00:1). So in dark mode, "available soon" is the *least* noticeable badge and "later" stands out more. In light mode it's the other way round.
   - **Fix:** use `--color-ok: #8fd1a8` and a real tint (`styles.css:60-61`).
6. **The basket lists sessions newest-first.** On a phone they run 28 Oct at the top down to 10 Oct at the bottom. Keyboard and screen-reader order is the reverse (`flex-direction: row-reverse; flex-wrap: wrap-reverse`, `styles.css:816-822`). **Fix:** use a normal column.
7. **Search with no matches silently does nothing.** "hammer" or "drill with two batteries" leaves all 10 tools on screen, and nothing is announced (`app.js:158-164`). **Fix:** show "No tools match 'hammer'", and match each word separately.
8. **"Reserve this tool" gives a 1.2-second toast and nothing else.** The toast disappears too fast to read on a phone, and there's no clear next step except the "Basket (1)" link in the header. **Fix:** after reserving, show a lasting message with a "Go to your basket" button (or go straight to the basket).
9. **The loan-length dropdown traps keyboard users.** Tab and Escape just cycle between the options; I tested this. Clicking outside doesn't close it either (`app.js:238-251`). **Fix:** use a native `<select>`, or a pair of radio buttons since there are only two options.
10. **The confirm form is too strict.**
    - It rejects "ft-01234" and "07700 900 123" (`app.js:387-389`). Accept any capitalisation and any spacing, and tidy the input up yourself.
    - "Change" goes to the basket with no session pre-selected (the journey expects the member to see what they chose), and it loses the name and number already typed. **Fix:** pass `slot` back and keep the details in sessionStorage.
    - Rename the link "Change session".
11. **Reflow at 200% zoom.** The find page is 346 px wide in a 187 px viewport, because of `minmax(330px, 1fr)` (`styles.css:331`), and the other pages are 259 px wide. Members zoomed to 200% will have to scroll sideways. **Fix:** use `minmax(min(330px,100%),1fr)` and let the masthead links and the calendar shrink.

## Smaller things
- **After confirming, the basket still shows "Basket (1)".** Clear it on the done page, not only when "Reserve another tool" is clicked.
- **The reservation number looks like a membership number.** "FT-4471" uses the same prefix as "FT-01234". A different prefix would help desk volunteers.
- **The "maximum three tools" rule is stated but not enforced.**
- **Screen readers hear the tool name twice on the done page**, because of the hidden `#c-tool` copy.
- **The sticky "Reserve this tool" bar covers the footer phone number** at the bottom of the tool page. Add bottom padding equal to the bar's height.

## Suggested order
1. Do items 1 to 4 together: one pick-up choice, a working hold, single submit, readable names and search at the top. Items 1 and 2 are the riskiest, because members will either turn up on a closed day or give up on the phone.
2. Then do 5 to 9, the dark-mode, keyboard and screen-reader fixes. Each is a one-line CSS change or a small code change.
3. Do 10 and 11 before launch if you can.

**Assumptions I made, since I couldn't ask you:**
- I treated the 10-minute hold and the 1.2 to 1.5-second delays as stand-ins for real server behaviour.
- I tested in Chromium only. I didn't test with VoiceOver or TalkBack, or in Safari's date picker, so a real run on an iPhone and an Android phone is still worth doing.

If you'd like this as a shareable page for the other volunteers, I can publish it.
