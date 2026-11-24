import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { io, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@shared/types/realtime.types';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
type ServerEvent = keyof ServerToClientEvents;
type ServerPayload<E extends ServerEvent> = Parameters<ServerToClientEvents[E]>[0];

/** Eventos del cliente que esperan respuesta (acknowledgement) del servidor. */
type RequestEvent = {
  [E in keyof ClientToServerEvents]: Parameters<ClientToServerEvents[E]> extends [infer Ack]
    ? Ack extends (res: never) => void
      ? E
      : never
    : never;
}[keyof ClientToServerEvents];
type RequestResponse<E extends RequestEvent> = Parameters<Parameters<ClientToServerEvents[E]>[0]>[0];

/** Eventos del cliente que solo envían datos (sin respuesta). */
type SendEvent = Exclude<keyof ClientToServerEvents, RequestEvent>;

const REQUEST_TIMEOUT_MS = 5_000;
const UNAUTHORIZED_CODE = 'UNAUTHORIZED';
export const OFFLINE_MESSAGE = 'Sin conexión con el servidor. Reintentando…';

/** Error que se lanza al intentar una acción en tiempo real sin conexión. */
export class OfflineError extends Error {
  constructor() {
    super(OFFLINE_MESSAGE);
    this.name = 'OfflineError';
  }
}

/**
 * Única conexión Socket.IO de toda la aplicación.
 *
 * - Se abre sola cuando hay sesión iniciada y se cierra al cerrar sesión
 *   (escucha el estado de AuthService con un `effect`).
 * - Envía el JWT en el handshake (`auth.token`).
 * - Reconecta automáticamente y expone el estado de la conexión como signal.
 * - Los componentes nunca tocan el socket: usan `on()`, `request()` y `send()`.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly auth = inject(AuthService);

  private socket: AppSocket | null = null;
  private readonly statusState = signal<ConnectionStatus>('disconnected');
  private readonly incoming$ = new Subject<{ event: string; payload: unknown }>();
  private readonly connected$ = new Subject<void>();

  /** Estado de la conexión: connecting, connected, reconnecting o disconnected. */
  readonly status = this.statusState.asReadonly();
  readonly isConnected = computed(() => this.statusState() === 'connected');

  /** Emite cada vez que se establece la conexión (la primera vez y en cada reconexión). */
  readonly onConnect: Observable<void> = this.connected$.asObservable();

  constructor() {
    // Abrir/cerrar la conexión según la sesión.
    effect(() => {
      const loggedIn = this.auth.isAuthenticated();
      untracked(() => (loggedIn ? this.connect() : this.disconnect()));
    });
  }

  /** Escucha un evento del servidor. La suscripción se limpia al hacer unsubscribe. */
  on<E extends ServerEvent>(event: E): Observable<ServerPayload<E>> {
    return this.incoming$.pipe(
      filter((message) => message.event === event),
      map((message) => message.payload as ServerPayload<E>),
    );
  }

  /** Envía un evento que espera respuesta. Falla con OfflineError si no hay conexión. */
  async request<E extends RequestEvent>(event: E): Promise<RequestResponse<E>> {
    const socket = this.socket;
    if (!socket?.connected) throw new OfflineError();
    // Los tipos genéricos de Socket.IO no se pueden indexar por un nombre de evento
    // genérico; el contrato real ya está garantizado por RequestEvent/RequestResponse.
    const withTimeout = socket.timeout(REQUEST_TIMEOUT_MS) as unknown as {
      emitWithAck(ev: string): Promise<unknown>;
    };
    try {
      return (await withTimeout.emitWithAck(event)) as RequestResponse<E>;
    } catch {
      throw new Error('El servidor no respondió a tiempo. Intenta de nuevo.');
    }
  }

  /**
   * Envía un evento sin respuesta. Devuelve false si no hay conexión.
   * Con `buffered` el mensaje se guarda y se envía al reconectar; sin él se descarta
   * (útil para datos que cambian seguido, como el puntaje, que se reenvía al resincronizar).
   */
  send<E extends SendEvent>(
    event: E,
    payload: Parameters<ClientToServerEvents[E]>[0],
    options: { buffered?: boolean } = {},
  ): boolean {
    const socket = this.socket;
    if (!socket) return false;
    const target = options.buffered ? socket : socket.volatile;
    (target.emit as (ev: E, data: typeof payload) => void)(event, payload);
    return socket.connected;
  }

  /** Reintento manual cuando la conexión quedó cerrada (por ejemplo, el servidor la rechazó). */
  reconnect(): void {
    if (!this.auth.isAuthenticated()) return;
    if (this.socket && !this.socket.connected) {
      this.statusState.set('connecting');
      this.socket.connect();
    } else if (!this.socket) {
      this.connect();
    }
  }

  private connect(): void {
    if (this.socket) return; // una sola conexión para toda la app

    const socket: AppSocket = io(environment.socketUrl, {
      // Se evalúa en cada intento, así las reconexiones usan el token vigente.
      auth: (cb) => cb({ token: this.auth.token() }),
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
    });
    this.socket = socket;
    this.statusState.set('connecting');

    socket.on('connect', () => {
      this.statusState.set('connected');
      this.connected$.next();
    });

    socket.on('disconnect', () => {
      // socket.active === true: Socket.IO intentará reconectar por su cuenta.
      this.statusState.set(socket.active ? 'reconnecting' : 'disconnected');
    });

    socket.on('connect_error', (error: Error & { data?: { code?: string } }) => {
      if (error.data?.code === UNAUTHORIZED_CODE) {
        // El servidor rechazó el token: misma reacción que un 401 en HTTP.
        this.disconnect();
        this.auth.handleSessionExpired();
        return;
      }
      this.statusState.set(socket.active ? 'reconnecting' : 'disconnected');
    });

    socket.io.on('reconnect_attempt', () => this.statusState.set('reconnecting'));

    // Reenvía todos los eventos del servidor al stream interno.
    socket.onAny((event: string, payload: unknown) => this.incoming$.next({ event, payload }));
  }

  private disconnect(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.io.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.statusState.set('disconnected');
  }
}
