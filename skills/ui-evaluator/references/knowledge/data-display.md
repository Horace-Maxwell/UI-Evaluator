# Data display

This file covers tables, numbers, dates and times, charts, dashboards, and how current a data view says it is. It owns the advisory rules DAT-01 onward; rules that other files already own and that apply to data views (numeric alignment, density, row actions, loading, empty and error states, colour-vision checks) are listed in §2.1 and linked, not restated. Findings that cite DAT rules are verified and blind-rated like any judged finding and count toward G5; the gate criteria involved belong to G2, G3 and G4. Read this file in `build` before making any data view, in `direct` when choosing data colours and formats, and in `audit` when a route shows data.

**How solid this is.** The research base covers data display thinly [07 §5.3; 05 §1]. Numeric alignment, tabular figures, locale formats, data states, the dashboard data-fusion principles and a few chart tells are sourced. Rules on chart baselines, dual axes and direct labelling come from general data-visualisation practice that this project has not yet researched: they carry `status: calibrating`, their claims are marked [unverified], and a finding that rests on them should say plainly what the reader would misread.

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules)
   - [2.1 Rules owned elsewhere that apply to data views](#21-rules-owned-elsewhere-that-apply-to-data-views)
   - [2.2 Tables: DAT-01 to DAT-05](#22-tables-dat-01-to-dat-05)
   - [2.3 Numbers, dates and times: DAT-06 to DAT-10](#23-numbers-dates-and-times-dat-06-to-dat-10)
   - [2.4 Charts: DAT-11 to DAT-14](#24-charts-dat-11-to-dat-14)
   - [2.5 Dashboards: DAT-15 to DAT-17](#25-dashboards-dat-15-to-dat-17)
   - [2.6 Freshness: DAT-18](#26-freshness-dat-18)
3. [Decisions to make (for direct/build)](#3-decisions-to-make-for-directbuild)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles

1. **Data views exist for comparing and deciding.** Aligned digits, consistent precision and comparisons computed for the reader serve that; decoration does not [06 §2.A.9].
2. **Every number is honest.** It is real data or a visibly labelled sample: no invented metrics, no precision the data does not have, no simulated liveness (FRAMEWORK P12; SLP-11, SLP-12).
3. **Colour is never the only encoding.** Series, status and direction of change always carry a second cue (A11Y-19) [HCI-068].
4. **Formats follow the locale and stay consistent.** One format per data type within a view, produced by one formatter [DSL-054].
5. **Density is a decision.** Operate surfaces may be dense when they are well ordered; density stays constant within a page (LAY-11).
6. **A data view tells the truth about its state.** Loading, empty, error, partial and stale are designed states, not accidents (CMP-05) [PLAT-096].
7. **A chart's proportions match its numbers.** Scale choices and decoration must not change what the data says [unverified as a research finding].

## 2. Rules

All DAT rules are advisory (`level: advisory`): they raise findings for verification and rating but cannot fail a gate on their own. Most have no deterministic detector yet; the **Check** line says what an evaluator, the accessibility auditor or the code reviewer inspects.

### 2.1 Rules owned elsewhere that apply to data views

| Concern | Rule | What it means for data views | Owner |
|---|---|---|---|
| Data states exist | CMP-05 (gate G3) | every table, chart and dashboard card in scope has loading, empty and error states | [components-states.md](components-states.md) |
| Response and wait feedback | CMP-04 (gate G3), CMP-10 | sorting, filtering, paging and refreshing acknowledge within CMP-04; long loads follow CMP-10 | [components-states.md](components-states.md) |
| Skeletons | CMP-11 | table and card skeletons mirror the loaded geometry | [components-states.md](components-states.md) |
| Empty states | CMP-14 | an empty table or chart is replaced by an empty state, never left as bare headers or bare axes | [components-states.md](components-states.md) |
| Long and odd content | CMP-22 | 1,000+ rows, long names and empty values are part of the fixture set | [components-states.md](components-states.md) |
| Numeric alignment and figures | TYP-14 | tabular figures; numeric columns right-aligned with equal decimals | [typography.md](typography.md) |
| Row density | LAY-11 | one row density per page, changed by a user setting; compact rows keep targets at A11Y-10 and CMP-06 | [layout.md](layout.md) |
| Row actions | COL-09, CMP-16 | no accent-filled primary buttons inside table rows | [color.md](color.md), [components-states.md](components-states.md) |
| Data colours | COL-05, COL-10, COL-15 | data-scale tokens; semantic hues only where they carry meaning; data colours differ in lightness, not only hue | [color.md](color.md) |
| Colour-only meaning | A11Y-19 (gate G2) | series and status stay distinguishable under colour-vision-deficiency emulation | [accessibility.md](accessibility.md) |
| Overflow and reflow | FUN-05 (gate G1), A11Y-07 (gate G2) | a data table may scroll in two dimensions inside its own region when it is declared as a 2-D region; the page itself may not overflow | [layout.md](layout.md), [accessibility.md](accessibility.md) |
| Leaked values | CPY-01 (gate G3) | `null`, `undefined` and `NaN` in cells fail it | [content-copy.md](content-copy.md) |
| Fabricated or decorative numbers | SLP-01, SLP-11, SLP-12 (gate G4); SLP-30, SLP-59 | gradient-text figures, count-up numbers, figures absent from the facts section; the hero-metric template; the dashboard-card mosaic | [anti-slop.md](anti-slop.md) |
| Interactive data grids | A11Y-25 | a grid whose cells hold controls follows the grid keyboard model | [accessibility.md](accessibility.md) |
| zh-CN formats and masking | I18N-19 | dates, times, relative time, currency, grouping, 万 and 亿, week start, personal-data masking | [cjk.md](cjk.md) |

### 2.2 Tables: DAT-01 to DAT-05

### DAT-01 · Units and currency live in the header
`level: advisory` · `modes: all` · `status: active` · `verify: A (inventory of headers and cells)`

**Rule.** When every value in a column shares a unit or currency, the column header states it once, for example "Weight (kg)", and the cells hold the numbers. A column that mixes units either converts to one unit or labels every cell.

**Why.** A number without its unit cannot be read (H2), and a unit repeated in every cell adds noise and breaks alignment. Ant Design puts units in table headers, and Arco states a unit shared by a range only once [05 §2.11, §2.13].

**Check.** Inventory column headers and cells: quantity columns with no unit anywhere, units repeated in every cell, mixed units in one column.

**Fix.** Add the unit to the header label in the table definition, and format cells through the shared formatter (DAT-06).

**Exceptions.** One-card-per-record layouts on narrow screens, where no header is visible: keep the unit with each value.

**Sources.** Ant Design data-format and Arco style specifications (05 §2.11, §2.13); H2.

### DAT-02 · Headers stay in view, and wide tables scroll inside their own region
`level: advisory` · `modes: all` · `status: calibrating` · `verify: I (uie probe: scroll, then Tab)`

**Rule.** In a table taller than the viewport, the column headers stay visible while the rows scroll. A table wider than its container scrolls horizontally inside its own region, declared as a 2-D region for FUN-05 and A11Y-07, and keyboard users can scroll it; the column that identifies each row may stay pinned. Sticky headers and pinned columns never cover the focused element (A11Y-05).

**Why.** Without visible headers, people must remember which column is which (H6). Scrolling inside the table keeps the rest of the page in place, and a header that covers the focused row fails WCAG 2.4.11.

**Check.** (probe) Scroll a long table and confirm the headers stay visible; scroll a wide one and confirm the page itself does not overflow; Tab through row controls after scrolling and confirm none is hidden under the header.

**Fix.** In the shared table component: a sticky header row inside the table's scroll container, scroll padding equal to the header height so focused rows clear it, and a pinned first column where rows are identified by it.

**Exceptions.** Tables short enough to fit the viewport.

**Sources.** H6; A11Y-05; FUN-05; A11Y-07; TOOL-10 (data tables as 2-D content). Sticky headers as a practice are not covered by the research notes [unverified], hence `calibrating`.

### DAT-03 · Sort and filter state is visible, announced and kept
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe); D (ARIA snapshot)`

**Rule.** Sortable columns look sortable. The current sort column and direction show as an icon or text, never colour alone, and are exposed programmatically (`aria-sort` on the column header). Active filters are visible and can be cleared in one action, including from a no-results state. Sort, filter and page state survive opening a row and coming back, and a reload.

**Why.** People need to know why rows appear in this order and what is hidden (H1, H6). Losing filters on Back makes people recall and re-enter them, which is why this state belongs in the URL [DSL-041].

**Check.** (probe) Sort each sortable column: the indicator changes, `aria-sort` updates in the ARIA snapshot and focus stays on the header. Apply a filter, open a row, go Back, then reload: the state holds. Filter down to no results: the empty state names the active filters and offers to clear them (its anatomy is CMP-14).

**Fix.** Sort state in the shared column-header component; filter, sort and page state in the URL query.

**Exceptions.** None.

**Sources.** H1, H6; DSL-041; CMP-14; WAI-ARIA Authoring Practices sortable-table example (outside the research notes).

### DAT-04 · Truncation never hides the only copy of a value
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe); D`

**Rule.** A truncated cell keeps its full value reachable by keyboard and touch, through an expandable row, a detail view, or a focusable control whose accessible name holds the full text; never by hover alone. Identifiers whose start and end both matter, such as file names and order references, truncate in the middle. Numbers are never truncated: reformat them (DAT-07) or widen the column.

**Why.** Hover-only content is out of reach on touch screens and for keyboard users [PLAT-041]. A clipped number states a different value, which is worse than showing none (derived).

**Check.** (probe) For each truncated cell, reach the full value without hovering. Look for ellipses or clipped digits in numeric cells; FUN-06 reports clipped text at rest.

**Fix.** A cell component with deliberate overflow handling (`min-width: 0` in flex and grid children, as CMP-22 asks) and a detail affordance.

**Exceptions.** Text shown in full elsewhere on the same screen.

**Sources.** PLAT-041; DSL-054; Apple HIG lists and tables (middle truncation, 05 §2.1); ui-craft detector rule for tables without overflow handling (02 §2.6); FUN-06; CMP-22.

### DAT-05 · Tabular data is marked up as a table
`level: advisory` · `modes: all` · `status: active` · `verify: A (ARIA snapshot against the capture); D (uie audit, axe rules)`

**Rule.** Data in rows and columns uses table semantics: a native table, or a grid role when cells are interactive (with the grid keyboard model of A11Y-25), with header cells associated with their data cells and a caption or accessible name. Tables are not used for layout, and data tables are not drawn with generic containers.

**Why.** Screen-reader users move through a table by its headers; without semantics a table becomes a stream of unrelated values (WCAG 1.3.1). Automated table rules only examine elements marked up as tables, so a table drawn with generic containers passes them and still fails its users [08 §A3, 1.3.1].

**Check.** Compare each capture with its ARIA snapshot: every visual table appears as a table or grid with column headers. axe's table rules run under A11Y-01.

**Fix.** A native `<table>` with `<th scope>` and a `<caption>` (or `aria-labelledby`) in the shared table component.

**Exceptions.** On narrow screens a table may become one card per record, marked up as a list whose items label each value.

**Sources.** WCAG 2.2 SC 1.3.1; A11Y-01; research note 08 §A3 (coverage of 1.3.1).

### 2.3 Numbers, dates and times: DAT-06 to DAT-10

### DAT-06 · Formats follow the locale, one format per data type in a view
`level: advisory` · `modes: all` · `status: active` · `verify: S (code reviewer); A (capture inventory)`

**Rule.** Numbers, currencies, percentages, dates and times are formatted for the declared locale through the platform's locale formatter (`Intl` on the web), not by hand-built strings. Each data type uses one format throughout a view: one date style, one clock (12- or 24-hour), one decimal and grouping convention.

**Why.** People read numbers through their locale's conventions, and a view that shows two date styles invites misreading (H2, H4). Ant Design and Arco group thousands by default, and Semi asks for one time format per module [05 §2.11, §2.13, §2.14].

**Check.** Inventory the formats in each captured view; the code reviewer looks for hand-concatenated numbers, dates and currency symbols. Where the app supports another locale, switch to it and re-capture.

**Fix.** One shared formatter module keyed by locale and data type, used by every view.

**Exceptions.** Machine-readable values that people copy into other systems, such as ISO timestamps in a developer tool, shown alongside a readable format.

**Sources.** DSL-054; CMP-22 (`Intl` formatting); Ant Design data format, Arco style guideline and Semi content guidelines (05 §2.11, §2.13, §2.14); zh-CN specifics are I18N-19 in [cjk.md](cjk.md) [PLAT-135].

### DAT-07 · Precision and abbreviation fit the decision
`level: advisory` · `modes: all` · `status: active` · `verify: A`

**Rule.** Each number shows the precision the user's decision needs, with the same precision throughout a column or series. Abbreviated values (1.2k, 3.4M) appear only where exactness does not matter for the task, and the exact value stays reachable.

**Why.** Extra decimals add noise and suggest an accuracy the data may not have; abbreviation hides differences that matter for some decisions. The ui-craft finish bar names both, abbreviated versus exact and precision matched to the decision (02 §2.6).

**Check.** For each displayed metric, name the decision it supports and ask whether its precision serves it; look for abbreviated values where small differences matter, such as stock counts or money owed.

**Fix.** Set precision and abbreviation per field in the shared formatter (DAT-06); show the exact value in a detail view or the accessible name.

**Exceptions.** None.

**Sources.** ui-craft finish bar (02 §2.6); TYP-14 (equal decimals within a column).

### DAT-08 · Relative times for recent events, absolute dates for commitments
`level: advisory` · `modes: all` · `status: active` · `verify: A (capture inventory)`

**Rule.** Recent events may show relative times, such as "5 minutes ago". Deadlines, expiry dates, appointments and anything people plan around show absolute dates and times. Wherever a relative time appears, the exact timestamp is reachable without relying on hover.

**Why.** Relative time is quick to read for recency but no help for planning. Primer asks for relative time on recent events and precise dates for deadlines and expiry, and Ant Design and Semi define relative-time steps [05 §2.8, §2.11, §2.14].

**Check.** Inventory time displays: commitments shown only as relative times; relative times with no reachable exact value.

**Fix.** A shared time component that chooses relative or absolute display by field type and exposes the exact value in a detail view or its accessible name.

**Exceptions.** None.

**Sources.** Primer content guidelines; Ant Design data format; Semi content guidelines (05 §2.8, §2.11, §2.14); zh-CN relative-time steps are I18N-19 in [cjk.md](cjk.md) [PLAT-135].

### DAT-09 · Signs and changes carry two cues
`level: advisory` · `modes: all` · `status: active` · `verify: P/A (uie capture colour-vision and greyscale captures)`

**Rule.** Negative values, losses and changes show their direction with a sign, or with an arrow plus a text alternative, and not by colour alone. A coloured negative number keeps its minus sign or the locale's accounting convention. Red against green never carries the direction on its own.

**Why.** Colour-only direction disappears for many people with colour-vision deficiency and in greyscale (A11Y-19, COL-15). The ui-craft finish bar asks for two signals on negatives (02 §2.6) [HCI-068].

**Check.** In the colour-vision and achromatopsia captures, each change, delta and negative value still reads as up or down, positive or negative.

**Fix.** Add the sign, or an arrow icon with a text alternative, in the shared delta component.

**Exceptions.** None.

**Sources.** A11Y-19; COL-15; HCI-068; ui-craft finish bar (02 §2.6).

### DAT-10 · Missing values have one explained placeholder
`level: advisory` · `modes: all` · `status: active` · `verify: D/A (captures with empty-value fixtures)`

**Rule.** An unknown or missing value shows one consistent placeholder, such as an em dash, whose meaning is given in a legend or its accessible name ("no data"). It is never an empty cell, and never a zero that is not a real zero. Leaked `null`, `undefined` and `NaN` already fail CPY-01.

**Why.** An empty cell can also mean "still loading", and a false zero is a wrong value that people will act on. DSL-036 lists the em dash for unknown values and rules out false zeros.

**Check.** Run the empty-value fixtures (CMP-22) and look for empty cells and for zeros where the data is missing.

**Fix.** Handle missing values in the shared formatter with one placeholder and an accessible name.

**Exceptions.** None.

**Sources.** DSL-036; ui-craft finish bar (02 §2.6); CPY-01; CMP-22.

### 2.4 Charts: DAT-11 to DAT-14

### DAT-11 · Series stay distinguishable without colour
`level: advisory` · `modes: all` · `status: active` · `verify: P/A (uie capture colour-vision captures; accessibility auditor)`

**Rule.** Each series or category in a chart can be told apart without colour. Label series directly where space allows; otherwise keep the legend in the order the series appear, and add a second encoding (marker shape, dash pattern, position or label) wherever colour alone would separate them. The categorical palette comes from the product's data-scale tokens (COL-05), its colours differ in lightness as well as hue (COL-15), and data marks reach 3:1 against adjacent colours, the level WCAG 2.2 SC 1.4.11 sets for graphical objects needed to understand content; cite 1.4.11 in such a finding. Sequential scales for quantities change lightness steadily in one direction.

**Why.** Colour-only series collapse under colour-vision deficiency and in greyscale (A11Y-19). Default or rainbow chart palettes show that no data-design decision was made (A-DC5, 07 §2.4.9). TDesign validates its data-visualisation palettes for colour difference (CIEDE2000) and contrast [05 §2.12]. That direct labels beat legends, and that lightness order makes sequential scales readable, are general visualisation practice [unverified].

**Check.** In the colour-vision and achromatopsia captures, each series stays identifiable (TOOL-16). Measure the contrast of lines, bars and points against their background, and compare legend order with series order.

**Fix.** Define data-scale tokens once (categorical and, where needed, sequential) and use them in every chart; add direct labels or markers in the shared chart wrapper rather than chart by chart.

**Exceptions.** A single-series chart needs neither a legend nor a second encoding.

**Sources.** A11Y-19; COL-05; COL-15; TOOL-16; A-DC5 (07 §2.4.9); TDesign colour (05 §2.12); WCAG 2.2 SC 1.4.11.

### DAT-12 · Scales do not distort
`level: advisory` · `modes: all` · `status: calibrating` · `verify: A`

**Rule.** Bar and area charts start their value axis at zero. A line chart may use a narrower range to show change, with the range labelled on the axis, and any break in an axis is drawn visibly. Two value axes with different scales are avoided: use two aligned charts, or index both series to a common base.

**Why.** Bar length and area are read as magnitude, so a truncated axis exaggerates differences. Two value axes invite readers to compare lines whose crossings are produced by the chosen scales. These are long-standing data-visualisation practices that this project's research has not covered yet [unverified; 07 §5.3].

**Check.** Read each chart's axes: the minimum of the value axis on bar and area charts, whether breaks are drawn, and whether a chart has two value axes.

**Fix.** Set axis domains in the shared chart wrapper (zero for bars and areas); split a dual-axis chart into two aligned charts.

**Exceptions.** Quantities without a meaningful zero, such as temperatures in degrees Celsius, belong in a line or dot chart rather than in bars.

**Sources.** General data-visualisation practice outside the research base [unverified], to be confirmed by a dedicated research note (07 §5.3).

### DAT-13 · No decoration on data marks
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit) for the SLP tells; A`

**Rule.** Data marks carry no 3D extrusion, gradient fills, glows, drop shadows or textures that do not encode data. Chart motion never delays reading the values: no count-up numbers unless the value is live, and entrance animation stays within MOT-07.

**Why.** Gradients and glows on marks are decoration standing in for emphasis (A-DC1, A-DC5) and match the gradient-text and glow tells (SLP-01, SLP-08); count-up numbers that are not live data are simulated liveness (SLP-11). Carbon's choreography brings data-visualisation animation in last, after the shell, the content and the primary action [05 §2.4]. That 3D perspective distorts the lengths and areas people compare is general visualisation practice [unverified].

**Check.** Inspect chart styles for gradients, shadows, glows and 3D; run the tell detectors; (probe) load the view and note when the values become readable.

**Fix.** Flat fills from the data-scale tokens; remove count-ups; keep chart entrances within the motion budget.

**Exceptions.** Gradients that encode a quantity, such as the sequential scale of a heat map (DAT-11); COL-11 defers these to this file.

**Sources.** A-DC1, A-DC5 (07 §2.4.9); SLP-01, SLP-08, SLP-11 in [anti-slop.md](anti-slop.md); MOT-07; Carbon choreography (05 §2.4).

### DAT-14 · Every chart has a text summary and a data alternative
`level: advisory` · `modes: all` · `status: active` · `verify: A (accessibility auditor, ARIA snapshot); H (screen-reader check)`

**Rule.** Each chart has a text alternative that states what it shows and its main takeaway, and the values behind it are available as a table, a download or an accessible data view. Axes carry titles with units, and ticks and labels use the formats of DAT-06.

**Why.** A chart without a text alternative fails WCAG 1.1.1, and a name such as "chart" is not equivalent; without a data alternative, exact values are out of reach for screen-reader users and for anyone who needs to copy a number. Whether an alternative is equivalent is an agent judgement [08 §A3, 1.1.1].

**Check.** In the ARIA snapshot, each chart exposes a name that states its subject and takeaway; a data table or download is reachable from the chart; axis titles include units. List the chart for the needs-human screen-reader pass (A11Y-21).

**Fix.** The shared chart wrapper requires a summary and renders a control that shows the data as a table.

**Exceptions.** Decorative graphics that carry no values (rare; see DAT-17).

**Sources.** WCAG 2.2 SC 1.1.1; research note 08 §A3 (coverage of 1.1.1); A11Y-21. The data-table alternative is common accessibility practice that the research notes do not test [unverified].

### 2.5 Dashboards: DAT-15 to DAT-17

### DAT-15 · Dashboards do the comparison for the user
`level: advisory` · `modes: Operate` · `status: active` · `verify: A (heuristic evaluator)`

**Rule.** A dashboard metric that supports a decision shows the comparison the decision needs (against a target, a threshold, the previous period or a peer group) and states its period, so people do not have to remember or calculate it. Low-level values are combined into the higher-level answer the task asks for, with the detail one step away.

**Why.** Gerhardt-Powals' principles ask designs to automate mental arithmetic and comparison, fuse low-level data into summaries, and limit the time spent reading raw data; the research adopts them as the dashboard add-on to Nielsen's set [06 §2.A.9, X7]. A comparison the user must compute becomes a memory and arithmetic task (H6) [HCI-071].

**Check.** For each dashboard metric, name the decision it supports from the top tasks in the context packet, then check whether the comparison and the period are on screen.

**Fix.** Add the comparison value and the period to the metric component, as plain secondary text with a sign (DAT-09) rather than a coloured pill (SLP-41) [DSL-033]; move raw tables behind a drill-down.

**Exceptions.** Monitoring views whose task is spotting any change, where a sparkline of real recent data is the comparison.

**Sources.** Gerhardt-Powals 1996 (via 06 §2.A.9); 06 X7; HCI-071; [heuristics.md](heuristics.md) §2.3.

### DAT-16 · One primary metric per card
`level: advisory` · `modes: Operate` · `status: calibrating` · `verify: A (design critic; heuristic evaluator)`

**Rule.** Each dashboard card answers one question and leads with one primary metric, set larger than its label; the card title names the metric and its period. The workspace is not an equal-weight grid of cards: the layout ranks content by importance, with one focal element per viewport.

**Why.** Cards that carry several unrelated numbers make people hunt for the one that matters, and a mosaic of equal cards replaces layout decisions with containers; it is the tell SLP-59 in [anti-slop.md](anti-slop.md) [DSL-033]. Tognazzini advises setting the data itself larger than its labels [06 §2.A.8].

**Check.** Count primary metrics per card; read card titles for metric and period; in the capture, check whether one element leads each viewport or all cards weigh the same.

**Fix.** Split multi-metric cards; promote the most important card in the layout and demote the rest to secondary text.

**Exceptions.** Comparison cards whose question is the relation between two numbers, such as planned against actual.

**Sources.** DSL-033; SLP-59 (from 07 A-DC3); Tognazzini, Readability (06 §2.A.8). The one-metric rule is a practitioner heuristic [calibrating].

### DAT-17 · No hero-metric template unless the brief asks for it
`level: advisory` · `modes: all` · `status: active` · `verify: S/D (uie lint; uie audit) for the SLP tells; A`

**Rule.** Unless the brief or `DESIGN.md` asks for it, no page uses the hero-metric template: oversized numbers with tiny labels as decoration, a band of headline statistics, gradient-filled figures, count-up animations, or sparklines, progress rings and avatars filling space where content should be. Every number shown is real and recorded in the facts section of `PRODUCT.md`, or visibly labelled as a sample.

**Why.** The template does the counting instead of the product, and its numbers are usually invented (07 §2.4, A-LA5, A-DC1, A-DC2). Its detectable parts are tells in [anti-slop.md](anti-slop.md): the hero-metric template itself (SLP-30), gradient text (SLP-01), count-up numbers (SLP-11) and figures absent from the facts section (SLP-12).

**Check.** Run the tell detectors; compare every displayed figure with the facts section; look for space fillers on marketing and dashboard surfaces. Detection parameters belong to the SLP entries, not to this rule.

**Fix.** Replace the template with the real metric and a worded headline, or with a different section; label sample data as a sample.

**Exceptions.** A dashboard's genuine primary metric, governed by DAT-16. A brief that requests a statistics band with sourced numbers, which is reported as requested (QUALITY-BAR §2.3).

**Sources.** CRAFT-007, CRAFT-027; A-LA5, A-DC1, A-DC2 (07 §2.4); SLP-01, SLP-11, SLP-12 and SLP-30 in [anti-slop.md](anti-slop.md); FRAMEWORK P12.

### 2.6 Freshness: DAT-18

### DAT-18 · Stale, partial and live data are labelled
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe with state recipes); A`

**Rule.** A data view says how current it is, with a last-updated time or a live indicator tied to real updates. Partial results are marked as partial, for example when one source failed to load, and stale or incomplete data is never presented as complete and current. When a refresh fails, the old data stays visible with a statement that it could not be updated and a way to retry.

**Why.** People act on what the view shows, and stale numbers shown as current lead to wrong decisions (H1). Primer asks products to state plainly when something is wrong and to render what still works [PLAT-096]; partial, offline and stale states belong to a data view's state set [DSL-036].

**Check.** (probe) With state recipes, make one source fail and make a refresh fail; check the labels, the retained data and the retry. A "live" indicator must match real updates; otherwise it is SLP-11.

**Fix.** Freshness and partial-result slots in the shared data-view component; the failed-refresh message routed through the notification rules of CMP-13.

**Exceptions.** Static reference data with no meaningful update time.

**Sources.** PLAT-096; DSL-036; CMP-13; SLP-11.

## 3. Decisions to make (for direct/build)

Record these in `DESIGN.md`, next to the type and colour tokens they depend on:
- **Formats.** The shared formatter per data type and locale (DAT-06), precision and abbreviation per field (DAT-07), relative or absolute time per field (DAT-08), the missing-value placeholder (DAT-10), and the data type role with tabular figures (TYP-14).
- **Tables.** Row density and whether users can switch it (LAY-11), sticky headers and pinned columns (DAT-02), sortable and filterable columns (DAT-03), and the width below which rows become cards (DAT-05).
- **Data colours.** Categorical and sequential data-scale tokens (COL-05, DAT-11), checked in the colour-vision captures (COL-15).
- **Chart forms.** For each chart, the question it answers and why its form fits. The research gives no chart-choice rules; the common pairings (bars for comparing categories, lines for change over time) are general practice [unverified].
- **Dashboard questions.** The questions each dashboard answers, the comparison each metric needs (DAT-15) and the focal element of each viewport (DAT-16).
- **Freshness.** How often data updates, what "live" means in this product, and how staleness is shown (DAT-18).

Two contrasting illustrations, each fitting a different brief:
- *A logistics dashboard (Operate).* Dispatchers scan hundreds of shipments all day, so rows are compact with a comfortable toggle, headers stick, and the shipment-ID column is pinned. Arrival times are absolute and use the 24-hour clock, because they are commitments. One focal panel lists late shipments, and each metric shows its gap from the delivery promise.
- *A language-learning flashcard app (progress screen).* Learners check in briefly, so rows are comfortable, the last review shows as a relative time and the next scheduled review as a date. One progress chart has direct labels and two series at most, and the screen shows no statistics band, because the learner's own numbers are the only real ones.

## 4. How to fix common failures

Fix one finding at a time at the narrowest correct layer, usually the shared table, formatter or chart wrapper, then re-run the check that raised it (FRAMEWORK §10).

| Failure | Narrowest correct fix | Verify |
|---|---|---|
| Numbers wobble or misalign in a column | data role token with tabular figures; numeric cell variant (TYP-14) | re-capture; TYP-14 check |
| A unit repeated in every cell | unit in the header label; values through the formatter (DAT-01) | capture |
| Headers scroll out of view | sticky header in the shared table (DAT-02) | `uie probe`: scroll, then Tab |
| Sort state invisible to assistive technology | `aria-sort` in the column-header component (DAT-03) | ARIA snapshot |
| Filters lost on Back | filter, sort and page state in the URL (DAT-03) | probe: open a row, go Back |
| Truncated values out of reach | a detail affordance in the cell component (DAT-04) | probe without hover |
| A table drawn with generic containers | native table in the shared component (DAT-05) | ARIA snapshot against the capture |
| Mixed date styles in one view | one shared formatter (DAT-06) | capture inventory |
| Colour-only gains and losses | sign or arrow in the delta component (DAT-09) | colour-vision captures |
| Empty cells or false zeros | placeholder in the formatter (DAT-10) | empty-value fixture |
| Series told apart by colour only | direct labels or markers in the chart wrapper; data-scale tokens (DAT-11) | colour-vision captures |
| A bar chart's axis starting above zero | zero domain in the chart wrapper (DAT-12) | read the axes |
| Gradient or 3D chart marks | flat fills from the data-scale tokens (DAT-13) | `uie lint`; capture |
| A chart with no text alternative | required summary and a data-table view (DAT-14) | ARIA snapshot |
| A statistics band with unsourced numbers | remove it, or source each number in the facts section (DAT-17) | facts-file comparison; SLP-12 |
| Stale data shown as current | freshness slot and failed-refresh message (DAT-18) | probe a failed refresh |

## 5. CJK and localisation notes

- zh-CN date, time, relative-time, currency, grouping and week-start conventions and the masking of personal data are I18N-19 in [cjk.md](cjk.md) [PLAT-135, PLAT-137]. Apply them through the shared formatter (DAT-06), never view by view.
- I18N-19 writes very large amounts with 万 and 亿. Where a decision needs the exact figure, treat this like abbreviation under DAT-07 and keep the exact value reachable.
- Numbers stay attached to their units, percent signs and currency symbols across line breaks; the line-breaking rules are in [cjk.md](cjk.md).
- In right-to-left locales the digits inside a number are never reversed, even where the layout mirrors [PLAT-138]. Whether chart time axes should mirror is not covered by the research [unverified].
- The conventions here are mostly Western and Chinese; other locales need local review (FRAMEWORK §16).

## Sources

**Research adopt IDs.** PLAT-041, PLAT-096, PLAT-135, PLAT-137, PLAT-138; DSL-033, DSL-036, DSL-041, DSL-054; CRAFT-007, CRAFT-027; HCI-068, HCI-071; TOOL-10, TOOL-16. Rules owned by other knowledge files and applied here: TYP-14, LAY-11, COL-05, COL-09, COL-10, COL-11, COL-15, CMP-04, CMP-05, CMP-10, CMP-11, CMP-13, CMP-14, CMP-16, CMP-22, CPY-01, MOT-07, A11Y-05, A11Y-07, A11Y-19, A11Y-21, A11Y-25, FUN-05, FUN-06, I18N-19, SLP-01, SLP-08, SLP-11, SLP-12, SLP-30, SLP-41, SLP-59. Research notes: 07 §2.4.3 (A-LA5), §2.4.9 (A-DC1 to A-DC5), §5.3 (data-visualisation gap); 05 §1 (data-visualisation palettes out of scope), §2.1, §2.4, §2.8, §2.11 to §2.14; 06 §2.A.8, §2.A.9, §3.2 X7; 02 §2.2 and §2.6 (Vercel guidelines, ui-craft finish bar and detector); 08 §A3.

**External sources** (paraphrased):
- Ant Design specifications: data format, alignment and font. https://ant.design/docs/spec/data-format-cn
- TDesign guideline sources (Tencent/tdesign), colour and data-visualisation palettes. https://github.com/Tencent/tdesign
- Arco Design specification (arco-design/arco-doc-site). https://github.com/arco-design/arco-doc-site
- Semi Design content guidelines (DouyinFE/semi-design). https://github.com/DouyinFE/semi-design
- Primer UI patterns and content guidelines. https://primer.style/product/ui-patterns/
- IBM Carbon motion choreography. https://carbondesignsystem.com/elements/motion/choreography/
- Apple Human Interface Guidelines, Lists and tables. https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
- Gerhardt-Powals, *Cognitive engineering principles for enhancing human–computer performance*, IJHCI 8(2), 1996.
- Tognazzini, *First Principles of Interaction Design*. https://asktog.com/atc/principles-of-interaction-design/
- W3C, WCAG 2.2: SC 1.1.1, 1.3.1, 1.4.11, 2.4.11. https://www.w3.org/TR/WCAG22/
- W3C WAI-ARIA Authoring Practices, sortable table example (outside the research notes). https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/
