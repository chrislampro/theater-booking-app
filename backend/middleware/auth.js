const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'theater_super_secret_change_me_in_production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET + '_refresh';
const TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

// Store refresh tokens (in production, use Redis or database table)
const refreshTokens = new Set();

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

const signRefreshToken = (payload) => {
  const refreshToken = jwt.sign({ id: payload.id }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  refreshTokens.add(refreshToken);
  return refreshToken;
};

const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (!refreshTokens.has(token)) {
      return null;
    }
    return decoded;
  } catch (err) {
    return null;
  }
};

const revokeRefreshToken = (token) => {
  refreshTokens.delete(token);
};

module.exports = { 
  authenticate, 
  requireAdmin, 
  signToken, 
  signRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken
};