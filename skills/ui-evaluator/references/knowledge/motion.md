# Motion

This file covers whether an interface should move and how: frequency, purpose, durations, easing, choreography, interruption, reduced motion, loading indicators and scroll. It serves gate G3 (MOT-01 to MOT-07) and defines the motion tokens and budget that DEC-02 requires in `DESIGN.md`. Motion tells (SLP-09, SLP-11, SLP-26) are catalogued in [anti-slop.md](anti-slop.md); WCAG motion criteria live in [accessibility.md](accessibility.md); which loading indicator to show and when is owned by [components-states.md](components-states.md). Read this file when setting motion tokens in `direct`, before adding any transition or animation in `build`, and when fixing an MOT finding.

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules): gate MOT-01 to MOT-07, advisory MOT-08 to MOT-21
3. [Decisions to make](#3-decisions-to-make)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles

1. **Frequency decides first.** The more often an interaction happens, the less it should move. A transition that pleases on the first use becomes a delay on the hundredth.
2. **Every animation has one job.** Spatial continuity, a state change, feedback, explanation, or softening a jarring change. Motion without a job costs attention and reads as template decoration.
3. **Motion answers the user.** Feedback to an action is welcome on every surface. Motion nobody asked for is rationed by surface mode, because on working and reading surfaces it competes with the task (P4 restraint).
4. **Quick to arrive, quicker to leave, never in the way.** People wait for every animation they watch, so durations stay short, exits are shorter than entrances, and input works mid-animation.
5. **Decide once, reference everywhere.** Durations and curves are tokens chosen for this brand. Values improvised per component drift apart, and a framework default applied to everything is the absence of a decision.
6. **Gentler, not broken.** Under reduced motion, spatial movement goes and meaning stays. No information depends on motion alone, and no content waits for an animation to become visible.

## 2. Rules

Gate rules come first and repeat the G3 thresholds exactly. Advisory rules (`level: advisory`) raise findings for the design panel and the code reviewer but never fail G3 on their own. Check names in `--checks` follow `uie audit --help`.

### MOT-01 · Animated properties
`gate G3` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit --checks motion)`

**Rule.** No `transition: all`; no transitions or animations on layout properties (width, height, top, left, right, bottom, margin, padding).

**Why.** Layout properties make the browser recompute layout on every frame, which drops frames on ordinary hardware. `transition: all` animates properties nobody chose, including ones added later. Moves and size changes look the same when done with `transform`, at a fraction of the cost.

**Check.** `uie lint` finds `transition: all`, Tailwind's `transition-all`, `all` in `transition-property`, and layout properties in transitions, keyframes and animation-library props. `uie audit --checks motion` reads computed `transition-property` and the running animations in the rendered page.

**Fix.** Name the properties in the shared transition utility or token (for example opacity and transform). Replace moves with `translate`, size changes with `scale` or a FLIP technique (measure, invert, play), and expand or collapse with opacity plus a transform on the revealed content.

**Sources.** [CRAFT-051, IMP-022, DSL-046]; Vercel Web Interface Guidelines; impeccable `layout-transition`.

### MOT-02 · Duration budget
`gate G3` · `modes: all (by mode)` · `status: active` · `verify: S/D (uie lint; uie audit --checks motion)`

**Rule.** State and feedback transitions ≤ 300 ms (≤ 250 ms on Operate surfaces); overlays (dialogs, drawers, popovers, menus) and page or view transitions ≤ 500 ms; background scrim dimming ≤ 700 ms; one declared focal entrance ≤ 800 ms; interactions declared frequent ≤ 150 ms. Continuous indicators (spinners, progress bars) are out of scope.

**Why.** Users wait for every animation they watch. Longer durations read as sluggish, and frequent interactions pay that cost many times a day. These ceilings are the cross-system consensus; per-mode values are in §3.

**Check.** `uie lint` reads durations from CSS, motion tokens and animation-library props. `uie audit --checks motion` reads `transition-duration`, `animation-duration` and Web Animations timings in the rendered page. Declare each animation's class (state, overlay, focal, frequent) in the motion table of `DESIGN.md` so the right ceiling applies. An overlay here is a layer that opens above the page: popover, menu, toast, dialog, drawer or sheet.

**Fix.** Change the duration token, not the component. If a long animation exists to cover a slow operation, show progress instead (MOT-20; CMP-10 in components-states.md).

**Exceptions.** Continuous indicators (spinners, progress bars) are not transitions; they follow MOT-20. Scroll-linked effects follow MOT-21. Scrim dimming behind a modal may take up to 700 ms because it is peripheral and nobody waits on it [PLAT-080].

**Sources.** [CRAFT-049, IMP-021, PLAT-080, DSL-047]; NN/g animation duration (Laubheimer 2020); Material 3, Carbon and Fluent duration tokens.

### MOT-03 · No overshoot on UI state changes
`gate G3` · `modes: all` · `status: active` · `verify: S (uie lint)`

**Rule.** No `cubic-bezier` with y1 or y2 outside [−0.1, 1.1], and no bounce or elastic animations, unless `DESIGN.md` declares a playful brand or the motion is gesture-driven.

**Why.** Overshoot on a menu, toggle or dialog makes routine state changes feel toy-like, and bounce easing is one of the most-cited generated-UI motion tells. Physical overshoot makes sense only where a finger or pointer supplies momentum.

**Check.** `uie lint` flags such curves, animation names containing bounce, elastic, wobble, jiggle or spring, Tailwind `animate-bounce`, and spring configs with visible bounce outside gesture handlers.

**Fix.** Swap the curve for the declared enter, exit or move token (MOT-11). If overshoot is wanted, record the playful-brand decision or tie the spring to a gesture (MOT-18).

**Exceptions.** Gesture-driven motion (drag release, swipe dismiss, pull). A playful brand recorded in `DESIGN.md`. Material 3 Expressive spatial curves overshoot by design (its web conversions reach y1 = 1.67), so adopting them is a playful declaration, not a default.

**Sources.** [CRAFT-050, CRAFT-028, IMP-022, DSL X25, 07 C9]; impeccable `bounce-easing`; Material 3 motion physics web table.

### MOT-04 · Reduced motion
`gate G3` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit --checks motion under reduced-motion emulation)`

