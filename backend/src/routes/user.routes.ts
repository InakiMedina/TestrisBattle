import { Router } from 'express';
import * as controller from '../controllers/user.controller';
import { requireRole, requireSelf, requireSelfOrAdmin } from '../middlewares/authorize';
import {
  validateChangePassword,
  validateUpdateUser,
  // validateObjectId, // Descomentar al conectar MongoDB (los ids pasan a ser ObjectId)
} from '../middlewares/userValidation';

const router = Router();

// Al conectar MongoDB, agregar validateObjectId después de requireSelf/requireSelfOrAdmin/requireRole en las rutas que llevan :id
router.get('/', requireRole('admin'), controller.getUsers);
router.get('/:id', requireSelfOrAdmin, controller.getUserById);
router.patch('/:id', requireSelfOrAdmin, validateUpdateUser, controller.updateUser);
router.patch('/:id/password', requireSelf, validateChangePassword, controller.changePassword);
router.delete('/:id', requireRole('admin'), controller.deleteUser);

export default router;