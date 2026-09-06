# AI Usage & Agentic Software Engineering Report

> **Project Documentation Links:**
> - [PROJECT_INIT.md](PROJECT_INIT.md) — Original project requirements & technical specifications
> - [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Step-by-step phased execution plan
> - [README.md](README.md) — Main system architecture, setup instructions, and API docs
> - [AGENTS.md](AGENTS.md) — AI Agent coding rules and project context
> - [AI_USAGE.md](AI_USAGE.md) — This document (Agentic workflow, prompt logs, and review records)

---

## 1. Overview & AI Tools Used

This document outlines the agentic software engineering process used to design, build, test, and document **StackNeverflow**. As an Agentic Software Engineer, the development process and human oversight matter just as much as the final code. 

### Tools Utilized
| Tool | Role & Scope |
| :--- | :--- |
| **Claude Code CLI** (Anthropic) | Primary agentic coding assistant executing in the terminal. Used for interactive implementation planning, automated multi-file code editing, test generation, bash verification, and debugging. |
| **Claude 3.7 Sonnet / Claude 3.5 Sonnet** | Core LLM reasoning engine providing architectural design, full-stack TypeScript code generation (NestJS + Next.js), and code review analysis. |
| **VS Code & TypeScript LSP** | Human IDE environment for inspecting diffs, running manual browser/Postman tests, and overseeing agent output. |
| **Husky & lint-staged** | Automated pre-commit quality enforcement running Prettier, ESLint (`--fix`), and Vitest test suites prior to every git commit. |

---

## 2. Agentic Workflow & Development Methodology

The project was executed through a structured, highly iterative human-in-the-loop agentic workflow:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Requirements Scoping (Human)                                             │
│    Edited original assignment → Created PROJECT_INIT.md                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Implementation Planning (AI + Human Collaboration)                       │
│    Instructed Claude Code to generate IMPLEMENTATION_PLAN.md                │
│    Linked all Markdown documentation files                                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Plan Review & Approval (Human)                                           │
│    Reviewed proposed architecture, pruned scope, mandated tech decisions    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Iterative Task-by-Task Development Loop (Continuous)                     │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │ a. Test Generation (TDD): Prompt AI to create comprehensive      │      │
│   │    unit/integration tests before/alongside feature logic         │      │
│   └──────────────────────────────────┬───────────────────────────────┘      │
│                                      ▼                                      │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │ b. Implementation: Prompt AI to implement single task from plan  │      │
│   └──────────────────────────────────┬───────────────────────────────┘      │
│                                      ▼                                      │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │ c. Human Review & Testing: Inspect diffs, verify UX/edge cases,  │      │
│   │    run automated test suites and manual checks                   │      │
│   └──────────────────────────────────┬───────────────────────────────┘      │
│                                      ▼                                      │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │ d. Feedback & Refinement: Instruct AI on fixes, polish, or       │      │
│   │    refactoring until completely satisfied with code quality      │      │
│   └──────────────────────────────────┬───────────────────────────────┘      │
│                                      ▼                                      │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │ e. Pre-Commit Quality Gate: Husky + lint-staged automatically    │      │
│   │    runs ESLint, Prettier, and Vitest related tests               │      │
│   └──────────────────────────────────┬───────────────────────────────┘      │
│                                      ▼                                      │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │ f. Commit & Advance: Git commit with Conventional Commits,      │      │
│   │    update IMPLEMENTATION_PLAN.md, and move to next task          │      │
│   └──────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Requirements Refinement (`PROJECT_INIT.md`)
Before invoking the AI agent, the original problem prompt was analyzed and refined. Ambiguities were resolved, architectural constraints were established (Fastify adapter for NestJS, Next.js App Router with Turbopack, PostgreSQL, TypeORM migrations, strict JWT token rotation), and the full scope was documented in [PROJECT_INIT.md](PROJECT_INIT.md).

### Phase 2: Implementation Planning (`IMPLEMENTATION_PLAN.md`)
Using Claude Code, the agent was prompted to ingest `PROJECT_INIT.md` and generate a complete, phased, step-by-step roadmap in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). The agent was specifically instructed to:
- Break the project down into discrete, testable phases (Phase 0: Scaffolding, Phase 1: Auth & Users, Phase 2: Posts, Phase 3: Comments & Threading, Phase 4: Reactions & Ranking, Phase 5: Profiles, Phase 6: UI Polish).
- Cross-link all project documentation files (`PROJECT_INIT.md`, `IMPLEMENTATION_PLAN.md`, `README.md`, `AI_USAGE.md`).
- Define explicit verification criteria and test expectations for each step.

### Phase 3: Human Review & Plan Approval
The generated implementation plan was thoroughly reviewed prior to any code generation:
- **Approved**: Polymorphic reactions schema, JWT refresh cookie strategy, Next.js Server Components architecture.
- **Modified/Adjusted**: Replaced runtime `synchronize: true` with strict TypeORM migration scripts; adjusted ranking formula multipliers (`rankScore = (likes - dislikes) + (commentCount * 2)`); mandated batch reaction queries to prevent N+1 frontend fetches.

