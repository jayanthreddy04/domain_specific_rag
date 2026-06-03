const fs = require('fs');
const path = require('path');
const retrievalService = require('./retrievalService');
const groqService = require('./groqService');
const env = require('../config/env');
const metrics = require('../../evaluation/metrics');
const { logger } = require('../middleware/logger');

const K_VALUES = [1, 3, 5];

function expandRelevantIds(relevantDocIds) {
  return relevantDocIds.flatMap((docId) => [
    docId,
    `${docId}_chunk_0`,
    `${docId}_chunk_1`,
    `${docId}_chunk_2`,
  ]);
}

function isRelevantChunk(chunkId, relevantDocIds) {
  return relevantDocIds.some(
    (docId) => chunkId === docId || chunkId.startsWith(`${docId}_chunk_`)
  );
}

function matchRelevantIds(retrievedIds, relevantDocIds) {
  return retrievedIds.filter((id) => isRelevantChunk(id, relevantDocIds));
}

async function evaluateRetrieval(testCases) {
  const results = [];

  for (const testCase of testCases) {
    const sources = await retrievalService.hybridRetrieve(testCase.question);
    const retrievedIds = sources.map((s) => s.id);
    const relevant = testCase.relevant_doc_ids || [];

    const entry = {
      question: testCase.question,
      retrievedIds,
      relevantDocIds: relevant,
    };

    K_VALUES.forEach((k) => {
      const matched = matchRelevantIds(retrievedIds, relevant);
      entry[`precision@${k}`] = metrics.calculatePrecisionAtK(
        retrievedIds.map((id) => (isRelevantChunk(id, relevant) ? id : '__miss__')),
        matched,
        k
      );
      // Fix precision: count relevant in top-k
      const topK = retrievedIds.slice(0, k);
      const hits = topK.filter((id) => isRelevantChunk(id, relevant)).length;
      entry[`precision@${k}`] = hits / k;
      entry[`recall@${k}`] =
        relevant.length === 0
          ? 0
          : hits /
            Math.max(
              1,
              relevant.reduce((acc, docId) => acc + 3, 0) / 3
            );
    });

    const allRelevantChunkIds = retrievedIds.filter((id) =>
      isRelevantChunk(id, relevant)
    );
    entry.mrr = metrics.calculateMRR(
      retrievedIds,
      allRelevantChunkIds.length ? allRelevantChunkIds : ['__none__']
    );
    entry.hitRate = retrievedIds.some((id) => isRelevantChunk(id, relevant))
      ? 1
      : 0;

    // Recalculate MRR properly
    let rr = 0;
    for (let i = 0; i < retrievedIds.length; i++) {
      if (isRelevantChunk(retrievedIds[i], relevant)) {
        rr = 1 / (i + 1);
        break;
      }
    }
    entry.mrr = rr;

    K_VALUES.forEach((k) => {
      const topK = retrievedIds.slice(0, k);
      const hits = topK.filter((id) => isRelevantChunk(id, relevant)).length;
      entry[`precision@${k}`] = hits / k;
      const expectedChunks = relevant.length * 2;
      entry[`recall@${k}`] =
        expectedChunks === 0 ? 0 : Math.min(1, hits / expectedChunks);
    });

    results.push(entry);
  }

  const summary = { kValues: K_VALUES, count: results.length };
  K_VALUES.forEach((k) => {
    summary[`avg_precision@${k}`] = metrics.average(
      results.map((r) => r[`precision@${k}`])
    );
    summary[`avg_recall@${k}`] = metrics.average(
      results.map((r) => r[`recall@${k}`])
    );
  });
  summary.avgMRR = metrics.average(results.map((r) => r.mrr));
  summary.avgHitRate = metrics.average(results.map((r) => r.hitRate));

  return { results, summary };
}

