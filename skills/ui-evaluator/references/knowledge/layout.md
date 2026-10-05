# Layout and spacing

This file covers spacing scales, grouping, heading rhythm, alignment, breakpoints and panes, content width, density, visual hierarchy, safe areas and stacking order. It serves gate G3 (LAY-01 to LAY-05) and defines the spacing, grid and breakpoint decisions that DEC-02 requires in `DESIGN.md`. Reflow at 320 CSS px is a WCAG gate owned by [accessibility.md](accessibility.md) (A11Y-07); horizontal overflow and clipped text are FUN-05 and FUN-06; line length is TYP-04 in [typography.md](typography.md); template layouts such as the three icon cards or the centred hero formula are tells in [anti-slop.md](anti-slop.md). Read this file when setting spacing, grid and breakpoint tokens in `direct` or `build`, and when fixing a LAY finding.

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules): gate LAY-01 to LAY-05, advisory LAY-06 to LAY-15
3. [Decisions to make](#3-decisions-to-make)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles

1. **Space groups before boxes do.** Proximity tells people what belongs together before they read a label. Reach for a border, card or divider only when space cannot do the job.
2. **A constrained scale with real jumps.** A few spacing values that differ visibly beat many that differ by a pixel, because small differences read as mistakes rather than decisions.
3. **Rhythm, not uniformity.** Tight inside a group, generous between groups, more space above a heading than below it. One gap everywhere means no grouping decision was made.
4. **Lay out for available width, not devices.** Breakpoints answer how much room there is. Functions stay the same at every width; only their arrangement and visibility change.
5. **One focal point per view.** Decide what matters most and let it win through size, weight, contrast and position, so people find it without reading.
6. **Conventional structure, distinctive brand layer.** Navigation, page anatomy and form layout stay where people expect them; distinctiveness belongs in type, colour, imagery and content (P3).
7. **Reflow is a floor.** Every layout works at 320 CSS px without two-dimensional scrolling (A11Y-07), except genuinely two-dimensional content such as data tables and maps.

## 2. Rules

Gate rules come first and repeat the G3 thresholds exactly. Advisory rules (`level: advisory`) raise findings for the design panel and the code reviewer but never fail G3 on their own. Check names in `--checks` follow `uie audit --help`. Geometry is measured on rendered pages at the matrix widths (320, 375, 768, 1024, 1280, 1440).

### LAY-01 · Spacing scale conformance
`gate G3` · `modes: all` · `status: calibrating` · `verify: S/D (uie lint; uie audit --checks census)`

**Rule.** ≥ 90% of margin, padding and gap values on the declared scale (4 px-based by default); off-scale values only as documented optical fixes **[calibrating]**.

**Why.** A scale turns spacing into a handful of reusable, checkable decisions. Values off the scale accumulate into uneven gaps that read as careless.

**Check.** `uie lint` compares literal margin, padding and gap values (CSS, style props, Tailwind arbitrary values such as `p-[13px]`) with the scale in `DESIGN.md`. `uie audit --checks census` does the same for computed values on visible elements, counting each class signature once so a long list does not dominate. With no declared scale, a value is on-scale when it is a multiple of 4 px or exactly 2 px **[calibrating]**. Zero, `auto`, percentages and viewport units are layout decisions, not spacing steps, and are not counted; rem values are converted at the root size.

**Fix.** Snap each off-scale value to the nearest step in the shared component or layout primitive. If the design keeps needing a step the scale lacks, add it to the scale instead of repeating a literal (Fluent includes 2, 6 and 10 for optical alignment; Material allows 2, 4, 6 and 10 as nested units). Record genuine optical nudges as `DESIGN.md` exceptions. Re-run `uie lint` and `uie audit --checks census`.

**Exceptions.** GOV.UK Frontend projects declare GOV.UK's 5 px-based scale, which is on-scale for them.

**Sources.** [CRAFT-041, PLAT-030, DSL-027, TOOL-27, TOOL-29]; IBM Carbon spacing; Fluent 2 spacing; spec.fm 8-point grid.

### LAY-02 · No spacing monotony
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Among ≥ 10 spacing declarations (deduplicated by class or rule signature, not by rendered instance), fail when one value accounts for > 60% and ≤ 3 distinct values are used.

**Why.** When one gap does all the work, nothing is grouped: headings float, related items sit as far apart as unrelated ones, and the page reads as a template.

**Check.** `uie audit --checks census` collects margin, padding and gap values on the page, rounded to the 4 px grid as impeccable's detector does, counts each class signature once, and reports the share of the most common value.

**Fix.** Give the three relationships their own tokens (within a group, between groups, between sections) using visibly different steps, and apply them in the layout primitives (stack, grid, section) rather than in leaf components. Re-run `uie audit --checks census`.

**Sources.** [CRAFT-041, IMP-018, PLAT-032]; impeccable `monotonous-spacing`.

### LAY-03 · Heading rhythm
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout)`

**Rule.** Heading rhythm: space above a section heading > space below it.

**Why.** A heading belongs to the content it introduces. When it sits midway, or nearer the previous section, people misread where sections start.

**Check.** `uie audit --checks layout` measures, for each heading that follows content in the same flow, the gap from the previous content's bottom edge to the heading's top edge and from the heading's bottom edge to the next content's top edge, including margins and wrapper padding.

**Fix.** Set the spacing in the heading or prose styles, with a larger block-start step than block-end step, not page by page. Re-run `uie audit --checks layout`.

**Exceptions.** A heading that is the first child of its container, whose space above is the container's padding.

**Sources.** [IMP-018, CRAFT-041]; impeccable `heading-rhythm`; gstack design checklist.

### LAY-04 · No cramped padding
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout)`

