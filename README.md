# BioDex

A Pokédex for the real world. Discover, photograph, and collect animals around you.

## Features

- **User Accounts**: Sign up with email/password or Google OAuth
- **AI Identification**: Point your camera at an animal and AI identifies the species
- **Personal Collection**: Your captures are saved to your account with your photos
- **Discovery**: Learn about each animal's classification, habitat, and fun facts

## How It Works

1. **Sign In**: Create an account or sign in with Google
2. **Capture**: Take a photo of an animal you find
3. **Identify**: AI identifies the species and adds it to your dex
4. **Collect**: Build your collection - each entry shows your photo

## Setup

### Prerequisites

- Node.js 20.19+ or 22.12+
- PostgreSQL database
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

## Tech Stack

- **Framework**: Next.js (App Router), React, Tailwind CSS
- **Database**: PostgreSQL with Prisma
- **Auth**: NextAuth.js
- **Storage**: Supabase
- **AI**: Anthropic Claude (Vision API)