**Rule.** Every animation has a `prefers-reduced-motion` path; under emulated `reduce`, no infinite or large-displacement animation remains, except essential progress indicators, which may continue in a subtle, non-spatial form; ≤ 150 ms opacity or colour feedback may stay. Large displacement, measured while the animation runs under `reduce`: a translation of an element by ≥ min(200 CSS px, one third of the viewport along that axis); a scale change by ≥ 1.25× or ≤ 0.8× of an element whose box covers ≥ 25% of the viewport area; a rotation by ≥ 90°; or any movement of content in response to scroll (parallax, scroll-linked transforms) **[calibrating]** (ADR-032).

**Why.** Large movement, zoom and parallax can cause dizziness or nausea for people with vestibular conditions, and the operating-system setting is how they ask for less. Deleting every animation also deletes meaning, so short opacity or colour feedback stays. The limits make "large" computable; smaller spatial movement still belongs in MOT-19's substitutions.

**Check.** `uie lint` requires a reduce path for each keyframe set and transition. `uie audit --checks motion` re-renders each route under `reducedMotion: 'reduce'`, lists the infinite animations still running, and measures each running animation or transition against the four limits: translation distance per axis against min(200 px, a third of the viewport on that axis), scale factor on elements whose box covers ≥ 25% of the viewport, rotation angle, and any transform that changes with the scroll position.

**Fix.** Put the substitution in the token layer, not in each component: under `reduce`, distance and scale tokens go to their resting values and spatial durations to zero, while the feedback duration token stays ≤ 150 ms. Substitutions per animation type are in MOT-19.

**Exceptions.** Essential progress indicators stay under reduced motion in a subtle form [PLAT-084]: a slow opacity pulse or a determinate bar, not a spinning or sweeping movement. Where possible, pair the indicator with status text that changes as work proceeds, so CMP-04 passes even when the animation is minimal.

**Sources.** [CRAFT-052, TOOL-18, DSL X9, DSL-048, PLAT-084]; ADR-032; Apple HIG Accessibility (Reduce Motion); WCAG 2.2 SC 2.2.2 and 2.3.3.

