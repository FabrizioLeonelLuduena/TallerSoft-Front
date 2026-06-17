import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { Rol } from '@core/models/rol.enum';
import { OrdenesService, OrdenTrabajoResponse } from '../services/ordenes.service';
import { CobrosService } from '../../caja/services/cobros.service';
import { AddRepuestoDialogComponent } from '../dialogs/add-repuesto-dialog/add-repuesto-dialog.component';

@Component({
  selector: 'app-orden-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private ordenesService = inject(OrdenesService);
  private cobrosService = inject(CobrosService);
  private sanitizer = inject(DomSanitizer);
  private notifications = inject(NotificationService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  orden: OrdenTrabajoResponse | null = null;
  isLoading = true;
  isSavingDiagnostico = false;
  isChangingEstado = false;
  isEditingDiagnostico = false;
  isCancelling = false;
  showCancelConfirm = false;
  currentRole: string | null = '';
  diagnosticoText = '';

  pdfUrl: SafeResourceUrl | null = null;
  showPdfPreview = false;
  isPdfLoading = false;

  ngOnInit() {
    this.currentRole = this.authService.getCurrentRole();
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.loadOrden(id);
  }

  private loadOrden(id: number) {
    this.isLoading = true;
    this.ordenesService.obtenerOrden(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orden) => {
          this.orden = orden;
          this.diagnosticoText = orden.diagnostico ?? '';
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.notifications.error(err.error?.message || 'Error al cargar la orden');
          setTimeout(() => this.router.navigate(['/ordenes']), 2000);
        }
      });
  }

  onSaveDiagnostico() {
    if (!this.orden) return;
    this.isSavingDiagnostico = true;
    this.ordenesService.agregarDiagnostico(this.orden.id, this.diagnosticoText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedOrden) => {
          this.orden = updatedOrden;
          this.isSavingDiagnostico = false;
          this.isEditingDiagnostico = false;
          this.notifications.success('Diagnóstico guardado');
        },
        error: (err) => {
          this.isSavingDiagnostico = false;
          this.notifications.error(err.error?.message || 'Error al guardar el diagnóstico');
        }
      });
  }

  onChangeEstado() {
    if (!this.orden) return;
    const nextEstado = this.getNextEstado(this.orden.estado);
    if (!nextEstado) return;

    this.isChangingEstado = true;
    this.ordenesService.cambiarEstado(this.orden.id, nextEstado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedOrden) => {
          this.orden = updatedOrden;
          this.isChangingEstado = false;
          this.isEditingDiagnostico = false;
          this.notifications.success('Estado actualizado');
        },
        error: (err) => {
          this.isChangingEstado = false;
          this.notifications.error(err.error?.message || 'Error al cambiar el estado');
        }
      });
  }

  onRemoveRepuesto(ordenRepuestoId: number) {
    if (!this.orden) return;
    this.ordenesService.eliminarRepuesto(this.orden.id, ordenRepuestoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedOrden) => {
          this.orden = updatedOrden;
          this.notifications.success('Repuesto eliminado');
        },
        error: (err) => {
          this.notifications.error(err.error?.message || 'Error al eliminar repuesto');
        }
      });
  }

  openAddRepuestoDialog() {
    if (!this.orden) return;
    this.dialog.open(AddRepuestoDialogComponent, {
      width: '620px',
      maxWidth: '95vw',
      minHeight: '420px',
      panelClass: 'dark-dialog',
      data: { ordenId: this.orden.id }
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          const id = this.orden!.id;
          this.loadOrden(id);
        }
      });
  }

  previsualizarPDF(): void {
    if (!this.orden) return;
    this.isPdfLoading = true;
    this.cobrosService.generarPresupuesto(this.orden.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
          this.showPdfPreview = true;
          this.isPdfLoading = false;
        },
        error: () => {
          this.isPdfLoading = false;
          this.notifications.error('Error al generar el presupuesto');
        }
      });
  }

  descargarPDF(): void {
    if (!this.orden) return;
    this.cobrosService.generarPresupuesto(this.orden.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `TallerSoft-Presupuesto#${String(this.orden!.id).padStart(4, '0')}.pdf`;
          link.click();
        },
        error: () => {
          this.notifications.error('Error al descargar el presupuesto');
        }
      });
  }

  cerrarPdfPreview(): void {
    this.showPdfPreview = false;
    this.pdfUrl = null;
  }

  navigateBack() {
    this.router.navigate(['/ordenes']);
  }

  getNextEstado(current: string): string | null {
    const map: Record<string, string> = {
      'PENDIENTE': 'EN_PROCESO',
      'EN_PROCESO': 'LISTO',
      'LISTO': 'ENTREGADO'
    };
    return map[current] ?? null;
  }

  getNextEstadoLabel(current: string): string {
    const labels: Record<string, string> = {
      'PENDIENTE': 'Iniciar reparación',
      'EN_PROCESO': 'Marcar como Listo',
      'LISTO': 'Entregar al cliente'
    };
    return labels[current] ?? 'Cambiar estado';
  }

  canSaveDiagnostico(): boolean {
    return (this.currentRole === Rol.ADMIN || this.currentRole === Rol.TECNICO) &&
           this.orden?.estado !== 'ENTREGADO' &&
           this.orden?.estado !== 'LISTO' &&
           this.orden?.estado !== 'CANCELADO';
  }

  isDiagnosticoEditable(): boolean {
    if (!this.orden) return false;
    if (this.currentRole !== Rol.ADMIN && this.currentRole !== Rol.TECNICO) return false;
    if (this.orden.estado === 'CANCELADO') return false;
    if (this.orden.estado === 'PENDIENTE') {
      return !this.orden.diagnostico || this.isEditingDiagnostico;
    }
    if (this.orden.estado === 'EN_PROCESO') return this.isEditingDiagnostico;
    return false;
  }

  isDiagnosticoDisabledInput(): boolean {
    if (!this.orden) return false;
    if (this.currentRole !== Rol.ADMIN && this.currentRole !== Rol.TECNICO) return false;
    if (this.orden.estado === 'PENDIENTE') {
      return !!this.orden.diagnostico && !this.isEditingDiagnostico;
    }
    return (this.orden.estado === 'EN_PROCESO' && !this.isEditingDiagnostico) ||
           this.orden.estado === 'LISTO';
  }

  onToggleEditDiagnostico(): void {
    this.isEditingDiagnostico = true;
  }

  canRegistrarCobro(): boolean {
    return this.currentRole === Rol.ADMIN || this.currentRole === Rol.RECEPCION;
  }

  canChangeEstado(): boolean {
    return (this.currentRole === Rol.ADMIN || this.currentRole === Rol.TECNICO) &&
           this.orden?.estado !== 'ENTREGADO' &&
           this.orden?.estado !== 'LISTO' &&
           this.orden?.estado !== 'CANCELADO';
  }

  canAddRepuesto(): boolean {
    return (this.currentRole === Rol.ADMIN || this.currentRole === Rol.TECNICO) &&
           this.orden?.estado !== 'ENTREGADO' &&
           this.orden?.estado !== 'CANCELADO';
  }

  canCancelar(): boolean {
    return (this.currentRole === Rol.ADMIN || this.currentRole === Rol.RECEPCION) &&
           this.orden?.estado === 'PENDIENTE';
  }

  onCancelarOrden(): void {
    this.showCancelConfirm = true;
  }

  onDismissCancelar(): void {
    this.showCancelConfirm = false;
  }

  onConfirmCancelar(): void {
    if (!this.orden) return;
    this.isCancelling = true;
    this.ordenesService.cambiarEstado(this.orden.id, 'CANCELADO')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedOrden) => {
          this.orden = updatedOrden;
          this.isCancelling = false;
          this.showCancelConfirm = false;
          this.notifications.success('Orden cancelada');
        },
        error: (err) => {
          this.isCancelling = false;
          this.notifications.error(err.error?.message || 'Error al cancelar la orden');
        }
      });
  }

  isChangeEstadoDisabled(): boolean {
    return this.orden?.estado === 'EN_PROCESO' && !this.orden?.diagnostico;
  }

  isCompleted(estado: string): boolean {
    if (!this.orden) return false;
    const estados = ['PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO'];
    const currentIndex = estados.indexOf(this.orden.estado);
    const checkIndex = estados.indexOf(estado);
    return checkIndex < currentIndex;
  }

  isCurrent(estado: string): boolean {
    return this.orden?.estado === estado;
  }

  formatCurrency(amount: number): string {
    return '$' + amount.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
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

  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'ALTA': return 'var(--color-danger)';
      case 'NORMAL': return 'var(--color-warning)';
      case 'BAJA': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  }

  getTotalRepuestos(): number {
    return this.orden?.repuestos.reduce((sum, r) => sum + r.total, 0) ?? 0;
  }
}
