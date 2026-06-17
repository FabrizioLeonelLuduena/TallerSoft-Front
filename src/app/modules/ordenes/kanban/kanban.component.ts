import { Component, OnInit, OnDestroy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../../core/services/notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdenesService, OrdenTrabajoResponse } from '../services/ordenes.service';
import { KanbanSyncService } from '../services/kanban-sync.service';
import { Subscription } from 'rxjs';

interface KanbanColumn {
  estado: string;
  label: string;
  ordenes: OrdenTrabajoResponse[];
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DragDropModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.scss']
})
export class KanbanComponent implements OnInit, OnDestroy {
  private ordenesService = inject(OrdenesService);
  private notifications = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private kanbanSync = inject(KanbanSyncService);
  private kanbanSub?: Subscription;

  columns: KanbanColumn[] = [
    { estado: 'PENDIENTE', label: 'Pendiente', ordenes: [] },
    { estado: 'EN_PROCESO', label: 'En Proceso', ordenes: [] },
    { estado: 'LISTO', label: 'Listo', ordenes: [] },
    { estado: 'ENTREGADO', label: 'Entregado', ordenes: [] }
  ];

  connectedLists = ['PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO'];
  isLoading = true;
  allOrdenes: OrdenTrabajoResponse[] = [];

  ngOnInit() {
    // Data is provided by the parent OrdenesPrincipalComponent via setFilteredOrdenes()
    this.isLoading = false;

    this.kanbanSub = this.kanbanSync.kanbanUpdates$().subscribe({
      next: ({ ordenId, nuevoEstado }) => {
        for (const col of this.columns) {
          const idx = col.ordenes.findIndex(o => o.id === ordenId);
          if (idx !== -1) {
            const [orden] = col.ordenes.splice(idx, 1);
            orden.estado = nuevoEstado as OrdenTrabajoResponse['estado'];
            const target = this.columns.find(c => c.estado === nuevoEstado);
            if (target) target.ordenes.push(orden);
            break;
          }
        }
      },
      error: (err) => console.error('KanbanSync error:', err),
    });
  }

  ngOnDestroy() {
    this.kanbanSub?.unsubscribe();
    this.kanbanSync.disconnect();
  }

  loadOrdenes() {
    this.isLoading = true;
    this.ordenesService.listarOrdenesActivas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ordenes) => {
          this.allOrdenes = ordenes;
          this.reorganizeColumns(ordenes);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.notifications.error('Error al cargar órdenes');
        }
      });
  }

  setFilteredOrdenes(ordenes: OrdenTrabajoResponse[]) {
    this.reorganizeColumns(ordenes);
  }

  private reorganizeColumns(ordenes: OrdenTrabajoResponse[]) {
    this.columns.forEach(col => col.ordenes = []);
    ordenes.forEach(orden => {
      const col = this.columns.find(c => c.estado === orden.estado);
      if (col) col.ordenes.push(orden);
    });
    // Sort ENTREGADO by updatedAt DESC so the 3 most recent appear first
    this.columns[3].ordenes.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  onDrop(event: CdkDragDrop<OrdenTrabajoResponse[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const orden = event.previousContainer.data[event.previousIndex];
    const nuevoEstado = this.columns[this.connectedLists.indexOf(event.container.id)].estado;
    
    const originalPrevItems = [...event.previousContainer.data];
    const originalCurrItems = [...event.container.data];

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    this.ordenesService.cambiarEstado(orden.id, nuevoEstado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          orden.estado = nuevoEstado as 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO';
          if (nuevoEstado === 'ENTREGADO') {
            // Move newly delivered order to front so it appears among the visible 3
            const col = this.columns[3];
            const idx = col.ordenes.indexOf(orden);
            if (idx > 0) {
              col.ordenes.splice(idx, 1);
              col.ordenes.unshift(orden);
            }
          }
          this.notifications.success('Orden actualizada');
        },
        error: (err) => {
          event.previousContainer.data = originalPrevItems;
          event.container.data = originalCurrItems;
          this.notifications.error(err.error?.message || 'Error al cambiar estado');
        }
      });
  }

  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays === 1) return 'ayer';
    return `hace ${diffDays}d`;
  }

  getTecnicoInitials(nombre?: string | null): string {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'var(--color-info)';
      case 'EN_PROCESO': return 'var(--color-accent)';
      case 'LISTO': return 'var(--color-success)';
      case 'ENTREGADO': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  }

  getEstadoBgColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'rgba(59, 130, 246, 0.1)';
      case 'EN_PROCESO': return 'rgba(0, 245, 212, 0.1)';
      case 'LISTO': return 'rgba(34, 197, 94, 0.1)';
      case 'ENTREGADO': return 'rgba(156, 163, 175, 0.1)';
      default: return 'transparent';
    }
  }

  getCardBorderColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'var(--color-info)';
      case 'EN_PROCESO': return 'var(--color-accent)';
      case 'LISTO': return 'var(--color-success)';
      case 'ENTREGADO': return 'var(--color-text-muted)';
      default: return 'var(--color-border)';
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

  navigateToDetail(ordenId: number) {
    this.router.navigate(['/ordenes', ordenId]);
  }

  navigateToList() {
    this.router.navigate(['/ordenes']);
  }

  navigateToCreateNew() {
    this.router.navigate(['/ordenes/nueva']);
  }

  padOrderId(id: number): string {
    return String(id).padStart(4, '0');
  }

  trackByOrdenId(index: number, orden: OrdenTrabajoResponse): number {
    return orden.id;
  }
}
