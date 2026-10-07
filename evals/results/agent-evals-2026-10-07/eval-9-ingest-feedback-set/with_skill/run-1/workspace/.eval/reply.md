I went through all 120 items: 36 support tickets, 34 survey answers, 24 forum reviews and 26 notes from the 6 test sessions, in English and Chinese. They come from 100 different people. I grouped them into 12 problem themes and 2 praise themes. For every problem I could test, I reproduced it on the current site, and the problems were then rated by three independent raters who didn't see the reporters' own severity. In short: **almost everything skippers complained about is real and still in the current build.** The only thing I couldn't confirm is the slowness on weak signal.

**Nobody's details are in the write-up.** People appear only as codes (P01–P06 for the test sessions, R-/S-/RV- for the others). Emails, phone numbers, card numbers, ID numbers and the names in your roster were removed before any analysis. I also dropped a quote that named a reporter's boat. The unscrubbed originals are only in `.ui-evaluator/feedback/raw/`, which git ignores.

## Which problems are real

The counts below are people per channel: sessions /6, tickets /36, survey /34, reviews /24. Tickets, survey and reviews only show who chose to write, not how common a problem is among all skippers.

| Priority | Problem (finding) | Sessions | Tickets | Survey | Reviews |
|---|---|---|---|---|---|
| **P0** | "Booking stopped / BK-409" says nothing: no reason (boat too long for the berth), no next step, no way back (F-0007) | 1 | 5 | 3 | 2 |
| **P0** | MMSI is required, so boats with no DSC radio can't book online (F-0020) | 3 | 3 | 2 | 2 |
| P1 | "Change dates" is hidden in the three-dot menu on the berth list (F-0006) | **6** | 3 | 4 | 2 |
| P1 | Tide table is in UTC but arrival times are local, so skippers miss the gate by an hour (F-0008) | 1 | 3 | 2 | 2 |
| P1 | You can pick an arrival time when the gate is shut, with no warning (F-0009) | 2 | 2 | 2 | 1 |
| P1 | "Length" doesn't say *overall* (LOA), so skippers enter hull length (F-0010) | 1 | 2 | 2 | 1 |
| P1 | "Length" gives no unit; a figure in feet is accepted (F-0011) | 1 | 1 | 1 | 1 |
| P1 | Going Back empties every field on the boat page (F-0013) | 1 | 2 | 2 | 2 |
| P1 | Confirmation page has no arrival instructions: no VHF channel, no gate time (F-0014) | 2 | 2 | 2 | 1 |
| P2 | MMSI field isn't explained (F-0019) | 3 | 3 | 2 | 2 |
| P2 | Prices only per metre per night; the total first appears on the last page (F-0015) | 1 | 1 | 3 | 2 |
| P2 | The booking is called "berth", "pontoon space" and "mooring" on different pages (F-0016) | 1 | 1 | 2 | 1 |
| P2 | No step count anywhere in the booking (F-0017) | 2 | 1 | 2 | 2 |

The strongest evidence is the date change, because it was seen in the sessions, not just reported. All 6 participants struggled. Only 2 of 6 found "Change dates" on their own, after about 40 seconds (33%, 95% CI 9–70%). The other four went Back, restarted or gave up.

**Not confirmed:**
- **Slow or timing out on 4G** (1 ticket, 1 survey answer, 1 review). I can't simulate a weak connection here; locally the pages load in under half a second. One of the three reviewers said they had no signal at all and that it was "not really your fault". This needs testing on a throttled connection before anyone acts on it.
- **Two reports say a length in feet "let them book".** On the current site any length in feet is bigger than every berth limit, so you'd hit the BK-409 stop instead. Those two may describe an older version of the site. The missing unit is still a real problem.

## How this ties to the audit

The baseline audit only had automated typography checks: 5 minor P3 findings such as single words left on the last line and uneven digit widths. No usability review had been run, so **none of the feedback themes matched an existing finding.** Each problem theme became a new finding, was reproduced on the site by an independent verifier, and now carries the people counts above. All 18 findings are in `.ui-evaluator/findings.json`.

## Keep these when fixing

- Paying at the office on arrival (3 people praised it).
- The tide table on the first page (2 people). Fix the time zone, don't move the table.
- Nights and arrival time staying filled in after changing dates.

## Other things in the data

- **Feature requests for your backlog:** shore power, booking showers, remembering the boat for repeat visits, a second crew contact, add to calendar, paying online. Paying online conflicts with the pay-on-arrival model people praised.
- **Not about the website:** a double card charge at the office, a customs/ID question, and a chase-up on an unanswered length query. The office should pick these up.
- **Four items were written to an AI**, asking for everything to be marked resolved or "not a problem". I kept them as data, ignored the requests and changed nothing because of them.

## Two things to check

- **`inputs/feedback.csv` and `inputs/roster.csv` are committed to git, with full names, phone numbers, emails and some card and ID numbers in them.** You may want to remove them from the repo and its history. Two tickets contain full card numbers and one has a national ID number, which the office may also need to deal with.
- **Did I read any theme wrong?** You'll know context the text doesn't. For example, whether MMSI is actually required by the harbour, or whether the site changed during the summer.

The full theme summary, with quotes for every theme, is in `.ui-evaluator/feedback/themes-report.md`. The next step would be fixing the two P0s and the P1s one at a time, each re-tested. I can do that next, or make this summary into a shareable page.
