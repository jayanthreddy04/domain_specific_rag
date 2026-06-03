const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const { preprocessDocument } = require('../utils/preprocessing');
const { chunkDocument } = require('../utils/chunking');
const { enrichChunkMetadata } = require('../utils/metadata');
const embeddingService = require('./embeddingService');
const chromaService = require('./chromaService');
const { logger } = require('../middleware/logger');

function parseFilename(filename) {
  const base = path.basename(filename, path.extname(filename));
  const parts = base.split('_');
  const docId = parts.slice(0, 2).join('_') || base;
  const title = parts
    .slice(2)
    .join(' ')
    .replace(/-/g, ' ')
    .trim() || base;
  return { docId, title: title.charAt(0).toUpperCase() + title.slice(1) };
}

async function ingestFromDirectory(directoryPath = env.documentsPath, reset = false) {
  const resolved = path.resolve(directoryPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Documents directory not found: ${resolved}`);
  }

  const files = fs
    .readdirSync(resolved)
    .filter((f) => /\.(txt|md)$/i.test(f))
    .sort();

  if (files.length < 50) {
    logger.warn(`Only ${files.length} documents found; expected at least 50`);
  }

  if (reset) {
    await chromaService.resetCollection();
  }

  let totalChunks = 0;

  for (const file of files) {
    const filePath = path.join(resolved, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { docId, title } = parseFilename(file);
    const processed = preprocessDocument(raw, {
      docId,
      title,
      filename: file,
      category: 'Artificial Intelligence',
    });

    const chunks = chunkDocument(processed, env.chunkSize, env.chunkOverlap).map(
      (chunk) => ({
        ...chunk,
        metadata: enrichChunkMetadata(chunk),
      })
    );

    const embeddings = await embeddingService.generateEmbeddings(
      chunks.map((c) => c.text)
    );
    await chromaService.addChunks(chunks, embeddings);
    totalChunks += chunks.length;
    logger.info(`Ingested ${file}: ${chunks.length} chunks`);
  }

  return { documents: files.length, chunks: totalChunks };
}

module.exports = { ingestFromDirectory, parseFilename };
