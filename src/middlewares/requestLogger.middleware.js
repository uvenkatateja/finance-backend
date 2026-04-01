const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

/**
 * Request logging middleware.
 * Assigns a unique requestId to every request and logs method, path, status, and duration.
 */
function requestLogger(req, res, next) {
  req.requestId = uuidv4();
  const start = Date.now();

  // Log when the response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers['x-forwarded-for'],
    });
  });

  next();
}

module.exports = { requestLogger };
