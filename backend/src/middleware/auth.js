import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Check if user's status is still active
    try {
      const result = await pool.query('SELECT status FROM users WHERE id = $1', [user.id]);
      const userRecord = result.rows[0];
      
      if (!userRecord || userRecord.status !== 'active') {
        return res.status(403).json({ message: 'Your account is no longer active. Please contact administrator.' });
      }
    } catch (dbErr) {
      console.error('Status check error:', dbErr);
      return res.status(500).json({ message: 'Server error' });
    }

    req.user = user;
    next();
  });
}

export function authorizeRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}
