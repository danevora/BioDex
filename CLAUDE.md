# CLAUDE.md

This file provides context for Claude Code when working in this repository.

## Project Overview

BioDex is a Pokédex-style web app for discovering and collecting real-world animals. Users photograph animals, AI identifies the species, and captures are added to their personal collection.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
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
cp .env.example .env
```

### Database Setup
```bash
npx prisma migrate dev    # Run migrations
npx prisma db seed        # Seed initial animals
```

### Start Development Server
```bash
npm run dev
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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role/secret key |
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

- Use `npm` for package management
- All backend logic is in Next.js API routes under `src/app/api/`

## Glossary

Key domain terminology used throughout the codebase:

| Term | Definition |
|------|------------|
| **Animal** | A species record in the BioDex catalog. Contains taxonomic info (class, order, family), common/scientific names, habitat, regions, and a default image. |
| **Capture** | A user's documented encounter with an animal. Created when a user photographs an animal and AI identifies it. Stored with userId, animalId, imageUrl, and confidence score. One capture per animal per user. |
| **Dex** | Short for Pokédex. The grid-based UI displaying all animals with visual indicators of capture status (color for captured, grayscale for undiscovered). |
| **Identification** | The AI-powered process of analyzing a user's photo to determine what animal is present and match it to the catalog. |
| **Matched** | When AI successfully identifies an animal in the photo that exists in the BioDex catalog. Returns the animal_id and confidence score. |
| **Confidence** | A score (0.0-1.0) indicating AI certainty that the detected animal matches a catalog entry. |
| **Captured (isCaptured)** | Boolean state indicating a user has successfully captured a specific animal. Shown with a green checkmark and the user's photo. |
| **Locked** | State of an animal card when the user is not authenticated. Shows a lock icon and "???" for the name. |
| **Catalog** | The complete collection of active animals available in BioDex that can be matched during identification. |