### MOT-05 · Content visible at rest
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks motion)`

**Rule.** After load and a full scroll, no text remains hidden by an unfinished reveal animation.

**Why.** Reveal-on-scroll code fails silently: a script error, a missed intersection event or a capture taken mid-animation leaves sections blank, and a blank section then gets "fixed" as if content were missing (EVD-03).

**Check.** `uie audit --checks motion` loads each route, scrolls to the end and back, lets animations settle, then measures text at `opacity: 0`, `visibility: hidden` or clipped by a reveal transform.

**Fix.** Make the visible state the CSS default and let script add the entrance class only when it runs. Start reveals from an already-visible state, and never gate text on an observer callback.

**Exceptions.** Content the user collapses or opens on purpose (accordions, disclosures, tabs).

**Sources.** [IMP-022, CRAFT-051, IMP-031]; impeccable `content-hidden-at-rest`.

### MOT-06 · No scale-from-zero entrances
`gate G3` · `modes: all` · `status: active` · `verify: S (uie lint)`

**Rule.** No entrance starting at `scale(0)`.

**Why.** Nothing physical appears from a point. Growing from zero reads as a pop and takes the longest possible path; starting near full size with transparency reads as arriving.

**Check.** `uie lint` flags `scale(0)`, `scale: 0` and animation-library initial states with scale 0 on entering elements.

**Fix.** Start from a scale token in the 0.9 to 0.97 range (sources differ; choose one) together with opacity 0, and set the origin per MOT-16.

**Sources.** [CRAFT-051, DSL-046]; Kowalski `emil-design-eng`.

### MOT-07 · Mode budget
`gate G3` · `modes: all (by mode)` · `status: active` · `verify: S/D (uie audit --checks motion; uie lint)`

**Rule.** Operate and Read: no non-user-triggered choreography beyond one page fade; Persuade: ≤ 1 orchestrated sequence per screen; Experience: as declared in `DESIGN.md`, default ≤ 1 orchestrated sequence per screen.

**Why.** On surfaces where people work or read, motion nobody asked for competes with the task. On persuasive surfaces one authored moment carries the brand, while several compete and read as template motion.

**Check.** `uie audit --checks motion` counts animations that start without user input, on load and on scroll, per route. `uie lint` finds entrance variants and scroll-triggered reveals and compares them with the focal sequence declared in `DESIGN.md`.

**Fix.** Delete section-by-section entrances. Keep one sequence on the first viewport (Persuade) or none (Operate, Read). Motion that answers a user action is feedback, not choreography, and stays.

**Sources.** [IMP-021, PLAT-083, CRAFT-048, 07 C11]; FRAMEWORK §4.1 surface modes; Anthropic frontend-design v3 (per-section entrances read as generated).

### MOT-08 · Frequency budget
`level: advisory` · `modes: all; strictest on Operate` · `status: active` · `verify: A/I (frequency map review; uie probe; uie lint)`

**Rule.** Decide whether to animate by how often the interaction happens. Keyboard-initiated actions and actions used about 100 or more times a day (command menus, shortcuts, context menus, keyboard list navigation) get no animation. Actions used tens of times a day (hover, tab switches, row selection) get none, or stay within the frequent ceiling of MOT-02. Occasional surfaces (dialogs, drawers, toasts) use the bands in MOT-10. Rare and first-run moments may carry delight, within MOT-07.

**Why.** Practitioners who built keyboard-driven tools found that animations which felt good at first felt sluggish after days of use, and system context menus open without motion. Frequency overrides every other motion rule [DSL X15].

**Check.** `DESIGN.md` holds a frequency map (interaction, tier, motion). Compare it with the animation inventory from `uie audit --checks motion`; `uie probe` a keyboard path (for example opening a menu by shortcut) and confirm the result appears without a transition; `uie lint` flags transitions on components the map marks high-frequency.

**Fix.** Remove the transition, or keep it only for pointer-initiated opening. Drop tens-per-day items to the frequent token or to zero.

**Sources.** [CRAFT-048, DSL-044, DSL X15]; Kowalski `review-animations/STANDARDS.md`; Rauno Freiberg (2023); Carbon motion checklist; Atlassian motion (ideas only).

### MOT-09 · Purpose and the removal test
`level: advisory` · `modes: all` · `status: active` · `verify: A (motion table review; uie audit --checks motion)`

**Rule.** Each animation records one purpose: spatial continuity, state change, feedback, explanation, or softening a jarring change. Then apply the removal test: if removing it loses no information or context, remove it; if average users notice it often, reduce it. Drop any view transition whose meaning cannot be stated.

**Why.** Looking good is not a purpose. Mature systems reach the same test from different directions (Atlassian, TDesign, Carbon), and so do craft sources; motion clichés such as hover zoom on images or the same entrance on every section are what is left when the test is skipped (SLP-09, SLP-26 in anti-slop.md).

**Check.** The motion table in `DESIGN.md` lists each animation with its purpose. Animations from `uie audit --checks motion` that are missing from the table, or whose only purpose is brand on an Operate or Read surface, are findings.

**Fix.** Use the remedial order: delete, reduce, fix the easing, fix the origin, make it interruptible, move it to compositor properties, tune asymmetric timing, and only then polish. Removing beats adding.

**Sources.** [PLAT-085, DSL-045, DSL-066]; Kowalski `review-animations`; TDesign motion self-check; Carbon motion checklist; Vercel `react-view-transitions`; Atlassian motion (ideas only).

### MOT-10 · Duration bands by component
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit --checks motion)`

**Rule.** Set duration tokens from bands per component type, always inside the MOT-02 ceilings. Durations grow with distance and area moved; size a desktop drawer by its distance rather than by doubling a mobile value [05 C11].

