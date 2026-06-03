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
