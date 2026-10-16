# Booking site review: what to fix first

I read all four pages (`index.html`, `vehicle.html`, `confirm.html`, `done.html`), the minified `app.js` and `styles.css`. I worked out the slot data and the colour contrast from the code. I didn't drive the site in a real browser, phone or screen reader in this run, so check the top items on an actual phone before launch. All the fixes have to go back to the agency, because the bundle is minified and has no source.

## Fix before launch (these will cause failed or wrong bookings)

**1. Tapping "Book this slot" twice cancels the booking, but the next page still says "Booked".**
After the first tap there's a 1.5 second wait. The button looks exactly the same during it (only `aria-busy` changes). A second tap during that wait switches the button to "Cancel booking" and marks the booking cancelled. The resident then lands on a page headed **Booked** with a reference, and only a small red line underneath says "Status: cancelled. This booking is not on the gate's list." On a phone, impatient double taps are common, so some residents will arrive at the gate with a cancelled booking.
*Fix:* disable the button and show "Booking…" while the request runs. Remove the cancel-on-second-tap behaviour completely. On the done page, never show "Booked" for a booking that isn't live.

**2. "Today" is fixed inside the bundle as Monday 12 October 2026, 10:05.**
The quick-day buttons are hard-coded: "Today" is 12/10, "Tomorrow" is 13/10, plus "Saturday 17" and "Sunday 18". The 14-day booking window is counted from 12 October, and the same-day cut-off is fixed at 10:35. The slot list also ignores the clock: at 9pm, every slot for today still shows as free. It's already 16 October, so today the "Today" button points at a past day. From next month nothing will be bookable, because every date will be outside the window. My guess is that this is a demo setting the agency forgot to switch to the live date and time (I couldn't confirm that), but it stops launch either way.
*Fix:* take the date and time from the server. Generate the quick-day labels from that. Hide or disable same-day slots that start less than 30 minutes from now.

**3. The 5-minute slot hold is never shown and is only checked at the very end.**
Picking a slot starts a 5-minute hold. Nothing on screen mentions it. The check only runs after the resident has chosen a vehicle and waste, filled in four fields and tapped Book. If they've gone past 5 minutes, the slot is cleared and they get "This slot is no longer available", which isn't true: their hold ran out, and the slot may still be free. The message also has no link back to the slots. Residents booking on a phone while doing something else will often take more than 5 minutes. This also fails WCAG 2.2.1 (Timing Adjustable): there's no warning and no way to extend.
*Fix:* say "We'll hold 09:20 for you for 5 minutes" when a slot is picked, and show the time left on the next steps. Warn before the hold ends and let them extend it. When it does run out, re-book automatically if the slot is still free; if it isn't, link straight back to the slots and keep everything else they entered.

**4. Slots marked "Few left" jump out of time order.**
Each "Few left" slot has `order:-1`, so it moves to the top of the grid, above the "Morning" heading. For Saturday 17 that puts 08:20, 08:40, 09:00, 09:40, 10:20, 10:40, 13:40, 14:00, 15:00 and 16:40 at the top. Then come "Morning", 08:00, 09:20, and so on. Afternoon times end up above "Morning", and someone scanning for "around half nine" has to search two lists. Keyboard and screen reader users get a different order from what's on screen (WCAG 1.3.2 and 2.4.3).
*Fix:* remove the `order` style and keep slots in time order. The "Few left" tag already does the job.

**5. Slots have no keyboard focus indicator.**
The script adds `.slot:focus{outline:0}` at run time. That overrides the site's own focus ring, but only on the slot buttons, which is the most important control (WCAG 2.4.7). Keyboard-only residents can't see which slot they're on.
*Fix:* delete that injected style.

**6. On 360px-wide phones, and when zoomed, the slot grid runs off the screen.**
At widths of 360px or less, the script forces three columns of `(window width − 16) ÷ 3` pixels each. It ignores the 32px of page padding and the gaps. At 360px that makes the grid about 358px wide in 328px of space; at 320px it's about 319px in 288px. Many Android phones are 360px wide, and at 200% zoom a 375px iPhone counts as about 187px, so you get sideways scrolling and cut-off slots (WCAG 1.4.10).
*Fix:* remove the resize script. The stylesheet's own `repeat(auto-fill, minmax(96px, 1fr))` already handles small screens.

