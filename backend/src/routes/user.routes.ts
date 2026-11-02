import { Router } from 'express';
import * as controller from '../controllers/user.controller';
import {
  validateChangePassword,
  validateCreateUser,
  validateObjectId,
  validateUpdateUser,
} from '../middlewares/userValidation';

const router = Router();

router.post('/', validateCreateUser, controller.createUser);
router.get('/', controller.getUsers);
router.get('/:id', validateObjectId, controller.getUserById);
router.patch('/:id', validateObjectId, validateUpdateUser, controller.updateUser);
router.patch('/:id/password', validateObjectId, validateChangePassword, controller.changePassword);
router.delete('/:id', validateObjectId, controller.deleteUser);

export default router;
