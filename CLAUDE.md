# CLAUDE.md

This file provides context for Claude Code when working in this repository.

## Project Overview

BioDex is a Pokédex-style web app for discovering and collecting real-world animals. Users photograph animals, AI identifies the species, and captures are added to their personal collection.

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Email/Password + Google OAuth)
- **Image Storage**: Supabase Storage
- **State Management**: TanStack Query
- **AI**: Anthropic Claude API (Vision)

## Core Features

- **User Authentication**: Sign up/sign in with email or Google
- **Dex Grid**: Visual grid showing captured vs undiscovered animals
- **AI Capture**: Camera capture with AI-powered species identification
- **Persistent Captures**: Photos saved to user accounts
- **Animal Details**: Info pages for each species with user's photo

## Design Principles

- Mobile-first, responsive design
- Simple and fun - focus on the capture-and-collect loop
- No unnecessary complexity

## Running the App

### Prerequisites
- Node.js 20.19+ or 22.12+
- PostgreSQL database
- Supabase project (for image storage)

### Environment Setup
Copy `.env.example` to `.env` and fill in the values:
```bash
cd frontend
cp .env.example .env
```

### Database Setup
```bash
cd frontend
npx prisma migrate dev    # Run migrations
npx prisma db seed        # Seed initial animals
```

### Start Development Server
```bash
cd frontend && npm run dev
```
Runs on http://localhost:3000

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret (optional) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

## Database

Common Prisma commands:
```bash
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create/run migrations
npx prisma db seed         # Seed database
npx prisma generate        # Regenerate Prisma client
```

## Development Notes

- Use `npm` for package management (yarn has issues on this system)
- All backend logic is in Next.js API routes (no separate backend)
- The `backend.deprecated/` folder contains the old FastAPI backend for reference