**Rule.** Inside bordered or filled block containers: vertical inset ≥ max(4 px, 0.3em); horizontal ≥ max(8 px, 0.5em). Inline runs (`code`, `kbd`, `mark`, inline badges) are excluded.

**Why.** Text that touches its box edge looks clipped and stops the box reading as one unit. The em terms scale the minimum with the type size.

**Check.** `uie audit --checks layout` finds elements with a visible background or border that contain text and measures the inset from the rendered text box to the container's inner edge, in px and in em of that text's font size.

**Fix.** Raise the padding tokens of the shared component (badge, button, chip, card). Re-run `uie audit --checks layout`.

**Exceptions.** None in the criterion. Inline runs inside running text (`code`, `kbd`, `mark`) are a known false-positive risk; record them as `DESIGN.md` exceptions until the rule is calibrated.

**Sources.** [IMP-018]; impeccable `cramped-padding`.

### LAY-05 · Edge margin
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout)`

**Rule.** Edge margin: body text ≥ 16 px from the viewport edges at widths < 768 px.

**Why.** Text against the screen edge is hard to read and looks like a layout fault. Material's margin at compact widths is also 16.

**Check.** At the 320 and 375 widths, `uie audit --checks layout` measures the distance from paragraph-like text blocks wider than half the viewport to the left and right viewport edges, as impeccable's detector does.

**Fix.** Set the page gutter once, as a token on the layout shell, not inside components. Re-run at both widths.

**Exceptions.** Full-bleed media and bands, as long as the text inside them keeps the margin.

**Sources.** [IMP-018, PLAT-034]; impeccable `body-text-viewport-edge`; Material 3 breakpoints.

### LAY-06 · Proximity encodes grouping
`level: advisory` · `modes: all` · `status: calibrating` · `verify: D (uie audit --checks layout)`

**Rule.** At every nesting level, gaps inside a group are visibly smaller than gaps between groups, and those smaller than gaps between sections. Similar items are spaced equally. Starting ratios: between-group gaps at least 1.5 times within-group gaps, and section breaks at least twice the gap between blocks **[calibrating]**.

**Why.** People read proximity as relationship before they read any label. Ambiguous spacing, with as much space inside a group as between groups, breaks that reading.

**Check.** `uie audit --checks layout` walks sibling groups in each region and reports levels where the inner gap is not smaller than the outer one, and ratios below the starting values.

**Fix.** Use the within, between and section tokens of LAY-02 in the stack and section primitives.

**Exceptions.** Grids of peer items (product tiles, calendar cells) in which equal spacing is the grouping.

**Sources.** [PLAT-031, DSL-027, CRAFT-041]; Material 3 grids and spacing; IBM Carbon spacing; Ant Design proximity; ui-craft finish bar; Refactoring UI.

### LAY-07 · Key lines and alignment
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout)`

**Rule.** In each region, text and controls start on shared key lines: the container's padding edge, a grid column, or a declared indent step. Type sits on the container padding, not on an extra offset inside it. Indentation means subordination and is used for nothing else.

**Why.** Shared edges let the eye scan down a region. Edges a few pixels apart look like errors rather than structure.

