# UI/UX Update: Skeleton Screen Implementation

## Overview

Implement skeleton screens across the Spot@NE webapp to eliminate content layout shifts, reduce perceived latency, and provide a polished loading experience. The approach uses **reusable skeleton primitives** with **glassmorphic aesthetic** matching the existing design language, paired with **framer-motion crossfade transitions** for smooth skeleton-to-content handoff.

---

## 1. Design System & Primitives

### 1.1 Shimmer Animation (add to `src/app/globals.css`)

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@layer utilities {
  .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.06) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
  }

  .dark .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.04) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
  }
}
```

### 1.2 Reusable Skeleton Components (`src/components/ui/skeletons.tsx`)

Create a family of skeleton primitives matching the glassmorphic card/palette language:

| Component | Purpose | Visual |
|---|---|---|
| `SkeletonBlock` | Generic rectangular block (images, banners) | Rounded rect with shimmer overlay + `animate-pulse` base |
| `SkeletonText` | Text lines of variable width | Stacked `h-3` / `h-4` bars, last line 60% width |
| `SkeletonAvatar` | Circular or rounded-square avatar | `rounded-full` or `rounded-xl` with shimmer |
| `SkeletonCard` | Glass-card shaped skeleton (replaces card placeholders) | Matches `.glass-card` shape: rounded-2xl, border, padding |
| `SkeletonGrid` | Configurable grid of skeleton cards | `grid grid-cols-1 md:grid-cols-2 gap-6` with `count` prop |
| `SkeletonList` | Vertical list of skeleton rows | Stacked flex rows with avatar + text |
| `SkeletonHUD` | HUD-specific skeleton | Video-aspect-ratio block + readout bars + progress bar |

All skeletons accept:
- `className` for overrides
- `dark` mode variants via Tailwind `dark:` (already handled by existing `.dark .glass-card` cascade)
- Framer-motion `initial`/`animate` for mount animation (fade in + slight scale)

```tsx
// Example: SkeletonCard API
<SkeletonCard count={4} grid />
// Renders 4 glassmorphic skeleton cards in a responsive grid
```

### 1.3 Mount/Exit animation pattern (framer-motion)

All skeleton wrappers use:

```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -12 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
```

Content wrappers (real data) use the same pattern but staggered, so when data arrives the skeleton exits as content enters:

```tsx
<AnimatePresence mode="wait">
  {isLoading ? (
    <motion.div key="skeleton" exit={{ opacity: 0 }}>
      <SkeletonGrid count={4} />
    </motion.div>
  ) : (
    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <RealContent />
    </motion.div>
  )}
