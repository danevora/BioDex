# BioDex Maturation Roadmap

Comprehensive plan to mature BioDex from MVP to App Store-ready product while maintaining web app functionality.

---

## Phase 1: Critical Technical Fixes (Week 1-2)

Foundation work before adding features. Prevents crashes and security issues.

### 1.1 API Stability
| Task | File | Why |
|------|------|-----|
| Wrap `JSON.parse()` in try-catch | `/api/identify/route.ts:136,206` | Crashes endpoint on bad AI response |
| Add request body validation | `/api/posts/route.ts:159`, `/api/posts/[postId]/comments/route.ts:35` | `request.json()` can throw |
| Validate AI response fields before use | `/api/animals/submit/route.ts:163-180` | Prevents injection |

### 1.2 Security
| Task | File | Why |
|------|------|-----|
| Replace admin header auth with session-based | `/api/admin/animals/route.ts:6-8` | Password visible in logs/proxies |
| Add rate limiting middleware | `/api/identify`, `/api/animals/submit` | Prevent DOS, limit API costs |
| Add email validation regex | `/api/auth/signup/route.ts` | Currently accepts invalid emails |
| Increase password minimum to 12 chars | `/api/auth/signup/route.ts:25` | 8 chars too weak |

### 1.3 Database
| Task | File | Why |
|------|------|-----|
| Add indexes to Animal model | `prisma/schema.prisma` | `@@index([class])`, `@@index([isActive])` |
| Add index to User.email | `prisma/schema.prisma` | Login queries slow at scale |
| Add index to Capture.animalId | `prisma/schema.prisma` | Lookups by animal O(n) |
| Wrap image uploads in transactions | `/api/captures/route.ts`, `/api/animals/submit/route.ts` | Prevent orphaned images |

### 1.4 Code Cleanup
| Task | Why |
|------|-----|
| Extract `toPascalCase()` to `/lib/formatting.ts` | Duplicated in 2 files |
| Create `/lib/constants.ts` for PAGE_SIZE, MAX_CAPTION_LENGTH | Magic numbers scattered |
| Standardize API response format | Some return `{error}`, others `{success, error}` |

---

## Phase 2: Core UX Improvements (Week 3-5)

Polish the existing experience before adding new features.

### 2.1 Loading & Feedback States
| Task | Impact |
|------|--------|
| Add skeleton loaders for feed cards | High - replaces janky spinners |
| Add skeleton loader for BioDex grid | High - feels faster |
| Add skeleton loader for profile page | Medium |
| Add toast notifications for actions (follow, like, comment) | High - users need feedback |
| Add image upload progress indicator | Medium - large files feel stuck |

### 2.2 Error Handling
| Task | Impact |
|------|--------|
| Add retry buttons on failed fetches | High - recovery path |
| Show specific error messages (not generic) | Medium |
| Add error boundaries to prevent full page crashes | High |

### 2.3 BioDex Improvements
| Task | Impact |
|------|--------|
| Add search within BioDex grid | High - hard to find specific animals |
| Add sort options (date discovered, alphabetical) | Medium |
| Show completion percentage/stats | Medium - motivation |
| Add ability to delete captures | High - mistakes happen |

### 2.4 Feed Improvements
| Task | Impact |
|------|--------|
| Add pull-to-refresh on mobile | High - expected behavior |
| Show who liked a post (not just count) | Medium |
| Add optimistic updates for likes/comments | High - feels instant |

### 2.5 Profile Improvements
| Task | Impact |
|------|--------|
| Add settings page (theme, privacy basics) | High - expected feature |
| Add ability to change password | High - security |
| Add delete account option | Medium - GDPR/privacy |

### 2.6 Dark Mode
| Task | Impact |
|------|--------|
| Add theme toggle to settings | High - users expect it |
| Create dark color palette | Use Tailwind dark: variants |
| Persist preference | localStorage or user profile |
| Respect system preference | `prefers-color-scheme` media query |

---

## Phase 3: Social Features (Week 6-8)

Features that drive engagement and retention.

### 3.1 Notifications System (High Priority)
| Task | Details |
|------|---------|
| Create Notification model | `type`, `userId`, `actorId`, `postId`, `read`, `createdAt` |
| API endpoints | `GET /api/notifications`, `PATCH /api/notifications/read` |
| Notification types | `follow`, `like`, `comment` |
| UI: notification bell with unread count | Header component |
| UI: notification dropdown/page | List of recent activity |

### 3.2 Enhanced Comments
| Task | Details |
|------|---------|
| Add @mentions in comments | Parse `@username`, link to profile |
| Add comment editing | 5 min edit window |
| Consider reply threading | Optional - adds complexity |

### 3.3 Discovery Features
| Task | Details |
|------|---------|
| "Explorers you might follow" recommendations | Based on mutual follows or similar discoveries |
| Trending/popular posts section | Alternative feed view |
| Share post to external social media | Generate share link/image |

---

## Phase 4: iOS Preparation (Week 9-11)

Architectural changes to support both web and native iOS.

