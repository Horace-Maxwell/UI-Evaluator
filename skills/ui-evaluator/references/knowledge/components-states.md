# Components and states

This file covers how interactive components look and behave in every state, and the standard patterns built from them: response and loading feedback, saving, notifications, empty states, confirmation, buttons, forms, navigation, dialogs, tooltips and hardening. It serves gate G3 (CMP-01 to CMP-06), supports usability findings under H1, H3, H5 and H9 (G5), and points to the G2 rules it touches in [accessibility.md](accessibility.md). Message wording lives in [content-copy.md](content-copy.md), tells in [anti-slop.md](anti-slop.md), colour roles in [color.md](color.md), radii in [shape-depth.md](shape-depth.md), stacking order in [layout.md](layout.md) (LAY-15), and the animation of these states in [motion.md](motion.md). Read this file when building or reviewing any interactive surface and when fixing a CMP finding.

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules): gate CMP-01 to CMP-06, advisory CMP-07 to CMP-22
3. [Decisions to make](#3-decisions-to-make)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles

1. **Design every state, not the happy path.** Data arrives late, is sometimes absent and sometimes fails. Generated interfaces tend to ship only the success state, and the missing states are where trust is lost.
2. **Say each state twice.** Every state differs from rest by at least two cues, so it survives colour-vision deficiency, forced colours and a quick glance.
3. **The system always answers.** Acknowledge every action at once, show progress during waits, and report outcomes in proportion to their importance (H1).
4. **Keep people moving and keep their work.** Leave controls available, validate when the user is done, keep what they typed, and prefer undo to interruption (H3, H5, H9).
5. **Conventional controls, distinctive brand.** Standard affordances, placements and behaviours stay where people expect them; distinctiveness belongs in type, colour, imagery and voice (P3).
6. **Test with the stress case.** Long, empty, slow, failed, translated and zoomed content is normal content.

## 2. Rules

Gate rules come first and repeat the G3 thresholds exactly. Advisory rules (`level: advisory`) raise findings for evaluators and the code reviewer but never fail G3 on their own. Check names in `--checks` follow `uie audit --help`; state recipes are the ones declared in `config.json`.

### CMP-01 · State styling exists
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks states)`

**Rule.** Buttons, links and inputs show a visible difference for hover (when hover is supported) and active states (forced pseudo-state diff > 0).

**Why.** A control that looks the same when pointed at and when pressed gives no evidence that the system noticed. Apple requires a press state for every custom button, and missing states are among the most common gaps in generated UI.

**Check.** `uie audit --checks states` forces `:hover` and `:active` on each button, link and input and diffs the crops against rest; a zero-pixel difference fails. Hover is skipped on touch-only viewports.

**Fix.** Add the states to the shared component through the state model in the token layer (CMP-07), not page by page, and make pressed at least as strong as hover.

**Sources.** [PLAT-050, CRAFT-053, IMP-019]; Apple HIG Buttons; Material 3 interaction states.

### CMP-02 · Focus indicator quality
`gate G3` · `modes: all` · `status: calibrating` · `verify: I/P (uie audit --checks keyboard)`

**Rule.** Indicator ≥ 2 px thick (or area ≥ a 2 px perimeter), change contrast ≥ 3:1, distinct from hover — **advisory until calibrated**.

**Why.** A ring that is thin, faint or identical to hover leaves keyboard users guessing where they are. The visibility floor (any visible change at all) is A11Y-04 in accessibility.md; this rule measures quality above that floor, and its metric is a UI-Evaluator proposal [calibrating].

**Check.** `uie audit --checks keyboard` walks every tab stop, diffs focused against blurred crops, estimates thickness from the changed band, computes the contrast of the change, and compares the focus crop with the forced-hover crop. For composite widgets that move a highlight (`aria-activedescendant`), the highlight is measured.

**Fix.** Define focus tokens once (CMP-08) and apply them through one shared `:focus-visible` style; never style focus per component.

**Sources.** [PLAT-051, TOOL-06, IMP-020, CRAFT-047]; WCAG 2.2 SC 2.4.7 and 2.4.13 (AAA metric used as a guide).

### CMP-03 · Disabled states
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks states)`

**Rule.** Disabled controls use ≥ 2 cues and stay perceivable: the label text or the outline of each disabled control reaches ≥ 2:1 contrast against the adjacent background **[calibrating]**, a floor of UI-Evaluator's own (WCAG exempts inactive components from 1.4.3 and 1.4.11). A primary submit button disabled at rest does not fail CMP-03; the check emits it as a candidate finding (H1, H9) for verification and rating (ADR-032).

**Why.** Opacity alone is lost on low-vision users and under forced colours, and a control nobody can see cannot say it exists. WCAG sets no contrast for inactive components and no design system sets a legibility floor, so the 2:1 floor is a proposal: low enough that common system disabled styles pass, high enough that near-invisible ones fail (CMP-09 lists measured examples). A submit button disabled at rest hides what is missing, cannot be reached by Tab when natively disabled, and gives no reason, which is why research-led systems avoid it (CMP-09). Whether it harms these users depends on the form, so it is judged as a finding rather than failed by the gate.

**Check.** `uie audit --checks states` compares each disabled control with its enabled rest state and counts the cues (reduced opacity or colour, `not-allowed` cursor, the `disabled` or `aria-disabled` attribute, an explanation nearby). It measures the label text against the control's own fill (or the surface, when the control has none) and the outline against the surrounding surface; the control is perceivable when either reaches 2:1. An icon-only control's icon counts as its label. A form whose primary submit is disabled on first render does not fail CMP-03: the check writes a candidate finding under H1 and H9 (the person cannot tell what is missing), which the verifier and the blind raters handle like any judged finding.

