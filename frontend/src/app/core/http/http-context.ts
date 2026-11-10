import { HttpContextToken } from '@angular/common/http';

// Se usa en login y registro (un 401 ahí significa "credenciales inválidas")
// y en la restauración de sesión (la maneja AuthService).
export const SKIP_UNAUTHORIZED_HANDLING = new HttpContextToken<boolean>(() => false);
