# Spot@NE | Project Context & Development Guide

## Overview
Spot@NE is a premium web application designed to showcase and monitor artisan activities in Northeast India. It features real-time social engagement, live telemetry feeds for artisans (Artisan Dossiers), and a marketplace with dynamic filtering and real-time order notifications.

## Architecture
The project is split into two main components:
1. **Frontend (`/tourism_frontend`)**: Next.js 16.2.4 application with Tailwind CSS 4 and Framer Motion for high-craft UI/UX, fully responsive and featuring Light/Dark modes.
2. **Backend (`/backend`)**: FastAPI/Python server handling JWT authentication, a real-time Server-Sent Events (SSE) and WebSocket infrastructure for telemetry and notifications, and an SQLite database for persistent storage (users, marketplace items, engagements, and notifications).

## Environments & Deployment
- **Frontend Hosting**: Deployed on Vercel.
- **Backend Hosting**: Deployed as a Dockerized container on Hugging Face Spaces.
  - *Production API URL*: `https://hrishikeshdutta-spot-ne-backend.hf.space`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: Points to the backend URL (`http://localhost:8000` for local dev).

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### 2. Running the Backend
Navigate to the `backend` directory, install dependencies, and start the FastAPI server:
```powershell
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- **Port**: 8000
- **Base URL**: `http://localhost:8000`

### 3. Running the Frontend
Navigate to the `tourism_frontend` directory and start the Next.js dev server:
```powershell
cd tourism_frontend
npm run dev
```
- **Port**: 3000
- **URL**: `http://localhost:3000`

## Core Features
- **LiveWeavingHUD**: Real-time HUD overlay on video background displaying weaving metrics (complexity, progress, alerts).
- **Social Monitor**: Integrated WebSocket listener for real-time engagement events (likes, comments, reshares).
- **Dynamic Marketplace**: Filterable feed with glassmorphic UI components, drag-and-drop item uploads, and real-time SSE updates for new inventory.
- **Author Dashboard & Notifications**: Real-time order notifications for artisans when buyers secure an item, synced via SSE.
- **Authentication**: JWT-based login/registration with secure route protection.

## Recent Updates
- **Skeleton Screen Loader**: Integrated full shimmer loading screens and glassmorphic skeleton cards across the feed, profile, notifications, and marketplace modules using `framer-motion` crossfade transitions to prevent layout shifts.
- **Historical Data Persistency**: Supplemented real-time SSE streams with SQLite persistent storage, exposing RESTful endpoints (`GET /api/notifications`, `GET /api/marketplace/my-items`, `GET /api/posts`) to hydrate the frontend with historical data on initial load.
- **CORS & Form Accessibility**: Enabled cross-origin API communication between Vercel and Hugging Face, resolved console issues by adding `id` and `name` attributes to all authentication forms, and added robust exponential backoff retry logic to SSE EventSource connections.
- **Hugging Face Deployment**: Backend successfully deployed to HF Spaces using the `scripts/upload_to_hf.py` script.
- **SSE Stabilization**: Fixed HTTP/2 Protocol Errors caused by proxy buffering on HF Spaces by applying `X-Accel-Buffering: no` headers.
- **UI Enhancements**: Integrated a global Light/Dark mode toggle to the TopBar utility section.

---
*Last Updated on 2026-05-19 by Antigravity*

