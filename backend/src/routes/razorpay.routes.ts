import { Router } from 'express';
import { authorizeRazorpay, razorpayCallback } from '../controllers/razorpay.controller';

const router = Router();

router.get('/authorize', authorizeRazorpay);
router.get('/callback', razorpayCallback);

export default router;
