// uie detect — pre-flight scan (setup workflow step 1). Findings are hypotheses to confirm, not facts.
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { readJson, writeJson, exists, readText, walkFiles, relPath, listDir } from '../util/fs.mjs';
import { paths, WS_DIR } from '../project.mjs';
import { ensureDir } from '../util/fs.mjs';
import { isoNow } from '../util/time.mjs';

export const argSpec = { boolean: ['json', 'quiet'] };
export const help = `uie detect

Scans the project for: framework, styling system, token sources, component libraries, likely routes, the dev
command and port, locales, existing PRODUCT.md / DESIGN.md / agent instruction files, AI-feature hints and git
state. Writes ${WS_DIR}/preflight.json. Every result is a hypothesis for the setup workflow to confirm.`;

const FRAMEWORKS = [
  ['next', 'Next.js', 3000], ['nuxt', 'Nuxt', 3000], ['@sveltejs/kit', 'SvelteKit', 5173], ['astro', 'Astro', 4321],
  ['@remix-run/react', 'Remix', 3000], ['@angular/core', 'Angular', 4200], ['solid-js', 'Solid', 3000],
  ['gatsby', 'Gatsby', 8000], ['vue', 'Vue', 5173], ['svelte', 'Svelte', 5173], ['react', 'React', 5173],
];
const STYLING = [
  ['tailwindcss', 'Tailwind CSS'], ['styled-components', 'styled-components'], ['@emotion/react', 'Emotion'],
  ['sass', 'Sass'], ['@vanilla-extract/css', 'vanilla-extract'], ['unocss', 'UnoCSS'], ['@pandacss/dev', 'Panda CSS'],
  ['@stitches/react', 'Stitches'], ['less', 'Less'],
];
const LIBS = [
  ['@radix-ui/react-', 'Radix UI'], ['@mui/material', 'MUI'], ['antd', 'Ant Design'], ['@chakra-ui/react', 'Chakra UI'],
  ['@mantine/core', 'Mantine'], ['tdesign-', 'TDesign'], ['@arco-design/', 'Arco Design'], ['@douyinfe/semi-ui', 'Semi Design'],
  ['element-plus', 'Element Plus'], ['vuetify', 'Vuetify'], ['@headlessui/', 'Headless UI'], ['@shadcn/', 'shadcn/ui'],
  ['react-aria-components', 'React Aria'], ['@ark-ui/', 'Ark UI'], ['bootstrap', 'Bootstrap'], ['@fluentui/', 'Fluent UI'],
  ['@carbon/react', 'Carbon'], ['@primer/react', 'Primer'],
];
const AI_HINTS = ['openai', '@anthropic-ai/sdk', 'ai', '@ai-sdk/', 'langchain', '@langchain/', '@google/generative-ai', '@google/genai', 'ollama'];
// Motion and icon libraries matter for MOT-* and for SLP-24 (one icon library, one stroke).
const MOTION_LIBS = [
  ['framer-motion', 'Framer Motion'], ['motion', 'Motion'], ['gsap', 'GSAP'], ['@react-spring/', 'React Spring'],
  ['animejs', 'anime.js'], ['lottie-web', 'Lottie'], ['@lottiefiles/', 'Lottie'], ['@formkit/auto-animate', 'AutoAnimate'],
  ['react-transition-group', 'React Transition Group'], ['@vueuse/motion', 'VueUse Motion'], ['tailwindcss-animate', 'tailwindcss-animate'],
];
const ICON_LIBS = [
  ['lucide-react', 'Lucide'], ['lucide-vue-next', 'Lucide'], ['@heroicons/', 'Heroicons'], ['react-icons', 'react-icons'],
  ['@phosphor-icons/', 'Phosphor'], ['@tabler/icons', 'Tabler'], ['@radix-ui/react-icons', 'Radix Icons'],
  ['@fortawesome/', 'Font Awesome'], ['@mui/icons-material', 'Material Icons'], ['@ant-design/icons', 'Ant Design Icons'],
  ['tdesign-icons', 'TDesign Icons'], ['@iconify/', 'Iconify'], ['@remixicon/', 'Remix Icon'],
];

function deps(pkg) {
  return { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.peerDependencies || {}) };
}

/** A name ending in "/" or "-" is a scope or prefix; anything else must match exactly. */
function has(all, name) {
  const prefix = /[/-]$/.test(name);
  return Object.keys(all).some((d) => d === name || (prefix && d.startsWith(name)) || d.startsWith(`${name}/`));
}

