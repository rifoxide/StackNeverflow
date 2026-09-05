import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity.js';
import { Skill } from '../users/skill.entity.js';
import { Experience } from '../users/experience.entity.js';
import { Post } from '../posts/post.entity.js';
import { Comment } from '../comments/comment.entity.js';
import { Reaction } from '../reactions/reaction.entity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

/**
 * Idempotent dev seed.
 *
 * Wipes all data in FK-safe order, then creates:
 *   - 5 users (password = "password123")
 *   - each user gets a developer profile (skills + 1-2 experiences)
 *   - 5-10 posts per user (30+ total), some with markdown
 *   - random comments and replies on those posts
 *   - random likes / dislikes distributed across users, posts, comments
 *   - all post.rankScore values are recalculated
 *
 * Re-running: the script truncates all tables first, so it's safe to
 * run repeatedly without producing duplicates.
 */

const PASSWORD = 'password123';

const USER_SEEDS: Array<{
  name: string;
  email: string;
  skills: string[];
  experiences: Array<{
    title: string;
    company: string;
    fromDate: string;
    toDate: string | null;
    description: string;
  }>;
}> = [
  {
    name: 'Ada Lovelace',
    email: 'ada@stackneverflow.dev',
    skills: ['TypeScript', 'NestJS', 'PostgreSQL', 'TypeORM', 'Redis'],
    experiences: [
      {
        title: 'Senior Backend Engineer',
        company: 'Analytical Engine Co.',
        fromDate: '2021-03-01',
        toDate: null,
        description: 'Designing data-intensive APIs and event-driven systems.',
      },
      {
        title: 'Software Engineer',
        company: 'Difference Engine Labs',
        fromDate: '2018-06-15',
        toDate: '2021-02-28',
        description: 'Built internal tooling on Node.js and PostgreSQL.',
      },
    ],
  },
  {
    name: 'Linus Pauling',
    email: 'linus@stackneverflow.dev',
    skills: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript'],
    experiences: [
      {
        title: 'Frontend Lead',
        company: 'Hybrid Orbit',
        fromDate: '2022-01-10',
        toDate: null,
        description: 'Lead the migration from CRA to Next.js App Router.',
      },
    ],
  },
  {
    name: 'Grace Hopper',
    email: 'grace@stackneverflow.dev',
    skills: ['Go', 'Kubernetes', 'gRPC', 'PostgreSQL'],
    experiences: [
      {
        title: 'Principal Engineer',
        company: 'Compiler Systems',
        fromDate: '2019-09-01',
        toDate: null,
        description: 'Owned the build pipeline and release platform.',
      },
      {
        title: 'Staff Engineer',
        company: 'Naval Applications',
        fromDate: '2015-04-01',
        toDate: '2019-08-31',
        description: 'Designed the original COBOL-to-Go transpiler.',
      },
    ],
  },
  {
    name: 'Alan Turing',
    email: 'alan@stackneverflow.dev',
    skills: ['Python', 'FastAPI', 'PyTorch', 'PostgreSQL'],
    experiences: [
      {
        title: 'ML Engineer',
        company: 'Enigma Labs',
        fromDate: '2020-05-15',
        toDate: null,
        description: 'Building recommender systems at scale.',
      },
    ],
  },
  {
    name: 'Margaret Hamilton',
    email: 'margaret@stackneverflow.dev',
    skills: ['Rust', 'WebAssembly', 'Systems Programming', 'C'],
    experiences: [
      {
        title: 'Systems Engineer',
        company: 'Apollo Software',
        fromDate: '2017-02-01',
        toDate: null,
        description: 'Embedded systems and high-assurance software.',
      },
    ],
  },
];

const POST_TITLES = [
  'How do you structure a large NestJS monorepo?',
  'Best way to handle refresh-token rotation in 2026?',
  'PostgreSQL vs MySQL for a feed of ranked posts?',
  'Why does my Fastify server leak memory under load?',
  'Recommended pattern for soft delete in TypeORM?',
  'How are you deploying Next.js 15 with Turbopack to production?',
  'What is the right way to version a REST API?',
  'Should I learn tRPC if I already know GraphQL?',
  'Caching strategies for a polymorphic reactions table?',
  'How do you debug slow Postgres queries from the backend?',
];

