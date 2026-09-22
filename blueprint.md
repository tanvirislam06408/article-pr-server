# Blueprint: MONON (মনন) Backend API Server

> **Express + TypeScript + PostgreSQL** REST API for Bengali article publishing platform.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js (ES2022) | - |
| Language | TypeScript | ^5.7.3 |
| Framework | Express | ^4.21.2 |
| Database | PostgreSQL (raw SQL via `pg`) | ^8.13.3 |
| Validation | Zod | ^3.24.2 |
| Auth | JWT (`jsonwebtoken` + `bcryptjs`) | - |
| Security | Helmet, CORS, Rate Limiting | - |
| Uploads | Multer (disk storage, 5MB limit) | - |

**No ORM. All queries are hand-written parameterized SQL.**

## Commands

```bash
npm run dev       # Hot-reload dev server (tsx watch)
npm run build     # Compile TypeScript to dist/
npm run start     # Production server
npm run db:init   # Run schema + seed migration
npm run db:seed   # Run seed only
```

## Folder Structure

```
article-pr-server/
├── src/
│   ├── server.ts           # Entry point: DB test, HTTP server, graceful shutdown
│   ├── app.ts              # Express factory: middleware pipeline + route mounting
│   │
│   ├── config/
│   │   ├── env.ts          # Environment variable parsing + defaults
│   │   └── db.ts           # PostgreSQL Pool + query() helper + testDbConnection()
│   │
│   ├── controllers/        # Request handlers (static async methods)
│   │   ├── auth.controller.ts       # register, login, getMe, updateProfile
│   │   ├── article.controller.ts    # CRUD + pagination + filtering + views
│   │   ├── topic.controller.ts      # CRUD for categories
│   │   ├── contact.controller.ts    # Messages + newsletter subscription
│   │   ├── analytics.controller.ts  # Dashboard metrics
│   │   ├── comment.controller.ts    # Threaded comments + likes
│   │   └── upload.controller.ts     # Image upload (multer)
│   │
│   ├── models/             # Data access layer (parameterized SQL queries)
│   │   ├── user.model.ts
│   │   ├── article.model.ts    # Largest: dynamic WHERE/ORDER/LIMIT builder
│   │   ├── topic.model.ts
│   │   ├── contact.model.ts
│   │   ├── analytics.model.ts
│   │   └── comment.model.ts
│   │
│   ├── routes/             # Route definitions + middleware wiring
│   │   ├── index.ts            # Central router: mounts all sub-routers under /api/v1
│   │   ├── auth.routes.ts
│   │   ├── article.routes.ts
│   │   ├── topic.routes.ts
│   │   ├── contact.routes.ts
│   │   ├── analytics.routes.ts
│   │   ├── comment.routes.ts
│   │   └── upload.routes.ts
│   │
│   ├── middlewares/         # Reusable middleware
│   │   ├── auth.middleware.ts      # JWT verify + RBAC role check
│   │   ├── validate.middleware.ts  # Zod schema validation (body/query/params)
│   │   ├── error.middleware.ts     # Centralized error handler
│   │   └── notFound.middleware.ts  # 404 catch-all
│   │
│   ├── types/              # TypeScript interfaces
│   │   ├── index.ts          # Domain types: User, Article, Topic, etc.
│   │   └── express.d.ts      # Augments Request with user?: JwtPayload
│   │
│   ├── utils/              # Shared utilities
│   │   ├── apiError.ts       # ApiError class (status code + validation errors)
│   │   ├── apiResponse.ts    # sendResponse() standardized JSON envelope
│   │   ├── jwt.ts            # generateToken / verifyToken
│   │   ├── password.ts       # hashPassword / comparePassword (bcrypt)
│   │   └── slugify.ts        # Unicode-aware slug generation
│   │
│   ├── validators/         # Zod schemas for request validation
│   │   ├── auth.validator.ts
│   │   ├── article.validator.ts
│   │   ├── topic.validator.ts
│   │   └── contact.validator.ts
│   │
│   └── db/                 # Database files
│       ├── schema.sql       # DDL: 8 tables, 11 indexes
│       ├── seed.sql         # Seed data: 4 users, 7 topics, 3 articles
│       └── migrate.ts       # Migration runner (idempotent)
│
├── uploads/                # Uploaded images (static serve)
├── dist/                   # Compiled JS output
└── .env                    # Environment config (gitignored)
```

## Key Architecture

### Request Flow

