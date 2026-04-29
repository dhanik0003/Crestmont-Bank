// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Simple in-memory user cache — avoids a DB round-trip on every request.
// TTL matches the JWT expiry window (default 24 h). Cache is keyed by userId.
const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const userCache = new Map();

const getCachedUser = (userId) => {
  const entry = userCache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.ts > USER_CACHE_TTL_MS) {
    userCache.delete(userId);
    return null;
  }
  return entry.user;
};

const setCachedUser = (userId, user) => {
  // Evict oldest entry when cache grows large
  if (userCache.size > 500) {
    const firstKey = userCache.keys().next().value;
    userCache.delete(firstKey);
  }
  userCache.set(userId, { user, ts: Date.now() });
};

// Call this after role changes so stale data isn't served
const invalidateUserCache = (userId) => userCache.delete(userId);

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = getCachedUser(decoded.userId);

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true },
      });
      if (!user) return res.status(401).json({ error: 'User not found' });
      setCachedUser(decoded.userId, user);
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize, invalidateUserCache };
