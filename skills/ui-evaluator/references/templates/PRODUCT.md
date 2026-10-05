<!-- ui-evaluator: PRODUCT.md template v1 (FRAMEWORK §4.2, QUALITY-BAR DEC-01) -->
# [Product name]: product context

<!--
What this file is: the durable product truth that design and evaluation depend on (P1, context before pixels).
It holds no visual decisions; those live in DESIGN.md.

How to fill it:
- Keep it at the project root as PRODUCT.md. If one exists, propose changes as a diff; never overwrite it (ADR-014).
- Every section below is required for DEC-01. If a section has nothing in it, write "None" with a label, so the
  absence is a recorded fact instead of a gap. DEC-01 also checks that the facts section exists and that facts are labelled.
- End every fact with a label: [confirmed: who or which document, YYYY-MM-DD] or [inferred: the evidence].
  Inferred facts are hypotheses. Ask the owner about them in rounds of at most three questions (IMP-003), then
  update the label.
- Describe groups of people, never named individuals, and put no personal data here.
- The examples describe a fictional council recycling service. Replace all of them; none is a default.
-->

Read: [one line: who it is for, the main job, the tone referent; required in non-interactive runs] [inferred: …]

Contents: Product summary · Users and groups · Top tasks · Context of use · Positioning · Constraints · Brand commitments · Facts · Principles · Accessibility needs · Platforms and locales · Target assurance level · Surfaces

## Product summary

<!-- Required. Two or three sentences: what the product is, who it serves, and the one mechanism that makes it
different (IMP-006). Plain words, no slogans. -->

A council web service where residents book a collection of large household items and check which bin an item belongs in. [confirmed: service owner, 2026-09-20]
Unlike the phone line it replaces, it shows the next free collection dates for the resident's street before asking for any details. [inferred: product brief v2, p. 1]

## Users and groups

<!-- Required. Each group: who they are, what they are trying to do, what they already know and do not know
(walkthrough personas are built from this, METHODS §4.2), and the words they use for things. Their words feed the
product glossary in DESIGN.md (Voice and tone → Glossary). Mark the primary group. -->

| Group | Trying to | Knows | Does not know | Their words | Label |
|---|---|---|---|---|---|
| Residents booking a collection (primary) | get rid of a sofa, fridge or mattress | their address; roughly what they want taken away | collection rules, item categories, fees | "bulky waste", "pick-up", "junk" | [inferred: contact-centre call summaries, 2026-Q2] |
| Residents sorting household waste | check where one item goes | the bins they have at home | the council's sorting rules | "which bin", "recycling" | [inferred: search terms on the current site] |
| Contact-centre staff | book on behalf of callers | every rule and fee | nothing relevant | "special collection" | [confirmed: contact-centre lead, 2026-09-22] |

## Top tasks

<!-- Required. Ranked by importance to users and the service. Each has a criticality: critical, core or peripheral
(it caps finding priority, FRAMEWORK §4.5). Critical tasks get a journey file in .ui-evaluator/journeys/. -->

1. Book a collection of large items on a chosen date. Critical; journey `book-collection`. [confirmed: service owner, 2026-09-20]
2. Find which bin an item goes in. Core; journey `look-up-item`. [confirmed: service owner, 2026-09-20]
3. Change or cancel a booked collection. Core. [inferred: contact-centre call summaries]
4. Find out why an item was left behind. Peripheral. [inferred: complaints log, 2026-Q2]

## Context of use

<!-- Required. Devices, physical environment (light, noise, posture, interruptions), how often, connectivity and
assistive technology. Record the physical scene here as a fact; DESIGN.md later decides light or dark from it. -->

- Devices: mostly phones; some home and library computers. [inferred: analytics summary, 2026-Q2]
- Scene: at home or in a front garden next to the item, often in daylight, one hand busy. [inferred: contact-centre interviews]
- Frequency: once or twice a year per household; staff use it all day. [confirmed: service owner, 2026-09-20]
- Connectivity: mobile data, sometimes weak indoors. [inferred: support tickets mentioning timeouts]
- Assistive technology: screen magnification and screen readers among older residents. [inferred: accessibility complaints log]

## Positioning

<!-- Required. The category, what people use instead, and what is true and distinctive. Facts, not taglines.
Persuade surfaces lean on this most. -->

- Category: council household-waste services. [confirmed: service owner, 2026-09-20]
- Alternatives: the phone line; private clearance firms; leaving items on the street, which is illegal. [inferred: complaints log]
- Distinctive and true: collected items are reused or recycled where possible (see the facts section). [confirmed: waste contracts team, 2026-09-15]

## Constraints

<!-- Required. Technical (stack, components, browsers, performance, hosting), legal (accessibility law, privacy,
payments, records) and brand (mandated marks, typefaces or colours; how they are applied is a DESIGN.md decision). -->

- Technical: server-rendered pages on the council's web platform and its shared component library; payment on the payment provider's hosted page. [confirmed: digital team, 2026-09-18]
- Legal: public-sector accessibility regulations apply and an accessibility statement is required; collect only what the collection needs (address, a contact number, the items). [confirmed: legal team and data protection officer, 2026-09-18]
- Brand: council crest in the header; council colours and typeface come from the brand guidelines (2024). [confirmed: communications team, 2026-09-19]

## Brand commitments

<!-- Required. Durable promises about name, voice and conduct that the design must keep; not visual choices.
Include the tone referent the owner gave in setup, as input for `direct`. -->

