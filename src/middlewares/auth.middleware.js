const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/ApiError');
const { prisma } = require('../prisma/client');

/**
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token, attaches the full user object to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or malformed authorization header');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data to check current status/role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    if (user.status === 'inactive') {
      throw ApiError.forbidden('Account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    next(error);
  }
}

module.exports = { authenticate };
