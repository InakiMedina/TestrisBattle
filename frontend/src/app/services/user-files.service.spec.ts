import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth/auth.service';
import {
  createAuthServiceMock,
  createTestUser,
  stubObjectUrls,
} from '../../testing/auth-service.mock';
import { SKIP_SERVER_ERROR_NOTIFICATION } from '../core/http/http-context';
import { UserFilesService, getFileErrorMessage, uploadProgress } from './user-files.service';

describe('UserFilesService', () => {
  let service: UserFilesService;
  let http: HttpTestingController;
  let auth: ReturnType<typeof createAuthServiceMock>;
  let urls: ReturnType<typeof stubObjectUrls>;
  const user = createTestUser();
  const base = `${environment.apiUrl}/users/${user.id}`;

  beforeEach(() => {
    urls = stubObjectUrls();
    auth = createAuthServiceMock(user);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    service = TestBed.inject(UserFilesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('no pide la foto si el usuario no tiene una (se usa la imagen por defecto)', async () => {
    expect(await service.getProfilePictureUrl()).toBeNull();
    http.expectNone(`${base}/profile-picture`);
  });

  it('descarga la foto de perfil una sola vez y la guarda en caché', async () => {
    auth.setUser(createTestUser({ profilePicture: 'users/x/profile/a.png' }));

    const first = service.getProfilePictureUrl();
    http.expectOne(`${base}/profile-picture`).flush(new Blob(['img']));
    const url = await first;

    expect(url).toBe(urls.created[0]);
    expect(await service.getProfilePictureUrl()).toBe(url);
  });

  it('devuelve null si la foto ya no existe en S3 (404)', async () => {
    auth.setUser(createTestUser({ profilePicture: 'users/x/profile/a.png' }));

    const pending = service.getProfilePictureUrl();
    http
      .expectOne(`${base}/profile-picture`)
      .flush(new Blob(), { status: 404, statusText: 'Not Found' });

    expect(await pending).toBeNull();
  });

  it('devuelve null si el almacenamiento no está disponible (503) para usar la imagen por defecto', async () => {
    auth.setUser(createTestUser({ profilePicture: 'users/x/profile/a.png' }));

    const pending = service.getProfilePictureUrl();
    const request = http.expectOne(`${base}/profile-picture`);
    // No debe mostrarse el banner global de error del servidor.
    expect(request.request.context.get(SKIP_SERVER_ERROR_NOTIFICATION)).toBe(true);
    request.flush(new Blob(), { status: 503, statusText: 'Service Unavailable' });

    expect(await pending).toBeNull();
  });

  it('sube la foto de perfil como multipart y actualiza el usuario', () => {
    const updated = createTestUser({ profilePicture: 'users/x/profile/b.png' });
    service.uploadProfilePicture(new File(['img'], 'foto.png', { type: 'image/png' })).subscribe();

    const request = http.expectOne(`${base}/profile-picture`);
    expect(request.request.method).toBe('PUT');
    expect((request.request.body as FormData).get('image')).toBeInstanceOf(File);
    request.flush(updated);

    expect(auth.currentUser()?.profilePicture).toBe('users/x/profile/b.png');
  });

  it('elimina la foto de perfil', () => {
    auth.setUser(createTestUser({ profilePicture: 'users/x/profile/a.png' }));
    service.deleteProfilePicture().subscribe();

    const request = http.expectOne(`${base}/profile-picture`);
    expect(request.request.method).toBe('DELETE');
    request.flush(createTestUser());

    expect(auth.currentUser()?.profilePicture).toBe('');
  });

  it('descarga cada fondo una sola vez aunque se pida varias veces a la vez', async () => {
    const a = service.getBackgroundUrl('bg1');
    const b = service.getBackgroundUrl('bg1');
    http.expectOne(`${base}/backgrounds/bg1`).flush(new Blob(['img']));

    expect(await a).toBe(await b);
    expect(await service.getBackgroundUrl('bg1')).toBe(await a);
  });

  it('sube un fondo y actualiza el usuario al terminar', () => {
    const updated = createTestUser({
      background: 'custom:bg2',
      customBackgrounds: [{ id: 'bg2', createdAt: '2026-01-01T00:00:00.000Z' }],
    });
    const events: number[] = [];
    service
      .uploadBackground(new File(['img'], 'fondo.png', { type: 'image/png' }))
      .subscribe((event) => events.push(event.type));

    const request = http.expectOne(`${base}/backgrounds`);
    expect(request.request.method).toBe('POST');
    request.flush({ backgroundId: 'bg2', user: updated });

    expect(events).toContain(HttpEventType.Response);
    expect(auth.currentUser()?.background).toBe('custom:bg2');
  });

  it('elimina un fondo y libera su URL', async () => {
    const pending = service.getBackgroundUrl('bg1');
    http.expectOne(`${base}/backgrounds/bg1`).flush(new Blob(['img']));
    const url = await pending;

    service.deleteBackground('bg1').subscribe();
    const request = http.expectOne(`${base}/backgrounds/bg1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(createTestUser());

    expect(urls.revoked).toContain(url);
  });

  it('guarda el fondo seleccionado en el perfil', () => {
    service.saveSelectedBackground('/backgrounds/bg_1.jpg').subscribe();

    const request = http.expectOne(base);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ background: '/backgrounds/bg_1.jpg' });
    request.flush(createTestUser({ background: '/backgrounds/bg_1.jpg' }));

    expect(auth.currentUser()?.background).toBe('/backgrounds/bg_1.jpg');
  });

  it('ordena los fondos del más reciente al más antiguo', () => {
    auth.setUser(
      createTestUser({
        customBackgrounds: [
          { id: 'viejo', createdAt: '2026-01-01T00:00:00.000Z' },
          { id: 'nuevo', createdAt: '2026-02-01T00:00:00.000Z' },
        ],
      }),
    );
    expect(service.currentBackgroundIds()).toEqual(['nuevo', 'viejo']);
  });

  it('usa el mensaje del backend cuando el almacenamiento no está disponible', () => {
    const error = new HttpErrorResponse({ status: 503, error: { message: 'Sin S3' } });
    expect(getFileErrorMessage(error, 'otro')).toBe('Sin S3');
    expect(getFileErrorMessage(new HttpErrorResponse({ status: 500 }), 'otro')).toBe('otro');
  });

  it('calcula el porcentaje de subida', () => {
    expect(uploadProgress({ type: HttpEventType.UploadProgress, loaded: 50, total: 200 })).toBe(25);
    expect(uploadProgress({ type: HttpEventType.Sent })).toBeNull();
  });
});
