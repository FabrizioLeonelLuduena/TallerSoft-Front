import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="reportes-container">
      <h1>Reportes y Análisis</h1>
      <p class="subtitle">Genera reportes detallados del taller</p>
      <div class="reports-grid">
        <mat-card class="report-card">
          <mat-card-header>
            <mat-icon class="report-icon orders">assignment</mat-icon>
            <mat-card-title>Órdenes de Trabajo</mat-card-title>
          </mat-card-header>
          <mat-card-content>Análisis de órdenes completadas, en progreso y pendientes</mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary">Ver Reporte</button>
          </mat-card-actions>
        </mat-card>
        <mat-card class="report-card">
          <mat-card-header>
            <mat-icon class="report-icon revenue">trending_up</mat-icon>
            <mat-card-title>Ingresos</mat-card-title>
          </mat-card-header>
          <mat-card-content>Resumen de ingresos por período y método de pago</mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary">Ver Reporte</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .reportes-container {
      h1 { font-size: 24px; font-weight: 700; color: #1e3c72; }
      .subtitle { color: #666; margin: 0 0 24px 0; }
      .reports-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
      .report-card { transition: all 0.3s; cursor: pointer; }
      .report-card:hover { box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12); transform: translateY(-4px); }
      .report-icon { background-color: #2196f3; color: white; border-radius: 50%; }
    }
  `]
})
export class ReportesComponent {}
