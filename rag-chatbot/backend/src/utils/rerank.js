function cosineSimilarity(vecA, vecB) {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function keywordOverlapScore(query, text) {
  const queryTerms = new Set(
    query.toLowerCase().split(/\W+/).filter((t) => t.length > 2)
  );
  if (queryTerms.size === 0) return 0;
  const textTerms = text.toLowerCase().split(/\W+/);
  let hits = 0;
  queryTerms.forEach((term) => {
    if (textTerms.some((t) => t.includes(term) || term.includes(t))) hits++;
  });
  return hits / queryTerms.size;
}

function rerankResults(candidates, queryEmbedding, queryText) {
  return candidates
    .map((item) => {
      const vectorScore = cosineSimilarity(queryEmbedding, item.embedding);
      const lexicalScore = keywordOverlapScore(queryText, item.text);
      const combinedScore = 0.75 * vectorScore + 0.25 * lexicalScore;
      return { ...item, vectorScore, lexicalScore, score: combinedScore };
    })
    .sort((a, b) => b.score - a.score);
}

module.exports = { cosineSimilarity, keywordOverlapScore, rerankResults };
