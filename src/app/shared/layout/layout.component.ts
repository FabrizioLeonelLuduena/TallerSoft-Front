import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService, CurrentUser } from '@core/auth/auth.service';
import { Rol } from '@core/models/rol.enum';
import { ChatHistoryService, ChatSession } from '@core/services/chat-history.service';
import { ChatFlotanteComponent } from '@shared/components/chat-flotante/chat-flotante.component';
import { TopBarComponent } from '@shared/components/top-bar/top-bar.component';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  roles?: Rol[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ChatFlotanteComponent,
    TopBarComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {

  currentUser: CurrentUser | null = null;
  sidebarCollapsed = false;
  isMobile = false;
  chatSessions: ChatSession[] = [];
  openMenuId: string | null = null;
  currentSessionId: string | null = null;
  private subs = new Subscription();

  navItems: NavItem[] = [
    { label: 'Dashboard',         icon: 'dashboard',           route: '/dashboard',   roles: [Rol.ADMIN, Rol.TECNICO, Rol.RECEPCION] },
    { label: 'Clientes',          icon: 'people',              route: '/clientes',    roles: [Rol.ADMIN, Rol.RECEPCION] },
    { label: 'Órdenes de Trabajo',icon: 'build',               route: '/ordenes',     roles: [Rol.ADMIN, Rol.TECNICO, Rol.RECEPCION] },
    { label: 'Stock',             icon: 'inventory_2',         route: '/stock',       roles: [Rol.ADMIN, Rol.TECNICO] },
    { label: 'Caja y Facturación',icon: 'point_of_sale',       route: '/caja/diaria', roles: [Rol.ADMIN, Rol.RECEPCION] },
    { label: 'Usuarios',          icon: 'admin_panel_settings',route: '/usuarios',    roles: [Rol.ADMIN] },
    { label: 'Asistente IA',      icon: 'smart_toy',           route: '/asistente',   roles: [Rol.ADMIN, Rol.RECEPCION] },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private historyService: ChatHistoryService,
  ) {}

  ngOnInit(): void {
    this.subs.add(this.authService.currentUser$.subscribe(user => { this.currentUser = user; }));
    this.subs.add(this.historyService.sessions.subscribe(s => { this.chatSessions = s; }));
    this.subs.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
        this.updateCurrentSession(e.url);
      })
    );
    this.updateCurrentSession(this.router.url);
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  getVisibleNavItems(): NavItem[] {
    if (!this.currentUser) return [];
    return this.navItems.filter(item =>
      !item.roles || item.roles.includes(this.currentUser!.rol as Rol)
    );
  }

  private updateCurrentSession(url: string): void {
    if (url.includes('/asistente')) {
      const match = url.match(/[?&]id=([^&]+)/);
      this.currentSessionId = match ? match[1] : null;
    } else {
      this.currentSessionId = null;
    }
  }

  navigateToSession(sessionId: string): void {
    this.openMenuId = null;
    this.router.navigate(['/asistente'], { queryParams: { id: sessionId } });
  }

  toggleSessionMenu(sessionId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === sessionId ? null : sessionId;
  }

  deleteSession(sessionId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.historyService.deleteSession(sessionId);
    if (this.currentSessionId === sessionId) {
      this.router.navigate(['/asistente']);
    }
    this.openMenuId = null;
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.openMenuId = null;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  updateModuleName(url: string): void {}
}
