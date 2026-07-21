import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getSummary,
  getDaily,
  getMonthly
} from '../controllers/earningController.js';

const router = express.Router();

// Get fisherman earnings summary
router.get('/summary', authenticateToken, getSummary);

// Get daily earnings
router.get('/daily', authenticateToken, getDaily);

// Get monthly earnings
router.get('/monthly', authenticateToken, getMonthly);

export default router;
