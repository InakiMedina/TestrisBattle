import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type {
  AckResponse,
  MatchPlayer,
  MatchSnapshot,
  PlayerStats,
  SyncResponse,
} from '@shared/types/realtime.types';
import type { PieceType } from '../../../../../game/logic/piece-data';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { OFFLINE_MESSAGE, OfflineError, RealtimeService } from '../../../../core/realtime/realtime.service';

export type VersusView = 'idle' | 'queued' | 'match';

/** Cada cuánto se envía como máximo el puntaje al servidor. */
const STATS_THROTTLE_MS = 100;

/**
 * Estado de la vista 1 vs 1.
 *
 * Se provee en el componente Versus (no en root): se crea al entrar a la vista
 * y se destruye al salir, y con él todas sus suscripciones (takeUntilDestroyed),
 * así no se duplican listeners al navegar entre vistas.
 */
@Injectable()
export class VersusStore {
  private readonly realtime = inject(RealtimeService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly viewState = signal<VersusView>('idle');
  private readonly matchState = signal<MatchSnapshot | null>(null);
  private readonly busyState = signal(false);
  private readonly syncingState = signal(false);
  private readonly countdownState = signal<number | null>(null);
  private readonly myStatsState = signal<PlayerStats>({ score: 0, level: 0, lines: 0 });
  private readonly nextPiecesState = signal<PieceType[]>([]);

  /** Estadísticas con las que se debe crear el tablero (retomar tras recargar). */
  private readonly resumeStatsState = signal<PlayerStats | null>(null);

  readonly view = this.viewState.asReadonly();
  readonly match = this.matchState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly syncing = this.syncingState.asReadonly();
  readonly countdown = this.countdownState.asReadonly();
  readonly myStats = this.myStatsState.asReadonly();
  readonly nextPieces = this.nextPiecesState.asReadonly();
  readonly resumeStats = this.resumeStatsState.asReadonly();

  readonly isConnected = this.realtime.isConnected;
  readonly phase = computed(() => this.matchState()?.phase ?? null);
  readonly opponent = computed<MatchPlayer | null>(() => this.matchState()?.opponent ?? null);
  readonly me = computed<MatchPlayer | null>(() => this.matchState()?.you ?? null);
  readonly opponentStats = computed<PlayerStats>(
    () => this.opponent()?.stats ?? { score: 0, level: 0, lines: 0 },
  );
  readonly myHigh = computed(() => this.me()?.high ?? 0);
  readonly opponentHigh = computed(() => this.opponent()?.high ?? 0);
  readonly showBoard = computed(() => {
    const phase = this.phase();
    return phase === 'countdown' || phase === 'playing' || phase === 'finished';
  });
  readonly isPlaying = computed(() => this.phase() === 'playing' && this.countdownState() === null);
  readonly result = computed(() => {
    const match = this.matchState();
    if (!match?.result) return null;
    const { winnerId, reason } = match.result;
    return {
      reason,
      outcome: winnerId === null ? 'cancelled' : winnerId === match.you.id ? 'won' : 'lost',
    } as const;
  });

  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private statsTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingStats: PlayerStats | null = null;

  constructor() {
    this.listen();
    this.destroyRef.onDestroy(() => this.onLeaveView());
  }

  // -------------------------------------------------------------------------
  // Acciones del usuario
  // -------------------------------------------------------------------------

  /** Botón Play: buscar rival. */
  async findOpponent(): Promise<void> {
    if (!this.realtime.isConnected()) {
      this.notifications.error(OFFLINE_MESSAGE);
      return;
    }
    // Limpiar antes de enviar: match:found puede llegar antes que la respuesta.
    this.resetMatch();
    const res = await this.run(() => this.realtime.request('queue:join'));
    if (res?.ok && this.viewState() !== 'match') this.viewState.set('queued');
  }

  async cancelSearch(): Promise<void> {
    const res = await this.run(() => this.realtime.request('queue:leave'));
    if (res?.ok) this.viewState.set('idle');
  }

  async markReady(): Promise<void> {
    const res = await this.run(() => this.realtime.request('match:ready'));
    if (res?.ok) this.patchPlayer('you', { ready: true });
  }

  /** Abandonar la partida actual, o cerrar el resultado de una partida terminada. */
  async leaveMatch(): Promise<void> {
    const finished = this.phase() === 'finished';
    if (finished) {
      // La partida ya terminó: no hace falta el servidor para volver al inicio.
      this.resetMatch();
      this.viewState.set('idle');
      if (this.realtime.isConnected()) void this.realtime.request('match:leave').catch(() => undefined);
      return;
    }
    const res = await this.run(() => this.realtime.request('match:leave'));
    if (res?.ok) {
      this.resetMatch();
      this.viewState.set('idle');
    }
  }

  /** El tablero local cambió de puntaje: se refleja en la vista y se envía al rival. */
  reportStats(stats: PlayerStats): void {
    this.myStatsState.set(stats);
    this.pendingStats = stats;
    if (this.statsTimer !== null) return;
    this.flushStats();
    this.statsTimer = setTimeout(() => {
      this.statsTimer = null;
      if (this.pendingStats) this.flushStats();
    }, STATS_THROTTLE_MS);
  }

  reportNextPieces(pieces: PieceType[]): void {
    this.nextPiecesState.set(pieces);
  }

  /** El tablero local se llenó. Se envía aunque no haya conexión (se entrega al reconectar). */
  reportGameOver(stats: PlayerStats): void {
    this.myStatsState.set(stats);
    this.patchPlayer('you', { finished: true, stats });
    this.realtime.send('game:over', stats, { buffered: true });
  }

  // -------------------------------------------------------------------------
  // Eventos del servidor
  // -------------------------------------------------------------------------

  private listen(): void {
    this.realtime
      .on('match:found')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((match) => this.applySnapshot(match));

    this.realtime
      .on('opponent:ready')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ ready }) => this.patchPlayer('opponent', { ready }));

    this.realtime
      .on('opponent:connection')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ connected }) => {
        this.patchPlayer('opponent', { connected });
        const name = this.opponent()?.username ?? 'Tu rival';
        this.notifications.info(
          connected ? `${name} se reconectó.` : `${name} se desconectó. Esperando a que regrese…`,
        );
      });

    this.realtime
      .on('match:start')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ startsAt, serverTime }) => {
        this.patchMatch({ phase: 'countdown', startsAt });
        this.startCountdown(startsAt, serverTime);
      });

    this.realtime
      .on('opponent:update')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => this.patchPlayer('opponent', { stats }));

    this.realtime
      .on('match:end')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ result, you, opponent }) => {
        this.stopCountdown();
        const match = this.matchState();
        if (!match) return;
        this.matchState.set({
          ...match,
          phase: 'finished',
          result,
          you: { ...match.you, stats: you },
          opponent: { ...match.opponent, stats: opponent },
        });
      });

    // Al entrar a la vista y en cada reconexión se resincroniza con el servidor.
    this.realtime.onConnect
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.resync());
    if (this.realtime.isConnected()) void this.resync();
  }

  /** Pide el estado actual al servidor y reconstruye la vista. */
  async resync(): Promise<void> {
    this.syncingState.set(true);
    let res: SyncResponse;
    try {
      res = await this.realtime.request('match:sync');
    } catch {
      return; // sin conexión: se reintenta al reconectar
    } finally {
      this.syncingState.set(false);
    }

    if (res.status === 'in-match') {
      this.applySnapshot(res.match);
      // Reenvía el último puntaje local por si se perdió mientras no había conexión.
      if (res.match.phase === 'playing' && !res.match.you.finished) {
        const local = this.myStatsState();
        if (local.score > res.match.you.stats.score) this.realtime.send('game:update', local);
      }
      return;
    }

    if (this.viewState() === 'match' && this.phase() !== 'finished') {
      this.notifications.info('La partida ya no está disponible.');
    }
    if (this.phase() !== 'finished') {
      this.resetMatch();
      this.viewState.set(res.status === 'queued' ? 'queued' : 'idle');
    }
  }

  private applySnapshot(snapshot: MatchSnapshot): void {
    const previous = this.matchState();
    const sameMatch = previous?.matchId === snapshot.matchId;

    if (!sameMatch) {
      // Partida nueva o recarga de la página: el tablero arranca con el puntaje del servidor.
      this.myStatsState.set(snapshot.you.stats);
      this.resumeStatsState.set(snapshot.phase === 'playing' ? snapshot.you.stats : null);
    } else if (this.myStatsState().score >= snapshot.you.stats.score) {
      // El puntaje local es más reciente que el del servidor.
      snapshot = { ...snapshot, you: { ...snapshot.you, stats: this.myStatsState() } };
    }

    this.matchState.set(snapshot);
    this.viewState.set('match');

    if (snapshot.phase === 'countdown' && snapshot.startsAt !== null) {
      this.startCountdown(snapshot.startsAt, snapshot.serverTime);
    } else if (snapshot.phase !== 'countdown') {
      this.stopCountdown();
    }
  }

  // -------------------------------------------------------------------------
  // Utilidades
  // -------------------------------------------------------------------------

  private flushStats(): void {
    const stats = this.pendingStats;
    this.pendingStats = null;
    if (!stats || this.phase() === 'finished') return;
    // volatile: si no hay conexión se descarta; al reconectar se reenvía el último.
    this.realtime.send('game:update', stats);
  }

  private startCountdown(startsAt: number, serverTime: number): void {
    this.stopCountdown();
    const offset = serverTime - Date.now(); // diferencia entre relojes
    const localStart = startsAt - offset;

    const update = () => {
      const remaining = localStart - Date.now();
      if (remaining <= 0) {
        this.stopCountdown();
        if (this.phase() === 'countdown') this.patchMatch({ phase: 'playing' });
        return;
      }
      this.countdownState.set(Math.ceil(remaining / 1000));
    };
    update();
    if (this.countdownState() !== null) this.countdownTimer = setInterval(update, 100);
  }

  private stopCountdown(): void {
    if (this.countdownTimer !== null) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
    this.countdownState.set(null);
  }

  private patchMatch(patch: Partial<MatchSnapshot>): void {
    const match = this.matchState();
    if (match) this.matchState.set({ ...match, ...patch });
  }

  private patchPlayer(side: 'you' | 'opponent', patch: Partial<MatchPlayer>): void {
    const match = this.matchState();
    if (match) this.matchState.set({ ...match, [side]: { ...match[side], ...patch } });
  }

  private resetMatch(): void {
    this.stopCountdown();
    this.matchState.set(null);
    this.resumeStatsState.set(null);
    this.pendingStats = null;
    this.myStatsState.set({ score: 0, level: 0, lines: 0 });
  }

  /** Ejecuta una acción que depende de la conexión y muestra el error si falla. */
  private async run(action: () => Promise<AckResponse>): Promise<AckResponse | null> {
    if (this.busyState()) return null;
    this.busyState.set(true);
    try {
      const res = await action();
      if ('error' in res) this.notifications.error(res.error);
      return res;
    } catch (error) {
      this.notifications.error(
        error instanceof OfflineError || error instanceof Error
          ? error.message
          : 'No se pudo completar la acción.',
      );
      return null;
    } finally {
      this.busyState.set(false);
    }
  }

  /** Al salir de la vista se abandona la cola o la partida en curso. */
  private onLeaveView(): void {
    this.stopCountdown();
    if (this.statsTimer !== null) clearTimeout(this.statsTimer);
    if (!this.realtime.isConnected()) return;
    if (this.viewState() === 'queued') {
      void this.realtime.request('queue:leave').catch(() => undefined);
    } else if (this.viewState() === 'match') {
      void this.realtime.request('match:leave').catch(() => undefined);
    }
  }
}
