import { Router } from 'express';
import { createAmcOrder, verifyAmcPayment } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Secure all payment routes
router.use(authenticate);

router.post('/razorpay/create-order', createAmcOrder);
router.post('/razorpay/verify', verifyAmcPayment);

export default router;
