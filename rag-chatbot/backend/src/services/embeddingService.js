const env = require('../config/env');
const { logger } = require('../middleware/logger');

let extractor = null;
let pipelineFn = null;

async function getExtractor() {
  if (!extractor) {
    logger.info(`Loading embedding model: ${env.embeddingModel}`);
    if (!pipelineFn) {
      ({ pipeline: pipelineFn } = await import('@xenova/transformers'));
    }
    extractor = await pipelineFn('feature-extraction', env.embeddingModel);
  }
  return extractor;
}

async function generateEmbedding(text) {
  const model = await getExtractor();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

async function generateEmbeddings(texts) {
  const embeddings = [];
  for (const text of texts) {
    embeddings.push(await generateEmbedding(text));
  }
  return embeddings;
}

module.exports = { generateEmbedding, generateEmbeddings, getExtractor };
