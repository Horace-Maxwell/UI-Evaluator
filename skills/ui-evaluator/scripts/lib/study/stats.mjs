// Study statistics (METHODS §9). Pure functions, no dependencies, unit-tested against published values.

export function mean(xs) {
  if (!xs.length) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Sample standard deviation (n − 1). */
export function sd(xs) {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

// --- special functions -------------------------------------------------------

/** log Γ(x) by the Lanczos approximation (g = 7, n = 9). */
export function lgamma(x) {
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  const xx = x - 1;
  let a = c[0];
  const t = xx + 7.5;
  for (let i = 1; i < 9; i += 1) a += c[i] / (xx + i);
  return 0.5 * Math.log(2 * Math.PI) + (xx + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(a, b, x) {
  const MAXIT = 300;
  const EPS = 3e-14;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Student t cumulative distribution function. */
export function tCdf(t, df) {
  const x = df / (df + t * t);
  const tail = 0.5 * ibeta(x, df / 2, 0.5);
  return t >= 0 ? 1 - tail : tail;
}

/** Inverse of the standard normal CDF (Acklam's algorithm with one Newton refinement). */
export function normalQuantile(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425;
  let q;
  let x;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - plow) {
    q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  // One step of Newton refinement using erfc.
  const e = 0.5 * erfc(-x / Math.SQRT2) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}

function erfc(x) {
  // Numerical Recipes erfc with fractional error < 1.2e-7.
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}

/** Inverse Student t CDF by bisection on tCdf (robust for all df ≥ 1). */
export function tQuantile(p, df) {
  if (!(df > 0)) return NaN;
  if (p === 0.5) return 0;
  let lo = -1e3;
  let hi = 1e3;
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2;
    if (tCdf(mid, df) < p) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-10) break;
  }
  return (lo + hi) / 2;
}

function gser(a, x) {
  let sum = 1 / a;
  let del = sum;
  let ap = a;
  for (let n = 0; n < 500; n += 1) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * 1e-15) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
}

function gcf(a, x) {
  const FPMIN = 1e-300;
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 500; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

/** Regularized lower incomplete gamma P(a, x). */
export function gammaP(a, x) {
  if (x <= 0) return 0;
  return x < a + 1 ? gser(a, x) : 1 - gcf(a, x);
}

/** Upper tail of the chi-square distribution: P(X ≥ x) with k degrees of freedom. */
export function chiSquareSurvival(x, k) {
  return 1 - gammaP(k / 2, x / 2);
}

// --- confidence intervals ----------------------------------------------------------

const zFor = (conf) => normalQuantile(1 - (1 - conf) / 2);

/** Adjusted-Wald interval for a completion rate (Sauro & Lewis). */
export function adjustedWald(x, n, conf = 0.95) {
  if (!(n > 0) || x < 0 || x > n) throw new Error('need 0 ≤ successes ≤ n and n > 0');
  const z = zFor(conf);
  const pAdj = (x + (z * z) / 2) / (n + z * z);
  const margin = z * Math.sqrt((pAdj * (1 - pAdj)) / (n + z * z));
  return { x, n, p: x / n, p_adj: pAdj, low: Math.max(0, pAdj - margin), high: Math.min(1, pAdj + margin), conf };
}

/** t-interval for a mean. */
export function meanCI(xs, conf = 0.95) {
  const n = xs.length;
  const m = mean(xs);
  if (n < 2) return { n, mean: m, sd: NaN, low: NaN, high: NaN, conf };
  const s = sd(xs);
  const t = tQuantile(1 - (1 - conf) / 2, n - 1);
  const h = (t * s) / Math.sqrt(n);
  return { n, mean: m, sd: s, low: m - h, high: m + h, conf };
}

/** Geometric mean of positive times with a CI computed on log times (METHODS §9.1). */
export function geometricMeanCI(times, conf = 0.95) {
  const pos = times.filter((t) => t > 0);
  if (pos.length !== times.length) throw new Error('times must all be positive');
  const logs = pos.map(Math.log);
  const ci = meanCI(logs, conf);
  return { n: pos.length, geometric_mean: Math.exp(ci.mean), low: Math.exp(ci.low), high: Math.exp(ci.high), conf };
}

// --- questionnaires ----------------------------------------------------------------

/** SUS score for one respondent: ten answers on 1–5, in questionnaire order. */
export function susScore(answers) {
  if (!Array.isArray(answers) || answers.length !== 10) throw new Error('SUS needs exactly 10 answers');
  let sum = 0;
  answers.forEach((v, i) => {
    const a = Number(v);
    if (!(a >= 1 && a <= 5)) throw new Error(`SUS answer ${i + 1} must be 1–5, got ${v}`);
    sum += i % 2 === 0 ? a - 1 : 5 - a;
  });
  return sum * 2.5;
}

const SUS_GRADES = [
  [84.1, 'A+'], [80.8, 'A'], [78.9, 'A-'], [77.2, 'B+'], [74.1, 'B'], [72.6, 'B-'],
  [71.1, 'C+'], [65.0, 'C'], [62.7, 'C-'], [51.7, 'D'], [-Infinity, 'F'],
];

/** Sauro–Lewis curved grading scale. */
export function susGrade(score) {
  for (const [min, g] of SUS_GRADES) if (score >= min) return g;
  return 'F';
}

/** UMUX-Lite (two 7-point items) → raw 0–100 and SUS-equivalent. */
export function umuxLite(i1, i2) {
  const a = Number(i1);
  const b = Number(i2);
  if (!(a >= 1 && a <= 7 && b >= 1 && b <= 7)) throw new Error('UMUX-Lite items must be 1–7');
  const raw = ((a + b - 2) * 100) / 12;
  return { raw, sus_equivalent: 0.65 * raw + 22.9 };
}

/** NASA-TLX: raw = mean of six 0–100 ratings; weighted = Σ(rating × weight) / 15 with weights summing to 15. */
export function tlx(ratings, weights) {
  if (!Array.isArray(ratings) || ratings.length !== 6) throw new Error('NASA-TLX needs 6 ratings');
  ratings.forEach((r) => {
    if (!(r >= 0 && r <= 100)) throw new Error('TLX ratings must be 0–100');
  });
  const raw = mean(ratings.map(Number));
  if (!weights) return { raw, weighted: null, kind: 'raw' };
  if (weights.length !== 6) throw new Error('NASA-TLX needs 6 weights');
  const total = weights.reduce((a, b) => a + Number(b), 0);
  if (total !== 15) throw new Error(`TLX weights must sum to 15 (got ${total})`);
  const weighted = ratings.reduce((a, r, i) => a + Number(r) * Number(weights[i]), 0) / 15;
  return { raw, weighted, kind: 'weighted' };
}

// --- planning ------------------------------------------------------------------------

/** n for a proportion with margin of error E (default p = 0.5, 95%). */
export function sampleSizeProportion(E, { p = 0.5, conf = 0.95 } = {}) {
  if (!(E > 0 && E < 1)) throw new Error('margin must be between 0 and 1');
  const z = zFor(conf);
  return Math.ceil((z * z * p * (1 - p)) / (E * E));
}

/** Probability that a problem with per-session rate p is seen at least once in n sessions. */
export function discoveryProbability(p, n) {
  return 1 - (1 - p) ** n;
}

/** Sessions needed to see a problem of rate p with probability P. */
export function sessionsNeeded(p, P) {
  if (!(p > 0 && p < 1) || !(P > 0 && P < 1)) throw new Error('p and P must be between 0 and 1');
  return Math.ceil(Math.log(1 - P) / Math.log(1 - p));
}

/**
 * A/B sample size per variant (Kohavi): n ≈ 16σ²/Δ² (power 0.8) or 21σ²/Δ² (power 0.9).
 * For proportions pass { baseline } (σ² = p(1 − p)); for means pass { sd }.
 */
export function abSampleSize({ baseline, sd: sigma, delta, power = 0.8 }) {
  if (!(delta > 0)) throw new Error('delta (minimum detectable absolute effect) must be > 0');
  const k = power >= 0.9 ? 21 : 16;
  let variance;
  if (baseline !== undefined) {
    if (!(baseline > 0 && baseline < 1)) throw new Error('baseline rate must be between 0 and 1');
    variance = baseline * (1 - baseline);
  } else if (sigma !== undefined) variance = sigma * sigma;
  else throw new Error('give baseline (proportion) or sd (mean)');
  return { per_variant: Math.ceil((k * variance) / (delta * delta)), multiplier: k, variance };
}

/** Sample-ratio-mismatch check: χ² goodness of fit of observed counts vs planned ratios. */
export function srm(observed, ratios, threshold = 0.001) {
  if (observed.length !== ratios.length || observed.length < 2) throw new Error('need ≥ 2 groups with matching ratios');
  const total = observed.reduce((a, b) => a + b, 0);
  const rsum = ratios.reduce((a, b) => a + b, 0);
  const expected = ratios.map((r) => (total * r) / rsum);
  const chi2 = observed.reduce((a, o, i) => a + (o - expected[i]) ** 2 / expected[i], 0);
  const df = observed.length - 1;
  const p = chiSquareSurvival(chi2, df);
  return { chi2, df, p, expected, mismatch: p < threshold, threshold };
}

/** Desirability: share of participants choosing ≥ 1 on-brand word, with an adjusted-Wald CI. */
export function desirability(k, n, conf = 0.95) {
  const ci = adjustedWald(k, n, conf);
  return { share: k / n, low: ci.low, high: ci.high, k, n, conf };
}

// --- inspector statistics -------------------------------------------------------------

/** Mean pairwise Jaccard similarity between sets (any-two agreement). */
export function anyTwoAgreement(sets) {
  const arr = sets.map((s) => (s instanceof Set ? s : new Set(s)));
  if (arr.length < 2) return { pairs: 0, mean: NaN };
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < arr.length; i += 1) {
    for (let j = i + 1; j < arr.length; j += 1) {
      const inter = [...arr[i]].filter((x) => arr[j].has(x)).length;
      const union = new Set([...arr[i], ...arr[j]]).size;
      sum += union ? inter / union : 1;
      pairs += 1;
    }
  }
  return { pairs, mean: sum / pairs };
}

/**
 * Discovery-rate estimate (METHODS §9.6): λ = Σk / (N·F); estimated total = F / (1 − (1 − λ)^N).
 * `counts` lists, for each unique problem, how many of the N passes found it. Optimistic for small N.
 */
export function discoveryEstimate(counts, N) {
  const F = counts.length;
  if (!F || !(N > 0)) return { found: F, passes: N, lambda: NaN, estimated_total: NaN };
  const lambda = counts.reduce((a, b) => a + b, 0) / (N * F);
  const coverage = 1 - (1 - lambda) ** N;
  return { found: F, passes: N, lambda, coverage, estimated_total: F / coverage, label: 'estimate (optimistic with few passes)' };
}
