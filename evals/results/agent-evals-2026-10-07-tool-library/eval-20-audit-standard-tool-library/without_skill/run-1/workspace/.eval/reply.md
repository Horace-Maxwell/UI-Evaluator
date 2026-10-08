I reviewed the whole reservation flow (find → tool → basket → confirm → done). I read all the code and then ran each step in a headless browser set up like a member's phone: 375 px wide, dark mode, touch. I also tested larger text, 320 px reflow (what 400% zoom gives you) and keyboard use. I haven't changed any files.

**Short answer:** four problems will cost you real reservations, or leave members with the wrong one. Fix them before launch. The rest are accessibility and polish problems that members using phones, dark mode and larger text will run into.

## Fix first: these break bookings

**1. The basket hold runs out without warning, and members can't recover.** (`app.js:90-100`, `app.js:358-365`)
The hold starts when the first tool is added and lasts 10 minutes. The page never says so: "Items are held for you while you finish". Once the 10 minutes are up, Continue shows only "Something went wrong. Try again." Trying again fails the same way every time, because the timer is never reset. I confirmed this, and it also breaks the "Change" session route from the confirm page. Members who reserve in the evening with a cup of tea going cold will hit this.
→ Show the time limit and how much is left, warn before it runs out, and let members extend it. If it does run out, say what happened and put the tools back on hold, or tell members clearly what to do next. Never send them into a "Try again" loop.

**2. Members can pick a "pick-up day" that is impossible.** (`app.js:195-208`, `app.js:329-332`, `app.js:420-431`)
- The calendar lets you choose any day, including days the library is closed and days before the tool is back. I added the pressure washer, which is available from 17 October, for Monday 12 October, and the basket accepted it.
- The closed-day problem only shows up after the member has typed in all their details and pressed Confirm. The message says "Choose another day" but gives no link to where they can do that.
- The tool page asks for a day and the basket asks for a session, and the two can disagree. After moving the collection to Wednesday through "Change", the confirm page showed: *"…pick up Saturday 17 October"* next to *"Pick-up session: Wednesday 21 October"*.
→ Ask for one thing only: the session. Offer only open sessions on or after the tool's "available from" date. Then the confirm summary can't contradict itself.

**3. On a phone, the two cordless drills look identical in the list.** (`styles.css:372-381`)
Tool names are cut to one line, so both show as "Cordless drill 18 V, co…". At 375 px the name has 197 px of space but needs 313–327 px. Picking the right drill is the main task, and members can't see "two batteries" vs "one battery".
→ Let names wrap. Drop `white-space: nowrap` and the ellipsis.

**4. Double-tapping Confirm makes two reservations, and the basket isn't cleared afterwards.** (`app.js:413-433`, `app.js:452-455`)
I tapped twice and the done page said "Reservation numbers FT-4471 and FT-4472". The header still shows "Basket (1)", which makes members wonder whether the booking went through. The old hold also stays in place, so their next reservation runs straight into problem 1. The basket is only cleared if they tap "Reserve another tool".
→ Disable the button and show "Confirming…" while it works. Create the reservation number only once it has succeeded. Clear the basket and the hold when the done page loads.

## Fix next: phone, dark mode and larger text

5. **On phones, search is at the bottom of the find page.** (`styles.css:261-269`, `app.js:158-164`) On small screens the CSS moves the search box below all ten tool cards (about 2,090 px down a 2,590 px page). When a member searches, the list changes off-screen above them and they see nothing happen. A search with no matches (I tried "mower") leaves the old list in place with no message, even for screen readers. The date filter is hidden behind an unlabelled icon. → Put search first, scroll to the results or show "N tools found" next to them, show "No tools match 'mower'", and give the filter button a visible "Filters" label.
6. **The dark-mode "Available from" badge is hard to read.** (`styles.css:60-61`) The text contrast is 3.07:1; it needs 4.5:1 at 16 px. In dark mode `--color-ok` is `#2f7d4a`, but DESIGN.md says `#8fd1a8`. `--color-ok-tint` is the same colour as the card, so the badge has no visible background. → Use the colours from DESIGN.md.
7. **Larger text and zoom cause sideways scrolling.** (`styles.css:331`) At 320 px the find page is 346 px wide. With text at 200% (a common phone setting among your members), the find and tool pages are 414 px wide on a 375 px screen. The cause is the 330 px minimum card width, plus the 7-column calendar. → Use `minmax(min(100%, 330px), 1fr)`, and let the calendar become a list of sessions (which also fixes problem 2).
8. **Pick-up sessions are listed in reverse.** (`styles.css:816-822`) `row-reverse` plus `wrap-reverse` puts Wednesday 28 October at the top and the soonest session at the bottom. Keyboard and screen-reader order still runs from 10 October, so arrow keys move the opposite way to what members see. Coming back through "Change" also loses the session they had chosen. → Remove both reversals and keep the current choice selected (pass `slot` in the Change link).
9. **The loan-length list traps the keyboard.** (`app.js:238-251`) Once it's open, Tab just cycles through the options, and Escape doesn't close it (both confirmed). → Use a native `<select>` or two radio buttons ("One week" / "Two weeks"), which is simpler and works with every screen reader.
10. **"Added to your basket" disappears after about 1.3 seconds and doesn't say what to do next.** (`app.js:271-278`) First-time members don't know there's a basket step. → Show a confirmation that stays put, with a "Go to basket" link (or go straight to the basket).

## Then: smaller problems

- The forms reject reasonable input: "ft-01234" (lower case) and "+44 7700 900123" both fail (`app.js:387-389`). → Make the membership number upper case and strip spaces, and accept +44.
- Continue (1.2 s) and Confirm (1.5 s) only set `aria-busy`, so sighted members see nothing happening and tap again.
- On the tool page, the fixed action bar covers the desk phone number in the footer. → Give `.page--bar` bottom padding at least as tall as the bar (72 px).
- Done page: the hidden `#c-tool` makes screen readers read the tool name twice. The return date and loan length aren't shown, and those are what members will ask the desk about.
- The limit of "up to three tools" is stated but not enforced.
- Going back through "Change" from the confirm page loses the details already typed in.

## Notes and assumptions
- I tested in Chromium with phone emulation, not on real iOS or Android devices, and I didn't use VoiceOver or TalkBack. Before launch, do a quick pass with both screen readers on problems 5, 8 and 9.
- I assumed "today" is 8 October 2026, the date the site's code is fixed to.
- What works well: label and hint wording, the error summaries with links, visible focus outlines, 44 px tap targets, the reduced-motion setting, and nothing being paid online.

If it would help, I can start fixing problems 1–4 now. Most are small changes to `app.js` and `styles.css`. I can also turn this review into a page you can share with the volunteers.
