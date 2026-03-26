## Why

We want a single, repeatable `npx rosendo-skills init` command to bootstrap a project with the same Cursor + formatting + documentation setup used in this repository.
This reduces setup drift across projects and makes onboarding new repos fast and consistent.

## What Changes

- Publish an npm package `rosendo-skills` that contains only the CLI script and exposes `npx rosendo-skills init [targetDir]`.
- `init` fetches a fixed set of template **files** in real-time from the GitHub repository `rosendolu/cursor-skills` and writes them into the target project root:
  - If the destination directory does not exist, `init` creates it.
  - If a destination file already exists, `init` overwrites it.
- After copying, `init` runs OpenSpec tooling in the target directory:
  - `npm install -g @fission-ai/openspec@latest`
  - `openspec init --force --tools cursor`

## Capabilities

### New Capabilities
- `rosendo-skills-init`: Provide an `npx`-invoked initializer that pulls a curated set of template files from `rosendolu/cursor-skills` (live) into a target project root (creating directories and overwriting existing files) and initializes OpenSpec with Cursor tooling.

### Modified Capabilities
- (none)

## Impact

- Adds a distributable CLI workflow (`npx rosendo-skills init`) for project bootstrapping.
- Requires Node + npm available on the user machine; `init` will invoke npm and OpenSpec CLI.
- Requires network access during execution (to fetch templates from GitHub and to install `@fission-ai/openspec@latest` globally).
