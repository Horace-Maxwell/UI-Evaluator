# CJK typography and Chinese conventions

This file covers Chinese, Japanese and Korean text on the web: font stacks and regional families, weights, leading, measure, solid setting, emphasis, punctuation, line breaking, Han–Latin spacing, paragraphs, language tags, IME input and text expansion, plus zh-CN copy and data-format conventions. It serves gate G3 through I18N-01 to I18N-03, which apply when a CJK locale is in scope (thresholds repeated exactly from QUALITY-BAR), and adds advisory rules I18N-04 to I18N-19 and the zh strings that the copy gates CPY-02 and CPY-04 check. Typography gates for every script (TYP-01 to TYP-10) are in [typography.md](typography.md); `lang` as an accessibility gate is [A11Y-16](accessibility.md) and contrast, including CJK large-text sizes, is [A11Y-11](accessibility.md); general copy rules are in [content-copy.md](content-copy.md). Read this file whenever `PRODUCT.md` lists a Chinese, Japanese or Korean locale, in `direct`, `build`, `audit` and `fix`. Coverage is uneven: Chinese was researched in depth, Japanese and Korean only as pointers (§5).

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules): gate I18N-01 to I18N-03, advisory I18N-04 to I18N-19, [zh strings for CPY-02 and CPY-04](#zh-strings-for-cpy-02-and-cpy-04)
3. [Decisions to make](#3-decisions-to-make), with [CJK font licences](#cjk-font-licences)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [Japanese, Korean and other locales](#5-japanese-korean-and-other-locales)
- [Sources](#sources)

## 1. Principles

1. **Region selects the rules, so tag the region.** Glyph forms and layout conventions differ between Mainland China, Taiwan and Hong Kong, and the browser can only choose the right ones from `lang`.
2. **Declare CJK fonts; never let the system choose.** An undeclared or `system-ui` stack hands the choice to the operating system, which can ignore the page language.
3. **CJK glyphs are square, dense and uniform.** They need more leading, solid setting and a shorter measure than Latin text, and none of the Latin habits of italics, capitals or negative tracking.
4. **Conventions are product decisions made once.** Form of address, terms, spacing style and formats are recorded once and applied everywhere; mixing them is the failure.
5. **Input belongs to the text experience.** An IME composition must never trigger an action.
6. **Say what is not covered.** Japanese and Korean guidance here is a set of pointers until it is researched.

## 2. Rules

Gate rules come first and repeat the G3 thresholds exactly. Advisory rules (`level: advisory`) raise findings but never fail G3 on their own. Check names in `--checks` follow `uie audit --help`. Chinese examples use typed spaces between Han characters and Latin letters or digits so they read correctly as plain text; with `text-autospace` (I18N-11) those spaces are left out.

### I18N-01 · Explicit CJK font stack
`gate G3` · `modes: all` · `status: active` · `verify: S/D (uie lint, uie audit --checks census)`

**Rule.** Threshold: content CJK text resolves through declared CJK families (e.g. PingFang SC → Hiragino Sans GB → Microsoft YaHei → Noto Sans SC); `system-ui` and `ui-sans-serif` are not the content face. Order the stack as: the Latin family first, so Latin letters and figures come from it; then the platform CJK families for the region; then an openly licensed CJK family as the cross-platform fallback; then the generic family.

**Why.** Without a declared family the operating system decides. Older Windows rendered SimSun instead of Microsoft YaHei, and `system-ui` on Windows ignores the page language: Tailwind removed it from its default stack after characters rendered wrongly on Windows set to a Japanese locale (PR #20318, 2026-07).

**Check.** `uie lint` CJK font-stack findings; computed `font-family` of nodes that contain Han, Kana or Hangul.

**Fix.** Define the stack once, as a font token at the root, with per-region variants under `:lang()` (I18N-02). Reference platform families by local name only (I18N-03). A locally installed Noto CJK may carry a longer family name than the hosted one **[unverified]**, so test the fallback on Linux or Android.

**Exceptions.** Code and data in monospace; text inside images; elements that never contain CJK text.

**Sources.** [PLAT-017]; Tailwind CSS PR #20318; TDesign, Arco and Semi font stacks.

### I18N-02 · Regional families
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Threshold: Traditional Chinese pages use TC/HK families, never SC. Traditional stacks swap in PingFang TC or PingFang HK to match the region, Microsoft JhengHei, and Noto Sans TC or Noto Sans HK.

**Why.** Unified Han code points are drawn differently by region. An SC font on a Traditional page shows Mainland glyph forms and punctuation positions: Mainland punctuation sits at the start of the character frame, while Taiwan and Hong Kong centre it.

**Check.** On routes whose `lang` is zh-TW, zh-HK or zh-Hant, the computed CJK families are TC or HK families.

**Fix.** Override the font token under `:lang(zh-TW)`, `:lang(zh-HK)` and `:lang(zh-Hant)`. Japanese and Korean pages need their own regional families in the same way (§5).

**Exceptions.** Logotypes drawn as images.

**Sources.** [PLAT-131]; W3C clreq §1.2.

### I18N-03 · Restricted fonts not self-hosted (all locales)
`gate G3` · `modes: all` · `status: active` · `verify: S (uie lint)`

**Rule.** Threshold: SF Pro/New York, Segoe UI, PingFang, Microsoft YaHei and GDS Transport are referenced by local name only.

**Why.** Their licences do not allow web embedding or redistribution. Apple licenses its fonts only for mock-ups of Apple-platform interfaces, Microsoft YaHei's web licensing goes through Monotype, and GDS Transport is reserved for GOV.UK services.

**Check.** `uie lint` restricted-font findings: `@font-face` rules or bundled font files for these families.

**Fix.** Delete the `@font-face` rule and the file, and keep the family in the stack by local name. If a self-hosted CJK face is needed, use an openly licensed one (see [CJK font licences](#cjk-font-licences)).

**Exceptions.** None. The same restriction holds in every locale ([TYP-17](typography.md)).

**Sources.** [PLAT-017]; Apple fonts licence; Microsoft YaHei font page; GOV.UK typeface guidance.

### I18N-04 · Weights that survive every platform
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Build CJK hierarchy from 400 plus 600 or 700. Never rely on 500 alone to separate two CJK roles.

**Why.** Microsoft YaHei ships only Light, Regular and Bold, so CSS 500 renders as Regular there and a 400/500 contrast disappears on Windows. PingFang's heaviest weight is Semibold, so 700 adds nothing over 600 on Apple platforms **[unverified]**.

**Check.** Computed weights of CJK text per role; pairs of roles that differ only by 400 against 500.

**Fix.** Set the emphasis weight token to 600 under `:lang(zh)`.

**Exceptions.** A self-hosted CJK family that ships a real 500 weight.

**Sources.** [PLAT-013]; TDesign typography; Microsoft YaHei font page.

### I18N-05 · CJK line height
`level: advisory` · `modes: all` · `status: calibrating` · `verify: D (uie audit --checks census,layout)`

**Rule.** UI text uses line-height = font size + 8 px (12 → 20, 14 → 22, 16 → 24). Reading paragraphs use 1.7–1.9 **[calibrating]**, inside clreq's range of 1.5–2.0. Because +8 px drops below 1.5 above 16 px (18 → 26 is 1.44), multi-line CJK text above 16 px uses at least 1.5 to pass TYP-03. Keep the gap constant through a paragraph.

**Why.** A fixed ratio makes large text too loose and breaks rhythm in mixed-size layouts, which is why Ant Design and TDesign add a constant instead. Long reading needs a larger gap: clreq puts the line gap at half to a full character height, and Material 3 gives CJK about 7% more line height than Latin by default.

**Check.** Computed `line-height` against `font-size` on CJK nodes, by role.

**Fix.** Override the leading tokens under `:lang(zh)`, `:lang(ja)` and `:lang(ko)`; never per component.

**Exceptions.** Single-line labels. Wrapping CJK headings: see the note under [TYP-03](typography.md).

**Sources.** [PLAT-011, PLAT-021, PLAT C16]; Ant Design font specification; TDesign typography; Arco style guide; W3C clreq §7.1; Material 3 language-height tokens.

### I18N-06 · CJK measure and type area
`level: advisory` · `modes: Read, Persuade, Experience (prose)` · `status: calibrating` · `verify: D (uie audit --checks layout)`

**Rule.** Prose holds 20–40 glyphs per line **[calibrating]**, inside clreq's bounds of 10–48; TYP-04 fails when two or more lines exceed 48. Size CJK prose containers in whole `em`, since one ideograph is one em wide, so that justified lines end flush.

**Why.** Books set 17–40 characters per line, WCAG's AAA guidance caps CJK blocks at 40, and a width of whole characters keeps justified edges clean.

**Check.** Glyphs per rendered line in CJK prose blocks.

**Fix.** Set `max-width` on the prose container in whole ems at or below 40, never on the page body.

**Exceptions.** Phone widths, which are naturally shorter (keep 10 or more where possible); tables; UI labels.

**Sources.** [PLAT-014, PLAT C19]; W3C clreq §7.1; WCAG 1.4.8.

### I18N-07 · Solid setting
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** CJK body and UI text has `letter-spacing: 0`. Positive tracking only on short running heads, captions or labels; negative tracking never (TYP-08).

**Why.** Han characters and CJK punctuation sit in square frames and are set solid by default. Looser setting is a convention only for short items, and tighter setting is a print headline effect, not a UI default.

**Check.** Computed `letter-spacing` on CJK nodes.

**Fix.** Redefine the tracking tokens to 0 under `:lang()` at the base layer, so Latin display tracking cannot reach Chinese headings.

**Exceptions.** Short captions or labels with positive tracking.

**Sources.** [PLAT-015]; W3C clreq §6.3.1.

### I18N-08 · Emphasis without italics
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks census)`

**Rule.** Emphasise CJK text with a heavier weight, a different face or emphasis dots, never italics. Set `font-synthesis-style: none` on CJK text so the browser cannot fake a slant. Chinese emphasis dots go under horizontal text (`text-emphasis-position: under`); Japanese puts them over it.

**Why.** CJK faces have no italics, so `font-style: italic` produces a synthetic slant. Chinese practice marks emphasis with dots under the characters or with a heavier or different face.

**Check.** Computed `font-style` and `font-synthesis` on CJK nodes; `em` and `i` elements inside CJK text.

**Fix.** Restyle `em` under `:lang(zh)` to the emphasis weight or to `text-emphasis`, and remove italic utilities from Chinese headings.

**Exceptions.** Latin words inside Chinese text keep Latin conventions, such as an italic English book title.

**Sources.** W3C clreq §5.3; MDN `text-emphasis-position` and `font-synthesis-style` (both Baseline, as of 2026-10); sparanoid/chinese-copywriting-guidelines.

### I18N-09 · Punctuation forms and widths
`level: advisory` · `modes: all` · `status: active` · `verify: S (string review), P (screenshots)`

**Rule.** In Chinese sentences use full-width punctuation (，。：；？！、“”《》); in complete English sentences and for digits use half-width. Put no space between full-width punctuation and neighbouring Latin text or digits, and do not repeat punctuation (！！, ？！？). Prose uses the six-dot ellipsis …… (two U+2026, never split across lines) and the two-character dash ——. Truncation uses CSS `text-overflow` (a single …); for short UI status strings, record one convention (Ant and Arco use a single …). Dates take half-width hyphens (2026-10-01). Choose one quotation-mark style and one range mark per product.

**Why.** Mixed widths break the square rhythm of the line and look like encoding errors. The doubled ellipsis and dash follow the national standard GB/T 15834 as documented by clreq; truncation is a different job [PLAT C14].

**Check.** String review for half-width `,` `.` `?` `!` or straight quotes inside Chinese sentences and for split ellipses; screenshots for punctuation drawn at Latin width.

**Fix.** Correct the message catalogue. Chinese and Western punctuation share code points (quotes, dashes, ellipsis, middle dot), so the glyph depends on which font draws it and on `lang`. With a Latin-first stack, check that these marks come from the CJK family; if they do not, map those code points to the CJK family with a `unicode-range` face **[unverified workaround]**.

**Exceptions.** Code, identifiers and URLs. `text-spacing-trim` can compress adjacent punctuation and trim line-end punctuation to half width, but it is not Baseline and needs fonts with `halt` or `chws` (as of 2026-10): use it only as an enhancement.

**Sources.** [PLAT-133, PLAT C14]; W3C clreq §5.4.1, §6.3.2 and issue #430; sparanoid/chinese-copywriting-guidelines; Ant Design and Arco copy rules; MDN `text-spacing-trim`.

### I18N-10 · Line-breaking prohibitions (kinsoku)
`level: advisory` · `modes: all` · `status: active` · `verify: P/A (screenshot review; no automated line scan yet)`

**Rule.** No line starts with 、，；：。！？ or a closing quote or bracket, and no line ends with an opening quote or bracket. …… and —— never split, and numbers stay with their unit, %, ‰, °, ℃, sign or currency symbol. Keep the browser's default line breaking: no `line-break: anywhere` and no `word-break: break-all` on prose, and no manual `<br>` inside paragraphs. Keep a number with its unit with a non-breaking space or `white-space: nowrap`. Do not add hanging punctuation; it is uncommon in Chinese.

**Why.** A comma or full stop at the start of a line reads as a typesetting error to Chinese readers. `line-break: anywhere` disregards the prohibitions, and `break-all` also splits Latin words inside Chinese text.

**Check.** First and last characters of each rendered line in CJK paragraphs, in screenshots at every width.

**Fix.** Remove the overriding CSS from the paragraph component. `line-break: strict` (Baseline) adds restrictions that mostly matter for Japanese.

**Exceptions.** Long URLs and identifiers may use `overflow-wrap: anywhere`.

**Sources.** [PLAT-133, DSL-054]; W3C clreq §6.1.1–6.1.3; MDN `line-break` and `word-break`.

### I18N-11 · Han–Latin spacing
`level: advisory` · `modes: all` · `status: active` · `verify: A (string review), D (computed text-autospace)`

**Rule.** Separate Han characters from adjacent Latin letters and digits with a small gap. Prefer CSS `text-autospace` (initial value `normal`, Baseline since 2025-11), which adds the gap only where no space is typed. If the content style uses typed spaces instead, apply them everywhere: between Han and Latin text, between Han and digits, and between a number and its unit except before % and °; never beside full-width punctuation; never inside fixed terms such as 3D打印 or 7号线. Choose one approach per product.

**Why.** Han–Latin gaps belong to Chinese typesetting (clreq allows up to a quarter em, or a normal space). A typed space and the automatic gap differ in width, so mixing them looks uneven. Strings from `Intl` (for example 5分钟前) and from users contain no typed spaces, which only the CSS approach reaches.

**Check.** Computed `text-autospace` on CJK routes; string review for missing, doubled or inconsistent spaces.

**Fix.** Set `text-autospace` at the root of CJK routes, then stop adding typed spaces in new strings.

**Exceptions.** Product names written without spaces by their owners; code.

**Sources.** [PLAT-134, PLAT C15]; W3C clreq §6.3.3; CSS Text Level 4; MDN `text-autospace`; sparanoid/chinese-copywriting-guidelines; Arco and Ant Design copy rules.

### I18N-12 · CJK paragraph setting
`level: advisory` · `modes: Read, Persuade, Experience` · `status: active` · `verify: D (uie audit --checks census), P`

**Rule.** Justify only pure-CJK paragraphs; start-align mixed-script and URL-heavy text and all UI. Separate paragraphs with either a two-character first-line indent or paragraph spacing, never both; spacing is the usual web choice. Avoid a last line holding a single character, or a character plus punctuation.

**Why.** Uniform glyphs make justification the CJK norm, which is why TYP-10 exempts it. Indent plus spacing marks every paragraph twice. A stranded character reads as a broken line.

**Check.** Computed `text-align`, `text-indent` and paragraph margins on CJK prose. `uie audit --checks census` reports a wrapped CJK block whose last rendered line holds one character, or one character and punctuation, at every matrix width.

**Fix.** Edit the copy or adjust the container width. `text-wrap: pretty` may help, but its effect on Chinese is **[unverified]**.

**Exceptions.** UI strings and headings.

**Sources.** [PLAT-132, PLAT C20]; W3C clreq §6.2.1 and §7.1.2; WCAG 1.4.8.

### I18N-13 · Regional language tags
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit, lang audit; gate form A11Y-16)`

**Rule.** Set `<html lang>` to the region (`zh-CN`, `zh-TW`, `zh-HK`; or `zh-Hans` and `zh-Hant` where script matters more than region), `ja` or `ko`, from the active locale rather than hard-coded. Tag runs in another language with their own `lang`, and use the same tags as hooks for the `:lang()` overrides in this file.

**Why.** `lang` selects regional glyph forms, punctuation position, line-breaking rules, the screen-reader voice and the localised glyphs that fonts substitute through OpenType `locl`. Automated engines only confirm that a tag is valid: axe passed a Chinese page tagged `en`.

**Check.** The dominant script of the content against the declared tag. The gate is A11Y-16 in [accessibility.md](accessibility.md).

**Fix.** Set `lang` in the root layout from the locale.

**Exceptions.** Plain `zh` remains acceptable where it was already used and only one script ships.

**Sources.** [TOOL-19, PLAT-130]; W3C i18n, "Choosing a language tag"; W3C clreq §1.2 and issue #430.

### I18N-14 · IME-safe keyboard handling
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint), I (manual IME test)`

**Rule.** Every `keydown` or `keypress` handler that acts on Enter, or on another key, inside a text field returns early during IME composition: `if (event.isComposing || event.keyCode === 229) return;`.

**Why.** Chinese, Japanese and Korean users press Enter to confirm a composition. Without the guard, chat boxes, search fields and Enter-to-submit forms fire on half-typed text. `isComposing` alone is unreliable at the edges of a composition, hence the 229 check.

**Check.** `uie lint` IME-guard findings, then a manual test with a Pinyin IME, because scripted composition events are not yet reliable.

**Fix.** Put the guard in the shared input or hotkey utility, not in each field. In a language-learning flashcard app, an answer box that checks on Enter must wait while the learner is still composing 你好 in Pinyin.

**Exceptions.** Handlers on elements that take no text input.

**Sources.** [TOOL-20]; MDN `keydown` event; impeccable issue #856.

### I18N-15 · Text expansion and script height
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit --checks layout, per locale)`

**Rule.** Budget +30–40% length for translated strings, give text containers no fixed heights, and test every surface in each shipped locale. English string lengths predict neither CJK width nor height. Write complete translatable strings; never assemble sentences from fragments, because word order differs between languages.

**Why.** Translations commonly run longer than English (Material cites about 1.5×), and taller scripts clip in fixed-height components.

**Check.** Clipping, overlap and overflow per locale (FUN-06, A11Y-08).

**Fix.** Minimum heights, wrapping and logical properties in the component; whole strings with placeholders and plural rules in the catalogue.

**Exceptions.** None.

**Sources.** [IMP-048, PLAT-021]; FRAMEWORK §12.2; Material 3 global writing guidance; impeccable `harden` and `clarify`.

### I18N-16 · zh-CN voice: address, apology, prohibitions, absolutes
`level: advisory` · `modes: all` · `status: active` · `verify: A (copy review), S (glossary diff)`

**Rule.** Choose 你 or 您 once per product, record it, and never mix them: tools usually take 你, while formal contexts such as finance, government and customer service often take 您. Do not switch between 我的 and 你的 for the same object, or mix 你 and 我 in one sentence. Use 抱歉 only when the system is at fault, never for the user's input, and prefer 抱歉 to 对不起. Avoid default prohibitions (不要、不能、请勿) and say what works instead. Avoid absolutes (最好、绝对、总是). In mainland advertising, 国家级, 最高级 and 最佳 are prohibited (Advertising Law art. 9(3)), and cited data must be true, accurate and sourced (art. 11), which matches SLP-12 in [anti-slop.md](anti-slop.md).

**Why.** Mixed forms of address read as careless, apologising for the user's own input reads as noise or blame, prohibitions sound like scolding, and unsupported absolutes are both hype and, in ads, a legal risk.

**Check.** Review of the zh-CN catalogue; a glossary diff catches mixed forms of address.

**Fix.** Rewrite in the catalogue. For a veterinary clinic's booking form: 请勿输入特殊字符 becomes 宠物名称可以使用中文、字母和数字.

**Exceptions.** Statutory wording that must be quoted. SAMR's enforcement guide (2023 No. 6) lists uses that are not violations, such as objective facts stated with their conditions; this is not legal advice.

**Sources.** [PLAT-136, PLAT-122, PLAT C17]; Ant Design copywriting; Arco style guide; Semi content guidelines; 中华人民共和国广告法 art. 9 and 11; SAMR announcement 2023 No. 6.

### I18N-17 · zh-CN terms and label mechanics
`level: advisory` · `modes: all` · `status: active` · `verify: S (glossary diff), A`

**Rule.** Keep one term per concept in the glossary and make each entry label match its destination's title (CPY-07). Use these forms:

| Use | Not |
|---|---|
| 登录 | 登陆 |
| 账号 | 帐号 |
| 其他 | 其它 |
| 抱歉 | 对不起 |
| 添加 (Semi's choice; any one term, consistently) | 添加 and 新增 for the same action |
| 禁用名单 (Semi, inclusive wording) | 黑名单 |

Labels, buttons, titles, input hints, tooltips and table cells take no terminal 。, and exclamation marks are kept for greetings and congratulations. Actions are verb + object (删除档案); statistics are number + unit + noun; statistics use Arabic numerals, and Chinese numerals appear only in formal or ceremonial text. Routine success is a short statement of the result (已保存), not a celebration.

**Why.** Synonyms make people wonder whether two things differ, terminal punctuation on short labels is noise, and verb-first labels name the outcome.

**Check.** Glossary diff across the zh-CN catalogue; a scan for 。 at the end of short strings.

**Fix.** Correct the catalogue first, then the glossary in `DESIGN.md` ([content-copy.md](content-copy.md) §3.3).

**Exceptions.** Quoted user content; legal text.

**Sources.** [PLAT-125, PLAT-136]; Ant Design copywriting; Arco style guide; Semi content guidelines.

### I18N-18 · zh jargon review list
`level: advisory` · `modes: all (most relevant on Persuade)` · `status: calibrating` · `verify: A (copy review)`

**Rule.** **[heuristic]** Flag these terms in user-facing copy and rewrite around what the product concretely does: 赋能、闭环、链路、颗粒度、底层逻辑、拉通、组合拳、矩阵 (as in 触达矩阵)、心智 (as in 击穿心智)、引爆点、全场景、无缝流转. Each hit is judged by sense, like CPY-19's advisory table; it is not evidence for SLP-14 until its precision is measured [CRAFT-061].

**Why.** No openly licensed Chinese style guide publishes a words-to-avoid list like GOV.UK's, so this list rests on two mainstream commentaries that criticise these terms as obscure workplace jargon that hides plain meaning (Guangming Daily, 2022; Banyuetan, 2024), and on Ant Design's and Arco's advice to use familiar words and no jargon. It is deliberately short: other terms those articles name, such as 迭代 or 生命周期, are ordinary technical words.

**Check.** String search over the zh-CN catalogue; a reviewer judges each hit in context.

**Fix.** Name the action or outcome. In a flashcard app, 打造全场景无缝流转的学习闭环 becomes 手机和电脑上都能接着上次的进度学.

**Exceptions.** Technical text where the term has a defined meaning (链路 in network tracing, 矩阵 in mathematics); quoted user language.

**Sources.** 光明日报 (汉卿), 2022-01-09; 半月谈评论员 张曦, via 中国网, 2024-02-05; Ant Design copywriting; Arco style guide; GOV.UK words to avoid (the English analogue).

### I18N-19 · zh-CN data formats and masking
`level: advisory` · `modes: all` · `status: active` · `verify: S (formatter unit tests), A`

**Rule.** Dates are `yyyy-mm-dd`, with a space before the time; time is 24-hour `HH:mm` (`HH:mm:ss` where seconds matter). Relative time runs 刚刚 under a minute, N 分钟前 under an hour, N 小时前 under a day, then `mm-dd HH:mm`, and `yyyy-mm-dd HH:mm` beyond a year; Semi's ladder (今天 HH:mm, 昨天, weekday) is an alternative, one per module. Group thousands in numbers longer than four digits; show amounts as ¥1,234.00 or CNY1,234.00, with two decimals, right-aligned; use 万 and 亿 for very large numbers; weeks start on Monday. Mask personal data the same way everywhere: phone numbers keep the first 3 and last 4 digits (138****1234); names keep the first character (张*), plus the last for names of three or more characters (欧*锋).

**Why.** Chinese enterprise systems converge on these conventions, and mixed formats inside one product slow scanning.

**Check.** Unit tests of the formatting helpers against the recorded patterns; review of masked fields.

**Fix.** Route all formatting through one helper that wraps `Intl` and applies the recorded patterns. `Intl`'s zh-CN defaults differ: in Node 26 (checked 2026-10) a date formats as 2026/10/1 and relative time as 5分钟前, while the 24-hour clock, thousands separators, ¥ with two decimals, 亿-style compact numbers and Monday as first day already match.

**Exceptions.** Legal or financial documents with mandated formats.

**Sources.** [PLAT-135, PLAT-137]; Ant Design data-format specification; Semi content guidelines; Arco style guide.

### zh strings for CPY-02 and CPY-04

These lists are the zh part of two G3 gates defined in [content-copy.md](content-copy.md); QUALITY-BAR points here for them. The principles are source-backed. Strings beyond the ones QUALITY-BAR names are our renderings of the English list and are marked **[heuristic]**.

**CPY-02 · descriptive link text** (implements WCAG 2.4.4, so it cannot be waived). A link fails when its whole accessible name is 点击这里, 点此, 这里, 更多 or 了解更多 and its programmatic context (the sentence, list item or table cell, or `aria-describedby`) does not say where it leads. Name the destination instead (了解预约规则), or add hidden context to the name. Review candidates outside the gate list **[heuristic]**: 查看更多, 查看详情, 详情, 点我.

**CPY-04 · error-message quality.** In exercised error states, these fail when shown without a cause and a fix (generic), when they blame the user, or when a code stands alone:

| English string in CPY-04 | zh strings that fail |
|---|---|
| "An error occurred", "Something went wrong" | 发生错误 or 出错了 alone; 操作失败 without a reason or fix; **[heuristic]** 出现错误、请求失败、出了点问题、系统异常 alone |
| "Invalid", "illegal" | 无效 or 非法 alone; **[heuristic]** 输入无效、格式错误、非法输入、非法操作 alone |
| "forbidden" | **[heuristic]** 禁止访问 or 无权访问 alone, with no next step |
| "Oops" | 哎呀、糟糕 |
| "you forgot" (blame) | 您忘记了…; **[heuristic]** 你忘了…、你没有填写… |
| A raw error code alone | an error code such as 错误 500 with no words |

请 and 抱歉 are idiomatic in Chinese and are not CPY-04 hits; 抱歉 for a user's own mistake is advisory (CPY-09, I18N-16). A passing message names the field and the fix, for example 请按 2026-10-15 这样的格式输入日期.

**Sources.** [PLAT-094, PLAT-126]; QUALITY-BAR CPY-02 and CPY-04; WCAG 2.4.4; Ant Design copywriting (no blame; 抱歉 only for system faults); Arco style guide (errors state the reason, in words rather than a code); Semi content guidelines (no code-speak error strings; outcome-oriented link text); research note 08 §A3 (了解更多 without programmatic context).

## 3. Decisions to make

Record type decisions in `DESIGN.md` and content conventions in its voice and glossary sections ([content-copy.md](content-copy.md) §3). Locales and regions come from `PRODUCT.md`.

| Decision | Options | How to choose |
|---|---|---|
| Regions | zh-CN, zh-TW, zh-HK, ja, ko | From the users in `PRODUCT.md`; each region gets its own tag and stack |
| Font source | system families only, or a self-hosted open family | System families by default; self-host only when the brand needs a specific face, after the licence table below |
| Stack per region | I18N-01 ordering | Latin family, platform CJK families, open fallback, generic |
| Emphasis | weight, a second face, or emphasis dots | Brand; never italics |
| Leading and measure | UI size + 8 px; reading 1.7–1.9; 20–40 glyphs | By role and surface |
| Han–Latin spacing | `text-autospace`, or typed spaces | CSS when strings come from `Intl` or from users; typed spaces only if the content team already writes them consistently |
| Punctuation | quotation-mark style, range mark, ellipsis in UI strings | One each |
| Form of address | 你 or 您 | Tools 你; formal services often 您 |
| Glossary and formats | I18N-17 terms; I18N-19 patterns | Record once |

### CJK font licences

Licence facts as recorded in the research (2026-10); recheck before shipping a file.

| Family | Licence | Web use |
|---|---|---|
| PingFang SC, TC, HK | Bundled with Apple systems; no redistribution offered (clause not re-verified) | Local name only (I18N-03) |
| Hiragino Sans GB | Bundled with macOS (not re-verified) | Local fallback only |
| Microsoft YaHei, YaHei UI | © Microsoft and Beijing Founder; web licensing only through Monotype; Light, Regular and Bold only | Local name only (I18N-03) |
| Microsoft JhengHei | Windows system font; licence not checked **[unverified]** | Local name only, as a precaution |
| Noto Sans CJK, Noto Serif CJK (Noto Sans SC, TC, HK and others) | SIL OFL 1.1, no Reserved Font Name | Self-host or use a hosted service; subsetting allowed |
| Source Han Sans, Source Han Serif | SIL OFL 1.1 with the Reserved Font Name "Source" | Modified or subset copies must not carry the name; prefer Noto CJK when you subset |
| HarmonyOS Sans | Royalty-free and revocable; no modification or stand-alone redistribution; prominent notice required (read from a mirror; confirm with Huawei's download) | Subsetting may count as modification: legal check first |
| MiSans | Royalty-free and revocable; no adaptation or stand-alone redistribution; the product must state that it uses MiSans | Same caveat as HarmonyOS Sans |

A full CJK face is far larger than a Latin one. Serve sliced `unicode-range` subsets, as hosted Noto CJK does, or rely on system families.

## 4. How to fix common failures

Fix at the narrowest correct layer: token, shared component or local style (FRAMEWORK §10). Most CJK failures are token-level: a missing `:lang()` override.

| Failure | Narrowest correct fix | Verify |
|---|---|---|
| `system-ui`, or no CJK family, as the content face (I18N-01) | Font token at the root, ordered as I18N-01 | `uie lint`; `uie audit --checks census` |
| SC families on a zh-TW page (I18N-02) | `:lang(zh-TW)` override of the font token | `uie audit --checks census` on that route |
| Self-hosted PingFang or YaHei (I18N-03) | Delete the `@font-face` and file; local name | `uie lint` |
| 400/500 hierarchy invisible on Windows (I18N-04) | Emphasis weight token 600 under `:lang(zh)` | `uie audit --checks census` |
| Chinese paragraphs at line-height 1.2 (TYP-03, I18N-05) | Leading tokens under `:lang()` | `uie audit --checks census,layout` |
| 70-glyph lines (TYP-04, I18N-06) | Prose container width in whole ems | `uie audit --checks layout` |
| Negative letter-spacing on Chinese (TYP-08, I18N-07) | Tracking tokens set to 0 under `:lang()` | `uie audit --checks census` |
| Fake italic Chinese (I18N-08) | `em` style and `font-synthesis-style: none` under `:lang(zh)` | `uie audit --checks census` |
| `lang="en"` on Chinese content (A11Y-16, I18N-13) | Root layout sets `lang` from the locale | `uie audit` lang audit |
| Half-width punctuation in Chinese sentences (I18N-09) | Catalogue strings | String review, screenshots |
| A comma starts a line (I18N-10) | Remove `line-break: anywhere`, `break-all` or manual `<br>` | Screenshots at every width |
| Uneven Han–Latin gaps (I18N-11) | One approach; `text-autospace` at the root | String review, screenshots |
| Mixed 你 and 您, or 登陆 and 帐号 (I18N-16, I18N-17) | Catalogue, then glossary | Copy review |
| Enter submits half-composed text (I18N-14) | Guard in the shared input or hotkey utility | `uie lint`; manual Pinyin test |
| Dates show as 2026/10/1 (I18N-19) | Pattern in the shared format helper | Formatter unit test |

After each fix, rerun the originating check and `uie diff <base> <run> --findings` to confirm that nothing new appeared.

## 5. Japanese, Korean and other locales

Japanese (W3C jlreq) and Korean (W3C klreq) layout requirements were outside the research, so treat this section as pointers and check those documents before relying on it.

- The principles carry over: tag `ja` and `ko` (I18N-13), declare regional families (I18N-01 and I18N-02 apply by analogy, because Han unification gives Japanese its own glyph forms), guard IME input (I18N-14) and never fake italics (I18N-08). Tailwind's `system-ui` failure appeared on Windows set to a Japanese locale.
- Japanese emphasis dots go over horizontal text. `line-break: strict` restricts breaks before small kana and iteration marks; jlreq defines the full rules.
- Korean separates words with spaces. `word-break: keep-all` keeps Korean words whole; check narrow containers for overflow.
- Weights and fonts: check which weights the Japanese and Korean system fonts ship before relying on 500 **[unverified]**.
- Material 3 groups CJK among the scripts that need about 7% more line height than Latin [PLAT-021].
- Vertical writing is out of scope. If used, WCAG reflow is tested at a 256 CSS px height, and the inline exception of target size measures across the text [08 §A9].
- Right-to-left mirroring is outside this file [PLAT-138]. Conventions here are mostly Chinese and Western; other locales need local review (FRAMEWORK §16).

## Sources

Research adopt items: [PLAT-011, PLAT-013, PLAT-014, PLAT-015, PLAT-017, PLAT-021, PLAT-122, PLAT-125, PLAT-130, PLAT-131, PLAT-132, PLAT-133, PLAT-134, PLAT-135, PLAT-136, PLAT-137, PLAT-138, TOOL-19, TOOL-20, IMP-048, DSL-054, CRAFT-061]. Conflict rulings: research note 05 C14 to C20. Research context: note 05 §2.11–§2.16 and open question 12; note 08 §A9.

External references (checked 2026-10):
- W3C, Requirements for Chinese Text Layout (clreq), Group Note Draft 2026-09-01, and issue #430 — https://www.w3.org/TR/clreq/, https://github.com/w3c/clreq/issues/430
- W3C, Requirements for Japanese Text Layout (jlreq) and for Hangul Text Layout and Typography (klreq) — https://www.w3.org/TR/jlreq/, https://www.w3.org/TR/klreq/
- W3C Internationalization, "Choosing a language tag" — https://www.w3.org/International/questions/qa-choosing-language-tags
- CSS Text Level 4 (`text-autospace`) — https://drafts.csswg.org/css-text-4/
- MDN: `text-autospace`, `text-spacing-trim`, `text-emphasis-position`, `font-synthesis-style`, `line-break`, `word-break`, `keydown` event — https://developer.mozilla.org/
- WCAG 2.2 Understanding 1.4.8 Visual Presentation — https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html
- Tailwind CSS PR #20318 (merged 2026-07-14) — https://github.com/tailwindlabs/tailwindcss/pull/20318
- Ant Design specifications: font, copywriting, data format (MIT) — https://ant.design/docs/spec/copywriting-cn
- TDesign (MIT) — https://github.com/Tencent/tdesign · Arco Design (MIT) — https://github.com/arco-design/arco-doc-site · Semi Design (MIT) — https://github.com/DouyinFE/semi-design
- sparanoid/chinese-copywriting-guidelines (MIT; spacing, punctuation and proper nouns; no word list) — https://github.com/sparanoid/chinese-copywriting-guidelines
- 中华人民共和国广告法 (revised 2015, amended 2018), art. 9 and 11 — http://www.npc.gov.cn/zgrdw/npc//xinwen/2018-11/05/content_2065663.htm
- 市场监管总局《广告绝对化用语执法指南》, announcement 2023 No. 6 — https://www.samr.gov.cn/ggjgs/tzgg/art/2023/art_183b5cb48d9e4f0dba67f9f912a913ba.html
- 光明日报, 汉卿, 互联网"黑话"，为啥被吐槽？ (2022-01-09) — https://finance.sina.com.cn/tech/2022-01-09/doc-ikyamrmz4080034.shtml
- 半月谈评论员 张曦, "对齐颗粒度"？"黑话"太多干扰职场生态 (2024-02-05), via 中国网 — http://www.china.com.cn/opinion2020/2024-02/05/content_116986694.shtml
- Font licences: notofonts/noto-cjk; adobe-fonts/source-han-sans; Microsoft YaHei font page; Apple fonts licence — https://github.com/notofonts/noto-cjk, https://github.com/adobe-fonts/source-han-sans, https://learn.microsoft.com/en-us/typography/font-list/microsoft-yahei, https://developer.apple.com/fonts/

Licences: Ant Design, TDesign, Arco, Semi and sparanoid ideas are re-expressed under MIT; W3C documents and GB/T 15834 (through clreq) are cited, not copied. The two commentaries are cited for the terms they name; no text is reproduced. Chinese laws and official guides are cited.