</AnimatePresence>
```

---

## 2. Component-Level Implementation

### 2.1 Marketplace Feed (`MarketplaceFeed.tsx`)

**Current state:** Shows empty-state dashed placeholder immediately; `useMarketplaceItems` exposes `isLoading` but it is never consumed.

**Changes:**
- Hook `isLoading` from `useMarketplaceItems()` into the component
- Add `<AnimatePresence mode="wait">` wrapping the grid
- While `isLoading && items.length === 0`: render `<SkeletonGrid count={4} />`
- When `!isLoading && items.length === 0`: render existing empty-state
- Use the grid column structure: `grid-cols-1 md:grid-cols-2`

**Skeleton card shape per item:**
```
┌─────────────────────────┐
│  ┌───────────────────┐  │  ← aspect-square shimmer block
│  │                   │  │     (matches image container)
│  │                   │  │
│  │                   │  │
│  └───────────────────┘  │
│  ┌────────────────────┐ │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │ │  ← description line 1 (h-4, w-full)
│  │ ▓▓▓▓▓▓▓▓▓▓▓       │ │  ← description line 2 (h-4, w-3/4)
│  │    ₹▓▓▓▓▓         │ │  ← price badge (w-20, h-6)
│  └────────────────────┘ │
└─────────────────────────┘
```

### 2.2 My Uploads (`MyUploads.tsx`)

**Current state:** Has basic `animate-pulse` skeleton (4 divs with bg colors). Upgrade to `SkeletonGrid` with shimmer animation.

**Changes:**
- Replace inline skeleton divs with `<SkeletonGrid count={4} />`
- Remove the `<div className="... animate-pulse">` block

### 2.3 Notifications HUD (`NotificationsHUD.tsx`)

**Current state:** No loading state; immediately shows "No notifications yet" or list.

**Changes:**
- Add `loading` state (the `usePersonalNotificationsSSE` hook does not currently expose `isLoading` — the hook only returns `{ notifications, markRead, notification, clearNotification }`; add an `isLoading` boolean that stays `true` until the first REST fetch resolves)
- While `isLoading`: render `<SkeletonList count={5} />` — each row:
  ```
  ┌──────────────────────────────────┐
  │ ○  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← icon circle (w-8 h-8 rounded-full)
  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓               │  ← message line (h-3, w-3/4)
  │    ▓▓▓▓▓▓▓▓                      │  ← timestamp line (h-2, w-1/4)
  └──────────────────────────────────┘
  ```

**Hook change needed:** `usePersonalNotificationsSSE` needs to expose `isLoading`. Currently it initializes `notifications` as `[]` and fetches via REST on mount. Add `const [isLoading, setIsLoading] = useState(true)` and set to `false` after the initial fetch resolves.

### 2.4 Profile View (`ProfileView.tsx`)

**Current state:** Full-screen centered pulsing circle + "Authenticating Protocol..." text.

**Changes:**
- Keep the centered loading state (it's intentional for the terminal/auth vibe)
- Enhance with skeleton-shimmer class on the pulsing circle
- Replace the `<div className="w-8 h-8 rounded-full bg-tactical-emerald/10 animate-pulse" />` with a glass-card styled loading circle:
  ```
  <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center skeleton-shimmer" />
  ```
- Add a subtle framer-motion pulse animation to the loading indicator (scale 1→1.05→1)

### 2.5 Home Feed – Artisan & Experience Cards (`app/page.tsx`)

**Current state:** Uses mock data from context (synchronous), so no visible loading state during dev. When production-bound with async data, the feed would flash empty.

**Changes:**
- Wrap the `recommendedItems.map(...)` section in a loading-aware container
- Add a `loading` state that surfaces from `useRecommendationEngine()` (or a future async version)
- While loading: render `<SkeletonList count={3} />` where each row mirrors the card layout:
  - **Artisan card skeleton:** horizontal layout — avatar (48×48 rounded-xl) + name line + specialty line + tag pills
  - **Experience card skeleton:** horizontal layout — thumbnail (aspect-[4/3] rounded-2xl) + title line + description lines + rating badges

### 2.6 LiveWeavingHUD (`LiveWeavingHUD.tsx`)

**Current state:** Shows "Analyzing..."/"0.00%" fallback text until SSE data arrives.

**Changes:**
- Add a `SkeletonHUD` that matches the HUD's 3-section layout
- While `!data && !isConnected` for > 1 second: render skeleton overlay
  ```
  ┌──────────────────────────────────────┐
  │ [● Live Broadcast]  [Network ▄▄▄▄▄] │
  │                                      │
  │   ┌──────────────────────────────┐   │
  │   │  video aspect-ratio block    │   │
  │   │  (shimmer overlay)           │   │
  │   └──────────────────────────────┘   │
  │                                      │
  │ ┌──┐  ┌─────────────────────────┐    │
  │ │▐▐│  │ Weave Complexity        │    │
  │ │▐▐│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │    │
  │ └──┘  └─────────────────────────┘    │
  │ ┌──┐  ┌─────────────────────────┐    │
  │ │▐▐│  │ Est. Completion: ▓▓▓▓   │    │
  │ │▐▐│  │ Active Progress: ▓▓%    │    │
  │ └──┘  └─────────────────────────┘    │
  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │  ← progress bar skeleton
  └──────────────────────────────────────┘
  ```
- Use a 1-second delay before showing skeleton to avoid flash on fast SSE connection

### 2.7 Artisan Comms Page (`artisan-comms/page.tsx`)

**Current state:** Hardcoded data, no async fetch. When connected to backend, would need skeletons.

**Changes:**
- Add skeleton for the artisan sidebar list: `<SkeletonList count={4} variant="horizontal" />` with avatar + text
- Add skeleton for the chat area: `<SkeletonBlock className="flex-1 rounded-3xl" />` with shimmer
- While messages are loading: show a chat bubble skeleton (3-4 staggered skeleton bubbles)

---

## 3. Route-Level Loading (`loading.tsx` Files)

### 3.1 `/marketplace/loading.tsx`

Create `src/app/marketplace/loading.tsx` with background ambience + skeleton grid:

```tsx
export default function MarketplaceLoading() {
  return (
    <main className="relative min-h-screen bg-tactical-black pb-32">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-tactical-emerald/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[150px] rounded-full" />
      </div>
      <div className="max-w-screen-md mx-auto relative px-4 pt-24">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <SkeletonBlock className="h-7 w-48 rounded-lg" />
            <SkeletonBlock className="h-4 w-36 rounded-md" />
          </div>
          <SkeletonBlock className="h-4 w-24 rounded-full" />
        </div>
        <SkeletonGrid count={4} />
      </div>
    </main>
  );
}
```

### 3.2 `/artisan-comms/loading.tsx`

Create `src/app/artisan-comms/loading.tsx` with header skeleton + split-panel skeleton (sidebar list + chat area).

### 3.3 Root `loading.tsx`

If desired: `src/app/loading.tsx` — minimal skeleton showing TopBar + a centered pulsing indicator (for initial JS bundle load).

---

## 4. Integration Details

### 4.1 Hooks That Need `isLoading` Exposure

| Hook | Current Return | Add |
|---|---|---|
| `useMarketplaceItems` | `{ items, isLoading, error, fetchItems, prependItem }` | Already has `isLoading` |
| `usePersonalNotificationsSSE` | `{ notifications, markRead, notification, clearNotification }` | Add `isLoading: boolean` |
| `useRecommendationEngine` | `{ recommendedItems, activeCategory, ... }` | Add `isLoading` for future async support |
| `useArtisanComms` | `{ messages, sendMessage }` | Add `isLoading` for future async support |

### 4.2 SSE First-Data Latency Buffer

For SSE-based components (MarketplaceFeed, LiveWeavingHUD, NotificationsHUD):

- Show skeleton immediately on mount (no delay — prevents layout shift)
- Transition to content when `items.length > 0` or `data !== null`
- Use `useEffect` with a 300ms minimum skeleton display time to prevent flash on fast connections

```tsx
const [showSkeleton, setShowSkeleton] = useState(true);

