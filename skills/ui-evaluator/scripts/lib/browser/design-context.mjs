// What the browser checks read from DESIGN.md and PRODUCT.md: colour strategy per surface (COL-03), brand hues
// (SLP-02), spacing scale (LAY-01), declared exceptions (TYP-05, TYP-09, …), motion declarations (MOT-02/03/07),
// case conventions (CPY-03) and the facts section (SLP-12). Missing files yield empty, explicit defaults.
import { exists, readText } from '../util/fs.mjs';
import { paths } from '../project.mjs';
import { parseDesign, brandHues } from '../tokens/design.mjs';
import { productFacts, productSurfaces } from '../tokens/product.mjs';
import { sections, tables, stripComments } from '../util/markdown.mjs';
import { loadDtcgTokens } from '../tokens/dtcg.mjs';

function toPx(v, rootPx = 16) {
  if (typeof v === 'number') return v;
  const s = String(v || '').trim();
  const m = s.match(/^(-?\d*\.?\d+)\s*(px|rem|em)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === 'rem' || m[2] === 'em' ? n * rootPx : n;
}

/** Build the design context. `designText`/`productText` override the files (used by the doctor and tests). */
export function loadDesignContext(root, { designText, productText } = {}) {
  const p = root ? paths(root) : null;
  const dText = designText !== undefined ? designText : p && exists(p.design) ? readText(p.design) : null;
  const pText = productText !== undefined ? productText : p && exists(p.product) ? readText(p.product) : null;
  let design = null;
  try {
    design = dText ? parseDesign(dText) : null;
  } catch {
    design = null;
  }
  const uie = design?.uie || {};
  const fm = design?.fm || {};
  let spacing = fm.spacing && typeof fm.spacing === 'object'
    ? [...new Set(Object.values(fm.spacing).map((v) => toPx(v)).filter((v) => Number.isFinite(v) && v >= 0))].sort((a, b) => a - b)
    : null;
  // A DTCG token file is the token source of truth in some projects [TOOL-28]: its spacing tokens are the scale when
  // DESIGN.md declares none.
  let dtcg = null;
  if (root) {
    try {
      dtcg = loadDtcgTokens(root);
    } catch {
      dtcg = null;
    }
  }
  let spacingSource = spacing && spacing.length ? 'DESIGN.md' : null;
  if (!spacingSource && dtcg?.dimensions?.length) {
    const fromTokens = [...new Set(dtcg.dimensions.filter((d) => /spac|space|gap|gutter|inset/i.test(d.path)).map((d) => d.px).filter((v) => v >= 0))].sort((a, b) => a - b);
    if (fromTokens.length >= 3) {
      spacing = fromTokens;
      spacingSource = `DTCG ${dtcg.files.join(', ')}`;
    }
  }
  const exceptions = Array.isArray(uie.declared_exceptions) ? uie.declared_exceptions.filter((e) => e && e.criterion && e.reason) : [];
  const surfaceChoices = Array.isArray(uie.surface_choices) ? uie.surface_choices : [];
  let facts = { facts: [], absences: [] };
  let surfaces = [];
  try {
    if (pText) {
      facts = productFacts(pText);
      surfaces = productSurfaces(pText);
      // Optional "Primary action" column in the Surfaces table (CMP-06 primary controls).
      const sec = sections(stripComments(pText), 2).find((s) => /^surfaces$/i.test(s.title.trim()));
      const t = sec ? tables(sec.content)[0] : null;
      if (t) {
        const h = t.header.map((x) => x.toLowerCase());
        const ci = h.findIndex((x) => /primary/.test(x));
        const ii = h.findIndex((x) => /surface/.test(x));
        if (ci >= 0 && ii >= 0) {
          for (const row of t.rows) {
            const s = surfaces.find((x) => x.id === row[ii]);
            if (s && row[ci]) s.primary_action = row[ci].replace(/^["“]|["”]$/g, '').trim();
          }
        }
      }
    }
  } catch {
    /* PRODUCT.md problems are DEC-01's business */
  }
  const factsText = [
    ...facts.facts.map((f) => `${f.claim} ${f.wording}`),
    ...facts.absences,
  ].join('\n');
  return {
    hasDesign: !!design,
    hasProduct: !!pText,
    design,
    brandColors: design ? brandHues(design) : [],
    spacingScale: spacing && spacing.length ? spacing : null,
    spacingSource,
    dtcg: dtcg && dtcg.files.length ? { files: dtcg.files, colors: dtcg.colors.length, dimensions: dtcg.dimensions.length, errors: dtcg.errors.length } : null,
    exceptions,
    declared(criterion) {
      return exceptions.find((e) => String(e.criterion).toUpperCase() === criterion) || null;
    },
    strategyFor(surface, mode) {
      const s = surfaceChoices.find((x) => x && (x.id === surface || x.surface === surface));
      const declared = s && typeof s.color_strategy === 'string' && !/^</.test(s.color_strategy) ? s.color_strategy.toLowerCase() : null;
      if (declared) return { strategy: declared, declared: true };
      if (mode === 'operate' || mode === 'read') return { strategy: 'restrained', declared: false };
      return { strategy: null, declared: false };
    },
    motion: uie.motion || {},
    playful: /playful/i.test(String(uie.motion?.springs || '')),
    focalMs: Number.isFinite(Number(uie.motion?.duration_ms?.focal)) ? Number(uie.motion.duration_ms.focal) : null,
    caseConventions: uie.copy?.case || null,
    themesShipped: Array.isArray(uie.themes?.shipped) ? uie.themes.shipped : null,
    facts: facts.facts,
    factsText,
    productText: pText || '',
    surfaces,
  };
}
