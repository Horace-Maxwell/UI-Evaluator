# Colour

This file covers colour as a system: role tokens and ramps, the colour strategy of each surface, neutrals, accents, semantic colours, gradients, dark themes and the surfaces the browser draws itself. It serves gate G3 (COL-01 to COL-04) and defines the colour tokens and strategy that DEC-02 requires in `DESIGN.md`. Contrast pass or fail is decided in [accessibility.md](accessibility.md) (A11Y-11, A11Y-12, A11Y-19), not here; colour tells such as gradient text, the default indigo-violet accent and second-order house palettes are catalogued in [anti-slop.md](anti-slop.md). Read this file when setting colour tokens in `direct` or `build`, and when fixing a COL finding.

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules): gate COL-01 to COL-04, advisory COL-05 to COL-17
3. [Decisions to make](#3-decisions-to-make)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles

1. **Roles before swatches.** Name colours by the job they do: canvas, surface, text, border, action, focus, selection, state. Components that reference roles stay consistent and can be re-themed in one layer; components holding raw values drift apart page by page.
2. **Strategy before hue.** Decide how much of a surface is colour before choosing any colour. Picking hues first tends to produce several muted colours of equal weight and no accent, which is the statistical middle of all palettes.
3. **Judge colour in a perceptual space.** OKLCH predicts lightness, so equal lightness gives predictable contrast across hues. HSL lightness is uneven between hues, and CIELAB drifts blue toward purple as lightness changes.
4. **Scarcity carries meaning.** The accent marks action, selection and focus; semantic hues mark state; nothing relies on colour alone. A hue used everywhere signals nothing. Scarcity is not absence: when the brand has one strong colour, the primary action is usually where it belongs. Keeping the accent off the button to keep it "pure", and printing the action in ink black, leaves a warm page with a stark, heavy button. In the 2026-10-03 benchmark, both the human and the model judges named that button on three successive builds (ADR-035).
5. **Compose every theme.** A dark theme gets its own surface, accent and emphasis values, because saturation, shadows and contrast behave differently on dark ground. Inverting the light theme is not a dark theme.
6. **A default is not a decision.** A framework palette step shipped as the brand colour, or the browser's black on white, shows that nobody chose. Derive colour from the brand or the subject's own world, and record why.
7. **Contrast is a floor owned elsewhere.** WCAG 2.2 AA decides pass or fail; APCA is an advisory reading only (ADR-019).
8. **The big areas are one family.** Whatever the strategy, the large areas (ground, bands, panels) share one family and temperature, mid-sized areas take a related tone, and strong hues stay small: roughly 60/30/10 by area. Several large flat blocks of unrelated hues read as a template's colour-coding, not as a brand, even when each hue has a job. In the 2026-10-02 build benchmark, a page that gave four ticket colours one job each, two of them in full-bleed bands, lost to a single warm ground with one accent, in a human's blind judgement as well as the model's (ADR-035).

## 2. Rules

Gate rules come first and repeat the G3 thresholds exactly. Advisory rules (`level: advisory`) raise findings for the design panel and the code reviewer but never fail G3 on their own. Check names in `--checks` follow `uie audit --help`. All colour maths (OKLab and OKLCH conversion, WCAG contrast, advisory APCA) uses one library, colorjs.io, so numbers agree between layers (ADR-026). The style census clusters colours in OKLab and treats a difference below 0.02 (ΔE_OK) as one colour, so `#333`, `#333333` and `rgb(51,51,51)` count once [TOOL-27].

### COL-01 · Token conformance
`gate G3` · `modes: all` · `status: calibrating` · `verify: S (uie lint)`

**Rule.** ≥ 90% of colour declarations in component code reference tokens or variables; raw palette utilities (e.g. `bg-indigo-500`) and literal values outside token files are reported as drift unless listed in `DESIGN.md` exceptions **[calibrating]**.

**Why.** A literal colour cannot be remapped per theme, and every copy of it must be found by hand. Literals are where palettes drift between pages and where dark themes break first.

**Check.** `uie lint` counts colour-valued declarations in component files: CSS, style props, CSS-in-JS and Tailwind classes. References to tokens (`var(--…)`, theme keys, utilities generated from the declared token set) conform. Hex, `rgb()`, `hsl()` and `oklch()` literals, named colours, Tailwind arbitrary values such as `text-[#fff]`, and raw palette utilities count as drift. The keywords `transparent`, `currentColor` and `inherit` are not counted [TOOL-29]. Token files and `DESIGN.md` exceptions are excluded.

**Fix.** Replace each literal with the role token it stands for. When the same value serves the same intent three or more times and no role fits, add a token rather than another literal (impeccable's extraction rule). Re-run `uie lint`, then `uie audit --checks census` to confirm the rendered palette shrank.

**Exceptions.** Out of scope: third-party embeds and vendored code you do not style.

**Sources.** [PLAT-060, PLAT-140, CRAFT-006, IMP-051, DSL-015, TOOL-29]; impeccable `design-system-color`; stylelint-declaration-strict-value.

### COL-02 · No achromatic grey text on a chromatic background
`gate G3` · `modes: all` · `status: calibrating` · `verify: D (uie audit --checks contrast)`

**Rule.** 0 offenders (text with OKLCH chroma < 0.005 on a surface with OKLCH chroma ≥ 0.05) **[calibrating]**.

**Why.** Neutral grey on a coloured surface looks washed out and often loses contrast as well. Secondary text reads as part of a coloured surface when it is tinted from that surface's hue or built from its foreground colour.

**Check.** `uie audit --checks contrast` compares, for each visible text node, the OKLCH chroma of its computed colour with the chroma of its composited background, in every shipped theme and captured state. Near-zero text chroma on a background with chroma ≥ 0.05 is an offender.

**Fix.** Give each chromatic surface its own text roles: an `on-` pair in Material's naming grammar, or steps 11 and 12 of the surface's own ramp when the surface uses steps 3 to 5 of a Radix-style scale (COL-06). Use them in the shared component. Re-run `uie audit --checks contrast`, which also confirms the new tint still passes A11Y-11.

**Sources.** [IMP-015, CRAFT-039, CRAFT C7]; impeccable `gray-on-color`; Refactoring UI (grey on coloured backgrounds); Material 3 colour roles.

### COL-03 · Declared colour strategy is honoured
`gate G3` · `modes: all (by mode)` · `status: calibrating` · `verify: P (uie audit --checks census)`

**Rule.** Restrained: accent-hue area ≤ 10% of any viewport; Committed: dominant hue 30–60% of the surface; measured on screenshots with photos, video and illustrations masked. Full palette and Drenched are checked by advisory COL-17 **[calibrating]**.

**Why.** A strategy that is declared but not executed is not a decision. Restraint keeps the accent meaningful; a committed colour that covers only a sliver of the page reads as timid. The 10% figure sits between Hallmark's 5% and common practice and is still being calibrated.

**Check.** Read each surface's strategy from `DESIGN.md`. With none declared, Operate and Read surfaces are checked as Restrained (QUALITY-BAR §5); Persuade and Experience surfaces must declare one, and without it the criterion is `not_run` for them and DEC-02 fails. On the captures at every matrix width and theme, cluster UI pixels in OKLab with photographs, video, canvas and user content masked, then measure the accent hue's share (Restrained) or the dominant hue's share (Committed) per viewport. Full palette and Drenched are checked by COL-17.

**Fix.** Restrained over budget: take the accent off large fills (bands, card backgrounds, decorative shapes) and keep it on actions, selection, focus and status (COL-09). Committed under budget: carry the hue on a structural surface such as the page ground or a navigation band, not on more small accents. Change surface tokens, not single components, then recapture and re-run `uie audit --checks census`.

**Sources.** [CRAFT-038, IMP-010, DSL-017]; Hallmark slop test gate 23; ui-craft top rules; interface-design (accent about 10%).

### COL-04 · Dark theme, when shipped, is composed
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census,contrast)`

**Rule.** `color-scheme` declared; elevated surfaces (cards, popovers, menus, dialogs, sheets) not darker than the base; sunken wells and inset inputs are excluded; all A11Y-11/12 checks pass in dark.

**Why.** Without `color-scheme`, the parts the browser draws (form controls, scrollbars) stay light inside a dark page. On dark ground people read height as lightness, so a raised surface darker than the page looks like a hole.

**Check.** Under the dark theme: `color-scheme` includes `dark` on the root, as a CSS property or a `<meta name="color-scheme">` tag; every elevated surface (menu, popover, dialog, sheet, raised card) has a composited background at least as light as the base beneath it; the contrast checks of [accessibility.md](accessibility.md) re-run in dark. The criterion is `not_applicable` when no dark theme ships. Sunken surfaces (wells, inset inputs) are darker on purpose and are not elevated surfaces.

**Fix.** Set `color-scheme` once on `:root` per theme. Remap elevated-surface tokens to lighter steps in the dark theme map, not per component (SHP-10 in [shape-depth.md](shape-depth.md)). Re-run `uie audit --checks census,contrast` under the dark theme.

**Sources.** [CRAFT-040, PLAT-066, CRAFT C15]; Material dark theme; Apple Dark Mode; Vercel Web Interface Guidelines.

### COL-05 · Role tokens authored in OKLCH
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie tokens check; uie audit --checks census)`

**Rule.** Colour tokens are organised as roles: canvas and ink; surface levels; text (at least primary and secondary); borders (subtle and strong); action; focus; selection; success, warning, danger and info; and data scales where charts exist. New palettes are authored in OKLCH, with ramps of at least 10 steps for the neutrals and the primary, and chroma lowered toward the lightest and darkest steps. Canvas and ink are explicit tokens chosen with a reason.

**Why.** Roles let each theme remap one layer. OKLCH keeps lightness steps even across hues, and lowering chroma near white and black avoids clipped, garish tints. Pure black on white is not wrong, and neither is a tinted near-black; what matters is that ink and canvas were chosen rather than inherited from browser defaults [CRAFT C4].

**Check.** `uie tokens check` lists the colour roles in `DESIGN.md` and reports missing roles, neutral or primary ramps shorter than 10 steps, and ramps whose chroma does not fall toward the ends. `uie audit --checks census` reports a canvas or body-text colour that resolves to the user-agent default rather than a token.

**Fix.** Add the missing roles to the token file and derive ramp steps by changing OKLCH lightness from one base hue. Existing palettes in another format keep it; convert only to evaluate.

**Exceptions.** Alpha tokens suit overlays, borders and text that must adapt across surfaces, as Radix alpha scales and Ant Design's alpha neutrals do. Avoid alpha layered on alpha, because the composited colour becomes hard to predict, and compute contrast on the composite.

**Sources.** [CRAFT-002, CRAFT-039, PLAT-060, IMP-010]; Ottosson 2020; Evil Martians 2025; impeccable `colorize`; Radix Colors.

### COL-06 · Ramp steps keep their jobs
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie tokens check)`

**Rule.** In a stepped ramp each step has one job and keeps it. For a 12-step ramp after Radix: steps 1 and 2 are app and subtle backgrounds; 3 to 5 are component fills at rest, hover and active; 6 to 8 are borders (6 subtle separators, 7 interactive borders and focus rings, 8 hovered or strong borders and focus rings); 9 and 10 are solid fills and their hover; 11 and 12 are low- and high-contrast text. Text steps are verified on background steps 1 and 2, which are the darkest steps in a dark scale.

**Why.** A job per step makes colour use checkable: text sits on 11 or 12, borders on 6 to 8. It also gives rest, hover and pressed states a built-in order, so state colours stop being improvised per component.

**Check.** `uie tokens check` reports role tokens that alias a step outside its job (a text role pointing at a background step, a fill on a border step) and the contrast of each scale's text steps on its steps 1 and 2.

**Fix.** Re-point the role token to the step whose job matches. Do not bend the ramp to suit one component.

**Exceptions.** Ramps with another step count keep their own documented mapping, recorded in `DESIGN.md`: Tailwind's 11 steps, Carbon's 10 grades, Primer's 14 neutral steps (backgrounds 0 to 6, borders 7 and 8, text 9 and 10).

**Sources.** [PLAT-065]; Radix Colors scale (MIT); Primer colour (MIT).

### COL-07 · Pairs are spaced by tone
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie tokens check)`

