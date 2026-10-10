# Review of the reservation flow

**How I checked it:** I read every page, `styles.css` and `app.js`. I traced both of your journeys (reserving the two-battery drill for Saturday, and moving the collection to a Wednesday) through the code at phone width (375 px). I also calculated colour contrast for the light and dark themes. I could not drive a real browser or a screen reader in this session. Where a finding depends on how something renders, I say it's an estimate. Before launch, run each fix on a real phone with dark mode on, and with VoiceOver.

## Fix these before launch

### 1. A member can complete every step and still be refused at the last tap
- **What happens:** the "Pick-up day" calendar on the tool page lets you pick any day: closed days, and days before the tool is even available. Nothing tells you that's wrong. You find out only after filling in your details and tapping **Confirm reservation**. After a 1.5-second pause, an error says the library is closed that day (`app.js:421`).
- **Why it's a dead end:** the error has no link, and the day can't be changed from the basket or the confirm page. To fix it you have to go back to the tool page, add the tool again and redo every step.
- **Days before the tool is in:** these are never checked at all. For example, the sander is available from 21 October, but you can reserve it for 10 October.
- **The day and the session don't have to match:** the day picked on the tool page and the session picked in the basket are separate choices. The confirm page can say "pick up Saturday 17 October" for the tool and "Wednesday 21 October" for the session at the same time. That is exactly what the "change pickup session" journey produces.
- **Fix:** let members choose the collection once, as a session. Only offer sessions on or after the tool's available-from date, and drop the free calendar. If you keep the calendar, disable closed days and days before the tool is available, and pre-select the matching session in the basket.

### 2. Taking more than 10 minutes breaks the reservation for the rest of the visit
- **What happens:** the basket hold starts when the first tool is added (`app.js:94`). After 10 minutes, **Continue** in the basket shows only "Something went wrong. Try again."
- **Why trying again doesn't help:** the hold timer is never reset, so every retry fails until the member closes the tab. Removing tools and adding them back doesn't reset it either.
- **Why members won't see it coming:** the time limit is never mentioned. The basket only says "Items are held for you while you finish."
- **Why it matters here:** your members reserve in the evening while doing something else, so going over 10 minutes is normal.
- **Fix:**
  - Say "We'll hold these for 10 minutes" and show the time left.
  - When the hold runs out, say so plainly and offer one button to hold the tools again, which also restarts the timer.
  - Under WCAG 2.2.1, let members extend the time before it runs out.

### 3. On a phone, the two drills look identical
- **What happens:** tool names on the cards are forced onto one line and cut off with "…" (`styles.css:373`).
- **Estimate:** at 375 px wide, the name has about 197 px. That fits roughly 20 bold characters, so both drills show as "Cordless drill 18 V, c…". The detail that tells them apart ("two batteries" vs "one battery") is hidden. Larger text makes this worse.
- **Fix:** let names wrap. Remove `white-space: nowrap` and `text-overflow`.

### 4. On a phone, the search box is below all ten tools
- **What happens:** under 480 px the CSS moves the results above the search form (`styles.css:261`). A phone user has to scroll past every card to reach search. Your journey file says members don't know where the date filter is.
- **The filters button:** it is an unlabelled three-line icon that looks like a menu.
- **Keyboard order on desktop:** the code puts the results before the form, but the screen shows the form first. A keyboard user has to tab through all ten tool links before reaching search (WCAG 2.4.3).
- **Fix:** put the form first in both the code and the layout. Give the filters button a visible "Filters" text label.

### 5. A search with no matches looks as if it did nothing
- **What happens:** if nothing matches, the old list stays on screen, and screen readers hear nothing (`app.js:160`).
- **Example:** "battery" doesn't match "batteries" (whole phrases are matched exactly), so a member searching "battery" sees the full list unchanged.
- **Fix:**
  - Always re-render the list, and show "No tools match 'battery'" with a way to clear the search.
  - Match each word separately.

### 6. The confirm form rejects normal phone input
- **Membership number:** this must be exactly `FT-` plus five digits, in capitals (`app.js:387`). iPhone keyboards capitalise the first letter, so a member typing "ft-01234" gets "Ft-01234", which is rejected. "FT01234" and "FT 01234" are also rejected.
- **Mobile number:** this must be `0xxxx xxxxxx` (`app.js:389`). "+44 7700 900123" (which phone autofill often inserts) and "07700 900 123" are both rejected.
- **Fix:**
  - Accept these formats and tidy them up yourself: convert to capitals, remove spaces and hyphens, add "FT-" if it's missing, and treat +44 as 0.
  - Set `autocapitalize="characters"` on the membership number field.