**Check.** `uie audit --checks layout` lists the distinct left edges (inline-start edges in right-to-left pages) of text and controls per region and reports edges that match no key line within ±1 px, the size of an optical nudge.

**Fix.** Remove the stray offset in the component, or align it to the grid. Keep deliberate optical corrections (icons in buttons, round shapes overshooting) at ±1 px and note them.

**Exceptions.** Centred short moments such as an empty state or a short hero.

**Sources.** [PLAT-036]; IBM Carbon 2x Grid (key lines, type on the box padding); Apple layout; Vercel Web Interface Guidelines (optical alignment).

### LAY-08 · Breakpoints keyed to available width
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit)`

**Rule.** Breakpoints come from one declared set (§3), expressed as width media queries or container queries, never as device or user-agent checks. Every function available at one width is available at every width; only its arrangement or visibility changes, for example a tab bar becoming a sidebar. Layout never depends only on `pointer` or `hover` media queries.

**Why.** Devices do not predict available space (split screens, zoom, foldables), and functions hidden on small screens strand people. Primer found pointer queries unreliable enough not to gate on.

**Check.** `uie lint` reports width breakpoints outside the declared set and layout rules gated only on `pointer` or `hover`. `uie audit` compares the inventory of controls and destinations across the matrix widths and reports anything missing at some width.

**Fix.** Replace stray breakpoints with the declared tokens. Move a function hidden at narrow widths into an overflow menu, sheet or separate page instead of removing it.

**Exceptions.** Purely decorative elements may disappear at narrow widths.

**Sources.** [PLAT-033, PLAT-041, 05 C21]; Apple layout (size classes); Material 3 breakpoints; Primer responsive foundations.

### LAY-09 · Panes and margins per width
`level: advisory` · `modes: Operate, Read` · `status: active` · `verify: D (uie audit --checks layout)`

**Rule.** Unless `DESIGN.md` declares another system's classes, follow Material's width classes: one pane below 600 px; one pane from 600 to 839 (two only for low-density content); two panes from 840; up to three from 1600. Outer margins are 16 px below 600 and 24 px from 600, with 24 px between panes. At narrow widths, split list and detail into separate views or turn a pane into a sheet rather than squeezing both side by side.

**Why.** Each pane needs room for its content's minimum readable width. Squeezed side-by-side panes produce truncated labels and cramped tables.

**Check.** At each matrix width, `uie audit --checks layout` counts side-by-side primary regions and measures outer margins and the spacing between panes.

**Fix.** Change the pane rules in the layout component at the breakpoint tokens, never per page.

**Exceptions.** Products that follow Primer's ranges (one column below 768, up to two from 768, up to three from 1400) or another declared system.

**Sources.** [PLAT-034]; Material 3 breakpoints and canonical layouts (as of 2026-07); Primer layout.

### LAY-10 · Content width and the prose column
`level: advisory` · `modes: all` · `status: calibrating` · `verify: D (uie audit --checks layout)`

**Rule.** App content is capped at about 1280 px; prose sits in a column of about two-thirds of the content width so that its measure stays within TYP-04; only media and deliberate bands go full-bleed.

**Why.** Content stretched across a wide screen makes lines too long and pushes related controls apart. GOV.UK's two-thirds column and Primer's 1280 px page width both exist to keep lines at a readable length.

**Check.** At 1440 px, `uie audit --checks layout` reports primary content containers wider than about 1280 px and prose containers wider than two-thirds of their content area. Measure itself is TYP-04 in [typography.md](typography.md).

**Fix.** Set max-width tokens on the page container and on the prose container.

**Exceptions.** Workspaces that genuinely use the width (data tables, maps, editors, canvases), with any prose inside them still capped.

**Sources.** [PLAT-035, PLAT-014]; Primer layout; GOV.UK Design System layout.

### LAY-11 · Density is constant per page and set by the user
`level: advisory` · `modes: Operate` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Within a page, controls of one type (buttons, inputs, table rows, list items) share one density level. Density changes through a user setting, not automatically at a breakpoint, and never pushes targets below A11Y-10 or CMP-06.

**Why.** Mixed densities make one control look like two different controls, and density that changes with window width surprises people who resize. Material makes density user-controlled for this reason. Carbon allows a dense section inside a page; treat that as a declared exception, not a default.

**Check.** `uie audit --checks census` groups visible controls by type and reports pages where one type renders at more than one height or inset, and control heights that change across the matrix widths.

**Fix.** Set density through one token set applied at the page or app level (Material's levels each remove about 4 px of height), with a user toggle when both densities are needed.

**Exceptions.** A deliberately compact table inside an otherwise comfortable page, recorded in `DESIGN.md`.

**Sources.** [PLAT-038]; Material 3 density; IBM Carbon spacing; Shopify App Design Guidelines layout (ideas only).

### LAY-12 · One primary action per view
`level: advisory` · `modes: all` · `status: active` · `verify: A/D (design critic; uie audit --checks states)`

**Rule.** Each view has one visually dominant primary action: the one declared for the surface, and the first action a reader finds. At page level it may be the most prominent control. Button counts per region and equal sizes within a group are CMP-16 in [components-states.md](components-states.md); accent use is COL-09 in [color.md](color.md).

**Why.** Competing primaries split attention and slow the decision. The design systems reviewed agree on limiting them: Apple to one or two prominent buttons per view, GOV.UK to one default button per page, Ant Design to one primary per button area.

**Check.** The design critic names the primary action from the capture and compares it with the one declared for the surface. `uie audit --checks states` supplies CMP-16's per-region counts as supporting evidence.

**Fix.** Demote competing actions to the secondary variant of the shared button; move rare actions into menus.

**Exceptions.** Independent cards or panels may each hold one primary action (CMP-16; Polaris's per-card rule, ideas only).

**Sources.** [CRAFT-046, PLAT-110, PLAT-063, 05 C13]; Apple buttons; GOV.UK button; Ant Design buttons; Material 3 usability.

### LAY-13 · Hierarchy survives the squint test
`level: advisory` · `modes: all` · `status: active` · `verify: A (design critic)`

**Rule.** With detail blurred (`filter: blur(8px)` on the capture), the primary, secondary and tertiary elements and the groups are still identifiable, and the elements that draw the eye first match the intended top three. The page is understandable from its headings alone.

**Why.** Blurring removes the words and leaves weight, size, contrast and position, which is what people take in at first glance. Hierarchy that only works once the words are read is not doing its job.

**Check.** The design critic names the top three elements from the blurred capture before reading the page, compares them with the declared focal element, and reads the headings alone as an outline. The two-second test (a person names primary, secondary and tertiary content within two seconds) is a human check at L3. This is judged evidence and never gates by itself.

**Fix.** Strengthen the primary element through weight, size or contrast, or quieten its competitors. De-emphasising secondary content usually works better than enlarging the primary.

**Sources.** [CRAFT-046]; Hallmark self-critique (hierarchy); impeccable `layout` (squint test); ui-craft finish bar (blur 8 px); gstack design review (first three fixations); OpenAI frontend guide (scan by headlines); Refactoring UI.

### LAY-14 · Safe areas and viewport units
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint)`

