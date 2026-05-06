# implement-fix.md — Console Error Resolution Plan

## Problem Summary
The deployed Spot@NE frontend at Vercel shows these console errors:
1. **SSE `/sse/marketplace` → 404** — Backend CORS `allow_origins` only permits `http://localhost:3000`. The Vercel frontend domain is blocked.
2. **GET `/api/marketplace/items` → 404 + CORB** — Same CORS issue; response blocked by Cross-Origin Read Blocking.
3. **Form field missing id/name** — Profile login/register inputs lack `id` and `name` attributes (3 issues flagged).
4. **SSE reconnection not resilient** — On error the hook closes and never retries.

## Fixes

### Fix 1: Backend CORS — allow Vercel frontend origin
**File**: `backend/main.py`
**Action**: Update `allow_origins` to include the production Vercel domain alongside localhost.

### Fix 2: Form accessibility — add id/name to inputs
**File**: `tourism_frontend/src/components/profile/ProfileView.tsx`
**Action**: Add `id` and `name` attributes to the username, email, and password `<input>` fields.

### Fix 3: SSE reconnection with backoff
**File**: `tourism_frontend/src/hooks/useMarketplaceFeedSSE.ts`
**Action**: On SSE error, schedule a reconnection attempt with exponential backoff (max 30s) instead of permanently closing.

## Execution Order
1. Fix 1 (backend CORS)
2. Fix 2 (form fields)
3. Fix 3 (SSE resilience)
4. Local build verification
5. Git commit and push
