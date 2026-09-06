# StackNeverflow

A modern developer Q&A platform built with Next.js, NestJS, and PostgreSQL. Features include posts, nested comments with threaded replies, reactions (likes/dislikes), developer profiles with skills and work experience, and a ranked feed algorithm.

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
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StackNeverflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env` files in both `backend/` and `frontend/` directories:

   **backend/.env**
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/stackneverflow
   JWT_ACCESS_SECRET=your-access-secret-min-32-chars
   JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   NODE_ENV=development
   PORT=3001
   ```

   **frontend/.env.local**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. **Set up the database**

   **Option A: Using Docker (Recommended)**
   ```bash
   # Start PostgreSQL in Docker
   docker-compose up -d

   # Wait for database to be ready (health check will confirm)
   docker-compose ps

   # Run migrations
   cd backend
   npm run migration:run

   # Seed with sample data (optional but recommended)
   npm run seed
   ```

   **Option B: Using existing PostgreSQL installation**
   ```bash
   # Create the database
   createdb stackneverflow

   # Run migrations
   cd backend
   npm run migration:run

   # Seed with sample data (optional but recommended)
   npm run seed
   ```

   > **Note**: If using Docker, update your `backend/.env` to match the Docker credentials:
   > `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stackneverflow`

5. **Start the development servers**

   Open two terminal windows:

   **Terminal 1 - Backend**
   ```bash
   cd backend
   npm run start:dev
   ```

   **Terminal 2 - Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

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
```

**Frontend build verification**:
```bash
cd frontend
npm run build         # TypeScript + Next.js build check
```

### Database Management

```bash
cd backend

# Generate a new migration after entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Reset database and reseed
npm run seed:reset
```

### Code Quality

Both frontend and backend use:
- **ESLint** for linting
- **Prettier** for formatting
- **Husky + lint-staged** for pre-commit hooks
- **TypeScript strict mode** for type safety

Pre-commit hooks automatically:
1. Format code with Prettier
2. Lint and fix with ESLint
3. Run related backend tests

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
