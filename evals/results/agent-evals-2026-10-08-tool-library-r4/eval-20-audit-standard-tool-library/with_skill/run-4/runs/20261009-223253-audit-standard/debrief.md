# Debrief: Fernhill Tool Library reservation flow (run 20261009-223253-audit-standard)

Depth: standard. Inspectors: 3 heuristic evaluators (novice, expert, accessibility-minded), 1 cognitive walkthrough of `reserve-tool-for-saturday` at 375 px, 3 design critics, 1 accessibility auditor, 1 code reviewer (review and locate), 4 verifier passes, 3 blind severity raters, all isolated subagents. Deterministic checks covered 5 routes x 6 widths (320 to 1440) x light and dark themes. Both journeys replayed end to end with the scripted recipe. All evidence is E0 to E1 (predicted, or reproduced with `uie probe`); nothing here comes from real members.

Note on duplicates: the merge only joins candidates through proposals, and several duplicates were never proposed together. The following groups describe one problem each and should be read, fixed and counted as one:
- sessions listed latest first: F-0027, F-0060, F-0155, F-0159, F-0160, F-0162 (cause `styles.css:818-819`, `flex-direction: row-reverse; flex-wrap: wrap-reverse`);
- tool names cut to one line: F-0048, F-0111, F-0142, plus the clipping rule hits F-0009, F-0010, F-0014 (cause `styles.css:373-379`);
- search placed after the results on phones: F-0024, F-0055, F-0112, F-0143, F-0158 (cause `index.html` source order with CSS `order`, `styles.css:253`);
- dark-mode availability badge: F-0001, F-0002, F-0050, F-0120, F-0151 (cause the dark `--color-ok` / `--color-ok-tint` tokens, `styles.css:60-61`);
- basket count not cleared after confirming: F-0062, F-0122;
- placeholder wrench thumbnails: F-0110, F-0140; calendar month label: F-0117, F-0131; toast over the weekday header: F-0130, F-0148; detail-list offsets: F-0119, F-0146; nav labels wrapping: F-0125, F-0138; brand identity: F-0123, F-0141.

## 1. What the passes agree on

- **The basket hold is invisible and fatal when it runs out.** The 10-minute hold is never stated (F-0078), never warned about and cannot be extended (F-0042, WCAG 2.2.1), and after it expires every Continue fails with "Something went wrong. Try again." even after a reload (F-0043, rated P0, mean 4.0). The verifier reproduced the dead end with a real 10.3-minute wait. On a phone in the evening, "doing something else while reserving" is the declared context of use, so a 10-minute pause is a likely path.
- **Picking the collection day is broken in several ways.** The calendar accepts closed days and days before the tool is available (F-0068, F-0069, F-0044); the closed day is only rejected at the final Confirm. Then the basket asks for the collection session again without carrying the day over, lists sessions latest first and offers sessions before the chosen day (F-0033, F-0027 group, F-0161, F-0083). Found by all three heuristic evaluators, the walkthrough, the accessibility auditor, the code reviewer and the critics.
- **"Reserve this tool" does not reserve.** It adds to a basket; the confirmation toast lasts about 1.3 s and covers the calendar header, the page keeps no sign the tool was added, and the way on is scrolled out of view (F-0057, F-0077, F-0054, F-0058). The walkthrough judged the first-time member would likely stop here believing the drill was reserved (CW-Q1 failure, mean 3.33).
- **Confirm reservation can double-book.** A second tap during the 1.5 s wait allocates a second reservation (F-0036, `app.js:413`), and neither Continue nor Confirm shows a visible busy state (F-0037).
- **On phones the two drills look the same and search is at the bottom.** Names are cut to "Cordless drill 18 V, co..." (F-0048 group) and the search form comes after all ten cards in both visual and focus order on phones (F-0024 group).
- **Keyboard trap in the loan-length list.** Tab cycles inside the open list and Escape does not close it (F-0039, `app.js:241`; WCAG 2.1.2); the deterministic Tab walk then never reaches the header, calendar or Reserve button (F-0026, P0). The button's accessible name is its value, "One week", not "Loan length" (F-0029).
- **The fixed action bar covers content.** At phone widths it hides the focused calendar day and the open loan list, and overlaps the calendar at 200 % text (F-0025 group, F-0008 group).

## 2. Detector-only findings

- Dark theme: the green "Available from ..." badge text measures 3.07:1 at 320 px (needs 4.5:1), 21 axe hits across widths (F-0001, F-0002). The critics saw the same badge losing its chip background in dark mode (F-0120, F-0151) but not the contrast number. This matters because dark mode is common among members.
- Reflow at 320 px: the results grid's 330 px column minimum causes about 26 px of horizontal scroll (F-0012, F-0013, F-0046; WCAG 1.4.10).
- Text spacing and 200 % text: card names clip, and the Reserve bar overlaps the details list (F-0009, F-0010, F-0015, F-0016; WCAG 1.4.12 and 1.4.4).
- Body text closer than 16 px to the viewport edge on cards at 320 px (F-0019), cramped card padding (F-0022).

