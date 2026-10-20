# Reference-grade composition and finish

This file says what the best product teams do to make a page look finished, so that a build reads as if Apple's, Google's or the GOV.UK team's designers made it. The other knowledge files set floors and catalogue what generated pages get wrong; this one supplies the positive moves. It was researched on 2026-10-20 from the teams' own guidance (Apple HIG and WWDC design sessions, Material 3 and M3 Expressive, the GOV.UK Design System and service manual, IBM Carbon, Fluent 2, Atlassian, Primer, Shopify, Vercel Geist, Linear's and Stripe's design writing) and from computed styles measured on their shipped pages. Values marked **[observed]** were measured on those pages and are starting points, not rules. Read this file in `direct` when choosing the composition, in `build` steps 3 and 11, and as a design critic. Every gate, the accessibility floor and the tells in [anti-slop.md](anti-slop.md) still hold: nothing here lowers them.

Why it exists: in the human blind judgement of 2026-10-04 the person preferred the look of the build made without the skill in 6 of 8 pairs. The skill's builds passed every check and still read as one flat ground with every section boxed in the same card, timid headings and nothing to look at (`evals/results/build-benchmark-2026-10-04/human-judgement.json`). The teams below avoid that without decoration: they change the ground instead of the box, size type with conviction, and show the real thing.

## Contents

