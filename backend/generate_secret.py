"""
Generate a secure JWT secret key for production.
Run: python generate_secret.py
"""
import secrets

secret = secrets.token_hex(32)
print("Generated JWT Secret (add to your .env file):")
print(f"JWT_SECRET={secret}")
