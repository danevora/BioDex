# CLAUDE.md

This file provides context for Claude Code when working in this repository.

## Project Overview

BioDex is a Pokédex-style social web app for discovering and collecting real-world animals. Explorers photograph animals, AI identifies the species, and discoveries are added to their personal BioDex. Explorers can share discoveries to the feed, follow other Explorers, and engage through likes and comments.

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
- **Explorer Profiles**: Profile with username, display name, bio, follower/following counts
- **BioDex Grid**: Visual grid showing discovered vs undiscovered animals
- **AI Discovery**: Camera capture with AI-powered species identification
- **Persistent Discoveries**: Photos saved to user accounts
- **Animal Details**: Info pages for each species with user's photo
- **Social Feed**: Chronological feed of posts from followed Explorers
- **Follow System**: Asymmetric follows (Twitter-style)
- **Likes & Comments**: Engagement on shared discoveries
- **Share to Feed**: Optional sharing of discoveries with captions

## Design Principles

- Mobile-first, responsive design
- Simple and fun - focus on the discover-share-engage loop
- Chronological feed for fairness and simplicity
- Privacy by default - sharing is optional
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

## Database Schema

The database includes the following models:

### Core Models
- **User**: Explorer account with profile fields (username, displayName, bio) and social relations
- **Animal**: Species catalog with taxonomic info, habitat, regions, and images
- **Capture**: User's documented encounter with an animal (one per animal per user)

### Social Models
- **Post**: Discovery shared to the feed, linked to a Capture with optional caption
- **Follow**: Asymmetric follow relationship between Explorers (follower → following)
- **Like**: Explorer's like on a Post (unique per user per post)
- **Comment**: Explorer's comment on a Post

### Future Models
- **Achievement**: Badge definitions with criteria (for future achievement system)
- **UserAchievement**: Earned achievements per Explorer (for future use)

## API Routes

### Social API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/posts` | Feed of posts from followed users + own posts |
| POST | `/api/posts` | Create a new post |
| GET | `/api/posts/[postId]` | Get single post details |
| DELETE | `/api/posts/[postId]` | Delete own post |
| POST | `/api/posts/[postId]/likes` | Like a post |
| DELETE | `/api/posts/[postId]/likes` | Unlike a post |
| GET | `/api/posts/[postId]/comments` | Get comments for a post |
| POST | `/api/posts/[postId]/comments` | Add comment to a post |
| DELETE | `/api/posts/[postId]/comments/[commentId]` | Delete own comment |
| GET | `/api/users/[userId]` | Get public user profile |
| GET | `/api/users/[userId]/posts` | Get user's posts |
| POST | `/api/users/[userId]/follow` | Follow an Explorer |
| DELETE | `/api/users/[userId]/follow` | Unfollow an Explorer |
| GET | `/api/users/search?q=` | Search users by username |
| GET | `/api/user/profile` | Get own profile with stats |
| PATCH | `/api/user/profile` | Update own profile |
| GET | `/api/user/followers` | Get list of followers |
| GET | `/api/user/following` | Get list of following |

### Existing API Endpoints
- `/api/captures` - Capture management
- `/api/animals` - Animal catalog
- `/api/identify` - AI species identification
- `/api/user/stats` - User statistics

## Glossary

Key domain terminology used throughout the codebase:

| Term | Definition |
|------|------------|
| **Explorer** | The user identity in BioDex (like "trainer" in Pokemon). An authenticated user with a profile, followers, and discoveries. |
| **Animal** | A species record in the BioDex catalog. Contains taxonomic info (class, order, family), common/scientific names, habitat, regions, and a default image. |
| **Capture** | A user's documented encounter with an animal. Created when an Explorer photographs an animal and AI identifies it. Stored with userId, animalId, imageUrl, and confidence score. One capture per animal per user. Note: Database uses "capture" but UI displays "discovered". |
| **Discovered** | UI terminology for a successful capture. When an Explorer identifies and documents an animal. Replaces "captured" in all user-facing text. |
| **Discovery** | A documented animal encounter with photo. UI term for a capture, especially when shared to the feed. |
| **BioDex** | The Explorer's personal collection of discovered animals, displayed as a grid. Short for Bio Index (inspired by Pokédex). |
| **Dex** | Shorthand for BioDex. The grid-based UI displaying all animals with visual indicators of discovery status (color for discovered, grayscale for undiscovered). |
| **Feed** | Social timeline showing posts from followed Explorers, ordered chronologically (newest first). |
| **Post** | A discovery shared to the feed with optional caption. Links to a Capture and can receive likes and comments. |
| **Follow** | Asymmetric relationship where one Explorer follows another to see their posts in the feed. Twitter-style (no mutual requirement). |
| **Identification** | The AI-powered process of analyzing an Explorer's photo to determine what animal is present and match it to the catalog. |
| **Matched** | When AI successfully identifies an animal in the photo that exists in the BioDex catalog. Returns the animal_id and confidence score. |
| **Confidence** | A score (0.0-1.0) indicating AI certainty that the detected animal matches a catalog entry. |
| **Discovered (isDiscovered)** | Boolean state indicating an Explorer has successfully discovered a specific animal. Shown with a green checkmark and the Explorer's photo. (Internal code uses `isCaptured`.) |
| **Locked** | State of an animal card when the user is not authenticated. Shows a lock icon and "???" for the name. |
| **Catalog** | The complete collection of active animals available in BioDex that can be matched during identification. |
| **Achievement** | (Future feature) Badge earned by Explorers for discoveries meeting certain criteria. Schema exists but logic not yet implemented. |
