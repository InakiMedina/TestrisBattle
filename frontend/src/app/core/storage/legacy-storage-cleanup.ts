// Antes de usar S3, la foto de perfil, los fondos personalizados y el fondo
// seleccionado se guardaban solo en el navegador. Esos datos ya no se usan,
// así que se borran al iniciar la aplicación para no ocupar espacio.
export const LEGACY_LOCAL_STORAGE_KEYS: readonly string[] = ['profile-image', 'fondoSeleccionado'];
export const LEGACY_INDEXED_DB_NAME = 'tetris-battle-local-images';

export function cleanupLegacyLocalImages(): void {
  try {
    for (const key of LEGACY_LOCAL_STORAGE_KEYS) localStorage.removeItem(key);
  } catch {
    // Sin acceso a localStorage: no hay nada que limpiar
  }

  try {
    // Si la base no existe, la operación simplemente no hace nada.
    globalThis.indexedDB?.deleteDatabase(LEGACY_INDEXED_DB_NAME);
  } catch {
    // Sin acceso a IndexedDB: no hay nada que limpiar
  }
}
