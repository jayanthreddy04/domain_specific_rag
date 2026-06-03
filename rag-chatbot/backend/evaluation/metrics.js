function calculatePrecisionAtK(retrievedIds, relevantIds, k) {
  if (k === 0) return 0;
  const top = retrievedIds.slice(0, k);
  const hits = top.filter((id) => relevantIds.includes(id)).length;
  return hits / k;
}

function calculateRecallAtK(retrievedIds, relevantIds, k) {
  if (relevantIds.length === 0) return 0;
  const top = retrievedIds.slice(0, k);
  const hits = top.filter((id) => relevantIds.includes(id)).length;
  return hits / relevantIds.length;
}

function calculateMRR(retrievedIds, relevantIds) {
  for (let i = 0; i < retrievedIds.length; i++) {
    if (relevantIds.includes(retrievedIds[i])) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

function calculateHitRate(retrievedIds, relevantIds) {
  return retrievedIds.some((id) => relevantIds.includes(id)) ? 1 : 0;
}

function tokenSet(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function tokenOverlapScore(a, b) {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  setA.forEach((t) => {
    if (setB.has(t)) overlap++;
  });
  return overlap / Math.max(setA.size, setB.size);
}

function evaluateFaithfulness(answer, contextTexts) {
  const answerTokens = tokenSet(answer);
  if (answerTokens.size === 0) return 0;
  const contextTokens = new Set();
  contextTexts.forEach((t) => tokenSet(t).forEach((tok) => contextTokens.add(tok)));
  let supported = 0;
  answerTokens.forEach((t) => {
    if (contextTokens.has(t)) supported++;
  });
  return supported / answerTokens.size;
}

function evaluateCorrectness(answer, expected) {
  return tokenOverlapScore(answer, expected);
}

function evaluateCompleteness(answer, expected) {
  const expectedTokens = tokenSet(expected);
  if (expectedTokens.size === 0) return 0;
  const answerTokens = tokenSet(answer);
  let covered = 0;
  expectedTokens.forEach((t) => {
    if (answerTokens.has(t)) covered++;
  });
  return covered / expectedTokens.size;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

module.exports = {
  calculatePrecisionAtK,
  calculateRecallAtK,
  calculateMRR,
  calculateHitRate,
  evaluateFaithfulness,
  evaluateCorrectness,
  evaluateCompleteness,
  tokenOverlapScore,
  average,
};