**Rule.** When choosing token pairs, keep text at least 50 apart in tone from its background and non-text indicators at least 40 apart. Tone here is CIE L* (the tone of Material's HCT space), not OKLCH L. Confirm every pair with the exact WCAG computation, which decides.

**Why.** Material Color Utilities shows that a tone gap of 40 guarantees at least 3:1 and a gap of 50 at least 4.5:1, so ramps paired this way pass by construction instead of by repair. Carbon's grade distance is the same idea on a 10-grade palette: five grades for 4.5:1, four for 3:1.

**Check.** `uie tokens check` reports the L* gap and the WCAG ratio for every foreground and background pair declared in `DESIGN.md`; pairs below the gap get an exact check, and A11Y-11/12 decide.

**Fix.** Move the text or the fill to a ramp step further away in tone. Change the pairing token, not the component.

**Exceptions.** Disabled controls, which WCAG exempts from contrast; they still need to look disabled (CMP-03 in [components-states.md](components-states.md)).

**Sources.** [PLAT-065]; Material Color Utilities, contrast for accessibility (Apache-2.0); Carbon colour (Apache-2.0).

### COL-08 · One neutral family, one temperature
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit --checks census)`

**Rule.** Use one neutral ramp per product, pure grey or tinted, chosen deliberately and recorded in `DESIGN.md`. A tinted ramp leans toward one hue: the accent's (the "natural pairing" in Radix's palette guidance) or the brand's (TDesign mixes 8–12% of the brand colour into its neutrals). Warm and cool neutrals are not mixed.

**Why.** Sources disagree about tinting: Hallmark requires every neutral to carry at least 0.005 OKLCH chroma toward the anchor hue, while impeccable accepts pure grey when it fits the world. So tinting is a choice. Mixing temperatures is not: two grey families on one page read as two products stitched together.

**Check.** `uie lint` lists the neutral ramps that components reference and reports more than one (alpha variants of the same ramp count as one). `uie audit --checks census` reports rendered neutrals that belong to no declared ramp.

**Fix.** Re-point components to the declared ramp and delete the second one from the token file.

**Exceptions.** Charts and illustrations inside their own canvas. A dual-temperature system recorded in `DESIGN.md` with its reason.

**Sources.** [CRAFT-039, PLAT-067, DSL-018, CRAFT C7]; Radix palette composition; TDesign colour; gstack design checklist.

### COL-09 · Accent restraint
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** The accent marks the primary action, selection, focus and important status, and little else. No accent fill is larger than a control unless the strategy is Committed or Drenched, and the accent never decorates (icons, borders or backgrounds with none of those jobs). How many primary-styled buttons a region may hold, and none in table rows, is CMP-16 in [components-states.md](components-states.md); one dominant primary action per view is LAY-12 in [layout.md](layout.md).

**Why.** An accent is a signal only while it is scarce. Apple tints only primary actions in its floating glass layer for this reason, and GOV.UK, Ant Design and Polaris all limit primary styling to one per group or page.

**Check.** `uie audit --checks census` reports accent fills larger than a control on Restrained surfaces and accent-coloured elements that hold none of the accent's declared jobs, in every captured state. Per-region button counts come from CMP-16's check.

**Fix.** Move decorative accent fills to neutral surface tokens, and demote extra accent buttons through the shared button variants (CMP-16). Then re-run COL-03.

**Exceptions.** Multi-tenant products in which each tenant's accent marks its own content.

**Sources.** [PLAT-063, CRAFT-038, DSL-017]; Apple branding and Liquid Glass guidance; GOV.UK button; Ant Design buttons; Polaris layout (ideas only); ui-craft rule inversions.

### COL-10 · Semantic colours only carry meaning
`level: advisory` · `modes: all` · `status: active` · `verify: S/A (uie lint; design critic)`

**Rule.** Success, warning, danger and info hues appear only where they mean that state, never as decoration or to entice. A meaning-free accent never stands in for a state, and one colour never carries two meanings, such as the brand colour on both links and plain text. Every state also has a non-colour cue (A11Y-19).

**Why.** Semantic colours work because people learn them. Spending them on decoration teaches the wrong meaning, and a red call to action borrows the alarm of an error. Some systems' own warning and success hues fall below 4.5:1 as text (TDesign reports about 3.1:1), so semantic text needs its darker step.

**Check.** `uie lint` reports semantic tokens used outside status components (badges, alerts, validation, toasts, status cells, charts). The design critic reviews the remaining uses in context, and A11Y-11 covers semantic hues used as text.

**Fix.** Swap a decorative use for a neutral or accent token. For text, use the text step of the semantic ramp.

**Exceptions.** Domain and locale conventions override generic meanings when recorded (section 5 below).

**Sources.** [PLAT-064, PLAT-062]; Fluent shared colours; GOV.UK functional colours; Apple colour; TDesign colour; Polaris and Atlassian colour (ideas only).

### COL-11 · Gradients have a job and pass at their worst point
`level: advisory` · `modes: all` · `status: active` · `verify: S/P (uie lint; uie audit --checks contrast)`

**Rule.** Each gradient is named in the direction contract or `DESIGN.md` with its purpose. Text over any gradient passes contrast at its least favourable point. A blue to purple to pink gradient marks AI features only, and only if the product adopts that convention: Semi Design reserves such a gradient for its AI colour tokens (as of 2026-10).

**Why.** Decorative gradients are among the most cited generic defaults, and contrast measured at one sample point hides the place where text fails. Where systems reserve a gradient to mean "AI", using it as decoration both looks templated and blurs that meaning.

**Check.** `uie lint` inventories gradients and their stop hues. `uie audit --checks contrast` pixel-samples text over gradients and reports the minimum ratio; A11Y-11 decides. Gradient text, indigo-violet defaults and radial glows are tells SLP-01, SLP-02 and SLP-08 in [anti-slop.md](anti-slop.md); AI-feature markers are covered in [ai-features.md](ai-features.md).

**Fix.** Replace an unnamed gradient with a solid surface token or record its purpose. For text over a gradient, add a scrim or move the text onto a solid region. Check dark fades for visible banding.

**Exceptions.** Sequential data scales in charts follow [data-display.md](data-display.md).

**Sources.** [PLAT-068, CRAFT-016, CRAFT-017, CRAFT-021, DSL-019, IMP C2]; Semi Design `DESIGN.md`; Vercel Web Interface Guidelines.

### COL-12 · Dark themes are composed, not inverted
`level: advisory` · `modes: all` · `status: active` · `verify: D/A (uie audit --checks census,contrast; design critic)`

**Rule.** Beyond COL-04: base surfaces are a dark grey designed for the theme; text uses graded emphasis tokens; accents are lightened and desaturated so they do not vibrate; bright white images are softened; `theme-color` matches the background in each scheme; the default theme follows `prefers-color-scheme`, and any in-product override starts at "System"; the theme was chosen from the use scene, not from the category.

**Why.** Saturated colours that pass on white vibrate and fail on dark ground. A dark grey base keeps elevation visible. Light or dark should follow where, and in what light, people use the product.

**Check.** Under dark emulation, `uie audit --checks census,contrast` reports accent and semantic chroma against the light theme and `theme-color` per scheme; the design critic reviews emphasis levels and image glare on the dark captures. As calibrations, not values to copy [CRAFT C4]: Material's dark guidance used a dark grey base rather than black, text emphasis at 87%, 60% and 38% opacity, and lighter, desaturated accent tones; gstack desaturates accents by 10–20% and uses off-white text.

**Fix.** Give accent and semantic tokens their own values in the dark theme map; add a `theme-color` meta tag per scheme (with a `media` attribute); soften white-background images. Re-run `uie audit --checks contrast` in dark.

**Sources.** [CRAFT-040, PLAT-066, IMP-011, CRAFT C15]; Material dark theme; Apple Dark Mode; TDesign dark mode; gstack design checklist; Vercel Web Interface Guidelines.

### COL-13 · Long-form body text aims for 7:1
`level: advisory` · `modes: Read; long-form text elsewhere` · `status: active` · `verify: D (uie audit --checks contrast)`

**Rule.** Aim for body text contrast of at least 7:1 in the default theme wherever people read at length. The gate stays at 4.5:1 (A11Y-11). Labels, metadata and secondary text follow the gate only.

**Why.** Several systems aim above AA for sustained reading: Apple asks for 7:1 for custom text colours, Ant Design sets 7:1 for body text and headings, Material's default on-surface pairs reach 7:1, and Primer's high-contrast themes target it.

**Check.** `uie audit --checks contrast` reports long-form body pairs between 4.5:1 and 7:1 as advisory.

**Fix.** Move the body-text token one or two ramp steps away from the background.

**Sources.** [PLAT-061, 05 C7]; Apple Dark Mode; Ant Design font spec; Material Color Utilities; Primer colour.

### COL-14 · APCA is an advisory reading
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks contrast)`

