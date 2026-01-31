You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

# Development Commands

## Build & Development

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build

## Code Quality

- `bun run lint` - Run Prettier check and ESLint
- `bun run format` - Format code with Prettier
- `bun run check` - Run SvelteKit type checking
- `bun run check:watch` - Run SvelteKit type checking in watch mode

## Testing

- `bun test` - Run all tests (unit + e2e)
- `bun run test:unit` - Run Vitest unit tests only
- `bun run test:e2e` - Run Playwright e2e tests only

### Running Single Tests

- Unit: `bun run test:unit -- path/to/file.test.ts`
- E2E: `bun run test:e2e -- path/to/file.test.ts`

# Code Style Guidelines

## Formatting & Linting

- **Tabs**: Use tabs (not spaces)
- **Quotes**: Use single quotes
- **Trailing commas**: No trailing commas
- **Print width**: 100 characters
- **Files**: Run `npm run format` before committing

## TypeScript Configuration

- **Strict mode**: Enabled
- **Module resolution**: Bundler
- **Path aliases**: Handled by SvelteKit ($lib works automatically)
- **Type checking**: Always run `npm run check` before committing

## Svelte 5 Specific Rules

- **Props**: Use `$props()` rune for component properties
- **State**: Use `$state()` rune for reactive state
- **Derived**: Use `$derived()` and `$derived.by()` for computed values
- **Script tags**: Always include `lang="ts"` for TypeScript components
- **Components**: Use PascalCase for component names

## Import Organization

```typescript
// External libraries first
import { Chart } from '@flowbite-svelte-plugins/chart';
import Papa from 'papaparse';

// Svelte imports
import { SvelteDate } from 'svelte/reactivity';

// Local imports (use $lib alias)
import { db, type Item } from '$lib/db';
import CsvImport from '$lib/components/CsvImport.svelte';

// SvelteKit imports last
import { resolve } from '$app/paths';
```

## Naming Conventions

- **Components**: PascalCase (e.g., `DonutChart.svelte`, `CsvImport.svelte`)
- **Files**: kebab-case for utilities, camelCase for TypeScript files
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for exported constants
- **Types**: PascalCase (e.g., `Item`, `Category`)
- **Interfaces**: PascalCase with descriptive names

## Error Handling

- **Async operations**: Always include proper error handling with try/catch
- **User feedback**: Use state variables for error messages and user notifications
- **Database operations**: Handle Dexie errors with user-friendly messages
- **CSV parsing**: Validate expected columns and provide clear error messages

## Component Structure

- **Props**: Define with TypeScript interfaces and default values
- **State**: Use reactive state with `$state()`
- **Lifecycle**: Use Svelte 5 runes instead of lifecycle methods
- **Styling**: Use Tailwind CSS classes consistently
- **Accessibility**: Include proper ARIA labels and semantic HTML

## Database Patterns

- **Schema**: Define interfaces for all database entities
- **Operations**: Use async/await with proper error handling
- **Queries**: Use `liveQuery()` for reactive data
- **Bulk operations**: Use `bulkPut()` and `bulkAdd()` for performance

## Testing Patterns

- **Unit tests**: Use Vitest with `vitest-browser-svelte`
- **E2E tests**: Use Playwright for end-to-end testing
- **Component tests**: Test rendering, props, and user interactions
- **File naming**: `.spec.ts` or `.test.ts` suffixes

## CSS & Styling

- **Framework**: Tailwind CSS v4 with Flowbite components
- **Responsive**: Use responsive prefixes (md:, lg:, etc.)
- **Dark mode**: Include dark: variants where appropriate
- **Components**: Prefer Flowbite component library when available

## File Organization

```
src/
├── lib/
│   ├── components/     # Reusable Svelte components
│   ├── db.ts           # Database configuration and types
│   └── index.ts        # Library exports
├── routes/             # SvelteKit pages and layouts
├── app.html           # Root HTML template
└── app.d.ts           # Type declarations
```

## Before Committing

1. Run `bun format` to format code
2. Run `bun lint` to check for issues
3. Run `bun check` to verify TypeScript types
4. Run `bun test` to ensure tests pass
5. Test functionality manually if applicable

## Best Practices

- Use `$lib` alias for internal imports
- Keep components focused and reusable
- Use descriptive prop interfaces
- Implement proper loading and error states
- Use semantic HTML5 elements
- Follow Svelte 5 runes patterns for reactivity
- Write meaningful test coverage for critical functionality
