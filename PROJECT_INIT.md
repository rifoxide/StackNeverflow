## Project: StackNeverflow - A Dev Community

Build a **developer community** platform where:

| Capability | Description |
| :---- | :---- |
| **Posts** | Developers can create and view posts |
| **Comments** | Other developers can comment on posts |
| **Comment replies** | Developers can reply to comments (threaded / nested replies) |
| **Reactions** | Like / dislike on **posts** and **comments**, with visible reaction counts |
| **Profiles** | Developers can **add and update** their **skills** and **experiences** so others can view them |
| **Ranking** | Posts are ranked using comments and reactions (see scoring below) |

---

## 3\. Technical Requirements

### 3.1 Database

- PostgreSQL

### 3.2 Backend

- NestJS + Fastify (Typescript)  
- RESTful APIs (or clearly documented equivalent)  
- Consistent **request / response format** across endpoints  
- **Swagger / OpenAPI** for API documentation

### 3.3 Frontend

- Next.js + Turbopack (Typescript)
- Screens / flows for auth, feed, post detail, comments/replies, reactions, and developer profile (skills & experiences)  
- Clear loading, empty, and error states  
- Responsive enough for desktop and mobile browser use

### 3.4 Repository & delivery

| Rule | Detail |
| :---- | :---- |
| README | Include project description, architecture overview, setup steps, env vars, and how to run locally |

---

## 4\. Feature Scope 

Treat the lists below as the **core** assignment. Aim to complete both columns.

### 4.1 Backend (core)

| \# | Feature | Notes |
| :---- | :---- | :---- |
| B1 | Auth (register / login) | Issue access tokens; protect mutating routes |
| B2 | Developer profile | CRUD (or create \+ update) for skills and experiences |
| B3 | Posts | Create, list, get by id; support ranking |
| B4 | Comments | Create and list on a post |
| B5 | Comment replies | Reply to a comment (parent/child relationship) |
| B6 | Reactions | Like / dislike on posts **and** comments; store reaction counts or compute them |
| B7 | Post ranking | Rank posts by comments \+ reactions (document the formula) |
| B8 | Swagger | Document all public APIs |
| B9 | Request / response shape | Consistent request/response envelopes across endpoints |

**Ranking formula:**

score \= (likes \- dislikes) \+ (comment\_count \* weight)

Example: `weight = 2`. Higher score → higher rank. Tie-break by `createdAt` (newest first).

### 4.2 Frontend (core)

| \# | Feature | Notes |
| :---- | :---- | :---- |
| F1 | Auth UI | Register / login; persist session; logout |
| F2 | Feed / ranked posts | List posts ordered by your ranking rules; show reaction counts & comment counts |
| F3 | Post create \+ detail | Create a post; open a post and see full content |
| F4 | Comments & replies | View comments; add comment; reply to a comment |
| F5 | Reactions UI | Like / dislike on posts and comments; update counts without a full page reload |
| F6 | Profile | View another developer; edit own skills & experiences |
| F7 | API integration | Typed or clearly structured client calls; handle API errors from the shared error format |
| F8 | Polish | Loading / empty / error states; basic responsive layout |

### 4.3 

| Feature | Description |
| :---- | :---- |
| Refresh tokens | Users (developers) can stay logged in / refresh sessions using a **refresh token** flow |
| Unit tests | Jest covering **services** / business logic |
| Extra UX | Optimistic reactions, pagination, search/filter posts, markdown in posts |

Bonus items are optional. A clean core FE+BE beats unfinished bonus work.

---

## 5\. Suggested Data Model (non-binding)

You may adapt names and fields; keep relationships clear.

User / Developer

  \- id, name, email, passwordHash, createdAt, updatedAt

  \- skills\[\]

  \- experiences\[\]   // e.g. title, company, from, to, description

Post

  \- id, authorId, title, body, createdAt, updatedAt

  \- reactionCounts (or derived)

  \- commentCount (or derived)

  \- rankScore (stored or computed)

Comment

  \- id, postId, authorId, parentCommentId (nullable), body, createdAt

  \- reactionCounts (or derived)

Reaction

  \- id, userId, targetType (post | comment), targetId, type (like | dislike)

  \- unique constraint: one reaction per user per target

---

## 6\. API Expectations (illustrative)

Use consistent envelopes, for example:

| Success  | Error |
| :---- | :---- |
| { "success": true, "data": {}, "message": "optional" } | { "success": false, "statusCode": 400, "message": "Human-readable error", "errors": \[\] } |


#### Document the actual routes in Swagger. Suggested resource areas:
- `/auth/*`  
- `/developers` or `/users` (profile, skills, experiences)  
- `/posts` (create, list ranked, detail)  
- `/posts/:id/comments` and replies  
- `/reactions` or nested under posts/comments

---


## 7\. README Checklist

Your `README.md` must include:

- [ ] Project name and short description  
- [ ] Tech stack (FE, BE, DB)  
- [ ] Local setup (clone, env, install, migrate/seed if any, run FE & BE)  
- [ ] Environment variables (names only; **never** commit secrets)  
- [ ] How to open Swagger / API docs locally  
- [ ] Ranking formula explanation  
- [ ] Link to `AI_USAGE.md`)  
- [ ] Assumptions and known limitations
