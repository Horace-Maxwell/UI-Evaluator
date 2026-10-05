# Shape and depth

This file covers corner radius, nesting, shape semantics, elevation, shadows, borders, scrims and translucent materials. It serves gate G3 (SHP-01 and SHP-02) and defines the radius and elevation tokens that DEC-02 requires in `DESIGN.md`. Dark-theme surface colours are COL-04 and COL-12 in [color.md](color.md); focus visibility and focus-indicator quality are A11Y-04 and A11Y-12 in [accessibility.md](accessibility.md) and CMP-02 in [components-states.md](components-states.md); the card kit, decorative glow and radius monotony are tells SLP-07, SLP-08 and SLP-23 in [anti-slop.md](anti-slop.md); animating blur and shadows is covered in [motion.md](motion.md); the stacking order of layers (z-index tokens) is LAY-15 in [layout.md](layout.md). Read this file when setting radius and elevation tokens in `direct` or `build`, and when fixing an SHP finding.

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules): gate SHP-01 and SHP-02, advisory SHP-03 to SHP-13
3. [Decisions to make](#3-decisions-to-make)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles

1. **Shape follows size and role.** Radius grows with the component, so corners look equally soft at every scale. One radius on everything is a default, not a system.
2. **Nested corners share a centre.** An inner corner that ignores the outer one looks pinched or flared, which people notice even when they cannot name it.
3. **Shape conventions carry meaning.** Square checkboxes, round radio buttons and circular avatars tell people what a thing is before they read a label. A global radius setting must not erase that.
4. **Depth explains layering.** Surfaces are flat or tonal by default; a shadow says "this floats above the page". Shadows everywhere stop saying anything.
5. **One light, one edge.** All shadows come from the same direction, and each surface separates itself in one way: a border, a shadow or a tonal shift.
6. **In the dark, height is light.** Shadows vanish on dark ground, so dark themes show elevation with lighter surfaces.
7. **The removal test.** If the design still reads well with every decorative shadow removed, those shadows were decoration (OpenAI's litmus check).

## 2. Rules

Gate rules come first and repeat the G3 thresholds exactly. Advisory rules (`level: advisory`) raise findings for the design panel and the code reviewer but never fail G3 on their own. Check names in `--checks` follow `uie audit --help`.

### SHP-01 · Concentric nesting
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout)`

**Rule.** Concentric nesting: when an inset child's padding from the parent edge is smaller than the parent radius, the child's radius ≤ parent radius − padding; otherwise the child's radius ≤ the parent radius.

**Why.** When a rounded element sits inside a rounded container, the two corners share a centre only if the inner radius equals the outer radius minus the gap between them. A larger inner radius makes the inner corner bulge toward the outer one.

**Check.** `uie audit --checks layout` finds children inset in a rounded parent so that they share its corner (the child's edges sit at the parent's padding on two adjacent sides, as with an image or panel inside a card) and compares the child's radius with max(0, parent radius − padding).

**Fix.** Derive the inner radius from the outer one in the shared component, for example `border-radius: max(0px, calc(var(--radius-surface) - var(--space-inset)))`. Re-run `uie audit --checks layout`.

**Exceptions.** Elements whose shape carries meaning: avatars, radio buttons, status dots (SHP-05).

**Sources.** [CRAFT-023, PLAT-070, DSL-028]; Apple WWDC25 "Get to know the new design system" (concentric shapes); Material 3 shape (optical roundness); Vercel Web Interface Guidelines (nested radii).

### SHP-02 · Elevation economy
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census,tells)`

**Rule.** ≤ 4 distinct shadow styles in use per theme; no in-flow surface combining a ≤ 1.5 px border with a shadow blur ≥ 24 px **[calibrating]** (floating layers exempt); every non-focus shadow has at least one layer with a non-zero offset (spread-only rings count as borders).

**Why.** Few levels keep each one meaningful: Material asks for few levels for that reason, and Ant Design and Atlassian use four. A hairline border under a wide soft shadow is two edge treatments and no commitment, a frequent fingerprint of generated UI. A blurred shadow without an offset is a glow, not depth. The 24 px blur figure is a UI-Evaluator heuristic; the source detector publishes no blur value.

**Check.** `uie audit --checks census` collects computed `box-shadow` values on visible elements, per theme. It excludes `:focus-visible` rings and spread-only rings with zero blur (borders drawn with `box-shadow`), normalises colours, and counts distinct styles. It reports elements that pair a visible border of 1.5 px or less with any shadow layer of 24 px blur or more, and shadows whose blurred layers all have zero offset.

**Fix.** Consolidate shadows into at most four elevation tokens and point components at them. For a ghost card, keep the border or the shadow, not both (SHP-09). For a zero-offset halo, give the shadow an offset from the shared light direction (SHP-08) or remove it; chromatic halos are SLP-08. If a floating layer in a dark theme needs a light hairline with its shadow, keep the blur under the threshold or ask the owner for a value-scoped waiver, since G3 waivers are the owner's decision (QUALITY-BAR §2.3). Re-run `uie audit --checks census,tells`.

**Exceptions.** Focus indicators, as the criterion states.

**Sources.** [PLAT-072, CRAFT-022, IMP-023]; impeccable `gpt-thin-border-wide-shadow` and `dark-glow`; Material 3 elevation; Ant Design shadows; Atlassian elevation (ideas only).

### SHP-03 · Radius scale tied to component size
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** One documented radius scale, with each role on one step and steps growing with component size: small details and badges smallest, then controls, then cards and menus, then dialogs and sheets; full rounding for people and for small pill-shaped controls (SHP-06). Every element of a role renders the same radius.

**Why.** Radius that grows with size keeps corners looking equally soft at every scale. ui-craft calls uniform radius the most recognisable sign of generated UI, and a radius that varies within one role looks like drift.

**Check.** `uie audit --checks census` groups computed `border-radius` by role (badge, button, input, card, menu, dialog) and reports roles with more than one value and orderings in which a smaller component has a larger radius than a larger one.

**Fix.** Define role tokens (illustrative names: `--radius-detail`, `--radius-control`, `--radius-surface`, `--radius-overlay`) and point components at them.

**Exceptions.** A declared single-radius system, all square or all soft, applied by rule and recorded in `DESIGN.md`.

**Sources.** [PLAT-071, CRAFT-043, DSL-028]; Material 3 shape; Fluent 2 shapes; Primer; Semi Design; Atlassian radius (ideas only); ui-craft finish bar.

### SHP-04 · Square where shapes meet the viewport or each other
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout)`

**Rule.** Edges flush with the viewport (full-width bars, docked sheets, edge-to-edge media on phones) are not rounded on the flush side. Parts of one control that touch (split buttons, segmented controls) are not rounded or separated at the joint.

**Why.** A rounded corner against the screen edge shows a sliver of background and makes the element look detached. Rounding at a joint splits one control into two.

**Check.** `uie audit --checks layout` reports elements touching a viewport edge with a non-zero radius on the touching corners, and adjacent parts of one control with rounded inner corners.

**Fix.** Override the radius on the flush side in the docked variant of the component, using logical corner properties such as `border-start-start-radius`.

**Exceptions.** Floating elements inset from the edge, such as an action bar with a margin.

**Sources.** [PLAT-071]; Fluent 2 shapes.

### SHP-05 · Shape keeps its meaning
`level: advisory` · `modes: all` · `status: active` · `verify: D/A (uie audit --checks census; design critic)`

**Rule.** Radius changes never erase semantic shapes: checkboxes stay visibly square (radius below half their side), radio buttons round, avatars of people circular, toggle tracks and tags pill-shaped. Expressive or abstract shapes go only on mostly visual elements, never on text-heavy containers.

**Why.** People tell a checkbox from a radio button by its shape before they read the label; a fully rounded checkbox looks like a radio. Radix Themes pins the checkbox shape for this reason, and Material reserves its expressive shapes for visual elements.

**Check.** `uie audit --checks census` reports checkboxes whose radius is half their side or more, and checkbox and radio pairs that render the same shape. The design critic reviews expressive shapes on text containers.

**Fix.** Pin the checkbox radius in the checkbox component, independent of any global radius factor.

**Sources.** [PLAT-071]; Radix Themes radius; Fluent 2 shapes (circles for people, pills for tracks and tags); Material 3 shape.

### SHP-06 · Capsules are a declared choice
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Without a capsule system declared in `DESIGN.md`, full rounding is for small controls only: chips, tags, toggles, badges and compact buttons. Cards, panels, text areas and multi-line inputs are not capsules.

**Why.** Pill-shaped everything is a recurring default in generated UI; Anthropic's prompting notes for Claude Opus 5.5 list pill-shaped buttons among the defaults to name and avoid (as of 2026-10). A capsule system can be right, as Material's pill buttons show, but it has to be chosen.

**Check.** `uie audit --checks census` reports containers other than small controls whose radius is at least half their height.

**Fix.** Give the container its role radius from SHP-03.

**Exceptions.** A declared capsule system, such as Material's default button shape.

**Sources.** [CRAFT-043, IMP-054]; impeccable craft floor (pills only for small controls); Material 3 shape; 07 A-SU2.

### SHP-07 · Few elevation levels, tonal first
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Name at most four elevation levels (for example sunken, base, raised and overlay) and pair each surface token with its shadow token. In-flow cards are flat, separated by a border or a tonal surface, unless `DESIGN.md` declares a shadow-based depth strategy. Shadows go on floating layers (menus, popovers, dialogs, toasts) and on items being dragged.

**Why.** Shadows on everything stop meaning "this floats". Material depicts elevation with tonal surfaces first and keeps shadows for elements that need separation from busy backgrounds or that invite interaction; Semi Design keeps cards flat with a border and shadows for floating layers.

**Check.** `uie audit --checks census` reports in-flow card-like elements with a resting shadow when the declared strategy is flat or tonal, and shadows that match none of the paired elevation tokens.

**Fix.** Remove the shadow in the card component and use the declared surface step; keep shadows in the overlay components.

**Exceptions.** Interactive cards that rise one level on hover, as Material does; a declared shadow-based strategy.

**Sources.** [PLAT-072, DSL-029]; Material 3 elevation; Semi Design `DESIGN.md`; Ant Design shadows; Atlassian elevation (ideas only).

### SHP-08 · Layered shadows from one light source
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Elevation shadows have at least two layers, a tight ambient layer and a softer directional one. All shadows share one offset direction; higher levels have larger offset and blur and lower opacity. On tinted grounds, shadow colour leans toward the surface hue instead of pure black.

**Why.** A single blurred layer looks flat and smudgy, while stacked layers fall off the way real shadows do. Mixed directions imply several lights and make the layout look assembled from parts.

**Check.** `uie audit --checks census` parses each elevation shadow into layers and reports single-layer elevation shadows, shadows whose offset direction differs from the rest, and levels whose blur does not grow with elevation.

**Fix.** Rebuild the elevation tokens as layered values and change the tokens, not the components. Constructions to start from: Ahlin's stack doubles offset and blur at each layer at low opacity; Fluent pairs an ambient layer with a directional layer whose vertical offset is half its blur; Comeau notes that a vertical offset about twice the horizontal is typical.

**Exceptions.** Edge-docked layers (bottom bars, side drawers, fixed table columns) cast toward the content they cover, as Ant Design does. Hard offset shadows belong only to a declared neo-brutalist direction.

**Sources.** [CRAFT-042, DSL-029]; Comeau, Designing beautiful shadows; Ahlin, Smoother and sharper shadows; Vercel Web Interface Guidelines (layered, hue-tinted shadows); Fluent 2 elevation; Ant Design shadows; Refactoring UI (two-part shadows).

### SHP-09 · One edge treatment per surface
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Each surface separates itself in one way: a border, a shadow or a tonal shift. The product picks one depth strategy (borders only, tonal surfaces, subtle shadows or layered shadows) and applies it throughout. Hover and pressed states change either the surface colour or the elevation, not both.

**Why.** Two edge treatments on one surface blur the elevation system and add noise, and mixed strategies make the product look assembled from several kits. SHP-02 gates the extreme case; this rule covers the rest.

**Check.** `uie audit --checks census` reports surfaces with both a visible border and a resting shadow, and counts the depth strategies used across card-like components.

**Fix.** Drop one treatment in the component and record the strategy in `DESIGN.md`.

**Exceptions.** Floating layers in dark themes, where a light hairline with a shadow separates dark from dark (Semi Design's dark theme does this). A deliberate crisp edge made of a translucent border and a small shadow (Vercel), recorded with its reason.

**Sources.** [CRAFT-042, DSL-029]; interface-design (one depth strategy); Atlassian elevation (ideas only); Vercel Web Interface Guidelines; Semi Design `DESIGN.md`.

### SHP-10 · In dark themes, elevation is lightness
`level: advisory` · `modes: all` · `status: calibrating` · `verify: D/A (uie audit --checks census; design critic)`

**Rule.** In a dark theme each elevation level is a lighter surface than the level below, with steps people can see; shadows support elevation but do not carry it. COL-04 in [color.md](color.md) gates the minimum: no elevated surface darker than the base.

**Why.** Shadows are hard to see on dark ground, so Material, Apple, Carbon and Atlassian all show height by lightening the surface.

**Check.** Under dark emulation, `uie audit --checks census` reports the composited lightness of each elevation level and flags levels that do not increase. The design critic confirms that adjacent levels are distinguishable on the dark capture. Calibrations, not targets: Material's earlier dark guidance lightened surfaces with white overlays from 5% at the first level to 16% at the highest, and ui-craft, as an expert heuristic without published evidence, asks for surface steps of at least 2% luminance in light themes and 4% in dark ones.

**Fix.** Assign each level a lighter step of the dark neutral ramp in the theme map.

**Exceptions.** Sunken wells and inset inputs, which are darker on purpose.

**Sources.** [CRAFT-040, PLAT-066, DSL-029]; Material dark theme; Apple Dark Mode; IBM Carbon themes; Semi Design `DESIGN.md`; ui-craft finish bar.

### SHP-11 · Scrims behind modals
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Modal backdrops use one scrim token in the band of roughly 32–60% opacity (Material's scrim role uses 32%, Arco's mask 60%). When to use a modal, one modal at a time and the rest of the dialog pattern are CMP-20 in [components-states.md](components-states.md); the focus contract is A11Y-06 in [accessibility.md](accessibility.md).

**Why.** The scrim says that the page behind is unavailable and keeps the dialog's edge legible. Too light, and the page looks still active; too dark, and people lose their context.

**Check.** `uie audit --checks census` reads the computed background opacity of modal backdrops in the dialog state recipes and reports values outside the band or more than one scrim value.

**Fix.** Set one scrim token in the overlay component.

**Exceptions.** Non-modal drawers and popovers, which have no scrim.

**Sources.** [PLAT-073]; Material 3 elevation (scrim); Arco style guide; Apple modality; IBM Carbon notifications.

### SHP-12 · Translucent materials only for floating navigation
`level: advisory` · `modes: all` · `status: active` · `verify: S/P (uie lint; uie audit --checks contrast)`

**Rule.** Translucent or blurred surfaces ("glass") are used only for floating navigation and control layers over content: never in the content layer, never glass on glass, and at most one or two per view. Text on them passes contrast over the busiest background that can sit behind them (Apple adds a dark dimming layer of about 35% over bright media), and a solid fallback applies under `prefers-reduced-transparency: reduce`.

**Why.** Blur explains depth only where content scrolls beneath it. Elsewhere it is decoration that costs contrast and rendering time, and some people switch transparency off.

**Check.** `uie lint` counts `backdrop-filter` surfaces per view and checks for a reduced-transparency fallback. `uie audit --checks contrast` samples text on glass over the worst background in the captures; A11Y-11 decides pass or fail.

**Fix.** Make content-layer glass solid with a surface token, and add the media-query fallback to the floating bar component. Do not animate large blurred surfaces (see [motion.md](motion.md)).

**Exceptions.** Web apps on the `apple` platform profile follow Apple's materials guidance and still need the fallback; label any web imitation of Apple's materials as an approximation.

**Sources.** [PLAT-075, 02 X17]; Apple materials; Apple WWDC25 "Meet Liquid Glass"; gstack design checklist (`backdrop-filter` on more than one container); taste-skill (approximations labelled as such).

### SHP-13 · Focus rings follow the component's shape
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks keyboard)`

