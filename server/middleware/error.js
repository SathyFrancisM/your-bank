export const notFound = (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

export const errorHandler = (error, _req, res, _next) => {
  const status = error.statusCode || 500;
  res.status(status).json({
    message: error.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
};
