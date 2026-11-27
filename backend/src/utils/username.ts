// Reglas del nombre de usuario. Deben coincidir con las del frontend
// (frontend/src/app/shared/validators/username.ts).
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 20;

// Letras de cualquier idioma (incluye acentos y ñ), números, guion medio y guion bajo.
// Sin espacios ni otros símbolos. Las llaves cuentan caracteres, no bytes (bandera u).
const USERNAME_REGEX = /^[\p{L}\p{N}_-]+$/u;

// Quita espacios de los extremos y unifica los acentos (NFC), para que "é" escrita
// como un solo carácter o como "e" + acento se guarde y compare igual.
export function normalizeUsername(value: string): string {
  return value.trim().normalize('NFC');
}

// Devuelve el mensaje de error o null si el nombre es válido.
export function getUsernameError(value: unknown): string | null {
  if (typeof value !== 'string') return 'El nombre de usuario debe ser texto';
  const username = normalizeUsername(value);
  const length = [...username].length;
  if (length < USERNAME_MIN_LENGTH) {
    return `El nombre de usuario debe tener al menos ${USERNAME_MIN_LENGTH} caracteres`;
  }
  if (length > USERNAME_MAX_LENGTH) {
    return `El nombre de usuario debe tener como máximo ${USERNAME_MAX_LENGTH} caracteres`;
  }
  if (!USERNAME_REGEX.test(username)) {
    return 'El nombre de usuario solo puede tener letras, números, guiones (-) y guiones bajos (_), sin espacios';
  }
  return null;
}
