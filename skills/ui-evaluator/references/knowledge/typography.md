# Typography

This file covers how text is sized, set, chosen, loaded and kept readable: sizes, leading, measure, families, scale, weights, tracking, numerals, typographic characters, font licences and loading, and the reader's own text settings. It serves gate G3 through TYP-01 to TYP-10 (thresholds repeated exactly from QUALITY-BAR and implemented in `assets/data/rules.json`) and adds advisory rules TYP-11 to TYP-22. It also defines the type roles and scale that DEC-02 requires in `DESIGN.md`. Chinese, Japanese and Korean text has its own rules in [cjk.md](cjk.md); contrast pass or fail is decided in [accessibility.md](accessibility.md) (A11Y-11); saturated faces and other tells are catalogued in [anti-slop.md](anti-slop.md); copy conventions are in [content-copy.md](content-copy.md). Read this file when setting type tokens in `direct` or `build`, and when fixing a TYP finding.

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules): gate TYP-01 to TYP-10, advisory TYP-11 to TYP-22
3. [Decisions to make](#3-decisions-to-make)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles

1. **Decide type from the brief, not from habit.** Unchosen faces and default scales are among the first signs that nobody designed the page. A face with a recorded reason is a decision even when it is popular (P2, ADR-012).
2. **Roles before values.** Name what each piece of text does (display, heading, body, label, data), give each role one token, and let components reference roles only. Drift starts the moment a component sets its own size.
3. **Mode sets the register.** Operate and Read surfaces need workhorse faces, modest steps and fixed sizes. Persuade and Experience surfaces may spend one display moment. Structure stays conventional in every mode (P3).
4. **Judge the rendered text.** Measure computed styles and real line boxes after the fonts have loaded. A face declared in CSS but never loaded is not the design visitors see.
5. **The reader's settings win.** Zoom, default text size and language are inputs the layout absorbs; never fight them (P11).
6. **Scripts differ.** Caps, italics, negative tracking and hyphenation are Latin habits. CJK text follows [cjk.md](cjk.md).
7. **Fonts are licensed software.** Verify the licence before a file ships (P14).

## 2. Rules

Gate rules come first and repeat the G3 thresholds exactly. Advisory rules (`level: advisory`) raise findings for the design panel and the code reviewer but never fail G3 on their own. Check names in `--checks` follow `uie audit --help`; `census` reads computed styles and `layout` reads rendered line boxes across the viewport matrix.

### TYP-01 · Minimum rendered text size
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Threshold: no text < 12 px, except non-interactive legal or caption text ≥ 11 px; CJK text ≥ 12 px without exception.

**Why.** Below these sizes text stops being readable for many people at normal viewing distance. Han characters carry many strokes and lose them sooner than Latin letters, so CJK gets no exception.

**Check.** Computed `font-size` of every visible text node at every width, theme and captured state.

**Fix.** Raise the caption or label token, not single components. Never shrink text to make it fit; let it wrap, or truncate it with the full value still available.

**Exceptions.** Text inside raster images (WCAG 1.4.5, [accessibility.md](accessibility.md)). Some systems document smaller mobile minimums, such as TDesign's 10 px; they do not pass this gate.

**Sources.** [PLAT-010, CRAFT-034, IMP-016]; Apple HIG typography; Material 3 type-scale tokens; W3C clreq §7.1.

### TYP-02 · Body text size by mode
`gate G3` · `modes: all (threshold by mode)` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Threshold: reading body ≥ 16 px (Persuade, Read, Experience); productive body ≥ 14 px (Operate); text inputs ≥ 16 px at widths < 768 px.

**Why.** Web reading text converges on 16 px across systems. Dense task UI is scanned in short runs, so 14 px is acceptable there. iOS Safari zooms the page when a focused input is smaller than 16 px.

**Check.** The dominant body size on each surface against the mode it declares; input font size at every width below 768 px.

**Fix.** One body token per mode; inputs use the body token, with a 16 px floor below 768 px. Change the token, then recapture every surface that uses it.

**Exceptions.** Secondary text may sit below body size as long as it passes TYP-01.

**Sources.** [CRAFT-034, PLAT-010]; QUALITY-BAR §5; Vercel Web Interface Guidelines; impeccable `harden`.

### TYP-03 · Line height
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census,layout)`

**Rule.** Threshold: Latin body text of 3 or more lines ≥ 1.4 (two-line UI text ≥ 1.3); multi-line CJK body text ≥ 1.5; wrapping headings ≥ 1.1 (Latin) or ≥ 1.2 (CJK, **[calibrating]**); line-height 1.0 on wrapping text ≥ 48 px fails. Long-form Latin reading works best at 1.5–1.6, headings at 1.1–1.25, and display at 1.0–1.1, with values below 1.1 only on lines that never wrap.

**Why.** Tight leading makes the eye lose its line on the way back. CJK glyphs are dense and uniform, with no ascenders or descenders, so they need more space between lines.

**Check.** Computed `line-height ÷ font-size` on text nodes that render on more than one line, at every width.

**Fix.** Change the body, heading and display leading tokens, not components; unitless values scale with size. CJK leading comes from [I18N-05](cjk.md).

**Exceptions.** Single-line UI labels; display headings that never wrap at any width. As written, the CJK clause also covers wrapping CJK headings; a design that needs tighter CJK heading leading takes a value-scoped owner waiver with its reason.

**Sources.** [CRAFT-033, PLAT-011, IMP-016]; WCAG 1.4.8 and 1.4.12; W3C clreq §7.1; Material 3 and Apple type tables.

### TYP-04 · Measure (line length)
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout)`

