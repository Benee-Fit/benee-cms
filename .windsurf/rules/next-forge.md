---
trigger: manual
---

# Windsurf: Core Rules for Next-Forge Project Interaction

**Objective:** Guide Windsurf (AI Assistant) to correctly understand, navigate, and modify this Next-Forge (Turborepo, pnpm, Next.js, Prisma) project, prioritizing internal packages and established conventions.

**Core Principle:** Prioritize using existing `@repo/*` packages and established project patterns. When new functionality is needed, first evaluate if it fits within an existing shared package or requires a new one. Query if unsure before introducing new public dependencies directly into individual applications.

---

## 1. Monorepo Structure & Navigation

* **Understand `apps/` vs. `packages/`:**
    * `apps/`: Contain deployable applications (e.g., `web`, `app`, `api`, `docs`, `email`). Each is a distinct operational unit.
    * `packages/`: Contain shared libraries and utilities (e.g., `@repo/ui`, `@repo/database`, `@repo/utils`, `@repo/config`, `@repo/feature-flags`). Code here is for consumption by one or more `apps/`. 
* **Targeting Changes:** Correctly identify if modifications are app-specific (belong in `apps/*`) or represent a shared concern (belong in `packages/*`).
* **`turbo.json` Reference:** This file at the root defines build/dev/lint/test pipelines and dependencies between workspaces. Consult it to understand task execution and inter-package relationships.

## 2. Dependency Management (`pnpm` & Workspaces)

* **Exclusive Tool:** All package management operations (add, remove, update) MUST use `pnpm` from the monorepo root.
* **Prioritize Internal Packages (`@repo/*`):**
    * **Rule:** Before adding a public npm package directly to an `app/*`, Windsurf MUST verify if an existing `@repo/*` package already provides the required functionality or a suitable abstraction (e.g., use `@repo/auth` for authentication & @repo/design-system/components/ui/).
    * **Action:** If functionality is generic or reusable across apps, propose adding it to, or extending, an existing `packages/*` module.
* **Adding Dependencies Correctly:**
    * To an application (e.g., `web`): `pnpm --filter web add <package-name>`
    * To an internal package (e.g., `@repo/ui`): `pnpm --filter @repo/ui add <package-name>`
    * To the monorepo root (for shared development tools like `prisma`, `turbo`): `pnpm add -D -w <package-name>`
* **`workspace:*` Protocol:** Always use the `workspace:*` protocol in `package.json` files for linking local monorepo packages.
* **`pnpm-lock.yaml` Integrity:** After any dependency modification, `pnpm install` MUST be run from the monorepo root to update the `pnpm-lock.yaml` file. This lockfile is critical for reproducible builds and MUST be committed alongside any `package.json` changes.
* **Avoid Redundant Installations:** If a shared `@repo/*` package already includes and configures a public dependency (e.g., `@repo/auth` managing `@clerk/nextjs`), Windsurf must not suggest installing that public dependency again directly into an application that already uses the managing `@repo/*` package.

## 3. Code Placement & Imports

* **App-Specific Logic:** Code that is only relevant to a single application should reside within that app's directory structure (e.g., `apps/web/src/...`).
* **Shared Logic & UI:** Code intended for use by multiple applications should be placed in an appropriate shared `packages/*` directory.
* **Import Paths:** Windsurf MUST use the defined workspace aliases for importing from internal packages (e.g., `import { MyComponent } from '@repo/ui';`). Avoid relative paths like `../../packages/ui`.

## 4. Core Technology Usage

* **Next.js (App Router Focus):**
    * Adhere to App Router conventions (`page.tsx`, `layout.tsx`, Route Handlers for APIs).
    * Default to React Server Components. Use `'use client';` only when client-side interactivity or browser-specific APIs are essential.
* **Prisma (via `@repo/database`):**
    * The Prisma schema is central: `packages/database/prisma/schema.prisma`.
    * For schema changes, generate migrations: `pnpm --filter @repo/database exec prisma migrate dev --name <migration-name>`.
    * Applications should import and use the Prisma client instance from `@repo/database`. Prisma Client generation is typically part of the build script for `@repo/database`.
* **Styling (Tailwind CSS & `shadcn/ui`):**
    * Primarily use Tailwind CSS utility classes.
    * Applications like `apps/app` heavily leverage `shadcn/ui`. Use and customize these components as per project style. New `shadcn/ui` components are added to the app itself (`pnpm --filter app exec pnpm dlx shadcn-ui@latest add ...`).
    * Generic, non-`shadcn/ui` specific UI elements for cross-app use belong in `@repo/ui` (or `@repo/design-system`) and should be developed/viewed in Storybook (`apps/storybook`).

## 5. Running Commands & Development Workflow

* **Turborepo Tasks:** Utilize `pnpm turbo run <task> --filter=<scope>` for consistent execution of `build`, `dev`, `lint`, `test` scripts defined in `turbo.json`.
* **Development Servers:**
    * Start a specific app's dev server: `pnpm --filter <app-name> dev`.
    * Run all dev servers (as per root `dev` script): `pnpm dev`.
* **Production Start Script (Next.js):**
    * Ensure the `start` script in the deployable app's `package.json` (e.g., `apps/web/package.json`) is appropriate for the `output` mode in its `next.config.js`.
    * For default output or `output: "export"` with a separate server: `"start": "next start -p $PORT"`
    * If `output: "standalone"` is used: `"start": "node .next/standalone/server.js"` (this script respects `$PORT`). Windsurf must verify this matches the app's Next.js configuration.

## 6. Environment Variables

* Recognize and respect the type-safe environment variable setup (e.g., often using `@t3-oss/env-nextjs`). Schemas are typically per-app.
* Local secrets are in `.env` files (gitignored). `.env.example` files serve as templates.
* Production environment variables are configured directly on