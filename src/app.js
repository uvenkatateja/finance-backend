require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const apiRoutes = require('./routes');
const { swaggerSpec } = require('./config/swagger');
const { errorHandler } = require('./middlewares/error.middleware');
const { rateLimitMiddleware } = require('./middlewares/rateLimit.middleware');
const { requestLogger } = require('./middlewares/requestLogger.middleware');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(rateLimitMiddleware);

// ─── Swagger Documentation ───────────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Finance Dashboard API Docs',
  })
);

// Expose raw spec for Postman / other tools
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── Root Route → Redirect to Swagger ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Centralized Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV,
    docs: `http://localhost:${PORT}/api-docs`,
  });
});

module.exports = app;
