import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth/auth.service';
import type { IAuthUser } from '../core/auth/auth.models';

// Datos del perfil del usuario que inició sesión.
@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  // Cambia el nombre de usuario. El backend responde 409 si el nombre ya existe
  // o si el usuario está buscando rival o jugando una partida.
  updateUsername(username: string): Observable<IAuthUser> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No hay una sesión iniciada');

    return this.http
      .patch<IAuthUser>(`${environment.apiUrl}/users/${user.id}`, { username })
      .pipe(tap((updated) => this.auth.updateCurrentUser(updated)));
  }
}
