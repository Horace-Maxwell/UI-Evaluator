# Diff 20261007-002220-baseline-audit → 20261007-103559-verify

Computed 2026-10-07T14:37:44.605Z. Parts: findings, visual, aria.

## Findings (identity-based)

Sources: base tool-findings.jsonl, run tool-findings.jsonl.

- cleared: 5
- cleared (scope not re-checked): 0
- introduced: 0
- persisting: 13 (1 partially fixed)
- judged, not re-checked in this run: 0

### Introduced instances inside persisting findings

- (new) COL-01 (no route) — COL-01 Token conformance: literal #1c2b22 in color: equals --ink (#1c2b22): use the token: 1 new instance(s), e.g. color: #4d5a52;

### Cleared

- (new) A11Y-01 / — axe color-contrast: Elements must meet minimum color contrast ratio thresholds
- (new) A11Y-11 / — Text contrast below 4.5:1: "Last reading 14:05"
- (new) MOT-01 / — transition: all on #readings
- (new) MOT-02 / — Transition of background-color lasts 600 ms on div.metric:nth-of-type(1) > span.chip.chip--ok (state budget 250 ms)
- (new) MOT-01 (no route) — MOT-01 Animated properties: transition: all 200ms ease animates every property (all)

### Persisting

- (new) SLP-07 / — Card nested in a card (0 of 4 instance(s) cleared)
- (new) SLP-23 / — Radius monotony: 100% of radii are 20 px (0 of 2 instance(s) cleared)
- (new) TYP-01 / — Text below 12 px: "14:00" (0 of 2 instance(s) cleared)
- (new) TYP-06 / — Flat type hierarchy on / (0 of 2 instance(s) cleared)
- (new) LAY-04 / — Cramped padding: "In range" (0 of 4 instance(s) cleared)
- (new) TYP-14 / — Compared number without tabular figures: "pH 6.1" (0 of 2 instance(s) cleared)
- (new) SHP-02 / — Hairline border with a wide soft shadow (ghost card) (0 of 8 instance(s) cleared)
- (new) TYP-15 / — One word on the last line: "Nutrient dosing is now manual: the pumps" (0 of 3 instance(s) cleared)
- (new) LAY-01 / — 0% of spacing values on the scale on / (0 of 2 instance(s) cleared)
- (new) MOT-03 / — Overshooting easing on span > span.switch__knob (0 of 2 instance(s) cleared)
- (new) COL-01 (no route) — COL-01 Token conformance: literal #1c2b22 in color: equals --ink (#1c2b22): use the token (1 of 23 instance(s) cleared; 1 introduced instance(s))
- (new) LAY-01 (no route) — LAY-01 Spacing scale conformance: gap: 6px (6 px) is off the default scale (0, 2 px, multiples of 4 px); nearest step 8px (0 of 18 instance(s) cleared)
- (new) MOT-03 (no route) — MOT-03 No overshoot on UI state changes: cubic-bezier(0.68, -0.55, 0.27, 1.55) overshoots (y1 or y2 outside [−0.1, 1.1]) (0 of 1 instance(s) cleared)

### Register updates

- none

## Visual

30 capture(s) compared, 26 changed, 10 with changes outside the fixed findings' areas (possible collateral).

- root/default/1024-light-audit.png: 0.129% changed, 6 region(s), 6 possible collateral → diff/visual/root/default/1024-light-audit.png
- root/default/1280-light-audit.png: 0.097% changed, 6 region(s) → diff/visual/root/default/1280-light-audit.png
- root/default/1280-light-cvd-achromatopsia.png: 0.097% changed, 6 region(s) → diff/visual/root/default/1280-light-cvd-achromatopsia.png
- root/default/1280-light-cvd-deuteranopia.png: 0.097% changed, 6 region(s) → diff/visual/root/default/1280-light-cvd-deuteranopia.png
- root/default/1280-light-cvd-protanopia.png: 0.097% changed, 6 region(s) → diff/visual/root/default/1280-light-cvd-protanopia.png
- root/default/1280-light-cvd-tritanopia.png: 0.097% changed, 6 region(s) → diff/visual/root/default/1280-light-cvd-tritanopia.png
- root/default/1280-light-more-contrast-audit.png: 0.097% changed, 6 region(s) → diff/visual/root/default/1280-light-more-contrast-audit.png
- root/default/1280-light-more-contrast.png: 0.097% changed, 6 region(s) → diff/visual/root/default/1280-light-more-contrast.png
- root/default/1280-light-reduced-motion-audit.png: 0.097% changed, 6 region(s) → diff/visual/root/default/1280-light-reduced-motion-audit.png
- root/default/1440-light-audit.png: 0.088% changed, 6 region(s), 6 possible collateral → diff/visual/root/default/1440-light-audit.png
- root/default/320-light-audit.png: 0.235% changed, 6 region(s), 6 possible collateral → diff/visual/root/default/320-light-audit.png
- root/default/375-light-audit.png: 0.208% changed, 6 region(s), 6 possible collateral → diff/visual/root/default/375-light-audit.png
- root/default/768-light-audit.png: 0.165% changed, 6 region(s), 6 possible collateral → diff/visual/root/default/768-light-audit.png
- root/manual-dosing/1024-light-audit.png: 0.129% changed, 6 region(s), 6 possible collateral → diff/visual/root/manual-dosing/1024-light-audit.png
- root/manual-dosing/1280-light-audit.png: 0.097% changed, 6 region(s) → diff/visual/root/manual-dosing/1280-light-audit.png
- root/manual-dosing/1280-light-cvd-achromatopsia.png: 0.097% changed, 6 region(s) → diff/visual/root/manual-dosing/1280-light-cvd-achromatopsia.png
- root/manual-dosing/1280-light-cvd-deuteranopia.png: 0.097% changed, 6 region(s) → diff/visual/root/manual-dosing/1280-light-cvd-deuteranopia.png
- root/manual-dosing/1280-light-cvd-protanopia.png: 0.097% changed, 6 region(s) → diff/visual/root/manual-dosing/1280-light-cvd-protanopia.png
- root/manual-dosing/1280-light-cvd-tritanopia.png: 0.097% changed, 6 region(s) → diff/visual/root/manual-dosing/1280-light-cvd-tritanopia.png
- root/manual-dosing/1280-light-more-contrast-audit.png: 0.097% changed, 6 region(s) → diff/visual/root/manual-dosing/1280-light-more-contrast-audit.png
- root/manual-dosing/1280-light-more-contrast.png: 0.097% changed, 6 region(s) → diff/visual/root/manual-dosing/1280-light-more-contrast.png
- root/manual-dosing/1280-light-reduced-motion-audit.png: 0.097% changed, 6 region(s) → diff/visual/root/manual-dosing/1280-light-reduced-motion-audit.png
- root/manual-dosing/1440-light-audit.png: 0.088% changed, 6 region(s), 6 possible collateral → diff/visual/root/manual-dosing/1440-light-audit.png
- root/manual-dosing/320-light-audit.png: 0.232% changed, 6 region(s), 6 possible collateral → diff/visual/root/manual-dosing/320-light-audit.png
- root/manual-dosing/375-light-audit.png: 0.208% changed, 6 region(s), 6 possible collateral → diff/visual/root/manual-dosing/375-light-audit.png
- root/manual-dosing/768-light-audit.png: 0.165% changed, 6 region(s), 6 possible collateral → diff/visual/root/manual-dosing/768-light-audit.png

## ARIA snapshots

0 snapshot(s) compared, 0 changed, 0 with lost landmarks, headings or names.


