# Spot@NE - Context & Development Guidelines for Gemini AI

This document provides architectural context, tech stack details, and coding guidelines specifically tailored for Gemini AI to assist in developing the **Spot@NE** platform.

## 📌 Project Overview
**Spot@NE** is a premium eco-tourism and cultural heritage platform focusing on Northeast India. It connects users with regional artisans (e.g., weavers, bamboo crafters, potters) and curated cultural experiences. 
The platform is designed with a unique "Tactical Eco-Tourism" aesthetic, blending modern glassmorphism, dynamic data HUDs, and deep cultural respect.

---

## 🛠 Tech Stack

### Frontend (`/tourism_frontend`)
*   **Framework:** Next.js 15+ (App Router)
*   **Library:** React 19
*   **Styling:** Tailwind CSS v4
*   **Animations:** Framer Motion
*   **Icons:** Lucide React
*   **Theming:** `next-themes` (Class-based strategy)

### Backend (`/backend` & `/NER-Heritage-MCP`)
*   **Protocol:** Model Context Protocol (MCP) via FastMCP (Python)
*   **Role:** Acts as an AI recommendation engine and gesture-handler (e.g., swipe-to-sort logic via `mcp_server.py`).
*   **Real-time:** WebSocket server (`websocket_mock.py` on port 8001) streams live data to the `LiveWeavingHUD` component.

---

## 🎨 Design System & Aesthetics (CRITICAL)
Gemini must adhere strictly to the project's visual identity. The UI must NEVER look generic.

1.  **Tactical / Glassmorphic Theme:**
    *   Use `.glass-panel` and `.glass-card` utilities defined in `globals.css` instead of raw opacity classes where possible.
    *   Incorporate subtle tactical elements (e.g., crosshairs, pulsing radar indicators, scanning lines).
2.  **Color Palette:**
    *   **Primary Accent:** Tactical Emerald (`#10b981`).
    *   **Dark Mode Background:** Tactical Black (`#0f172a`).
    *   **Borders:** Use low-opacity emeralds (`border-emerald-500/20`) or spine-lines (`border-spine-line`).
3.  **Typography:**
    *   Primary: `Geist Sans`
    *   Monospace/HUD Elements: `Geist Mono` (Use tracking/uppercase for "system" text).
4.  **Tailwind CSS v4 Nuances:**
    *   **NO `tailwind.config.ts`.** All theme configurations are in `src/app/globals.css` using the `@theme` directive.
    *   To map variables to colors, use `--color-X` syntax (e.g., `--color-background: var(--background);`).
    *   Dark mode relies on `@custom-variant dark (&:where(.dark, .dark *));` being present in `globals.css`.

---

## 🏗 Architectural Patterns

1.  **State Management:**
    *   Avoid Redux. Rely on specialized React Context providers located in `src/context/` (e.g., `RecommendationEngineContext.tsx`, `ArtisanCommsContext.tsx`, `Providers.tsx`).
2.  **Component Structure:**
    *   **`/components/feed`**: Feed elements like `ArtisanProfileCard`, `ExperienceCard`, and complex dynamic components like `LiveWeavingHUD` and `DeepScanner`.
    *   **`/components/layout`**: Persistent structural components like `TopBar`, `BottomNav`, and `DynamicFilterStrip`.
3.  **Data Flow:**
    *   Current data is mocked in `src/lib/data.json`.
    *   Future updates will pull data from the Python MCP backend. When writing backend tools, ensure they return lightweight JSON to avoid blocking the UI.

---

## 🧠 Gemini AI Interaction Guidelines

When working on this repository, Gemini should:
1.  **Acknowledge v4 Tailwind:** Do not suggest editing `tailwind.config.js`. Update `globals.css` for any new theme tokens.
2.  **Preserve the Vibe:** If asked to create a new component, it MUST feature smooth gradients, subtle borders, and modern typography out-of-the-box. "Simple/Basic" MVPs are unacceptable.
3.  **Client Directives:** Remember to add `'use client';` at the top of files that use hooks, event listeners, or Framer Motion.
4.  **Handling Errors:** The Next.js dev server interceptor is strict. Do not leave broken `console.error` logs in production/UI-facing code if they can be handled gracefully with `console.warn` or error boundaries.