- Plain English at a reading age of about 12; the resident is "you". [confirmed: communications team, 2026-09-19]
- No urgency tactics, countdowns, or guilt about waste. [confirmed: service owner, 2026-09-20]
- The phone line stays a full alternative and is always shown. [confirmed: service owner, 2026-09-20]
- Tone referent from the owner: the printed collection calendar posted to every household, because residents trust it. [confirmed: service owner, 2026-09-20]

## Facts

<!-- Required. Every claim the UI may make (metrics, customers, prices, dates, certifications, awards, contact
details, legal statements), with the exact wording allowed and its source. The UI may claim nothing that is not here
(P12, SLP-12). List known absences, so nobody fills a gap with an invention. -->

| Claim | Allowed wording | Source | Label |
|---|---|---|---|
| Collection fee | "£24 for up to 3 items" | Fees and charges 2026–27, p. 4 | [confirmed: finance team, 2026-09-12] |
| Booking window | "Book up to 6 weeks ahead" | Service rules v3, §2 | [confirmed: service owner, 2026-09-20] |
| Reuse | "Items in good condition go to local reuse charities" | Waste contract schedule B | [confirmed: waste contracts team, 2026-09-15] |
| Concession | "Free for households that get council tax support" | Fees and charges 2026–27, p. 5 | [inferred: needs finance confirmation] |

Explicit absences (the UI must not claim or imply these):
- No ratings, reviews or testimonials from residents exist. [confirmed: service owner, 2026-09-20]
- No published figures for tonnes collected, recycling rates or response times. [confirmed: waste contracts team, 2026-09-15]
- No accessibility conformance claim until an audit is done (QUALITY-BAR §8). [confirmed: legal team, 2026-09-18]
- No partner, sponsor or "trusted by" logos. [confirmed: communications team, 2026-09-19]

## Principles

<!-- Required. Three to five product principles that settle trade-offs. No visual recipes: "lots of white space" is
not a principle. -->

1. Show what can be collected, and when, before asking for personal details. [confirmed: service owner, 2026-09-20]
2. One booking, one fee, no surprises at payment. [confirmed: finance team, 2026-09-12]
3. Never make the phone line harder to find than the web service. [confirmed: service owner, 2026-09-20]

## Accessibility needs

<!-- Required. WCAG 2.2 AA is the floor for every product and is not restated here (P11). Record what goes beyond it:
the groups' known needs, the assistive technology to test with, the legal regime, cognitive and language needs. -->

- Legal: public-sector accessibility regulations; accessibility statement required. [confirmed: legal team, 2026-09-18]
- Many older residents use zoom of 200% or more; some use screen readers. [inferred: accessibility complaints log]
- Plain language for readers with low literacy or limited English. [confirmed: communications team, 2026-09-19]
- Test with: VoiceOver on iOS Safari, NVDA with Firefox or Chrome on Windows, 200% zoom, keyboard only. [inferred: analytics and complaints log]

## Platforms and locales

<!-- Required. Platform profile: web (default), apple, material, fluent or enterprise-zh (FRAMEWORK §12.3); browsers
and devices; each locale with its BCP 47 tag, script, direction and formats. For Chinese, choose 你 or 您 once for
the whole product, give the reason, and never mix them (PLAT-136): 你 suits tools, 您 suits formal service contexts.
DESIGN.md (Voice and tone; ui-evaluator.copy.zh_address) repeats this choice; change it here first. -->

- Platform profile: web. [confirmed: digital team, 2026-09-18]
- Browsers: current and previous major versions of Safari on iOS, Chrome, Edge and Firefox. [inferred: analytics summary, 2026-Q2]
- Locales: en-GB (default); zh-CN, Simplified Chinese, left to right, for the borough's Chinese-reading residents. [confirmed: translation service contract, 2026-08-28]
- zh-CN form of address: 您, because this is a formal public service and many readers are older; never mixed with 你. [confirmed: translation service, 2026-09-02]
- Formats: en-GB dates as 1 October 2026; zh-CN dates as 2026-10-01 with 24-hour times; prices in GBP (£24). [inferred: current site and translation style guide]

## Target assurance level

<!-- Required. L1 machine-verified · L2 panel-reviewed · L3 human-confirmed · L4 user-validated (QUALITY-BAR §3).
Defaults: L1 throwaway prototypes, L3 anything shipped to users, L4 health, finance, government and safety. Give the
reason, especially when departing from the default. .ui-evaluator/config.json mirrors the level; this file holds the reason. -->

Target level: L4. A public service every household may need, including people with low digital confidence; the government default applies. [confirmed: service owner, 2026-09-20]

## Surfaces

<!-- Required. The one place where surfaces are declared: every screen or page type, its single job and exactly one
mode: persuade, operate, read or experience (FRAMEWORK §4.1, ADR-022). The mode follows from what the visitor is doing,
not from the brand. DESIGN.md (ui-evaluator.surface_choices) adds design choices per surface id without redefining
them; .ui-evaluator/config.json routes repeat the id and mode for scoping. Change surfaces here first. -->

| Surface id | Routes | Single job | Who arrives, and why | Mode | Label |
|---|---|---|---|---|---|
| start | / | explain the service and start a booking or a look-up | residents from search or a council letter | read | [confirmed: service owner, 2026-09-20] |
| booking | /book/* | book a collection and pay | residents with an item to get rid of | operate | [confirmed: service owner, 2026-09-20] |
| item-lookup | /what-goes-where | answer "which bin?" for one item | residents holding the item | operate | [confirmed: service owner, 2026-09-20] |
| food-waste | /food-waste | persuade households to start using a food-waste caddy | residents from a leaflet QR code | persuade | [inferred: campaign brief draft] |