### 7. Tapping Confirm twice books the tool twice
- **What happens:** each tap allocates a new reservation number straight away, and the button stays active during the 1.5-second wait (`app.js:413`). It doesn't change visibly either; only `aria-busy` changes. A double tap gives "Reservation numbers FT-4471 and FT-4472".
- **Same pattern in the basket:** **Continue** has the same wait.
- **Fix:** disable the button and show "Confirming…" while it waits.

### 8. Dark mode: the green "Available from" badge is too faint to read
- **What happens:** in dark mode the badge text is `#2f7d4a` on `#1d2622`. That is **3.07:1**, below the 4.5:1 WCAG AA minimum for 16 px text.
- **The badge background:** it is set to the same colour as the card, so the badge has no visible shape.
- **This is off the agreed design:** DESIGN.md says the dark "success" green is `#8fd1a8`.
- **Fix:** in the dark theme, set `--color-ok: #8fd1a8` and `--color-ok-tint: #24352c` (`styles.css:60-61`). That gives about 7.3:1.
- **The rest of dark mode passes:** text, links, errors, buttons, the focus ring and the toast are all 7:1 or better.

## Fix soon after

9. **The pick-up sessions are listed in reverse date order on phones.** `flex-direction: row-reverse` with `wrap-reverse` (`styles.css:816`) puts 28 October at the top and 10 October at the bottom. Arrow keys and screen readers still move in date order, so they run against what's on screen (WCAG 1.3.2). Use a plain column.

10. **After "Reserve this tool" there's no clear next step.**
    - The toast is visible for only 1.2 seconds, and nothing on the screen moves you towards the basket.
    - The only way on is the small "Basket (1)" link at the top.
    - **Fix:** show a confirmation on the page that stays visible, with a "Go to basket" link.
    - If you leave the tool page's single main button as it is, this still fits DESIGN.md's one-filled-button rule.

11. **The bottom action bar on the tool page covers what's under it.**
    - The bar is fixed and 72 px tall, but the page leaves only 8 px of space below the content.
    - **Keyboard users:** when they tab through the calendar, the focused day can scroll under the bar (WCAG 2.4.11).
    - **Footer:** the desk phone number in the footer is partly hidden.
    - **Fix:** give the page `padding-bottom: calc(var(--actionbar) + 16px)` and `scroll-padding-bottom`.

12. **The loan-length dropdown (`app.js:238`) is awkward to use by keyboard.**
    - While it's open, Tab and Shift+Tab only move between the options instead of leaving the list.
    - Escape doesn't close it, and tapping outside it doesn't either.
    - There are only two choices, so replace it with two radio buttons: "One week" and "Two weeks".

13. **Screen reader users miss the "choose a day" error on the tool page.**
    - Focus jumps to the first day (a closed Friday), and the error isn't announced.
    - **Fix:** put the error in a live region, or link it to the calendar group with `aria-describedby`.

14. **The done page doesn't finish the visit cleanly.**
    - The basket still shows the confirmed tools, and the hold timer keeps running, so a second reservation in the same visit runs straight into problem 2.
    - Opened without a reservation, the page shows a made-up number, "FT-4471".
    - Reservation numbers (FT-4471) look like membership numbers (FT-01234), so members can easily mix them up at the desk.
    - **Fix:** clear the basket and the timer on confirmation, and give reservation numbers a different prefix.

## Smaller items
- **Done page:** screen readers read the tool name twice, because of the hidden `#c-tool` copy.
- **Confirm page:** the "Change" link's name on its own doesn't say what it changes. Add "pick-up session" for screen readers.
- **Reflow:** the results grid's 330 px minimum column causes sideways scrolling at 320 px width and at 200% zoom (WCAG 1.4.10). Use `minmax(min(330px, 100%), 1fr)`.
- **Tool limit:** "up to three tools at a time" isn't enforced.
- **Unclear wording:** the done page's fallback text says "See your confirmation text", but members are only told about texts for late returns.

## What I'd do first
1. Make the session the only collection choice, and only offer valid sessions (problem 1).
2. Fix the hold timeout (problem 2).
3. Stop the drill names being cut off (problem 3).
4. Fix the form's input formats and the double tap (problems 6 and 7).
5. Fix the one-line dark-mode badge colour (problem 8).

Problems 1 to 3 can each stop a member reserving or reserve the wrong tool. Problems 4 to 8 are quick CSS or small JavaScript changes. All eight can be done before next month.

What works well:
- Dark mode is otherwise well built.
- Buttons and other tap targets are at least 44 px.
- Errors appear in a summary at the top of the page that links to each problem field.
- Personal details stay out of the web address.
- The wording sounds like your desk volunteers.
