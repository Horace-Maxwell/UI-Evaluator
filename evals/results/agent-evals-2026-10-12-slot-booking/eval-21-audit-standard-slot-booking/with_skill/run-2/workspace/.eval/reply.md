I reviewed the whole booking flow at phone and desktop widths, in light and dark mode: choosing a slot, vehicle and waste, check and book, the confirmation, the expired-hold state and the cancelled state. The flow is not ready for launch yet. You can still complete a booking, and dark mode mostly works well, but a few problems could send a resident to the gate with a booking that doesn't stand, and several block keyboard and screen-reader users.

**How I checked:** automated checks first, then 11 independent reviewers who each looked at the live site separately: 3 usability reviewers, 2 step-by-step walkthroughs of booking and changing a slot, 3 visual-design reviewers, an accessibility reviewer and a code reviewer working from the agency's minified files. Every problem was then re-tested on the live site, and three raters scored how serious each one is without knowing who found it. Both booking journeys ran end to end.

**Result:** the site doesn't reach the first quality level (automated accessibility and function checks); your target is level 3. The blockers are the accessibility and layout failures below. All findings are predictions or measurements; no residents have tested it yet.

## What to fix first

1. **Tapping "Book this slot" twice cancels the booking, and the next page still says "Booked."** The button gives no sign it's working for about 1.5 seconds, which invites a second tap. That second tap turns the booking into a cancellation. The confirmation page still has "Booked" as its headline, with only a small status line saying it's cancelled. The resident may then arrive with a reference the gate doesn't have. We reproduced this on the live site. Fixes:
   - Ignore taps while the booking is being sent, and show progress.
   - Never show a "Booked" headline on a cancelled booking.
2. **The mobile number is required, but it's labelled "for a reminder the evening before."** That reads as optional. Leaving it blank, or entering a landline, blocks the booking. Many residents are older, and someone with only a landline can't book at all. Either make it optional, or say why it's needed and accept landlines.
3. **The "Few left" slots are pulled out of time order** into an unlabelled block above "Morning". On a phone, free morning slots sit below a mix of morning and afternoon times and may look missing. Keyboard and screen-reader users also move through them in a different order from what's on screen. Every reviewer flagged this. The cause is one style rule in the script; put the slots back in time order with the tag inline.
4. **Keyboard users can't see which slot has focus.** The script adds a rule that removes the focus outline from slot buttons, in normal mode and in high-contrast mode. Remove that rule.
5. **The confirmation page shows the reference but not the day, time or vehicle.** This is the page residents will show at the gate, often with no signal. Put the booked day, time, vehicle and waste next to the reference.
6. **The 5-minute hold on a slot is never mentioned, and when it runs out the message only says "This slot is no longer available."** A resident booking in the evening while doing something else can easily lose the slot. Fixes:
   - Say the slot is held, and until when, on every step.
   - When the hold runs out, link straight to choosing another slot.
7. **Dark mode and small screens:**
   - The "Few left" tag fails text contrast: 3.0:1 in light mode and 3.4:1 in dark mode, where 4.5:1 is needed. It's the only text that fails in dark mode.
   - At 320–360 px wide the slot grid is wider than the screen, so the page scrolls sideways. Residents using larger text hit this too.

## Next tier, also confirmed

- **Permit:** the permit field shows for cars and before any vehicle is chosen, because a style rule overrides the field's hidden state. A missing or malformed van permit, or a Wednesday (closed day), is only caught at the last step, in an error that doesn't link to the field.
- **Changing a slot:** "Change slot" and "Back to the slots" reopen on Today, not the day you chose, so a change can quietly move the booking to today. The page also looks like a brand-new booking.
- **Past slots:** today's slots that have already started can be chosen, and are only refused at the final step.
- **Changing or cancelling:** there's no way to do either online, only a phone line on weekdays. Residents book the evening before, when that line is closed.
- **Loading:** the slot list goes blank for about a second when you change day, with no loading message.
- **Screen readers:** the "22 slots free…" message isn't announced when the page first loads.

## Worth keeping

- **Dark mode** is well built at phone width: backgrounds, cards and buttons invert cleanly, and body text holds its contrast.
- **The reference** is large and has its own card.
- **The rules** (opening days, slot length, two bookings a week, permits) are stated right where they apply.
- **Error messages** on the vehicle and check-and-book steps take focus and link to the field.
- **"Few left" and "Full"** are written out in words, not shown by colour alone.

## Not covered yet

- **Real screen readers:** none were used, neither VoiceOver on iOS nor TalkBack on Android.
- **Real zoom and Windows high-contrast themes:** none were tested.
- **Residents:** no one from the public has tried the flow.
- **AI-look checks on the code:** the static code checks couldn't read the minified bundle, so those checks didn't run.

Two things for someone to confirm, because I couldn't ask:

- **The site's "Today"** showed as Monday 12 October during testing, not the real date. Check that the live build uses the real date.
- **Landline-only households:** the gate attendants could say whether these are common. That would settle how urgent fix 2 is.

The source locations I give are positions in the minified `app.js` and `styles.css`, so the agency should make the fixes in their own source and send a new bundle. I can also apply them directly to the bundle one at a time, re-testing each, if that's more useful.

Files are in `.ui-evaluator/runs/20261016-125619-audit-standard/`:
- `report.md` / `report.html`: the full report, with the evidence behind each finding.
- `debrief.md`: the summary of findings.
- `agree-disagree.csv`: a sheet you can pass to council colleagues or the agency to mark which findings they agree with.
