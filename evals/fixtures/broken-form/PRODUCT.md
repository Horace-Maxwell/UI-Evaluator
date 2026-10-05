<!-- ui-evaluator: PRODUCT.md template v1 (FRAMEWORK §4.2, QUALITY-BAR DEC-01). Evaluation fixture: broken-form. -->
# Margins textbook exchange: product context

Read: for students buying and selling used course books on one campus; the main job is listing a book quickly between lectures; tone referent is a handwritten note pinned to the Students' Union board, friendly and brief. [confirmed: fixture brief, 2026-10-01]

Contents: Product summary · Users and groups · Top tasks · Context of use · Positioning · Constraints · Brand commitments · Facts · Principles · Accessibility needs · Platforms and locales · Target assurance level · Surfaces

## Product summary

Margins is a student-run exchange for used textbooks on one university campus. Sellers create an account, describe a book and choose a staffed handover point; buyers find books by ISBN or title and meet the seller there. [confirmed: fixture brief, 2026-10-01]
Unlike general marketplaces, every handover happens at a staffed campus point, so nobody meets a stranger off campus. [confirmed: fixture brief, 2026-10-01]

## Users and groups

| Group | Trying to | Knows | Does not know | Their words | Label |
|---|---|---|---|---|---|
| Students selling books (primary) | sell last year's course books before next term | the book's title, edition and condition | where the ISBN is printed; which handover points exist | "sell my book", "listing" | [confirmed: fixture brief, 2026-10-01] |
| Students buying books | find a cheaper copy of a set text | the module's reading list | which editions are acceptable | "second-hand", "copy" | [inferred: exchange desk volunteer notes] |
| Exchange desk volunteers | run the staffed handover points | every rule | nothing relevant | "handover", "desk" | [confirmed: fixture brief, 2026-10-01] |

## Top tasks

1. List a used textbook for sale. Critical; journey `list-a-textbook`. [confirmed: fixture brief, 2026-10-01]
2. Save a listing as a draft and finish it later. Core. [confirmed: fixture brief, 2026-10-01]
3. Change a handover point. Peripheral. [inferred: exchange desk volunteer notes]

## Context of use

- Devices: mostly phones. [inferred: exchange desk volunteer notes]
- Scene: between lectures or in the library, holding the book, often in a hurry. [inferred: exchange desk volunteer notes]
- Frequency: two or three times a year per student. [confirmed: fixture brief, 2026-10-01]
- Connectivity: campus wifi, sometimes patchy in lecture theatres. [inferred: exchange desk volunteer notes]
- Assistive technology: screen readers, magnification and password managers are all in use among students. [inferred: university disability service guidance]

## Positioning

- Category: campus second-hand marketplaces. [confirmed: fixture brief, 2026-10-01]
- Alternatives: online marketplaces, course group chats, the notice board in the Students' Union. [inferred: exchange desk volunteer notes]
- Distinctive and true: free to use, and every handover happens at a staffed campus point. [confirmed: fixture brief, 2026-10-01]

## Constraints

- Technical: static pages run by volunteers; no payments online, buyers pay in person. [confirmed: fixture brief, 2026-10-01]
- Legal: university data rules; collect only a name, a university email, a mobile number and a password. [confirmed: fixture brief, 2026-10-01]
- Brand: the Margins wordmark only. [confirmed: fixture brief, 2026-10-01]

## Brand commitments

- Plain, friendly language; the student is "you". [confirmed: fixture brief, 2026-10-01]
- Buyers never see a seller's phone number. [confirmed: fixture brief, 2026-10-01]
- Tone referent from the owner: a handwritten note on the Students' Union board, because students trust each other's notes. [confirmed: fixture brief, 2026-10-01]

## Facts

| Claim | Allowed wording | Source | Label |
|---|---|---|---|
| Price to use | "free for students" | Exchange rules, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Handover points | Library entrance; Students' Union exchange desk; Science building foyer | Exchange rules, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Staffed hours | "from 09:00 to 18:00 on weekdays" | Exchange rules, 2026 | [confirmed: fixture brief, 2026-10-01] |
| Exam weeks | "close at 16:00 on Fridays from 4 January to 29 January" | Exchange desk rota | [confirmed: fixture brief, 2026-10-01] |
| Desk location | "Students' Union, room 2.14, on weekday lunchtimes" | Exchange desk rota | [confirmed: fixture brief, 2026-10-01] |

Explicit absences (the UI must not claim or imply these):
- No figures for books sold or money saved exist. [confirmed: fixture brief, 2026-10-01]
- No buyer reviews or seller ratings. [confirmed: fixture brief, 2026-10-01]
- No partnership with the university bookshop. [confirmed: fixture brief, 2026-10-01]

## Principles

1. Ask only for what a handover needs. [confirmed: fixture brief, 2026-10-01]
2. Never lose a half-finished listing. [confirmed: fixture brief, 2026-10-01]
3. Say exactly what to fix when something is wrong. [confirmed: fixture brief, 2026-10-01]

## Accessibility needs

- WCAG 2.2 AA as the floor; the university's accessibility statement applies. [confirmed: fixture brief, 2026-10-01]
- Password managers and paste must work in every field. [confirmed: fixture brief, 2026-10-01]
- Test with: VoiceOver on iOS Safari, TalkBack on Android Chrome, keyboard only. [inferred: university disability service guidance]

## Platforms and locales

- Platform profile: web. [confirmed: fixture brief, 2026-10-01]
- Browsers: current Safari on iOS and Chrome on Android, plus desktop Chrome, Edge and Firefox. [inferred: exchange desk volunteer notes]
- Locales: en-GB only, left to right. [confirmed: fixture brief, 2026-10-01]
- Formats: prices in GBP; 24-hour times. [confirmed: fixture brief, 2026-10-01]

## Target assurance level

Target level: L3. It handles students' contact details and passwords, so the accessibility items machines cannot check need a human. [confirmed: fixture brief, 2026-10-01]

## Surfaces

| Surface id | Routes | Single job | Who arrives, and why | Mode | Primary action | Label |
|---|---|---|---|---|---|---|
| account | / | create a seller account | students selling for the first time | operate | Create account | [confirmed: fixture brief, 2026-10-01] |
| listing | /listing.html | describe the book for buyers | sellers with an account | operate | Continue | [confirmed: fixture brief, 2026-10-01] |
| handover | /handover.html | choose where to meet the buyer and publish | sellers who have described the book | operate | Publish listing | [confirmed: fixture brief, 2026-10-01] |
| listing-live | /done.html | confirm the listing is live | sellers who published | read | none | [confirmed: fixture brief, 2026-10-01] |
