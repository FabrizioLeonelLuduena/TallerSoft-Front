import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../core/services/notification.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { RepuestosService, Repuesto } from '../../ordenes/services/repuestos.service';
import { RepuestoDialogComponent } from '../dialogs/repuesto-dialog/repuesto-dialog.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';

type FilterState = 'todos' | 'criticos' | 'bajo' | 'inactivos';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    RepuestoDialogComponent
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class StockListComponent implements OnInit, OnDestroy {


  allRepuestos: Repuesto[] = [];
  filteredStock: Repuesto[] = [];
  loading = true;
  filterState: FilterState = 'todos';
  searchTerm = '';

  currentPage = 1;
  readonly pageSize = 10;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredStock.length / this.pageSize));
  }

  get pagedStock(): Repuesto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredStock.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    return this.filteredStock.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredStock.length);
  }

  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  showEditDialog = false;
  repuestoToEdit: Repuesto | null = null;

  @ViewChild('deleteRepuestoDialog') private deleteRepuestoDialog!: ElementRef<HTMLDialogElement>;
  repuestoToDelete: Repuesto | null = null;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private repuestosService: RepuestosService,
    private notifications: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  get currentRole(): string | null {
    return this.authService.getCurrentRole();
  }

  get canEdit(): boolean {
    return this.currentRole === 'ADMIN';
  }

  private get activeRepuestos(): Repuesto[] {
    return this.allRepuestos.filter(r => r.activo !== false);
  }

  onCreateClick(): void {
    this.router.navigate(['/stock/nuevo']);
  }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());

    this.cargarRepuestos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarRepuestos(): void {
    this.loading = true;
    this.repuestosService.listarRepuestos(undefined, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (repuestos) => {
          this.allRepuestos = repuestos;
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.notifications.error('Error al cargar repuestos');
          this.loading = false;
        }
      });
  }

  setFilter(state: FilterState): void {
    this.filterState = state;
    this.applyFilters();
  }

  filterStock(): void {
    this.searchSubject.next(this.searchTerm);
  }

  private applyFilters(): void {
    let base = this.allRepuestos;

    if (this.filterState === 'inactivos') {
      base = base.filter(r => r.activo === false);
    } else {
      base = base.filter(r => r.activo !== false);
      if (this.filterState === 'criticos') {
        base = base.filter(r => r.critico);
      } else if (this.filterState === 'bajo') {
        base = base.filter(r => r.bajo);
      }
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      base = base.filter(r =>
        r.nombre.toLowerCase().includes(term) ||
        (r.categoria?.toLowerCase().includes(term) ?? false)
      );
    }

    this.filteredStock = base;
    this.currentPage = 1;
  }

  editarRepuesto(repuesto: Repuesto): void {
    this.repuestoToEdit = repuesto;
    this.showEditDialog = true;
  }

  onDialogClosed(saved: boolean): void {
    this.showEditDialog = false;
    this.repuestoToEdit = null;
    if (saved) this.cargarRepuestos();
  }

  eliminarRepuesto(repuesto: Repuesto): void {
    this.repuestoToDelete = repuesto;
    this.deleteRepuestoDialog.nativeElement.showModal();
  }

  confirmDeleteRepuesto(): void {
    if (!this.repuestoToDelete) return;
    this.repuestosService.eliminarRepuesto(this.repuestoToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Repuesto dado de baja correctamente');
          this.cancelDeleteRepuesto();
          this.cargarRepuestos();
        },
        error: (err) => {
          this.notifications.error(err.error?.message || 'Error al eliminar el repuesto');
        }
      });
  }

  cancelDeleteRepuesto(): void {
    if (this.deleteRepuestoDialog.nativeElement.open) {
      this.deleteRepuestoDialog.nativeElement.close();
    }
    this.repuestoToDelete = null;
  }

  reactivarRepuesto(repuesto: Repuesto): void {
    this.repuestosService.reactivarRepuesto(repuesto.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success(`${repuesto.nombre} fue reactivado correctamente`);
          this.cargarRepuestos();
        },
        error: (err) => {
          this.notifications.error(err.error?.message || 'Error al reactivar el repuesto');
        }
      });
  }

  // ---- Stats helpers (active only) ----

  getTotalRepuestos(): number {
    return this.activeRepuestos.length;
  }

  getCriticosCount(): number {
    return this.activeRepuestos.filter(r => r.critico).length;
  }

  getBajoStockCount(): number {
    return this.activeRepuestos.filter(r => r.bajo).length;
  }

  getDisponiblesCount(): number {
    return this.activeRepuestos.filter(r => !r.critico && !r.bajo).length;
  }

  // ---- Display helpers ----

  getStockPercentage(repuesto: Repuesto): number {
    const ref = repuesto.stockBajo || repuesto.stockMinimo * 2 || 1;
    const ratio = repuesto.stockActual / ref;
    return Math.min(Math.round(ratio * 100), 100);
  }

  getEstadoClass(repuesto: Repuesto): string {
    if (repuesto.activo === false) return 'inactivo';
    if (repuesto.critico) return 'critico';
    if (repuesto.bajo) return 'bajo';
    return 'disponible';
  }

  getEstadoLabel(repuesto: Repuesto): string {
    if (repuesto.activo === false) return 'INACTIVO';
    if (repuesto.critico) return 'CRÍTICO';
    if (repuesto.bajo) return 'BAJO';
    return 'OK';
  }
}
