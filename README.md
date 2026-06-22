# Helpdesk Ticketing System

A full-stack, production-style support ticketing system, built to demonstrate enterprise-ready full-stack engineering: REST API design, relational database schema design with query optimization, JWT authentication, role-based authorization, and containerized deployment.

## Why This Project

Built directly on my background as a Senior Technical Support Engineer (LevelUp) - where I handled high-volume ticket queues daily. This project rebuilds that domain from the engineering side: designing the system that powers ticket triage, assignment, and resolution.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Backend | Node.js + Express |
| Database | PostgreSQL (raw SQL, no ORM — explicit schema control) |
| Auth | JWT + bcrypt password hashing |
| Testing | Jest + Supertest |
| Deployment | Docker + Docker Compose |

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   React     │─────▶│   Express   │─────▶│  PostgreSQL  │
│  Frontend   │ REST │   Backend   │ SQL  │   Database   │
│  (TS)       │◀─────│   (Node.js) │◀─────│              │
└─────────────┘ JSON └─────────────┘      └──────────────┘
                            │
                      JWT Middleware
                   (auth + role checks)
```

## Key Engineering Decisions

### 1. Role-Based Access Control (RBAC)
Three roles with different data visibility:
- **Admin** — sees all tickets
- **Agent** — sees only tickets assigned to them
- **User** — sees only tickets they created

Implemented via SQL `WHERE` clause injection based on `req.user.role` — not just UI hiding, but actual query-level enforcement (a common security mistake is filtering only on the frontend).

### 2. Database Schema & Query Optimization
```sql
CREATE INDEX idx_tickets_status_priority ON tickets(status, priority);
```
Composite indexes added for the most common filter combinations, avoiding full table scans as ticket volume grows - directly addresses "query optimization" requirements for enterprise-scale systems.

### 3. Security Practices
- Passwords hashed with bcrypt (never stored in plain text)
- Parameterized SQL queries throughout (prevents SQL injection)
- JWT tokens with expiration (24h)
- Authorization middleware separate from authentication (separation of concerns)

### 4. Why Raw SQL Instead of an ORM
Demonstrates direct understanding of SQL — JOINs, indexes, parameterized queries - rather than abstracting database logic behind an ORM. This is intentional: it shows the underlying schema design and query optimization skills explicitly.

## Running the Project

### Option 1 - Docker Compose (recommended)
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Database auto-migrates on first run via `schema.sql`

### Option 2 - Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your local Postgres credentials
npm run migrate    # creates tables + seed data
npm run dev         # starts on :4000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm start            # starts on :3000
```

### Running Tests
```bash
cd backend
npm test
```

## Demo Accounts

| Email | Role | Password |
|-------|------|----------|
| admin@helpdesk.com | Admin | password123 |
| sara@helpdesk.com | Agent | password123 |
| ali@helpdesk.com | User | password123 |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Get JWT token |
| GET | `/api/tickets` | ✓ | List tickets (role-filtered) |
| GET | `/api/tickets/:id` | ✓ | Get ticket detail |
| POST | `/api/tickets` | ✓ | Create ticket |
| PATCH | `/api/tickets/:id` | Admin/Agent | Update status/assignment |
| GET | `/api/tickets/:id/comments` | ✓ | Get comments |
| POST | `/api/tickets/:id/comments` | ✓ | Add comment |
| GET | `/api/users` | Admin/Agent | List agents (for assignment) |

## Project Structure

```
helpdesk-ticketing-system/
├── backend/
│   ├── src/
│   │   ├── db/          # schema.sql, connection pool, migration script
│   │   ├── middleware/   # JWT auth + role-based access control
│   │   ├── controllers/  # business logic
│   │   ├── routes/       # Express route definitions
│   │   └── server.js     # app entry point
│   ├── tests/            # Jest + Supertest tests
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # typed API client
│   │   ├── context/      # AuthContext (global auth state)
│   │   ├── components/   # LoginForm, TicketList, TicketDetail, CreateTicketForm
│   │   └── App.tsx
│   └── Dockerfile
└── docker-compose.yml     # orchestrates all 3 services
```
