const { ApiError } = require('../utils/ApiError');
const { ZodError } = require('zod');
const { logger } = require('../utils/logger');

/**
 * Centralized error handling middleware.
 * Catches all errors thrown throughout the request lifecycle.
 */
function errorHandler(err, req, res, _next) {
  // ─── Zod Validation Errors ──────────────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: details,
    });
  }

  // ─── Custom API Errors ──────────────────────────────────────────────────
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // ─── Prisma Known Request Errors ────────────────────────────────────────
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with that unique field already exists',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    });
  }

  // ─── Unexpected Errors ──────────────────────────────────────────────────
  logger.error('Unhandled error', err, {
    method: req.method,
    path: req.originalUrl,
    requestId: req.requestId,
  });

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
