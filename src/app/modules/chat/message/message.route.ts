import { Router } from 'express';
import { checkAuth } from '../../../middlewares/checkAuth';
import { ERole } from '../../user/user.interface';
import { messageController } from './message.controller';
import { validateRequest } from '../../../middlewares/validateRequest';
import { createMessageSchema } from './message.validation';
import { multerUpload } from '../../../config/multer.config';

const router = Router();

// Send a message (CLIENT or LAWYER)
router.post(
  '/',
  checkAuth(ERole.CLIENT, ERole.LAWYER),
  multerUpload.single('file'),
  validateRequest(createMessageSchema),
  messageController.sendMessage
);

// Get messages by conversation ID (CLIENT or LAWYER - own conversations only)
router.get(
  '/conversation/:conversationId',
  checkAuth(ERole.CLIENT, ERole.LAWYER),
  messageController.getMessagesByConversation
); 



// Add reaction to message (CLIENT or LAWYER)
router.patch(
  '/:id/reaction',
  checkAuth(ERole.CLIENT, ERole.LAWYER),
  messageController.addReaction
);

// Delete message (CLIENT or LAWYER - sender only)
router.patch(
  '/:id/delete',
  checkAuth(ERole.CLIENT, ERole.LAWYER),
  messageController.deleteMessage
);

export const messageRoute = router;
