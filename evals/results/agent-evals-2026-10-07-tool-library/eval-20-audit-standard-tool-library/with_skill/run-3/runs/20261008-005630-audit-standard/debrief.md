# Debrief: audit-standard, run 20261008-005630

Standard depth. The checks were:
- the full deterministic audit over 5 routes × 6 widths × light/dark;
- 2 journey replays, both scripted and both completed;
- 3 isolated heuristic evaluators (novice, expert and accessibility lenses);
- 1 cognitive walkthrough of the critical journey at 375 px;
- 3 design critics;
- an accessibility auditor;
- a code reviewer (review and locate phases);
- 2 verifier passes;
- 3 blind severity raters.

All evidence is analytical (E0–E1). No real members were observed. Any statement below about what members "may" do is a prediction.

## 1. What the passes agree on

- **Reserving is a two-stage process, but the page reads as if it were one.** The walkthrough, all three heuristic evaluators and the code reviewer each found this independently:
  - "Reserve this tool" only adds the tool to a basket (F-0061, mean severity 4).
  - The only feedback is a toast that lasts about 1.35 s (F-0051).
  - The "Basket (1)" link is scrolled out of view at 375 px.
  - A member may leave believing the drill is reserved.
- **The pick-up date is asked for twice, and the two answers can contradict each other.**
  - A day is chosen on the tool page and a session in the basket. The basket does not preselect the matching session and lists sessions latest first (F-0072, F-0062, F-0063).
  - The confirm page can show "pick up Saturday 17 October" next to "Pick-up session Wednesday 21 October".
  - Days before the tool is available, and days the library is closed, are accepted (F-0071, F-0035, F-0045). Closed days are rejected only at Confirm.
