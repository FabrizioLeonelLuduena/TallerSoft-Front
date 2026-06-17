import { Component, OnInit, inject, DestroyRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { NotificationService } from '../../../core/services/notification.service';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { Rol } from '@core/models/rol.enum';
import { OrdenesService, OrdenTrabajoResponse } from '../services/ordenes.service';

@Component({
  selector: 'app-ordenes-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    RouterModule
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  private authService = inject(AuthService);
  private ordenesService = inject(OrdenesService);
  private notifications = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  ordenes: OrdenTrabajoResponse[] = [];
  filteredOrdenes: OrdenTrabajoResponse[] = [];
  isLoading = true;
  selectedEstado = '';
  selectedTecnicoId: number | null = null;
  currentRole: string | null = '';
  searchTerm = '';

  currentPage = 1;
  readonly pageSize = 10;

  estados = ['PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO'];
  tecnicos: { id: number | null; nombre: string }[] = [];

  @ViewChild('cancelDialog') cancelDialog!: ElementRef<HTMLDialogElement>;
  ordenToDelete: OrdenTrabajoResponse | null = null;
  isDeleting = false;

  readonly estadoOrden = { ENTREGADO: 0, LISTO: 1, EN_PROCESO: 2, PENDIENTE: 3, CANCELADO: 4 };

  ngOnInit() {
    this.currentRole = this.authService.getCurrentRole();
    // Data is provided by the parent OrdenesPrincipalComponent via setFilteredOrdenes()
    this.isLoading = false;
  }

  private loadOrdenes() {
    this.isLoading = true;
    this.ordenesService.listarOrdenes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ordenes) => {
          this.ordenes = ordenes;
          this.filteredOrdenes = [...ordenes];
          this.extractTecnicos();
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.notifications.error(err.error?.message || 'Error al cargar las órdenes');
        }
      });
  }

  private loadMisOrdenes() {
    this.isLoading = true;
    this.ordenesService.listarMisOrdenes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ordenes) => {
          this.ordenes = ordenes;
          this.filteredOrdenes = [...ordenes];
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.notifications.error(err.error?.message || 'Error al cargar tus órdenes');
        }
      });
  }

  private extractTecnicos() {
    const tecnicoSet = new Map<number | null, string>();
    this.ordenes.forEach(orden => {
      if (orden.tecnicoId !== null && orden.tecnicoNombre) {
        tecnicoSet.set(orden.tecnicoId, orden.tecnicoNombre);
      }
    });
    this.tecnicos = Array.from(tecnicoSet.entries()).map(([id, nombre]) => ({ id, nombre }));
  }

  filterByEstado(estado: string) {
    this.selectedEstado = estado;
    this.applyFilters();
  }

  filterByTecnico(tecnicoId: number | null) {
    this.selectedTecnicoId = tecnicoId;
    this.applyFilters();
  }

  filterBySearch() {
    this.applyFilters();
  }

  toggleFiltersPanel() {
    // Placeholder para panel de filtros si es necesario expandir
  }

  private applyFilters() {
    this.filteredOrdenes = this.ordenes.filter(orden => {
      const estadoMatch = !this.selectedEstado || orden.estado === this.selectedEstado;
      const tecnicoMatch = this.selectedTecnicoId === null || orden.tecnicoId === this.selectedTecnicoId;
      const searchMatch = !this.searchTerm || 
        orden.clienteNombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        orden.id.toString().includes(this.searchTerm) ||
        (orden.tecnicoNombre && orden.tecnicoNombre.toLowerCase().includes(this.searchTerm.toLowerCase()));
      return estadoMatch && tecnicoMatch && searchMatch;
    });
  }

  navigateToDetail(id: number, event?: Event) {
    if (event) event.stopPropagation();
    this.router.navigate(['/ordenes', id]);
  }

  navigateToCreate() {
    this.router.navigate(['/ordenes/nueva']);
  }

  setFilteredOrdenes(ordenes: OrdenTrabajoResponse[]) {
    this.filteredOrdenes = this.ordenesSorted_internal(ordenes);
    this.currentPage = 1;
  }

  get ordenesSorted(): OrdenTrabajoResponse[] {
    return this.ordenesSorted_internal(this.filteredOrdenes);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.ordenesSorted.length / this.pageSize));
  }

  get pagedOrdenes(): OrdenTrabajoResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.ordenesSorted.slice(start, start + this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.ordenesSorted.length);
  }

  get pageStart(): number {
    return this.ordenesSorted.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  private ordenesSorted_internal(ordenes: OrdenTrabajoResponse[]): OrdenTrabajoResponse[] {
    return [...ordenes].sort((a, b) => {
      const estadoDiff = (this.estadoOrden[a.estado as keyof typeof this.estadoOrden] || 999) - 
                         (this.estadoOrden[b.estado as keyof typeof this.estadoOrden] || 999);
      if (estadoDiff !== 0) return estadoDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  formatCurrency(amount: number): string {
    return '$' + amount.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  getRelativeTime(dateStr: string): string {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const hours = Math.floor(diff / 3600000);
      if (hours < 1) return 'hace un momento';
      if (hours < 24) return `hace ${hours}h`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'ayer';
      return `hace ${days} días`;
    } catch {
      return 'N/A';
    }
  }

  padOrderId(id: number): string {
    return '#' + String(id).padStart(4, '0');
  }

  getEstadoBgColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'rgba(59, 130, 246, 0.15)';
      case 'EN_PROCESO': return 'rgba(249, 115, 22, 0.15)';
      case 'LISTO': return 'rgba(34, 197, 94, 0.15)';
      case 'ENTREGADO': return 'rgba(75, 85, 99, 0.2)';
      case 'CANCELADO': return 'rgba(239, 68, 68, 0.15)';
      default: return 'transparent';
    }
  }

  getEstadoBorderColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'var(--color-info)';
      case 'EN_PROCESO': return 'var(--color-accent)';
      case 'LISTO': return 'var(--color-success)';
      case 'ENTREGADO': return 'var(--color-text-muted)';
      case 'CANCELADO': return 'var(--color-danger)';
      default: return 'transparent';
    }
  }

  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'ALTA': return 'var(--color-danger)';
      case 'NORMAL': return 'var(--color-warning)';
      case 'BAJA': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  }

  canCreateOrden(): boolean {
    return this.currentRole === Rol.ADMIN || this.currentRole === Rol.RECEPCION;
  }

  isTecnicoRole(): boolean {
    return this.currentRole === Rol.TECNICO;
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'var(--color-info)';
      case 'EN_PROCESO': return 'var(--color-accent)';
      case 'LISTO': return 'var(--color-success)';
      case 'ENTREGADO': return 'var(--color-text-muted)';
      case 'CANCELADO': return 'var(--color-danger)';
      default: return 'transparent';
    }
  }

  getPriorityColor(prioridad: string): string {
    switch (prioridad) {
      case 'ALTA': return 'var(--color-danger)';
      case 'NORMAL': return 'var(--color-warning)';
      case 'BAJA': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  }

  showDeleteOrdenModal(orden: OrdenTrabajoResponse, event: Event) {
    event.stopPropagation();
    this.ordenToDelete = orden;
    this.cancelDialog.nativeElement.showModal();
  }

  closeDeleteOrdenModal() {
    if (this.cancelDialog.nativeElement.open) {
      this.cancelDialog.nativeElement.close();
    }
    this.ordenToDelete = null;
    this.isDeleting = false;
  }

  confirmDeleteOrden() {
    if (!this.ordenToDelete) return;
    this.isDeleting = true;
    this.ordenesService.cambiarEstado(this.ordenToDelete.id, 'CANCELADO')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.success('Orden cancelada exitosamente');
          this.loadOrdenes();
          this.closeDeleteOrdenModal();
        },
        error: (err) => {
          this.isDeleting = false;
          this.notifications.error(err.error?.message || 'Error al cancelar la orden');
        }
      });
  }

  getInitials(nombre?: string | null): string {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  shouldShowEstadoSeparator(index: number): boolean {
    const paged = this.pagedOrdenes;
    if (index === 0) return true;
    return paged[index].estado !== paged[index - 1].estado;
  }

  getEstadoForSeparator(index: number): string {
    return this.pagedOrdenes[index].estado;
  }

  getEstadoCount(estado: string): number {
    return this.ordenesSorted.filter(o => o.estado === estado).length;
  }
}
