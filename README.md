# মনন (MONON) Backend API Server

> **Express + TypeScript + PostgreSQL REST API with MVC Architecture**

This is the backend server for the **মনন (MONON)** article publishing platform and digital magazine.

---

## 🏗️ Architecture Overview (MVC)

The backend follows standard **Model-View-Controller (MVC)** design principles:

```
article-pr-server/
├── src/
│   ├── config/             # Environment variables & PostgreSQL DB Pool
│   │   ├── env.ts          # Validated environment configuration
│   │   └── db.ts           # PostgreSQL Pool with query execution helper
│   ├── controllers/        # Request Handlers & Business Logic (Controllers)
│   │   ├── analytics.controller.ts
│   │   ├── article.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── contact.controller.ts
│   │   └── topic.controller.ts
│   ├── db/                 # Database Schema, Migrations & Seeds
│   │   ├── migrate.ts      # Automated migration runner script
│   │   ├── schema.sql      # DDL Schema definitions
│   │   └── seed.sql        # Baseline Bengali topics & articles
│   ├── middlewares/        # Express Middlewares
│   │   ├── auth.middleware.ts      # JWT Authentication & RBAC (Admin/Author)
│   │   ├── error.middleware.ts     # Global centralized error handler
│   │   ├── notFound.middleware.ts  # 404 handler
│   │   └── validate.middleware.ts  # Zod schema validation
│   ├── models/             # Data Access Layer & Database Queries (Models)
│   │   ├── analytics.model.ts
│   │   ├── article.model.ts
│   │   ├── contact.model.ts
│   │   ├── topic.model.ts
│   │   └── user.model.ts
│   ├── routes/             # Express API Routers
│   │   ├── analytics.routes.ts
│   │   ├── article.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── contact.routes.ts
│   │   ├── index.ts        # Aggregated router (/api/v1)
│   │   └── topic.routes.ts
│   ├── types/              # TypeScript Interfaces
│   ├── utils/              # Standardized API response, error, hashing, JWT
│   ├── validators/         # Zod Request Validation Schemas
│   ├── app.ts              # Express App setup (CORS, Helmet, RateLimiting, Morgan)
│   └── server.ts           # HTTP Server bootstrap & Graceful Shutdown
```

---

## 🚀 Quick Start

### 1. Environment Setup

Create or verify `.env` file in the root of `article-pr-server`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/article_pr_db?schema=public
JWT_SECRET=super_secret_jwt_key_change_me_in_production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
```

### 2. Database Migration & Seeding

Initialize the PostgreSQL schema and populate baseline Bengali topics, articles, and default admin:

```bash
npm run db:init
```

> **Super Admin Account:**
> - Email: `mstanvirislam05@gmail.com`
> - Password: `tanvir-admin`

### 3. Start Development Server

```bash
npm run dev
```

Server will run at `http://localhost:5000`.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 📡 API Endpoints

### 🩺 Health & Meta
- `GET /` - Server status & metadata
- `GET /api/v1/health` - API health check

### 🔐 Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login & obtain JWT Bearer token
- `GET /api/v1/auth/me` - Get current authenticated user (*Protected*)
- `PATCH /api/v1/auth/profile` - Update user profile & password (*Protected*)

### 🏷️ Topics / Categories (`/api/v1/topics`)
- `GET /api/v1/topics` - Get all topics with published article counts
- `GET /api/v1/topics/:slug` - Get single topic by slug
- `POST /api/v1/topics` - Create new topic (*Admin only*)
- `PATCH /api/v1/topics/:id` - Update topic (*Admin only*)
- `DELETE /api/v1/topics/:id` - Delete topic (*Admin only*)

### 📰 Articles (`/api/v1/articles`)
- `GET /api/v1/articles` - List articles (supports query params: `page`, `limit`, `search`, `topic`, `status`, `isFeatured`, `sortBy`, `sortOrder`)
- `GET /api/v1/articles/featured` - Get featured articles
- `GET /api/v1/articles/lead-cover` - Get top lead cover article
- `GET /api/v1/articles/:slug` - Get article details by slug (auto increments views)
- `POST /api/v1/articles/:id/view` - Explicitly increment view count
- `POST /api/v1/articles` - Create new article (*Author / Admin*)
- `PATCH /api/v1/articles/:id` - Update article (*Author / Admin*)
- `DELETE /api/v1/articles/:id` - Delete article (*Author / Admin*)

### 📩 Contact & Newsletter (`/api/v1/contact`)
- `POST /api/v1/contact/message` - Submit contact inquiry message
- `POST /api/v1/contact/subscribe` - Subscribe email to newsletter
- `GET /api/v1/contact/messages` - Get all messages (*Admin only*)
- `GET /api/v1/contact/subscribers` - Get all subscribers (*Admin only*)

### 📊 Analytics & Dashboard (`/api/v1/analytics`)
- `GET /api/v1/analytics/dashboard` - Admin dashboard summary metrics, top articles, and view timeline (*Admin / Author*)