## 3. Judge-only findings

- Changing the session from the confirm page clears the name, membership number and phone already typed (F-0072).
- Removing a tool is immediate with no undo (F-0079); removing the last tool leaves a stale error (F-0092).
- The three-tool limit is stated but a fourth tool is accepted (F-0084).
- A search with no matches leaves the previous results on screen and announces nothing (F-0031).
- Membership-number errors do not say what is wrong (F-0075); a +44 mobile number is rejected (F-0107).
- The reservation number "FT-4471" uses the membership-number prefix (F-0074).
- The date-filter hint says "on or after this day" while the filter keeps tools available by that day (F-0090), and the hint is not linked to the input (F-0053).
- Forced colours: the green session dots disappear at small widths (F-0030).
- Design panel: specificity `partly_specific` (2 critics) and `generic` (1); appeal `plain` (3 of 3). Every card shows the same wrench placeholder (F-0110), the identity is the name in body type beside a stock icon (F-0123), the calendar has no month label (F-0117), session cards wrap into one wide card over five cramped ones (F-0114, F-0154).

## 4. Detector false positives and rejected candidates

- No detector hit was contradicted by the rendered page.
- Rejected judged candidates (5): "Enter does not run the search" (F-0032, not reproduced: Enter works; the stale list came from the no-match bug); masthead nav overflowing at 320 px (F-0047, not reproduced); yyyy/mm/dd date format (F-0147, capture-browser locale artefact); the default border on "Your name" in the error state (F-0121, hover artefact from the pointer); a Monday shown as the pick-up day (F-0145, an artefact of the state recipe; the real problem is F-0044).
- Advisory observations (APCA and one-word last lines) are listed apart and not counted.

## 5. Strengths to preserve

- Error summaries on basket and confirm are focused alerts whose links move focus to each field, with format examples ("like FT-01234"), and typed values are kept after a failed submit (he-1, he-2, he-3, a11y; confirm `errors` state, 375 px light and 1280 px light captures).
- Calendar day buttons have full spoken names with session status ("Saturday 17 October, open") and expose the selection as pressed (he-2, he-3, a11y; ARIA snapshot for the tool page, `loan-open` state, 1280 px light).
- Adding to the basket and search results are announced through status regions ("Added to your basket", "2 tools found") (he-1, he-2, he-3; probe ARIA at 375 px).
- Confirm and done pages say plainly that nothing is paid online, what deposit to bring and what to do if the member cannot make the session (confirm `default` 375 px light capture; done page probes at 375 px).
- Visible focus rings that survive forced colours (he-3; a11y forced-colours probe).
- The copy is specific to the library and in the volunteer's voice (all three critics).

## 6. Divergent findings, as questions for user research

No finding was divergent among the raters (spread below 2 everywhere). Open questions that only members can settle:
- Do first-time members understand that "Reserve this tool" only holds the tool until they confirm, or do some leave at that point?
- How often does a member on a phone leave the flow for more than ten minutes before confirming?
- Do members expect to choose a day and then a session, or one collection session only?

## 7. Fix ideas (after evaluation)

1. Make the hold visible and survivable: state "held for 10 minutes" in the basket, warn before it ends, and on expiry explain what happened and re-hold rather than "Something went wrong" (`app.js:97`, `app.js:361`).
2. Prevent double submission: disable Confirm and Continue while waiting and show a busy label (`app.js:413`, `app.js:418`).
3. Choose the collection once: only let open session days be picked on the tool page (`app.js:198`, `app.js:256-258`), carry that choice into the basket preselected, and list sessions earliest first by removing the reversed flex direction (`styles.css:818-819`).
4. Rename or follow "Reserve this tool" with an obvious next step ("Add to basket", then a persistent "Basket (1) - finish reserving" link that stays visible).
5. Fix the loan-length listbox: Tab leaves, Escape closes, and the accessible name includes "Loan length" (`app.js:241`).
6. Dark theme: raise the dark `--color-ok` token to at least 4.5:1 on its tint and give the badge its tint background (`styles.css:60-61`).
7. Phones: let the card name wrap to two lines (`styles.css:373-379`), drop the grid minimum below 320 px (`styles.css:331`), put the search before the results in source order, and reserve space under the fixed action bar (`styles.css:758`) or stop fixing it.
8. Keep typed details when the member uses Change on the confirm page (`app.js:392`).
