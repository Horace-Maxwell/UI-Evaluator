I tested all four steps (When → Vehicle and waste → Check and book → Booked) on a phone-sized screen, in both light and dark mode. Changing a slot works without problems. A few bugs will send residents to the gate with no valid booking, so fix those first.

## Fix before launch

1. **Tapping "Book this slot" twice cancels the booking.** The button shows nothing for 1.5 seconds after it's pressed. A second tap in that time changes its label to "Cancel booking" and saves the booking as cancelled. The resident still lands on a page headed **"Booked"** with a big reference number. The only sign of the problem is a small red line: "Status: cancelled. This booking is not on the gate's list." On a phone, people double-tap a button that doesn't respond all the time.
   *Fix:* show a busy state on the button ("Booking…") and disable it while the booking goes through. Never reuse the same button to cancel. If a booking ever does end up cancelled, don't headline that page "Booked".

2. **The 5-minute hold runs out with no warning and no way back.** A slot is held for 5 minutes from the moment it's tapped, but the site never says so. Finding the registration, choosing the waste and typing four fields on a phone can easily take longer. When that happens, the resident sees only "This slot is no longer available." The slot in the summary turns into "—", and there's no link back to the slot list. The slot may well still be free, so the message is also misleading.
   *Fix:* say "We'll hold this slot for 5 minutes" when the slot is chosen. Warn before the hold ends and let people extend it (WCAG 2.2.1, timing adjustable). If it does run out, check whether the slot is still free and rebook it quietly. If it isn't, add a "Choose another slot" link.

3. **Today's slots that have already gone are shown as free.** The page opens on "Today" by default. Slots that have passed, or start within the next 30 minutes, appear as free and can be chosen. The resident only finds out at the very last step ("The 08:00 slot today can no longer be booked"), after typing in all their details. That breaks the promise to "say what is free now".
   *Fix:* disable or remove those slots on the first step.

4. **Van and trailer bookings fail only at the end, with no way to fix them.** The "Permit number" field shows for every vehicle, including cars, because a CSS rule stops it from hiding. Nothing checks the permit on the vehicle step. The check happens on the last step, and its error ("A van needs a permit number…") has no link back to the field, which is one page earlier.
   *Fix:* show the field only for a van or a car with a trailer, check it when the resident taps Next on that step, and link any error to the field.

5. **On smaller phones the slot grid is wider than the screen.** At 320 px and 360 px wide (older iPhones, many small Android phones) the slot grid pushes the page sideways, so it scrolls left and right and the right-hand column is cut off. A bit of script sizes the grid's columns without allowing for the page margins. This fails WCAG 1.4.10 (reflow).
   *Fix:* remove that script; the CSS grid already handles narrow screens.

## Fix next (big problems for keyboard, screen reader and dark-mode users)

6. **Slots are out of time order.** Every "Few left" slot jumps to the top of the grid, above the "Morning" heading, mixing morning and afternoon (on Saturday 17: 08:20, 08:40 … 16:40, then "Morning 08:00, 09:20…"). People looking for "Saturday morning" are misled. Screen readers and the keyboard go through the slots in a different order from what's on screen (WCAG 1.3.2, 2.4.3).
   *Fix:* remove the `order:-1` style and keep slots in time order.

7. **Slots show no keyboard focus.** The script adds a `.slot:focus{outline:0}` style that hides the focus ring on every slot button. Keyboard users can't see which slot they're on (WCAG 2.4.7).
   *Fix:* remove that style.

8. **The "Few left" label is hard to read in both themes.** The contrast is 3.0:1 in light mode and 3.4:1 in dark mode, below the 4.5:1 that text this size needs (WCAG 1.4.3). In dark mode it's dull amber on brown and hard to read. Other dark-mode colours pass (body text 8.7:1, buttons 8–9:1).
   *Fix:* use a darker amber in light mode and a much lighter amber in dark mode.

9. **"Change slot" forgets the chosen day.** Going back from the check step opens on "Today" with nothing selected. Someone moving their Saturday slot has to pick Saturday again, and for a moment it looks as if the booking has moved to today. The vehicle, waste and details are kept.
   *Fix:* open on the day and slot already chosen.

10. **The confirmation page doesn't show the day or time.** "Booked" shows only the reference. The day, time and vehicle aren't repeated, though the gate has poor signal and that's the screen people will screenshot or print.
    *Fix:* show the day, the 20-minute slot, the vehicle and registration next to the reference.

## Smaller issues

- **No loading message.** Slots take about a second to appear and nothing shows in the meantime. Tapping Next during that second does nothing.
- **Hard-to-type date on iPhone.** "Another day" asks for DD/MM/YYYY, but the numeric keypad on iPhone has no "/" key. Typing 17102026 does work, so say that in the hint, or use a native date input.
- **Slot length only in a tooltip.** "Arrive within your slot" is only in a tooltip, and phones don't show tooltips. Put it under the slot heading.
- **Mobile number is required.** It's only "for a reminder", so residents without a mobile can't book. Check whether that's intended, or make it optional.
- **First slot count not announced.** The slot count is only marked to be read out after its first update, so screen readers miss it the first time.

## Check with the agency (my inference, not something I could confirm)

- **"Today" is fixed to 12 October 2026.** The day buttons ("Today", "Tomorrow", "Saturday 17", "Sunday 18") are also hard-coded. From the next day on, they'll point to the wrong dates or to dates that have passed.
- **Slots and bookings look like placeholders.** Availability is generated by the script. Booking makes no request to any server, and the reference is calculated in the browser.
- These may be demo stubs, but confirm that the live build reads the real date and sends bookings to the gate's list. Otherwise none of the fixes above matter.

## How I checked

- **Reading the code:** I read the minified script and stylesheet.
- **Browser:** Chromium at 320, 360 and 375 px wide, in light and dark mode. I worked out contrast from the colours the page actually used.
- **Steps reproduced:** the booking and change-slot journeys, the double tap, an expired hold, a past slot today, a van with no permit, and keyboard focus on the slots.
- **Not tested:** real VoiceOver and TalkBack.

All the fixes are in `app.js` and `styles.css`. The agency only handed over the built bundle, so they'll need to make them in their source.

I can put these findings on a page you can send the agency if that helps.
