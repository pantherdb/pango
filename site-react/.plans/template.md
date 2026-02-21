# Task Management — Claude Code

## Core Rule

**For EVERY task: create, maintain, and read plan files.**

- **Starting a new task →** Create `.plans/[category]/[task-name].md`
- **Resuming after context loss →** Read ACTIVE plan files in `.plans/` before doing anything
- **After completing a step or phase →** Update the plan

---

## Folder Structure

```
.plans/
├── bugfix/          # Bug fixes and error resolution
├── feature/         # New features and enhancements
├── refactor/        # Code restructuring and cleanup
├── config/          # Configuration, CI/CD, environment changes
├── docs/            # Documentation tasks
├── testing/         # Test creation and test fixes
└── misc/            # Anything that doesn't fit above
```

Examples:

- `.plans/bugfix/login-redirect-loop.md`
- `.plans/feature/dark-mode.md`
- `.plans/refactor/extract-auth-service.md`

---

## Plan Template

```markdown
# Task: [Clear one-line description]

**Status:** ACTIVE | COMPLETE | BLOCKED
**Issue:** [issue number/link, e.g. #220]
**Branch:** [branch name]

## Goal
[1-2 sentences. What does "done" look like?]

## Context
- **Related files:** [key files involved]
- **Triggered by:** [issue link, user request, etc.]

## Current State
- What works now:
- What's broken/missing:

## Steps

### Phase 1: [Name]
- [ ] Step 1
- [ ] Step 2

### Phase 2: [Name]
- [ ] Step 1
- [ ] Step 2

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** [exact file + what was done]
- **Next immediate action:** [the single next thing to do]
- **Recent commands run:**
  - `[command 1]`
  - `[command 2]`
- **Uncommitted changes:** [list modified/staged files]
- **Environment state:** [anything running, installed, temporary]

## Failed Approaches
<!-- Prevent repeating mistakes after context reset -->

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
|      |        |        |

## Blockers
- None currently

## Notes
- [Design decisions, gotchas, things to remember]

## Lessons Learned
<!-- Fill during and after task. Useful for future tasks. -->
- [What went well, what didn't, what you'd do differently]

## Additional Context (Claude)
<!--
  Open section. Add ANYTHING you think is relevant that
  the template doesn't cover: alternative approaches considered,
  risks spotted, architecture observations, performance concerns,
  suggestions for the codebase, or a better plan if you have one.
  You are not limited to this template's structure.
-->
```

---

## Update Triggers

Update the plan file (especially **Recovery Checkpoint**) after:
1. Completing a step or phase
2. Every failed attempt (add to **Failed Approaches**)
3. Before any long-running command
4. Before ending a session

## On Context Resume

When starting a new session or after context loss:

1. **FIRST:** `ls .plans/` — find all plan categories
2. **SCAN** for ACTIVE plans (check Status line at top of each file)
3. **READ** active plans, focus on **Recovery Checkpoint**
4. **VERIFY** file states match what the plan says (check git status)
5. **CONTINUE** from the documented next immediate action

---

## When a Task is Complete

- Set **Status** to: `COMPLETE`
- Mark all steps done
- Set Recovery Checkpoint to: `✅ TASK COMPLETE`
- Trim verbose code snippets — keep decisions and summaries, not implementation details
- Add a `## Summary` section with what was accomplished
- Note any follow-up work needed
