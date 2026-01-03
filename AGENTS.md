# AGENTS.md

## Project: BioDex
A mobile app that works like a real-world Pokedex for animals. Users take photos, AI identifies the species, and the animal is "captured" into the user's personal dex. The experience is about collection, exploration, and completion, with fun, friendly info post-capture.

## Repo structure
- frontend/
  - Mobile app (iOS/Android)
  - UI, camera flow, dex UI, progress views, exploration guidance
- backend/
  - AI recognition, catalog data, user progress, suggestions, gamification
  - APIs, storage, analytics, moderation/safety

## Product vision
- Fun-first exploration of real wildlife
- Game-like collecting, not social validation
- Friendly, lightweight facts over academic depth

## Core loop
1. Explore outdoors
2. Photograph animal
3. Identify species (AI)
4. Capture unlocks dex entry with user's photo
5. Earn progress and suggestions for next finds

## Key features
- Dex/catalog with locked silhouettes until captured
- Capture flow: photo -> AI identify -> confirm -> save
- Friendly info cards: habitat, behavior, fun facts, rarity
- Progress tracking: overall %, by region, by biome, by animal category
- Exploration guidance: missing animals nearby
- Optional gamification: streaks, challenges, expeditions
- Friends: connect, compare completion by category, and get updates when friends capture new animals

## Target experience
- More collectible and game-like than iNaturalist or Google Lens
- Inspired by Pokedex mechanics, grounded in real animals

## MVP scope
- Camera + upload
- Species identification with confidence + human-friendly label
- Dex grid with silhouettes and unlocked entries
- Entry detail page with user photo and fun facts
- Basic progress % overall and by region
- Simple nearby suggestions (top 3 missing)
- Friends: add friends, compare completion by category, and capture updates feed

## Data model (high level)
- Animal: id, common_name, scientific_name, family, habitat, biome, rarity, fun_facts
- Capture: id, user_id, animal_id, photo_url, location, timestamp, confidence
- UserProgress: totals, by_region, by_biome, streak

## AI + identification
- Use image recognition to return top-k species + confidence
- UX: allow user confirm or re-take photo
- Fallback: mark as "unknown" and allow manual lookup later

## Privacy & safety
- Photo ownership: user photo stored for personal dex
- Location: optional but required for regional progress/suggestions
- Avoid sharing by default; explicit opt-in for public sharing

## Tech notes
- Frontend: mobile-first, camera + offline-friendly dex browsing
- Backend: inference service, catalog DB, user progress service
- Consider model update pipeline and species taxonomy updates

## Future ideas
- Seasonal events and limited-time expeditions
- Regional badges and biome completion rewards
- AR view for silhouettes in the wild (optional)
