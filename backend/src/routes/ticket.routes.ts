import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getTickets, getTicketById, createTicket, assignEngineer, updateTicketStatus } from '../controllers/ticket.controller';

const router = Router();

router.use(authenticate);

router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.put('/:id/assign', assignEngineer);
router.put('/:id/status', updateTicketStatus);

export default router;
