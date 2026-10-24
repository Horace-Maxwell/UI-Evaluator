# Style presets

A style preset lets the owner name the look they want ("make it look like Apple's site", "做成 Google Material 的风格", "plain like GOV.UK", "dark like Linear") and get it directly: a recipe for composition, type, colour, shape, components and imagery, plus a token file that sets it up on the starting stylesheet. There are four: `apple`, `google`, `govuk` and `product-dark`. Each comes from the research in [reference-grade.md](reference-grade.md) (the teams' own guidance and computed styles measured on their pages, 2026-10-20), where the sources are listed. Read this file in `direct` when the owner names a look, and in `build` step 2.

## Contents

1. [How a style is used](#1-how-a-style-is-used)
2. [What a style never changes](#2-what-a-style-never-changes)
3. [The styles](#3-the-styles): [apple](#31-apple) · [google](#32-google) · [govuk](#33-govuk) · [product-dark](#34-product-dark)
4. [Choosing when the owner names none](#4-choosing-when-the-owner-names-none)
5. [Adding a style](#5-adding-a-style)

## 1. How a style is used

1. **The owner names it.** Any wording counts: a company ("like Apple", "Google 那种"), a system ("Material", "GOV.UK"), or a description that matches one ("clean white Apple-like product page", "dark developer-tool site"). Map it to one preset and say which in one line. If the wording fits none, it is a direction request: run `direct` as usual and use [reference-grade.md](reference-grade.md).
2. **`direct` records it instead of rolling for the look.** The owner has chosen the look, so the seeded roll does not deal directions for it. `DESIGN.md` records `ui-evaluator.style: <name>` and `direction.chosen: style:<name>`, takes its token values from the preset's table below, and gives the reasons the gates ask for: the face's job (SLP-20, for example "the platform face, as the apple style asks"), the spacing scale (LAY-01, for `govuk`'s 5 px scale) and the themes shipped. Three records stand in for the roll: `directions/<id>/decision.md` opens with `style: <name>`, the owner's words and why the preset fits the product (DEC-03 accepts this instead of a roll and candidates); the ledger entry is pinned to the owner's choice (`uie ledger add --pinned "the owner chose the <name> style"`, so DEC-04 does not count a second product in the same preset as a repeat); and any tell the preset trips on the page goes into `ui-evaluator.accepted_tells` with the same reason. The product's own referent still decides the imagery, the one signature moment and the copy voice; a style without the product's subject reads as a template.
3. **`build` loads it.** Link `assets/base/reference.css`, then `assets/base/styles/<name>.css`, then the product's own overrides (accent, if the product has one; families it licenses). With a styling system already in the project, translate the preset's tokens into that system instead.
4. **The audit judges it like any page.** A recorded style is the owner's decision: a house-look tell it trips (SLP-21, SLP-22) is in `accepted_tells` with that reason, so the audit reads it as chosen, not as a default, and the critics judge it against the style named in `DESIGN.md` and the product, not against their own taste.

One style per product. Mixing two (Apple's grounds with Material chips) reads as neither.

## 2. What a style never changes

- **The floors.** Contrast, focus, targets, reflow, line height, motion budgets and every gate hold under every style. Where a system's own value breaks a floor, the preset already replaces it, and says so in a comment: GOV.UK's 25/19 px leading becomes 1.45; its 15 px gutter becomes 16 px.
- **Identity.** A style borrows a way of composing, never a company's identity. No logos, product names, product photography, icons from their apps, device frames or fake chrome (SLP-10), and no claim or hint that the page comes from that company. The GOV.UK name, crown, GDS Transport face and gov.uk domain belong to government services only; the `govuk` style is for public services and civic tools, never for passing a site off as government.
- **Faces the product cannot license.** San Francisco is not licensed for the web: the `apple` style uses the platform face, which renders it on Apple devices and a neutral sans elsewhere. Google Sans is not open: the `google` style uses Roboto Flex (OFL).
- **Content.** Real facts from `PRODUCT.md`, the product's own name and voice.

## 3. The styles

Each table gives what to do; the token file holds the values. `[observed]` values were measured on the teams' pages.

### 3.1 apple

Apple's product and service pages: calm, bright, typographic, every band carrying one statement and one image. Token file: `assets/base/styles/apple.css`. Light and dark.

| Dimension | Recipe |
|---|---|
| Composition | full-bleed bands alternating white and `#f5f5f7`, at most one black band; 110–160 px between sections on desktop, about 0.6× on phones; text in a 980 px column, tiles to 1380 px [observed] |
| Hero | one statement headline (short, not a sentence) at 48–80 px, weight 600, −0.015 em tracking, above or beside the product's real object; one filled pill and one text link with a chevron |
| Section heads | 32–56 px, weight 600; a small topic label above (the band's subject in plain words) at most on alternate bands (SLP-05) |
| Type | the platform face; body 17 px at 1.47; one heading weight; ink `#1d1d1f`, secondary `#6e6e73` |
| Colour | greys do everything; one blue (`#0071e3` buttons, `#0066cc` links) only for what can be pressed; the product's accent may replace it |
| Shape | pill buttons (radius 980 px), 44 px tall, regular weight; 28 px shadowless tiles on the opposite band tone; 12 px fields |
| Components | comparison tables with large values, small qualifiers and bottom dividers only; facts as label–value rows with dividers; a grey footer at 12–14 px |
| Imagery | the real thing at large size, cut out on the ground or full-bleed; no stock photography; icons as glyphs at the text's weight |
| Motion | almost none on the page: a fade or rise on the hero image at most; never on every section (SLP-09) |
| Voice | short, declarative statements; numbers stated plainly; sentence case on the web |

### 3.2 google

Google's own pages under Material 3 Expressive: friendly, tonal, rounded, with one expressive hero and calm everything else. Token file: `assets/base/styles/google.css`. Light and dark.

| Dimension | Recipe |
|---|---|
| Composition | white ground with pale tonal bands (`#f0f4f9`) or inset 28 px panels tinted from the imagery; surface tones instead of shadows; one or two hero moments per product, not per section |
| Hero | 44–64 px at weight 500, −0.02 em tracking; one filled pill and one tonal pill; an editorial type treatment only here, never on labels |
| Section heads | 28–44 px, weight 500 |
| Type | Roboto Flex (load it; the stack falls back); body 16 px on product pages, 18–20 px on reading pages; ink `#1f1f1f`, secondary `#444746` |
| Colour | one blue (`#1967d2`) for the filled action; its container tone (`#d3e3fd` with `#041e49`) for the tonal button, selected chips and highlights; pastel tints from the imagery for panels |
| Shape | pills for buttons and chips (48 px); 28 px containers; 12 px fields; shape contrast used to draw the eye to one element, never as decoration |
| Components | `.btn--tonal` for the second action; `.chip` rows for in-page navigation and filters; cards only for collections (products, plans), with text outside the image well; FAQs as lists with dividers |
| Imagery | product photography or real interface vignettes; one flat spot illustration at most; Material Symbols in one style and weight matched to the text |
| Motion | the standard curves for state changes (150–300 ms); expressive overshoot only for the one hero moment, never on routine UI |
| Voice | warm, plain, second person; sentence case |

### 3.3 govuk

A public service in the GOV.UK manner: the most usable form pages on the web, plain on purpose. Token file: `assets/base/styles/govuk.css`. Light only, as GOV.UK. Declare its 5 px spacing scale in `DESIGN.md`.

| Dimension | Recipe |
|---|---|
| Composition | one blue header band, a white body, a tinted footer; a 960 px page with a two-thirds column for content; one thing per page for long forms |
| Hero | none: the page's `h1` is the question or the task, 32–48 px bold |
| Type | Arial (the GOV.UK face is reserved); body 19 px at 1.45; bold headings; ink `#0b0c0c`, secondary `#505a5f`; links underlined in `#1d70b8` |
| Colour | the green start button (`#00703c`) is the only filled colour; red only for errors; the yellow focus state (`#ffdd00` with a black underline) on every control |
| Shape | square corners everywhere; the button's hard 2 px shadow; 2 px black field borders |
| Components | the GOV.UK patterns: label above the field, a one-sentence hint, field width matched to the answer, an error summary that takes focus, "Continue" left-aligned, a check-answers page before submitting, a confirmation panel |
| Imagery | none unless it carries information; no icons where words do |
| Motion | none |
| Voice | plain English, active, short sentences; the user is "you"; no exclamation marks |

### 3.4 product-dark

A software product's site in the manner of Linear and Vercel: dark, precise, quiet, the product's own interface doing the showing. Token file: `assets/base/styles/product-dark.css`. Dark in both themes.

| Dimension | Recipe |
|---|---|
| Composition | one near-black ground (`#08090a`); rhythm from product screenshots and space, not tone changes; a tinted band is a hairline-bordered step; 96–128 px between sections |
| Hero | 44–72 px, weight 600 (510–590 with a variable face), −0.022 em; the product's interface below or beside it, large and sharp |
| Type | Inter (load the variable font); body 16 px; ink `#f7f8f8`, secondary `#8a8f98`; tabular figures in data |
| Colour | greys and light ink; the primary button is light on dark; the product's accent only in its own UI and in status, never as a page tint |
| Shape | 8 px buttons and fields, 12 px tiles with a 1 px border; no pills |
| Components | changelog and feature lists as dense rows with dividers; keyboard shortcuts shown in `kbd`; code in a monospace face only where it is code |
| Imagery | the product's real interface, crisp at 2×; no illustration; icons small, outline, at the text's weight |
| Motion | short fades and transforms (150–200 ms) on interaction; none on scroll |
| Voice | terse, technical, precise; no hype words (SLP-14) |

## 4. Choosing when the owner names none

Do not pick a style for the owner. Without one named, `direct` runs its seeded roll and composes with [reference-grade.md](reference-grade.md). When asked, suggest one by fit: `apple` for a product or a place with something to show, `google` for a friendly service or app with many actions, `govuk` for forms people must complete correctly, `product-dark` for software sold to people who build things.

## 5. Adding a style

A new preset needs: the team's own guidance and values measured on its shipped pages, cited in [reference-grade.md](reference-grade.md); a token file in `assets/base/styles/` that sets every token of `reference.css` in each theme it ships; a demo page built only from `reference.css` and the new file that passes `uie audit --quick` with no gate-level hit except the reasons `DESIGN.md` must record (the face, a non-4 px spacing scale); and a table in §3.
