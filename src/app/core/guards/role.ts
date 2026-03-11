import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/Auth';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router      = inject(Router);
    const userRoles   = authService.getRoles();

    const hasAccess = allowedRoles.some(r => userRoles.includes(r));
    if (!hasAccess) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  };
}
