// The machine-readable data files agree with their schemas and with the knowledge files they twin (the knowledge
// file is the source of truth, AUTHORING §11): tells.json ↔ anti-slop.md, rules.json ↔ tells.json, wcag22.json ↔
// accessibility.md §6, word lists ↔ content-copy.md, saturated-faces.json ↔ anti-slop.md §6.2, heuristics.json ↔
// heuristics.md, ai-features.md and cognitive-walkthrough.md, reaction-cards.json ↔ surveys-metrics.md §3.10.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { validate, loadSchema } from '../../skills/ui-evaluator/scripts/lib/schema.mjs';
import { REPO } from './helpers.mjs';

const SKILL = path.join(REPO, 'skills/ui-evaluator');
const DATA = path.join(SKILL, 'assets/data');
const KNOW = path.join(SKILL, 'references/knowledge');
const read = (p) => fs.readFileSync(p, 'utf8');
const data = (name) => JSON.parse(read(path.join(DATA, `${name}.json`)));
const OWNED = ['tells', 'words-en', 'words-zh', 'saturated-faces', 'wcag22', 'heuristics', 'reaction-cards'];

test('every data file with a schema validates against it (all seven lint data files have one)', () => {
  for (const name of OWNED) assert.ok(fs.existsSync(path.join(SKILL, `assets/schemas/${name}.schema.json`)), `schema for ${name}`);
  for (const f of fs.readdirSync(DATA).filter((n) => n.endsWith('.json'))) {
    const name = f.replace(/\.json$/, '');
    if (!fs.existsSync(path.join(SKILL, `assets/schemas/${name}.schema.json`))) continue;
    const res = validate(loadSchema(name), data(name));
    assert.ok(res.valid, `${f}: ${JSON.stringify(res.errors.slice(0, 5))}`);
  }
});

// ---- tells.json ↔ anti-slop.md ----------------------------------------------------------------------------

function catalogue() {
  const md = read(path.join(KNOW, 'anti-slop.md'));
  const cat = {};
  const rec = /^### (SLP-\d{2}) · (.+)\n`G4 (hard|soft)` · `layer: ([^`]+)` · `rel: ([^`]+)` · `audience: ([^`]+)` · `status: ([^`]+)` · `first_seen: ([^`]+)`/gm;
  let m;
  while ((m = rec.exec(md))) cat[m[1]] = { title: m[2], class: m[3], layers: m[4].split(/,\s*/), rel: m[5], audience: m[6], status: m[7], first_seen: m[8] };
  for (const line of md.split('\n')) {
    const c = line.split('|').map((x) => x.trim());
    if (!/^SLP-\d{2}$/.test(c[1] || '')) continue;
    cat[c[1]] = { class: Number(c[1].slice(4)) >= 50 ? 'experimental' : 'soft', rel: c[5], status: c[6] };
  }
  return cat;
}

test('tells.json and the anti-slop.md catalogue list the same 58 tells with the same class, status and reliability', () => {
  const cat = catalogue();
  const tells = data('tells').tells;
  const ids = Object.keys(cat).sort();
  assert.equal(ids.length, 58);
  assert.deepEqual(Object.keys(tells).sort(), ids, 'every catalogue entry SLP-01…65 is in tells.json and nothing else');
  assert.equal(data('tells').count, ids.length);
  const relOf = (r) => (/unrated/.test(r) ? null : (r.match(/^([SMW])/) || [])[1] || null);
  for (const id of ids) {
    const c = cat[id];
    const t = tells[id];
    assert.equal(t.id, id);
    assert.equal(t.class, c.class, `${id} class`);
    assert.equal(t.status, c.status.split(/\s/)[0].replace(/[^a-z]/g, ''), `${id} status`);
    assert.equal(t.reliability, relOf(c.rel), `${id} reliability`);
    const n = Number(id.slice(4));
    assert.equal(t.class, n <= 19 ? 'hard' : n <= 49 ? 'soft' : 'experimental', `${id} ID band (AUTHORING §3)`);
    if (c.layers) assert.deepEqual(t.detect.layers, c.layers, `${id} layers`);
    if (c.first_seen) assert.equal(t.first_seen, c.first_seen, `${id} first_seen`);
    if (c.audience) assert.equal(t.audience, (c.audience.match(/^(P\d)/) || [])[1] || null, `${id} audience`);
  }
});

test('tells.json G4 counting follows ADR-031: hard and active or rising soft tells count, experimental never', () => {
  for (const [id, t] of Object.entries(data('tells').tells)) {
    const want = t.class === 'hard' ? true : t.class === 'soft' ? ['active', 'rising'].includes(t.status) : false;
    assert.equal(t.counts_toward_g4, want, id);
    assert.equal(t.acceptable_via_brief, !['SLP-12', 'SLP-13'].includes(id), `${id} acceptable_via_brief`);
    assert.equal(t.gate, 'G4');
  }
});