**Rule.** Focus rings stay concentric with the shape they surround: a ring outside the component uses the component's radius plus the ring offset, and a ring inside uses the radius minus the inset, both derived from the SHP-03 radius tokens. The full focus style (width, offset, colour, instant display) is CMP-08 in [components-states.md](components-states.md); its quality is CMP-02 and its visibility A11Y-04 in [accessibility.md](accessibility.md).

**Why.** A square ring around a rounded button, or a ring whose corners cut across the button's, looks like a rendering fault and weakens the indicator.

**Check.** The same measurement as CMP-08: `uie audit --checks keyboard` reads the ring's radius from the focused crop and compares it with the component radius plus the offset. Rings drawn with `outline` or `box-shadow` on the element itself follow its radius in current engines **[unverified]**, so most failures come from rings drawn on a pseudo-element or wrapper.

**Fix.** Set the ring radius from tokens in the shared focus style, for example `calc(var(--radius-control) + var(--focus-offset))`.

**Sources.** [PLAT-051, PLAT-070]; material-web focus ring (3 px wide, 2 px outward offset); Atlassian radius and border (ideas only); Apple concentric shapes.

## 3. Decisions to make

Record these in the shapes and elevation sections of `DESIGN.md` (radius and elevation tokens, DEC-02), with a reason for each in the decisions log. Mode and platform profile set the defaults; the brand's "X, not Y" attributes choose within them.

