# Finance Data Processing and Access Control Backend

A production-quality Node.js + Express backend for a finance dashboard system with **role-based access control**, **financial record management**, and **analytics dashboard APIs**.

## 🏗️ Architecture

This project follows industry-standard backend architecture patterns:

```
src/
├── config/            # Swagger configuration
├── controllers/       # Request handlers (thin — delegate to services)
├── middlewares/        # Auth, RBAC, validation, error handling, rate limiting, logging
├── prisma/            # Prisma client singleton
├── repositories/      # Data access layer (all DB queries)
├── routes/            # Express route definitions with Swagger JSDoc
├── services/          # Business logic layer
├── utils/             # ApiError, logger, helpers
├── validators/        # Zod input validation schemas
├── app.js             # Express application entry point
└── seed.js            # Database seed script
```

### Design Patterns Used

| Pattern | Implementation |
|---------|---------------|
| **Repository Pattern** | All DB access abstracted in `repositories/` — no Prisma calls in services or controllers |
| **Service Layer** | Business logic in `services/` — controllers are thin request/response wrappers |
| **Middleware Pipeline** | Auth → RBAC → Validation → Controller → Error Handler |
| **Centralized Error Handler** | Custom `ApiError` class with factory methods, Zod/Prisma error mapping |
| **Role-Based Access Control** | Permission map (`rolePermissions`) checked via `authorize()` middleware |
| **Dependency Injection** | Controllers instantiate services with repositories — easy to mock for testing |

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: PostgreSQL (Neon — cloud-hosted)
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: Zod
- **API Docs**: Swagger UI (swagger-jsdoc + swagger-ui-express)

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- A PostgreSQL database (recommend [Neon](https://neon.tech) for free cloud hosting)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd finance-backend
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
JWT_SECRET="your-secure-random-secret-key"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV=development
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (creates tables)
npm run prisma:push

# Seed with sample data
npm run seed
```

### 4. Start the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

### 5. Access API Documentation

Open [http://localhost:3000/api-docs](http://localhost:3000/api-docs) for the interactive Swagger UI.

## 👥 Roles & Permissions

| Permission | Viewer | Analyst | Admin |
|-----------|--------|---------|-------|
| View records | ✅ | ✅ | ✅ |
| Dashboard summaries | ❌ | ✅ | ✅ |
| Create/update records | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login and get JWT token |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| PATCH | `/api/auth/profile` | ✅ | Update own profile |

### User Management (Admin Only)
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/users` | manage_users | List all users (paginated) |
| GET | `/api/users/:id` | manage_users | Get user by ID |
| PATCH | `/api/users/:id/role` | manage_users | Update user role |
| PATCH | `/api/users/:id/status` | manage_users | Activate/deactivate user |

### Financial Records
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/api/records` | write | Create a record |
| GET | `/api/records` | read | List records (filtered, paginated) |
| GET | `/api/records/:id` | read | Get single record |
| PUT | `/api/records/:id` | write | Update a record |
| DELETE | `/api/records/:id` | delete | Soft-delete a record |

**Query Filters**: `?type=income&category=Salary&dateFrom=2025-01-01&dateTo=2025-12-31&page=1&limit=20`

### Dashboard Analytics (Analyst + Admin)
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/dashboard/summary` | read_analytics | Full dashboard summary |
| GET | `/api/dashboard/trends` | read_analytics | Monthly income/expense trends |
| GET | `/api/dashboard/categories` | read_analytics | Category-wise breakdown |

### Utility
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api-docs` | Swagger UI |
| GET | `/api-docs.json` | Raw OpenAPI spec |

## 🧪 Test Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@finance.com | password123 |
| Analyst | analyst@finance.com | password123 |
| Viewer | viewer@finance.com | password123 |

## 🔒 Security Features

- **JWT Authentication** — Stateless token-based auth with configurable expiry
- **Password Hashing** — bcrypt with 12 salt rounds
- **Role-Based Access Control** — Middleware-enforced permission checks
- **Input Validation** — Zod schemas on all endpoints
- **Rate Limiting** — 100 requests/minute per IP (in-memory)
- **Request Body Limit** — 10KB max JSON payload
- **Soft Delete** — Financial records are never permanently deleted via API

## 📊 Dashboard Summary Response Example

```json
{
  "success": true,
  "message": "Dashboard summary",
  "data": {
    "totalIncome": 72500.00,
    "totalExpenses": 35200.00,
    "netBalance": 37300.00,
    "categoryTotals": [
      { "category": "Salary", "income": 60000, "expense": 0, "count": 12, "net": 60000 },
      { "category": "Rent", "income": 0, "expense": 18000, "count": 12, "net": -18000 }
    ],
    "recentActivity": [
      { "id": "...", "amount": 5500, "type": "income", "category": "Salary", "date": "..." }
    ]
  }
}
```

## 🏛️ Technical Decisions & Trade-offs

1. **Prisma over raw SQL**: Chose Prisma for type-safe queries and easy migrations, with raw SQL only for complex aggregations (monthly trends) where Prisma groupBy is insufficient.

2. **In-memory rate limiter**: Simpler than Redis for a single-server deployment. In production with multiple instances, this would need Redis or a distributed solution.

3. **Soft delete**: Financial records use `deletedAt` timestamp instead of hard delete — preserves audit trail and enables recovery. Hard delete is available but not exposed via API.

4. **Token re-verification**: The auth middleware re-fetches the user from the database on every request to ensure deactivated users can't use stale tokens. Trade-off: extra DB query per request vs. security.

5. **Express 5**: Using the latest Express version for better async error handling and modern features.

6. **Neon PostgreSQL**: Serverless Postgres that auto-scales and has a generous free tier — ideal for this use case.

## 📝 Assumptions

- Single-server deployment (rate limiter is in-memory)
- JWT tokens are the only authentication method (no sessions)
- All monetary amounts are stored as floating-point (for a production system, use Decimal/BigInt)
- Soft-deleted records are excluded from all list/aggregate queries
- The seed script is for development only and clears existing data

## 🔮 Potential Improvements

- [ ] Redis-based rate limiting for multi-instance deployments
- [ ] Decimal.js for precise monetary arithmetic
- [ ] Refresh token rotation
- [ ] Audit logging for all write operations
- [ ] Export financial data as CSV/PDF
- [ ] Webhook notifications for large transactions
- [ ] CI/CD pipeline with automated testing
- [ ] Docker containerization