test('rules.json and tells.json agree on every tell both define (class, gate, severity, brief acceptance)', () => {
  const rules = data('rules').rules;
  const tells = data('tells').tells;
  const shared = Object.keys(rules).filter((id) => id.startsWith('SLP-'));
  assert.ok(shared.length >= 22, 'QUALITY-BAR lists SLP-01…15 and SLP-20…26');
  for (const id of shared) {
    assert.ok(tells[id], `${id} in tells.json`);
    assert.equal(rules[id].class, tells[id].class, `${id} class`);
    assert.equal(rules[id].gate, tells[id].gate, `${id} gate`);
    assert.equal(rules[id].default_severity, tells[id].default_severity, `${id} default_severity`);
    assert.equal(rules[id].acceptable_via_brief, tells[id].acceptable_via_brief, `${id} acceptable_via_brief`);
  }
  for (const id of shared.filter((x) => tells[x].class === 'hard')) assert.equal(tells[id].statement, rules[id].threshold.replace(/\*\*/g, '').replace(/`/g, ''), `${id} statement is the QUALITY-BAR detection summary`);
});

test('the detector parameters lint reads equal the QUALITY-BAR and catalogue thresholds', () => {
  const t = data('tells').tells;
  assert.deepEqual(t['SLP-02'].detect.params.oklch.hue_deg, [260, 310]);
  assert.equal(t['SLP-02'].detect.params.oklch.chroma_min, 0.1);
  assert.deepEqual(t['SLP-02'].detect.params.oklch.lightness, [0.25, 0.85]);
  assert.deepEqual(t['SLP-02'].detect.params.hsl, { hue_deg: [250, 310], saturation_gt: 0.25, lightness_gt: 0.15, lightness_lt: 0.85 });
  assert.equal(t['SLP-04'].detect.params.side_min_px, 3);
  assert.equal(t['SLP-04'].detect.params.side_min_px_rounded, 2);
  assert.equal(t['SLP-04'].detect.params.ratio_to_other_sides, 2);
  assert.equal(t['SLP-08'].detect.params.cie_lch_chroma_min, 30);
  assert.equal(t['SLP-08'].detect.params.blur_gt_px, 4);
  assert.equal(t['SLP-09'].detect.params.min_sections, 3);
  assert.equal(t['SLP-14'].detect.params.aphorism_min, 3);
  assert.deepEqual({ count_min: t['SLP-14'].detect.params.em_dash.count_min, per_chars: t['SLP-14'].detect.params.em_dash.per_chars }, { count_min: 8, per_chars: 500 });
  assert.equal(t['SLP-23'].detect.params.share_gt, 0.8);
  assert.equal(t['SLP-23'].detect.params.radius_min_px, 16);
  assert.equal(t['SLP-26'].detect.params.hover_property_changes_gt, 1);
  assert.equal(t['SLP-34'].detect.params.glass_containers_gt, 1);
});

// ---- wcag22.json ↔ accessibility.md §6 ---------------------------------------------------------------------

test('wcag22.json has exactly 55 success criteria (31 A + 24 AA), no 4.1.1, matching accessibility.md §6', () => {
  const w = data('wcag22');
  const scs = w.criteria.map((c) => c.sc);
  assert.equal(w.criteria.length, 55);
  assert.equal(new Set(scs).size, 55);
  assert.equal(w.criteria.filter((c) => c.level === 'A').length, 31);
  assert.equal(w.criteria.filter((c) => c.level === 'AA').length, 24);
  assert.ok(!scs.includes('4.1.1'), 'SC 4.1.1 is obsolete in WCAG 2.2');
  const rows = read(path.join(KNOW, 'accessibility.md')).split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((c) => /^\d\.\d+\.\d+$/.test(c[1] || ''));
  assert.equal(rows.length, 55);
  for (const c of rows) {
    const d = w.criteria.find((x) => x.sc === c[1]);
    assert.ok(d, `${c[1]} in wcag22.json`);
    assert.equal(d.level, c[2], `${c[1]} level`);
    // "— (A11Y-26 advisory)": an advisory rule named beside the dash is not a gate criterion.
    const gates = (c[5].replace(/\([^)]*advisory[^)]*\)/g, '').match(/A11Y-\d{2}|CPY-\d{2}/g) || []).sort();
    assert.deepEqual([...d.criteria].sort(), gates, `${c[1]} gate criteria`);
  }
});

// ---- word lists ↔ content-copy.md ---------------------------------------------------------------------------

test('every word-list pattern compiles, and Table B of content-copy.md is in the buzzword, theatre and hero lists', () => {
  for (const lang of ['en', 'zh']) {
    const file = data(`words-${lang}`);
    for (const [name, list] of Object.entries(file.lists)) {
      for (const e of list.entries) {
        if (!e.pattern) continue;
        let flags = e.flags || list.flags || 'iu';
        if (!flags.includes('u')) flags += 'u';
        assert.doesNotThrow(() => new RegExp(e.pattern, flags), `${lang}.${name}: ${e.pattern}`);
        if (e.literal_after) assert.doesNotThrow(() => new RegExp(e.literal_after, 'iu'));
      }
    }
  }
  const en = data('words-en').lists;
  const all = (name) => en[name].entries.map((e) => new RegExp(e.pattern, (e.flags || en[name].flags || 'iu').includes('u') ? e.flags || en[name].flags || 'iu' : `${e.flags || en[name].flags || 'i'}u`));
  const hits = (name, s) => all(name).some((re) => re.test(s));
  for (const w of ['supercharge', 'unleash', 'unlock the power of', 'harness the power of', 'leverage', 'revolutionize', 'elevate', 'empower', 'streamline', 'seamless', 'effortless', 'robust', 'best-in-class', 'world-class', 'enterprise-grade', 'next-generation', 'next-gen', 'cutting-edge', 'mission-critical', 'future-proof', 'game-changing']) assert.ok(hits('ai_buzzwords', w), `Table B: ${w}`);
  for (const w of ['built for the way you work', 'designed for teams like yours', 'meet your new planner', 'the future of invoicing', 'ship faster']) assert.ok(hits('theatre_phrases', w), `Table B theatre: ${w}`);
  for (const w of ['Welcome to Nimbus', 'your all-in-one solution', 'Build faster. Ship smarter.']) assert.ok(hits('generic_hero_phrases', w), `Table B hero: ${w}`);
  for (const w of ['One app. No limits.', 'No setup. Just results.', 'Not a template. A system you own.', "Not just a planner, it's a habit", "It isn't just a tool — it's a partner", "It's not about speed, it's about focus"]) assert.ok(hits('aphorism_patterns', w), `Table B construction: ${w}`);
  const tableA = en.gov_uk_words_to_avoid.entries.map((e) => e.word);
  for (const w of ['agenda', 'collaborate', 'facilitate', 'leverage', 'utilise', 'robust', 'streamline', 'in order to', 'going forward', 'ring fencing']) assert.ok(tableA.some((x) => x.startsWith(w)), `Table A: ${w}`);
  for (const e of en.gov_uk_words_to_avoid.entries.filter((x) => x.also_table_b)) assert.ok(hits('ai_buzzwords', e.word.split(' (')[0]), `${e.word} is in both tables and counts as Table B`);
});

test('saturated-faces.json lists every face named in anti-slop.md §6.2', () => {
  const md = read(path.join(KNOW, 'anti-slop.md'));
  const section = md.slice(md.indexOf('### 6.2 Faces'), md.indexOf('## 7.'));
  const faces = data('saturated-faces').faces.map((f) => f.name.toLowerCase());
  const named = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Arial', 'Helvetica', 'system-ui', 'Geist', 'Space Grotesk', 'Space Mono', 'Instrument Serif', 'Instrument Sans', 'Fraunces', 'Syne', 'Sora', 'Bricolage Grotesque', 'Young Serif', 'Recoleta', 'Bodoni', 'Playfair Display', 'Newsreader', 'Cormorant', 'Lora', 'Crimson', 'DM Sans', 'DM Serif', 'Outfit', 'Plus Jakarta Sans', 'IBM Plex', 'Mona Sans', 'Geist Sans', 'Geist Mono', 'Georgia', 'JetBrains Mono', 'Satoshi'];
  for (const f of named) {
    assert.ok(section.includes(f), `${f} is named in §6.2`);
    assert.ok(faces.includes(f.toLowerCase()), `${f} in saturated-faces.json`);
  }
  assert.equal(faces.length, named.length);
});

test('heuristics.json matches heuristics.md (H1–H10), ISO 9241-110, CW-Q1…Q4 and HAX-G1…G18', () => {
  const h = data('heuristics');
  const md = read(path.join(KNOW, 'heuristics.md'));
  const names = [...md.matchAll(/^### (H\d+) · (.+)$/gm)].map((m) => [m[1], m[2].trim()]);
  assert.deepEqual(h.nielsen.map((x) => [x.id, x.name]), names);
  assert.deepEqual(h.iso_9241_110.map((x) => x.id), ['ISO-1', 'ISO-2', 'ISO-3', 'ISO-4', 'ISO-5', 'ISO-6', 'ISO-7']);
  assert.deepEqual(h.cw_questions.map((x) => x.id), ['CW-Q1', 'CW-Q2', 'CW-Q3', 'CW-Q4']);
  assert.equal(h.hax.length, 18);
  const ai = read(path.join(KNOW, 'ai-features.md'));
  for (const g of h.hax) assert.ok(new RegExp(`^\\| ${g.id} \\| ${g.guideline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\|`, 'm').test(ai), `${g.id} ${g.guideline} in ai-features.md`);
});

test('reaction-cards.json is the surveys-metrics.md §3.10 starter list: 25 words, 10 negative', () => {
  const r = data('reaction-cards');
  const md = read(path.join(SKILL, 'references/methods/surveys-metrics.md'));
  const row = md.split('\n').find((l) => /^\| clear, effortless/.test(l));
  const [pos, neg] = row.split('|').slice(1, 3).map((c) => c.split(',').map((w) => w.trim()));
  assert.deepEqual(r.words.filter((w) => w.polarity !== 'negative').map((w) => w.word).sort(), [...pos].sort());
  assert.deepEqual(r.words.filter((w) => w.polarity === 'negative').map((w) => w.word).sort(), [...neg].sort());
  assert.equal(r.target.size, 25);
  assert.equal(r.target.negative_share, 0.4);
});