**Rule.** Threshold: Latin prose fails when ≥ 2 rendered lines exceed 80 characters (target 45–75); CJK prose fails when ≥ 2 lines exceed 48 glyphs (target ≤ 40).

**Why.** Long lines make the return sweep to the next line error-prone. Full-width CJK glyphs fill a line faster, so their counts are lower.

**Check.** Characters (Latin) or glyphs (CJK) per rendered line in prose blocks of two or more lines, at every width.

**Fix.** Constrain the prose container component, never the page body: `max-width` in `ch` for Latin (TYP-22), in whole `em` for CJK, where one ideograph is one em wide ([I18N-06](cjk.md)).

**Exceptions.** Data tables, code blocks and single-line UI text.

**Sources.** [CRAFT-032, PLAT-014, IMP C13]; Butterick, *Practical Typography*; Baymard 2022; WCAG 1.4.8; W3C clreq §7.1.

### TYP-05 · Type families
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Threshold: ≤ 2 families per script (Latin and CJK counted separately; fallback families in a stack are not counted) plus an optional monospace used only for code or data, unless `DESIGN.md` declares more with a reason.

**Why.** Each extra family is another voice to reconcile and more bytes to load. Three or four faces read as costume changes rather than a system.

**Check.** Distinct computed families on visible text. Monospace counts as a family when it appears outside code, data or measurements.

**Fix.** Map stray families to the role tokens. Component libraries often bring their own default family; make it inherit.

**Exceptions.** Families declared in `DESIGN.md` with a reason. Declare a CJK family that only renders Han text with the reason "script coverage", and a brand outlier face only for named slots.

**Sources.** [CRAFT-035]; OpenAI frontend guide (two faces); Hallmark slop test gates 37–38.

### TYP-06 · Hierarchy is not flat
`gate G3` · `modes: all (threshold by mode)` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Threshold: with ≥ 3 text roles: adjacent role steps ≥ 1.25 (Persuade, Read, Experience) or ≥ 1.125 (Operate), or roles additionally separated by weight. The Operate target is 1.125–1.2 (QUALITY-BAR §5).

**Why.** When neighbouring roles barely differ, readers cannot see the structure at a glance. Product UI can use smaller steps because weight and colour carry part of the hierarchy.

**Check.** The dominant size per role (headings, body, labels, captions), the ratio between adjacent roles, and the weight difference where the ratio is below the threshold.

**Fix.** Adjust the scale tokens (TYP-11) or add a weight step to one role. Do not repair hierarchy by enlarging one component.

**Exceptions.** Surfaces with fewer than three text roles.

**Sources.** [CRAFT-035, IMP-017]; impeccable `flat-type-hierarchy`; Material 3 type scale.

### TYP-07 · No thin weights at small sizes
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Threshold: no weight < 400 for text < 24 px.

**Why.** Thin strokes break up at small sizes, on low-density screens and in light text on dark grounds. Platform guidance keeps light weights for large sizes.

