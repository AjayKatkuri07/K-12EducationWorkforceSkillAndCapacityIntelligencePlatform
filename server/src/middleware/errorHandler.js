export function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Request payload validation failed.',
      issues: err.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message
      }))
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the server.'
  });
}
