import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@shared/types/realtime.types';
import config from '../config/config';
import { authenticateToken } from '../services/token.service';
import { HttpError } from '../types/httpError';
import { MatchManager } from './match.manager';

// Instancia única del gestor de partidas (null hasta que se monta Socket.IO).
let matchManager: MatchManager | null = null;

/** Indica si el usuario está en la cola de búsqueda o en una partida sin terminar. */
export function isUserInMatchOrQueue(userId: string): boolean {
  return matchManager?.isBusy(userId) ?? false;
}

/** Código que recibe el cliente en `connect_error` cuando el token no es válido. */
export const UNAUTHORIZED_CODE = 'UNAUTHORIZED';

// Monta Socket.IO sobre el mismo servidor HTTP de Express (mismo puerto).
// Cada conexión debe enviar el JWT en `auth.token` durante el handshake.
export function setupRealtime(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    { cors: { origin: config.corsOrigin } },
  );

  io.use(async (socket, next) => {
    const token: unknown = socket.handshake.auth?.['token'];
    if (typeof token !== 'string' || !token) {
      return next(unauthorized('Debes iniciar sesión'));
    }
    try {
      const user = await authenticateToken(token);
      socket.data.user = {
        id: user.id,
        username: user.username,
        high: user.stats.highest_score_rank,
      };
      socket.data.role = user.role;
      next();
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        return next(unauthorized(error.message));
      }
      console.error('[realtime] Error en el handshake:', error);
      next(new Error('Error interno del servidor'));
    }
  });

  const matches = new MatchManager(io);
  matchManager = matches;
  io.on('connection', (socket) => matches.register(socket));

  return io;
}

function unauthorized(message: string): Error {
  const error = new Error(message) as Error & { data?: unknown };
  error.data = { code: UNAUTHORIZED_CODE };
  return error;
}
