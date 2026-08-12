# Smart Lecture Notes — Project Overview

AI-powered notes app. Students write messy lecture notes (Hinglish supported), AI converts them into clean, revision-ready markdown. Features AI commands (`//ai make table`, `//ai simplify`), revision mode, search, PDF export, GitHub push.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 · Vite 8 · Tailwind v4 · React Router 7 |
| Backend | Node · Express 4 |
| DB | MongoDB (Mongoose 8) |
| Auth | Firebase Admin + Google OAuth (client SDK) |
| AI | Gemini 2.5 Flash · GPT-4o Mini · Groq Llama 3.3 70B |
| HTTP | Axios · CORS |

---

## Run

```bash
# Client (port 5173)
cd client && npm install && npm run dev

# Server (port 5000, proxy in vite.config.js targets 5002 — verify env)
cd server && npm install && npm run dev
```

**⚠️ Port mismatch:** [vite.config.js:14](client/vite.config.js#L14) proxies `/api` → `http://localhost:5002`, but [server/server.js:45](server/server.js#L45) defaults to `PORT || 5000`. Set `PORT=5002` in `server/.env` or align them.

---

## Structure

```
notes_maker/
├── client/                      React + Vite SPA
│   └── src/
│       ├── main.jsx · App.jsx              entry + router
│       ├── index.css                       ALL styles (Tailwind v4 + custom classes)
│       ├── pages/                          Login · Dashboard · Lectures · NotesEditor
│       ├── components/                     Sidebar · Topbar · Navbar · SubjectCard ·
│       │                                   LectureItem · HighlightedEditor ·
│       │                                   ProcessedNotes · RevisionMode · CodeBlock ·
│       │                                   AISettingsModal · GithubSettingsModal
│       ├── context/AuthContext.jsx         global auth state
│       ├── services/                       api.js · firebase.js · subjectService · lectureService
│       └── utils/                          aiSettings · githubSettings · markdownUtils
│
└── server/                      Express API
    ├── server.js                           entry
    ├── config/                             db.js (Mongo) · firebase.js (Admin SDK)
    ├── middleware/auth.js                  Firebase JWT verify + upsert user
    ├── models/                             User · Subject · Lecture
    ├── routes/                             auth · subjects · lectures · search · ai
    └── services/aiService.js               multi-provider AI orchestration
```

---

## API cheat sheet

All routes except `/api/auth/google` and `/api/health` require `Authorization: Bearer <firebaseIdToken>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/google` | Verify Firebase token, upsert user |
| POST | `/api/subjects` | Create subject + N blank lectures |
| GET | `/api/subjects` | List user's subjects |
| DELETE | `/api/subjects/:id` | Delete subject + its lectures |
| GET | `/api/lectures/:subjectId` | List lectures for a subject |
| GET | `/api/lectures/single/:id` | Fetch one lecture |
| POST | `/api/lectures/:subjectId` | Add a new blank lecture |
| PUT | `/api/lectures/:id` | Update rawNotes / processedNotes / title |
| POST | `/api/lectures/:id/process` | Run AI processing (returns preview, no auto-save) |
| DELETE | `/api/lectures/single/:id` | Delete one lecture |
| GET | `/api/search?q=…` | Search across subjects + lectures |
| GET | `/api/health` | Health check |
| —  | `/api/ai/*` | **WIP** ([server/routes/ai.js](server/routes/ai.js)) — autocompletion endpoints pending |

---

## Data model

```
User       { firebaseUid, name, email, avatar }
Subject    { name, userId → User, lectureCount }
Lecture    { subjectId → Subject, lectureNumber, title, rawNotes, processedNotes }
           + compound index (subjectId, lectureNumber)
```

---

## Key flows

**Auth.** Client signs in via Firebase Google → sends ID token → server [middleware/auth.js](server/middleware/auth.js) verifies, upserts user, attaches `req.user`.

**AI processing.** [services/aiService.js](server/services/aiService.js) · `parseCommands()` extracts `//ai …` directives → `buildPrompt()` builds system prompt with Hinglish rules + command handlers → routes to Gemini / OpenAI / Groq based on `provider` param → appends "📌 Key Points" for revision mode. API keys come from user (localStorage → request body) or server env as fallback.

**Revision mode.** Parses AI-generated "📌 Key Points" section out of processed markdown and renders only that.

---

## Design system (teal palette)

All color tokens live in `@theme` block of [client/src/index.css](client/src/index.css).

**Core palette (user-specified):**
| Name | Hex | Role |
|---|---|---|
| Ink Black | `#0C151D` | app background |
| Dark Teal | `#003A3D` | elevated surfaces · primary hover · borders on hover |
| Stormy Teal | `#39666A` | muted dividers · subtle borders |
| Teal | `#208383` | primary buttons · focus ring · links · brand |
| Sea Green | `#068864` | success states · accent highlights |

**Derived tints (for readability on dark bg):**
- `#4EC5C5` — light teal for active-nav text, H3 headings
- `#7BDADA` — lightest teal for emphasis / italic
- `#0F1A22` — elevated surface (card bg, sidebar)
- `#1A2E38` — subtle border

Neutral grays (`#525252` · `#737373` · `#a3a3a3` · `#d4d4d4` · `#e5e5e5` · `#f5f5f5`) remain for body text. Semantic danger (`#f43f5e`) and warning (`#f59e0b`) remain.

---

## Env vars

**Server** (`server/.env`):
```
PORT=5002
MONGO_URI=…
CLIENT_URL=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT=…   (or path to JSON)
GEMINI_API_KEY=…             (fallbacks for no-user-key flow)
OPENAI_API_KEY=…
GROQ_API_KEY=…
```

**Client** — Firebase config lives in [client/src/services/firebase.js](client/src/services/firebase.js).

---

## Current branch: `feature/ai-autocompletion`

- [server/server.js](server/server.js) — registers `/api/ai` route
- [server/routes/ai.js](server/routes/ai.js) — **skeleton**, imports `suggestCompletion` from aiService but exposes no endpoints yet
- Next step: wire up `POST /api/ai/suggest` that takes cursor context + partial text and returns an inline completion.
