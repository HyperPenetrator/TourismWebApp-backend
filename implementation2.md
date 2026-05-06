# Historical Data Retrieval Implementation Plan (Phase 2)

This document outlines the detailed architecture and implementation steps for Antigravity IDE to introduce historical data fetching (persistence and retrieval) for Marketplace Uploads, Notifications, and Social Posts in the Spot@NE application.

Currently, the application relies heavily on real-time SSE and WebSocket streams for "live" data. To provide a robust user experience, we must persist this data in the SQLite database and expose RESTful endpoints for the frontend to fetch historical context upon initial load.

## 1. Previous Notifications (Persistent Alerts)

### Backend Architecture
Currently, notifications (like "Order Placed") are generated on-the-fly in the `/secure-item/{item_id}` endpoint and broadcasted purely via SSE. If a user is offline, they miss the notification entirely.

**Database Schema Update (`backend/models.py`)**
1. Create a new `Notification` model:
   - `id` (Integer, Primary Key)
   - `user_id` (Integer, ForeignKey to `users.id` - the recipient)
   - `message` (String)
   - `type` (String, e.g., 'new_order', 'system')
   - `read` (Boolean, default: False)
   - `created_at` (DateTime, default: `func.now()`)
2. Add a `notifications` relationship to the `User` model.

**API Endpoints (`backend/routers/notifications.py`)**
1. `GET /api/notifications`: Fetch historical notifications for `current_user`, ordered by `created_at` descending.
2. `PUT /api/notifications/{id}/read`: Mark a specific notification as read.
3. Update `secure_item` in `marketplace.py` to write a `Notification` record to the database *before* firing the SSE event.

### Frontend Integration
1. Update `usePersonalNotificationsSSE.ts`: 
   - Add a `useEffect` to make an initial `fetch` to `/api/notifications` and populate the `notifications` state array.
   - When an SSE event fires, prepend it to this existing state array.
2. Update `NotificationsHUD.tsx` to handle read/unread visual states.

---

## 2. User's Previous Marketplace Uploads (Seller Dashboard)

### Backend Architecture
The existing `/api/marketplace/items` fetches *all* items for the global feed. We need a specific endpoint for the user's own uploads.

**API Endpoints (`backend/routers/marketplace.py`)**
1. `GET /api/marketplace/my-items`:
   - Route uses `Depends(get_current_user)`.
   - Query: `db.query(MarketplaceItem).filter(MarketplaceItem.seller_id == current_user.id).all()`

### Frontend Integration
1. Create a `SellerDashboard.tsx` or `MyUploads.tsx` component.
2. Fetch `/api/marketplace/my-items` on mount.
3. Render a grid of the user's uploaded items, allowing them to track which items have been "secured" (purchased).

---

## 3. Previous Social Posts (Historical Feed)

### Backend Architecture
Currently, the Social Engagement Server (`NER-Heritage-MCP/social_engagement_server.py`) handles real-time WebSocket broadcasting for live weaving posts, but we need historical context when the user initially loads the `LiveWeavingHUD`.

**API Endpoints (`backend/main.py` or `social_engagement_server.py`)**
1. Ensure a `GET /api/posts` endpoint exists to retrieve historical `Post` models from the database.
   - Include eager loading of `engagements` (likes, reshares, comments) so the frontend knows the initial reaction counts.
   - Support pagination (`skip` and `limit`) for infinite scrolling.

### Frontend Integration
1. In `LiveWeavingHUD.tsx` or `ArtisanProfileCard.tsx`:
   - On component mount, execute a REST `fetch` to `/api/posts` to load the initial array of historical posts.
   - Render these posts in the feed.
   - Connect the WebSocket. Any *new* posts arriving via WebSocket should be prepended to the top of the feed.

---

## Execution Workflow for Antigravity

When executing this plan, Antigravity should follow this order:
1. **Schema Migration**: Update `backend/models.py` with the `Notification` table and run the database creation.
2. **Backend API**: Build the REST `GET` routes for Notifications, My Items, and Posts.
3. **Frontend Hydration**: Update the corresponding React hooks to execute a `fetch` on mount, bridging the gap between historical REST data and real-time SSE/WebSocket data.
