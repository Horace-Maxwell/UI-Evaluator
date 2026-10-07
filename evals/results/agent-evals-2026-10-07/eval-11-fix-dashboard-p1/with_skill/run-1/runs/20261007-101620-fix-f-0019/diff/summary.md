# Diff 20261007-002136-baseline-audit → 20261007-101620-fix-f-0019

Computed 2026-10-07T14:17:32.045Z. Parts: findings, visual, aria.

## Findings (identity-based)

Sources: base findings.json, run merged.json.

- cleared: 2
- cleared (scope not re-checked): 9
- introduced: 0
- persisting: 7 (0 partially fixed)
- judged, not re-checked in this run: 24

### Cleared

- F-0003 A11Y-01 / — axe color-contrast: Elements must meet minimum color contrast ratio thresholds
- F-0004 A11Y-11 / — Text contrast below 4.5:1: "Last reading 14:05"

### Cleared (scope not re-checked)

- F-0001 SLP-07 / — Card nested in a card (the tells check did not run in this run)
- F-0002 SLP-23 / — Radius monotony: 100% of radii are 20 px (the tells check did not run in this run)
- F-0012 MOT-01 / — transition: all on #readings (the motion check did not run in this run)
- F-0013 MOT-02 / — Transition of background-color lasts 600 ms on div.metric:nth-of-type(1) > span.chip.chip--ok (state budget 250 ms) (the motion check did not run in this run)
- F-0014 MOT-03 / — Overshooting easing on span > span.switch__knob (the motion check did not run in this run)
- F-0015 COL-01 (no route) — COL-01 Token conformance: literal #1c2b22 in color: equals --ink (#1c2b22): use the token (the lint check did not run in this run)
- F-0016 LAY-01 (no route) — LAY-01 Spacing scale conformance: gap: 6px (6 px) is off the default scale (0, 2 px, multiples of 4 px); nearest step 8px (the lint check did not run in this run)
- F-0017 MOT-01 (no route) — MOT-01 Animated properties: transition: all 200ms ease animates every property (all) (the lint check did not run in this run)
- F-0018 MOT-03 (no route) — MOT-03 No overshoot on UI state changes: cubic-bezier(0.68, -0.55, 0.27, 1.55) overshoots (y1 or y2 outside [−0.1, 1.1]) (the lint check did not run in this run)

### Persisting

- F-0005 TYP-01 / — Text below 12 px: "14:00" (0 of 2 instance(s) cleared)
- F-0006 TYP-06 / — Flat type hierarchy on / (0 of 2 instance(s) cleared)
- F-0007 LAY-04 / — Cramped padding: "In range" (0 of 4 instance(s) cleared)
- F-0008 TYP-14 / — Compared number without tabular figures: "pH 6.1" (0 of 2 instance(s) cleared)
- F-0009 SHP-02 / — Hairline border with a wide soft shadow (ghost card) (0 of 8 instance(s) cleared)
- F-0010 TYP-15 / — One word on the last line: "Nutrient dosing is now manual: the pumps" (0 of 3 instance(s) cleared)
- F-0011 LAY-01 / — 0% of spacing values on the scale on / (0 of 2 instance(s) cleared)

### Register updates (dry run, not applied)

- F-0003 A11Y-01: fixed → verified (axe re-ran over the finding's scope and no instance is left)
- F-0004 A11Y-11: fixed → verified (contrast re-ran over the finding's scope and no instance is left)

## Visual

24 capture(s) compared, 24 changed, 24 with changes outside the fixed findings' areas (possible collateral).

- root/default/1024-light-audit.png: 0.325% changed, 17 region(s), 17 possible collateral → diff/visual/root/default/1024-light-audit.png
- root/default/1280-light-audit.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/default/1280-light-audit.png
- root/default/1280-light-cvd-achromatopsia.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/default/1280-light-cvd-achromatopsia.png
- root/default/1280-light-cvd-deuteranopia.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/default/1280-light-cvd-deuteranopia.png
- root/default/1280-light-cvd-protanopia.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/default/1280-light-cvd-protanopia.png
- root/default/1280-light-cvd-tritanopia.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/default/1280-light-cvd-tritanopia.png
- root/default/1280-light-forced-colors.png: 0.176% changed, 12 region(s), 12 possible collateral → diff/visual/root/default/1280-light-forced-colors.png
- root/default/1280-light-more-contrast.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/default/1280-light-more-contrast.png
- root/default/1440-light-audit.png: 0.214% changed, 17 region(s), 17 possible collateral → diff/visual/root/default/1440-light-audit.png
- root/default/320-light-audit.png: 0.343% changed, 11 region(s), 11 possible collateral → diff/visual/root/default/320-light-audit.png
- root/default/375-light-audit.png: 0.514% changed, 15 region(s), 15 possible collateral → diff/visual/root/default/375-light-audit.png
- root/default/768-light-audit.png: 3.514% changed, 12 region(s), 12 possible collateral → diff/visual/root/default/768-light-audit.png
- root/manual-dosing/1024-light-audit.png: 0.325% changed, 17 region(s), 17 possible collateral → diff/visual/root/manual-dosing/1024-light-audit.png
- root/manual-dosing/1280-light-audit.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/manual-dosing/1280-light-audit.png
- root/manual-dosing/1280-light-cvd-achromatopsia.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/manual-dosing/1280-light-cvd-achromatopsia.png
- root/manual-dosing/1280-light-cvd-deuteranopia.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/manual-dosing/1280-light-cvd-deuteranopia.png
- root/manual-dosing/1280-light-cvd-protanopia.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/manual-dosing/1280-light-cvd-protanopia.png
- root/manual-dosing/1280-light-cvd-tritanopia.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/manual-dosing/1280-light-cvd-tritanopia.png
- root/manual-dosing/1280-light-forced-colors.png: 0.157% changed, 12 region(s), 12 possible collateral → diff/visual/root/manual-dosing/1280-light-forced-colors.png
- root/manual-dosing/1280-light-more-contrast.png: 0.223% changed, 17 region(s), 15 possible collateral → diff/visual/root/manual-dosing/1280-light-more-contrast.png
- root/manual-dosing/1440-light-audit.png: 0.214% changed, 17 region(s), 17 possible collateral → diff/visual/root/manual-dosing/1440-light-audit.png
- root/manual-dosing/320-light-audit.png: 0.338% changed, 11 region(s), 11 possible collateral → diff/visual/root/manual-dosing/320-light-audit.png
- root/manual-dosing/375-light-audit.png: 0.514% changed, 15 region(s), 15 possible collateral → diff/visual/root/manual-dosing/375-light-audit.png
- root/manual-dosing/768-light-audit.png: 3.514% changed, 12 region(s), 12 possible collateral → diff/visual/root/manual-dosing/768-light-audit.png

## ARIA snapshots

0 snapshot(s) compared, 0 changed, 0 with lost landmarks, headings or names.


