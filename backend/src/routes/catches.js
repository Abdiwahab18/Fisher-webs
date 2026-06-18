import express from 'express';
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
  getMonthlyEarnings
} from '../models/userModel.js';

const router = express.Router();

// Get all fish catches (public)
router.get('/', async (req, res) => {
  try {
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

    const newCatch = await createFishCatch({
      fish_name,
      weight,
      price,
      location,
      image,
      catch_date,
      user_id: req.user.id
    });

    res.status(201).json(newCatch);
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