async function evaluateAnswers(testCases, skipLlm = false) {
  const qualityResults = [];

  for (const testCase of testCases) {
    const start = Date.now();
    const sources = await retrievalService.hybridRetrieve(testCase.question);
    let answer = '';
    let responseTimeMs = 0;

    if (!skipLlm && env.groqApiKey) {
      const generated = await groqService.generateAnswer({
        query: testCase.question,
        sources,
        conversationHistory: [],
      });
      answer = generated.answer;
      responseTimeMs = generated.responseTimeMs;
    } else {
      answer = sources[0]?.text?.slice(0, 300) || 'No answer generated (missing GROQ_API_KEY)';
      responseTimeMs = Date.now() - start;
    }

    const contextTexts = sources.map((s) => s.text);
    qualityResults.push({
      question: testCase.question,
      expectedAnswer: testCase.expected_answer,
      generatedAnswer: answer,
      correctness: metrics.evaluateCorrectness(answer, testCase.expected_answer),
      faithfulness: metrics.evaluateFaithfulness(answer, contextTexts),
      contextRelevance: metrics.average(
        sources.map((s) =>
          metrics.tokenOverlapScore(testCase.question, s.text)
        )
      ),
      completeness: metrics.evaluateCompleteness(
        answer,
        testCase.expected_answer
      ),
      responseTimeMs,
    });
  }

  const summary = {
    count: qualityResults.length,
    avgCorrectness: metrics.average(qualityResults.map((r) => r.correctness)),
    avgFaithfulness: metrics.average(qualityResults.map((r) => r.faithfulness)),
    avgContextRelevance: metrics.average(
      qualityResults.map((r) => r.contextRelevance)
    ),
    avgCompleteness: metrics.average(qualityResults.map((r) => r.completeness)),
    avgResponseTimeMs: metrics.average(
      qualityResults.map((r) => r.responseTimeMs)
    ),
  };

  return { qualityResults, summary };
}

function buildMarkdownReport(retrieval, quality, domain) {
  const lines = [
    '# RAG Chatbot Evaluation Report',
    '',
    `**Domain:** ${domain}`,
    `**Generated:** ${new Date().toISOString()}`,
    `**Test cases:** ${retrieval.summary.count}`,
    '',
    '## Retrieval Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
  ];

  K_VALUES.forEach((k) => {
    lines.push(
      `| Precision@${k} | ${(retrieval.summary[`avg_precision@${k}`] * 100).toFixed(2)}% |`
    );
    lines.push(
      `| Recall@${k} | ${(retrieval.summary[`avg_recall@${k}`] * 100).toFixed(2)}% |`
    );
  });
  lines.push(`| Mean Reciprocal Rank (MRR) | ${retrieval.summary.avgMRR.toFixed(4)} |`);
  lines.push(`| Hit Rate | ${(retrieval.summary.avgHitRate * 100).toFixed(2)}% |`);

  lines.push('', '## Answer Quality Metrics', '', '| Metric | Value |', '|--------|-------|');
  lines.push(
    `| Correctness (token overlap) | ${(quality.summary.avgCorrectness * 100).toFixed(2)}% |`
  );
  lines.push(
    `| Faithfulness to context | ${(quality.summary.avgFaithfulness * 100).toFixed(2)}% |`
  );
  lines.push(
    `| Context relevance | ${(quality.summary.avgContextRelevance * 100).toFixed(2)}% |`
  );
  lines.push(
    `| Completeness | ${(quality.summary.avgCompleteness * 100).toFixed(2)}% |`
  );
  lines.push(
    `| Avg response time | ${quality.summary.avgResponseTimeMs.toFixed(0)} ms |`
  );

  lines.push('', '## Sample Results (first 5)', '');
  quality.qualityResults.slice(0, 5).forEach((r, i) => {
    lines.push(`### ${i + 1}. ${r.question}`);
    lines.push(`- **Correctness:** ${(r.correctness * 100).toFixed(1)}%`);
    lines.push(`- **Faithfulness:** ${(r.faithfulness * 100).toFixed(1)}%`);
    lines.push(`- **Response time:** ${r.responseTimeMs} ms`);
    lines.push('');
  });

  return lines.join('\n');
}

async function runFullEvaluation(options = {}) {
  const testPath = path.resolve(
    options.testPath || './data/test_questions.json'
  );
  const testCases = JSON.parse(fs.readFileSync(testPath, 'utf-8'));

  logger.info(`Running evaluation on ${testCases.length} test cases`);

  const retrieval = await evaluateRetrieval(testCases);
  const quality = await evaluateAnswers(testCases, options.skipLlm);

  const report = buildMarkdownReport(
    retrieval,
    quality,
    'Artificial Intelligence'
  );

  const reportPath = path.resolve('./evaluation/evaluation_report.md');
  fs.writeFileSync(reportPath, report);

  const jsonPath = path.resolve('./evaluation/evaluation_results.json');
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ retrieval, quality, generatedAt: new Date().toISOString() }, null, 2)
  );

  return { retrieval, quality, reportPath, jsonPath };
}

module.exports = { evaluateRetrieval, evaluateAnswers, runFullEvaluation };
