// Comment stripping for the blind copies of a build: comments can name the method ("UI-Evaluator", "per DESIGN.md"),
// so judges must not see them. The copies are for reading, never for running.

/**
 * JS comments, removed by a small scanner that skips strings, template literals and regex literals. A `/` starts a
 * regex after an operator, an opening bracket, a comma or a keyword; after a name or a closing bracket it divides.
 */
export function stripJsComments(src) {
  let out = '';
  let i = 0;
  let quote = null;
  let prev = '';
  const REGEX_BEFORE = /[(,=:[!&|?{};+\-*%~^<>]/;
  const KEYWORDS = ['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'else', 'do'];
  const word = () => {
    const m = /([A-Za-z_$][\w$]*)\s*$/.exec(out);
    return m ? m[1] : '';
  };
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') {
        out += n || '';
        i += 2;
        continue;
      }
      if (c === quote) {
        quote = null;
        prev = c;
      }
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      out += c;
      i += 1;
      continue;
    }
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && n === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? src.length : end + 2;
      continue;
    }
    if (c === '/' && (prev === '' || REGEX_BEFORE.test(prev) || KEYWORDS.includes(word()))) {
      let j = i + 1;
      let cls = false;
      while (j < src.length && src[j] !== '\n') {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '[') cls = true;
        else if (src[j] === ']') cls = false;
        else if (src[j] === '/' && !cls) break;
        j += 1;
      }
      j += 1;
      while (j < src.length && /[a-z]/i.test(src[j])) j += 1;
      out += src.slice(i, j);
      prev = '/';
      i = j;
      continue;
    }
    out += c;
    if (!/\s/.test(c)) prev = c;
    i += 1;
  }
  return out.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
}

/** Comments in HTML, CSS and JS files; other files are returned unchanged. */
export function stripComments(file, text) {
  if (/\.html?$/i.test(file)) return text.replace(/<!--[\s\S]*?-->/g, '');
  if (/\.css$/i.test(file)) return text.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\.m?js$/i.test(file)) return stripJsComments(text);
  return text;
}