**Check.** Computed `font-weight` against `font-size` for visible text.

**Fix.** Set the weight tokens of small roles to 400 or more; keep Light weights for display roles of 24 px and above.

**Exceptions.** None.

**Sources.** [PLAT-013, CRAFT-035]; Apple HIG typography; Carbon type sets.

### TYP-08 · Tracking
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Threshold: lowercase body letter-spacing ≤ 0.05em; display ≥ −0.04em; CJK letter-spacing ≥ 0; no uppercase run > 30 characters.

**Why.** Loose tracking breaks lowercase word shapes, and crushed display tracking makes letters collide. CJK is set solid on a square grid, so negative tracking jams glyphs together. Long all-caps runs read slowly.

**Check.** Computed `letter-spacing` by size, script and `text-transform`; length of uppercase runs, typed or transformed.

**Fix.** Keep tracking in role tokens (TYP-20). Redefine the tracking tokens to 0 under `:lang(zh)`, `:lang(ja)` and `:lang(ko)`, because a negative display token otherwise inherits into Chinese headings.

**Exceptions.** Positive tracking on short CJK captions or labels passes (≥ 0). Tracked caps labels pass this gate but may fail SLP-05 ([anti-slop.md](anti-slop.md)).

**Sources.** [CRAFT-036, IMP-016, PLAT-015]; Butterick on letterspacing; W3C clreq §6.3.1.

### TYP-09 · Display restraint
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census,layout)`

**Rule.** Threshold: display text ≤ 6rem unless `DESIGN.md` declares it; a full-sentence h1 ≥ 72 px with ≥ 40 characters fails.

**Why.** Size is not hierarchy. Oversized, sentence-length headlines push the action below the fold and read as a template move.

**Check.** The largest computed display size per surface; length and size of each h1.

**Fix.** Shorten the headline first, then lower the display token. A poster-style page that needs more than 6rem declares the size and the reason in `DESIGN.md`.

**Exceptions.** Display sizes declared in `DESIGN.md`.

**Sources.** [IMP-016, IMP-017]; impeccable `oversized-h1`; gstack design checklist.

### TYP-10 · Justification
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Threshold: justified Latin text requires `hyphens: auto`; pure-CJK paragraphs are exempt.

**Why.** Without hyphenation, justified Latin lines open uneven gaps that interrupt reading, and WCAG 1.4.8 (AAA) advises against full justification. Uniform CJK glyphs justify cleanly, and justification is the norm there.

**Check.** Computed `text-align: justify` together with `hyphens` and `lang` on prose; the script mix of each justified paragraph.

**Fix.** Start-align Latin prose, which is the default choice. To keep justification, add `hyphens: auto` and a correct `lang`, which the browser needs in order to hyphenate. Mixed-script paragraphs, such as Latin words or URLs inside Chinese, are not pure CJK: start-align them [PLAT C20].

**Exceptions.** Pure-CJK paragraphs ([I18N-12](cjk.md)).

**Sources.** [IMP-016, PLAT-132, PLAT C20]; WCAG 1.4.8; W3C clreq §6.2.

### TYP-11 · Scale and weight steps by mode
`level: advisory` · `modes: all` · `status: calibrating` · `verify: D (uie audit --checks census), S (uie lint)`

**Rule.** Choose one ratio per mode and keep it: Operate 1.125–1.2, with weight and colour doing extra work; Read, Persuade and Experience 1.25–1.333, with any larger jump reserved for display (TYP-21). On productive screens keep ≤ 5 distinct sizes, with adjacent sizes ≥ 2 px apart. Use ≥ 2 weights for hierarchy and ≤ 3 weights per viewport **[calibrating]**. Operate headings use fixed rem sizes, not fluid `clamp()`; wherever fluid type is used, its maximum stays ≤ 2.5× its minimum.

**Why.** A modular scale makes size steps deliberate. Product systems settle on small fixed steps, while editorial and marketing pages need more contrast. impeccable keeps product UI on a fixed rem scale and reserves fluid sizing for display type on marketing and content pages.

**Check.** Distinct computed sizes and weights per screen, adjacent ratios by role, and `clamp()` on headings of Operate surfaces.

**Fix.** Regenerate the size tokens from the chosen base and ratio, and merge near-duplicate sizes into one role.

**Exceptions.** Short display headlines on Persuade surfaces. Documents may use modest steps when `DESIGN.md` says so [DSL X18].

**Sources.** [CRAFT-035, PLAT-012, IMP-017, DSL-022]; Tim Brown, "More Meaningful Typography"; Utopia; Material 3 type scale; Carbon productive and expressive sets.

### TYP-12 · Role-based type tokens
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint, uie tokens check)`

