function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

function preprocessDocument(rawContent, fileMeta = {}) {
  const cleaned = cleanText(rawContent);
  return {
    content: cleaned,
    metadata: {
      docId: fileMeta.docId || 'unknown',
      title: fileMeta.title || 'Untitled',
      category: fileMeta.category || 'Artificial Intelligence',
      source: fileMeta.source || fileMeta.filename || 'local',
      author: fileMeta.author || 'AI Knowledge Base',
      wordCount: cleaned.split(/\s+/).filter(Boolean).length,
      ingestedAt: new Date().toISOString(),
    },
  };
}

module.exports = { cleanText, preprocessDocument };
