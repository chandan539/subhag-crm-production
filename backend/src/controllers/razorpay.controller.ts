import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import axios from 'axios';
import crypto from 'crypto';

export const authorizeRazorpay = async (req: Request, res: Response) => {
  try {
    const clientId = process.env.RAZORPAY_CLIENT_ID;
    if (!clientId) {
      return res.status(500).send('RAZORPAY_CLIENT_ID is not configured in environment variables.');
    }

    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/api/razorpay/callback`; // We'll proxy through frontend or set exact backend URL

    // Usually, the callback should point directly to the backend if the backend handles it, or to the frontend which proxies to the backend.
    // Let's assume the callback goes directly to backend:
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const callbackUrl = `${backendUrl}/api/razorpay/callback`;

    const authorizeUrl = `https://auth.razorpay.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=read_write`;

    res.redirect(authorizeUrl);
  } catch (error) {
    console.error('Error in authorizeRazorpay:', error);
    res.status(500).send('Internal Server Error');
  }
};

export const razorpayCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('Razorpay OAuth Error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin/settings?error=${encodeURIComponent(error_description as string)}`);
    }

    if (!code) {
      return res.status(400).send('Authorization code is missing.');
    }

    const clientId = process.env.RAZORPAY_CLIENT_ID;
    const clientSecret = process.env.RAZORPAY_CLIENT_SECRET;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const callbackUrl = `${backendUrl}/api/razorpay/callback`;

    if (!clientId || !clientSecret) {
      return res.status(500).send('Razorpay Client ID or Secret missing in environment variables.');
    }

    const response = await axios.post('https://auth.razorpay.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl,
      code: code as string
    });

    const { access_token, refresh_token, razorpay_account_id } = response.data;

    // Save tokens in SystemSettings
    await prisma.systemSetting.upsert({
      where: { key: 'razorpayAccessToken' },
      update: { value: access_token },
      create: { key: 'razorpayAccessToken', value: access_token }
    });

    if (refresh_token) {
      await prisma.systemSetting.upsert({
        where: { key: 'razorpayRefreshToken' },
        update: { value: refresh_token },
        create: { key: 'razorpayRefreshToken', value: refresh_token }
      });
    }

    if (razorpay_account_id) {
      await prisma.systemSetting.upsert({
        where: { key: 'razorpayAccountId' },
        update: { value: razorpay_account_id },
        create: { key: 'razorpayAccountId', value: razorpay_account_id }
      });
    }

    // Set enabled to true
    await prisma.systemSetting.upsert({
      where: { key: 'razorpayEnabled' },
      update: { value: 'true' },
      create: { key: 'razorpayEnabled', value: 'true' }
    });

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin/settings?razorpay_connected=true`);
  } catch (error: any) {
    console.error('Error exchanging Razorpay token:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin/settings?error=TokenExchangeFailed`);
  }
};