| Component or change | Band in sources | MOT-02 class |
|---|---|---|
| Press, hover, toggle feedback (colour, opacity) | 70–160 ms (Carbon fast-01 70; Kowalski press 100–160; impeccable 100–150) | state ≤ 300 ms; frequent ≤ 150 ms |
| Tooltip, small popover | 125–200 ms (Kowalski) | overlay ≤ 500 ms |
| Dropdown, menu, select | 150–250 ms (Kowalski) | overlay ≤ 500 ms |
| In-place state change (expand, tab panel, selection) | 150–300 ms; 150–250 ms on Operate (impeccable) | state ≤ 300 ms (Operate ≤ 250) |
| Toast or snackbar | about 240 ms (Carbon moderate-02) | overlay ≤ 500 ms |
| Dialog, drawer, sheet | 200–500 ms (Kowalski; NN/g 200–300; Material 3 enter 400, exit 200) | overlay ≤ 500 ms |
| Page or view transition | 300–500 ms (impeccable); a quick fade for top-level navigation (Fluent, Material 3) | overlay and page class (≤ 500 ms); on Operate and Read only the one page fade (MOT-07) |
| One authored focal entrance | 500–800 ms (impeccable) | focal ≤ 800 ms, one per screen |

**Why.** Bands keep similar components feeling alike across a product. For calibration, Material 3 tokens run short 50–200, medium 250–400, long 450–600 and extra-long 700–1,000 ms; Carbon uses 70, 110, 150, 240, 400 and 700 ms; Ant Design uses 100, 200 and 300 ms. One framework default on every element (Tailwind's 150 ms, as of v4.3) is not a choice.

**Check.** `uie lint` maps each duration literal or token to a band. `uie audit --checks motion` reads running durations; a duration outside the band for its declared component type is reported.

**Fix.** Define `--motion-duration-*` tokens by role (feedback, small overlay, menu, state, overlay, view, focal) and point components at them.

**Sources.** [CRAFT-049, PLAT-080, DSL-047, IMP-021, 05 C11]; Kowalski; NN/g (Laubheimer 2020); Material 3, Carbon, Fluent and Ant Design tokens; impeccable `animate.md`.

### MOT-11 · Easing tokens, defined once
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint; uie tokens check)`

**Rule.** Choose one easing family and define it once, by role: enter (decelerate), exit (accelerate, or a short ease-out per MOT-12), move (standard or in-out, for elements travelling on screen) and hover or colour change. Components reference only these tokens. Linear is reserved for constant motion (spinners, progress fill) and for opacity running alongside other motion. No ad-hoc curves inside components.

**Why.** Two failures are both real: curves improvised per component drift (one baseline skill bans custom curves for that reason), and the browser's built-in curves are often too weak to feel responsive (craft sources require custom ones). Tokens defined once settle both [DSL X3]. The values are a brand decision; this file recommends none. Illustrations from systems, as `cubic-bezier` parameters:

| Role | Material 3 (legacy tokens) | Carbon productive | Carbon expressive | Kowalski |
|---|---|---|---|---|
| Enter | `0.05, 0.7, 0.1, 1` | `0, 0, 0.38, 0.9` | `0, 0, 0.3, 1` | `0.23, 1, 0.32, 1` |
| Exit | `0.3, 0, 0.8, 0.15` | `0.2, 0, 1, 0.9` | `0.4, 0.14, 1, 1` | same as enter (no ease-in) |
| Move | `0.2, 0, 0, 1` | `0.2, 0, 0.38, 0.9` | `0.4, 0.14, 0.3, 1` | `0.77, 0, 0.175, 1` |

Fluent (decelerate-max `0.1, 0.9, 0.2, 1`; easy-ease `0.33, 0, 0.67, 1`), Ant Design (`easeOutCirc` `0.08, 0.82, 0.17, 1`) and impeccable (expo out `0.16, 1, 0.3, 1`) are further families. Two briefs, two answers: a logistics dashboard used all day suits a low-amplitude productive family, so motion stays below notice; a poetry archive's launch page may take an expressive family for its single focal entrance. Neither is a default.

**Check.** `uie lint` flags `cubic-bezier()` literals and keyword easings outside the token file, and `linear` on spatial motion. `uie tokens check` confirms the motion tokens exist in `DESIGN.md` and are referenced.

**Fix.** Add the role tokens (`--ease-enter`, `--ease-exit`, `--ease-move`, `--ease-state`) to `DESIGN.md` and the CSS token layer, record the source family and the reason, and replace literals with the tokens.

**Sources.** [PLAT-081, PLAT-082, CRAFT-050, DSL-047, DSL X3]; Material 3 motion tokens; Carbon motion; Fluent tokens; Kowalski; Ant Design motion; ibelick `baseline-ui`.

### MOT-12 · Enter and exit asymmetry
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit --checks motion)`

