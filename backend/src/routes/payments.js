import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getPayments,
  submitWaafiPayment,
  verifyPayment
} from '../controllers/paymentController.js';

const router = express.Router();

// Get payments for admin and fishermen
router.get('/', authenticateToken, getPayments);

// Submit automated Waafi payment
router.post('/waafi', authenticateToken, submitWaafiPayment);

// Verify and approve/reject payment (Admin)
router.patch('/:id/verify', authenticateToken, verifyPayment);

export default router;
