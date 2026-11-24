import { Component, computed, inject } from '@angular/core';
import { RealtimeService, type ConnectionStatus as Status } from '../../../core/realtime/realtime.service';

const LABELS: Record<Status, string> = {
  connecting: 'Conectando…',
  connected: 'Conectado',
  reconnecting: 'Reconectando…',
  disconnected: 'Desconectado',
};

// Indicador visible del estado de la conexión en tiempo real.
@Component({
  selector: 'app-connection-status',
  templateUrl: './connection-status.html',
  styleUrl: './connection-status.scss',
})
export class ConnectionStatus {
  private readonly realtime = inject(RealtimeService);

  protected readonly status = this.realtime.status;
  protected readonly label = computed(() => LABELS[this.status()]);

  protected retry(): void {
    this.realtime.reconnect();
  }
}
