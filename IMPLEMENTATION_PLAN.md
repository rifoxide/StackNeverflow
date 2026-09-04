# StackNeverflow — Implementation Plan

## Context

Build a production-grade developer community platform from an empty repo. Requirements are in `PROJECT_INIT.md`: auth with refresh tokens, posts, threaded comments, reactions (like/dislike), developer profiles, post ranking, Swagger, and a responsive Next.js frontend — all backed by PostgreSQL.

**Stack & Decisions:**

| Concern | Choice |
|---|---|
| Database | PostgreSQL via Docker Compose |
| Backend | NestJS + Fastify + TypeORM (migrations, not synchronize) |
| Frontend | Next.js 15 (app router) + Turbopack + Tailwind CSS + shadcn/ui + Axios |
| Auth | JWT access tokens (15min) + refresh tokens (7 days, httpOnly cookie) |
| Repo | Simple monorepo — `backend/` and `frontend/` with separate `package.json` |
| Package manager | npm |
| Testing | Jest (backend services + ranking logic) |

---

## Phase 0 — Infrastructure & Scaffolding

### Step 0.1: Root project + Docker Compose

**Files:** `package.json`, `.gitignore`, `.env.example`, `docker-compose.yml`, `AI_USAGE.md`

- Root `package.json` (private, convenience scripts: `dev:backend`, `dev:frontend`, `dev` for both via `concurrently`)
- `.gitignore`: node_modules, dist, .env, .next, coverage, .turbo, *.log
- `.env.example`:
  ```
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stackneverflow
  JWT_ACCESS_SECRET=change-me-access
  JWT_REFRESH_SECRET=change-me-refresh
  JWT_ACCESS_EXPIRATION=900
  JWT_REFRESH_EXPIRATION=604800
  BACKEND_PORT=3001
  FRONTEND_URL=http://localhost:3000
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```
- `docker-compose.yml`: PostgreSQL 16 (port 5432, named volume, healthcheck)
- Empty `AI_USAGE.md` placeholder

**Verify:** `docker compose up -d` → PostgreSQL healthy. `psql postgresql://postgres:postgres@localhost:5432/stackneverflow` connects.

### Step 0.2: NestJS backend with Fastify

- Scaffold with `@nestjs/cli`, swap to `FastifyAdapter`
- Install core deps: `@nestjs/platform-fastify`, `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`, `class-validator`, `class-transformer`, `@fastify/cookie`, `@fastify/helmet`, `@fastify/cors`
- Remove Express deps
- Configure `ConfigModule.forRoot({ isGlobal: true, validationSchema })` with Joi for env validation
- Configure TypeORM with `migrations` (not synchronize) — create `backend/src/database/migrations/` dir and `data-source.ts` for CLI
- Structure:
  ```
  backend/
  ├── src/
  │   ├── common/          # guards, interceptors, filters, decorators, pipes
  │   ├── config/           # env validation schema
  │   ├── database/         # data-source, migrations, seed
  │   ├── auth/
  │   ├── users/
  │   ├── developers/
  │   ├── posts/
  │   ├── comments/
  │   ├── reactions/
  │   └── main.ts
  ├── test/                 # e2e test stubs
  └── package.json
  ```

**Verify:** `cd backend && npm run start:dev` — starts on :3001, connects to PostgreSQL, logs "TypeOrmModule initialized."

### Step 0.3: Next.js frontend with Turbopack + shadcn/ui

- `create-next-app` with `--typescript --app --turbopack --eslint --tailwind`
- Install: `axios`
- Initialize shadcn/ui: `npx shadcn@latest init` (default config, CSS variables style)
- Add base components: `npx shadcn@latest add button input textarea card skeleton badge avatar dropdown-menu`
- Structure:
  ```
  frontend/
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   ├── auth/
  │   ├── posts/
  │   ├── developers/
  │   └── profile/
  ├── components/
  │   ├── ui/              # shadcn/ui primitives (auto-generated)
  │   └── layout/          # Navbar, Footer, Container
  ├── contexts/
  ├── hooks/
  ├── lib/
  │   ├── api.ts
  │   ├── types.ts
  │   └── utils.ts        # cn() utility from shadcn
  └── package.json
  ```

