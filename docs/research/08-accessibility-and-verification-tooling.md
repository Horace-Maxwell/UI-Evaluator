# 08 — Accessibility standards and the objective verification toolchain

- **Date:** 2026-10-01
- **Author:** research agent (Claude Code), for the UI-Evaluator project
- **ID prefix for adopt items:** `TOOL-`
- **Status:** COMPLETE (research pass 1). Items marked **[unverified]**, **[heuristic]** or **[proposal]** need follow-up.

## 1. Scope and method

**Scope.**
- Part A: accessibility standards — WCAG 2.2 A/AA with automation coverage; APCA/WCAG 3 status; ARIA APG; keyboard and focus; media preferences and CVD; target sizes; screen-reader semantics; forms; CJK/i18n.
- Part B: the local, Node-first verification toolchain an agent can run to turn UI quality into objective gates.
- Out of scope, covered by sibling notes: Nielsen severity and evaluation theory (06), platform/CJK typography (05), visual-craft thresholds (07), AIM metric theory (06).

**Primary sources read in full or in the relevant sections:**
- **WCAG:**
  - WCAG 2.2 TR HTML, downloaded and parsed: SC list, levels, "New" markers, normative text and definitions.
  - Understanding docs for 1.4.12 and 2.4.11.
  - WCAG 3.0 WD (10 Sept 2026, downloaded and searched).
  - W3C news on ISO/IEC 40500:2025.
  - W3C blog on GB/T 37668-2019.
- **ARIA:**
  - APG pattern index, Read Me First, keyboard-interface practice, dialog-modal and menubar patterns.
  - WAI forms tutorial (notifications).
  - TR status lines of ARIA 1.2/1.3, AccName 1.2, MQ5 and CSS Color Adjust.
- **Engines:**
  - axe-core `doc/API.md` and `doc/rule-descriptions.md`.
  - @axe-core/playwright `error-handling.md`.
- **Lighthouse:** `core/config/default-config.js`, v13.0–13.5 release notes, LHCI `docs/configuration.md` and its npm dependency pins.
- **pa11y:** README and npm dependencies.
- **Playwright:**
  - `docs/src/api/params.md`, `class-pageassertions.md`, `test-snapshots-js.md`;
  - release notes 1.44–1.63;
  - `packages/playwright-core/src/server/screenshotter.ts`.
- **Agent browser tools:** READMEs of playwright-mcp (all options and tools), playwright-cli, chrome-devtools-mcp (README and `docs/tool-reference.md`) and agent-browser.
- **Visual regression:** BackstopJS commits and npm tags, Lost Pixel README, reg-cli README.
- **CSS and tokens:**
  - READMEs of Project Wallace css-analyzer, stylelint-declaration-strict-value, @double-great/stylelint-a11y, and the better-tailwindcss `no-restricted-classes` doc.
  - DTCG 2025.10 Format and Color modules (downloaded and searched) and the CG announcement.
  - Style Dictionary release notes.
- **Lint plugins:** eslint-plugin-jsx-a11y repo, issues and peer dependencies.
- **Colour:** apca-w3 README and LICENSE; APCA in a Nutshell; Chrome CVD blog; CDP `browser_protocol.json` Emulation domain.
- **Fonts:** capsize README and metrics README.
- **DOM→source:**
  - React PR #28265 and issue #32574 (all comments); React 19.1.0 release notes;
  - READMEs of bippy, react-grab, code-inspector, vite-plugin-vue-inspector and LocatorJS;
  - Svelte 5.57.1 source `src/internal/client/dev/elements.js`.
- **Performance:** web-vitals CHANGELOG; web.dev Core Web Vitals and threshold articles.
- **AIM:** README, `metrics.json`, `backend/requirements.txt`, `docker-compose.yml`.
- **Automation coverage:** GDS 2017 tool audit; Deque 2021 coverage study (vendor).

**Repository and package verification.** Every tool was checked with:
- `npm view <pkg> version time dist-tags license engines dependencies peerDependencies`;
- `gh api repos/<owner>/<repo>` for stars, licence, last push and archived flag;
- release listings where relevant.

All on 2026-10-01. No GitHub code search was used.

**Experiments.** Run on macOS arm64, Node 26.7.0, Playwright 1.63.0 / Chromium 153 (Chrome for Testing build 1243). Location: `…/scratchpad/tooling/`, outside the repo. The fixture page has deliberate defects: tiny adjacent buttons, low contrast, an `outline:none` button, a placeholder-only input, an image without alt, a clickable div, a fixed-height card, a 900 px block, an infinite spinner, red/green chips and a sticky header.
- **E1:** culori 4.0.2 vs colorjs.io 0.7.1 vs apca-w3 0.1.9 contrast. WCAG ratios match. APCA via colorjs.io matches only as `bg.contrast(fg,'APCA')`.
- **E2:** Project Wallace 9.9.3 metrics and `useLocations`. Found no colour normalisation and no spacing aggregate.
- **E3:** axe 4.13.0 default vs `wcag22aa` tags: target-size runs only when requested. IBM engine 4.0.34 run on the same page.
- **E4:** Prototype keyboard focus walk with pixel-diff focus visibility and `elementFromPoint` obscuring check. Found the `outline:none` button (0 px change) and the unreachable clickable div.
- **E5:** `reducedMotion`, `forcedColors`, text-spacing override (clipped card detected) and 320 px reflow (900 px block detected).
- **E6:** CDP `setEmulatedVisionDeficiency` changes screenshot pixels.
- **E7:** code-inspector-plugin transform output (`data-insp-path`).
- **E8:** Svelte 5 dev compile (`add_locations`, `__svelte_meta`).
- **E9:** Lighthouse 13.5.0 accessibility run (score 0.86; target-size enabled by default).
- **E10:** axe passes a Chinese page declared `lang="en"`, and passes a placeholder-only input via `non-empty-placeholder`.

## 2. Part A — Accessibility standards

### A1. Which standard is normative today

- **WCAG 2.2 is the normative target.** The current TR document is the W3C Recommendation edition dated 12 December 2024 (first published October 2023) — https://www.w3.org/TR/WCAG22/ . It was approved as **ISO/IEC 40500:2025** on 21 October 2025; the ISO text equals the October 2023 W3C version — https://www.w3.org/WAI/news/2025-10-21/wcag22-iso .
- **Counting (parsed from the spec HTML, see §1):** WCAG 2.2 has 87 numbered SCs. 4.1.1 Parsing is marked "Obsolete and removed" and has no level. That leaves **31 Level A + 24 Level AA = 55 SCs** for AA conformance, plus 31 AAA.
- **Nine SCs are new in 2.2** (the spec marks each "New"). A/AA: 2.4.11 Focus Not Obscured (Minimum) AA, 2.5.7 Dragging Movements AA, 2.5.8 Target Size (Minimum) AA, 3.2.6 Consistent Help A, 3.3.7 Redundant Entry A, 3.3.8 Accessible Authentication (Minimum) AA. AAA: 2.4.12, 2.4.13 Focus Appearance, 3.3.9.
- **The relative-luminance threshold is 0.04045, not 0.03928.** WCAG fixed it in May 2021 and says the change has no practical effect. Any contrast code we write should use 0.04045 — https://www.w3.org/TR/WCAG22/#dfn-relative-luminance .
- **Regional standards copy older WCAG versions.** China's GB/T 37668-2019 (recommended standard, effective March 2020) references WCAG 2.0 and 2.1 — https://www.w3.org/blog/2020/updated-chinese-accessibility-standard/ . Japan's JIS X 8341-3:2016 matches ISO/IEC 40500:2012, which is WCAG 2.0 — https://waic.jp/knowledge/accessibility/ (secondary source). Passing WCAG 2.2 AA covers both.
- **WCAG 3.0 is still a draft and cannot be a gate.** The latest Working Draft is dated **10 September 2026** — https://www.w3.org/TR/wcag-3.0/ . Its status section calls it a work in progress that may change or be replaced at any time, and says years of work remain. Its text-contrast requirement reads "@@[contrast measure to be determined]". An editor's note says the contrast algorithm is still undecided, and the draft does not mention APCA. The requirements relevant to this note (text appearance/contrast, keyboard and pointer focus appearance, keyboard interface input) are at "Developing" status. Requirements at "Exploratory" status are left out of the WD altogether.
- **Related specs:** WAI-ARIA 1.2 is a Recommendation (6 June 2023). ARIA 1.3 is a Working Draft (4 June 2026). Accessible Name and Description Computation 1.2 is a Working Draft (23 Sept 2026). Media Queries Level 5 (`prefers-reduced-motion`, `prefers-contrast`, `forced-colors`) is a Working Draft. CSS Color Adjustment Level 1 (`forced-color-adjust`) is a Candidate Recommendation Snapshot. Status lines were read from https://www.w3.org/TR/wai-aria-1.3/ , /wai-aria-1.2/ , /accname-1.2/ , /mediaqueries-5/ and /css-color-adjust-1/ .

### A2. How much can automation cover?

- **GOV.UK (2017):** GDS tested tools on a page seeded with 143 failures. The best tool found 41%, and **29% were found by no tool** — https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/ .
- **Deque (2021, vendor study):** over ~2,000 audits, axe-based automated testing covered **57% of issues by volume**. Measured by number of SCs the share is much lower — https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/ .
- **Design consequence for UI-Evaluator:** a clean axe run proves only that the cheap rules pass. Every SC in the table below therefore gets one of four evidence types:
  - (a) an engine rule (axe or IBM);
  - (b) a **scripted dynamic check** we write;
  - (c) an **agent judgment** with attached evidence (screenshot crop + ARIA snapshot + source location);
  - (d) "manual / human-only".

### A3. WCAG 2.2 Level A + AA — what the engines check and what we must add

Engine columns were produced by **enumerating the installed engines, not by reading marketing pages**:
- axe-core 4.13.0: `axe.getRules()` tags, cross-checked with `doc/rule-descriptions.md` — https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
- IBM Equal Access `accessibility-checker-engine` 4.0.34: the `WCAG_2_2` ruleset checkpoints — https://github.com/IBMa/equal-access

Legend:
- **opt-in** = rule is disabled by default in axe-core.
- **exp** = experimental (also off by default).
- IBM rules marked (P) report "potential violation" or "manual" rather than hard fails.

