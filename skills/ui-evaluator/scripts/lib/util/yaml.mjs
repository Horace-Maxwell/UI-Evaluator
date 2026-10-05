// A small YAML subset parser for DESIGN.md front matter and similar files.
// Supports: block mappings and sequences by indentation, flow mappings/sequences (also across lines),
// single- and double-quoted strings, plain scalars, numbers, booleans, null, comments.
// Not supported (and not needed here): anchors/aliases, tags, block scalars (| and >), multi-document streams.

export class YamlError extends Error {
  constructor(message, line) {
    super(line ? `line ${line}: ${message}` : message);
    this.line = line;
  }
}

function stripComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (q) {
      if (ch === '\\' && q === '"') {
        i += 1;
        continue;
      }
      if (ch === q) q = null;
      continue;
    }
    if (ch === '"' || ch === "'") q = ch;
    else if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }
  return line;
}

function bracketDelta(text) {
  let d = 0;
  let q = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (q) {
      if (ch === '\\' && q === '"') {
        i += 1;
        continue;
      }
      if (ch === q) q = null;
      continue;
    }
    if (ch === '"' || ch === "'") q = ch;
    else if (ch === '{' || ch === '[') d += 1;
    else if (ch === '}' || ch === ']') d -= 1;
  }
  return d;
}

/** Turn raw text into logical lines: comments removed, flow collections joined across lines. */
function logicalLines(text) {
  const raw = text.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  for (let i = 0; i < raw.length; i += 1) {
    let line = stripComment(raw[i]).replace(/\s+$/, '');
    if (!line.trim()) continue;
    const start = i + 1;
    let depth = bracketDelta(line);
    while (depth > 0 && i + 1 < raw.length) {
      i += 1;
      const next = stripComment(raw[i]).trim();
      line += ` ${next}`;
      depth += bracketDelta(next);
    }
    out.push({ indent: line.length - line.trimStart().length, text: line.trim(), line: start });
  }
  return out;
}

function parseScalar(s) {
  const t = s.trim();
  if (t === '' || t === '~' || t === 'null' || t === 'Null' || t === 'NULL') return null;
  if (t === 'true' || t === 'True' || t === 'TRUE') return true;
  if (t === 'false' || t === 'False' || t === 'FALSE') return false;
  if (t.startsWith('"')) {
    if (!t.endsWith('"') || t.length < 2) throw new YamlError(`unterminated string ${t}`);
    return JSON.parse(t);
  }
  if (t.startsWith("'")) {
    if (!t.endsWith("'") || t.length < 2) throw new YamlError(`unterminated string ${t}`);
    return t.slice(1, -1).replace(/''/g, "'");
  }
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) return Number(t);
  if (/^0x[0-9a-fA-F]+$/.test(t)) return Number.parseInt(t, 16);
  return t;
}

/** Parse a flow collection or scalar starting at position `i` of `s`. Returns [value, nextIndex]. */
function parseFlow(s, i = 0) {
  const ws = () => {
    while (i < s.length && /\s/.test(s[i])) i += 1;
  };
  ws();
  if (s[i] === '{') {
    i += 1;
    const obj = {};
    ws();
    if (s[i] === '}') return [obj, i + 1];
    for (;;) {
      ws();
      let key;
      if (s[i] === '"' || s[i] === "'") {
        const [k, j] = readQuoted(s, i);
        key = k;
        i = j;
      } else {
        let j = i;
        while (j < s.length && s[j] !== ':' && s[j] !== ',' && s[j] !== '}') j += 1;
        key = s.slice(i, j).trim();
        i = j;
      }
      ws();
      let value = null;
      if (s[i] === ':') {
        i += 1;
        const [v, j] = parseFlowValue(s, i, '}');
        value = v;
        i = j;
      }
      obj[key] = value;
      ws();
      if (s[i] === ',') {
        i += 1;
        continue;
      }
      if (s[i] === '}') return [obj, i + 1];
      throw new YamlError(`expected , or } in flow mapping near "${s.slice(i, i + 20)}"`);
    }
  }
  if (s[i] === '[') {
    i += 1;
    const arr = [];
    ws();
    if (s[i] === ']') return [arr, i + 1];
    for (;;) {
      const [v, j] = parseFlowValue(s, i, ']');
      arr.push(v);
      i = j;
      ws();
      if (s[i] === ',') {
        i += 1;
        continue;
      }
      if (s[i] === ']') return [arr, i + 1];
      throw new YamlError(`expected , or ] in flow sequence near "${s.slice(i, i + 20)}"`);
    }
  }
  return parseFlowValue(s, i, '');
}

function readQuoted(s, i) {
  const q = s[i];
  let j = i + 1;
  while (j < s.length) {
    if (s[j] === '\\' && q === '"') {
      j += 2;
      continue;
    }
    if (s[j] === q) {
      if (q === "'" && s[j + 1] === "'") {
        j += 2;
        continue;
      }
      break;
    }
    j += 1;
  }
  return [parseScalar(s.slice(i, j + 1)), j + 1];
}

