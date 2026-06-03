# RAG Chatbot Evaluation Report

**Domain:** Artificial Intelligence
**Generated:** 2026-06-03T04:07:09.583Z
**Test cases:** 35
**Mode:** Retrieval + extractive answers (`--skip-llm`). Re-run `npm run evaluate` with `GROQ_API_KEY` for full LLM answer quality scores.

## Retrieval Metrics

| Metric | Value |
|--------|-------|
| Precision@1 | 97.14% |
| Recall@1 | 44.05% |
| Precision@3 | 40.00% |
| Recall@3 | 50.00% |
| Precision@5 | 24.00% |
| Recall@5 | 50.00% |
| Mean Reciprocal Rank (MRR) | 0.9857 |
| Hit Rate | 100.00% |

## Answer Quality Metrics

| Metric | Value |
|--------|-------|
| Correctness (token overlap) | 40.77% |
| Faithfulness to context | 98.09% |
| Context relevance | 2.86% |
| Completeness | 66.70% |
| Avg response time | 181 ms |

## Sample Results (first 5)

### 1. What is artificial intelligence and what are its core goals?
- **Correctness:** 76.0%
- **Faithfulness:** 96.0%
- **Response time:** 256 ms

### 2. What is the difference between supervised and unsupervised learning?
- **Correctness:** 21.4%
- **Faithfulness:** 100.0%
- **Response time:** 176 ms

### 3. How do convolutional neural networks process images?
- **Correctness:** 53.3%
- **Faithfulness:** 100.0%
- **Response time:** 185 ms

### 4. What is a transformer and why is self-attention important?
- **Correctness:** 41.9%
- **Faithfulness:** 100.0%
- **Response time:** 188 ms

### 5. How does retrieval-augmented generation improve LLM answers?
- **Correctness:** 33.3%
- **Faithfulness:** 96.3%
- **Response time:** 185 ms