| SC | Lvl | New | axe-core 4.13 rules | IBM ACE rules (examples) | Gap → UI-Evaluator check |
|---|---|---|---|---|---|
| 1.1.1 Non-text Content | A | | image-alt, input-image-alt, object-alt, role-img-alt, svg-img-alt, aria-meter-name, aria-progressbar-name | 23 rules (img_alt_valid, svg_graphics_labelled, img_alt_decorative…) | Whether the alt text is *equivalent* (or correctly decorative) → (c) agent judges the image crop next to its name |
| 1.2.1 Audio/Video-only (Prerec.) | A | | audio-caption (deprecated, off) | media_audio_transcribed | (d) transcript present and accurate |
| 1.2.2 Captions (Prerec.) | A | | video-caption (`<track kind=captions>` present) | caption_track_exists | (d) caption accuracy and sync |
| 1.2.3 Audio Descr. or Media Alt. | A | | — | media_track_available | (d) |
| 1.2.4 Captions (Live) | AA | | — | media_live_captioned | (d) |
| 1.2.5 Audio Description (Prerec.) | AA | | — | media_track_available | (d) |
| 1.3.1 Info and Relationships | A | | aria-hidden-body, aria-required-children/-parent, definition-list, dlitem, list, listitem, td-headers-attr, th-has-data-cells; exp: p-as-heading, table-fake-caption, td-has-header | 41 rules (landmarks, fieldset/legend, table headers, heading misuse) | Visual structure vs semantics (bold text that should be a heading, visual groups with no group role) → (c) agent compares screenshot with ARIA snapshot (headings outline, landmarks, lists, tables) |
| 1.3.2 Meaningful Sequence | A | | — | dir_attribute_valid, text_whitespace_valid | (b) compare DOM/reading order with visual order from bounding boxes; flag CSS `order`, grid placement and absolute-position reorderings |
| 1.3.3 Sensory Characteristics | A | | — | text_sensory_misuse (text heuristic) | (c) scan copy for shape/position/colour-only instructions |
| 1.3.4 Orientation | AA | | css-orientation-lock (exp) | element_orientation_unlocked | (b) render portrait and landscape viewports; no orientation lock |
| 1.3.5 Identify Input Purpose | AA | | autocomplete-valid (validates tokens that are *present*) | input_autocomplete_valid | (b) fields that collect user data (name, email, tel, address…) must *have* a correct `autocomplete` token; axe does not flag missing ones |
| 1.4.1 Use of Color | A | | link-in-text-block | form_font_color, style_color_misuse (P) | (b)+(c) CVD-simulated and forced-colours screenshots; agent checks status, required fields and chart series for non-colour cues |
| 1.4.2 Audio Control | A | | no-autoplay-audio | media_autostart_controllable | — |
| 1.4.3 Contrast (Minimum) | AA | | color-contrast (gradients, images, overlaps → `incomplete`) | text_contrast_sufficient | Gate on 0 violations; pixel-sample the `incomplete` nodes; run in light **and** dark theme and in hover/focus states |
| 1.4.4 Resize Text | AA | | meta-viewport (blocks `user-scalable=no`, `maximum-scale` < 2) | meta_viewport_zoomable, style_viewport_resizable | (b) set root font-size to 200% (and/or zoom); detect clipping/overlap |
| 1.4.5 Images of Text | AA | | — | — | (c) agent flags raster/canvas text (OCR optional) |
| 1.4.10 Reflow | AA | | — | style_viewport_resizable | (b) viewport 320 CSS px: `scrollWidth ≤ clientWidth`, list offenders (validated in experiment E5) |
| 1.4.11 Non-text Contrast | AA | | — | style_highcontrast_visible (P) | (b) ≥ 3:1 between adjacent colours for input borders, icons, focus rings and state indicators (computed styles + pixel sampling) |
| 1.4.12 Text Spacing | AA | | avoid-inline-spacing (only inline `!important` styles) | text_spacing_valid | (b) inject the four spacing overrides; detect clipped or overflowing text (validated in E5) |
| 1.4.13 Content on Hover or Focus | AA | | — | style_hover_persistent | (b) for each tooltip/popover: Esc dismisses it without moving the pointer, pointer can move onto it, it persists |
| 2.1.1 Keyboard | A | | frame-focusable-content, scrollable-region-focusable, server-side-image-map | 13 rules (element_mouseevent_keyboard, script_onclick_misuse, widget_tabbable_*) | (b) Tab walk: reachable set vs clickable set (`onclick`, `cursor:pointer`, roles); then activate each with Enter/Space (validated in E4) |
| 2.1.2 No Keyboard Trap | A | | — | download_keyboard_controllable | (b) Tab walk must wrap within N presses; Esc must exit modal widgets |
| 2.1.4 Character Key Shortcuts | A | | — (accesskeys is best-practice) | — | (b) static scan for `keydown` handlers on bare printable keys; (c) confirm turn-off/remap/focus-only |
| 2.2.1 Timing Adjustable | A | | meta-refresh | meta_refresh_delay | (c) session timeouts, auto-advancing steps |
| 2.2.2 Pause, Stop, Hide | A | | blink, marquee | blink_css_review, marquee_elem_avoid | (b) `document.getAnimations()` with infinite iterations, or carousels auto-advancing > 5 s, without a pause control |
| 2.3.1 Three Flashes | A | | — | — | (d) (flash analysis of video is out of scope; flag any animation > 3 Hz) |
| 2.4.1 Bypass Blocks | A | | bypass | html_skipnav_exists, skip_main_exists | (b) first Tab stop is a skip link that moves focus into `<main>` |
| 2.4.2 Page Titled | A | | document-title (presence only) | page_title_valid | (c) title describes the page and is unique per route |
| 2.4.3 Focus Order | A | | — (tabindex>0 is best-practice) | widget_tabbable_single | (b) Tab order vs visual order (backward jumps); dialogs take focus and return it |
| 2.4.4 Link Purpose (In Context) | A | | link-name, area-alt (non-empty only) | a_text_purpose | (c) generic text ("click here", "了解更多") with no programmatic context |
| 2.4.5 Multiple Ways | AA | | — | — | (c) site level: nav plus search/sitemap |
| 2.4.6 Headings and Labels | AA | | — (empty-heading is best-practice) | heading_content_exists | (c) are headings and labels descriptive? |
| 2.4.7 Focus Visible | AA | | **none** | element_tabbable_visible, style_focus_visible (P) | (b) pixel diff of focused vs unfocused state for every tab stop (E4: an `outline:none` button changed 0 px) |
| 2.4.11 Focus Not Obscured (Min.) | AA | ✔ | **none** | element_tabbable_unobscured | (b) during Tab **and Shift+Tab** walks, sample `elementFromPoint` over the focused rect; any rect with no visible sample point fails (failure F110 is sticky headers/footers; C43 `scroll-padding` fixes it) — https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html |
| 2.5.1 Pointer Gestures | A | | — | — | (c) pinch/swipe/path gestures have single-pointer buttons |
| 2.5.2 Pointer Cancellation | A | | — | — | (b) static scan: actions bound to `mousedown`/`pointerdown`/`touchstart` |
| 2.5.3 Label in Name | A | | label-content-name-mismatch (exp) | input_label_visible, label_name_visible | (b) visible label text ⊆ accessible name (string compare on ARIA snapshot) |
| 2.5.4 Motion Actuation | A | | — | — | (b) static scan for `devicemotion`/`deviceorientation` |
| 2.5.7 Dragging Movements | AA | ✔ | — | draggable_alternative_exists | (c) sortable lists, kanban and sliders have click or keyboard alternatives |
| 2.5.8 Target Size (Min.) | AA | ✔ | **target-size — opt-in** (doc: disabled "until WCAG 2.2 is more widely adopted"); checks `target-size {minSize:24}` + `target-offset {minOffset:24}` | target_spacing_sufficient | Gate on axe target-size with `wcag22aa` tag enabled (E3 confirmed it is skipped otherwise); (c) review the inline exception |
| 3.1.1 Language of Page | A | | html-has-lang, html-lang-valid, html-xml-lang-mismatch | html_lang_exists/valid | (b) detect the content's script/language and compare with `lang` (E10: an all-Chinese page with `lang="en"` passes `html-lang-valid`) |
| 3.1.2 Language of Parts | AA | | valid-lang (validity only) | element_lang_valid | (b) find runs in a different script/language that lack `lang` |
| 3.2.1 On Focus | A | | — | script_focus_blur_review | (b) during the Tab walk, watch for navigation, new windows or modals triggered by focus alone |
| 3.2.2 On Input | A | | — | input_onchange_review, form_submit_button_exists | (b) change selects/radios; watch for unannounced context changes |
| 3.2.3 Consistent Navigation | AA | | — | — | (b) multi-page: same nav landmark link order |
| 3.2.4 Consistent Identification | AA | | — | — | (b) same href/action → same accessible name/icon across pages |
| 3.2.6 Consistent Help | A | ✔ | — | — (IBM metadata labels it "AA"; the spec says A) | (b) multi-page: help mechanisms (contact, chat, FAQ) in the same relative order |
| 3.3.1 Error Identification | A | | — | error_message_exists | (b) submit invalid data: error in text, `aria-invalid`, linked via `aria-describedby`/`aria-errormessage` (Playwright `toHaveAccessibleErrorMessage`) |
| 3.3.2 Labels or Instructions | A | | form-field-multiple-labels (and `label` under 4.1.2) | input_label_visible (P) | (c) **placeholder-only inputs pass axe** (E10: `label` passes "via non-empty-placeholder") but fail visible-label practice; format hints present |
| 3.3.3 Error Suggestion | AA | | — | — | (c) message says how to fix |
| 3.3.4 Error Prevention (L/F/D) | AA | | — | — | (c) review, confirm or undo for legal, financial and destructive submits |
| 3.3.7 Redundant Entry | A | ✔ | — | — | (c) multi-step flows do not re-ask for data (e.g. "billing = shipping") |
| 3.3.8 Accessible Auth. (Min.) | AA | ✔ | — | — | (b) password/OTP fields allow paste (no `preventDefault` on paste), carry `autocomplete="current-password"`/`"one-time-code"`, and no CAPTCHA appears without an alternative |
| 4.1.2 Name, Role, Value | A | | ~29 rules: button-name, link-name, label, select-name, input-button-name, nested-interactive, frame-title, summary-name, aria-* validity/naming… | 30 rules incl. combobox_* | (b) toggle custom widgets and diff the ARIA snapshot (expanded/selected/checked must change) |
| 4.1.3 Status Messages | AA | | — | — | (b) trigger async actions (save, add to cart, search); the message must land in `role=status/alert`/`aria-live` without stealing focus |

**Coverage counts** (computed from `axe.getRules()` tags in the scratchpad):
- axe-core's default-enabled rules carry SC tags for **19 of the 55** A/AA SCs: 1.1.1, 1.2.2, 1.3.1, 1.3.5, 1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.12, 2.1.1, 2.2.1, 2.2.2, 2.4.1, 2.4.2, 2.4.4, 3.1.1, 3.1.2, 3.3.2, 4.1.2. For most of these the rule is a *partial* check.
- Opt-in rules add three more: 2.5.8 (target-size, off by default), 1.3.4 and 2.5.3 (experimental). 1.2.1's audio-caption rule is deprecated.
- The IBM engine adds rules for 2.4.7, 2.4.11, 2.5.7, 1.4.10, 1.4.11, 1.4.12 and 1.4.13. These are **static heuristics**: in experiment E3 it did not flag the sticky-header case or the `outline:none` button. Its value is as a cheap second opinion.
- WCAG 2.2-specific SCs with **no engine coverage at all**: 3.2.6, 3.3.7, 3.3.8 and 4.1.3. These need scripted or agent checks.

### A4. Contrast: WCAG 2.x (normative) vs APCA (advisory)

- **WCAG 2.x thresholds:**
  - Text: 4.5:1.
  - Large-scale text: 3:1. Large-scale means at least 18 pt or 14 pt bold (≈ 24 px / 18.67 px), "or font size that would yield equivalent size for Chinese, Japanese and Korean (CJK) fonts".
  - Non-text UI components and graphical objects (1.4.11): 3:1.
  - Inactive components and logotypes are exempt.
  - Sources: https://www.w3.org/TR/WCAG22/#contrast-minimum , https://www.w3.org/TR/WCAG22/#dfn-large-scale
- **APCA status:**
  - Its author presents it as "the candidate contrast method for the future WCAG 3" — https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html .
  - The W3C draft (Sept 2026) does not name it and leaves the algorithm open (§A1).
  - The library README calls itself *beta* (`apca-w3` 0.1.9; base constants 0.0.98G-4g, unchanged since Feb 2021) — https://github.com/Myndex/apca-w3 .
  - **Treat APCA as an advisory signal only. Never use it as a pass/fail gate.**
- **APCA "Bronze" thresholds (advisory only):**
  - Lc 90: preferred for body text.
  - Lc 75: minimum for body text (≥ 18 px/400 or 24 px/300).
  - Lc 60: other content text.
  - Lc 45: large/bold headlines and fine-detail icons.
  - Lc 30: absolute minimum for any text and large solid icons.
  - Lc 15: non-text that must be discernible.
  - Source: the APCA in a Nutshell page above.
- **APCA licence warning.** `apca-w3`'s licence is not OSI-approved ("Limited W3 License"). It:
  - says patents are pending;
  - limits use to web content for WCAG purposes;
  - forbids changing the constants;
  - claims a right to audit commercial integrations;
  - restricts use of the name "APCA" to compliant, up-to-date implementations;
  - places uses outside the W3 agreement under the "AGPU v3 License" [sic; presumably AGPL-3.0].

  Source: https://github.com/Myndex/apca-w3/blob/master/LICENSE.md . **We should not bundle `apca-w3`.**
  - If we report APCA, compute it with `colorjs.io` (MIT).
  - Label it "APCA-style Lc (advisory)".
- **Experiment E1 results** (`colorjs.io` 0.7.1 vs `apca-w3` 0.1.9):
  - APCA is asymmetric. colorjs.io matches the reference only as `background.contrast(foreground, "APCA")`.
  - Reversed arguments give a different magnitude: `#767676` on white is Lc 71.6 correct, −77.0 reversed.
  - WCAG 2 and APCA can disagree: `#767676`/white passes WCAG AA (4.54:1) but sits below APCA's Lc 75 body-text level.
  - `#fff` on `#0066cc` is 5.57:1 (WCAG) and Lc −82.3 (APCA).

### A5. Target sizes: WCAG vs Apple vs Material

