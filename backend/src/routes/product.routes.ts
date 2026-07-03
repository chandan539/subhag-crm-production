import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getProducts, getProductById, createProduct, updateProduct } from '../controllers/product.controller';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);

export default router;
