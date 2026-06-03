const memoryService = require('./memoryService');
const chromaService = require('./chromaService');
const env = require('../config/env');
const {
  assessRetrievalConfidence,
  filterRelevantSources,
  buildOutOfScopeAnswer,
  buildExtractiveAnswer,
} = require('../utils/relevanceGate');
const { logger } = require('../middleware/logger');

function formatCitations(sources) {
  return sources.map((s, index) => ({
    index: index + 1,
    id: s.id,
    title: s.metadata?.title || 'Source document',
    docId: s.metadata?.docId || s.id,
    excerpt: (s.text || '').slice(0, 220),
    score: Number((s.score || 0).toFixed(4)),
    category: s.metadata?.category || 'Artificial Intelligence',
  }));
}

async function processQuery(query, sessionId) {
  const start = Date.now();
  const { sessionId: sid } = memoryService.getOrCreateSession(sessionId);
  const history = memoryService.getConversationHistory(sid);

  const chunkCount = await chromaService.getCollectionCount();
  if (chunkCount === 0) {
    const err = new Error(
      chromaService.getStorageMode() === 'unavailable'
        ? chromaService.getStorageNote()
        : 'Knowledge base is empty. Ingest documents into the configured ChromaDB collection.'
    );
    err.statusCode = 503;
    err.code = 'KB_EMPTY';
    throw err;
  }

  const retrievalService = require('./retrievalService');
  const groqService = require('./groqService');

  const optimizedQuery = await groqService.optimizeQuery(query, history);
  logger.info('Query processed', { original: query, optimized: optimizedQuery });

  const rawSources = await retrievalService.hybridRetrieve(optimizedQuery);
  const confidence = assessRetrievalConfidence(query, rawSources, {
    minRelevanceScore: env.minRelevanceScore,
    minQueryOverlap: env.minQueryOverlap,
  });

  logger.info('Retrieval confidence', confidence);

  if (!confidence.isRelevant) {
    const answer = buildOutOfScopeAnswer(query);
    memoryService.addMessage(sid, 'user', query);
    memoryService.addMessage(sid, 'assistant', answer);

    return {
      success: true,
      sessionId: sid,
      answer,
      citations: [],
      meta: {
        optimizedQuery,
        retrievalCount: 0,
        outOfScope: true,
        topScore: confidence.topScore,
        queryOverlap: confidence.queryOverlap,
        responseTimeMs: 0,
        totalTimeMs: Date.now() - start,
        model: 'relevance-gate',
      },
    };
  }

  const sources = filterRelevantSources(rawSources, env.minRelevanceScore * 0.85);
  let answer;
  let responseTimeMs;
  let model;

  if (env.groqApiKey) {
    ({ answer, responseTimeMs, model } = await groqService.generateAnswer({
      query,
      sources,
      conversationHistory: history,
    }));
  } else {
    answer = buildExtractiveAnswer(query, sources);
    responseTimeMs = 0;
    model = 'extractive-fallback';
  }

  memoryService.addMessage(sid, 'user', query);
  memoryService.addMessage(sid, 'assistant', answer);

  return {
    success: true,
    sessionId: sid,
    answer,
    citations: formatCitations(sources),
    meta: {
      optimizedQuery,
      retrievalCount: sources.length,
      topScore: confidence.topScore,
      queryOverlap: confidence.queryOverlap,
      responseTimeMs,
      totalTimeMs: Date.now() - start,
      model,
    },
  };
}

function fetchChatHistory(sessionId) {
  const { sessionId: sid } = memoryService.getOrCreateSession(sessionId);
  return {
    sessionId: sid,
    messages: memoryService.getFullHistory(sid),
  };
}

function clearChat(sessionId) {
  memoryService.clearSession(sessionId);
  return { success: true };
}

module.exports = { processQuery, fetchChatHistory, clearChat };
