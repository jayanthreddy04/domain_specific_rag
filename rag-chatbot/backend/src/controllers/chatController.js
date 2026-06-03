const chatService = require('../services/chatService');
const evaluationService = require('../services/evaluationService');
const chromaService = require('../services/chromaService');

async function handleUserQuery(req, res, next) {
  try {
    const { query, sessionId } = req.body;
    if (!query?.trim()) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    const result = await chatService.processQuery(query.trim(), sessionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getChatHistory(req, res, next) {
  try {
    const sessionId = req.params.sessionId || req.query.sessionId;
    const history = chatService.fetchChatHistory(sessionId);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

async function clearChat(req, res, next) {
  try {
    const { sessionId } = req.body;
    const result = chatService.clearChat(sessionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getHealth(req, res) {
  const chunkCount = await chromaService.getCollectionCount();
  res.json({
    status: 'ok',
    knowledgeBaseChunks: chunkCount,
    storage: chromaService.getStorageMode(),
    storageNote: chromaService.getStorageNote(),
    domain: 'Artificial Intelligence',
    setupHint:
      chunkCount === 0
        ? 'Knowledge base has 0 chunks. Ingest documents into the configured ChromaDB collection, then redeploy or retry.'
        : null,
  });
}

async function runEvaluation(req, res, next) {
  try {
    const results = await evaluationService.runFullEvaluation({
      skipLlm: req.query.skipLlm === 'true',
    });
    res.json({
      success: true,
      summary: {
        retrieval: results.retrieval.summary,
        quality: results.quality.summary,
      },
      reportPath: results.reportPath,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleUserQuery,
  getChatHistory,
  clearChat,
  getHealth,
  runEvaluation,
};
