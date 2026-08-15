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

- **Routes** (`src/routes/`): One file per feature. Each exports a `*Routes` object `{ [ApiRoutes.X]: { METHOD: handler } }` registered in `src/index.ts`.
- **Middleware** (`src/lib/middleware.ts`): `withRole(role, handler, opts?)` wraps protected handlers (enforces auth + role + profile gate). `parseBody(req, schema)` validates JSON body. `getAuthUser(req)` returns `JwtUser | null`. Throw `HttpError(status, message)` inside handlers — `withRole` catches and returns as JSON.
- **Database** (`src/db/`): PostgreSQL via Drizzle ORM. Schema in `src/db/schema.ts`. Migrations in `drizzle/`.
- **S3** (`src/lib/s3.ts`): Client-side uploads via presigned PUT URLs (`getPresignedUploadUrl(key, contentType)`). Allowed types: `image/jpeg`, `image/png`, `image/webp`.
- **Auth**: JWT HS256 via `jose`. Google OAuth 2.0 also supported. Token sent as `Authorization: Bearer <token>`.

### Frontend

- **React Router v7 SPA** — routes in `src/App.tsx`, all pages lazy-loaded.
- **AuthContext** (`src/context/auth.tsx`): Holds token + user. Profile completion gates access to member routes.
- **TanStack Query**: All data fetching via `apiClient` (`src/lib/api-client.ts`), which auto-injects the auth header. Default `staleTime` is 5 min; use `Infinity` for near-static data.
- **Forms**: React Hook Form + Zod. Schemas in `src/constants/schemas.ts`, types inferred with `z.infer<>`.
- **Rich text**: Tiptap + DOMPurify.

### Role Hierarchy

`USER (0) < ADMIN (1) < SUPER_ADMIN (2)` — enforced server-side via `withRole()`. `hasAccess(userRole, minRole)` for client-side checks.

## Key Conventions

### Always

- All API routes defined in `ApiRoutes`, page routes in `PageRoutes` (`src/constants/routes.ts`) — never hardcode strings.
- Error response shape is always `{ error: "message" }`. Success shape is the data directly.
- HTTP status codes: 200/201 success, 400 validation, 401 bad credentials, 403 forbidden/incomplete profile, 404 not found, 409 conflict (duplicate), 422 business logic violation, 500 server error.
- Postgres unique constraint code `"23505"` → return 409.
- Always use `import type { T }` for type-only imports.
- Never use relative imports — always use the `@/` alias.

### Backend

- Public handlers: `async (req: Request): Promise<Response>`. Protected: wrapped with `withRole`, receives `(req: BunRequest<P>, user: JwtUser)`.
- Always return `Response.json(data, { status: N })`.
- Destructure first DB result: `const [row] = await db.select()...limit(1)`.
- Always use `.returning()` on insert/update/delete.
- Use `db.transaction(async (tx) => { ... })` for multi-step writes; use `tx` not `db` inside.
- Conditional PATCH updates: `...(value !== undefined && { col: value })`.

### Frontend

- Generic utilities go in `src/lib/utils.ts` — don't scatter one-off helpers into new files. A focused, cohesive domain module under `src/lib/` (e.g. `src/lib/motion.ts` for shared animation presets) is fine.
- New shared types go in `src/constants/types.ts`.
- New form schemas go in `src/constants/schemas.ts`.
- All TanStack Query keys defined in `src/constants/query-keys.ts` — never use inline string arrays.
- Custom hooks go in `src/hooks/` (e.g. `useDialogState`).
- Always use `cn()` for Tailwind class merging.
- Use CVA (`class-variance-authority`) for component variants.
- Invalidate TanStack Query cache after mutations: `queryClient.invalidateQueries({ queryKey: queryKeys.x() })`.
- API errors are `ApiError` instances with a `.status` property.

## Code Style

- Double quotes, semicolons, 2-space indent, 100-char line width (Prettier).
- Imports sorted by `simple-import-sort`: external → type imports → `@/` local → relative.
- Unused variables prefixed with `_`.
- Enums as `as const` objects with a matching type alias (see `src/constants/enums.ts`).
