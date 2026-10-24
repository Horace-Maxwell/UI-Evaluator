// uie wait — wait inside the turn for the output files of subagents running in the background. A lead that ends its
// turn to wait ends a non-interactive session after ten minutes (round 6: two of three leads ended their turn 20
// times while subagents ran); a shell loop written for the purpose is often refused by the sandbox.
import fs from 'node:fs';
import path from 'node:path';
import { intOpt, UsageError } from '../util/args.mjs';

export const argSpec = { boolean: ['json', 'quiet'] };
export const help = `uie wait <output file>... [--timeout <seconds>] [--every <seconds>]

Waits until every named file exists and is complete (a .json file has to parse, and a file a packet names has to be
newer than that packet): the output paths \`uie packet\` printed for the subagents you started. Prints each one as it
arrives. Exit 0 when all have arrived; exit 2 at the timeout with the ones still missing. Then run it again for
those, and keep your turn. The default timeout, 110 seconds, fits a shell tool's two-minute default; give the tool
call a longer timeout and pass --timeout up to 540 to wait longer per call. A subagent that ended without writing
its file never arrives: read its reply. Paths are relative to the project root unless absolute.`;

/** When the latest packet that names this file as its output was built, from the run's packets/.log.json. */
export function packetBuiltAt(file) {
  let dir = path.dirname(file);
  for (let up = 0; up < 4; up += 1) {
    const log = path.join(dir, 'packets', '.log.json');
    if (fs.existsSync(log)) {
      let entries = [];
      try {
        entries = JSON.parse(fs.readFileSync(log, 'utf8')).packets || [];
      } catch {
        return null;
      }
      const times = entries.filter((e) => e.output && path.resolve(e.output) === file).map((e) => Date.parse(e.at)).filter(Number.isFinite);
      return times.length ? Math.max(...times) : null;
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * A file has arrived when it exists, is not empty and, for JSON, parses (a subagent may still be writing it). A file
 * that a packet names must also be newer than that packet: an earlier pass's output is not this pass's.
 */
export function arrived(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return false;
  }
  const built = packetBuiltAt(file);
  if (built !== null && fs.statSync(file).mtimeMs < built - 1000) return false;
  if (!text.trim()) return false;
  if (!/\.json$/i.test(file)) return true;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export async function run(args, ctx) {
  const files = args._.map(String);
  if (!files.length) throw new UsageError('name the output files to wait for (the paths `uie packet` printed)');
  const timeout = args.timeout !== undefined ? intOpt(args.timeout, 'timeout', { min: 1, max: 590 }) : 110;
  const every = args.every !== undefined ? intOpt(args.every, 'every', { min: 1, max: 60 }) : 5;
  const start = Date.now();
  const waiting = new Map(files.map((f) => [f, path.resolve(ctx.root, f)]));
  const done = [];
  const elapsed = () => Math.round((Date.now() - start) / 1000);
  const left = () => timeout * 1000 - (Date.now() - start);
  for (;;) {
    for (const [name, abs] of waiting) {
      if (!arrived(abs)) continue;
      waiting.delete(name);
      done.push(name);
      ctx.info(`arrived after ${elapsed()} s: ${name}`);
    }
    if (!waiting.size || left() <= 0) break;
    await new Promise((resolve) => setTimeout(resolve, Math.min(every * 1000, left())));
  }
  const missing = [...waiting.keys()];
  ctx.result({ arrived: done, missing, seconds: elapsed() });
  if (!missing.length) {
    ctx.print(`all ${done.length} arrived (${elapsed()} s)`);
    return 0;
  }
  ctx.print(`still waiting after ${elapsed()} s for: ${missing.join(', ')}`);
  ctx.print(`run \`uie wait ${missing.join(' ')}\` again and keep your turn; a subagent that has replied without writing its file will not arrive.`);
  return 2;
}