**Rule.** Entering elements decelerate into place. Exits are shorter than entrances, about 60–75 % of the entrance duration [practitioner range]. An exit nobody waits for may accelerate out with an ease-in curve only if it lasts ≤ 200 ms; otherwise exits use the strong ease-out. Elements leaving for good accelerate out; elements that will come back (a collapsed panel, a minimised sheet) come to rest.

**Why.** People watch an entrance and wait for an exit to clear the way. A long ease-in exit delays the moment they care about, which is why sources disagree about ease-in; this resolution keeps the speed without the delay [07 C9].

**Check.** `uie lint` pairs enter and exit durations per component (the same selector or variant pair) and flags ease-in curves on exits longer than 200 ms.

**Fix.** Derive exit tokens from entrance tokens in the token layer and use the pair in the shared component.

**Sources.** [PLAT-081, CRAFT-050, DSL-047, 07 C9]; NN/g (exits 200–250 ms against entrances of 300 ms); Material 3 easing and duration; Kowalski.

### MOT-13 · Stagger caps
`level: advisory` · `modes: Persuade, Experience; user-triggered lists anywhere` · `status: active` · `verify: S/D (uie lint; uie audit --checks motion)`

**Rule.** Stagger only lists that appear because of a user action, or sequences on expressive pages. Use one per-item offset token between 20 and 80 ms and cap the whole sequence at ≤ 500 ms; items past the cap appear together. No staggered entrance on the first load of Operate or Read surfaces. A stagger never delays input.

**Why.** A short stagger helps the eye read a set as ordered; a long one makes the last item wait. Systems disagree on whether to stagger at all (Fluent favours it, TDesign rules it out on the first load of business apps, Carbon caps it); the cap and the first-load rule settle that [05 C10].

**Check.** `uie lint` reads delay increments (index-based `calc()` delays, library stagger settings). `uie audit --checks motion` measures the start of the first and last animation in a group.

**Fix.** Replace per-item delays with the stagger token and a capped index (`min(index, n)` times the token).

**Exceptions.** Very large groups get no stagger at all.

**Sources.** [PLAT-083, CRAFT-049, DSL-047, 05 C10]; Carbon choreography (about 20 ms per item, ≤ 500 ms total); Kowalski (30–80 ms); Fluent motion; TDesign motion.

### MOT-14 · Choreography
`level: advisory` · `modes: all` · `status: active` · `verify: A/D (uie audit --checks motion; uie probe)`

**Rule.** One focal animation at a time. Related elements move together, with the same duration and curve. Motion travels along layout axes, not diagonals; a move across both axes follows a curved path. Top-level navigation between unrelated destinations uses a quick fade; directional slides are kept for hierarchical (list to detail) or ordered (previous, next) navigation, never for lateral tab switches. The same meaning always gets the same motion: forward affirms, reverse cancels. Components grow away from the edge they belong to: a top menu grows down, a bottom snackbar grows up.

**Why.** Competing motions split attention. A consistent motion vocabulary lets people predict the interface, and a slide implies a spatial relationship that does not exist between top-level destinations.

**Check.** `uie audit --checks motion` reports overlapping animations by start time and target. `uie probe` captures frames of navigation for the reviewer to judge direction and grouping.

**Fix.** Animate related elements as one container; replace top-level slides with the fade token; delete the competing animation rather than delaying it.

**Sources.** [PLAT-086, 07 §3.9]; Carbon choreography; Fluent motion; Material 3 transitions (fade-through; enter and exit by edge); TDesign axis motion; Vercel `react-view-transitions`; Atlassian (one focal point; ideas only).

### MOT-15 · Interruptible motion
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe)`

**Rule.** Input works during every animation. A second action retargets the animation from its current value instead of queueing behind it, so rapidly toggled UI (menus, toggles, accordions) uses CSS transitions or other retargetable animations rather than fixed keyframes. Intro animations do not replay on repeat visits, and no flourish delays the completion of a task.

**Why.** An animation that blocks input or runs to its end before the next action makes the interface feel slower than its server.

**Check.** `uie probe` performs the action twice in quick succession (open, close, open) and checks that the final state matches the last action and that clicks during the animation register.

**Fix.** Move from keyframes to transitions on state classes; remove `pointer-events: none` during animations; remember that an intro has been seen.

**Sources.** [PLAT-083, CRAFT-051]; Kowalski (transitions over keyframes); Apple HIG Motion (brief and cancellable); impeccable `delight.md`.

### MOT-16 · Origin and scale
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit --checks motion)`

