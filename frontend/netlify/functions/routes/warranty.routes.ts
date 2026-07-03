import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getWarranties, getWarrantyById, activateWarranty, downloadCertificatePdf } from '../controllers/warranty.controller';

const router = Router();

// Public route for activation (could require customer auth in a real portal)
router.post('/activate', activateWarranty);

// Public route to download PDF certificate
router.get('/:certificate_number/pdf', downloadCertificatePdf);

router.use(authenticate);
router.get('/', getWarranties);
router.get('/:id', getWarrantyById);

export default router;
