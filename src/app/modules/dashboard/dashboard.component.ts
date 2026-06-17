import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { AnalyticsService } from '@core/services/analytics.service';

type Tab = 'operativo' | 'financiero' | 'clientes' | 'stock';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  tabActiva: Tab = 'operativo';
  loading = true;
  error = false;

  // Alertas (polled cada 2 min)
  alertasActivas: any[] = [];
  resumenAlertas: any = { total: 0, sin_leer: 0, por_tipo: {} };
  panelAbierto = false;

  // Modal de alertas
  modalAbierto = false;
  modalTipo: 'danger' | 'warn' = 'danger';

  // Tab Operativo
  resumenOrdenes: any;
  ordenesAltaPrioridad: any[] = [];
  ordenesSinMovimiento: any[] = [];
  tiempoPorEstado: any[] = [];

  // Tab Financiero
  cajaDiaria: any;
  rechazos: any;
  conversionPresupuesto: any;
  evolucionMensual: any[] = [];

  // Tab Clientes
  recurrencia: any[] = [];

  // Tab Stock
  stockCritico: any[] = [];
  stockPorCategoria: any[] = [];

  private alertasSub?: Subscription;

  constructor(private analytics: AnalyticsService, private router: Router) {}

  readonly moduloRutas: Record<string, string> = {
    stock: '/stock',
    ordenes: '/ordenes',
    caja: '/caja',
  };

  navegarDesdeAlerta(alerta: any): void {
    const ruta = this.moduloRutas[alerta.modulo];
    if (ruta) {
      this.cerrarModal();
      this.router.navigate([ruta]);
    }
  }

  ngOnInit(): void {
    this.cargarDashboard();
    this.alertasSub = interval(120_000).pipe(
      startWith(0),
      switchMap(() => forkJoin({
        activas: this.analytics.getAlertasActivas(),
        resumen: this.analytics.getResumenAlertas(),
      }))
    ).subscribe({
      next: ({ activas, resumen }) => {
        this.alertasActivas = activas;
        this.resumenAlertas = resumen;
      },
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.alertasSub?.unsubscribe();
  }

  cargarDashboard(): void {
    this.loading = true;
    this.error = false;
    forkJoin({
      resumenOrdenes:    this.analytics.getResumenOrdenes(),
      altaPrioridad:     this.analytics.getOrdenesAltaPrioridad(),
      sinMovimiento:     this.analytics.getOrdenesSinMovimiento(),
      tiempoPorEstado:   this.analytics.getTiempoPorEstado(),
      cajaDiaria:        this.analytics.getResumenCajaDiario(),
      rechazos:          this.analytics.getRechazos(7),
      conversion:        this.analytics.getConversionPresupuesto(),
      evolucion:         this.analytics.getEvolucionMensual(6),
      recurrencia:       this.analytics.getRecurrenciaClientes(6),
      stockCritico:      this.analytics.getStockCritico(),
      stockPorCategoria: this.analytics.getStockPorCategoria(),
    }).subscribe({
      next: (d) => {
        this.resumenOrdenes        = d.resumenOrdenes;
        this.ordenesAltaPrioridad  = d.altaPrioridad;
        this.ordenesSinMovimiento  = d.sinMovimiento;
        this.tiempoPorEstado       = d.tiempoPorEstado;
        this.cajaDiaria            = d.cajaDiaria;
        this.rechazos              = d.rechazos;
        this.conversionPresupuesto = d.conversion;
        this.evolucionMensual      = d.evolucion;
        this.recurrencia           = d.recurrencia;
        this.stockCritico          = d.stockCritico;
        this.stockPorCategoria     = d.stockPorCategoria;
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; },
    });
  }

  setTab(tab: Tab): void { this.tabActiva = tab; }
  togglePanel(): void { this.panelAbierto = !this.panelAbierto; }
  closeAll(): void { this.panelAbierto = false; }
  reintentar(): void { this.cargarDashboard(); }

  abrirModal(tipo: 'danger' | 'warn'): void {
    this.modalTipo = tipo;
    this.modalAbierto = true;
  }

  cerrarModal(): void { this.modalAbierto = false; }

  get modalAlertas(): any[] {
    return this.alertasActivas.filter(a => a.tipo === this.modalTipo && !a.leida);
  }

  marcarLeida(id: string): void {
    this.analytics.marcarAlertaLeida(id).subscribe(() => {
      const a = this.alertasActivas.find(x => x.id === id);
      if (a) a.leida = true;
      if (this.resumenAlertas) {
        this.resumenAlertas.sin_leer = Math.max(0, (this.resumenAlertas.sin_leer ?? 1) - 1);
      }
    });
  }

  // ─── Getters computados ───────────────────────────────────────────────────

  get alertasDanger(): any[] {
    return this.alertasActivas.filter(a => a.tipo === 'danger' && !a.leida);
  }

  get alertasWarn(): any[] {
    return this.alertasActivas.filter(a => a.tipo === 'warn' && !a.leida);
  }

  get embudo(): any[] {
    const orden = ['PENDIENTE_actual', 'EN_PROCESO_actual', 'LISTO_actual', 'ENTREGADO'];
    const max = Math.max(...this.tiempoPorEstado.map(e => e.promedio_dias), 1);
    return [...this.tiempoPorEstado]
      .sort((a, b) => orden.indexOf(a.estado) - orden.indexOf(b.estado))
      .map(e => ({ ...e, pct: Math.round((e.promedio_dias / max) * 100) }));
  }

  get tiempoTotalDias(): number {
    return this.tiempoPorEstado
      .filter(e => e.estado !== 'ENTREGADO')
      .reduce((s, e) => s + (e.promedio_dias || 0), 0);
  }

  get ticketPromedio(): number {
    if (!this.cajaDiaria?.cantidad_cobros) return 0;
    return Math.round(this.cajaDiaria.total_ingresos / this.cajaDiaria.cantidad_cobros);
  }

  get recurrenciaActual(): any {
    return this.recurrencia.length ? this.recurrencia[this.recurrencia.length - 1] : null;
  }

  get evolucionBarras(): any[] {
    if (!this.evolucionMensual.length) return [];
    const max = Math.max(...this.evolucionMensual.map(e => e.total_ingresos), 1);
    return this.evolucionMensual.map(e => ({
      ...e,
      pct: Math.round((e.total_ingresos / max) * 100),
      label: `$${e.total_ingresos.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
    }));
  }

  get maxCategoria(): number {
    return Math.max(...this.stockPorCategoria.map(c => c.total_unidades), 1);
  }

  get maxRecurrencia(): number {
    return Math.max(...this.recurrencia.map(r => r.total_ordenes), 1);
  }

  // ─── Helpers de template ─────────────────────────────────────────────────

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      'PENDIENTE_actual':  'Pendiente',
      'EN_PROCESO_actual': 'En proceso',
      'LISTO_actual':      'Listo',
      'ENTREGADO':         'Total (cerradas)',
    };
    return map[estado] || estado;
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      'PENDIENTE':  'p',
      'EN_PROCESO': 'ep',
      'LISTO':      'l',
      'ENTREGADO':  'e',
    };
    return map[estado] ?? '';
  }

  iconoPorTipo(tipo: string): string {
    const map: Record<string, string> = {
      danger:  'error',
      warn:    'warning',
      info:    'info',
      success: 'check_circle',
    };
    return map[tipo] ?? 'notifications';
  }

  embudo_color_class(i: number): string {
    return ['s1', 's2', 's3', 's4'][i] ?? 's1';
  }

  catPct(unidades: number): number {
    return Math.round((unidades / this.maxCategoria) * 100);
  }

  recPct(r: any): number {
    return r.total_ordenes ? Math.round((r.total_ordenes / this.maxRecurrencia) * 100) : 0;
  }
}