**Fix.** Use one disabled token set everywhere (CMP-09), with the disabled text and border roles at or above the floor. For a primary submit, enable it and validate on submit (CMP-18).

**Sources.** [PLAT-053, CRAFT-053, 05 C3, 05 C18]; ADR-032; GOV.UK Button; Primer Saving; Carbon disabled states.

### CMP-04 · Response feedback
`gate G3` · `modes: all` · `status: active` · `verify: I (uie probe; uie journey)`

**Rule.** A visible acknowledgement within 0.1 s of a user action; operations > 1 s show progress; operations ≥ 10 s show determinate progress (or percent done) and a way to cancel or interrupt; a static "Loading…" alone fails.

**Why.** Up to 0.1 s feels instantaneous; past 1 s people notice the wait and need to know the system is working; near 10 s attention drifts (Nielsen's response-time limits). A static label cannot tell a working system from a frozen one.

**Check.** `uie probe` performs the action and records the time to the first visual change and screenshots during the wait; `uie journey` records the same per step. Test against a slow response where the app or a fixture allows it, because a fast local server hides the failure.

**Fix.** The acknowledgement can be the pressed state, a label change ("Saving…") or a spinner inside the triggering control (CMP-16). Show progress where the content will appear (CMP-10). Fix both in the shared button and loader components.

**Exceptions.** None. Tognazzini's 50 ms click acknowledgement is a stretch target, not the threshold [06 X12].

**Sources.** [HCI-067, PLAT-090, PLAT-054]; Nielsen, Response Times (1993, updated 2014); NN/g Progress Indicators; Primer Loading.

### CMP-05 · Data states exist
`gate G3` · `modes: all` · `status: active` · `verify: I/A (uie capture with state recipes; code reviewer)`

**Rule.** Every data view in scope has loading, empty and error states, demonstrated through state recipes or confirmed by the code reviewer.

**Why.** Real data is slow, missing or failing some of the time, and those are the moments that decide whether people trust a view.

**Check.** State recipes force loading (a delayed response), empty (no data) and error (a failing request) for each data view; `uie capture` records them and `uie audit` runs over them. Where a state cannot be forced, the code reviewer confirms the branch in source with file:line.

**Fix.** Build the three states into the shared data-view, list and table components (CMP-10, CMP-11, CMP-14), then supply per-view copy.

**Sources.** [IMP-019, CRAFT-053, DSL-036]; hallmark component scope; ui-craft finish bar.

### CMP-06 · Touch-primary targets
`gate G3` · `modes: all (touch viewports)` · `status: active` · `verify: D (uie audit --checks targets)`

**Rule.** On touch viewports, the hit area of each primary control is ≥ 44 × 44 CSS px, and the shortest edge-to-edge distance between the hit areas of neighbouring primary controls is ≥ 8 CSS px **[calibrating]**. Touch viewports: matrix entries captured with touch emulation (`hasTouch`, `pointer: coarse`), by default every width below 1024 CSS px. Primary controls: a surface's primary action (`PRODUCT.md` or `config.json`), controls used by journey steps, primary navigation items, form submit buttons and dialog action buttons; inline links in running text are excluded. Hit area: the element's border box, united with its associated `<label>` box for inputs (ADR-032).

**Why.** The WCAG minimum of 24 px (A11Y-10 in accessibility.md) is a floor; fingers need more. Apple uses 44 pt as its default control size, and Material 48 dp with 8 dp between targets. The gate covers the controls people need to finish their tasks; the comfort size for every other control is advisory (A11Y-23 in accessibility.md).

**Check.** `uie audit --checks targets` runs on the touch viewports. It collects the primary controls (the declared primary action of each surface, the controls the journeys use, primary navigation, form submits and dialog actions, but not links inside running text), measures each hit area as the border box plus, for an input, the box of its associated `<label>`, and measures the shortest edge-to-edge gap between neighbouring primary controls. Pseudo-element extensions are not part of the measured hit area.

**Fix.** In the shared control, either grow the border box with padding around a small glyph, or use the larger control size on touch layouts, which Primer prefers to invisible extensions; a pseudo-element extension does not count toward CMP-06. Give inputs a visible, associated label, whose box adds to the hit area. Keep neighbours ≥ 8 px apart either way.

**Sources.** [PLAT-040, CRAFT-047, TOOL-13, DSL-038]; ADR-032; Apple HIG Accessibility; Material 3 accessibility; Primer responsive; WCAG 2.2 SC 2.5.5 and 2.5.8.

### CMP-07 · Interactive state set
`level: advisory` · `modes: all` · `status: active` · `verify: D/P (uie audit --checks states; uie capture)`

**Rule.** Each interactive component defines the states it can reach from this set: rest, hover, focus-visible, pressed, disabled, selected, loading, error, success. Each state differs from rest by at least two cues (for example fill plus border weight, icon plus text). Pressed is at least as strong as hover; selected uses a container or fill change rather than the hover treatment; hover, pressed and focus raise contrast rather than lower it; border width stays constant across states so nothing shifts. During build, render all states of a component together on a throwaway preview page.

**Why.** Two cues survive colour-vision deficiency, forced colours and a glance. States derived from one model feel consistent across components.

**Check.** `uie audit --checks states` forces each state (pseudo-classes plus `aria-selected`, `aria-busy`, `aria-invalid` and `disabled`) and diffs it against rest. The CVD and forced-colour captures from `uie capture` show whether a second cue survives without colour (A11Y-19).

**Fix.** Derive states from one model in the token layer. Two contrasting models: a state layer in the content colour at fixed opacities (Material 3 Compose tokens use hover 8 %, focus and pressed 10 %; the frozen web tokens use 12 %), which suits products with many colour roles or user theming; or fixed ramp steps (Radix: steps 3, 4 and 5 for rest, hover and active; Carbon: half a step for hover, one for selected, two for active), which suits a hand-tuned palette.

**Sources.** [PLAT-050, PLAT-052, PLAT-141, CRAFT-053, DSL-036]; Material 3 interaction states; Radix Colors; Carbon colour; hallmark (eight states); Vercel Web Interface Guidelines (states raise contrast).

### CMP-08 · Focus indicator geometry
`level: advisory` · `modes: all` · `status: active` · `verify: I/P (uie audit --checks keyboard; uie capture forced colours)`

**Rule.** Draw focus from tokens: a ring of `--focus-width` (≥ 2 px, per CMP-02) at `--focus-offset` (systems use about 2 px), whose radius equals the component radius plus the offset, in a colour reaching 3:1 against adjacent colours (A11Y-12). Focus never reuses the hover treatment; it changes the stroke, not only the fill. Show it on `:focus-visible`, instantly, without a transition. Keep it visible beside sticky headers (A11Y-05; `scroll-padding` fixes most cases) and in forced colours.

**Why.** An offset ring clears the component's own edge; a concentric radius looks deliberate rather than pinched; an animated ring lags behind fast keyboard users. Two contrasting styles: an accent-coloured offset ring suits a product whose accent reaches 3:1 on every surface it sits on; a two-colour indicator (GOV.UK pairs a yellow fill with a dark bar) suits products that place controls on mixed light, dark and photographic backgrounds.

**Check.** `uie audit --checks keyboard` measures width, offset, radius and contrast from the focused crop. The forced-colours capture shows whether the ring survives; a ring drawn only with `box-shadow` may vanish there [unverified].

**Fix.** Replace per-component outlines with one shared focus style built from the tokens; `uie lint` flags `outline: none` without that replacement.

**Sources.** [PLAT-051, PLAT-070, IMP-020, DSL-037, TOOL-07, TOOL-17]; material-web focus ring (3 px, 2 px offset); Carbon (2 px); GOV.UK focus states; Fluent colour (focus as stroke); Atlassian radius (ideas only); hallmark (instant focus); WCAG technique C43.

### CMP-09 · Disabled, read-only and hidden
`level: advisory` · `modes: all` · `status: active` · `verify: D/A (uie audit --checks states,keyboard; heuristic evaluator)`

**Rule.** Choose the right kind of absence. *Disabled*: temporarily unavailable, visible, not operable, no hover, with an explanation nearby when it blocks the main flow; items users must discover (menu items, tabs, toolbar buttons) stay focusable with `aria-disabled="true"`. *Read-only*: the value matters but cannot change here; it stays readable, including by screen readers, without interactive styling. *Hidden*: absent because of permissions; remove it rather than show a dead control. Do not disable the primary submit or save button: keep it enabled and validate on submit (CMP-18). Disable it only while a request runs, to prevent a duplicate submission (with a busy indicator), or where research for this product shows disabling helps; then keep it discoverable and say why.

**Why.** Natively disabled buttons have low contrast, cannot be reached by Tab and give no reason. GOV.UK and Primer avoid them; Apple enables Next only when the required data is present. Keeping the button and explaining the problem resolves the conflict in favour of getting people unstuck [05 C3].

**Check.** The CMP-03 check raises primary submits disabled at rest as H1 and H9 candidates; `uie audit --checks keyboard` lists disabled controls that carry information but cannot be reached; the heuristic evaluator judges whether each disabled control explains itself.

**Fix.** Pick one disabled token set and apply it everywhere [05 C18]: Material 3 uses 38 % opacity for content and 12 % for containers, Carbon 50 % for components and 25 % for text, Semi about 35 % for text. Disabled text is exempt from WCAG contrast but must stay legible enough to say what it is; no source sets a floor, so CMP-03 applies UI-Evaluator's own 2:1 floor to the label text or outline **[calibrating]**. On a white surface, near-black text at 35–38 % opacity clears that floor (about 2.4:1), while 25 % does not (about 1.7–1.8:1).

**Sources.** [PLAT-053, CRAFT-053, TOOL-09, 05 C3, 05 C18]; GOV.UK Button; Primer Saving and Degraded experiences; Carbon disabled states; Apple HIG Entering data and Menus; WAI-ARIA APG keyboard interface.

### CMP-10 · Wait feedback by duration
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe; uie audit --checks live-regions)`

**Rule.** Match the indicator to the expected wait:

| Expected wait | Show |
|---|---|
| ≤ 0.1 s | the result; the control's own state change is enough |
| up to about 1 s | the acknowledgement in the control (pressed state, label change, or an in-control spinner after its show-delay); no separate loader |
| about 1–3 s | an indeterminate indicator where the content will appear, with text saying what is loading |
| about 3–10 s | a determinate indicator when the work can be measured; otherwise indeterminate plus status text |
| ≥ 10 s | percent done or a count ("Updating 3 of 50") and a way to cancel, or to continue in the background with a notification when done |

Place the indicator where the result will appear, use one indicator per cluster of loading items, avoid layout shift when content replaces it (FUN-07), and announce busy and finished states without moving focus (A11Y-15). Use a full-screen loader only when the whole app is blocked. Load progressively, most important data first. How indicators move is MOT-20 in motion.md.

**Why.** The bands combine Nielsen's limits with Primer's loading thresholds and NN/g's progress-indicator guidance: a loader under 1 s flickers, and an unexplained wait past 10 s loses people.

**Check.** `uie probe` runs each slow action and records timing and screenshots during the wait; `uie audit --checks live-regions` confirms the announcements.

**Fix.** Put the thresholds in the shared loader or data-fetching wrapper (show-delay, determinate mode, cancel), not in each view.

**Sources.** [HCI-067, PLAT-090, DSL-042]; Nielsen, Response Times; NN/g Progress Indicators; Primer Loading; Carbon Loading; Ant Design Feedback; Apple HIG Loading.

### CMP-11 · Skeletons
`level: advisory` · `modes: all` · `status: active` · `verify: D/P (uie capture loading state; uie diff --visual; uie audit --checks vitals)`

**Rule.** Use skeletons only for containers and data (cards, tiles, tables, lists), never for buttons, menus, dropdown items, toasts or dialogs. A skeleton mirrors the final layout's geometry, lasts only seconds, and is preferred to a spinner in the middle of content. Under reduced motion, drop the shimmer and keep the still blocks.

**Why.** A skeleton promises the shape of what is coming; when the shape is wrong, the content jumps on arrival and the promise breaks.

**Check.** Compare the loading capture with the loaded capture of the same view (`uie diff --visual`); layout shift from `uie audit --checks vitals` stays within FUN-07.

**Fix.** Build the skeleton from the same layout component as the content so both share dimensions.

**Sources.** [CRAFT-053, PLAT-090, IMP-019, DSL-036]; Carbon Loading; Vercel Web Interface Guidelines; impeccable `operate.md`.

### CMP-12 · Saving
`level: advisory` · `modes: Operate, Read` · `status: active` · `verify: I/A (uie journey; heuristic evaluator)`

**Rule.** Start with explicit save. Never mix autosave and explicit save in one form. One save button per form or page. Controls that describe part of a form (checkbox groups, selects) wait for the save; controls that act at once (a standalone toggle) save immediately and acknowledge it. Do not disable or hide the save button when the form is invalid or unchanged. When a save fails, keep the user's data, say why, and keep the message until it is resolved. Warn before leaving with unsaved changes.

**Why.** Mixed saving models leave people unsure what has been kept, and losing someone's work is among the worst things an interface can do.

**Check.** `uie journey` replays edit-and-save flows, including a failing save where a state recipe can force one, and confirms the data survives; the heuristic evaluator inventories each form for mixed models.

**Fix.** Choose the model per form in the shared form component; move immediate toggles out of explicit-save forms into their own section.

**Sources.** [PLAT-104, DSL-039]; Primer Saving; Vercel Web Interface Guidelines (unsaved changes); Tognazzini, First Principles (protect users' work); Apple HIG Sheets.

### CMP-13 · Feedback in proportion
`level: advisory` · `modes: all` · `status: active` · `verify: I/A (uie probe; uie audit --checks live-regions)`

**Rule.** Match the interruption to the significance. A routine success the user can already see gets no message, or a quiet inline change, and never a celebration. A routine success not visible elsewhere gets a short toast (≤ 3 lines) that reuses the trigger's verb. A problem with one field or item appears inline, next to it, until fixed. An important failure (data not saved, payment not taken) stays on screen inline or in a dialog, never only in an auto-dismissing toast. A critical, system-wide condition gets one banner at a time, and a modal only when the user must decide before continuing. A toast or notification with an action stays until dismissed; only action-free toasts dismiss themselves, after a few seconds (sources give 3–5 s) [practitioner values]. Keep auto-dismissing UI to a minimum and show the newest toast on top. Every message reaches a live region without moving focus (A11Y-15); wording follows CPY-07 and CPY-10 in content-copy.md.

**Why.** Over-alerting trains people to ignore alerts, and a failure that disappears after a few seconds may never be read.

**Check.** `uie probe` triggers success and failure paths and records which surface appears and for how long; `uie audit --checks live-regions` confirms the announcements.

**Fix.** Route all messages through one notification service with a severity-to-surface table, so each call site chooses a severity, not a component.

**Sources.** [PLAT-091, PLAT-122, CRAFT-056]; Carbon Notifications; Ant Design Feedback (failures in dialogs; default toast 3 s); Apple HIG Feedback and Accessibility; hallmark (no celebratory toast); Primer content (reuse the trigger's verb); Polaris and Atlassian message taxonomies (ideas only).

### CMP-14 · Empty states
`level: advisory` · `modes: all` · `status: active` · `verify: I/A (uie capture with empty and error recipes; heuristic evaluator)`

**Rule.** Name the kind of emptiness and design each one: first use (nothing created yet), no results (search or filter), cleared or completed (the user emptied it), no permission, and error (it failed to load). The anatomy is an optional relevant image, a specific title, one sentence on why it is empty and what to do, and one primary action (a tertiary one when several empty states share a screen). The empty state replaces the empty component, so no orphan table headers remain. Error empty states use alert iconography, not playful art; playfulness belongs to first use. Explain the feature, not just the absence. Never fill emptiness with invented data (SLP-12 in anti-slop.md).

**Why.** An empty screen is the first impression for every new user and a dead end if it offers nothing to do.

**Check.** Empty and error state recipes exist per view; the heuristic evaluator reviews the captures for type, anatomy and a working action.

**Fix.** One shared empty-state component with a variant per type; per-view copy follows CPY-11 in content-copy.md.

**Sources.** [PLAT-093, IMP-019]; Carbon Empty states; Primer Empty states (Blankslate); impeccable `clarify.md` and `onboard.md`; Apple HIG Writing.

### CMP-15 · Confirm or undo
`level: advisory` · `modes: all` · `status: active` · `verify: I/A (uie probe; heuristic evaluator)`

**Rule.** Reversible actions apply at once, rolling back with a persistent error if the server refuses, and offer Undo for a short window. Irreversible or high-cost actions ask for confirmation that names the object and the consequence, with a specific verb on the confirming button (CPY-06). Warn only about unexpected loss: moving an item to a trash folder needs no warning. The destructive option is never the default unless the user explicitly chose destruction; Cancel is always present, labelled Cancel, and never the default. Gesture-triggered destructive actions fire at the end of the gesture, not midway. Legal, financial and data-deleting submissions also need review, confirmation or reversal (WCAG 3.3.4, in accessibility.md).

**Why.** Confirmation dialogs on routine actions are clicked through by habit, so they stop protecting the actions that matter; undo protects without interrupting.

**Check.** `uie probe` performs each destructive action and records whether Undo appears or a confirmation names the object and consequence; the heuristic evaluator classifies actions as reversible or not.

**Fix.** Provide Undo through the shared notification component (CMP-13) and one confirmation pattern in the shared dialog (CMP-20).

**Sources.** [PLAT-092, HCI-069, DSL-040, DSL X13]; Apple HIG Alerts and Feedback; Vercel Web Interface Guidelines; wondelai heuristic conflicts (prefer undo); Rauno Freiberg (2023).

### CMP-16 · Buttons
`level: advisory` · `modes: all` · `status: active` · `verify: D/S/I (uie audit --checks states; uie lint; uie probe)`

**Rule.** One primary-styled action per region (page section, card, dialog or button group) and none inside table rows; at page level one primary action dominates. Within a group, buttons share one size and differ by style. Labels start with a verb and name the outcome; wording and case are CPY-03, CPY-06 and CPY-07 in content-copy.md. Placement follows one product-wide rule per context: in-page forms put the primary action first, aligned with the form's leading edge; dialogs put it at the trailing end with Cancel before it; both mirror in right-to-left layouts. A delayed action keeps its label, adds a spinner or a progress label ("Saving…"), and blocks a second submission. Icon-only buttons have an accessible name and a tooltip. Inputs and buttons placed side by side share a height.

**Why.** When several actions look primary, none is. Equal sizes keep a group scannable while style carries the emphasis, and a predictable position saves a search on every screen.

**Check.** `uie audit --checks states` counts accent-filled buttons per region and compares sizes within groups; `uie lint` flags icon-only buttons without names; `uie probe` double-submits to test the guard.

**Fix.** Encode primary, secondary, tertiary and destructive as variants of the shared button, and enforce placement in the shared form and dialog footers.

**Sources.** [PLAT-054, PLAT-063, PLAT-110, PLAT-111, PLAT-112, PLAT-113, CRAFT-053, 05 C13]; GOV.UK Button (one default button; preventing double clicks); Apple HIG Buttons; Carbon Forms; Primer Saving; Ant Design Buttons; Polaris (one primary per card, none in tables; ideas only).

### CMP-17 · Form labels, hints and marking
`level: advisory` · `modes: all` · `status: active` · `verify: D/I/A (uie audit --checks forms; heuristic evaluator)`

**Rule.** Every input has a visible, persistent label (A11Y-13 is the gate). Labels sit above the field by default, in one to three words, without a trailing colon in Latin-script interfaces. Mark whichever set is the minority, in words: "(optional)" when most fields are required, "(required)" when most are optional; an asterisk is never the only cue and needs a visible legend; follow the host design system where it already has a convention. Hints are one short sentence without links and always visible; placeholders hold only format examples. Personal-data fields carry `autocomplete` tokens and the right `type` and `inputmode`, and paste is never blocked (A11Y-14). Ask less: nothing that can be inferred, choices over typing (radio buttons or checkboxes up to about five options, a select or combobox beyond), an "I don't know" answer where valid, and nothing asked twice in one journey (WCAG 3.3.7). Long or unfamiliar consumer flows start with one question per page: a back link, the question as the page heading, and a Continue button; merge pages only for expert or repeated tasks.

**Why.** Top-aligned labels survive narrow screens, zoom and translation. Marking the minority in words avoids both visual noise and a legend nobody reads. One question per page reduces errors in flows people rarely repeat, which is GOV.UK's research-led default.

**Check.** `uie audit --checks forms` finds placeholder-only labels, missing `autocomplete`, blocked paste and asterisk-only marking; the heuristic evaluator reviews question order, inference and repetition along journeys.

**Fix.** Put label, hint, marking and error slot into one shared field component, and set `autocomplete` from a field-to-token table.

**Exceptions.** Dense desktop Chinese enterprise forms may right-align short labels with a colon at ≥ 1024 px, never mixed with top labels on one form (§5).

**Sources.** [PLAT-100, PLAT-101, PLAT-102, PLAT-103, HCI-071, TOOL-21, TOOL-22, DSL-039, DSL X12, 05 C8, 05 C9]; GOV.UK Question pages, Text input and Form structure; Carbon Forms; Apple HIG Entering data; NN/g required fields (2019).

### CMP-18 · Validation and error recovery
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie audit --checks forms; uie journey)`

