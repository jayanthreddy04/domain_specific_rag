require('dotenv').config();
const documentService = require('../src/services/documentService');
const { logger } = require('../src/middleware/logger');

async function main() {
  const reset = process.argv.includes('--reset');
  logger.info(`Starting document ingestion (reset=${reset})`);
  const result = await documentService.ingestFromDirectory(undefined, reset);
  console.log('Ingestion complete:', result);
  process.exit(0);
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