| Decision | Options | How mode and brand choose |
|---|---|---|
| Radius scale | a short scale of small steps · a softer scale of larger steps · one declared radius applied by rule | An attribute such as "engineered, not cold" points to small radii and hairlines; "friendly, not childish" to larger radii with pills only for small controls [07 §4.1]. Operate surfaces keep controls close to the platform profile's conventions (P3). Record the role of each step (SHP-03). |
| Capsules | none · small controls only (default) · a declared capsule system | Declare a capsule system only on purpose (SHP-06). |
| Depth strategy | borders only · tonal surfaces · subtle shadows · layered shadows | "Serious" leans to borders and surface shifts; "tactile" to layered, hue-tinted shadows [07 §4.1]. Undeclared, the default is flat or tonal surfaces with shadows only for floating and dragged layers, the consensus of the platform systems (SHP-07). On Persuade surfaces decide it rather than inherit it: a referent made of paper or card (a ticket, a tag, a practice sheet) usually reads better with the soft shadow a real sheet casts. |
| Depicted objects | drawn or photographed objects from the referent | A ticket, tag or seal drawn as an object is imagery, not UI elevation. It may cast one soft, single-light shadow (SHP-08) without declaring a shadow strategy for cards, and it is not counted against SHP-07 (ADR-035). |
| Elevation levels | up to four named levels with paired surface and shadow tokens | Include the dark-theme mapping, where each level is lighter (SHP-10). |
| Light direction | one offset direction for every shadow | Declare the exceptions for edge-docked layers (SHP-08). |
| Scrim | one token in the 32–60% band | SHP-11. |
| Translucency | none · floating navigation only | SHP-12; never in the content layer. |
| Focus-ring geometry | ring width, offset and colour (components-states.md) plus the radius rule here | SHP-13. |

