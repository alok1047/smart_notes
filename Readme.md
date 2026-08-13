# Smart Lecture Notes

AI-powered notes app for students. Write messy lecture notes (Hinglish supported), hit **Process**, and get clean, revision-ready Markdown with diagrams, tables, and images — without the AI changing what you actually said.

---

## Features

- **Google OAuth login** via Firebase, user upsert on first sign-in.
- **Subjects → Lectures** hierarchy with auto-numbered lectures created in bulk.
- **Rich text editor** (Tiptap) with Markdown support and live syntax highlighting.
- **AI processing** — convert messy raw notes into structured Markdown:
  - **Streaming** (SSE) with live preview, or one-shot processing.
  - Multi-provider: **Gemini**, **GPT-4o Mini** (OpenAI), **Llama 3.3 70B** (Groq).
  - Bring-your-own-API-key via settings modal, with server env fallback.
  - Options: output language (English / Hinglish), strict vs. helpful mode, include summary / key points.
- **Inline AI commands** — write `//ai …` anywhere in your notes:
  - `//ai table` · `//ai make table`
  - `//ai simplify`
  - `//ai exam points`
  - `//ai code`
  - `//ai diagram` · `//ai graph` · `//ai flowchart` · `//ai tree` · `//ai architecture` → Mermaid diagrams
  - `//ai image [description]` → AI-generated image (Pollinations FLUX / Lexica)
- **Revision mode** — auto-extracts the `📌 Key Points` section and shows only that.
- **Search** across subjects, lectures, and processed notes.
- **Notes Chat** — ask questions about your processed notes (per-subject and per-lecture).
- **File import** — upload PDFs / images (photos of whiteboards or slides) and extract text via Gemini vision.
- **Export & share** — export a lecture as PDF (html2pdf) or push it to a GitHub repo.
- **Recent lectures** quick access on the dashboard.
- **Command palette** (⌘K), **dark/light theme** toggle, landing page.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 · Vite · Tailwind CSS v4 · React Router 7 · Tiptap · react-markdown · Mermaid |
| Backend | Node.js · Express 4 |
| Database | MongoDB (Mongoose 8) |
| Auth | Firebase Auth (Google) + Firebase Admin SDK (JWT verification) |
| AI | Google Gemini · OpenAI · Groq |
| File parsing | pdf-parse · Gemini vision OCR |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- A Firebase project (Auth + service account)
- API keys for at least one AI provider (Gemini / OpenAI / Groq)

### 1. Clone & install

```bash
git clone <repo-url>
cd notes_maker

cd client && npm install
cd ../server && npm install
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

Fill in your values (see the full list below).

### 3. Configure the client

Firebase web config lives in [client/src/services/firebase.js](client/src/services/firebase.js) — replace the placeholder fields with your project's values.

### 4. Run

```bash
# Client → http://localhost:5173
cd client && npm run dev

# Server → http://localhost:5002
cd server && npm run dev
```

> **Note on ports:** `client/vite.config.js` proxies `/api` to `http://localhost:5002`. The server reads `PORT` from `server/.env` — keep it set to `5002` (or update the Vite proxy to match).

---

## Environment Variables

### Server (`server/.env`)

```
PORT=5002
MONGO_URI=mongodb://localhost:27017/smart-lecture-notes

# Firebase Admin SDK — Option 1: individual fields
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# — or Option 2: full service-account JSON string
# FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# AI provider keys (used as fallback when the user has no key saved)
GEMINI_API_KEY=...
OPENAI_API_KEY=...
GROQ_API_KEY=...

# CORS
CLIENT_URL=http://localhost:5173
```

### Client

Firebase web config in `client/src/services/firebase.js`. Optional `VITE_API_BASE_URL` in `client/.env` to point at a deployed API (defaults to `/api`).

---

## API Reference

All routes except `POST /api/auth/google` and `GET /api/health` require:

