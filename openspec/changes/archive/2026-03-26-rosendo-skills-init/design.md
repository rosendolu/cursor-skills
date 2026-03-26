## Context

We want a small npm-distributed CLI that can be invoked via `npx rosendo-skills init` to bootstrap a project with the same editor config and docs structure used in this repository, then initialize OpenSpec for Cursor-based workflows.

The init command must:
- Copy a specific set of template files/directories into a target project root.
- Run `npm install -g @fission-ai/openspec@latest` and then `openspec init --force --tools cursor` in that target directory.

Constraints:
- Must work via `npx` without prior installation.
- Must be safe and predictable when re-run (define overwrite behavior explicitly).
- Templates should be fetched in real-time from `rosendolu/cursor-skills` (GitHub) as a curated list of files.

## Goals / Non-Goals

**Goals:**
- Provide `npx rosendo-skills init [targetDir]` that bootstraps a project root.
- The npm package contains only the CLI script; templates are fetched live from `rosendolu/cursor-skills` (GitHub) and written into the target directory (creating parent directories and overwriting existing files).
- Execute OpenSpec initialization commands in the target directory with streamed output and proper exit codes.
- Make behavior explicit for conflicts (overwrite vs skip) and failures (stop on first failure).

**Non-Goals:**
- Implement a full scaffolding system (no prompts, no templating/variable substitution).
- Manage git initialization/commits automatically.
- Install project dependencies beyond OpenSpec CLI.

## Decisions

- Fetch templates from GitHub at runtime (file-based, curated list)
  - Rationale: always up-to-date with the canonical repository without needing a package release to update templates.
  - Alternative considered: bundling templates in the npm package (rejected: template updates require publishing a new npm version).

- Provide a `bin` entry for a Node-based CLI
  - Rationale: standard npm CLI distribution; works cleanly with `npx`.
  - Implementation: `package.json` includes `"bin": { "rosendo-skills": "dist/cli.js" }` (or similar).

- Write strategy: create parent directories and overwrite destination files (default)
  - Rationale: aligns with “bootstrap” semantics; repeatable and converges to the canonical template state.
  - Alternative considered: skip existing files (rejected: drift persists, less predictable).
  - Future extension: optional `--no-overwrite` or `--dry-run` flags if needed.

- Command execution: use `child_process.spawn` and run with `cwd=targetDir`
  - Rationale: preserves streaming output; respects platform differences better than string parsing.

## Risks / Trade-offs

- Global install side effects → Mitigation: document clearly; keep commands minimal and explicit; fail with clear messaging on permissions issues.
- Overwriting user files could be destructive → Mitigation: print which paths will be overwritten; default behavior is explicit in docs; consider adding a prompt/flag later.
- `npm install -g` can fail due to permissions (especially on macOS) → Mitigation: surface failure and recommended remediation (e.g., using nvm as in this environment).
- Runtime fetch failures (network, GitHub outage, rate limits) → Mitigation: surface clear errors; keep fetched file list small; consider optional pinning to a tag/commit later.

