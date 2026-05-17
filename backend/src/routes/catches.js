import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createFishCatch,
  getFishCatchesByUser,
  getAllFishCatches,
  getFishCatchById
} from '../models/userModel.js';

const router = express.Router();

// Get all fish catches (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const catches = await getAllFishCatches();
    res.json(catches);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get fish catches for current user
router.get('/my-catches', authenticateToken, async (req, res) => {
  try {
    const catches = await getFishCatchesByUser(req.user.id);
    res.json(catches);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new fish catch
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { fish_name, quantity, price, location, image } = req.body;

    if (!fish_name || !quantity || !price) {
      return res.status(400).json({ message: 'Fish name, quantity, and price are required' });
    }

    const newCatch = await createFishCatch({
      fish_name,
      quantity,
      price,
      location,
      image,
      user_id: req.user.id
    });

    res.status(201).json(newCatch);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;