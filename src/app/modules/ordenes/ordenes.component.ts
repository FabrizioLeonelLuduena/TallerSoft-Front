import { Component, OnInit, AfterViewInit, inject, DestroyRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../core/services/notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { Rol } from '@core/models/rol.enum';
import { OrdenesService, OrdenTrabajoResponse } from './services/ordenes.service';
import { KanbanComponent } from './kanban/kanban.component';
import { ListComponent } from './list/list.component';

@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    KanbanComponent,
    ListComponent
  ],
  templateUrl: './ordenes.component.html',
  styleUrls: ['./ordenes.component.scss']
})
export class OrdenesPrincipalComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private ordenesService = inject(OrdenesService);
  private notifications = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  @ViewChild('kanbanChild') kanbanChild!: KanbanComponent;
  @ViewChild('listaChild') listaChild!: ListComponent;

  viewMode: 'kanban' | 'lista' = 'kanban';
  isLoading = true;
  searchTerm = '';
  selectedTecnicoId: number | null = null;
  selectedPrioridad: string = '';
  selectedEstado: string = '';

  ordenes: OrdenTrabajoResponse[] = [];
  tecnicos: { id: number | null; nombre: string }[] = [];
  prioridades = ['BAJA', 'NORMAL', 'ALTA'];
  estados = ['PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO'];
  currentRole: string | null = '';
  get isTecnico(): boolean { return this.currentRole === Rol.TECNICO; }

  ngOnInit() {
    this.currentRole = this.authService.getCurrentRole();
    this.loadOrdenes();
  }

  ngAfterViewInit() {
    // Push data to children once view (and @ViewChild refs) are ready
    setTimeout(() => this.applyFilters(), 0);
  }

  private loadOrdenes() {
    this.isLoading = true;
    const loadObservable = this.currentRole === Rol.TECNICO
      ? this.ordenesService.listarMisOrdenes()
      : this.ordenesService.listarOrdenes();

    loadObservable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ordenes) => {
          this.ordenes = ordenes;
          this.extractTecnicos();
          this.isLoading = false;
          setTimeout(() => this.applyFilters(), 0);
        },
        error: (err) => {
          this.isLoading = false;
          this.notifications.error(err.error?.message || 'Error al cargar las órdenes');
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

  switchViewMode(mode: 'kanban' | 'lista') {
    this.viewMode = mode;
    if (mode === 'kanban') {
      this.selectedEstado = '';
    }
    // Wait for *ngIf to create the new child and update @ViewChild
    setTimeout(() => this.applyFilters(), 0);
  }

  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    // Normalize tecnicoId: native <select> coerces [value]="null" to the string "null"
    const rawTecnico = this.selectedTecnicoId;
    const tecnicoId = (rawTecnico === null || `${rawTecnico}` === 'null' || `${rawTecnico}` === '') ? null : rawTecnico;

    const filtered = this.ordenes.filter(orden => {
      // eslint-disable-next-line eqeqeq
      const tecnicoMatch = tecnicoId === null || orden.tecnicoId == tecnicoId;
      const prioridadMatch = !this.selectedPrioridad || orden.prioridad === this.selectedPrioridad;
      const estadoMatch = !this.selectedEstado || orden.estado === this.selectedEstado;
      const searchMatch = !term ||
        (orden.clienteNombre ?? '').toLowerCase().includes(term) ||
        orden.id.toString().includes(term) ||
        (orden.fallaReportada ?? '').toLowerCase().includes(term) ||
        (orden.tecnicoNombre ?? '').toLowerCase().includes(term);
      return tecnicoMatch && prioridadMatch && estadoMatch && searchMatch;
    });

    if (this.kanbanChild) {
      this.kanbanChild.setFilteredOrdenes(filtered);
    }
    if (this.listaChild) {
      this.listaChild.setFilteredOrdenes(filtered);
    }
  }

  navigateToCreate() {
    this.router.navigate(['/ordenes/nueva']);
  }

  canCreateOrden(): boolean {
    return this.currentRole === Rol.ADMIN || this.currentRole === Rol.RECEPCION;
  }

  formatEstado(estado: string): string {
    return estado.replace('_', ' ');
  }
}
