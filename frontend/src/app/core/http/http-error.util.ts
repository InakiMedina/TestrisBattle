import { HttpErrorResponse } from '@angular/common/http';

// El backend siempre responde los errores como { message: string }
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message: unknown }).message;
      if (typeof message === 'string' && message.length > 0) return message;
    }
  }
  return fallback;
}

// Mensaje para mostrar en los formularios.
// Los errores de red y los errores de estatus "5xx" ya los muestra el banner global, así que aquí devuelven null.
export function getFormErrorMessage(error: unknown): string | null {
  if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
    return getErrorMessage(error, 'No se pudo completar la solicitud. Inténtalo de nuevo.');
  }
  return null;
}
