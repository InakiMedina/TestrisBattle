import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SKIP_SERVER_ERROR_NOTIFICATION } from '../http/http-context';
import { NotificationService } from '../notifications/notification.service';
import { AuthService } from './auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  const error = vi.fn();

  beforeEach(() => {
    error.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: { error, info: vi.fn() } },
        { provide: AuthService, useValue: { handleSessionExpired: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('muestra el banner global ante un error 5xx', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    controller.expectOne('/api/x').flush({}, { status: 503, statusText: 'Service Unavailable' });
    expect(error).toHaveBeenCalled();
  });

  it('no muestra el banner si la petición lo maneja por su cuenta (archivos de S3)', () => {
    const context = new HttpContext().set(SKIP_SERVER_ERROR_NOTIFICATION, true);
    http.get('/api/x', { context }).subscribe({ error: () => undefined });
    controller.expectOne('/api/x').flush({}, { status: 503, statusText: 'Service Unavailable' });
    expect(error).not.toHaveBeenCalled();
  });
});
