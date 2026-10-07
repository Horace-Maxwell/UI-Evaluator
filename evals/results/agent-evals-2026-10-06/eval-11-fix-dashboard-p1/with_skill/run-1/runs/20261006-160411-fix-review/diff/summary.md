# Diff 20261006-144207-baseline-audit → 20261006-160411-fix-review

Computed 2026-10-06T20:05:36.343Z. Parts: findings, visual, aria.

## Findings (identity-based)

Sources: base findings.json, run tool-findings.jsonl.

- cleared: 3
- cleared (scope not re-checked): 4
- introduced: 0
- persisting: 11 (0 partially fixed)
- judged, not re-checked in this run: 12

### Introduced instances inside persisting findings

- F-0007 LAY-04 / — Cramped padding: "In range": 2 new instance(s), e.g. div.metric:nth-of-type(5) > span.chip.chip--alarm
- F-0013 MOT-02 / — Transition of background-color lasts 600 ms on div.metric:nth-of-type(1) > span.chip.chip--ok (state budget 250 ms): 2 new instance(s), e.g. div.metric:nth-of-type(5) > span.chip.chip--alarm

### Cleared

- F-0003 A11Y-01 / — axe color-contrast: Elements must meet minimum color contrast ratio thresholds
- F-0004 A11Y-11 / — Text contrast below 4.5:1: "Last reading 14:05"
- F-0008 TYP-14 / — Compared number without tabular figures: "pH 6.1"

### Cleared (scope not re-checked)

- F-0015 COL-01 (no route) — COL-01 Token conformance: literal #1c2b22 in color: equals --ink (#1c2b22): use the token (the lint check did not run in this run)
- F-0016 LAY-01 (no route) — LAY-01 Spacing scale conformance: gap: 6px (6 px) is off the default scale (0, 2 px, multiples of 4 px); nearest step 8px (the lint check did not run in this run)
- F-0017 MOT-01 (no route) — MOT-01 Animated properties: transition: all 200ms ease animates every property (all) (the lint check did not run in this run)
- F-0018 MOT-03 (no route) — MOT-03 No overshoot on UI state changes: cubic-bezier(0.68, -0.55, 0.27, 1.55) overshoots (y1 or y2 outside [−0.1, 1.1]) (the lint check did not run in this run)

### Persisting

- F-0001 SLP-07 / — Card nested in a card (0 of 4 instance(s) cleared)
- F-0002 SLP-23 / — Radius monotony: 100% of radii are 20 px (0 of 2 instance(s) cleared)
- F-0005 TYP-01 / — Text below 12 px: "14:00" (0 of 2 instance(s) cleared)
- F-0006 TYP-06 / — Flat type hierarchy on / (0 of 2 instance(s) cleared)
- F-0007 LAY-04 / — Cramped padding: "In range" (0 of 4 instance(s) cleared; 2 introduced instance(s))
- F-0009 SHP-02 / — Hairline border with a wide soft shadow (ghost card) (0 of 8 instance(s) cleared)
- F-0010 TYP-15 / — One word on the last line: "Nutrient dosing is now manual: the pumps" (0 of 3 instance(s) cleared)
- F-0011 LAY-01 / — 0% of spacing values on the scale on / (0 of 2 instance(s) cleared)
- F-0012 MOT-01 / — transition: all on #readings (0 of 4 instance(s) cleared)
- F-0013 MOT-02 / — Transition of background-color lasts 600 ms on div.metric:nth-of-type(1) > span.chip.chip--ok (state budget 250 ms) (0 of 4 instance(s) cleared; 2 introduced instance(s))
- F-0014 MOT-03 / — Overshooting easing on span > span.switch__knob (0 of 2 instance(s) cleared)

### Register updates

