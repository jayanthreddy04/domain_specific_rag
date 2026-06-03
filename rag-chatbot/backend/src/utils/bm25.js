const K1 = 1.5;
const B = 0.75;

function tokenize(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

function buildBm25Index(documents) {
  const docTokens = documents.map((d) => tokenize(d.text));
  const docLengths = docTokens.map((t) => t.length);
  const avgDl = docLengths.reduce((a, b) => a + b, 0) / (docLengths.length || 1);

  const df = {};
  docTokens.forEach((tokens) => {
    const unique = new Set(tokens);
    unique.forEach((term) => {
      df[term] = (df[term] || 0) + 1;
    });
  });

  const N = documents.length;
  const idf = {};
  Object.keys(df).forEach((term) => {
    idf[term] = Math.log(1 + (N - df[term] + 0.5) / (df[term] + 0.5));
  });

  return { docTokens, docLengths, avgDl, idf, N };
}

function scoreQuery(index, query, docIndex) {
  const queryTerms = tokenize(query);
  const tokens = index.docTokens[docIndex];
  const dl = index.docLengths[docIndex];
  const termFreq = {};
  tokens.forEach((t) => {
    termFreq[t] = (termFreq[t] || 0) + 1;
  });

  let score = 0;
  queryTerms.forEach((term) => {
    if (!index.idf[term] || !termFreq[term]) return;
    const tf = termFreq[term];
    const numerator = tf * (K1 + 1);
    const denominator = tf + K1 * (1 - B + (B * dl) / index.avgDl);
    score += index.idf[term] * (numerator / denominator);
  });
  return score;
}

function bm25Search(documents, query, topK = 12) {
  if (documents.length === 0) return [];
  const index = buildBm25Index(documents);
  return documents
    .map((doc, i) => ({ ...doc, bm25Score: scoreQuery(index, query, i) }))
    .sort((a, b) => b.bm25Score - a.bm25Score)
    .slice(0, topK);
}

module.exports = { bm25Search, tokenize };
