# Contributing to Spot@NE

We welcome contributions to the Spot@NE project. To ensure a smooth collaboration, please follow the guidelines below.

## 🛠️ Development Environment Setup

### Frontend (Next.js)
1. Navigate to the `tourism_frontend` directory.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.
4. Linting: `npm run lint`.

### Backend (Python)
1. Navigate to the `backend` directory.
2. Create a virtual environment: `python -m venv venv`.
3. Activate it:
   - Windows: `.\venv\Scripts\activate`
   - Unix/macOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`.
5. Start the mock server: `python websocket_mock.py`.

## 🎨 Design & Coding Standards

### Design Aesthetics
- **Glassmorphism**: Use translucent backgrounds (`bg-black/40`), heavy blurs (`backdrop-blur-xl`), and subtle borders (`border-white/10`).
- **Tactical Glows**: Use emerald and slate color palettes with subtle neon glows for interactive elements.
- **Typography**: Focus on high-contrast, black-weighted headings for a "dossier" look.

### Code Style
- **TypeScript**: Strive for 100% type safety. Avoid `any`. Define interfaces in relevant `types` files or within the component if local.
- **React Components**: Use functional components with hooks. Prefer Next.js `Image` component over standard `<img>` for optimization.
- **Linting**: Ensure all PRs pass `npm run lint` before submission.

## 🚀 Git Workflow
1. Branch from `main` (or `develop` if available).
2. Use descriptive branch names: `feature/live-hud-enhancement`, `fix/scrolling-bug`.
3. Commit messages should be concise and descriptive.

## 🧪 Testing
- Verify all UI changes across responsive breakpoints (Mobile is priority).
- Ensure the WebSocket connection handles failures gracefully.
