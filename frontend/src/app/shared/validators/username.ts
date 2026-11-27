import { FormControl, ValidationErrors, Validators } from '@angular/forms';

// Reglas del nombre de usuario. Deben coincidir con las del backend
// (backend/src/utils/username.ts).
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 20;

// Letras de cualquier idioma (incluye acentos y ñ), números, guion medio y guion bajo.
// Sin espacios ni otros símbolos.
export const USERNAME_PATTERN = /^[\p{L}\p{N}_-]+$/u;

export const usernameValidators = [
  Validators.required,
  Validators.minLength(USERNAME_MIN_LENGTH),
  Validators.maxLength(USERNAME_MAX_LENGTH),
  Validators.pattern(USERNAME_PATTERN),
];

// Mensaje para el primer error encontrado, o null si no hay errores.
export function getUsernameErrorMessage(errors: ValidationErrors | null): string | null {
  if (!errors) return null;
  if (errors['required']) return 'Este campo es requerido';
  if (errors['minlength']) {
    return `El nombre debe tener una longitud mínimo de ${USERNAME_MIN_LENGTH} caracteres`;
  }
  if (errors['maxlength']) {
    return `El nombre debe tener una longitud máxima de ${USERNAME_MAX_LENGTH} caracteres`;
  }
  if (errors['pattern']) {
    return 'Solo se permiten letras, números, guiones (-) y guiones bajos (_), sin espacios';
  }
  return 'Nombre de usuario inválido';
}

// Valida un nombre fuera de un formulario (por ejemplo, al editarlo en el perfil).
export function getUsernameError(value: string): string | null {
  return getUsernameErrorMessage(new FormControl(value, usernameValidators).errors);
}
