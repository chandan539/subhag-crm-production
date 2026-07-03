import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getSerials, getSerialById, generateSerials, updateSerialStatus, addManualSerials } from '../controllers/serial.controller';

const router = Router();

router.use(authenticate);

router.get('/', getSerials);
router.get('/:id', getSerialById);
router.post('/generate', generateSerials);
router.post('/manual', addManualSerials);
router.put('/:id/status', updateSerialStatus);

export default router;