### Phase 4: Iterative "Test-Implement-Review-Commit" Loop
For each step in `IMPLEMENTATION_PLAN.md`:
1. **Test-First Generation**: Instructed the AI to write unit and service tests upfront covering edge cases, authorization rules, and error handling.
2. **Atomic Execution**: Instructed the AI to focus exclusively on one discrete task at a time, preventing out-of-control context bloat and hallucinated changes across unrelated files.
3. **Personal Human Code Review**: Every line of generated code was inspected for architectural consistency, correct TypeScript types, error handling, and performance.
4. **Interactive Feedback & Refinement**: Where the AI fell short (e.g. nested button elements, misaligned SVG threadlines, or missing validation), specific targeted feedback was supplied until the output met production standards.
5. **Automated Pre-Commit Quality Gate**: Before any code was committed, the automated Husky pre-commit hook executed `lint-staged`:
   ```json
   "lint-staged": {
     "backend/src/**/*.ts": [
       "bash -c 'cd backend && npx eslint --fix --no-warn-ignored ${0}'",
       "bash -c 'cd backend && npx vitest related --run --reporter=verbose'"
     ],
     "backend/**/*.{ts,json,md}": [
       "bash -c 'cd backend && npx prettier --write ${0}'"
     ]
   }
   ```
6. **Commit & Checkpoint**: The verified change was committed with a descriptive Conventional Commit message, and the next step on the plan was initiated.

---

## 3. Example Prompts & Instruction Logs

### 1. Planning & Setup
> **Prompt:**  
> *"Read `PROJECT_INIT.md`. Create a comprehensive `IMPLEMENTATION_PLAN.md` breaking down the entire build into granular, verifiable steps across backend and frontend. Include file paths, test strategies, and cross-link all markdown files (`PROJECT_INIT.md`, `IMPLEMENTATION_PLAN.md`, `README.md`, `AI_USAGE.md`). Do not start writing code until I review and approve the plan."*

### 2. Test Generation (TDD Approach)
> **Prompt:**  
> *"Before implementing `PostsService`, generate a comprehensive test suite in `backend/src/posts/posts.service.spec.ts` covering: create post, pagination with search queries, post ranking calculation, reaction count increments, and unauthorized post modifications. Mock TypeORM repository dependencies."*

### 3. Feature Implementation
> **Prompt:**  
> *"Now implement Step 2.3 from `IMPLEMENTATION_PLAN.md`: build the `PostsService` and `PostsController` using the NestJS Fastify adapter. Ensure responses adhere to our standard API envelope (`{ success: true, data: ... }`) and validate all inputs with class-validator DTOs. Run the tests to ensure they pass."*

### 4. Interactive Feedback & Correction
> **Prompt:**  
> *"The comment replies look flat and hard to distinguish. Implement Reddit/Facebook-style visual connectors: draw an L-shaped connector from parent to child avatar, and a vertical guide line linking siblings. Ensure the vertical guide height dynamically adjusts to parent comment height without breaking on deeply nested replies."*

---

## 4. What Was Personally Reviewed, Rejected, or Rewritten

| Area | AI Initial Suggestion / Draft | Human Review & Rejection | Final Solution Implemented |
| :--- | :--- | :--- | :--- |
| **Database Schema** | Separate `post_reactions` and `comment_reactions` tables with duplicate logic. | **Rejected**: Duplicated code, harder to maintain, and requires separate endpoints. | Designed a single polymorphic `Reaction` entity with `targetType` (`post` \| `comment`) and `targetId`, protected by a unique composite constraint `(userId, targetType, targetId)`. |
| **API Performance** | Fetching reactions individually per post when rendering the feed (`N` API calls). | **Rejected**: N+1 API request cascade causing slow load times and network overhead. | Implemented `GET /reactions/me/batch?targetType=post&targetIds=...` to retrieve all user reactions for a full page of posts in a single round-trip. |
| **Frontend HTML** | Wrapped HeroUI `DropdownTrigger` around a `<Button>`, resulting in nested `<button>` tags. | **Rejected**: Invalid HTML semantics triggering React hydration errors in browser console. | Refactored `Navbar.tsx` to use custom triggering element or `as="div"` to maintain clean, valid DOM hierarchy. |
| **Comment Threading** | Simple left margin indentation for nested comments. | **Rejected**: Poor UX on mobile and hard to trace deep conversation threads. | Designed dynamic SVG/CSS threaded connectors with interactive collapse/expand and avatar-to-avatar alignment. |
| **Auth State UX** | Page loaded showing "Log In" / "Register" buttons momentarily before JWT auth check resolved. | **Rejected**: Unpleasant layout shift and flash of unauthenticated content. | Introduced an auth loading skeleton state in `Navbar.tsx` that renders while `useAuth()` verifies session cookies. |
| **Form Inputs** | AI attempted to pass a `label` prop to custom HeroUI `Textarea` components. | **Rejected**: HeroUI's custom wrapper doesn't support the raw prop in that version, causing React warnings. | Replaced with standard accessible label tags and Tailwind styled wrappers. |