**Verify:** `cd frontend && npm run dev` — starts on :3000 with Turbopack.

---

## Phase 1 — Response Envelope, Auth & Refresh Tokens (B1, B9)

### Step 1.1: Consistent response envelope (B9)

**Files:** `backend/src/common/interceptors/response.interceptor.ts`, `backend/src/common/filters/http-exception.filter.ts`, `backend/src/common/filters/all-exceptions.filter.ts`

- `ResponseInterceptor` wraps all successful responses → `{ success: true, data, message: "OK" }`
- `HttpExceptionFilter` catches `HttpException` → `{ success: false, statusCode, message, errors: [] }`
- `AllExceptionsFilter` catches unhandled errors → 500 with generic message (no leak of internals)
- Global `ValidationPipe` with `whitelist: true, transform: true, forbidNonWhitelisted: true`
- Register globally in `main.ts`

**Verify:**
```bash
curl localhost:3001        # → { success: true, data: "Hello World!", message: "OK" }
curl localhost:3001/nope   # → { success: false, statusCode: 404, ... }
```

### Step 1.2: User entity + registration (B1 partial)

**Files:** `backend/src/users/`, `backend/src/auth/`

- `user.entity.ts`: `id` (uuid PK generated), `name`, `email` (unique index), `passwordHash`, `refreshTokenHash` (nullable), `createdAt`, `updatedAt`
- `users.service.ts`: `findByEmail()`, `findById()`, `create()`, `updateRefreshToken()`
- `auth.controller.ts` → `POST /auth/register`
- Hash password with bcrypt (12 rounds). Return user data (exclude passwordHash, refreshTokenHash via `class-transformer @Exclude`).
- `register.dto.ts`: `name` (IsNotEmpty, MaxLength 100), `email` (IsEmail), `password` (MinLength 8, MaxLength 72)
- Initial migration: `CreateUsersTable`

**Verify:**
```bash
curl -X POST localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@test.com","password":"12345678"}'
# → 201 { success: true, data: { id, name, email, createdAt } }
# Same email again → 409
# Missing fields → 400 with errors[]
```

### Step 1.3: JWT access + refresh token login (B1 complete)

**Files:** `backend/src/auth/`

- Install: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
- `POST /auth/login` → validates credentials → returns `{ accessToken }` in body + sets `refreshToken` as httpOnly, secure, sameSite=strict cookie
- `POST /auth/refresh` → reads refreshToken from cookie, validates, issues new access + refresh tokens (token rotation)
- `POST /auth/logout` → clears refreshToken cookie, nullifies `refreshTokenHash` in DB
- `GET /auth/me` → returns current user (protected)
- `jwt.strategy.ts` — validates access token, attaches user to request
- `jwt-refresh.strategy.ts` — validates refresh token from cookie
- JWT access payload: `{ sub: userId, email }`
- RefreshToken: hashed with bcrypt before storing

**Verify:**
```bash
# Login → accessToken in body, refreshToken in Set-Cookie
# /auth/me with Bearer accessToken → 200 user data
# /auth/refresh with cookie → new accessToken + rotated cookie
# /auth/logout → cookie cleared, subsequent refresh fails
# Expired/invalid token → 401
```

### Step 1.4: Global auth guard + decorators

**Files:** `backend/src/common/decorators/`, `backend/src/common/guards/`

- `@Public()` decorator + metadata key → marks routes that skip auth
- `@CurrentUser()` param decorator → extracts user from `request.user`
- `JwtAuthGuard` set as global guard via `APP_GUARD` → all routes protected by default
- Mark register, login, refresh as `@Public()`

**Verify:** All new routes require JWT unless `@Public()`. Existing public routes still work.

---

## Phase 2 — Core Data Models & CRUD (B2–B6)

### Step 2.1: Developer profiles (B2)

**Files:** `backend/src/developers/`, `backend/src/users/` (entity updates)

