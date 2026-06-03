const morgan = require('morgan');
const winston = require('winston');
const env = require('../config/env');

const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

const httpLogger = morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
});

module.exports = { logger, httpLogger };
