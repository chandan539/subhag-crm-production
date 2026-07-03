import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getCustomers, getCustomerById, updateCustomer } from '../controllers/customer.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);

export default router;