**Rule.** Validate on submit or when moving to the next step, not while the user types and not on blur. Live feedback is kept for limits users cannot know in advance (character counts, password requirements) and for clearing an error as soon as it is fixed. After a failed submit of a multi-field form, show an error summary at the top that takes focus and links to each field, prefix the page title with "Error: ", and place a message next to each field in the label's own words; for a single field, move focus to it. Mark fields with `aria-invalid` and associate their messages (A11Y-13). Keep everything the user entered. Never signal an error by colour alone (A11Y-19). Reserve space for messages so they do not push the layout, and keep border width constant. Validate on the server as well, and turn off the browser's own validation bubbles where the product's error pattern replaces them. Message wording is CPY-04 (gate) and CPY-09 in content-copy.md.

**Why.** An error shown while someone is still typing accuses them of a mistake they have not finished making. A linked summary lets keyboard and screen-reader users find every problem, and lost input doubles the work. Apple's guidance to validate as values are entered, and other skills' validate-on-blur, are the counter-positions; this file follows GOV.UK's research-led default [05 C4].

**Check.** `uie audit --checks forms` submits empty and invalid data and checks text errors, `aria-invalid`, association, the focus target and preserved values; `uie journey` repeats this inside critical flows.

**Fix.** Implement the summary and inline message slots once in the shared form component and route every validation result through them.

