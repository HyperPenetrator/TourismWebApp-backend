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
- `pip` or `poetry`

### 2. Frontend Setup
```bash
cd tourism_frontend
npm install
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

### 3. Backend Setup
To enable the Live HUD and metrics:
```bash
cd backend
pip install -r requirements.txt
python websocket_mock.py
```
The mock metrics service runs on port `8001`.

---

## 📁 Repository Structure
```text
Spot@NE/
├── backend/                # WebSocket mocks and FastAPI services
├── tourism_frontend/       # Main Next.js application
│   ├── src/
│   │   ├── components/    # Tactical UI elements (HUDs, Scanners)
│   │   ├── context/       # Recommendation & Comms state
│   │   └── lib/           # Analysis engines & mock data
└── NER-Heritage-MCP/       # Heritage Model Context Protocol definitions
```

## 📜 Documentation
- [FEATURES.md](./FEATURES.md) - Detailed feature breakdown.
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guidelines for developers.
