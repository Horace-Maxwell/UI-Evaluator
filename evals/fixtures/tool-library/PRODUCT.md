<!-- ui-evaluator: PRODUCT.md template v1 (FRAMEWORK §4.2, QUALITY-BAR DEC-01). Evaluation fixture: tool-library. -->
# Fernhill Tool Library reservations: product context

Read: for members of a volunteer-run tool library; the main job is reserving a tool to collect at an opening session; tone referent is the volunteer at the desk who explains the tool while handing it over. [confirmed: fixture brief, 2026-10-07]

Contents: Product summary · Users and groups · Top tasks · Context of use · Positioning · Constraints · Brand commitments · Facts · Principles · Accessibility needs · Platforms and locales · Target assurance level · Surfaces

## Product summary

The online reservation for Fernhill Tool Library, a community tool library run by volunteers from a room at the community centre. Members find a tool, choose the day they will collect it and how long they want it, hold it in a basket, pick an opening session and confirm. They collect and pay the deposit in person. [confirmed: fixture brief, 2026-10-07]
What makes it different from a shop is that the stock is one of each tool, lent for a week or two, and the desk is open a few hours a week: a reservation only works if the member turns up at a session. [confirmed: fixture brief, 2026-10-07]

## Users and groups

| Group | Trying to | Knows | Does not know | Their words | Label |
|---|---|---|---|---|---|
| Members reserving for the first time (primary) | have a particular tool waiting at a session | the tool they want; their membership number; that there is a deposit | which days are sessions; how the basket works | "borrow", "pick up", "the drill with two batteries", "Saturday morning" | [confirmed: fixture brief, 2026-10-07] |
| Returning members | reserve again quickly, often on a phone | the sessions and the deposit | whether a tool is back from the previous borrower | "same as last time", "is it back yet" | [inferred: desk volunteers' notes] |
| Desk volunteers | see what to set aside for each session | the stock and the rules | nothing relevant | "reservations", "the Saturday list" | [confirmed: fixture brief, 2026-10-07] |

## Top tasks

1. Reserve a tool to collect at a session. Critical; journey `reserve-tool-for-saturday`. [confirmed: fixture brief, 2026-10-07]
2. Change the collection session while reserving. Core; journey `change-pickup-session`. [confirmed: fixture brief, 2026-10-07]
3. See which tools can be collected on a given day. Core. [confirmed: fixture brief, 2026-10-07]
4. Check the opening times and the deposit. Peripheral. [inferred: desk volunteers' notes]

## Context of use

- Devices: mostly phones, at home in the evening; some desktop use at work in a lunch break. [inferred: desk volunteers' notes]
- Scene: planning a weekend job, often while doing something else; a few minutes at a time. [inferred: desk volunteers' notes]
- Frequency: a handful of times a year per member. [confirmed: fixture brief, 2026-10-07]
- Connectivity: ordinary home broadband and mobile data. [inferred: desk volunteers' notes]
- Assistive technology: several members are older; larger text and dark mode on phones are common. [inferred: desk volunteers' notes]

## Positioning

- Category: community lending libraries and tool hire. [confirmed: fixture brief, 2026-10-07]
- Alternatives: hiring from a trade counter; buying; asking a neighbour. [inferred: desk volunteers' notes]
- Distinctive and true: free to borrow with membership, one of each tool, run by neighbours, open a few hours a week. [confirmed: fixture brief, 2026-10-07]

## Constraints

- Technical: static pages; the basket is kept in the browser for the visit; details pass between steps in the address, except personal details, which are never put in an address. [confirmed: fixture brief, 2026-10-07]
- Legal: collect only what the desk needs to hand over the tool (a membership number, a name and a mobile number for late-return messages). [confirmed: fixture brief, 2026-10-07]
- Brand: the library's name and its green; no mandated typeface. [confirmed: fixture brief, 2026-10-07]

## Brand commitments

- Plain language; the member is "you"; tools are described the way a volunteer would describe them across the desk. [confirmed: fixture brief, 2026-10-07]
- Honest about the stock: one of each tool, and a date it can be collected from. [confirmed: fixture brief, 2026-10-07]
- Tone referent from the owner: the desk volunteer handing over a tool, because members trust someone who knows the tool and says so briefly. [confirmed: fixture brief, 2026-10-07]

## Facts

| Claim | Allowed wording | Source | Label |
|---|---|---|---|
| Opening sessions | "Saturdays 10:00 to 13:00 and Wednesdays 18:00 to 20:00" | Library rules, 2026 | [confirmed: fixture brief, 2026-10-07] |
| Address | "Fernhill community centre, 14 Mill Lane" | Library rules, 2026 | [confirmed: fixture brief, 2026-10-07] |
| Loan length | "one week or two weeks" | Library rules, 2026 | [confirmed: fixture brief, 2026-10-07] |
| Reservations per member | "up to three tools at a time" | Library rules, 2026 | [confirmed: fixture brief, 2026-10-07] |
| Basket hold | "ten minutes from the first tool added" | Reservation system notes, 2026 | [confirmed: fixture brief, 2026-10-07] |
| Deposits | £15, £20, £30 or £40 per tool, listed on each tool, returned when the tool comes back clean and working | Tariff, 2026 | [confirmed: fixture brief, 2026-10-07] |
| Membership number | "FT-" and five digits, printed on the card | Membership scheme, 2026 | [confirmed: fixture brief, 2026-10-07] |
| Desk phone | "01632 960552" (a fictional number), during opening hours only | Library rules, 2026 | [confirmed: fixture brief, 2026-10-07] |

Explicit absences (the UI must not claim or imply these):
- No online payment, no card details, no deposit taken online. [confirmed: fixture brief, 2026-10-07]
- No ratings, reviews or member counts. [confirmed: fixture brief, 2026-10-07]
- No delivery. [confirmed: fixture brief, 2026-10-07]

## Principles

1. A member should be able to reserve on a phone in a few minutes, without phoning the desk. [confirmed: fixture brief, 2026-10-07]
2. Volunteers' time is scarce: the site should answer the questions the desk is asked most. [confirmed: fixture brief, 2026-10-07]
3. Say what the library has and when, and nothing more. [confirmed: fixture brief, 2026-10-07]

## Accessibility needs

- WCAG 2.2 AA as the floor; larger text, 200% zoom and dark mode are common among members. [inferred: desk volunteers' notes]
- Keyboard use by members who do not use a mouse. [inferred: desk volunteers' notes]
- Test with: VoiceOver on iOS Safari, TalkBack on Android Chrome, keyboard only, 200% zoom, dark mode. [inferred: desk volunteers' notes]

## Platforms and locales

- Platform profile: web. [confirmed: fixture brief, 2026-10-07]
- Browsers: current Safari on iOS, Chrome on Android, Chrome, Edge and Firefox on desktop. [inferred: desk volunteers' notes]
- Locales: en-GB only, left to right. [confirmed: fixture brief, 2026-10-07]
- Formats: dates as Saturday 17 October; 24-hour times; measurements in metric; prices in GBP. [confirmed: fixture brief, 2026-10-07]

## Target assurance level

Target level: L3. Reservations are commitments the desk prepares for, so the critical task needs a human check; no safety decision is involved. [confirmed: fixture brief, 2026-10-07]

## Surfaces

| Surface id | Routes | Single job | Who arrives, and why | Mode | Primary action | Label |
|---|---|---|---|---|---|---|
| find | / | find a tool to reserve | members with a job in mind | operate | open a tool | [confirmed: fixture brief, 2026-10-07] |
| tool | /tool.html | choose the collection day and loan length for one tool | members who have found their tool | operate | Reserve this tool | [confirmed: fixture brief, 2026-10-07] |
| basket | /basket.html | choose the session to collect at | members with tools held | operate | Continue | [confirmed: fixture brief, 2026-10-07] |
| confirm | /confirm.html | check the reservation and give the desk what it needs | members ready to commit | operate | Confirm reservation | [confirmed: fixture brief, 2026-10-07] |
| done | /done.html | know the reservation is made and what to bring | members who have confirmed | read | none | [confirmed: fixture brief, 2026-10-07] |
