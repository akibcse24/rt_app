# Routine Tracker - Maintenance & Handoff Guide

This document provides essential information for the future maintainers of the Routine Tracker project.

## 🔑 Critical API Keys & Services

The application relies on the following services:

1.  **Firebase**: Used for Authentication, Firestore database, and Hosting.
    -   Ensure `PROJECT_ID` is correct in `.env.local` and `firebase.json`.
    -   Security Rules are located in `firestore.rules`.
2.  **AI Integration**:
    -   **Google Gemini**: Primary AI engine for routine insights and coaching.
    -   **Groq**: Alternative AI provider (optional).
3.  **Analytics**:
    -   Basic analytics are integrated via Firebase, but specialized event tracking can be expanded in `src/lib/analytics.ts`.

## 📁 Architecture Overview

-   `src/app`: Next.js App Router pages and API routes.
-   `src/components`: UI components, organized by feature (Auth, AI, UI, etc.).
-   `src/context`: React Context providers for global state (Auth, Tasks, Sync, UI).
-   `src/lib`: Utility functions, database logic, and AI service integration.
-   `public`: Static assets, including PWA manifest and service worker.

## 🛠️ Maintenance Tasks

### 1. Database Backups
Firebase Firestore backups should be configured via the Google Cloud Console.

### 2. Updating AI Prompts
System prompts for the AI Assistant can be tuned in `src/lib/ai-assistant.ts` (or equivalent AI logic files).

### 3. PWA Updates
The service worker (`public/sw.js`) should be updated if new static assets are added or caching strategies need to change.

### 4. Security Rules
Always review `firestore.rules` before adding new collections to ensure data is properly protected.

## 🚀 Deployment Strategy

-   **Staging**: Deploy to a secondary Firebase project for testing.
-   **Production**: `npm run build && firebase deploy`.

---
*Note: This project is in a finalized state as of January 2026.*
