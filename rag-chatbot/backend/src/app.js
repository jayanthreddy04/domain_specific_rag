const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');
const { httpLogger } = require('./middleware/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const env = require('./config/env');

const app = express();

const allowedOrigins = env.frontendUrl.split(',').map((o) => o.trim());

function corsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (env.nodeEnv === 'development' && /^http:\/\/localhost:\d+$/.test(origin)) {
    callback(null, true);
    return;
  }
  if (env.allowVercelOrigins && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
    callback(null, true);
    return;
  }
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`CORS blocked origin: ${origin}`));
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(httpLogger);

app.get('/', (req, res) => {
  res.json({
    name: 'Domain-Specific RAG API',
    domain: 'Artificial Intelligence',
    version: '1.0.0',
  });
});

app.use('/api/chat', chatRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