**Sources.** [PLAT-094, PLAT-095, HCI-070, TOOL-21, CRAFT-053, CRAFT-055, 05 C4]; GOV.UK Validation, Error summary and Error message; WAI forms tutorial (notifications); Vercel Web Interface Guidelines; hallmark (reserved helper height).

### CMP-19 · Navigation state
`level: advisory` · `modes: all` · `status: active` · `verify: I/D (uie probe; uie journey; uie audit --checks keyboard)`

**Rule.** The current location is always shown with two cues (for example weight plus an indicator) and `aria-current`. The browser Back button returns to the previous view and restores its scroll position; question pages also show a back link. The URL reflects state worth sharing or returning to: filters, tabs, pagination, expanded panels. Links are real links (`<a href>`) that open in the same tab unless there is a reason, which is then stated ("opens in new tab"). Primary tasks stay visible at every width, not only behind an overflow menu or hover. No control or link leads to a section or page that does not exist. Navigation order and names stay the same across pages (A11Y-18).

**Why.** People navigate by asking where they are, where they can go and how to get back. Breaking Back or losing state on reload answers all three badly.

**Check.** `uie probe` applies filters and tabs, reloads and goes back, comparing URL, state and scroll; `uie journey` uses Back inside flows; `uie audit --checks keyboard` confirms links are focusable links.

