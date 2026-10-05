# Content and copy

This file covers the words in the interface: the names of things, action labels, messages, empty states, links, and the voice that holds them together. It defines the content-mechanics criteria CPY-01 to CPY-04 (gate G3, craft floor) and the advisory rules CPY-05 to CPY-19. The copy tells SLP-14 and SLP-15 (gate G4) are defined in [anti-slop.md](anti-slop.md); Chinese copy conventions are in [cjk.md](cjk.md). Read this file before you write or change UI text in `build` or `fix`, when you review copy in `audit`, and when you record voice decisions in `direct`. The writing rules govern the copy you produce or change; in `audit`, the gate criteria apply to all shipped copy, and advisory rules raise findings, not silent rewrites. When `DESIGN.md` declares a brand voice, that voice sets tone and style defaults, but it never switches off a gate.

## Contents

1. [Principles](#1-principles)
2. [Rules](#2-rules): gate CPY-01 to CPY-04, advisory CPY-05 to CPY-19, word lists
3. [Decisions to make](#3-decisions-to-make)
4. [How to fix common failures](#4-how-to-fix-common-failures)
5. [CJK and localisation notes](#5-cjk-and-localisation-notes)
- [Sources](#sources)

## 1. Principles

1. **Words are part of the interface.** Copy exists to help people understand and act, so judge it like a control: does it say what will happen and what to do next? The best functional copy goes unnoticed because it simply works.
2. **Write from the user's side of the screen.** Use the nouns people use for their own things and the verbs for what they are trying to do, not the system's internal names.
3. **Fix the interface before writing around it.** If a control needs a paragraph to explain it, the control is the problem. Words that make up for unclear design add reading without adding clarity.
4. **Say less, and say it specifically.** Specific beats clever. Delete welcome text, self-praise and headings restated as sentences, then read again and delete more.
5. **Never invent facts.** Copy may only claim what the facts section in `PRODUCT.md` supports. Rewrite wording freely when you fix copy, but ask the owner before replacing factual copy such as prices, legal text, names or claims.
6. **The voice belongs to the brand; clarity does not bend.** A declared voice decides tone, case and style defaults. Accessibility and honesty rank above it, then the brief, then the defaults in this file.

## 2. Rules

Gate rules come first and repeat the QUALITY-BAR thresholds exactly; `uie gates` computes their state, and a criterion whose states were never exercised is `not_run`, never `pass`. Advisory rules (`level: advisory`) raise findings that go through normal verification and rating but never fail G3 on their own.

### CPY-01 · No placeholder text shipped
`gate G3` · `modes: all` · `status: active` · `verify: S/D (uie lint, uie audit)`

**Rule.** 0 occurrences of lorem ipsum, TODO, TBD, template braces and similar, outside visibly labelled placeholders.

**Why.** Placeholder text tells people the product is unfinished and hides what the screen is for. Mixed with real content, it leaves them unsure which parts to trust.

**Check.** `uie lint` scans string catalogues, templates and markup; `uie audit` scans the rendered text of every captured state. *Similar* covers unrendered interpolation (`{{ }}`, `${ }`, `%s`) and leaked values such as `undefined`, `null`, `NaN` and `[object Object]`.

**Fix.** Replace the text with real content from `PRODUCT.md`. Where the fact is missing, follow §3.5: write around it, make the action work without it, wire an owner-only fact through one named setting, or, as a last resort, use a visibly labelled placeholder such as `[price to confirm]` outside the first viewport. List every gap for the owner. Never fill a gap with an invented claim or identity (SLP-12, SLP-13 in [anti-slop.md](anti-slop.md)). Re-run `uie lint` and `uie audit`.

**Exceptions.** Placeholders that are visibly labelled; demonstration data labelled as sample data; matches inside `<code>` and `<pre>` in developer documentation.

**Sources.** [CRAFT-007, IMP-028, DSL-068].

### CPY-02 · Descriptive link text
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit)`

**Rule.** 0 links whose accessible name is only "click here", "here", "read more" or "learn more" without context (zh: 点击这里, 点此, 这里, 更多, 了解更多 without context). Implements WCAG 2.4.4 (Level A), so it cannot be waived.

**Why.** Assistive technology can list links by name alone, and people who scan read link text without its sentence. A bare *here* says nothing about where it goes. The same links fail WCAG 2.4.4, which belongs to G2 and cannot be waived, so do not ask the owner to waive this criterion.

**Check.** For every link in every captured state, compare the normalised accessible name with the list. Context means WCAG's programmatically determined link context: the same paragraph, list item or table cell, or an associated table header cell.

**Fix.** Rewrite the visible text to name the destination or outcome (`How bulky-waste charges work`). If the design must keep a short visible label, extend the accessible name and include the visible words in it, ideally at the start (WCAG 2.5.3). Re-run `uie audit`.

**Exceptions.** None for bare names. A *Learn more* with context passes this gate but counts towards CPY-13.

**Sources.** [PLAT-126]; WCAG 2.2 SC 2.4.4 and 2.5.3; GOV.UK links guidance.

### CPY-03 · Case consistency
`gate G3` · `modes: all` · `status: active` · `verify: D (uie audit)`

**Rule.** Case consistency: one case convention per element type (buttons, headings, navigation) across the run scope.

**Why.** Mixed case makes equal things look unequal and shows that strings were written in different places without a system.

**Check.** `uie audit` collects the rendered text of buttons, headings and navigation items after `text-transform`, classifies each multi-word string as sentence, title, upper or lower case, and fails any element type that shows more than one convention. Single-word strings, and proper nouns, product names and acronyms from the glossary, are ignored.

**Fix.** Apply the convention `DESIGN.md` declares (CPY-08 gives the default) in the string catalogue, or in the `text-transform` of the shared component style, never screen by screen. Re-run `uie audit`.

**Exceptions.** Content written by users; quotations; scripts without letter case (Chinese, Japanese, Korean).

**Sources.** [PLAT-120, CRAFT-056].

### CPY-04 · Error-message quality
`gate G3` · `modes: all` · `status: active` · `verify: I/S (uie audit, uie probe, uie lint)`

**Rule.** 0 generic, blaming or code-only messages in exercised error states: "An error occurred", "Invalid", "Oops", "Something went wrong" without a fix, "forbidden", "illegal", "you forgot", a raw error code alone; zh equivalents as listed in `cjk.md`. ("please" and "sorry" for user errors are advisory, CPY-09.)

**Why.** An error is the moment a person most needs specific help. A generic message forces guessing and blind retries, and blame gives them nothing to act on.

**Check.** Exercise error states with the forms probe in `uie audit`, the state recipes in `config.json` and `uie probe`: empty and wrongly formatted input, out-of-range values, a failed request. Read the message shown. `uie lint` scans message catalogues for the same strings; a static hit stays a candidate until its state is exercised. If no error state was exercised, the criterion is `not_run`. The zh equivalents are listed in [cjk.md](cjk.md).

**Fix.** Write one message per validation rule at the message source (the shared validation layer or the catalogue), naming the field and the fix: `Enter a date in the format DD/MM/YYYY`. Placement next to the field, focus and keeping the user's input are behaviour, specified in [components-states.md](components-states.md). Re-run the probe.

**Exceptions.** A generic opening followed by a specific fix passes this gate but still falls short of CPY-09.

**Sources.** [PLAT-094, HCI-070]; NN/g error-message guidelines; GOV.UK error message pattern.

### CPY-05 · Words from the user's side
`level: advisory` · `modes: all` · `status: active` · `verify: A (heuristic evaluator), S (uie lint)`

**Rule.** Name things by what people see, own and do, not by how the system implements them. Address the user as *you*, keep *we* out of error messages, and do not mix *my* and *your* for the same kind of thing.

**Why.** People look for their own words. A system term makes them translate before they can act: they manage notifications, not webhook configuration.

**Check.** Heuristic evaluators compare the nouns in labels, headings and navigation with the users' vocabulary from `PRODUCT.md` in their context packet and flag system terms. `uie lint` flags *we* in error strings and *my* mixed with *your* in one navigation set.

**Fix.** Change the term in the string catalogue and in the glossary together, so every screen changes at once.

**Exceptions.** Domain terms the users themselves use, such as part numbers and component standards in a bicycle-parts inventory.

**Sources.** [CRAFT-056, PLAT-123, IMP-026]; Anthropic frontend-design skill, writing section.

### CPY-06 · Action labels name the action
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint), D (uie audit)`

**Rule.** Buttons and action links start with a specific verb and name the object or outcome (`Save changes`, `Book collection`), usually in three words or fewer and short enough not to wrap at desktop widths. Destructive actions name the object and the consequence. Do not use bare `Submit`, `OK`, `Yes` or `No` as action labels: `OK` fits only a purely informational dialog, and the way out of a dialog is labelled `Cancel`.

**Why.** People choose an action from its label. A label that names the outcome lets them predict the result before acting, which is what cognitive-walkthrough question 3 asks.

**Check.** `uie lint` and `uie audit` inventory the names of buttons and action links and flag the bare labels above; evaluators check that each label predicts what happens.

**Fix.** Rewrite the label in the catalogue. In confirmation dialogs, put the action on the confirming button (`Delete part`) and keep `Cancel` beside it.

**Exceptions.** Conventions of a declared platform profile (`Done` paired with `Cancel` in Apple-style sheets); step-by-step forms that use `Continue` consistently. A page whose only calls to action are generic is SLP-15 in [anti-slop.md](anti-slop.md).

**Sources.** [PLAT-111, PLAT-092, IMP-026, DSL-052].

### CPY-07 · One name per action, one term per concept
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie probe), S (uie lint)`

**Rule.** An action keeps its verb from trigger to result: the button, its progress state and its confirmation use the same verb (`Publish`, `Publishing…`, `Published`). One intent has one label on a surface, one concept has one term across the product, and a navigation label matches the title of the page it opens.

**Why.** A changed word reads as a different action or a different object, so people cannot tell whether the thing they asked for happened.

**Check.** `uie probe` performs the action and compares the trigger's verb with the status and toast text. `uie lint` flags synonym clusters for one intent on a page (for example `Delete`, `Remove` and `Discard` for the same item) and compares navigation labels with destination titles.

**Fix.** Align the strings in the catalogue and add the term to the glossary in `DESIGN.md` (§3.3).

**Exceptions.** Grammatical forms of the same verb.

**Sources.** [CRAFT-056, PLAT-111, PLAT-125, IMP-026]; Primer content guidelines.

### CPY-08 · Sentence case by default
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit)`

**Rule.** Use sentence case for web UI text: headings, buttons, navigation, labels, menus and tabs. Use title case only under the `apple` platform profile, where native-feeling buttons and menus expect it, or when `DESIGN.md` declares it for the brand with a reason. Short uppercase labels are allowed only for functional roles that `DESIGN.md` defines, such as tags or table headers.

**Why.** Almost every system reviewed uses sentence case for web UI: Material 3, Fluent on the web, Carbon, GOV.UK, Primer, Atlassian, Shopify. In sentence case only proper nouns keep their capitals, so names stay recognisable.

**Check.** The case classifier behind CPY-03 reports the convention per element type; this rule flags title case without a declared profile or voice.

**Fix.** Change the strings at the source, and remove `text-transform: capitalize` or `uppercase` from component styles unless `DESIGN.md` declares it. Uppercase runs over 30 characters also fail TYP-08 ([typography.md](typography.md)).

**Exceptions.** Proper nouns, product names and acronyms; title-case list column headings under the `apple` profile.

**Sources.** [PLAT-120]; research note 05 conflict C1; Fluent 2 content design.

### CPY-09 · Error wording
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint), I (uie probe)`

**Rule.** Every error message says what happened and what to do next, in plain words and in the field label's own terms. Do not blame, joke or alarm, and do not apologise for errors the user made; keep apologies for serious failures the system caused, and then say what happens next. Leave out *please*, *oops*, *invalid*, *illegal*, *forbidden*, *fatal* and *you forgot*, and never show a raw code or exception text as the message. The message sits next to the problem and the user's input is kept ([components-states.md](components-states.md)).

**Why.** Specific messages let people recover without guessing. Blame, humour and alarm words give them nothing to act on.

**Check.** `uie lint` scans message catalogues for the words above and for messages that consist only of a code; evaluators exercise error states and record whether each message names the problem and the fix.

**Fix.** Write one message per validation rule (empty, wrong format, out of range, already in use), naming the field and the expected format or limit: `Choose a collection date after today`.

**Exceptions.** A support reference code may follow the plain message; it never replaces it.

**Sources.** [PLAT-094, PLAT-122, IMP-026]; NN/g error-message guidelines; GOV.UK error message and validation patterns; Primer content guidelines.

### CPY-10 · Quiet success
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint), I (uie probe)`

**Rule.** Confirm a routine completion with a plain statement that reuses the action's verb (`Collection booked`). Do not write *successfully*, do not congratulate people for routine work, do not add an exclamation mark, and do not claim more than happened (*every*, *all*, *most*). Skip the toast when the result is already visible on screen. Celebrate only a milestone the person earned.

**Why.** Routine success is the expected outcome. Treating it as an event adds noise, and frequent interruptions breed alert fatigue.

**Check.** `uie lint` flags *successfully*, congratulation words and exclamation marks in success strings; `uie probe` records which actions raise a toast whose effect is already visible.

**Fix.** Rewrite the success string, or remove the redundant toast in the component that raises it.

**Exceptions.** Long or high-stakes tasks may confirm with detail: what happens next, or a reference number.

**Sources.** [PLAT-122, PLAT-091]; Shopify voice and tone (ideas only); Semi content guidelines; Hallmark slop test; Carbon notification pattern.

### CPY-11 · Empty states lead to the next action
`level: advisory` · `modes: all` · `status: active` · `verify: I (uie audit state recipes), A (heuristic evaluator)`

**Rule.** An empty view says what will appear there and how to start, with one primary action or a pointer to the control that does it. Each kind of emptiness gets its own words: first use, no results, filtered to nothing, no permission, failed to load. Failure states stay plain, never playful.

**Why.** An empty view without a next step is a dead end, and a playful message during a failure hides that something went wrong.

**Check.** State recipes render each empty state (CMP-05 requires that they exist); evaluators record whether the text names the cause and the next step.

**Fix.** Write the copy into the variants of the shared empty-state component; its structure (image, title, action) is in [components-states.md](components-states.md). In a poetry archive, a search with no results reads `No poems match ‘harbour’` with the action `Search all collections`.

**Exceptions.** None.

**Sources.** [CRAFT-056, PLAT-093, IMP-019]; Carbon empty-states pattern; Primer blankslate.

### CPY-12 · Plain language
`level: advisory` · `modes: all` · `status: calibrating` · `verify: S (uie lint), A (heuristic evaluator)`

**Rule.** Write for a reading age of 12 to 14, about US grade 7: common words, one idea per sentence, the words people scan for at the start, active voice.

**Why.** Shopify and Primer set grade 7 as their target and Atlassian a reading age of 12 to 14. People scan, so the start of each sentence and label carries most of the meaning.

**Check.** `uie lint` estimates a reading grade on running text (help, onboarding, empty states, errors) and flags sentences that join several ideas. Flag thresholds are **[calibrating]**. The estimate is an English formula and says nothing useful about short labels, so treat it as a signal, never a verdict.

**Fix.** Split long sentences, move the outcome or the action to the start, and swap long words for common ones.

**Exceptions.** Legal text whose wording the owner fixes; domain terms recorded in `PRODUCT.md`.

**Sources.** [PLAT-121]; Shopify content (ideas only); Primer content guidelines; Atlassian accessibility (ideas only); Arco design principles; GOV.UK writing for user interfaces.

### CPY-13 · Link wording beyond the gate
`level: advisory` · `modes: all` · `status: active` · `verify: D (uie audit)`

**Rule.** Link text names the destination or outcome. Use at most one *Learn more* per screen, even when its context passes CPY-02. When a link opens a new tab, say so in the link text, and open new tabs only for a reason.

**Why.** Several *Learn more* links read as one link repeated, and a tab that opens without warning leaves the Back button with nowhere to go.

**Check.** `uie audit` counts *Learn more* links per route and state, and flags links with `target="_blank"` whose accessible name does not mention the new tab.

**Fix.** Rewrite the link text in the content source, or turn several *Learn more* links into specific ones.

**Exceptions.** None.

**Sources.** [PLAT-126]; GOV.UK links guidance; Shopify grammar and mechanics (ideas only).

### CPY-14 · Punctuation and abbreviations
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint)`

**Rule.** In UI copy, write *for example*, *that is*, the items themselves and *and* instead of *e.g.*, *i.e.*, *etc.* and *&*. Leave the full stop off labels, buttons, titles and single-sentence tooltips. Use an exclamation mark only for a greeting or a genuine celebration. Use no italic emphasis and no all-caps blocks. Use an ellipsis only for an action in progress (`Saving…`) or for truncated text, not on buttons that open a dialog. Do not use em dashes as separators in labels, buttons or headings.

**Why.** Plain words read more clearly than abbreviations, stray punctuation clutters short labels, and exclamation marks lose their meaning when routine events use them. Correct dashes in running text are good typography and are left alone.

**Check.** `uie lint` scans strings in the catalogue and markup. Em-dash density in body text is part of SLP-14 ([anti-slop.md](anti-slop.md)).

**Fix.** Edit the strings at the source.

**Exceptions.** Names that contain *&*; quoted user content; code and keyboard shortcuts; the ellipsis convention of the `apple` profile.

**Sources.** [PLAT-124]; research note 05 conflict C2; research note 07 conflict C5; Material 3 content style guide; GOV.UK A to Z style guide; Atlassian grammar (ideas only).

### CPY-15 · Contractions
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint)`

**Rule.** Positive contractions (*you're*, *it's*, *we'll*) are fine where the voice allows them. Spell out negatives (*cannot*, *do not*, *will not*) in errors, warnings, destructive confirmations, security text and legal text.

**Why.** In those messages the negation carries the meaning, so it should not hide inside a contraction. This follows GOV.UK for high-stakes text and Shopify, Material 3, Atlassian and Fluent everywhere else.

**Check.** `uie lint` flags negative contractions in strings used by error, warning, confirmation, security and legal components.

**Fix.** Rewrite the string.

**Exceptions.** A voice in `DESIGN.md` that avoids all contractions is stricter and passes.

**Sources.** Research note 05 conflict C5; GOV.UK A to Z style guide; Semi content guidelines.

### CPY-16 · Emoji in copy
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint), D (uie audit)`

**Rule.** No emoji in functional copy: labels, buttons, headings, navigation, errors and status text. Conversational surfaces, such as messages the product writes in a chat or community space, may use one at the end of a sentence, never repeated.

**Why.** Functional copy has to read the same wherever it appears. Where a pictogram helps, an icon from the product's own family does the job in one style and with an accessible name.

**Check.** `uie lint` and `uie audit` flag emoji code points inside functional elements.

**Fix.** Remove the emoji, or replace it with an icon from the product's family that has an accessible name.

**Exceptions.** Content written by users; chat products where emoji are content. Emoji used as icons are SLP-03 in [anti-slop.md](anti-slop.md).

**Sources.** [PLAT-127, CRAFT-025]; Primer content guidelines; Semi content guidelines.

### CPY-17 · No happy talk, no manuals for controls
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint), A (heuristic evaluator)`

**Rule.** Delete welcome paragraphs, self-praise, headings restated as sentences, and instruction text that explains how a control works; if copy has to explain a control, fix the control. Never point at things by colour, shape or position (`the green button`, `the menu on the left`).

**Why.** Words that make up for unclear design add reading without adding control. Instructions that rely on colour, shape or position fail people who cannot perceive them (WCAG 1.3.3).

**Check.** `uie lint` flags instruction blocks longer than one sentence and sensory or positional references. Evaluators classify text blocks as useful or happy talk, report the happy-talk share, and check that reading only the headings still conveys each page.

**Fix.** Delete. If a step still needs explanation, change the label, default or affordance, then re-run that walkthrough step.

**Exceptions.** Help and documentation pages, where explanation is the content.

**Sources.** [CRAFT-058, PLAT-128, PLAT-062]; gstack design review (after Krug); OpenAI frontend guide; GOV.UK writing for user interfaces.

### CPY-18 · Tone follows the declared voice
`level: advisory` · `modes: all` · `status: active` · `verify: A (design critic, heuristic evaluator)`

**Rule.** Copy matches the positions `DESIGN.md` declares on the four tone dimensions (§3.1) and changes tone by situation while the voice stays the same. No humour in errors, waits or failures, or in anything that touches money, privacy or loss.

**Why.** Tone changes how the same content is perceived: in NN/g's study of 50 respondents, tone variations produced significant differences in ratings such as friendliness and formality.

**Check.** Design critics rate copy against the declared positions as part of brand fit (DES-04), citing strings; evaluators flag humour in the situations listed.

**Fix.** Rewrite the strings that miss. If many strings miss, the declared positions may not suit the audience; review them with the owner.

**Exceptions.** None.

**Sources.** [CRAFT-057, CRAFT-001, PLAT-122]; NN/g tone of voice dimensions; Primer content guidelines; impeccable `delight` reference.

### CPY-19 · Words to avoid
`level: advisory` · `modes: all` · `status: active` · `verify: S (uie lint)`

**Rule.** Avoid the words and phrases in the two tables below in copy you write, and say the concrete thing instead.

**Why.** These words sound meaningful but name no action or object. The words in Table B also mark copy as templated, which is why SLP-14 treats them as a hard tell.

**Check.** `uie lint` matches both lists. Table B hits are evidence for SLP-14 (gate G4, defined in [anti-slop.md](anti-slop.md)). Table A hits are advisory and need a disposition by sense, because literal and domain uses pass.

**Fix.** Rewrite with a concrete verb and object taken from `PRODUCT.md`.

**Exceptions.** Literal and domain uses (*deploy* a build, an API *key*, keyboard *focus*, a *progress* bar); quoted customer language; product and feature names; a pattern the brief asks for, recorded in `DESIGN.md` `accepted_tells` with its reason.

**Sources.** [PLAT-121, CRAFT-024, IMP-027, DSL-053]; GOV.UK A to Z style guide (OGL); impeccable buzzword list; gstack design catalogue; taste-skill.

### Word lists for CPY-19 and SLP-14

`uie lint` reads both lists from the `words-*.json` files in `assets/data/`. A word that appears in both tables counts as Table B.

**Table A. Plain-English words to avoid** (adapted from the GOV.UK A to Z style guide). Flag figurative uses only.

| Avoid | Write instead |
|---|---|
| agenda | plan, list |
| advance, progress (as verbs) | say what changes; move on |
| collaborate, liaise | work with |
| combat, counter, tackle | stop, reduce, solve |
| commit, pledge | say what you will do |
| deliver (abstract things), deploy (people or ideas) | do, make, provide, send |
| dialogue | talk, conversation |
| disincentivise, incentivise | discourage, encourage |
| empower | let, allow, help |
| facilitate | help, run, host |
| focus (figurative), foster | say what you mean; encourage |
| impact (as a verb) | affect, change |
| initiate | start |
| key (meaning important) | main, important, or nothing |
| land (a message or a plan) | explain, agree, finish |
| leverage, utilise | use |
| overarching | overall, main |
| promote | encourage, recommend |
| robust | reliable, or name the test it passes |
| slim down, streamline | reduce, simplify |
| strengthening, transform | improving, changing (say how) |
| drive, drive out | cause, remove |
| going forward, moving forward | from now on, or nothing |
| in order to | to |
| hub | name it: page, list, centre |
| ring fencing | keep for, reserve |

*Contains public sector information licensed under the Open Government Licence v3.0.*

**Table B. AI buzzwords and stock phrases** (re-expressed from impeccable's buzzword list, Apache-2.0, with additions from gstack and taste-skill, MIT). Hits in the first four rows are SLP-14 evidence on their own; the constructions in the last row count only from 3 upwards (≥ 3 aphoristic constructions). SLP-14 also fires on ≥ 8 em dashes at ≥ 1 per 500 characters; the full definition is in [anti-slop.md](anti-slop.md).

| Kind | Patterns |
|---|---|
| Hype verbs | supercharge, unleash, unlock (the power of), harness (the power of), leverage (the power of), revolutionize, elevate, empower, streamline |
| Inflated adjectives | seamless, effortless, robust, best-in-class, world-class, enterprise-grade, next-generation, next-gen, cutting-edge, mission-critical, future-proof, game-changing |
| Theatre phrases | built for the way you work; designed for teams like yours; meet your new …; the future of …; ship faster; dismissing something as … theater |
| Empty hero lines | Welcome to …; your all-in-one solution; Build faster. Ship smarter. |
| Constructions | Not a X. A Y.; X. No Y.; X. Just Y.; not just X, it's Y |

## 3. Decisions to make

Record these in `DESIGN.md` during `direct` (from the shipped build for an existing product; see [../templates/DESIGN.md](../templates/DESIGN.md)), so that every later string follows one voice. If `PRODUCT.md` has no record of the users' own vocabulary, collect it during `setup` first.

### 3.1 Voice and tone

The voice stays the same everywhere; the tone moves with the situation. Place the voice on NN/g's four tone dimensions and write each position into `DESIGN.md` with a one-line reason. Two contrasting briefs:

| Dimension | Municipal recycling service | Language-learning flashcard app |
|---|---|---|
| Formal ↔ casual | leans formal | leans casual |
| Serious ↔ funny | serious | light humour in rewards only |
| Respectful ↔ irreverent | respectful | respectful |
| Matter-of-fact ↔ enthusiastic | matter-of-fact | enthusiastic about earned milestones |
| Why it fits | residents of every age deal with charges, deadlines and missed collections | the brief asks for encouragement during daily practice |

Then decide the tone for each situation. The examples come from several products:

| Situation | Tone | Example |
|---|---|---|
| Routine success | neutral, past tense, same verb | `Collection booked` |
| In progress | say what is happening | `Checking stock…` |
| User error | direct and specific, no apology | `Choose a collection date after today` |
| System failure | plain; say what was kept and what to do | `Booking not saved. Your details are kept. Try again in a few minutes.` |
| Destructive confirmation | serious; name the object and the consequence | `Delete this part? Its stock history is deleted too. You cannot undo this.` with `Delete part` and `Cancel` |
| First-use empty state | inviting, one action | `No appointments yet` with `Book an appointment` |
| Earned milestone | warmer; one exclamation mark allowed | `New record: 40 cards in one day!` |

### 3.2 Case, person and mechanics

- **Case per element type.** Sentence case by default (CPY-08); title case only with the `apple` profile or a declared brand reason. Record the choice per element type, because CPY-03 enforces exactly that.
- **Person.** Address the user as *you*. Decide whether the product speaks as *we* outside error messages, and pick *my* or *your* for the user's things, not both.
- **Contractions, exclamation marks, emoji.** Start from the defaults in CPY-14 to CPY-16. A voice may be stricter; it may relax them only outside errors, warnings, security and legal text.

### 3.3 Glossary

Keep one term per concept in `DESIGN.md`: the user-side noun for each object, and one verb per action with its meaning. Decide, for example, whether *remove* means deleting a record or only taking it out of a list, then use the two words accordingly. Navigation labels match destination titles. CPY-05 and CPY-07 check against this glossary.

### 3.4 What a declared voice can and cannot change

A brand voice in `DESIGN.md` wins over the defaults in this file: case (with a reason), contractions, exclamation marks in celebrations, emoji on conversational surfaces, and word choice within plain language. It cannot switch off a gate. Only the owner can waive CPY-01 to CPY-04, with a recorded reason and scope in `.ui-evaluator/waivers.json`; link purpose (WCAG 2.4.4) and honesty cannot be traded for voice at all. A listed buzzword the brand really wants (a product name, a customer's own words) goes into `DESIGN.md` `accepted_tells` with its reason, so SLP-14 reports it as requested.

### 3.5 Missing facts

Briefs leave facts out: the hall's address, the email bookings go to, a price, a teacher's name. You cannot invent them (SLP-12, SLP-13). Placeholders on show make the page look unfinished, though, and visitors cannot tell what to trust. Handle each gap in this order:

1. **Ask** the owner when you can.
2. **Write around it** when the page works without it. "The hall is on Church Street; we text you the room when you book" needs only the street. "Fees are set each term; ask at the first class" needs no price. Copy written this way is true now and stays true after the owner fills the gap.
3. **Make the action work yourself first.** A missing fact is not a missing feature. If the job needs somewhere to keep submissions and the project can run a small server, build it: store the sign-ups or bookings and give the owner a simple way to read them. Only a fact that only the owner has (the address mail goes to, a payment account, the name of the hall) becomes a setting.
4. **Wire such a fact through one named setting** when the page cannot work without it, for example the address a booking email goes to or the endpoint a form posts to. Put the setting in one obvious place (the top of the script, or the config the project already uses) and leave it empty. While it is empty, the control that needs it stays out of the page, and the page still offers a way to finish the job with what the brief does give: the booking summary to show at the door, a phone number the brief states, or a plain sentence saying how to book. The control appears once the owner fills the setting. Never ship a `mailto:` with no address (FUN-04), a form that posts nowhere, or an example address or number (`example.com`, "Jane Doe": SLP-13).
5. **Label it** (`[price to confirm]`) only when 1–4 are impossible, and keep the label out of the first viewport, the primary action and the page's headings.

In every case, list each gap in the hand-off, with the settings to fill (type 4) first. CPY-01 still applies: an unlabelled placeholder fails it wherever it appears.

## 4. How to fix common failures

Copy comes last in the fix queue's dependency order (tokens, layout and spacing, typography, colour, components and states, motion, copy), so when a finding involves both a component and its words, fix the component first. Fix strings where they are defined (the catalogue or the shared component), never by overriding text on one screen.

| Failure | Narrowest correct fix | Verify |
|---|---|---|
| One generic message (`Invalid`) shared by every field | Shared validation layer: one message per rule, naming the field and the fix | `uie probe` each error state; `uie lint` (CPY-04) |
| Error shows a raw code or exception text | Error-handling layer: map each code to a plain message; keep the code as a support reference after it | `uie probe` each failure state in the hardening fixtures (HTTP 400, 401, 403, 404, 429, 500) |
| `Click here` or a bare `Read more` | Content: rewrite the visible link text, or extend the accessible name while keeping the visible words | `uie audit` (CPY-02) |
| Title Case mixed with sentence case | Catalogue strings, or `text-transform` in the shared component style | `uie audit` (CPY-03) |
| Lorem ipsum, TODO or `{{name}}` on screen | Content source: real text from `PRODUCT.md`; for a missing fact, §3.5 (write around it, one named setting, a label only as a last resort), listed for the owner | `uie lint`, `uie audit` (CPY-01) |
| Toast says `Success!` after `Publish` | String: past tense of the trigger's verb (`Published`); drop the toast if the change is visible | `uie probe` the action (CPY-07, CPY-10) |
| Buzzwords or a generic hero line | Content: say what the product does for whom, from `PRODUCT.md`; run the swap test on the new line | `uie lint` (SLP-14) |
| A paragraph explains how to use a control | Component: fix the label, default or affordance, then delete the paragraph | re-run the walkthrough step or `uie probe` |
| Empty table shows only column headers | Component: empty-state variant with the cause and one action | state recipe in `uie audit` (CMP-05, CPY-11) |
| Sentences assembled from fragments break in translation | Catalogue: whole-sentence strings with plural rules | `uie lint`; hardening fixtures with longer text |

## 5. CJK and localisation notes

- Chinese copy conventions are in [cjk.md](cjk.md): choose 你 or 您 per product and never mix them; 「抱歉」 only for faults the system caused; canonical terms; full-width punctuation and no terminal 。 in labels; spacing between CJK and Latin text; zh date and number formats; and the zh strings that CPY-04 checks.
- CPY-03 and CPY-08 apply only to scripts with letter case. The classifier skips CJK strings.
- Reading-grade estimates (CPY-12) are English formulas. Do not run them on Chinese text; the plain-language intent still applies.
- The word lists are English-only. No openly licensed Chinese equivalent of the GOV.UK list exists; [cjk.md](cjk.md) I18N-18 keeps a short review list marked [heuristic]. Use it to prompt a human review, never as evidence for SLP-14.
- Leave room for translation: some languages need 30–40% more space than English. Write whole strings with real plural rules (ICU messages or `Intl.PluralRules`), never sentences built from fragments [IMP-048].

## Sources

Research adopt items: [CRAFT-001, CRAFT-007, CRAFT-024, CRAFT-025, CRAFT-056, CRAFT-057, CRAFT-058, PLAT-062, PLAT-091, PLAT-092, PLAT-093, PLAT-094, PLAT-111, PLAT-120, PLAT-121, PLAT-122, PLAT-123, PLAT-124, PLAT-125, PLAT-126, PLAT-127, PLAT-128, IMP-019, IMP-026, IMP-027, IMP-028, IMP-048, DSL-052, DSL-053, DSL-068, HCI-070]. Conflict rulings: research note 05 C1 (case), C2 (ellipsis), C5 (contractions), C17 (你 or 您); research note 07 C5 (em dashes); research note 02 X22 (em dashes in interface chrome).

Licences: GOV.UK text is adapted under the Open Government Licence v3.0, with the attribution under Table A. Shopify Polaris and Atlassian guidance contribute ideas only, never text. impeccable and Anthropic material is re-expressed in our words under Apache-2.0; gstack and taste-skill are MIT. NN/g and Krug are cited and paraphrased.

- NN/g, Neusesser and Sunwall, *Error-message guidelines*, 2023. https://www.nngroup.com/articles/error-message-guidelines/
- NN/g, Moran, *The four dimensions of tone of voice*, 2016. https://www.nngroup.com/articles/tone-of-voice-dimensions/
- GOV.UK Service Manual, *Writing for user interfaces*. https://www.gov.uk/service-manual/design/writing-for-user-interfaces
- GOV.UK, *A to Z style guide*. https://www.gov.uk/guidance/style-guide/a-to-z
- GOV.UK Design System, *Error message*, *Validation* and *Links*. https://design-system.service.gov.uk/
- Shopify, *App design guidelines: content, voice and tone, grammar and mechanics*, as of 2026-10. https://shopify.dev/docs/apps/design
- Atlassian Design System, *Content foundations*, as of 2026-10. https://atlassian.design/foundations/content
- GitHub Primer, *Content*. https://primer.style/product/getting-started/foundations/content
- Google, *Material 3 content design style guide*, 2026. https://m3.material.io/
- Microsoft, *Fluent 2 content design*. https://fluent2.microsoft.design/content-design
- Apple, *Human Interface Guidelines: Writing*, revised 2025-12-16. https://developer.apple.com/design/human-interface-guidelines/writing
- IBM Carbon, *Empty states* and *Notifications* patterns. https://carbondesignsystem.com/patterns/empty-states-pattern/
- Semi Design, *Content guidelines* (MIT). https://github.com/DouyinFE/semi-design
- Anthropic, *frontend-design* skill v3, 2026 (Apache-2.0). https://github.com/anthropics/skills/blob/41bbe19d1a/skills/frontend-design/SKILL.md
- impeccable, buzzword list and `clarify`/`delight` references, commit 4adabaf, 2026 (Apache-2.0). https://github.com/pbakaus/impeccable
- gstack, design catalogue and design review (MIT). https://github.com/garrytan/gstack
- taste-skill (MIT). https://github.com/Leonxlnx/taste-skill
- Hallmark slop test (MIT). https://github.com/Nutlope/hallmark
- OpenAI, *Designing delightful frontends with GPT-5.4*, undated (about 2026-03). https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4
- W3C, *WCAG 2.2*, 2024: SC 1.3.3, 2.4.4, 2.5.3. https://www.w3.org/TR/WCAG22/
