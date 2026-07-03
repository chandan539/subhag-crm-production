import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getDashboardStats, getWarrantiesByProduct, getTicketsByStatus } from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/warranties-by-product', getWarrantiesByProduct);
router.get('/tickets-by-status', getTicketsByStatus);

export default router;
