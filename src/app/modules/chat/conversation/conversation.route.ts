import { Router } from 'express';
import { checkAuth } from '../../../middlewares/checkAuth';
import { ERole } from '../../user/user.interface';
import { conversationController } from './conversation.controller';

const router = Router();

// Get authenticated user's conversations (CLIENT or LAWYER)
router.get(
  '/',
  checkAuth(ERole.CLIENT, ERole.LAWYER),
  conversationController.getMyConversations
);

// Get single conversation by ID (CLIENT or LAWYER - own conversations only)
router.get(
  '/:id',
  checkAuth(ERole.CLIENT, ERole.LAWYER),
  conversationController.getConversationById
);

export const conversationRoute = router;
