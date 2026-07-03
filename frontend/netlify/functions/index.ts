import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import serverless from 'serverless-http';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import serialRoutes from './routes/serial.routes';
import warrantyRoutes from './routes/warranty.routes';
import ticketRoutes from './routes/ticket.routes';
import amcRoutes from './routes/amc.routes';
import analyticsRoutes from './routes/analytics.routes';
import customerRoutes from './routes/customer.routes';
import engineerRoutes from './routes/engineer.routes';
import settingsRoutes from './routes/settings.routes';
import notificationRoutes from './routes/notification.routes';
import paymentRoutes from './routes/payment.routes';
import razorpayRoutes from './routes/razorpay.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Auth Route Rate Limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication requests, please try again later.' }
});

// Apply global limiter to all routes
app.use('/api/', globalLimiter);

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/serials', serialRoutes);
app.use('/api/v1/warranties', warrantyRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/amc', amcRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/engineers', engineerRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/razorpay', razorpayRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// For local development
if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for serverless (Netlify Functions / AWS Lambda)
export const handler = serverless(app);
