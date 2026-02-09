# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Vite dev server (opens browser automatically)
npm run start            # Start on port 4208 (development mode)
npm run build            # TypeScript compile + Vite build
npm run test             # Run tests with Vitest
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format
npm run type-check       # TypeScript type checking only
```

## Architecture

### Project Structure
- **`src/@pango.core/`** - Core shared module (theme, colors, base components, utilities, data models)
- **`src/features/`** - Feature-based modules (genes, annotations, terms, search), each containing:
  - `components/` - UI components for the feature
  - `slices/` - Redux Toolkit slices for state management
  - `services/` - API query definitions (GraphQL queries)
  - `models/` - TypeScript interfaces
  - `hooks/` - Custom React hooks
  - `utils/` - Feature-specific utilities
- **`src/app/`** - Application shell (pages, layout, Redux store, routing)
- **`src/shared/`** - Shared components and models used across features

### State Management
Uses Redux Toolkit with RTK Query for API calls:
- Store configuration: [src/app/store/store.ts](src/app/store/store.ts)
- API service with version support: [src/app/store/apiService.ts](src/app/store/apiService.ts)
- GraphQL queries use `gql` + `print` from Apollo Client, sent via RTK Query's `fetchBaseQuery`

### Typed Redux Hooks
**Important:** Do NOT import `useSelector`, `useDispatch`, or `useStore` directly from `react-redux`. Use the pre-typed hooks from [src/app/hooks.ts](src/app/hooks.ts):
```typescript
import { useAppDispatch, useAppSelector } from '@/app/hooks'
```
ESLint enforces this rule.

### Path Aliases
`@/` resolves to `src/` directory (configured in vite.config.ts and tsconfig).

### Styling

- MUI (Material-UI) v5 for component library with custom theme at `@pango.core/theme/`
- Tailwind CSS for utility classes
- Both can be used together in components

**MUI Usage Policy - IMPORTANT:**

- **Use MUI ONLY for complex interactive components**: Button, Tooltip, Chip, TextField, Autocomplete, etc.
- **DO NOT use MUI layout/container components**: Box, Paper, Typography, Container, Stack, Grid
- **Always prefer**: Regular HTML elements (`<div>`, `<span>`, `<h1>`, etc.) styled with Tailwind CSS
- **Pattern**: Use Tailwind for all layout, spacing, colors, and typography. Only reach for MUI when you need specialized component behavior (e.g., autocomplete logic, tooltip positioning)

### API Versioning
The app supports multiple API versions via URL query parameter `?apiVersion=`. Current versions defined in apiService.ts. Default is `pango-2`.

## Environment Variables

Copy `.env.example` to `.env`. Required variables:
- `VITE_PANGO_API_URL` - Backend API URL
- `VITE_PANGO_API_VERSION` - Default API version

Access in code: `import.meta.env.VITE_*`

## Testing

Uses Vitest with React Testing Library and jsdom. Tests located in `src/test/__tests__/`.

For testing components with Redux:
```typescript
import { renderWithProviders } from '@/utils/test-utils'
// Use renderWithProviders instead of render to wrap with Redux Provider
```

Run single test file:
```bash
npx vitest run src/test/__tests__/Home.test.tsx
```

## Code Style

- Prettier: no semicolons, single quotes, 2-space indent, trailing commas (es5)
- TypeScript: use `type` imports for type-only imports (`@typescript-eslint/consistent-type-imports`)
- Unused variables: prefix with underscore (e.g., `_unused`)

## Git

Do not add "Co-Authored-By" lines to commits.


## Task Management

### Always Create and Maintain Task Plans

For EVERY non-trivial task you receive:

**Before starting work**: Create `plans/[task-name].md` with:

- Clear goal statement
- Current state analysis (what works, what's broken)
- Detailed implementation plan broken into phases/steps
- Progress tracking table
- Dependencies and blockers
- Files to create/modify
- Next steps

**While working**: Update `plans/[task-name].md` after completing each step:

- Mark completed steps with ✓ or DONE
- Update progress tables
- Add new findings or changes to approach
- Note any issues encountered
- Update next steps

**After completing**: Final update to `plans/[task-name].md`:

- Mark all steps complete
- Summary of what was accomplished
- Any remaining TODO items
- Lessons learned or notes for future work

### Format Guidelines

**For simple tasks** (single file changes, quick fixes):

```markdown
# Task: [Brief description]

## Steps
- [ ] Step 1
- [x] Step 2 (completed)

## Current Status
Working on: [step name]
```

**For complex tasks** (multi-file refactoring, feature additions):

- Include progress summary tables
- Organize into phases
- Track files created/modified separately
- Document API changes needed
- List dependencies and blockers
- Maintain current state diagnosis section

See [plans/template.md](plans/template.md) for detailed examples and formats.

