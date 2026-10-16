I reviewed all four steps (when → vehicle → check and book → done) by reading the HTML, the stylesheet and the minified `app.js`. I also re-ran the bundle's colours and slot data through a small script. **I couldn't open the site in a browser in this session.** So everything below comes from the code, not from tapping through on a phone. Please check the top items on a real phone (360 px wide, dark mode, VoiceOver/TalkBack) before you sign off.

## Before the usability list: check this with the agency

The bundle never sends anything to a server. `app.js` has no `fetch`, XHR or form submission. Slot availability is invented from a hash of the date, and the reference is a hash of date, slot and registration. "Today" is also fixed at 12 October 2026, in the script and in the Today, Tomorrow and Saturday 17 buttons. As delivered, it reads like a demo. A real booking would not reach the gate's list. I've assumed a live version is coming and reviewed the flow as designed, but I'd confirm this first.

## Fix first (these send people to the gate with a booking that won't work)

1. **Tapping "Book this slot" twice cancels the booking.** After the first tap, a second tap within 1.5 seconds quietly changes the button to "Cancel booking". The booking is then saved as *cancelled*. The done page still says **"Booked"** and shows a reference, with only a red line underneath: "Status: cancelled. This booking is not on the gate's list". Pressing Enter twice in a field does the same. Nothing on screen shows the first tap worked (only `aria-busy`), so on a slow phone a second tap is very likely. Fix: disable the button and show "Booking…" while it works, ignore repeat taps, and remove the cancel-on-second-tap behaviour completely.

2. **The 5-minute hold runs out silently, and the message is misleading.** The hold starts when you tap a slot and is only checked when you press Book. No one is told about the 5 minutes, and there's no warning or way to extend it. Five minutes is tight for an older resident typing a registration, name, mobile and postcode on a phone, and it fails WCAG 2.2.1 (Timing adjustable). When it expires, the page says "This slot is no longer available" (which may not be true), blanks the slot to "—", and gives no link to fix it. Fix: say "We'll hold 10:20 for 5 minutes" when the slot is picked, warn before expiry and offer more time, and on expiry offer the same slot again if it's still free.

3. **Today's past slots look free but are rejected at the very end.** Today is the default day. Today's slots before the 30-minute cut-off (08:00–10:20 at the fixture's 10:05) are shown as free or "Few left" and can be selected. The cut-off is only applied after the resident has filled in everything and pressed Book. The error has no link. This breaks the brief's "a slot shown as free is free". Fix: hide or disable those slots on the first step.

4. **Van and trailer permits are checked in the wrong place.** The permit rule is hidden behind an unlabelled ⓘ icon. The permit field only appears 1.2 seconds after you choose Van or Car with trailer, so someone who taps Next quickly skips it. The vehicle step doesn't check the permit. The check only happens after Book on the last page, with no link back to the field on the previous page. Fix: put the rule in the button text or right under it ("Van – needs a free permit, DRC-12345"), show the field straight away, and check it on the vehicle step.

5. **"Change slot" and "Back to the slots" lose the day.** The first step always opens on Today and ignores the day already chosen. Someone moving Saturday 09:20 to the afternoon lands on Monday's slots. If they tap 14:20 assuming it's still Saturday, they've booked Monday 14:20. The confirm page does show the day, but it's easy to miss. Fix: open the first step on the saved day, with the saved slot selected.

## Fix next (accessibility, and the phone or dark-mode setting most residents will use)

6. **Keyboard users can't see which slot they're on.** The script injects `.slot:focus{outline:0}`, which overrides the site's own focus ring, and only on slots, the main control. This fails WCAG 2.4.7. Fix: delete that rule.

7. **Slots are out of time order.** "Few left" slots get CSS `order:-1`, so they jump to the top of the grid, above the "Morning" heading. On Saturday 17, the list starts 10:20, 10:40, **16:20**, and then 08:00… That's confusing on sight. Screen readers and Tab also follow a different order from what's on screen (WCAG 1.3.2 and 2.4.3). Fix: remove the reordering and keep strict time order.

8. **The slot grid overflows sideways on 360 px-wide phones.** At window widths of 360 px or less, the script fixes three columns at pixel widths that ignore the page padding and gaps. The grid ends up about 30 px wider than the screen, so the right-hand column is cut off and the page scrolls sideways. That covers many Android phones and iPhones with Display Zoom turned on (320 px). It also fails reflow at 400% zoom (WCAG 1.4.10). The plain CSS grid already works, so the fix is to delete the resize handler.

9. **The "Few left" tag is low contrast in both themes.** It measures 3.0:1 in light and 3.4:1 in dark, against 4.5:1 needed for 16 px text (WCAG 1.4.3). Every other colour pair I checked passes in both themes, including dark mode: body text, muted text, links, buttons, errors, borders and the focus ring. Fix: darken the amber in light mode and lighten it in dark mode.

10. **The done page doesn't say when to come.** It shows only the reference. There's no day, time, vehicle or "arrive between 10:20 and 10:40". The 20-minute arrival rule only appears in a hover tooltip (`title`), which phones never show. The centre has poor signal, so this page is what residents will rely on. Fix: show the day, time window, vehicle, registration and waste on the done page in a form that's easy to screenshot or print. If the reference is missing, show a clear message instead of the placeholder "DR-000000".

## Smaller fixes

- Slots vanish for about 0.9 seconds while loading with no "Loading slots…" message, and tapping Next during that time does nothing, with no feedback.
- The "N slots free" status is made a live region only after its first message, so the first announcement can be missed. Put `aria-live` in the HTML.
- Error-summary links point to `#vehicle` and `#waste` (containers, not controls). The permit, hold and cut-off errors have no links at all.
- The vehicle choice uses three toggle buttons (`aria-pressed`). Radio buttons would announce "1 of 3" and fit a single choice better. The vehicle error isn't connected to the group.
- On the waste checkboxes, the error replaces the hint "Rubble up to four bags…" for screen readers instead of being added to it.
- Registration and postcode have no `autocapitalize="characters"` or `spellcheck="false"`, so phone autocorrect may mangle "AB12 CDE".
- No online way to change or cancel a booking you've already made. The only option is a phone line open weekdays 09:00–17:00, but most people book in the evening. This is top task 2 in your brief, so it may be a scope question for the agency.

## What's already good

The flow is short. Labels and hints are tied to the inputs, and the name, phone and postcode fields have autocomplete. The error summary takes focus. Targets are at least 44 px. The language is plain, and nothing personal goes in the address bar. Dark-mode colours are fine apart from "Few left".

**The order I'd give the agency:** 1 → 2 → 3 → 4 → 5 (wrong or lost bookings), then 6 → 7 → 8 → 9 → 10. Items 1, 6, 7 and 8 are each a few lines in the bundle. As you only hold the built bundle, ask the agency to fix the source rather than patching the minified file. I can turn this into a shareable page for them if that helps.
