# Anti-slop: the tell catalogue

This file is the versioned catalogue of AI tells behind gate G4 (deliberateness and anti-slop): what each tell looks like, why generated UIs produce it, how `uie lint` and `uie audit` detect it, when it is legitimate, and how to resolve it by deciding instead of swapping [FRAMEWORK §11; CRAFT-013]. Read it in `direct` to know which looks are off-limits unless chosen, in `build` when the lint hook reports an `SLP-` ID, in `audit` when writing the tell report, and in `fix` before resolving any tell. If you are a design critic, write your specificity verdict before reading §2 and §4, for the same anti-anchoring reason that detector output is sealed [CRAFT-012]. Craft rules live in the sibling knowledge files and are linked, not restated. Machine-readable twins: `assets/data/tells.json` and `assets/data/saturated-faces.json`. Gate IDs, names and thresholds come from QUALITY-BAR G4 unchanged. Dated content is as of 2026-10.

## Contents

1. [Principles: what a tell is and is not](#1-principles-what-a-tell-is-and-is-not)
2. [Rules](#2-rules): reading a record · hard tells [SLP-01](#slp-01--gradient-text)…15 · soft tells [SLP-20](#slp-20--saturated-display-or-only-face-without-a-recorded-reason-dated-list)…26 · [catalogue additions](#catalogue-additions-slp-2746-and-slp-5065)
3. [Decisions to make (direct and build)](#3-decisions-to-make-direct-and-build)
4. [Using the catalogue at each stage](#4-using-the-catalogue-at-each-stage): build · audit · fix · over time
5. [Model and era priors (as of 2026-10)](#5-model-and-era-priors-as-of-2026-10)
6. [Saturated looks and faces (as of 2026-10)](#6-saturated-looks-and-faces-as-of-2026-10)
7. [Calibration and lifecycle](#7-calibration-and-lifecycle)
8. [CJK and localisation notes](#8-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles: what a tell is and is not

1. **A tell is an unchosen default, not a banned style.** A pattern counts only because nothing in the brief decided it; the same pattern chosen for a stated reason is design [P2; 07 §5.1; CRAFT-005]. Generated UIs converge because sampling fills every unspecified decision with the centre of the training data and with the shared toolchain's demo defaults [07 §2.1].
2. **The brief wins, visibly.** A tell that the brief asks for, or that `DESIGN.md` lists in `accepted_tells` with a reason, is suppressed, reported as *requested* with the citing line, and left out of density [CRAFT-005; QUALITY-BAR §2.3]. If a pattern sits in `DESIGN.md` tokens with no `accepted_tells` reason, name the collision to the owner once instead of silently obeying or fighting it [02 §2.14].
3. **Honesty outranks the brief.** Fabricated proof (SLP-12) and placeholder identities (SLP-13) mislead people, and P12 ranks above the brief, so no `accepted_tells` entry makes an invented claim acceptable [FRAMEWORK §3; CRAFT-007].
4. **Report density, never authorship.** One match is noise. Count the distinct tell IDs on a page and report Krebs' tiers, 0–1 low, 2–3 medium, 4+ high, beside the list [CRAFT-013; 07 §2.5]; on 1,590 Show HN landing pages the split was 46%, 32% and 22% [07 §2.2]. Never state or imply that a product was made by AI: the framework detects missing decisions, not authors [QUALITY-BAR §8].
5. **Specificity is judged before detectors.** Critics run the swap, category-guess and similar-prompt tests before they see tell hits, because detector output anchors judgement [CRAFT-004; CRAFT-012]. Zero tells is not the same as specific: a page stripped of tells with nothing decided in their place is a sterile default (SLP-64) [DSL-080].
6. **Convention is not slop.** Navigation, controls, form patterns and page anatomy stay where users expect them on Operate and Read surfaces, because prototypical designs earn better first impressions; distinctiveness goes into the brand layer and real content [P3; 07 §4.1; 07 C18]. Detectors read each route's declared mode, and category conventions govern structure on those surfaces [07 C3; IMP-001].
7. **Quality defects are not taste.** Contrast failures, content hidden at rest, overflow, missing states and fonts that never load are G1–G3 defects: fix them whatever the style, and never count them as tells [07 §2.5].
8. **Resolve a tell by deciding.** A general instruction to avoid an AI look swaps one default for the next [IMP-055], and every anti-slop list's recommended alternatives became the next tells [02 §3.3 gap 7]. Each record's fix therefore names the decision to make from the brief, never a replacement value [ADR-012; DSL-011].
9. **No tells is not the same as designed.** Removing tells is necessary for G4. It does not make a page look made with care. In the first human blind judgement (2026-10-03), a crafted page that still carried catalogue tells (an eyebrow over a two-colour headline, icon cards, a numbered three-step section) was preferred, and judged less template-like, over a tell-free page with flat, unrelated colour blocks and default form controls. Model judges weighted the tells more than the person did. Finish and coherence come first, and they are checked by the build's finish pass and the appeal verdict (DES-07; ADR-035).

## 2. Rules

Each record carries the fields of `tells.json` [AUTHORING §11]:

- **class**: *hard* blocks G4 unless accepted; *soft* needs a disposition (fixed, accepted, disputed or deferred; see the gate rule below); *experimental* is reported as *possible* and never counts toward G4 or density until promoted [QUALITY-BAR G4; CRAFT-061].
- **layer**: `src` source text (`uie lint`, the per-edit hook); `dom` computed style and geometry (`uie audit`); `pix` screenshot pixels; `copy` rendered text and string literals; `jdg` an isolated critic's judgement, checked by the verifier. These map to QUALITY-BAR's verify codes S, D, P and A [ARCHITECTURE §7.2; 07 §2.4].
- **rel**: single-instance reliability, S strong, M moderate, W weak, as rated in 07 §2.4 from signs-of-ai-design and corroborated by Krebs and the Reddit study; *unrated* where 07 gives none [07 §2.4].
- **audience**: who notices, P0 a layperson, P1 a designer, P2 craft only [07 §2.5; CRAFT-013]. UI-Evaluator assigns P0 when a tell is among the complaints in the Reddit perception study, which measures vocal perception rather than prevalence, and P1 when only practitioners name it [07 §2.2]. All assignments are [calibrating] until a rater study exists [02 §5 Q1]. Audience shapes report wording; a deterministic finding's 0–4 severity comes from `default_severity` in `tells.json` [ADR-010].
- **status**: active, rising, migrating or obsolete (§7) [CRAFT-013]. A threshold that is a proposal rather than a source value carries an inline [calibrating] marker; measured precision lives in `tells.json` and stays `null` until measured [FRAMEWORK §17; AUTHORING §11].
- **first_seen**: the earliest dated source in the research that names the tell, written `≤YYYY-MM`; an era when only era evidence exists [07 §2.3]; [unverified] when no dated source names it. It dates the naming, not the pattern. `modes` is shown only when a tell is limited to some modes.

**Gate rule.** G4 passes when DEC-01…04 pass, there are 0 unaccepted hard tells, every soft tell has a disposition, and no page carries more than 1 deferred soft tell (distinct tell IDs). A soft tell with no disposition fails G4. The four dispositions [ADR-031]:
- *fixed*: the tell is gone from the shipped UI;
- *accepted*: recorded in `DESIGN.md` `ui-evaluator.accepted_tells` with a reason tied to the brief or the direction (§3);
- *disputed*: evidence that the detection is wrong, recorded on the finding (status `disputed`) until a reviewer settles it;
- *deferred*: left in the shipped UI and logged in `debt.md` with an owner. A `wont_fix` soft tell not listed in `accepted_tells` counts as deferred, and older wording "unaddressed" means deferred.

The rule covers every catalogue soft tell with status active or rising, SLP-20…49, including the additions below; experimental tells (SLP-50 and above) are reported as *possible* only and never count. A tell is promoted from soft to hard only when its detector reaches precision ≥ 0.9 on the labelled set [QUALITY-BAR G4; CRAFT-061].

**Hard tells (SLP-01…SLP-15).** Each *Check* opens with the QUALITY-BAR criterion verbatim, then adds source parameters that refine it without loosening it.

### SLP-01 · Gradient text
`G4 hard` · `layer: src, dom` · `rel: M` · `audience: P0` · `status: active` · `first_seen: ≤2026-04`
- **Looks like.** A headline, metric or key word filled with a colour gradient through clipped text [07 A-CO6].
- **Why generated.** Decoration stands in for an emphasis decision; the gradient-clip utilities belong to the default stack's vocabulary, which generators emit verbatim [07 A-CO6; 07 §2.1].
- **Check.** QUALITY-BAR: `background-clip: text` with a gradient on the same element. Source parameters: CSS `background-clip: text` with a `gradient` in the same rule, or Tailwind `bg-clip-text` with `bg-gradient-to-*`; in the DOM, computed `background-clip: text` over a gradient background image. It runs in the per-edit hook tier [CRAFT-017; IMP-014; 01 §2.1.A].
- **Allowed when.** A rare brand moment the direction names, never on body text [07 A-CO6].
- **Fix by deciding.** Decide which lever the type system gives emphasis (size, weight, position or a solid colour role) and use that token; if no emphasis rule exists, write one in `DESIGN.md` first [07 A-CO6; IMP-014]. See [typography.md](typography.md).
- **Sources.** CRAFT-017, IMP-014; 07 A-CO6, A-DC1; impeccable `gradient-text`; gstack.

### SLP-02 · Default indigo-violet accent
`G4 hard` · `layer: src, dom` · `rel: M` · `audience: P0` · `status: active (migrating in some model families, §5)` · `first_seen: ≤2025-08 (era 2024–25)`
- **Looks like.** Purple, violet or indigo gradient washes and filled calls to action that nothing in the brand explains [07 A-CO1].
- **Why generated.** It is the unchosen accent of the dominant stack: Tailwind UI shipped indigo buttons, its creator joked an apology in 2025-08 for the indigo that followed into generated UIs (the causal share is unmeasured), and category lookup tools still reproduce it (31 of 192 primaries in one popular skill sit in the indigo-violet band) [07 §2.1; 05 §2.10; 02 §2.1].
- **Check.** QUALITY-BAR: gradient stops or filled CTA backgrounds in the indigo-violet band (OKLCH hue 260–310° with chroma ≥ 0.10 and lightness 0.25–0.85 **[calibrating]**, or HSL hue 250–310° with saturation > 0.25 and 0.15 < L < 0.85), or `from-/to-/bg-{purple,violet,indigo}-*` utilities on calls to action, when the hue is not in the documented brand palette. The window is the union of Krebs' 250–300° and impeccable's 260–310° [CRAFT-016]. The OKLCH branch exists because Tailwind `indigo-500` and `indigo-600` have HSL hues near 239° and 243°, outside the HSL window, while their OKLCH hues (about 277°) fall inside impeccable's 260–310°.
- **Allowed when.** The hue is in the documented brand palette [CRAFT-016]; or the gradient is a declared AI-feature marker, the convention Semi Design encodes as tokens, recorded in `DESIGN.md` and passing contrast at its worst point [PLAT-068; 05 §2.14].
- **Fix by deciding.** Derive the accent from what the brand already owns and from the subject's world, give it one job (action, selection or state) under the declared colour strategy, and change it at the accent token [07 A-CO1; IMP-010]. Moving to the next most probable accent (SLP-28) or to an untinted default grey is a swap; decide the neutral temperature deliberately too [07 A-CO5; PLAT-067; 07 C7]. See [color.md](color.md).
- **Sources.** CRAFT-016, PLAT-067, PLAT-068, DSL-020; 07 A-CO1; Krebs `isPurple`; impeccable `TellHue`.

### SLP-03 · Emoji or Unicode glyphs as icons
`G4 hard` · `layer: src, dom` · `rel: S` · `audience: P0` · `status: active` · `first_seen: ≤2026-04 (era 2024–25)`
- **Looks like.** Rockets, sparkles, bolts or check marks typed as characters in headings, list markers, buttons or navigation [07 A-IC1].
- **Why generated.** Emoji are the cheapest glyphs a text generator can emit, and they are rare in professional hand-built work [07 A-IC1].
- **Check.** QUALITY-BAR: emoji or pictographic glyphs used as icons, bullets or navigation prefixes (chat and user content exempt). Source parameters: emoji and pictographic code points in headings, list markers, buttons and navigation, in source and in the DOM (Krebs `sidebar-emoji`) [CRAFT-025; 07 A-IC1].
- **Allowed when.** Exempt by definition: chat, social and user content. Accept with a reason in casual products whose voice uses emoji as content [07 A-IC1; PLAT-127].
- **Fix by deciding.** Decide whether the item needs an icon at all; type alone is a valid answer. If it does, use the one icon family `DESIGN.md` names and pick the glyph for its meaning [CRAFT-044; 07 A-IC1]. See [components-states.md](components-states.md).
- **Sources.** CRAFT-025, IMP-014, PLAT-127, DSL-030; 07 A-IC1, A-IC3; Krebs; Hallmark gate 30.

### SLP-04 · Decorative side stripe
`G4 hard` · `layer: src, dom` · `rel: S` · `audience: P1` · `status: active` · `first_seen: ≤2026-04`
- **Looks like.** A thick coloured border down one side of a card, callout or list item that marks no state [07 A-SU1].
- **Why generated.** It is pattern-matched from alert components; a designer told Krebs it is nearly as reliable a signal as em dashes are in text. An old craft tip to add colour with accent borders, replicated at scale, is a plausible origin [07 A-SU1; 07 §3.12, inference].
- **Check.** QUALITY-BAR: coloured side border ≥ 3 px (≥ 2 px if rounded), or ≥ 2× the other sides, on non-semantic cards, callouts or list items. Source parameters: `border-left/right/inline-start/end` in a non-neutral colour, Tailwind `border-l/r-N` with N ≥ 4 (N ≥ 2 if rounded), and accent top or bottom borders ≥ 3 px on rounded cards; links, inputs, table cells and buttons are out of scope [CRAFT-014; 01 §2.1.G]. Known miss: a stripe drawn as a separate narrow child element [01 §2.1.G].
- **Allowed when.** Exempt by definition: real alerts, blockquotes and active navigation, where the stripe is the state cue [CRAFT-014].
- **Fix by deciding.** Name what the stripe was meant to signal. A state uses the state system's own cues, at least two of them; a grouping uses space; if it signals nothing, remove it [07 A-SU1; PLAT-050]. See [shape-depth.md](shape-depth.md).
- **Sources.** CRAFT-014, IMP-014, PLAT-050; 07 A-SU1; impeccable `side-tab`; Krebs `accent-stripe`; gstack.

### SLP-05 · Eyebrow or kicker labels
`G4 hard` · `layer: dom` · `rel: M (S when on every section)` · `audience: P1` · `status: active` · `first_seen: ≤2026-04`
- **Looks like.** A small tracked or uppercase label stacked over section headings, or a pill badge over the hero headline [07 A-TY4].
- **Why generated.** Template chrome stamped on every section; it carries nothing the heading does not [07 A-TY4].
- **Check.** QUALITY-BAR: short uppercase or tracked label (≤ 14 px, letter-spacing ≥ 0.06em, 2–34 characters) directly above an h1–h4 ≥ 20 px, used more than ceil(sections ÷ 3) times on a page or split into a different grid column; any pill or eyebrow above an h1 ≥ 48 px. Source parameters: the label is non-heading text (`p`, `span`, `div`, `small`); the hero variant is a 2–60 character label ≤ 14 px that is uppercase with ≥ 1.6 px tracking, bold (≥ 700) in an accent colour, or dash-prefixed [CRAFT-018; 01 §2.1.G].
- **Allowed when.** Exempt: document numbering, breadcrumbs, dates and meta lines [CRAFT-018]. Accept when the label carries information (a count, a date, a real category) and never on consecutive sections [07 C10].
- **Fix by deciding.** Decide whether the label says something the heading does not. If it does, move that information into the heading or body, or make the label informative in the product's case convention; if not, delete it. Restyling an empty label clears the detector, not the problem [07 A-TY4; 07 C10]. See [typography.md](typography.md).
- **Sources.** CRAFT-018, IMP-014, IMP-025, DSL-031; 07 A-TY4, C10; impeccable `kicker-above-heading`, `hero-eyebrow-chip`; Krebs `hero-eyebrow-pill`; Hallmark gate 54.

### SLP-06 · Icon-tile feature template
`G4 hard` · `layer: dom` · `rel: M` · `audience: P0` · `status: active` · `first_seen: era 2024–25`
- **Looks like.** A row of equal cards, each with an icon in a tinted rounded square, a bold title and two lines of text [07 A-LA2].
- **Why generated.** The most recognisable generated layout: tutorials taught feature grids in threes, so content is forced into equal parts [07 A-LA2].
- **Check.** QUALITY-BAR: ≥ 3 equal sibling cards, each with a 32–128 px near-square icon tile above a heading. Source parameters: tile aspect 0.7–1.4, visible background or border, radius < width/2 (not a circle), an icon child, directly above the heading [CRAFT-019; 01 §2.1.G].
- **Allowed when.** Content that genuinely comes in equal parts may pass with a note [CRAFT-019].
- **Fix by deciding.** Let the content set count, order and weight: how many items exist, and do they matter equally? Showing the product doing the thing often replaces the row [07 A-LA2]. Re-gridding the same items as a bento (SLP-50) is a swap, not a decision [02 §3.2 X7]. See [layout.md](layout.md).
- **Sources.** CRAFT-019, IMP-014, DSL-031; 07 A-LA2; impeccable `icon-tile-stack`; gstack; Hallmark gate 3.

### SLP-07 · Card kit
`G4 hard` · `layer: dom` · `rel: M` · `audience: P0` · `status: active` · `first_seen: ≤2026-04`
- **Looks like.** Everything boxed: cards inside cards, or one soft grey shadow and one large radius on every container [07 A-LA4, A-SU4].
- **Why generated.** Containment replaces hierarchy decisions, and the component kit's defaults (one radius, one shadow) ship unchanged [07 A-LA4; 05 §2.10].
- **Check.** QUALITY-BAR: a card-like element nested in a card-like ancestor; or identical `box-shadow` on ≥ 4 cards together with one radius ≥ 16 px on > 80% of rounded elements. Card-like means a border or shadow plus a radius or background; impeccable also requires ≥ 50 × 30 px and ≥ 10 characters of text [07 A-LA4; 01 §2.1.G]. A hairline border with a wide shadow on one element is SHP-02 (G3), not this tell [CRAFT-022].
- **Allowed when.** The card is the object the user acts on, as in kanban boards and product tiles [07 A-LA4; CRAFT-022].
- **Fix by deciding.** Decide one depth strategy for the product (borders, subtle shadows, layered shadows or tonal surfaces) and, per container, whether it is an object or a group; groups get proximity, type and dividers [DSL-029; CRAFT-022; CRAFT-042]. See [shape-depth.md](shape-depth.md).
- **Sources.** CRAFT-022, CRAFT-023, CRAFT-042, PLAT-032, IMP-014; 07 A-LA4, A-SU4; impeccable `nested-cards`; Anthropic skill v3; OpenAI frontend guide.

### SLP-08 · Decorative glow
`G4 hard` · `layer: src, dom` · `rel: M (W for the dark-neon look alone)` · `audience: P0` · `status: active` · `first_seen: ≤2026-04`
- **Looks like.** Coloured halos round buttons and cards, neon edges on near-black, or a soft coloured bloom behind the hero [07 A-CO2, A-CO10].
- **Why generated.** A copied dark-product house style and atmosphere with no anchor in the subject; depth without an offset is decoration [07 A-CO2; CRAFT-042].
- **Check.** QUALITY-BAR: zero-offset chromatic shadow (CIE LCh chroma ≥ 30, blur > 4 px); chromatic blurred shadow on a ground with luminance < 0.1; chromatic radial washes behind heroes, unless named in the direction. Source parameters: impeccable `dark-glow` (per-edit tier), `radial-halo` (a chromatic `radial-gradient` fading to transparent on a dark page) and `radial-spotlight-glow` (a low-opacity accent spotlight) [CRAFT-021; 01 §2.1.A; 07 A-CO10].
- **Allowed when.** The direction names the light as part of the subject's world; atmospheric genres may keep one static bloom, which Hallmark caps at 20–30% of the footprint [CRAFT-021; 07 A-CO10]. Expect false positives on brands that built this look by hand [07 A-CO2].
- **Fix by deciding.** Decide where light comes from in this product's world. If nowhere, express depth through the declared elevation system, with an offset; if somewhere, write it into the direction contract so the tell becomes requested [CRAFT-042; CRAFT-005; 07 C2]. See [shape-depth.md](shape-depth.md).
- **Sources.** CRAFT-021, CRAFT-042, IMP-023; 07 A-CO2, A-CO10, C2; impeccable; Hallmark gate 29.

### SLP-09 · Uniform entrance animation
`G4 hard` · `layer: src, dom` · `rel: W alone` · `audience: P0` · `status: active` · `first_seen: ≤2026-06`
- **Looks like.** Every section fades and rises into view the same way as the page scrolls [07 A-MO1].
- **Why generated.** One motion-library pattern applied to every entrance; Anthropic's own skill now names per-section fade-ups as generated-looking [07 A-MO1; 07 §2.2].
- **Check.** QUALITY-BAR: the same entrance keyframes or variants on ≥ 3 sections. Source parameters: identical keyframes or motion variants in source; in the DOM, elements at opacity 0 with a transform before scrolling [07 A-MO1; CRAFT-028].
- **Allowed when.** A real list appearing as a list, with a capped total stagger [07 A-MO1].
- **Fix by deciding.** Decide the one authored moment the surface mode allows (Persuade and Experience: at most one orchestrated sequence; Operate and Read: nothing beyond one page fade) and let everything else be visible at rest [MOT-07; IMP-021; 07 C11]. See [motion.md](motion.md).
- **Sources.** CRAFT-028, IMP-021; 07 A-MO1, C11; Anthropic skill v3; impeccable craft floor.

### SLP-10 · Fake chrome
`G4 hard` · `layer: src, dom, pix` · `rel: M–S` · `audience: P1` · `status: active` · `first_seen: ≤2026-08`
- **Looks like.** Browser bars with three coloured dots, mock URL pills, CSS phone frames, or a dashboard or terminal assembled from boxes to pass as a screenshot [07 A-IM1].
- **Why generated.** It stands in for a product image the model does not have, and redraws chrome the visitor's own browser already shows [07 A-IM1].
- **Check.** QUALITY-BAR: traffic-light title bars, mock URL pills, CSS or SVG device frames, div-built "screenshots" of dashboards or terminals. Source parameters: three small red, yellow and green circles in a title bar, a mock URL pill, nested box "screens", confirmed on the screenshot [CRAFT-026; 07 A-IM1].
- **Allowed when.** Exempt: real screenshots in a `<figure>` [CRAFT-026]. Accept with a reason when a developer tool shows its actual output [07 A-IM1].
- **Fix by deciding.** Decide what the visual must prove and show the real thing: a real screenshot, a small working component, or a labelled slot reported to the owner [CRAFT-026; CRAFT-045].
- **Sources.** CRAFT-026, CRAFT-045, DSL-034; 07 A-IM1; Hallmark gate 47; taste-skill.

### SLP-11 · Simulated liveness
`G4 hard` · `layer: src` · `rel: M` · `audience: P1` · `status: active` · `first_seen: [unverified]`
- **Looks like.** Pulsing status dots, blinking cursors outside inputs, scrolling logo marquees and counters that tick up on load [07 A-MO4].
- **Why generated.** Motion that pretends to be live data fills the slot for a living product with nothing behind it [07 A-MO4].
- **Check.** QUALITY-BAR: pulsing dots, blinking cursors outside inputs, marquees, count-up numbers not tied to live data. Source parameters: infinite keyframes on small round elements, marquee or scroll keyframes, counter scripts [CRAFT-027].
- **Allowed when.** The indicator is bound to genuinely live data [CRAFT-027].
- **Fix by deciding.** Decide whether the data is live. If it is, bind the indicator to it and label what it shows; if not, make it static [07 A-MO4]. See [motion.md](motion.md).
- **Sources.** CRAFT-027; 07 A-MO4; impeccable `pulsing-dot`, `blinking-cursor`, `marquee`; avoid-ai-design.

### SLP-12 · Fabricated proof
`G4 hard` · `layer: copy, src, dom` · `rel: S when false` · `audience: n/a (honesty, P12)` · `status: active` · `first_seen: ≤2026-08`
- **Looks like.** Usage numbers, logo walls, testimonials, star ratings, compliance badges or uptime figures that nobody supplied [07 A-FC1…A-FC4].
- **Why generated.** The median landing page has these slots, so the model fills them with plausible inventions [07 A-FC4; CRAFT-007].
- **Check.** QUALITY-BAR: numbers, "trusted by" logo sets, testimonials, ratings, badges or customer names absent from the facts section and not labelled as placeholders. Source parameters: numerals with %, × or stars, logo sets and testimonial blocks compared with the facts section in `PRODUCT.md`; Krebs' stat-banner geometry flags candidates (SLP-30) [CRAFT-007; 07 A-LA5].
- **Allowed when.** The fact is in the facts section, or clearly labelled sample data sits inside a product mock-up [CRAFT-007; 07 C6]. An `accepted_tells` entry cannot make an invented claim acceptable (§1) [FRAMEWORK §3].
- **Fix by deciding.** Ask the owner for the facts. Otherwise use a visible placeholder or remove the section; never make an invented figure look more plausible, and never show third-party logos without evidence of the relationship [CRAFT-007; IMP-028; 07 C6]. See [content-copy.md](content-copy.md).
- **Sources.** CRAFT-007, IMP-028, DSL-051; 07 A-FC1…A-FC4, A-DC4, C6; Hallmark gate 46.

### SLP-13 · Placeholder identities
`G4 hard` · `layer: copy, src` · `rel: S` · `audience: n/a (honesty, P12)` · `status: active` · `first_seen: ≤2026-08`
- **Looks like.** Stock personal names, a fictitious company and example addresses left in shipped screens [07 A-FC5].
- **Why generated.** Unfinished content: the model's stock placeholders survive because nothing replaced them [07 A-FC5].
- **Check.** QUALITY-BAR: "Jane Doe", "John Smith", "Acme", `example.com` addresses and similar in shipped UI outside labelled demo data. Source parameters: a lexicon of placeholder people, companies and domains; broken placeholder images are FUN-04 and lorem ipsum is CPY-01 [07 A-FC5; DSL-053].
- **Allowed when.** Wireframes and visibly labelled demo data [07 A-FC5].
- **Fix by deciding.** Replace with real content from the owner, or label the demo data where users see it [CRAFT-007]. See [content-copy.md](content-copy.md).
- **Sources.** CRAFT-007, DSL-053; 02 §3.1 C4; 07 A-FC5; Hallmark gate 19; taste-skill.

### SLP-14 · Copy tells
`G4 hard` · `layer: copy` · `rel: M at density (W per instance)` · `audience: P1` · `status: active` · `first_seen: ≤2026-04`
- **Looks like.** Buzzword-heavy lines, slogans built on manufactured contrast, launch-theatre phrases, headlines that fit any product, and dense em dashes [07 A-CP1…A-CP5].
- **Why generated.** Marketing diction and rhetorical tics sampled at density; the rate, not one word, is the signal [07 A-CP2, A-CP5].
- **Check.** QUALITY-BAR: buzzword or theatre-phrase hits; ≥ 3 aphoristic constructions; generic hero copy; ≥ 8 em dashes at ≥ 1 per 500 characters of Latin-script text (the Chinese 破折号 —— is standard punctuation and is not counted). Source parameters: impeccable's 29-phrase buzzword list (any hit) with gstack's additions; aphoristic shapes such as `Not a X. A Y.` and `X. No Y.` plus negation pivots, counted from 3; theatre and generic-hero phrase lists; dashes counted in body text only [CRAFT-024; IMP-027; 07 A-CP1…A-CP5]. The lexicons live in [content-copy.md](content-copy.md).
- **Allowed when.** Quoted customer language and one deliberate aphorism [07 A-CP2, A-CP3]. Correct dashes below the density threshold are never flagged; ui-craft's lower threshold for UI chrome is not adopted, and dash-built labels are SLP-27 [07 C5; 02 §3.2 X22].
- **Fix by deciding.** Decide what the product literally does, for whom, in the user's words, and test the line with the swap test: would it fit a competitor unchanged [07 A-CP1; CRAFT-004]? Delete rather than rephrase into a new formula [CRAFT-058].
- **Sources.** CRAFT-024, CRAFT-058, IMP-027, PLAT-121, DSL-053; 07 A-CP1…A-CP5, C5; impeccable; gstack.

### SLP-15 · Generic CTA set
`G4 hard` · `layer: copy, dom` · `rel: M` · `audience: P1` · `status: active` · `first_seen: ≤2026-06`
- **Looks like.** Every call to action on the page is a generic start or learn label [07 A-CP6].
- **Why generated.** A label that names no outcome is the safe completion when the product's verbs were never decided [07 A-CP6].
- **Check.** QUALITY-BAR: the only calls to action are generic ("Get started", "Learn more" and equivalents). Equivalents include `Click here`, `Submit` and `OK` [DSL-052]. Link text on its own is CPY-02 (G3).
- **Allowed when.** Nothing is flagged once at least one call to action names its outcome [QUALITY-BAR G4].
- **Fix by deciding.** Name each action's outcome with the product's own verbs, and keep one label per intent through the flow [CRAFT-056; DSL-052]. See [content-copy.md](content-copy.md).
- **Sources.** CRAFT-024, CRAFT-056, DSL-052; 07 A-CP6; gstack; ui-craft.

**Soft tells (SLP-20…SLP-26).** Names and definitions are QUALITY-BAR's; *Check* adds the source parameters.

### SLP-20 · Saturated display or only face without a recorded reason (dated list)
`G4 soft` · `layer: dom, src` · `rel: W alone (first-order faces), M (second-order cluster)` · `audience: P0 first-order, P1 cluster` · `status: active` · `first_seen: ≤2025-11`
- **Looks like.** The display voice, or the only face, is on the dated list in §6.2 and `DESIGN.md` gives no reason [CRAFT-015; IMP-013].
- **Why generated.** First-order faces are the configured defaults of the dominant stack; the second-order cluster is where the escape from them converged, partly because 2025 prompting guidance recommended those very faces [07 A-TY1, A-TY2; 07 §2.1].
- **Check.** dom: the first non-generic family of body text and of display roles, and each family's share of rendered text, warning on a cluster face at ≥ 25% of text or on headings; src: `font-family`, Google Fonts URLs and `next/font` imports [CRAFT-015; 07 A-TY1, A-TY2].
- **Allowed when.** Exempt: brand faces on their own domain, and a declared body and UI face on Operate and Read surfaces [07 A-TY1; CRAFT-015]. Accept when `DESIGN.md` records the job the face does that no other candidate does; an association with the subject alone is not that reason [01 §2.1.C; 02 §3.2 X4].
- **Fix by deciding.** Write voice words from the subject's physical world, name your reflex faces and set them aside, search a licensed catalogue or foundry with the words, then check the pick against §6.2 and the last three ledger entries [01 §2.1.H; CRAFT-009; CRAFT-010]. Record the reason and the verified licence [CRAFT-009]. See [typography.md](typography.md).
- **Sources.** CRAFT-009, CRAFT-015, IMP-013, DSL-011; 07 A-TY1, A-TY2, C1, C12; 02 §3.2 X4; impeccable `overused-font`; Krebs `slop-fonts`; gstack.

### SLP-21 · Second-order house looks when unrequested
`G4 soft` · `layer: dom, pix, jdg` · `rel: M` · `audience: P1` · `status: rising` · `first_seen: ≤2026-04`
- **Looks like.** QUALITY-BAR: cream ground + high-contrast serif + terracotta; near-black + single acid accent; broadsheet hairlines + italic serif + tracked mono labels [CRAFT-020; IMP-012].
- **Why generated.** These are the tasteful escape from first-order defaults, and the cream look is documented as Claude's own prior; landing in one when the brief left the aesthetic open means the direction self-check failed [07 §2.3; 01 §2.1.C].
- **Check.** Cream: page background with min(R,G,B) ≥ 209, R ≥ G ≥ B and 6 ≤ R−B ≤ 48 (impeccable `is_cream_color`), with a high-contrast or italic serif display and a terracotta or clay accent [CRAFT-020; IMP-012]. Near-black: ground luminance < 0.05 with one high-chroma accent at hue 90–150° or 10–30° [07 A-CO4; calibrating]. Broadsheet: hairline rules, zero radius, dense columns and tiny tracked mono labels, judged on screenshots [07 A-LA10]. Report each as a second-order default [CRAFT-020].
- **Allowed when.** The brief or brand asks for it; genuine heritage, editorial and publication identities [07 A-CO3, A-LA10]; or the subject's own material world supplies it, used with this product's specifics: rice paper, ink and a cinnabar seal carrying a calligraphy class's own name and characters, for example. Record it in `DESIGN.md` `accepted_tells` with the referent as the reason (ADR-035).
- **Fix by deciding.** Return to the direction process: was the look guessable from the category, or from the category plus avoidance? Name a concrete referent before choosing a colour strategy, draw candidates from the audience's world, and take the seeded deal [CRAFT-003; CRAFT-004; IMP-006; IMP-007; 01 §2.1.H]. Never fix it by removing colour or material altogether: the alternative to a house look is a specific look, not an absent one, and a bare page fails the appeal verdict (DES-07; ADR-035). See [brand-expression.md](brand-expression.md).
- **Sources.** CRAFT-020, IMP-012, IMP-054; 07 A-CO3, A-CO4, A-LA10, §2.3; impeccable `cream-palette`; Anthropic skill v2 and v3.

### SLP-22 · SaaS hero formula
`G4 soft` · `layer: dom, copy` · `rel: M` · `audience: P1` · `status: active` · `first_seen: era 2024–25` · `modes: persuade`
- **Looks like.** QUALITY-BAR: badge + oversized centred headline + two CTAs incl. gradient primary + decorative orb + generic copy [07 A-LA1].
- **Why generated.** It is the modal SaaS hero in training data, and it became modal because it works [07 A-LA1].
- **Check.** dom: a hero with `text-align: center` holding an h1, ≥ 2 buttons and an eyebrow (Krebs `centered-hero`), or eyebrow, title, lede and CTA on one centred axis (Hallmark gate 6) [07 A-LA1]. Flag the formula, not centring itself; its parts also count as their own tells (SLP-02, SLP-05, SLP-08, SLP-14) [07 C13].
- **Allowed when.** Manifesto and launch pages where the message is the design [07 A-LA1].
- **Fix by deciding.** Decide what the first viewport must prove, usually the most characteristic thing in the subject's world, and give it one call-to-action group. Moving the same parts off-centre is a swap (SLP-44) [07 A-LA1; 02 §3.2 X6]. See [layout.md](layout.md).
- **Sources.** 07 A-LA1, C13; DSL-032; Krebs; Hallmark gate 6; taste-skill.

### SLP-23 · Radius monotony
`G4 soft` · `layer: dom, src` · `rel: M` · `audience: P0` · `status: active` · `first_seen: ≤2026-09`
- **Looks like.** QUALITY-BAR: > 80% of non-zero radii share one value ≥ 16 px without a documented system [CRAFT-023].
- **Why generated.** The component kit's default radius plus the reflex that soft means modern [07 A-SU2].
- **Check.** A computed `border-radius` histogram over rounded elements, with radius utilities in source (gstack's threshold) [CRAFT-023; PLAT-032].
- **Allowed when.** A documented all-pill or all-soft system applied by rule [CRAFT-023; 07 A-SU2].
- **Fix by deciding.** Decide a radius scale by component role and size, with concentric nesting, and record it [CRAFT-043; PLAT-071; SHP-01]. See [shape-depth.md](shape-depth.md).
- **Sources.** CRAFT-023, CRAFT-043, PLAT-032, PLAT-071, DSL-028; 07 A-SU2; gstack.

### SLP-24 · Mixed icon libraries, or default glyphs in default roles
`G4 soft` · `layer: src, dom` · `rel: M` · `audience: P1 (P0 for the AI sparkle)` · `status: active` · `first_seen: ≤2026-08`
- **Looks like.** Two icon sets on one page, Unicode filling the gaps, or the stock glyph per role: sparkles for AI, a bolt for speed, a shield for security, an arrow on every button [07 A-IC2, A-IC3].
- **Why generated.** Icons chosen by availability rather than meaning; in an NN/g study none of 107 participants read the sparkle as AI [07 A-IC2; 07 §2.2].
- **Check.** src: more than one icon package imported; default-role imports such as `Sparkles`, `Zap`, `Shield` or `ArrowRight` in feature and CTA components; dom: mixed SVG stroke widths [07 A-IC2, A-IC3; CRAFT-025].
- **Allowed when.** The library is a brand choice; only default glyphs in default roles and mixed families are the tell [07 C17; 02 §3.2 X8].
- **Fix by deciding.** Decide one family with a reason, pick each glyph for its meaning, and label AI features in words [CRAFT-044; 07 A-IC2]. See [components-states.md](components-states.md) and [ai-features.md](ai-features.md).
- **Sources.** CRAFT-025, CRAFT-044, DSL-030; 07 A-IC2, A-IC3, C17; NN/g 2024.

### SLP-25 · Structure that carries no information
`G4 soft` · `layer: dom, copy` · `rel: M` · `audience: P1` · `status: rising` · `first_seen: ≤2026-06`
- **Looks like.** QUALITY-BAR: 01/02/03 markers on non-sequential content, monospace meta labels, unmotivated italic accent word in a headline [IMP-025].
- **Why generated.** Scaffolding that imitates editorial design: numbering without a sequence, a code face as a technical costume, one styled word as instant flavour [07 A-LA6, A-TY8, A-TY3].
- **Check.** dom: small numeric labels beside section headings, repeated across sections (impeccable `numbered-section-labels`); a monospace family on text outside `code`, `pre`, `kbd`, `samp` and data cells; inside a heading ≥ 32 px and ≤ 140 characters, a run with a different family, style or colour (Krebs `hero-font-mix`) [07 A-LA6, A-TY8, A-TY3].
- **Allowed when.** Real sequences such as steps and timelines; monospace in developer tools and tabular data; an editorial register that commits to the contrast throughout [07 A-LA6, A-TY8, A-TY3].
- **Fix by deciding.** Ask what each device encodes; keep it only where that is true, and otherwise carry emphasis in the whole headline's treatment [IMP-025; 07 A-TY3]. See [typography.md](typography.md).
- **Sources.** IMP-025, IMP-054; 01 §3.3 C7; 07 A-LA6, A-TY8, A-TY3; Anthropic skill v2 and v3; Anthropic Opus 5.5 docs.

### SLP-26 · Motion clichés
`G4 soft` · `layer: src` · `rel: M` · `audience: P1` · `status: active` · `first_seen: ≤2026-08`
- **Looks like.** QUALITY-BAR: image hover zoom, uniform hover-scale on unrelated elements, > 1 simultaneous hover property change [CRAFT-028].
- **Why generated.** Hover motion added because it is available, not because it explains anything; image hover is a named Gemini habit [07 A-MO2; 07 §2.3].
- **Check.** `:hover` with `transform: scale` on images (impeccable `image-hover-transform`); the same hover scale on unrelated elements; more than one property changing on hover on one element [CRAFT-028; 07 A-MO2].
- **Allowed when.** The sources list no default exception; accept only with a reason tied to the direction [07 A-MO2].
- **Fix by deciding.** Decide which element is actionable and give feedback on that container with one property, gated to hover-capable pointers [07 A-MO2; DSL-049]. See [motion.md](motion.md).
- **Sources.** CRAFT-028, DSL-049; 07 A-MO2; Hallmark gates 11 and 13; impeccable.

### Catalogue additions (SLP-27…46 and SLP-50…65)

These extend QUALITY-BAR's lists from 07 §2.4 and the other sources; *From* gives the 07 catalogue ID. Soft additions are reviewed like soft tells, count toward density, and fall under G4's disposition rule whenever their status is active or rising, exactly like SLP-20…26 [ADR-031]. Experimental entries are weak, single-source or lack a published threshold; they are reported as *possible* and promoted only after measurement (§7) [CRAFT-061]. Free soft IDs: SLP-47…49. Each fix follows the same rule as above: decide from the brief, never swap [ADR-012].

**Soft additions**

| ID | Tell | From | Detection (layer: parameters; exemptions) | Rel | Status | Sources |
|---|---|---|---|---|---|---|
| SLP-27 | Typographic template chrome: `A · B · C` meta strings, `WORD — fragment` labels, an arrow appended to every link and button, version stamps | A-TY9 | copy, src: middle dots and spaced dashes in short labels, trailing arrows on all links and buttons in a region [counts calibrating]; exempt: one middle dot in a metadata line, an arrow on a genuinely directional control | M | active | IMP-012; 07 A-TY9; 07 C5 |
| SLP-28 | Purple-escape accent: emerald or teal as the sole accent with no brief reason | A-CO5 | dom: sole accent hue ≈ 150–175° [07 heuristic; calibrating]; exempt: finance, health or success semantics | M | rising (successor of SLP-02) | DSL-011; 07 A-CO5 |
| SLP-29 | Perma-dark muted copy | A-CO7 | dom: dark theme with ≥ 12% of body-text samples below AAA contrast (Krebs `perma-dark`); below AA it is A11Y-11, not a tell | M/S | active | 07 A-CO7; COL-04 |
| SLP-30 | Hero-metric template: big number, small label, supporting stats | A-LA5, A-DC1 | dom: row of 3–6 children ≥ 300 px wide, each with a ≥ 22 px number ≤ 10 characters (Krebs `stat-banner`); a ≥ 48 px numeral with gradient clip; exempt: sourced metrics that matter to the reader, a dashboard's primary KPI; unsourced numbers are SLP-12 | M | active | IMP-014; 07 A-LA5, A-DC1 |
| SLP-31 | Framework default accent as the brand primary (extends SLP-02) | A-CO1 | src, dom: the primary equals a Tailwind default such as v3 `#6366F1` (indigo-500), `#4F46E5` (indigo-600), `#7C3AED` (violet-600), `#2563EB` (blue-600) or their v4 OKLCH values [match tolerance calibrating]; exempt: a value the brand owns, recorded in `DESIGN.md` | unrated | active | DSL-020; 05 §2.10; 02 §2.1 |
| SLP-32 | Centred everything | A-LA8 | dom: > 60% of text containers with `text-align: center` (gstack); exempt: short marketing moments, ceremonial pages | M | active | 07 A-LA8 |
| SLP-33 | Split section header: a big heading in one grid column, its lede floating in another | A-LA11 | dom: heading and lede of one section header in > 1 grid column [Hallmark gate 54 geometry applied to the lede; calibrating]; label-over-heading splits stay SLP-05; exempt: real two-column content | M | active | DSL-031; 07 A-LA11 |
| SLP-34 | Decorative glass | A-SU5 | src, dom: `backdrop-filter: blur` on > 1 container (gstack); exempt: overlays on imagery or maps, floating navigation with a solid fallback under reduced transparency, 1–2 glass surfaces with a recorded purpose | M (over-blamed, 0.2% of complaints) | active | PLAT-075, DSL-079; 07 A-SU5; 02 §3.2 X17 |
| SLP-35 | Blueprint and grain textures | A-SU6 | src: tiled hairline `linear-gradient` layers with a fixed px cell, `repeating-linear-gradient` stripes, SVG `feTurbulence` noise; exempt: real canvas, map or measurement surfaces, texture the direction names from the subject's world | M | active | IMP-023, IMP-054; 07 A-SU6, C2 |
| SLP-36 | Costume block shadow | A-SU7 | src: `box-shadow` with zero blur and positive offsets; exempt: a committed neo-brutalist direction | M | active | IMP-023; 07 A-SU7 |
| SLP-37 | Generic or generated imagery | A-IM3 | src: placeholder image hosts in shipped UI; pix, jdg: generic stock, glossy 3D blobs, generated people; exempt: labelled placeholders, art-directed generated images that are labelled and never shown as people in testimonials | M–S | active | CRAFT-045; 07 A-IM3, C14 |
| SLP-38 | Buried or faked material | A-IM4 | src, dom: an image under a gradient wash whose stops are all ≥ 0.9 alpha, or at opacity < 0.15; `clip-path: polygon()` with ≥ 10 off-grid vertices or `path()` with ≥ 3 curve segments; exempt: geometric clip paths | M | active | IMP-029; 07 A-IM4 |
| SLP-39 | Untouched component kit | A-CS1 | src, dom: kit components (e.g. `components/ui/*`) with unmodified default token values; the wider Tailwind default signature is reported through its parts (SLP-02, SLP-07, SLP-23, LAY-02); exempt: internal tools where convention is the point | M (most-named specific complaint, 2.5%) | active | PLAT-060; 07 A-CS1; 05 §2.10 |
| SLP-40 | Generator leftovers | A-FP1 | src, dom: generator meta tags or tagger packages, built-with badges, the framework's default favicon in shipped UI; reported as unfinished defaults, never as authorship | S | active | 07 A-FP1 |
| SLP-41 | Status-chip soup | A-CS5 | dom: small coloured dots or pills with no state meaning (decorative row dots, coloured trend pills); dose cap ≤ 1 decorative status dot per section; meaning confirmed by jdg; exempt: real status indicators | M | active | DSL-033, DSL-079; 07 A-CS5 |
| SLP-42 | Editorial-serif reflex: high-contrast serif display with an italic accent word on a brief with no editorial, literary or heritage attribute | A-TY2, A-TY3 | dom: italic known serif on h1, or on h2 ≥ 48 px (impeccable `italic-serif-display`), checked against the brief's attributes; the italic word alone is SLP-25 | M | rising (successor of the neutral sans) | DSL-011; 07 A-TY3, C12; 02 §3.2 X5 |
| SLP-43 | Beige-and-brass premium palette | A-CO3 | dom: cream ground (SLP-21 thresholds) with brass, clay or oxblood accents and espresso-brown text on a premium or artisan brief; anchor values in DSL-021; rotate palette families across projects | unrated | rising | DSL-021; 02 §2.6, §2.8 |
| SLP-44 | Split-fold default | A-LA1 | dom: rendered fold classified `split` (headline on one side, visual cropped at the far edge, often a floating proof card) when no fold class was drawn and recorded, or when it repeats the previous ledger entry | unrated (10 of 10 builds in one small study) | rising | DSL-010; 02 §2.6, §3.2 X6 |
| SLP-45 | Cross-page system drift | A-FP2 | src, dom: families, palette, radius set, nav or footer markup differ between routes or from `DESIGN.md` tokens; audience P0 | unrated | active | CRAFT-030, IMP-051; 07 A-FP2 |
| SLP-46 | All-caps UI text by default | none (ui-craft) | dom: headings, navigation or buttons in uppercase without a role declared in `DESIGN.md`; exempt: ≤ 13 px tracked labels declared as a role; runs > 30 characters are TYP-08 | unrated | active | 01 §3.3 C6; 02 §2.6; Anthropic skill v3 |

**Experimental (reported as possible)**

| ID | Tell | From | Detection | Rel | Status | Sources |
|---|---|---|---|---|---|---|
| SLP-50 | Bento by default: a bento grid where items do not differ in size or importance, or with empty filler cells | A-LA9 | dom: ≥ 5 card cells with varied spans; cell count ≠ content item count; allowed when items genuinely differ | W (0.1% of complaints) | rising (successor of SLP-06) | DSL-011; 07 A-LA9; 02 §3.2 X7 |
| SLP-51 | Template page sequence: hero, logo wall, three features, testimonials, stats, three-tier pricing with a highlighted middle, FAQ, CTA, four-column footer; stock nav and footer fingerprints | A-LA3 | dom: section-sequence fingerprint; a tell only with zero deviation plus other defaults | W alone | active | 07 A-LA3; Hallmark gates 42–43 |
| SLP-52 | Monotone section rhythm | none (DSL-031) | dom: a layout family repeated on one page, or > 2 consecutive image and text zigzags (≥ 4 families for 8 sections) [heuristic; needs a layout-family classifier] | unrated | active | DSL-031 |
| SLP-53 | Timid, evenly weighted palette | A-CO8 | pix: colour-area histogram with no dominant colour and no high-chroma accent [no published threshold]; exempt: deliberate monochrome | W | active | 07 A-CO8 |
| SLP-54 | Theme picked by category | A-CO9 | jdg: light or dark without a use-scene sentence in `DESIGN.md` | unrated | active | IMP-011; 07 A-CO9, C15 |
| SLP-55 | Decorative filler shapes: blobs, floating circles, wavy dividers | A-SU8 | pix, jdg | W–M | active | 07 A-SU8 |
| SLP-56 | Shape-assembled illustration, sketchy doodles, generated mascots | A-IM2 | src, dom: large inline SVG built from many primitives at hero size [primitive count unpublished]; exempt: icons, logos, data graphics | M | active | IMP-054; 07 A-IM2 |
| SLP-57 | Stock effect components dropped in unmodified | A-CS6 | src: effect-library imports; jdg: rendered with demo defaults | M | active | 07 A-CS6 |
| SLP-58 | Content stand-ins: sparklines, progress rings, fake avatars or rounded rectangles with no data behind them | A-DC2 | jdg, dom | M | active | 07 A-DC2 |
| SLP-59 | Dashboard-card mosaic: app UI built from stacked equal cards | A-DC3 | dom: many card-like boxes in the primary workspace [count unpublished] | M | active | DSL-033; 07 A-DC3 |
| SLP-60 | Boilerplate FAQ accordion that paraphrases the page | A-CS7 | dom: an FAQ heading with ≥ 3 collapsibles (Krebs `faq-accordion`); exempt: questions from real support data | W | active | 07 A-CS7 |
| SLP-61 | Performative labels: mock-poetic section labels, Title Case Everything, tricolon slogans | A-CP7 | copy [no published threshold] | W–M | active | 07 A-CP7 |
| SLP-62 | Ornamental meta chrome: vertical rotated text, locale or weather strips, crosshair lines, pills over images, fake photo credits, scroll cues | none (taste-skill) | dom, copy; a single source's list | unrated | active | 02 §2.6, §2.8 |
| SLP-63 | Purposeless carousel | none (OpenAI guide) | jdg: a carousel with no narrative order | unrated | active | 07 §2.2; 02 §2.6 |
| SLP-64 | Sterile default: white page, thin grey borders, default face, no focal point, no signature | none (antislop) | jdg: the signature test (point to five places the signature appears) | unrated | rising [unverified] | DSL-075, DSL-080 |
| SLP-65 | Handmade anti-AI reflex: grain, hand-drawn type and collage worn as a costume | none (predicted third order) | none yet; partly SLP-35 | unrated | rising [predicted, unverified] | 07 §2.2, §7 Q5 |

**Mapped elsewhere, not tells.** Flat hierarchy, oversized display, crushed tracking and extra families are TYP-06, TYP-09, TYP-08 and TYP-05, and a face declared but never loaded is a typography defect ([typography.md](typography.md)); grey text on colour is COL-02 and A11Y-11 ([color.md](color.md)); monotonous spacing is LAY-02 ([layout.md](layout.md)); the ghost card is SHP-02 ([shape-depth.md](shape-depth.md)); bounce easing, hidden-at-rest content, `transition: all` and missing reduced motion are MOT-03, MOT-05, MOT-01 and MOT-04 ([motion.md](motion.md)); happy-path-only components, unthemed browser surfaces and the modal reflex are CMP-05 and advisory rules in [components-states.md](components-states.md); inconsistent action names and happy talk are CPY-03 and advisory rules in [content-copy.md](content-copy.md); chart defaults belong to [data-display.md](data-display.md) [07 A-TY5…A-TY7, A-TY10, A-TY11, A-CO7, A-LA7, A-SU3, A-MO3, A-MO5…A-MO7, A-CS2…A-CS4, A-CP6, A-CP8, A-DC5]. No tell fires on pure black, pure white or tinted near-black alone: ink and canvas are tokens chosen with a reason, and the proposal to flag pure-black text is not adopted [07 A-CO11, C4; 02 §3.2 X23].

## 3. Decisions to make (direct and build)

Record these in `DESIGN.md` before building. Detectors read them, and a recorded reason is what separates a choice from a default [P2; CRAFT-005; DEC-02]. The direction method itself is in [brand-expression.md](brand-expression.md).

| Decision | Tells it answers | Source |
|---|---|---|
| Off-limits list: the category's default page, its predictable opposite, and the saturated looks in §6.1 unless the brief pins one | SLP-21, SLP-22, SLP-42…44, SLP-50 | CRAFT-003, IMP-006 |
| Display face, the job it does, and a verified licence | SLP-20 | CRAFT-009, CRAFT-015 |
| Colour strategy and where the accent comes from | SLP-02, SLP-28, SLP-31, SLP-43 | IMP-010, CRAFT-038 |
| One depth strategy and a radius scale by role | SLP-07, SLP-23, SLP-36 | DSL-029, CRAFT-043 |
| Motion budget and the one authored moment | SLP-09, SLP-11, SLP-26 | IMP-021, CRAFT-048 |
| A use-scene sentence that decides light or dark | SLP-29, SLP-54 | IMP-011 |
| The fold class drawn by `uie roll`, and the page macrostructure | SLP-44, SLP-51, DEC-04 | DSL-010, CRAFT-010 |
| One signature element | SLP-64 | IMP-056, DSL-080 |
| `accepted_tells` entries | any requested tell | CRAFT-005, IMP-050 |

An `accepted_tells` entry holds the tell ID, its scope (a value, a component or a route; value-scoped by default), the reason, the brief or brand line it cites, who decided, and the date [CRAFT-005; IMP-050; QUALITY-BAR §2.3]. The reason names a need of the brief (an attribute, a brand asset, a use scene, a content fact); personal taste is not a reason. SLP-12 and SLP-13 cannot be accepted (§1).

## 4. Using the catalogue at each stage

### 4.1 Build

- In an opted-in project (`.ui-evaluator/config.json` present), `uie hook` lints each edited UI file with the fast subset (hard tells, motion rules, outline removal, token drift, restricted fonts, the IME guard) and returns rule IDs, lines and one-line fixes in ≤ 1,500 characters [ARCHITECTURE §10.1]. The hook exists because reference files were opened before UI edits in only 21–53% of measured runs [IMP-057]. Without hooks, run `uie lint --changed <file>` after each UI edit.
- Treat a hit as a decision to make now, while it is cheapest: fix it, or record an `accepted_tells` entry [P13; CRAFT-005]. You may add only value-scoped ignores with a reason naming who decided; rule-wide or file-wide ignores need the owner [IMP-050].
- The builder's self-check (G1–G4 deterministic checks, at most 2 rounds) is a filter, not a verdict; the audit decides [FRAMEWORK §5.2; P5].

### 4.2 Audit

- `uie audit` runs DOM tell detection, the style census and pixel checks over routes × states × widths × themes, and `uie lint` scans source. Each hit becomes a deterministic finding (method tool, E1, severity from the rule's default) [ARCHITECTURE §7.2, §8.3; ADR-010].
- Apply each route's declared mode before judging, so landing-page rules do not fire on app UI [03 §2.1.1; FRAMEWORK §4.1].
- `jdg`-layer tells come from design critics and pass the verifier and blind raters. A finding that rests only on an LLM's aesthetic judgement defaults to the ask tier and lower confidence unless a detector or ≥ 2 independent evaluators agree [LOOP-029; LOOP-030].
- Critics write their specificity and appeal verdicts before `uie packet --role design-critic` unseals the detector output; the debrief lists agreements, detector-only and judge-only items, and false positives [CRAFT-012; IMP-036; DES-01]. See [../methods/design-panel.md](../methods/design-panel.md).
- The tell report gives, per page, the density tier and each tell with its ID, element, evidence and, for soft tells, its disposition; requested tells with their citing line; and experimental hits under *possible* [CRAFT-013; CRAFT-005; CRAFT-061].

### 4.3 Fix: decide, don't swap

1. Before touching code, write the decision and where it comes from: the attribute, use scene, brand asset or content fact. It joins the originating check as the fix contract's acceptance criterion [FRAMEWORK §10.3; CRAFT-001].
2. Change the narrowest correct layer: a token for colour, type, radius, shadow and motion values; a shared component for structure; the content itself for copy and proof [FRAMEWORK §10.4].
3. Tells are ask-tier. Fix unattended only when the decision already exists in `DESIGN.md` or the brief; otherwise batch the question to the owner [LOOP-027; FRAMEWORK §10.11].
4. Taste-level rules get one bounded pass: scan, fix once, rescan, then give every soft tell that remains a disposition: accepted (the owner adds an `accepted_tells` entry with a reason tied to the brief or the direction), disputed (evidence that the detection is wrong, on the finding) or deferred (logged in `debt.md` with an owner). More than one deferred soft tell on a page fails G4 [ADR-031; LOOP-050; FRAMEWORK §10.8].
5. Prefer removing to adding [DSL-066], but a page left empty is not a fix; build the decided signature instead (SLP-64) [DSL-080].
6. Verify with the detector set difference: any introduced tell blocks the fix, which is how swaps get caught (an emerald accent replacing a purple one raises SLP-28) [FRAMEWORK §10.5].
7. When the fix changed the look, the critic's specificity check runs again in a fresh context; a missing detector hit is not evidence of a decision [CRAFT-012; LOOP-051].

### 4.4 Over time: ledger and convergence

- A new direction differs from the last three entries of the project ledger in display face and macrostructure unless the brand pins them (DEC-04); check with `uie ledger check`. A first direction in a project has nothing to compare with, so DEC-04 is `not_applicable` and the seeded roll carries the variety [CRAFT-010; ADR-034].
- `uie roll` deals a seeded candidate outside the model's top two and draws structural parameters, including the fold class, from pools the ledger has not used recently. Prose requests for variety failed in a blind test (10 of 10 builds shared one fold), while a mechanical draw produced no split fold in 4 builds [IMP-007; DSL-010; 02 §2.6].
- Monitor convergence across outputs: for ≥ 5 outputs made for different briefs, report mean pairwise screenshot-embedding similarity and DOM macrostructure similarity, and alert above a threshold that is not yet calibrated [CRAFT-029].
- When the skill's own outputs converge on a pattern the catalogue lacks, add it as *rising*; SLP-42…44 and SLP-50 entered this way, from other skills' recommended alternatives [02 §3.3 gap 7; 02 §5 Q12].
- The cross-project ledger is opt-in and advisory: repeats found there are listed in DEC-04's detail and never change its state [FRAMEWORK §4.7; ADR-034].

## 5. Model and era priors (as of 2026-10)

The target moves with every model release, so these priors are dated and injected only for the model that is running [IMP-054; 07 §2.3].

**Eras**
- First order, 2024 to mid-2025: indigo-violet gradients, Inter, a centred hero with three icon cards, untouched shadcn, glassmorphism, emoji icons (SLP-02, SLP-20, SLP-22, SLP-06, SLP-39, SLP-34, SLP-03) [07 §2.3].
- Second order, late 2025 to 2026: cream ground with a high-contrast or italic serif and terracotta; near-black with one neon accent and glow; broadsheet hairlines with tiny tracked mono labels; emerald as the purple-escape accent (SLP-21, SLP-08, SLP-28) [07 §2.3].
- Third order, forming: a handmade anti-AI reflex of grain, hand-drawn type and collage, predicted by one source and not yet measured (SLP-65) [07 §2.2; 07 §7 Q5].

**House styles named for model families and tools**

| Family or tool | What the research names | Tells | Source |
|---|---|---|---|
| Claude Opus 4.8 | warm cream or off-white ground, serif display, italic word accents, terracotta or amber accent, in slides too; banning one colour moves it to another fixed palette | SLP-21, SLP-25 | 01 §2.4(c) |
| Claude Opus 5.5 | falls back on a few default styles; the vendor's own exclusion example lists cream grounds, italic accent words, 01/02/03 labels, monospace labels and pill buttons | SLP-21, SLP-25, SLP-23 | 01 §2.4(c) |
| Claude Sonnet 5 | the same pattern; sampling controls are unavailable, so proposing directions before building is the route to variety | SLP-21 | 01 §2.4(c) |
| Claude (impeccable's model block) | warm, bookish or child-facing subjects turned into cream grounds, italic serif display and lamplight | SLP-21 | 01 §2.1.A |
| GPT and Codex | hairline border with a wide soft shadow, over-rounded cards, sketchy SVG doodles, `feTurbulence` grain, repeating stripes, grid-paper backgrounds, theatre phrasing; a 2025-08 post said GPT-5 had not solved the purple default | SHP-02, SLP-23, SLP-56, SLP-35, SLP-14, SLP-02 | 07 §2.1, §2.3; 01 §2.1.A |
| Gemini | hover-animated images; Material Symbols icons | SLP-26, SLP-24 | 07 §2.3 |
| v0 | Geist with shadcn components | SLP-20, SLP-39 | 07 §2.3 |
| Lovable, Bolt | generator meta tags and attribution | SLP-40 | 07 §2.3 |
| A Sonnet model in ui-craft's blind builds (2026-07) | 10 of 10 builds with the same split fold and floating proof card under four prose conditions; the same graphite and teal accent twice | SLP-44 | 02 §2.6 |
| Category lookup tools | Tailwind default palettes (83.5% of one skill's hex values) and stereotyped category looks | SLP-31 | 02 §2.1 |

**Refreshing the priors**
1. After the first output for a brief, list which catalogue entries and which recurring unlisted choices it used, and extend the exclusions for the next pass, as Anthropic's Opus 5.5 guidance advises [IMP-054; 01 §2.4(c)].
2. Name specific patterns; a general instruction to avoid an AI look only swaps defaults [IMP-055].
3. Re-review every prior and status at each major model release, with the convergence metric over ≥ 5 outputs for different briefs (§4.4) [CRAFT-013; CRAFT-029].
4. Optional and unvalidated: sample the model's unguided output for the bare brief (for example 5 generations) and treat that cluster as the rut for this model and brief; cost and validity are unknown [07 §7 Q1].
5. Record provider and model for every run and ledger entry, so priors can be tied to model versions [EVD-01; FRAMEWORK §6.2].

## 6. Saturated looks and faces (as of 2026-10)

Both lists name defaults that need a recorded reason. Neither is followed by alternatives, on purpose: every recommended list so far became the next saturated list [ADR-012; 07 §2.1; FRAMEWORK §11].

### 6.1 Looks

`direct` treats these as off-limits unless the brief pins one [CRAFT-003; IMP-006]:
- the first-order SaaS look: indigo-violet accents and gradients, the centred hero formula, three icon-tile cards, an untouched component kit (SLP-02, SLP-22, SLP-06, SLP-39) [07 §2.3];
- cream ground with a high-contrast or italic serif and a terracotta or clay accent (SLP-21) [IMP-012];
- near-black with one acid or neon accent and glow (SLP-21, SLP-08) [IMP-012];
- broadsheet: hairline rules, zero radius, dense columns, tiny tracked mono labels (SLP-21) [IMP-012];
- the SaaS card kit: identical rounded cards, one radius, one soft grey shadow, decorative gradient washes (SLP-07, SLP-23) [IMP-012];
- template chrome: tracked caps eyebrows, middle-dot meta strings, dash-built labels, an arrow on every link (SLP-05, SLP-27) [IMP-012];
- rising successors that earlier anti-slop advice recommended: editorial serif with an italic accent, beige and brass for premium briefs, the split fold, bento by default, the emerald escape accent (SLP-42, SLP-43, SLP-44, SLP-50, SLP-28) [DSL-011; 02 §3.3 gap 7].

### 6.2 Faces

A face below used as the display voice or as the only face needs a reason recorded in `DESIGN.md` (SLP-20). This is a warning list, not a ban list and not a quality judgement: designers point out that some of these faces became common because they are good [07 A-TY2; 07 C1].
- **First-order defaults** [07 A-TY1; IMP-013; DSL-011]: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Arial, Helvetica and `system-ui` as display or only face; Geist used untouched from `next/font`.
- **Second-order cluster** [07 A-TY2; IMP-013; CRAFT-015]: Space Grotesk, Space Mono, Instrument Serif, Instrument Sans, Fraunces, Syne, Sora, Bricolage Grotesque, Young Serif, Recoleta, Bodoni, Playfair Display, Newsreader, Cormorant, Lora, Crimson, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, IBM Plex, Mona Sans, Geist Sans and Geist Mono.
- **Named in model house styles and default rosters** [01 §2.4(c); 02 §2.14; 07 C1]: Georgia as the serif display of the cream look; JetBrains Mono; Satoshi.
- **Exempt** [07 A-TY1; CRAFT-015; IMP-013]: brand faces on their own domains (impeccable allows Geist on Vercel's site, Roboto on Google's and Mona Sans on GitHub's); a face declared for body and UI on Operate and Read surfaces; a face the brand commits to.

When a pick lands on this list, the answer is a recorded reason or a new search from the subject's voice words (SLP-20), never the nearest unlisted neighbour [02 §3.3 gap 7]. The list is Latin-only (§8) and is reviewed with the statuses (§7).

## 7. Calibration and lifecycle

**Measure every detector.** Each deterministic tell rule ships with precision and recall on a labelled set: start from Krebs' 192 human labels, add UI-Evaluator labels in `evals/labels/`, and keep should-flag and should-pass fixtures per file type [CRAFT-061; ARCHITECTURE §14]. Krebs' manual QA estimated 5–10% false positives for deterministic DOM checks [07 §2.2]. Publish false-positive and false-negative counts and fail CI when a change worsens them [DSL-070]. Report which rule families ran per file type, because impeccable's detector runs fewer rules on some file types and zero findings can then mean lost coverage [IMP-049; 01 §2.1.G].

**Promotion and demotion**
- Experimental to soft: a working detector with measured precision; the bar for this step is not yet agreed [CRAFT-061].
- Soft to hard: precision ≥ 0.9 on the labelled set [QUALITY-BAR G4; CRAFT-061].
- Any class or threshold change, including a hard tell whose measured precision falls below 0.9, is recorded as an ADR with its calibration data or new source [FRAMEWORK §17].
- The doctor's known-bad fixture carries expected tell detections; a tell detector that finds nothing there fails EVD-02 [FRAMEWORK §14; QUALITY-BAR EVD-02].

**Labels need agreement.** Designers rating shared pairs reached only Krippendorff's α = 0.37 in UIClip's data, so labels come from several raters with agreement reported; the agreement target is still open [07 §4.3; 07 §7 Q2].

**Status lifecycle** [CRAFT-013; FRAMEWORK §17]

| Status | Meaning |
|---|---|
| active | produced by default now; detect and report |
| rising | a successor default spreading, often after an older tell was suppressed or advised against |
| migrating | still common, but its main form is moving to a successor that has its own ID; detect both |
| obsolete | rare in current outputs; kept for older codebases and history |

A status changes on evidence: prevalence scans of the Krebs kind, convergence monitoring of the skill's own outputs, per-model first-output checks, and perception studies; vocal complaints measure perception, not prevalence [07 §2.2; CRAFT-029; IMP-054]. Review statuses and the lists in §5 and §6 at each major model release and on every release checklist [CRAFT-013; ARCHITECTURE §14]. No tell has a measured effect on trust, conversion or task success yet, so G4 gates deliberateness, not outcomes [07 §5.3; QUALITY-BAR §8].

## 8. CJK and localisation notes

- The catalogue is Western-derived. Whether Chinese users read the same patterns as generated is unknown, so treat audience tiers as unknown on zh surfaces [07 §7 Q3].
- Semi Design reserves a blue→purple→pink gradient token for AI features; in products following that convention, a decorative purple gradient also blurs a meaning (SLP-02) [PLAT-068; 05 §2.14].
- Han text has no case, so the uppercase branches of SLP-05 and SLP-46 cannot fire; the tracked branch can, and CJK letter-spacing stays ≥ 0 under TYP-08 anyway [QUALITY-BAR TYP-08; inference].
- SLP-14's em-dash rate was set on Latin copy, while Chinese writes its dash as two em dashes in normal punctuation; read CJK-driven hits before acting on them [05 §2.13; unverified].
- The face list in §6.2 is Latin-only, and no sourced zh-CN buzzword list exists yet [05 §5 Q12]. CJK font stacks follow I18N-01 in [cjk.md](cjk.md).

## Sources

Research notes: 07 Part A (catalogue A-*, §2.3 priors, §2.5 usage rules; CRAFT-001, 003…005, 007, 009, 010, 012…030, 038, 042…045, 048, 056, 058, 061; conflicts C1…C7, C10…C15, C17, C18); 01 (IMP-001, 006, 007, 010…014, 021, 023, 025, 027…029, 036, 049…051, 054…057); 02 (DSL-010, 011, 020, 021, 028…034, 049, 051…053, 066, 070, 075, 079, 080; X4…X8, X17, X22, X23; gap 7); 05 §2.10, §2.13, §2.14 (PLAT-032, 050, 060, 067, 068, 071, 075, 121, 127); 03 (LOOP-027, 029, 030, 050, 051).

External sources (read 2026-10; licences per AUTHORING §8):
- impeccable, P. Bakaus, v4.4.0, 2026, Apache-2.0, https://github.com/pbakaus/impeccable (rules and thresholds re-expressed).
- Anthropic `frontend-design` skill v1–v3, 2025–2026, Apache-2.0, https://github.com/anthropics/skills (re-expressed).
- Anthropic, *Improving frontend design through Skills*, 2025-11-12, https://claude.com/blog/improving-frontend-design-through-skills; model prompting pages for Opus 4.8, Sonnet 5 and Opus 5.5, https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/ (ideas only).
- A. Krebs, *Scoring Show HN submissions for AI design patterns*, 2026-04-20, https://www.adriankrebs.ch/blog/design-slop/; design-slop-cop (MIT), https://github.com/AdrianKrebs/design-slop-cop.
- J. C. Johnson, vibecoded-design-tells (MIT code), 2026, https://github.com/JCarterJohnson/vibecoded-design-tells.
- signs-of-ai-design (CC BY-SA 4.0, summarised only), https://github.com/febbhav/signs-of-ai-design; avoid-ai-design (MIT), https://github.com/funboy322/avoid-ai-design.
- gstack (MIT), https://github.com/garrytan/gstack; Hallmark (MIT), https://github.com/Nutlope/hallmark; taste-skill (MIT), https://github.com/Leonxlnx/taste-skill; ui-craft (MIT), https://github.com/educlopez/ui-craft; anti-slop (MIT), https://github.com/miqdadbadjuber/anti-slop; Gesso skills (MIT), https://github.com/Gesso-Build/skills.
- OpenAI, *Designing delightful frontends with GPT-5.4*, 2026, https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4 (ideas only).
- Tailwind CSS v4.3 theme (MIT), https://github.com/tailwindlabs/tailwindcss; A. Wathan, post of 2025-08-07, https://x.com/adamwathan/status/1953510802159219096.
- Semi Design (MIT), https://github.com/DouyinFE/semi-design.
- K. Kaplan, *The AI sparkles icon problem*, NN/g, 2024-09-20, https://www.nngroup.com/articles/ai-sparkles-icon-problem/.
- Hacker News threads 47774003 (2026-04-15), 47864393 and 47865795 (2026-04), https://news.ycombinator.com/.
- Tuch et al., IJHCS 70(11), 2012; Hekkert, Snelders and van Wieringen, Br. J. Psychology 94, 2003, DOI 10.1348/000712603762842147.

impeccable and Anthropic's skill are Apache-2.0 and are re-expressed here, with attribution in `NOTICE.md`; Anthropic's blog and docs, OpenAI's guide and unlicensed repositories contribute ideas only; signs-of-ai-design is CC BY-SA 4.0 and is summarised, not copied [AUTHORING §8].
