const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Data already exists (duplicate entry).',
        field: err.meta?.target,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found.',
      });
    }
  }

  if (err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;