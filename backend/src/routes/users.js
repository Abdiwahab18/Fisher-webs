import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { currentUser, listUsers, deleteUser, updateUserStatusController, getSystemStatsController, getRevenueAnalytics, updateProfileController } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', authenticateToken, currentUser);
router.patch('/me/profile', authenticateToken, updateProfileController);
router.get('/', authenticateToken, authorizeRole('admin'), listUsers);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteUser);
router.patch('/:id/status', authenticateToken, authorizeRole('admin'), updateUserStatusController);
router.get('/admin/stats', authenticateToken, authorizeRole('admin'), getSystemStatsController);
router.get('/admin/revenue', authenticateToken, authorizeRole('admin'), getRevenueAnalytics);

export default router;
