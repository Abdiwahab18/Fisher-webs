import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import {
  getDriversByFisherman,
  createDriverUser,
  createDriverDetails,
  getDriverByIdAndFisherman,
  updateDriverUser,
  updateDriverDetails,
  deleteDriverDetails,
  deleteUser
} from '../models/driverModel.js';

export async function listDrivers(req, res) {
  try {
    if (req.user.role !== 'fisherman' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: only fishermen and admins can manage drivers' });
    }

    const fishermanId = req.user.role === 'admin' && req.query.fisherman_id ? req.query.fisherman_id : req.user.id;
    const drivers = await getDriversByFisherman(fishermanId);
    res.json(drivers);
  } catch (error) {
    console.error('Error loading drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function createDriver(req, res) {
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
    const user = await createDriverUser({ name, email, password: hashedPassword });
    const driver = await createDriverDetails({
      fishermanId: req.user.id,
      userId: user.id,
      name,
      phone,
      vehicle_type,
      vehicle_number,
      vehicle_color,
      status
    });

    res.status(201).json({
      driver,
      login_email: email,
      temporary_password: password,
      user_id: user.id,
      driver_id: driver.id
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateDriver(req, res) {
  try {
    const { name, phone, vehicle_type, vehicle_number, vehicle_color, status, email, password } = req.body;

    const driver = await getDriverByIdAndFisherman(req.params.id, req.user.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (name !== undefined && /\d/.test(name)) {
      return res.status(400).json({ message: 'Driver name cannot contain numbers' });
    }

    if (name !== undefined || email !== undefined || password !== undefined || status !== undefined) {
      let hashedPassword;
      if (password) {
        if (password.length < 8) {
          return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }
        hashedPassword = await bcrypt.hash(password, 10);
      }

      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }
        const existingEmail = await pool.query('SELECT * FROM users WHERE email = $1 AND id != $2', [email, driver.user_id]);
        if (existingEmail.rows.length > 0) {
          return res.status(409).json({ message: 'Email is already registered' });
        }
      }

      await updateDriverUser(driver.user_id, {
        name,
        email,
        password: hashedPassword,
        status
      });
    }

    const updated = await updateDriverDetails(req.params.id, req.user.id, {
      name,
      phone,
      vehicle_type,
      vehicle_number,
      vehicle_color,
      status
    });

    if (updated) {
      res.json(updated);
    } else {
      const current = await getDriverByIdAndFisherman(req.params.id, req.user.id);
      res.json(current);
    }
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteDriver(req, res) {
  try {
    const driver = await getDriverByIdAndFisherman(req.params.id, req.user.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    await deleteDriverDetails(req.params.id);
    if (driver.user_id) {
      await deleteUser(driver.user_id);
    }

    res.json({ message: 'Driver removed successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
