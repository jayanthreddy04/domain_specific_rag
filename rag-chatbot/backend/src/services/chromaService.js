const { ChromaClient, CloudClient } = require('chromadb');
const env = require('../config/env');
const { logger } = require('../middleware/logger');
const localStore = require('./localVectorStore');

let client = null;
let collection = null;
let useLocalFallback = env.useLocalVectorStore;
let storageMode = 'unknown';
let storageNote = '';

function isCloudConfigured() {
  return Boolean(env.chromaApiKey && env.chromaTenant && env.chromaDatabase);
}

async function connectCloudChroma() {
  client = new CloudClient({
    apiKey: env.chromaApiKey,
    tenant: env.chromaTenant,
    database: env.chromaDatabase,
    cloudHost: env.chromaHost,
  });
  await client.heartbeat();
  collection = await client.getOrCreateCollection({
    name: env.chromaCollection,
    metadata: { domain: 'Artificial Intelligence' },
  });
  storageMode = 'chromadb-cloud';
  storageNote = `Chroma Cloud (${env.chromaDatabase})`;
  logger.info(`Chroma Cloud connected: ${env.chromaHost} / ${env.chromaDatabase}`);
}

async function connectLocalChromaServer() {
  const chromaUrl = env.chromaPath.startsWith('http')
    ? env.chromaPath
    : `http://${env.chromaPath}`;
  client = new ChromaClient({ path: chromaUrl });
  await client.heartbeat();
  collection = await client.getOrCreateCollection({
    name: env.chromaCollection,
    metadata: { domain: 'Artificial Intelligence' },
  });
  storageMode = 'chromadb-local';
  storageNote = `Chroma server (${chromaUrl})`;
  logger.info(`ChromaDB server connected at ${chromaUrl}`);
}

function activateLocalStore(reason) {
  useLocalFallback = true;
  storageMode = 'local';
  storageNote = reason || 'Local JSON vector store';
  client = null;
  collection = null;
  logger.info(`Using local vector store (${localStore.getCount()} chunks)`);
}

async function resolveStorage() {
  if (storageMode !== 'unknown') {
    return;
  }

  if (env.useLocalVectorStore) {
    activateLocalStore('USE_LOCAL_VECTOR_STORE=true');
    return;
  }

  if (isCloudConfigured()) {
    try {
      await connectCloudChroma();
      const count = await collection.count();
      if (count > 0) return;
      logger.warn(`Chroma Cloud collection "${env.chromaCollection}" is empty`);
    } catch (err) {
      logger.warn(`Chroma Cloud unavailable: ${err.message}`);
      client = null;
      collection = null;
    }
  }

  try {
    await connectLocalChromaServer();
    const count = await collection.count();
    if (count > 0) return;
    logger.warn(`Local Chroma collection "${env.chromaCollection}" is empty`);
  } catch (err) {
    logger.warn(`Local Chroma server unavailable: ${err.message}`);
    client = null;
    collection = null;
  }

  if (localStore.getCount() > 0) {
    activateLocalStore('Fallback: indexed data found in data/local_vector_store.json');
    return;
  }

  activateLocalStore('No Chroma connection; local store is also empty — run npm run setup');
}

async function ensureReady() {
  if (storageMode === 'unknown') {
    await resolveStorage();
  }
}

async function addChunks(chunks, embeddings) {
  await ensureReady();
  if (useLocalFallback) {
    return localStore.addChunks(chunks, embeddings);
  }

  const ids = chunks.map((c) => c.id);
  const documents = chunks.map((c) => c.text);
  const metadatas = chunks.map((c) =>
    Object.fromEntries(
      Object.entries(c.metadata).map(([k, v]) => [k, String(v)])
    )
  );

  const batchSize = 100;
  for (let i = 0; i < ids.length; i += batchSize) {
    await collection.add({
      ids: ids.slice(i, i + batchSize),
      embeddings: embeddings.slice(i, i + batchSize),
      documents: documents.slice(i, i + batchSize),
      metadatas: metadatas.slice(i, i + batchSize),
    });
  }
  logger.info(`Stored ${ids.length} chunks in ${storageMode}`);
  return ids.length;
}

async function queryByEmbedding(embedding, topK) {
  await ensureReady();
  if (useLocalFallback) {
    return localStore.queryByEmbedding(embedding, topK);
  }

  const results = await collection.query({
    queryEmbeddings: [embedding],
    nResults: topK,
    include: ['documents', 'metadatas', 'distances'],
  });

  const items = [];
  const count = results.ids[0]?.length || 0;
  for (let i = 0; i < count; i++) {
    items.push({
      id: results.ids[0][i],
      text: results.documents[0][i],
      metadata: results.metadatas[0][i],
      vectorScore: 1 - results.distances[0][i],
      distance: results.distances[0][i],
    });
  }
  return items;
}

async function getAllDocumentsForBm25() {
  await ensureReady();
  if (useLocalFallback) return localStore.getAllDocuments();

  const count = await collection.count();
  if (count === 0) return [];

  const batch = await collection.get({
    include: ['documents', 'metadatas'],
    limit: count,
  });

  return batch.ids.map((id, i) => ({
    id,
    text: batch.documents[i],
    metadata: batch.metadatas[i],
  }));
}

async function getCollectionCount() {
  await ensureReady();
  if (useLocalFallback) return localStore.getCount();
  return collection.count();
}

async function resetCollection() {
  if (useLocalFallback) {
    localStore.resetStore();
    return;
  }

  try {
    await client.deleteCollection({ name: env.chromaCollection });
  } catch {
    // ignore
  }
  client = null;
  collection = null;
  storageMode = 'unknown';
  await resolveStorage();
}

function getStorageMode() {
  return storageMode;
}

function getStorageNote() {
  return storageNote;
}

module.exports = {
  addChunks,
  queryByEmbedding,
  getAllDocumentsForBm25,
  getCollectionCount,
  resetCollection,
  getStorageMode,
  getStorageNote,
  resolveStorage,
};
