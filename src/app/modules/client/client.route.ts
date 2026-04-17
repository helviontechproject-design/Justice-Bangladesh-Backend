import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { clientController } from './client.controller';

const router = Router();

router.get('/', checkAuth(ERole.SUPER_ADMIN), clientController.getAllClients)

router.get('/:id', clientController.getClientbyid)

router.patch('/update-client/:id', checkAuth(ERole.CLIENT, ERole.SUPER_ADMIN), clientController.updateClient)

router.post('/save-lawyer/:lawyerId', checkAuth(ERole.CLIENT), clientController.toggleSaveLawyer)
router.get('/saved-lawyers/my', checkAuth(ERole.CLIENT), clientController.getSavedLawyers)

router.patch('/ban/:userId', checkAuth(ERole.SUPER_ADMIN), clientController.banClient)
router.patch('/unban/:userId', checkAuth(ERole.SUPER_ADMIN), clientController.unbanClient)

router.delete('/:id', checkAuth(ERole.SUPER_ADMIN), clientController.deleteClient)

export const clientRoute = router;