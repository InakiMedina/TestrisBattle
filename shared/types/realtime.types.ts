// Contrato de eventos de tiempo real (Socket.IO) del modo 1 vs 1.
// Lo comparten el backend (servidor) y el frontend (cliente) para que ambos
// lados usen exactamente los mismos nombres de eventos y payloads.
// Solo contiene tipos: se importa con `import type` y no genera código.

/** Puntaje que un jugador reporta durante la partida. */
export interface PlayerStats {
  score: number;
  level: number;
  lines: number;
}

/** Fase de la partida. */
export type MatchPhase =
  | 'waiting' // emparejados, esperando a que ambos estén listos
  | 'countdown' // ambos listos, cuenta regresiva antes de iniciar
  | 'playing' // partida en curso
  | 'finished'; // partida terminada

/** Por qué terminó la partida. */
export type MatchEndReason =
  | 'topped-out' // un jugador llenó su tablero
  | 'forfeit' // un jugador abandonó la partida
  | 'disconnected'; // un jugador no volvió a conectarse a tiempo

/** Estado de un jugador dentro de la partida. */
export interface MatchPlayer {
  id: string;
  username: string;
  /** Mejor puntaje en partidas clasificatorias (stats.highest_score_rank). */
  high: number;
  connected: boolean;
  ready: boolean;
  finished: boolean;
  stats: PlayerStats;
}

export interface MatchResult {
  /** null si no hay ganador (empate). */
  winnerId: string | null;
  reason: MatchEndReason;
}

/** Fotografía completa de la partida vista por un jugador. */
export interface MatchSnapshot {
  matchId: string;
  phase: MatchPhase;
  /** Momento (epoch ms, reloj del servidor) en el que inicia la partida. */
  startsAt: number | null;
  /** Hora del servidor al generar la fotografía (para compensar diferencias de reloj). */
  serverTime: number;
  you: MatchPlayer;
  opponent: MatchPlayer;
  result: MatchResult | null;
}

/** Respuesta de `match:sync`: en qué situación está el usuario. */
export type SyncResponse =
  | { status: 'idle' }
  | { status: 'queued' }
  | { status: 'in-match'; match: MatchSnapshot };

/** Respuesta genérica (acknowledgement) de las acciones del cliente. */
export type AckResponse = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Eventos que ENVÍA el cliente y RECIBE el servidor
// ---------------------------------------------------------------------------
export interface ClientToServerEvents {
  /** Entrar a la cola de búsqueda de rival. */
  'queue:join': (ack: (res: AckResponse) => void) => void;
  /** Salir de la cola de búsqueda. */
  'queue:leave': (ack: (res: AckResponse) => void) => void;
  /** Marcarse como listo dentro de la partida. */
  'match:ready': (ack: (res: AckResponse) => void) => void;
  /** Enviar el puntaje actual (se envía cada vez que cambia). */
  'game:update': (stats: PlayerStats) => void;
  /** Avisar que el tablero se llenó (el jugador pierde). */
  'game:over': (stats: PlayerStats) => void;
  /** Abandonar la partida (cuenta como derrota). */
  'match:leave': (ack: (res: AckResponse) => void) => void;
  /** Pedir el estado actual; se usa al entrar a la vista y al reconectar. */
  'match:sync': (ack: (res: SyncResponse) => void) => void;
}

// ---------------------------------------------------------------------------
// Eventos que ENVÍA el servidor y RECIBE el cliente
// ---------------------------------------------------------------------------
export interface ServerToClientEvents {
  /** Se encontró rival y se creó la partida. */
  'match:found': (match: MatchSnapshot) => void;
  /** El rival cambió su estado de "listo". */
  'opponent:ready': (payload: { ready: boolean }) => void;
  /** El rival se desconectó o se reconectó. */
  'opponent:connection': (payload: { connected: boolean }) => void;
  /** Ambos están listos: la partida inicia en `startsAt`. */
  'match:start': (payload: { startsAt: number; serverTime: number }) => void;
  /** El rival actualizó su puntaje. */
  'opponent:update': (stats: PlayerStats) => void;
  /** La partida terminó. */
  'match:end': (payload: { result: MatchResult; you: PlayerStats; opponent: PlayerStats }) => void;
}

/** Datos que el servidor guarda en cada socket autenticado. */
export interface SocketData {
  user: { id: string; username: string; high: number };
  role: 'admin' | 'usuario';
}
