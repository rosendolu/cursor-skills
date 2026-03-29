---
name: /iterate-automatically
id: iterate-automatically
category: Workflow
description: End-to-end OpenSpec loop — PD requirements → propose → implement (develop-skill) → archive
---

Run the full iteration pipeline: discover and lock requirements as a Product Manager, create an OpenSpec change, implement it on a feature branch with PR review, then archive.

**Prerequisite**: OpenSpec CLI (`openspec`) available; `gh` for PRs when implementing.

---

## Phase 1 — Requirements (PD + explore)

**Goal**: A clear, agreed **final requirement** before any proposal.

1. **Enter explore mode** (`/opsx-explore` behavior):
   - Think with the user; investigate the repo when useful.
   - Do **not** implement application code in this phase. OpenSpec artifacts are allowed if they capture thinking.

2. **Act as PD** using the **product-requirements-planner** skill (read `.cursor/skills/product-requirements-planner/SKILL.md` and follow it):
   - Collect product context with the skill’s questionnaire (product snapshot, business goal, pain, constraints, success metrics).
   - Produce **exactly three** plans: **A** defect fix, **B** new feature, **C** iteration/optimization — each with scope, risks, metrics, effort.
   - Score with **ROI = (I × R × C) / E** and output the skill’s required template (**Product context**, **Requirement plans**, **ROI evaluation** table, **Recommendation** with MVP slice, timeline, decision log).
   - The **recommended plan** (plus any explicit user override) is the **final requirement** for Phase 2.

3. **Exit criteria**: User accepts the recommendation (or chooses a plan); you can name the change (kebab-case) from that scope.

---

## Phase 2 — Proposal (`/opsx-propose`)

**Goal**: OpenSpec change with all artifacts needed before implementation.

1. Run the **opsx-propose** workflow (see `.cursor/commands/opsx-propose.md`):
   - `openspec new change "<name>"` (derive `<name>` from the final requirement).
   - `openspec status --change "<name>" --json` → read `applyRequires` and artifact order.
   - For each artifact in order: `openspec instructions <artifact-id> --change "<name>" --json` → write files to `outputPath` using `template` and `instruction`; do **not** paste internal `context`/`rules` into files.
   - Re-run status until every `applyRequires` artifact is **done**.

2. **Exit criteria**: “All artifacts created! Ready for implementation.” (proposal, design, tasks, etc. per schema.)

---

## Phase 3 — Implement (`/opsx-apply` + **develop-skill**)

**Goal**: Tasks implemented, one PR to `main`, code-review loop completed.

1. **develop-skill** (read `.cursor/skills/develop-skill/SKILL.md` and follow it):
   - From `main`: `git fetch origin`, `git switch main`, `git pull --ff-only origin main`.
   - Create `feature/<short-description>` (unique if needed), work only on that branch for this cycle.

2. **Apply** using **opsx-apply** (see `.cursor/commands/opsx-apply.md`):
   - `openspec instructions apply --change "<name>" --json` → read `contextFiles`, pending tasks.
   - Implement each task; mark `- [x]` in the tasks file as you go.
   - Stay minimal and scoped; pause if blocked or design conflicts with artifacts (update artifacts if needed).

3. **PR and review** (per develop-skill):
   - `git push -u origin HEAD`, `gh pr create --base main --head feature/<branch> ...` (one PR per cycle).
   - Run **code-review** skill on the diff; fix **Critical**, **Suggestion**, and **Nice-to-have**; push until clear.
   - Do **not** merge from CLI; give the PR URL and wait for human merge.

4. **Exit criteria**: All tasks complete; review findings addressed; PR open (or merged by human after your push).

---

## Phase 4 — Archive (`/opsx-archive`)

**Goal**: Change finalized and moved to archive; specs synced if applicable.

1. Run **opsx-archive** (see `.cursor/commands/opsx-archive.md`):
   - User selects change if ambiguous: `openspec list --json`.
   - Check artifact and task completion; confirm warnings if incomplete.
   - If delta specs exist, assess vs `openspec/specs/` and sync or skip per user.
   - `mkdir -p openspec/changes/archive` and `mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>` (fail if target exists).

2. **Exit criteria**: Archive path reported; human has merged PR when implementation is part of “done” for your team.

---

## Agent checklist

| Phase | Primary refs |
| ----- | ------------- |
| 1 | `product-requirements-planner` SKILL, explore guardrails (no app code) |
| 2 | `opsx-propose` command, `openspec` CLI |
| 3 | `opsx-apply`, `develop-skill`, `code-review` skill |
| 4 | `opsx-archive` command |

**Handoff prompts**

- After Phase 1: “Requirements locked. Run Phase 2: create OpenSpec change from this plan.”
- After Phase 2: “Run `/opsx-apply` (or continue) on change `<name>` following develop-skill.”
- After Phase 3: “Run `/opsx-archive` when the PR is merged and you are ready to close the change.”
