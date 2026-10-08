# Debrief: audit-standard, iteration 1

Depth: standard. Passes: 3 heuristic evaluators (novice, expert, accessibility-minded), 1 cognitive walkthrough (reserve-tool-for-saturday at 375 px), 3 design critics, 1 accessibility auditor, 1 code reviewer (review and locate), 2 verifier passes, 3 blind severity raters. All roles ran as isolated subagents. Any-two agreement between heuristic passes was 29%, inside the 5–65% range reported for human evaluators. The undiscovered-problem figure (about 36 problems in total, 32 found) is an estimate, and an optimistic one with three passes.

The register contains several findings that describe one problem from different passes; they were not all merged at merge time. They are grouped below so that the fix queue treats each group as one problem.

## 1. What the passes agree on

- **"Reserve this tool" does not reserve.** It adds the tool to a basket. The only feedback is a toast that disappears within about 4 s, and the way on (header "Basket (1)") is out of view on a phone (F-0055, from the walkthrough and all three heuristic passes; mean severity 3.67, P0). The walkthrough verdict for a first-time member on a phone was "would not complete" at this step. That is a hypothesis (E0), not a measured success rate.
- **Dates that cannot work are accepted.** The calendar accepts days when the library is closed (F-0065/F-0140). A tool can be reserved and confirmed for a session before its "Available from" date (F-0066/F-0142, severity 4, P0; reproduced end to end with the pressure washer). The closed-day error appears only after Confirm reservation, with no route back to the day (F-0141).
- **The basket hold is invisible.** The ten-minute hold has no duration shown, no warning and no extension (F-0042, WCAG 2.2.1, P0; F-0080). Once it expires, every retry gives "Something went wrong. Try again." (F-0043, severity 4, P0; reproduced with a 10-minute probe).
- **Pick-up day and pick-up session are two separate choices that can disagree.** The basket asks again for a session and does not preselect the day already chosen (F-0029/F-0061). Changing the session leaves two different dates on the confirm page (F-0038/F-0068). Change on the confirm page clears the details already typed (F-0069).
- **Sessions are listed latest first.** Visual order is the reverse of keyboard and screen-reader order, which also fails WCAG 1.3.2 (F-0028, F-0062, F-0077, F-0092, F-0143; one cause, `row-reverse`).
- **On phones, tool names are truncated so that the two 18 V drills look identical** (F-0047, F-0122, F-0145, F-0014, F-0010). **Search sits below all ten cards** (F-0056, F-0072, F-0119, F-0146), so results change out of view (F-0057).
- **Dark mode: the "Available from" badge is 3.07:1** (#2f7d4a on #1d2622, 16 px bold; needs 4.5:1). Its tint also matches the card surface, so the badge loses its shape (F-0001, F-0002, F-0033, F-0121). This was measured by axe and the contrast check and confirmed by two critics and the code reviewer. Members use dark mode most, so this affects them most.
- **The fixed "Reserve this tool" bar covers content.** It covers focused calendar days, the "One week" control and the open loan-length list (F-0025, F-0048, F-0095, F-0104, F-0109). At 1280 px it overlaps the calendar's "17" (F-0011).

## 2. Detector-only findings

- Keyboard: once the loan-length list is open, Tab and Shift+Tab cycle inside it, so the rest of the tool page cannot be reached by keyboard (F-0026, F-0035; rule severity 4). The auditor traced the detector's 56 unreachable stops to this one trap.
- Focus order on the find page at widths above 480 px: Tab goes from the last card back up to Search (F-0024, F-0045).
- Reflow: the find page is 346 px wide at a 320 px viewport, because of a 330 px minimum grid column (F-0012, F-0013, F-0046, F-0117, F-0139; WCAG 1.4.10).
- At 200% text size and under the text-spacing override, card titles clip and "Reserve this tool" overlaps neighbouring text (F-0009, F-0010, F-0015, F-0016; WCAG 1.4.4 and 1.4.12). Older members often use larger text, so they meet this first.
- Low-impact items: text weak by APCA but passing WCAG (F-0003…F-0007), single words on the last line, cramped padding, body text close to the viewport edge, and adjacent touch targets less than 8 px apart.

## 3. Judge-only findings

- The date filter's helper text says the opposite of what the filter does (F-0085).
- The filter control is an unlabelled icon (F-0073).
- On phones, session days are marked only by a small dot (F-0087).
- Pressing Confirm twice while waiting allocates a second reservation number (F-0040). There is no busy state on Continue or Confirm (F-0039, F-0093).
- The three-tool limit is stated but not enforced (F-0050).
- Membership numbers typed in lower case or without the hyphen are reported as missing (F-0051, F-0098).
- The header still shows "Basket (1)" after confirming (F-0064, F-0116).
- Remove has no undo (F-0096). Loan length and day cannot be changed once a tool is in the basket (F-0097).
- Design: every card shows the same wrench placeholder (F-0111). The only identity is the library's name (F-0112, F-0128). There are empty bands at wide widths (F-0115). The done page has no focal confirmation (F-0127). The date input is unthemed (F-0123).

## 4. Detector false positives

- None was rejected outright. The verifier narrowed two: F-0109, where the bar sits mid-calendar only in stitched full-page captures, and F-0123, where the "yyyy/mm/dd" format comes from the headless browser's locale. Both were kept for the parts that do reproduce.

## 5. Strengths to preserve

- Confirm-page validation: an error summary that takes focus and links to each field, inline messages, `aria-invalid`, entered values kept, and the format shown with an example.
- The done page says what to bring, where to go and what to do if the session no longer suits.
- Nothing is paid online, and the page says so plainly.
- Search and filter result counts and "Added to your basket" are announced through a status region.
- Day buttons have full accessible names and a pressed state, and Remove buttons include the tool name.
- Dark theme is applied on every route, and dates follow en-GB formats throughout.

## 6. Divergent findings, as questions for user research

- The raters did not diverge on any finding (spread < 2 throughout).
- One evaluator recorded "loan-length listbox works fully by keyboard" as a strength. The keyboard check and the auditor both reproduced a Tab trap once the list is open. The trap is confirmed; what remains open is whether keyboard members open the list and then try to Tab away, which a keyboard-only session would show.
- Is "basket then choose session" a model members already have from shops, or do they expect "Reserve" to finish? Observe five first-time members on phones doing the Saturday drill task.
- Do members need a session choice separate from the pick-up day at all?

## 7. Fix ideas (after evaluation)

1. Make the day the session. Offer only open session days on or after the tool's "Available from" date, and carry that choice into the basket preselected. Drop or lock the second session question. This one decision addresses F-0029, F-0038, F-0061, F-0065, F-0066, F-0068, F-0140, F-0141 and F-0142.
2. Rename the primary action to "Add to basket". After adding, replace the toast with a persistent "1 tool held for 10 minutes · Go to basket" bar.
3. Show the hold duration and a countdown, warn before expiry, offer "Keep holding", and replace the generic error with a specific recovery.
4. Dark `--color-ok` and `--color-ok-tint`: use the declared dark values (#8fd1a8 on #24352c) in `styles.css`.
5. Remove the 330 px grid minimum, let card titles wrap, move search above the results on phones, and remove `row-reverse` from the session list.
6. Give the page bottom padding equal to the fixed bar's height, use `scroll-padding-bottom`, and release Tab and Esc from the loan-length list.