- `skill.entity.ts`: `id` (uuid), `userId` (FK), `name` (string). ManyToOne → User, cascade delete.
- `experience.entity.ts`: `id`, `userId` (FK), `title`, `company`, `fromDate` (Date), `toDate` (Date, nullable), `description` (text). ManyToOne → User.
- User entity gets OneToMany relations to both.
- Migration: `CreateSkillsAndExperiencesTables`
- Endpoints:
  - `GET /developers/:id` (@Public) — profile with skills + experiences, eager-loaded
  - `GET /developers/me` — own profile
  - `PUT /developers/me/skills` — replace skills array (delete-then-insert in transaction)
  - `PUT /developers/me/experiences` — replace experiences
- DTOs with full validation (MaxLength, IsDateString, etc.)

**Verify:** PUT skills → GET profile returns them. PUT experiences → same. Other user's profile → visible. Unauthenticated PUT → 401.

### Step 2.2: Posts CRUD (B3)

**Files:** `backend/src/posts/`

- `post.entity.ts`: `id` (uuid), `authorId` (FK → User), `title`, `body` (text), `createdAt`, `updatedAt`, `likesCount` (default 0), `dislikesCount` (default 0), `commentCount` (default 0), `rankScore` (float, default 0)
- ManyToOne → User (author). Indexes on `rankScore`, `createdAt`.
- Migration: `CreatePostsTable`
- Endpoints:
  - `POST /posts` — create (protected)
  - `GET /posts` (@Public) — list, ordered by `rankScore DESC, createdAt DESC`. Supports `?page=1&limit=20` (cursor or offset). Includes author `{ id, name }`.
  - `GET /posts/:id` (@Public) — single post with author. 404 if not found.
  - `GET /posts?search=keyword` (@Public) — filter by title/body ILIKE
- `create-post.dto.ts`: `title` (IsNotEmpty, MaxLength 255), `body` (IsNotEmpty)

**Verify:** Create post → appears in list. GET by id → full post. Search → filtered. Pagination returns correct pages + meta `{ page, limit, total, totalPages }`.

### Step 2.3: Comments + replies (B4, B5)

**Files:** `backend/src/comments/`

- `comment.entity.ts`: `id`, `postId` (FK), `authorId` (FK), `parentCommentId` (nullable self-FK), `body` (text), `createdAt`, `likesCount` (0), `dislikesCount` (0)
- ManyToOne → Post, User, Comment (parent). OneToMany → Comment (children).
- Migration: `CreateCommentsTable`
- Endpoints:
  - `POST /posts/:postId/comments` — create comment. Optional `parentCommentId` in body. Validates parent exists and belongs to same post. Increments `post.commentCount` (in a transaction).
  - `GET /posts/:postId/comments` (@Public) — flat list with `parentCommentId`, ordered by `createdAt ASC`. Includes author `{ id, name }`. Frontend builds tree.

**Verify:** Create top-level comment → commentCount increments. Create reply with parentCommentId → returned with parent set. Invalid parentCommentId → 400. GET returns flat list with parentCommentId field.

### Step 2.4: Reactions (B6)

**Files:** `backend/src/reactions/`

- `reaction.entity.ts`: `id`, `userId` (FK), `targetType` (enum: `post` | `comment`), `targetId` (uuid), `type` (enum: `like` | `dislike`), `createdAt`
- Unique constraint on `(userId, targetType, targetId)`
- Migration: `CreateReactionsTable`
- No FK to post/comment (polymorphic). Service validates target exists.
- `POST /reactions` (protected) — toggle logic in a transaction:
  - No existing reaction → create
  - Same type → remove (toggle off)
  - Opposite type → switch
  - After mutation, recalculate target's `likesCount` / `dislikesCount` via COUNT query
- `GET /reactions/me?targetType=post&targetId=xxx` — current user's reaction
- `GET /reactions/me/batch?targetType=post&targetIds=id1,id2,id3` — batch: returns `{ [targetId]: "like" | "dislike" | null }` (for feed perf, avoids N+1)

**Verify:**
```bash
# Like post → likesCount=1
# Like again → likesCount=0 (toggled off)
# Like then dislike → likes=0, dislikes=1 (switched)
# Batch endpoint returns map of user's reactions for multiple targets
```

