# Screenshots

Place demonstration screenshots here after running the application:

1. **chat-interface.png** — Main chat UI with a question and AI response
2. **source-citations.png** — Expanded source citation cards with relevance scores
3. **follow-up-memory.png** — Follow-up question showing conversational context
4. **evaluation-report.png** — Terminal or markdown preview of evaluation metrics

## How to capture

```bash
cd rag-chatbot && docker compose up -d
cd backend && npm run dev
cd frontend && npm start
```

Suggested prompts: RAG definition, hybrid retrieval follow-up, RAG evaluation metrics.

```bash
cd backend && npm run evaluate -- --skip-llm
```
