import { TestBed } from '@angular/core/testing';
import { AuthService } from '../core/auth/auth.service';
import { createAuthServiceMock, createTestUser } from '../../testing/auth-service.mock';
import { BackgroundHandler, DEFAULT_BACKGROUND } from './background-handler';
import { UserFilesService } from './user-files.service';

describe('BackgroundHandler', () => {
  let service: BackgroundHandler;
  let auth: ReturnType<typeof createAuthServiceMock>;
  const getBackgroundUrl = vi.fn<(id: string) => Promise<string | null>>();

  beforeEach(() => {
    auth = createAuthServiceMock();
    getBackgroundUrl.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: UserFilesService, useValue: { getBackgroundUrl } },
      ],
    });
    service = TestBed.inject(BackgroundHandler);
    // jsdom no carga imágenes: se simula que la carga termina bien.
    vi.spyOn(service as unknown as { preloadImage: () => Promise<void> }, 'preloadImage')
      .mockResolvedValue();
  });

  afterEach(() => service.reset());

  it('usa city_image.jpg si el usuario no tiene fondo guardado', async () => {
    await service.restoreSavedBackground();
    expect(document.body.style.backgroundImage).toContain(DEFAULT_BACKGROUND);
  });

  it('restaura el fondo predeterminado que el usuario dejó seleccionado', async () => {
    auth.setUser(createTestUser({ background: '/backgrounds/bg_5.jpg' }));
    await service.restoreSavedBackground();
    expect(document.body.style.backgroundImage).toContain('/backgrounds/bg_5.jpg');
  });

  it('restaura un fondo personalizado descargándolo de S3', async () => {
    auth.setUser(createTestUser({ background: 'custom:abc' }));
    getBackgroundUrl.mockResolvedValue('blob:test/abc');

    await service.restoreSavedBackground();

    expect(getBackgroundUrl).toHaveBeenCalledWith('abc');
    expect(document.body.style.backgroundImage).toContain('blob:test/abc');
  });

  it('vuelve al fondo por defecto si el fondo personalizado ya no existe', async () => {
    auth.setUser(createTestUser({ background: 'custom:abc' }));
    getBackgroundUrl.mockResolvedValue(null);

    await service.restoreSavedBackground();

    expect(document.body.style.backgroundImage).toContain(DEFAULT_BACKGROUND);
  });

  it('quita el fondo al cerrar sesión', async () => {
    await service.restoreSavedBackground();
    service.reset();
    expect(document.body.style.backgroundImage).toBe('');
  });
});