**Rule.** Define type as roles (display, heading levels, title, body, body-small, label, caption, data, code), each bundling family, size, line-height, weight, tracking and numeral features. Components reference role tokens only; literal `font-family` and `font-size` values outside token files are drift. Per-script differences are overrides of the same tokens under `:lang()`, not separate component styles.

**Why.** Roles keep surfaces consistent and let one decision change everywhere. Defining fine values such as tracking once, as tokens, settles the conflict between sources that require tuned tracking and sources that forbid improvised tracking [DSL X3].

**Check.** `uie lint` token-drift findings for type properties; `uie tokens check` for the `DESIGN.md` typography group.

**Fix.** Move each literal into the role it stands for; add a role only for a genuinely new job. Illustration of the per-script pattern (values show the shape, not a recommendation):

```css
:root { --type-body-leading: 1.5; --type-display-tracking: -0.02em; }
:lang(zh), :lang(ja), :lang(ko) { --type-body-leading: 1.8; --type-display-tracking: 0; }
```

**Exceptions.** Optical fixes documented in `DESIGN.md`.

**Sources.** [CRAFT-006, DSL-015, DSL-016, PLAT-140, DSL X3]; Material 3 type roles; Google design.md specification.

### TYP-13 · Faces chosen by procedure, with a recorded reason
`level: advisory` · `modes: all` · `status: active` · `verify: S (DESIGN.md decisions log, uie ledger check)`

**Rule.** Every family in use has an entry in `DESIGN.md` naming its role, its reason (tied to the subject, the mode and the "X, not Y" attributes), its licence and its loading source. Faces come from the procedure in §3, never from a list. For new work, the display face differs from those in the last three entries of the project ledger unless the brand pins it (DEC-04).

**Why.** Recommended-font lists become the next generation of tells. What survives is a reason that the next product could not reuse unchanged [CRAFT C1, DSL X4].

**Check.** Each computed family maps to a `DESIGN.md` entry with all four fields; `uie ledger check` confirms variety. If the display face or the only face is on the dated saturated-faces list kept in [anti-slop.md](anti-slop.md), soft tell SLP-20 also applies and needs a disposition. This file names no faces on purpose: a list here would read as a menu.

**Fix.** Write the missing reason, or rerun the procedure and replace the face if no honest reason exists.

**Exceptions.** Brand-mandated faces; record "brand commitment" as the reason.

**Sources.** [CRAFT-009, CRAFT-010, CRAFT-015, IMP-013, DSL-011]; ADR-012; impeccable v3 brand procedure.

### TYP-14 · Tabular numerals for compared numbers
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Numbers that are compared, aligned in columns or updated in place (tables, metrics, prices, timers, counters) use `font-variant-numeric: tabular-nums` and are right-aligned with equal decimals. Running text keeps proportional figures. Oldstyle figures suit lowercase body text and never sit beside capitals.

**Why.** Proportional digits make columns wobble and change width as values update; aligned digits let readers compare at a glance.

**Check.** Computed `font-variant-numeric` on numeric table cells and live values, plus a render test that digits 0–9 have equal widths in that face; a face without a tabular set ignores the property.

**Fix.** Put `tabular-nums` into the data role token and right-align numeric columns in the table component. In a logistics dashboard, the weight and arrival-time columns are the usual offenders.

**Exceptions.** Numbers inside prose.

**Sources.** [CRAFT-037, PLAT-016]; Butterick on alternate figures; Ant Design font and data-format specifications; TDesign typography.

