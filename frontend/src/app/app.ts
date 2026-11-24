import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Navbar } from './core/layout/navbar/navbar';
import { NotificationBanner } from './shared/components/notification-banner/notification-banner';
import { ConnectionStatus } from './shared/components/connection-status/connection-status';
import { AuthService } from './core/auth/auth.service';
import { RealtimeService } from './core/realtime/realtime.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, NotificationBanner, ConnectionStatus],
  template: `
    <app-notification-banner />
    @if (auth.isAuthenticated()) {
      <app-connection-status />
    }
    <div class="app-shell">
      @if (showNavbar()) {
        <app-navbar />
      }
      <main class="route-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .app-shell {
      display: flex;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .route-content {
      flex: 1;
      min-width: 0;
      height: 100%;
      overflow: auto;
    }
  `],
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);
  // Se inyecta aquí para crear el servicio al arrancar: abre la conexión
  // en tiempo real en cuanto hay sesión y la cierra al cerrarla.
  private readonly realtime = inject(RealtimeService);

  protected readonly showNavbar = signal(!this.isAuthPage(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.showNavbar.set(!this.isAuthPage(event.urlAfterRedirects));
      });
  }

  private isAuthPage(url: string): boolean {
    const path = url.split(/[?#]/, 1)[0];
    return path === '/login' || path === '/signin';
  }}