**Fix.** Move state that matters into the URL in the router layer, and restore scroll there rather than per page.

**Sources.** [DSL-041, PLAT-003, PLAT-033, PLAT-126, TOOL-41]; Vercel Web Interface Guidelines; GOV.UK Question pages and Links; Apple WWDC17 Essential Design Principles (wayfinding questions).

### CMP-20 · Dialogs and overlays
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie audit --checks dialogs; uie probe)`

**Rule.** Use a modal only when the task needs an interruption or protected focus; otherwise use inline content, a side panel or a page. A modal meets the focus contract in A11Y-06 (focus moves in, Tab wraps, Esc closes, focus returns to the invoker). Initial focus goes to the first field, to a static element at the top of long content, or to the least destructive button in a destructive confirmation. One modal or alert at a time; no modal opens another. A scrim dims the page behind it (systems use about 32–60 % black). The title names the task, dismissal is always obvious, and closing with unsaved input asks first. Pair Done with Cancel or Back, never all three. Overlays escape clipping containers (native `<dialog>`, the popover API, fixed positioning or a portal), contain scrolling with `overscroll-behavior: contain`, and follow the stacking order in layout.md (LAY-15).

**Why.** Every modal interrupts, stacked modals lose people, and an overlay clipped by its parent or scrolling the page behind it looks broken.

**Check.** `uie audit --checks dialogs` opens each dialog from its state recipe and runs the contract; `uie probe` scrolls inside the overlay and checks that the page behind does not move.

**Fix.** One shared dialog built on the native element or an accessible primitive; never hand-roll focus trapping per screen.

**Sources.** [PLAT-073, PLAT-074, TOOL-08, CRAFT-055]; WAI-ARIA APG Dialog (Modal); Apple HIG Modality and Sheets; Material 3 elevation (32 % scrim); Arco (60 % mask); Carbon Notifications; impeccable `operate.md` and craft floor (modals only when needed).

### CMP-21 · Tooltips
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe; uie audit --checks keyboard)`

