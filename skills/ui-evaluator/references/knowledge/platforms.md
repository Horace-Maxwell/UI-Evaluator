# Platform profiles

This file says how a web UI changes when it should feel at home on a platform. It defines the default `web` profile and four optional ones, `apple`, `material`, `fluent` and `enterprise-zh`, records how the research resolved conflicts between design systems (C1 to C21), and owns the advisory rules PLT-01 to PLT-04. A profile changes defaults only: the accessibility floor in [accessibility.md](accessibility.md) and every gate threshold hold under all of them. Read this file in `setup` when choosing a profile, in `direct` and `build` before setting tokens, and in `audit` when a finding depends on a platform convention. The rules themselves live with their domains: case and punctuation in [content-copy.md](content-copy.md), states, focus and forms in [components-states.md](components-states.md), breakpoints and density in [layout.md](layout.md), radius and elevation in [shape-depth.md](shape-depth.md), type in [typography.md](typography.md), colour in [color.md](color.md), motion in [motion.md](motion.md), and Chinese text in [cjk.md](cjk.md).

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules): PLT-01 to PLT-04
3. [Decisions to make (for direct/build)](#3-decisions-to-make-for-directbuild)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
6. [Cross-system consensus](#6-cross-system-consensus)
7. [Conflict resolutions C1 to C21](#7-conflict-resolutions-c1-to-c21)
8. [The profiles](#8-the-profiles): [web](#81-web-default) · [apple](#82-apple) · [material](#83-material) · [fluent](#84-fluent) · [enterprise-zh](#85-enterprise-zh)
9. [What never changes](#9-what-never-changes)
10. [Licences](#10-licences)
11. [Native platforms are out of scope](#11-native-platforms-are-out-of-scope)
- [Sources](#sources)

## 1. Principles

1. **Defaults, never floors.** A profile changes conventions that legitimately differ between platforms: case, focus style, state model, motion feel, density, radius and elevation. It never lowers G2 or any gate threshold, and system values that would break one are replaced (§9) [FRAMEWORK §12.3].
2. **A convention is not a look.** A profile says what the platform's users expect, not what the product should look like. Copying a system wholesale reproduces its template (a grey-and-blue enterprise screen, an un-themed seed blue, an indigo default), and imitating native chrome such as status bars or device frames is a tell (SLP-10). The brand still comes from the direction in `DESIGN.md` [P3].
3. **Token code over prose.** Documentation and token code sometimes disagree. The token code is what ships in that system, so it wins and is cited with its file [PLAT-141].
4. **One profile, applied everywhere.** Mixed conventions within one element type read as inconsistency to users and fail CPY-03.
5. **The codebase's system wins on structure.** Breakpoints and component metrics already in the product stay unless the owner chooses otherwise, because consistency within a product beats a better number from elsewhere ([layout.md](layout.md) §3).
6. **Vendor research is a hypothesis.** Study results published by a system's owner, such as M3 Expressive's speed figures, never justify a rule alone [PLAT-143].

## 2. Rules

All PLT rules are advisory (`level: advisory`): they raise findings for evaluators and the code reviewer and never gate. Where a profile value meets a gate, the gate decides. Check names in `--checks` follow `uie audit --help`.

### PLT-01 · One declared profile
`level: advisory` · `modes: all` · `status: active` · `verify: S (config.json, DESIGN.md)`

**Rule.** The product declares one profile, `web`, `apple`, `material`, `fluent` or `enterprise-zh`, in `.ui-evaluator/config.json`, and names it with its reason in `DESIGN.md`. Without a declaration, `web` applies and the report says so.

**Why.** Findings about case, focus, motion and form layout depend on which conventions the product's users expect. Without a declared profile, each evaluator judges against whichever platform it assumes.

**Check.** `config.json` and `DESIGN.md` name the same profile, and the report header shows it.

**Fix.** Choose in `setup` from the platforms listed in `PRODUCT.md` (§3.1), then record it in both files.

**Sources.** FRAMEWORK §12.3; ARCHITECTURE §8.2 (config schema).

### PLT-02 · Values traced to token sources
`level: advisory` · `modes: all` · `status: active` · `verify: S/A (DESIGN.md review; code reviewer)`

**Rule.** Every value `DESIGN.md` adopts from a design system names its source. Where the system's documentation and its token code disagree, the token code wins; a value found only in documentation is marked as such.

**Why.** As of 2026-10, Fluent's site and its token code give different values for a line height and a radius, and Material's current and frozen web tokens differ on state-layer opacity. Prose drifts; tokens are what the system ships.

**Check.** For each adopted value, the cited source is a token file (the tables in §8 name them) or the value is marked documentation-only. The code reviewer spot-checks adopted values against §8.

**Fix.** Replace the prose value with the token value, or record why the product deviates.

**Sources.** PLAT-141; 05 §2.2, §2.3.

### PLT-03 · Profile values pass the floors
`level: advisory` · `modes: all` · `status: active` · `verify: S (DESIGN.md review in direct); D/I (owning gates after build)`

**Rule.** No value adopted from a profile goes below a gate. Text sizes, line heights, focus width, target sizes, durations, curves, shadow levels and page widths are compared with §9 before they enter `DESIGN.md`.

**Why.** Design systems tune their values for their own platforms and fonts, and several sit below this framework's floors: a 10 px caption, a 1 px focus border, a 20 pt minimum target. A profile changes defaults, never floors.

**Check.** In `direct`, compare the profile tokens in `DESIGN.md` with §9. After build, the owning gates measure the rendered result (TYP-01 to TYP-03, TYP-06, A11Y-04, A11Y-07, A11Y-10 to A11Y-12, MOT-02, MOT-03, SHP-02).

**Fix.** Put the §9 replacement into the token layer, not into individual components.

**Exceptions.** A G3 threshold the owner has waived with a recorded reason. G2 thresholds, and G3 criteria that implement a WCAG success criterion (CPY-02), cannot be waived.

**Sources.** FRAMEWORK §12.3; QUALITY-BAR §2.3; 05 §3.3 (C6, C18).

### PLT-04 · Side-aligned form labels only under enterprise-zh
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks forms)`

**Rule.** Labels sit above their fields (CMP-17). Under `enterprise-zh`, dense desktop forms with short labels may instead place right-aligned labels, with a colon, beside their fields at widths of 1024 px and above, stacking them above the fields at narrower widths. One alignment per form.

**Why.** Top-aligned labels survive translation, zoom and narrow screens. Right-aligned labels with colons are an established convention in dense Chinese enterprise forms, where users expect them, so evaluators should not report them as inconsistency [05 C8].

**Check.** For each form, compare label and control boxes at each matrix width: label above the control, or beside it with right-aligned text. Report forms that mix the two, and side labels below 1024 px or outside `enterprise-zh`.

**Fix.** Switch the label-layout token in the shared form component, and let side labels stack below 1024 px.

**Sources.** PLAT-100; 05 C8; Ant Design alignment spec.

## 3. Decisions to make (for direct/build)

### 3.1 Choosing the profile

| Situation in `PRODUCT.md` | Profile |
|---|---|
| A web product with no platform-native expectation | `web` |
| A web app used mainly on iPhone, iPad or Mac and meant to feel native there (installed web app, web view, companion site) | `apple` |
| A web product extending an Android or Google-ecosystem product, or built on Material components | `material` |
| A web product inside the Microsoft 365 or Windows ecosystem, or built on Fluent UI | `fluent` |
| A Chinese enterprise or back-office product (中后台), or one built on Ant Design, TDesign, Arco or Semi | `enterprise-zh` |

`config.json` holds one profile per product; modes (Persuade, Operate, Read, Experience) still apply per surface inside it. A product that serves several platforms takes the profile of its primary context and records the others as known differences.

### 3.2 Breakpoints

The breakpoint set is chosen as in [layout.md](layout.md) §3 and enforced by LAY-08: the styling framework's own set when `uie detect` finds one, otherwise Material's width classes (600, 840, 1200, 1600). By profile:
- `material` uses Material's classes.
- `enterprise-zh` uses the detected library's set (Ant Design or TDesign, §8.5).
- `web`, `apple` and `fluent` use the detected framework's set (Fluent's own when Fluent UI is the framework), otherwise Material's classes.
- When two detected systems disagree, for example Tailwind next to a component library, keep the set the product's media queries already use most and record the choice.

The evidence widths (320, 375, 768, 1024, 1280, 1440) are fixed by QUALITY-BAR and do not follow the breakpoints. When a declared breakpoint falls between two matrix widths, add captures at the breakpoint and 1 px below it to the run scope [calibrating].

### 3.3 Record in DESIGN.md

- The profile and the reason for it (PLT-01).
- The breakpoint set (LAY-08).
- The case convention per element type (CPY-08, CPY-03).
- The state model and disabled values (CMP-07, CMP-09).
- The focus tokens, which meet A11Y-04 and A11Y-12 under every profile (CMP-08).
- The touch comfort size, 44 or 48 (A11Y-23), and the control heights.
- The easing family and the tokens allowed to overshoot (MOT-11, MOT-18).
- Every system value not adopted, with its replacement (PLT-03, §9).

## 4. How to fix common failures

| Failure | Narrowest correct fix | Verify with |
|---|---|---|
| No declared profile, and findings argue about conventions | declare it in `config.json` and `DESIGN.md` (PLT-01) | the report header |
| Title case outside the `apple` profile, or mixed within one element type | edit the strings at their source (CPY-08) | `uie audit --checks copy` |
| Stray breakpoints from a second system | map them to the declared set in the layout tokens (LAY-08) | `uie lint` |
| A system value below a floor (10 px caption, 1 px focus border, 20 px target) | the §9 replacement in the token layer (PLT-03) | the owning gate's check |
| An overshooting curve on a state change | the profile's non-overshooting token (MOT-18) | `uie lint` |
| Glass that fails contrast over some content | more opacity or a dimming layer, and a solid fallback (SHP-12) | `uie audit --checks contrast` |
| A self-hosted platform font | a local-name reference in the stack (TYP-17, I18N-03) | `uie lint` |
| Side labels below 1024 px, or mixed alignment in one form | the label-layout token; stack below 1024 px (PLT-04) | `uie audit --checks forms` |

## 5. CJK and localisation notes

- `enterprise-zh` assumes Simplified Chinese. For Traditional Chinese, use regional `lang` tags and TC or HK font families (A11Y-16, I18N-02).
- Typesetting and copy rules (line height, measure, punctuation, Han–Latin spacing, ellipsis, 你 or 您, data formats) are I18N-04 to I18N-19 in [cjk.md](cjk.md); conflicts C14 to C17 in §7 say which way each was resolved.
- Under every profile, CJK content declares CJK families after the Latin family and never uses `system-ui` as the content face (I18N-01). Use 400 with 600 or 700 for weight contrast, because Microsoft YaHei renders 500 as regular (I18N-04) [PLAT-013].
- Material's script-aware line height (about 7% taller for CJK, Arabic, Thai and similar scripts) applies on top of any profile's ramp (I18N-05, I18N-15); TYP-03's 1.5 for multi-line CJK text still holds.

## 6. Cross-system consensus

Every profile shares these, because the systems reviewed agree on them [05 §3.2]:
1. Semantic tokens for colour, type, spacing, radius, elevation and motion, with restraint as a stated value: Apple's accent used judiciously, Ant's 克制, Carbon's occasional expressive moments, Material's one or two hero moments per product [PLAT-002, PLAT-004].
2. Hierarchy from layout, grouping and contrast rather than decoration (LAY-06, LAY-13).
3. One primary action per context (LAY-12).
4. WCAG AA as the floor, with several systems aiming higher for body text (G2; COL-13).
5. Touch targets of 44 to 48 px and 24 px everywhere, with spacing between targets as important as size (A11Y-10, CMP-06).
6. Functional motion: short, interruptible, exits faster than entrances, a reduced-motion path, frequent interactions near-instant (MOT-02, MOT-04, MOT-08, MOT-12, MOT-15).
7. Dark mode as a designed theme, with higher surfaces lighter and contrast re-checked (COL-04, COL-12, SHP-10).
8. Plain, specific, verb-first copy, no blame, quiet success, and errors that say how to fix them ([content-copy.md](content-copy.md)).
9. For CJK: a 14 px UI body with line height of size + 8, a 12 px minimum, solid setting, explicit CJK fonts and regional `lang` ([cjk.md](cjk.md)).

## 7. Conflict resolutions C1 to C21

Where systems disagree, every profile follows the resolution below; the fourth column lists the only profile differences [05 §3.3].

| # | Conflict | Resolution | Profile difference | Enforced in |
|---|---|---|---|---|
| C1 | Title or sentence case for commands | sentence case; never mixed within one element type | `apple`: title case | CPY-08, CPY-03 |
| C2 | Ellipsis on labels that open a dialog | none; ellipsis only for progress states and truncation | `apple`: ellipsis when more input follows | CPY-14 |
| C3 | Disable submit until the form is valid | primary stays enabled and validates on submit; disable only against double submission (with progress) or with research, then explain it and keep it discoverable | — | CMP-03, CMP-09 |
| C4 | When to validate | on submit; live feedback only for limits users cannot know, and to clear an error once fixed | — | CMP-18 |
| C5 | Contractions | positive ones are fine; spell out negatives in errors, warnings, legal and security text | — | CPY-15 |
| C6 | Large-text threshold | WCAG exactly: ≥ 24 px, or ≥ 18.66 px bold | — | A11Y-11 |
| C7 | Body-text contrast target | gate at 4.5:1 and 3:1; aim for 7:1 on long-form body text; offer a high-contrast theme | — | A11Y-11, COL-13, A11Y-24 |
| C8 | Label position and colons | labels above fields, without colons in Latin interfaces | `enterprise-zh`: side labels at ≥ 1024 px | PLT-04, CMP-17 |
| C9 | Marking required or optional fields | mark the minority in words; an asterisk only with a visible legend, never alone | — | CMP-17 |
| C10 | Staggered entrances | none on the first load of productive apps; ≤ 20–30 ms per item and ≤ 500 ms in total, for user-triggered insertions or expressive pages | — | MOT-13, MOT-07 |
| C11 | Desktop vs mobile durations | by size and distance moved; no doubling for desktop without testing | `enterprise-zh` drops TDesign's doubling | MOT-10 |
| C12 | An app-level appearance switch | follow the system; a site switch defaults to "System" | — | COL-12 |
| C13 | Emphasis by size | equal sizes within a button group, emphasis by style; the page's primary action may be the most prominent | — | CMP-16, LAY-12 |
| C14 | Chinese ellipsis | "……" in prose; CSS truncation in UI | — | I18N-09 |
| C15 | CJK–Latin spacing | `text-autospace` first; typed spaces only as one consistent convention, never beside full-width punctuation or inside fixed terms | — | I18N-11 |
| C16 | CJK line height | UI text size + 8; reading paragraphs 1.7–1.9; multi-line CJK never below TYP-03's 1.5 | — | TYP-03, I18N-05 |
| C17 | 你 or 您 | one choice per product, as a content token; 你 for tools, 您 acceptable for formal services; never mixed | — | I18N-16 |
| C18 | Disabled opacities | one system's values, applied consistently; disabled stays recognisable | the profile supplies the values | CMP-09, CMP-03 |
| C19 | Line length | Latin 45–75 characters; CJK 20–40 glyphs | — | TYP-04, TYP-22 |
| C20 | Justification | start-aligned UI and Latin prose; justify only pure-CJK paragraphs | — | TYP-10, I18N-12 |
| C21 | Adapting to the pointer | size targets by layout breakpoint, all ≥ 24 px; `any-pointer: coarse` only as progressive enhancement | — | LAY-08, A11Y-10 |

## 8. The profiles

Each table gives the profile's default for every dimension and where the value comes from. Numbers from token code name the file; "as `web`" means no change.

### 8.1 web (default)

The baseline the other profiles modify: the consensus of §6 with the resolutions of §7 [05 §3.5].

| Dimension | Default | Where it is enforced |
|---|---|---|
| Case | sentence case for all UI text; ellipsis only for progress and truncation | CPY-08, CPY-14 |
| Targets | ≥ 24 × 24 everywhere; touch-primary ≥ 44 × 44 and ≥ 8 px apart; 48 is comfortable | A11Y-10, CMP-06, A11Y-23 |
| Focus | a 2–3 px ring about 2 px outside the control, radius = control radius + offset, ≥ 3:1, distinct from hover | CMP-02, CMP-08, SHP-13 |
| State model | rest, hover, focus-visible, pressed, disabled, selected, loading, error, success; two cues each; one derivation rule, pressed at least as strong as hover | CMP-07, CMP-09 |
| Type ramp | productive body 14 px (Operate), reading body 16 px; 12 px minimum; steps ≥ 1.125 (Operate) or ≥ 1.25; weights 400 with 600 or 700 | TYP-01, TYP-02, TYP-06, TYP-11 |
| Motion | feedback 70–150 ms, components 150–300 ms, large moves ≤ 500 ms; decelerate in, accelerate out, exits shorter; springs only for gestures or a declared playful brand | MOT-02, MOT-10, MOT-12, MOT-18 |
| Density | constant within a page, chosen by the user, never below target minimums | LAY-11 |
| Elevation | flat or tonal by default; ≤ 4 levels; shadows for floating and dragged layers; higher is lighter in dark themes | SHP-02, SHP-07, SHP-10 |
| Radius | one scale tied to component size; concentric nesting; square where flush with the viewport; checkboxes stay square and radios round | SHP-01, SHP-03, SHP-04, SHP-05 |
| Colour roles | role tokens over 10–12-step ramps; accent for the primary action, selection and focus; status colours only for meaning; follows the system appearance | COL-05, COL-06, COL-09, COL-10, COL-12 |
| Spacing | 4 px base: 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80 | LAY-01 |
| Breakpoints | the detected framework's set, else 600, 840, 1200, 1600 | LAY-08, §3.2 |

### 8.2 apple

For web apps meant to feel native on iPhone, iPad and Mac. HIG values are in points; on phones a point is close to a CSS px but not identical [approximation]. Liquid Glass and SF are native features; on the web any imitation is an approximation, and should be labelled as one (SHP-12).

| Dimension | `apple` default | Source |
|---|---|---|
| Case | title case for buttons, menu items, navigation titles and list column headings; an ellipsis on commands that ask for more input. As of 2026-10 the HIG's Alerts page asks for sentence case on alert buttons, against its Buttons page: pick one convention for all buttons (CPY-03) | HIG Buttons, Menus, Alerts; CPY-08, CPY-14 |
| Targets | 44 × 44 pt default on iOS, iPadOS and watchOS (28 × 28 pt minimum); 28 × 28 pt default on macOS; about 12 pt of padding around bordered controls. On the web: 44 × 44 for touch, and compact pointer layouts no smaller than 28 px | HIG Accessibility (rev. 2025-06-09) |
| Focus | as `web`, with the ring following the control's shape, capsules included | SHP-13 |
| State model | every custom button has a press state; hover only where a pointer exists; only primary actions are tinted; unavailable menu items are dimmed, not hidden | HIG Buttons, Menus; WWDC25 session 219 |
| Type ramp | iOS Dynamic Type at the default size, pt (size/leading): Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25, Headline 17/22 semibold, Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1 12/16, Caption 2 11/13. Text grows with the reader's size setting (TYP-19); no Ultralight, Thin or Light weights in UI text | HIG Typography (rev. 2025-12-16) |
| Motion | spring-like, brief, interruptible and following the finger; the HIG gives no durations, so `web` budgets apply. Reduce Motion: tighter springs, fades instead of slides and depth, no animating into or out of blur | HIG Motion, Accessibility; MOT-18, MOT-19 |
| Density | no density scale in the HIG; as `web` | — |
| Elevation | base and elevated backgrounds, elevated lighter in dark mode; translucent materials only for floating navigation, with a solid fallback | HIG Dark Mode, Materials; SHP-10, SHP-12 |
| Radius | capsules (radius = half the height) for buttons, concentric radii for nested containers, fixed radii elsewhere; watch for pinched or flared corners | WWDC25 session 356; SHP-01, SHP-06 |
| Colour roles | roles by purpose: four label levels, placeholder, separator, link, and system and grouped backgrounds in three levels; light, dark and increased-contrast variants for every custom colour; one colour per meaning; accent on primary actions and status; follows the system appearance | HIG Color, Dark Mode, Branding; COL-12 |
| Fonts | system faces by local name only (`-apple-system`, `BlinkMacSystemFont`); never `system-ui` as the face for CJK content | Apple font licence; I18N-01, I18N-03 |
| Never changes | body text of three or more lines keeps line height ≥ 1.4 and two-line UI text ≥ 1.3 (17/22 is about 1.29, so it suits single lines only); Caption 2 only for non-interactive text; a macOS-style 13 pt body fails TYP-02 unless waived; the 20 pt macOS minimum target is below A11Y-10; Body 17 and Callout 16 are too close to serve as adjacent roles without a weight difference; large text by WCAG, not by the Inspector's bold-at-any-size reading | §9 |

### 8.3 material

For web products that extend an Android or Google-ecosystem product, or that are built on Material components. As of 2026-10, Material Web is in maintenance mode and M3 Expressive is not implemented for the web, so translate tokens rather than depending on Material's web components for new work. Values come from the current Compose token files and Material Color Utilities unless noted.

| Dimension | `material` default | Source |
|---|---|---|
| Case | as `web`: sentence case, no ellipsis on commands | M3 content style guide (2026-08-04) |
| Targets | 48 × 48 for touch (about 9 mm), 44 × 44 for pointer, ≥ 8 px apart; 24 px icons inside 48 px targets; density never shrinks a target below 48 px | M3 accessibility, density |
| Focus | a ring 3 px wide, 2 px outside the component, in the `secondary` role, fully rounded by default; its brief grow animation is dropped under reduced motion | material-web `_md-comp-focus-ring.scss`; SHP-13 |
| State model | a state layer of the content colour: hover 8%, focus 10%, pressed 10%, dragged 16%; selected and activated change the container colour; disabled content 38% and container 12%; two cues per state. The frozen material-web tokens use 12% for focus and pressed: keep 12% where the product already uses material-web components | Compose `StateTokens`; material-web `v0_192`; CMP-07 |
| Type ramp | baseline styles, px (size/line height): Display 57/64, 45/52, 36/44; Headline 32/40, 28/36, 24/32; Title 22/28, 16/24, 14/20; Body 16/24, 14/20, 12/16; Label 14/20, 12/16, 11/16. Body Medium for Operate, Body Large for Read and Persuade; scripts in Material's "medium" group, CJK included, get about 7% more line height | Compose `TypeScaleTokens`; M3 typography (2026-08) |
| Motion | the standard scheme by default: spatial `cubic-bezier(0.27, 1.06, 0.18, 1)` at 350, 500 or 750 ms (within MOT-03's limit); effects on colour and opacity at 150 ms `(0.31, 0.94, 0.34, 1)`, 200 ms `(0.34, 0.8, 0.34, 1)` and 300 ms `(0.34, 0.88, 0.34, 1)`. Expressive spatial curves overshoot, for example `(0.42, 1.67, 0.21, 0.9)` at 350 ms, and are kept for declared hero moments; top-level navigation fades through | M3 motion physics, web conversions; MOT-18 |
| Density | levels 0, −1, −2 and −3, each about 4 px shorter; chosen by the user, never changed automatically by breakpoint | M3 layout density; LAY-11 |
| Elevation | levels 0 to 5 = 0, 1, 3, 6, 8, 12 dp, shown first as tonal surfaces (five surface containers); shadows only on busy backgrounds or to invite interaction; hover raises one level; scrim at 32% | Compose `ElevationTokens`; M3 elevation; SHP-07, SHP-11 |
| Radius | 0, 4, 8, 12, 16, 20, 28, 32, 48 and full; fully rounded buttons, a declared capsule system; inner radius = outer radius − padding; expressive shapes only on mostly visual elements | Compose `ShapeTokens`; M3 shape; SHP-01, SHP-05, SHP-06 |
| Colour roles | X, on-X, X-container and on-X-container with variants; five surface containers; outline and outline-variant; inverse and fixed roles. Only on- pairs are guaranteed readable; containers are fills, never text; outline-variant is decorative and never a required boundary. Tone difference 40 ≈ 3:1 and 50 ≈ 4.5:1 is a design shortcut, not evidence. The medium and high contrast levels suit `prefers-contrast: more` | Material Color Utilities; COL-07; A11Y-12, A11Y-24 |
| Breakpoints | compact < 600, medium 600–839, expanded 840–1199, large 1200–1599, extra-large ≥ 1600; margins 16 px below 600 and 24 px above; 24 px between panes | M3 breakpoints (updated 2026-07-17); LAY-09 |
| Never changes | Label Small (11 px) only for non-interactive text; Title Large (22) and Headline Small (24) are too close to serve as adjacent roles without a weight difference; overshoot only where `DESIGN.md` declares it; 500–750 ms spatial motion only for overlays, page transitions and one focal entrance; at most four shadow styles in use per theme; disabled items users must find stay focusable | §9 |

### 8.4 fluent

For web products inside the Microsoft 365 or Windows ecosystem, or built on Fluent UI. Where the Fluent 2 site and the `microsoft/fluentui` token code disagree, the code is used (as of 2026-10).

| Dimension | `fluent` default | Source |
|---|---|---|
| Case | sentence case on the web; Fluent keeps title case for iOS and macOS only | Fluent content design; CPY-08 |
| Targets | 44 × 44 on the web and iOS, 48 × 48 on Android | Fluent layout |
| Focus | focus adds a stroke thicker than the rest border and leaves the fill unchanged, so keyboard focus never looks like hover; stroke tokens run 1–4 px, so use 2 px or more | Fluent colour; `strokeWidths.ts`; CMP-08 |
| State model | states live in the alias colour tokens (`…Hover`, `…Pressed`, `…Selected`, `…Disabled`); fills darken from rest to hover to pressed to selected | `alias/lightColor.ts`; CMP-07 |
| Type ramp | web ramp, px (size/line height): Caption 1 12/16, Body 1 14/20, Subtitle 2 16/22 semibold, Subtitle 1 20/28 semibold (the site says 26), Title 3 24/32, Title 2 28/36, Title 1 32/40, Large Title 40/52, Display 68/92; weights 400 to 700, with Strong as semibold (600) and Stronger as bold (700). Body 1 for Operate; Read and Persuade use the 16/22 step at regular weight | `typographyStyles.ts`; PLT-02 |
| Motion | durations 50, 100, 150, 200, 250, 300, 400 and 500 ms; decelerate curves `(0.1, 0.9, 0.2, 1)`, `(0, 0, 0, 1)` and `(0.33, 0, 0.1, 1)`, easy-ease `(0.33, 0, 0.67, 1)`, linear only for rotation; top-level navigation as a quick fade, not a slide; short, decreasing staggers only for user-triggered lists | `durations.ts`, `curves.ts`; Fluent motion; MOT-13 |
| Density | not covered by the research; as `web` | — |
| Elevation | two-layer shadows, an ambient `0 0 2px` plus a key `0 (n/2)px n px`, in tokens 2, 4, 8, 16, 28 and 64; stronger key opacity in dark themes; Windows draws strokes instead of key shadows | `utils/shadows.ts`; SHP-08 |
| Radius | 4 px default for buttons and dropdowns; 2 px for elements under 32 px; 12 px for sheets and popovers (site); circular for people; the token named "large" is 6 px in code, 8 px on the site; no rounding at screen edges or between the parts of one control | `borderRadius.ts`; Fluent shapes; SHP-04 |
| Colour roles | neutral, shared (status colours reserved for meaning) and a 16-step brand ramp; brand colour never fills large surfaces | Fluent colour; `brandColors.ts`; COL-09, COL-10 |
| Spacing | 4 px ramp: 0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40, 48, 52, 56, with 2, 6 and 10 for icon alignment; 12 columns | `spacings.ts`; LAY-01 |
| Breakpoints | 320, 480, 640, 1024, 1366, 1920 when Fluent UI is the framework | Fluent layout; §3.2 |
| Never changes | Caption 2 (10 px) unused; large text by WCAG, not Fluent's 18.5 px bold; Fluent's components target WCAG 2.1, so every 2.2 check still runs; at most four of the six shadow tokens in use per theme; 12 px icons never interactive | §9 |

### 8.5 enterprise-zh

For Chinese enterprise and back-office products, or products built on Ant Design, TDesign, Arco or Semi. Values come from Ant Design's theme token code unless noted; TDesign and Semi fill the gaps. These libraries ship a recognisable default look, and an un-themed seed colour reads as the stock library, so re-theme the seed tokens from the product's direction.

| Dimension | `enterprise-zh` default | Source |
|---|---|---|
| Case | Chinese has no letter case; Latin strings in sentence case; Chinese copy conventions (你 or 您, punctuation, data formats) are I18N-16, I18N-09 and I18N-19 in [cjk.md](cjk.md) | 05 C1, C17 |
| Targets | control heights 24, 32 and 40 px (small, default, large), 32 px by default on desktop; touch layouts still need 44 px primary controls; icon-only buttons get a name and a tooltip | Ant `genControlHeight.ts`; Semi `DESIGN.md`; CMP-06 |
| Focus | the research did not cover Ant's or TDesign's focus ring [unverified]; Semi's 1 px border is below the floor, so use the `web` focus indicator | 05 §2.14; CMP-02, CMP-08 |
| State model | neutrals as black or white alpha, with four text levels (primary, secondary, placeholder, disabled); the primary colour at step 6 of a 10-step ramp; alpha fills for hover and active (Semi 5, 9 and 13%); contrast measured on the composited result | Ant colours; TDesign; Semi `DESIGN.md`; A11Y-11 |
| Type ramp | 14 px body; line height = size + 8 for UI text (12/20, 14/22, 16/24; above 16 px see the last row); scale 12, 14, 16, 20, 24, 30, 38, 46, 56, 68; 3–5 sizes per product; weights 400 and 600, because Microsoft YaHei renders 500 as regular; tabular numerals for compared figures | Ant `genFontSizes.ts`; TDesign fonts; I18N-04, I18N-05, TYP-14 |
| Motion | natural, efficient and restrained: 100, 200 and 300 ms; `easeOutCirc (0.08, 0.82, 0.17, 1)` and `easeInOutCirc (0.78, 0.14, 0.15, 0.86)`; no staggered entrance on first load; durations set by distance, without TDesign's doubling for desktop | Ant motion; TDesign motion; MOT-10, MOT-13 |
| Density | dense desktop: vertical rhythm of 8 + 8n px; Ant's 24-column grid with fixed gutters, or TDesign's 12 columns with 16 px gutters and 24 px margins; side navigation 232 px wide, collapsing to 64 px below 992 px; one density per page | Ant layout; TDesign layout; LAY-11 |
| Elevation | four shadow levels (none for inputs, a hover lift, dropdowns, dialogs); shadow direction follows the edge, upward for bottom bars and sideways for drawers and fixed table columns; flat cards with a 1 px border are also common | Ant shadow spec; Semi `DESIGN.md`; SHP-07 |
| Radius | 2, 4, 6 and 8 px, with 6 px the default for buttons and inputs | Ant `genRadius.ts`, `seed.ts` |
| Colour roles | 10-step ramps (Ant in HSB, TDesign in HCT); functional colours fixed across the product; neutrals optionally tinted 8–12% toward the brand; TDesign's own warning and success steps reach only about 3.1:1, so they colour icons and fills, not text; accents desaturated in dark themes | Ant colours; TDesign colour; COL-08 |
| Breakpoints | the detected library's set: Ant 480, 576, 768, 992, 1200, 1600, 1920; TDesign 768, 992, 1200 | Ant `alias.ts`; TDesign; §3.2 |
| Fonts | an explicit CJK stack after the Latin family; TDesign's stack is the model, and Ant's default declares no CJK family | I18N-01; TYP-17 |
| Never changes | reflow at 320 px, so no fixed minimum page width (TDesign sets 768); size + 8 falls below TYP-03 for multi-line CJK body text above 16 px and for wrapping headings of 46 px and above; TDesign's 10 px mobile minimum unused; the `web` focus indicator | §9 |

## 9. What never changes

System values that break a floor are replaced, under every profile (PLT-03).

| System value | Breaks | Use instead |
|---|---|---|
| Large text as any bold text (Apple's Inspector), ≥ 18.5 px bold (Fluent), only ≥ 24 px (Carbon, Atlassian), 18 px (Semi) | A11Y-11 | WCAG's definition: ≥ 24 px, or ≥ 18.66 px bold |
| A 20 × 20 pt minimum target (macOS) | A11Y-10 | ≥ 24 × 24 CSS px; touch-primary ≥ 44 (CMP-06) |
| A 1 px border as the only focus cue (Semi) | A11Y-04, A11Y-12, CMP-02 | the `web` focus indicator |
| 10 px text (Fluent Caption 2, TDesign mobile); 11 px interactive labels (Material Label Small) | TYP-01 | 12 px; 11 px only for non-interactive captions; CJK never below 12 px |
| A 13 pt body (macOS) | TYP-02 | 14 px, unless the owner waives TYP-02 |
| 17/22 leading on wrapping text (iOS) | TYP-03 | ≥ 1.4 for Latin body text of three or more lines, ≥ 1.3 for two-line UI text; 17/22 only on single lines |
| Size + 8 line height on multi-line CJK body text above 16 px, and on wrapping CJK headings of 46 px and above (Ant, TDesign) | TYP-03 | ≥ 1.5 for multi-line CJK body text; ≥ 1.2 for wrapping CJK headings [calibrating] |
| Adjacent ramp steps closer than 1.125 (iOS Body 17 and Callout 16; Material Title Large 22 and Headline Small 24) | TYP-06 | use one of the pair, or separate the roles by weight |
| Overshooting curves on state changes (Material expressive, springs) | MOT-03 | a non-overshooting token; overshoot only where declared or gesture-driven (MOT-18) |
| 500–750 ms spatial motion on state changes (Material) | MOT-02 | ≤ 300 ms (≤ 250 ms on Operate); longer only for overlays and page transitions (≤ 500 ms), scrim dimming (≤ 700 ms) and one focal entrance (≤ 800 ms) |
| More than four shadow styles in use (Fluent ships six shadow tokens) | SHP-02 | at most four distinct shadow styles per theme |
| A fixed minimum page width (TDesign's 768 px) | A11Y-07, FUN-05 | reflow at 320 px; only two-dimensional regions scroll |
| Components that target WCAG 2.1 (Fluent) | G2 | every WCAG 2.2 check still runs |
| Disabled items removed from focus (Material's disabled state) | CMP-09 | focusable with `aria-disabled="true"` for menu items, tabs and toolbar buttons |
| Status colours under 4.5:1 used for text (TDesign warning and success) | A11Y-11 | a text role per theme; the status colour on icons and fills at ≥ 3:1 |
| A primary button disabled until the form is valid (Apple, entering data) | CR-033 default; the CMP-03 check raises it as an H1 and H9 candidate (ADR-032) | keep it enabled and validate on submit (CMP-18) |
| A default font stack without CJK families (Ant) | I18N-01 | an explicit CJK stack |
| Glass carrying text over arbitrary content (Apple materials) | A11Y-11 | SHP-12, with a solid fallback |

## 10. Licences

- **Platform fonts by local name only.** SF Pro, SF Compact, SF Mono and New York (Apple licenses them only for mock-ups of Apple-platform interfaces), Segoe UI and Segoe UI Variable, PingFang SC, TC and HK, Hiragino Sans GB and Microsoft YaHei are never bundled or self-hosted; stacks reference them by local name (I18N-03, TYP-17) [PLAT-017].
- **GDS Transport and New Transport** are restricted to GOV.UK services and are never used outside them, under any name.
- **Open fonts with conditions.** Source Han Sans and Serif reserve the name "Source", so a subsetted copy cannot carry it; Noto Sans CJK, also OFL but with no reserved name, is the simpler choice when you subset and self-host. HarmonyOS Sans and MiSans forbid modification and require visible attribution, so subsetting them needs a legal check [PLAT-018].
- **Ideas only, no text, tokens or code:** Shopify Polaris, whose licence limits use to apps that integrate with Shopify or are clearly distinct from its products, and the Atlassian Design System, licensed for products that work with Atlassian's.
- **Paraphrase and cite:** Apple HIG text (all rights reserved), Material guideline text (Google's terms), and the documentation prose of Fluent, Carbon and Ant Design.
- **Values with attribution:** Material token code (androidx Compose, material-web, Material Color Utilities) and Carbon are Apache-2.0; Fluent UI, Radix, Primer, Ant Design, TDesign, Arco and Semi are MIT. Re-expressed values are fine; a substantial copy goes into `NOTICE.md`.
- **Brand assets stay with their owners:** Tencent Blue and the Tencent Cloud numeric font; Arco's numeric font, whose licence is unverified.
- **GOV.UK** text is under the Open Government Licence v3.0 and may be adapted with attribution; GOV.UK Frontend code is MIT.

## 11. Native platforms are out of scope

- Version 1 evaluates web UIs. Native iOS, Android and desktop apps are out of scope (FRAMEWORK §16, ADR-004): `uie` drives a browser, and no gate exists for native toolkits.
- The `apple` and `material` profiles shape web UIs only. Native values in this file, such as pt and dp sizes, Dynamic Type styles, safe areas, edge-swipe and predictive back, SF Symbols and Compose colour roles, are background for translating conventions, never native conformance criteria [IMP-062].
- Asked to evaluate a native app, say so. Screenshots support static critique only, with runtime claims labelled potential and no assurance level (FRAMEWORK §14).
- Installed web apps and web views are web UIs and fully in scope; fixed bars respect safe-area insets (LAY-14).

## Sources

- Research adopt items: PLAT-002, PLAT-004, PLAT-013, PLAT-017, PLAT-018, PLAT-033, PLAT-034, PLAT-038, PLAT-040, PLAT-050 to PLAT-053, PLAT-060 to PLAT-075, PLAT-080 to PLAT-084, PLAT-100, PLAT-120, PLAT-141, PLAT-143; synthesis in note 05 §3.1, §3.2, §3.3 (C1 to C21) and §3.5; IMP-062 (note 01).
- Apple, *Human Interface Guidelines*: Accessibility (rev. 2025-06-09), Typography and Color (rev. 2025-12-16), Layout and Branding (rev. 2026-09-09), Buttons, Menus, Alerts, Materials, Motion, Dark Mode; read 2026-10-01. https://developer.apple.com/design/human-interface-guidelines/
- Apple, WWDC25 session 219 "Meet Liquid Glass" and session 356 "Get to know the new design system". https://developer.apple.com/videos/play/wwdc2025/219/ ; https://developer.apple.com/videos/play/wwdc2025/356/
- Apple, fonts and font licence. https://developer.apple.com/fonts/
- Google, *Material Design 3* (breakpoints updated 2026-07-17; typography 2026-08; content style guide 2026-08-04). https://m3.material.io/
- androidx, Compose Material3 tokens (`StateTokens`, `TypeScaleTokens`, `ShapeTokens`, `ElevationTokens`, motion tokens). https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens
- material-web tokens `v0_192`; Material Color Utilities. https://github.com/material-components/material-web ; https://github.com/material-foundation/material-color-utilities
- Microsoft, *Fluent 2* and `microsoft/fluentui` tokens. https://fluent2.microsoft.design/ ; https://github.com/microsoft/fluentui/tree/master/packages/tokens/src
- Ant Design, design specification and theme token source. https://ant.design/docs/spec/ ; https://github.com/ant-design/ant-design/tree/master/components/theme
- Tencent, TDesign guideline source. https://github.com/Tencent/tdesign
- ByteDance, Arco Design specification. https://github.com/arco-design/arco-doc-site
- Douyin FE, Semi Design `DESIGN.md`. https://github.com/DouyinFE/semi-design
- For consensus and conflicts: IBM Carbon, https://carbondesignsystem.com/ ; GitHub Primer, https://primer.style/ ; GOV.UK Design System, https://design-system.service.gov.uk/ ; Radix, https://www.radix-ui.com/ ; Tailwind CSS `theme.css` (v4.3.3), https://github.com/tailwindlabs/tailwindcss
- Licence texts: Shopify Polaris `LICENSE.md`, https://github.com/Shopify/polaris ; Atlassian design licence, https://atlassian.design/license ; Noto CJK, https://github.com/notofonts/noto-cjk ; Source Han Sans, https://github.com/adobe-fonts/source-han-sans ; Microsoft YaHei, https://learn.microsoft.com/typography/font-list/microsoft-yahei
