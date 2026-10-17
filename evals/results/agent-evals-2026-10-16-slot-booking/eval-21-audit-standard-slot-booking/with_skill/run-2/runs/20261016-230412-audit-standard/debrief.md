# Debrief — audit-standard, 2026-10-16

Depth: standard. Inspectors: 3 heuristic evaluators, 1 walkthrough (book-a-slot), 3 design critics, 1 accessibility auditor, 1 code reviewer (review + locate), 4 verifier runs, 3 blind raters. Deterministic: full `uie audit` (22 checks, 6 routes × 6 widths × light/dark) and `uie lint` (the minified bundle was skipped by lint; the code reviewer read it instead).

Process notes:
- he-1 had no shell access, so its pass was static (screens and ARIA only, no probes); its candidates still went through the verifier, who reproduced them with probes.
- The three design critics unsealed their detector section before the deterministic audit had finished, so they saw "0 hits"; their verdicts were written blind as required, but they had no detector cross-check.
- Some duplicates survived the merge because no proposal linked them: F-0023, F-0038 and F-0081 (hold never stated); F-0048 and F-0055 (permit field always shown); F-0078 and F-0080 (no online change or cancel); F-0056 and F-0087 (info button). They have the same mean severity within each group. Read each group as one problem.

## 1. What the passes agree on

- **Cancelled booking still headed "Booked"** (F-0021): found by 6 of 10 sources (auditor, all 3 heuristic evaluators, 2 critics). Measured on /done.html?status=cancelled: the h1 reads "Booked" and the page still says "Show this at the gate".
- **Booked page omits day, time and vehicle** (F-0024): 6 of 10. The page shows only the reference. Residents read it at the gate, where there is poor signal.
- **Expired hold gives no way forward** (F-0022, F-0110, F-0089 merged): 6 of 10. The verifier waited 5 min 20 s: the error reads "This slot is no longer available.", the Slot row turns to "—", and the message does not say the hold ran out.
- **"Few left" slots pulled out of time order above "Morning"** (F-0017, merged with F-0020/F-0026/F-0085): found by the keyboard check, the auditor, the code reviewer, the walkthrough, 2 heuristic evaluators and all 3 critics. Inline `order:-1` (app.js col 6073) moves them visually but not in DOM order, so the reading order and the focus order also break (WCAG 1.3.2, 2.4.3).
- **Permit field shown to every resident** (F-0055/F-0048/F-0088): 3 heuristic evaluators, the walkthrough and 3 critics. Root cause located by the code reviewer: `.field{display:flex}` (styles.css col 2389) overrides `[hidden]` on `#permit-wrap`. That also explains the rule hit F-0018: the 1.2 s reveal changes nothing you can see.
- **Slot hold never stated** (F-0023/F-0038/F-0081/F-0109): no page mentions the 5-minute hold. Whether WCAG 2.2.1 is failed needs a human judgement (real-time exception?).
- **No loading state while slots load** (F-0028): about 0.9 s of a blank slot area that still names the previous day.

## 2. Detector-only findings

- "Few left" tag contrast 3.02:1 light and 3.38:1 dark (F-0001, with F-0002 merged; F-0040 is the code reviewer's token-drift view of the same tag). It fails 1.4.3 in both themes.
- Horizontal overflow and no reflow at 320 px on step 1 (F-0009): the ≤360 px grid override sizes the slot grid about 31 px wider than the page.
- No visible focus ring on slot buttons (F-0016): a runtime-injected `.slot:focus{outline:0}`.
- Slot count status not announced (F-0015): the live region is created at the moment its text is written.
- Layout shift above 0.1 on step 1 at 320 px (F-0019).

## 3. Judge-only findings

- A second press of "Book this slot" during the 1.5 s submission saves the booking as **cancelled** (F-0036, code reviewer, reproduced by the verifier). Together with no busy state on Book (F-0037/F-0049), a resident who taps twice on a slow phone is very likely to end up without a booking, on a page headed "Booked".
- Today's past slots are shown as free and rejected only at the final step (F-0035).
- The van permit is checked only at Book, two pages after it was entered (F-0033).
- No online way to change or cancel a booking; only a weekday phone line (F-0078/F-0080). Raters put this at P0 (mean 3.67). It is a missing feature, not a defect in the bundle, so it is a scope decision for the council.
- Going back to the slot page resets the day to Today (F-0063). The vehicle step does not repeat the chosen day and time (F-0046).
- The permit help sits behind an unlabelled (i) button that looks like a fourth vehicle option (F-0056/F-0087), and "apply on the council site" has no link (F-0057).

## 4. Detector false positives and rejections

- Rejected on re-check: F-0032 (permit field "appears 1.2 s late"; it is always visible, see F-0055), F-0075 (`aria-current="step"` is present), F-0030 (the slot length is stated on the page), F-0106 (a second tinted day button left over from hovering during capture).
- Dark-theme contrast hits (COL-14, 18 hits) are APCA advisories. Every one passes WCAG 2 contrast (6.7:1 to 8.7:1). They are not findings.
- F-0039 (Enter during IME composition) needs a person with a CJK input method. The product is en-GB only, so its weight is low.

## 5. Strengths to preserve (seen at 375 px, dark theme)

- The dark theme is complete and coherent: body text and hints pass WCAG contrast in dark mode on every page (evidence/screens/root/date-chosen/375-dark.png). The only dark-mode failure is the "Few left" tag.
- The copy is plain and states the rules where they apply: "Choose a day and the 20-minute slot you will arrive in; the gate checks the reference and the vehicle" (root/date-chosen/375-dark.png).
- The quick day buttons (Today, Tomorrow, Saturday 17, Sunday 18) suit the evening-before booking pattern (root/date-chosen/375-dark.png).
- Error summaries move focus to role=alert on the vehicle and confirm steps (the config's `errors` states captured at 375 px).
- The step list exposes `aria-current="step"` (verifier, F-0075 rejection).

## 6. Divergent findings — questions for user research

The raters did not diverge on any finding (0 divergent). Open questions for residents:
- Does "Few left" mean anything for a slot that holds one vehicle (F-0045)? Would residents rather see the slots in plain time order?
- Do residents on phones double-tap "Book this slot" when nothing happens for 1.5 s? A short observed test would show how often F-0036 bites.

## 7. Fix ideas (after evaluation)

1. Ignore a second press while booking is pending, and show a busy state on Book (F-0036, F-0037). Head the cancelled page "Cancelled" and drop the gate instructions there (F-0021).
2. Add `[hidden]{display:none!important}`, or scope `.field{display:flex}`, so the permit field shows only for a van or a trailer (F-0055). Validate the permit on the vehicle step (F-0033).
3. Remove the inline `order:-1` and keep slots in time order; keep "Few left" as a tag only (F-0017). Darken the tag to the declared warning token `#8a5a00` or similar, in both themes (F-0001).
4. Remove the injected `.slot:focus{outline:0}` (F-0016). Fix the ≤360 px grid override (F-0009).
5. Put the day, time, vehicle and the arrive-within-20-minutes rule on the done page (F-0024). State the 5-minute hold when a slot is chosen; on expiry say so and link back to the slots with the day kept (F-0023, F-0022). Hide today's past slots (F-0035).
6. Decide with the agency whether online change or cancel is in scope (F-0078).
