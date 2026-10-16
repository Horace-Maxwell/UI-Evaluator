I reviewed the booking flow on a phone-sized screen (320 and 375 px) and at desktop widths, in both light and dark mode. Nine reviewers worked independently, each finding was re-checked against the live site, and three more reviewers rated how severe each one is without knowing who raised it.

**The site isn't ready for launch yet.** It doesn't pass the automated accessibility and functional checks (WCAG 2.2 AA failures, plus the page scrolling sideways on small phones). There are 47 confirmed problems in total. Many of them come from the same few causes, and most are small fixes. The flow itself works: both test journeys ("book a Saturday morning slot for a car" and "move to the afternoon") complete when every step is done correctly.

## Fix first

1. **A second tap on "Book this slot" cancels the booking.** While the button waits for about 1.5 s, it changes to "Cancel booking" and shows no sign that anything is happening. If someone taps twice on a phone, the booking is saved as cancelled. All three raters gave this the top severity (4/4). Fix: disable the button and show "Booking…" on the first tap, and never let a second tap cancel.
2. **A cancelled booking still says "Booked"** and still says "Show this at the gate" (`done.html:28–30`). Together with item 1, a resident can arrive at the gate with a booking that isn't on the list.
3. **"Few left" slots are taken out of time order.** They sit in an unlabelled block above "Morning", which on a phone at 375 px is ten slots. The keyboard and screen-reader order still follows the clock, so focus jumps backwards. The "Few left" tag is also too faint to read reliably: 3.0:1 contrast in light mode and 3.4:1 in dark mode, against a minimum of 4.5:1. This is the only contrast failure in dark mode. Fix: keep each slot in its time position with the tag inside it, and darken the tag colours.
4. **The slot buttons have no keyboard focus ring.** A style added by the script, `.slot:focus{outline:0}`, removes it. Taking that rule out brings back the site's normal focus ring.
5. **On a 320 px screen the slot grid is wider than the page**, so the page scrolls sideways. This affects small phones and residents using larger text.
6. **"Change slot" goes back to Today instead of the day already chosen.** A resident who only changes the time can end up booked on the wrong day; one re-check did exactly that.
7. **Slots that have already passed today are shown as free.** They are only rejected after the resident has filled in every step. This matters for people booking in the morning of their visit.
8. **The 5-minute hold on a chosen slot is never mentioned.** When it runs out, the message just says "This slot is no longer available" and gives no next step. The fix is to state the hold time once a slot is chosen and link straight to choosing a new slot.
9. **The final page shows the reference but not the day, time or vehicle.** That is what residents will look at on their phone at the gate.

Next tier, all smaller fixes:
- the permit field shows for cars too: a stylesheet rule overrides `hidden`;
- the permit number is only checked on the last page;
- the selected day button is hard to tell apart from the others;
- the error links don't move focus to the field;
- the "22 slots free" message isn't announced to screen-reader users.

**Your decision:** there is no way to change or cancel a booking online, only by phoning on weekdays. The raters scored this 4/4. It needs work on the booking system itself, not just the pages, so it's your call whether that goes in before launch.

## Keep these

- The error messages are clear and say what a valid answer looks like.
- Each personal detail says why it's needed.
- The check page lists the 20-minute arrival window, with a "Change" link for each item.
- "Full" and "Few left" are written in words, not shown by colour alone.
- The day buttons use everyday labels ("Tomorrow", "Saturday 17").
- Dark mode otherwise renders cleanly on phones.

## Caveats

- **Not tested with real residents or real screen readers.** VoiceOver and TalkBack runs are still needed. I assumed today's launch matches the files in this folder.
- **One probable false alarm.** One finding says the step list doesn't tell screen readers which step you're on. The markup does mark it (`aria-current="step"`), so treat that one as probably wrong.
- **Fixes have to be made in the bundle.** The JS and CSS are minified and there is no source, so either patch those files or send this list to the agency. The automated style checks couldn't read the minified files either.
- **Design.** The three design reviewers found the look plain and generic. That's lower priority than everything above.

The full report, with evidence for each finding, is in `.ui-evaluator/runs/20261016-125559-audit-standard/` (`report.md`, `report.html`, and `agree-disagree.csv` for the agency to mark up). I can also publish it as a shareable page. If you want me to go ahead with fixes, I'd start with items 1–4, since each is a change of a line or two.