---

## Phase 3 — Ranking, Swagger & Tests (B7, B8)

### Step 3.1: Post ranking (B7)

**Files:** `backend/src/posts/posts.service.ts`, integrate in `reactions.service.ts`, `comments.service.ts`

- `PostsService.recalculateRankScore(postId: string)`:
  ```
  score = (likesCount - dislikesCount) + (commentCount * 2)
  ```
- Called from:
  - `ReactionsService` after any reaction mutation on a post
  - `CommentsService` after creating a comment (commentCount changed)
- GET `/posts` already sorts by `rankScore DESC, createdAt DESC` (tie-break)

**Verify:** Create two posts. Like post A 3 times (score=3). Comment on post B 3 times (score=6). `GET /posts` → B first. Add 4 more likes to A (score=7) → A first.

### Step 3.2: Swagger documentation (B8)

**Files:** `backend/src/main.ts`, all controllers + DTOs

- Install `@nestjs/swagger`
- Configure at `/api/docs` with Bearer auth in `main.ts`
- Add across all controllers: `@ApiTags()`, `@ApiBearerAuth()`, `@ApiOperation()`, `@ApiResponse()` for key status codes
- Add across all DTOs: `@ApiProperty()` with descriptions and examples
- Add across all entity serializations: `@ApiProperty()`
- Group by: Auth, Developers, Posts, Comments, Reactions

**Verify:** `http://localhost:3001/api/docs` — all endpoints listed, grouped, with request/response schemas. Authorize with JWT → try out endpoints from browser.

### Step 3.3: Backend unit tests

**Files:** `backend/src/**/*.spec.ts`

- `auth.service.spec.ts`: register (hash, duplicate email), login (valid/invalid), token generation, refresh flow
- `posts.service.spec.ts`: create, findAll (ordering/pagination), findOne, rank recalculation
- `reactions.service.spec.ts`: create new, toggle same type, switch opposite type, count updates
- `comments.service.spec.ts`: create top-level, create reply (valid/invalid parent), commentCount update
- `ranking.spec.ts`: isolated tests for score formula edge cases (all likes, all dislikes, zero state, large numbers)
- Mock TypeORM repositories with `@nestjs/testing` + `jest.fn()`

**Verify:** `cd backend && npm test` — all pass. `npm run test:cov` — coverage report generated.

---

## Phase 4 — Frontend Foundation (F1, F2, F3, F4, F7)

### Step 4.1: API client + auth context (F7, F1 partial)

**Files:** `frontend/lib/api.ts`, `frontend/lib/types.ts`, `frontend/contexts/AuthContext.tsx`

- `api.ts`: Axios instance with `baseURL` from `NEXT_PUBLIC_API_URL`. Request interceptor: attach `Bearer` token from localStorage. Response interceptor: unwrap `data.data` from envelope. Error interceptor: on 401, attempt `/auth/refresh` (cookie-based), retry original request; on second 401, logout.
- `types.ts`: TypeScript interfaces for all entities (`User`, `Post`, `Comment`, `Reaction`, `Skill`, `Experience`, `PaginatedResponse<T>`, `ApiError`)
- `AuthContext.tsx`: React context + provider. State: `user`, `isLoading`, `isAuthenticated`. Methods: `login()`, `register()`, `logout()`. On mount: attempt to call `GET /auth/me` (if token in localStorage) to hydrate user. Handles automatic token refresh via Axios interceptor.
- Wrap root layout with `AuthProvider`

**Verify:** Frontend compiles and runs. Auth context initializes. Network tab shows `/auth/me` call on load (returns 401 if no token — silent, no error UI).

### Step 4.2: UI primitives + Navbar (F8 partial, F1 partial)

**Files:** `frontend/components/layout/Navbar.tsx`

- Navbar using shadcn/ui components: `Button`, `Avatar`, `DropdownMenu`
- Responsive (hamburger on mobile with shadcn Sheet component)
- Auth state: shows user name + avatar + dropdown (My Profile, Logout) OR Login/Register links
- Add to root layout