---

## 5. Case Studies: Bugs Caught & How They Were Fixed

### Case Study 1: Seed Script Crash with NestJS Decorators & `ts-node`
- **Bug Caught:** The initial seed script failed during execution with `Cannot find module constants.js` / ESM loader failure when executing `npm run seed`.
- **Root Cause:** The seed script directly imported entity files that included NestJS Swagger decorators (`@ApiProperty`). When run outside the NestJS compiler via standalone `ts-node`, the decorator metadata and ESM module resolution broke.
- **Human Action & Fix:** Caught during local verification. Instructed Claude Code to isolate seed entity definitions from runtime NestJS controller decorators, creating clean standalone schema references for the database seeder.
- **Commit:** [`2dfad6f`](https://github.com/) — *fix(backend): fix seed script entity definitions and ESLint errors*

### Case Study 2: Invalid Nested `<button>` in Navbar Dropdown
- **Bug Caught:** React console displayed hydration warnings: `Warning: validateDOMNesting(...): <button> cannot appear as a descendant of <button>`.
- **Root Cause:** The AI placed a `<Button>` component inside HeroUI's `<DropdownTrigger>`, which itself rendered a native `<button>`.
- **Human Action & Fix:** Detected via browser developer tools. Rewrote the trigger component to pass an unstyled trigger wrapper with accessible ARIA tags, eliminating the nesting error.
- **Commit:** [`9eb2a44`](https://github.com/) — *fix(frontend): remove nested `<button>` in Navbar DropdownTrigger*

### Case Study 3: Comment Connector Line Height Disconnect
- **Bug Caught:** When a parent comment had multiple long paragraphs or markdown code blocks, the SVG vertical guide line ended prematurely, leaving child replies floating without connection.
- **Root Cause:** The AI used hardcoded pixel offsets for connector heights (`calc(100% - 24px)`), which failed when child comments were spaced dynamically.
- **Human Action & Fix:** Reviewed the rendered UI and rejected the static CSS approach. Guided the AI to compute the vertical connector height dynamically based on DOM node positioning, creating a pixel-perfect threadline.
- **Commit:** [`17df73b`](https://github.com/) / [`fc4bc5b`](https://github.com/) — *feat(frontend): implement Reddit-style comment tree with interactive threadlines*

### Case Study 4: Reaction Button Rapid-Click Race Condition
- **Bug Caught:** Rapidly clicking the like/dislike button caused count flickering and inconsistent state if a second click was fired before the first API request resolved.
- **Root Cause:** The optimistic update state lacked an `isMutating` lock, allowing overlapping asynchronous requests with stale toggle states.
- **Human Action & Fix:** Added an immediate disabled state during pending mutations and an automatic rollback mechanism to revert optimistic counts if the server returned an error.
- **Commit:** [`bca4d56`](https://github.com/) — *feat(frontend): implement interactive post reactions with optimistic updates*

---

## 6. Automated Quality Assurance & Testing

High quality was guaranteed through continuous automated testing and pre-commit hooks:

1. **67+ Passing Backend Tests (Vitest)**:
   - Auth Service: Token generation, rotation, bcrypt verification, invalid credential handling.
   - Posts Service: CRUD, search filters, rank score calculation algorithm, author permissions.
   - Comments Service: Threading hierarchy, parent-child relations, cascade reactions.
   - Reactions Service: Toggle semantics (like → remove, like → dislike), batch retrieval.
   - Developers Service: Skills array updates, experience timeline ordering.
2. **Husky Pre-Commit Automation**:
   - Every `git commit` automatically triggers ESLint and Prettier across staged files.
   - Related Vitest unit tests execute automatically against changed backend files, preventing broken code from ever being committed.
3. **End-to-End Type Safety**:
   - Zero TypeScript errors (`strict: true`) across both `frontend/` and `backend/`.

---

## 7. Metrics & Final Reflection

| Metric | Measurement |
| :--- | :--- |
| **Total Automated Tests** | 67 passing unit & service tests |
| **TypeScript Compilation Errors** | 0 errors across entire monorepo |
| **ESLint / Prettier Violations** | 0 violations (enforced via pre-commit hooks) |
| **Development Velocity Improvement** | Estimated 60% acceleration vs manual boilerplate coding |
| **Human Code Modification / Review** | 100% of generated modules reviewed and verified |

### Key Takeaway
AI agents like Claude Code excel at rapid scaffolding, test generation, and pattern-matching standard architectural patterns. However, an **Agentic Software Engineer** remains vital for:
1. Formulating clear, unambiguous system requirements before code is written.
2. Structuring granular implementation roadmaps and enforcing test-driven workflows.
3. Catching subtle runtime bugs, framework mismatches, and performance bottlenecks (e.g. N+1 queries, hydration issues, decorator failures).
4. Refining visual design, user experience, and interactive nuances to a production-ready standard.