function guessRoutes(root) {
  const routes = new Set();
  const add = (r) => routes.add(r.replace(/\/+/g, '/').replace(/\/$/, '') || '/');
  for (const base of ['app', 'src/app']) {
    const dir = path.join(root, base);
    if (!exists(dir)) continue;
    for (const f of walkFiles(dir, { exts: new Set(['.tsx', '.jsx', '.ts', '.js', '.mdx']) })) {
      if (!/\/page\.(t|j)sx?$|\/page\.mdx$/.test(f)) continue;
      const rel = path.relative(dir, path.dirname(f)).split(path.sep).filter((s) => !/^\(.*\)$/.test(s) && !s.startsWith('@'));
      add(`/${rel.join('/')}`.replace(/\[([^\]]+)\]/g, ':$1'));
    }
  }
  for (const base of ['pages', 'src/pages']) {
    const dir = path.join(root, base);
    if (!exists(dir)) continue;
    for (const f of walkFiles(dir, { exts: new Set(['.tsx', '.jsx', '.ts', '.js', '.vue', '.astro', '.md', '.mdx']) })) {
      const rel = path.relative(dir, f).replace(/\.(t|j)sx?$|\.vue$|\.astro$|\.mdx?$/, '');
      if (/^(_app|_document|_error|api\/)/.test(rel) || rel.startsWith('api/')) continue;
      add(`/${rel.replace(/(^|\/)index$/, '')}`.replace(/\[([^\]]+)\]/g, ':$1'));
    }
  }
  const sk = path.join(root, 'src/routes');
  if (exists(sk)) {
    for (const f of walkFiles(sk, { exts: new Set(['.svelte']) })) {
      if (!/\+page\.svelte$/.test(f)) continue;
      const rel = path.relative(sk, path.dirname(f)).split(path.sep).filter((s) => !/^\(.*\)$/.test(s));
      add(`/${rel.join('/')}`.replace(/\[([^\]]+)\]/g, ':$1'));
    }
  }
  const src = path.join(root, 'src');
  if (!routes.size && exists(src)) {
    for (const f of walkFiles(src, { exts: new Set(['.tsx', '.jsx', '.ts', '.js']), max: 3000 })) {
      const t = readText(f, '');
      for (const m of t.matchAll(/<Route[^>]*\spath=["'`]([^"'`]+)["'`]|\bpath:\s*["'`](\/[^"'`]*)["'`]/g)) add(m[1] || m[2]);
    }
  }
  if (!routes.size) {
    for (const f of listDir(root).filter((n) => n.endsWith('.html'))) add(f === 'index.html' ? '/' : `/${f}`);
  }
  return [...routes].filter((r) => !r.includes(':')).sort().concat([...routes].filter((r) => r.includes(':')).sort());
}

function guessLocales(root) {
  const out = new Set();
  for (const f of ['index.html', 'public/index.html', 'src/app.html', 'app/layout.tsx', 'src/app/layout.tsx']) {
    const t = readText(path.join(root, f), '');
    const m = t.match(/<html[^>]*\slang=["'{]?([A-Za-z-]+)/);
    if (m) out.add(m[1]);
  }
  for (const d of ['locales', 'src/locales', 'messages', 'src/messages', 'i18n', 'src/i18n', 'public/locales']) {
    for (const n of listDir(path.join(root, d))) {
      const tag = n.replace(/\.(json|ya?ml|ts|js)$/, '');
      if (/^[a-z]{2,3}([-_][A-Za-z]{2,4})?$/.test(tag)) out.add(tag.replace('_', '-'));
    }
  }
  return [...out];
}

function tokenSources(root) {
  const out = [];
  for (const f of ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs', 'tailwind.config.cjs', 'tokens.json', 'design-tokens.json', 'theme.json', 'components.json']) {
    if (exists(path.join(root, f))) out.push(f);
  }
  for (const f of walkFiles(root, { exts: new Set(['.css', '.scss']), max: 400 })) {
    const t = readText(f, '');
    if (/:root\s*\{[^}]*--[a-z]/i.test(t) || /@theme\s*\{/.test(t)) out.push(relPath(root, f));
    if (out.length > 20) break;
  }
  for (const f of walkFiles(root, { exts: new Set(['.json']), max: 2000 })) if (/\.tokens\.json$/.test(f)) out.push(relPath(root, f));
  return [...new Set(out)];
}

function git(root) {
  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().length > 0;
    return { repo: true, branch, clean: !dirty };
  } catch {
    return { repo: false };
  }
}

export async function run(args, ctx) {
  const root = ctx.root;
  const pkg = readJson(path.join(root, 'package.json'), null);
  const all = pkg ? deps(pkg) : {};
  const fw = FRAMEWORKS.find(([d]) => has(all, d));
  const scripts = pkg?.scripts || {};
  const startScript = ['dev', 'start', 'serve', 'preview'].find((s) => scripts[s]);
  const pm = exists(path.join(root, 'pnpm-lock.yaml')) ? 'pnpm' : exists(path.join(root, 'yarn.lock')) ? 'yarn' : exists(path.join(root, 'bun.lockb')) || exists(path.join(root, 'bun.lock')) ? 'bun' : 'npm';
  let port = fw ? fw[2] : null;
  const portFlag = startScript && String(scripts[startScript]).match(/(?:--port|-p)\s+(\d{2,5})/);
  if (portFlag) port = Number(portFlag[1]);
  const pre = {
    schema: 'preflight',
    at: isoNow(),
    root,
    package: pkg ? { name: pkg.name, version: pkg.version } : null,
    framework: fw ? fw[1] : pkg ? 'unknown' : 'static or non-JS',
    styling: STYLING.filter(([d]) => has(all, d)).map(([, n]) => n).concat(exists(path.join(root, 'postcss.config.js')) ? ['PostCSS'] : []),
    component_libraries: LIBS.filter(([d]) => has(all, d)).map(([, n]) => n).concat(exists(path.join(root, 'components.json')) ? ['shadcn/ui (components.json)'] : []),
    motion_libraries: [...new Set(MOTION_LIBS.filter(([d]) => has(all, d)).map(([, n]) => n))],
    icon_libraries: [...new Set(ICON_LIBS.filter(([d]) => has(all, d)).map(([, n]) => n))],
    token_sources: tokenSources(root),
    routes: guessRoutes(root),
    app: { start: startScript ? `${pm} run ${startScript}` : null, base_url: port ? `http://localhost:${port}` : null },
    locales: guessLocales(root),
    files: {
      'PRODUCT.md': exists(path.join(root, 'PRODUCT.md')),
      'DESIGN.md': exists(path.join(root, 'DESIGN.md')),
      'AGENTS.md': exists(path.join(root, 'AGENTS.md')),
      'CLAUDE.md': exists(path.join(root, 'CLAUDE.md')),
      [WS_DIR]: exists(path.join(root, WS_DIR)),
    },
    playwright_in_project: has(all, 'playwright') || has(all, '@playwright/test'),
    code_inspector_plugin: has(all, 'code-inspector-plugin'),
    ai_feature_hints: AI_HINTS.filter((d) => has(all, d)),
    git: git(root),
    note: 'Hypotheses from files, not facts: confirm them in the setup workflow before relying on them.',
  };
  ensureDir(paths(root).ws);
  writeJson(paths(root).preflight, pre);
  ctx.result(pre);
  ctx.print(
    `framework: ${pre.framework}${pre.styling.length ? ` · styling: ${pre.styling.join(', ')}` : ''}${pre.component_libraries.length ? ` · components: ${pre.component_libraries.join(', ')}` : ''}`,
    `start: ${pre.app.start || 'unknown'} · base URL: ${pre.app.base_url || 'unknown'}`,
    `routes (${pre.routes.length}): ${pre.routes.slice(0, 10).join(' ')}${pre.routes.length > 10 ? ' …' : ''}`,
    `locales: ${pre.locales.join(', ') || 'none found'} · token sources: ${pre.token_sources.slice(0, 5).join(', ') || 'none found'}`,
    `motion: ${pre.motion_libraries.join(', ') || 'none'} · icons: ${pre.icon_libraries.join(', ') || 'none'}${pre.icon_libraries.length > 1 ? ' (more than one icon library: SLP-24)' : ''}`,
    `PRODUCT.md ${pre.files['PRODUCT.md'] ? 'exists' : 'missing'} · DESIGN.md ${pre.files['DESIGN.md'] ? 'exists' : 'missing'} · git: ${pre.git.repo ? `${pre.git.branch}${pre.git.clean ? ', clean' : ', uncommitted changes'}` : 'not a repository'}`,
    `wrote ${path.relative(root, paths(root).preflight)}`,
  );
  return 0;
}
