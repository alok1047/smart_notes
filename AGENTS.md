# Smart Lecture Notes — Project Overview

AI-powered notes app. Students write messy lecture notes (Hinglish supported), AI converts them into clean, revision-ready markdown. Features AI commands (`//ai make table`, `//ai simplify`), revision mode, search, PDF export, GitHub push.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 · Vite 8 · Tailwind v4 · React Router 7 |
| Backend | Node 20 · Express 4 · **TypeScript** |
| DB | **PostgreSQL 16 + pgvector** (Prisma ORM) |
| Cache/Queues | Redis 7 (BullMQ in Phase 3) |
| Auth | **Google OAuth 2.0** (GIS on client, `google-auth-library` on server) |
| AI | Gemini 2.5 Flash · GPT-4o Mini · Groq Llama 3.3 70B |
| Validation | Zod |
| Logging | Pino |
| HTTP | Axios · CORS · Helmet |

---

## Run

```bash
# 1. Infra (Postgres + pgvector on :5434, Redis on :6379, Adminer on :8080)
docker compose up -d

# 2. Server (port 5002)
cd server && npm install && npm run db:deploy && npm run dev

# 3. Client (port 5173)
cd client && npm install && npm run dev
```

**⚠️ Host Postgres conflict:** Ports 5432 (Homebrew PG16) and 5433 (PG18) are already taken on this machine. Docker Postgres maps to host port **5434** — keep `DATABASE_URL` in `server/.env` on `5434`.

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
│       ├── services/                       api.js · googleAuth.js · subjectService · lectureService
│       └── utils/                          aiSettings · githubSettings · markdownUtils
│
└── server/                      Express + TypeScript API
    ├── src/
    │   ├── index.ts · app.ts               entry + app factory (graceful shutdown)
    │   ├── config/                         env.ts (zod) · prisma.ts · oauth.ts (Google OAuth2)
    │   ├── middleware/                     auth (Google ID token) · validate (zod) ·
    │   │                                   errorHandler · rateLimiter · requestId
    │   ├── routes/v1/                      auth · subjects · lectures · search · ai · webhooks
    │   ├── controllers/                    thin HTTP layer
    │   ├── services/                       auth · subject · lecture · search · pdf ·
    │   │                                   ai/ (providers + aiService + embedding)
    │   ├── repositories/                   Prisma data-access layer
    │   ├── validators/                     Zod schemas
    │   ├── errors/                         AppError hierarchy
    │   ├── types/ · utils/                 TS types · logger (pino) · crypto · helpers
    ├── prisma/
    │   ├── schema.prisma                   full relational schema + pgvector
    │   └── migrations/                     init + HNSW embedding index
    └── tsup.config.ts · tsconfig.json