useEffect(() => {
  if (!isLoading && items.length > 0) {
    const timer = setTimeout(() => setShowSkeleton(false), 200);
    return () => clearTimeout(timer);
  }
}, [isLoading, items]);
```

### 4.3 Error State Handling

When fetch fails (`error` is non-null):

- Animate out the skeleton (via `AnimatePresence exit`)
- Fade in error state with retry button
- Use framer-motion: `initial={{ opacity: 0, y: 10 }}` → `animate={{ opacity: 1, y: 0 }}`

Example error state pattern:
```tsx
{error && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-8 text-center"
  >
    <p className="text-red-400/80 text-sm mb-3">{error}</p>
    <button onClick={retry} className="...">Retry</button>
  </motion.div>
)}
```

---

## 5. Accessibility

| Requirement | Implementation |
|---|---|
| `aria-busy` | Set `aria-busy="true"` on skeleton containers, remove when content loads |
| `aria-label` | Each skeleton block labeled `"Loading content"` |
| `prefers-reduced-motion` | Disable shimmer animation (`motion-safe:` Tailwind prefix on shimmer keyframe) |
| Reduced motion fallback | Static `animate-pulse` only (no shimmer) when `prefers-reduced-motion` |
| Screen reader text | Visually hidden `<span className="sr-only">Loading...</span>` inside skeleton wrappers |

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer {
    animation: none;
    background: transparent;
  }
}
```

---

## 6. Implementation Order

| Phase | Components | Est. Effort | Depends On |
|---|---|---|---|
| **1** | Skeleton primitives + globals.css shimmer | 1hr | — |
| **2** | MarketplaceFeed skeleton | 30min | Phase 1 |
| **3** | MyUploads skeleton upgrade | 15min | Phase 1 |
| **4** | NotificationsHUD + hook isLoading exposure | 45min | Phase 1 |
| **5** | ProfileView loading polish | 15min | Phase 1 |
| **6** | loading.tsx files (marketplace, artisan-comms, root) | 30min | Phase 1 |
| **7** | LiveWeavingHUD skeleton overlay | 45min | Phase 1 |
| **8** | Artisan Comms skeleton (sidebar + chat) | 30min | Phase 1 |
| **9** | Home feed skeleton (when async ready) | 30min | Phase 1 |
| **10** | Reduced-motion & a11y pass | 15min | All |

**Total:** ~5 hours

---

## 7. Files to Create / Modify

### New files:
- `src/components/ui/skeletons.tsx` — all reusable skeleton primitives
- `src/app/marketplace/loading.tsx` — route-level marketplace skeleton
- `src/app/artisan-comms/loading.tsx` — route-level artisan-comms skeleton

### Modified files:
- `src/app/globals.css` — add `@keyframes shimmer` + `.skeleton-shimmer` utility
- `src/hooks/usePersonalNotificationsSSE.ts` — expose `isLoading`
- `src/components/marketplace/MarketplaceFeed.tsx` — consume `isLoading`, add skeleton
- `src/components/marketplace/MyUploads.tsx` — replace inline skeleton with `SkeletonGrid`
- `src/components/notifications/NotificationsHUD.tsx` — add skeleton list
- `src/components/profile/ProfileView.tsx` — polish loading state
- `src/components/feed/LiveWeavingHUD.tsx` — add skeleton overlay
- `src/app/artisan-comms/page.tsx` — add skeletons for sidebar/chat
- `src/app/page.tsx` — add skeleton for home feed (when async ready)

---

## Appendix: Skeleton Component Pseudocode (`src/components/ui/skeletons.tsx`)

```tsx
// Primary exports:
// SkeletonBlock, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonGrid, SkeletonList, SkeletonHUD

// Usage:
<SkeletonGrid
  count={4}
  columns={{ default: 1, md: 2 }}
  card={<SkeletonCard />}
/>

<SkeletonList
  count={5}
  avatar={true}
  lines={3}
/>

<SkeletonHUD
  showProgress={true}
  showReadouts={3}
/>
```
