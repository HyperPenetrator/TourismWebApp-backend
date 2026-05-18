# Spot@NE | Feature Roadmap & Capabilities

This document outlines the core capabilities, engine architectures, and implementation statuses of the Spot@NE platform. It lists what is currently fully production-ready, what is simulated/mocked, and what is planned for future phases.

---

## 🌟 Core Features & Architectures

### 1. Live Weaving HUD
*   **Description**: Real-time telemetry dashboard overlaid on a live video background showing weaving metrics, shuttle speed, and pattern integrity.
*   **Real-time Protocol**: Server-Sent Events (SSE) streaming live data at `2s` intervals.
*   **Key Files**:
    *   Frontend Component: `tourism_frontend/src/components/feed/LiveWeavingHUD.tsx`
    *   Backend Stream: `backend/routers/realtime.py` (via `GET /api/realtime/weaving/{artisan_id}`)
*   **Implementation Status**: **Production-Ready**. Features smooth skeleton overlays if data streams are delayed or disconnected.

### 2. Deep Scan Alpha (Pattern Analysis)
*   **Description**: Tactical overlay showcasing a "deep scan" animation of artisan weaving to identify regional motif structures and authenticity.
*   **Key Files**:
    *   Frontend Component: `tourism_frontend/src/lib/AnalysisEngine.ts`
*   **Implementation Status**: **Simulated (Mocked)**. Currently runs a simulated pattern matching algorithm based on image texture metadata. Future integration will link this directly to Model Context Protocol (MCP) computer vision tools.

### 3. Artisan Dossiers & Profiles
*   **Description**: Detailed profiles showcasing an artisan's history, authentic technique catalog, verified heritage status, and responsive media galleries.
*   **Key Files**:
    *   Frontend Component: `tourism_frontend/src/components/profile/ProfileView.tsx`
*   **Implementation Status**: **Production-Ready**. Integrates complete JWT session loading to securely pull user-specific heritage data.

### 4. Dynamic Recommendation Feed
*   **Description**: User-centric content feed sorted dynamically by active regional zones (Assam, Meghalaya, Arunachal, Sikkim) and user interest tags.
*   **Key Files**:
    *   Frontend Context: `tourism_frontend/src/context/RecommendationEngineContext.tsx`
    *   Frontend Component: `tourism_frontend/src/components/layout/DynamicFilterStrip.tsx`
*   **Implementation Status**: **Client-side Filtering**. State management is fully reactive. Feed data is hydrated from static JSON structures and filtered client-side. Future steps will pull recommendations directly from an AI-based backend personalization endpoint.

### 5. Tactical Marketplace & My Uploads
*   **Description**: Translucent glassmorphic product catalog with instant category filtering, ordering capabilities, and real-time SSE order alerts. Includes a "Seller Dashboard" for managing your own listings.
*   **Key Files**:
    *   Frontend Hooks: `useMarketplaceFeedSSE.ts`, `useMarketplaceItems`
    *   Backend Routers: `backend/routers/marketplace.py`
*   **Implementation Status**: **Production-Ready**. Connected to persistent SQLite storage (`MarketplaceItem` table). Real-time uploads propagate to all connected clients immediately. Real-time order placement persists a `Notification` record and immediately signals the seller via SSE.

---

## ⚙️ Technical Implementation Status (Mocks vs. Real)

To assist developers in navigation and enlisting new contributions, the table below outlines the current technical fidelity of our core engines:

| Module / Feature | Current State | Backing Technology | Action Required for v1.0 |
| :--- | :--- | :--- | :--- |
| **User Authentication** | **Production-Ready** | FastAPI JWT Auth + SQLite Storage | None. Fully integrated. |
| **Marketplace Feed & Storage** | **Production-Ready** | SQLAlchemy + SQLite DB + `/uploads` | None. Persistent and reliable. |
| **Order Alerts / Notifications** | **Production-Ready** | SQLite Persistence + Unidirectional SSE | None. Built-in reconnection backoff active. |
| **Weaving Telemetry** | **Production-Ready** | Live SSE telemetry loop (2s) | None. Complete with glassmorphic skeleton screen. |
| **Deep Scan Motif Analysis** | **Simulated** | Static metadata-based calculations | Integrate computer vision or real image processing MCP tools. |
| **Recommendation Personalization** | **Simulated** | Client-side reactive filtering on static JSON | Connect to backend collaborative filtering / ML route. |
| **Safety Content Validator** | **Simulated** | Simple keyword regex checks (`validator.js`) | Integrate third-party content safety API (e.g., Perspective API). |

---

## 🗺️ Roadmap

- [ ] **Phase 1**: Enhance Deep Scan Alpha by integrating actual image processing and AI-driven regional motif classification.
- [ ] **Phase 2**: Extend the Model Context Protocol (`NER-Heritage-MCP`) to automatically register and catalog scanned authentic motifs into a decentralized database.
- [ ] **Phase 3**: Implement localized language support for indigenous regional dialects to expand accessibility for local weaving co-operatives.
