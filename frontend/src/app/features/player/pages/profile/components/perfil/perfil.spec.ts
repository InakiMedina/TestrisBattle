import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../../../../core/auth/auth.service';
import { UserFilesService } from '../../../../../../services/user-files.service';
import { UserProfileService } from '../../../../../../services/user-profile.service';
import { createAuthServiceMock, createTestUser } from '../../../../../../../testing/auth-service.mock';
import { Perfil } from './perfil';

describe('Perfil', () => {
  let component: Perfil;
  let fixture: ComponentFixture<Perfil>;
  let auth: ReturnType<typeof createAuthServiceMock>;
  let userFiles: {
    getProfilePictureUrl: ReturnType<typeof vi.fn>;
    uploadProfilePicture: ReturnType<typeof vi.fn>;
    deleteProfilePicture: ReturnType<typeof vi.fn>;
  };
  let userProfile: { updateUsername: ReturnType<typeof vi.fn> };

  async function crear(pictureUrl: string | null): Promise<HTMLElement> {
    userFiles.getProfilePictureUrl.mockResolvedValue(pictureUrl);
    fixture = TestBed.createComponent(Perfil);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    auth = createAuthServiceMock(createTestUser({ username: 'LiliaLag', email: 'lilia@tetris.test', elo: 1450 }));
    userFiles = {
      getProfilePictureUrl: vi.fn(),
      uploadProfilePicture: vi.fn(),
      deleteProfilePicture: vi.fn(),
    };
    userProfile = { updateUsername: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: UserFilesService, useValue: userFiles },
        { provide: UserProfileService, useValue: userProfile },
      ],
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('muestra los datos del usuario que inició sesión', async () => {
    const element = await crear(null);

    expect(element.querySelector('.nombre-real')?.textContent).toContain('LiliaLag');
    expect(element.querySelector('.nombre-jugador')?.textContent).toContain('LiliaLag');
    expect(element.querySelector('.correo-valor')?.textContent).toContain('lilia@tetris.test');
    expect(element.querySelector('.elo-valor')?.textContent).toContain('1450');
  });

  it('muestra la imagen por defecto (SVG) si no hay foto subida', async () => {
    const element = await crear(null);

    expect(element.querySelector('.avatar img')).toBeNull();
    expect(element.querySelector('.avatar svg')).not.toBeNull();
    expect(element.querySelector('.delete-image')).toBeNull();
  });

  it('muestra la foto guardada en S3 y el botón para eliminarla', async () => {
    const element = await crear('blob:test/foto');

    expect(element.querySelector('.avatar img')?.getAttribute('src')).toBe('blob:test/foto');
    expect(element.querySelector('.delete-image')).not.toBeNull();
  });

  it('al eliminar la foto vuelve a la imagen por defecto', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    userFiles.deleteProfilePicture.mockReturnValue(of(createTestUser()));
    const element = await crear('blob:test/foto');

    (element.querySelector('.delete-image') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(userFiles.deleteProfilePicture).toHaveBeenCalled();
    expect(component.imagenPerfil).toBeNull();
    expect(element.querySelector('.avatar svg')).not.toBeNull();
  });

  it('sube una foto nueva y la muestra', async () => {
    await crear(null);
    userFiles.uploadProfilePicture.mockReturnValue(of(createTestUser({ profilePicture: 'k' })));
    userFiles.getProfilePictureUrl.mockResolvedValue('blob:test/nueva');

    const archivo = new File(['img'], 'foto.png', { type: 'image/png' });
    const input = { files: [archivo], value: 'C:\\fakepath\\foto.png' } as unknown as HTMLInputElement;
    component.seleccionarImagen({ target: input } as unknown as Event);
    await fixture.whenStable();

    expect(userFiles.uploadProfilePicture).toHaveBeenCalledWith(archivo);
    expect(component.imagenPerfil).toBe('blob:test/nueva');
  });

  it('rechaza imágenes de más de 2 MB sin subirlas', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    await crear(null);

    const grande = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'grande.png', { type: 'image/png' });
    const input = { files: [grande], value: '' } as unknown as HTMLInputElement;
    component.seleccionarImagen({ target: input } as unknown as Event);

    expect(alert).toHaveBeenCalled();
    expect(userFiles.uploadProfilePicture).not.toHaveBeenCalled();
  });

  describe('edición del nombre de usuario', () => {
    const lapiz = (element: HTMLElement) => element.querySelector('.edit-real') as HTMLButtonElement;
    const campo = (element: HTMLElement) =>
      element.querySelector('.nombre-real-input') as HTMLInputElement | null;

    async function escribir(element: HTMLElement, valor: string): Promise<HTMLInputElement> {
      lapiz(element).click();
      fixture.detectChanges();
      await fixture.whenStable();
      const input = campo(element)!;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      return input;
    }

    const presionar = (input: HTMLInputElement, key: string) => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key }));
      fixture.detectChanges();
    };

    it('muestra el lápiz junto al nombre y abre el campo con el nombre actual', async () => {
      const element = await crear(null);
      expect(lapiz(element)).not.toBeNull();

      lapiz(element).click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(campo(element)?.value).toBe('LiliaLag');
    });

    it('guarda el nombre nuevo con Enter y cierra la edición', async () => {
      userProfile.updateUsername.mockReturnValue(of(createTestUser({ username: 'Lilia_2' })));
      const element = await crear(null);

      presionar(await escribir(element, 'Lilia_2'), 'Enter');

      expect(userProfile.updateUsername).toHaveBeenCalledWith('Lilia_2');
      expect(campo(element)).toBeNull();
    });

    it('cancela con Escape sin guardar', async () => {
      const element = await crear(null);

      presionar(await escribir(element, 'otro'), 'Escape');

      expect(userProfile.updateUsername).not.toHaveBeenCalled();
      expect(campo(element)).toBeNull();
      expect(element.querySelector('.nombre-real span')?.textContent).toContain('LiliaLag');
    });

    it('no envía nada si el nombre no cambió', async () => {
      const element = await crear(null);

      presionar(await escribir(element, 'LiliaLag'), 'Enter');

      expect(userProfile.updateUsername).not.toHaveBeenCalled();
      expect(campo(element)).toBeNull();
    });

    it.each([
      ['a', 'mínimo de 2'],
      ['a'.repeat(21), 'máxima de 20'],
      ['con espacio', 'sin espacios'],
      ['hola!', 'sin espacios'],
    ])('muestra en rojo el error de "%s" sin enviarlo', async (nombre, mensaje) => {
      const element = await crear(null);

      presionar(await escribir(element, nombre), 'Enter');

      expect(userProfile.updateUsername).not.toHaveBeenCalled();
      expect(element.querySelector('.nombre-error')?.textContent).toContain(mensaje);
      expect(campo(element)).not.toBeNull();
    });

    it('muestra el error del backend (por ejemplo, durante una partida)', async () => {
      const mensaje = 'No puedes cambiar tu nombre mientras estás en una partida.';
      userProfile.updateUsername.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409, error: { message: mensaje } })),
      );
      const element = await crear(null);

      presionar(await escribir(element, 'Lilia_2'), 'Enter');

      expect(element.querySelector('.nombre-error')?.textContent).toContain(mensaje);
      expect(campo(element)).not.toBeNull();
    });

    it('borra el error al volver a escribir', async () => {
      const element = await crear(null);
      const input = await escribir(element, 'a');
      presionar(input, 'Enter');
      expect(element.querySelector('.nombre-error')).not.toBeNull();

      input.value = 'ab';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(element.querySelector('.nombre-error')).toBeNull();
    });
  });
});
