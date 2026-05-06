# Security Configuration Guide

## JWT Secret Key

The JWT secret is now loaded from the `JWT_SECRET` environment variable.

### For Development
A default secret is provided in `backend/.env` (auto-generated).

### For Production
**⚠️ CHANGE THE DEFAULT SECRET IMMEDIATELY**

1. Generate a new secret:
   ```bash
   cd backend
   python generate_secret.py
   ```

2. Update `backend/.env` or set environment variable:
   ```bash
   export JWT_SECRET="your-secure-64-char-hex-string"
   ```

3. Never commit `.env` files to version control (already in `.gitignore`)

## Environment Variables Summary

| Variable | Location | Purpose |
|-----------|----------|---------|
| `JWT_SECRET` | backend/.env | JWT signing key (KEEP SECRET!) |
| `DATABASE_URL` | backend/.env | PostgreSQL/SQLite connection |
| `FRONTEND_URL` | backend/.env | CORS allowed origin |
| `NEXT_PUBLIC_API_URL` | tourism_frontend/.env.local | Frontend API endpoint |
| `NEXT_PUBLIC_WS_URL` | tourism_frontend/.env.local | Frontend WebSocket endpoint |

## WebSocket Authentication

WebSocket connections now accept JWT tokens via query parameter:
```
ws://localhost:8000/ws/marketplace?token=your_jwt_token
```

The token is validated server-side using the same `JWT_SECRET`.
