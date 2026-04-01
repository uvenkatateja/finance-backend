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
// Dynamically inject the correct server URL based on the actual request host
app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host;
  const serverUrl = `${protocol}://${host}`;

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [{ url: serverUrl, description: 'Current server' }],
  };

  swaggerUi.setup(dynamicSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Finance Dashboard API Docs',
  })(req, res, next);
});

// Expose raw spec for Postman / other tools (also dynamic)
app.get('/api-docs.json', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host;
  const serverUrl = `${protocol}://${host}`;

  res.setHeader('Content-Type', 'application/json');
  res.send({
    ...swaggerSpec,
    servers: [{ url: serverUrl, description: 'Current server' }],
  });
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
