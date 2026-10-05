// Krippendorff's α for units × raters data with missing values (METHODS §9.7).
// Coincidence-matrix form: α = 1 − (n − 1) · Σ o_ck δ²(c, k) / Σ n_c n_k δ²(c, k).

const METRICS = {
  nominal: () => (c, k) => (c === k ? 0 : 1),
  interval: () => (c, k) => (c - k) ** 2,
  ratio: () => (c, k) => (c + k === 0 ? 0 : ((c - k) / (c + k)) ** 2),
  // Ordinal distance uses the marginal frequencies of the values between c and k.
  ordinal: (values, nc) => {
    const idx = new Map(values.map((v, i) => [v, i]));
    return (c, k) => {
      let [a, b] = [idx.get(c), idx.get(k)];
      if (a > b) [a, b] = [b, a];
      let sum = 0;
      for (let g = a; g <= b; g += 1) sum += nc[g];
      return (sum - (nc[a] + nc[b]) / 2) ** 2;
    };
  },
};

/**
 * @param {Array<Array<number|null>>} data rows = units, columns = raters; null/undefined = missing.
 * @param {'nominal'|'ordinal'|'interval'|'ratio'} level
 * @returns {number} α, or NaN when it is undefined (fewer than two pairable values, or no variation at all).
 */
export function krippendorffAlpha(data, level = 'ordinal') {
  if (!METRICS[level]) throw new Error(`unknown level "${level}" (nominal, ordinal, interval, ratio)`);
  const units = data
    .map((row) => row.filter((v) => v !== null && v !== undefined && Number.isFinite(Number(v))).map(Number))
    .filter((vals) => vals.length >= 2);
  if (!units.length) return NaN;
  const values = [...new Set(units.flat())].sort((a, b) => a - b);
  const vi = new Map(values.map((v, i) => [v, i]));
  const V = values.length;
  const o = Array.from({ length: V }, () => new Array(V).fill(0));
  for (const vals of units) {
    const m = vals.length;
    for (let i = 0; i < m; i += 1) {
      for (let j = 0; j < m; j += 1) {
        if (i !== j) o[vi.get(vals[i])][vi.get(vals[j])] += 1 / (m - 1);
      }
    }
  }
  const nc = o.map((row) => row.reduce((a, b) => a + b, 0));
  const n = nc.reduce((a, b) => a + b, 0);
  const delta = METRICS[level](values, nc);
  let Do = 0;
  let De = 0;
  for (let c = 0; c < V; c += 1) {
    for (let k = 0; k < V; k += 1) {
      const d = delta(values[c], values[k]);
      Do += o[c][k] * d;
      De += nc[c] * nc[k] * d;
    }
  }
  if (De === 0) return NaN;
  return 1 - ((n - 1) * Do) / De;
}
