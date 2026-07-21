import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getAllCatches,
  getMyCatches,
  getCatchById,
  createCatch,
  updateCatch,
  deleteCatch
} from '../controllers/catchController.js';

const router = express.Router();

// Get all fish catches (public)
router.get('/', getAllCatches);

// Get fish catches for current user
router.get('/my-catches', authenticateToken, getMyCatches);

// Get specific fish catch
router.get('/:id', authenticateToken, getCatchById);

// Create new fish catch
router.post('/', authenticateToken, createCatch);

// Update fish catch
router.put('/:id', authenticateToken, updateCatch);

// Delete fish catch
router.delete('/:id', authenticateToken, deleteCatch);

export default router;