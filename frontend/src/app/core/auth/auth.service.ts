import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_UNAUTHORIZED_HANDLING } from '../http/http-context';
import { NotificationService } from '../notifications/notification.service';
import type {
  AuthResponse,
  IAuthUser,
  LoginCredentials,
  MeResponse,
  RegisterData,
  Role,
} from './auth.models';

const TOKEN_KEY = 'tetris_token';
const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró o ya no es válida. Inicia sesión de nuevo.';
const PUBLIC_ROUTES = ['/login', '/signin'];
const MAX_TIMER_MS = 2_000_000_000; // setTimeout no admite retrasos mayores a ~24 días

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Sin almacenamiento disponible: la sesión vive solo en memoria
  }
}

function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nada que limpiar
  }
}

// Lee el "exp" del JWT (en milisegundos) sin verificar la firma: la verificación
// real la hace el backend. Aquí solo sirve para saber cuándo cerrar la sesión.
function getTokenExpiry(token: string): number | null {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  private readonly tokenState = signal<string | null>(readStoredToken());
  private readonly userState = signal<IAuthUser | null>(null);
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);
  readonly role = computed<Role | null>(() => this.userState()?.role ?? null);

  token(): string | null {
    return this.tokenState();
  }

  hasRole(roles: Role | readonly Role[]): boolean {
    const role = this.userState()?.role;
    if (!role) return false;
    return typeof roles === 'string' ? roles === role : roles.includes(role);
  }

  login(credentials: LoginCredentials): Observable<IAuthUser> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials, {
        context: this.skipUnauthorizedContext(),
      })
      .pipe(
        tap(({ token, user }) => this.startSession(token, user)),
        map(({ user }) => user),
      );
  }

  register(data: RegisterData): Observable<IAuthUser> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data, {
        context: this.skipUnauthorizedContext(),
      })
      .pipe(
        tap(({ token, user }) => this.startSession(token, user)),
        map(({ user }) => user),
      );
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  // Se ejecuta antes del primer render (provideAppInitializer) para que, al recargar,
  // los guardias ya encuentren al usuario cargado. Nunca falla: si algo sale mal,
  // simplemente no hay sesión.
  restoreSession(): Observable<void> {
    const token = this.tokenState();
    if (!token) return of(undefined);

    const expiry = getTokenExpiry(token);
    if (expiry !== null && expiry <= Date.now()) {
      this.clearSession();
      this.notifications.info(SESSION_EXPIRED_MESSAGE);
      return of(undefined);
    }

    return this.http
      .get<MeResponse>(`${environment.apiUrl}/auth/me`, {
        context: this.skipUnauthorizedContext(),
      })
      .pipe(
        tap(({ user }) => this.startSession(token, user)),
        map(() => undefined),
        catchError((error: unknown) => {
          this.clearSession();
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.notifications.info(SESSION_EXPIRED_MESSAGE);
          }
          return of(undefined);
        }),
      );
  }

  // Lo usa el errorInterceptor ante un 401 en una ruta protegida
  // y el temporizador cuando el token llega a su expiración.
  handleSessionExpired(): void {
    if (!this.tokenState() && !this.userState()) return; // ya se limpió (varios 401 seguidos)

    const currentUrl = this.router.url;
    const isPublic = PUBLIC_ROUTES.some((route) => currentUrl.startsWith(route));

    this.clearSession();
    this.notifications.info(SESSION_EXPIRED_MESSAGE);
    void this.router.navigate(['/login'], {
      queryParams: isPublic ? {} : { returnUrl: currentUrl },
    });
  }

  private startSession(token: string, user: IAuthUser): void {
    storeToken(token);
    this.tokenState.set(token);
    this.userState.set(user);
    this.scheduleExpiry(token);
  }

  private clearSession(): void {
    this.clearTimer();
    removeStoredToken();
    this.tokenState.set(null);
    this.userState.set(null);
  }

  private scheduleExpiry(token: string): void {
    this.clearTimer();
    const expiry = getTokenExpiry(token);
    if (expiry === null) return;

    const delay = expiry - Date.now();
    if (delay <= 0) {
      this.handleSessionExpired();
      return;
    }
    this.expiryTimer = setTimeout(() => this.scheduleExpiry(token), Math.min(delay, MAX_TIMER_MS));
  }

  private clearTimer(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private skipUnauthorizedContext(): HttpContext {
    return new HttpContext().set(SKIP_UNAUTHORIZED_HANDLING, true);
  }
}