### 4.1 API Client
Current architecture has API routes inside Next.js. Need to support:
- Web app calling `/api/*` routes directly
- iOS app calling `https://biodex.app/api/*`

| Task | Details |
|------|---------|
| Add `API_BASE_URL` environment variable | Empty for web (relative), full URL for iOS |
| Create `apiClient` wrapper | Handles base URL, auth headers, error handling |
| Update all fetch calls to use `apiClient` | ~15 files with direct fetch |

### 4.2 Auth Refactor
Current: JWT in httpOnly cookies (NextAuth manages automatically)
Needed: Bearer tokens that work in native context

| Task | Details |
|------|---------|
| Modify NextAuth to return tokens in response body | Keep cookies for web, add token for native |
| Create `useAuth()` hook | Abstracts storage (cookies for web, Capacitor Preferences for iOS) |
| Add token refresh logic | Tokens expire, need refresh mechanism |
| Update all `useSession()` calls to `useAuth()` | ~10 files |

### 4.3 Image Upload Refactor
Current: Server uses `SUPABASE_SERVICE_ROLE_KEY` (secret)
Problem: Can't expose secret to mobile app

| Task | Details |
|------|---------|
| Option A: API proxy | Mobile sends to backend, backend uploads to Supabase |
| Option B: Supabase RLS | Configure row-level security, use anon key |
| Update upload functions | Support both flows |

### 4.4 Route Protection
Current: Mix of server-side `auth()` and client-side `useSession()` redirects
Needed: All client-side for static export

| Task | Details |
|------|---------|
| Create `<AuthGuard>` wrapper component | Checks auth, redirects if needed |
| Remove server-side auth checks | `/app/page.tsx` uses `await auth()` |
| Update protected pages to use `<AuthGuard>` | `/feed`, `/profile`, etc. |

---

## Phase 5: Capacitor Integration (Week 12-14)

Actual iOS app setup and native features.

### 5.1 Capacitor Setup
| Task | Details |
|------|---------|
| Install Capacitor core | `@capacitor/core`, `@capacitor/cli` |
| Initialize iOS project | `npx cap add ios` |
| Configure `capacitor.config.ts` | App ID, name, server URL |
| Set up Xcode project | Signing, capabilities, icons |

### 5.2 Native Camera
| Task | Details |
|------|---------|
| Install camera plugin | `@capacitor/camera` |
| Replace web camera API with native | Better UX, permissions handling |
| Handle photo library access | For uploading existing photos |

### 5.3 Push Notifications
| Task | Details |
|------|---------|
| Install push plugin | `@capacitor/push-notifications` |
| Set up APNs (Apple Push Notification service) | Requires Apple Developer account |
| Create notification backend | Store device tokens, send via APNs |
| Integrate with notification system from Phase 3 | Trigger push on follow/like/comment |

### 5.4 Native Polish
| Task | Details |
|------|---------|
| Deep links | `biodex://` URL scheme for sharing |
| App icons and splash screen | All required sizes |
| Haptic feedback | On like, capture success |
| Pull-to-refresh native feel | Use Capacitor gesture handling |

### 5.5 Build & Deploy
| Task | Details |
|------|---------|
| Apple Developer account | $99/year |
| TestFlight setup | Internal testing |
| App Store listing | Screenshots, description, keywords |
| App Store review | 1-2 week process |

---

## Phase 6: Polish & Launch (Week 15-16)

Final preparations for public launch.

### 6.1 Performance
| Task | Details |
|------|---------|
| Add image lazy loading | Intersection Observer |
| Add pre-fetching for next page | Feed pagination |
| Optimize bundle size | Code splitting, tree shaking |

### 6.2 Accessibility
| Task | Details |
|------|---------|
| Audit color contrast | WCAG AA minimum |
| Add skip-to-content link | Keyboard navigation |
| Test with VoiceOver | iOS accessibility |
| Add ARIA live regions | Status updates |

### 6.3 Analytics & Monitoring
| Task | Details |
|------|---------|
| Add error monitoring (Sentry) | Catch production errors |
| Add basic analytics | Track key flows |
| Add structured logging | Debug production issues |

---

## Summary Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| 1 | Week 1-2 | Critical fixes (security, stability) |
| 2 | Week 3-5 | UX polish (loading, feedback, dark mode) |
| 3 | Week 6-8 | Social features (notifications, engagement) |
| 4 | Week 9-11 | iOS prep (API extraction, auth refactor) |
| 5 | Week 12-14 | Capacitor integration (native features) |
| 6 | Week 15-16 | Polish & launch |

**Total: ~16 weeks to App Store**

---

## Decisions Made

- **API hosting**: Same Vercel deployment - API routes stay in Next.js, simpler setup
- **Dark mode**: Include in Phase 2 with other UX improvements
- **Offline support**: None for v1 - require internet connection

## Remaining Questions

1. **Push notification provider** - APNs direct or service like OneSignal/Firebase?
2. **Notification types** - Just follow/like/comment or also "new animal added to catalog"?
3. **Analytics provider** - Vercel Analytics, Mixpanel, PostHog, or custom?
