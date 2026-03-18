# EMSA Macedonia — Member Platform

The official web platform for **EMSA Macedonia** (European Medical Students' Association), built to manage members, projects, and organisational information in one place.

---

## Overview

This is a full-stack single-page application with a Bun HTTP server backend and a React frontend, served from the same process. There is no separate API server — the backend and frontend are co-located and bundled together.

Key capabilities:

- Public-facing pages for projects and organisational pillars
- Member registration and profile management
- Google OAuth login
- Role-based access control with three tiers: `USER`, `ADMIN`, `SUPER_ADMIN`
- Profile completion gate — members must complete their profile before accessing the platform
- Admin panel for managing members, projects, pillars, and organisation settings
- S3-backed image uploads with presigned URLs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Frontend | React 19, React Router v7 |
| Styling | Tailwind CSS v4, shadcn/ui (Radix UI) |
| State / Data | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Animations | Motion (Framer Motion) |
| Rich text | Tiptap |
| Drag & drop | dnd-kit |
| Backend | Bun native HTTP server |
| Database | PostgreSQL via Drizzle ORM |
| Auth | JWT (jose) + Google OAuth 2.0 |
| File storage | AWS S3 (presigned uploads) |
| Migrations | Drizzle Kit |

---

## Project Structure

```
src/
├── components/       # Shared UI components
│   ├── admin/        # Admin-only components (dialogs, layout)
│   └── ui/           # shadcn/ui primitives
├── constants/        # Enums, routes, schemas, types
├── context/          # React context (auth)
├── db/               # Drizzle schema
├── lib/              # Server utilities (db, jwt, middleware, s3, env)
├── pages/            # Page components
│   └── admin/        # Admin panel pages
├── routes/           # Bun HTTP route handlers
└── index.ts          # Entry point — serves API + built frontend
drizzle/              # Generated SQL migrations
```

---

## Pages

### Public

| Route | Description |
|---|---|
| `/` | Home — organisation hero, featured projects and pillars |
| `/projects` | All public projects |
| `/projects/:id` | Project detail with image gallery |
| `/pillars/:id` | Pillar detail |
| `/login` | Email/password or Google login |
| `/register` | New member registration (name, email, password, phone, student index, year of studies) |

### Member

| Route | Description |
|---|---|
| `/profile` | Profile page — update personal info, avatar upload |

### Admin

| Route | Required Role |
|---|---|
| `/admin/dashboard` | `ADMIN` — member stats overview |
| `/admin/users` | `ADMIN` — member list, role management |
| `/admin/projects` | `ADMIN` — create, edit, delete projects |
| `/admin/pillars` | `SUPER_ADMIN` — manage organisational pillars |
| `/admin/organization` | `SUPER_ADMIN` — organisation name, logo, description, about us |

---

## Roles

| Role | Access |
|---|---|
| `USER` | Profile, public pages |
| `ADMIN` | All of the above + dashboard, users, projects |
| `SUPER_ADMIN` | All of the above + pillars, organisation settings |

New members registered via the form receive the `USER` role. Roles can be promoted by a `SUPER_ADMIN` from the Users admin page.

---

## Profile Completion Gate

Members who have not filled in their phone number, student index, and year of studies are redirected to `/profile` on every navigation until their profile is complete. The backend enforces this too — incomplete profiles receive a `403` on all endpoints except profile read and update.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL database
- AWS S3 bucket (or compatible)
- Google OAuth app credentials

### Installation

```bash
bun install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

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
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-central-1
AWS_S3_BUCKET=your_bucket_name
```

### Database Setup

```bash
# Generate migrations from schema
bunx drizzle-kit generate

# Apply migrations
bunx drizzle-kit migrate
```

### Development

```bash
bun dev
```

Starts the server with hot reload at `http://localhost:3000`. The frontend is built on-the-fly by the Bun bundler plugin.

### Production

```bash
# Build the frontend assets
bun run build

# Start the server
bun start
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new member |
| `POST` | `/api/auth/login` | Email/password login |
| `GET` | `/api/auth/google` | Initiate Google OAuth flow |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |

### Member

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/me` | Get current user profile |
| `PATCH` | `/api/users/me` | Update current user profile |
| `GET` | `/api/upload/presigned` | Get a presigned S3 URL for avatar upload |

### Public

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/organization` | Organisation info |
| `GET` | `/api/projects` | All projects |
| `GET` | `/api/projects/:id` | Single project |
| `GET` | `/api/pillars` | All pillars |
| `GET` | `/api/pillars/:id` | Single pillar |

### Admin

| Method | Endpoint | Required Role |
|---|---|---|
| `GET` | `/api/admin/dashboard` | `ADMIN` |
| `GET` | `/api/admin/users` | `ADMIN` |
| `PATCH` | `/api/admin/users/:id` | `SUPER_ADMIN` |
| `GET` / `POST` | `/api/admin/projects` | `ADMIN` |
| `PATCH` / `DELETE` | `/api/admin/projects/:id` | `ADMIN` |
| `GET` | `/api/admin/projects/upload` | `ADMIN` |
| `GET` / `POST` | `/api/admin/pillars` | `SUPER_ADMIN` |
| `PATCH` / `DELETE` | `/api/admin/pillars/:id` | `SUPER_ADMIN` |
| `GET` / `PATCH` | `/api/admin/organization` | `SUPER_ADMIN` |
| `GET` | `/api/admin/organization/upload` | `SUPER_ADMIN` |

---

## Database Schema

| Table | Description |
|---|---|
| `users` | Members — name, email, password hash, Google ID, phone, student index, year of studies, role, profile completion status |
| `pillars` | Organisational pillars with a designated director (user) |
| `projects` | Projects linked to a pillar, with timestamps |
| `project_images` | Ordered images for a project |
| `organization` | Singleton row holding organisation name, logo, and rich text content |

---

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start development server with hot reload |
| `bun start` | Start production server |
| `bun run build` | Build frontend assets |
| `bun run lint` | Run ESLint |
| `bun run prettier` | Format all files with Prettier |
| `bunx drizzle-kit generate` | Generate a new migration from schema changes |
| `bunx drizzle-kit migrate` | Apply pending migrations |
| `bunx drizzle-kit studio` | Open Drizzle Studio (database browser) |