**Verify:** Frontend renders Navbar on all pages. Mobile: hamburger toggles menu. Desktop: full nav.

### Step 4.3: Auth pages (F1)

**Files:** `frontend/app/auth/login/page.tsx`, `frontend/app/auth/register/page.tsx`

- Login: email + password form using shadcn/ui `Input`, `Button`, `Card`. Calls `AuthContext.login()`. Redirects to `/` on success. Shows field-level validation errors from API.
- Register: name + email + password form. Same pattern.
- Client-side validation (required fields, email format) before API call.
- "Already have an account?" / "Don't have one?" links between pages.

**Verify:** Register → redirected, navbar shows user. Logout → register again same email → 409 error shown. Login with wrong password → error. Login success → home.

### Step 4.4: Post feed + creation + detail (F2, F3)

**Files:** `frontend/app/page.tsx`, `frontend/app/posts/new/page.tsx`, `frontend/app/posts/[id]/page.tsx`

- API: `getPosts(page, limit, search?)`, `getPost(id)`, `createPost(dto)`
- Home (`/`): ranked post list. Each card: title (link), author name (link to profile), like/dislike counts (icons + numbers), comment count, relative time. Pagination ("Load More" or page buttons). Search bar with debounce (300ms) → filters via API. `Skeleton` while loading, `EmptyState` if none, `ErrorState` on failure.
- New (`/posts/new`): protected (redirect to login if not auth). Title + body (rendered with markdown preview toggle). Submit → redirect to `/posts/[id]`.
- Detail (`/posts/[id]`): full post — title, body (rendered as markdown), author (link), date, reaction buttons, comment count. Comment section (next step). 404 state if not found.
- Install `react-markdown` + `remark-gfm` for markdown rendering in detail view.

**Verify:** Create post via UI → appears on feed. Click → detail with markdown rendered. Search → results filter. Pagination works. Empty state visible after clearing DB.

### Step 4.5: Comments & replies UI (F4)

**Files:** `frontend/app/posts/[id]/page.tsx` (extended), `frontend/components/Comment.tsx`

- API: `getComments(postId)`, `createComment(postId, dto)`
- Comments section on post detail: fetches comments, builds tree from flat list (group by parentCommentId client-side).
- `Comment.tsx`: recursive component. Shows author (avatar + name link), body, relative time, reaction buttons, "Reply" button. Nested replies indented (max 3 levels visually, then flat). Reply button toggles inline textarea + submit.
- "Add a comment" form at top of section (or redirect to login if not auth).
- After submit (comment or reply): optimistically append to list or refetch.

**Verify:** Add comment → appears. Reply → indented under parent. Multiple nesting levels render correctly. Comment count on post header updates. Non-auth: form hidden, "Log in to comment" prompt.

---

## Phase 5 — Reactions UI & Profiles (F5, F6)

### Step 5.1: Reactions UI with optimistic updates (F5)

**Files:** `frontend/components/ReactionButtons.tsx`, integrated across feed + detail + comments

- `ReactionButtons.tsx`: props: `targetType`, `targetId`, `likesCount`, `dislikesCount`, `userReaction?`. Renders thumbs-up / thumbs-down with counts. Highlighted when active.
- Click: **optimistic update** — immediately update local count + highlight → fire API in background. On API error, revert (rollback).
- On feed load (authed): call batch endpoint `GET /reactions/me/batch?targetType=post&targetIds=...` to get user's reactions for all visible posts in one call. Pass down to each card.
- On post detail (authed): call single `GET /reactions/me?targetType=post&targetId=...` + batch for all comments.
- Not authenticated: clicking shows tooltip/toast "Log in to react" or redirects.

**Verify:** Like → instant count change (no spinner). API error → reverts count. Refresh → persisted. Feed: only 2 API calls (posts + batch reactions), not N+1. Comment reactions work identically.

### Step 5.2: Developer profile pages (F6)

**Files:** `frontend/app/developers/[id]/page.tsx`, `frontend/app/profile/edit/page.tsx`

