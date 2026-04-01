/**
 * Zod validation middleware factory.
 * Validates req.body (for POST/PUT/PATCH) or req.query (for GET) against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(result.error); // Caught by errorHandler as ZodError
    }

    // Replace with parsed & coerced data
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
