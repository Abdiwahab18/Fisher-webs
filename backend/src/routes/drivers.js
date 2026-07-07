import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'fisherman' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: only fishermen and admins can manage drivers' });
    }

    const fishermanId = req.user.role === 'admin' && req.query.fisherman_id ? req.query.fisherman_id : req.user.id;

    const result = await pool.query(
      `SELECT dd.*, u.name AS account_name, u.email AS login_email, u.status AS account_status
       FROM delivery_drivers dd
       LEFT JOIN users u ON dd.user_id = u.id
       WHERE dd.fisherman_id = $1
       ORDER BY dd.created_at DESC`,
      [fishermanId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error loading drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, authorizeRole('fisherman'), async (req, res) => {
  try {
    const { name, phone, vehicle_type, vehicle_number, vehicle_color, status = 'active', email, password } = req.body;

    if (!name || !phone || !email || !password) {
      return res.status(400).json({ message: 'Name, phone, email, and password are required' });
    }

    if (/\d/.test(name)) {
      return res.status(400).json({ message: 'Driver name cannot contain numbers' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRes = await pool.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, email, hashedPassword, 'driver', 'active']
    );

    const driverRes = await pool.query(
      `INSERT INTO delivery_drivers (fisherman_id, user_id, name, phone, vehicle_type, vehicle_number, vehicle_color, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, userRes.rows[0].id, name, phone, vehicle_type || null, vehicle_number || null, vehicle_color || null, status]
    );

    res.status(201).json({
      driver: driverRes.rows[0],
      login_email: email,
      temporary_password: password,
      user_id: userRes.rows[0].id,
      driver_id: driverRes.rows[0].id
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', authenticateToken, authorizeRole('fisherman'), async (req, res) => {
  try {
    const { name, phone, vehicle_type, vehicle_number, vehicle_color, status, email, password } = req.body;

    const existingRes = await pool.query('SELECT * FROM delivery_drivers WHERE id = $1 AND fisherman_id = $2', [req.params.id, req.user.id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    const driver = existingRes.rows[0];

    if (name !== undefined && /\d/.test(name)) {
      return res.status(400).json({ message: 'Driver name cannot contain numbers' });
    }

    // If name, email, password, or status is updated, update the user in users table
    if (name !== undefined || email !== undefined || password !== undefined || status !== undefined) {
      const userUpdates = [];
      const userValues = [];
      let uIndex = 1;

      if (name !== undefined) {
        userUpdates.push(`name = $${uIndex++}`);
        userValues.push(name);
      }

      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }
        // check unique email
        const existingEmail = await pool.query('SELECT * FROM users WHERE email = $1 AND id != $2', [email, driver.user_id]);
        if (existingEmail.rows.length > 0) {
          return res.status(409).json({ message: 'Email is already registered' });
        }
        userUpdates.push(`email = $${uIndex++}`);
        userValues.push(email);
      }

      if (password) {
        if (password.length < 8) {
          return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        userUpdates.push(`password = $${uIndex++}`);
        userValues.push(hashedPassword);
      }

      if (status !== undefined) {
        userUpdates.push(`status = $${uIndex++}`);
        userValues.push(status);
      }

      if (userUpdates.length > 0) {
        userValues.push(driver.user_id);
        await pool.query(
          `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${uIndex}`,
          userValues
        );
      }
    }

    const updates = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${index++}`);
      values.push(phone);
    }
    if (vehicle_type !== undefined) {
      updates.push(`vehicle_type = $${index++}`);
      values.push(vehicle_type);
    }
    if (vehicle_number !== undefined) {
      updates.push(`vehicle_number = $${index++}`);
      values.push(vehicle_number);
    }
    if (vehicle_color !== undefined) {
      updates.push(`vehicle_color = $${index++}`);
      values.push(vehicle_color);
    }
    if (status !== undefined) {
      updates.push(`status = $${index++}`);
      values.push(status);
    }

    if (updates.length === 0 && email === undefined && password === undefined) {
      return res.status(400).json({ message: 'No changes provided' });
    }

    if (updates.length > 0) {
      values.push(req.params.id, req.user.id);
      const result = await pool.query(
        `UPDATE delivery_drivers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${index++} AND fisherman_id = $${index} RETURNING *`,
        values
      );
      res.json(result.rows[0]);
    } else {
      // Just email/password was updated, fetch and return driver
      const result = await pool.query('SELECT * FROM delivery_drivers WHERE id = $1', [req.params.id]);
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, authorizeRole('fisherman'), async (req, res) => {
  try {
    const existingRes = await pool.query('SELECT * FROM delivery_drivers WHERE id = $1 AND fisherman_id = $2', [req.params.id, req.user.id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const driver = existingRes.rows[0];
    await pool.query('DELETE FROM delivery_drivers WHERE id = $1', [req.params.id]);
    if (driver.user_id) {
      await pool.query('DELETE FROM users WHERE id = $1', [driver.user_id]);
    }

    res.json({ message: 'Driver removed successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
