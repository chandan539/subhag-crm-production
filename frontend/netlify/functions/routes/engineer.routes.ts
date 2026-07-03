import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getEngineers } from '../controllers/engineer.controller';

const router = Router();

router.use(authenticate);

router.get('/', getEngineers);

export default router;
