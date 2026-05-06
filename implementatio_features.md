# Spot@NE - Incomplete Features & Mock Implementations

This document serves as a tracking reference for features that are currently incomplete, mocked, or using placeholder data across the Spot@NE project.

## Frontend (`tourism_frontend/`)

1. **Authentication (`src/context/AuthContext.tsx`)**
   - **Current State:** Implements a mock login mechanism.
   - **Required Implementation:** Integrate a real authentication provider (e.g., NextAuth, Clerk, or a custom JWT/OAuth flow) to securely manage user sessions.

2. **Recommendation Engine & Data Source (`src/context/RecommendationEngineContext.tsx`, `src/components/layout/DynamicFilterStrip.tsx`)**
   - **Current State:** Uses a static `src/lib/data.json` file as the primary mock database for artisans, experiences, and categories.
   - **Required Implementation:** Fetch dynamic data from the live backend APIs to populate the recommendation engine and feed.

3. **Live Marketplace Feed (`src/components/marketplace/LiveMarketplaceFeed.tsx`, `src/hooks/useMarketplaceFeed.ts`)**
   - **Current State:** Uses `DUMMY_ITEMS` for initial data and a `mockPushItem` function to simulate real-time feed updates.
   - **Required Implementation:** Fully connect the WebSocket feed to stream live marketplace uploads and events from the backend instead of injecting mock items.

4. **Analysis Engine (`src/lib/AnalysisEngine.ts`)**
   - **Current State:** Uses "mock pattern matching logic based on texture metadata" to simulate image or pattern analysis.
   - **Required Implementation:** Integrate a real AI/ML model or MCP tool for analyzing weaving patterns and providing genuine insights.

## Backend (`backend/`, `NER-Heritage-MCP/`)

1. **Marketplace Database (`backend/marketplace_mcp.py`)**
   - **Current State:** Uses an in-memory `MOCK_DB` list to store marketplace items.
   - **Required Implementation:** Connect to a persistent, production-ready database (e.g., PostgreSQL, MongoDB).

2. **MCP Server Logic (`backend/mcp_server.py`)**
   - **Current State:** Includes placeholder comments indicating "mocking preference graph update logic," "mocked timestamp," and "mocking database filter update."
   - **Required Implementation:** Implement actual database queries and user preference graph updates for accurate real-time telemetry.

3. **Safety Content Validator (`NER-Heritage-MCP/backend-safety/validator.js`)**
   - **Current State:** Contains a "basic check for potentially harmful content (placeholders)."
   - **Required Implementation:** Connect to a robust moderation API or implement a comprehensive safety filtering engine for user-uploaded content.
