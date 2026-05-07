from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import marketplace, auth, notifications, posts, realtime
from database import engine, Base
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Spot@NE API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "https://hrishikeshdutta-spot-ne.vercel.app",
        "https://tourism-frontend-rho.vercel.app",
        "https://hrishikeshdutta-spot-ne-backend.hf.space",
        "https://tourism-web-app-backend.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base API Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(posts.router, prefix="/api/posts", tags=["Social Feed"])

# Real-time Communication Routes
app.include_router(realtime.router, tags=["Real-time"])

# Serve static files from the uploads directory
base_dir = os.path.dirname(os.path.abspath(__file__))
uploads_dir = os.path.join(base_dir, "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
async def root():
    return {"status": "online", "service": "Spot@NE API"}
