# BioDex

A Pokédex for the real world. Discover, photograph, and collect real-world animals. Explorers photograph animals, AI identifies the species, and discoveries are added to their personal BioDex. Share discoveries to the feed, follow other Explorers, and engage through likes and comments.

## Features

- **AI-Powered Identification**: Point your camera at an animal and Claude Vision identifies the species
- **Personal BioDex**: A visual grid of all species — discovered ones show your photo, undiscovered ones appear grayscale
- **Explorer Profiles**: Username, display name, bio, follower/following counts
- **Social Feed**: Chronological feed of shared discoveries from Explorers you follow
- **Follow System**: Asymmetric follows (Twitter-style) — follow other Explorers to see their posts
- **Likes & Comments**: Engage with shared discoveries
- **Share to Feed**: Optionally share discoveries with captions
- **Explorer Search**: Find and follow other Explorers
- **User Authentication**: Sign up with email/password or Google OAuth

## How It Works

1. **Sign In** — Create an account or sign in with Google
2. **Discover** — Take a photo of an animal you find
3. **Identify** — AI identifies the species and adds it to your BioDex
4. **Collect** — Build your collection with your own photos
5. **Share** — Post discoveries to the feed with a caption
6. **Engage** — Follow Explorers, like and comment on posts

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js (Email/Password + Google OAuth)
- **Image Storage**: Supabase Storage
- **State Management**: TanStack Query
- **AI**: Anthropic Claude API (Vision)
- **Hosting**: Vercel

## Local Development Setup

### Prerequisites

- Node.js 20.19+ or 22.12+
- PostgreSQL database running locally
- Supabase account (for image storage)
- Anthropic API key (for AI identification)

### Installation

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. Create a Supabase storage bucket:
   - Create a bucket named `captures`
   - Set it to public

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open http://localhost:3000

## Production Deployment (Vercel + Supabase)

### Database

BioDex uses Supabase Postgres in production. You need two connection strings from your Supabase project (Connect button > Connection string):

- **Transaction pooler** (port 6543) — set as `DATABASE_URL`, append `?pgbouncer=true`
- **Session pooler** (port 5432) — set as `DIRECT_URL`

To run migrations against production:
```bash
# Temporarily point .env at your Supabase DB, then:
npx prisma migrate deploy
npx prisma db seed
```

### Vercel

1. Deploy with `vercel --prod` or connect your GitHub repo
2. Set all environment variables in Vercel project settings (Settings > Environment Variables):
   - `DATABASE_URL` — Supabase transaction pooler URI with `?pgbouncer=true`
   - `DIRECT_URL` — Supabase session pooler URI
   - `NEXTAUTH_URL` — Your Vercel URL (e.g. `https://biodex.vercel.app`)
   - `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_CLIENT_ID` (optional)
   - `GOOGLE_CLIENT_SECRET` (optional)

### Switching Between Local and Production DB

Both URLs live in `.env`. Comment/uncomment to switch:
```bash
# Local
DATABASE_URL="postgresql://postgres:pass@localhost:5432/biodex"
DIRECT_URL="postgresql://postgres:pass@localhost:5432/biodex"

# Production (Supabase)
# DATABASE_URL="postgresql://postgres.XXX:pass@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://postgres.XXX:pass@aws-0-region.pooler.supabase.com:5432/postgres"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (pooled in production) |
| `DIRECT_URL` | Direct PostgreSQL connection (for Prisma migrations) |
| `NEXTAUTH_URL` | App URL (`http://localhost:3000` for dev) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret (optional) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role/secret key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

## Database Commands

```bash
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create/run migrations (local)
npx prisma migrate deploy  # Apply migrations (production)
npx prisma db seed         # Seed animal catalog
npx prisma generate        # Regenerate Prisma client
```
