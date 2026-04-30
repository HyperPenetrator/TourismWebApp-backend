# Heritage Threads | Social NER Platform

A multi-user social application inspired by Threads, focused on cultural heritage and powered by Named Entity Recognition.

## Project Structure

- **`frontend-threads`**: Next.js 15 application with a premium, mobile-first design.
- **`backend-nlp`**: (Internal Service) Logic for extracting entities from heritage discussions.
- **`backend-safety`**: (Internal Service) Input validation and PII scrubbing.
- **`data-stores`**: JSON/Database storage for heritage site reference data.

## Features

- **Threads Feed**: A clean, minimalist feed for sharing heritage stories.
- **AI Tagging**: Automatic extraction of Places, People, and Dates from posts.
- **Heritage Matching**: Automatic linking of posts to historical databases.
- **Premium UI**: Dark mode, gold accents, and smooth animations.

## Getting Started

1. **Frontend**:
   ```bash
   cd frontend-threads
   npm install
   npm run dev
   ```

2. **NLP Backend (Optional standalone)**:
   ```bash
   cd backend-nlp
   npm start
   ```

## Architecture

This app uses a modern full-stack architecture:
- **Frontend**: React/Next.js for the social experience.
- **Entity Engine**: The `compromise` library handles real-time NER.
- **Safety**: Multi-stage validation for all user-generated content.