| Source | Requirement | Status |
|---|---|---|
| WCAG 2.5.8 (AA, new in 2.2) | ≥ 24×24 CSS px. Exceptions: **spacing** (a 24 px-diameter circle centred on each undersized target must not intersect another target or circle), equivalent control, inline-in-sentence, user-agent default, essential — https://www.w3.org/TR/WCAG22/#target-size-minimum | Normative |
| WCAG 2.5.5 (AAA) | ≥ 44×44 CSS px (equivalent, inline, UA and essential exceptions) — https://www.w3.org/TR/WCAG22/#target-size-enhanced | Normative (AAA) |
| Apple HIG (current) | **Default** control size 44×44 pt and **minimum** 28×28 pt on iOS/iPadOS/watchOS; macOS 28×28 default / 20×20 minimum; visionOS 60×60 / 28×28; tvOS 66×66 / 56×56; "about 12 points of padding" around bezelled elements — https://developer.apple.com/design/human-interface-guidelines/accessibility (read from the HIG JSON feed) | Platform guidance |
| Android / Material | Touch target "at least 48dp x 48dp", smaller allowed for precise pointer input; Material components (Button, IconButton, ListItem) enforce it — https://developer.android.com/guide/topics/ui/accessibility/apps | Platform guidance |

**Recommendation:**
- **Gate:** fail on WCAG 2.5.8 (24 px plus spacing exception) at every viewport.
- **Warn:** on touch-first viewports (≤ 768 px, or `hasTouch` emulation), warn when primary controls are < 44×44 (Apple default) or < 48×48 (Material).
- **Unit caution [approximation]:** CSS px, iOS pt and Android dp are all density-independent units and are physically similar on phones, but they are not identical.
- **Apple's numbers changed:** the HIG now calls 44×44 the *default* and 28×28 the *minimum*. Older summaries that call 44 pt "the minimum" are out of date.

### A6. Keyboard and focus management (WAI-ARIA APG)

- **APG patterns.** The APG lists 30 patterns — https://www.w3.org/WAI/ARIA/apg/patterns/ : Accordion, Alert, Alert and Message Dialogs, Breadcrumb, Button, Carousel, Checkbox, Combobox, Dialog (Modal), Disclosure, Feed, Grid, Landmarks, Link, Listbox, Menu and Menubar, Menu Button, Meter, Radio Group, Slider, Slider (Multi-Thumb), Spinbutton, Switch, Table, Tabs, Toolbar, Tooltip, Tree View, Treegrid, Window Splitter.
- **"Read Me First" cautions** (https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/):
  - ARIA roles add no keyboard behaviour or styling.
  - Incorrect ARIA misrepresents the UI to AT users.
  - Support varies across browser/AT pairs, and some ARIA features work in no mobile browser.
  - The examples are not production-ready.
  - Agent rule: **prefer native HTML** (`<button>`, `<a href>`, `<dialog>`, `<details>`, `<select>`, `<input type=checkbox>`). Use ARIA only for widgets HTML lacks.
- **Keyboard interface rules** (https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/):
  - Focus must always be visible.
  - When content holding focus is deleted or hidden, move focus somewhere logical.
  - A composite widget (radio group, menu, grid, tabs, listbox, tree) is **one tab stop**; arrow keys move inside it.
  - Two implementation strategies:
    - **roving tabindex** (`tabindex="0"` on the active item, `-1` on the rest, then call `.focus()`);
    - **`aria-activedescendant`** (focus stays on the container; the referenced item must be a descendant or owned/controlled).
  - Disabled items that users must discover (menu items, tabs, toolbar buttons) stay focusable with `aria-disabled="true"`.
  - Avoid shortcut combinations that collide with OS, browser or AT keys (modifier + Tab/Enter/Space/Esc; Meta + single key; Alt + function key; Caps Lock/Insert combos; macOS Control+Option).
- **Modal dialog contract** (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/):
  - Tab/Shift+Tab wrap inside the dialog; Esc closes it.
  - Initial focus depends on content: first focusable, a static element at the top for long content, or the least destructive button for destructive actions.
  - Focus returns to the invoker.
  - Markup: `role=dialog` + `aria-modal=true` + `aria-labelledby` (or `aria-label`).
  - These are directly scriptable checks (see TOOL-08).
