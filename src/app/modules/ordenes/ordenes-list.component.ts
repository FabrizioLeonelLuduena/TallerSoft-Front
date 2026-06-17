import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ordenes-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="ordenes-container">
      <div class="header">
        <h1>Órdenes de Trabajo</h1>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          Nueva Orden
        </button>
      </div>
      <div class="kanban-board">
        <div class="kanban-column" *ngFor="let status of statuses">
          <h3 class="column-title">{{ getStatusLabel(status) }}</h3>
          <mat-card class="orden-card" *ngFor="let orden of getOrdenesByStatus(status)">
            <mat-card-header>
              <mat-card-title>{{ orden.cliente }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="orden-id">Orden #{{ orden.id }}</p>
              <mat-chip-set>
                <mat-chip [class]="'priority-' + orden.prioridad.toLowerCase()">
                  {{ orden.prioridad }}
                </mat-chip>
              </mat-chip-set>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ordenes-container {
      h1 { font-size: 24px; font-weight: 700; color: #1e3c72; }
      .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
      .kanban-board {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }
      .column-title { font-size: 14px; font-weight: 600; color: #666; margin: 0 0 12px 0; }
      .orden-card { margin-bottom: 12px; cursor: pointer; transition: all 0.3s; }
      .orden-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); }
    }
    .priority-alta { background-color: #ffebee !important; color: #c62828 !important; }
    .priority-normal { background-color: #fff3e0 !important; color: #e65100 !important; }
    .priority-baja { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
  `]
})
export class OrdenesListComponent {
  statuses: Array<'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO'> = ['PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO'];
  ordenes = [
    { id: 1, cliente: 'Juan Pérez', estado: 'PENDIENTE', prioridad: 'ALTA' },
    { id: 2, cliente: 'María García', estado: 'EN_PROCESO', prioridad: 'NORMAL' },
    { id: 3, cliente: 'Carlos López', estado: 'LISTO', prioridad: 'BAJA' },
  ];
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      PENDIENTE: 'Pendiente', EN_PROCESO: 'En Proceso', LISTO: 'Listo', ENTREGADO: 'Entregado'
    };
    return labels[status] || status;
  }
  getOrdenesByStatus(status: string) {
    return this.ordenes.filter(o => o.estado === status);
  }
}