```
Request → helmet → cors → rateLimit → morgan → bodyParser
       → router
         → validate(schema) → authenticate → authorize(roles) → Controller
           → Model (SQL) → PostgreSQL
         ← sendResponse({ success, statusCode, message, data, meta })
       → errorHandler (catches all errors)
```

### MVC Pattern

| Layer | Location | Responsibility |
|-------|----------|---------------|
| **Model** | `src/models/*.model.ts` | SQL queries, row mapping, data access |
| **Controller** | `src/controllers/*.controller.ts` | Request handling, business logic, response |
| **Routes** | `src/routes/*.routes.ts` | HTTP verbs → controller methods + middleware |

### Middleware Chain (per route)

```typescript
router.post("/",
  authenticate,                          // Verify JWT Bearer token
  authorize("admin", "author"),          // Check role
  validate({ body: createArticleSchema }),// Zod validation
  Controller.createArticle               // Execute handler
);
```

### Authentication & Authorization
- **JWT Bearer Token** in `Authorization` header
- 3 roles: `admin`, `author`, `user`
- `authenticate` middleware → `req.user = { userId, email, role }`
- `authorize(...roles)` → RBAC check

### Error Handling
- `ApiError` class with status codes + validation error array
- Static factories: `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `conflict()`, `internal()`
- All controllers: `try/catch` → `next(error)` → global `errorHandler`

### Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable message",
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 }
}
```

### ID Pattern
All IDs: `{prefix}-{timestamp}-{random}` → `usr-1234567890-abcde`

## Database Schema (8 tables)

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | User accounts (admin/author/user) | - |
| `topics` | Article categories (Bengali) | - |
| `articles` | Published content | FK → topics, FK → users |
| `contacts` | Contact form messages | - |
| `subscribers` | Newsletter subscribers | - |
| `article_views` | View tracking | FK → articles (CASCADE) |
| `comments` | Threaded comments | FK → articles, self-referential FK |
| `article_likes` | Like/clap tracking | FK → articles, UNIQUE(article_id, fingerprint) |

## API Routes (`/api/v1`)

| Group | Endpoints | Auth |
|-------|-----------|------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/profile` | Mixed |
| **Topics** | `GET /topics`, `GET /topics/:slug`, `POST`, `PATCH`, `DELETE` | Write: admin |
| **Articles** | `GET /articles` (paginated), `GET /featured`, `GET /lead-cover`, `GET /:slug`, `POST`, `PATCH`, `DELETE` | Write: admin/author |
| **Contact** | `POST /contact/message`, `POST /contact/subscribe`, `GET /messages`, `GET /subscribers` | Read: admin |
| **Analytics** | `GET /analytics/dashboard` | admin/author |
| **Comments** | `GET /comments/:slugOrId`, `POST`, `POST /like` | Public |
| **Upload** | `POST /upload/image` | auth |

## Environment Variables

```env
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/monon
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000    # 15 min
RATE_LIMIT_MAX=1000
NODE_ENV=development
```

## Important Files to Know

| File | Why It Matters |
|------|----------------|
| `src/server.ts` | Entry point - start here to understand boot sequence |
| `src/app.ts` | Middleware pipeline + route mounting order |
| `src/config/db.ts` | Database connection + query helper |
| `src/config/env.ts` | All env vars parsed here |
| `src/models/article.model.ts` | Most complex model - dynamic query builder |
| `src/middlewares/auth.middleware.ts` | Auth + RBAC logic |
| `src/middlewares/validate.middleware.ts` | Zod validation pattern |
| `src/utils/apiError.ts` | Error class - use for all operational errors |
| `src/utils/apiResponse.ts` | Response format - use for all controller responses |
| `src/db/schema.sql` | Full database DDL |
| `src/validators/article.validator.ts` | Zod schema example |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up PostgreSQL database, then configure .env
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET

# 3. Initialize database (schema + seed data)
npm run db:init

# 4. Start dev server
npm run dev

# Server runs on http://localhost:5000
# Health check: GET /api/v1/health
# Super admin: mstanvirislam05@gmail.com / tanvir-admin
```

## Common Tasks

- **Add new endpoint:** Create model → controller → route → validator → mount in `routes/index.ts`
- **Add new table:** Write SQL in `db/schema.sql`, add interface in `types/index.ts`, create model
- **Add new middleware:** Create in `middlewares/`, apply in route definitions or `app.ts`
- **Add validation:** Create Zod schema in `validators/`, use `validate()` middleware
- **Add new role permission:** Update `authorize()` calls in route definitions
