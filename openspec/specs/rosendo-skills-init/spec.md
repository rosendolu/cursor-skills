# rosendo-skills-init Specification

## Purpose
TBD - created by archiving change rosendo-skills-init. Update Purpose after archive.
## Requirements
### Requirement: Provide `npx rosendo-skills init` initializer
The system SHALL provide an npm package that can be invoked via `npx rosendo-skills init` to initialize a target project directory.

#### Scenario: Invoke init with explicit target directory
- **WHEN** the user runs `npx rosendo-skills init /path/to/project`
- **THEN** the initializer SHALL treat `/path/to/project` as the project root for all subsequent operations

#### Scenario: Invoke init with no target directory
- **WHEN** the user runs `npx rosendo-skills init` with no positional argument
- **THEN** the initializer SHALL use the current working directory as the project root

### Requirement: Copy standard template files into the project root
The initializer SHALL fetch a curated list of template **files** from the GitHub repository `rosendolu/cursor-skills` and write them into the target project root.

#### Scenario: Target directory does not exist
- **WHEN** the user runs `npx rosendo-skills init <targetDir>` and `<targetDir>` does not exist
- **THEN** the initializer SHALL fail with a non-zero exit code and SHALL NOT attempt OpenSpec initialization

#### Scenario: Parent directories are created as needed
- **WHEN** a fetched template file’s destination parent directory does not exist in the target project root
- **THEN** the initializer SHALL create the parent directory before writing the file

#### Scenario: Template fetch and write succeeds
- **WHEN** all curated template files are fetched and written successfully into the target project root
- **THEN** the initializer SHALL proceed to run OpenSpec initialization commands in the target project root

### Requirement: Define overwrite behavior for conflicts
If a destination file already exists in the target project root, the initializer SHALL overwrite the destination with the fetched template content.

#### Scenario: Existing files are overwritten
- **WHEN** a destination file already exists
- **THEN** the initializer SHALL overwrite it with the fetched template content

### Requirement: Initialize OpenSpec for Cursor tooling
After template copy completes, the initializer SHALL run the following commands in the target project root, in order:
1. `npm install -g @fission-ai/openspec@latest`
2. `openspec init --force --tools cursor`

#### Scenario: OpenSpec install fails
- **WHEN** `npm install -g @fission-ai/openspec@latest` returns a non-zero exit code
- **THEN** the initializer SHALL stop execution and return a non-zero exit code

#### Scenario: OpenSpec init fails
- **WHEN** `openspec init --force --tools cursor` returns a non-zero exit code
- **THEN** the initializer SHALL stop execution and return a non-zero exit code