**Rule.** Report APCA-style Lc next to the WCAG ratio: body text Lc ≥ 75 (90 preferred), other content text ≥ 60, large text ≥ 45. Never pass or fail anything on it.

**Why.** APCA models perceived contrast better for some pairs, but WCAG 3 has not chosen a contrast method (Working Draft, 2026-09) and the reference package carries a restrictive licence. Where WCAG passes and Lc is low, as with mid-grey text on white, treat it as a prompt to strengthen the pair.

**Check.** `uie audit --checks contrast` computes Lc with colorjs.io as `bg.contrast(fg, "APCA")`, background first, because the argument order changes the result, and labels it "APCA-style Lc (advisory)".

**Fix.** As COL-13: move the text token along its ramp.

**Sources.** [TOOL-15, CRAFT-031, CRAFT C8, ADR-019, ADR-026]; APCA in a Nutshell; W3C WCAG 3.0 Working Draft.

### COL-15 · Palettes survive colour-vision deficiency
`level: advisory` · `modes: all` · `status: active` · `verify: P/A (uie capture; accessibility auditor)`

**Rule.** Choose semantic and data colours that differ in lightness as well as hue, so pairs such as success and danger stay distinct without hue. Do not encode meaning with red against green or blue against orange alone. A11Y-19 gates the non-colour cue.