- API: `getDeveloper(id)`, `updateMySkills(skills[])`, `updateMyExperiences(experiences[])`
- View profile (`/developers/[id]`): name, avatar placeholder, member since, skills (rendered as chips/tags), experiences (cards with title, company, date range, description). If viewing own profile → "Edit Profile" button.
- Edit profile (`/profile/edit`): protected. Two sections:
  - Skills: list current as removable chips, text input to add, Save button
  - Experiences: list as editable card forms (title, company, from, to, description), "Add Experience" button, Save button per section
- Link author names everywhere (posts, comments) to `/developers/:id`
- "My Profile" in navbar dropdown

**Verify:** Click author name → profile. Own profile → edit button. Add/remove skills → save → reflected. Add experience → save → visible on profile. Other user's profile → no edit controls.

---

## Phase 6 — Polish, Seed & Documentation (F8)

### Step 6.1: Comprehensive error handling + loading states (F8)

**Files:** all pages + `frontend/components/ui/`

- Every page has three states handled: loading (Skeleton), empty (EmptyState with contextual message + CTA), error (ErrorState with retry).
- API client: global error toast for unexpected 500s (via a toast/notification component).
- Form submissions: button disabled + spinner while loading. Error messages rendered inline.
- 404 pages: custom not-found page.
- Auth-required routes: redirect to `/auth/login?redirect=<current-path>` → after login, redirect back.

**Verify:** Kill backend → error states everywhere with retry button. Retry after restart → works. Empty DB → "No posts yet, be the first!" with CTA. Throttle network → skeletons visible. Navigate to `/posts/bad-uuid` → 404 page.

### Step 6.2: Responsive layout (F8)

- Mobile-first Tailwind. Breakpoints: `sm` (640), `md` (768), `lg` (1024).
- Navbar: hamburger on < `md`. Feed: single column, `max-w-3xl mx-auto` on desktop. Forms: full-width mobile, `max-w-lg` desktop. Comment indent: `ml-4` on mobile, `ml-8` on desktop. Profile: stack mobile, grid desktop.
- Touch targets: min 44px on interactive elements.
- Typography: responsive `text-sm`/`text-base`/`text-lg`.

**Verify:** Chrome DevTools: usable and good-looking at 375px, 768px, 1440px. Navbar collapses. Cards reflow. Forms are comfortable at all sizes.

### Step 6.3: Seed data script

**Files:** `backend/src/database/seed.ts`

- Creates 5 users with hashed passwords (password: `password123` for all)
- Creates 15 posts with varied realistic content (some with markdown)
- Creates 30+ comments and replies across posts
- Creates reactions (likes/dislikes) distributed across users, posts, comments
- Recalculates all rank scores
- npm script: `"seed": "ts-node -r tsconfig-paths/register src/database/seed.ts"`
- npm script: `"seed:reset": "npm run migration:revert && npm run migration:run && npm run seed"` for clean reset

**Verify:** `cd backend && npm run seed` → DB seeded. Start stack → feed shows 15 posts ranked, with counts. Posts have comments with replies. Profiles have skills and experiences.

### Step 6.4: README + AI_USAGE.md

**Files:** `README.md`, `AI_USAGE.md`

- `README.md` — all 8 items from PROJECT_INIT.md section 7:
  1. Project name + description
  2. Tech stack (PostgreSQL, NestJS+Fastify, Next.js+Turbopack+shadcn/ui, TypeORM, TypeScript)
  3. Local setup (clone, docker compose up, cp .env, npm install, migrate, seed, run)
  4. Environment variables table (names + descriptions, no values)
  5. Swagger docs: `http://localhost:3001/api/docs`
  6. Ranking formula with example
  7. Link to `AI_USAGE.md`
  8. Assumptions + known limitations
- Architecture overview section with data model diagram (ASCII or mermaid)
- `AI_USAGE.md` — how AI was used in development

**Verify:** README renders correctly on GitHub. Follow setup instructions from scratch on a clean machine → everything works.

---

## Key Architecture Decisions