1. [What the best teams agree on](#1-what-the-best-teams-agree-on)
2. [Composition](#2-composition)
3. [Components that look designed](#3-components-that-look-designed)
4. [Recipes by mode](#4-recipes-by-mode)
5. [Keep the code small](#5-keep-the-code-small)
6. [Ship-ready checklist](#6-ship-ready-checklist)
7. [Three things a generic page does that a reference page never does](#7-three-things-a-generic-page-does-that-a-reference-page-never-does)
8. [Where the teams disagree](#8-where-the-teams-disagree)
9. [Starting kit](#9-starting-kit)
- [Sources](#sources)

## 1. What the best teams agree on

1. **Hierarchy comes from layout, not decoration.** Order, size, space and contrast make the most important thing the most obvious one. Borders, badges and shadows are not hierarchy [A1, A3; G5].
2. **Every element earns its place.** "Simplicity isn't minimalism": cut what does not help the job, then give what remains conviction [A2; U1].
3. **Neutrals do the work; one accent marks interaction.** Ink is near-black, not `#000`; one accent colour is kept for actions, links, selection and status [A4; O8].
4. **Show the real thing.** Product shots, the actual interface, the referent's own object. Decoration that depicts nothing is cut [A5; G7; U3].
5. **Emphasis is earned.** One hero moment per page; expressive type and shape belong to showcase moments, never to labels or plain information [G1, G2].
6. **Use the platform.** Native HTML first, progressive enhancement, the least JavaScript that does the job [U2].

## 2. Composition

### 2.1 Change the ground, not the box

A page is a sequence of full-bleed bands, not a stack of cards on one colour.

- Use two or three ground tones from one family: the page ground, a second tone a few percent darker or lighter, and at most one inverse band (dark on a light page) for the moment that matters most, often the primary task. Adjacent bands differ [observed: Apple alternates `#fff`, `#f5f5f7` and black; web.dev alternates white and `#f5f6f7`; Stripe uses one dark navy band; GOV.UK uses a blue header band, white body and a tinted footer].
- A pale tint taken from the imagery or the referent's material may replace the second tone (Google Store's peach and sand panels beside warm product photos) [observed]. Tints stay pale; never put body text on a saturated fill.
- A dark or single-ground product (Linear, Vercel) gets its rhythm from imagery and spacing instead; choose one approach per product [observed].
- Tiles inside a band take the band's opposite tone: white tiles on the grey band, grey tiles on white [observed: Apple, web.dev].

### 2.2 Space between sections

| Surface | Between sections, desktop (1280 px) | Phone (375 px) | Source |
|---|---|---|---|
| Persuade (marketing, landing) | 96–160 px | about 0.6×: 64–96 px | [observed] Apple 110–160, Linear 128, Stripe 80–96 |
| Read and Operate (product, service) | 40–64 px | 32–48 px | GOV.UK spacing unit 9 = 60 px; Carbon and Atlassian top out near 80 px |

Inside a section, heading to content is 24–48 px. The steps still come from the spacing scale (LAY-01) and keep the proximity ratios of LAY-06.

### 2.3 Widths

- Prose and statement text: a column of about 640–760 px (65–75 characters; TYP-04). Apple's text column is 980 px wide with shorter lines inside it; GOV.UK puts content in a two-thirds column of a 1020 px page [observed; U4].
- Galleries and tile grids: 1200–1380 px with 20–24 px gaps [observed: Apple 1380 px tiles with a 20 px gap; Primer 1280 px].
- Phone: 16–24 px side margins (Apple uses 87.5% of the width, about 23 px a side at 375 px) [observed].
- Text hangs on shared key lines; nothing sits in the padding [O9].

### 2.4 Type with conviction

| Role | Persuade | Read, Operate | Source |
|---|---|---|---|
| Hero display, desktop | 3–5× body (for example 64–80 px over 16–17 px) | 2–2.5× body | Apple 80/84 over 17/25; Pixel 60/68; Carbon expressive up to 92 px; GOV.UK 48 over 19 [observed; O1] |
| Hero display, phone | 2.5–3× body (40–48 px) | 1.7–2× | Apple 48/52 at 375 px; GOV.UK scales to 1.7× |
| Section headings | 2–3× body (32–56 px) | 1.3–1.6× | [observed] Workspace 40–44 px; Apple 56 px tiles |
| Line height of display | 1.05–1.15 | 1.15–1.25 | [observed]; M3 ≈ 1.2 for headlines |
| Tracking at ≥ 48 px | −0.01 to −0.03 em, in a token, 0 under `:lang(zh|ja|ko)` | as Persuade | Apple −0.015 em at 80 px; Gemini −0.04 em; TYP-08 floor −0.04 em |

- One heading weight across the page, usually 500–600 for a sans (Apple 600, Google 500), or a committed light display (Carbon and Stripe 300) or a bold one (GOV.UK). Body 400. At most three weights [A6; O2, O3].
- Body may be grey-on-white for long text with the headings in near-black: the contrast between them is part of the hierarchy, and every value still passes A11Y-11 [observed: Workspace body `#5f6368`, headings `#202124`].
- One family, used fully (weights, widths, optical sizes), before a second; a pair is a serif with a sans [G8].
- The hero display is the page's one display moment (TYP-21); other bands use the section-heading role. Short statements, not sentences, at hero size (TYP-09).

### 2.5 Containment: cards are for objects

- A card holds one object the user compares, chooses or opens: a product, a plan, a booking slot, a dashboard widget. Prose sections, lists of facts and FAQs are not cards: they get space, headings and dividers [G6; O6; SLP-07].
- Tiles in a collection are coplanar and shadowless on a contrasting band; large panels take a generous radius (20–28 px), concentric with what they hold [observed: Apple 28 px, Google 24–28 px; Carbon tiles never take shadows].
- Shadows are for what floats (menus, dialogs, a dragged item) [O7]. A page with no shadow at rest is normal for these teams [observed: 0 shadows on Apple's MacBook Air page and Google's Pixel page].
- Group with space before drawing a line; draw a line before boxing; "structure should be felt, not seen" [G5; O5].

### 2.6 Colour

- Near-black ink and two or three greys for text levels; the accent appears only where something can be pressed, is selected or reports status [A4].
- Brand colour lives in content (imagery, the hero band, the inverse band), not in chrome tinted everywhere: "When every element is tinted, nothing stands out" [A7].
- Dark mode keeps the bands: grounds step lighter as they rise (SHP-10), the inverse band becomes the lightest-elevated or a deep brand tone.

### 2.7 Imagery carries the bands

- Each band shows something: the product, the interface at work, the referent's object (the tag, the ticket, the label, the map), a photograph of the real place or people the owner supplies [A5; G7].
- With no photographs, draw the referent's object as real interface: the actual booking tag, the receipt, the timetable, built in HTML and CSS with the product's own data. Assembled decorative shapes are a tell (SLP-56); a working object is not.
- Text over an image gets a scrim or blur so it keeps its contrast [A5]. Every image has `width`, `height` and `alt` [U5].

### 2.8 One icon family, drawn like the text

- One family, one style (outline by default; filled for the selected state), with the stroke matched to the text weight beside it: about 1.5 px at 16–20 px for regular text, 2 px at 24 px [A8; O10; G9].
- Icons are the size of the text they sit with, centred on it, coloured with `currentColor`; decorative icons get `aria-hidden` [O10].
- Fewer, smaller icons look more finished than an icon on every item; where a word does the job, the word is enough (GOV.UK avoids icons; Linear removed coloured icon backgrounds) [O10; SLP-06].
- A link's trailing chevron is a glyph at the link's own size and weight [observed: Apple].

### 2.9 Section labels

A small label above a section heading is allowed only when it names the band's subject in plain words, in the product's case, not tracked uppercase, and never on consecutive bands (SLP-05). Apple's feature bands ("Performance", "Battery") are the model: the label is the topic, the heading is the claim [observed].

## 3. Components that look designed

- **Buttons.** One filled button per view, for the most likely action; the rest outlined, tonal or text. Separate the choices by style, not size. Heights 44–48 px; a declared radius system, often a pill [A9; G3].
- **Few options.** Segmented controls or chips (48 px pills, the selected one in the accent's container tone) instead of a select with three items [observed: Google in-page navigation].
- **Forms.** GOV.UK's patterns: label above the field in sentence case, a one-sentence hint, field width matched to the answer, `autocomplete` on personal data, `inputmode="numeric"` instead of `type=number`, an error summary that takes focus and links to each field, and the submit button enabled until submission starts [O11; components-states.md].
- **Tables and comparisons.** Almost no chrome: 1 px dividers along the bottom only, no vertical rules or zebra stripes, numbers right-aligned in tabular figures, the key value large with its qualifier small [observed: apple.com/mac/compare; O12; data-display.md].
- **Empty and loading states.** An empty state says what will appear and offers one action. A spinner waits 150–300 ms before showing and then stays at least 300–500 ms; a skeleton matches the final layout [O13].
- **Footer.** A quiet tinted band or a 1 px top rule, small muted text (12–14 px at a passing contrast), grouped links [observed: Apple, Stripe, GOV.UK, Linear].

## 4. Recipes by mode

The sequence of bands comes from the content, and the colours, type and imagery from the direction in `DESIGN.md`. These are shapes to start from, not templates to copy.

- **Persuade** (a landing page, a service's front door): a hero band on the ground with the subject shown and one action group → bands alternating ground and second tone, each with one statement heading and the real thing → the primary task (book, sign up, buy) in the one inverse band → questions as a list with dividers → a tinted footer.
- **Read** (help, guides, a policy): one column at reading width, a 2–2.5× title, a sticky table of contents on wide screens, tinted panels only for one sequence or a callout, no bands between paragraphs [observed: Gemini overview; GOV.UK guidance].
- **Operate** (a tool, a form, a dashboard): the layout of the platform's canonical patterns (list–detail, a question per page for long forms), surface tones for panes, cards only for the objects people act on, headings at the heading scale, colour reserved for state.

## 5. Keep the code small

Teams that ship for everyone build the least that works [U2].

- Semantic HTML and CSS first. JavaScript only for behaviour HTML lacks, and the content and the primary action still work without it wherever the product allows (progressive enhancement).
- No framework, build step or component library unless the project already has one or the behaviour needs it; no dependency for what the platform does (`<dialog>`, `<details>`, form validation, `accent-color`, CSS grid).
- One stylesheet with the tokens at the top; components reference tokens only (COL-01, LAY-01). No CSS-in-JS.
- Animate only `transform` and `opacity`, from CSS; never `transition: all` [O14].
- Fonts: the system stack, or one family subset to the scripts used, at most two files above the fold [O14; TYP-17].
- A budget the skill sets (no team publishes one): for a brochure or service page, about 150 KB transferred before images and ≤ 30 KB of JavaScript. www.gov.uk measured about 188 KB with 53 KB of JavaScript [observed]. Over budget, remove before optimising.
- No abstraction for one use: a component exists when it is used twice; a helper when it removes repetition, not to look tidy.

## 6. Ship-ready checklist

Before a build is handed to the audit, it is usable as shipped:

- `<html lang>`, charset, viewport, a unique `<title>`, a meta description, `theme-color` matching the ground, a favicon (`.svg` plus a 48 px `.ico`) and a 180 px `apple-touch-icon` [O15].
- A skip link to the main content; one `h1`; headings in order [O15].
- For a multi-page site, a "Page not found" page: the heading says so, no "404" or "oops", a way back [O16].
- A print stylesheet that hides navigation and chrome where people print (booking confirmations, receipts) [O15].
- Every image sized and described; no layout shift on load (FUN-07).
- No console errors; every link and button goes somewhere real; every primary action works (build step 11).
- Real content from `PRODUCT.md`; no placeholders in the first viewport or on the primary action.
- Checked at 320, 375, 768 and 1280 px, in every shipped theme, with the keyboard.

## 7. Three things a generic page does that a reference page never does

1. **Boxes every section** in the same bordered or shadowed card on one flat ground. Reference pages change the ground: full-bleed bands of two or three tones, shadowless tiles only for objects.
2. **Sets timid, uniform type**: a 32–36 px bold heading over 16 px body in every section, default tracking. Reference pages give one hero real scale (3–5× body), tighten its tracking, use one heading weight and let every other section speak at the heading role.
3. **Decorates instead of showing**: mixed icons on tinted tiles, gradient shapes, a filled button in every section. Reference pages let the real thing carry each band, keep one icon family drawn like the text, and give one action the filled style.

## 8. Where the teams disagree

| Topic | Positions | What to do |
|---|---|---|
| Cards | Shopify admin puts most content in cards; Carbon, Atlassian and Google prefer space and dividers; GOV.UK uses almost none | cards for objects (§2.5); an admin built on Polaris follows Polaris |
| Icons | GOV.UK avoids them; Carbon, Fluent, Atlassian, Primer have full systems; Linear cuts back | one family where icons carry meaning, none where words do |
| Display weight | Carbon and Stripe light 300; GOV.UK and Atlassian bold; Apple 600, Google 500 | one choice per product, recorded in `DESIGN.md` |
| Base unit | 4 px (Fluent, Shopify), 8 px (Carbon, Atlassian), 5 px (GOV.UK) | the skill's 4 px scale unless the codebase has one (LAY-01) |
| Body size | 19 px GOV.UK; 17 px Apple; 16 px Google and Carbon expressive; 14 px Fluent, Atlassian, Geist | by mode (TYP-02) |
| Ground | Apple, Google, Carbon alternate tones; Linear and Vercel keep one ground | alternate on light products; a single dark ground gets its rhythm from imagery |
| Frameworks | GOV.UK: none without evidence, no single-page apps; Geist and Polaris ship components | §5: the project's existing stack, else none |

## 9. Starting kit

`assets/base/reference.css` is a small stylesheet (no build step, no JavaScript) that composes the way §2 and §3 describe and meets the skill's floors when its tokens pass: bands (`.band`, `.band--tint`, `.band--inverse`), a container and reading measure, the type roles with one display moment, shadowless `.tile`s for objects, `.list-divided` and `.facts` for groups, 48 px buttons and fields, choice cards built on native inputs, an error summary, quiet tables, a tinted footer, a focus ring, reduced motion and print. Its default colours pass contrast in both themes (checked with `lib/util/color.mjs` on 2026-10-20).

- **Start from it when the project has no styling of its own.** Copy it into the project, set every token in its first block from `DESIGN.md` (accent, grounds, ink, families, weight, radii), then delete what the page does not use. Its accent and families are deliberately neutral: an un-themed copy is a template (SLP-21).
- **The codebase's system wins.** A project with its own stylesheet, Tailwind theme or component library keeps it; take values from §2 instead.
- It is a floor for craft, not a direction: the referent, the imagery and the one signature moment still come from `DESIGN.md`.

## Sources

Apple
- [A1] HIG Layout (updated 2026-09-09): group with space, shapes or separators; full-bleed backgrounds. https://developer.apple.com/design/human-interface-guidelines/layout
- [A2] HIG Design principles (2026-06-08) and WWDC26 session 250, "Principles of great design". https://developer.apple.com/design/human-interface-guidelines/design-principles · https://developer.apple.com/videos/play/wwdc2026/250/
- [A3] WWDC25 session 356, "Get to know the new design system": hierarchy through layout and grouping. https://developer.apple.com/videos/play/wwdc2025/356/
- [A4] HIG Branding (2026-09-09) and Color: accent used judiciously, one colour per meaning. https://developer.apple.com/design/human-interface-guidelines/branding
- [A5] WWDC25 session 359, "Design foundations from idea to interface": full-bleed imagery, scrims, the squint test. https://developer.apple.com/videos/play/wwdc2025/359/
- [A6] HIG Typography (2025-12-16): hierarchy from weight, size and colour; minimise typefaces. https://developer.apple.com/design/human-interface-guidelines/typography
- [A7] WWDC25 session 219, "Meet Liquid Glass": avoid tinting every element; WWDC26 session 251 on brand in content. https://developer.apple.com/videos/play/wwdc2025/219/
- [A8] HIG Icons (2025-06-09) and SF Symbols (2025-07-28): icon weight matched to adjacent text. https://developer.apple.com/design/human-interface-guidelines/icons
- [A9] HIG Buttons (2025-12-16): the most likely action gets the prominent style; separate by style, not size. https://developer.apple.com/design/human-interface-guidelines/buttons
- Observed: apple.com/macbook-air/, apple.com, apple.com/mac/compare/, support.apple.com, computed styles at 1280 and 375 px on 2026-10-20.

Google
- [G1] "Building with M3 Expressive" (2025-05-13): one or two hero moments per product; contain content for emphasis. https://m3.material.io/blog/building-with-m3-expressive
- [G2] Editorial type treatments: for showcase moments, never labels. https://m3.material.io/styles/typography/editorial-treatments · design.google research "Better, Easier, Emotional UX" (2025-05): no emotion compensates for a lack of clarity.
- [G3] All buttons: a single prominent button per screen. https://m3.material.io/components/all-buttons
- [G5] Spacing: implicit grouping before explicit; generous space for what matters. https://m3.material.io/foundations/layout/grids-spacing/spacing
- [G6] Cards guidelines: not when spacing, headlines or dividers would make a simpler hierarchy. https://m3.material.io/components/cards/guidelines
- [G7] Applying type and colour roles; surface tones over shadows. https://m3.material.io/styles/typography/applying-type · https://m3.material.io/styles/color/roles
- [G8] Google Fonts Knowledge: a few related sizes; exhaust one family before pairing. https://fonts.google.com/knowledge/choosing_type/pairing_typefaces
- [G9] Applying icons: one Material Symbols style, weight and size matched to text. https://m3.material.io/styles/icons/applying-icons
- Observed: store.google.com, the Pixel 10 Pro page, workspace.google.com, web.dev, the Gemini overview, at 1440 px on 2026-10-20.

GOV.UK and others
- [U1] Government design principles: do less; do the hard work to make it simple. https://www.gov.uk/guidance/government-design-principles
- [U2] Service manual, progressive enhancement: HTML first, a framework needs evidence, no single-page apps. https://www.gov.uk/service-manual/technology/using-progressive-enhancement
- [U3] Images: no decoration, no stock photography. https://design-system.service.gov.uk/styles/images/
- [U4] Layout and type scale: 1020 px page, two-thirds column, 48 over 19 px. https://design-system.service.gov.uk/styles/layout/
- [U5] Vercel web interface guidelines: image dimensions, animation, forms, loading timings. https://vercel.com/design/guidelines
- [O1] Carbon type sets (expressive display to 92 px). https://carbondesignsystem.com/elements/typography/type-sets/
- [O2] Carbon typography overview: three weights. https://carbondesignsystem.com/elements/typography/overview/
- [O3] Linear, "How we redesigned the Linear UI" and the 2026 refresh: display and text optical sizes; structure felt, not seen. https://linear.app/now/how-we-redesigned-the-linear-ui
- [O5] Refactoring UI chapter headings: fewer borders, de-emphasise to emphasise. https://www.refactoringui.com
- [O6] Atlassian elevation: no raised surface where a border or space works. https://atlassian.design/foundations/elevation
- [O7] Fluent elevation; Carbon tiles on the page plane. https://fluent2.microsoft.design/elevation · https://carbondesignsystem.com/components/tile/usage/
- [O8] Stripe, "Designing accessible color systems". https://stripe.com/blog/accessible-color-systems
- [O9] Carbon 2x grid: type never on the padding; key lines. https://carbondesignsystem.com/elements/2x-grid/overview/
- [O10] Atlassian iconography; Carbon icon usage; Primer icons. https://atlassian.design/foundations/iconography · https://carbondesignsystem.com/elements/icons/usage/
- [O11] GOV.UK question pages, text input, error summary. https://design-system.service.gov.uk/patterns/question-pages/
- [O12] GOV.UK table. https://design-system.service.gov.uk/components/table/
- [O13] Vercel guidelines (loading); Shopify empty state. https://vercel.com/design/guidelines
- [O14] Vercel guidelines (animation, fonts); GOV.UK removing jQuery (2022). https://insidegovuk.blog.gov.uk/2022/08/11/how-and-why-we-removed-jquery-from-gov-uk/
- [O15] GOV.UK page template. https://design-system.service.gov.uk/styles/page-template/
- [O16] GOV.UK page not found pattern. https://design-system.service.gov.uk/patterns/page-not-found-pages/
- Observed: stripe.com, linear.app, vercel.com, www.gov.uk, at 1024 px on 2026-10-20.
