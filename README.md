# ClearClaim

A full-stack claims management platform built with FastAPI (Python) and Next.js 14 (TypeScript).

## Architecture

```
clearclaim/
├── backend/          # FastAPI (Python 3.11)
├── frontend/         # Next.js 14 (TypeScript)
└── docker-compose.yml
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- Docker & Docker Compose

## Quick Start

### 1. Start Infrastructure Services

```bash
docker compose up -d
```

This starts MongoDB (port 27017) and Redis (port 6379).

### 2. Backend

```bash
cd backend
uv sync
cp .env.example .env
uvicorn app.main:app --reload
```

The API will be available at [http://localhost:8000](http://localhost:8000).  
Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## API Documentation

Once the backend is running, interactive API docs are available at:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | MongoDB database name | `clearclaim` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for JWT tokens | (generate your own) |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
