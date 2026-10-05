# Security

UI-Evaluator runs on your machine. Its CLI serves the pages under test, opens them in a local browser, starts your app when `.ui-evaluator/config.json` says how, and writes everything to `.ui-evaluator/` in your project. It sends nothing anywhere on its own: there is no telemetry, it opens local URLs only unless you pass `--allow-remote`, and it uses the network during `uie doctor --install` only after you agree. The agent that runs the skill sends what it reads to its model provider, as any agent does.

## Reporting a problem

Please report a security problem privately, not in a public issue:

- Use **Report a vulnerability** on the repository's Security tab (GitHub's private vulnerability reporting).
- If that button is not there, open an issue that says only that you have a security report, with no details, and the maintainer will arrange a private channel.

Say which version you ran (`node skills/ui-evaluator/scripts/uie.mjs --version`, or the plugin version), what you did and what happened.

## What counts

For example:

- a way to make `uie` open a non-local URL without `--allow-remote`, or run code it was not asked to run;
- a run that writes outside `.ui-evaluator/` and the project, or a hook that writes files at all;
- personal data that survives the scrubbing in `uie feedback import`;
- `uie probe` submitting a real payment or sign-in form on a non-local host.

A finding the audit gets wrong is not a security problem. Use the "A finding is wrong" issue form for that.
