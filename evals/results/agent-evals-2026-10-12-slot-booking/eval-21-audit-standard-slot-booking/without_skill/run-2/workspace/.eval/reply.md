I went through the whole booking flow (choose a day and slot, then vehicle and waste, then check and book, then the reference page). I read the bundle's code and then ran it in a headless Chrome at phone width (375 px), in dark and light mode, and at 320 and 360 px. Every problem below happened in the browser unless I say otherwise. I haven't changed any files. The script and stylesheet are minified and you don't have the source, so most fixes need to go back to the agency.

## Fix before launch

**1. Tapping "Book this slot" twice cancels the booking, but the page still says "Booked".**
After the first tap, nothing on screen changes for 1.5 seconds. If you tap again in that time, the button turns into "Cancel booking" and the booking is saved as cancelled. The next page is headed **Booked** with a reference. Under it, a red line says "Status: cancelled. This booking is not on the gate's list." A resident who skims will turn up with a reference the gate won't accept. On a phone, an impatient second tap is very likely, and pressing Enter twice in a field does the same thing.
*Fix:* after the first tap, disable the button and show "Booking…". Never let it become a cancel button. If a booking can be cancelled at all, that should be a separate, clearly labelled action on the reference page.

**2. The "Few left" slots are moved to the top, out of time order and above the "Morning" heading.**
On Saturday 17, the first ten slots on screen are 08:20, 08:40, 09:00, 09:40, 10:20, 10:40, **13:40, 14:00, 15:00, 16:40**. Only after those come the "Morning" heading and 08:00. Someone scanning for "a morning slot" can easily pick 14:00 because it sits in the morning block. Screen readers and keyboards go through the slots in a different order from what's on screen (WCAG 1.3.2 and 2.4.3).
*Fix:* remove the `order:-1` from "Few left" slots, so every slot stays in time order under its heading.

**3. The reference page doesn't say the day or the time.**
After booking, residents see only the reference. The day, the slot time, the vehicle and the waste aren't shown, and those are what they need the next morning and what the gate checks. Because the centre has poor signal, the page people screenshot or print has to include everything.
*Fix:* repeat the booking summary on the reference page: "Saturday 17 October, 09:20 to 09:40, car, garden waste and wood". Also say "arrive within your slot".

**4. Problems only appear at the last step, after the resident has filled everything in.**
- **Same-day slots that have already gone are offered.** The page opens on "Today" by default and shows 08:00 as free. Picking it and filling in every detail ends with "The 08:00 slot today can no longer be booked." That breaks the promise that "a slot shown as free is free". *Fix:* don't offer same-day slots that start less than 30 minutes from now. Since most people book the evening before, consider opening on "Tomorrow" by default.
- **The 5-minute hold is never mentioned.** If filling in the details takes longer than 5 minutes, you get "This slot is no longer available." It has no link to choose another slot, and the slot in the summary changes to "—". That fails WCAG 2.2.1 (timing adjustable), and it will hit people booking while doing other things. *Fix:* say "We'll hold this slot for 5 minutes" when the slot is chosen, warn before the hold runs out and let the resident extend it, and link the error back to the slots.
- **A missing van or trailer permit is only caught at the end**, and that error has no link back either. *Fix:* check the permit on the vehicle page, next to the field.

**5. The "Permit number" field shows for every vehicle, including cars.**
The field should only appear for a van or a car with a trailer. A CSS rule (`.field{display:flex}`) overrides its `hidden` attribute, so car drivers see a permit field they don't need and may worry they need a permit. For vans, the code also waits 1.2 s before revealing the field and doesn't announce it. *Fix:* add `[hidden]{display:none !important}` to the stylesheet, which is a one-line patch your team could make. Then the agency should show the field straight away for vans and trailers and validate it there.

**6. Keyboard users can't see which slot they're on.**
The script adds `.slot:focus{outline:0}`, which removes the focus outline from every slot button (WCAG 2.4.7). *Fix:* delete that injected style. The stylesheet already has a good `:focus-visible` outline.

## Fix soon

7. **Changing the slot sends you back to "Today", not the day you chose.** From the check page, "Change slot" opens the slot page with "Monday 12 October" selected and today's slots shown, so the resident has to find Saturday again. *Fix:* open on the saved day with the current slot selected.
8. **The "Few left" label is too faint, especially in dark mode.** I calculated its contrast from the colours in the bundle: 3.0:1 in light mode and 3.4:1 in dark mode, where the requirement is 4.5:1 (it is 16 px bold, which doesn't count as large text). In dark mode it reads as dim brown on dark brown. Apart from that, dark mode is solid: body text, links, buttons and errors are all between 6.5:1 and 14:1.
9. **Slots run off the side of the screen on small phones and with large text.** At 360 px and below, the script sets fixed column widths that don't allow for the page padding, so the page scrolls sideways (14 px at 360, 15 px at 320). The same thing happens on a larger phone at 200% zoom, which matters here because many residents are older and use larger text (WCAG 1.4.10). *Fix:* remove the resize handler and use the CSS grid alone.
10. **Nothing happens visibly while slots load.** For about a second after choosing a day, the slot area is empty and silent, and taps on "Next" are ignored. *Fix:* show "Loading slots…" and announce it.
11. **"Arrive within your slot" only appears in a tooltip,** which doesn't work on phones. *Fix:* put it in visible text.
12. **The error links on the vehicle page don't work.** "Choose the vehicle you are bringing" and "Choose at least one kind of waste" link to containers that can't take focus, so tapping them doesn't move you anywhere. *Fix:* link to the first button or checkbox in each group. Smaller issues on the same page: the waste hint stops being read out after an error, and the vehicle choice would work better as radio buttons than as toggle buttons.
13. **Smaller items:** the registration field should capitalise automatically and turn off spellcheck. "Call on a weekday" is the only way to cancel, though the centre is open at weekends. The dark-mode colours are set by the script, so if it is slow or fails, the page shows default colours first.

## Ask the agency before launch (my inference from the code, not tested against a live system)

- **"Today" is fixed at 12 October 2026.** So are the quick-day buttons ("Today", "Tomorrow", "Saturday 17", "Sunday 18"). Opened today (16 October), the page still offers Monday 12 October as "Today". Next month every quick button would point to a past date.
- **There seems to be no booking system behind the site.** Slot availability is made up from the date, and the reference is calculated in the browser. Nothing appears to be sent to the council or to the gate's list. Check whether the agency delivered a demo build or the production one.

## In short: what to fix first

The double tap (1) and the missing day and time on the reference page (3) are the most urgent, because they send people with a loaded car to a gate that will turn them away. Next come the out-of-order slots (2), the slots offered and then rejected at the last step (4), the permit field (5) and the focus outline (6). Fixing (5) is one line of CSS and (6) is deleting one injected rule. Before any of that, confirm the two points in "Ask the agency before launch". If either is true, the bundle isn't ready to go live.
