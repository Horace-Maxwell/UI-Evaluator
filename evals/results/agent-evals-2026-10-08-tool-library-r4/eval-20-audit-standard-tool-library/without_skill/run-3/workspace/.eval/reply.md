# Reservation flow review: what to fix first

I read all five pages, `app.js` and `styles.css`. I also ran the flow in a headless Chromium on the live site, set up like a phone (375 px wide, touch, dark mode). Every problem below was reproduced in the browser unless it says otherwise. I haven't changed any code.

**Inferred, since I couldn't ask you:** "next month" means fixes need to be small and safe. So I've ranked by how likely each problem is to make a member fail or reserve the wrong thing on a phone in the evening, not by how bad a WCAG violation it is. I didn't test with VoiceOver or TalkBack, and I didn't test real 200% zoom on a device. The screen-reader notes come from reading the markup.

## Fix before launch

**1. A member can "successfully" reserve a pick-up that can't happen.**
- The tool page calendar lets you pick any day. That includes closed days, and days before the tool is even back.
- I reserved the sander, which is available from 21 October, for **Monday 12 October**. It went straight into the basket.
- On the basket page I then chose the Saturday 10 October session. Nothing flagged the clash with the 12 October day.
- The closed day is only caught at the very last step, after the member has filled in their details. Even then, the message ("The library is closed on Monday 12 October… Choose another day.") has no link and no way to change the day. They have to remove the tool from the basket and start again on the tool page.
- The "tool not available yet" case is never caught. If I'd picked an open day before 21 October, it would have confirmed.
- The confirm page can also show a pick-up day per tool *and* a different session, which contradict each other.
- **Fix:** make the session the only choice the member makes. Drop the free calendar, or make only the open sessions on or after the tool's "available from" date selectable. Then remove the separate per-tool pick-up day. This also gets rid of the 8 px green dot, which is the only sign of an open day at phone width and is hard to see for older eyes.

**2. Leave the basket for ten minutes and you're stuck for good.**
- The 10-minute hold isn't shown anywhere. The page only says "Items are held for you while you finish".
- When the hold runs out, Continue says **"Something went wrong. Try again."** Trying again fails the same way every time, because the hold timer is never reset. The only way out is to empty the basket.
- Members do this "a few minutes at a time, with a cup of tea going cold", so many of them will hit this.
- It also fails WCAG 2.2.1 Timing Adjustable: there's no warning and no way to get more time.
- **Fix:**
  - Show the hold time ("We'll hold these until 19:42").
  - Let members extend it, or quietly start a new hold if the tool is still free.
  - If it has really expired, say so plainly and offer one button to hold the tools again.

**3. Tapping Confirm twice makes two reservations.**
- Confirm waits 1.5 seconds with no visible change, and the button stays active. A second tap on a slow phone is very likely.
- My double tap produced **"Reservation numbers FT-4471 and FT-4472"** for a single drill. That's duplicate work for the desk volunteers.
- Continue on the basket page has the same silent 1.2-second wait.
- After confirming, the masthead still shows **Basket (1)**, so the same tool can be confirmed again.
- **Fix:**
  - Disable the button while it's busy and show "Confirming…".
  - Ignore repeat submits.
  - Clear the basket and the hold once a reservation succeeds, not only when they tap "Reserve another tool".

**4. On a phone, the two drills look the same and search is hard to find.**
- Card names are cut to one line with an ellipsis. At 375 px, both drills read **"Cordless drill 18 V, co…"**, so you can't tell "two batteries" from "one battery". That's exactly the choice the main journey depends on. 9 of the 10 names are cut off.
- Below 480 px, the search box and filters are moved under all ten cards, about 2,100 px down the page.
- The date filter is behind an unlabelled icon button with three lines, which reads as a menu.
- **Fix:**
  - Let card names wrap (remove `white-space: nowrap` and the ellipsis in `.card__name a`).
  - Put search above the results on phones.
  - Give the filter button a visible label, "Filters".

**5. Dark mode: the green "Available from" badge is too faint.**
- In dark mode, `--color-ok` is `#2f7d4a` on `#1d2622`. That's about **3.1:1** for 16 px bold text, and it needs 4.5:1 (it fails WCAG 1.4.3).
- It's on almost every card, in exactly the setting most members use.
- DESIGN.md says the dark success colour should be `#8fd1a8`. The stylesheet just doesn't follow it.
- **Fix:** set `--color-ok: #8fd1a8` and `--color-ok-tint: #24352c` in the dark block of `styles.css`.
- Everything else I checked in dark mode was fine: body text, links, buttons, focus ring, errors and the toast.

## Fix soon after (important, but members can get through)

6. **After "Reserve this tool", there's no next step.** The toast shows "Added to your basket" for only 1.2 seconds and has no link. The basket count is in the masthead, which has scrolled out of view. Keep the confirmation on screen with a "Go to basket" link.
7. **Searching with no matches does nothing.** "drill with two batteries" leaves the old list of 10 tools on screen, and the hidden status message is never updated. Show "No tools match…", and match individual words rather than the exact phrase.
8. **Sessions are listed backwards.** CSS `row-reverse` with `wrap-reverse` shows 28 October at the top and 10 October at the bottom. Keyboard and screen-reader order are still chronological, so what members see and what they hear disagree (WCAG 1.3.2). Use normal column order.
9. **Phone and membership number checks are too strict.** "07700 900 123", "+44 7700 900123" and "ft-01234" are all rejected. Strip spaces, accept +44, and uppercase the membership number before checking.
10. **The loan-length dropdown has awkward keyboard behaviour.** Tab loops inside the open list, Escape doesn't close it, and tapping outside doesn't close it. Simplest fix: use two radio buttons, "One week" and "Two weeks".
11. **The "up to three tools" rule isn't enforced.** You can add all ten.
12. **"Choose a pick-up day first" isn't announced.** Focus jumps to the 9 October button, but the error isn't linked to the calendar, so a screen-reader user just hears the date. If you do fix #1 as suggested, this goes away.

## Smaller polish

- At 320 px wide (small phones, or 400% zoom), the results grid scrolls sideways: 346 px of content in a 320 px window (WCAG 1.4.10). Change `minmax(330px, 1fr)` to `minmax(min(330px, 100%), 1fr)`.
- The fixed Reserve bar covers most of the footer, including the desk phone number. It can also hide focused items when someone moves through the page by keyboard (WCAG 2.4.11). Add bottom padding to match the bar's height.
- The "Change" link on the confirm page doesn't keep the session already chosen. Add `?slot=` to the link.
- There's no skip link.
- The calendar doesn't show the month name.
- The done page doesn't say the loan length or when to return the tool.

## Suggested order

1. Session-only pick-up that respects availability (#1).
2. Hold messaging and recovery (#2).
3. Double-submit guard and clearing the basket (#3).

These three are where members end up with a broken or duplicate reservation, or no way forward. #4 and #5 are cheap CSS changes worth doing at the same time.

Once these are fixed, I'd run the two journeys in `journeys/` on a real phone in dark mode with VoiceOver before opening reservations. I can make the fixes if you'd like.
