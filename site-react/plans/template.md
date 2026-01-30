# Task Management Template

Use this template when working on tasks in this repository.

---

# Task Management

## Always Create and Maintain Task Plans

For EVERY task you receive:

### 1. Before Starting Work

Create `plans/[task-name].md` with:
- Clear goal statement
- Current state analysis (what works, what's broken)
- Detailed implementation plan broken into phases/steps
- Progress tracking table
- Dependencies and blockers
- Files to create/modify
- Next steps

### 2. While Working

Update `plans/[task-name].md` after completing each step:
- Mark completed steps with ✓ or DONE
- Update progress tables
- Add new findings or changes to approach
- Note any issues encountered
- Update next steps

### 3. After Completing

Final update to `plans/[task-name].md`:
- Mark all steps complete
- Summary of what was accomplished
- Any remaining TODO items
- Lessons learned or notes for future work

---

## Format Guidelines

Use the format that best fits the task complexity:

### For Simple Tasks
(single file changes, quick fixes)

```markdown
# Task: [Brief description]

## Goal
What needs to be accomplished

## Steps
- [ ] Step 1
- [x] Step 2 (completed)
- [ ] Step 3

## Current Status
Working on: [step name]

## Files Modified
- path/to/file.ts - [what changed]
```

### For Complex Tasks
(multi-file refactoring, feature additions)

```markdown
# Task: [Detailed description]

## Goal
Clear statement of what needs to be accomplished

## Current State
- What currently works
- What's broken or missing
- Relevant context

## Implementation Plan

### Phase 1: [Phase Name]
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

### Phase 2: [Phase Name]
- [ ] Step 1
- [ ] Step 2

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1 | In Progress | 2/3 |
| Phase 2 | Not Started | 0/2 |

## Files to Create/Modify

| File | Action | Status |
|------|--------|--------|
| path/to/file1.ts | Create | ✓ Done |
| path/to/file2.ts | Modify | In Progress |
| path/to/file3.ts | Modify | Pending |

## Dependencies
- [ ] Dependency 1
- [ ] Dependency 2

## Blockers
- None currently

## API Changes
Document any API or interface changes needed

## Next Steps
1. Next action to take
2. Following action
3. And so on...

## Notes
- Important findings
- Design decisions
- Things to remember
```

---

## Best Practices

1. **Be Specific**: Use concrete file paths and line numbers when possible
2. **Update Frequently**: Update the plan after each significant step
3. **Track Progress**: Use tables and checkboxes to show progress
4. **Document Decisions**: Record why you chose a particular approach
5. **Note Blockers**: Explicitly call out anything blocking progress
6. **Keep It Current**: The plan should reflect the actual state of work

---

## Example: Simple Task

```markdown
# Task: Fix typo in README

## Goal
Correct spelling error in README.md line 42

## Steps
- [x] Locate the typo in README.md
- [x] Fix the spelling
- [ ] Verify the change

## Current Status
Working on: Verifying the change

## Files Modified
- README.md - Fixed spelling of "documentation"
```

---

## Example: Complex Task

```markdown
# Task: Add Dark Mode Support

## Goal
Implement dark mode theme toggle across the application

## Current State
- Application only supports light theme
- Theme system uses SCSS variables
- No state management for theme preference

## Implementation Plan

### Phase 1: Infrastructure ✓
- [x] Create theme service
- [x] Add theme toggle state management
- [x] Create dark theme SCSS variables

### Phase 2: Component Updates (In Progress)
- [x] Update header component
- [x] Update sidebar component
- [ ] Update dialog components
- [ ] Update form components

### Phase 3: Persistence & Polish
- [ ] Add localStorage for theme preference
- [ ] Add smooth transitions
- [ ] Test in all browsers

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1 | Complete | 3/3 |
| Phase 2 | In Progress | 2/4 |
| Phase 3 | Not Started | 0/3 |

## Files to Create/Modify

| File | Action | Status |
|------|--------|--------|
| src/services/theme.service.ts | Create | ✓ Done |
| src/styles/themes/dark.scss | Create | ✓ Done |
| src/components/header/header.component.ts | Modify | ✓ Done |
| src/components/sidebar/sidebar.component.ts | Modify | ✓ Done |
| src/components/dialog/dialog.component.ts | Modify | In Progress |
| src/components/form/form.component.ts | Modify | Pending |

## Dependencies
- [x] Angular Material 16+ (already installed)
- [x] SCSS support configured

## Blockers
- None currently

## API Changes

### ThemeService
```typescript
export class ThemeService {
  theme$: Observable<'light' | 'dark'>;
  toggleTheme(): void;
  setTheme(theme: 'light' | 'dark'): void;
}
```

## Next Steps
1. Complete dialog component theme updates
2. Update form components
3. Implement localStorage persistence
4. Add transition animations

## Notes
- Using CSS custom properties for dynamic theming
- Theme preference syncs across tabs via localStorage events
- Default theme is determined by system preference
- All Material components need theme override classes
```
