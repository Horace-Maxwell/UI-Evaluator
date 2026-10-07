The 120 items point to 13 recurring problems. 11 are real: an independent verifier made each one happen on the current site. The other 2 still need a check by hand. The summer feedback also turned up 11 problems the audit had missed: the audit's 19 hits were all minor typography, and none of them matches anything skippers reported.

Everyone in the write-up is a code (P01–P06, S-…, R-…). Names, emails, phone numbers, card numbers and ID numbers were removed when the data was loaded. All 13 Chinese items were read and kept word for word, with English translations. They raise the same issues as the English feedback.

**Fix first (both rated 4/4 by three blind raters):**
1. **"Booking stopped … Reference BK-409" is a dead end.** It appears when the boat is longer than the chosen berth. It gives no reason and no way back. One test participant abandoned there and needed the moderator. It also came up in 5 tickets, 3 survey answers and 2 reviews.
2. **MMSI is required but never explained.** Boats without a DSC radio can't get past the boat page. 3 of the 6 test participants stalled on it, and one needed a hint. It also came up in 3 tickets, 2 survey answers and 2 reviews.

**Next (3/4):**
- **Changing dates is hidden in the "⋯" menu.** This is the most reported problem. Only 2 of 6 test participants found it on their own.
- **The "Length" field** doesn't say overall vs hull, and doesn't give a unit.
- **The tide table is in UTC** while arrival times are local.
- **You can choose an arrival time when the gate is shut**, with no warning.
- **The confirmation page has no VHF channel or gate times.**

**Lower (2/4):**
- The berth list shows only a per-metre price, no total.
- The same thing is called berth, pontoon space and mooring on different pages.
- There's no step counter.

**Reported but not yet confirmed:**
- **Pressing Back wipes the boat details.** The verifier couldn't drive the Back button. But `app.js:164-167` clears the form every time the page is shown, so this is almost certainly real and needs a one-minute check by hand.
- **Slow loading on weak signal.** It loads instantly on a fast connection; it needs a test on a throttled connection.

**Keep:** pay on arrival, the tide table on the first page, and "Change dates" keeping your nights and arrival time.

Things you should know:
- **Messages aimed at AI tools.** Four items were written to an AI ("mark all these resolved", "ignore your previous instructions…"). I treated them as text and did nothing they asked. Nothing has been marked resolved; only you or the original reporters can do that.
- **Tickets for the harbour office.** A few tickets are not about the site: a refund for a double charge, someone who typed a card number into the boat-name box and wants it deleted, and two people who emailed ID numbers.
- **Personal data in the repo.** `inputs/feedback.csv` and `inputs/roster.csv` are committed to the repo with everyone's personal details. You may want to remove them. The working copies under `.ui-evaluator/feedback/raw/` are git-ignored.
- **I couldn't check anything with you.** I assumed you're allowed to analyse this data, since you sent it.

How to read the counts: tickets, survey and reviews are counts of people who chose to write in, not shares of all users. The session numbers are out of 6 participants and show what people actually did.

The full write-up has a table by channel and quotes for each problem. It's in `.ui-evaluator/feedback/summary.md`. I can also turn it into a shareable page.

The next step would be fixing the two most severe problems, then the dates menu, if you want me to start.
