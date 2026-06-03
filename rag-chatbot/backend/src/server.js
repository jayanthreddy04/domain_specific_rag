const app = require('./app');
const env = require('./config/env');
const { logger } = require('./middleware/logger');

const PORT = env.port;

app.listen(PORT, () => {
  logger.info(`RAG API server running on http://localhost:${PORT}`);
  logger.info(`Domain: Artificial Intelligence | Environment: ${env.nodeEnv}`);
});
