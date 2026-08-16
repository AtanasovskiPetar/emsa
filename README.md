# EMSA Macedonia — Member Platform

The official web platform for **EMSA Macedonia** (European Medical Students' Association) — a single place to manage members, projects, pillars, and organisational information.

> **Note:** A significant portion of this codebase was built with the assistance of Claude (Anthropic). All generated code has been reviewed, tested, and adapted to fit the project's requirements.

---

## Overview

Full-stack SPA backed by a single Bun process. The backend and frontend are co-located — no separate API server.

**Key features:**

- Public-facing pages for projects and organisational pillars (the "pillar" label is configurable — call them committees, departments, chapters, ...)
- Member registration with profile completion gate
- Admin-configurable custom member fields (text/number, required flag, value autosuggestions)
- Email/password and Google OAuth login
- Role-based access: `USER` → `ADMIN` → `SUPER_ADMIN`
- Admin panel: members, projects, pillars, positions, organisation settings
- Project registration with configurable windows and participant caps
- S3-backed image uploads via presigned URLs
- Password reset via email (Resend)

---

## Tech Stack

| Layer        | Technology                            |
| ------------ | ------------------------------------- |
| Runtime      | [Bun](https://bun.sh)                 |
| Frontend     | React 19, React Router v7             |
| Styling      | Tailwind CSS v4, shadcn/ui (Radix UI) |
| State / Data | TanStack Query v5                     |
| Forms        | React Hook Form + Zod                 |
| Animations   | Motion (Framer Motion)                |
| Rich text    | Tiptap                                |
| Drag & drop  | dnd-kit                               |
| Backend      | Bun native HTTP server                |
| Database     | PostgreSQL via Drizzle ORM            |
| Auth         | JWT (jose) + Google OAuth 2.0         |
| File storage | AWS S3 (presigned uploads)            |
| Email        | Resend                                |

---

## Design System

The public-facing UI follows an Apple-inspired design language built on a small token layer.
Extend these tokens rather than hard-coding values.

- **Tokens** (`styles/globals.css`): oklch color scale (light + `.dark`), a typography scale
  with size-specific tracking (`text-hero`, `text-display`, `text-title`, `text-heading`,
  `text-subheading`, `text-body-lg`, `text-eyebrow`), motion easing/duration tokens, and
  layered `--shadow-material-*` shadows.
- **Materials** (`styles/globals.css`): `.material` / `.material-thin` / `.material-thick`
  utility classes for translucent, blurred surfaces (nav, menus, sheets). They fall back to
  solid under `prefers-reduced-transparency` / `prefers-contrast: more`.
- **Motion** (`src/lib/motion.ts`): shared spring presets (`spring.snappy/smooth/gentle/nav`)
  and reusable variants (`fade`, `fadeUp`, `scaleIn`, `staggerContainer`, `revealTransition`).
  Prefer springs for anything interruptible. Reduced motion is handled globally via
  `<MotionConfig reducedMotion="user">` in `src/App.tsx`, so movement automatically degrades
  to opacity cross-fades for users who request it.

### Theming

To rebrand from the default red, change the brand color in **two places** (they cannot share a
source — emails need hex, the web app uses oklch CSS tokens):

1. [`styles/globals.css`](./styles/globals.css) — `--primary`, `--primary-foreground`,
   `--sidebar-primary`, and `--sidebar-primary-foreground`, in both the light (`:root`) and
   `.dark` blocks. The defaults are Tailwind's red scale (`red-600` light / `red-500` dark).
2. [`src/lib/email.ts`](./src/lib/email.ts) — the `theme` object used by transactional email
   templates (`primary` = `red-600`, `primaryDark` = `red-700`).

Everything else (logo, organization name, tagline, pillars label) is editable at runtime from
the Organization admin page.

---

## Project Structure

```
src/
├── components/       # Shared UI components
│   ├── admin/        # Admin-only components (dialogs, positions, rich text)
│   └── ui/           # shadcn/ui primitives
├── constants/        # Enums, routes, Zod schemas, shared types
├── context/          # React context (auth)
├── db/               # Drizzle schema + relations
├── lib/              # Server utilities: db, jwt, middleware, s3, email, env
├── pages/            # Page components (React Router)
│   └── admin/        # Admin panel pages
├── routes/           # Bun HTTP route handlers (one file per feature)
└── index.ts          # Entry point — registers all routes, serves frontend
drizzle/              # Generated SQL migrations
```

---

## Roles

| Role          | Access                                                                                 |
| ------------- | -------------------------------------------------------------------------------------- |
| `USER`        | Public pages, profile, project self-registration                                       |
| `ADMIN`       | All of the above + dashboard, member list, project management                          |
| `SUPER_ADMIN` | All of the above + pillars, positions, organisation settings, add/remove registrations |

New members start as `USER`. Roles are promoted by a `SUPER_ADMIN` from the Users admin page.

**Exception:** on a fresh install, the first account to register (email/password or Google) automatically becomes `SUPER_ADMIN` so the instance has an owner. The last remaining super admin cannot be demoted.

### Profile Completion Gate

Admins define custom member fields (text or number, optionally required, optionally with value autosuggestions) from the Organization admin page. Members who haven't filled in every required field are redirected to `/profile` on every navigation until complete. The backend enforces this too — incomplete profiles receive `403` on all protected endpoints except profile read/update. With no required fields defined, all profiles are complete by default.

---

## Pages

### Public

| Route              | Description                                        |
| ------------------ | -------------------------------------------------- |
| `/`                | Home — hero, featured projects, pillars, positions |
| `/projects`        | All public projects                                |
| `/projects/:id`    | Project detail with image gallery and registration |
| `/pillars/:id`     | Pillar detail                                      |
| `/login`           | Email/password or Google login                     |
| `/register`        | New member registration                            |
| `/forgot-password` | Request a password reset email                     |
| `/reset-password`  | Set a new password via reset link                  |

### Member

| Route      | Description                            |
| ---------- | -------------------------------------- |
| `/profile` | Update personal info and upload avatar |

### Admin (`/admin/*`)

| Route           | Required Role | Description                                                        |
| --------------- | ------------- | ------------------------------------------------------------------ |
| `/dashboard`    | `ADMIN`       | Member stats overview                                              |
| `/users`        | `ADMIN`       | Member list and role management                                    |
| `/projects`     | `ADMIN`       | Create, edit, delete projects; manage registrations                |
| `/pillars`      | `SUPER_ADMIN` | Manage organisational pillars                                      |
| `/organization` | `SUPER_ADMIN` | Organisation name, logo, description, about us, positions, socials, member fields, pillars label |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.14
- PostgreSQL database
- AWS S3 bucket (or compatible)
- Google OAuth credentials
- [Resend](https://resend.com) account (for password reset emails)

### Install

```bash
bun install
```

### Environment Variables

Create a `.env` file in the project root. All variables are validated at startup in [`src/lib/env.ts`](./src/lib/env.ts).

```env
# Server
PORT=3000
ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=emsa
DB_SCHEMA=public

# Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-central-1
AWS_S3_BUCKET=your_bucket_name

# Email (Resend)
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=noreply@yourdomain.com
APP_URL=http://localhost:3000
```

### Database Setup

```bash
bunx drizzle-kit generate   # Generate migrations from schema
bunx drizzle-kit migrate    # Apply pending migrations
```

### Development

```bash
bun dev   # http://localhost:3000 — hot reload enabled
```

### Production

```bash
bun run build   # Build frontend assets
bun start       # Start production server
```

---

## API Reference

### Auth

| Method | Endpoint                    | Description                    |
| ------ | --------------------------- | ------------------------------ |
| `POST` | `/api/auth/register`        | Register a new member          |
| `POST` | `/api/auth/login`           | Email/password login           |
| `GET`  | `/api/auth/google`          | Initiate Google OAuth flow     |
| `GET`  | `/api/auth/google/callback` | Google OAuth callback          |
| `POST` | `/api/auth/forgot-password` | Request a password reset email |
| `POST` | `/api/auth/reset-password`  | Reset password via token       |

### Member

| Method  | Endpoint                | Auth   | Description                     |
| ------- | ----------------------- | ------ | ------------------------------- |
| `GET`   | `/api/users/me`         | `USER` | Get current user profile        |
| `PATCH` | `/api/users/me`         | `USER` | Update current user profile     |
| `GET`   | `/api/upload/presigned` | `USER` | Get presigned S3 URL for avatar |

### Public

| Method            | Endpoint                            | Auth   | Description                         |
| ----------------- | ----------------------------------- | ------ | ----------------------------------- |
| `GET`             | `/api/organization`                 | —      | Organisation info                   |
| `GET`             | `/api/positions`                    | —      | All positions (ordered)             |
| `GET`             | `/api/projects`                     | —      | All projects                        |
| `GET`             | `/api/projects/:id`                 | —      | Single project                      |
| `POST` / `DELETE` | `/api/projects/:id/register`        | `USER` | Register / unregister for a project |
| `GET`             | `/api/projects/:id/my-registration` | `USER` | Current user's registration status  |
| `GET`             | `/api/pillars`                      | —      | All pillars                         |
| `GET`             | `/api/pillars/:id`                  | —      | Single pillar                       |
| `GET`             | `/api/member-fields`                | —      | Custom member field definitions     |
| `GET`             | `/api/member-fields/:key/suggestions` | —    | Distinct values for a suggestions field |

### Admin

| Method             | Endpoint                                | Required Role |
| ------------------ | --------------------------------------- | ------------- |
| `GET`              | `/api/admin/dashboard`                  | `ADMIN`       |
| `GET`              | `/api/admin/users`                      | `ADMIN`       |
| `PATCH` / `DELETE` | `/api/admin/users/:id`                  | `SUPER_ADMIN` |
| `GET` / `POST`     | `/api/admin/projects`                   | `ADMIN`       |
| `PATCH` / `DELETE` | `/api/admin/projects/:id`               | `ADMIN`       |
| `GET`              | `/api/admin/projects/upload`            | `ADMIN`       |
| `GET` / `POST`     | `/api/admin/projects/:id/registrations` | `ADMIN`       |
| `PATCH` / `DELETE` | `/api/admin/project-registrations/:id`  | `SUPER_ADMIN` |
| `GET` / `POST`     | `/api/admin/pillars`                    | `SUPER_ADMIN` |
| `PATCH` / `DELETE` | `/api/admin/pillars/:id`                | `SUPER_ADMIN` |
| `POST`             | `/api/admin/positions`                  | `SUPER_ADMIN` |
| `PATCH` / `DELETE` | `/api/admin/positions/:id`              | `SUPER_ADMIN` |
| `PATCH`            | `/api/admin/positions/reorder`          | `SUPER_ADMIN` |
| `GET` / `PATCH`    | `/api/admin/organization`               | `SUPER_ADMIN` |
| `GET`              | `/api/admin/organization/upload`        | `SUPER_ADMIN` |
| `POST`             | `/api/admin/member-fields`              | `SUPER_ADMIN` |
| `PATCH` / `DELETE` | `/api/admin/member-fields/:id`          | `SUPER_ADMIN` |
| `PATCH`            | `/api/admin/member-fields/reorder`      | `SUPER_ADMIN` |

---

## Database Schema

| Table                   | Description                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `users`                 | Members — name, email, password hash, Google ID, role, custom field values (jsonb)           |
| `member_field_definitions` | Admin-defined custom member fields — key, label, type, required, suggestions, order       |
| `pillars`               | Organisational pillars, each with a designated director (user). The label shown for pillars across the UI is configurable via `organization.pillar_label` |
| `projects`              | Projects linked to a pillar; optional registration window and participant cap                |
| `project_images`        | Ordered images for a project                                                                 |
| `project_registrations` | Members registered for a project, with an `attended` flag                                    |
| `positions`             | Named positions (e.g. board roles) assigned to members, displayed on the home page           |
| `organization`          | Singleton row — name, logo, rich text content, Instagram and Facebook URLs                   |
| `password_reset_tokens` | Single-use, hashed, expiring tokens for password reset                                       |

## License

[MIT](./LICENSE)
