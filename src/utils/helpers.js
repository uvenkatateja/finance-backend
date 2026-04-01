/**
 * Build a standardized success response envelope.
 */
function successResponse(data, message = 'Success', meta = null) {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta) response.meta = meta;
  return response;
}

/**
 * Parse pagination parameters from query string with defaults.
 */
function parsePagination(query) {
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  const page = Math.max(parseInt(query.page) || 1, 1);
  const offset = (page - 1) * limit;
  return { limit, offset, page };
}

module.exports = { successResponse, parsePagination };
