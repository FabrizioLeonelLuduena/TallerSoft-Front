import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, forkJoin, interval, startWith, switchMap, Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, CurrentUser } from '@core/auth/auth.service';
import { ProfileService, ProfileState } from '@core/services/profile.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { NotificationService } from '@core/services/notification.service';
import { KanbanSyncService } from '@modules/ordenes/services/kanban-sync.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit, OnDestroy {
  moduleName = 'Dashboard';
  currentDate = '';
  alertas: any[] = [];
  showNotifications = false;
  showUserDropdown = false;
  currentUser: CurrentUser | null = null;
  profileState: ProfileState = { nombre: '', avatarGradient: 0, avatarImage: null };

  private subs = new Subscription();
  private prevUnreadCount = -1; // -1 = primera carga, no mostrar toast

  private readonly GRADIENTS = [
    'linear-gradient(135deg, #00f5d4, #0ea5e9)',
    'linear-gradient(135deg, #f97316, #ef4444)',
    'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    'linear-gradient(135deg, #f59e0b, #22c55e)',
    'linear-gradient(135deg, #ec4899, #f97316)',
  ];

  private readonly moduleMap: Record<string, string> = {
    '/clientes/nuevo': 'Nuevo Cliente',
    '/ordenes/nueva': 'Nueva Orden de Trabajo',
    '/stock/nuevo': 'Nuevo Repuesto',
    '/usuarios/nuevo': 'Nuevo Usuario',
    '/dashboard': 'Dashboard',
    '/clientes': 'Clientes',
    '/ordenes': 'Órdenes de Trabajo',
    '/stock': 'Stock',
    '/caja': 'Caja y Facturación',
    '/inventario': 'Inventario',
    '/reportes': 'Reportes',
    '/usuarios': 'Usuarios',
    '/asistente': 'Asistente IA',
    '/perfil': 'Mi Perfil',
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService,
    private analyticsService: AnalyticsService,
    private notificationService: NotificationService,
    private kanbanSyncService: KanbanSyncService
  ) {}

  ngOnInit(): void {
    this.updateDate();
    this.updateModuleName(this.router.url);

    // Polling cada 60s + inmediato al arrancar.
    // Carga alertas y estado de leídas en paralelo, luego las mergea.
    this.subs.add(
      interval(60_000)
        .pipe(
          startWith(0),
          switchMap(() => forkJoin({
            alerts: this.analyticsService.getAlertasActivas(),
            leidas: this.analyticsService.getAlertasLeidas().pipe(catchError(() => of([] as string[]))),
          }))
        )
        .subscribe({
          next: ({ alerts, leidas }) => {
            const leidasSet = new Set(leidas);
            alerts.forEach(a => { a.leida = leidasSet.has(a.id); });
            this.onAlertasLoaded(alerts);
          },
          error: () => (this.alertas = []),
        })
    );

    // Refrescar al instante cuando cambia el estado de una orden en Kanban
    this.subs.add(
      this.kanbanSyncService.kanbanUpdates$().subscribe(() => this.refreshAlertas())
    );

    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: any) => this.updateModuleName(e.url))
    );

    this.subs.add(this.authService.currentUser$.subscribe(user => (this.currentUser = user)));
    this.subs.add(this.profileService.profile$.subscribe(s => (this.profileState = s)));
  }

  get avatarGradient(): string {
    return this.GRADIENTS[this.profileState.avatarGradient] ?? this.GRADIENTS[0];
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get unreadCount(): number {
    return this.alertas.filter(a => !a.leida).length;
  }

  private updateModuleName(url: string): void {
    for (const [path, name] of Object.entries(this.moduleMap)) {
      if (url.startsWith(path)) {
        this.moduleName = name;
        return;
      }
    }
    this.moduleName = 'TallerSoft';
  }

  private updateDate(): void {
    const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    this.currentDate = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }

  private onAlertasLoaded(alerts: any[]): void {
    const newUnread = alerts.filter(a => !a.leida).length;
    if (this.prevUnreadCount !== -1 && newUnread > this.prevUnreadCount) {
      const diff = newUnread - this.prevUnreadCount;
      this.notificationService.warning(
        diff === 1 ? '¡Hay 1 nueva alerta!' : `¡Hay ${diff} nuevas alertas!`
      );
    }
    this.prevUnreadCount = newUnread;
    this.alertas = alerts;
  }

  private refreshAlertas(): void {
    forkJoin({
      alerts: this.analyticsService.getAlertasActivas(),
      leidas: this.analyticsService.getAlertasLeidas().pipe(catchError(() => of([] as string[]))),
    }).subscribe({
      next: ({ alerts, leidas }) => {
        const leidasSet = new Set(leidas);
        alerts.forEach(a => { a.leida = leidasSet.has(a.id); });
        this.onAlertasLoaded(alerts);
      },
      error: () => {},
    });
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showUserDropdown = false;
  }

  toggleUserDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showUserDropdown = !this.showUserDropdown;
    this.showNotifications = false;
  }

  markAsRead(alerta: any, event: MouseEvent): void {
    event.stopPropagation();
    this.analyticsService.marcarAlertaLeida(alerta.id).subscribe(() => {
      alerta.leida = true;
    });
  }

  getAlertaIcon(modulo: string): string {
    const icons: Record<string, string> = {
      ordenes: 'build',
      stock: 'inventory_2',
      caja: 'point_of_sale',
      clientes: 'people',
    };
    return icons[modulo] ?? 'warning';
  }

  getUserInitials(): string {
    const name = this.profileState.nombre || this.currentUser?.email?.split('@')[0] || '';
    return name.split(' ').map((p: string) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'U';
  }

  getUserName(): string {
    return this.profileState.nombre || this.currentUser?.email?.split('@')[0] || 'User';
  }

  getUserRole(): string {
    const rolMap: Record<string, string> = { ADMIN: 'Administrador', TECNICO: 'Técnico', RECEPCION: 'Recepción' };
    return rolMap[this.currentUser?.rol ?? ''] ?? (this.currentUser?.rol ?? '');
  }

  goToProfile(): void {
    this.showUserDropdown = false;
    this.router.navigate(['/perfil']);
  }

  logout(): void {
    this.showUserDropdown = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showNotifications = false;
    this.showUserDropdown = false;
  }
}
