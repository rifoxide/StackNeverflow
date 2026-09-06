# StackNeverflow — Agent Guidelines & System Context

> **Project Documentation Links:**
> - [PROJECT_INIT.md](PROJECT_INIT.md) — Original project requirements & specifications
> - [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Phased task breakdown & execution checklist
> - [README.md](README.md) — System setup, local installation, and API documentation
> - [AI_USAGE.md](AI_USAGE.md) — Agentic software engineering workflow & review report
> - [AGENTS.md](AGENTS.md) — This document (Agent instructions and rules)

---

## 1. System Architecture

StackNeverflow is a full-stack developer community platform:
- **Backend (`/backend`)**: NestJS 12 with Fastify adapter, TypeORM, PostgreSQL, Passport JWT (access + httpOnly refresh tokens), Vitest test suite, Swagger OpenAPI (`/api`).
- **Frontend (`/frontend`)**: Next.js 16 (App Router + Turbopack), React 19, TypeScript, Tailwind CSS, HeroUI components, Axios with interceptors, react-markdown.
- **Root**: Monorepo orchestration, Docker Compose (`docker-compose.yml`), Husky pre-commit hooks + lint-staged.

---

## 2. Agent Workflow & Execution Rules

When interacting with or modifying this repository, AI agents must follow these principles:

1. **Step-by-Step Task Execution**:
   - Refer to [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) before starting any feature work.
   - Implement one discrete task at a time. Do not make unrequested sweeping changes across unrelated directories.

2. **Test-Driven Development (TDD)**:
   - Always write or update Vitest unit tests in `backend/src/**/*.spec.ts` alongside service logic.
   - Run tests (`npm test` in `backend/`) and ensure all pass before declaring a task complete.

3. **API & Data Contracts**:
   - Backend responses must adhere to the standard envelope:
     ```json
     {
       "success": true,
       "data": { ... },
       "message": "Optional human-readable message"
     }
     ```
   - Errors must adhere to the standard error envelope:
     ```json
     {
       "success": false,
       "statusCode": 400,
       "message": "Error description",
       "errors": []
     }
     ```
   - Use TypeORM migrations for database changes (`npm run migration:generate`), never runtime schema synchronization.

4. **Frontend Guidelines**:
   - Use Next.js App Router conventions with Server Components by default; use `'use client'` only when state, effects, or browser APIs are required.
   - Avoid invalid DOM nesting (e.g. `<button>` inside `<button>` or unstyled triggers inside HeroUI dropdowns).
   - Support optimistic UI updates with automatic rollback on error for high-frequency actions (likes/dislikes).

5. **Automated Quality Gates**:
   - Before committing, pre-commit hooks (Husky + lint-staged) automatically run Prettier, ESLint (`--fix`), and related Vitest tests.
   - Ensure code passes with 0 TypeScript and ESLint warnings.
   - Use Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`).
