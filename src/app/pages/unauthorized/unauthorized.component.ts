import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 text-center">
      <h1>Acceso Denegado</h1>
      <p>No tienes permisos para acceder a esta página.</p>
      <a routerLink="/dashboard" class="mt-2">Volver al Dashboard</a>
    </div>
  `,
})
export class UnauthorizedComponent {}
