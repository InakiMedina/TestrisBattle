import {
  LEGACY_INDEXED_DB_NAME,
  cleanupLegacyLocalImages,
} from './legacy-storage-cleanup';

describe('cleanupLegacyLocalImages', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('borra la foto y el fondo guardados en localStorage', () => {
    localStorage.setItem('profile-image', 'data:image/png;base64,xxx');
    localStorage.setItem('fondoSeleccionado', 'custom:1');
    localStorage.setItem('tetris_token', 'token');

    cleanupLegacyLocalImages();

    expect(localStorage.getItem('profile-image')).toBeNull();
    expect(localStorage.getItem('fondoSeleccionado')).toBeNull();
    // La sesión no se toca.
    expect(localStorage.getItem('tetris_token')).toBe('token');
    localStorage.removeItem('tetris_token');
  });

  it('borra la base de IndexedDB con los fondos antiguos', () => {
    const deleteDatabase = vi.fn();
    vi.stubGlobal('indexedDB', { deleteDatabase });

    cleanupLegacyLocalImages();

    expect(deleteDatabase).toHaveBeenCalledWith(LEGACY_INDEXED_DB_NAME);
  });
});