| Decision | Rationale |
|---|---|
| **TypeORM migrations** (not synchronize) | Production-grade: repeatable, version-controlled schema changes. `synchronize: true` is unsafe. |
| **Denormalized counts** on Post/Comment | Read performance. Feed doesn't need JOIN + GROUP BY on every load. Updated transactionally on mutation. |
| **Polymorphic Reactions** (targetType + targetId) | One table, one toggle endpoint. Validated in service. Simpler than PostReaction + CommentReaction tables. |
| **Global JWT guard + @Public()** | Secure by default. Every new route is protected unless explicitly opted out. |
| **Flat comment response** | Frontend builds tree. Flexible for rendering. Avoids recursive SQL or multiple passes server-side. |
| **Refresh tokens in httpOnly cookie** | XSS-safe. Access token in memory/localStorage for API calls. Refresh in cookie for silent renewal. |
| **Optimistic UI for reactions** | Instant feedback. Revert on failure. UX standard for like/dislike interactions. |
| **Batch reaction endpoint** | Prevents N+1 on feed. One call to get user's reaction state for all visible posts. |
| **Offset pagination** | Simple, sufficient for ranked feed. Cursor-based would be better at scale but overkill here. |
| **Markdown in posts** | `react-markdown` + `remark-gfm`. Rendered client-side. Body stored as raw markdown. |

## Dependency Graph

```
0.1 (root+docker)
├── 0.2 (backend) → 1.1 (envelope) → 1.2 (user+register) → 1.3 (login+refresh) → 1.4 (guard)
│                                                                                      │
│   1.4 → 2.1 (profiles) ─┐                                                           │
│   1.4 → 2.2 (posts) ────┤                                                           │
│   1.4 → 2.3 (comments) ─┤→ 2.4 (reactions) → 3.1 (ranking) → 3.2 (swagger) → 3.3 (tests)
│                          │
└── 0.3 (frontend) → 4.1 (api+auth) → 4.2 (ui+navbar) → 4.3 (auth pages) → 4.4 (feed+posts)
                                                                              → 4.5 (comments)
                                                                                      │
                                                                    5.1 (reactions UI) ┤
                                                                    5.2 (profiles UI)  ┤
                                                                                       │
                                                                    6.1 (polish) → 6.2 (responsive)
                                                                                 → 6.3 (seed)
                                                                                 → 6.4 (README)
```

**Parallelism:** Backend (Phases 1–3) and Frontend (Phases 4–5) can overlap once Step 1.4 and Step 4.1 are done.

## End-to-End Verification

After all phases:
1. `docker compose up -d` — PostgreSQL starts
2. `cd backend && npm run migration:run && npm run seed && npm run start:dev` — backend on :3001
3. `cd frontend && npm run dev` — frontend on :3000
4. Open `http://localhost:3000` — ranked feed with 15 seeded posts, search bar, pagination
5. Register → create post (with markdown) → comment → reply → like/dislike → edit profile
6. Open `http://localhost:3001/api/docs` — full Swagger docs, try out all endpoints
7. Mobile viewport (375px) — fully responsive
8. `cd backend && npm test` — all unit tests pass
9. Wait 15min (or set short expiry for test) → access token auto-refreshes via cookie

## Critical Files

| File | Role |
|---|---|
| `docker-compose.yml` | PostgreSQL service |
| `backend/src/main.ts` | Fastify adapter, CORS, cookies, global pipes/filters/interceptors, Swagger setup |
| `backend/src/database/data-source.ts` | TypeORM CLI config for migrations |
| `backend/src/common/interceptors/response.interceptor.ts` | Response envelope (B9) |
| `backend/src/auth/auth.service.ts` | Register, login, refresh, logout, token generation |
| `backend/src/reactions/reactions.service.ts` | Toggle/switch logic, denormalized count updates, triggers rank recalc |
| `backend/src/posts/posts.service.ts` | CRUD + ranking formula + pagination + search |
| `frontend/lib/api.ts` | Axios instance, interceptors (auth, envelope unwrap, refresh), typed API functions |
| `frontend/contexts/AuthContext.tsx` | Auth state, login/register/logout, hydration |
| `frontend/components/ReactionButtons.tsx` | Optimistic like/dislike with rollback |
