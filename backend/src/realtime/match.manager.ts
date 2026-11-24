import { randomUUID } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import type {
  AckResponse,
  ClientToServerEvents,
  MatchPhase,
  MatchPlayer,
  MatchResult,
  MatchSnapshot,
  PlayerStats,
  ServerToClientEvents,
  SocketData,
  SyncResponse,
} from '@shared/types/realtime.types';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/** Segundos de cuenta regresiva cuando ambos jugadores están listos. */
const COUNTDOWN_MS = 3_000;
/** Tiempo que se espera a que un jugador desconectado vuelva antes de darle la partida por perdida. */
const RECONNECT_GRACE_MS = 30_000;
/** Tiempo que una partida terminada se conserva en memoria para que `match:sync` pueda mostrar el resultado. */
const FINISHED_RETENTION_MS = 2 * 60_000;
/** Límite superior razonable para los valores reportados por el cliente. */
const MAX_STAT_VALUE = 100_000_000;

interface Match {
  id: string;
  phase: MatchPhase;
  startsAt: number | null;
  players: [MatchPlayer, MatchPlayer];
  result: MatchResult | null;
  timers: Set<ReturnType<typeof setTimeout>>;
}

const emptyStats = (): PlayerStats => ({ score: 0, level: 0, lines: 0 });

/** Room de Socket.IO con todas las pestañas/conexiones de un mismo usuario. */
const userRoom = (userId: string) => `user:${userId}`;

function sanitizeStats(input: unknown): PlayerStats | null {
  if (typeof input !== 'object' || input === null) return null;
  const { score, level, lines } = input as Record<string, unknown>;
  const clean = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_STAT_VALUE
      ? Math.floor(value)
      : null;
  const s = clean(score);
  const lv = clean(level);
  const ln = clean(lines);
  if (s === null || lv === null || ln === null) return null;
  return { score: s, level: lv, lines: ln };
}

/**
 * Lleva la cola de búsqueda y las partidas 1 vs 1 en memoria.
 * Los jugadores se identifican por su id de usuario (no por socket), así una
 * reconexión o una segunda pestaña recuperan la misma partida.
 */
