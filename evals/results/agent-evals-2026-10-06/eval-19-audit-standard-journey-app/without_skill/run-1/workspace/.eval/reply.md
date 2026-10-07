# Booking flow review: Saltmarsh Quay visitor berths

I reviewed the whole booking flow, from "Book a visitor berth" through to "Booking confirmed". I read all five pages and `app.js` line by line, and checked them against `PRODUCT.md` and the two journeys in `journeys/`. Running a browser wasn't permitted in this run, so I didn't click through the pages. Everything below comes from reading the code, and the line references point to it. Before launch, someone should still walk the flow on a phone at 375 px, at 200% zoom and with VoiceOver. Your own rules ask for evidence from real skippers on the booking task, and this review doesn't replace that.

I've ranked the problems by what they would do to a skipper arriving on the tide, worst first.

---

## Fix before you open

### 1. Nothing reaches the harbour office *(check this first)*
`review.html` → `app.js:211-228`. "Confirm booking" checks the name and mobile number, then goes to `confirmed.html?date=…&nights=…&berth=…`. It doesn't send anything anywhere. The name and number are thrown away, and the arrival time, boat name, length, draught and MMSI aren't passed on either. The reference (`SQ-1017-C3`, `app.js:237`) is built only from the date and berth. Two boats booking the same berth for the same date would get the same reference, and the flow never checks whether a berth is actually free.
**Effect:** a skipper sees "Booking confirmed" and sails in. The office has no record and nobody to call. *(Assumption: there's a backend that isn't in this folder. If not, this is the first thing to fix.)*
**Fix:** send the booking to the office before showing the confirmation, issue a unique reference, and show an error with the office phone number if the send fails.

### 2. You choose a berth before you're asked the boat's length, and "length" is ambiguous
`berths.html:67-85`, `boat.html:49-51`, `app.js:186-193`.
- The berth list says "Boats up to 10 metres" without saying whether that means length overall or hull length. The Length field on the next page has no unit and no hint either.
- In our scenario (10.4 m LOA including the bowsprit, 9.6 m hull), a skipper can reasonably pick Pontoon B, berth 14 (up to 10 m). Then one of two things happens:
  - **They enter 10.4:** the form disappears and they get "Booking stopped. This booking cannot continue. Reference BK-409." (`boat.html:70-73`). It doesn't explain why, offer a next step or a way back, or mention the phone number. It also breaks your rule that every stop says what to do next.
  - **They enter 9.6:** the booking goes through for a berth the boat is too long for. That's a safety and berthing problem on arrival.
- If the `berth` parameter is missing, the length check quietly falls back to B14 (`app.js:186`).

**Fix:** ask for "Length overall (LOA), including bowsprit and davits, in metres" on the berths page or before it. Then show only the berths that fit, or mark the others "too short for your boat". Label each limit as "length overall". If a boat still doesn't fit, say so plainly, offer the berths that do, and give the office number.

### 3. The tide window isn't shown where the arrival time is chosen, and the tide table is in UTC
`index.html:59-69, 75-94`.
- The arrival time list runs from 06:00 to 21:00 and accepts any of them, even when the gate is shut. The gate window isn't next to the time field. It's in a table further down the page (below the fold on a phone) and in a note under that. Your rules say to show the tide window wherever a time is chosen and never to hide a safety fact.
- The table says "times in UTC". The arrival times have no label, and your formats say local time. On 17 October 2026 the UK is on BST, so high water at 14:32 UTC is **15:32 local**. A skipper who reads the table as local time is an hour out on the gate. For example, on Sun 18 Oct the gate is open from about 14:20 to 18:20 BST, not 13:20 to 17:20.
- The table covers only 17 to 23 October, but the date picker accepts dates up to 31 March 2027.

**Fix:** once a date is picked, show that day's gate window in local time next to the time field ("Sill gate open about 13:30 to 17:30 BST"). Mark times outside the window, or warn about them. Publish tide times in local time with the zone named. Repeat the gate window for the chosen arrival on the berths, review and confirmation pages.

### 4. Typed details get wiped
`app.js:164-167`. The boat form is reset on every `pageshow`, including when the skipper presses Back. A skipper who goes back from the review page, or from the "Booking stopped" page, to fix one field has to retype everything. On a phone in a cockpit with one hand free, that's when people give up. This breaks your rule never to lose what a skipper has typed. `autocomplete="off"` (`boat.html:42`) also stops returning skippers from autofilling.
**Fix:** remove the reset, and fill the fields from the query string, as the first page already does (`app.js:107-109`).

### 5. You can only change the dates from inside the "⋯ More options" menu
`berths.html:46-58`. The only way back to the dates is a hidden "Change dates" link in a three-dot menu. That's the "change arrival date" journey, and it's a common case when the weather changes. The review page has no change links at all.
**Fix:** put a visible "Change" link next to "Arriving on … at …" on the berths page. On the review page, put a "Change" link beside each row (arrival, nights, berth, boat). Move "Harbour rules" out of the menu and drop the menu.

## Fix soon after

6. **MMSI is required but shouldn't be.** `app.js:181`. Many visiting boats have no DSC radio, so a required MMSI shuts them out. It isn't on your "collect only what we need" list. There's also no hint about what it is and no check that it's 9 digits. Make it optional with a hint, or remove it.
7. **Draught is collected but never used.** The skipper isn't told the depth over the sill, and nothing warns a deep boat. Either show the sill depth at high water, or don't ask for draught.
8. **The confirmation page leaves out what the skipper needs on arrival.** `confirmed.html`. It doesn't show the arrival time, the gate window, the boat, the total, the "pay at the harbour office when you arrive" reminder, or what to do on arrival (for example, whether to call the office on VHF). Add them all.
9. **The flow uses several different words for the same thing.** "Berth", "pontoon space" and "mooring" all appear. The legend says "Pontoon spaces free" and the error says "Choose a pontoon space", but the wall berth isn't on a pontoon. The review page is titled "Check your mooring booking". Use "berth" throughout, which is the skippers' own word.
10. **Skippers have to work out the price themselves.** Each berth shows only a price "per metre per night", and the total first appears on the review page. Once you know the length (see fix 2), show the total for the stay on each berth.
11. **Some arrival times fall outside office hours.** Times go up to 21:00, but the office is open 08:00 to 20:00, and you pay on arrival. Say what happens if a boat arrives after the office has closed.
12. **Small accessibility gaps.** A select with an error gets no red border, because only `input[aria-invalid]` is styled (`styles.css:283`), so the Arrival time error is easy to miss. Opening the More options menu doesn't move focus into it. If you remove the menu (fix 5), that goes away.

## What already works well
The error summaries with in-page links, the errors placed above the fields, the 44 px touch targets, good text contrast, consistent long-form dates, the clear "you pay on arrival, nothing is charged online" line on review, and keeping contact details out of the URL.

## Where to start
1. Confirm that bookings actually reach the office (fix 1). Nothing else matters until they do.
2. Ask for length overall first and show only the berths that fit (fix 2). That also gets rid of the "Booking stopped" dead end.
3. Show the gate window in local time next to the arrival time (fix 3).
4. Stop wiping the boat form, and add visible change links (fixes 4 and 5).

Those four are small changes to static pages, apart from the backend question in fix 1. They cover the problems that could put a boat at the wrong berth, or at a shut gate, with no booking on record. I haven't changed any files. If you'd like, I can make fixes 2 to 5 in `app.js` and the pages next.
