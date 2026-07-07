import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../models/userModel.js';

export async function register(req, res) {
  const { name, email, password, role, profile_picture } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (/\d/.test(name)) {
    return res.status(400).json({ message: 'Name cannot contain numbers' });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser({ name, email, password: hashedPassword, role, profile_picture });

  res.status(201).json({ message: 'User created', user });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check if user status is active
  if (user.status && user.status !== 'active') {
    return res.status(403).json({ message: 'Your account is ' + user.status + '. Please contact administrator.' });
  }

  const payload = { id: user.id, role: user.role, name: user.name };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRES_IN || '1h',
  });

  res.json({ token, role: user.role, userId: user.id });
}

export async function demoLogin(req, res) {
  try {
    const { role } = req.body;
    const validRoles = ['customer', 'fisherman', 'driver', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid or missing role' });
    }

    const email = `demo_${role}@fisher.com`;
    const password = 'demopass123';

    let user = await findUserByEmail(email);
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await createUser({
        name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        email,
        password: hashedPassword,
        role,
        profile_picture: null
      });
      console.log(`Created demo user for role: ${role}`);
    }

    const payload = { id: user.id, role: user.role, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRES_IN || '24h',
    });

    res.json({ token, role: user.role, userId: user.id });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ message: 'Server error during demo login' });
  }
}