- F-0003 A11Y-01: fixed → verified (axe re-ran over the finding's scope and no instance is left)
- F-0004 A11Y-11: fixed → verified (contrast re-ran over the finding's scope and no instance is left)

## Visual

30 capture(s) compared, 30 changed, 30 with changes outside the fixed findings' areas (possible collateral).

- root/default/1024-light-audit.png: 7.446% changed, 17 region(s), 17 possible collateral → diff/visual/root/default/1024-light-audit.png
- root/default/1280-light-audit.png: 9.287% changed, 16 region(s), 13 possible collateral → diff/visual/root/default/1280-light-audit.png
- root/default/1280-light-cvd-achromatopsia.png: 8.801% changed, 15 region(s), 12 possible collateral → diff/visual/root/default/1280-light-cvd-achromatopsia.png
- root/default/1280-light-cvd-deuteranopia.png: 9.031% changed, 16 region(s), 13 possible collateral → diff/visual/root/default/1280-light-cvd-deuteranopia.png
- root/default/1280-light-cvd-protanopia.png: 8.823% changed, 15 region(s), 12 possible collateral → diff/visual/root/default/1280-light-cvd-protanopia.png
- root/default/1280-light-cvd-tritanopia.png: 9.169% changed, 16 region(s), 13 possible collateral → diff/visual/root/default/1280-light-cvd-tritanopia.png
- root/default/1280-light-forced-colors-audit.png: 7.408% changed, 9 region(s), 8 possible collateral → diff/visual/root/default/1280-light-forced-colors-audit.png
- root/default/1280-light-forced-colors.png: 7.408% changed, 9 region(s), 8 possible collateral → diff/visual/root/default/1280-light-forced-colors.png
- root/default/1280-light-more-contrast-audit.png: 9.287% changed, 16 region(s), 13 possible collateral → diff/visual/root/default/1280-light-more-contrast-audit.png
- root/default/1280-light-more-contrast.png: 9.287% changed, 16 region(s), 13 possible collateral → diff/visual/root/default/1280-light-more-contrast.png
- root/default/1280-light-reduced-motion-audit.png: 9.287% changed, 16 region(s), 13 possible collateral → diff/visual/root/default/1280-light-reduced-motion-audit.png
- root/default/1440-light-audit.png: 7.499% changed, 15 region(s), 15 possible collateral → diff/visual/root/default/1440-light-audit.png
- root/default/320-light-audit.png: 14.139% changed, 6 region(s), 6 possible collateral → diff/visual/root/default/320-light-audit.png
- root/default/375-light-audit.png: 14.580% changed, 7 region(s), 7 possible collateral → diff/visual/root/default/375-light-audit.png
- root/default/768-light-audit.png: 13.962% changed, 7 region(s), 7 possible collateral → diff/visual/root/default/768-light-audit.png
- root/manual-dosing/1024-light-audit.png: 7.491% changed, 17 region(s), 17 possible collateral → diff/visual/root/manual-dosing/1024-light-audit.png
- root/manual-dosing/1280-light-audit.png: 9.315% changed, 16 region(s), 13 possible collateral → diff/visual/root/manual-dosing/1280-light-audit.png
- root/manual-dosing/1280-light-cvd-achromatopsia.png: 8.829% changed, 15 region(s), 12 possible collateral → diff/visual/root/manual-dosing/1280-light-cvd-achromatopsia.png
- root/manual-dosing/1280-light-cvd-deuteranopia.png: 9.059% changed, 16 region(s), 13 possible collateral → diff/visual/root/manual-dosing/1280-light-cvd-deuteranopia.png
- root/manual-dosing/1280-light-cvd-protanopia.png: 8.851% changed, 15 region(s), 12 possible collateral → diff/visual/root/manual-dosing/1280-light-cvd-protanopia.png
- root/manual-dosing/1280-light-cvd-tritanopia.png: 9.197% changed, 16 region(s), 13 possible collateral → diff/visual/root/manual-dosing/1280-light-cvd-tritanopia.png
- root/manual-dosing/1280-light-forced-colors-audit.png: 7.429% changed, 9 region(s), 8 possible collateral → diff/visual/root/manual-dosing/1280-light-forced-colors-audit.png
- root/manual-dosing/1280-light-forced-colors.png: 7.429% changed, 9 region(s), 8 possible collateral → diff/visual/root/manual-dosing/1280-light-forced-colors.png
- root/manual-dosing/1280-light-more-contrast-audit.png: 9.315% changed, 16 region(s), 13 possible collateral → diff/visual/root/manual-dosing/1280-light-more-contrast-audit.png
- root/manual-dosing/1280-light-more-contrast.png: 9.315% changed, 16 region(s), 13 possible collateral → diff/visual/root/manual-dosing/1280-light-more-contrast.png
- root/manual-dosing/1280-light-reduced-motion-audit.png: 9.315% changed, 16 region(s), 13 possible collateral → diff/visual/root/manual-dosing/1280-light-reduced-motion-audit.png
- root/manual-dosing/1440-light-audit.png: 7.541% changed, 15 region(s), 15 possible collateral → diff/visual/root/manual-dosing/1440-light-audit.png
- root/manual-dosing/320-light-audit.png: 14.133% changed, 6 region(s), 6 possible collateral → diff/visual/root/manual-dosing/320-light-audit.png
- root/manual-dosing/375-light-audit.png: 14.588% changed, 7 region(s), 7 possible collateral → diff/visual/root/manual-dosing/375-light-audit.png
- root/manual-dosing/768-light-audit.png: 13.976% changed, 8 region(s), 8 possible collateral → diff/visual/root/manual-dosing/768-light-audit.png

## ARIA snapshots

0 snapshot(s) compared, 0 changed, 0 with lost landmarks, headings or names.


