import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth/auth.service';
import { createAuthServiceMock, createTestUser } from '../../testing/auth-service.mock';
import { UserProfileService } from './user-profile.service';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let http: HttpTestingController;
  let auth: ReturnType<typeof createAuthServiceMock>;
  const user = createTestUser();

  beforeEach(() => {
    auth = createAuthServiceMock(user);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    service = TestBed.inject(UserProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía el nuevo nombre y actualiza el usuario en sesión', () => {
    service.updateUsername('nuevo_nombre').subscribe();

    const request = http.expectOne(`${environment.apiUrl}/users/${user.id}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ username: 'nuevo_nombre' });
    request.flush(createTestUser({ username: 'nuevo_nombre' }));

    expect(auth.currentUser()?.username).toBe('nuevo_nombre');
  });

  it('no cambia el usuario en sesión si el backend rechaza el nombre', () => {
    service.updateUsername('repetido').subscribe({ error: () => undefined });

    http
      .expectOne(`${environment.apiUrl}/users/${user.id}`)
      .flush({ message: 'El nombre de usuario ya está en uso' }, { status: 409, statusText: 'Conflict' });

    expect(auth.currentUser()?.username).toBe(user.username);
  });
});