**Why.** Pairs that differ only in hue collapse into one colour for many people. Designing the separation into the tokens is cheaper than adding cues later, and Apple names red-green and blue-orange as the pairs not to rely on.

**Check.** `uie capture` takes deuteranopia, protanopia, tritanopia and achromatopsia captures with Chromium's vision-deficiency emulation (Machado, Oliveira and Fernandes 2009). The accessibility auditor checks that each semantic pair and chart series stays distinguishable in them, especially in the achromatopsia capture.

**Fix.** Shift one colour of the pair in lightness within its ramp, and add icon or text cues (A11Y-19). Chart palettes follow [data-display.md](data-display.md).

**Sources.** [A11Y-19, TOOL-16, PLAT-062, CRAFT-039]; Chrome vision-deficiency emulation; Apple accessibility.

### COL-16 · Browser surfaces are themed
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit --checks census)`

**Rule.** Theme what the browser draws: `::selection`, `caret-color`, `accent-color` (native checkboxes, radios, range and progress), `color-scheme`, a `theme-color` meta tag per scheme, and link underlines (colour and `text-underline-offset`). Native `<select>` elements get explicit colours in dark themes. Tabular figures for data are TYP-14 in [typography.md](typography.md).

**Why.** Unthemed selection, caret and native controls are among the cheapest signs that a page was assembled rather than designed, and generated pages skip them most often.

**Check.** `uie lint` reports which of these properties are absent from the global styles. `uie audit --checks census` reports native controls whose computed `accent-color` is not the accent token.

**Fix.** Add the properties once to the global stylesheet, pointing at existing role tokens.

**Exceptions.** On Operate surfaces, scrollbars may be recoloured but keep their native shape, because restyled scrollbars reinvent an affordance.

**Sources.** [CRAFT-054, IMP-024]; impeccable craft floor and `operate`; gstack; Vercel Web Interface Guidelines.

### COL-17 · Full palette and Drenched are executed as declared
`level: advisory` · `modes: all (when declared)` · `status: calibrating` · `verify: P (uie audit --checks census)`

**Rule.** Full palette: three or four named colour roles, each mapped to a job in `DESIGN.md`, and no unnamed chromatic hue on the page. The hues are related (a shared temperature, ground or material, such as the colours of one ticket roll printed on one card stock), and at most one of them covers a large area such as a band or a panel; the rest stay at accent size (principle 8). Drenched: the declared colour is the largest colour area in every viewport, and text and controls are built from its own ramp.

**Why.** COL-03 measures Restrained and Committed. The other two strategies need their own evidence, or "full palette" becomes a licence for an unplanned rainbow.

**Check.** Using COL-03's capture analysis: for Full palette, chromatic clusters that match no declared role are reported; for Drenched, the declared hue's cluster must be the largest by area in each viewport.

**Fix.** Map stray hues to a declared role or remove them. For Drenched, move remaining large neutral fields onto the declared colour's ramp.

**Exceptions.** Illustration and data colours inside their own canvas.

**Sources.** [IMP-010, CRAFT-038]; impeccable `new-work` colour strategies.

## 3. Decisions to make

Record these in the colour section of `DESIGN.md` (colour tokens and strategy, DEC-02), with a reason for each in the decisions log. Mode sets the default; the brand's "X, not Y" attributes choose within it.

| Decision | Options | How mode and brand choose |
|---|---|---|
| Strategy per surface | Restrained · Committed · Full palette · Drenched | Operate and Read default to Restrained (QUALITY-BAR §5); choosing another there needs a recorded reason, because product UI relies on colour to show state. Persuade and Experience must declare one: an attribute such as "trustworthy, not sterile" pulls toward Restrained, an energetic launch toward Committed or Drenched [07 §4.1]. |
| Theme | light · dark · both | From one sentence of use scene: who, where, in what light [IMP-011]. Never from the category or for variety. If both ship, both are composed (COL-04, COL-12) and the default follows the system setting. |
| Accent and its jobs | one accent · tenant accents | From the brand or the subject's own world. Category reflexes are what to avoid, for example observability in dark blue, healthcare in white and teal, finance in navy and gold. List the jobs the accent owns (COL-09). |
| Neutral family | pure grey · tinted toward the accent · brand mix | One family, one temperature (COL-08). Pure grey suits products that must stay neutral to their content; a tint suits brands with a warm or cool character. |
| Ink and canvas | explicit tokens | Any values, chosen with a reason; neither pure black on white nor tinted near-black is a rule [CRAFT C4]. |
| Ramps and pairs | 10–12 steps per role ramp, authored in OKLCH | Record the step jobs (COL-06) and pair by tone distance (COL-07). |
| Semantic set | one hue and ramp per state | Domain and locale conventions first (section 5 below); separated in lightness for colour-vision deficiency (COL-15). |
| Gradients | none · named uses | Each named with its job (COL-11). |
| Contrast ambition | AA floor · 7:1 long-form body · high-contrast theme | Read surfaces aim for 7:1 body text (COL-13). High-stakes products consider a high-contrast theme that honours `prefers-contrast: more` [PLAT-069]. |
| Token source | `DESIGN.md` tokens · a DTCG 2025.10 `.tokens.json` file | Keep the project's existing source. A DTCG file is read as declared values: `uie lint` counts its colour, spacing and family tokens for COL-01, LAY-01 and TYP-05, the census takes its spacing tokens as the scale when `DESIGN.md` declares none, and `uie tokens check` reports broken aliases and roles whose value differs from `DESIGN.md` [TOOL-28]. |
| COL-01 exceptions | listed values with reasons | Only values fixed by a third party or the brand. |

Two contrasting illustrations, not recommendations:

- **A veterinary clinic's booking tool** (Operate). Restrained. Pure-grey neutrals so that pet photos and appointment states carry the colour. One accent, taken from the clinic's own signage, owns "Book appointment" and the selected time slot. Semantic hues appear only on availability and errors. A light theme, because staff and owners use it at a lit reception desk and on phones in waiting rooms.
- **A poetry archive** (a Persuade landing with Read pages). Committed on the landing: one saturated hue taken from the archive's own printed matter, such as a cloth binding, covers the page ground and the navigation band. Restrained on the reading pages, where body text aims for 7:1 and the hue survives only in links and the current-section marker.

## 4. How to fix common failures

Fix at the narrowest correct layer (token, then shared component, then local), one finding at a time, and re-run the originating check plus `uie diff` against the baseline (FRAMEWORK §10). Most colour failures are token failures: one token change fixes every instance and keeps the dark theme in step.

| Failure | Narrowest fix | Verify |
|---|---|---|
| Literal colours and raw palette utilities in components (COL-01) | Token: replace each literal with its role; promote a value used three or more times with one intent | `uie lint`; `uie audit --checks census` |
| Grey secondary text on a coloured panel (COL-02) | Token: text roles for that surface; shared component uses them | `uie audit --checks contrast` |
| Accent spread across a Restrained page (COL-03, COL-09) | Shared component: secondary variant for extra buttons. Token: neutral fills for decorative bands | recapture; `uie audit --checks census` |
| Committed colour reduced to a sliver (COL-03) | Token: move the hue onto the page ground or a structural band | recapture; `uie audit --checks census` |
| Dialog darker than the page in dark mode (COL-04) | Token: dark theme map assigns lighter steps to elevated surfaces | `uie audit --checks census,contrast` (dark) |
| Native controls stay light in dark mode (COL-04, COL-16) | Global style: `color-scheme` on `:root` per theme | `uie lint`; dark capture |
| Two grey families (COL-08) | Token: delete the second ramp, re-point components | `uie lint`; `uie audit --checks census` |
| Saturated accent vibrating on dark (COL-12) | Token: a lighter, less chromatic dark-theme accent step | `uie audit --checks contrast` (dark) |
| Status shown by hue alone (A11Y-19, COL-15) | Shared component: add an icon or text. Token: separate the pair in lightness | `uie capture` (vision deficiency); accessibility auditor |
| Framework default accent shipped as the brand (SLP-02) | Token: derive the accent from the brand and record the reason | `uie lint`; see [anti-slop.md](anti-slop.md) |

Change a component only when it points at the wrong role. Change a local style only for a genuine one-off, and record it as a `DESIGN.md` exception [IMP-045].

## 5. CJK and localisation notes

- **Meaning is cultural.** Apple notes that red can mean danger in one culture and luck in another. Confirm semantic hues with the product's locale and domain before treating red as the error colour everywhere. In mainland Chinese market data, red commonly marks rising prices and green falling ones **[unverified]**; follow the domain's convention and keep a non-colour cue.
- **Enterprise defaults.** An un-themed Ant Design, Arco or Semi primary blue reads as the library's default look, the same way Tailwind's indigo does elsewhere (counter-example, not a palette). Theme the primary or record why the default stays.
- **Tinted neutrals and dark text.** TDesign builds brand-tinted neutrals by mixing 8–12% of the brand colour, and lowers text alpha slightly in dark themes to keep perceived contrast even (COL-08, COL-12).
- **Large text in CJK.** WCAG allows an equivalent CJK size for large-text contrast but gives no number; [accessibility.md](accessibility.md) routes 18–24 px CJK text in the 3:1 to 4.5:1 band to review.

## Sources

Research adopt items: CRAFT-002, CRAFT-006, CRAFT-016, CRAFT-017, CRAFT-021, CRAFT-031, CRAFT-038 to CRAFT-040, CRAFT-054, IMP-010, IMP-011, IMP-015, IMP-024, IMP-045, IMP-051, PLAT-060 to PLAT-069, PLAT-140, DSL-015, DSL-017 to DSL-020, TOOL-14 to TOOL-16, TOOL-27 to TOOL-29; conflict rulings 07 C4, C7, C8, C15; 02 X10, X21, X23; 05 C7, C12; decisions ADR-012, ADR-019, ADR-026.

- W3C, Web Content Accessibility Guidelines 2.2, 2024, https://www.w3.org/TR/WCAG22/
- W3C, WCAG 3.0 Working Draft, 2026, https://www.w3.org/TR/wcag-3.0/
- Ottosson, A perceptual color space for image processing (Oklab), 2020, https://bottosson.github.io/posts/oklab/
- Sitnik and Turner, OKLCH in CSS (Evil Martians), 2025, https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
- Radix Colors, understanding the scale and composing a palette (MIT), 2026, https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Material Color Utilities, contrast for accessibility (Apache-2.0), 2026, https://github.com/material-foundation/material-color-utilities
- Material Design 3 colour roles, 2026, https://m3.material.io/styles/color/roles
- Material Design 2 dark theme, https://m2.material.io/design/color/dark-theme.html
- Apple Human Interface Guidelines, Color and Dark Mode, 2026, https://developer.apple.com/design/human-interface-guidelines/color
- IBM Carbon colour (Apache-2.0), 2026, https://carbondesignsystem.com/elements/color/overview/
- Microsoft Fluent 2 colour (MIT), 2026, https://fluent2.microsoft.design/color
- GitHub Primer colour usage (MIT), 2026, https://primer.style/product/getting-started/foundations/color-usage
- Ant Design font and colour specs (MIT), 2026, https://ant.design/docs/spec/colors-cn
- TDesign visual guidelines (MIT), 2026, https://github.com/Tencent/tdesign
- Semi Design `DESIGN.md` (MIT), 2026, https://github.com/DouyinFE/semi-design
- GOV.UK Design System, colour, 2026, https://design-system.service.gov.uk/styles/colour/
- Shopify App Design Guidelines, visual design (ideas only; licence restricts reuse), 2026, https://shopify.dev/docs/apps/design
- Atlassian Design System, colour (ideas only; licence restricts reuse), 2026, https://atlassian.design/foundations/color
- Vercel Web Interface Guidelines (MIT), 2026, https://github.com/vercel-labs/web-interface-guidelines
- impeccable, `colorize`, `craft-floor` and detector (Apache-2.0), 2026, https://github.com/pbakaus/impeccable
- Hallmark slop test (MIT), 2026, https://github.com/Nutlope/hallmark
- APCA in a Nutshell, https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html
- Chrome, vision-deficiency emulation (Machado, Oliveira and Fernandes 2009), https://developer.chrome.com/blog/cvd
- Wathan and Schoger, Refactoring UI (paraphrased), https://www.refactoringui.com/book/table-of-contents

Licence notes: values from Material tokens and Material Color Utilities, Carbon, Radix, Fluent, Primer, Ant Design, TDesign, Semi and impeccable are re-expressed with attribution in `NOTICE.md`. Shopify Polaris and the Atlassian Design System contribute ideas only; no values or text are copied from them. Apple and Material guideline text is paraphrased, not quoted.
