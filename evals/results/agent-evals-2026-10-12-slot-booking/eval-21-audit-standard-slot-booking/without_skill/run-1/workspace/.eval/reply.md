I went through the whole booking flow (choose a slot → vehicle and waste → check and book → booked). I read the bundled pages, script and stylesheet, then tested each problem below in a real browser at phone widths (320, 360 and 375 px) in both light and dark mode. Everything listed here is something I reproduced, not just spotted in the code. I didn't change any files.

## Fix before launch

1. **Tapping "Book this slot" twice cancels the booking, but the page still says "Booked".** The booking takes about 1.5 seconds and the button gives no sign that anything is happening, so phone users will tap again. The second tap quietly changes the button to "Cancel booking". The booking is then saved as cancelled. The resident lands on a page headed **Booked**, with their reference and a small red line: "Status: cancelled. This booking is not on the gate's list." I reproduced this with one extra tap. People will drive to the gate with a reference that won't work.
   *Fix:* when the button is pressed, disable it and show "Booking…". Take out the cancel-on-second-tap behaviour completely. Never show a "Booked" heading for a cancelled booking.

2. **The chosen slot silently expires after 5 minutes, and residents are never told.** The 5-minute timer starts when the slot is tapped. It keeps running while the resident picks a vehicle and types four details on a phone. Nothing on any page mentions the hold. When it runs out, "Book this slot" shows "This slot is no longer available" with no link. The slot is cleared and the summary shows "—". The message also suggests someone else took the slot, when really the timer just ran out. This fails WCAG 2.2.1 (Timing Adjustable), and older or keyboard-only residents are the most likely to hit it.
   *Fix:* say on the slot step that the slot is held for 5 minutes. Warn before it runs out and let people extend it, or simply re-check the slot when they book. If it really is gone, link straight back to the slots for the same day.

3. **The permit field shows for everyone, and a van booking without a permit only fails at the very end.** The script is meant to show "Permit number" only for vans and trailers. A stylesheet rule overrides that, so the field always shows, even for a car, which suggests every resident needs a permit. A van with no permit passes the vehicle step. It is only rejected on the last step, after the resident has typed all their details. The error has no link, and the field it refers to is on the previous page.
   *Fix:* make the field properly hidden for cars (add `#permit-wrap[hidden]{display:none}`, as was already done for the date field). Check the permit on the vehicle step, show the error next to the field, and link to it from the error summary. Also remove the 1.2-second delay before the field appears.

4. **"Change slot" doesn't keep the chosen day, so it's easy to book the wrong day.** From the check step, "Change slot" goes back to the first page with **Today** selected, not the Saturday already chosen. If the resident just taps 14:20 and presses Next, the booking moves to **Monday 12 October 14:20**. I reproduced this. The mistake only shows in the summary, and it's easy to miss.
   *Fix:* open the slot page on the day already in the booking, with the current slot shown as selected.

5. **On many Android phones the slot grid is too wide for the screen.** Below 361 px the script sets fixed-width columns that don't allow for the page margins. At 360 px (a very common Android width) the page scrolls sideways by 14 px, and at 320 px by 15 px. The right-hand column of slots is cut off. This fails WCAG 1.4.10 (Reflow).
   *Fix:* remove the resize handler and let the CSS grid sort itself out. `repeat(auto-fill, minmax(96px,1fr))` already works.

6. **Keyboard users can't see which slot is focused.** The script adds a rule (`.slot:focus{outline:0}`) that removes the focus ring from every slot button. If you press Next without choosing, focus jumps to a slot you can't see. This fails WCAG 2.4.7 (Focus Visible).
   *Fix:* delete that rule. The site's own focus style is already good.

7. **Slots are listed out of time order.** Any slot marked "Few left" gets moved to the top, even above the "Morning" heading. So afternoon slots (13:40, 16:40) appear among the morning ones, and the times jump around. Screen reader and keyboard order still follows time order, so what people see and what they hear don't match (WCAG 1.3.2 and 2.4.3). Someone scanning for "Saturday morning" will misread this.
   *Fix:* keep slots in time order and let the "Few left" tag do the job.

## Fix soon

8. **"Few left" fails text contrast in both themes.** It measures 3.0:1 in light mode and 3.4:1 in dark mode, against the 4.5:1 required. In dark mode it reads as dim brown on brown. Darken the amber in light mode and lighten it in dark mode.
9. **Slots already in the past show as free for today.** The page opens on **Today**, and earlier slots such as 08:00 can be chosen. They're only rejected after all the details have been typed in. Residents booking the evening before will see a full day of "free" slots for a day that's nearly over. Hide or disable past slots and anything within the 30-minute cut-off. Consider opening on **Tomorrow** after the centre closes.
10. **No loading state for slots.** After choosing a day the grid stays empty for about a second with no message. Pressing Next during that time does nothing. Show "Loading slots…".
11. **The chosen slot is hard to spot in dark mode.** The selected background barely differs from the others (1.4:1 in dark mode, 1.2:1 in light mode). Only a slightly thicker border marks it. Use a clearer fill or a check mark.

## Smaller points

- Slot details (the 20-minute length, "arrive within your slot") are only in a `title` tooltip, which phones never show.
- The phone hint says "For a reminder", which sounds optional, but a UK mobile number is required. Say so, or let people without a mobile book.
- Opening done.html directly shows a made-up reference, "DR-000000".
- The first "N slots free" update isn't announced to screen readers. The live region is only switched on after the first message has already been written.

## Ask the agency before launch (my inference)

The script hard-codes "today" as **12 October 2026**, and the Today/Tomorrow/Saturday/Sunday buttons are fixed dates in the page. Bookings only open 14 days from that date, so as the bundle stands, **no day after 26 October can be booked**. That would block every booking from next month. This may just be demo data, but since you only have the built bundle, get the agency to confirm it uses the real date.

**What to fix first:** items 1–3, because each one sends a resident to the gate without a valid booking. Then 4–7, which are quick changes to the script and stylesheet. If it's useful, I can turn this into a shareable page for the agency.
