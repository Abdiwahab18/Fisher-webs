import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/db.js';
import { assignOrderToDriver, createNotification } from '../models/userModel.js';

const router = express.Router();

// Get payments for admin and fishermen
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const result = await pool.query(
        `SELECT p.*, o.total_price, u.name as buyer_name, u.email as buyer_email 
         FROM payments p
         JOIN orders o ON p.order_id = o.id
         JOIN users u ON p.user_id = u.id
         ORDER BY p.created_at DESC`
      );
      return res.json(result.rows);
    }

    if (req.user.role === 'fisherman') {
      const result = await pool.query(
        `SELECT DISTINCT p.*, o.total_price, u.name as buyer_name, u.email as buyer_email
         FROM payments p
         JOIN orders o ON p.order_id = o.id
         JOIN users u ON p.user_id = u.id
         JOIN order_items oi ON oi.order_id = o.id
         JOIN fish_catches fc ON oi.fish_id = fc.id
         WHERE fc.user_id = $1
         ORDER BY p.created_at DESC`,
        [req.user.id]
      );
      return res.json(result.rows);
    }

    return res.status(403).json({ message: 'Forbidden' });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit automated Waafi payment
router.post('/waafi', authenticateToken, async (req, res) => {
  try {
    const { orderId, accountNo, amount } = req.body;

    if (!orderId || !accountNo || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if order exists and belongs to user
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, req.user.id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const transactionId = `WAAFI_${Date.now()}`;

    // Call Waafi API
    const waafiPayload = {
      schemaVersion: "1.0",
      requestId: transactionId,
      timestamp: new Date().toISOString(),
      channelName: process.env.PAYMENT_CHANNEL_NAME || "WEB",
      serviceName: process.env.PAYMENT_SERVICE_NAME || "API_PURCHASE",
      serviceParams: {
        merchantUid: process.env.PAYMENT_MERCHANT_UID,
        apiUserId: process.env.PAYMENT_API_USER_ID,
        apiKey: process.env.PAYMENT_API_KEY,
        paymentMethod: process.env.PAYMENT_METHOD || "mwallet_account",
        payerInfo: {
          accountNo: accountNo
        },
        transactionInfo: {
          referenceId: String(orderId),
          invoiceId: String(orderId),
          amount: amount,
          currency: process.env.PAYMENT_CURRENCY || "USD",
          description: `Payment for Order #${orderId}`
        }
      }
    };

    const waafiUrl = process.env.PAYMENT_URL || "https://api.waafipay.net/asm";
    
    const axios = (await import('axios')).default;
    let waafiResponse;
    try {
      waafiResponse = await axios.post(waafiUrl, waafiPayload);
    } catch (apiErr) {
      console.error('Waafi API error:', apiErr.response?.data || apiErr.message);
      return res.status(502).json({ message: 'Payment gateway error' });
    }

    if (waafiResponse.data && waafiResponse.data.responseCode === '2001') {
      // 2001 is typically success in Waafi API. We insert payment as verified.
      const paymentRes = await pool.query(
        `INSERT INTO payments (order_id, user_id, amount, method, reference, sender_phone, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [orderId, req.user.id, amount, 'waafi', transactionId, accountNo, 'verified']
      );

      // Update order status to processing and payment_status to paid
      await pool.query(
        `UPDATE orders SET status = 'processing', payment_method = 'waafi', payment_reference = $1, payment_status = 'paid' WHERE id = $2`,
        [transactionId, orderId]
      );

      const io = req.app.get('io');
      await assignOrderToDriver(orderId, io);

      await createNotification({
        user_id: req.user.id,
        message: `Your payment for order #${orderId} was successful. Order is now processing.`,
        is_read: false
      });

      if (io) {
        io.to(`user:${req.user.id}`).emit('payment-updated', {
          orderId: orderId,
          status: 'processing'
        });
      }

      return res.status(201).json(paymentRes.rows[0]);
    } else {
      // Payment failed at Waafi end
      console.error('Waafi API Failure Response:', waafiResponse.data);
      return res.status(400).json({ message: waafiResponse.data?.responseMsg || 'Payment declined by Waafi' });
    }
  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify and approve/reject payment (Admin)
router.patch('/:id/verify', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { status } = req.body; // 'verified' or 'rejected'
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update payment
    const paymentRes = await pool.query(
      `UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = paymentRes.rows[0];
    const orderStatus = status === 'verified' ? 'processing' : 'cancelled';
    const paymentStatus = status === 'verified' ? 'paid' : 'failed';

    // Update order
    await pool.query(
      `UPDATE orders SET status = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [orderStatus, paymentStatus, payment.order_id]
    );

    const io = req.app.get('io');
    if (orderStatus === 'processing') {
      await assignOrderToDriver(payment.order_id, io);
    }

    const msg = status === 'verified' 
      ? `Your payment for order #${payment.order_id} has been verified. Order is now processing.`
      : `Your payment for order #${payment.order_id} was rejected. Order cancelled.`;

    await createNotification({
      user_id: payment.user_id,
      message: msg,
      is_read: false
    });

    if (io) {
      io.to(`user:${payment.user_id}`).emit('payment-updated', {
        orderId: payment.order_id,
        status: orderStatus
      });
    }

    res.json({ message: 'Payment verified', payment });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