Two contrasting illustrations, not recommendations:

- **A bicycle-parts inventory** (Operate). A short scale of small radii, one step apart from details to dialogs. Square corners where the stock table meets the viewport and between the segmented filter buttons. Borders-only depth with a sunken tonal well behind the table; shadows only on menus and on a storage bin while it is dragged to a new position.
- **A language-learning flashcard app** (practice screens declared Experience). A softer scale of larger radii, with capsule chips for answer choices. Flashcards rest one level up and lift another while dragged or flipped, because the card is the object being handled and its elevation carries meaning. One scrim, behind the end-of-session summary.

## 4. How to fix common failures

Fix at the narrowest correct layer (token, then shared component, then local), one finding at a time, and re-run the originating check plus `uie diff --visual` against the baseline (FRAMEWORK §10). Radius and elevation are almost always token problems: a role token fixes every instance at once.

| Failure | Narrowest fix | Verify |
|---|---|---|
| Inner corner bulges toward the outer one (SHP-01) | Shared component: derive the inner radius from the outer token minus the padding | `uie audit --checks layout` |
| Six shadow styles in one product (SHP-02) | Token: consolidate into at most four elevation tokens | `uie audit --checks census` |
| Hairline border under a wide soft shadow (SHP-02) | Shared card: keep the border or the shadow | `uie audit --checks census,tells` |
| Glow standing in for depth (SHP-02, SLP-08) | Token: an offset elevation shadow, or none | `uie audit --checks tells` |
| One radius on every element (SHP-03, SLP-23) | Token: role radii | `uie audit --checks census` |
| Rounded corners against the screen edge (SHP-04) | Shared component: docked variant with square flush corners | `uie audit --checks layout` |
| Checkbox as round as a radio button (SHP-05) | Shared checkbox: pinned radius | `uie audit --checks census` |
| A shadow on every card (SHP-07) | Shared card: flat surface token | `uie audit --checks census` |
| Dark dialog darker than the page (COL-04, SHP-10) | Token: dark-theme surface map | `uie audit --checks census,contrast` under the dark theme |
| Glass in the content layer, no fallback (SHP-12) | Token: solid surface; shared bar: media-query fallback | `uie lint`; `uie audit --checks contrast` |
| Square focus ring on a rounded button (SHP-13) | Shared focus style: ring radius from tokens | `uie audit --checks keyboard` |