const POST_BODIES = [
  `I'm working on a community platform and keep running into the same
question: where do you draw the line between "feature module" and
"shared library" in a NestJS monorepo?

Currently I have:

\`\`\`ts
apps/
  api/
  admin/
libs/
  users/
  posts/
\`\`\`

But \`users\` ends up importing from \`posts\` half the time, and the
other way around. Anyone hit this? What's the cleanest split?`,

  `Looking at the OWASP cheatsheet for refresh tokens. Token rotation
sounds great on paper but I'm worried about race conditions when two
tabs hit \`/refresh\` at once.

Is the canonical solution to keep the *previous* refresh token valid
for a short window, or to lean on a per-token jti in the database?`,

  `My feed does a JOIN + COUNT + GROUP BY for every page load. Reads
are killing me. Is it crazy to denormalize \`likesCount\` /
\`dislikesCount\` / \`commentCount\` on the post row and update them
in a transaction?`,

  `I see RSS grow by ~1MB per minute in dev. Stack trace shows it
hanging onto \`FastifyRequest\` instances.

Is there a known pattern for request-scoped DI in Fastify that I'm
missing?`,

  `I want soft delete but TypeORM's \`@DeleteDateColumn\` doesn't
play well with my unique constraints.

What's the modern answer — partial unique indexes? Per-tenant tombstone
column?`,
];

const COMMENT_BODIES = [
  'Great question — I hit the exact same wall last year.',
  'Have you tried using `forwardRef`?',
  'This is fine for 99% of apps. Premature optimization.',
  'I would push back on that. We tried it and it bit us hard.',
  'Could you share your schema? Hard to say without it.',
  'We ended up using a separate counter table updated via triggers.',
  'The real answer here is "it depends on your read/write ratio."',
  'Consider denormalizing once you cross ~10k posts.',
  'See the `nestjs` discord — there was a long thread on this.',
  '+1 to the previous answer, it worked for us too.',
];

const REPLY_BODIES = [
  'Exactly!',
  'I disagree — see this benchmark: https://example.com/bench',
  'Good point, I will try that.',
  'For what it is worth, we use a different approach.',
  'Same here, but with a twist.',
];

// ---------------------------------------------------------------------------
// Random helpers
// ---------------------------------------------------------------------------

