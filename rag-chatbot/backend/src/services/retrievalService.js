const env = require('../config/env');
const chromaService = require('./chromaService');
const embeddingService = require('./embeddingService');
const { bm25Search } = require('../utils/bm25');
const { rerankResults } = require('../utils/rerank');

function reciprocalRankFusion(rankings, k = 60) {
  const scores = new Map();

  rankings.forEach((rankedList) => {
    rankedList.forEach((item, rank) => {
      const prev = scores.get(item.id) || { item, score: 0 };
      prev.score += 1 / (k + rank + 1);
      prev.item = item;
      scores.set(item.id, prev);
    });
  });

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({ ...entry.item, fusionScore: entry.score }));
}

async function hybridRetrieve(optimizedQuery, topK = env.retrievalTopK) {
  const queryEmbedding = await embeddingService.generateEmbedding(optimizedQuery);

  const [vectorResults, allDocs] = await Promise.all([
    chromaService.queryByEmbedding(queryEmbedding, topK),
    chromaService.getAllDocumentsForBm25(),
  ]);

  const bm25Results = bm25Search(allDocs, optimizedQuery, topK);

  const vectorRanked = vectorResults.map((r) => ({
    id: r.id,
    text: r.text,
    metadata: r.metadata,
    embedding: null,
    vectorScore: r.vectorScore,
  }));

  const fused = reciprocalRankFusion([vectorRanked, bm25Results]);

  const embeddingMap = new Map();
  for (const chunk of [...vectorResults, ...bm25Results]) {
    if (!embeddingMap.has(chunk.id)) {
      embeddingMap.set(chunk.id, chunk);
    }
  }

  const candidates = fused.slice(0, topK).map((item) => ({
    id: item.id,
    text: item.text,
    metadata: item.metadata,
    fusionScore: item.fusionScore,
  }));

  const enriched = await Promise.all(
    candidates.map(async (c) => ({
      ...c,
      embedding: await embeddingService.generateEmbedding(c.text),
    }))
  );

  const reranked = rerankResults(enriched, queryEmbedding, optimizedQuery);
  return reranked.slice(0, env.rerankTopK);
}

module.exports = { hybridRetrieve, reciprocalRankFusion };