- **The basket hold has a hidden 10-minute limit** (F-0044, F-0079). After it expires, Continue fails with "Something went wrong. Try again." on every retry, and there is no way out (F-0043, mean 4). The verifier reproduced this after about 10.5 minutes. For a phone user in the evening who gets interrupted, this is likely.
- **Continue and Confirm show no response for 1.2–1.5 s** (F-0041, F-0064). Confirm can be pressed twice and then creates two reservation numbers (F-0042; FT-4471 and FT-4472 were reproduced).
- **Dark mode: the "Available from…" badge fails contrast.**
  - It measures 3.07:1 (#2f7d4a on #1d2622) against the 4.5:1 required (F-0001, F-0002).
  - The dark tint token equals the card surface, so the badge also loses its pill (F-0050, F-0115, F-0133).
  - The root cause is two dark-theme tokens (`styles.css:60–61`).
  - The detector recorded it at 320 px. The token is not tied to a width, so it applies to every dark-mode width.
- **Sticky "Reserve this tool" bar on phones:**
  - it hides focused calendar days and the loan-length button (F-0025, F-0097);
  - it hides the open loan-length options (F-0144);
  - it covers the end of the page (F-0055).
- **Tool names are truncated on phones**, so the two cordless drills look identical (F-0038, F-0113, F-0125). The cause is one CSS rule (`styles.css:373`).
- **Search on phones:**
  - search and filters sit below all ten cards (F-0057, F-0119, F-0126);
  - a search with no matches shows the full list with no message (F-0036, F-0066, F-0134, F-0139).

## 2. Detector-only findings

- **Reflow and overflow at 320 px on the find page:**
  - the results grid track minimum is 330 px, causing 26 px of horizontal scroll (F-0012, F-0013, F-0037);
  - card titles clip at 200 % text size and under the text-spacing override (F-0009, F-0010, F-0014);
  - `#reserve` overlaps nearby text at 200 % text size (F-0011, F-0015, F-0016).
- **Focus order on the find page:** at desktop widths, focus jumps from the last card back up to the search box (F-0024, rule severity 4). CSS reorders the content, so DOM order differs from visual order (F-0049, F-0027).
- **The tool page's keyboard walk in the "loan-open" state never leaves the listbox** (F-0026, rule severity 4).
  - The verifier reproduced Tab cycling inside the open list, Escape doing nothing and outside clicks not closing it (F-0141, F-0082, F-0142).
  - Choosing an option with Enter does close it, so a keyboard user can get out. The accessibility auditor therefore judged it not a hard trap.
  - The rule severity stands, but the owner should weigh it as a "non-standard exit" problem, not a dead end.
- **Minor typography and spacing items:** widows (TYP-15), APCA-weak muted text, and body text within 16 px of the edge on cards at 320 px. These are P3 or P2.

## 3. Judge-only findings

- Phone and membership validation rejects "+44", hyphens and lowercase "ft-" (F-0048). Format errors are worded as if the field were empty (F-0081).
- "Change" on the confirm page drops the chosen session and clears the typed details (F-0046, F-0091, F-0075).
- After confirming, the reserved tool stays in the basket and the masthead still shows "Basket (1)" (F-0080, F-0132).
- The three-tool limit is not enforced (F-0047). The verifier added four tools.
- The "Available from" filter's wording does not match its behaviour (F-0069). The filters toggle shows only an icon (F-0068).
- Design panel: all three critics independently judged specificity **generic** and appeal **plain**. The main reasons:
  - identical wrench placeholder thumbnails;
  - browser-default filter controls;
  - no identity beyond the name in bold body text;
  - half-empty wide layouts.
  
  Brand fit was 1 of 3 attributes ("practical" met; "neighbourly" only in the copy). This is a unanimous verdict, not a split.

## 4. Detector false positives and artefacts

- Full-page captures of the tool page draw the fixed action bar mid-page. F-0128 was rejected on that basis, and the bar was re-judged at viewport height.
- F-0053 (the done page shows FT-4471 with no reservation) reproduces, but bare `/done.html` is not a declared route, so it is out of scope. The owner may want it in scope: a member who reloads or bookmarks the page sees a made-up number.
- The `notes` field in the code reviewer's review output wrongly says validation did not run. The file does validate.

## 5. Strengths to preserve

- Error summaries on the basket and confirm pages take focus, link to each field, give specific messages and keep typed values (all three evaluators).
- The done page says what to bring, where to go and what to do if plans change.
- The confirm page says nothing is paid online. Deposits are stated up front.
- Calendar days carry "Open" as text and in their accessible names, so session days are not marked by colour alone.
- The search result count is announced in a status region. The empty basket explains itself.
- Dark mode exists, and error and selection states stay distinguishable in it. The badge token is the one break.

## 6. Divergent findings: questions for user research

The raters flagged no finding as divergent (0 of 79). These questions remain open because evaluators disagreed or a human is needed:

- Does a screen reader announce the "Added to your basket" toast (F-0052)? This needs a VoiceOver or TalkBack pass.
- Do members on a phone notice that "Reserve this tool" did not finish the reservation? A five-person moderated test of the critical journey would settle how severe F-0061 really is.
- Evaluators disagreed on the loan-length listbox. One said it works fully by keyboard; the verifier reproduced the Tab cycling. A keyboard user's verdict would resolve it.

## 7. Fix ideas, in priority order

1. Make the reservation flow tell the truth. Rename the button "Add to basket" or keep a persistent "1 tool in your basket — choose a session" banner with a link. Do this, or merge day and session into one choice and preselect it in the basket.
2. Show the hold time, warn before it ends, and recover from expiry with a clear message ("Your hold ran out — we've held it again"). Never show "Something went wrong".
3. Restrict the calendar to open days on or after the tool's available-from date. Order sessions earliest first.
4. Disable Confirm and Continue while they are submitting and show progress. Make submission idempotent.
5. Fix the dark tokens `--color-ok` and `--color-ok-tint` (`styles.css:60–61`) to reach at least 4.5:1, with a distinct tint.
6. Reserve space for the sticky bar with `scroll-padding-bottom` and body padding. Make the loan listbox close on Escape, Tab and outside click.
7. Put search above the results on phones and in DOM order. Add a no-results state. Remove the 330 px grid minimum and the single-line clamp on card titles.
8. Accept common phone and membership formats. Keep the details and session after "Change". Clear the basket after confirming. Enforce the three-tool limit.
9. Design: real tool photos and themed filter controls (G6). Treat this as a separate `direct` pass rather than patches.
