# cursor-skills

Personal collection of AI skills, code review standards, and development rules for use with Cursor and other AI coding assistants.

## Structure

```
cursor-skills/
├── skills/
│   ├── develop-skill/     # Controlled Git workflow: branch → PR → review loop
│   │   └── SKILL.md
│   └── code-review/       # Structured severity-graded code review standard
│       └── SKILL.md
└── docs/
    └── STYLE.md           # Code style guide referenced by code-review skill
```

## Skills

### `develop-skill`
Enforces a controlled Git workflow for every code change:
- Always branch from `main` → `feature/<slug>`
- One PR per development cycle
- Mandatory code-review loop before concluding

### `code-review`
Structured code review with severity grading (`🔴 Critical / 🟡 Major / 🔵 Minor`), data compatibility analysis, and a clear Approve / Request Changes verdict.

## Usage

Reference these skills in your Cursor project by placing them under `.cursor/skills/` or pointing your AI assistant to the relevant `SKILL.md` file.
