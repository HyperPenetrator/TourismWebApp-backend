# Feature 2: Prompts for Antigravity IDE

## Overview
This document details the set of prompts designed for integration with the Antigravity IDE to enhance development workflow for the Spot@NE project. These prompts facilitate code generation, debugging, refactoring, and documentation tasks specific to the project's technology stack.

## Prompt Categories

### 1. Frontend Development (Next.js/Tailwind/Framer Motion)
- **Component Generation**: "Create a reusable Next.js component with Tailwind CSS styling and Framer Motion animations for [purpose]."
- **Dark Mode Integration**: "Implement light/dark mode toggle using Tailwind CSS classes and Context API for [component/page]."
- **Data Fetching**: "Write a Next.js 16.2.4 server component that fetches data from the backend API endpoint [endpoint] with proper loading and error states."
- **Animation Enhancement**: "Add Framer Motion variants for [element] to create [specific animation effect] on hover/scroll."

### 2. Backend Development (FastAPI/Python/SSE/WebSocket)
- **API Endpoint Creation**: "Generate a FastAPI route for [HTTP method] [path] that handles [request/response model] with JWT authentication."
- **Real-time SSE**: "Implement a Server-Sent Events endpoint for [event type] with proper connection handling and retry logic."
- **WebSocket Handler**: "Create a WebSocket endpoint for [real-time feature] that broadcasts messages to connected clients."
- **Database Operations**: "Write SQLAlchemy model and CRUD operations for [entity] with proper validation and error handling."

### 3. Authentication & Security
- **JWT Implementation**: "Generate JWT token creation and validation functions with [expiry time] and [secret key source]."
- **Route Protection**: "Create a FastAPI dependency for protecting routes with JWT validation and role-based access control."
- **CORS Configuration**: "Set up CORS middleware to allow requests from [frontend domain] with appropriate headers."

### 4. Testing & Debugging
- **Unit Test Generation**: "Write pytest test cases for [function/method] covering [scenarios] including edge cases."
- **Integration Test**: "Create a test script that simulates [user flow] using [testing library] to verify end-to-end functionality."
- **Debugging Assistance**: "Explain the cause of [error message] in [file/context] and suggest fixes."

### 5. Deployment & DevOps
- **Docker Configuration**: "Generate a Dockerfile for the FastAPI backend with [base image] and [optimization steps]."
- **Environment Variables**: "List required environment variables for [environment] with descriptions and default values."
- **CI/CD Pipeline**: "Create a GitHub Actions workflow for deploying the frontend to Vercel and backend to Hugging Face Spaces."

### 6. Documentation & Code Quality
- **Docstring Generation**: "Write comprehensive docstrings for [function/class] following NumPy/Google style conventions."
- **Code Refactoring**: "Refactor [code block] to improve readability and maintainability while preserving functionality."
- **Type Hints**: "Add proper Python type hints to [function/module] using typing module constructs."

## Usage Instructions
1. Copy the relevant prompt from this document.
2. Paste into the Antigravity IDE's prompt interface.
3. Adjust bracketed placeholders ([ ]) with specific project details.
4. Execute and review generated output.
5. Iterate as needed by refining the prompt or providing additional context.

## Example Prompts
- "Create a Next.js component for Artisan Dossier card that displays weaving metrics with Framer Motion pulse animation on update."
- "Implement a FastAPI WebSocket endpoint at /ws/telemetry that broadcasts artisan activity data to subscribed clients."
- "Write a unit test for the JWT validation function that tests expired, invalid, and valid tokens."

## Maintenance
Update these prompts as the project evolves or when new features are added to ensure they remain relevant and effective.

---
*Last Updated: 2026-05-08*