**Rule.** The first tooltip in a group opens after a hover delay; once one is open, neighbouring tooltips open instantly and without animation; keyboard focus opens a tooltip immediately. A tooltip can be dismissed with Esc without moving the pointer, can itself be hovered, and stays until dismissed (WCAG 1.4.13, in accessibility.md). Tooltips hold supplementary text only, never essential information or actions; prefer visible inline help. Exact delays vary by source (one gives 800–1000 ms on hover and 0 ms on focus) [unverified]; record yours as tokens.

**Why.** The delay stops tooltips from flashing while the pointer crosses a toolbar; after the first one the user has shown intent, so waiting again only slows them.

**Check.** `uie probe` hovers the first and next items and focuses each by keyboard, recording time to appearance, and presses Esc with the pointer still over the trigger.

**Fix.** Implement the group delay once in the shared tooltip provider.

**Sources.** [CRAFT-055, DSL-043, DSL X24, PLAT-041]; Vercel Web Interface Guidelines; Kowalski; hallmark (delay values); Ant Design Buttons (icon-only buttons need a tooltip).

### CMP-22 · Hardening fixtures
`level: advisory` · `modes: all` · `status: active` · `verify: I/D (uie journey; uie probe; uie audit --checks layout)`

**Rule.** Before calling a component done, exercise it with: names longer than 100 characters; empty values; emoji; right-to-left text; CJK text; 1,000+ items; offline and slow networks; HTTP 400, 401, 403, 404, 429 and 500, each with its own handling; rapid repeated submit; interrupted gestures (`pointercancel`, lost pointer capture, window blur); 200 % zoom; and text 30–40 % longer than the source language. Give text-holding flex and grid children `min-width: 0`, and use logical CSS properties, `Intl` formatting and real plural rules.

