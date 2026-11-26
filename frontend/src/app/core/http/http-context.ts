import { HttpContextToken } from '@angular/common/http';

// Se usa en login y registro (un 401 ahí significa "credenciales inválidas")
// y en la restauración de sesión (la maneja AuthService).
export const SKIP_UNAUTHORIZED_HANDLING = new HttpContextToken<boolean>(() => false);

// Peticiones cuyo error 5xx maneja el propio componente (por ejemplo, los archivos
// de S3: si el almacenamiento no está disponible se usan las imágenes por defecto
// sin mostrar el banner global de error del servidor).
export const SKIP_SERVER_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);
