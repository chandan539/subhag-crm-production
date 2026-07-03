import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAmcContracts, getAmcById, createAmc, renewAmc } from '../controllers/amc.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAmcContracts);
router.get('/:id', getAmcById);
router.post('/', createAmc);
router.post('/:id/renew', renewAmc);

export default router;
