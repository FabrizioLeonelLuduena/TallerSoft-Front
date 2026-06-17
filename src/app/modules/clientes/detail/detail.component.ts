import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClienteService, ClienteResponse } from '../services/cliente.service';
import { EquipoService, EquipoResponse } from '@modules/ordenes/services/equipo.service';
import { OrdenesService } from '@modules/ordenes/services/ordenes.service';
import { AuthService } from '@core/auth/auth.service';
import { ConfirmDialogComponent } from '@shared/dialogs/confirm-dialog.component';
import { DeleteConfirmModal } from '../modals/delete-confirm/delete-confirm.modal';
import { EditClienteModal } from '../modals/edit-cliente/edit-cliente.modal';
import { AddEquipoModal } from '../modals/add-equipo/add-equipo.modal';
import { EditEquipoModal } from '../modals/edit-equipo/edit-equipo.modal';
import { DeleteEquipoModal } from '../modals/delete-equipo/delete-equipo.modal';

@Component({
  selector: 'app-clientes-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatTabsModule,
    MatDialogModule,
    RouterModule,
    DeleteConfirmModal,
    EditClienteModal,
    AddEquipoModal,
    EditEquipoModal,
    DeleteEquipoModal
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clienteService = inject(ClienteService);
  private equipoService = inject(EquipoService);
  private ordenesService = inject(OrdenesService);
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  isLoading = false;
  isEditing = false;
  loadingEquipos = false;
  loadingOrdenes = false;
  activeTab: 'equipos' | 'historial' = 'equipos';
  isDeleteModalOpen = false;
  isEditModalOpen = false;
  isAddEquipoModalOpen = false;
  isEditEquipoModalOpen = false;
  isDeleteEquipoModalOpen = false;
  selectedEquipoForEdit: any = null;
  selectedEquipoForDelete: any = null;

  cliente: ClienteResponse | null = null;
  equipos: EquipoResponse[] = [];
  ordenes: any[] = [];

  constructor() {}

  get currentRole() {
    return this.authService.getCurrentRole();
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCliente(parseInt(id, 10));
    }
  }

  loadCliente(id: number) {
    this.isLoading = true;

    forkJoin({
      cliente: this.clienteService.obtenerCliente(id),
      equipos: this.equipoService.listarEquiposDelCliente(id)
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ cliente, equipos }) => {
        this.cliente = cliente;
        this.equipos = equipos;
        this.populateEditForm();
      },
      error: err => {
        this.notifications.error(err.error?.message || 'Error al cargar el cliente');
        this.router.navigate(['/clientes']);
      }
    });
  }

  populateEditForm() {
    if (this.cliente) {
      // This method is no longer needed with the modal
    }
  }

  onEdit() {
    this.isEditModalOpen = true;
  }

  onEditSaved(updatedCliente: ClienteResponse) {
    this.cliente = updatedCliente;
    this.isEditModalOpen = false;
  }

  onEditCancelled() {
    this.isEditModalOpen = false;
  }

  onDelete() {
    this.isDeleteModalOpen = true;
  }

  onDeleteConfirmed() {
    this.isDeleteModalOpen = false;
    this.router.navigate(['/clientes']);
  }

  onDeleteCancelled() {
    this.isDeleteModalOpen = false;
  }

  onReactivar() {
    if (!this.cliente) return;
    this.clienteService.reactivarCliente(this.cliente.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.success(`${this.cliente!.nombre} fue reactivado correctamente`);
          this.cliente = { ...this.cliente!, activo: true };
        },
        error: (err) => {
          this.notifications.error(err.error?.message || 'Error al reactivar el cliente');
        }
      });
  }

  getInitials(nombre: string | undefined): string {
    if (!nombre) return '';
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  setActiveTab(tab: 'equipos' | 'historial') {
    this.activeTab = tab;
    if (tab === 'historial' && this.cliente && this.ordenes.length === 0 && !this.loadingOrdenes) {
      this.loadOrdenes(this.cliente.id);
    }
  }

  loadOrdenes(clienteId: number) {
    this.loadingOrdenes = true;
    this.ordenesService.listarOrdenesPorCliente(clienteId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingOrdenes = false)
    ).subscribe({
      next: (ordenes) => {
        this.ordenes = ordenes;
      },
      error: (err) => {
        this.notifications.error(err.error?.message || 'Error al cargar el historial');
      }
    });
  }

  onAddEquipo() {
    this.isAddEquipoModalOpen = true;
  }

  onEquipoAdded() {
    this.isAddEquipoModalOpen = false;
    // Reload equipos list
    if (this.cliente) {
      this.loadingEquipos = true;
      this.equipoService.listarEquiposDelCliente(this.cliente.id).pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingEquipos = false)
      ).subscribe({
        next: (equipos) => {
          this.equipos = equipos;
        },
        error: (err) => {
          this.notifications.error(err.error?.message || 'Error al cargar equipos');
        }
      });
    }
  }

  onAddEquipoCancelled() {
    this.isAddEquipoModalOpen = false;
  }

  onEditEquipo(equipo: any) {
    this.selectedEquipoForEdit = equipo;
    this.isEditEquipoModalOpen = true;
  }

  onEquipoSaved(updatedEquipo: any) {
    this.isEditEquipoModalOpen = false;
    // Update equipo in list
    const index = this.equipos.findIndex(e => e.id === updatedEquipo.id);
    if (index !== -1) {
      this.equipos[index] = updatedEquipo;
    }
    this.selectedEquipoForEdit = null;
  }

  onEditEquipoCancelled() {
    this.isEditEquipoModalOpen = false;
    this.selectedEquipoForEdit = null;
  }

  onDeleteEquipo(equipo: any) {
    this.selectedEquipoForDelete = equipo;
    this.isDeleteEquipoModalOpen = true;
  }

  onDeleteEquipoConfirmed() {
    this.isDeleteEquipoModalOpen = false;
    // Remove equipo from list
    if (this.selectedEquipoForDelete) {
      this.equipos = this.equipos.filter(e => e.id !== this.selectedEquipoForDelete.id);
    }
    this.selectedEquipoForDelete = null;
  }

  onDeleteEquipoCancelled() {
    this.isDeleteEquipoModalOpen = false;
    this.selectedEquipoForDelete = null;
  }

  getEquipoIcon(tipo: string): string {
    const tipoLower = tipo?.toLowerCase() || '';
    if (tipoLower.includes('smartphone') || tipoLower.includes('celular')) return 'smartphone';
    if (tipoLower.includes('laptop') || tipoLower.includes('notebook')) return 'laptop_mac';
    if (tipoLower.includes('desktop') || tipoLower.includes('pc')) return 'computer';
    return 'devices';
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'pending';
      case 'EN_PROCESO': return 'progress';
      case 'LISTO': return 'completed';
      case 'ENTREGADO': return 'completed';
      default: return 'pending';
    }
  }

  formatCurrency(value: number | undefined): string {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  }
}