export class MatchManager {
  private readonly queue: string[] = [];
  private readonly queuedUsers = new Map<string, SocketData['user']>();
  private readonly matches = new Map<string, Match>();
  private readonly matchByUser = new Map<string, string>();
  private readonly connectionCount = new Map<string, number>();
  private readonly graceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly io: IoServer) {}

  register(socket: IoSocket): void {
    const user = socket.data.user;
    void socket.join(userRoom(user.id));
    this.onConnected(user.id);

    socket.on('queue:join', (ack) => this.safeAck(ack, () => this.joinQueue(socket)));
    socket.on('queue:leave', (ack) => this.safeAck(ack, () => this.leaveQueue(user.id)));
    socket.on('match:ready', (ack) => this.safeAck(ack, () => this.setReady(user.id)));
    socket.on('match:leave', (ack) => this.safeAck(ack, () => this.leaveMatch(user.id)));
    socket.on('game:update', (stats) => this.updateStats(user.id, stats));
    socket.on('game:over', (stats) => this.gameOver(user.id, stats));
    socket.on('match:sync', (ack) => {
      if (typeof ack === 'function') ack(this.sync(user.id));
    });

    socket.on('disconnect', () => this.onDisconnected(user.id));
  }

  // -------------------------------------------------------------------------
  // Conexión
  // -------------------------------------------------------------------------

  private onConnected(userId: string): void {
    const count = (this.connectionCount.get(userId) ?? 0) + 1;
    this.connectionCount.set(userId, count);
    if (count > 1) return; // otra pestaña del mismo usuario ya estaba conectada

    const grace = this.graceTimers.get(userId);
    if (grace) {
      clearTimeout(grace);
      this.graceTimers.delete(userId);
    }

    const match = this.activeMatchOf(userId);
    if (!match) return;
    const { me, opponent } = this.sides(match, userId);
    me.connected = true;
    this.io.to(userRoom(opponent.id)).emit('opponent:connection', { connected: true });
  }

  private onDisconnected(userId: string): void {
    const count = (this.connectionCount.get(userId) ?? 1) - 1;
    if (count > 0) {
      this.connectionCount.set(userId, count);
      return;
    }
    this.connectionCount.delete(userId);
    this.removeFromQueue(userId);

    const match = this.activeMatchOf(userId);
    if (!match) return;
    const { me, opponent } = this.sides(match, userId);
    me.connected = false;
    this.io.to(userRoom(opponent.id)).emit('opponent:connection', { connected: false });

    // Si no vuelve a tiempo, pierde la partida.
    const timer = setTimeout(() => {
      this.graceTimers.delete(userId);
      const current = this.activeMatchOf(userId);
      if (current) this.endMatch(current, opponent.id, 'disconnected');
    }, RECONNECT_GRACE_MS);
    this.graceTimers.set(userId, timer);
  }

  private isOnline(userId: string): boolean {
    return (this.connectionCount.get(userId) ?? 0) > 0;
  }

  // -------------------------------------------------------------------------
  // Cola y emparejamiento
  // -------------------------------------------------------------------------

  private joinQueue(socket: IoSocket): AckResponse {
    const user = socket.data.user;
    if (socket.data.role !== 'usuario') {
      return { ok: false, error: 'Solo los jugadores pueden buscar partida.' };
    }
    if (this.activeMatchOf(user.id)) {
      return { ok: false, error: 'Ya estás en una partida.' };
    }
    this.forgetFinishedMatch(user.id);

    if (!this.queue.includes(user.id)) this.queue.push(user.id);
    this.queuedUsers.set(user.id, user);
    this.tryPair();
    return { ok: true };
  }

  private leaveQueue(userId: string): AckResponse {
    this.removeFromQueue(userId);
    return { ok: true };
  }

  private removeFromQueue(userId: string): void {
    const index = this.queue.indexOf(userId);
    if (index >= 0) this.queue.splice(index, 1);
    this.queuedUsers.delete(userId);
  }

  private tryPair(): void {
    while (this.queue.length >= 2) {
      const firstId = this.queue.shift()!;
      const secondId = this.queue.shift()!;
      const first = this.queuedUsers.get(firstId);
      const second = this.queuedUsers.get(secondId);
      this.queuedUsers.delete(firstId);
      this.queuedUsers.delete(secondId);
      if (!first || !second) continue;
      this.createMatch(first, second);
    }
  }

  private createMatch(a: SocketData['user'], b: SocketData['user']): void {
    const toPlayer = (u: SocketData['user']): MatchPlayer => ({
      id: u.id,
      username: u.username,
      high: u.high,
      connected: this.isOnline(u.id),
      ready: false,
      finished: false,
      stats: emptyStats(),
    });

    const match: Match = {
      id: randomUUID(),
      phase: 'waiting',
      startsAt: null,
      players: [toPlayer(a), toPlayer(b)],
      result: null,
      timers: new Set(),
    };
    this.matches.set(match.id, match);
    this.matchByUser.set(a.id, match.id);
    this.matchByUser.set(b.id, match.id);

    for (const player of match.players) {
      this.io.to(userRoom(player.id)).emit('match:found', this.snapshot(match, player.id));
    }
  }

  // -------------------------------------------------------------------------
  // Partida
  // -------------------------------------------------------------------------

  private setReady(userId: string): AckResponse {
    const match = this.activeMatchOf(userId);
    if (!match) return { ok: false, error: 'No estás en una partida.' };
    if (match.phase !== 'waiting') return { ok: true };

    const { me, opponent } = this.sides(match, userId);
    me.ready = true;
    this.io.to(userRoom(opponent.id)).emit('opponent:ready', { ready: true });

    if (opponent.ready) {
      match.phase = 'countdown';
      match.startsAt = Date.now() + COUNTDOWN_MS;
      for (const player of match.players) {
        this.io
          .to(userRoom(player.id))
          .emit('match:start', { startsAt: match.startsAt, serverTime: Date.now() });
      }
      this.schedule(match, COUNTDOWN_MS, () => {
        if (match.phase === 'countdown') match.phase = 'playing';
      });
    }
    return { ok: true };
  }

  private updateStats(userId: string, input: unknown): void {
    const match = this.activeMatchOf(userId);
    if (!match || !this.acceptsGameEvents(match)) return;
    const stats = sanitizeStats(input);
    if (!stats) return;

    const { me, opponent } = this.sides(match, userId);
    if (me.finished) return;
    me.stats = stats;
    this.io.to(userRoom(opponent.id)).emit('opponent:update', stats);
  }

  private gameOver(userId: string, input: unknown): void {
    const match = this.activeMatchOf(userId);
    if (!match || !this.acceptsGameEvents(match)) return;
    const { me, opponent } = this.sides(match, userId);
    const stats = sanitizeStats(input);
    if (stats) me.stats = stats;
    me.finished = true;
    this.endMatch(match, opponent.id, 'topped-out');
  }

  private leaveMatch(userId: string): AckResponse {
    const match = this.matchOf(userId);
    if (!match) return { ok: true };
    if (match.phase === 'finished') {
      this.forgetFinishedMatch(userId);
      return { ok: true };
    }
    const { opponent } = this.sides(match, userId);
    // Abandonar antes de iniciar cancela la partida sin ganador.
    const winner = match.phase === 'waiting' ? null : opponent.id;
    this.endMatch(match, winner, 'forfeit');
    this.forgetFinishedMatch(userId);
    return { ok: true };
  }

  private endMatch(match: Match, winnerId: string | null, reason: MatchResult['reason']): void {
    if (match.phase === 'finished') return;
    this.clearTimers(match);
    match.phase = 'finished';
    match.result = { winnerId, reason };

    for (const player of match.players) {
      const { me, opponent } = this.sides(match, player.id);
      this.io.to(userRoom(player.id)).emit('match:end', {
        result: match.result,
        you: me.stats,
        opponent: opponent.stats,
      });
      const grace = this.graceTimers.get(player.id);
      if (grace) {
        clearTimeout(grace);
        this.graceTimers.delete(player.id);
      }
    }

    // Se conserva un rato para que `match:sync` pueda mostrar el resultado.
    const cleanup = setTimeout(() => {
      for (const player of match.players) {
        if (this.matchByUser.get(player.id) === match.id) this.matchByUser.delete(player.id);
      }
      this.matches.delete(match.id);
    }, FINISHED_RETENTION_MS);
    cleanup.unref();
  }

  private sync(userId: string): SyncResponse {
    const match = this.matchOf(userId);
    if (match) return { status: 'in-match', match: this.snapshot(match, userId) };
    if (this.queue.includes(userId)) return { status: 'queued' };
    return { status: 'idle' };
  }

  // -------------------------------------------------------------------------
  // Utilidades
  // -------------------------------------------------------------------------

  // El reloj del cliente puede ir unos milisegundos adelantado: se aceptan
  // eventos de juego desde la cuenta regresiva.
  private acceptsGameEvents(match: Match): boolean {
    return match.phase === 'playing' || match.phase === 'countdown';
  }

  private matchOf(userId: string): Match | null {
    const id = this.matchByUser.get(userId);
    return id ? (this.matches.get(id) ?? null) : null;
  }

  private activeMatchOf(userId: string): Match | null {
    const match = this.matchOf(userId);
    return match && match.phase !== 'finished' ? match : null;
  }

  private forgetFinishedMatch(userId: string): void {
    const match = this.matchOf(userId);
    if (match && match.phase === 'finished') this.matchByUser.delete(userId);
  }

  private sides(match: Match, userId: string): { me: MatchPlayer; opponent: MatchPlayer } {
    const [a, b] = match.players;
    return a.id === userId ? { me: a, opponent: b } : { me: b, opponent: a };
  }

  private snapshot(match: Match, userId: string): MatchSnapshot {
    const { me, opponent } = this.sides(match, userId);
    return {
      matchId: match.id,
      phase: match.phase,
      startsAt: match.startsAt,
      serverTime: Date.now(),
      you: { ...me, stats: { ...me.stats } },
      opponent: { ...opponent, stats: { ...opponent.stats } },
      result: match.result,
    };
  }

  private schedule(match: Match, delay: number, fn: () => void): void {
    const timer = setTimeout(() => {
      match.timers.delete(timer);
      fn();
    }, delay);
    match.timers.add(timer);
  }

  private clearTimers(match: Match): void {
    for (const timer of match.timers) clearTimeout(timer);
    match.timers.clear();
  }

  private safeAck(ack: unknown, action: () => AckResponse): void {
    let response: AckResponse;
    try {
      response = action();
    } catch (error) {
      console.error('[realtime] Error al procesar un evento:', error);
      response = { ok: false, error: 'Error interno del servidor.' };
    }
    if (typeof ack === 'function') ack(response);
  }
}
