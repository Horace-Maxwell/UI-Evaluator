I ran a standard-depth audit of the four-step booking flow and found real problems that should be fixed before launch. It reached no assurance level against your L3 target, because several WCAG 2.2 AA checks fail.

The good news is that most of the worst problems are one-line fixes in the agency's bundle. The rest are a few days of work.

**How I checked it:** automated checks at every width from 320 to 1440 px, in light and dark mode. Seven reviewers worked separately, each with only their own inputs: three usability reviewers, a step-by-step walkthrough of booking a Saturday slot on a phone, three design reviewers, an accessibility reviewer and a code reviewer reading the minified bundle. A separate checker then tried to reproduce every reported problem in the running site. 4 were rejected and 38 were confirmed. Three raters scored severity without seeing who found what, and they never disagreed by two points or more.

## Fix first (could lose people their slot or get them turned away at the gate)

1. **Tapping "Book this slot" twice cancels the booking.** While the booking is being saved (about 1.5 s) the button gives no sign anything is happening. A second tap turns it into "Cancel booking". The resident then lands on a page headed **"Booked"**, with only a small red line saying the booking isn't on the gate's list. Impatient taps on a slow phone are exactly how most residents will use this. *Fix:* ignore taps while saving, show a busy state, and head the cancelled page "Cancelled" without the gate instructions. *Effort:* small.
2. **The van and trailer permit field shows for everyone, cars included.** A CSS rule (`.field{display:flex}`) overrides `hidden`, so the field never hides. A van permit is also only checked at the final step, two pages after it was typed. *Fix:* one CSS rule, plus checking the permit on the vehicle step.
3. **The confirmation page doesn't show the day, time or vehicle,** only the reference. It is read at the gate, where there is poor signal. *Fix:* repeat the booking details, plus "arrive within your 20-minute slot".
4. **The slot hold is a hidden time limit.** Nothing says a chosen slot is held for 5 minutes. When I left the confirm page for about five and a half minutes, the hold had run out. The error then said only "This slot is no longer available." and the slot showed "—". *Fix:* say how long the hold lasts when a slot is chosen, and on expiry explain what happened and link back to the slots. Whether this fails WCAG 2.2.1 needs a person to decide.
5. **Today's past slots look free** and are only rejected at the last step, after all the details are typed in.

## Accessibility failures (WCAG 2.2 AA blockers)

- **"Few left" slots are taken out of time order** and shown above "Morning". They are moved visually but not in the page order, so screen-reader order and Tab order jump around (1.3.2, 2.4.3). *Fix:* delete one inline `order:-1`.
- **Slot buttons have no visible keyboard focus.** The script injects `.slot:focus{outline:0}` (2.4.7). *Fix:* delete it.
- **"Few left" tag contrast is 3.0:1 in light mode and 3.4:1 in dark mode** (it needs 4.5:1). This is the only text that fails contrast in dark mode.
- **At 320 px the slot grid is wider than the screen,** so the page scrolls sideways (1.4.10). Phones with large text can end up in this state.
- The "N slots free" message isn't announced to screen readers. The links in the vehicle-step error summary don't move focus to anything.

## Scope decision for you

There is **no way to change or cancel a booking online**, only a phone line on weekdays. The raters put this at the top severity because people book in the evenings. It is a missing feature rather than a bug, so it's a scope question for the agency.

## Keep

- The dark theme is complete, and everything except the "Few left" tag passes contrast at phone width.
- The copy is plain and states each rule where it applies.
- The Today, Tomorrow and weekend day buttons suit people booking the evening before.
- The error summaries are well built, and the details fields explain why each one is asked.

## Not covered

- Real phone screen readers (VoiceOver, TalkBack) and real large-text settings.
- An exact measure of the hold time.
- Typing with a Chinese, Japanese or Korean input method.
- Real residents. Nothing here is user-observed, and whether people double-tap Book, or understand "Few left", is worth a quick test.

Housekeeping: two design-reviewer output files stored one field as text where the report tool expected a list. I wrapped each in a list without changing the content so the report could build. Some duplicate findings also stayed separate in the register (for example the hold-time and permit-field ones). Read each group as one problem.

The full report is in `.ui-evaluator/runs/20261016-230412-audit-standard/` (`report.md`, `report.html`, `debrief.md`), with `agree-disagree.csv` for the council or agency to mark up. Each finding there has a file and column in the bundle. I can turn the report into a shareable page for the agency if that helps.

Questions that would change the order:
- Is online change or cancel in the agency's contract, or out of scope for launch?
- Can the agency edit the bundle, or should the fixes go to them as change requests?
- Should "Few left" stay at all, given each slot holds one vehicle?
