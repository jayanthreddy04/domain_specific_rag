function extractKeywords(text, maxKeywords = 8) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'their', 'we',
    'our', 'you', 'your', 'he', 'she', 'his', 'her', 'not', 'also', 'into',
  ]);

  const freq = {};
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .forEach((word) => {
      freq[word] = (freq[word] || 0) + 1;
    });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

function enrichChunkMetadata(chunk) {
  return {
    ...chunk.metadata,
    keywords: extractKeywords(chunk.text).join(','),
    excerpt: chunk.text.slice(0, 160),
  };
}

module.exports = { extractKeywords, enrichChunkMetadata };