## Fix next (users get stuck or are turned away at the gate)

**7. Van and trailer users only find out about the permit at the last step.**
The rule is hidden behind an unlabelled "i" icon. The permit field appears 1.2 seconds after "Van" is picked, so a quick tap on Next goes past it, and nothing announces it to screen readers. The vehicle page doesn't check the number. The error only appears after Book on the last page, and it has no link back to the field. Permits also take up to two working days to arrive, so a van owner booking the evening before can't get one in time.
*Fix:* put "Vans and cars with trailers need a free permit (it takes up to 2 working days)" next to the vehicle choice, as visible text. Show the permit field immediately. Check its format on the vehicle page.

**8. "Few left" tags fail colour contrast in both themes.**
Amber text on an amber background is 3.0:1 in light mode and 3.4:1 in dark mode. At 16px bold that's normal text, which needs 4.5:1 (WCAG 1.4.3). Most other colour pairs pass comfortably in dark mode (text is 8–14:1, borders and focus are about 5:1), so this is the main dark-mode contrast problem.
*Fix:* make the amber text darker in light mode and lighter in dark mode.

**9. "Change slot" loses the chosen day.**
"Change slot" on the check page goes back to the slots page set to "Today", with no slot selected. The resident has to find Saturday again and has no idea whether their vehicle and details are kept. They are kept, but the page doesn't say so.
*Fix:* open on the booked day with the current slot selected, and add a line saying the rest of the booking is kept.

**10. The confirmation page shows only the reference.**
It doesn't give the day, time, vehicle or address details for the gate. The centre has poor signal, so residents will be relying on whatever is on their screen.
*Fix:* repeat the day, the 20-minute slot, the vehicle and the registration next to the reference.

**11. Slots disappear for almost a second with no message.**
Every day change blanks the slots for 0.9 seconds with no "Loading" text. Tapping Next during that time silently does nothing. The live region for the slot count is only switched on as the first result appears, so screen readers may miss that first announcement.
*Fix:* show "Loading slots for Saturday 17 October…" in a live region that's there when the page loads.

**12. "Today" is selected by default.**
Most residents book the evening before, when today's slots have all passed.
*Fix:* after the last same-day cut-off, default to Tomorrow.

## Smaller fixes

- **Arrival rule only in a tooltip:** "Arrive within your slot" and the slot's end time are only in a `title` tooltip, which phones never show. Say it once above the grid.
- **No slash key for dates on iPhones:** the "Another day" field opens a numbers-only keypad on iPhones, which has no "/" key, yet the hint asks for DD/MM/YYYY. Digits alone (17102026) are accepted, so either change the hint or use `inputmode="text"` or three separate boxes.
- **Vehicle error isn't connected:** the error summary's "Choose the vehicle" link points at a container that can't take focus, and the vehicle error isn't linked to the buttons.
- **Waste hint not read out:** the hint about bag and mattress limits sits on a `div` with `aria-describedby`, so screen readers never read it.
- **Registration field:** add `autocapitalize="characters"`.
- **Mobile number:** it's required and only UK mobiles are accepted, so residents without a mobile can't book online. I think that's worth checking with the service owner (my inference, not stated anywhere).

## What's already good

- Real labels on every field, with hints and errors linked to them.
- A proper error summary that takes focus.
- Tap targets of at least 44px.
- Selected states use `aria-pressed`, and the selected slot is shown by its border and bold text, not colour alone.
- Focus rings elsewhere on the site are strong.
- The dark palette is otherwise well judged.
- Reduced-motion settings are respected.

## Suggested order

Items 1 to 6 should go to the agency as launch blockers; most of them are small changes. Items 7 to 10 are next, because they decide whether a resident with a loaded car gets through the gate. If you'd like this as a shareable page for the agency, I can publish it.
