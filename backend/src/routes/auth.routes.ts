import { Router } from 'express';
import { login, register, getMe, setPassword, forgotPassword, resetPassword, getUsers, updateUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/set-password', setPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, getUsers);
router.put('/users/:id', authenticate, updateUser);

export default router;
