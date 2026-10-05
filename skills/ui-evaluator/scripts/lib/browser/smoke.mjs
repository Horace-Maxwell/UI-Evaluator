// The doctor's smoke comparison (EVD-02): what each audit check reported on known-bad.html against
// assets/fixtures/known-bad.expected.json. Pure; no browser.

/**
 * Compare the smoke run with the expectations. Returns per-check rows and totals.
 * @param {Record<string,{entry:object, hits:object[]}>} results
 * @param {Record<string,{criteria:string[], owner?:string, fields?:object}>} expected
 */
export function compareSmoke(results, expected) {
  const rows = [];
  const missed = [];
  const pending = [];
  const crashed = [];
  for (const [check, exp] of Object.entries(expected)) {
    const res = results[check];
    const want = exp.criteria || [];
    const row = { check, expected: want, owner: exp.owner || null, state: res ? res.entry.state : 'absent', fired: [], missed: [], pending: [] };
    if (!res) {
      row.missed = [...want];
      row.note = 'the check did not run';
      missed.push(...want.map((c) => `${check}:${c}`));
    } else if (res.entry.state === 'skipped') {
      row.pending = [...want];
      row.note = res.entry.skip_reason || 'skipped';
      pending.push(...want.map((c) => `${check}:${c}`));
    } else if (res.entry.state === 'failed') {
      row.missed = [...want];
      row.note = (res.entry.errors || [])[0] || 'failed';
      crashed.push(check);
      missed.push(...want.map((c) => `${check}:${c}`));
    } else {
      const fired = new Set(res.hits.map((h) => h.criteria?.[0]?.id).filter(Boolean));
      row.fired = want.filter((c) => fired.has(c));
      row.missed = want.filter((c) => !fired.has(c));
      row.extra = [...fired].filter((c) => !want.includes(c)).sort();
      missed.push(...row.missed.map((c) => `${check}:${c}`));
      for (const [k, v] of Object.entries(exp.fields || {})) {
        const got = res.entry[k];
        const ok = typeof v === 'number' ? Number(got) >= v : got === v;
        if (!ok) {
          row.missed.push(`${k} ≥ ${v}`);
          missed.push(`${check}:${k}`);
        }
      }
    }
    rows.push(row);
  }
  const unexpected = Object.keys(results).filter((c) => !expected[c]);
  return { rows, missed, pending, crashed, unexpected };
}
