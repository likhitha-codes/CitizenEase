# DocuEase

An AI-powered document simplification, translation, and accessibility platform. DocuEase helps citizens instantly decode central or central/state government gazettes, policy circulars, tax guidelines, and municipal welfare scheme publications into plain, easily readable bullet-points paired with Telugu and Hindi translations, audio narrations, visual helpers, and watermark-ready downloads.

Designed in accordance with **NIC (National Informatics Centre)** and accessible digital India structures.

---

## 🏛️ Core Features

1. **Intelligent Plain-Language Rewriting**: Strips intimidating bureaucratic terminologies, standardizing limits, dates, dead-lines, and rules at an 8th-grade reading level.
2. **Multimodal Content Extraction**:
   - **Text files**: Direct processing.
   - **PDF uploads & Image Photocopies**: Base64 raw binaries are piped directly into the Gemini multimodal API, ensuring 100% server-side extraction.
3. **Multilingual Parallel Translations**: Instantly parses and generates corresponding translation profiles in **Telugu** and **Hindi**.
4. **Accessible Voice Narration**: Resolves standard audio cuts by using a sentence-chaining SpeechSynthesis queue with Unicode support (translating Hindi dandas and Telugu glyphs perfectly).
5. **Auditory Highlight Sync**: While speech is active, the corresponding line inside the results cards dynamically glows with a calming amber contrast background.
6. **NIC Traditional Aesthetics**: Formally crafted using Navy `#003366` and Saffron `#FF6600` colors, light off-white margins, accessible contrast, and zero cluttering advertisement banners.
7. **Secure Offline Workspaces**: File-based lightweight transactions storing users, logs, and shares locally.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React (v19) + TypeScript + Framer Motion (subtle page and tab motion sliders) + Web Speech API + jsPDF (English pdf summaries)
- **Backend Node Server**: Express.js (supporting elevated payload JSON parsers for PDFs and Images) + Vite Dev Server middleware
- **Linguistic Processing Engine**: Gemini API (`gemini-3.5-flash`)
- **Persistence Node**: Transactions JSON file-based system (`data/db.json`), avoiding binary compilation errors under sandbox environments.

---

## 🔑 Environment Variables Setup

Configure `.env` in the root (matching `.env.example` specifications):

```env
# Required for Gemini AI validation, translation and plain writing
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_SECURED"

# Standard service routing (automatically managed under Cloud Run)
APP_URL="https://your-deployed-service.run.app"
```

*Note: You do NOT require Google Translate credentials, as our neural prompts coordinate Hindi, Telugu, and English results cleanly inside a single Gemini API transaction.*

---

## 🚀 Local Installation & Run Guide

### 1. Initial Installations
All NPM scripts are integrated for quick installation:
```bash
npm install
```

### 2. Enter Development Mode
This initiates Express and mounts the hot-reloading Vite server middleware:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to inspect.

### 3. Production Build Compilation
Compiles client assets and bundles the Express TS server into a standalone ES module:
```bash
npm run build
```

### 4. Running Production Build locally
Runs the compiled server file (`dist/server.cjs`):
```bash
npm run start
```

---

## 🔥 Firebase Setup Guide

DocuEase includes a hybrid offline/online session synchronizer. If you wish to migrate to Firebase:

1. **Create Firebase Project**: Navigate to the [Firebase Console](https://console.firebase.google.com/) and register `DocuEase`.
2. **Setup Custom Auth**: Enable `Email and Password` Sign-In provider under the Authentication dashboard.
3. **Provision Cloud Firestore (Optional)**: Move recent history stores from localized storage directly to Firestore documents under the user UID.
4. **Locate Credentials**: Gather your `firebaseConfig` credentials JSON from "Project settings" and inject them inside the web environment.

---

## 📦 Deployment Instructions (Cloud Run)

DocuEase is fully optimized to be packaged inside a single container and deployed to Google Cloud Run:

1. **Docker Container Construction**: Initialize double-stage compilations to minimize output weights.
2. **Service Ingress Bindings**: Ensure your process binds to port `3000` (DocuEase binds to `0.0.0.0:3000` inside `/server.ts` automatically as per production rules).
3. **Register Secrets**: Load `GEMINI_API_KEY` directly inside Cloud Run environment variables to complete the cloud build.
