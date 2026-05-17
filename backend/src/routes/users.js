import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { currentUser, listUsers, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', authenticateToken, currentUser);
router.get('/', authenticateToken, authorizeRole('admin'), listUsers);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteUser);

export default router;
