# Detector calibration labels

This folder holds human labels for calibrating the detectors (EVALUATION-PLAN §2, §7). It starts empty. The seeded fixtures in `../fixtures/` are not enough on their own, because seeded defects are cleaner than real ones (EVALUATION-PLAN §8); labels here come from real pages, both generated and hand-built.

## Labelling protocol (EVALUATION-PLAN §5.2)

1. **Pick the unit.** One item is one page state (a URL or saved page plus a state name and viewport width) and one rule ID, for example `SLP-05` on a landing page at 1280 px. Each item gets a verdict: `present`, `absent` or `unsure`, with the element (a selector or a crop) when present.
2. **Label independently.** Every item is labelled by at least two people who do not see each other's labels or any detector output for that item. Detector output anchors judgement, so it stays hidden until both labels exist.
3. **Report agreement.** Compute agreement per rule over the items both labellers saw (Krippendorff's alpha for two or more labellers; report Cohen's kappa as well for exactly two) and publish it with the counts. Taste rules are expected to agree less than measurable ones; low agreement is a finding about the rule, not a reason to drop items.
4. **Resolve disagreements in the open.** Where the labels differ, the labellers discuss the item and record the resolved verdict, both original verdicts and the reason. Items that stay unresolved are kept as `unsure` and left out of precision and recall.
5. **Score the detector against resolved labels.** For each rule, report precision, recall and F1 with counts (true positives, false positives, false negatives). A rule is promoted from soft to hard only at precision of at least 0.9 on these labels, with recall reported alongside [CRAFT-061]. A rule below the agreed precision reports its hits as "possible". Promotions and demotions are recorded as ADRs with the numbers.
6. **Publish the numbers where the rule lives.** Measured precision goes into the `precision` field of the rule in `skills/ui-evaluator/assets/data/tells.json` (or `rules.json`), with the label set and date.

## File format

One JSON Lines file per labelling round, `labels-<YYYY-MM>-<round>.jsonl`, one object per item:

```json
{"item": "lp-0412", "page": "pages/lp-0412.html", "state": "default", "width": 1280, "rule": "SLP-05", "labeller": "L2", "verdict": "present", "selector": "section:nth-of-type(2) .label", "note": "tracked caps above every section heading", "at": "2026-11-03"}
```

Resolutions go in `resolutions-<YYYY-MM>-<round>.jsonl` with `item`, `rule`, the original verdicts, the resolved verdict and the reason.

## Rules for the material

- Use pages you may store and share. Saved pages keep their licence and source URL in a `sources.csv` beside them.
- No personal data: strip names, emails and account details from saved pages before labelling, and identify labellers by code (L1, L2, …) only.
- Keep fixture products out: no page from a product used in `../fixtures/` or in the skill's own examples (AUTHORING §6).
