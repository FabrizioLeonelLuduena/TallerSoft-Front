import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, CurrentUser } from '@core/auth/auth.service';
import { Rol } from '@core/models/rol.enum';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Sidebar Component
 * Navigation menu with role-based options
 * Shows different menu items based on user role
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    RouterModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {

  currentUser: CurrentUser | null = null;
  menuItems: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.updateMenuItems();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateMenuItems(): void {
    const role = this.currentUser?.rol;

    this.menuItems = [
      { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: [Rol.ADMIN, Rol.TECNICO, Rol.RECEPCION] },
      { label: 'Clientes', icon: 'people', route: '/clientes', roles: [Rol.ADMIN, Rol.RECEPCION] },
      { label: 'Órdenes de Trabajo', icon: 'assignment', route: '/ordenes', roles: [Rol.ADMIN, Rol.TECNICO, Rol.RECEPCION] },
      { label: 'Caja y Facturación', icon: 'point_of_sale', route: '/caja/diaria', roles: [Rol.ADMIN, Rol.RECEPCION] },
      { label: 'Inventario', icon: 'inventory_2', route: '/inventario', roles: [Rol.ADMIN, Rol.TECNICO] },
      { label: 'Reportes', icon: 'bar_chart', route: '/reportes', roles: [Rol.ADMIN] },
      { label: 'Usuarios', icon: 'admin_panel_settings', route: '/usuarios', roles: [Rol.ADMIN] }
    ].filter(item => item.roles.includes((role as Rol) || '' as any));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isMenuItemVisible(item: any): boolean {
    return item.roles.includes(this.currentUser?.rol || '');
  }
}
