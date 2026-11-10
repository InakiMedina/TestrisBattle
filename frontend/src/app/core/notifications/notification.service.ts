import { Injectable, signal } from '@angular/core';

export type NotificationType = 'error' | 'info';

export interface AppNotification {
  type: NotificationType;
  message: string;
}

const DEFAULT_DURATION_MS = 6000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly state = signal<AppNotification | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly current = this.state.asReadonly();

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.state.set(null);
  }

  private show(type: NotificationType, message: string): void {
    this.dismiss();
    this.state.set({ type, message });
    this.timer = setTimeout(() => this.dismiss(), DEFAULT_DURATION_MS);
  }
}
