# NeoStream

A YouTube-style video streaming platform built with React, Tailwind CSS, Node.js, Express, PostgreSQL, and Amazon S3.

## Features

- **Auth** — Register, login, JWT sessions
- **Video upload** — S3 storage with optional thumbnail and category
- **Video CRUD** — Upload, edit visibility (public/private), delete (owner only)
- **Categories** — Filter home feed by Music, News, AI, Source code, Gaming
- **Shorts** — Vertical player for videos under 60 seconds
- **Likes** — Like/unlike videos with live count
- **Comments** — Add and delete your own comments
- **Subscriptions** — Subscribe/unsubscribe to channels
- **Channels** — View channel stats, videos, subscriber count
- **Playlists** — Create playlists and save videos
- **Watch Later** — Save videos to watch later
- **History** — View your watch history
- **Views** — View count tracking on watch

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind CSS v4, React Router |
| Backend | Node.js, Express, Prisma |
| Database | PostgreSQL |
| Storage | Amazon S3 |

## Quick Start

### 1. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, AWS credentials
npm install
npm run db:push
npm run db:seed
npm run dev
```

API runs at `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/neostream?schema=public"
JWT_SECRET="your-secret"
PORT=5000
FRONTEND_URL="http://localhost:5173"

AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_key"
AWS_SECRET_ACCESS_KEY="your_secret"
AWS_S3_BUCKET="your-bucket"
AWS_S3_PUBLIC_URL=""  # optional CloudFront URL
```

## Demo Accounts (after seed)

| Email | Password |
|-------|----------|
| hitesh@neostream.com | password123 |
| demo@neostream.com | password123 |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/videos` | Public feed (`?category=AI&sort=liked`) |
| GET | `/api/videos/shorts` | Short videos (≤60s) |
| POST | `/api/videos` | Upload video |
| GET | `/api/history` | Watch history |
| GET/POST/DELETE | `/api/watch-later/:videoId` | Watch later |
| POST/DELETE | `/api/likes/:videoId` | Like/unlike |
| POST | `/api/comments/:videoId` | Add comment |
| GET | `/api/channels/:userId` | Channel page |
| POST | `/api/subscriptions/:channelId` | Subscribe |
| GET/POST | `/api/playlists` | Playlists |
