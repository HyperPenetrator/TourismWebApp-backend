FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# HF Spaces uses port 7860
EXPOSE 7860

# Set environment variables for production
ENV FRONTEND_URL=https://hrishikeshdutta-spot-ne.vercel.app
ENV DATABASE_URL=sqlite:///./spot_ne.db

# Run with uvicorn on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