**Rule.** Popovers, dropdowns, menus and tooltips scale and fade from their trigger (`transform-origin` at the trigger edge). Modals stay centred and scale from the centre. Entrances start near full size (MOT-06). If the brand uses a press scale, it stays small (sources give 0.95 to 0.98) and short (100–160 ms), and it never shifts layout.

**Why.** Motion that starts at the trigger shows where the new layer came from; a centre-origin popover looks detached from the thing that opened it.

**Check.** `uie audit --checks motion` reads the `transform-origin` of entering overlays and compares it with the trigger's position.

**Fix.** Set the origin from the positioning logic in the shared popover component (for example a `--transform-origin` variable exposed by the popover primitive).

**Sources.** [CRAFT-051, DSL-046]; Kowalski; Vercel Web Interface Guidelines (correct `transform-origin`).

### MOT-17 · Compositor-friendly properties
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit --checks motion)`

**Rule.** Movement and scaling use `transform`; appearance uses `opacity`; colour and background transitions are fine for state feedback. Do not animate large `filter`, `backdrop-filter` or blur surfaces (a small blur, around 2 px and never above 20 px, may mask a crossfade). Do not drive child transforms through a changing parent custom property. Apply `will-change` only while an animation runs. Prefer CSS transitions, then the Web Animations API, then script-driven animation.

**Why.** Transform and opacity can run on the compositor. Large blurs and per-frame style recalculation drop frames, and Apple lists jittery motion among the craft failures people notice.

**Check.** `uie lint` flags animated `filter` and `backdrop-filter`, permanent `will-change`, and scroll or animation handlers that write styles every frame.

**Fix.** Rewrite the animation in the shared component with transform and opacity; remove permanent `will-change`.

**Sources.** [CRAFT-051, DSL-046]; Vercel Web Interface Guidelines; Kowalski performance cheatsheet; ibelick `baseline-ui`.

### MOT-18 · Springs and overshoot, when allowed
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint)`

**Rule.** Use springs only for gesture-driven motion (drag, swipe, pull, fling) or for a brand that recorded playfulness in `DESIGN.md`. Keep bounce small: Kowalski gives a Motion-style `bounce` of 0.1 to 0.3 for drag and playful cases, and Material 3's standard scheme uses a damping ratio of 0.9 for spatial motion; the two scales are different parameterisations and their equivalence is [unverified]. Springs act on spatial properties only, never on colour or opacity. Gestures dismiss on release velocity as well as distance (Kowalski cites about 0.11 px/ms), apply friction at boundaries, capture the pointer and ignore extra touches.

**Why.** A finger supplies momentum, so a spring that carries it reads as physical. The same spring on a settings toggle reads as a toy.

**Check.** `uie lint` finds spring configs and checks that each sits in a gesture handler or in a component named in the playful declaration.

**Fix.** Replace springs on plain state changes with the enter and move tokens (MOT-11).

**Sources.** [CRAFT-050, PLAT-082, DSL-047, DSL X25]; Kowalski; Material 3 motion physics; Rauno Freiberg (2023).

### MOT-19 · Reduced-motion substitutions
`level: advisory` · `modes: all` · `status: active` · `verify: D/A (uie audit --checks motion with and without reduced motion)`

**Rule.** Under `reduce`: translate, scale, zoom, parallax, depth, blur and scroll-linked motion become a crossfade or an instant change; autoplay stops; springs settle without overshoot; opacity or colour feedback of ≤ 150 ms stays (MOT-04). No information is carried by motion alone: every animated change ends in a visible still state, text or icon. Gate decorative hover motion with `(hover: hover) and (pointer: fine)`, but never gate information or functions on pointer queries, which are unreliable.

**Why.** Reduced motion means gentler, not broken. Ignoring the setting fails the user, and so does deleting every cue that something changed [DSL X9]. MOT-04 gates only large displacement; this rule asks for the gentler path on smaller spatial motion too.

**Check.** `uie audit --checks motion` compares the animation inventory with and without the emulation; the accessibility auditor confirms state changes stay understandable in the reduced-motion captures.

**Fix.** Implement substitutions in the motion tokens (distances to zero, spatial durations to zero, feedback duration kept), not per component.

**Sources.** [DSL-048, DSL-049, PLAT-041, PLAT-084, DSL X9]; Apple HIG Accessibility (Reduce Motion substitutions); Primer responsive (pointer queries unreliable); Kowalski; WCAG 2.2.2 and 2.3.3 in accessibility.md.

