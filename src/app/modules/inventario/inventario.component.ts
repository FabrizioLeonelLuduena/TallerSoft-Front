import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="inventario-container">
      <div class="header">
        <h1>Inventario de Repuestos</h1>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          Nuevo Repuesto
        </button>
      </div>
      <mat-card class="inventory-card">
        <p>Gestión de repuestos próximamente</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .inventario-container {
      h1 { font-size: 24px; font-weight: 700; color: #1e3c72; }
      .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
      .inventory-card { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
    }
  `]
})
export class InventarioComponent {}
