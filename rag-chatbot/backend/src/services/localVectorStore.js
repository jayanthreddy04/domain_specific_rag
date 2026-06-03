const fs = require('fs');
const path = require('path');
const { cosineSimilarity } = require('../utils/rerank');

const STORE_PATH =
  process.env.LOCAL_VECTOR_STORE_PATH ||
  path.resolve(__dirname, '../../data/local_vector_store.json');

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) {
    return { chunks: [] };
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
}

function saveStore(store) {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 0));
}

function resetStore() {
  saveStore({ chunks: [] });
}

function addChunks(chunks, embeddings) {
  const store = loadStore();
  chunks.forEach((chunk, i) => {
    const existing = store.chunks.findIndex((c) => c.id === chunk.id);
    const entry = {
      id: chunk.id,
      text: chunk.text,
      metadata: chunk.metadata,
      embedding: embeddings[i],
    };
    if (existing >= 0) store.chunks[existing] = entry;
    else store.chunks.push(entry);
  });
  saveStore(store);
  return chunks.length;
}

function queryByEmbedding(embedding, topK) {
  const store = loadStore();
  return store.chunks
    .map((c) => ({
      id: c.id,
      text: c.text,
      metadata: c.metadata,
      vectorScore: cosineSimilarity(embedding, c.embedding),
      distance: 1 - cosineSimilarity(embedding, c.embedding),
    }))
    .sort((a, b) => b.vectorScore - a.vectorScore)
    .slice(0, topK);
}

function getAllDocuments() {
  return loadStore().chunks.map((c) => ({
    id: c.id,
    text: c.text,
    metadata: c.metadata,
  }));
}

function getCount() {
  return loadStore().chunks.length;
}

module.exports = {
  addChunks,
  queryByEmbedding,
  getAllDocuments,
  getCount,
  resetStore,
  STORE_PATH,
};
