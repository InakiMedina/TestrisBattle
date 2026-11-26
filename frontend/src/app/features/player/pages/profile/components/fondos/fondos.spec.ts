import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '../../../../../../core/auth/auth.service';
import { BackgroundHandler, DEFAULT_BACKGROUND } from '../../../../../../services/background-handler';
import { UserFilesService } from '../../../../../../services/user-files.service';
import {
  createAuthServiceMock,
  createTestUser,
  stubObjectUrls,
} from '../../../../../../../testing/auth-service.mock';
import { Fondos } from './fondos';

describe('Fondos', () => {
  let component: Fondos;
  let fixture: ComponentFixture<Fondos>;
  let auth: ReturnType<typeof createAuthServiceMock>;
  let userFiles: Record<string, ReturnType<typeof vi.fn>>;
  const changeBackground = vi.fn();

  const fondosDeUsuario = (cantidad: number) =>
    Array.from({ length: cantidad }, (_, i) => ({
      id: `bg${i}`,
      createdAt: new Date(2026, 0, i + 1).toISOString(),
    }));

  async function crear(): Promise<HTMLElement> {
    fixture = TestBed.createComponent(Fondos);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    // Espera a que terminen las descargas simuladas de los fondos.
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    stubObjectUrls();
    auth = createAuthServiceMock();
    changeBackground.mockReset();
    userFiles = {
      currentBackgroundIds: vi.fn(() =>
        [...(auth.currentUser()?.customBackgrounds ?? [])].reverse().map((b) => b.id),
      ),
      getBackgroundUrl: vi.fn((id: string) => Promise.resolve(`blob:test/${id}`)),
      cacheBackground: vi.fn((id: string) => `blob:test/${id}`),
      saveSelectedBackground: vi.fn(() => of(createTestUser())),
      uploadBackground: vi.fn(),
      deleteBackground: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Fondos],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: UserFilesService, useValue: userFiles },
        { provide: BackgroundHandler, useValue: { changeBackground } },
      ],
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('muestra solo los 6 fondos por defecto si el usuario no tiene fondos', async () => {
    const element = await crear();

    const imagenes = [...element.querySelectorAll('.fondos-grid img')].map((img) => img.getAttribute('src'));
    expect(imagenes).toHaveLength(6);
    expect(imagenes).toContain(DEFAULT_BACKGROUND);
    expect(imagenes).not.toContain('/backgrounds/bg_3.webp');
    expect(element.querySelector('.eliminar-fondo')).toBeNull();
  });

  it('selecciona city_image.jpg si el usuario no tiene fondo guardado', async () => {
    await crear();
    expect(component.fondoSeleccionado).toBe(DEFAULT_BACKGROUND);
  });

  it('muestra los fondos subidos junto con los predeterminados y marca el guardado', async () => {
    auth.setUser(createTestUser({ customBackgrounds: fondosDeUsuario(2), background: 'custom:bg1' }));
    const element = await crear();

    expect(element.querySelectorAll('.fondos-grid img')).toHaveLength(8);
    expect(element.querySelectorAll('.eliminar-fondo')).toHaveLength(2);
    expect(element.querySelector('.fondo-card.seleccionado img')?.getAttribute('src')).toBe('blob:test/bg1');
  });

  it('si S3 no está disponible muestra solo los predeterminados y un aviso', async () => {
    auth.setUser(createTestUser({ customBackgrounds: fondosDeUsuario(2) }));
    userFiles['getBackgroundUrl']!.mockRejectedValue(new HttpErrorResponse({ status: 503 }));
    const element = await crear();

    expect(element.querySelectorAll('.fondos-grid img')).toHaveLength(6);
    expect(component.mensajeImagen).toContain('no están disponibles');
  });

  it('guarda en el perfil el fondo seleccionado', async () => {
    await crear();

    component.seleccionarFondo('/backgrounds/bg_4.jpg');

    expect(changeBackground).toHaveBeenCalledWith('/backgrounds/bg_4.jpg');
    expect(userFiles['saveSelectedBackground']).toHaveBeenCalledWith('/backgrounds/bg_4.jpg');
  });

  it('no permite subir más de 6 fondos', async () => {
    auth.setUser(createTestUser({ customBackgrounds: fondosDeUsuario(6) }));
    const element = await crear();

    expect(component.limiteAlcanzado).toBe(true);
    expect(element.querySelector('.seleccionar-fondo-personalizado')).toBeNull();
    expect(element.querySelector('.zona-subida')?.textContent).toContain('Ya tienes 6 fondos');
  });

  it('sube un fondo, lo agrega a la lista y lo aplica', async () => {
    await crear();
    const updated = createTestUser({
      background: 'custom:nuevo',
      customBackgrounds: [{ id: 'nuevo', createdAt: new Date().toISOString() }],
    });
    userFiles['uploadBackground']!.mockReturnValue(
      of(
        { type: HttpEventType.UploadProgress, loaded: 50, total: 100 },
        new HttpResponse({ body: { backgroundId: 'nuevo', user: updated } }),
      ),
    );

    const archivo = new File(['img'], 'fondo.png', { type: 'image/png' });
    const input = { files: [archivo], value: '' } as unknown as HTMLInputElement;
    component.seleccionarImagen({ target: input } as unknown as Event);
    component.confirmarSubida();

    expect(component.fondosPersonalizados.map((f) => f.id)).toEqual(['nuevo']);
    expect(component.fondoSeleccionado).toBe('custom:nuevo');
    expect(changeBackground).toHaveBeenCalledWith('custom:nuevo');
    expect(component.mensajeImagen).toBe('Imagen cargada correctamente.');
  });

  it('al eliminar el fondo seleccionado vuelve al fondo por defecto', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    auth.setUser(createTestUser({ customBackgrounds: fondosDeUsuario(1), background: 'custom:bg0' }));
    userFiles['deleteBackground']!.mockReturnValue(of(createTestUser({ background: '' })));
    await crear();

    component.eliminarFondoPersonalizado('bg0');

    expect(userFiles['deleteBackground']).toHaveBeenCalledWith('bg0');
    expect(component.fondosPersonalizados).toHaveLength(0);
    expect(component.fondoSeleccionado).toBe(DEFAULT_BACKGROUND);
    expect(changeBackground).toHaveBeenCalledWith(DEFAULT_BACKGROUND);
  });
});
