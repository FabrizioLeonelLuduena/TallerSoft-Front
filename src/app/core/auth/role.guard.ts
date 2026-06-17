import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Role Guard
 * Protects routes based on user role
 * Redirects to unauthorized page if user doesn't have required role
 * Expects route.data.roles to contain array of allowed roles
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const currentRole = this.authService.getCurrentRole();

    console.log('[RoleGuard] Checking route:', state.url);
    console.log('[RoleGuard] Required roles:', requiredRoles);
    console.log('[RoleGuard] Current role:', currentRole);

    if (requiredRoles && currentRole && requiredRoles.includes(currentRole)) {
      console.log('[RoleGuard] ✓ Access GRANTED');
      console.log('[RoleGuard] Now routing to component...');
      return true;
    }

    console.log('[RoleGuard] ✗ Access DENIED - redirecting to /unauthorized');
    // Redirect to unauthorized
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
