import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import type { Role } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';

// Muestra u oculta un elemento según el rol del usuario actual.
//   <button *appHasRole="'admin'">Eliminar</button>
//   <a *appHasRole="['admin', 'usuario']">...</a>
//   <span *appHasRole="'admin'; else sinPermiso">...</span>
// Reacciona solo si el usuario o su rol cambian (inicio y cierre de sesión).
// Ocultar un elemento no sustituye la validación del backend, que responde 403.
@Directive({
  selector: '[appHasRole]',
})
export class HasRole {
  private readonly auth = inject(AuthService);
  private readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly appHasRole = input.required<Role | readonly Role[]>();
  readonly appHasRoleElse = input<TemplateRef<unknown> | null>(null);

  private rendered: 'then' | 'else' | null = null;

  constructor() {
    effect(() => {
      const allowed = this.auth.hasRole(this.appHasRole());
      const elseTemplate = this.appHasRoleElse();
      const next: 'then' | 'else' | null = allowed ? 'then' : elseTemplate ? 'else' : null;

      if (next === this.rendered) return;

      this.viewContainer.clear();
      if (next === 'then') {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else if (next === 'else' && elseTemplate) {
        this.viewContainer.createEmbeddedView(elseTemplate);
      }
      this.rendered = next;
    });
  }
}