let rngState = 0x9e3779b9;
function seedRng(seed: number): void {
  rngState = seed >>> 0;
}
function rand(): number {
  // xorshift32 — keep the result unsigned to avoid JS's signed
  // bitwise coercion producing negative values.
  let x = rngState;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  rngState = (x >>> 0) || 1; // never let state hit 0 (fixed point of xorshift)
  return rngState / 0x100000000;
}
function randInt(min: number, maxInclusive: number): number {
  return Math.floor(rand() * (maxInclusive - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [
      User,
      Skill,
      Experience,
      Post,
      Comment,
      Reaction,
    ],
    synchronize: false,
  });

  await ds.initialize();
  console.log('DataSource initialized.');

  // Truncate in FK-safe order. Reactions → comments → posts → experiences
  // → skills → users. Using TRUNCATE … RESTART IDENTITY CASCADE to also
  // reset sequences.
  await ds.query(
    'TRUNCATE TABLE reactions, comments, posts, experiences, skills, users RESTART IDENTITY CASCADE',
  );
  console.log('Truncated existing data.');

  // Use a deterministic seed so the dataset is reproducible.
  seedRng(20260905);

  // 1. Users -----------------------------------------------------------
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const userRepo = ds.getRepository(User);
  const skillRepo = ds.getRepository(Skill);
  const expRepo = ds.getRepository(Experience);

  const users: User[] = [];
  for (const seed of USER_SEEDS) {
    const user = userRepo.create({
      name: seed.name,
      email: seed.email,
      passwordHash,
      refreshTokenHash: null,
    });
    const saved = await userRepo.save(user);
    users.push(saved);

    for (const name of seed.skills) {
      await skillRepo.save(skillRepo.create({ userId: saved.id, name }));
    }
    for (const exp of seed.experiences) {
      await expRepo.save(
        expRepo.create({
          userId: saved.id,
          title: exp.title,
          company: exp.company,
          fromDate: new Date(exp.fromDate),
          toDate: exp.toDate ? new Date(exp.toDate) : null,
          description: exp.description,
        }),
      );
    }
  }
  console.log(`Seeded ${users.length} users with profiles.`);

  // 2. Posts (5-10 per user) -------------------------------------------
  const postRepo = ds.getRepository(Post);
  const posts: Post[] = [];
  for (const user of users) {
    const count = randInt(5, 10);
    for (let i = 0; i < count; i++) {
      const title = `${pick(POST_TITLES)} #${randInt(1, 9999)}`;
      const body = pick(POST_BODIES);
      const post = postRepo.create({
        authorId: user.id,
        title,
        body,
        likesCount: 0,
        dislikesCount: 0,
        commentCount: 0,
        rankScore: 0,
      });
      const saved = await postRepo.save(post);
      posts.push(saved);
    }
  }
  console.log(`Seeded ${posts.length} posts.`);

  // 3. Comments + replies ---------------------------------------------
  const commentRepo = ds.getRepository(Comment);
  let totalComments = 0;
  let totalReplies = 0;
  for (const post of posts) {
    // 0-5 top-level comments per post
    const topLevel = randInt(0, 5);
    const topLevelIds: string[] = [];
    for (let i = 0; i < topLevel; i++) {
      const c = commentRepo.create({
        postId: post.id,
        authorId: pick(users).id,
        parentCommentId: null,
        body: pick(COMMENT_BODIES),
        likesCount: 0,
        dislikesCount: 0,
      });
      const saved = await commentRepo.save(c);
      topLevelIds.push(saved.id);
      totalComments++;
    }
    // 0-3 replies per top-level comment
    for (const parentId of topLevelIds) {
      const replyCount = randInt(0, 3);
      for (let j = 0; j < replyCount; j++) {
        const r = commentRepo.create({
          postId: post.id,
          authorId: pick(users).id,
          parentCommentId: parentId,
          body: pick(REPLY_BODIES),
          likesCount: 0,
          dislikesCount: 0,
        });
        await commentRepo.save(r);
        totalReplies++;
      }
    }
  }
  console.log(
    `Seeded ${totalComments} comments and ${totalReplies} replies.`,
  );

  // 4. Reactions (posts + comments) ------------------------------------
  const reactionRepo = ds.getRepository(Reaction);
  let totalReactions = 0;
  // Posts: each user reacts to ~50% of posts (mix of like/dislike)
  for (const post of posts) {
    for (const user of users) {
      if (rand() < 0.5) {
        await reactionRepo.save(
          reactionRepo.create({
            userId: user.id,
            targetType: 'post',
            targetId: post.id,
            type: rand() < 0.8 ? 'like' : 'dislike',
          }),
        );
        totalReactions++;
      }
    }
  }
  // Comments: each user reacts to ~30% of comments
  const allComments = await commentRepo.find();
  for (const c of allComments) {
    for (const user of users) {
      if (rand() < 0.3) {
        await reactionRepo.save(
          reactionRepo.create({
            userId: user.id,
            targetType: 'comment',
            targetId: c.id,
            type: rand() < 0.85 ? 'like' : 'dislike',
          }),
        );
        totalReactions++;
      }
    }
  }
  console.log(`Seeded ${totalReactions} reactions.`);

  // 5. Recount + rank score -------------------------------------------
  // We recount directly via SQL so the seed is independent of the
  // application service layer (which is for runtime, not bulk import).
  // Each query targets exactly one count column to keep them readable.
  await ds.query(`
    UPDATE posts p SET
      "likesCount" = COALESCE((
        SELECT COUNT(*)::int FROM reactions r
        WHERE r."targetType" = 'post' AND r.type = 'like' AND r."targetId" = p.id
      ), 0)
  `);

  await ds.query(`
    UPDATE posts p SET
      "dislikesCount" = COALESCE((
        SELECT COUNT(*)::int FROM reactions r
        WHERE r."targetType" = 'post' AND r.type = 'dislike' AND r."targetId" = p.id
      ), 0)
  `);

  await ds.query(`
    UPDATE comments c SET
      "likesCount" = COALESCE((
        SELECT COUNT(*)::int FROM reactions r
        WHERE r."targetType" = 'comment' AND r.type = 'like' AND r."targetId" = c.id
      ), 0)
  `);

  await ds.query(`
    UPDATE comments c SET
      "dislikesCount" = COALESCE((
        SELECT COUNT(*)::int FROM reactions r
        WHERE r."targetType" = 'comment' AND r.type = 'dislike' AND r."targetId" = c.id
      ), 0)
  `);

  await ds.query(`
    UPDATE posts p SET "commentCount" = COALESCE((
      SELECT COUNT(*)::int FROM comments c WHERE c."postId" = p.id
    ), 0)
  `);

  // Final rank score: (likes - dislikes) + (commentCount * 2)
  await ds.query(`
    UPDATE posts SET "rankScore" =
      ("likesCount" - "dislikesCount") + ("commentCount" * 2)
  `);

  // Summary
  const top = await ds.query(
    `SELECT id, title, "likesCount", "dislikesCount", "commentCount", "rankScore"
     FROM posts ORDER BY "rankScore" DESC, "createdAt" DESC LIMIT 5`,
  );
  console.log('\nTop 5 ranked posts:');
  for (const row of top) {
    console.log(
      `  [${row.rankScore}] (👍 ${row.likesCount} / 👎 ${row.dislikesCount} / 💬 ${row.commentCount}) ${row.title}`,
    );
  }

  console.log(`\nSeed complete. Login with any seeded email + password "${PASSWORD}".`);
  await ds.destroy();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