- **Forms and errors** (WAI forms tutorial, https://www.w3.org/WAI/tutorials/forms/notifications/):
  - Put the error count in `<title>` and `<h1>`.
  - Show an error summary with `role="alert"` that links to each field.
  - Associate inline errors with `aria-describedby` and mark fields `aria-invalid`.
  - Move focus to the first invalid field.
  - Use polite live regions for typing-time feedback.
  - Never use colour alone.

### A7. User-preference media features and CVD simulation

- **`prefers-reduced-motion`:**
  - Under WCAG it maps to 2.3.3 Animation from Interactions (AAA); at A level, 2.2.2 Pause/Stop/Hide applies.
  - When Reduce Motion is on, Apple HIG asks apps to cut automatic and repeating animation such as zoom, scale and peripheral movement (HIG JSON, above).
  - Test with Playwright's `reducedMotion: 'reduce'` (context option or `page.emulateMedia`).
  - E5 verified that an infinite spinner animation switched to `none` under this emulation.
- **`forced-colors: active`** (Windows High Contrast / Contrast Themes):
  - Emulate with `forcedColors: 'active'` (Playwright ≥ 1.15).
  - In E5 a red "Error" chip's background computed to white under forced colours. Colour-coded meaning disappears, so status must also be carried by text or icon (1.4.1).
  - Authors use `forced-color-adjust` sparingly and system colours (`Canvas`, `CanvasText`, `Highlight`, `ButtonText`) for custom focus rings and borders.
- **`prefers-contrast: more`:** emulate with `contrast: 'more'` (Playwright ≥ 1.51; standalone test options in 1.63) — https://playwright.dev/docs/api/class-page#page-emulate-media .
- **CVD simulation:**
  - Chrome emulates protanopia, deuteranopia, tritanopia, achromatopsia, blurred vision and reduced contrast with SVG colour-matrix filters on Blink's viewport. The matrices come from Machado, Oliveira and Fernandes (2009) — https://developer.chrome.com/blog/cvd .
  - The CDP command is `Emulation.setEmulatedVisionDeficiency` (stable, not experimental) — https://chromedevtools.github.io/devtools-protocol/tot/Emulation/ .
  - **E6 verified it affects Playwright screenshots in headless Chromium:** `#d62728` rendered as rgb(139,124,31) under deuteranopia and rgb(111,111,111) under achromatopsia.
  - `culori`'s `filterDeficiencyProt/Deuter/Trit` use the same paper (source comment in `culori/src/deficiency.js`). Its pipeline gives different numbers (deuteranopia `#d62728` → `#675826`), so pick one simulator per report and say which.

### A8. Screen-reader semantics: what we can verify without a screen reader

- **Accessibility-tree snapshots** expose what AT receives: role, accessible name and state. Playwright offers:
  - `locator.ariaSnapshot()`, `expect(...).toMatchAriaSnapshot()` (YAML);
  - since 1.63, `ariaSnapshotJSON()` with optional `boxes` (bounding boxes) — https://playwright.dev/docs/release-notes .
- **Semantic-regression gate:** diffing snapshots before and after a fix verifies semantics without a real screen reader.
- **Assertions:** `toHaveAccessibleName`, `toHaveAccessibleDescription`, `toHaveRole` and `toHaveAccessibleErrorMessage`.
- **Simulated screen reader:** `@guidepup/virtual-screen-reader` (MIT, 0.33.0, Sept 2026) simulates SR output from the DOM. `@guidepup/guidepup` drives real VoiceOver/NVDA (MIT, 0.35.0) — https://github.com/guidepup/guidepup . A real-SR pass stays a human or optional step.

### A9. CJK and i18n accessibility notes

Typography details are covered in note 05; these items are the accessibility-specific checks.
- **`lang` correctness, not just presence (3.1.1/3.1.2).**
  - axe validates only that `lang` exists and is a valid tag. A Chinese page declared `lang="en"` passes.
  - The tag selects the screen-reader voice and, through Han unification, the regional glyph forms. W3C i18n advises keeping tags short and adding subtags only when they distinguish something; plain `zh` remains acceptable where it was used before — https://www.w3.org/International/questions/qa-choosing-language-tags .
  - For UIs that ship both Simplified and Traditional variants, `zh-Hans`/`zh-CN` vs `zh-Hant`/`zh-TW`/`zh-HK` is the distinction that matters. Use `ja` and `ko` for Japanese and Korean. Mixed-language runs need their own `lang`.
  - Script: compare the dominant Unicode script of the text with the declared `lang`.
- **Large text in CJK.** WCAG's large-scale definition explicitly allows the "equivalent size" for CJK fonts — https://www.w3.org/TR/WCAG22/#dfn-large-scale . A contrast checker that applies the Latin 18 pt/14 pt bold cut-off to CJK is an approximation. Flag CJK text in 18–24 px with 3:1–4.5:1 contrast for review rather than auto-pass.
- **Text spacing (1.4.12).** The SC lets scripts that don't use a property conform without it. Understanding 1.4.12 notes word spacing has no effect on languages without inter-word spaces (e.g. Japanese) — https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html . Our spacing-override script should still apply line-height and paragraph-spacing to CJK.
- **IME composition (the common agent bug).**
  - Chat inputs and "Enter to submit" handlers fire mid-composition for Chinese/Japanese/Korean users.
  - MDN's recommended guard is `if (event.isComposing || event.keyCode === 229) return;`. `compositionstart`/`compositionend` ordering means `isComposing` alone is unreliable at composition boundaries — https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event .
  - Lint/grep rule: any `keydown`/`keypress` Enter handler without this guard → finding.
- **Vertical writing.** For vertical text, 1.4.10 uses a 256 CSS px *height*, and 2.5.8's inline exception measures line-height perpendicular to text flow (spec notes under 1.4.10 and 2.5.8).

## 3. Part B — Verification tooling

All versions, dates and licences below were read from the npm registry (`npm view <pkg> version time dist-tags license engines`) and from the GitHub API (`gh api repos/<o>/<r>`: stars, licence, last push, archived flag) on 2026-10-01.

### B0. Snapshot table

| Tool | Latest (date) | Licence | GitHub (stars, last push) | Node | Verdict |
|---|---|---|---|---|---|
| axe-core | 4.13.0 (2026-08-05) | MPL-2.0 | dequelabs/axe-core 7.6k, 2026-10-01 | any | **Core** |
| @axe-core/playwright | 4.13.0 (2026-08-11) | MPL-2.0 | dequelabs/axe-core-npm 0.7k | — | **Core** |
| IBM accessibility-checker(-engine) | 4.0.34 (2026-09) | Apache-2.0 | IBMa/equal-access 0.8k, 2026-09-28 | — | Optional 2nd engine |
| lighthouse | 13.5.0 (2026-09-18) | Apache-2.0 | GoogleChrome/lighthouse 30.8k | ≥ 22.19 | Optional (perf/a11y score) |
| @lhci/cli | 0.15.1 (2025-06-25) | Apache-2.0 | lighthouse-ci 7.1k, 2026-03 | — | Avoid (pins lighthouse 12.6.1) |
| pa11y / pa11y-ci | 10.0.0 (2026-08-28) / 4.1.1 | **LGPL-3.0** | pa11y 4.6k | ^22.13 ‖ ≥ 24 | Optional, not core |
| playwright / @playwright/test | 1.63.0 (2026-09-04) | Apache-2.0 | microsoft/playwright 97.0k | ≥ 20 | **Core** |
| @playwright/mcp | 0.0.83 (2026-09-28) | Apache-2.0 | playwright-mcp 37.7k | ≥ 18 | Interactive agent use |
| @playwright/cli | 0.1.22 | Apache-2.0 | playwright-cli 13.7k | — | Interactive agent use |
| chrome-devtools-mcp | 1.10.1 (2026-09-23) | Apache-2.0 | ChromeDevTools/chrome-devtools-mcp 52.9k | ^20.19 ‖ ^22.12 ‖ ≥ 23 | Interactive / perf debugging |
| agent-browser | 0.38.2 (2026-10-01) | Apache-2.0 | vercel-labs/agent-browser 43.4k | (engines ≥ 24) | Interactive agent use |
| BackstopJS | 6.3.25 (2024-09-07) | MIT | garris/BackstopJS 7.2k; last code commit 2024-09 | — | Avoid (dormant) |
| Lost Pixel | 3.22.0 (2024-11-14) | MIT | **archived**; team joined Figma | — | Avoid |
| reg-suit / reg-cli | 0.14.5 / 0.18.16 stable (0.19.0-rc3 tagged `latest`) | MIT | reg-suit 1.3k / reg-cli 0.4k, active | ≥ 20 | Optional diff report |
| @projectwallace/css-analyzer | 9.9.3 (2026-07-27) | MIT | 0.4k, active | ≥ 18 | **Core** (static CSS metrics) |
| stylelint | 17.16.0 (2026-10-01) | MIT | 11.5k | ≥ 20.19 | **Core** (when CSS files exist) |
| stylelint-declaration-strict-value | 1.12.1 (2026-08-24) | MIT | 145 | — | **Core** with stylelint |
| style-dictionary | 5.5.5 (2026-09-20) | Apache-2.0 | 4.8k | ≥ 22 | Optional (token build) |
| eslint-plugin-jsx-a11y | 6.10.2 (2024-10-26) | MIT | 3.6k; peer `eslint ≤ 9` | — | Use with ESLint 9, or the fork |
| culori | 4.0.2 (2025-06-27) | MIT | 1.2k | ≥ 16 | **Core** (colour maths) |
| colorjs.io | 0.7.1 (2026-07-24) | MIT | 2.3k | — | Optional (APCA advisory) |
| apca-w3 | 0.1.9 (2022-07-04) | "Limited W3 License" (non-OSI) | 213 | — | **Do not bundle** |
| wcag-contrast | 3.0.0 (2019-11-05) | BSD-2-Clause | 129, last push 2020 | — | Superseded by culori |
| @capsizecss/core / metrics / unpack | 4.1.3 / 4.3.0 / 4.0.1 | MIT | seek-oss/capsize 1.7k | — | Optional (font metrics) |
| web-vitals | 6.2.2 (2026-09-14) | Apache-2.0 | 8.6k | — | **Core** (lab CWV) |
| code-inspector-plugin | 2.0.9 (2026-09) | MIT | zh-lx/code-inspector 3.0k | — | **Core** (DOM→source) |
| bippy / react-grab | 0.7.3 / 0.2.0 | MIT | 1.4k / 7.6k | — | Fallback for React 19 |
| @guidepup/virtual-screen-reader | 0.33.0 (2026-09-20) | MIT | 154 | — | Optional |
| Aalto Interface Metrics (AIM) | no npm; repo last push 2023-06-11 | MIT | aalto-ui/aim 66 | Python 3.7 + Node 16 | Do not depend (see B14) |

### B1. axe-core and @axe-core/playwright

- **Install:**
  ```
  npm i -D @axe-core/playwright playwright
  ```
  `@axe-core/playwright` bundles a pinned `axe-core`.
- **Minimal usage:**
  ```js
  import { AxeBuilder } from '@axe-core/playwright';
  const ctx = await browser.newContext();          // must be a context page
  const page = await ctx.newPage(); await page.goto(url);
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'])  // enables target-size
    .exclude('[data-axe-ignore]')
    .analyze();
  ```
- **Output:** JSON `AxeResults` with four arrays: `violations`, `incomplete` ("needs review"), `passes`, `inapplicable`.
  - Each rule has `id`, `impact` (minor/moderate/serious/critical), `tags` (including `wcagNNN` SC tags) and `helpUrl`.
  - Each node has `target` (CSS selector path, shadow-DOM aware), `html` and `failureSummary`.
  - Each node also has `any/all/none` check data, for example colour-contrast `fgColor`, `bgColor`, `contrastRatio`, `fontSize`, `expectedContrastRatio`. In E3: `#0000ee` on `#222222` = 1.69 vs 4.5:1.
  - Results also carry `testEngine.version`, so reports can name the rule-set version.
  - API reference: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md
- **Gate it enforces:** per-SC automated rules (§A3). Recommended gate:
  - 0 `violations` of impact ≥ serious for A/AA tags;
  - every `incomplete` item routed to a scripted or agent re-check.
- **Runtime:** runs inside the page (any modern browser); no network or service.
- **Gotchas:**
  1. **target-size is off by default.** E3 confirmed it runs only when a `wcag22aa` tag (or the rule id) is requested.
  2. **`AxeBuilder` throws "Please use browser.newContext()"** when given a page from `browser.newPage()`. Since 4.3 it opens a new window to merge frame results; `setLegacyMode()` is a deprecated escape hatch — https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md .
  3. **axe does not test hidden content** ("inactive menus or modal windows"). Open each state first, then re-run.
  4. **Placeholder-only inputs pass.** In E3/E10 an `<input placeholder="Email">` *passed* the `label` rule via the `non-empty-placeholder` check, because placeholder counts toward the accessible name.
  5. **There is no focus-visible, focus-obscured, keyboard-reachability, reflow or text-spacing-override rule.** These must be scripted (E4/E5).
  6. **Licence:** MPL-2.0 is file-level copyleft. Using unmodified axe-core is fine; modified axe source files must remain MPL.

### B2. IBM Equal Access engine (optional second opinion)

- **Install:**
  ```
  npm i -D accessibility-checker
  ```
  This is the Playwright/Puppeteer/Selenium wrapper with `.achecker.yml`. Alternatively use the raw `accessibility-checker-engine` and inject `ace.js`.
- **Minimal usage (raw engine, as in E3):** `page.addScriptTag({content: aceJs})`, then
  ```js
  await new ace.Checker().check(document, ['WCAG_2_2'])
  ```
  Each result has `ruleId`, `value` (e.g. `VIOLATION/FAIL`, `VIOLATION/POTENTIAL`, `RECOMMENDATION/MANUAL`), an XPath `path.dom` and a `message`.
- **Gate:** none by itself. Its value is extra WCAG 2.2 rules axe lacks:
  - 2.4.7 `style_focus_visible`, 2.4.11 `element_tabbable_unobscured`
  - 2.5.7 `draggable_alternative_exists`, 2.5.8 `target_spacing_sufficient`
  - 1.4.10/1.4.12/1.4.13
  - div-with-onclick detection (`element_mouseevent_keyboard`, `aria_eventhandler_role_valid`).
- **What E3 showed:**
  - It flagged the placeholder-only input and the clickable `<div>` (axe flagged neither).
  - It missed the `outline:none` button and the sticky-header obscuring.
- **Gotchas:**
  - Many results are "potential" and need triage.
  - Its WCAG metadata labels 3.2.6 and 3.3.7 "AA"; the spec says A.
  - Its README's sample `.achecker.yml` uses the `IBM_Accessibility` policy, so set `policies: [WCAG_2_2]` explicitly for WCAG-only reporting.
- **Licence:** Apache-2.0 — https://github.com/IBMa/equal-access

### B3. Lighthouse and Lighthouse CI

- **Install:**
  ```
  npm i -D lighthouse
  ```
  Requires Node ≥ 22.19. Use `CHROME_PATH` to point at an installed or Playwright Chromium.
- **Minimal usage:**
  ```
  lighthouse <url> --only-categories=accessibility,performance --output=json --output-path=lhr.json --chrome-flags="--headless=new"
  ```
  The Node API `lighthouse(url, flags, config)` and user flows (navigation/timespan/snapshot modes) are also available.
- **Output:** LHR JSON with `categories.*.score` (0–1) and `audits[id]`.
  - Each audit has `score`, `numericValue` and `details.items[].node` (`selector`, `path`, `boundingRect`, `snippet`, `nodeLabel`, `explanation`). Keys were verified in experiment E9.
- **Gates:**
  - Performance-lab metrics. Score weights in v13 default config: FCP 10, LCP 25, **TBT 30**, CLS 25, SI 10; INP weight 0 because lab runs have no user input.
  - An accessibility *score*: weighted pass/fail over a subset of axe rules. Weights derive from axe impact: critical 10, serious 7, moderate 3, minor 1 for WCAG-tagged rules; experimental rules 0 — https://github.com/GoogleChrome/lighthouse/blob/main/core/config/default-config.js , https://developer.chrome.com/docs/lighthouse/accessibility/scoring .
  - **Unlike raw axe, Lighthouse enables `target-size` (weight 7).** E9 on the fixture: score 0.86 with color-contrast, image-alt and target-size failing.
- **Recent changes:**
  - v13.0 removed many legacy performance audits in favour of "insights", and dropped the SEO `font-size` audit — https://github.com/GoogleChrome/lighthouse/releases/tag/v13.0.0 .
  - v13.2–13.3 added an **"Agentic Browsing" category** (llms.txt, agent accessibility-tree audits), now in the default config — https://github.com/GoogleChrome/lighthouse/releases .
- **Lighthouse CI:**
  - `@lhci/cli` 0.15.1 (June 2025) **pins `lighthouse` 12.6.1**, so it trails v13.
  - Its `upload.target` choices are `lhci` (self-hosted server), `temporary-public-storage` (Google-hosted, public) and `filesystem` — https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md .
  - Assertions are ESLint-style, e.g. `"categories:accessibility": ["error", {"minScore": 1}]`.
- **Verdict:** use `lighthouse` directly from our script with our own thresholds. Skip LHCI.
- **Gotchas:**
  - The a11y score is pass/fail per audit, with no partial credit. One bad button fails the whole `button-name` audit, so a 100 score still is not WCAG conformance.
  - Run it ≥ 3 times and take the median for performance (LHCI's default is 3 runs).

### B4. pa11y / pa11y-ci

- **Install:**
  ```
  npm i -D pa11y
  ```
  Requires an even-numbered Node, either ^22.13 or ≥ 24.
- **Minimal usage:**
  ```
  pa11y <url> --runner axe --runner htmlcs --reporter json --standard WCAG2AA
  ```
- **Output:** `cli`, `csv`, `json`, `tsv`, `html` and `markdown` reporters. Issues carry `code` (e.g. `WCAG2AA.Principle1.Guideline1_1.1_1_1.H30.2`), `type`, `selector` and `context` — https://github.com/pa11y/pa11y .
- **Gate:** the same rule-level checks as axe, plus HTML_CodeSniffer, a different rule set. pa11y 10 depends on `axe-core ~4.13.0`, `@pa11y/html_codesniffer ^2.6.0` (a maintained fork) and `puppeteer ^25.9.0`.
- **Also useful:** `actions` script logged-in or multi-step states.
- **Verdict:** not core.
  - It adds a second browser stack (Puppeteer).
  - LGPL-3.0 is acceptable for an invoked CLI but conflicts with our permissive-licence preference.
  - htmlcs's extra signal overlaps with the IBM engine.

### B5. Playwright — the capture and emulation backbone

- **Install:**
  ```
  npm i -D @playwright/test && npx playwright install chromium
  ```
  Chromium 153 in 1.63. `--no-remove` keeps other installs.
- **Device and preference emulation:**
  - Context options: `viewport`, `deviceScaleFactor`, `isMobile`, `hasTouch`, or `devices['iPhone 15']`.
  - Preference options: `colorScheme`, `reducedMotion`, `forcedColors`, `contrast`.
  - Per-page: `page.emulateMedia({...})`. Version 1.63 added standalone test options `reducedMotion`, `forcedColors` and `contrast` — https://playwright.dev/docs/api/class-page#page-emulate-media , https://playwright.dev/docs/release-notes .
- **Deterministic capture** (verified in docs and source):
  - **Fonts:** before every screenshot Playwright awaits `document.fonts.ready` unless `PW_TEST_SCREENSHOT_NO_FONTS_READY` is set — https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/screenshotter.ts . `document.fonts.ready` covers only fonts already requested. Also wait for an explicit `document.fonts.load('600 16px "Inter"')` for fonts used below the fold or by lazily rendered components.
  - **Animations:** `animations: 'disabled'` fast-forwards finite CSS animations, transitions and Web Animations to completion (firing `transitionend`). Infinite ones are cancelled to their initial state, then resumed. This is the **default for `toHaveScreenshot`**.
  - **Caret:** defaults to `hide`.
  - **Masking and styling:** `mask: Locator[]` + `maskColor` hide dynamic regions. `style`/`stylePath` inject capture-time CSS (e.g. hide timestamps).
  - **Time:** `page.clock.install({ time })` / `pauseAt` freezes time (Clock API since 1.45).
- **Visual assertions:**
  - `await expect(page).toHaveScreenshot('home.png', { fullPage: true, maxDiffPixelRatio: 0.001 })`.
  - It waits until **two consecutive screenshots match**, then compares with the baseline.
  - Comparator: pixelmatch; `threshold` is YIQ distance, default 0.2. `maxDiffPixels`/`maxDiffPixelRatio` are unset by default.
  - Snapshots can be `.webp` (lossless) since 1.62.
  - Baselines are named per browser+platform (e.g. `-chromium-darwin`) because "rendering can vary based on the host OS…". Generate and compare in the same environment, e.g. the official Docker image — https://playwright.dev/docs/test-snapshots .
- **Semantic assertions:** `toMatchAriaSnapshot` (YAML), `ariaSnapshotJSON({ boxes })` (1.63), `toHaveAccessibleName/Description/ErrorMessage` and `toHaveRole`.
- **Gates:**
  - visual regression (before/after diff);
  - breakpoint matrix screenshots;
  - semantic regression (ARIA snapshot diff);
  - every scripted dynamic check (E4–E6).
- **Gotchas:**
  - In Chromium, `forcedColors:'active'` also applies forced-colours *rendering* (E5: an author background computed to Canvas white), not just the media query. Firefox/WebKit behaviour and Windows' real user palettes were not tested [unverified]. Use Chromium as the reference.
  - `page.accessibility` was **removed** in 1.57 after deprecation; use the ARIA snapshot APIs or axe.
  - Experimental CT packages are frozen as of 1.63; component testing moves to "stories".

### B6. Agent-facing browser servers: playwright-mcp, playwright-cli, chrome-devtools-mcp, agent-browser

These are for **interactive** agent exploration. Our gates should run as scripts (deterministic, cheap on tokens). The agent uses one of these to reproduce, inspect and look.

- **microsoft/playwright-mcp** (`npx @playwright/mcp@latest`):
  - **What it is:** an MCP server that works on accessibility-tree snapshots with element refs. Playwright 1.62 also bundles it as `npx playwright mcp`.
  - **Tools:**
    - `browser_snapshot`: with `depth` and `boxes`.
    - `browser_take_screenshot`: png/jpeg/webp, `fullPage`, `scale: css|device`.
    - `browser_emulate_media`: colorScheme, reducedMotion, forcedColors, contrast.
    - `browser_resize`, `browser_evaluate`, `browser_console_messages`, `browser_network_requests`.
  - **Opt-in capability groups:** `--caps=vision|pdf|devtools|network|storage|testing|config`.
  - **`browser_annotate`** (devtools caps) opens a dashboard where a **human draws annotations** and returns the annotated screenshot, ARIA snapshot and annotation list — directly useful for our "ingest real user feedback" step.
  - **Useful flags:** `--isolated`, `--headless`, `--device`, `--viewport-size`, `--snapshot-boxes`, `--allowed-origins`.
  - The README calls itself **not a security boundary**, and steers coding agents to **playwright-cli + skills** as more token-efficient — https://github.com/microsoft/playwright-mcp .
- **microsoft/playwright-cli** (`npm i -g @playwright/cli`):
  - Shell commands: `open`, `snapshot`, `click <ref>`, `screenshot [--hires]`, `resize`, `eval`, sessions.
  - `playwright-cli install --skills` installs agent skills — https://github.com/microsoft/playwright-cli .
- **ChromeDevTools/chrome-devtools-mcp** (`npx -y chrome-devtools-mcp@latest`):
  - **Tools:**
    - `take_snapshot` (a11y tree with uids), `take_screenshot`;
    - `emulate`: colorScheme, CPU throttling, network presets, viewport `WxHxDPR,mobile,touch`;
    - `performance_start_trace`/`stop_trace`/`analyze_insight` (CWV insights);
    - `lighthouse_audit`: a11y/SEO/best-practices/agentic browsing; *excludes performance*; navigation or snapshot mode;
    - **`get_css_styles`:** matched rules, cascade layers, overridden declarations, *with source line numbers* — the best interactive tool for "which CSS rule produced this value".
  - **Privacy defaults to turn off:**
    - Usage statistics go to Google by default (`--no-usage-statistics`; also disabled when `CI` is set).
    - Performance tools may send trace URLs to the CrUX API (`--no-performance-crux`).
  - **Other options:** `--slim` gives a reduced tool set. Officially supports Chrome / Chrome for Testing only — https://github.com/ChromeDevTools/chrome-devtools-mcp , https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md .
- **vercel-labs/agent-browser** (`npm i -g agent-browser && agent-browser install`):
  - **What it is:** a native Rust CLI that downloads Chrome for Testing; no Playwright or Node needed at runtime. npm `engines` says Node ≥ 24, but the README says Node is needed only to build from source.
  - **Relevant commands:**
    - `snapshot` (refs), `screenshot --annotate` (numbered labels matching refs);
    - `diff snapshot`, `diff screenshot --baseline b.png -t 0.2`, `diff url A B --screenshot`;
    - `a11y [--tags wcag2a,wcag2aa] [--json]`: axe-core embedded in the binary; works offline and under CSP; the README example shows 4.12.1;
    - `vitals [--json]`: LCP/CLS/TTFB/FCP/INP;
    - `react tree|inspect` with `--enable react-devtools`;
    - `set viewport|device|media`.
  - Source: https://github.com/vercel-labs/agent-browser
  - **Gotcha:** the embedded axe version lags the npm one, so pin and report it.

Which to recommend: any one of them is fine for the agent's *exploration*. The skill should not require MCP. Our scripts use Playwright directly, and agent-browser or playwright-cli are good optional "eyes" for CLI agents.

### B7. Visual-regression tools

- **Playwright `toHaveScreenshot`:** sufficient for our before/after gate, and we already depend on Playwright.
- **reg-cli** (MIT, active):
  - **Rewrite:** a WASI/WebAssembly diff engine; flags compatible with the classic CLI.
  - **Usage:** `reg-cli actual/ expected/ diff/ -R report.html -J reg.json -M 0.1 -T 0.001`.
  - **Output:** an HTML report and `reg.json`. Useful when the agent needs a **human-viewable side-by-side report** of arbitrary screenshot folders.
  - **Pin `reg-cli@0.18.16`:** the `latest` dist-tag currently points to `0.19.0-rc3` — https://github.com/reg-viz/reg-cli .
  - `reg-suit` adds storage and notification plugins (S3/GCS, GitHub) that we do not need.
- **BackstopJS:** last release 6.3.25 (2024-09); its only 2026 commit is a README edit; it pins Puppeteer ^22 / Playwright ^1.40. Avoid.
- **Lost Pixel:** the repository is **archived**; the README says the team "is joining Figma" and the product is being wound down. Avoid — https://github.com/lost-pixel/lost-pixel .
- **Diff engines for custom use:** `pixelmatch` 7.2.0 (ISC; used by Playwright) with `pngjs` 7.0.0 (MIT) — used in E4; `odiff-bin` 4.5.0 (MIT, fast native).

### B8. CSS analytics for consistency gates

- **@projectwallace/css-analyzer** 9.9.3 (MIT):
  - **API:** `analyze(css, { useLocations: true })`. The README claims 200+ metrics; the package has one dependency (`@projectwallace/css-parser`).
  - **E2 confirmed these groups:**
    - `values.colors` (with `itemsPerContext` by property), `fontFamilies`, `fontSizes`, `lineHeights`, `zindexes`, `textShadows`, `boxShadows`, `borderRadiuses`;
    - `animations.durations`/timing functions, `units`, `keywords`, `displays`;
    - `properties.custom` (custom properties), `selectors` specificity/complexity, `atrules.media`, and more.
  - Each has `total`, `totalUnique`, `unique{value:count}` and `uniquenessRatio`. With `useLocations` it gives `uniqueWithLocations{value:[{line,column,offset,length}]}`, i.e. file:line evidence for stray values.
  - **Gotcha (E2):** values are **not normalised**. `#333`, `#333333` and `rgb(51,51,51)` count as three colours. Normalise with culori (parse → OKLab → cluster at ΔE_OK < 0.02) before computing "distinct colours".
  - **Gotcha (E2):** there is **no spacing aggregate**. margin/padding/gap values are not grouped, so we extract them ourselves.
  - Static CSS analysis also misses runtime-composed styles (CSS-in-JS, Tailwind utility *usage*).
- **Runtime alternative (our own script):** a *computed-style census* over visible DOM elements from Playwright. Record:
  - colour, background-color, border-color;
  - font-size/weight/line-height/family;
  - padding/margin/gap;
  - radius, shadow, z-index, transition-duration.

  Deduplicate (colours in OKLab) and compare with the token set. This measures what users actually see.
- **Older alternatives:** `analyze-css` 2.4.53 (BSD-2, active; performance-oriented offenders); `cssstats` 4.0.5 and `stylestats` 7.0.2 (both last published 2022). Prefer Wallace.

### B9. Token and style linting

- **stylelint 17 + `stylelint-declaration-strict-value`:**
  - The rule `scale-unlimited/declaration-strict-value` forces listed properties to use variables or functions, not literals. Example: `[["/color$/","z-index","font-size","/^(margin|padding|gap)/"], { ignoreValues: ["transparent","inherit","currentColor","0","auto"], ignoreFunctions: false }]`.
  - It also offers `expandShorthand` and autofix hooks — https://github.com/AndyOGo/stylelint-declaration-strict-value . This is the cheapest "no magic numbers" gate for hand-written CSS.
- **Related plugins:**
  - `stylelint-scales` 5.0.0 (MIT): enforce numeric scales for font-size, space, etc. Last release 2024-08.
  - `@double-great/stylelint-a11y` 3.5.4 (MIT, active). Its recommended config enables:
    - `a11y/no-outline-none`, a static 2.4.7 guard;
    - `a11y/media-prefers-reduced-motion`, which requires a reduced-motion override for animations/transitions;
    - `a11y/selector-pseudo-class-focus`, which pairs `:hover` with `:focus`.

    Its strict config adds `font-size-is-readable` and others — https://github.com/double-great/stylelint-a11y .
  - `stylelint-plugin-logical-css` 2.1.0 (MIT): enforce logical properties, which helps RTL and vertical text.
- **Tailwind projects:** CSS lint sees little there. Use `eslint-plugin-better-tailwindcss` 4.7.0 (MIT):
  - `better-tailwindcss/no-restricted-classes` takes regex patterns, and its docs cite banning arbitrary values such as `text-[#fff]`. Pattern `\[.*\]` therefore forbids `text-[13px]`-style magic numbers. It can also autofix to a token class — https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-restricted-classes.md .
  - Siblings: `no-unknown-classes`, `no-conflicting-classes`, `enforce-canonical-classes`.
  - `eslint-plugin-tailwindcss` 4.4.0 (MIT) is the older alternative.
- **W3C Design Tokens (DTCG) format — first stable version 2025.10** (28 Oct 2025):
  - **Modules:** Format, Color, Resolver — https://www.designtokens.org/tr/2025.10/ .
  - **Token properties:** `$value` is required; `$type`, `$description`, `$extensions` and `$deprecated` are optional.
  - **Types:** color, dimension (`{value, unit: px|rem}`), fontFamily, fontWeight, duration, cubicBezier, number.
  - **Composite types:** strokeStyle, border, transition, shadow, gradient, typography.
  - **Aliases:** `"{group.token}"`; JSON Pointer `$ref` support is required.
  - **Files:** extensions `.tokens` / `.tokens.json`; MIME `application/design-tokens+json`.
  - **Colour objects:** `{colorSpace, components, alpha, hex}` across 14 spaces, including `oklch` and `display-p3`.
  - **Status:** a Community Group report, "not a W3C Standard nor … on the W3C Standards Track" — https://www.designtokens.org/TR/2025.10/format/ , https://www.designtokens.org/TR/2025.10/color/ .
- **Style Dictionary 5.x** (Apache-2.0):
  - v5.0 fixed the reference syntax to DTCG `{a.b}`.
  - v5.3.0 added DTCG 2025.10 structured colours (all 14 spaces).
  - v5.4.0 added the DTCG dimension object format — https://github.com/style-dictionary/style-dictionary/releases .
  - **Use:** generate CSS variables plus a JSON "allowed values" list that our consistency gate consumes.

### B10. JSX/template a11y linting

- **eslint-plugin-jsx-a11y 6.10.2** (MIT):
  - Last release 2024-10.
  - `peerDependencies.eslint` stops at `^9`, while ESLint is at **10.11.0**. ESLint-10 support PRs (#1079, #1081) are open — https://github.com/jsx-eslint/eslint-plugin-jsx-a11y .
  - **Options:** run it on ESLint 9, or use the fork `eslint-plugin-jsx-a11y-x` 0.2.0 (MIT, peer `^9 ‖ ^10`) — https://github.com/es-tooling/eslint-plugin-jsx-a11y-x .
- **Other ecosystems:**
  - Vue: `eslint-plugin-vuejs-accessibility` 2.6.0.
  - Svelte: built-in a11y compiler warnings plus `eslint-plugin-svelte` 3.23.0.
  - Angular: `@angular-eslint/eslint-plugin-template` 22.5.0.
  - Plain HTML: `@html-eslint/eslint-plugin` 0.66.1.
- **Rust linters:**
  - **oxlint** (MIT, 1.86.0) ships a `jsx_a11y` plugin (~30 rules, per its rules page [approximate count]) — https://oxc.rs/docs/guide/usage/linter/rules.html .
  - **Biome** 2.5.15 (MIT/Apache) has an `a11y` rule group.
- **Gate:** static source-level checks that catch problems *before* render, such as `alt-text`, `label-has-associated-control` and `click-events-have-key-events`. They complement axe and do not replace it.

### B11. Colour, font and CVD libraries

- **culori 4.0.2** (MIT) — **our colour core**:
  - `wcagContrast`/`wcagLuminance`;
  - OKLab/OKLCH conversion;
  - `differenceEuclidean('oklab')` and `differenceCiede2000()` for near-duplicate detection. E1: `#333` vs `#3a3a3a` → ΔE_OK 0.027, ΔE2000 2.26;
  - `toGamut`/`clampChroma`;
  - `filterDeficiencyProt|Deuter|Trit(severity)` (Machado 2009).
- **colorjs.io 0.7.1** (MIT): CSS Color 4 reference implementation. Its `contrast()` offers WCAG21, APCA, Michelson, Weber, Lstar and DeltaPhi. Use it **only** for the advisory APCA number, with argument order `bg.contrast(fg, 'APCA')` (E1).
- **apca-w3** 0.1.9: reference APCA, but the licence is restrictive (§A4). Do not ship it.
- **wcag-contrast** 3.0.0 (BSD-2): unmaintained since 2019; culori covers it.
- **CVD simulation:**
  - Primary: CDP `Emulation.setEmulatedVisionDeficiency` through `context.newCDPSession(page)`. Chromium only; affects screenshots (E6).
  - Secondary: culori filters for palette-level checks (e.g. "do chart series stay distinguishable at ΔE_OK ≥ x under deuteranopia?").
- **Capsize** (`@capsizecss/core` 4.1.3, `metrics` 4.3.0, `unpack` 4.0.1; MIT):
  - **Metrics:** `capHeight`, `xHeight`, `ascent`, `descent`, `lineGap`, `unitsPerEm` and `xWidthAvg`.
  - **`createFontStack`** emits `@font-face` fallback overrides (`ascent-override`, `size-adjust`, …), which cuts font-swap layout shift (CLS).
  - **`unpack.fromFile`/`fromUrl`** reads metrics from a font file.
  - **Gate use:** x-height ratio as a legibility metric (e.g. warn when body text renders with x-height < ~8 px [heuristic, unverified threshold]), plus fallback-metric checks for CLS.
  - **CJK caveat:** `xWidthAvg` subsets are only `latin` and `thai` — https://github.com/seek-oss/capsize .

### B12. DOM → source mapping (file:line evidence)

**The problem.** React 19 removed JSX `__source`/`__self` and Fiber `_debugSource` (PR #28265, merged 2024-02-07). This broke "click-to-source" tools: react-dev-inspector, LocatorJS, click-to-component, code-inspector, vite-plugin-react-click-to-component, and others listed in issue #32574.
- PR rationale: the compiled location did not survive source maps and only worked for JSX. React instead captures stacks lazily (`new Error()`/`console.createTask()`) and resolves them with ordinary source maps — https://github.com/facebook/react/pull/28265 .
- A React maintainer replied (Sept 2025) that "open component in editor" affordances would ship in React DevTools — https://github.com/facebook/react/issues/32574 .
- React 19.1 (2025-03-28) added Owner Stacks and `captureOwnerStack()`, development builds only — https://github.com/react/react/releases/tag/v19.1.0 .
- The React repository now lives at `github.com/react/react`; `facebook/react` links redirect.

**Approaches:**

| Approach | How | Frameworks | Pros / cons |
|---|---|---|---|
| **Compile-time attribute injection — recommended** | `code-inspector-plugin` 2.0.9 (MIT) for webpack, Vite, Rspack/Rsbuild, Farm, esbuild, Turbopack, Mako | React/Next/Umi, Vue 2/3/Nuxt, Preact, Solid, Qwik, Svelte, Astro | E7: the transform adds `data-insp-path="<abs-or-rel path>:<line>:<col>:<tag>"` to every host element. For a component's root element it forwards the *call-site* path via props. Independent of React internals. Dev-only. Our scripts read it with `el.closest('[data-insp-path]')` — https://github.com/zh-lx/code-inspector |
| React runtime (React 19) | `bippy/source` `getSource(fiber)` / `getOwnerStack(fiber)`: reads the fiber's owner/debug stack and symbolicates via fetched source maps. `react-grab` 0.2.0 builds on it and copies "LoginForm (at components/login-form.tsx:46:19)" context to the clipboard | React (dev builds) | No build change; depends on React internals (bippy warns it "may break production apps") and on reachable source maps — https://github.com/aidenybai/bippy , https://github.com/aidenybai/react-grab |
| LocatorJS | `@locator/babel-jsx` / `@locator/webpack-loader` (adds data ids), or the React DevTools-based runtime | React, Solid, Preact, Svelte | npm packages are MIT (0.5.1, Jan 2026) but the GitHub repo has **no root licence file**. Use Next.js 15+ webpack loader — https://github.com/infi-pc/locatorjs |
| Vue | `vite-plugin-vue-inspector` 7.0.0: records locations from Vue's compiled render output plus Vite source maps; dev-only `data-v-inspector` DOM markers as fallback; Vue 3 + Vite only. Components also carry `__file` in dev | Vue 3 | https://github.com/webfansplz/vite-plugin-vue-inspector |
| Svelte | Built in. Svelte 5 dev builds wrap templates in `$.add_locations(...)` and set `element.__svelte_meta = { parent, loc: { file, line, column } }` (E8, svelte 5.57.1 `src/internal/client/dev/elements.js`) | Svelte | No plugin needed; dev only |
| CSS rule origin | CDP `CSS.getMatchedStylesForNode` (rule ranges + stylesheet URL → source map), or chrome-devtools-mcp `get_css_styles` (line numbers, overridden flags) | any | Maps a bad computed value to the stylesheet rule |
| Fallback | Grep the repo for distinctive text, class names or `data-testid` from the failing node's `html` | any | Heuristic; mark the evidence "inferred" |

### B13. Core Web Vitals (web-vitals) and other runtime metrics

- **Version history:** `web-vitals` 6.2.2 (Apache-2.0). v5.0 removed `onFID` and moved support to Baseline Widely available. v6.0 (2026-07-21) added soft-navigation support and changed `includeProcessedEventEntries` to default false — https://github.com/GoogleChrome/web-vitals/blob/main/CHANGELOG.md .
- **Thresholds (p75):**
  - LCP ≤ 2.5 s good, > 4 s poor.
  - INP ≤ 200 ms good, > 500 ms poor.
  - CLS ≤ 0.1 good, > 0.25 poor.
  - Source: https://web.dev/articles/defining-core-web-vitals-thresholds
- **Lab use:**
  1. Inject `web-vitals/dist/web-vitals.attribution.iife.js` with `page.addInitScript`.
  2. Register `onLCP/onCLS/onINP(cb, {reportAllChanges: true})`.
  3. Drive real interactions with Playwright for INP.
  4. Read the values back. The attribution build adds element selectors (LCP element, CLS shift sources, INP target), which link to DOM→source.
- **Lab limits:** no real users. web.dev says lab "is not a substitute for field measurement", and Lighthouse uses TBT as the lab proxy for INP — https://web.dev/articles/vitals .
- **Gate:** layout stability (CLS < 0.1 during load *and* during scripted interactions) and LCP/INP budgets on a throttled profile. Flag rather than fail on noisy machines.

### B14. Aalto Interface Metrics (AIM): can we run it locally?

- **Possible, but not a sensible dependency** — https://github.com/aalto-ui/aim .
- **Architecture:** Python Tornado backend, MongoDB, Vue frontend over WebSocket. Docker Compose quick start brings up backend, frontend, mongo and mongo-express.
- **Native install:** Python 3.7 (end-of-life), Node 16.14.2, Chrome plus a *matching* ChromeDriver, and Git LFS for large models (e.g. UMSI).
- **`backend/requirements.txt` pins:** `tensorflow==1.15.5`, `torch==1.11.0`, `paddlepaddle==2.4.1`, `Keras==2.3.1`, `selenium==4.0.0rc1`. These have no wheels for current Python and in practice need x86_64 (emulated on Apple Silicon) [inferred from pinned versions].
- **Last activity:** default branch `aim2`, last push 2023-06-11.
- **Headless path:** an `evaluator.py` CLI (`-i screenshots/ -m m1,m2,… -o out/`) runs metrics over screenshot folders without the web UI. It emits `results.csv`, `quantiles.csv` and per-metric JSON.
- **Metric list** (`metrics.json`): m1–m25, m30, including distinct RGB values, contour density, figure-ground contrast, feature congestion, subband entropy, UMSI saliency, colourfulness (Hasler–Süsstrunk), grid quality, white space, colour blindness, UIED segmentation, NIMA.
- **Verdict:** if we want two or three cheap image metrics (distinct colours, colourfulness, white-space ratio, edge density), re-implement them in Node from screenshots. Treat AIM as an optional Docker-based research add-on; the theory is covered in note 06.

## 4. Synthesis — recommended minimal toolchain and the scripts we should write

### 4.1 Findings that shape the design

1. **Engines see less than half the problem.**
   - axe-core's default rules touch 19 of the 55 WCAG 2.2 A/AA SCs, mostly partially.
   - The four WCAG 2.2 additions most relevant to generated UIs have **no default axe rule**: focus not obscured, dragging, consistent help, accessible authentication.
   - Target size *has* a rule, but it is off by default.
   - So the verification value of UI-Evaluator lies in the **scripted dynamic checks** (keyboard walk, layout stress, forms probe, semantics diff), not in wrapping axe.
2. **Playwright is enough as the single browser substrate.** It provides:
   - every needed emulation: viewport/DPR/touch, colour scheme, reduced motion, forced colours, prefers-contrast;
   - CVD through CDP;
   - deterministic screenshots: fonts awaited, animations disabled, caret hidden, clock frozen;
   - pixel comparison;
   - ARIA snapshots with bounding boxes.

   Lighthouse, pa11y and BackstopJS each bring a second browser stack for little marginal value.
3. **File:line evidence is now a build-time concern for React.** Since React 19 removed `_debugSource`, the robust route is compile-time attribute injection (code-inspector-plugin, dev only). The runtime owner-stack route (bippy/react-grab) is the zero-config fallback. Svelte gives `__svelte_meta.loc` for free.
4. **Consistency metrics need normalisation.** Raw CSS analytics count `#333` and `#333333` as different colours and do not aggregate spacing. Runtime computed-style sampling plus OKLab clustering is needed for honest "distinct values" metrics.
5. **Contrast stays WCAG 2.x.**
   - WCAG 3 (Sept 2026 WD) has no contrast algorithm.
   - APCA's reference package is not OSI-licensed.
   - APCA is useful only as an advisory number computed with MIT code.
6. **Staleness and archival traps:**
   - Lost Pixel is archived.
   - BackstopJS is dormant.
   - LHCI pins Lighthouse 12.
   - reg-cli's `latest` tag is a release candidate.
   - eslint-plugin-jsx-a11y's peer range stops at ESLint 9 while ESLint is at 10.

   Pin versions and record engine versions in every report.

### 4.2 Recommended minimal toolchain

**Skill runtime** (installed into the skill's own `node_modules`; all permissive or MPL; all local; no paid services):

| Package | Why | Licence |
|---|---|---|
| `playwright` (Chromium only by default) | capture, emulation, keyboard walk, ARIA snapshots, CDP | Apache-2.0 |
| `@axe-core/playwright` (+ `axe-core`) | rule engine | MPL-2.0 (unmodified use) |
| `culori` | colour parsing, WCAG contrast, OKLab ΔE clustering, CVD palette filters | MIT |
| `@projectwallace/css-analyzer` | static CSS metrics with line/column locations | MIT |
| `pixelmatch` + `pngjs` | focus-ring diffs and before/after diffs outside the test runner | ISC / MIT |
| `web-vitals` | lab CLS/LCP/INP with attribution | Apache-2.0 |

**Target-project dev dependencies** (proposed to the user, never silently added):
- `code-inspector-plugin`: DOM→source.
- `stylelint` + `stylelint-declaration-strict-value` + `@double-great/stylelint-a11y`.
- Framework a11y ESLint plugin: `eslint-plugin-jsx-a11y` (ESLint ≤ 9) or `eslint-plugin-jsx-a11y-x` (ESLint 10), `eslint-plugin-vuejs-accessibility`, or the Svelte compiler's warnings.
- `eslint-plugin-better-tailwindcss` for Tailwind codebases.
- `style-dictionary` only if a DTCG token file exists or is being introduced.

**Optional add-ons** (feature-flagged):
- `lighthouse` — perf score and second a11y opinion.
- `accessibility-checker-engine` — IBM; WCAG 2.2 heuristics.
- `colorjs.io` — APCA advisory.
- `@capsizecss/*`
- `reg-cli@0.18.16` — HTML diff report.
- `bippy` — React 19 runtime source fallback.
- `@guidepup/virtual-screen-reader`

**Agent "eyes"** (any one; not required by the gates): `agent-browser`, `@playwright/cli`, `@playwright/mcp`, or `chrome-devtools-mcp` with `--no-usage-statistics --no-performance-crux`.

### 4.3 Scripts to write (inputs → outputs → gates)

**Common output contract.** Every script writes `findings.jsonl` records:
- `{id, gate, wcag:[...], engine:{name,version}, evidenceType: engine|scripted|agent|manual, severity:0-4, selector, xpath, bbox, crops:[png], source:{file,line,col,method,confidence}, data:{...}, fixHint}`
- plus a `manifest.json` (URL, commit, viewport matrix, tool versions, timestamps).
- **Severity mapping [proposal]:** axe impact critical→4, serious→3, moderate→2, minor→1. Scripted checks set severity per gate. Note 06 owns the Nielsen 0–4 definitions.

| # | Script | Input | Output | Gate(s) enforced |
|---|---|---|---|---|
| S1 | `capture.mjs` | URL(s), state recipes (clicks to open menus/dialogs), matrix: widths {320, 375, 768, 1024, 1280, 1440} × {light, dark} × prefs {default, reduced-motion, forced-colors, contrast-more}; CVD {deut, prot, trit, achro} at one width | Screenshots (PNG/WebP), ARIA snapshot JSON with boxes per state, `manifest.json` | Evidence for every gate. Deterministic recipe = TOOL-25 |
| S2 | `a11y-scan.mjs` | Same URL × states × {320, 1280} × {light, dark} | Findings from axe (tags `wcag2a…wcag22aa`, opt. `best-practice`), optional IBM `WCAG_2_2` | 0 serious/critical axe violations; `incomplete` re-queued to S6/agent |
| S3 | `keyboard-walk.mjs` | URL × states × {320, 1280} | Tab/Shift+Tab sequence with boxes, per-stop focus crops (focused/blurred), diff px, obscured samples, context-change events | 2.1.1 reachability, 2.1.2 no trap, 2.4.1 skip link, 2.4.3 order, 2.4.7 visible focus, 2.4.11 not obscured, 3.2.1 on focus; dialog contract (TOOL-08) |
| S4 | `layout-stress.mjs` | URL × states | Offender lists with boxes and crops | 1.4.10 reflow @320 (and 256 px height for vertical text), 1.4.12 spacing override, 1.4.4 200 % text, 1.3.4 orientation, generic overlap/clipping |
| S5 | `target-size.mjs` | URL × touch/desktop viewports | Target boxes, 24 px circle-spacing test, nearest-neighbour distances | 2.5.8 fail; Apple 44 pt / Material 48 dp advisory |
| S6 | `contrast-audit.mjs` | DOM + screenshots | Per-node text/non-text contrast (culori), pixel-sampled contrast for `incomplete` nodes, APCA advisory | 1.4.3, 1.4.11 (borders, icons, focus rings, states), both themes |
| S7 | `style-census.mjs` | CSS files (Wallace, `useLocations`) + runtime computed styles + optional DTCG tokens | Distinct-value metrics (OKLab-clustered colours, font sizes/families/weights, line-heights, spacing, radii, shadows, z-index, durations); off-token offenders with file:line | Consistency gates (thresholds owned by notes 05/07) |
| S8 | `visual-diff.mjs` | Before/after screenshot sets from S1 | Diff PNGs, changed-pixel ratio, changed-region boxes, mapping to DOM boxes | "One fix at a time": no unexpected change outside the targeted component |
| S9 | `semantics-diff.mjs` | Before/after ARIA snapshots; scripted widget toggles; async-action triggers | Role/name/state diffs, landmark/heading outline, live-region messages | 4.1.2 states, 4.1.3 status messages, semantic non-regression |
| S10 | `forms-probe.mjs` | Forms discovered in DOM | Error-flow evidence | 3.3.1, 3.3.2 (no placeholder-only), 1.3.5 (autocomplete present), 3.3.8 (paste allowed, auth autocomplete), error summary/focus |
| S11 | `vitals.mjs` | URL + interaction script | CLS/LCP/INP with attribution selectors; optional Lighthouse JSON | CLS ≤ 0.1; LCP/INP budgets (advisory on noisy hosts) |
| S12 | `static-scan.mjs` | Repo source | Grep/AST findings with file:line | IME Enter guard, paste blocking, `outline:none` without replacement, `user-scalable=no`, `tabindex>0`, clickable non-interactive elements, `mousedown` actions (2.5.2), `devicemotion` (2.5.4), single-key shortcuts (2.1.4), drag-only (2.5.7) |
| S13 | `i18n-check.mjs` | DOM text | Script/language ratios per element | 3.1.1/3.1.2 `lang` matches content; CJK large-text review queue |
| S14 | `cross-page.mjs` | List of routes | Nav order, help-mechanism order, same-action naming | 3.2.3, 3.2.4, 3.2.6 |
| S15 | `source-map.mjs` (library) | Element handle | `{file,line,col,method,confidence}` via `data-insp-path` → `__svelte_meta` → Vue inspector → bippy → grep | Evidence quality for every finding |
| S16 | `report.mjs` | All findings | Deduplicated (by selector+SC), per-SC coverage matrix (auto / scripted / agent / human / not-tested), markdown + JSON for the fix loop | Coverage-honesty rule (TOOL-37) |

**Recommended run order for an audit:** S1 → S2 → S3 → S4 → S5 → S6 → S10 → S9 → S7 → S11 → S12–S14 → S16.

**Recommended run order for a fix iteration:**
1. Re-run only the gates tied to the finding.
2. Run S8 + S9 to prove nothing else changed.
3. Re-run S2 on the touched state to catch regressions.

## 5. ADOPT LIST

| ID | Practice / rule / tool (precise wording) | Category | How to verify / run | Source(s) | Licence note |
|---|---|---|---|---|---|
| TOOL-01 | The normative target is **WCAG 2.2 Level AA**: 55 SCs (31 A + 24 AA); 4.1.1 is obsolete. WCAG 3.0 drafts and APCA are never pass/fail criteria. | process | Report header states "WCAG 2.2 AA (W3C Rec 2024-12-12 / ISO/IEC 40500:2025)" | https://www.w3.org/TR/WCAG22/ ; https://www.w3.org/WAI/news/2025-10-21/wcag22-iso ; https://www.w3.org/TR/wcag-3.0/ | W3C document licence |
| TOOL-02 | Run axe-core through `@axe-core/playwright` with tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` on a page created from `browser.newContext()`. Gate: **0 violations of impact serious or critical**. Every `incomplete` node is re-checked by a script or the agent. | check | `node scripts/a11y-scan.mjs --url … --states …` (E3 confirmed `target-size` only runs with `wcag22aa`) | https://github.com/dequelabs/axe-core/blob/develop/doc/API.md ; https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md | MPL-2.0: use unmodified |
| TOOL-03 | Scan **every interactive state** (open menus, dialogs, accordions, tabs, toasts, error states), not just the initial load. axe does not test hidden content. | process | State recipes in config; S2 runs per state | axe API notes (hidden regions) | — |
| TOOL-04 | Run each gate at **≥ 2 widths (320 and 1280 CSS px)** and in **light and dark** schemes. | process | S1/S2 matrix | WCAG 1.4.10; https://playwright.dev/docs/api/class-page#page-emulate-media | Apache-2.0 |
| TOOL-05 | **Keyboard walk.** Tab forward and back (≤ 3 × number of candidates). Every element that is clickable (`onclick`, `cursor:pointer`, interactive role) must be reachable (2.1.1). The walk must wrap without a trap (2.1.2). Flag backward visual jumps (2.4.3) and focus-triggered context changes (3.2.1). | check | S3 (E4 found an unreachable `div onclick`) | https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/ ; WCAG 2.1.1/2.1.2/2.4.3/3.2.1 | — |
| TOOL-06 | **Focus-visible check.** For each tab stop, pixel-diff the focused crop against the blurred crop (bbox + 4 px). **Fail if 0 px change.** Warn if the changed area is below a 1 px perimeter [heuristic, to calibrate]. Report 2.4.13 metrics (≥ 2 px-perimeter area, ≥ 3:1 change contrast) as advisory. | check | S3 (E4: an `outline:none` button changed 0 px) | WCAG 2.4.7, 2.4.13 | pixelmatch ISC |
| TOOL-07 | **Focus-not-obscured check.** For each tab stop (Tab **and** Shift+Tab), sample 9 points with `elementFromPoint`. Fail when none hits the focused element. Suggested fix: `scroll-padding` (C43). Typical failure: sticky header/footer (F110). | check | S3 | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html | — |
| TOOL-08 | **Modal dialog contract.** On open, focus moves inside. Tab/Shift+Tab wrap inside. Esc closes. Focus returns to the invoker. Markup is `role=dialog` + `aria-modal=true` + an accessible name, or native `<dialog>.showModal()`. | check | S3 dialog probe | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ | — |
| TOOL-09 | **Generation rule.** Prefer native HTML controls. Use ARIA only for widgets HTML lacks. A composite widget is one tab stop with arrow-key movement, via roving tabindex or `aria-activedescendant`. Never add a role without implementing its keyboard model. | process | Agent review + S12 static scan | https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/ ; keyboard-interface page | — |
| TOOL-10 | **Reflow gate.** At 320 CSS px wide, `documentElement.scrollWidth ≤ clientWidth + 1`. Exempt content that is genuinely 2-D (data tables, maps, diagrams, code). | check | S4 (E5 caught a 900 px block) | WCAG 1.4.10 | — |
| TOOL-11 | **Text-spacing gate.** Inject `line-height:1.5`, paragraph spacing `2em`, `letter-spacing:0.12em`, `word-spacing:0.16em` (all `!important`). Fail on any `overflow:hidden/clip` element whose scroll size exceeds its client size, and on overlapping text boxes. | check | S4 (E5 caught a clipped fixed-height card) | WCAG 1.4.12; https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html | — |
| TOOL-12 | **Text-resize gate.** At 200 % root font size, no clipping or overlap, and controls stay operable. | check | S4 | WCAG 1.4.4 | — |
| TOOL-13 | **Target size.** Fail when a target is < 24×24 CSS px unless the 24 px-circle spacing exception holds (axe `target-size` + own geometry). On touch viewports, warn when primary controls are < 44×44 (Apple default; Apple minimum is 28×28) or < 48×48 (Android/Material). | check + metric | S5 | WCAG 2.5.8/2.5.5; Apple HIG accessibility; https://developer.android.com/guide/topics/ui/accessibility/apps | — |
| TOOL-14 | **Contrast.** Text ≥ 4.5:1; large text (≥ 24 px, or ≥ 18.67 px bold) ≥ 3:1. UI component boundaries, icons, focus rings and state indicators ≥ 3:1 against adjacent colours. Use the luminance threshold 0.04045. Test light and dark themes and hover/focus/selected states. Pixel-sample text over images and gradients. | check | S6 (culori `wcagContrast`) | https://www.w3.org/TR/WCAG22/#contrast-minimum ; #non-text-contrast ; #dfn-relative-luminance | culori MIT |
| TOOL-15 | **APCA is advisory only.** Label it "APCA-style Lc (advisory)". Compute it with colorjs.io as `bg.contrast(fg,'APCA')`. Never gate on it. Do **not** bundle `apca-w3`. | metric | S6 (E1: argument order changes the result) | https://github.com/Myndex/apca-w3/blob/master/LICENSE.md ; https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html | colorjs.io MIT; apca-w3 non-OSI |
| TOOL-16 | **CVD evidence.** Take screenshots under deuteranopia, protanopia, tritanopia and achromatopsia via CDP `Emulation.setEmulatedVisionDeficiency`. The agent verifies that status, chart series, links and required markers stay distinguishable by a non-colour cue (1.4.1). | check (agent) | S1 (E6: emulation shows in screenshots) | https://developer.chrome.com/blog/cvd ; CDP Emulation domain | — |
| TOOL-17 | **Forced-colours evidence.** Take a screenshot with `forcedColors:'active'`. Focus indicators, input borders, icons and selected states must stay visible. Colour-coded chips must carry text or an icon. | check (agent) | S1 (E5: chip background → white) | Media Queries 5; Playwright emulateMedia | — |
| TOOL-18 | **Reduced motion.** Under `reducedMotion:'reduce'`, no infinite or large-displacement animations remain (`document.getAnimations()`). Static rule: stylelint `a11y/media-prefers-reduced-motion`. | check | S4 + stylelint (E5) | Apple HIG (Reduce Motion); WCAG 2.2.2, 2.3.3; https://github.com/double-great/stylelint-a11y | MIT |
| TOOL-19 | **Language correctness.** `lang` must match the dominant script/language of the content (Han/Kana/Hangul/Latin ratios). Mixed-language runs carry their own `lang`. When a product ships both Chinese scripts, tag `zh-Hans`/`zh-CN` vs `zh-Hant`/`zh-TW`/`zh-HK`. | check | S13 (E10: axe passes `lang="en"` on Chinese text) | WCAG 3.1.1/3.1.2; https://www.w3.org/International/questions/qa-choosing-language-tags | — |
| TOOL-20 | **IME guard.** Any Enter/keydown action handler must return early on `event.isComposing \|\| event.keyCode === 229`. | check | S12 static scan; e2e test with composition events [test method unverified] | https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event | — |
| TOOL-21 | **Forms probe.** Submitting empty or invalid data must produce a text error, `aria-invalid=true`, and association via `aria-describedby`/`aria-errormessage` (`toHaveAccessibleErrorMessage`). Focus moves to the first error or to a `role=alert` summary. No placeholder-only labels. Personal-data fields carry `autocomplete` tokens. | check | S10 | https://www.w3.org/WAI/tutorials/forms/notifications/ ; WCAG 3.3.1/3.3.2/1.3.5 | — |
| TOOL-22 | **Accessible authentication.** Password/OTP inputs allow paste and declare `autocomplete="current-password"`, `"new-password"` or `"one-time-code"`. No cognitive test without an alternative. | check | S10 + S12 | WCAG 3.3.8 | — |
| TOOL-23 | **Status messages.** After async actions (save, add, search, upload), the outcome text appears in a `role=status`/`alert`/`aria-live` region without moving focus. | check | S9 | WCAG 4.1.3 | — |
| TOOL-24 | **Semantic non-regression.** Diff ARIA snapshots (`ariaSnapshotJSON` with boxes) before and after every fix. Losing names, roles, landmarks or headings is a regression unless intended. Toggled widgets must change expanded/selected/checked state. | check | S9 | https://playwright.dev/docs/release-notes (1.63) | Apache-2.0 |
| TOOL-25 | **Deterministic capture recipe.** Fixed viewport and DPR; `reducedMotion:'reduce'`; `animations:'disabled'`; `caret:'hide'`; `page.clock` frozen; explicit `document.fonts.load()` for the faces used, then `fonts.ready`; mask dynamic regions; baseline and comparison taken on the same OS/container. | process | S1 | https://playwright.dev/docs/test-snapshots ; Playwright `screenshotter.ts` | Apache-2.0 |
| TOOL-26 | **Before/after visual diff for every fix.** pixelmatch per viewport (YIQ threshold 0.1–0.2). Report the changed-pixel ratio and changed-region boxes. Changes outside the target component's box (+ margin) are flagged as collateral. | check | S8 | Playwright snapshot docs; pixelmatch | ISC |
| TOOL-27 | **Style census.** Static (Wallace `useLocations`) plus runtime computed styles. Normalise colours to OKLab and treat ΔE_OK < 0.02 as the same colour. Report distinct colours, font sizes, families, weights, line-heights, spacing values, radii, shadows, z-indexes and durations, plus the off-token ratio with file:line. | metric | S7 (E2: `#333`/`#333333`/`rgb(51,51,51)` counted as 3) | https://github.com/projectwallace/css-analyzer ; culori | MIT |
| TOOL-28 | **Token source of truth** in DTCG 2025.10 format (`.tokens.json`, `$value`/`$type`, `{alias}`). Style Dictionary 5 builds CSS variables plus an allowed-values list that S7 consumes. | process | `style-dictionary build` | https://www.designtokens.org/tr/2025.10/ ; https://github.com/style-dictionary/style-dictionary/releases | Apache-2.0; DTCG is a CG report |
| TOOL-29 | **Literal-value lint.** stylelint `scale-unlimited/declaration-strict-value` on colour, z-index, font-size/family, line-height, margin/padding/gap, radius and shadow properties. For Tailwind, `better-tailwindcss/no-restricted-classes` bans arbitrary values (`\[.*\]`). | check | stylelint / eslint in the target repo | https://github.com/AndyOGo/stylelint-declaration-strict-value ; better-tailwindcss docs | MIT |
| TOOL-30 | **Static a11y lint per framework.** `eslint-plugin-jsx-a11y` (ESLint ≤ 9) or `eslint-plugin-jsx-a11y-x` (ESLint 10); `eslint-plugin-vuejs-accessibility`; Svelte compiler a11y warnings; stylelint `a11y/no-outline-none`. | check | eslint / stylelint | https://github.com/jsx-eslint/eslint-plugin-jsx-a11y ; https://github.com/es-tooling/eslint-plugin-jsx-a11y-x | MIT |
| TOOL-31 | **DOM→source evidence.** Dev-only `code-inspector-plugin` adds `data-insp-path="file:line:col:tag"`. Fallbacks, in order: `__svelte_meta.loc`, `vite-plugin-vue-inspector`, `bippy` `getSource()` (React 19), grep. Each finding records `method` and `confidence`. | tool | S15 (E7, E8) | https://github.com/zh-lx/code-inspector ; https://github.com/facebook/react/pull/28265 ; https://github.com/aidenybai/bippy | MIT |
| TOOL-32 | **CSS-origin evidence.** For computed-value findings, resolve the winning rule via CDP `CSS.getMatchedStylesForNode` or chrome-devtools-mcp `get_css_styles` (line numbers, overridden flags). | tool | S15 extension | https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md | Apache-2.0 |
| TOOL-33 | **Lab Core Web Vitals.** Inject the `web-vitals` attribution IIFE and use `reportAllChanges`. Budgets: CLS ≤ 0.1 (load + scripted interactions), LCP ≤ 2.5 s, INP ≤ 200 ms. Flag rather than fail on noisy hosts. Map attribution selectors to source. | metric | S11 | https://web.dev/articles/defining-core-web-vitals-thresholds ; https://github.com/GoogleChrome/web-vitals | Apache-2.0 |
| TOOL-34 | **Lighthouse is optional.** Run `lighthouse` ≥ 13 directly (not LHCI, which pins 12.6.1), median of 3 runs, and record the version. Its a11y score is supplementary, never a conformance claim. | tool | `lighthouse <url> --only-categories=… --output=json` (E9) | https://github.com/GoogleChrome/lighthouse/blob/main/core/config/default-config.js ; LHCI docs | Apache-2.0 |
| TOOL-35 | **Optional second engine.** IBM `accessibility-checker-engine` with the `WCAG_2_2` policy, for its 2.4.7/2.4.11/2.5.7/2.5.8/1.4.10/1.4.12/1.4.13 heuristics. "POTENTIAL" results are review items. | tool | S2 `--ibm` (E3) | https://github.com/IBMa/equal-access | Apache-2.0 |
| TOOL-36 | **Engine-agnostic finding schema:** `{wcag[], ruleIds[], engine+version, evidenceType, severity 0–4, selector, xpath, bbox, crops, source{file,line,col,method,confidence}, data, fixHint}`. | process | S16 schema test | (this note) | — |
| TOOL-37 | **Coverage honesty.** Report each SC as auto-pass / scripted-pass / agent-judged / needs-human / not-tested. Never claim "WCAG compliant" from automation. GDS: 29 % of barriers were found by no tool. Deque (vendor): automation covers ~57 % of issues by volume. | process | S16 coverage matrix | https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/ ; https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/ | — |
| TOOL-38 | **Agent browsing** uses any of agent-browser, playwright-cli, playwright-mcp or chrome-devtools-mcp. For chrome-devtools-mcp, start with `--no-usage-statistics --no-performance-crux`. Gates always run as scripts, never as chat-driven clicks. | process | Skill docs | READMEs of the four tools | Apache-2.0 |
| TOOL-39 | **Human feedback capture.** playwright-mcp `browser_annotate` (`--caps=devtools`) returns an annotated screenshot, an ARIA snapshot and the annotation list. Ingest these as findings with `evidenceType=human`. | tool | Feedback intake flow | https://github.com/microsoft/playwright-mcp | Apache-2.0 |
| TOOL-40 | **Dependency hygiene.** Do not adopt Lost Pixel (archived), BackstopJS (dormant), LHCI (stale Lighthouse), `apca-w3` (licence) or AIM as a dependency (EOL stack). Pin `reg-cli@0.18.16` if used. Record every engine version in `manifest.json`. | process | `package.json` review | Repos cited in §B0 | — |
| TOOL-41 | **Multi-page consistency.** Compare nav-landmark link order (3.2.3), names for the same function (3.2.4) and help-mechanism order (3.2.6) across routes. | check | S14 | WCAG 3.2.3/3.2.4/3.2.6 | — |
| TOOL-42 | **Pointer/keyboard static checks.** Flag actions bound to `mousedown`/`pointerdown`/`touchstart` (2.5.2), `devicemotion`/`deviceorientation` (2.5.4), single-character shortcuts without modifier/remap/focus scoping (2.1.4), and drag-only interactions (2.5.7). | check | S12 | WCAG 2.5.2/2.5.4/2.1.4/2.5.7 | — |
| TOOL-43 | **Font-metric hygiene (advisory).** Use capsize `createFontStack` fallback overrides to reduce font-swap CLS. Report the rendered x-height of the body face. Latin/Thai only for `xWidthAvg`. | metric | Optional script | https://github.com/seek-oss/capsize | MIT |
| TOOL-44 | **Spoken-output transcript (optional).** `@guidepup/virtual-screen-reader` produces a simulated screen-reader transcript of key flows for agent review. A real VoiceOver/NVDA pass stays human. | tool | Optional script | https://github.com/guidepup/virtual-screen-reader | MIT |

## 6. Open questions

1. **Focus-visible thresholds (TOOL-06).** "0 px changed = fail" is safe. The warning threshold (changed area vs 1 px or 2 px perimeter) and the 2.4.13 contrast-of-change computation need calibrating on a labelled corpus before they can gate. Anti-aliased rings, shadows and inner-only indicators all need test cases.
2. **Interactive-element discovery (TOOL-05).** `cursor:pointer` and `onclick` attributes miss React/Vue listeners attached via delegation. Options:
   - query listeners through CDP `DOMDebugger.getEventListeners` (Chromium only; cost unmeasured);
   - read framework props through bippy or the Vue devtools hook.

   Which one is reliable enough?
3. **IBM engine by default?** In E3 it found three real issues axe missed (placeholder-only label, clickable div, focus-style warnings) but produced "potential" noise and mislabels the level of 3.2.6/3.3.7. Decide by running both engines on 20–30 real pages and measuring precision.
4. **CJK large-text equivalence.** WCAG allows a CJK-equivalent size for "large scale" text but gives no number. Should we keep the Latin 24 px / 18.67 px bold cut-off and route 18–24 px CJK text in the 3:1–4.5:1 band to review, or adopt a national guideline? Coordinate with note 05 (clreq).
5. **Consent for build changes.** DOM→source via code-inspector-plugin edits the user's bundler config (dev only). We need a consent prompt and a zero-config fallback. bippy `getSource` must be verified against Next.js 16 / Vite 7 source-map setups. React DevTools' "open in editor" (promised in facebook/react#32574) may expose a usable API [unverified].
6. **Cross-machine baselines.** Playwright baselines are per-OS. For a local fix loop, before/after on the same machine within one session is enough. Shared baselines would need the Playwright Docker image. Which do we support?
7. **Should APCA be shown at all?** It may confuse users when it disagrees with WCAG (e.g. `#767676`/white passes WCAG at 4.54:1 but scores Lc 71.6 < 75). Possible approach: an expert flag, off by default.
8. **Runtime style census scale.** Computed-style sampling on very large DOMs (> 10k nodes) needs a budget: visible-only, deduplication by class signature. Thresholds for "too many distinct values" belong to notes 05/07. This note only supplies the measurement.
9. **Exact axe target-size algorithm** under CSS transforms, overlapping targets and inline links is not documented beyond the rule page [unverified]. Our S5 geometry should be compared with axe on fixtures.
10. **IME e2e test.** Can Playwright reproduce `isComposing` key events reliably (e.g. via CDP `Input.imeSetComposition`)? Unverified; until then TOOL-20 is a static check.
11. **Lighthouse "Agentic Browsing" category (v13.2+).** Out of scope here, but it may matter to the project's "AI-ready UI" story. Review its audits later.
12. **Real screen-reader runs** with Guidepup on macOS need OS permissions and are slow. Is a virtual screen-reader transcript (TOOL-44) good enough evidence for agent review, or should it be human-only?