## 5. CJK and localisation notes

- **Direction.** One-sided radii and directional shadows (docked sheets, drawers) use logical properties so they mirror with the layout in right-to-left locales [PLAT-138].
- **Enterprise defaults.** Chinese enterprise systems ship small radii (Ant Design 2 to 8 px; Semi Design 3, 6 and 12 px). These are each system's taste choices, not evidence; keep them when the project uses the library, and decide them deliberately otherwise.
- The research found no CJK-specific rules for shape or elevation.

## Sources

Research adopt items: CRAFT-022, CRAFT-023, CRAFT-040, CRAFT-042, CRAFT-043, IMP-023, IMP-054, PLAT-051, PLAT-066, PLAT-070 to PLAT-075, PLAT-138, DSL-028, DSL-029; conflict rulings 02 X17; 07 A-SU2 to A-SU5.

- Apple, WWDC25 "Get to know the new design system", 2025, https://developer.apple.com/videos/play/wwdc2025/356/
- Apple, WWDC25 "Meet Liquid Glass", 2025, https://developer.apple.com/videos/play/wwdc2025/219/
- Apple Human Interface Guidelines, Materials and Dark Mode, 2026, https://developer.apple.com/design/human-interface-guidelines/materials
- Material Design 3 shape and elevation (Apache-2.0 token code), 2026, https://m3.material.io/styles/shape
- Material Design 2 dark theme, https://m2.material.io/design/color/dark-theme.html
- material-web focus ring tokens (Apache-2.0), https://github.com/material-components/material-web
- Microsoft Fluent 2 shapes and elevation (MIT), 2026, https://fluent2.microsoft.design/shapes
- IBM Carbon themes (Apache-2.0), 2026, https://carbondesignsystem.com/elements/themes/overview/
- Radix Themes radius and shadows (MIT), 2026, https://www.radix-ui.com/themes/docs/theme/radius
- GitHub Primer primitives (MIT), 2026, https://primer.style/product/primitives/size
- Ant Design shadow spec (MIT), 2026, https://ant.design/docs/spec/shadow-cn
- Semi Design `DESIGN.md` (MIT), 2026, https://github.com/DouyinFE/semi-design
- Arco Design style guideline (MIT), 2026, https://github.com/arco-design/arco-doc-site
- Atlassian Design System, radius and elevation (ideas only; licence restricts reuse), 2026, https://atlassian.design/foundations/elevation
- Comeau, Designing beautiful shadows in CSS, 2021 (updated 2026), https://www.joshwcomeau.com/css/designing-shadows/
- Ahlin, Smoother and sharper shadows with layered box-shadows, 2019, https://tobiasahlin.com/blog/layered-smooth-box-shadows/
- Vercel Web Interface Guidelines (MIT), 2026, https://github.com/vercel-labs/web-interface-guidelines
- impeccable, `craft-floor` and detector (Apache-2.0), 2026, https://github.com/pbakaus/impeccable
- interface-design (MIT), 2026, https://github.com/Dammyjay93/interface-design
- ui-craft finish bar (MIT), 2026, https://github.com/educlopez/ui-craft
- Anthropic, prompting notes for Claude Opus 5.5 (frontend defaults), 2026, https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5
- OpenAI, Designing delightful frontends with GPT-5.4, 2026, https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4
- Wathan and Schoger, Refactoring UI (paraphrased), https://www.refactoringui.com/book/table-of-contents

Licence notes: values from Material tokens, material-web, Fluent, Carbon, Radix, Primer, Ant Design, Semi, Arco and impeccable are re-expressed with attribution in `NOTICE.md`. The Atlassian Design System contributes ideas only; no values or text are copied from it. Apple guidance is paraphrased, not quoted.
