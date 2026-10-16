I reviewed the booking flow: index → vehicle → confirm → done. I didn't have a browser in this session, so I read every page, the stylesheet and the minified `app.js`, followed what the script does at each step, and calculated the colour contrast for both themes. Everything below comes from the code, not from tapping through on a real phone. Please have someone do a quick check on an actual phone before launch, especially items 1 and 4.

The site is generally well built. The labels, error summaries and 44 px touch targets are all good, and **dark mode passes contrast everywhere except one tag** (item 9). The serious problems are in how the flow behaves: several of them let a resident think they're booked when they aren't, or that they're booked for a different day than they are. Those are the ones that will put people with a loaded car in front of a closed gate.

## Fix before launch

**1. Tapping "Book this slot" twice cancels the booking, but the page still says "Booked".**
After the first tap the button waits 1.5 s and shows nothing visible (it only sets `aria-busy`). A second tap during that wait changes the button text to "Cancel booking", and the booking is saved with status "cancelled". The done page still has the heading **"Booked"** and shows a reference, with a small red line saying it isn't on the gate's list. On a phone with a slow connection, people double-tap a lot.
*Fix:* disable the button and show "Booking…" while the request is running, ignore repeat taps, and take cancelling out of this button completely. If the status isn't "booked", the done page must not say "Booked".

**2. The 5-minute hold is never mentioned, and it runs out without warning.**
The clock starts when a slot is tapped. If the resident takes more than 5 minutes over the vehicle and details steps (likely for older residents, or anyone "doing something else"), they only find out after tapping Book. They get "This slot is no longer available", with no link and the slot blanked out, even though the slot may still be free. This also fails WCAG 2.2.1 (Timing adjustable).
*Fix:* say "We'll hold this slot for 5 minutes" when a slot is picked, show the time left on later steps, warn before it runs out and let them extend it. If it does run out, check again whether the slot is still free before refusing.

**3. "Today" opens by default and lists slots that have already passed.**
The page always opens on Today. It shows every slot from 08:00 onwards, but same-day slots less than about 30 minutes ahead get rejected, and only at the very last step after all the details have been typed. Someone booking the evening before lands on a day where almost nothing can actually be booked.
*Fix:* hide or disable slots that can't be booked, and open on Tomorrow, or on the first day with free slots, after midday.
**Check with the agency too:** the bundle has today fixed as `2026-10-12`, and the quick-day buttons have fixed dates ("Today" = 12 Oct, "Saturday 17"). This may just be demo data. If it ships like this, "Today" and the 14-day booking window will be wrong from day one. (I'm assuming this is fixture data, but it needs confirming.)

**4. "Change slot" and "Back to the slots" silently move the booking to today.**
The slots page never reloads the day the resident already chose. It always resets to Today with nothing selected. Someone who wants to move their Saturday 09:20 slot to 14:20 can tap 14:20 straight away, and that's 14:20 *today*. Next then goes straight to the confirm page (vehicle and waste are already saved), and the only sign of the change is the Day line in the summary.
*Fix:* open the slots page on the saved day with the saved slot selected, and show the day clearly next to the slot grid.

**5. Van and trailer permits: the field appears late and errors come too late.**
After choosing Van or Car with trailer, the permit field only appears 1.2 s later, without any announcement, so people often tap Next before it shows. The permit isn't checked on that page. It's only checked after tapping Book on the confirm page, where there's no permit field, and the error doesn't link back to it.
*Fix:* show the field immediately, check it on the vehicle step, and make the error link to the field.

## Accessibility problems to fix next

6. **No focus outline on slot buttons.** The script inserts `.slot:focus{outline:0}`, and that overrides the site's own focus ring, so keyboard users can't see which slot they're on (WCAG 2.4.7). Delete that injected rule.
7. **"Few left" slots jump out of time order.** Each one gets `order:-1`, so they all move to the top of the grid, above the "Morning" heading, mixing morning and afternoon. Screen-reader and keyboard order still follow the clock, so what you see and what you tab through don't match (WCAG 1.3.2 / 2.4.3), and anyone looking for "09:20" has a harder time. Keep slots in time order; the tag is enough.
8. **The page scrolls sideways on 360 px phones.** That's a very common Android width, and 320 px also counts for WCAG 1.4.10 Reflow. At 360 px and below, the script gives the slot grid fixed pixel columns that ignore the page padding, so the grid comes out about 30 px wider than the screen. Remove the resize handler; the CSS grid already handles narrow screens.
9. **The "Few left" tag has low contrast**: 3.0:1 in light and 3.4:1 in dark, for 16 px text. It needs 4.5:1. All the other text and control colours I checked pass in both themes, with body text around 14:1 in each.

## Smaller issues

- Changing the day empties the slot grid for 0.9 s with no "Loading slots…" message, and the status line only becomes a live region after the first load. Screen-reader users hear nothing the first time.
- In the vehicle-page error summary, the links go to `#vehicle` and `#waste`, which are divs that can't take focus. Point them at the first button or checkbox instead.
- On the confirm page, the late errors (past slot, permit, centre closed) have no links to where they can be fixed.
- The reference only exists on the done screen and in that browser tab's storage, and the centre has poor signal. You already collect a mobile number, so **text the reference straight away**, not only the reminder the evening before. Also, for someone booking at 9 pm for tomorrow morning, the "reminder the evening before" promise doesn't really apply.
- The slot end time and "Arrive within your slot" are only in a `title` tooltip, which never shows on phones. Put "08:00–08:20" on the button itself.
- The step list is an `<ol>` and also has typed "1." "2." "3.", so screen readers read the numbers twice.
- The waste hint is attached to a plain div, so screen readers don't announce it. The registration field should use `autocapitalize="characters"`.
- The theme colours are only set by the script once the page has loaded. If the script fails, the page has no theme at all. Ask the agency to put the colour values in the CSS (with `prefers-color-scheme`).

## Suggested order

Items 1–5 first. They decide whether the right person turns up at the gate on the right day with the right vehicle, and they matter more than anything else here. Then 6–9, which are each small CSS or JS changes. The council doesn't have the source code (only the minified bundle), so all of these have to go back to the agency. I haven't changed any files.