function parseFlowValue(s, i, closer) {
  while (i < s.length && /\s/.test(s[i])) i += 1;
  if (s[i] === '{' || s[i] === '[') return parseFlow(s, i);
  if (s[i] === '"' || s[i] === "'") return readQuoted(s, i);
  let j = i;
  let depth = 0;
  while (j < s.length) {
    const ch = s[j];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (depth === 0 && (ch === ',' || (closer && ch === closer))) break;
    j += 1;
  }
  return [parseScalar(s.slice(i, j)), j];
}

/** Split "key: value" respecting quotes; returns [key, rest] or null when the line is not a mapping entry. */
function splitKey(text) {
  if (text.startsWith('"') || text.startsWith("'")) {
    const [k, j] = readQuoted(text, 0);
    const rest = text.slice(j).trimStart();
    if (!rest.startsWith(':')) return null;
    return [String(k), rest.slice(1).trim()];
  }
  const m = text.match(/^([^:{}[\],"'][^:]*?):(\s+|$)(.*)$/);
  if (!m) return null;
  return [m[1].trim(), m[3].trim()];
}

function parseValueText(rest, line) {
  if (rest === '') return undefined;
  try {
    if (rest.startsWith('{') || rest.startsWith('[')) {
      const [v, j] = parseFlow(rest, 0);
      if (rest.slice(j).trim()) throw new YamlError(`unexpected text after flow collection: "${rest.slice(j).trim()}"`);
      return v;
    }
    return parseScalar(rest);
  } catch (e) {
    throw new YamlError(e.message.replace(/^line \d+: /, ''), line);
  }
}

function parseBlock(lines, start, indent) {
  const first = lines[start];
  if (!first) return [null, start];
  if (first.text.startsWith('- ') || first.text === '-') {
    const arr = [];
    let i = start;
    while (i < lines.length && lines[i].indent === indent && (lines[i].text.startsWith('- ') || lines[i].text === '-')) {
      const item = lines[i].text === '-' ? '' : lines[i].text.slice(2).trim();
      if (item === '') {
        const [v, j] = parseBlock(lines, i + 1, lines[i + 1] ? lines[i + 1].indent : indent + 2);
        arr.push(v);
        i = j;
        continue;
      }
      const kv = item.startsWith('{') || item.startsWith('[') ? null : splitKey(item);
      if (kv) {
        // A mapping that starts on the dash line: re-indent it as a block.
        const childIndent = indent + 2;
        const synthetic = [{ indent: childIndent, text: item, line: lines[i].line }];
        let j = i + 1;
        while (j < lines.length && lines[j].indent > indent) {
          synthetic.push(lines[j]);
          j += 1;
        }
        const [obj] = parseBlock(synthetic, 0, childIndent);
        arr.push(obj);
        i = j;
        continue;
      }
      arr.push(parseValueText(item, lines[i].line));
      i += 1;
    }
    return [arr, i];
  }
  const obj = {};
  let i = start;
  while (i < lines.length && lines[i].indent === indent) {
    const ln = lines[i];
    const kv = splitKey(ln.text);
    if (!kv) throw new YamlError(`expected "key: value", got "${ln.text}"`, ln.line);
    const [key, rest] = kv;
    if (Object.prototype.hasOwnProperty.call(obj, key)) throw new YamlError(`duplicate key "${key}"`, ln.line);
    if (rest === '') {
      const next = lines[i + 1];
      if (next && next.indent > indent) {
        const [v, j] = parseBlock(lines, i + 1, next.indent);
        obj[key] = v;
        i = j;
        continue;
      }
      if (next && next.indent === indent && (next.text.startsWith('- ') || next.text === '-')) {
        const [v, j] = parseBlock(lines, i + 1, indent);
        obj[key] = v;
        i = j;
        continue;
      }
      obj[key] = null;
      i += 1;
      continue;
    }
    obj[key] = parseValueText(rest, ln.line);
    i += 1;
  }
  if (i < lines.length && lines[i].indent > indent) throw new YamlError(`unexpected indentation`, lines[i].line);
  return [obj, i];
}

/** Parse a YAML document (subset). Throws YamlError with a line number on malformed input. */
export function parseYaml(text) {
  const lines = logicalLines(text);
  if (!lines.length) return null;
  const [value, end] = parseBlock(lines, 0, lines[0].indent);
  if (end < lines.length) throw new YamlError(`could not parse from here: "${lines[end].text}"`, lines[end].line);
  return value;
}

/** Split a Markdown document into { frontMatter (string|null), body, bodyStartLine }. */
export function splitFrontMatter(text) {
  const t = text.replace(/^\uFEFF/, '');
  if (!t.startsWith('---')) return { frontMatter: null, body: t, bodyStartLine: 1 };
  const lines = t.split(/\r?\n/);
  for (let i = 1; i < lines.length; i += 1) {
    if (/^---\s*$/.test(lines[i])) {
      return { frontMatter: lines.slice(1, i).join('\n'), body: lines.slice(i + 1).join('\n'), bodyStartLine: i + 2 };
    }
  }
  return { frontMatter: null, body: t, bodyStartLine: 1 };
}
