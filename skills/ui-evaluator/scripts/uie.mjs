#!/usr/bin/env node
// UI-Evaluator command-line tool. Run `node uie.mjs --help`.
// Exit codes: 0 = ran and clean · 2 = ran and found problems · 1 = could not run.
import { main } from './lib/cli.mjs';

// A reader that closes the pipe early (`uie … | head`) must not turn a clean run into a crash.
for (const stream of [process.stdout, process.stderr]) {
  stream.on('error', (err) => {
    if (err && err.code === 'EPIPE') process.exit(process.exitCode ?? 0);
  });
}

/**
 * Exit once everything written so far has reached the OS. process.exit() right after a large write cuts piped
 * output off at the pipe buffer (about 64 KB), so `uie … --json | jq` would see truncated JSON. The explicit exit
 * still matters: browser runs may leave handles open that would otherwise keep the process alive.
 */
function exitAfterFlush(code) {
  process.exitCode = code;
  let pending = 2;
  const done = () => {
    pending -= 1;
    if (pending === 0) process.exit(code);
  };
  process.stdout.write('', done);
  process.stderr.write('', done);
}

main(process.argv.slice(2)).then(
  (code) => exitAfterFlush(typeof code === 'number' ? code : 0),
  (err) => {
    const FS_ERRORS = { ENOENT: 'file not found', EISDIR: 'expected a file but got a folder', EACCES: 'permission denied', ENOTDIR: 'not a folder' };
    const fsMsg = err && FS_ERRORS[err.code] && err.path ? `${FS_ERRORS[err.code]}: ${err.path}` : null;
    const msg = err && err.userMessage ? err.userMessage : fsMsg || (err && err.stack) || String(err);
    process.stderr.write(`uie: ${msg}\n`);
    exitAfterFlush(1);
  },
);
