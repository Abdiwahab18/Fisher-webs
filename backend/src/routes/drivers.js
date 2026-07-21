import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import {
  listDrivers,
  createDriver,
  updateDriver,
  deleteDriver
} from '../controllers/driverController.js';

const router = express.Router();

router.get('/', authenticateToken, listDrivers);
router.post('/', authenticateToken, authorizeRole('fisherman'), createDriver);
router.patch('/:id', authenticateToken, authorizeRole('fisherman'), updateDriver);
router.delete('/:id', authenticateToken, authorizeRole('fisherman'), deleteDriver);

export default router;
