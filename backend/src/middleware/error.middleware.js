// src/middleware/error.middleware.js
const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    console.error(err);
  } else {
    // In production only log the message, not the full stack
    console.error(`[${new Date().toISOString()}] ${err.message}`);
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this value already exists' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  const status = err.status || 500;
  // Never leak internal error details in production
  const message = status === 500 && !isDev ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(status).json({ error: message });
};

module.exports = { errorHandler };
