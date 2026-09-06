<div align="center">
  <a href="https://raw.githubusercontent.com/rifoxide/StackNeverflow/main/docs/media/stackneverflow-demo.mp4">
    <img src="docs/media/stackneverflow-demo.gif" alt="StackNeverflow product demo — click to watch the full MP4" width="800">
  </a>
  <br>
  <a href="https://raw.githubusercontent.com/rifoxide/StackNeverflow/main/docs/media/stackneverflow-demo.mp4">▶ Watch the full StackNeverflow demo (MP4)</a>

  <img src="frontend/public/logo.svg" alt="StackNeverflow Logo" width="150" height="150">
  
  # StackNeverflow

  A modern developer Q&A platform built with Next.js, NestJS, and PostgreSQL. Features include posts, nested comments with threaded replies, reactions (likes/dislikes), developer profiles with skills and work experience, and a ranked feed algorithm.

  [![AI Usage Report](https://img.shields.io/badge/AI%20Usage-Documented-blue?style=flat-square)](AI_USAGE.md)
  [![Implementation Plan](https://img.shields.io/badge/Implementation-Plan-green?style=flat-square)](IMPLEMENTATION_PLAN.md)
  [![Project Init](https://img.shields.io/badge/Project-Init%20Specs-purple?style=flat-square)](PROJECT_INIT.md)
</div>

## Project Documentation
- [PROJECT_INIT.md](PROJECT_INIT.md) — Initial requirements and technical specification.
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Phased task breakdown and development checklist.
- [AI_USAGE.md](AI_USAGE.md) — Comprehensive report on AI tools, agentic workflows, prompt logs, code reviews, and bug fixes.
- [AGENTS.md](AGENTS.md) — AI agent system context, execution rules, and coding standards.

## Features

### Core Functionality
- **Posts & Questions**: Create and browse posts with Markdown support
- **Nested Comments**: Threaded comment system with Facebook-style visual connectors
- **Reactions**: Like/dislike posts and comments with optimistic UI updates
- **Developer Profiles**: Showcase skills, work experience, and contributions
- **Ranked Feed**: Posts sorted by engagement (likes, comments) with time decay
- **Authentication**: JWT-based auth with refresh token rotation

### Technical Highlights
- **Full-Stack TypeScript**: Type-safe end-to-end development
- **Real-Time Optimistic Updates**: Instant UI feedback with automatic rollback on errors
- **Batch API Optimization**: Single request to fetch all user reactions on feed
- **Responsive Design**: Mobile-first layout with dark mode support
- **Comprehensive Testing**: 67+ backend tests with Vitest
- **Database Migrations**: TypeORM migrations with seed data script

## Tech Stack

### Frontend
- **Next.js 16.3.4** with App Router and Turbopack
- **React 19** with Server Components
- **TypeScript** for type safety
- **HeroUI** component library (inspired by NextUI)
- **Tailwind CSS** for styling
- **Axios** for API requests with automatic token refresh
- **react-markdown** with syntax highlighting

### Backend
- **NestJS 12** with Fastify adapter
- **TypeORM** for database management
- **PostgreSQL** for data persistence
- **JWT** authentication with httpOnly refresh tokens
- **bcrypt** for password hashing
- **Vitest** for testing

## Getting Started

### Prerequisites
- Node.js 20+ (Node.js 26 is also supported)
- npm 10+
- Docker Engine and Docker Compose (recommended), or PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StackNeverflow
   ```

2. **Install dependencies for both applications**
   ```bash
   npm run install:all
   ```

   You can also install them separately with `npm install` in `backend/` and `frontend/`.

3. **Set up environment variables**

   Copy the tracked examples and replace the development secrets if needed:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

   `backend/.env` must contain:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stackneverflow
   JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars
   JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-chars
   JWT_ACCESS_EXPIRATION=900
   JWT_REFRESH_EXPIRATION=604800
   BACKEND_PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

   `frontend/.env.local` needs:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

   Expiration values are expressed in seconds. Use unique secrets of at least 32 characters outside local development. Environment files are ignored by Git.

4. **Start PostgreSQL and initialize the schema**

   **Option A: Docker (recommended)**
   ```bash
   docker compose up -d
   docker compose ps                         # postgres should be healthy
   cd backend
   npm run migration:run
   npm run seed                               # optional demo data
   cd ..
   ```

   **Option B: Existing PostgreSQL**
   ```bash
   createdb stackneverflow
   cd backend
   npm run migration:run
   npm run seed                               # optional demo data
   cd ..
   ```

   The Docker Compose database uses `postgres/postgres` and publishes port `5432`. If port `5432` is already in use, stop the other PostgreSQL service or change the host-side port in `docker-compose.yml` and `DATABASE_URL`.

5. **Start the development servers**

   Start both applications from the repository root:
   ```bash
   npm run dev
   ```

   Or use separate terminals:
   ```bash
   cd backend && npm run start:dev
   cd frontend && npm run dev
   ```

6. **Open the app and API documentation**

   - Web app: [http://localhost:3000](http://localhost:3000)
   - API health check: [http://localhost:3001](http://localhost:3001)
   - Swagger/OpenAPI: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

### Test Accounts

If you ran the seed script, you can log in with any of these accounts:
- **Email**: `ada@stackneverflow.dev`, `linus@stackneverflow.dev`, `grace@stackneverflow.dev`, `alan@stackneverflow.dev`, `margaret@stackneverflow.dev`
- **Password**: `password123` (for all accounts)

## Project Structure

```
StackNeverflow/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── auth/           # Authentication (JWT, guards)
│   │   ├── users/          # User entity, skills, experiences
│   │   ├── posts/          # Posts with ranking algorithm
│   │   ├── comments/       # Nested comments system
│   │   ├── reactions/      # Polymorphic reactions (like/dislike)
│   │   ├── developers/     # Developer profiles API
│   │   └── database/       # Migrations and seed script
│   └── test/               # Unit and integration tests
│
├── frontend/               # Next.js frontend
│   ├── app/                # App Router pages
│   │   ├── auth/          # Login/register pages
│   │   ├── posts/         # Post list, detail, create
│   │   ├── developers/    # Profile view page
│   │   └── profile/       # Profile edit page
│   ├── components/         # Reusable components
│   │   ├── comments/      # Comment system with threading
│   │   └── posts/         # Post reaction buttons
│   ├── contexts/          # React contexts (auth)
│   └── lib/               # API client, types, utilities
│
└── docs/                   # Additional documentation
```

## Key Features Explained

### Ranked Feed Algorithm

Posts are sorted by a rank score calculated as:
```
rankScore = (likesCount - dislikesCount) + (commentCount × 2)
```

Comments are weighted more heavily to encourage discussion. The feed uses `ORDER BY rankScore DESC, createdAt DESC` to show engaging recent content first.

### Nested Comments with Visual Threading

Comments support unlimited nesting depth with:
- Facebook-style L-shaped connectors between parent and child
- Vertical guide lines connecting replies to their parent
- Avatar-to-avatar visual flow for better readability

### Optimistic UI Updates

Reactions use optimistic updates for instant feedback:
1. Update UI immediately when user clicks
2. Send API request in background
3. Revert on error with console warning
4. Disable buttons during toggle to prevent double-clicks

### Batch API for Performance

The feed page uses `GET /reactions/me/batch?targetType=post&targetIds=id1,id2,id3` to fetch all user reactions in a single request instead of N requests per post.

## API Documentation

Once the backend is running, visit [http://localhost:3001/api](http://localhost:3001/api) for interactive Swagger documentation.

### Key Endpoints

#### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login (returns access token + httpOnly refresh token)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate refresh token
- `GET /auth/me` - Get current user info

#### Posts
- `GET /posts` - List posts (paginated, searchable, ranked)
- `GET /posts/:id` - Get single post with author info
- `POST /posts` - Create new post (auth required)

#### Comments
- `GET /posts/:id/comments` - Get all comments for a post (nested structure)
- `POST /posts/:id/comments` - Create comment or reply (auth required)

#### Reactions
- `POST /reactions` - Toggle reaction on post or comment (auth required)
- `GET /reactions/me` - Get user's reaction on a target
- `GET /reactions/me/batch` - Batch get user's reactions on multiple targets

#### Developers
- `GET /developers/:id` - Get developer profile (public)
- `GET /developers/me` - Get own profile (auth required)
- `PUT /developers/me/skills` - Update skills (auth required)
- `PUT /developers/me/experiences` - Update work experiences (auth required)

## Development

### Running Tests

**Backend tests** (67 tests covering all services):
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # With coverage
npm run build         # Compile the NestJS application
npm run lint          # ESLint (currently reports existing warnings)
```

**Frontend verification**:
```bash
cd frontend
npm run build         # TypeScript + Next.js production build
npm run lint          # ESLint
```

The production build is currently clean. Frontend lint still reports existing strict React Compiler and explicit-`any` findings in several older components; these do not prevent `npm run dev` or `npm run build`.

**Manual smoke check** (with the database and servers running):
```bash
curl http://localhost:3001/
curl http://localhost:3001/posts
curl -I http://localhost:3000
```

The API root returns `{ "success": true, "data": { "status": "ok" } }`; `/api` is not the Swagger route—the interactive documentation is at `/api/docs`.

### Database Management

Run these commands from `backend/`:
```bash
# Generate a new migration after entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Run pending migrations (builds first, then uses dist/database/data-source.js)
npm run migration:run

# Revert the last migration
npm run migration:revert

# Reset the development database and reseed it
npm run seed:reset
```

Migration commands intentionally build the backend before invoking the TypeORM CLI. This avoids the ESM/ts-node decorator metadata issue that can occur when TypeORM imports TypeScript entities directly. The seed script is destructive: it truncates all application tables before inserting deterministic demo data, so do not run it against a production database.

### Troubleshooting

- **`ECONNREFUSED` or database connection errors:** run `docker compose up -d`, wait for `docker compose ps` to show `healthy`, and verify `DATABASE_URL` points to port `5432`.
- **Migration says a column already exists:** update to the current migrations and run `npm run migration:run`; the profile-picture and notification migrations are idempotent for databases that were partially initialized by an earlier development revision.
- **Frontend cannot reach the API:** confirm the backend is listening on port `3001` and that `frontend/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:3001`.
- **Port already in use:** change `BACKEND_PORT`/`FRONTEND_URL` and the corresponding frontend API URL, or stop the process using ports `3000`/`3001`.
- **Stale Next.js output:** stop the dev server and remove `frontend/.next/`, then run `npm run dev` again.
- **Uploads:** avatar files are served from `/uploads/`; the backend creates `backend/uploads/avatars/` when an upload is made. The multipart upload limit is 5 MB.
- **Swagger returns 404 at `/api`:** use `/api/docs`.

### Code Quality

Both frontend and backend use:
- **ESLint** for linting
- **Prettier** for formatting
- **Husky + lint-staged** for pre-commit hooks
- **TypeScript strict mode** for type safety

Pre-commit hooks automatically:
1. Format staged backend files with Prettier
2. Lint staged backend TypeScript with ESLint
3. Run related backend tests

Install hooks after a fresh clone with `npm install` at the repository root (the root `prepare` script runs Husky).

## Deployment

### Backend Deployment

1. Set production environment variables
2. Build the application: `npm run build`
3. Run migrations: `npm run migration:run`
4. Start production server: `npm run start:prod`

### Frontend Deployment

1. Set `NEXT_PUBLIC_API_URL` to production backend URL
2. Build: `npm run build`
3. Start: `npm start`

Or deploy to Vercel/Netlify with automatic builds.

### Environment Checklist

- [ ] PostgreSQL database provisioned
- [ ] Database URL configured
- [ ] JWT secrets set (min 32 characters each)
- [ ] Frontend API URL points to backend
- [ ] CORS configured for frontend domain
- [ ] Migrations run on production database
- [ ] (Optional) Seed script run for demo data

## Agentic Software Engineering & AI Usage

This project was developed by an **Agentic Software Engineer** using a structured human-in-the-loop methodology with **Claude Code CLI** (powered by Claude 3.7 / 3.5 Sonnet).

### Process Overview
1. **Requirements Definition**: Refined core requirements and constraints in [PROJECT_INIT.md](PROJECT_INIT.md).
2. **Granular Implementation Plan**: Generated and reviewed [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) before writing any code, ensuring clean separation of concerns and cross-linked documentation.
3. **Test-First & Iterative Task Loop**: Prompted AI to generate Vitest test suites upfront, executed tasks one by one, tested functionality, provided iterative feedback, and reviewed all generated code.
4. **Automated Quality Gates**: Enforced Husky pre-commit hooks (`lint-staged`) running Prettier, ESLint (`--fix`), and related Vitest test suites before every commit.

### Human Review & Quality Interventions
- **Polymorphic Database Design**: Rejected separate reaction tables in favor of a single polymorphic schema with unique compound constraints.
- **N+1 Performance Fix**: Caught individual reaction queries on feed rendering and implemented batch reaction fetching (`GET /reactions/me/batch`).
- **Framework & Hydration Fixes**: Resolved invalid nested button elements in HeroUI dropdowns and fixed standalone seed script execution with `ts-node` / ESM loader.
- **Dynamic Threading UI**: Iteratively engineered dynamic SVG/CSS connectors for Reddit/Facebook-style comment threading.

📖 **For full prompt logs, review records, case studies, and metrics, see [AI_USAGE.md](AI_USAGE.md).**

## Architecture Decisions

### Why NestJS + Fastify?
- NestJS provides excellent TypeScript DX and modular architecture
- Fastify is 2-3x faster than Express
- Built-in dependency injection and decorators reduce boilerplate

### Why TypeORM?
- Type-safe database queries with TypeScript
- Migration system for schema versioning
- Active Record and Data Mapper patterns supported

### Why App Router (Next.js 13+)?
- Server Components reduce client bundle size
- Built-in data fetching with async/await
- Improved routing with layouts and loading states

### Why Polymorphic Reactions?
A single `reactions` table serves both posts and comments using `targetType` + `targetId`. This:
- Reduces code duplication
- Simplifies adding new reaction types in the future
- Maintains referential integrity with composite indexes

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspired by Stack Overflow and Reddit
- Comment threading inspired by Facebook/Reddit
- Built as a learning project to explore modern full-stack development