**Rule.** Fixed and sticky bars at screen edges pad by `env(safe-area-inset-*)` so controls never sit under a notch, rounded corner or home indicator. Full-height layouts use dynamic viewport units (`dvh`), because `100vh` does not shrink when a mobile browser shows its toolbars. On desktop, critical controls do not sit at the very bottom edge of a resizable window.

**Why.** Edge-anchored controls that ignore these areas end up partly covered or unreachable on phones.

**Check.** `uie lint` reports fixed or sticky edge elements without safe-area padding and full-height containers sized with `100vh`. The 375 px capture is reviewed for covered controls.

**Fix.** Add the inset to the bar component's padding, for example `max(var(--space-inset), env(safe-area-inset-bottom))`, and use `100dvh` in the layout shell.

**Exceptions.** Desktop-only internal tools.

**Sources.** [PLAT-037]; Apple layout; Vercel Web Interface Guidelines (safe-area insets); ibelick `baseline-ui` and ui-ux-pro-max (dynamic viewport units).

### LAY-15 · Stacking order is tokenised
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit --checks census)`

**Rule.** z-index values come from a named layer scale in this order: base content, sticky navigation, popups and menus, scrim, modal, toast, tooltip. No values outside the scale, such as 9999.

**Why.** Ad-hoc z-index values end in menus hidden behind headers and tooltips under dialogs. A named order makes layering a decision made once. A menu opened from a sticky header needs a layer above that header.

**Check.** `uie lint` reports z-index literals outside token files. `uie audit --checks census` reports computed z-index values that are not in the scale.

**Fix.** Define the layer tokens (for example `--z-sticky`, `--z-popup`, `--z-scrim`, `--z-modal`, `--z-toast`, `--z-tooltip`) and replace the literals.

**Exceptions.** Stacking inside a component that creates its own stacking context (for example with `isolation: isolate`), recorded as a convention in `DESIGN.md`.

**Sources.** [PLAT-074]; Atlassian elevation (ideas only); impeccable v3 interaction design; ibelick `baseline-ui`.

## 3. Decisions to make

Record these in the layout section of `DESIGN.md` (spacing tokens, DEC-02) and the layout component, with a reason for each in the decisions log. Mode sets the defaults; the brand's "X, not Y" attributes choose within them.

| Decision | Options | How mode and brand choose |
|---|---|---|
| Spacing base and scale | 4 px base with an 8 px rhythm (Fluent, Primer, Radix, Tailwind, Semi) · 8 px base with smaller nested steps (Carbon's 8 px mini unit, Material, Atlassian) · 5 px (GOV.UK services only) | Default to the detected framework's unit. The 8-point grid with a 4-point baseline for type is the common middle. GOV.UK's scale is tuned to its own 19 px body text and typeface, so it stays with GOV.UK services. Name steps by role (inset, stack, section) and record any optical extras (2, 6, 10). |
| Breakpoints | the detected framework's set · Material's width classes (600, 840, 1200, 1600) | Use the framework's own set when `uie detect` finds one, because fighting the framework's tokens creates drift; for example Tailwind 640, 768, 1024, 1280, 1536 (v4.3, as of 2026-07), Ant Design 480 to 1920, Carbon 320, 672, 1056, 1312, 1584, GOV.UK 320, 641, 769. Use Material's classes when there is no framework or the product follows Material. Keep the boundary near 768 that nearly every system shares. TDesign sets 768, 992, 1200 deliberately below common screen widths so a scrollbar cannot flip the layout in Safari. |
| Grid | 12 columns (Fluent, TDesign) · 16 (Carbon at large widths) · 24 (Ant Design) · content-led key lines | Operate surfaces with many regions benefit from a declared grid. Read and Persuade surfaces can be content-led as long as key lines hold (LAY-07). |
| Panes and margins | Material classes · Primer ranges · declared custom set | LAY-09; list-detail and supporting-pane layouts for Operate. |
| Content width | app cap near 1280 px · prose column of two-thirds · full-bleed bands | Read surfaces cap prose; Persuade surfaces may run media bands full-bleed (LAY-10). |
| Density | comfortable · compact (one or two Material levels below default) · user toggle | Tools used all day lean compact with a toggle; consumer and first-use flows lean comfortable; neither goes below target minimums (LAY-11). |
| Hierarchy per surface | the primary action and the focal element | Recorded per surface in the direction contract's first-viewport block (LAY-12, LAY-13). |
| Layers | named z-index tokens | Fixed order (LAY-15); values per project. |

Two contrasting illustrations, not recommendations:

- **A logistics dashboard** (Operate). 4 px base, compact density with a comfortable toggle, a 12-column grid, list and detail panes from 840 px. Section spacing stays tight because dispatchers scan many regions all day. Each panel has one primary action, such as "Assign driver".
- **A municipal recycling service** (a Persuade landing with Read guides). An 8 px rhythm with generous section breaks, one column on phones and a two-thirds prose column on desktop for the collection rules, no grid beyond its key lines. One primary action per page: "Find your collection day".

## 4. How to fix common failures

Fix at the narrowest correct layer (token, then shared component, then local), one finding at a time, and re-run the originating check plus `uie diff --visual` against the baseline to catch collateral movement (FRAMEWORK §10). In the fix queue, layout and spacing come right after tokens and before typography and colour, because later fixes inherit their geometry [IMP-045].

| Failure | Narrowest fix | Verify |
|---|---|---|
| Off-scale literals (LAY-01) | Token: snap to the nearest step; add a step only if it is needed repeatedly | `uie lint`; `uie audit --checks census` |
| One gap everywhere (LAY-02) | Layout primitive: within, between and section tokens | `uie audit --checks census` |
| Heading floats between sections (LAY-03) | Shared heading or prose styles: block-start step larger than block-end | `uie audit --checks layout` |
| Text touching a badge or button edge (LAY-04) | Shared component: padding tokens | `uie audit --checks layout` |
| Text against the phone edge (LAY-05) | Layout shell: page gutter token | `uie audit --checks layout` at 320 and 375 |
| Horizontal scroll at 320 px (A11Y-07, FUN-05) | Shared layout: `min-width: 0` on flex and grid children, `minmax(0, 1fr)` tracks, `overflow-wrap: anywhere` on long strings | `uie audit --checks layout` |
| A function missing at narrow widths (LAY-08) | Responsive component: overflow menu or sheet instead of `display: none` | `uie audit` at all matrix widths |
| Two dominant buttons in one view (LAY-12) | Shared button: secondary variant | design critic; `uie audit --checks states` |
| Menu hidden behind a sticky header (LAY-15) | Token: layer scale | `uie lint`; `uie probe` opening the menu |
| Bottom bar under the home indicator (LAY-14) | Shared bar component: safe-area padding | `uie lint`; 375 px capture |

## 5. CJK and localisation notes

- **Chinese enterprise systems.** TDesign uses an 8 px unit with 4 and 12 as extras, a 12-column grid with a 16 px gutter and 24 px margins, and collapses its side navigation below 992 px. Ant Design uses a 24-column grid and vertical spacing in steps of 8 + 8n. Follow the system the project already uses.
- **Density.** Chinese commerce and super-app interfaces are often denser than Western products; whether density rules should differ for zh-CN is still an open research question. Keep density constant per page (LAY-11) and the target-size floors, and record a deliberately dense choice in `DESIGN.md`.
- **Form labels.** Top-aligned by default. Right-aligned labels with colons fit only dense desktop zh-CN enterprise forms with short labels at widths of 1024 px and above, and never mix with top-aligned labels on one form [05 C8].
- **Direction.** Use logical properties (`margin-inline-start`, `padding-block`) so spacing and alignment mirror in right-to-left locales and adapt to vertical text [PLAT-138].
- **Expansion.** Translations run longer than English (Material estimates about 1.5 times); leave room in fixed-width layouts and test with the hardening fixtures.

## Sources

Research adopt items: CRAFT-041, CRAFT-046, IMP-018, IMP-045, PLAT-014, PLAT-030 to PLAT-038, PLAT-041, PLAT-063, PLAT-074, PLAT-110, PLAT-138, DSL-027, TOOL-27, TOOL-29; conflict rulings 05 C8, C13, C19, C21; 07 C18.

- Material Design 3 layout: breakpoints, grids and spacing, density, canonical layouts, 2026, https://m3.material.io/foundations/layout/breakpoints
- IBM Carbon spacing and 2x Grid (Apache-2.0), 2026, https://carbondesignsystem.com/elements/spacing/overview/
- Microsoft Fluent 2 layout (MIT), 2026, https://fluent2.microsoft.design/layout
- GitHub Primer layout and responsive foundations (MIT), 2026, https://primer.style/product/getting-started/foundations/layout
- GOV.UK Design System, spacing and layout, 2026, https://design-system.service.gov.uk/styles/layout/
- Apple Human Interface Guidelines, Layout, 2026, https://developer.apple.com/design/human-interface-guidelines/layout
- Radix Themes spacing and breakpoints (MIT), 2026, https://www.radix-ui.com/themes/docs/theme/breakpoints
- Tailwind CSS `theme.css` v4.3 (MIT), 2026, https://github.com/tailwindlabs/tailwindcss
- Ant Design layout and proximity specs (MIT), 2026, https://ant.design/docs/spec/layout-cn
- TDesign layout guidelines (MIT), 2026, https://github.com/Tencent/tdesign
- Shopify App Design Guidelines, layout (ideas only; licence restricts reuse), 2026, https://shopify.dev/docs/apps/design
- Atlassian Design System, spacing and elevation (ideas only; licence restricts reuse), 2026, https://atlassian.design/foundations/spacing
- spec.fm, The 8-Point Grid, https://spec.fm/specifics/8-pt-grid
- Vercel Web Interface Guidelines (MIT), 2026, https://github.com/vercel-labs/web-interface-guidelines
- impeccable, `layout`, `craft-floor` and detector (Apache-2.0), 2026, https://github.com/pbakaus/impeccable
- ui-craft finish bar (MIT), 2026, https://github.com/educlopez/ui-craft
- Hallmark slop test (MIT), 2026, https://github.com/Nutlope/hallmark
- Wathan and Schoger, Refactoring UI (paraphrased), https://www.refactoringui.com/book/table-of-contents

Licence notes: values from Material tokens, Carbon, Fluent, Primer, Radix, Tailwind, Ant Design, TDesign and impeccable are re-expressed with attribution in `NOTICE.md`. Shopify Polaris and the Atlassian Design System contribute ideas only. GOV.UK material: contains public sector information licensed under the Open Government Licence v3.0.
