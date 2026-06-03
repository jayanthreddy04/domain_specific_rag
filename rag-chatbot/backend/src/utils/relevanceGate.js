const { keywordOverlapScore } = require('./rerank');

function assessRetrievalConfidence(query, sources, thresholds) {
  if (!sources?.length) {
    return {
      isRelevant: false,
      topScore: 0,
      queryOverlap: 0,
      reason: 'no_results',
    };
  }

  const top = sources[0];
  const topScore = top.score ?? top.vectorScore ?? 0;
  const queryOverlap = keywordOverlapScore(query, top.text || '');

  const isRelevant =
    topScore >= thresholds.minRelevanceScore &&
    queryOverlap >= thresholds.minQueryOverlap;

  return {
    isRelevant,
    topScore,
    queryOverlap,
    reason: isRelevant ? 'ok' : 'low_confidence',
  };
}

function filterRelevantSources(sources, minScore) {
  return sources.filter((s) => (s.score ?? 0) >= minScore);
}

function buildOutOfScopeAnswer(query) {
  return (
    `I can only answer questions about Artificial Intelligence using my indexed knowledge base ` +
    `(machine learning, NLP, deep learning, RAG, AI ethics, and related topics).\n\n` +
    `Your question ("${query.trim()}") does not match any relevant AI documents with sufficient confidence. ` +
    `Please ask an AI-related question.`
  );
}

function buildExtractiveAnswer(query, sources) {
  const top = sources[0];
  const sentences = (top.text || '').split(/(?<=[.!?])\s+/).filter(Boolean);
  const queryTerms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);

  const ranked = sentences
    .map((sentence) => {
      const lower = sentence.toLowerCase();
      const hits = queryTerms.filter((t) => lower.includes(t)).length;
      return { sentence, hits };
    })
    .sort((a, b) => b.hits - a.hits);

  const best = ranked.filter((s) => s.hits > 0).slice(0, 3);
  const excerpt =
    best.length > 0
      ? best.map((s) => s.sentence).join(' ')
      : top.text.slice(0, 500);

  return (
    `Based on "${top.metadata?.title || 'source document'}" [Source 1]:\n\n${excerpt}\n\n` +
    `_Note: Add GROQ_API_KEY in backend/.env for full LLM-synthesized answers._`
  );
}

module.exports = {
  assessRetrievalConfidence,
  filterRelevantSources,
  buildOutOfScopeAnswer,
  buildExtractiveAnswer,
};
