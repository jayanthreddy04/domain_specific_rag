# Domain-Specific RAG Chatbot

Production-ready **Retrieval-Augmented Generation** chatbot focused on **Artificial Intelligence**, built with React, Node.js/Express, ChromaDB, and Groq.

## Features

- **52 domain documents** with preprocessing (cleaning, chunking, metadata, embeddings)
- **Hybrid retrieval**: dense vector search (ChromaDB) + BM25 keyword search + reciprocal rank fusion
- **Reranking** by vector similarity and lexical overlap
- **Query optimization** for follow-up questions using conversational memory
- **Groq LLM** responses grounded in retrieved context with **source citations**
- **Evaluation framework**: Precision@K, Recall@K, MRR, Hit Rate, correctness, faithfulness, completeness, latency
- **35 test questions** with automated evaluation report

## Architecture

See [architecture.md](./architecture.md) for component diagrams and data flow.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for ChromaDB)
- [Groq API key](https://console.groq.com)

### 1. Start ChromaDB

```bash
cd rag-chatbot
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Add your GROQ_API_KEY to .env

npm install
npm run setup          # generates 52 docs + ingests into ChromaDB
npm run dev            # API at http://localhost:5001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start              # UI at http://localhost:3000
```

### 4. Run evaluation

```bash
cd backend
npm run evaluate -- --skip-llm   # retrieval metrics only (no Groq key needed)
npm run evaluate                 # full evaluation with Groq answers
```

Report: `backend/evaluation/evaluation_report.md`

## Deploy To Vercel

This repo is prepared to deploy as one Vercel project:

- React is built from `frontend/` and served as the site.
- Express is exposed as a serverless API through `api/index.js`.
- Frontend API calls default to same-origin `/api/chat`, so no production API URL is required when frontend and backend are deployed together.
- The knowledge base is stored in ChromaDB. For Vercel, use Chroma Cloud or another hosted ChromaDB endpoint.

### Required environment variables

Set these in **Vercel Project Settings → Environment Variables**:

```bash
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
USE_LOCAL_VECTOR_STORE=false
CHROMA_HOST=https://api.trychroma.com
CHROMA_PORT=8000
CHROMA_API_KEY=your_chroma_cloud_api_key
CHROMA_TENANT=your_tenant_uuid
CHROMA_DATABASE=your_database_name
CHROMA_COLLECTION=ai_knowledge_base
NODE_ENV=production
```

Optional:

```bash
FRONTEND_URL=https://your-project.vercel.app
ALLOW_VERCEL_ORIGINS=true
LOG_LEVEL=info
```

### Ingest documents into ChromaDB

Before the deployed chatbot can answer from your documents, ingest the knowledge base into the same Chroma database configured above. On your machine:

```bash
cd rag-chatbot/backend
cp .env.example .env
# Fill GROQ_API_KEY and CHROMA_* values in .env
npm install
npm run setup
```

Confirm Chroma has data:

```bash
npm run dev
curl http://localhost:5001/api/chat/health
```

### Vercel settings

When importing the Git repo into Vercel:

- **Root Directory:** `rag-chatbot`
- **Framework Preset:** Other or Create React App
- **Build Command:** `npm run vercel-build`
- **Output Directory:** `frontend/build`
- **Install Command:** `npm install`

After deploy, test:

```bash
curl https://your-project.vercel.app/api/chat/health
```

Then open `https://your-project.vercel.app` and send a chat question.

Note: the backend uses `@xenova/transformers` for embeddings, which can make Vercel serverless cold starts slow. If you see function timeout or bundle-size errors, keep the React frontend on Vercel and deploy the backend on a long-running Node host such as Render, Railway, Fly.io, or a VPS, then set `REACT_APP_API_URL=https://your-backend-domain/api/chat` in Vercel.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/chat/health` | Health + knowledge base chunk count |
| POST | `/api/chat/query` | `{ query, sessionId? }` → answer + citations |
| GET | `/api/chat/history/:sessionId` | Conversation history |
| DELETE | `/api/chat/session` | Clear session memory |
| POST | `/api/chat/evaluate` | Run evaluation suite |

## Project Structure

```
rag-chatbot/
├── backend/           # Express API, RAG pipeline, evaluation
├── frontend/          # React chat UI
├── docker-compose.yml # ChromaDB service
├── architecture.md
├── setup_instructions.md
└── screenshots/
```

## Screenshots

Capture the running UI and evaluation output. See [screenshots/README.md](./screenshots/README.md).

## License

MIT
