<!-- ui-evaluator: PRODUCT.md template v1 (FRAMEWORK §4.2, QUALITY-BAR DEC-01). Evaluation fixture: journey-app. -->
# Saltmarsh Quay visitor berths: product context

Read: for skippers of visiting yachts; the main job is booking a pontoon berth that the boat fits and can reach on the tide; tone referent is the harbourmaster's VHF voice, brief and exact. [confirmed: fixture brief, 2026-10-01]

Contents: Product summary · Users and groups · Top tasks · Context of use · Positioning · Constraints · Brand commitments · Facts · Principles · Accessibility needs · Platforms and locales · Target assurance level · Surfaces

## Product summary

The online booking for visitor berths at Saltmarsh Quay, a small tidal harbour behind a sill gate. Visiting skippers choose a date and arrival time, pick a free pontoon or wall berth, give their boat's details and confirm; they pay at the harbour office on arrival. [confirmed: fixture brief, 2026-10-01]
What makes it different from a marina booking is the tide: boats can only come in over the sill around high water, so the arrival time matters as much as the date. [confirmed: fixture brief, 2026-10-01]

## Users and groups

| Group | Trying to | Knows | Does not know | Their words | Label |
|---|---|---|---|---|---|
| Visiting skippers new to the harbour (primary) | secure a safe berth for one to seven nights | their boat's length overall, hull length and draught; how tides work | which berth fits; when the sill gate opens; local rules | "visitor berth", "pontoon", "LOA", "draught", "HW" | [confirmed: fixture brief, 2026-10-01] |
| Returning visiting skippers | rebook a berth they liked | the harbour and its gate | whether prices or berths changed | "same berth as last time" | [inferred: harbour office booking notes] |
| Harbour office staff | see who is arriving and when | every berth and rule | nothing relevant | "visitors", "arrivals" | [confirmed: fixture brief, 2026-10-01] |

## Top tasks

1. Book a visitor berth for a stay. Critical; journey `book-visitor-berth`. [confirmed: fixture brief, 2026-10-01]
2. Change the arrival date while booking. Core; journey `change-arrival-date`. [confirmed: fixture brief, 2026-10-01]
3. Check tide times and the sill-gate window for an arrival day. Core. [confirmed: fixture brief, 2026-10-01]
4. Read the harbour rules. Peripheral. [inferred: harbour office booking notes]

## Context of use

- Devices: mostly phones, often on board. [inferred: harbour office booking notes]
- Scene: in a cockpit or a cabin, sometimes underway, in bright light or at night; one hand often busy. [inferred: harbour office booking notes]
- Frequency: a few times a season per boat. [confirmed: fixture brief, 2026-10-01]
- Connectivity: weak mobile data at sea; booking may be done the evening before arrival. [inferred: harbour office booking notes]
- Assistive technology: screen magnification and larger text sizes are common among older skippers. [inferred: harbour office booking notes]

## Positioning

- Category: harbour and marina berth bookings. [confirmed: fixture brief, 2026-10-01]
- Alternatives: calling the harbour office by phone or on VHF; anchoring outside the harbour. [inferred: harbour office booking notes]
- Distinctive and true: a small, staffed tidal harbour where visitors pay on arrival and nothing is charged online. [confirmed: fixture brief, 2026-10-01]

## Constraints

- Technical: static pages; stay details pass between steps in the address; contact details are never put in an address. [confirmed: fixture brief, 2026-10-01]
- Legal: collect only what the harbour office needs to reach the skipper (a name and a mobile number). [confirmed: fixture brief, 2026-10-01]
- Brand: the harbour's name only; no mandated typeface or colours. [confirmed: fixture brief, 2026-10-01]

## Brand commitments

- Plain, exact language that a skipper can act on; the skipper is "you". [confirmed: fixture brief, 2026-10-01]
- Never hide a safety-relevant fact, such as the sill-gate window, behind a link. [confirmed: fixture brief, 2026-10-01]
- Tone referent from the owner: the harbourmaster on VHF, because skippers trust short, exact calls. [confirmed: fixture brief, 2026-10-01]

## Facts

| Claim | Allowed wording | Source | Label |
|---|---|---|---|
| Longest stay | "up to seven nights" | Harbour visitor rules, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Payment | "You pay at the harbour office when you arrive" | Harbour visitor rules, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Sill gate | "open from about two hours before high water until two hours after" | Harbour visitor rules, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Berth limits | A6 up to 8 m; B14 up to 10 m; C3 up to 12 m; wall berth 2 up to 15 m, length overall | Berth plan, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Prices | £2.80, £3.20, £3.60 and £2.40 per metre per night for A6, B14, C3 and wall berth 2 | Tariff, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Office phone | "01632 960418" (a fictional number), open 08:00 to 20:00 every day | Harbour office | [confirmed: fixture brief, 2026-10-01] |
| Speed limit | "4 knots inside the harbour walls" | Harbour visitor rules, 2026 | [confirmed: fixture brief, 2026-10-01] |

Explicit absences (the UI must not claim or imply these):
- No visitor numbers, review scores or ratings exist. [confirmed: fixture brief, 2026-10-01]
- No online payment and no deposit. [confirmed: fixture brief, 2026-10-01]
- No partner marinas or sponsor logos. [confirmed: fixture brief, 2026-10-01]

## Principles

1. Show the tide window wherever a time is chosen. [confirmed: fixture brief, 2026-10-01]
2. Never lose what a skipper has typed. [confirmed: fixture brief, 2026-10-01]
3. Every stop in the booking says what to do next. [confirmed: fixture brief, 2026-10-01]

## Accessibility needs

- WCAG 2.2 AA as the floor; larger text sizes and 200% zoom are common. [inferred: harbour office booking notes]
- Use in bright sunlight: contrast well above the minimum helps. [inferred: harbour office booking notes]
- Test with: VoiceOver on iOS Safari, TalkBack on Android Chrome, keyboard only, 200% zoom. [inferred: harbour office booking notes]

## Platforms and locales

- Platform profile: web. [confirmed: fixture brief, 2026-10-01]
- Browsers: current Safari on iOS, Chrome on Android, Chrome, Edge and Firefox on desktop. [inferred: harbour office booking notes]
- Locales: en-GB only, left to right. [confirmed: fixture brief, 2026-10-01]
- Formats: dates as Saturday 17 October 2026; 24-hour times in local time; lengths and depths in metres; prices in GBP. [confirmed: fixture brief, 2026-10-01]

## Target assurance level

Target level: L4. Booking decisions touch safety (entering over a sill on the tide), so critical tasks need evidence from real skippers. [confirmed: fixture brief, 2026-10-01]

## Surfaces

| Surface id | Routes | Single job | Who arrives, and why | Mode | Primary action | Label |
|---|---|---|---|---|---|---|
| plan-visit | / | choose the arrival date, nights and arrival time | skippers planning a visit | operate | Check berths | [confirmed: fixture brief, 2026-10-01] |
| choose-berth | /berths.html | choose a free berth the boat fits | skippers who have chosen dates | operate | Continue | [confirmed: fixture brief, 2026-10-01] |
| boat-details | /boat.html | give the boat's length, draught and identity | skippers who have chosen a berth | operate | Continue | [confirmed: fixture brief, 2026-10-01] |
| review | /review.html | check the booking and give a contact number | skippers about to confirm | operate | Confirm booking | [confirmed: fixture brief, 2026-10-01] |
| confirmation | /confirmed.html | confirm the booking and give the reference | skippers who have booked | read | none | [confirmed: fixture brief, 2026-10-01] |
