# RAG Chatbot Backend

Express API for domain-specific RAG over **Artificial Intelligence** knowledge.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run generate-docs` | Create 52 source documents |
| `npm run ingest` | Chunk, embed, and index documents |
| `npm run setup` | generate-docs + ingest |
| `npm run dev` | Start server with nodemon |
| `npm run evaluate` | Run 35-question evaluation suite |

## Environment

Copy `.env.example` to `.env`. Required for full chat:

- `GROQ_API_KEY` — LLM generation and query optimization

Vector storage:

- **ChromaDB** (default): `docker compose up -d` from project root, set `CHROMA_PATH=http://localhost:8000`
- **Local fallback**: `USE_LOCAL_VECTOR_STORE=true` stores embeddings in `data/local_vector_store.json`

## Evaluation

```bash
USE_LOCAL_VECTOR_STORE=true npm run evaluate -- --skip-llm
```

Outputs:

- `evaluation/evaluation_report.md`
- `evaluation/evaluation_results.json`