### TYP-15 · Wrapping control for headings and paragraphs
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census), P`

**Rule.** Headings use `text-wrap: balance` and paragraphs `text-wrap: pretty`, both as progressive enhancement. A heading or short paragraph does not end with a single stranded word; when the property does not prevent it, edit the copy or the container width.

**Why.** Balanced headings and paragraphs without stranded words are cheap polish that generated interfaces routinely skip.

**Check.** `uie audit --checks census` reports a heading, or a paragraph of at most three lines, whose last rendered line holds one word, at every matrix width; screenshots for the rest.

**Fix.** Add the properties to the heading and paragraph roles or base styles.

**Exceptions.** Labels and narrow table cells. Whether `text-wrap` prevents single-character last lines in Chinese is **[unverified]** ([I18N-12](cjk.md)).

**Sources.** [CRAFT-037, DSL-026]; Vercel Web Interface Guidelines.

### TYP-16 · Typographic characters
`level: advisory` · `modes: all` · `status: active` · `verify: S (string review; no automated check yet)`

**Rule.** UI strings use curly quotes and apostrophes, the single ellipsis character `…` instead of three full stops, real dashes where a dash belongs, and a non-breaking space inside number–unit pairs and key combinations (`10&nbsp;MB`, `⌘&nbsp;K`).

**Why.** Straight quotes and triple full stops are typewriter leftovers, and a line break between a number and its unit misreads the number. Correct dashes are good typography, so dash density is judged as copy style (SLP-14), never the character itself [CRAFT C5].

**Check.** Visible strings for `"`, `'` and `...`, and screenshots for number–unit pairs split across lines.

**Fix.** Correct the strings at the message source, not in components. Where an ellipsis may appear on a label is a copy convention: CPY-14 in [content-copy.md](content-copy.md). Chinese punctuation follows [I18N-09](cjk.md).

**Exceptions.** Code, identifiers, input values and quoted user content.

**Sources.** [CRAFT-037, DSL-026, CRAFT C5]; Butterick; Vercel Web Interface Guidelines.

### TYP-17 · Font licensing and loading
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint), D (uie capture validity, uie audit --checks census)`

**Rule.** Ship only faces with a verified web licence and a verified loading source; leave out any face you cannot verify. Never self-host or bundle SF Pro or New York, Segoe UI, PingFang, Microsoft YaHei or GDS Transport; reference platform fonts by local name. Commercial faces need a licence that covers web embedding. Faces whose licence forbids modification, such as HarmonyOS Sans and MiSans, need a legal check before subsetting. Every family in a stack either loads or is a deliberate local fallback.

**Why.** A licence breach is not a design choice. A declared face that never loads means visitors see the fallback, not the design.

**Check.** `uie lint` restricted-font findings and `@font-face` sources; rendered family against declared family once fonts have settled (the capture validity check, EVD-03).

**Fix.** Replace restricted self-hosted files with local-name references and repair broken `@font-face` sources. Serve WOFF2, subset with `unicode-range`, preload only the critical weight, and ship a variable font when three or more weights are needed. One source proposes keeping the font payload under 200 KB **[calibrating]**; CJK faces cannot meet that and need system families or sliced subsets ([cjk.md](cjk.md)).

**Exceptions.** None. I18N-03 is the gate form of the restricted-font rule when a CJK locale is in scope.

**Sources.** [CRAFT-009, PLAT-017, PLAT-018]; FRAMEWORK §15; Apple font licence; impeccable v3 typography; wondelai `web-typography`.

### TYP-18 · Fallback metrics and swap layout shift
`level: advisory` · `modes: all` · `status: calibrating` · `verify: I (uie audit, vitals), S`

**Rule.** Give each web font a metric-matched fallback face (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`, for example generated with Capsize's `createFontStack`), and choose `font-display` on purpose: `swap` when the brand face must appear, `optional` when a late swap would hurt more than the fallback. Report the rendered x-height of the body face.

**Why.** When a fallback with different metrics is swapped out, text reflows and the page shifts; that shift counts toward FUN-07 (lab CLS ≤ 0.1).

**Check.** Lab CLS over load and scripted interactions; fallback `@font-face` overrides present next to each web font.

**Fix.** Add the fallback face at the token layer, beside the family declaration.

**Exceptions.** Pure system-font stacks. Capsize's width metrics cover only Latin and Thai, so check CJK fallbacks by eye.

**Sources.** [TOOL-43, TOOL-33]; Capsize; impeccable v3 typography (metric overrides).

