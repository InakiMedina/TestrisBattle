import { Router } from 'express';
import * as controller from '../controllers/user.controller';
import { requireRole, requireSelf, requireSelfOrAdmin } from '../middlewares/authorize';
import {
  validateChangePassword,
  validateObjectId,
  validateUpdateUser,
} from '../middlewares/userValidation';

const router = Router();

// validateObjectId va después de la autorización: sin permiso responde 403 antes que 400.
router.get('/', requireRole('admin'), controller.getUsers);
router.get('/:id', requireSelfOrAdmin, validateObjectId, controller.getUserById);
router.patch('/:id', requireSelfOrAdmin, validateObjectId, validateUpdateUser, controller.updateUser);
router.patch('/:id/password', requireSelf, validateObjectId, validateChangePassword, controller.changePassword);
router.delete('/:id', requireRole('admin'), validateObjectId, controller.deleteUser);

export default router;
