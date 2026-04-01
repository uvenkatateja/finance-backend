const { ApiError } = require('../utils/ApiError');

/**
 * Simple in-memory rate limiter.
 * Tracks request timestamps per IP in a Map; prunes expired entries lazily.
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();

    // Periodic cleanup every 5 minutes to prevent memory leaks
    setInterval(() => this._cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if a request from the given IP is within the rate limit.
   * @returns {boolean} true if allowed, false if rate limited
   */
  check(identifier, maxRequests, windowMs) {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];

    // Keep only timestamps within the current window
    const recent = timestamps.filter((t) => now - t < windowMs);

    if (recent.length >= maxRequests) {
      this.requests.set(identifier, recent);
      return false;
    }

    recent.push(now);
    this.requests.set(identifier, recent);
    return true;
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter((t) => now - t < 60000);
      if (recent.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recent);
      }
    }
  }
}

const limiter = new RateLimiter();

/**
 * Rate limiting middleware: 100 requests per minute per IP.
 */
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  const allowed = limiter.check(ip, 100, 60 * 1000);

  if (!allowed) {
    return next(ApiError.tooMany('Rate limit exceeded. Try again later.'));
  }

  // Set rate-limit headers for transparency
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Window', '60s');

  next();
}

module.exports = { rateLimitMiddleware, RateLimiter };
