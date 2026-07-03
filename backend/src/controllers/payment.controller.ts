import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import axios from 'axios';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { AuthRequest } from '../middleware/auth.middleware';

export const createAmcOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { warranty_id } = req.body;
    
    // Fetch credentials from DB
    const accessTokenSetting = await prisma.systemSetting.findUnique({ where: { key: 'razorpayAccessToken' } });
    const keyIdSetting = await prisma.systemSetting.findUnique({ where: { key: 'razorpayKeyId' } });
    const secretSetting = await prisma.systemSetting.findUnique({ where: { key: 'razorpayKeySecret' } });
    
    const accessToken = accessTokenSetting?.value;
    const keyId = keyIdSetting?.value;
    const keySecret = secretSetting?.value;
    
    if (!accessToken && (!keyId || !keySecret)) {
      res.status(400).json({ error: 'Razorpay is not connected. Please connect from admin settings.' });
      return;
    }
    // Get warranty and associated product to find AMC price
    const warranty = await prisma.warranty.findUnique({
      where: { id: warranty_id },
      include: {
        serial_number: {
          include: {
            product: true
          }
        },
        customer: true,
      }
    });

    if (!warranty) {
      res.status(404).json({ error: 'Warranty not found' });
      return;
    }

    const amcPrice = warranty.serial_number.product.amc_price;
    if (!amcPrice || parseFloat(amcPrice.toString()) <= 0) {
      res.status(400).json({ error: 'AMC is not available for this product' });
      return;
    }

    // Amount should be in paise (multiply by 100)
    const amountInPaise = Math.round(parseFloat(amcPrice.toString()) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_amc_${warranty.id.substring(0, 8)}`,
      notes: {
        warranty_id: warranty.id,
        customer_id: warranty.customer_id
      }
    };

    let order;
    let checkoutKeyId;

    if (accessToken) {
      // Use OAuth
      const response = await axios.post('https://api.razorpay.com/v1/orders', options, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      order = response.data;
      checkoutKeyId = process.env.RAZORPAY_CLIENT_ID; // In OAuth, partner client ID is used on frontend
    } else {
      // Use Basic Auth (Manual Keys)
      const razorpay = new Razorpay({
        key_id: keyId!,
        key_secret: keySecret!,
      });
      order = await razorpay.orders.create(options);
      checkoutKeyId = keyId;
    }

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: checkoutKeyId
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error.response?.data || error.message || error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

export const verifyAmcPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      warranty_id,
      start_date,
      end_date,
      price
    } = req.body;

    const accessTokenSetting = await prisma.systemSetting.findUnique({ where: { key: 'razorpayAccessToken' } });
    const secretSetting = await prisma.systemSetting.findUnique({ where: { key: 'razorpayKeySecret' } });
    
    // If OAuth is used, verify using Partner Client Secret. If Basic Auth, use Merchant Key Secret.
    let secret = '';
    if (accessTokenSetting?.value) {
      secret = process.env.RAZORPAY_CLIENT_SECRET || '';
      if (!secret) {
        res.status(500).json({ error: 'OAuth Client Secret missing for verification' });
        return;
      }
    } else if (secretSetting?.value) {
      secret = secretSetting.value;
    } else {
      res.status(500).json({ error: 'No Razorpay credentials found for verification' });
      return;
    }
    
    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      res.status(400).json({ error: 'Invalid payment signature' });
      return;
    }

    // Find the warranty
    const warranty = await prisma.warranty.findUnique({
      where: { id: warranty_id },
    });

    if (!warranty) {
      res.status(404).json({ error: 'Warranty not found' });
      return;
    }

    // Create the AMC contract
    const amc = await prisma.amcContract.create({
      data: {
        warranty_id: warranty.id,
        customer_id: warranty.customer_id,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status: 'ACTIVE',
        value: parseFloat(price),
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_status: 'COMPLETED'
      }
    });

    res.json({ success: true, amc });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};