### TYP-19 · Respect the reader's text size and zoom
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint), D (uie audit --checks layout)`

**Rule.** Size text in `rem` or `em` so the reader's default text size applies, and never disable zoom (`user-scalable=no`, `maximum-scale=1`). At 200% text size keep both hierarchy and content: stack inline items, reduce columns and wrap rather than truncate or clip.

**Why.** Platforms treat larger text as a normal state to design for, not an edge case. The WCAG floors are A11Y-09 (200% text) and A11Y-07 (reflow), owned by [accessibility.md](accessibility.md).

**Check.** `uie lint` for zoom locks (`user-scalable=no`); a source review for font sizes set in `px`; the layout check at 200% text for clipping, overlap and lost content.

**Fix.** Convert size tokens to rem, replace fixed heights on text containers with minimum heights, and let rows wrap.

**Exceptions.** None.

**Sources.** [PLAT-019, DSL-056]; Apple HIG accessibility and typography; Material 3 spacing under text scaling; GOV.UK type scale.

### TYP-20 · Uppercase and tracking
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** All-caps and small-caps runs get +0.05–0.12em of tracking. Otherwise use positive tracking only on small uppercase labels (≤ 13 px **[calibrating]**); lowercase body keeps the face's default; large display may tighten slightly, typically −0.01 to −0.03em, never past −0.04em (TYP-08). Tune tracking per face and size and keep it in role tokens. Write source text in normal case and apply uppercase with `text-transform`. Light text on dark grounds gets slightly more leading and tracking, and optionally one weight step more.

**Why.** Capitals need extra space to read as words, while spaced lowercase loses its word shapes. Tracking tables are specific to face and size (Apple's SF tracking turns positive again at large sizes), so one blanket negative value is wrong for some faces.

**Check.** Computed `letter-spacing` and `text-transform` by role and size.

**Fix.** Move tracking into role tokens and delete per-component overrides.

**Exceptions.** Tracked caps labels directly above headings are judged as SLP-05 in [anti-slop.md](anti-slop.md). CJK has no case and is set solid ([I18N-07](cjk.md)).

**Sources.** [CRAFT-036, DSL-024, DSL X3]; Butterick on letterspacing; Apple HIG tracking table; impeccable `typeset`; sparanoid/chinese-copywriting-guidelines (case through `text-transform`).

### TYP-21 · Display restraint by mode
`level: advisory` · `modes: Persuade, Experience (display allowed); Operate, Read (none)` · `status: calibrating` · `verify: A (design critic, Restraint), D (uie audit --checks census)`

**Rule.** Display sizes are a budget, not a style. A display moment counts as a hero moment (QUALITY-BAR §5): at most one per screen on Persuade and Experience, none on Operate and Read, and at most two per product across all surfaces. On a marketing hero, aim for a display-to-body ratio of at least 2.5×; below 2.0× the hero reads flat **[calibrating]**. Longer headlines get smaller sizes.

**Why.** Large jumps help short marketing headlines and hurt tools, where they waste space and compete with data [CRAFT C16, DSL X18].

**Check.** Hero moments have no detector: design critics judge them under Restraint. `uie audit --checks census` measures the ratio of the largest heading to the dominant body size.

**Fix.** Demote extra display moments to the heading role. On Operate, cap headings at the heading scale.

**Exceptions.** Experience surfaces with an exception declared in `DESIGN.md`.

**Sources.** [DSL-023, IMP-017, PLAT-002, CRAFT C16, DSL X18]; QUALITY-BAR §5.

### TYP-22 · Latin measure target
`level: advisory` · `modes: Read, Persuade, Experience (prose)` · `status: active` · `verify: D (uie audit --checks layout)`

**Rule.** Prose containers target 45–75 characters per line, with `max-width: 65ch` as the default. Measure rendered characters rather than trusting the CSS value, because `ch` is the width of the digit zero and real text runs differently. Wider measures need more leading; serif body text may run slightly longer than sans.

**Why.** The 80-character gate (TYP-04) catches the worst lines; the target band is where reading is comfortable across sources.

**Check.** Rendered characters per line in prose blocks at desktop widths.

**Fix.** Constrain the prose container component, never the page body.

**Exceptions.** Phone widths, where lines are naturally shorter; data tables and code.

**Sources.** [CRAFT-032, DSL-025, IMP C13]; Butterick on line length; Baymard 2022; GOV.UK layout; Anthropic frontend-design v3.

## 3. Decisions to make

Record these in `DESIGN.md`: type roles in the `typography` token group of the design.md format, and the reasons in the decisions log. DEC-02 fails without roles and scale.

| Decision | What to record | How mode or brand chooses |
|---|---|---|
| Roles | display, heading levels, title, body, body-small, label, caption, data, code; per role: family, size, line-height, weight, tracking, numerals | Operate needs label and data roles; Read a long-form body; Persuade a display role |
| Families | ≤ 2 plus mono; each face's job, reason, licence, loading source; fallback stack including CJK | Operate and Read: a workhorse face or the system stack is often right; Persuade and Experience: a face with a point of view in the display role |
| Scale | base size per mode, ratio, fixed or fluid, `clamp()` bounds | TYP-11, TYP-21 |
| Leading and measure | per role and per script | TYP-03, TYP-22, [I18N-05](cjk.md), [I18N-06](cjk.md) |
| Weights | weights shipped; the emphasis weight; CJK weights | TYP-07, [I18N-04](cjk.md) |
| Tracking and case | display tracking token, caps-label token, where uppercase is allowed | TYP-20 |
| Numerals | tabular roles; lining or oldstyle figures in body text | TYP-14 |
| Loading | `font-display`, preload, subsetting, fallback metrics | TYP-17, TYP-18 |

**Pairing procedure** (no font lists, ADR-012):

1. **Write the jobs.** For each role, write what its text must do: be scanned in dense tables, carry a long read, announce a launch. If one face can do every job, use one family.
2. **Take voice words from the subject's world.** Write three physical-object words from the brief's subject and its "X, not Y" attributes. List the three faces you would reach for by reflex, and set them aside.
3. **Respect the roll.** If `uie roll` dealt a type-pairing class, work inside it; it exists to keep you off your own defaults (ADR-013).
4. **Filter by function before taste:** script and language coverage (CJK, accented Latin), the weights the roles need, tabular figures, true italics and small caps if roles use them, optical sizes, and a legible x-height at the smallest role size.
5. **Search a real catalogue or foundry with the voice words**, then check that the pick did not drift back to a reflex face. A face on the saturated list needs a recorded reason that no other face meets (SLP-20).
6. **Pair by contrast, not near-likeness.** Two faces must differ clearly in structure, for example a text face with a sans, or a sans with a mono for data. Two similar-but-different families look like a mistake.
7. **Verify licence and loading** (TYP-17), then **set a specimen with the real copy** at every width and in every shipped theme before locking tokens.
8. **Record** role, reason, licence and source in `DESIGN.md`, and log the display face with `uie ledger add`.

Two contrasting illustrations, not recommendations:

- *A bicycle-parts inventory (Operate).* The jobs are part numbers, stock counts and prices in dense tables. One family with tabular figures, unmistakable 0/O and 1/l/I, and a width narrow enough for many columns; no display role; a ratio near 1.125.
- *A poetry archive (Read).* The jobs are long reading and titles. A text face built for extended reading, with true italics because the archive sets titles and emphasis in italics; a second face only if titles need their own voice; a ratio of 1.25–1.333 and a measure inside 45–75.

Neither answer transfers to the other brief, which is the point.

## 4. How to fix common failures

Classify the drift first (missing token, one-off implementation, conceptual mismatch, local defect), then fix at the narrowest correct layer: token, shared component or local style [IMP-045]. A token change reaches every surface, so recapture all modes afterwards.

| Failure | Narrowest correct fix | Verify |
|---|---|---|
| Body below the mode's size across a surface (TYP-02) | Body token for that mode | `uie audit --checks census,layout`, then `uie diff <base> <run> --visual` |
| One badge or table cell at 10–11 px (TYP-01) | Component: move it to the caption role | `uie audit --checks census` |
| Wrapping hero heading at line-height 1 (TYP-03) | Display leading token, or the hero component if only it wraps | `uie audit --checks census,layout` at 320 and 1280 px |
| Article lines over 80 characters (TYP-04, TYP-22) | Prose container `max-width` | `uie audit --checks layout` |
| A third family arrives with a component library (TYP-05) | Library theme: its font inherits the role token | `uie audit --checks census` |
| Roles too close in size (TYP-06) | Scale tokens, or one weight step | `uie audit --checks census` |
| Negative tracking inside Chinese headings (TYP-08) | Tracking tokens redefined to 0 under `:lang()` | `uie audit --checks census` on a zh route |
| Long sentence set at display size (TYP-09) | Copy first, then the display token | `uie audit --checks census,layout` |
| Justified Latin prose without hyphenation (TYP-10) | Prose component: start-align | `uie audit --checks census` |
| Declared face never loads | `@font-face` source or the stack | `uie capture` validity, then `uie audit --checks census` |
| Numbers wobble in a table (TYP-14) | Data role token | `uie audit --checks census` |
| Layout jumps when the web font arrives (TYP-18) | Fallback metric overrides beside the family | `uie audit` vitals (FUN-07) |
| Zoom locked, or text clipped at 200% (TYP-19) | Viewport meta; minimum heights instead of heights | `uie lint`; `uie audit --checks layout` |

After each fix, rerun the originating check and `uie diff <base> <run> --findings` to confirm that nothing new appeared (FRAMEWORK §10).

## 5. CJK and localisation notes

- Several gates already split by script: TYP-01 gives CJK no 11 px exception, TYP-03 asks ≥ 1.5 for multi-line CJK text, TYP-04 counts CJK in glyphs, TYP-08 forbids negative CJK tracking, and TYP-10 exempts pure-CJK paragraphs.
- Caps, italics, negative tracking and hyphenation rules do not transfer to CJK. Stacks, regional families, weights, leading, measure, punctuation, Han–Latin spacing, line breaking, IME input and zh-CN copy are in [cjk.md](cjk.md).
- Plan for text expansion in every locale ([I18N-15](cjk.md)).

## Sources

Research adopt items: [CRAFT-006, CRAFT-009, CRAFT-010, CRAFT-015, CRAFT-032, CRAFT-033, CRAFT-034, CRAFT-035, CRAFT-036, CRAFT-037, IMP-013, IMP-016, IMP-017, IMP-045, PLAT-002, PLAT-010, PLAT-011, PLAT-012, PLAT-013, PLAT-014, PLAT-015, PLAT-016, PLAT-017, PLAT-018, PLAT-019, PLAT-132, PLAT-140, DSL-011, DSL-015, DSL-016, DSL-022, DSL-023, DSL-024, DSL-025, DSL-026, DSL-056, TOOL-33, TOOL-43]. Conflict rulings: research note 07 C1, C5, C16; note 01 C13; note 05 C20; note 02 X3, X4, X18. Decisions: ADR-012, ADR-013.

External references:
- W3C, Web Content Accessibility Guidelines 2.2 (2024) and Understanding 1.4.8 and 1.4.12 — https://www.w3.org/TR/WCAG22/
- W3C, Requirements for Chinese Text Layout, Group Note Draft (2026-09-01) — https://www.w3.org/TR/clreq/
- Matthew Butterick, *Practical Typography*: key rules, line length, letterspacing, alternate figures — https://practicaltypography.com/
- Baymard Institute, line length and readability (2022) — https://baymard.com/blog/line-length-readability
- Tim Brown, "More Meaningful Typography", A List Apart (2011) — https://alistapart.com/article/more-meaningful-typography/
- Utopia fluid type calculator — https://utopia.fyi/type/calculator/
- Apple Human Interface Guidelines, Typography and Accessibility; Apple fonts licence — https://developer.apple.com/design/human-interface-guidelines/typography, https://developer.apple.com/fonts/
- Material 3 type-scale tokens (material-web, Apache-2.0) — https://m3.material.io/styles/typography/type-scale-tokens
- IBM Carbon typography — https://carbondesignsystem.com/elements/typography/overview/
- Vercel Web Interface Guidelines (MIT) — https://github.com/vercel-labs/web-interface-guidelines
- impeccable (Apache-2.0): craft floor, `typeset`, detector thresholds — https://github.com/pbakaus/impeccable
- Capsize (MIT) — https://github.com/seek-oss/capsize
- Google design.md specification (Apache-2.0) — https://github.com/google-labs-code/design.md
- sparanoid/chinese-copywriting-guidelines (MIT, checked 2026-10) — https://github.com/sparanoid/chinese-copywriting-guidelines

Licences: impeccable and Anthropic material is re-expressed in our words under Apache-2.0; Vercel, Capsize, ui-craft and sparanoid ideas under MIT. Butterick, Baymard and Apple are cited and paraphrased. W3C documents are cited.
