# Spot@NE | Project Context & Development Guide

## Overview
Spot@NE is a premium web application designed to showcase and monitor artisan activities in Northeast India. It features real-time social engagement, live telemetry feeds for artisans (Artisan Dossiers), and a marketplace with dynamic filtering.

## Architecture
The project is split into two main components:
1. **Frontend**: Next.js 16.2.4 application with Tailwind CSS 4 and Framer Motion for high-craft UI/UX.
2. **Backend**: FastAPI/Python based mock server providing real-time WebSocket telemetry.

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- `pip install websockets`

### 2. Running the Backend
Navigate to the `NER-Heritage-MCP` directory and start the WebSocket server:
```powershell
cd NER-Heritage-MCP
python websocket_mock.py
```
- **Port**: 8001
- **Endpoint**: `ws://localhost:8001/ws/weaving/{artisan_id}`

### 3. Running the Frontend
Navigate to the `tourism_frontend` directory and start the Next.js dev server:
```powershell
cd tourism_frontend
npm run dev
```
- **Port**: 3000
- **URL**: [http://localhost:3000](http://localhost:3000)

## Core Features
- **LiveWeavingHUD**: Real-time HUD overlay on video background displaying weaving metrics (complexity, progress, alerts).
- **Social Monitor**: Integrated WebSocket listener for real-time engagement events (likes, comments, reshares).
- **Dynamic Marketplace**: Filterable feed with glassmorphic UI components.

## Recent Updates
- **Fixed Video Fallback**: The `LiveWeavingHUD` now uses a stable primary video source (`BigBuckBunny.mp4` sample) to avoid console errors from expired Vimeo links.
- **WebSocket Stability**: Verified connection between the Python mock server and the Next.js frontend.

---
*Created on 2026-05-01 by Antigravity*