**Why.** Real content is longer, emptier and stranger than sample content, and generated interfaces are usually tried only with tidy sample data.

**Check.** Feed fixtures through the app's own seed data or state recipes; replay critical journeys with `uie journey`; probe repeated submits and network failures with `uie probe`; check layout with `uie audit --checks layout` (A11Y-09 covers 200 % text). Where the toolchain cannot produce an input (some gesture interruptions), record that fixture as not run rather than passed, and name the engine behind any gesture evidence.

**Fix.** In the shared component, wrap or truncate deliberately (`overflow-wrap: anywhere`, `min-width: 0`) while keeping the full value reachable; give each HTTP error its own message and recovery; guard submits in the shared form.

**Sources.** [IMP-048, IMP-047, DSL-054, TOOL-20]; impeccable `harden.md`; Vercel Web Interface Guidelines; ui-ux-pro-max text-layout rules.

## 3. Decisions to make

Record these in the components section and decisions log of `DESIGN.md`. Operate surfaces lean on convention and keep density constant within a page; Persuade surfaces still use standard controls and spend distinctiveness on the brand layer (P3). Platform profiles (`apple`, `material`, `fluent`, `enterprise-zh`) change defaults such as button case, target size and focus style, never the floors (FRAMEWORK §12.3).

1. **State model**: overlay opacities or ramp steps, and how selected differs from hover (CMP-07).
2. **Focus style**: ring or two-colour indicator, width, offset, colour and radius rule (CMP-08).
3. **Disabled policy and tokens**: one system's opacities; when to disable, make read-only or hide (CMP-09).
4. **Validation timing**: submit-time by default, with the live exceptions listed (CMP-18).
5. **Saving model** per form or surface (CMP-12).
6. **Required or optional marking and label alignment**, including any zh enterprise exception (CMP-17).
7. **Button hierarchy and placement** per context (CMP-16).
8. **Severity-to-surface table** for messages, toast timing and persistence (CMP-13).
9. **Loading strategy** per component: skeleton, inline spinner or progress, with show-delay and minimum time (CMP-10, CMP-11, MOT-20).
10. **Empty-state art policy** per type (CMP-14).
11. **Reversible and irreversible actions**: which get Undo and which get confirmation (CMP-15).
12. **Tooltip delay tokens** (CMP-21).

Two briefs, two sets of answers. A veterinary clinic's booking flow, used rarely by anxious owners, suits one question per page, submit-time validation, a review step and a confirmation page. A bicycle-parts inventory used all day by staff suits a dense single-page record form with explicit save, immediate toggles in their own section, and Undo instead of confirmation for routine edits. Neither is the default; the users and their frequency decide.

## 4. How to fix common failures

Fix at the narrowest correct layer (token, then shared component, then local), one finding at a time, then re-run the originating check, the adjacent happy path and `uie diff` against the baseline (FRAMEWORK §10).

| Failure | Narrowest fix | Verify |
|---|---|---|
| No hover or pressed styling | Token layer: state model applied by the shared component | `uie audit --checks states` |
| `outline: none` with no replacement | Global focus style from focus tokens | `uie lint`; `uie audit --checks keyboard` |
| Focus hidden under a sticky header | Global `scroll-padding-top` matching the header | `uie audit --checks keyboard` |
| Primary submit disabled until the form is valid | Shared form: enable it, validate on submit, add the error summary | `uie audit --checks states,forms` |
| Placeholder used as the only label | Shared field component with a persistent label | `uie audit --checks forms` |
| Errors shown while typing, or input lost on error | Shared validation layer | `uie audit --checks forms`; `uie journey` |
| Static "Loading…" or a long blank wait | Shared loader choosing the indicator by duration | `uie probe` |
| Skeleton shape differs from the content | Build the skeleton from the content's layout component | `uie diff --visual`; `uie audit --checks vitals` |
| Failure shown only in an auto-dismissing toast | Notification service severity table | `uie probe`; `uie audit --checks live-regions` |
| Empty table with headers and no guidance | Shared empty-state component | state-recipe capture; heuristic evaluator |
| Confirmation dialog on every routine delete | Undo through the shared notification component | `uie probe` |
| Several primary buttons in one card | Button variants; one primary per region | `uie audit --checks states` |
| Filters lost on reload or Back | Router: state in the URL, scroll restored | `uie probe` |
| A modal opening another modal | Dialog service allowing one at a time | `uie audit --checks dialogs` |
| Long names overflow or overlap | Shared component: `min-width: 0` and deliberate wrapping | `uie audit --checks layout` |

