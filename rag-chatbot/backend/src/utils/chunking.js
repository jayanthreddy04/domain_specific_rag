function chunkText(text, chunkSize = 400, overlap = 80) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = [];
  const step = Math.max(1, chunkSize - overlap);

  for (let start = 0; start < words.length; start += step) {
    const slice = words.slice(start, start + chunkSize);
    if (slice.length === 0) break;
    chunks.push(slice.join(' '));
    if (start + chunkSize >= words.length) break;
  }

  return chunks;
}

function chunkDocument(document, chunkSize, overlap) {
  const chunks = chunkText(document.content, chunkSize, overlap);
  return chunks.map((text, index) => ({
    id: `${document.metadata.docId}_chunk_${index}`,
    text,
    metadata: {
      ...document.metadata,
      chunkIndex: index,
      chunkTotal: chunks.length,
    },
  }));
}

module.exports = { chunkText, chunkDocument };
