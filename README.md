# Spot@NE | North-East Cultural Heritage Hub

Spot@NE is a digital platform designed to spotlight authentic regional artisans and curated cultural experiences across Northeast India. It combines modern web technologies with a tactical, high-performance aesthetic to connect heritage creators with a global audience.

## 🏗️ Project Architecture

The project is divided into three main modules:

1.  **`tourism_frontend/`**: A Next.js application providing the core user interface, featuring tactical HUDs and immersive feed systems.
2.  **`backend/`**: Python-based services including a WebSocket mock for live metrics and an MCP (Model Context Protocol) server.
3.  **`NER-Heritage-MCP/`**: Specialized MCP integrations for cultural data and heritage pattern analysis.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS (v4) with Glassmorphism
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Core**: Python 3.10+
- **Real-time**: FastAPI + WebSockets
- **Protocols**: Model Context Protocol (MCP)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Python 3.10+
- `pip`

### 2. Frontend Setup
```bash
cd tourism_frontend
npm install
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

### 3. Backend Setup
To start the persistent SQLite backend and SSE/WebSocket real-time services:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API and telemetry services run on [http://localhost:8000](http://localhost:8000).

---

## 📁 Repository Structure
```text
Spot@NE/
├── backend/                # FastAPI services, SQLite database & persistent routers
├── tourism_frontend/       # Main Next.js application with Tailwind CSS 4 & Framer Motion
│   ├── src/
│   │   ├── components/    # Tactical UI elements, skeleton loaders, and glassmorphic HUDs
│   │   ├── context/       # Auth, Recommendation, and Comms state engines
│   │   └── lib/           # Analysis engine, types, and utility files
└── NER-Heritage-MCP/       # Heritage Model Context Protocol definitions & social tools
```

## 📜 Documentation
- [FEATURES.md](./FEATURES.md) - Detailed feature breakdown.
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guidelines for developers.
## This webapp has been built entirely through Google AntiGravity IDE!!
