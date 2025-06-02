---
trigger: manual
---

# Development Guidelines for Next-Forge SaaS Project

This document outlines the project structure, coding standards, and best practices for developing **this Next-Forge SaaS Project**. Adhering to these guidelines will help maintain code quality, consistency, and ease of collaboration.

## 1. Overview & Tech Stack

This project is a Software as a Service (SaaS) application built using the `next-forge` starter kit. Key technologies include:

* **Monorepo:** Turborepo (managed with `pnpm` workspaces)
* **Frontend Framework:** Next.js (likely using the App Router)
* **Package Manager:** `pnpm`
* **Language:** TypeScript
* **Database ORM:** Prisma
* **Database:** PostgreSQL
* **UI (for `app`):** shadcn/ui (built on Radix UI and Tailwind CSS)
* **UI (for `web`):** twblocks (Tailwind CSS based templates)
* **Styling:** Tailwind CSS (utility-first approach)
* **Email Previews (`email` app):** react.email
* **API/Serverless Functions (`api` app):** Next.js Route Handlers or standalone serverless functions.
* **Documentation (`docs` app):** Likely using a static site generator or MDX-based solution.
* **Component Library (`storybook` app):** Storybook
* **Database Management (`studio` app):** Prisma Studio
* **Environment Variables:** `@t3-oss/env-nextjs` for type-safe environment variables.
* **Deployment:** DigitalOcean App Platform

## 2. Project Structure

The project is organized as a monorepo using Turborepo. Key directories include:

* **`apps/`**: Contains deployable applications.
    ```
    | App       | Description                                                                    |
    |-----------|--------------------------------------------------------------------------------|
    | api       | Serverless functions/backend logic, e.g., webhooks, cron jobs, standalone API. |
    | app       | The main user-facing SaaS application (e.g., dashboard, core features).        |
    | docs      | Project documentation, guides, and tutorials.                                  |
    | email     | Email templates and preview server (using react.email).                        |
    | storybook | UI component development and showcase environment.                             |
    | studio    | Prisma Studio for direct database interaction (development only).              |
    | web       | Public-facing website/landing pages.                                           |
    ```
* **`packages/`**: Contains shared libraries, configurations, and utilities used across different applications. Examples might include:
    * `@repo/ui` (shared React components)
    * `@repo/database` (Prisma schema, client, seeding logic)
    * `@repo/config` (shared ESLint, TypeScript configs)
    * `@repo/utils` (common utility functions)

Making changes to files should be done in their respective app or package.

## 3. Development Environment Setup

1.  **Clone Repository:** `git clone <your-repo-url>`
2.  **Node.js & pnpm:**
    * Ensure you have Node.js installed (version `>=18` as per `package.json` `engines`). Using a Node version manager like `nvm` is recommended.
    * Enable `corepack` (if not already) to use the `pnpm` version specified in the root `package.json` (`packageManager` field): `corepack enable`
3.  **Install Dependencies:** From the monorepo root:
    ```bash
    pnpm install
    ```
4.  **Environment Variables:**
    * Copy the root `.env.example` to a new `.env` file: `cp .env.example .env`
    * Update the `.env` file with your local development credentials, especially:
        * `DATABASE_URL`: Point this to your local PostgreSQL instance (e.g., `postgresql://user:password@localhost:5432/your_dev_db_name?schema=public`).
        * Other necessary API keys for local development (Clerk, Stripe test keys, etc.). Consult `env.ts` or similar files managed by `@t3-oss/env-nextjs` for required variables.
5.  **Database Setup (Local):**
    * Ensure your local PostgreSQL server is running.
    * Apply migrations to set up the schema:
        ```bash
        pnpm exec prisma migrate dev
        ```
    * (Optional) If a seed script exists (`prisma/seed.ts` or similar and configured in `prisma.seed` in `package.json`):
        ```bash
        pnpm exec prisma db seed
        ```
6.  **Run Prisma Generate (if not handled by postinstall):**
    To ensure Prisma Client is up-to-date with your schema:
    ```bash
    pnpm --filter @repo/database exec prisma generate # Or relevant package
    ```
7.  **Start Development Servers:**
    * To run a specific app (e.g., `web`):
        ```bash
        pnpm --filter web dev
        ```
    * To run all apps (refer to `turbo.json` or root `package.json` `dev` script):
        ```bash
        pnpm dev
        ```

## 4. Coding Standards & Conventions

### General
* **Language:** Use TypeScript for all new code.
* **Formatting & Linting:** Adhere to the project's ESLint and Prettier configurations (often enforced via pre-commit hooks).
* **File Naming:** Use kebab-case for files and directories (e.g., `user-profile.tsx`). Component files in React should be PascalCase (e.g., `UserProfile.tsx`).

### Nesting
* Avoid deeply nested code blocks (more than 2-3 levels if possible). Break down complex logic into smaller, well-named functions or components.
* Opening curly braces (`{`) for blocks (functions, if/else, loops, try/catch) should generally be on the same line as the statement that begins the block.
    ```typescript
    // Good
    if (condition) {
      // ...
    }

    function greet() {
      // ...
    }
    ```

### Error Handling
* **Specificity:** Always try to catch specific error types instead of generic `Error` or `any`, if possible.
    ```typescript
    try {
      // code that might throw
    } catch (error) {
      if (error instanceof SpecificPrismaError) { // Replace SpecificPrismaError with actual error type if known
        // handle Prisma error
      } else if (error instanceof MyCustomError) { // Replace MyCustomError with your actual custom 