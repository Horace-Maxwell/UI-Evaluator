<!-- ui-evaluator: PRODUCT.md template v1 (FRAMEWORK §4.2, QUALITY-BAR DEC-01). Evaluation fixture: dashboard. -->
# Lower Mill Growers hydroponics monitor: product context

Read: for volunteer growers at a community hydroponics farm; the main job is noticing a reading out of range and acting on the pumps; tone referent is the laminated checklist on the bay door, short and unambiguous. [confirmed: fixture brief, 2026-10-01]

Contents: Product summary · Users and groups · Top tasks · Context of use · Positioning · Constraints · Brand commitments · Facts · Principles · Accessibility needs · Platforms and locales · Target assurance level · Surfaces

## Product summary

A monitor for one growing bay of Lower Mill Growers, a community farm that grows salad leaves and herbs in nutrient film channels. It shows the latest readings from the bay's probes, which sensors are healthy, and lets growers switch nutrient dosing between automatic and manual. [confirmed: fixture brief, 2026-10-01]
Unlike the vendor's controller screen, it is written for volunteers who are not trained in hydroponics. [confirmed: fixture brief, 2026-10-01]

## Users and groups

| Group | Trying to | Knows | Does not know | Their words | Label |
|---|---|---|---|---|---|
| Volunteer growers on shift (primary) | keep the bay's water within range and act when it is not | what the plants need in broad terms; the shift checklist | what each probe measures in detail; when a reading is stale | "pH", "feed", "the tank", "pumps" | [confirmed: fixture brief, 2026-10-01] |
| Growing lead | review the bay before and after shifts | every probe and target range | nothing relevant | "EC", "DO", "set points" | [confirmed: fixture brief, 2026-10-01] |
| Visiting school groups | see what the farm measures | very little | almost everything | "plants", "water" | [inferred: farm visit notes] |

## Top tasks

1. Take nutrient dosing off automatic before working on the reservoir. Critical; journey `switch-dosing-to-manual`. [confirmed: fixture brief, 2026-10-01]
2. Check whether any reading is out of range. Core. [confirmed: fixture brief, 2026-10-01]
3. See which sensor needs attention. Core. [confirmed: fixture brief, 2026-10-01]

## Context of use

- Devices: a shared wall-mounted tablet in the bay; some growers use their phones. [confirmed: fixture brief, 2026-10-01]
- Scene: standing in a humid growing bay, often with wet gloves, under bright grow lights. [inferred: grower shift notes]
- Frequency: every shift, several times. [confirmed: fixture brief, 2026-10-01]
- Connectivity: farm wifi; the feed from the probes can drop out. [inferred: grower shift notes]
- Assistive technology: some volunteers are colour-blind; at least one uses a screen reader at home. [inferred: volunteer survey 2026]

## Positioning

- Category: monitoring dashboards for small hydroponic farms. [confirmed: fixture brief, 2026-10-01]
- Alternatives: the vendor controller's own screen; a paper log on the bay door. [inferred: grower shift notes]
- Distinctive and true: plain words and target ranges written by the growing lead. [confirmed: fixture brief, 2026-10-01]

## Constraints

- Technical: one static page fed by the controller's export; readings arrive every few minutes. [confirmed: fixture brief, 2026-10-01]
- Legal: none beyond the farm's volunteer data policy; the page shows no personal data. [confirmed: fixture brief, 2026-10-01]
- Brand: the farm's name only. [confirmed: fixture brief, 2026-10-01]

## Brand commitments

- Say what to do, not only what is wrong. [confirmed: fixture brief, 2026-10-01]
- Never show a stale reading as if it were current. [confirmed: fixture brief, 2026-10-01]
- Tone referent from the owner: the laminated checklist on the bay door, because volunteers follow it. [confirmed: fixture brief, 2026-10-01]

## Facts

| Claim | Allowed wording | Source | Label |
|---|---|---|---|
| Target pH | pH 5.8 to 6.4 | Growing lead's set points, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Target conductivity | EC 1.6 to 2.0 mS/cm | Growing lead's set points, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Water temperature | 18 to 22 °C | Growing lead's set points, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Reservoir size | 200 L | Bay 4 equipment list | [confirmed: fixture brief, 2026-10-01] |
| Readings | the values shown are the controller's latest export | Controller export | [confirmed: fixture brief, 2026-10-01] |

Explicit absences (the UI must not claim or imply these):
- No yield or growth figures are published. [confirmed: fixture brief, 2026-10-01]
- No comparison with other farms. [confirmed: fixture brief, 2026-10-01]

## Principles

1. An out-of-range reading always says what to do next. [confirmed: fixture brief, 2026-10-01]
2. Status never depends on colour alone. [confirmed: fixture brief, 2026-10-01]
3. Show when data is old or missing. [confirmed: fixture brief, 2026-10-01]

## Accessibility needs

- WCAG 2.2 AA as the floor; colour-blind volunteers on every rota. [inferred: volunteer survey 2026]
- Bright grow lights and glare on the tablet: contrast well above the minimum. [inferred: grower shift notes]
- Test with: keyboard only, 200% zoom, a colour-vision simulator, VoiceOver on iPad. [inferred: volunteer survey 2026]

## Platforms and locales

- Platform profile: web. [confirmed: fixture brief, 2026-10-01]
- Browsers: Safari on the bay iPad; current Chrome and Safari on phones. [inferred: grower shift notes]
- Locales: en-GB only, left to right. [confirmed: fixture brief, 2026-10-01]
- Formats: 24-hour times; metric units (mS/cm, °C, mg/L, L). [confirmed: fixture brief, 2026-10-01]

## Target assurance level

Target level: L3. Wrong pump settings can kill a crop; growers' confirmation of severe findings is needed before release. [confirmed: fixture brief, 2026-10-01]

## Surfaces

| Surface id | Routes | Single job | Who arrives, and why | Mode | Primary action | Label |
|---|---|---|---|---|---|---|
| bay-monitor | / | show the bay's readings and let growers switch dosing | growers on shift checking the bay | operate | Automatic nutrient dosing | [confirmed: fixture brief, 2026-10-01] |
