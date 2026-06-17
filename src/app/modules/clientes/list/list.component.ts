import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClienteService, ClienteResponse } from '../services/cliente.service';
import { AuthService } from '@core/auth/auth.service';
import { ConfirmDialogComponent } from '@shared/dialogs/confirm-dialog.component';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,

    MatDialogModule,
    RouterModule
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  searchTerm = '';
  isLoading = false;
  clientes: ClienteResponse[] = [];
  filteredClientes$ = new Subject<ClienteResponse[]>();
  private searchSubject = new Subject<string>();

  currentPage = 1;
  readonly pageSize = 12;

  get clientesActivos(): ClienteResponse[] {
    return this.clientes.filter(c => c.activo);
  }

  get clientesInactivos(): ClienteResponse[] {
    return this.clientes.filter(c => !c.activo);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.clientesActivos.length / this.pageSize));
  }

  get pagedClientes(): ClienteResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.clientesActivos.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    return this.clientesActivos.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.clientesActivos.length);
  }

  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  get currentRole() {
    return this.authService.getCurrentRole();
  }

  ngOnInit() {
    console.log('[ListComponent] ngOnInit() called');
    console.log('[ListComponent] currentRole:', this.currentRole);
    console.log('[ListComponent] isLoggedIn:', this.authService.isLoggedIn());
    
    // Wire search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        console.log('[ListComponent] Executing search query:', query);
        this.isLoading = true;
        return this.clienteService.listarClientes(query || undefined, true).pipe(
          finalize(() => {
            console.log('[ListComponent] Request finished, isLoading = false');
            this.isLoading = false;
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (clientes: ClienteResponse[]) => {
        console.log('[ListComponent] Clientes received:', clientes.length, clientes);
        this.clientes = clientes;
        this.currentPage = 1;
        this.filteredClientes$.next(clientes);
      },
      error: err => {
        console.error('[ListComponent] Error loading clientes:', err);
        this.notifications.error(err.error?.message || 'Error al cargar los clientes');
      }
    });

    // Trigger initial load
    console.log('[ListComponent] Triggering initial search');
    this.searchSubject.next('');
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  private triggerSearch(value: string) {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  navigateToClient(clienteId: string | number): void {
    this.router.navigate(['/clientes', clienteId]);
  }

  onDelete(clienteId: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar cliente',
        message: '¿Estás seguro de que deseas eliminar este cliente?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.clienteService.eliminarCliente(clienteId).pipe(
          finalize(() => this.isLoading = false),
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.notifications.success('Cliente eliminado correctamente');
            this.triggerSearch(this.searchTerm);
          },
          error: err => {
            this.notifications.error(err.error?.message || 'Error al eliminar el cliente');
          }
        });
      }
    });
  }

  onCreateClick(): void {
    this.router.navigate(['/clientes/nuevo']);
  }

  onFilterClick(): void {}
}

