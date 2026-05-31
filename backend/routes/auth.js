const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { 
  signToken, 
  signRefreshToken, 
  verifyRefreshToken,
  revokeRefreshToken 
} = require('../middleware/auth');

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash]
    );

    const user = { id: result.insertId, name, email, role: 'user' };
    const token = signToken(user);
    const refreshToken = signRefreshToken(user);
    
    res.status(201).json({ 
      token, 
      refresh_token: refreshToken,
      user 
    });
  } catch (err) { 
    next(err); 
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'email and password are required' });

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = signToken(payload);
    const refreshToken = signRefreshToken(payload);
    
    res.json({ 
      token, 
      refresh_token: refreshToken,
      user: payload 
    });
  } catch (err) { 
    next(err); 
  }
});

// POST /api/auth/refresh - Refresh expired token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ message: 'Refresh token required' });
    }
    
    const decoded = verifyRefreshToken(refresh_token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    
    // Get user info from database
    const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    if (!rows.length) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const user = rows[0];
    const newToken = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    
    res.json({ 
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (err) { 
    next(err); 
  }
});

// POST /api/auth/logout - Logout user (revoke refresh token)
router.post('/logout', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      revokeRefreshToken(refresh_token);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) { 
    next(err); 
  }
});

module.exports = router;