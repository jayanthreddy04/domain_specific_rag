# Setup Instructions

## Prerequisites

- **Node.js** 18 or newer
- **npm**
- **Docker** (for ChromaDB vector database)
- **Groq API key** from [console.groq.com](https://console.groq.com)

## Step 1: Clone and enter project

```bash
cd rag-chatbot
```

## Step 2: Start ChromaDB

ChromaDB runs as a separate service (required for vector storage):

```bash
docker compose up -d
```

Verify: `curl http://localhost:8000/api/v1/heartbeat` should return a JSON status.

## Step 3: Configure backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
GROQ_API_KEY=gsk_your_key_here
PORT=5001
CHROMA_PATH=http://localhost:8000
```

## Step 4: Install and index documents

```bash
npm install
npm run setup
```

This command:

1. Generates **52** AI domain text files in `data/source_documents/`
2. Preprocesses, chunks, embeds, and stores them in ChromaDB

Expected output: `documents: 52` and multiple chunks indexed.

## Step 5: Start backend API

```bash
npm run dev
```

Server: `http://localhost:5001`

## Step 6: Configure and start frontend

```bash
cd ../frontend
cp .env.example .env
npm install
npm start
```

Open `http://localhost:3000` in your browser.

## Step 7: Run evaluation (optional)

**Without Groq** (retrieval metrics only):

```bash
cd backend
npm run evaluate -- --skip-llm
```

**With Groq** (full answer quality metrics):

```bash
npm run evaluate
```

Results:

- `backend/evaluation/evaluation_report.md`
- `backend/evaluation/evaluation_results.json`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Knowledge base empty | Run `npm run setup` in backend |
| Chroma connection failed | Ensure `docker compose up -d` is running |
| Groq 401 error | Check `GROQ_API_KEY` in `.env` |
| CORS errors | Set `FRONTEND_URL=http://localhost:3000` in backend `.env` |
| Slow first query | Embedding model downloads on first run (~90MB) |

## Capturing screenshots

1. Start backend + frontend with indexed knowledge base
2. Ask: *What is retrieval-augmented generation?*
3. Expand source citations in the response
4. Save screenshots to `screenshots/` (see `screenshots/README.md`)
