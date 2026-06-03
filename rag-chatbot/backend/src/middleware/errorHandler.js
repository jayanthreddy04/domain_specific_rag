const { logger } = require('./logger');

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  logger.error(err.message, { stack: err.stack, path: req.path });

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.code && { code: err.code }),
  });
}

module.exports = { notFoundHandler, errorHandler };
