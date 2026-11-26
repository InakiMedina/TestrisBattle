import { Router } from 'express';
import * as controller from '../controllers/userFiles.controller';
import { requireSelf, requireSelfOrAdmin } from '../middlewares/authorize';
import { uploadBackground, uploadProfilePicture } from '../middlewares/imageUpload';
import { validateBackgroundId, validateObjectId } from '../middlewares/userValidation';

// Se monta en /api/users, que ya exige verifyJwt.
// Leer: el propio usuario o un admin. Modificar: solo el propio usuario.
// La subida (multer) va al final para no recibir el archivo si la petición no está autorizada.
const router = Router();

router.get('/:id/profile-picture', requireSelfOrAdmin, validateObjectId, controller.getProfilePicture);
router.put('/:id/profile-picture', requireSelf, validateObjectId, uploadProfilePicture, controller.uploadProfilePicture);
router.delete('/:id/profile-picture', requireSelf, validateObjectId, controller.deleteProfilePicture);

router.get('/:id/backgrounds', requireSelfOrAdmin, validateObjectId, controller.listBackgrounds);
router.post('/:id/backgrounds', requireSelf, validateObjectId, uploadBackground, controller.uploadBackground);
router.get(
  '/:id/backgrounds/:backgroundId',
  requireSelfOrAdmin,
  validateObjectId,
  validateBackgroundId,
  controller.getBackground,
);
router.delete(
  '/:id/backgrounds/:backgroundId',
  requireSelf,
  validateObjectId,
  validateBackgroundId,
  controller.deleteBackground,
);

export default router;
