require('dotenv').config();
const evaluationService = require('../src/services/evaluationService');
const { logger } = require('../src/middleware/logger');

async function main() {
  const skipLlm = process.argv.includes('--skip-llm');
  logger.info(`Running evaluation (skipLlm=${skipLlm})`);
  const results = await evaluationService.runFullEvaluation({ skipLlm });
  console.log('Evaluation complete.');
  console.log('Retrieval summary:', results.retrieval.summary);
  console.log('Quality summary:', results.quality.summary);
  console.log('Report:', results.reportPath);
  process.exit(0);
}

main().catch((err) => {
  console.error('Evaluation failed:', err);
  process.exit(1);
});