### MOT-20 · Loading indicators in motion
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe)`

**Rule.** Which indicator to show, and after how long, is set by CMP-10 in components-states.md; this rule covers how it moves. Looped indicators move linearly at constant speed and only while work is pending. An in-control busy indicator appears after a short show-delay and, once shown, stays long enough not to flicker (Vercel gives 150–300 ms and 300–500 ms) [practitioner values]. Determinate indicators move only with real progress. Nothing fakes progress or holds a finished result back for an animation. Under reduced motion, see the MOT-04 exception.

**Why.** A spinner that flashes for a fraction of a second is worse than none, and fake progress breaks trust once people notice it.

**Check.** `uie probe` runs the action (against a slow response where the app or a fixture can provide one) and reads screenshots and timing: no flash shorter than the minimum, and a determinate bar that tracks reported progress.

**Fix.** Put the show-delay and minimum visible time in the shared button and loader components, not at each call site.

**Sources.** [CRAFT-049, DSL-042, PLAT-090]; Vercel Web Interface Guidelines; NN/g progress indicators; impeccable `delight.md`; Saffer's microinteractions via wondelai (honest progress).

### MOT-21 · Scroll behaviour
`level: advisory` · `modes: all` · `status: active` · `verify: S/I (uie lint; uie probe)`

**Rule.** No scroll-jacking: the wheel, trackpad and touch move the page at the user's own speed. Smooth anchor scrolling uses native `scroll-behavior: smooth`, and only under `prefers-reduced-motion: no-preference`. Inertia or smooth-scroll libraries appear only on opt-in Persuade or Experience pages and switch off under reduced motion. Scroll-linked effects use CSS scroll-driven animations or an intersection observer, never a scroll listener that writes component state every frame; they count toward MOT-07 and never hide content at rest (MOT-05).

**Why.** Scrolling is a motor habit people perform at their own pace; taking it over makes a page feel broken. Even a source that recommends inertia libraries calls scroll hijacking hostile [DSL X16].

**Check.** `uie lint` flags `wheel` and `touchmove` handlers that call `preventDefault`, smooth-scroll dependencies, unconditional `scroll-behavior: smooth`, and scroll listeners that set state. `uie probe` scrolls in fixed steps and compares the distance moved.

**Fix.** Remove the library or handler; wrap `scroll-behavior: smooth` in the no-preference media query.

**Sources.** [DSL-050, DSL X16]; ui-craft and hallmark (no scroll-jacking); taste-skill §5; wondelai `top-design` (counter-position).

## 3. Decisions to make

Record these in the motion section of `DESIGN.md` (motion tokens and budget, DEC-02), with a reason for each in the decisions log. Mode sets the budget; the brand's "X, not Y" attributes choose within it.

| Mode | Non-user-triggered motion (MOT-07) | State ceiling (MOT-02) | Character |
|---|---|---|---|
| Persuade | ≤ 1 orchestrated sequence per screen | ≤ 300 ms | one authored focal moment plus feedback |
| Operate | one page fade at most | ≤ 250 ms; frequent ≤ 150 ms | productive: feedback and state only |
| Read | one page fade at most | ≤ 300 ms | feedback and state only |
| Experience | as declared in `DESIGN.md`; default ≤ 1 per screen | ≤ 300 ms | declared per piece |

1. **Motion level per surface**, as one of three checkable levels [DSL-012, adapted to MOT-07]: *calm* (feedback and state changes only), *balanced* (calm plus the one page fade or the one orchestrated sequence the mode allows), *bold* (balanced plus declared scroll-linked effects on Experience surfaces, and springs if playfulness is recorded). Numeric dials are aliases only.
2. **Frequency map**: every interaction with its tier (keyboard or 100+ a day, tens a day, occasional, rare) and its motion (MOT-08).
3. **Duration tokens** by role, each inside its band and ceiling (MOT-10), with the distance rule for large moves.
4. **Easing family** and its source, as role tokens (MOT-11). Tie it to the brand attributes: *fast, not hurried* suggests near-zero motion on frequent actions; *playful, not childish* suggests springs with a small bounce on rare moments, recorded as a playful declaration [07 §4.1].
5. **Enter and exit pairing** and the stagger token with its cap (MOT-12, MOT-13).
6. **The focal moment**, or "none": which element, its purpose, its duration and its reduced-motion version. "None" is a valid decision on Operate and Read surfaces.
7. **Motion table**: each animation with its purpose, class (state, overlay, focal, frequent) and reduced-motion substitution (MOT-09, MOT-19).
8. **Spring policy**: none, gestures only, or a declared playful brand with parameters (MOT-18).
9. **Smooth scrolling**: native only, or a library on named Persuade or Experience pages (MOT-21).

## 4. How to fix common failures

Fix at the narrowest correct layer (token, then shared component, then local), one finding at a time, and re-run the originating check plus `uie diff` against the baseline (FRAMEWORK §10).

| Failure | Narrowest fix | Verify |
|---|---|---|
| `transition: all` across many components | Token or shared utility: list the properties | `uie lint`; `uie audit --checks motion` |
| Height or `top` animated for expand or slide | Shared component: FLIP or transform plus opacity | `uie audit --checks motion`; `uie diff --visual` shows the same end state |
| The same fade-up on every section (SLP-09) | Local: delete all but the declared focal sequence; on Operate and Read delete all | `uie audit --checks motion,tells` |
| Dozens of distinct durations and curves | Token: collapse to the role tokens | `uie audit --checks census`; `uie lint` |
| Bounce or overshoot on toggles and menus | Token: replace the easing token | `uie lint` |
| No reduced-motion path | Token layer: one reduce block remapping distance and duration tokens | `uie audit --checks motion` under reduced-motion emulation |
| Text hidden until a reveal fires | Shared component: visible default, script only enhances | `uie audit --checks motion`; recapture (EVD-03) |
| Popover grows from the centre or from `scale(0)` | Shared popover: origin and start-scale tokens | `uie lint`; `uie probe` frames |
| Menu opened by shortcut still animates | Shared menu: no transition for keyboard-initiated opening | `uie probe` with the keyboard path |
| Busy spinner flickers on fast actions | Shared button or loader: show-delay and minimum time | `uie probe` |
| Page slides between top-level sections | Router transition: replace with the fade token | `uie probe` |
| Scroll-jacking library on an Operate surface | Remove the dependency; native smooth scrolling under no-preference only | `uie lint`; `uie probe` |

## 5. CJK and localisation notes

- **Direction.** Directional motion follows the inline direction: in right-to-left locales, forward slides travel toward the inline end and progress fills from the inline start. Use logical properties and direction-aware transforms rather than hard-coded left and right [PLAT-138].
- **Device doubling.** TDesign sets desktop durations at twice the mobile values; other systems scale by distance and size instead. Do not double durations for desktop without testing [05 C11].
- **Restraint is shared.** Chinese enterprise systems state the same ethic in their own terms: Ant Design's motion principles are natural, efficient and restrained, and TDesign asks whether the information survives if the motion is removed. Apply the same budgets to zh-CN products.

## Sources

Research adopt items: CRAFT-028, CRAFT-048 to CRAFT-052, IMP-021, IMP-022, IMP-031, PLAT-041, PLAT-080 to PLAT-086, PLAT-090, PLAT-138, DSL-012, DSL-042, DSL-044 to DSL-050, DSL-066, TOOL-18; conflict rulings 02 X3, X9, X15, X16, X25; 05 C10, C11; 07 C9, C11.

- Kowalski, emilkowalski/skills (MIT), 2026, https://github.com/emilkowalski/skills
- Freiberg, Invisible Details of Interaction Design, 2023, https://rauno.me/craft/interaction-design
- Laubheimer, NN/g animation duration, 2020, https://www.nngroup.com/articles/animation-duration/
- NN/g, Progress indicators, https://www.nngroup.com/articles/progress-indicators/
- Material Design 3 motion and tokens (Apache-2.0 token code), 2026, https://m3.material.io/styles/motion/overview
- IBM Carbon motion (Apache-2.0), 2026, https://carbondesignsystem.com/elements/motion/overview/
- Microsoft Fluent 2 motion and tokens (MIT), 2026, https://fluent2.microsoft.design/motion
- Ant Design motion spec (MIT), 2026, https://ant.design/docs/spec/motion-cn
- TDesign motion guidelines (MIT), 2026, https://github.com/Tencent/tdesign
- Atlassian Design System motion (ideas only; licence restricts reuse), 2026, https://atlassian.design/foundations/motion
- Apple Human Interface Guidelines, Motion, 2026, https://developer.apple.com/design/human-interface-guidelines/motion
- Apple Human Interface Guidelines, Accessibility (Reduce Motion), 2026, https://developer.apple.com/design/human-interface-guidelines/accessibility
- Primer loading and responsive foundations (MIT), 2026, https://primer.style/product/ui-patterns/loading
- Vercel Web Interface Guidelines (MIT), 2026, https://github.com/vercel-labs/web-interface-guidelines
- Vercel agent-skills, `react-view-transitions` (MIT), 2026, https://github.com/vercel-labs/agent-skills
- impeccable, `animate.md`, `craft-floor.md` and detector (Apache-2.0), 2026, https://github.com/pbakaus/impeccable
- ibelick ui-skills, `baseline-ui` (MIT), 2026, https://github.com/ibelick/ui-skills
- Anthropic frontend-design skill v3 (Apache-2.0), 2026, https://github.com/anthropics/skills
- Tailwind CSS `theme.css` v4.3 (MIT), 2026, https://github.com/tailwindlabs/tailwindcss
- W3C, WCAG 2.2 (SC 2.2.2, 2.3.3), 2024, https://www.w3.org/TR/WCAG22/
