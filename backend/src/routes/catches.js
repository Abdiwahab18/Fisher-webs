import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';
import {
  createFishCatch,
  getFishCatchesByUser,
  getAllFishCatches,
  getFishCatchById,
  updateFishCatch,
  deleteFishCatch,
  getFishermanEarnings,
  getDailyEarnings,
  getMonthlyEarnings,
  findActiveCatchBySpeciesAndUser,
  incrementCatchWeight
} from '../models/userModel.js';

const router = express.Router();

// Get all fish catches (public)
router.get('/', async (req, res) => {
  try {
    // Optional check: if token is provided and caller is a fisherman, restrict them to their own catches
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let user = null;
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        // Treat as unauthenticated guest
      }
    }

    if (user && user.role === 'fisherman') {
      const catches = await getFishCatchesByUser(user.id);
      return res.json(catches);
    }

    const catches = await getAllFishCatches();
    res.json(catches);
  } catch (error) {
    console.error('GET /api/catches error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get fish catches for current user
router.get('/my-catches', authenticateToken, async (req, res) => {
  try {
    const catches = await getFishCatchesByUser(req.user.id);
    res.json(catches);
  } catch (error) {
    console.error('GET /api/catches/my-catches error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get specific fish catch
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const catch_ = await getFishCatchById(req.params.id);
    if (!catch_) {
      return res.status(404).json({ message: 'Fish catch not found' });
    }
    res.json(catch_);
  } catch (error) {
    console.error('GET /api/catches/:id error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Create new fish catch
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { fish_name, weight, price, location, image, catch_date } = req.body;

    if (!fish_name || !weight || !price) {
      return res.status(400).json({ message: 'Fish name, weight, and price are required' });
    }

    if (!image) {
      return res.status(400).json({ message: 'Catch image is required' });
    }

    // Verify it is an image and not other files
    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Only image files are allowed to be uploaded' });
    }

    if (!catch_date) {
      return res.status(400).json({ message: 'Catch date is required' });
    }

    const inputDate = new Date(catch_date);
    if (isNaN(inputDate.getTime())) {
      return res.status(400).json({ message: 'Invalid catch date' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date();
    minDate.setDate(today.getDate() - 20);
    minDate.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setHours(23, 59, 59, 999);

    if (inputDate < minDate) {
      return res.status(400).json({ message: 'Catch date cannot be older than 20 days ago' });
    }

    if (inputDate > maxDate) {
      return res.status(400).json({ message: 'Catch date cannot be in the future' });
    }

    // Check if there is an existing active catch of the same species
    const existingCatch = await findActiveCatchBySpeciesAndUser(req.user.id, fish_name);

    let savedCatch;
    if (existingCatch) {
      // Increment the weight and update other fields
      savedCatch = await incrementCatchWeight(existingCatch.id, parseFloat(weight), {
        price: price ? parseFloat(price) : null,
        location: location || null,
        image: image || null,
        catch_date: catch_date || null
      });
    } else {
      // Create new catch
      savedCatch = await createFishCatch({
        fish_name,
        weight: parseFloat(weight),
        price: parseFloat(price),
        location,
        image,
        catch_date,
        user_id: req.user.id
      });
    }

    // Emit WebSocket update if io is configured
    const io = req.app.get('io');
    if (io) {
      io.emit('catch-added', savedCatch);
    }

    res.status(201).json(savedCatch);
  } catch (error) {
    console.error('POST /api/catches error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update fish catch
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const catch_ = await getFishCatchById(id);

    if (!catch_) {
      return res.status(404).json({ message: 'Fish catch not found' });
    }

    // Verify ownership
    if (catch_.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedCatch = await updateFishCatch(id, req.body);
    res.json(updatedCatch);
  } catch (error) {
    console.error('PUT /api/catches/:id error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Delete fish catch
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const catch_ = await getFishCatchById(id);

    if (!catch_) {
      return res.status(404).json({ message: 'Fish catch not found' });
    }

    // Verify ownership
    if (catch_.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await deleteFishCatch(id);
    res.json({ message: 'Fish catch deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/catches/:id error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

export default router;