```
Authorization: Bearer <firebaseIdToken>
```

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/google` | Verify Firebase token, upsert user |
| GET | `/api/health` | Health check |
| GET | `/api/subjects` | List user's subjects |
| POST | `/api/subjects` | Create subject + N blank lectures |
| DELETE | `/api/subjects/:id` | Delete subject and its lectures |
| GET | `/api/lectures/:subjectId` | List lectures for a subject |
| GET | `/api/lectures/single/:id` | Fetch one lecture |
| GET | `/api/lectures/recent/all` | Fetch 6 most recently updated lectures |
| POST | `/api/lectures/:subjectId` | Add a new blank lecture |
| PUT | `/api/lectures/:id` | Update `title` / `rawNotes` / `processedNotes` |
| DELETE | `/api/lectures/single/:id` | Delete one lecture |
| POST | `/api/lectures/:id/process` | Process notes with AI (returns preview, no auto-save) |
| POST | `/api/lectures/:id/process-stream` | Stream-process notes (SSE), saves on completion |
| POST | `/api/lectures/:id/import-file` | Upload PDF/image, extract text (multipart) |
| GET | `/api/search?q=…` | Search subjects + lectures + processed notes |
| POST | `/api/ai/chat` | Ask a question over a subject's processed notes |
| POST | `/api/ai/generate-image` | Generate an AI image URL for a prompt |

### Process request body

```json
{
  "aiProvider": "groq",
  "apiKey": "user-key-or-empty",
  "options": {
    "language": "English",
    "strictness": "strict",
    "includeKeyPoints": true,
    "includeSummary": false
  }
}
```

---

## Project Structure

```
notes_maker/
├── client/                          React + Vite SPA
│   └── src/
│       ├── main.jsx · App.jsx        entry + router
│       ├── index.css                 ALL styles (Tailwind v4 + CSS vars)
│       ├── pages/                    Landing · Login · Dashboard · Lectures · NotesEditor
│       ├── components/               Sidebar · Topbar · CommandPalette · TiptapEditor ·
│       │                             HighlightedEditor · ProcessedNotes · RevisionMode ·
│       │                             NotesChat · MermaidBlock · AIImageBlock · CodeBlock ·
│       │                             AISettingsModal · ProcessSettingsModal ·
│       │                             GithubSettingsModal · SubjectCard · LectureCard ...
│       ├── context/                  AuthContext · ThemeContext · CommandPaletteContext
│       ├── services/                 api.js (axios + JWT interceptor) · firebase.js ·
│       │                             subjectService · lectureService
│       └── utils/                    aiSettings · githubSettings · markdownUtils
│
└── server/                          Express API
    ├── server.js                     entry
    ├── config/                       db.js (Mongo) · firebase.js (Admin SDK)
    ├── middleware/                   auth.js (Firebase JWT verify + upsert user)
    ├── models/                       User · Subject · Lecture
    ├── controllers/                  auth · subject · lecture · search · ai
    ├── routes/                       auth · subjects · lectures · search · ai
    └── services/aiService.js         multi-provider AI orchestration + prompt builder
```

---

## Data Model

```
User     { firebaseUid, name, email, avatar }
Subject  { name, userId → User, lectureCount }
Lecture  { subjectId → Subject, lectureNumber, title, rawNotes, processedNotes, embedding }
         + compound index (subjectId, lectureNumber)
```

---

## How the AI pipeline works

1. **Parse commands** — `parseCommands()` scans raw notes for `//ai …` directives (line number + target content).
2. **Clean** — `cleanRawNotes()` strips stray `//` comment prefixes so the AI treats them as content.
3. **Build prompt** — `buildPrompt()` assembles the system prompt: output language rules, strict/helpful mode, key-points/summary flags, and special directive handlers (Mermaid rules, image URLs, tables, code blocks, exam points).
4. **Route** — based on the chosen provider, call Gemini / OpenAI / Groq (single-shot or SSE stream).
5. **Return** — processed Markdown. The client shows a preview; the user approves/saves it (`processedNotes`).

API keys flow: user's saved key (localStorage → request body) takes priority over `process.env.*` fallbacks.
