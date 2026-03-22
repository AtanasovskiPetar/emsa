# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- Before each change, ensure the code is compiling without any errors.
- After making any changes, check whether README.md needs to be updated and update it accordingly.

## Commands

```bash
bun dev                        # Start dev server with hot reload (port 3000)
bun run build                  # Build frontend assets to dist/
bun start                      # Start production server (requires build first)
bun run lint                   # Run ESLint
bun run prettier               # Format code with Prettier

bunx drizzle-kit generate      # Generate migrations from schema changes
bunx drizzle-kit migrate       # Apply pending migrations
bunx drizzle-kit studio        # Open database browser UI
```

No test suite exists yet.

## Architecture

**Full-stack Bun app** — a single Bun process serves both the API and the React SPA. The entry point (`src/index.ts`) registers all route handlers and falls back to serving the frontend for unmatched paths.

### Backend

- **Routes** (`src/routes/`): One file per feature (auth, users, projects, pillars, organization, dashboard). Each exports a handler function registered in `src/index.ts`.
- **Middleware** (`src/lib/middleware.ts`): `withRole(minRole)` wraps route handlers to enforce role-based access and the profile completion gate. `parseBody(schema)` validates request JSON with Zod. `getAuthUser()` extracts and verifies the JWT from the `Authorization` header.
- **Database** (`src/db/`): PostgreSQL accessed via Drizzle ORM. Schema defined in `src/db/schema.ts`. Migrations live in `drizzle/`.
- **S3** (`src/lib/s3.ts`): Files are uploaded client-side using presigned PUT URLs. The server generates 5-minute presigned URLs via `getPresignedUploadUrl()`.
- **Auth**: JWT (HS256, via `jose`) stored in `localStorage`. Google OAuth 2.0 also supported.

### Frontend

- **React Router v7 SPA** — all routes defined in `src/App.tsx` using lazy-loaded page components.
- **AuthContext** (`src/context/AuthContext.tsx`): Holds JWT token and decoded user profile. Profile completion state gates access to member routes.
- **TanStack Query**: All data fetching. The `apiClient` wrapper (`src/lib/apiClient.ts`) auto-injects the `Authorization` header.
- **Forms**: React Hook Form + Zod. Schemas in `src/constants/schemas.ts`.
- **Rich text**: Tiptap editor (project descriptions, org "about us"). DOMPurify for sanitization.

### Role Hierarchy

`USER (0) < ADMIN (1) < SUPER_ADMIN (2)` — enforced server-side via `withRole()`. `hasAccess(userRole, minRole)` is the utility for client-side role checks.

### Key Utilities (`src/lib/utils.ts`)

Prefer adding new helpers here rather than creating new files: `cn()` (Tailwind class merging), `hasAccess()`, `getInitials()`, `getImageSrc()`, `toDatetimeLocalValue()`, `stripHtml()`.

## Path Alias

`@/*` maps to `./src/*` throughout the codebase.

## Code Style

- Double quotes, semicolons, 2-space indent, 100-char line width (Prettier)
- Imports must be sorted (`simple-import-sort` ESLint plugin)
- Unused variables prefixed with `_` to suppress lint errors