```

---

## API cheat sheet

All routes except `/api/auth/google` and `/api/health` require `Authorization: Bearer <googleIdToken>`.
Versioned under `/api/v1/*`; legacy `/api/*` paths are aliased for the existing client.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/google` | Verify Google ID token, upsert user |
| POST | `/api/subjects` | Create subject + N blank lectures |
| GET | `/api/subjects` | List user's subjects |
| DELETE | `/api/subjects/:id` | Delete subject + its lectures |
| GET | `/api/lectures/:subjectId` | List lectures for a subject |
| GET | `/api/lectures/single/:id` | Fetch one lecture |
| POST | `/api/lectures/:subjectId` | Add a new blank lecture |
| PUT | `/api/lectures/:id` | Update rawNotes / processedNotes / title |
| POST | `/api/lectures/:id/process` | Run AI processing (returns preview, no auto-save) |
| DELETE | `/api/lectures/single/:id` | Delete one lecture |
| GET | `/api/search?q=…&mode=semantic\|keyword\|hybrid` | Hybrid search: subjects (ILIKE) + lectures via RRF merge of pgvector KNN + tsvector FTS |
| GET | `/api/health` | Health check |
| POST | `/api/ai/chat` | RAG chat (retrieve subject chunks → re-rank → grounded answer + `citations`) |
| POST | `/api/ai/generate-image` · `/api/ai/suggest` | Image gen, autocomplete |
| POST | `/api/webhooks` · GET `/api/webhooks` · DELETE `/api/webhooks/:id` | Webhook CRUD |

---

## Data model

```
User       { googleId, name, email, avatar }  + apiKeys, webhooks
Subject    { name, description, color, userId → User, lectureCount, tags }
Lecture    { subjectId → Subject, lectureNumber, title, rawNotes, processedNotes,
             summary, status, wordCount }     + unique (subjectId, lectureNumber)
NoteChunk  { lectureId → Lecture, content, embedding vector(768), chunkIndex, metadata }
           + HNSW index on embedding (vector_cosine_ops)
NoteVersion{ lectureId → Lecture, version, rawNotes, processedNotes, diff }
```

---

## Key flows

**Auth.** Client uses Google Identity Services (GIS) to obtain a Google credential ([client/src/services/googleAuth.js](client/src/services/googleAuth.js)) → sends it to `/api/auth/google` → server verifies with `google-auth-library` (ID-token JWT verification, falling back to the `tokeninfo` endpoint for OAuth access tokens from the GIS popup flow — see [server/src/config/oauth.ts](server/src/config/oauth.ts)), upserts user by `googleId`, attaches `req.user`. Session persisted in localStorage.

**AI processing.** [server/src/services/ai/aiService.ts](server/src/services/ai/aiService.ts) · `parseCommands()` extracts `//ai …` directives → `buildPrompt()` builds system prompt with Hinglish rules + command handlers → routes to Gemini / OpenAI / Groq via **strategy-pattern providers** based on `provider` param → appends "📌 Key Points" for revision mode. API keys come from user (localStorage → request body) or server env as fallback.

**Embedding pipeline (Phase 2).** [server/src/services/ai/embeddingService.ts](server/src/services/ai/embeddingService.ts) + [server/src/services/chunk.service.ts](server/src/services/chunk.service.ts) · lecture content is chunked (heading-aware, ~2048 chars with 2-sentence overlap) → embedded with `gemini-embedding-001` (768 dims via MRL, NOT the deprecated `text-embedding-004`) → inserted into `note_chunks` via raw SQL (`$executeRawUnsafe` + `::vector` cast, since Prisma cannot write `Unsupported("vector(768)")`). Fired fire-and-forget on lecture save & after `process-stream`. Embeddings cached in Redis (`smartnotes:embedding:<sha256>`).

**Hybrid search.** [server/src/services/search.service.ts](server/src/services/search.service.ts) · `mode=hybrid` runs pgvector cosine KNN (top 50) + tsvector FTS (top 50, GIN index) → **RRF merge** → top N. `semantic`/`keyword` use single path. Subject names matched via ILIKE. Response includes `subjects`, `lectures` (deduped), `chunks`, `totalResults`.

**RAG chat.** [server/src/services/ai/ragService.ts](server/src/services/ai/ragService.ts) · classifies intent (factual/explanation/comparison) → retrieves top-K chunks scoped to the subject via hybrid pipeline → re-ranks → builds grounded prompt with `[Source N]` citations → provider generates answer → response includes `answer`, `citations`, `intent`.

**`_id` serialization.** Prisma returns `id`; the Mongo-era client reads `_id`. [server/src/utils/serialize.ts](server/src/utils/serialize.ts) (`serialize` / `serializeMany`) adds `_id` at controller boundaries — apply to any new endpoints returning Prisma records.

**PDF/image import.** [server/src/services/pdf.service.ts](server/src/services/pdf.service.ts) · `POST /api/lectures/:id/import-file` (multer, `fileFilter` for `.pdf/.png/.jpg/.jpeg/.webp`, 15 MB max). **Local-first:** text PDFs extracted with `pdf-parse` + `normalizeExtractedText` (no API key needed). **OCR fallback:** scanned PDFs / images → `gemini-3.6-flash` inline data (requires valid key; returns 422 `OCR_FAILED` if extraction yields no text). Client: `FileImportDropzone` (drag & drop, staged progress, insert into raw notes).

**Revision mode.** Parses AI-generated "📌 Key Points" section out of processed markdown and renders only that.

---

## Design system (teal palette)

All color tokens live in `@theme` block of [client/src/index.css](client/src/index.css).

**Core palette — Light (warm ivory · refined):**
| Name | Hex | Role |
|---|---|---|
| Ivory | `#FAFAF7` | app background |
| Subtle Ivory | `#F3F2ED` | elevated bg, subtle surfaces |
| Ink | `#1A1A1A` | primary text, accent buttons |
| Teal | `#0D7C7C` | accent text, links, brand |
| Success Green | `#0D8B5E` | success states |

**Core palette — Dark (deep ocean · luminous teal):**
| Name | Hex | Role |
|---|---|---|
| Deep Ocean | `#0A0F14` | app background |
| Ocean Surface | `#131C24` | cards, surfaces |
| Luminous Teal | `#2ABFAB` | accent text, links, brand |
| Warm White | `#E8E6E1` | primary text, accent buttons |
| Vivid Green | `#1AAF7A` | success states |

**Derived dark-mode tints:**
- `#2ABFAB` — luminous teal for active-nav text, H3 headings, links
- `#5AD4C4` — sidebar accent highlight
- `#141E28` — elevated surface (card bg)
- `#1E2E38` — border, dividers

**Dark-mode pastels** use rgba-based muted jewel tones instead of solid colors — e.g. `rgba(42,191,171,0.12)` for pastel-yellow — to avoid the washed-out look of solid pastels on dark backgrounds.

Neutral warm grays (`#B0ADA5` · `#8A877F` · `#5C5952`) for body text. Semantic danger (`#F04858`), warning (`#E09300`).

**Motion.** [framer-motion](https://www.framer.com/motion/) drives page/scroll reveals on the landing page and modal/sheet transitions (NotesChat panel, FileImportDropzone). Honor `useReducedMotion` (`prefersReduced`) — gate entrance/exit animations accordingly. New pages/components should be lazy-loaded in [client/src/App.jsx](client/src/App.jsx).

---

## Env vars

**Server** (`server/.env`, see `server/.env.example`):
```
PORT=5002
DATABASE_URL=postgresql://notes:notes_dev_password@localhost:5434/notes
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=…               # OAuth 2.0 client for verifying ID tokens
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=…                 # fallbacks for no-user-key flow
OPENAI_API_KEY=…
GROQ_API_KEY=…
```

**Client** (`client/.env`, see `client/.env.example`) — Google OAuth client ID in [client/src/services/googleAuth.js](client/src/services/googleAuth.js).

---

## Verification

```bash
cd server
npm run typecheck      # tsc --noEmit
npm run build          # tsup → dist/
npm run db:deploy      # prisma migrate deploy

cd ../client
npm run build          # vite build
npm run lint           # eslint
```
