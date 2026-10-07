I went through the whole booking flow (dates → berth → boat → review → confirmed) in two ways. I read every page and `app.js`, and I walked both journeys in `journeys/` in a real browser at phone width (375 px). The happy path works. A skipper with a 10.4 m yacht who picks Pontoon C, berth 3 gets "Booking confirmed" and the reference SQ-1017-C3. But there are four problems I'd fix before opening, because each one can leave a skipper outside the harbour or with no booking.

## Fix first: before launch

**1. Tide times are in UTC, and the time you pick has no tide window next to it.** This is safety-relevant.
- The tide table says "times in UTC". The arrival-time dropdown doesn't say which time zone it uses. On 17 October the UK is still on BST, so every high-water time in the table is an hour off local time.
- Example: a skipper reads HW 14:32, thinks the gate opens around 12:32 and picks 13:00. In local time high water is 15:32, so the gate opens around 13:32 and they arrive to a closed sill.
- Nothing stops an impossible time either. I picked 06:00 on 17 October and the booking went through, though the gate is closed then.
- The gate window doesn't appear on the berth list, the review page or the confirmation. That breaks two of your own rules in PRODUCT.md: "Show the tide window wherever a time is chosen" and "never hide the sill-gate window".
- **Fix:**
  - Show tide times in local time and label them that way.
  - Next to "Arrival time", show the gate window for the date chosen, for example "Gate open about 13:30–17:30".
  - Warn, or refuse to go on, when the chosen time falls outside the window.
  - Repeat the window on the review and confirmation pages.
  - The table only covers 17–23 October, but the date picker runs to March 2027.

**2. "Booking stopped" is a dead end.**
- If the boat is longer than the berth (for example 10.4 m on Pontoon B, berth 14, which takes up to 10 m), the boat page is replaced with: "This booking cannot continue. Reference BK-409."
- It doesn't say why, what to do next or which berth would fit. There are no links. The office number is only in the footer.
- **Fix:**
  - Say plainly: "Your boat is 10.4 m. Pontoon B, berth 14 takes boats up to 10 m."
  - Offer the berths that do fit, with a link back to the berth list that keeps the dates and boat details.
  - Better still, avoid the problem: ask for the boat's length before the berth list (or on it) and only show berths it fits. Today the skipper picks a berth blind and only finds out on the next page.

**3. "Length" is ambiguous, so a boat can book a berth it doesn't fit.**
- The field is labelled just "Length", and the berth cards say "Boats up to 10 metres". Many skippers know two lengths: overall (10.4 m including the bowsprit) and hull (9.6 m).
- If they type 9.6, Pontoon B, berth 14 passes the check, and the boat turns up too long for the berth.
- **Fix:**
  - Label the field "Length overall (LOA), in metres", with a hint: "Include bowsprit, davits and anything that sticks out".
  - Say "LOA" on the berth cards too: "Boats up to 10 m LOA".

**4. The boat form is cleared whenever you go Back.**
- `app.js` resets the form on every `pageshow`. I confirmed it: after going from review back to the boat page, all four fields were empty.
- Anyone who goes back to fix something has to retype everything on a phone in the cockpit. The same happens after the dead end in point 2.
- This breaks the rule "Never lose what a skipper has typed".
- **Fix:** remove the `pageshow` reset, and fill the fields from the query string, as the dates page already does.

**Please also check this, though it may be outside this prototype:** "Confirm booking" only moves to `confirmed.html`. In the code, nothing is sent anywhere, and the skipper's name and mobile number are thrown away. If that's true of the build that goes live, the office gets no bookings while skippers believe they have one. The reference number (date plus berth code) is also the same for any two bookings of the same berth on the same day. I couldn't tell from the folder whether a real backend exists, so I've assumed this is a front-end prototype. Please confirm.

## Fix next

5. **"Change dates" is hidden behind an unlabelled "⋯" button** on the berth list. In the "change arrival date" journey, a skipper whose plans change has nothing visible to tap. Put a "Change" link right next to "Arriving on Saturday 17 October 2026 at 15:00…".
6. **The review page has no way to change anything.** Add "Change" links on each row (arrival, nights, berth, boat). It also leaves out the draught.
7. **The confirmation page leaves out key details.** It drops the arrival time, the gate window, the boat name and the total, and it doesn't say "You pay at the harbour office when you arrive". These are what a skipper wants to screenshot. Add them, and say what happens next (for example: call or radio the office on approach).
8. **MMSI is required.** Many small boats don't have one. Your constraints say to collect only what the office needs to reach the skipper. Make it optional, or drop it, and add a one-line hint saying what it is.
9. **The words change from step to step:** "visitor berth", then "pontoon space", "Pontoon spaces free on these dates" (which includes the wall berth), then "mooring booking". Use "berth" throughout, as in the skippers' own words in PRODUCT.md.
10. **Error messages don't help with the format.** "Enter the length" and "Enter the MMSI" should say what to enter, for example "Enter the length overall in metres, for example 10.4" and "The MMSI is 9 digits".
11. **The draught is collected but never checked.** Wall berth 2 dries out on soft mud, and the sill has a depth limit. Either check the draught against the sill and berth depth at the chosen time, or say why you ask for it.

## Already done well

- Clear error summaries that link to each field and are announced to screen readers.
- 44 px tap targets, and no sideways scrolling at 320 px.
- Readable contrast.
- "Nothing is charged online" is said up front on the review page.
- Dates are written in full ("Saturday 17 October 2026").

**What I assumed:** that the arrival-time dropdown means local time, as PRODUCT.md says. I didn't test with real screen readers (VoiceOver or TalkBack) or at 200% browser zoom. PRODUCT.md sets an L4 target, so it's worth running the main booking with a few real skippers once points 1–4 are fixed. I haven't changed any files. If you want, I can make fixes 2, 3 and 4 in `boat.html`, `berths.html` and `app.js`.
