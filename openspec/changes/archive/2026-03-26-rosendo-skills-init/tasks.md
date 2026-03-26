## 1. Change scaffolding

- [x] 1.1 Create npm package `rosendo-skills` with `bin` entry for `rosendo-skills`
- [x] 1.2 Ensure published package contains only the CLI script (no bundled templates)
- [x] 1.3 Add CLI command parsing for `rosendo-skills init [targetDir]`

## 2. Init command: fetch and write templates

- [x] 2.1 Implement target directory resolution (explicit arg or cwd) and validate it exists
- [x] 2.2 Define the curated list of template files to fetch from `rosendolu/cursor-skills`
- [x] 2.3 Implement fetch of each file from GitHub and write into target root
- [x] 2.4 Create parent directories for each destination file if missing
- [x] 2.5 Implement overwrite behavior for existing destination files (deterministic overwrite)
- [x] 2.6 Add user-visible output listing written paths and target directory

## 3. Init command: OpenSpec initialization

- [x] 3.1 Run `npm install -g @fission-ai/openspec@latest` in the target root with streamed output and proper error propagation
- [x] 3.2 Run `openspec init --force --tools cursor` in the target root with streamed output and proper error propagation
- [x] 3.3 Ensure failures stop execution and return non-zero exit code

## 4. Quality and release

- [x] 4.1 Add a minimal README usage section: `npx rosendo-skills init [targetDir]`
- [x] 4.2 Add a basic smoke test plan (manual or scripted) for init behavior in a temp directory
- [x] 4.3 Publish to npm (public) and verify `npx rosendo-skills init` works end-to-end