## 5. CJK and localisation notes

- **IME.** Enter-to-submit handlers return early while text is being composed (`event.isComposing`, or `keyCode` 229), or Chinese, Japanese and Korean users submit half-typed text; `uie lint` flags missing guards [TOOL-20].
- **Label alignment.** Ant Design right-aligns short labels on the colon in dense zh enterprise forms. Allow it only on desktop at ≥ 1024 px with short labels, never mixed with top-aligned labels on one form; everywhere else labels sit on top [05 C8].
- **Required marking.** Semi marks required fields with a red asterisk; the rule in CMP-17 still applies: an asterisk is never the only cue and comes with a legend [05 C9].
- **Height and expansion.** Budget for translated text 30–40 % longer than the source (Material 3 notes translations can run about 1.5 times longer), and for CJK scripts needing taller line boxes (Material 3 adds about 7 %). Buttons, inputs and chips therefore use minimum heights, never fixed heights [PLAT-021; IMP-048].
- **Copy and formats.** 抱歉 only for system faults, one consistent 你 or 您, dates and times in components: see content-copy.md and [cjk.md](cjk.md).
- **Right-to-left.** Button order and directional icons mirror; digits, logos, clocks and checkmarks do not [PLAT-138].

## Sources

Research adopt items: CRAFT-047, CRAFT-053, CRAFT-055, CRAFT-056, IMP-019, IMP-020, IMP-047, IMP-048, PLAT-003, PLAT-021, PLAT-033, PLAT-040, PLAT-041, PLAT-050 to PLAT-054, PLAT-063, PLAT-070, PLAT-073, PLAT-074, PLAT-090 to PLAT-095, PLAT-100 to PLAT-104, PLAT-110 to PLAT-113, PLAT-122, PLAT-126, PLAT-138, PLAT-141, HCI-067, HCI-069 to HCI-071, TOOL-06 to TOOL-09, TOOL-13, TOOL-17, TOOL-20 to TOOL-22, TOOL-41, DSL-036 to DSL-043, DSL-054; conflict rulings 02 X12, X13, X24; 05 C3, C4, C8, C9, C13, C18; 06 X12.

- Nielsen, Response Times: The 3 Important Limits, 1993 (updated 2014), https://www.nngroup.com/articles/response-times-3-important-limits/
- NN/g, Progress Indicators, https://www.nngroup.com/articles/progress-indicators/
- NN/g, Marking Required Fields in Forms, 2019, https://www.nngroup.com/articles/required-fields/
- GOV.UK Design System: Button, Question pages, Text input, Validation, Error summary, Error message, Links, Focus states, 2026, https://design-system.service.gov.uk/
- GOV.UK Service Manual, Form structure, 2026, https://www.gov.uk/service-manual/design/form-structure
- Primer UI patterns: Loading, Saving, Empty states, Degraded experiences (MIT), 2026, https://primer.style/product/ui-patterns/
- IBM Carbon patterns: Disabled states, Loading, Empty states, Notifications, Forms (Apache-2.0), 2026, https://carbondesignsystem.com/patterns/
- Material Design 3 interaction states and elevation (Apache-2.0 token code), 2026, https://m3.material.io/foundations/interaction/states
- Apple Human Interface Guidelines: Buttons, Entering data, Feedback, Loading, Modality, Alerts, Sheets, Menus, 2026, https://developer.apple.com/design/human-interface-guidelines/
- Apple WWDC17, Essential Design Principles, 2017, https://developer.apple.com/videos/play/wwdc2017/802/
- Microsoft Fluent 2 colour and states (MIT), 2026, https://fluent2.microsoft.design/color
- Radix Colors scale (MIT), 2026, https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Ant Design spec: Feedback, Buttons (MIT), 2026, https://ant.design/docs/spec/feedback-cn
- Shopify Polaris and Atlassian Design System (ideas only; licences restrict reuse), 2026, https://shopify.dev/docs/apps/design and https://atlassian.design/
- W3C WAI-ARIA Authoring Practices: Dialog (Modal), Keyboard interface, 2026, https://www.w3.org/WAI/ARIA/apg/
- W3C WAI forms tutorial, Notifications, https://www.w3.org/WAI/tutorials/forms/notifications/
- W3C, WCAG 2.2 (SC 1.4.13, 2.4.7, 2.4.13, 2.5.5, 2.5.8, 3.3.4, 3.3.7), 2024, https://www.w3.org/TR/WCAG22/
- Tognazzini, First Principles of Interaction Design, https://asktog.com/atc/principles-of-interaction-design/
- Vercel Web Interface Guidelines (MIT), 2026, https://github.com/vercel-labs/web-interface-guidelines
- impeccable `operate.md`, `clarify.md`, `onboard.md`, `harden.md` (Apache-2.0), 2026, https://github.com/pbakaus/impeccable
- hallmark (MIT), 2026, https://github.com/Nutlope/hallmark
- Kowalski, emilkowalski/skills (MIT), 2026, https://github.com/emilkowalski/skills
- Freiberg, Invisible Details of Interaction Design, 2023, https://rauno.me/craft/interaction-design

Contains public sector information licensed under the Open Government Licence v3.0.
